# Poietek staged delivery roadmap

## Stage 1 — trustworthy local audio project

Status: integrated and testable.

- Canonical project schema, validation and local repository
- Serialized autosave with whole-project undo/redo
- OPFS-first media storage with IndexedDB fallback
- Real audio decode/import, durable waveform preview and timeline placement
- Web Audio play, pause, stop and seek
- Basic PCM health analysis with honest LUFS/dBTP unavailable states
- Capability-gated recording, offline timeline render and PCM16 WAV export
- Crash-recovery repository and Recover/Skip/Discard semantics
- PWA shell and security-minimal Tauri scaffold
- Versioned global settings, named profiles, original module/content catalog and
  repeatable local browser benchmark

## Stage 2 — editor depth and recovery UX

Status: active implementation; first editor/console slice verified.

- Non-destructive position, duration trim, split, gain, panorama, fades, mute and
  clip removal are implemented; slip, crossfades, drag handles and comping remain
- Track gain, panorama, mute and solo are implemented in the mixer/audio graph;
  inserts, sends, buses, automation, metering and waveform cache workers remain
- Recording/export/recovery controls wired into the production workspace
- Versioned project migrations and orphan-media management
- Real BS.1770 LUFS and true-peak analyzer with conformance fixtures
- App icons, signing, Tauri native storage/dialog adapters and installer tests

The visual presentation now uses a unified Arrange/Rack command bar, dense
multitrack waveform lanes, a clip inspector, and the expanded Summit console.
The rack is preserved as a primary workspace rather than hidden behind the old
floating project button.

## Stage 3 — hardware and interoperability

Status: capability-gated design work.

- Audio/MIDI device enumeration and explicit profiles
- Measured loopback latency, clock-source negotiation and dropout reporting
- MIDI clock/MTC, word clock, LTC and console/patch-bay adapters
- Freeze/render fallback for unavailable plugins and devices
- AAF/OMF/MIDI/stem interchange adapters with round-trip tests

## Stage 4 — provider-neutral collaboration

Status: serializable contracts implemented; no sync service is claimed.

- Encrypted identity/team service, device replicas and conflict resolution
- Supabase/Firebase storage/sync adapters with tested security rules
- Cross-device handoff, invitations, roles, review and approval trails
- Contributor passports, split proposals and versioned rights agreements
- External registration submission adapters with receipt/status polling

## Stage 5 — community, commerce and provenance

Status: contracts only.

- Community player/feed/library/store with privacy and moderation controls
- Destination release profiles and separate tuning derivatives
- Licences, payments, fulfilment evidence and royalty statements
- Optional evidence-only provenance anchors; never a copyright determination
- Federated/decentralized endpoints with transparent availability and trust state

## Stage 6 — learning, AI, video and VFX

Status: contracts only.

- Contextual learning assistant based on the actual project state
- Previewable, attributable and undoable AI actions through provider routing
- Video timeline, proxy media, captions, colour/VFX render jobs
- Native/WASM time-preserving pitch DSP for audio/video community derivatives
- Formal performance, privacy, security, accessibility and compliance audits
