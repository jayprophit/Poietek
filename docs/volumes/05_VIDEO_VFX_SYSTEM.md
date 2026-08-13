# Volume 05 — Video & VFX System

Document ID: `POI-VOL-05`
Edition: `1.0.0`
Primary domains: `CAP-05`, `CAP-06`, `DOM-FEATURE`, `DOM-PLUGIN`

## Scope

The picture system extends the same project time, assets, contributors and
delivery evidence used by audio. It covers video ingest, proxy generation,
timeline editing, audio synchronization, captions, graphics, colour,
compositing/VFX, render jobs and destination packages.

## Canonical media model

Video and image assets use content identity, technical metadata, source/proxy
relationships and licence/provenance records. Timeline items reference assets
and non-destructive source windows. Frame rate, timebase, drop-frame policy,
pixel aspect, colour space, transfer function and audio layout are explicit.

## Editing system

- Source/program viewers, bins, sequences, tracks, clips, markers and ranges.
- Insert, overwrite, lift, extract, ripple/roll/slip/slide, blade and trim.
- Sync by timecode, marker, waveform or explicit offset with confidence/evidence.
- Proxy/original relink and offline-media recovery.
- Transitions, speed intent, transforms, crops, stabilization jobs and keyframes.
- Caption/transcript tracks, speaker labels, timing, styles and accessible export.

## VFX and graphics

The planned graph supports compositing nodes/layers, masks, mattes, keying,
tracking, paint/cleanup, transforms, blur/sharpen, generators, text, particles,
audio-reactive parameters and reusable templates. Colour work includes input
transforms, primary/secondary adjustments, scopes, LUT provenance and output
transforms. A visible control is not proof that a render backend exists.

## Render architecture

Render requests are serializable jobs containing source revision, range,
resolution, frame rate, codec/container intent, colour transform, audio mapping,
captions, processor graph, backend requirements and destination. States are
queued, running, blocked, cancelled, failed or completed with output evidence.
Native, WASM, local worker and optional remote compute backends negotiate
capabilities without changing the canonical job.

## Audio and tuning integration

Picture follows project time and preserves audio/video duration. Community A432
or other tuning derivatives require a validated time-preserving audio DSP backend
and become separate media derivatives. `playbackRate` is not an acceptable
replacement because it changes duration and synchronization.

## Interchange and plugins

Targets include declared XML/EDL/AAF-style interchange where legally and
technically feasible, image sequences, caption formats, common media containers,
OpenFX-style effect hosting and rendered fallback. Each adapter publishes a
round-trip loss report; proprietary SDKs remain external gates.

## Accessibility and safety

Every tutorial/delivery supports captions and transcripts. Flashing, motion and
audio-reactive effects expose warnings and reduced-motion alternatives. Generated
or modified media retains provenance, consent and identity-safety records where
applicable.

## Current status and acceptance

Serializable video/VFX render contracts and truthful unavailable states exist as
foundations. No production video timeline, decoder/proxy pipeline, VFX renderer,
colour engine or plugin host is claimed. Acceptance requires frame/audio sync,
seek accuracy, proxy relink, colour/caption fixtures, interruption recovery,
large-timeline performance and reproducible render evidence.
