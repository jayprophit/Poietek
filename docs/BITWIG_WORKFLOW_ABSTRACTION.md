# Bitwig workflow abstraction for Poietek Studio

Status: implemented clean-room foundation

Review date: 2026-08-22

Scope: Bitwig Studio, Bitwig Connect, The Grid, modulation, arranger/launcher, devices, content, controller integration, support, download, editions and open standards

## Purpose and legal boundary

This document records workflow lessons from Bitwig's publicly available product, learning and support material. It is not a reproduction of Bitwig Studio, The Grid, Bitwig Connect, their visual design, factory devices, presets, samples, documentation, code, names or proprietary DSP. Poietek uses original names, data structures, visual treatment and implementation code.

No Bitwig binary, sound, preset, project, controller extension or commercial asset was downloaded or imported. Public material was used only to identify broad product principles that can be implemented independently: pervasive modulation, nonlinear plus linear creation, typed modularity, capability-aware hardware control, fault isolation, contextual help, project interchange and cross-platform delivery.

## Product-system findings

| Bitwig public area | General product lesson | Poietek status before this slice | Poietek action or gate |
| --- | --- | --- | --- |
| Arranger and Clip Launcher | Linear editing and improvisational launching should share one project rather than become disconnected apps. | Canonical timeline plus composition patterns and arrangement lanes existed. | Preserved one project model. A later clean-room Tracktion/Waveform slice added the original Performance Canvas control model and atomic launcher-to-arranger commit; audible sample-accurate launching remains gated. |
| Audio, note and hybrid workflows | Audio and expressive notes benefit from layered, context-sensitive editing. | Audio tracks, composition patterns, note tools and scoring foundations existed, but canonical MIDI/instrument tracks remain staged. | Keep typed media and expression domains. Do not label hybrid tracks complete until the canonical model and player can round-trip both. |
| Automation clips | Automation can be reusable musical material with its own loop, offset and stretch identity. | Project-owned automation envelopes existed. | Future schema can add aliases and independent clip timing; no claim was added in this slice. |
| Universal modulation | A source-to-parameter system becomes more useful when it is project-wide, visible and reusable. | Rack CV ports and one effect-specific LFO existed, but there was no universal project-owned modulation graph. | Implemented the original Motion Matrix extension, deterministic source evaluation, typed routes, target previews and macro scene recall. |
| The Grid | Modular systems need inspectable connections, useful defaults and contextual signal information. | Poietek had typed note/audio/CV/gate rack routing and honest logical routing previews. | Kept typed domains instead of treating every signal as interchangeable. Added per-source and per-target inspector evidence. Native modular DSP remains gated. |
| Instruments, audio FX, note FX, containers and routers | A coherent device ecosystem needs sources, transformations, grouping and routing—not just a long plug-in list. | Poietek already had original samplers, synth, note tools, effect control models, split/merge and macro-bus containers. | Added a portable modulation control layer that can later address reviewed device adapters. No Bitwig device or algorithm was cloned. |
| Hardware, MPE, MIDI, CV, Gate and controller API | Hardware mapping should distinguish stored user intent from observed ports, values and accepted capabilities. | Poietek already used capability/evidence boundaries for audio, MIDI, live sessions and latency. | External Motion Matrix sources require matching observations; rack, track, plug-in and hardware delivery requires a named adapter capability. |
| Bitwig Connect | A hardware interface can combine audio I/O, CV, monitoring and high-resolution DAW control while recalling settings with a project. | Live capture planning, hardware mapper, patch bay, control room and native endpoint inventory existed. | No hardware was emulated. Future native adapters may surface gain/monitor/control evidence through existing hardware contracts. |
| Plug-in isolation | A plug-in failure should not take the project model or user interface down. Isolation strength is a deliberate resource tradeoff. | External plug-in placement and native host requirements were explicit, but a production plug-in subprocess host is not complete. | Retain the native-host gate. Add isolation modes, crash recovery and health evidence only with a real C/C++/Rust host process. |
| Context browser and sound content | Search should connect a current task to rights-cleared sounds, presets, clips and devices; provenance matters as much as quantity. | Rack library search, Sound Atlas, original procedural audio and rights-aware loop drafting existed. | Motion Matrix is searchable in the rack library and has an original starter template. No commercial sound or preset was copied. |
| Open standards | DAWproject, CLAP and open controller interfaces reduce lock-in and improve collaboration. | Poietek had compatibility planning and adapter boundaries, not a validated DAWproject/CLAP implementation. | Maintain explicit import/export and host adapters. Do not advertise format support until official conformance fixtures pass. |
| Cross-platform and touch | The same project should adapt across desktop, multiple displays and touch devices. | Responsive web/PWA and Tauri desktop/mobile packaging foundations existed. | Motion Matrix uses touch-sized controls and responsive grids. OS-specific packaging and signed releases remain separately qualified. |
| Learn, support and discovery | Getting-started material, contextual help, changelogs, compatibility notes and community learning are part of the product. | Poietek has documentation, setup guidance, evidence dashboards and help drafts. | Motion Matrix explains every readiness boundary in place. Searchable contextual help is still a broader product task. |
| Editions, trial, purchase and upgrade | Commercial tiers should be understandable without fragmenting the underlying project format. | Poietek has a business-tier reference architecture but no live commerce entitlement. | Keep one canonical schema and capability-derived feature access. Do not enforce paid gates until identity, licensing and recovery are production-ready. |

