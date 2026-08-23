use serde::Serialize;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct NativeAudioConfigRange {
    channels: u16,
    min_sample_rate: u32,
    max_sample_rate: u32,
    min_buffer_frames: Option<u32>,
    max_buffer_frames: Option<u32>,
    sample_format: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct NativePreferredAudioConfig {
    channels: u16,
    sample_rate: u32,
    min_buffer_frames: Option<u32>,
    max_buffer_frames: Option<u32>,
    sample_format: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct NativeAudioDevice {
    id: String,
    name: String,
    host: String,
    direction: &'static str,
    is_default: bool,
    capability_status: &'static str,
    capability_message: Option<String>,
    supported_configs: Vec<NativeAudioConfigRange>,
    preferred_config: Option<NativePreferredAudioConfig>,
    selectable_by_native_engine: bool,
    latency_status: &'static str,
    latency_ms: Option<f64>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct NativeMidiPort {
    id: String,
    name: String,
    direction: &'static str,
    capability_status: &'static str,
    capability_message: Option<String>,
    selectable_by_native_engine: bool,
}

#[derive(Serialize)]
struct NativeEngineBoundary {
    status: &'static str,
    message: &'static str,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NativeStudioDeviceInventory {
    schema_version: u8,
    platform: &'static str,
    supported: bool,
    scanned_at_epoch_ms: u128,
    audio_hosts: Vec<String>,
    audio_inputs: Vec<NativeAudioDevice>,
    audio_outputs: Vec<NativeAudioDevice>,
    midi_inputs: Vec<NativeMidiPort>,
    midi_outputs: Vec<NativeMidiPort>,
    engine: NativeEngineBoundary,
    warnings: Vec<String>,
}

fn scan_time_ms() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis())
        .unwrap_or(0)
}

#[cfg(any(target_os = "windows", target_os = "macos", target_os = "linux"))]
mod desktop {
    use super::*;
    use cpal::traits::{DeviceTrait, HostTrait};
    use cpal::{SupportedBufferSize, SupportedStreamConfig, SupportedStreamConfigRange};
    use midir::{MidiInput, MidiOutput};

    fn buffer_range(buffer: &SupportedBufferSize) -> (Option<u32>, Option<u32>) {
        match buffer {
            SupportedBufferSize::Range { min, max } => (Some(*min), Some(*max)),
            SupportedBufferSize::Unknown => (None, None),
        }
    }

    fn config_range(config: SupportedStreamConfigRange) -> NativeAudioConfigRange {
        let (min_buffer_frames, max_buffer_frames) = buffer_range(config.buffer_size());
        NativeAudioConfigRange {
            channels: config.channels(),
            min_sample_rate: config.min_sample_rate(),
            max_sample_rate: config.max_sample_rate(),
            min_buffer_frames,
            max_buffer_frames,
            sample_format: format!("{:?}", config.sample_format()),
        }
    }

    fn preferred_config(config: SupportedStreamConfig) -> NativePreferredAudioConfig {
        let (min_buffer_frames, max_buffer_frames) = buffer_range(config.buffer_size());
        NativePreferredAudioConfig {
            channels: config.channels(),
            sample_rate: config.sample_rate(),
            min_buffer_frames,
            max_buffer_frames,
            sample_format: format!("{:?}", config.sample_format()),
        }
    }

    fn audio_device(
        device: cpal::Device,
        host: &str,
        direction: &'static str,
        is_default: bool,
    ) -> NativeAudioDevice {
        let id = device
            .id()
            .map(|value| format!("{:?}", value))
            .unwrap_or_else(|_| format!("{}:{}", direction, device));
        let configs = if direction == "input" {
            device
                .supported_input_configs()
                .map(|items| items.map(config_range).collect::<Vec<_>>())
        } else {
            device
                .supported_output_configs()
                .map(|items| items.map(config_range).collect::<Vec<_>>())
        };
        let preferred = if direction == "input" {
            device.default_input_config()
        } else {
            device.default_output_config()
        };
        let (supported_configs, capability_status, capability_message) = match configs {
            Ok(configs) => (configs, "detected", None),
            Err(error) => (
                Vec::new(),
                "probe_error",
                Some(format!("Supported configurations could not be read: {error}")),
            ),
        };

        let preferred_config_value = preferred.ok().map(preferred_config);
        // Heuristic: if the device has a preferred config and supports small buffer
        // sizes (<= 256 frames) mark it selectable by the native engine. This is a
        // conservative heuristic - users will still opt-in in Studio Setup.
        let selectable_by_native_engine = preferred_config_value.as_ref().map(|pc| {
            match (pc.min_buffer_frames, pc.max_buffer_frames) {
                (Some(min), Some(max)) => (min <= 256) || (max <= 256),
                (Some(min), None) => min <= 256,
                (None, Some(max)) => max <= 256,
                _ => false,
            }
        }).unwrap_or(false);

        let (latency_status, latency_ms) = match preferred_config_value.as_ref() {
            Some(pc) => {
                if let Some(min_frames) = pc.min_buffer_frames {
                    // estimate latency using minimum buffer frames and sample rate
                    let latency = (min_frames as f64 / pc.sample_rate as f64) * 1000.0;
                    ("estimated", Some(latency))
                } else {
                    ("not_measured", None)
                }
            }
            None => ("not_measured", None),
        };

        NativeAudioDevice {
            id: format!("{host}:{direction}:{id}"),
            name: device.to_string(),
            host: host.to_string(),
            direction,
            is_default,
            capability_status,
            capability_message,
            supported_configs,
            preferred_config: preferred_config_value,
            selectable_by_native_engine,
            latency_status,
            latency_ms,
        }
    }

    fn scan_audio(
        warnings: &mut Vec<String>,
    ) -> (Vec<String>, Vec<NativeAudioDevice>, Vec<NativeAudioDevice>) {
        let mut hosts = Vec::new();
        let mut inputs = Vec::new();
        let mut outputs = Vec::new();

        for host_id in cpal::available_hosts() {
            let host_name = host_id.to_string();
            hosts.push(host_name.clone());
            let host = match cpal::host_from_id(host_id) {
                Ok(host) => host,
                Err(error) => {
                    warnings.push(format!("Audio host {host_name} could not start: {error}"));
                    continue;
                }
            };
            let default_input = host.default_input_device();
            let default_output = host.default_output_device();

            match host.input_devices() {
                Ok(devices) => {
                    for device in devices {
                        let is_default = default_input
                            .as_ref()
                            .is_some_and(|candidate| candidate == &device);
                        inputs.push(audio_device(device, &host_name, "input", is_default));
                    }
                }
                Err(error) => warnings.push(format!(
                    "Audio inputs for host {host_name} could not be enumerated: {error}"
                )),
            }

            match host.output_devices() {
                Ok(devices) => {
                    for device in devices {
                        let is_default = default_output
                            .as_ref()
                            .is_some_and(|candidate| candidate == &device);
                        outputs.push(audio_device(device, &host_name, "output", is_default));
                    }
                }
                Err(error) => warnings.push(format!(
                    "Audio outputs for host {host_name} could not be enumerated: {error}"
                )),
            }
        }

        (hosts, inputs, outputs)
    }

    fn scan_midi(warnings: &mut Vec<String>) -> (Vec<NativeMidiPort>, Vec<NativeMidiPort>) {
        let mut inputs = Vec::new();
        let mut outputs = Vec::new();

        match MidiInput::new("Poietek Studio device inventory") {
            Ok(midi_input) => {
                for port in midi_input.ports() {
                    let name = midi_input.port_name(&port);
                    let (name, capability_status, capability_message) = match name {
                        Ok(name) => (name, "detected", None),
                        Err(error) => (
                            "Unavailable MIDI input".to_string(),
                            "probe_error",
                            Some(error.to_string()),
                        ),
                    };
                    inputs.push(NativeMidiPort {
                        id: port.id().to_string(),
                        name,
                        direction: "input",
                        capability_status,
                        capability_message,
                        selectable_by_native_engine: false,
                    });
                }
            }
            Err(error) => warnings.push(format!("MIDI input inventory is unavailable: {error}")),
        }

        match MidiOutput::new("Poietek Studio device inventory") {
            Ok(midi_output) => {
                for port in midi_output.ports() {
                    let name = midi_output.port_name(&port);
                    let (name, capability_status, capability_message) = match name {
                        Ok(name) => (name, "detected", None),
                        Err(error) => (
                            "Unavailable MIDI output".to_string(),
                            "probe_error",
                            Some(error.to_string()),
                        ),
                    };
                    outputs.push(NativeMidiPort {
                        id: port.id().to_string(),
                        name,
                        direction: "output",
                        capability_status,
                        capability_message,
                        selectable_by_native_engine: false,
                    });
                }
            }
            Err(error) => warnings.push(format!("MIDI output inventory is unavailable: {error}")),
        }

        (inputs, outputs)
    }

    pub fn inventory() -> NativeStudioDeviceInventory {
        let mut warnings = Vec::new();
        let (audio_hosts, audio_inputs, audio_outputs) = scan_audio(&mut warnings);
        let (midi_inputs, midi_outputs) = scan_midi(&mut warnings);
        NativeStudioDeviceInventory {
            schema_version: 1,
            platform: std::env::consts::OS,
            supported: true,
            scanned_at_epoch_ms: scan_time_ms(),
            audio_hosts,
            audio_inputs,
            audio_outputs,
            midi_inputs,
            midi_outputs,
            engine: NativeEngineBoundary {
                status: "inventory_only",
                message: "Native endpoints are detected, but no native stream, MIDI connection, driver buffer, or latency measurement is claimed.",
            },
            warnings,
        }
    }
}

#[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
fn inventory() -> NativeStudioDeviceInventory {
    NativeStudioDeviceInventory {
        schema_version: 1,
        platform: std::env::consts::OS,
        supported: false,
        scanned_at_epoch_ms: scan_time_ms(),
        audio_hosts: Vec::new(),
        audio_inputs: Vec::new(),
        audio_outputs: Vec::new(),
        midi_inputs: Vec::new(),
        midi_outputs: Vec::new(),
        engine: NativeEngineBoundary {
            status: "inventory_only",
            message: "This mobile shell does not yet provide a reviewed native audio or MIDI inventory adapter.",
        },
        warnings: vec!["Use the platform permission and device adapters planned for the mobile engine slice.".to_string()],
    }
}

#[cfg(any(target_os = "windows", target_os = "macos", target_os = "linux"))]
fn inventory() -> NativeStudioDeviceInventory {
    desktop::inventory()
}

use serde_json::json;
use std::time::Instant;

#[tauri::command]
pub fn list_native_studio_devices() -> NativeStudioDeviceInventory {
    inventory()
}

#[tauri::command]
pub fn warm_native_engine(preferred_sample_rate: Option<u32>, preferred_buffer_frames: Option<u32>) -> Result<serde_json::Value, String> {
    // Best-effort warm start that performs lightweight CPU/memory warm-up using
    // the default output device's preferred configuration and returns diagnostics.
    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    {
        return Err("Warm engine is unsupported on this platform".to_string());
    }

    #[cfg(any(target_os = "windows", target_os = "macos", target_os = "linux"))]
    {
        use cpal::traits::{DeviceTrait, HostTrait};

        let host = cpal::default_host();
        let device = host.default_output_device().ok_or_else(|| "No default output device available".to_string())?;
        let default_config = device.default_output_config().map_err(|e| format!("Could not read default output config: {e}"))?;
        let channels = default_config.channels();
        let device_sample_rate = default_config.sample_rate().0;
        let device_buffer_frames = match default_config.buffer_size() {
            cpal::SupportedBufferSize::Range { min, max } => Some(min),
            cpal::SupportedBufferSize::Unknown => None,
        };

        let sample_rate = preferred_sample_rate.unwrap_or(device_sample_rate);
        let buffer_frames = preferred_buffer_frames.or(device_buffer_frames).unwrap_or(256);

        let estimated_latency_ms = (buffer_frames as f64 / sample_rate as f64) * 1000.0;

        // Allocate working buffers and run a simple processing loop to warm CPU/cache.
        let frames = buffer_frames as usize;
        let channels_usize = channels as usize;
        let size = frames * channels_usize;
        let mut input = vec![0.0f32; size];
        let mut output = vec![0.0f32; size];

        // fill input with a simple waveform
        for i in 0..frames {
            let v = (i as f32 * 2.0 * 3.14159265f32 / 441.0f32).sin() * 0.25f32;
            for c in 0..channels_usize {
                input[i * channels_usize + c] = v;
            }
        }

        let iterations = 40;
        let start = Instant::now();
        let mut processed_samples: usize = 0;
        for _ in 0..iterations {
            // simple gain processing to exercise CPU/memory; this imitates a DSP pass
            for i in 0..size {
                // simple sanitize and gain
                let s = input[i];
                let s = if s.is_finite() { s } else { 0.0 };
                let p = s * 1.0f32;
                output[i] = p;
            }
            processed_samples += size;
        }
        let dur_ms = (Instant::now() - start).as_millis();
        let ms_per_iter = dur_ms as f64 / iterations as f64;
        let samples_per_sec = (processed_samples as f64 / dur_ms as f64) * 1000.0;

        let device_name = device.name().unwrap_or_else(|_| "Unknown device".to_string());
        Ok(json!({
            "selected_device": device_name,
            "channels": channels,
            "sample_rate": sample_rate,
            "buffer_frames": buffer_frames,
            "estimated_latency_ms": estimated_latency_ms,
            "bench": {
                "iterations": iterations,
                "total_ms": dur_ms,
                "ms_per_iter": ms_per_iter,
                "samples_per_sec": samples_per_sec
            }
        }))
    }
}
