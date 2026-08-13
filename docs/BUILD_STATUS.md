# Build status — 2026-08-13

## Verified

- Formatting hygiene: passed
- Full TypeScript typecheck: passed
- Strict Poietek core compile: passed
- Pure/core regression tests: 49 passed, 0 failed
- Vite production build: passed (1,753 modules)
- Production browser smoke test: passed
- Installed dependency graph: no missing, invalid or extraneous packages
- Git whitespace/conflict check: passed

Production output is code-split so the real project/audio workspace and Studio
Setup load only when opened. The latest main bundle is approximately 490 kB
minified / 129 kB gzip; the unified audio workspace is approximately 41 kB /
12 kB gzip and Studio Setup is approximately 52 kB / 14 kB gzip.

The latest browser smoke test opened the production bundle directly in Arrange,
confirmed the project rack, transport, scalable multitrack lane, clip inspector,
console and honest empty-project states, switched to the complete modular Rack,
and returned without application errors. Web MIDI permission was denied by the
test browser and was reported as an honest unavailable warning; the app remained
usable.

The second browser pass verified the repaired `npm run dev` preview path, the
responsive Studio Setup menu, all eleven settings categories, audio-device
enumeration, reported Web Audio context values, local settings persistence, the
honest 21-item module/content catalog, and the evidence-based benchmark. That run
scored 90/100 (five stars): 121.21x deterministic DSP throughput, 3.92 ms average
UI timer jitter, 25.58x offline render speed and 32.68 MB/s temporary IndexedDB
write/read. This is a machine/browser observation, not a commercial-product
comparison or hardware round-trip measurement.

The managed Codex Windows sandbox does not permit Vite's development dependency
optimizer to traverse its normal resolution boundary. `npm run dev` therefore
builds and serves the verified bundle on port 3000. `npm run dev:hmr` retains the
normal live Vite workflow for unrestricted development environments.

## Implemented core

- Canonical project, validation, repository, autosave and undo/redo
- Real audio import, hash, local storage, waveform, timeline playback and health
- Recording capability/MIME negotiation/cleanup and import handoff
- Offline timeline render and honest PCM16 WAV encoding
- Crash-recovery repositories and Recover/Skip/Discard coordination
- Honest MIDI/device states and simulators only by explicit opt-in
- Hardware/profile/routing/console/clock/timecode contracts and validators
- Provider routing and local/Supabase/Firebase health foundations
- Rights/team/provenance/commerce/privacy/learning/interoperability/plugin/video/AI contracts
- Destination profiles, A432 derivative boundary, local community/feed/store contracts
- PWA shell and least-privilege Tauri scaffold
- Versioned global settings, four named profiles and JSON import/export
- Audio/MIDI/sync/recording/editing/file/plugin/appearance/privacy setup UI
- Honest 20-item original module/content catalog and procedural one-shot kit
- Repeatable DSP/scheduler/offline-audio/storage benchmark with derived stars
- Original visible/source component naming with legacy ids retained for migration
- Unified Arrange/Rack application shell with F7/F6 navigation
- Horizon multitrack arranger using canonical clips and real stored waveforms
- Undoable clip move/duration trim, gain/pan, fades, mute, split and removal
- Fade-aware Web Audio scheduling
- Summit console with active track gain/pan/mute/solo and honest bypass states
- Sound Atlas with 24 original recipe/provenance records across nine families

## Not represented as finished

- Validated BS.1770 LUFS and oversampled dBTP analysis
- Native/WASM time-preserving pitch DSP
- Hardware drivers, real clock lock, loopback calibration or sample-accurate sync
- Authenticated cloud sync, real-time collaboration or conflict transport
- External registration, rights approval, payments or blockchain transactions
- Plugin hosting, video/VFX rendering or AI inference adapters
- Signed native installers or app-store packages

Those items have explicit contracts/unavailable states and remain staged work.
