fn main() {
    // Build native-core using CMake and link the produced static library into the Rust build.
    // This is best-effort and non-fatal for developer machines where CMake is not present.
    if let Ok(dst) = (|| {
        let dst = cmake::Config::new("../native-core").build();
        Ok(dst)
    })() {
        println!("cargo:rustc-link-search=native={}/lib", dst.display());
        println!("cargo:rustc-link-search=native={}", dst.display());
        println!("cargo:rustc-link-lib=static=poietek_native_core");
    }

    tauri_build::build();
}
