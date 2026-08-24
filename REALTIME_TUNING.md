Poietek Studio — Real-time tuning & native-first deployment guidance

Purpose
This document captures recommended runtime settings, OS-level guidance, and implementation notes to minimize audio/MIDI latency, reduce glitches, and make the native desktop/tablet/mobile shells first-class (not web-first).

Principles
- Favor native device APIs and run audio processing in native threads (C/C++/Rust) with real-time-safe coding practices.
- Avoid network or filesystem operations on audio threads; use lock-free queues for control messages.
- Minimize dynamic module fetches on startup for native bundles: preload critical modules (done in the renderer prefetch hooks).

Recommended audio engine defaults
- Sample rate: use the device default (allow user selection). For low-latency monitoring prefer 48000 Hz on modern drivers if available.
- Buffer size: attempt to negotiate a small buffer size with the driver (e.g., 64 or 128 frames) for low latency. Provide a fallback to 256/512 if the system does not support smaller buffers.
- IO block size: keep it constant across engine and device to avoid buffer conversion overhead.

Platform-specific tuning
- Windows:
  - Use WASAPI exclusive mode or ASIO when available for lowest possible latency.
  - Use highest thread priority for audio threads (REALTIME_PRIORITY_CLASS for process, THREAD_PRIORITY_TIME_CRITICAL for threads) — code can attempt to escalate but CI and OS policy may prevent it.
  - Ensure the machine uses high-performance power profile; disable CPU power-saving governors during sessions.
- macOS:
  - Prefer CoreAudio device default; avoid device sample-rate conversion by matching engine sample rate to the device.
  - Set audio thread to high QoS (e.g., QOS_CLASS_USER_INTERACTIVE) via native APIs.
- Linux:
  - Use JACK where possible for pro setups. On PulseAudio use lower buffer sizes and configure sink/source latency.
  - If using threaded priorities, ensure rtprio/limits are set (e.g., /etc/security/limits.conf) or ask users to install realtime-privileges for audio group.

Application-level guidance
- Native-first startup: when running under the native shell, the renderer should eagerly load core UI modules so the user has immediate access to transport, device list and the arrange/rack workspace. The codebase was updated to prefetch critical modules when window.__TAURI__ is present.
- Device inventory vs engine connection: strictly separate device enumeration (safe) from opening native audio streams (dangerous). The app currently performs inventory and exposes engine as "inventory_only" until the user explicitly opens native audio engine in Studio Setup.
- Avoid lazy chunk fetches on mobile/desktop packaged apps: pre-bundle the frontend in the native bundle (Tauri does this), and use the renderer prefetch hooks implemented in src/main.tsx and PoietekAppShell to warm critical chunks.

Process & thread priority (best-effort)
- The native shell attempts a best-effort priority escalation using an optional cargo feature ("priority"). This will be enabled in native build configurations where permitted and safe.
- Do not hard-fail the app if priority escalation fails — it is non-fatal and only a helpful optimization.

Buffering strategy & safety
- Use a lock-free circular buffer with a single producer (audio device callback) and a single consumer (engine thread) for incoming audio; use the same for outgoing audio.
- Avoid heap allocation in the audio callback. Pre-allocate buffers and buffers pools during engine init.
- Use ring-buffer sample block sizes that are multiples of the device buffer frames to avoid partial-block processing.

Configuration surfaces to expose to the user
- Native audio backend selection: ASIO / WASAPI / CoreAudio / JACK
- Preferred sample rate and buffer size (with "auto" negotiate option)
- Driver mode: Exclusive (low-latency) vs Shared (safe, may be higher latency)
- Thread priority toggle (best-effort; requires elevated permissions on some platforms)

CI & performance
- Benchmarks are captured during CI using the native-core bench harness. Store bench output artifacts on CI per run and track regressions.
- Add a perf-regression job in CI to compare the current bench output against a baseline (upload baseline to artifacts store or a release asset) and warn on regressions.

Security & packaging notes
- Keep CSP and native capabilities tightly limited. Only enable features that the app explicitly needs for the native engine.
- Code-signing and notarization are required for macOS and highly recommended for Windows distribs. CI supports placeholders for secrets but real signing requires secure secrets.

Developer checklist for realtime work
- Run bench harness and profile hot paths; use trace tools (Instruments, Windows Performance Analyzer).
- Build non-RT sanitized debug builds for correctness checks and separate RT-optimized builds for release.
- Add more unit and integration tests for deterministic DSP algorithms.

If you'd like, next steps to further reduce startup lag and optimize native behavior:
1. Enable the Cargo feature "priority" for release CI/native bundles to try thread-priority escalation automatically.
2. Add a small native splash that shows instantly and defers heavy UI painting until the engine is warmed and prefetches complete.
3. Add an explicit "warm engine" startup path which runs the native core warm-up steps (allocate buffers, open preferred device) in background before connecting audio I/O.

