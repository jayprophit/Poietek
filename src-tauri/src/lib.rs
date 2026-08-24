mod commands;

#[cfg(feature = "priority")]
fn try_raise_process_priority() {
    // Best-effort: raise current thread/process priority on supported platforms
    // to reduce audio/glitch risk on desktop systems. This is intentionally
    // non-fatal: if the crate or syscall is unavailable the function returns.
    if let Err(_) = (|| {
        use thread_priority::{set_current_thread_priority, ThreadPriority};
        // Try to set the highest available priority for the current thread
        set_current_thread_priority(ThreadPriority::Max)?;
        Ok(())
    })() {
        // ignore failures
    }
}

#[cfg(not(feature = "priority"))]
fn try_raise_process_priority() {}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Best-effort priority escalation for native shells
    try_raise_process_priority();

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::list_native_studio_devices,
            commands::warm_native_engine,
            commands::run_ring_ffi_test
        ])
        .run(tauri::generate_context!())
        .expect("error while running Poietek Studio");
}

// Optional ring-ffi bindings module (feature-gated)
#[cfg(feature = "ring-ffi")]
pub mod ring_bindings;
