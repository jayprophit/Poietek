#[cfg(any(target_os = "windows", target_os = "macos", target_os = "linux"))]
use serde_json::json;

#[cfg(any(target_os = "windows", target_os = "macos", target_os = "linux"))]
use std::time::Instant;

pub(super) fn warm_native_engine(
    preferred_sample_rate: Option<u32>,
    preferred_buffer_frames: Option<u32>,
) -> Result<serde_json::Value, String> {
    // Best-effort warm start that performs lightweight CPU/memory warm-up using
    // the default output device's preferred configuration and returns diagnostics.
    #[cfg(not(any(
        target_os = "windows",
        target_os = "macos",
        target_os = "linux"
    )))]
    {
        return Err("Warm engine is unsupported on this platform".to_string());
    }

    #[cfg(any(
        target_os = "windows",
        target_os = "macos",
        target_os = "linux"
    ))]
    {
        use cpal::traits::{DeviceTrait, HostTrait};

        let host = cpal::default_host();

        let device = host
            .default_output_device()
            .ok_or_else(|| "No default output device available".to_string())?;

        let default_config = device
            .default_output_config()
            .map_err(|error| format!("Could not read default output config: {error}"))?;

        let channels = default_config.channels();
        let device_sample_rate = default_config.sample_rate();

        let device_buffer_frames = match default_config.buffer_size() {
            cpal::SupportedBufferSize::Range { min, .. } => Some(min),
            cpal::SupportedBufferSize::Unknown => None,
        };

        let sample_rate =
            preferred_sample_rate.unwrap_or(device_sample_rate);

        let buffer_frames = preferred_buffer_frames
            .or(device_buffer_frames.copied())
            .unwrap_or(256);

        let estimated_latency_ms =
            (buffer_frames as f64 / sample_rate as f64) * 1000.0;

        // Allocate working buffers and run a simple processing loop to warm CPU/cache.
        let frames = buffer_frames as usize;
        let channels_usize = channels as usize;
        let size = frames * channels_usize;

        let mut input = vec![0.0f32; size];
        let mut output = vec![0.0f32; size];

        // Fill input with a simple waveform.
        for i in 0..frames {
            let value =
                (i as f32 * 2.0 * 3.14159265f32 / 441.0f32).sin()
                    * 0.25f32;

            for channel in 0..channels_usize {
                input[i * channels_usize + channel] = value;
            }
        }

        // First, try to call into the native-core warmup if available.
        #[repr(C)]
        struct NativeTelemetry {
            processed_frames: u64,
            clipped_samples: u64,
            peak_absolute: f32,
        }

        let mut native_used = false;

        let mut native_telemetry = NativeTelemetry {
            processed_frames: 0,
            clipped_samples: 0,
            peak_absolute: 0.0,
        };

        unsafe {
            extern "C" {
                fn poietek_dsp_warmup(
                    frames: u32,
                    channels: u32,
                    iterations: u32,
                    telemetry: *mut NativeTelemetry,
                ) -> u32;
            }

            let _ = std::panic::catch_unwind(
                std::panic::AssertUnwindSafe(|| {
                    let result = poietek_dsp_warmup(
                        buffer_frames,
                        channels as u32,
                        8,
                        &mut native_telemetry as *mut _,
                    );

                    if result == 0 {
                        native_used = true;
                    }
                }),
            );
        }

        if native_used {
            let device_name = device.to_string();

            return Ok(json!({
                "selected_device": device_name,
                "channels": channels,
                "sample_rate": sample_rate,
                "buffer_frames": buffer_frames,
                "estimated_latency_ms": estimated_latency_ms,
                "native_warm": true,
                "native_telemetry": {
                    "processed_frames": native_telemetry.processed_frames,
                    "clipped_samples": native_telemetry.clipped_samples,
                    "peak_absolute": native_telemetry.peak_absolute
                }
            }));
        }

        let iterations = 40;
        let start = Instant::now();
        let mut processed_samples: usize = 0;

        for _ in 0..iterations {
            // Simple gain processing to exercise CPU/memory.
            for i in 0..size {
                let sample = input[i];

                let sample = if sample.is_finite() {
                    sample
                } else {
                    0.0
                };

                output[i] = sample;
            }

            processed_samples += size;
        }

        let duration_ms = (Instant::now() - start).as_millis();

        let ms_per_iteration =
            duration_ms as f64 / iterations as f64;

        let samples_per_second =
            (processed_samples as f64 / duration_ms as f64) * 1000.0;

        let device_name = device.to_string();

        Ok(json!({
            "selected_device": device_name,
            "channels": channels,
            "sample_rate": sample_rate,
            "buffer_frames": buffer_frames,
            "estimated_latency_ms": estimated_latency_ms,
            "native_warm": false,
            "bench": {
                "iterations": iterations,
                "total_ms": duration_ms,
                "ms_per_iter": ms_per_iteration,
                "samples_per_sec": samples_per_second
            }
        }))
    }
}
