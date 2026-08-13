# Volume 03 — Audio Production System

Document ID: `POI-VOL-03`
Edition: `1.0.0`
Primary domains: `CAP-01`, `DOM-WORKFLOW`, `DOM-SETTINGS`, `DOM-CONTROL`

## Scope

This volume defines the professional audio workstation: project creation, real
audio import, recording, monitoring, arrangement, non-destructive editing,
comping, automation, mixing, analysis, mastering preparation, recovery and media
export. Sampler-specific behavior is in Volume 04; picture delivery is in Volume
05.

## Production model

- A project owns tempo/time-signature maps, tracks, assets, routing intent,
  markers, metadata and versioned extensions.
- Tracks own ordered clips and mixer state. Clips reference immutable source
  assets and carry position, source window, gain, panorama, fades and mute.
- Destructive source replacement requires explicit render/bounce and new asset
  identity.
- Playback and offline render consume the same validated project intent, with
  documented differences where a real-time-only processor cannot render.

## Required workspaces

1. Arrange: ruler, playhead, tracks, clips, waveforms, markers, snapping and tools.
2. Console: channel strips, inputs, inserts, sends, buses, groups, VCA/control,
   cue mixes, meters, master and monitor sections.
3. Inspect: clip/track/project properties, audio health and destination preflight.
4. Rack: instruments/effects/routing with front/rear views and durable device
   chains once migrated.
5. Record: inputs, arming, monitoring, count-in, pre-roll, takes, punch and dropout
   evidence.
6. Export: selection, stems, channels, formats, rate/depth, metadata, progress,
   cancellation and verification.

## Transport and timeline

One canonical transport owns play, pause, stop, record, loop, seek, locate,
tempo, meter, count-in and metronome state. Secondary surfaces invoke the same
commands rather than duplicating transport engines. Scheduling derives from the
tempo map; UI animation follows the engine and is not treated as audio timing.

## Recording and monitoring

- Enumerate only reported inputs/outputs and accepted channel counts.
- Distinguish hardware monitoring, software monitoring and silent input metering.
- Negotiate capture formats and release every stream/monitor resource on stop,
  cancel or failure.
- Create a content-identified asset, waveform and clip through the same import
  path used by files.
- Record take/lane, input, sample-rate, timestamp, dropout and latency evidence.
- Browser recording remains capability-gated; professional low-latency/native
  recording requires measured adapters.

## Editing requirements

Move, copy, duplicate, trim, slip, split, join/render, crossfade, fade, gain,
pan, mute, reverse derivative, time/pitch process, quantize, align, group, lock,
comp and automation edits must be non-destructive where practical and undoable.
Snap targets include grid, markers, playhead, events and cross-track clip edges,
with a visible transient guide.

## Mixer and signal flow

The target graph supports input stage, phase/polarity, trim, inserts, pre/post
sends, buses, groups, sidechains, pan law, mute/solo variants, record/monitor,
automation, channel meter, master processing, cue/control-room routing and
offline render. Controls remain bypassed or unavailable until a real processor or
route exists; simulated knobs never imply processed audio.

## Analysis and release readiness

Operational basic PCM analysis includes sample peak, RMS, DC offset, stereo
correlation and digital full-scale clipping checks. Integrated/short-term/
momentary loudness, loudness range and true peak require a validated BS.1770 and
oversampled conformance implementation. Until installed, they remain explicitly
`not_measured` and required release profiles cannot pass them.

## Export and recovery

Project save is distinct from media export. Export defines scope, format,
sample-rate, bit depth, channels, normalization/dither policy, metadata, mapping,
progress, cancellation and output verification. Recovery offers Recover, Skip
and Discard per checkpoint and labels recovered work unsaved until a durable
commit succeeds.

## Current status and exit evidence

Import, storage, waveform, clip placement/editing, Web Audio playback, track/clip
gain/pan/mute, recording ingestion, offline render core, PCM16 WAV encoding,
basic health, autosave/undo and recovery services are operational vertical
slices. Comping, full routing, plugins, automation, professional metering,
validated loudness/true peak, complete export UI and native low-latency adapters
remain staged. Exit evidence is defined in Volume 14 and the audio test matrix in
`../DELIVERY_TEST_DOCUMENTATION_PLAN.md`.
