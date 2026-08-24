# MOTU and Digital Performer workflow abstraction for Poietek Studio

Date reviewed: 2026-08-22
Scope: Digital Performer 11, Performer Lite, the included instrument/effect model, sequence and scoring workflows, MOTU audio/MIDI hardware relationships, setup, downloads and support

## Clean-room boundary

This document translates general workflow lessons from MOTU's official public product pages, current manuals, support material and product releases into original Poietek requirements. It does not copy Digital Performer, Performer Lite, CueMix, MOTU hardware, their names, visual design, source code, binaries, presets, samples, manuals, device profiles or proprietary DSP. No commercial MOTU asset was downloaded or incorporated.

Poietek's implementation uses its own names, TypeScript data model, visual treatment and validation rules. Product and feature names below identify research sources only.

## What the official ecosystem teaches

| Official MOTU area | General product lesson | Existing Poietek foundation | Poietek response or evidence gate |
|---|---|---|---|
| Digital Performer project structure | A serious composition/post project can contain several independent sequences, combine them into larger programs and reuse common instrument/effect resources. | Song-map variations existed, but they rearranged one shared section pool rather than owning independent timelines. | Added a canonical Sequence Assembly workflow with independent song, picture, live and scratch sequences, deterministic program chains and reusable resource assignments. |
| Conductor Track | Tempo, meter, key and markers belong together and must remain editable as sequence-owned musical time. | The project had a global tempo map plus score/picture models, but no independent conductor map per cue. | Every assembly sequence now owns sorted tempo, meter, key and marker event collections with beat-zero invariants and range validation. |
| Chunks/Songs and shared racks | Non-destructive assembly is stronger when source sequences are referenced instead of destructively moved or duplicated. Shared processing needs one durable source of intent. | Mix scenes and rack modules existed, but there was no project-level relationship between an independent cue and a shared resource. | Program entries reference sequences by ID; resource links reference original, provider-neutral resource records. No plug-in instance or audio route is invented. |
| Clips window and linear tracks | Linear arrangement and scene/clip triggering can coexist; track playback and clip playback need explicit precedence. | Idea Flow already models pattern and mixed-lane creation. | Retained Idea Flow as the clip/pattern surface. Sequence Assembly is the project/program layer, avoiding a second competing clip launcher. |
| QuickScribe, articulation maps and MPE | Score symbols, expressive playback maps and MIDI expression should remain connected while allowing library substitution. | Score & Parts Workbench already stores written notes, articulations, layouts and part intent. | Kept the score model provider-neutral; MusicXML, expression playback and library adapters remain separately validated capabilities. |
| Retrospective capture, punch and multiple takes | Capture should be forgiving, versioned and recoverable rather than dependent on perfect transport timing. | Retrospective MIDI intent exists; live capture planning and ADR take references exist. | No fake take engine was added. Track comping, punch guard, retrospective audio buffers and real capture remain native-engine work with explicit evidence gates. |
| Mixing, automation and plug-ins | A consolidated editing/mixing surface can adapt to the task, while plug-in scanning and formats remain platform responsibilities. | Rack, mixer, automation intent, control room and plug-in placeholders already exist. | Shared resource records may name an original Poietek processor or an external slot, but `shared_processor_host` must be observed before processing is claimed. |
| Performer Lite | A streamlined entry experience can use the same durable core model as the deeper workstation. | Templates and guided starter projects exist. | Added a one-button original starter assembly and a dedicated Multi-Cue Sequence & Shared Rack template rather than creating a separate incompatible project format. |
| MOTU audio interfaces and CueMix | Hardware control, low-latency cue mixing, loopback, mobile control and physical I/O are device capabilities, not browser UI claims. | Hardware inventory, Live Session Hub, monitor intent, mapper and control room already separate requested from observed state. | Sequence Assembly exposes monitor and shared-host requirements but does not emulate CueMix or claim a MOTU device. Interface routing remains owned by reviewed native adapters. |
| Support, downloads and activation | Compatibility, firmware, drivers, plug-ins and product authorization need traceable versions and platform-specific instructions. | Device-aware access, diagnostics, provider manifests and provenance/quarantine models exist. | No generic “works with MOTU” badge was added. A future device adapter must retain product, driver/firmware, OS, capability and observation evidence. |

## Official workflow evidence

