# Tracktion and Waveform workflow abstraction

Research date: 2026-08-23
Implementation target: Poietek Studio Performance Canvas 1.0
Method: official public product, feature, training and developer material; clean-room behavioral abstraction only

## Purpose and boundary

This review studies the current Tracktion ecosystem to identify general workflow
principles that can improve Poietek. It does not reproduce another product. No
Tracktion code, binaries, media, presets, DSP, interface artwork, branding,
project formats or commercial content are included. Product names below identify
research sources only.

Poietek keeps its own names, canonical project model, visual language, command
history, capability boundaries and original musical starter data. Tracktion Engine
is an open-source C++ option worth evaluating separately, but it was not imported,
vendored or linked during this slice. Any future evaluation must include licence,
security, maintenance, binary-size, real-time and project-migration review.

## Current official ecosystem map

### Waveform Free and Waveform Pro 14

The current family uses one DAW foundation that can grow from Free through
feature expansions to Pro. The official comparison divides advanced capability
into focused packs: Recording Engineer, MIDI Producer, Synth Pack, DJ Mix Tools,
Pro Video, Launcher and Multi Channel. This is useful product architecture: one
project remains intelligible while capabilities expand, and unavailable features
can be explained as explicit boundaries rather than hidden failures.

The most reusable workflow ideas are:

- one uncluttered edit surface with a unified properties/actions relationship;
- a browser that crosses plug-ins, presets, racks, samples, clips and tracks and
  adds tags, favorites and smart lists;
- linear arrangement and non-linear launching inside one project;
- slot recording, launch quantization, gate/toggle/repeat behavior, legato,
  follow actions, controller operation and performance capture;
- clip-level automation shared by arranger and launcher clips;
- a section arranger for safe structural experimentation;
- quick actions and user macros for repeatable workflows;
- plug-in sandboxing so a third-party failure does not have to end the host;
- explicit multichannel, video, DJ/remix and stem-separation capability groups;
- MIDI probability, randomize/humanize, strum, chord, pattern and drum-grid tools;
- a free core with built-in instruments, effects and utilities, plus documented
  upgrade paths rather than separate incompatible applications.

The official Waveform Free page currently describes four built-in instruments,
14 audio effects, eight MIDI effects and 11 utilities. The Pro page describes 10
built-in instruments, 38 audio effects, 10 MIDI effects and 11 utilities, with
additional instruments, processors and sound packs. These counts are catalogue
facts, not a requirement for Poietek to copy a particular inventory.

### Instrument family

Tracktion's current navigation presents BioTek, Collective, F.'em, the Dan Dean
and RetroMod collections, Abyss, Atmosia, Chop Suey, Horizen, Hyperion, KULT,
Kontrast, Modeler, MYTH, Novum, SpaceCraft, Theia, Waverazor, Attracktive and
Zyklop. The products cover sample playback, virtual analogue, FM, wavetable,
granular, resynthesis, modular and modelled approaches.

The important abstraction is not a list of synth engines. Across representative
products, the family repeatedly combines:

1. a fast, approachable performance or Easy page;
2. deeper sound-design pages behind it;
3. a few promoted macro controls and XY/gesture surfaces;
4. drag-and-drop source or module assignment;
5. flexible modulation and automation exposure;
6. searchable, tagged presets and optional expansions;
7. CPU efficiency and cross-host plug-in formats;
8. randomization that can lock the parts the user wants to preserve.

BioTek 3 demonstrates the Easy/deep split, promoted parameters and XY
performance. MYTH emphasizes resynthesis, a left-to-right modular chain and
section-locking during variation. Novum emphasizes drag-and-drop sample
transformation, granular layers and independent timbral/time shaping. These
support Poietek's existing Motion Matrix, macro containers, original Sound Atlas
and local asset graph; they do not justify inventing unimplemented DSP.

### Effects, live tools and content

The current effects family includes the DAW Essentials collection and the LOVE,
HATE and free SOL creative effects. Representative design patterns are curated
module chains, reorderable processing, per-module presets, advanced panels and
controlled randomization. Poietek already has ordered control-model effects,
offline process recipes and a modulation matrix; native DSP and plug-in hosting
remain separate evidence-gated work.

StageBox is a focused live plug-in host and set-list manager. Its broadly useful
ideas are quick song/sound navigation, reusable instrument resources, layers and
splits, song-scoped mappings, flexible set reordering and clear live-performance
status. Poietek's Sequence Assembly and Live Session Hub already cover the
set/program and capture sides. Performance Canvas fills the missing improvisation
and launcher-to-arrangement bridge without merging every live task into one view.

Tracktion's sound packs, construction kits, demo songs, free players and training
materials demonstrate the value of searchable content, clear compatibility,
audition, documentation and expansion metadata. Poietek will use original,
licensed or public-domain content with explicit provenance; no Tracktion media or
preset data is copied.