## Implemented original foundation: Motion Matrix

The new extension key is `org.poietek.motion-matrix`, schema `1.0.0`. Its state belongs to one canonical project and contains:

- reusable sources: macro, LFO, step lane, deterministic seeded variation and evidence-gated external input;
- explicit unipolar or bipolar ranges and phase offsets;
- typed targets with base value, bounds, unit, reference, parameter and required capability;
- routes with source, target, amount, input interpretation, curve and enabled state;
- scenes that recall project-owned macro values only;
- revision tracking and project ownership validation.

The evaluation path is deliberately split:

```text
project modulation state
  -> validate ids, ranges, references and capabilities
  -> evaluate deterministic sources at a bar-relative phase
  -> accept external sources only with matching adapter evidence
  -> transform and sum enabled route contributions
  -> clamp each declared target to its range
  -> emit a deterministic control-preview frame
       -> local control slots: preview ready
       -> track/rack/plugin/hardware: adapter required
```

The control frame is real project behavior, but it does not claim audio-rate DSP, an audio-rate render or live device delivery. That distinction prevents a polished control surface from being mistaken for completed DSP.

### Source behavior

- Macro sources save normalized values in the project.
- LFO sources evaluate sine, triangle, saw or square control shapes without claiming sample accuracy.
- Step sources use explicit project-owned values.
- Random sources are seeded and step-indexed, so the same state and phase produce the same result.
- Per-note expression, audio followers and hardware controls cannot invent input; they remain unavailable until an adapter reports a matching capability and finite observation.

### Target behavior

- `control_slot` is locally previewable.
- `track_gain` and `track_pan` require a known canonical track plus `timeline_control_frame` delivery.
- `rack_parameter`, `plugin_parameter` and `hardware_parameter` require explicit references and adapter capabilities.
- Target values are clamped to declared bounds after route summation.

### Scene behavior

Scenes contain macro source values only. Recall cannot silently restore a plug-in blob, hardware register, DSP buffer, external file or unknown processor state. A scene recall runs through one `ProjectSession` mutation, so undo and redo restore the entire prior canonical project state atomically.

## Rack and interaction changes

- Added the **Motion Matrix** production module to the searchable rack catalog.
- Added Modulators, Matrix, Scenes and Inspector views.
- Added bar-phase scrubbing and deterministic live preview values.
- Added a one-action macro save and per-route enable controls.
- Added three original starter scenes: Still, Open and Lift.
- Added the **Modular Motion & Performance Rig** template.
- Added Motion Matrix entries to Edit, Project, Production and Devices menu paths.
- Added Motion Matrix to the default starter rack and the idea-to-arrangement template.
- Preserved touch targets and responsive one-, two- and three-column layouts.

## What remains honestly incomplete

The following are not implied by the new UI:

- audio-rate or sample-accurate modulation;
- a native modular DSP compiler;
- live delivery to rack device parameters;
- CLAP, VST3, AU or external plug-in parameter delivery;
- MPE/per-note expression input without observed device evidence;
- audio envelope-following without an observed audio analysis adapter;
- CV/gate output or Bitwig Connect compatibility;
- sample-accurate audible launcher scheduling and controller dispatch (the canonical Performance Canvas and arrangement-capture bridge are now implemented);
- DAWproject import/export conformance;
- factory content equivalent to any commercial library;
- plug-in process sandboxing or crash restart;
- signed desktop/mobile installers or app-store release.

Those need native engine work, formal adapter contracts, conformance fixtures, real hardware tests and release qualification. They remain gates rather than marketing claims.

## Five-star direction

A legitimate top-tier modulation lane requires evidence in five areas:

1. **Creative depth:** polyphonic and audio-rate native control sources, composable transforms and reusable scenes.
2. **Reliability:** bounded real-time memory behavior, deterministic scheduling, crash isolation and project recovery.
3. **Interoperability:** CLAP/VST3 parameter addressing, MPE, MIDI, CV/gate and DAWproject fixtures.
4. **Usability:** contextual help, assignment gestures, searchable targets, accessibility and touch testing.
5. **Delivery:** desktop and mobile acceptance, latency measurement, hardware matrices, installer signing and support procedures.

The current slice earns evidence for the project model, deterministic evaluation, fail-closed adapter boundaries, atomic scene recall, responsive UI and tests. It does not award Poietek five stars for unimplemented native DSP or ecosystem capabilities.

## Official reference set

- https://www.bitwig.com/
- https://www.bitwig.com/overview/
- https://www.bitwig.com/the-grid/
- https://www.bitwig.com/feature-list/
- https://www.bitwig.com/sound-content/
- https://www.bitwig.com/connect/
- https://www.bitwig.com/learn/
- https://www.bitwig.com/discover/
- https://www.bitwig.com/support/
- https://www.bitwig.com/download/
- https://www.bitwig.com/buy/
- https://www.bitwig.com/modern-foundations/
- https://www.bitwig.com/about/

Product counts, prices, editions, operating-system requirements and beta status are time-sensitive. They were reviewed on the date above and should be refreshed before any external comparison or purchasing statement.
