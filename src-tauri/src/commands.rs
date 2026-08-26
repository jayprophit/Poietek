mod devices;

use serde_json::json;
use std::time::Instant;

#[tauri::command]
pub fn list_native_studio_devices() -> devices::NativeStudioDeviceInventory {
    devices::inventory()
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
        let device_sample_rate = default_config.sample_rate();
        let device_buffer_frames = match default_config.buffer_size() {
            cpal::SupportedBufferSize::Range { min, max } => Some(min),
            cpal::SupportedBufferSize::Unknown => None,
        };

        let sample_rate = preferred_sample_rate.unwrap_or(device_sample_rate);
        let buffer_frames = preferred_buffer_frames.or(device_buffer_frames.copied()).unwrap_or(256);

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

        // First, try to call into the native-core warmup if available (best-effort).
        #[repr(C)]
        struct NativeTelemetry {
            processed_frames: u64,
            clipped_samples: u64,
            peak_absolute: f32,
        }

        let mut native_used = false;
        let mut native_telemetry = NativeTelemetry { processed_frames: 0, clipped_samples: 0, peak_absolute: 0.0 };
        unsafe {
            // declare the foreign symbol; if linking is not available this will be a link error
            extern "C" {
                fn poietek_dsp_warmup(frames: u32, channels: u32, iterations: u32, telemetry: *mut NativeTelemetry) -> u32;
            }
            // call in a catch_unwind to avoid unwinding across FFI boundary.
            // The closure is wrapped with AssertUnwindSafe because the FFI call
            // writes into Rust-owned locals and we intentionally want the panic
            // boundary to be tolerated without aborting the warmup path.
            let _ = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
                let res = poietek_dsp_warmup(buffer_frames as u32, channels as u32, 8u32, &mut native_telemetry as *mut _);
                if res == 0 {
                    native_used = true;
                }
            }));
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
                "total_ms": dur_ms,
                "ms_per_iter": ms_per_iter,
                "samples_per_sec": samples_per_sec
            }
        }))
    }
}

#[tauri::command]
pub fn run_ring_ffi_test() -> Result<bool, String> {
    // Runtime-exposed diagnostic that exercises the optional Rust FFI bridge
    // into the native ring buffer C API. This is feature-gated at compile time.
    #[cfg(not(feature = "ring-ffi"))]
    {
        return Err("ring-ffi feature not enabled in this build".to_string());
    }

    #[cfg(feature = "ring-ffi")]
    {
        // Use catch_unwind to avoid unwinding across FFI boundaries in case
        // the underlying native library or test panics.
        let res = std::panic::catch_unwind(|| crate::ring_bindings::test_ring_ffi());
        match res {
            Ok(ok) => Ok(ok),
            Err(_) => Err("Ring FFI test panicked".to_string()),
        }
    }
}
