Poietek Studio — Native DSP Core Migration Plan

Goal
- Provide a practical plan to evolve the existing native-core into a production-ready, high-performance C++ DSP core suitable for cross-platform desktop/mobile and integration with the Tauri/Rust shell and React UI.

Approach summary
1. Preserve the current hybrid (Rust + C++) stack and incrementally harden the native-core. This minimizes risk while improving performance.
2. Introduce a well-defined C API boundary for the DSP core so it can be called from Rust, other languages, or the web (via native bridges).
3. Use modern C++ (C++20) with a focus on real-time safe coding practices:
   - Avoid heap allocations in audio processing paths
   - Use lock-free ring buffers for audio I/O between threads
   - Use SIMD for vectorized processing where beneficial
   - Unit-test DSP algorithms with deterministic inputs
4. Provide a migration path to JUCE if plugin hosting or extensive audio plugin formats (VST3/AU) are required in future.

Phased roadmap (6–12 months estimate)
Phase 0 — Stabilize (1–2 weeks)
- Add comprehensive unit tests for existing native-core (already present) and increase coverage.
- Add CI tests and perf benchmarks.
- Define ABI and header file (poietek_dsp.h) as the stable interface.

Phase 1 — Real-time hardening (2–4 weeks)
- Audit existing code for heap usage and thread-safety.
- Implement lock-free audio buffers and replace any blocking calls in audio threads.
- Add instrumentation for frame timing, CPU usage, and memory allocations.

Phase 2 — Performance and SIMD (2–4 weeks)
- Profile critical DSP paths and implement SIMD (SSE/AVX/NEON) where meaningful.
- Provide portable wrappers (e.g., use xsimd or hand-written intrinsics with fallbacks).

Phase 3 — Integration and testing (2–4 weeks)
- Improve integration tests: native audio endpoints, MIDI routing, and end-to-end rendering tests.
- Add deterministic offline render tests to validate correctness.

Phase 4 — Optional JUCE migration (4–12 weeks if chosen)
- Create a JUCE-based wrapper for plugin hosting and GUI-native plugins.
- Maintain C API shim to run JUCE engine without forcing UI changes.

Interfacing with Tauri / Rust
- Use the C API from Rust via bindgen or hand-written FFI wrappers.
- Expose control endpoints via IPC from the Tauri shell to the native core.
- Keep audio processing strictly in native-core threads; control messages pass via bounded queues.

Deliverables
- poietek_dsp.h: stable C ABI header for public surface
- native-core test suite (ctest) with deterministic signal tests
- Benchmark harness and CI performance artifact upload
- Migration evaluation report for JUCE with cost/benefit

Risks and mitigations
- Real-time bugs: mitigate with extensive unit tests and CI. Use sanitizer builds (AddressSanitizer) only for non-real-time tests.
- Platform-specific packaging and signing: automate via CI and require secrets for signing.

Next immediate engineering tasks (I will implement next):
1. Add a short design doc (this file) — done.
2. Expand CI to create release artifacts (done).
3. Add native-core performance benchmark harness and CI job to run it (I can add this next).

