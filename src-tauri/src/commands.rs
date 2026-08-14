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

        NativeAudioDevice {
            id: format!("{host}:{direction}:{id}"),
            name: device.to_string(),
            host: host.to_string(),
            direction,
            is_default,
            capability_status,
            capability_message,
            supported_configs,
            preferred_config: preferred.ok().map(preferred_config),
            selectable_by_native_engine: false,
            latency_status: "not_measured",
            latency_ms: None,
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

#[tauri::command]
pub fn list_native_studio_devices() -> NativeStudioDeviceInventory {
    inventory()
}
