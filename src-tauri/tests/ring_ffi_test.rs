#[cfg(feature = "ring-ffi")]
#[test]
fn ring_ffi_roundtrip() {
    // This test is gated behind the `ring-ffi` feature because linking the
    // native static library depends on having the native-core built and
    // available to the Rust build system (via build.rs/CMake). CI should run
    // with the feature enabled on runners that provide CMake and a C++ toolchain.
    assert!(poietek_lib::ring_bindings::test_ring_ffi());
}