### Developer foundation

Tracktion presents Tracktion Engine as a modular modern-C++/JUCE engine with a
high-level time-based document model, playback/render APIs, platform coverage,
audio and MIDI editing, automation, modifiers, modular plug-in patching,
recording, comping, control surfaces and rendering. It also presents Pluginval as
an open-source cross-platform validation tool.

The architectural lesson aligns with Poietek's existing direction:

- serializable project truth must be independent of the UI;
- the real-time audio engine must be an adapter behind that model;
- edit/play/render operations need one semantic contract;
- desktop and mobile shells should share project data while reporting different
  runtime capabilities honestly;
- third-party plug-ins need scanning, validation, quarantine and crash isolation;
- C++ audio work belongs in the native layer, not in React component state.

No decision to adopt Tracktion Engine is made here. Poietek already contains an
original native-core boundary and Tauri delivery shell. A future engine decision
must be benchmark- and licence-led rather than brand-led.

## Poietek gap analysis

| Tracktion/Waveform idea | Poietek before this slice | Decision |
| --- | --- | --- |
| Tagged cross-content browser | Studio Library and Rack catalogue exist, with implementation and provenance states | Preserve; add compatibility, favorites and smart-list persistence later |
| Easy/deep instrument views | Rack controls, macro container and Motion Matrix exist | Preserve; promote only real parameters exposed by an engine |
| Pattern, MIDI and automation creation | Idea Flow, Note Canvas, Beat Loom and Motion Matrix exist | Preserve; reuse their project-owned sources |
| Section arranger and alternate structures | Session Variations and song-map variants exist | Preserve |
| Quick actions/macros | Action & Extension Workshop exists with allowlisting, dry runs and atomic undo | Preserve |
| Live set and shared resources | Sequence Assembly and Live Session Hub exist | Preserve |
| Clip/scene launching | No canonical grid or scene launch events | Implement Performance Canvas |
| Performance capture into linear arrangement | Explicit roadmap gap in the Bitwig review | Implement atomic canonical arrangement commit |
| Sample-accurate live scheduler | No observed dedicated runtime adapter | Keep unavailable and name required capabilities |
| Factory controller mappings | Generic mapper exists, but no verified launcher adapter | Keep unavailable until observed |
| Plug-in sandboxing | Security and native-host boundaries exist; host is not implemented | Retain as native roadmap work |
| Multichannel/video/DJ/stems | Intent/workbenches exist in focused modules; several engines are gated | Do not duplicate or overclaim |
| Commercial instrument/effect/content catalogue | Original prototypes and planning catalogue exist | Grow only with original/licensed content and verified DSP |

## Implemented Performance Canvas 1.0

### Canonical model

The versioned extension key is `org.poietek.performance-canvas`. It stores only
JSON-safe project data:

- musical lanes mapped to canonical arrangement lane IDs;
- ordered scenes with color, follow action and follow duration;
- slots that reference canonical composition patterns or audio asset IDs;
- trigger, gate, toggle and repeat launch intent;
- loop and legato intent;
- global bar length and launch quantization ticks;
- active slot IDs per lane;
- rehearsal-capture state and deterministic launch/stop events;
- the most recent arrangement commit ID.

The model never stores DOM nodes, Web Audio objects, streams, native handles,
plug-in instances or arbitrary executable scripts.

### Original starter canvas

The one-step starter command atomically creates:

- four original scenes: Spark, Drive, Air and Resolve;
- three original lanes: Pulse, Low Current and Harmony Light;
- 12 original note patterns in the existing composition extension;
- three matching canonical arrangement lanes;
- 12 slots using different launch modes, lengths and follow behavior.

Starter initialization is one `ProjectSession` mutation and therefore one undo
point. The patterns are musical intent, not rendered audio and not copied preset
content.

### Rehearsal and capture behavior

Launch requests are quantized with integer project ticks. Scene launch writes one
event per populated lane. Toggle can stop an already active slot. Lane stop writes
an explicit stop event. Follow behavior creates a planning-only target and tick;
it never pretends a timer or UI animation is a sample-accurate scheduler.

The visible cursor is labelled a manual rehearsal cursor. Moving it by a bar is a
deterministic planning action, not transport playback. Real microphone/USB audio
recording remains in Arrange and continues to use the existing real ingestion
path.

### Arrangement bridge

A stopped take can be translated into ordinary `ArrangementClip` records:

1. events are ordered deterministically;
2. each launch ends at the next event for its lane or the take stop;
3. looping slots fill the captured interval;
4. non-looping slots stop at their declared source length;
5. clip sources and destination lanes are revalidated against the canonical
   composition extension;
