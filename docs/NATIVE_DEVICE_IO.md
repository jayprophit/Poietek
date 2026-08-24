# Native desktop audio and MIDI device architecture

## Delivered boundary

The installed Tauri application now performs a read-only operating-system device
scan when the desktop shell starts, again when its window regains focus, every
five seconds while the shell is active, and whenever the creator presses **Scan
desktop devices** in Studio Setup.

The Rust adapter uses:

- CPAL for the audio hosts, input/output endpoints, stable host device identity
  where the backend supplies it, advertised stream-configuration ranges and the
  backend's preferred configuration report;
- midir for MIDI input/output port identity and names;
- one application-owned Tauri command named `list_native_studio_devices`;
- one capability permission that allows only that command in the `main` window.

The adapter does not open an audio stream, connect to a MIDI port, send MIDI,
request System Exclusive access, write files, launch processes or access the
network. It does not run on the current Android/iOS shells; those return an
explicit unavailable inventory until mobile permission/session adapters are
reviewed.

## State separation

Professional device setup must keep four facts separate:

| Fact | Current status | Evidence |
| --- | --- | --- |
| Endpoint detected | Working on desktop native builds | CPAL/midir inventory returned by Rust |
| Selectable by the current production engine | Unavailable | Every native endpoint carries `selectableByNativeEngine: false` |
| Stream or MIDI connection open | Unavailable | Inventory code contains no stream builder or MIDI `connect` call |
| Device/round-trip latency measured | Not measured | Audio endpoint latency is always `not_measured` with `latencyMs: null` |

The existing browser surface remains separate:

- Web Audio/WebRTC endpoints can be enumerated after browser permission;
- the existing Web MIDI manager can receive from Web MIDI ports when the browser
  or webview supports that API;
- browser-reported `baseLatency`/`outputLatency` remain reported context values,
  not a physical loopback result.

Studio Setup displays native inventory cards separately from browser-selectable
controls so a detected CPAL/midir endpoint is never silently presented as active
engine routing.

## Platform backends

The default CPAL and midir targets provide the following inventory route:

| Platform | Audio inventory | MIDI inventory | Build dependency |
| --- | --- | --- | --- |
| Windows | WASAPI | WinMM | MSVC C++ build tools and WebView2 |
| macOS | Core Audio | CoreMIDI | Xcode toolchain |
| Linux | ALSA | ALSA | `libasound2-dev` plus Tauri WebKitGTK dependencies |

ASIO, JACK, PipeWire and other optional backends are not enabled by this slice.
They must not appear as available merely because CPAL supports optional adapters.
An ASIO build additionally needs the applicable SDK/toolchain and installed
driver; a professional release also needs real interface tests.

## Next production slice

Inventory is a prerequisite, not a realtime engine. The next native I/O slice
must add all of the following behind new, narrowly reviewed capabilities:

1. Explicit user selection and reconnect-safe device IDs.
2. A realtime audio graph with negotiated sample format/rate/buffer and clear
   accepted-versus-requested values.
3. Input/output stream lifecycle, dropout/xrun counters, device invalidation,
   suspend/resume and sample-clock handling.
4. Explicit native MIDI input enablement, timestamped event delivery, output
   scheduling, panic/all-notes-off, hot-plug and no-SysEx-by-default policy.
5. Physical loopback latency measurement and compensation evidence.
6. Windows WASAPI qualification first, then optional ASIO as a separately built
   and tested backend; Core Audio on macOS; ALSA and later reviewed JACK/PipeWire
   routes on Linux.
7. Mobile AVAudioSession/AAudio and MIDI permission/session adapters, tested on
   physical iOS/iPadOS/Android devices.

No public-release gate should change to pass until those streams and connections
survive the published hardware matrix, sustained-load, hot-plug, recovery and
measured-latency acceptance suites.

## Primary implementation references

- Tauri command bridge: <https://v2.tauri.app/develop/calling-rust/>
- Tauri permissions: <https://v2.tauri.app/security/permissions/>
- Tauri prerequisites: <https://v2.tauri.app/start/prerequisites/>
- CPAL supported platforms and requirements: <https://github.com/RustAudio/cpal>
- CPAL device/configuration API: <https://docs.rs/cpal/latest/cpal/>
- midir platforms and backends: <https://github.com/Boddlnagg/midir>
- midir port API: <https://docs.rs/midir/latest/midir/>
