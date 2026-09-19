use serde::Serialize;

#[derive(Serialize)]
struct PlatformInfo {
    installed_app: bool,
    native_shell: &'static str,
}

#[tauri::command]
fn platform_info() -> PlatformInfo {
    PlatformInfo {
        installed_app: true,
        native_shell: "tauri",
    }
}

#[tauri::command]
fn ping_native_core(value: String) -> String {
    format!("poietek-native:{value}")
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            platform_info,
            ping_native_core
        ])
        .run(tauri::generate_context!())
        .expect("error while running Poietek Studio");
}