6. the complete plan is committed through one project mutation;
7. project undo removes the complete commit and restores the stopped take.

This is a real project edit. It does not render audio, run plug-ins or overwrite
source patterns.

### Runtime evidence contract

Audible performance remains unavailable until an observation supplies the exact
capabilities required by the current canvas:

- `sample_accurate_clock`;
- `pattern_playback` when pattern slots are present;
- `audio_clip_playback` when audio slots are present;
- `follow_scheduler` when automatic follow behavior is present;
- `controller_input` for mapped hardware operation.

Capability names are not evidence. A future adapter must provide observations,
tests, underrun/latency reporting and lifecycle cleanup before the UI may show
live playback as ready.

## User path

1. Open Rack → Production → Ideas, Patterns & Automation → Performance Canvas &
   Scene Capture, or load the Performance Canvas & Arrangement Rig template.
2. Choose Create starter canvas.
3. Choose Capture.
4. Launch a complete scene or individual slots.
5. Advance the rehearsal cursor and launch another scene or stop a lane.
6. Stop take.
7. Open Arrange inside the device to inspect the exact clip plan.
8. Commit captured performance to arrangement.
9. Use project undo/redo to verify the atomic edit.
10. Open Readiness to see which live/audio/controller capabilities remain gated.

## Evidence-based five-star target

Poietek must not assign itself five stars merely because a competitor has a
feature. The current slice can be rated only against observable acceptance
criteria.

| Area | Current evidence | Five-star gate |
| --- | --- | --- |
| Canonical project model | Versioned, validated, local, JSON-safe and cross-project guarded | Met for this slice |
| Scene/slot control semantics | Quantization, modes, active state, stop events and follow plans are deterministic | Met for this slice |
| Arrangement capture | Plan and atomic commit are tested with undo | Met for this slice |
| Responsive Rack workflow | Four focused views, template, menus, catalogue and phone-safe horizontal canvas | Requires completed visual/accessibility matrix |
| Audible live performance | No sample-accurate adapter observed | Not met |
| Hardware controller operation | No launcher/controller adapter observed | Not met |
| Audio-slot recording | Existing Arrange recorder is real; direct record-to-slot handoff is not implemented | Not met |
| Native plug-in hosting/sandboxing | Architecture only | Not met |
| Original production content | Original note starter exists; broader cleared library is incomplete | Not met |
| Cross-platform deployment | Web/PWA and Tauri configuration exist; signed/store packages require owner infrastructure | Partially met |

The feature earns strong evidence for its local control and arrangement bridge.
The application as a whole does not yet earn five stars across every category.
That rating remains conditional on live-runtime, controller, content, accessibility,
native-host, performance and deployment evidence.

## Next implementation priorities

1. Add a real audio-asset-to-slot assignment and direct post-record handoff from
   the existing recorder without duplicating media.
2. Implement a native sample-accurate launch scheduler with cancellation,
   pre-roll, underrun reporting and transport synchronization.
3. Add reviewed controller profiles through the existing mapper and capability
   observation model.
4. Share clip automation between arrangement and performance slots.
5. Persist browser favorites, tags, compatibility and smart lists.
6. Add plug-in scan/validation/quarantine only when the native host exists.
7. Benchmark the original native core against suitable C++ engines before any
   dependency adoption.

## Official research sources

- [Waveform Free](https://www.tracktion.com/products/waveform-free)
- [Waveform Free features](https://www.tracktion.com/products/waveform-free-features)
- [Waveform Free expansions](https://www.tracktion.com/products/waveform-free-expansions)
- [Waveform expansion comparison](https://www.tracktion.com/products/waveform-compare-expansions)
- [Waveform Pro](https://www.tracktion.com/products/waveform-pro)
- [Waveform Pro features](https://www.tracktion.com/products/waveform-pro-features)
- [Waveform Pro content](https://www.tracktion.com/products/waveform-pro-content)
- [Waveform version comparison](https://www.tracktion.com/products/waveform-pro-buy)
- [Waveform training videos](https://www.tracktion.com/training/videos)
- [Tracktion manuals](https://www.tracktion.com/training/manuals)
- [BioTek 3](https://www.tracktion.com/products/biotek)
- [F.'em](https://www.tracktion.com/products/f-em)
- [MYTH](https://www.tracktion.com/products/myth)
- [Novum](https://www.tracktion.com/products/novum)
- [LOVE](https://www.tracktion.com/products/love)
- [HATE](https://www.tracktion.com/products/hate)
- [StageBox](https://www.tracktion.com/products/stagebox)
- [Tracktion sound packs](https://www.tracktion.com/products/sound-packs)
- [Tracktion Engine](https://www.tracktion.com/develop/tracktion-engine)
