# Poietek native core

This directory contains the portable C++20 real-time/DSP kernel. It is not a
second project model or UI framework. Rust/Tauri, browser and future mobile hosts
call it through the versioned C ABI in `include/poietek/poietek_dsp.h`.

The initial slice implements deterministic interleaved float gain/pan processing
and honest peak/clipping telemetry. The processing call performs no allocation,
I/O, locking, logging or exception propagation. It does not claim device I/O,
LUFS, true peak, pitch correction, plug-in hosting or render parity.

Build with CMake 3.24 or later and a C++20 compiler:

```text
cmake -S native-core -B native-core/build -DPOIETEK_NATIVE_CORE_BUILD_TESTS=ON
cmake --build native-core/build --config Release
ctest --test-dir native-core/build -C Release --output-on-failure
```

Generated `native-core/build` content is ignored. Platform integration must pin
the ABI version, validate every buffer/configuration and retain the TypeScript
capability boundary's unavailable states until a real native callback supplies
evidence.
