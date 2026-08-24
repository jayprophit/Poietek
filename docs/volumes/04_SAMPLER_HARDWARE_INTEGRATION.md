# Volume 04 — Sampler & Hardware Integration

Document ID: `POI-VOL-04`
Edition: `1.0.0`
Primary domains: `CAP-02`, `CAP-03`, `CAP-04`, `DOM-HARDWARE`

## Scope and compatibility language

This volume defines sampling, instrument performance, MIDI routing, controller
mapping, digital/analogue console integration, patching, clocking, calibration
and device profiles. MPC, Roland and other manufacturer/product names may be
recorded as user hardware or compatibility targets; they remain third-party
trademarks. Poietek does not copy their firmware, factory sounds, protected
layouts or claim support based only on a product-name match.

## Sampling system

- Record, import, resample and drag audio through canonical asset ingestion.
- Detect or let users place slices; preserve the original and store slice intent.
- Map slices/samples across pads, keys, velocity zones, round robins and choke
  groups.
- Support start/end, tune, fine tune, gain, pan, envelopes, filters, modulation,
  mute groups, one-shot/gate/loop modes and per-pad output/effects intent.
- Provide program, kit, multisample and pattern serialization with migrations.
- Offer original procedural recipes and properly licensed/user-supplied media;
  never republish commercial factory banks.

## MIDI architecture

Inputs and outputs expose observed manufacturer/name/port/state without inventing
latency or identity. The parser handles standard channel voice messages and
retains room for SysEx-by-explicit-permission, MPE, MIDI 2.0/UMP, MIDI clock,
song position, MTC, MMC, OSC and network MIDI adapters. Simulator ports are
explicit test tools and cannot silently appear as hardware.

## Device profile lifecycle

1. Discover a port/device through a platform adapter.
2. Record observed identifiers and capability source.
3. Suggest a matching profile without automatically verifying it.
4. Let the user select/confirm or author a profile.
5. Probe allowed capabilities and retain evidence/observation time.
6. Store desired mappings separately from connected/effective state.
7. Preserve the profile on disconnect and degrade effective routes honestly.

Profiles cover controls, feedback, channels, ports, protocol, templates, firmware
notes, provenance, confidence, unsupported functions and migration version.

## Routing and hardware domains

- Audio route/patch intent and separately verified physical connection.
- MIDI note/control routing and processor chains.
- Control-surface input and motorized/visual feedback.
- Digital console control-only integration versus actual audio transport.
- Analogue insert, recall sheet, calibration and photographed/entered settings.
- Separate transport, sample clock, MIDI clock, word clock, LTC/MTC and meter
  domains; one locked domain never proves another.

## Measurement requirements

Round-trip latency requires physical loopback evidence with interface, path,
sample rate, buffer, repetitions, statistic and timestamp. Analogue calibration
requires declared reference level, source, measurement route and tolerance.
Clock lock, sample accuracy, metering and console control require adapter
observations. Unmeasured and unsupported are valid professional states.

## Plugin/instrument fallback

Unavailable native instruments or effects preserve serialized parameters,
routing and identity. Projects can use freeze/rendered stems, substitution by
explicit user action or bypass. A missing plugin is never silently deleted or
replaced.

## Current status and acceptance

Truthful Web MIDI state, parser corrections, explicit simulator opt-in,
serializable hardware/clocking/routing contracts, profile provenance,
negotiation and evidence validators are implemented foundations. Canonical
sampler programs, MIDI tracks/clock output, physical hardware adapters, console
drivers, loopback tools, native plugin hosting and published device matrices
remain staged and must pass recorded-protocol plus physical-device fixtures.
