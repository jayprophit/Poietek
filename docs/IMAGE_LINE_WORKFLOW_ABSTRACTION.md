# Image-Line workflow abstraction for Poietek Studio

Status: implemented clean-room workflow slice, with explicit engine gates

Date reviewed: 2026-08-22

Scope: FL Studio desktop, FL Studio Mobile, FL Cloud, learning/support, product editions and the 2026 release

## Purpose and intellectual-property boundary

This document records product principles learned from Image-Line's official public material and translates them into original Poietek architecture. It is not a request to clone FL Studio. Poietek does not copy Image-Line source code, binaries, product names, visual assets, presets, samples, documentation, layouts or proprietary DSP. Image-Line and FL Studio remain their owners' marks.

The clean-room rule is simple: study the user problem and the public behavior, write an independent requirement in Poietek language, implement it against Poietek's canonical project and capability rules, and verify it with Poietek-owned tests and assets. A user-licensed plug-in or sound stays external content and is never redistributed.

## Official source review

The research pass used primary Image-Line sources:

- [FL Studio features](https://www.image-line.com/fl-studio/features) for the pattern, note, arrangement, mixer, instrument, effect, workflow and sound-library surface.
- [Channel Rack manual](https://www.image-line.com/fl-studio-learning-content/fl-studio-online-manual/html/channelrack.htm) for the relationship between channels, steps, patterns and mixer targets.
- [Playlist manual](https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/playlist.htm) for multi-purpose clip lanes, free and linked workflows, clip grouping, snapping, uniqueness, gain and crossfade concepts.
- [Piano roll manual](https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/pianoroll.htm) and [Piano roll tools](https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/pianoroll_menu.htm) for scales, chords, quantize, chop, glue, arpeggiation, strum, legato, articulation, LFO and per-note properties.
- [Automation Clip manual](https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/playlist_automationclip.htm), [internal automation](https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/automation_internal.htm) and [automation recording](https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/recording_automation.htm) for editable curves, controller capture and playlist versus pattern automation.
- [Patcher manual](https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/plugins/Patcher.htm) and [Control Surface manual](https://www.image-line.com/fl-studio-learning-content/fl-studio-online-manual/html/plugins/Control%20Surface.htm) for reusable graphs, parallel/serial processing and creator-defined macro surfaces.
- [Browser manual](https://www.image-line.com/fl-studio-learning-content/fl-studio-online-manual/html/browser.htm) for unified project, asset, preset and plug-in discovery with search and drag/drop.
- [Recording guide](https://cluster.image-line.com/fl-studio-learning/fl-studio-online-manual/html/recording_audio.htm) and [Edison manual](https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/plugins/Edison.htm) for recording destinations, loop recording, take capture and memory editing.
- [FL Studio 2026 release](https://www.image-line.com/fl-studio/release/2026) for preset-first discovery, project backup, expanded loop starting, chord detection/voice leading, note labels, clip gain, retrospective Audio Logger and assistant actions.
- [Gopher](https://www.image-line.com/gopher) for contextual help and the boundary between advice and hands-on project actions.
- [FL Studio learning](https://www.image-line.com/learn) and [support](https://www.image-line.com/fl-studio-support) for a task-led learning path and unified manual/tutorial/forum/knowledge-base discovery.
- [Edition comparison](https://www.image-line.com/fl-studio/compare) and [pricing](https://www.image-line.com/fl-studio/pricing/) for clear capability entitlements. Poietek does not copy Image-Line's prices or commercial terms.
- [FL Cloud](https://www.image-line.com/fl-cloud) for integrated sounds, plug-ins, mastering, storage and distribution. Poietek treats every remote capability as optional.
- [FL Studio Mobile](https://www.image-line.com/fl-studio-mobile/) for a compact composition/recording surface that remains compatible with a larger desktop workflow.
- [Downloads](https://www.image-line.com/fl-studio/download) and [news](https://www.image-line.com/news) for current platform/update context.

## Product lessons translated into Poietek requirements

| Observed product strength | Original Poietek requirement | Implementation in this slice |
| --- | --- | --- |
| Fast channel-and-step pattern construction | Patterns contain named channels, explicit steps, probability, velocity, micro-timing, length and routing targets | `composition-workflows/contracts.ts` and `patterns.ts` |
| Pattern, audio and automation material can be arranged together | Arrangement lanes accept typed clip sources; free lanes may mix kinds and bound lanes validate their source | `ArrangementLane`, `ArrangementClip`, placement and validation |
| Piano-roll tools turn rough ideas into controlled MIDI | Deterministic chord detection, strum, chop, glue and scale-constrain functions return new clip records | `pianoRoll.ts` |
| Automation is visible creative material | Versioned envelopes carry points, hold/linear/smooth curves and tension; evaluation is deterministic | `automation.ts` |
| Retrospective recording protects an unrecorded performance | The app may request recall only after an armed adapter reports a real stream and sufficient buffer | `captureRecall.ts` and disabled workbench recall state |
| A loop starter lowers blank-page friction | A seeded draft chooses only local source descriptors with explicit rights evidence and reports missing roles | `loopStarter.ts` |
| Preset-first browsing improves discovery | Library metadata must expose role, capability, availability and limitations before sound audition | existing Studio Library plus the new Idea Flow entry |
| Reusable graphs and macro surfaces improve modularity | Rack signal graphs and Macro Bus Containers remain original, serializable control models | existing rack contracts and rear-panel routes |
| Contextual assistance can perform routine actions | Future assistants must emit a previewable command plan with scope, evidence and undo—not mutate silently | retained AI policy; no automatic project mutation added here |
| Desktop and mobile should share work | One canonical project model is rendered through device-aware layouts; mobile is not a separate creative truth | existing device-aware shell and extension model |
| Editions should be understandable | Capability matrices must say production, prototype, adapter-required or unavailable | Studio Library, release gates and this status map |

## Implemented architecture

### Canonical composition extension

`org.poietek.composition-workflows` is a versioned extension on `PoietekProject`. It stores JSON-safe patterns, lanes, automation envelopes, capture intent/evidence, loop-starter drafts, song maps, lyrics, mix-scene snapshots and the active scene identifier. It stores no `AudioBuffer`, `MediaStream`, device handle or plug-in object. Extension reads validate the project ID and every source reference. Schema `1.1.0` migrates the earlier `1.0.0` shape with conservative defaults. Track-only scenes can be previewed and then committed through the active `ProjectSession`; unsupported target kinds remain fail-closed.

Pattern, lane and automation updates return new objects and increment the workflow revision. This is the foundation for project commands, autosave, undo/redo and future collaboration without allowing React component state to become durable truth.

### Idea Flow Workbench

The original rack unit provides five compact views:

1. **Pattern** — four editable 16-step channels whose bit patterns persist in rack parameters; the same controls are modelled by the canonical workflow core.
2. **Notes** — quantize, strum, chop and scale-constrain previews plus deterministic chord labels.
3. **Arrange** — an original mixed-lane presentation for pattern, audio and automation clip sources.
4. **Automate** — hold, linear and smooth envelopes with normalized values and target identifiers.
5. **Capture** — a visible arm-intent state and a disabled recall action until a real capture observation exists.

The device is available from the Rack library, Project and Production menus, default starter rack, Studio Library and the **Idea-to-Arrangement Lab** template.

### Truthful retrospective capture

Capture intent is not capture evidence. The state progresses as follows:

```text
disarmed -> armed intent -> observed adapter/stream/buffer -> recall request -> adapter-created asset
```

Only the final adapter completion may name a canonical audio asset. The UI never displays a fictitious waveform, sample rate, channel count or recalled recording. The implementation caps the observation at the configured maximum and rejects requests larger than the observed buffer.

### Rights-aware loop starting

The loop starter consumes descriptors supplied by a local project/content index. Each eligible descriptor must have an asset ID, creative role, BPM, duration, one of the accepted rights states and a non-empty rights-evidence reference. Selection is deterministic for a seed and role. The result reports whether later time-stretch or pitch-shift would be required, but it does not claim either process ran. Its render state remains `not_requested`.

No commercial loop, preset or recording is bundled by this work.

## Deliberate non-claims and future adapters

- The web UI does not yet place composition extension clips in the production arranger; the underlying typed model is ready for a `ProjectSession` command integration.
- Retrospective audio recall needs a continuously running, user-consented circular-buffer adapter. Arm intent alone does nothing to the microphone.
- Time-preserving stretch and pitch shift need measured DSP backends. The loop starter reports requirements instead of changing audio.
- Plug-in hosting needs the reviewed native scanner/sandbox/bridge. Browser code cannot host VST3, Audio Unit, AAX or CLAP binaries.
- Cloud sounds, backup, mastering, distribution and collaboration stay optional providers. Local save is primary success.
- Mobile layouts share project data, but signed iOS/Android packages remain platform-owned release gates.
- A contextual assistant may suggest or preview commands; execution requires explicit user acceptance and undo coverage.

## Five-star acceptance matrix

“Five-star” is an evidence gate, not a label assigned by aspiration. This slice raises the foundation but does not rewrite the repository's release score. Each area earns five stars only after these checks pass:

| Area | Five-star evidence required |
| --- | --- |
| Idea capture | create/edit/clone patterns; MIDI-record into channels; undo/redo; save/reopen; deterministic playback; latency and dropout tests |
| Note editing | selection gestures, full per-note properties, keyboard accessibility, preview/apply/revert commands, large-clip performance and MIDI round trips |
| Arrangement | drag/drop for all clip kinds, snap/grid, groups, make-unique, linked/free lane modes, crossfades and real automation playback |
| Sound and presets | fast indexed local search, previews, favorites/tags, missing-content recovery, original/licensed provenance and no redistributed content |
| Mixer and modular graph | validated DSP, plug-in sandbox, delay compensation, sidechains, buses, meters, crash recovery and session recall |
| Recording and recall | explicit permissions, real input/USB channel selection, monitored circular buffer, sample-accurate asset write, failure recovery and privacy tests |
| Assistance | scoped plan, before/after diff, preview, consent, cancellation, undo, offline-safe fallback and audit record |
| Cross-platform | same canonical project on web/PWA/Windows/macOS/Linux/iOS/Android; touch, keyboard, screen-reader, rotation and constrained-device tests |
| Reliability | autosave/recovery soak tests, schema migrations, media integrity, deterministic export and no-go release gates |
| Learning/support | first-song curriculum, contextual help, searchable manual, diagnostics, versioned troubleshooting and accessible examples |

## Verification coverage

`tests/composition-workflows.test.js` covers immutable patterns, mixed lane validation, canonical extension round trips, curve evaluation, chord detection, strum/chop/glue/scale tools, fail-closed capture and deterministic rights-aware loop drafts. `tests/rack-navigation.test.js` verifies the visible workbench, menu, template and default-rack integration.

The implementation is independent Poietek code. Any future competitive research must continue to cite public behavior, avoid copied expression, and preserve the capability/evidence boundary.
