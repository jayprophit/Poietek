# Cakewalk workflow abstraction for Poietek Studio

Status: implemented clean-room song-development and session-variation slice

Date reviewed: 2026-08-22

## Scope and clean-room boundary

This review covers the current Cakewalk product family, especially Cakewalk Sonar and Cakewalk Next. It studies public user workflows and translates useful general principles into original Poietek requirements. Poietek does not copy Cakewalk or BandLab source code, binaries, names, icons, screen designs, manuals, audio, presets, instruments, effects, effect chains or proprietary DSP. Cakewalk, Sonar, Next, ProChannel, AudioSnap, VocalSync and XSampler remain their owners' product identities.

External plug-ins and content remain user-licensed dependencies. “Royalty-free” access on another platform does not grant Poietek redistribution rights.

## Official source findings

### Product split and shared foundations

The [Cakewalk product overview](https://www.cakewalk.com/) presents two complementary desktops: Next is creation-focused and approachable; Sonar is the deeper recording, editing, MIDI, mixing and export environment. Both emphasize unlimited track foundations, visual arranging and project interchange, while Sonar adds professional channel processing, timing tools, ARA, oversampling/load balancing and large-session depth.

Poietek's lesson is not to ship two incompatible creative truths. It should provide one canonical project with an adaptive creator surface and deeper production workbenches. A beginner can hide complexity; an expert can reveal it without migrating the song to another format.

### Sonar

The [Sonar overview](https://www.cakewalk.com/sonar) highlights:

- multitrack capture, take lanes and comping;
- large-project Track Manager filtering;
- modular per-track/bus channel processing;
- timing alignment and transient-based editing;
- Mix Recall scenes for levels, pan, mute, solo and processor states;
- multi-track piano-roll editing and articulation maps;
- built-in step sequencing;
- high-DPI scaling, ARM64 support and performance work for dense plug-in sessions;
- project exchange with Next and optional BandLab integration.

The official [audio-preferences guide](https://help.cakewalk.com/hc/en-us/articles/41321725651993-Setting-Up-Your-Audio-Preferences-in-Cakewalk-Sonar) also reinforces a clear setup sequence: choose the driver model, select observed input/output devices, establish timing masters, then tune buffer size. Poietek already models requested versus observed devices and must continue to avoid claiming ASIO/WASAPI/Core Audio state from a browser.

The [Sonar tier comparison](https://help.cakewalk.com/hc/en-us/articles/49546667908121-Sonar-Free-Tier-vs-Membership-Tier) demonstrates an explicit entitlement matrix. Poietek's library and business architecture use implementation/capability gates instead of copying Cakewalk's tiers, prices, activation or membership model.

The official [BandLab instruments/effects FAQ](https://help.cakewalk.com/hc/en-us/articles/57178454202649-BandLab-Instruments-Effects-in-Cakewalk-Sonar-FAQ) describes categorized instruments, effects and chains, placement in tracks/buses/channel strips/clips, searchable browsing, previews and downloadable offline soundbanks. Poietek translates this into provider-neutral metadata, explicit download/provenance states, local-first availability and native plug-in gates.

### Next

The [Next overview](https://www.cakewalk.com/next) emphasizes a scalable distraction-reduced workspace, virtual keyboard input, visual song sections, nested track folders, streamlined MIDI editing, timeline lyrics, pads and sampler-first creation. The important product lesson is progressive disclosure: common creative actions remain obvious while detailed controls appear in context.

The official [Lyrics Track and Inspector guide](https://help.cakewalk.com/hc/en-us/articles/14203974274201-Using-the-Lyrics-Track-and-Inspector) separates timed lyric editing, an unsynchronized scratchpad and a transport-following prompter. Poietek adopts that information architecture using its own data model and UI.

The [Track View Options guide](https://help.cakewalk.com/hc/en-us/articles/14243513367961-Track-View-Options) shows song sections, lyrics, zoom/fitting and folder expansion as fast view operations. These are view changes rather than destructive edits.

The [XSampler guide](https://help.cakewalk.com/hc/en-us/articles/13327319097753-How-to-use-the-XSampler) reinforces browse/drag/record ingestion, project-local media copies, trimming, root-note selection, envelope/filter controls and gate/loop/one-shot modes. Poietek's existing Canvas Drum Grid, Grain Deck, Chop Lab and sample record/recall work cover much of this territory; production audio capture and pitch/time behavior remain adapter-gated.

The [track-types guide](https://help.cakewalk.com/hc/en-us/articles/44458346977561-Cakewalk-Next-Understanding-Track-Types) separates audio, instrument, sampler and pad-controller purposes. Poietek retains typed canonical tracks and original rack roles rather than hiding every behavior in one generic track.

## Gap analysis and implemented response

| Cakewalk strength | Existing Poietek foundation | Missing capability selected for this slice | Implementation |
| --- | --- | --- | --- |
| Alternate visual song structures | mixed arrangement lanes and canonical clips | reusable source sections and ordered variants | `songMap.ts` section/variant resolver |
| Timeline lyrics plus scratch ideas | scoring text concepts but no lyric document | timed lead/backing/direction cues and separate scratchpad | canonical `LyricDocument` and lookup by tick |
| Mix Recall and A/B exploration | undoable mixer settings, rack state and control models | comparable target snapshots with explicit application | difference/preview plans plus atomic `ProjectSession` track recall |
| Large-project track management | folders, jump-to-rack, searchable library | a compact folder/type/route focus surface | Session Variations Track Focus view |
| Simple creator surface plus deep DAW | device-aware shell plus production menus | dedicated progressive-disclosure workbench | four-view Session Variations device |
| Project interchange | canonical project and external interchange contracts | stable semantics independent of one vendor format | section/lyric/scene data stored in versioned extension |

## Canonical data model

The existing `org.poietek.composition-workflows` extension now also owns:

- `songSections`: named, typed references to source timeline ranges;
- `songArrangements`: ordered section identifiers that may repeat;
- `lyrics`: a private scratchpad and timed cues;
- `mixScenes`: named target snapshots containing gain, pan, mute, solo and processor-state references.

All records are JSON-safe and project-bound. Validators reject missing section references, duplicate identifiers, invalid time ranges, invalid gain/pan values and duplicate mix targets. Arrangement resolution creates a new playback order while leaving every source section coordinate unchanged.

Processor snapshots are references, not arbitrary plug-in blobs. A future native plug-in adapter must define compatible serialization, versioning, missing-plug-in behavior and sandbox recovery before it can restore a processor state.

Composition workflow schema `1.1.0` includes a reader migration for the earlier `1.0.0` shape. Existing pattern, lane, automation, capture and loop-draft state is retained while absent song, lyric, scene and active-scene fields receive conservative defaults.

`projectCommands.ts` connects sections, arrangements, lyric cues and mix scenes to the canonical `PoietekProject`. These mutations can run through `ProjectSession`, so validation, serialized autosave, bounded history, undo and redo cover them. The rack's Mix Scenes view now captures its selected track-only snapshot, upserts it into the active project and applies it as one atomic session mutation. Applying a scene accepts only real canonical track targets with gain, pan, mute and solo values. It rejects bus/master targets and any processor reference until those targets and processor-state adapters exist.

## Session Variations Workbench

The original Poietek rack unit exposes four progressively disclosed views:

1. **Song Map** presents radio and extended section orders as non-destructive variants.
2. **Lyrics** presents timed lead/backing lines, a transport-follow intent and a separate private scratchpad.
3. **Mix Scenes** compares two target sets, shows the exact recall plan and, when canonical tracks exist, exposes an explicit apply action plus project undo and redo.
4. **Track Focus** filters a representative large-session list by folder, name, type or route.

The device is available in the production rack catalog, Project/Production/Devices menus, Studio Library and the **Idea-to-Arrangement Lab** template.

## Effects, instruments and routing lessons

Poietek's original effect/module catalog already covers EQ, dynamics, delay, reverb, modulation, gain/stereo, split/merge, mixing, monitoring and external plug-in-host intent. Cakewalk's public material reinforces the following acceptance requirements:

- processors must be searchable by function and legal availability;
- an insert must declare whether it belongs to a clip, track, bus or master path;
- channel chains need reorder, bypass, A/B, preset and undo semantics;
- sidechain sources must be explicit graph edges;
- oversampling and load balancing must be measured engine capabilities, never UI toggles that do nothing;
- spectrum displays must read a real signal at a named probe point;
- downloadable instruments must expose pending/available/missing/offline states;
- missing processors must preserve the project and provide a replacement path.

No new DSP claim was made in this slice. The existing native-core boundary remains the correct place for validated real-time kernels; hosted third-party effects remain a future native sandbox concern.

## Five-star acceptance gates

This implementation improves the foundation but does not award Poietek a fictional five-star completion score. Five stars in these areas requires evidence:

| Area | Required evidence |
| --- | --- |
| Song variations | section creation/resize/rename, drag reorder, repeated sections, variant playback, clip-boundary rules, undo/redo, save/reopen and export parity |
| Lyrics | keyboard-accessible editing, word/line timing, import/export, prompter follow, scroll/zoom, Unicode, long-song performance and print/share permissions |
| Mix scenes | capture from real mixer state, target scope options, plug-in compatibility, preview/apply/revert, seamless switching policy, undo, automation interaction and missing-target recovery |
| Track focus | canonical nested folders, fast filtering across thousands of tracks, routing-source/destination selection, saved views, keyboard navigation and screen-reader semantics |
| Recording/comping | observed driver/device setup, record arming, take lanes, swipe comping, punch/loop capture, latency compensation, dropout recovery and destructive-action protection |
| Channel processing | real DSP, meters/probes, sidechains, oversampling evidence, delay compensation, sandbox recovery, preset provenance and render parity |
| Interchange | documented neutral schema, audio/MIDI/tempo/lyrics/sections mapping, missing-content report, round-trip fixtures and version migration tests |
| Adaptive experience | one project across desktop/tablet/mobile/web, progressive disclosure, high-DPI/vector-safe UI, touch targets, shortcuts and accessibility audits |

## Verification

The composition workflow tests cover source-preserving alternate song orders, lyric scratchpad/cue separation, transport-time lyric lookup, mix-scene differences and previews, the `1.0.0` to `1.1.0` migration, atomic scene capture/upsert/application, canonical `ProjectSession` save/undo/redo behavior, successful track recall and fail-closed bus/processor recall. Rack navigation tests cover all four visible views, the project-session bridge, and menu, catalog and template integration.

Future Cakewalk research should stay on official public sources, distinguish a behavior from its protected expression, and implement only Poietek-owned designs with testable evidence.
