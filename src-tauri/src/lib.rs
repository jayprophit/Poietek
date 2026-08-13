#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // This first shell intentionally exposes no custom commands or plugins.
    // Native storage, devices and media processing require reviewed adapters
    // plus explicitly scoped Tauri capabilities before they are added here.
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running Poietek Studio");
}
