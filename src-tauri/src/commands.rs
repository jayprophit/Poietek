mod devices;
mod engine;

#[tauri::command]
pub fn list_native_studio_devices() -> devices::NativeStudioDeviceInventory {
    devices::inventory()
}

#[tauri::command]
pub fn warm_native_engine(
    preferred_sample_rate: Option<u32>,
    preferred_buffer_frames: Option<u32>,
) -> Result<serde_json::Value, String> {
    engine::warm_native_engine(
        preferred_sample_rate,
        preferred_buffer_frames,
    )
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
        let result =
            std::panic::catch_unwind(|| crate::ring_bindings::test_ring_ffi());

        match result {
            Ok(ok) => Ok(ok),
            Err(_) => Err("Ring FFI test panicked".to_string()),
        }
    }
}