The current [Digital Performer 11 Getting Started guide](https://cdn-data.motu.com/manuals/software/dp/v113/Digital%20Performer%20Getting%20Started.pdf) demonstrates a multi-sequence project with a master fader held in a reusable rack and describes separate editing and mixing layouts. It also documents Conductor Track mode for changing tempo, meter and key through a sequence.

MOTU's [Digital Performer User Guide](https://cdn-data.motu.com/manuals/software/Digital%20Performer%20User%20Guide.pdf) describes project “chunks” as sequences, songs or reusable racks, sequences/songs cued for playback, and songs assembled by chaining or stacking sources. The same guide treats the Conductor track as a permanent sequence track containing markers, meter, tempo and key information. Poietek abstracts those broad project behaviors as Project Sequences, Programs, Conductor Maps and Shared Resources; it does not reproduce the MOTU terms or interface.

The current official guide also documents the coexistence of linear tracks and clips/scenes, retrospective MIDI recording, multiple audio takes, cycle recording, punch workflows, input monitoring and POLAR-style loop capture. Poietek already covers pattern/clip ideation, retrospective MIDI intent, live capture plans and ADR take references. Actual input buffering, retrospective audio, comping and punch-safe recording still require a real-time native audio engine.

MOTU's official [Digital Performer 11 release](https://cdn-data.motu.com/marketing/motu_products/software/dp11/motu-dp11-pr.pdf) identifies articulation maps, MPE support, Audio Retrospective Record and a redesigned sample instrument as core DP 11 additions. The [Digital Performer Plug-ins Guide](https://cdn-data.motu.com/manuals/software/dp/v111/Digital%20Performer%20Plug-ins%20Guide.pdf) documents a broad bundled instrument/effect catalog and separates factory, user, shared and project sample locations. Poietek retains original instruments/effect control models and provenance-aware library concepts; it does not import the MOTU processors, samples or presets.

The [Performer Lite User Guide](https://cdn-data.motu.com/manuals/software/perflite/Performer_Lite_11_User_Guide.pdf) presents a streamlined environment built from the same workstation foundation. That supports Poietek's decision to keep one canonical project schema and offer simpler templates/workbenches rather than a second reduced-fidelity file format.

For hardware, MOTU's official [828 product release](https://cdn-data.motu.com/marketing/motu_products/audio_interfaces/828/motu-828-pr.pdf) describes CueMix 5 control across desktop/mobile devices, loopback, re-amping, word clock, MIDI and bundled entry software. These are useful integration categories, but Poietek must observe every physical input, output, clock, loopback stream and remote-control permission through a native adapter. The public [downloads](https://motu.com/en-us/download/) and [technical support](https://motu.com/techsupport) areas reinforce that drivers, firmware and compatibility are product- and platform-specific.

## Implemented architecture

The new `org.poietek.sequence-assembly` project extension contains:

- independent project sequences with purpose, duration, track references, status and notes;
- one conductor map per sequence with tempo, meter, key and marker events;
- project-level shared resources for instruments, effect returns, monitor intent and external plug-in slots;
- explicit many-to-many links between sequences and shared resources;
- non-destructive programs containing ordered sequence references, repeats, count-ins and stop/continue boundaries;
- deterministic program resolution with exact cumulative beat positions;
- a provider-neutral JSON planning manifest that explicitly disclaims audio/render claims;
- strict project identity, revision, duplicate-ID, missing-reference, track-reference and musical-range validation;
- canonical project persistence, mutation transactions and compatibility with project undo/redo history.

The rack-facing Sequence Assembly Workbench provides five responsive views:

1. Sequences — select and inspect independent song, picture, live and scratch timelines.
2. Conductor — review tempo, meter, key and marker lanes and save an original tempo turn.
3. Shared rack — inspect reusable resource assignments and their engine/capability states.
4. Program — resolve an ordered program into exact source passes and boundaries.
5. Readiness — separate local planning readiness from shared-host, transport and render evidence, and export only the planning manifest.

## Deliberately not claimed

This pass does not claim:

- Digital Performer, Performer Lite, CueMix or MOTU project/device compatibility;
- audio/MIDI capture, retrospective audio, punch guard, takes or comping;
- clip-scene transport, sequence playback, hardware synchronization or a frame-accurate clock;
- AU, VST or other external plug-in loading;
- MOTU instrument, effect, sample, preset or library content;
- low-latency monitoring, loopback, re-amping, mobile device control or audio-interface routing;
- MusicXML, MIDI, AAF, video or audio rendering from the planning manifest.

Those capabilities must be added through licensed, reviewed and tested adapters. A saved control model is never presented as observed hardware or rendered media.

## Next highest-value slices

1. A native real-time take engine with capture evidence, cycle takes, non-destructive comp decisions and punch-safe buffering.
2. A transport adapter that consumes per-sequence conductor maps and reports clock/sync observations.
3. A shared processor host that isolates third-party plug-ins, preserves provider/version identity and reports crash/latency state.
4. MusicXML plus MIDI interchange fixture suites connecting Score & Parts, conductor maps and articulation intent.
5. Audio-interface adapters that map observed I/O, loopback, cue buses and device clock without vendor-specific claims in the canonical project.
