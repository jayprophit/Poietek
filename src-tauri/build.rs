fn main() {
    // Build native-core using CMake and link the produced static library into the Rust build.
    // This is best-effort and non-fatal for developer machines where CMake is not present.
    if let Ok(dst) = (|| -> Result<std::path::PathBuf, Box<dyn std::error::Error>> {
        let mut config = cmake::Config::new("../native-core");
        config.define("CMAKE_BUILD_TYPE", "Release");
        config.define("CMAKE_MSVC_RUNTIME_LIBRARY", "MultiThreadedDLL");
        let dst = config.build();
        Ok(dst)
    })() {
        println!("cargo:rustc-link-search=native={}/lib", dst.display());
        println!("cargo:rustc-link-search=native={}", dst.display());
        println!("cargo:rustc-link-lib=static=poietek_native_core");
    }

    tauri_build::build();
}
