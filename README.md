  # Poietek Studio [Studio Daw Station - SDS]

Poietek Studio is the production migration of the Studio DAW Station (SDS): a
local-first creative audio workspace that preserves the useful hardware/rack UX
while moving durable projects, media, playback and platform capabilities into a
versioned architecture.

It is one application with device-aware access points. On launch it detects the
active desktop, tablet, mobile or other form factor plus touch/pointer,
orientation and browser/installed/native surface, then applies only that device's
layout and available capabilities. The canonical project remains the same across
every access point.

The application now opens in the **Arrange** desk: real imported audio, stored
waveforms, clip editing and the track-linked console. Select **Rack** (or press
F6) for the modular device stack and rear patching; press F7 to return to the
arranger. This preserves the tactile rack workflow while making the canonical
song timeline the center of the production experience.

The bundled Sound Atlas contains original sound-design recipes and a procedural
one-shot kit. It does not include copied commercial factory banks, presets or
recordings. Designs that require new multisampling or unfinished engines are
labelled accordingly in Studio Setup.

## Current working vertical slice

Open the application in **Arrange**. The production workspace can create/open
local projects, import and decode real
audio, persist media, display real waveform peaks, place clips on the timeline,
play/pause/stop/seek, save/reopen, undo/redo and run honest basic PCM health
checks. Recording, offline rendering, PCM WAV export and crash recovery are
implemented as core services and are the next controls to wire into this screen.

Choose **Studio Setup** in the top menu or compact navigation drawer to configure
global audio, MIDI/sync, recording, editing, file/recovery, plug-in, appearance,
privacy and profile settings. The setup window also contains the honest module
catalog and repeatable local benchmark. Requested driver settings remain
requests until a real browser/native adapter reports what the device accepted.
When opened as the native desktop application, the shell now inventories real
operating-system audio and MIDI endpoints at startup and displays them separately
from browser-selectable devices. This scan is read-only: native audio streams,
native MIDI connections, ASIO/Core Audio/JACK selection and measured latency are
still explicit next-stage engine gates rather than fabricated working features.

Open **Ecosystem** and select **Development Library** to inspect the complete
attached requirements crosswalk: Volumes 01–20, the proposed fifty-volume parts,
Appendices A–E and Creative OS Volumes 51–53. Search results show what is working,
what is only specified, which professional volume owns it and what real gate
remains.

Select **Industry qualification** in the same screen for the evidence-based
comparison across all thirteen product systems and fourteen professional
volumes. The current baseline is 53/100 (2.5/5.0), with zero lanes falsely
labelled five-star complete. Every card links its official reference set, shows
current repository evidence and states the acceptance work needed to reach 5.0.

Select **Release control** for the separate fail-closed public-use decision.
This register covers product, audio, recovery, PWA, desktop, mobile, security,
privacy/legal, accessibility, cloud/collaboration, commerce, rights/publishing,
AI and release operations. The current decision is **NO-GO**: 27 of 28 gates
still require implementation or acceptance evidence. There is no publish or
override control in the application.

Select **Production workflows** in Ecosystem for the cross-app map covering
scoring, MIDI logic, monitoring/cue control, spectral and offline editing,
picture/dialog post, immersive routing, mastering/delivery and remote recording.
The Rack library exposes the same original Poietek production modules, and the
**Score to Picture & Delivery Rig** template connects them into a starting
workflow. The score foundation serializes players, flows, measures, written
pitches, articulations and parts in a versioned canonical-project extension;
engraving, MusicXML, codecs, renderers, physical routes and remote providers
remain explicitly adapter-gated.

Choose **Picture & Dialog Post** for the deeper clean-room Nuendo post-
production pass. Its five rack views now store SMPTE ADR/Foley/review cues,
talent-overlay text, explicit rehearse/record-ready/review intent, references to
real project audio takes, scene/take/tape match proposals, deterministic
preview-before-apply ReConform changes and a chronological local CSV cue sheet.
Unsafe picture revisions fail closed, stale previews cannot apply, and a safe
ReConform is one canonical `ProjectSession` undo point. The **Dialog, ADR &
Foley Post Rig** connects the workbench to the timeline, spectral/offline tools,
mixing, monitoring and delivery foundations. Video decode, frame clock, live ADR
capture, AAF/EDL/TTAL import, intelligibility/loudness measurement, immersive
rendering and media delivery remain visibly adapter-gated.

Choose **Sequence Assembly Workbench** for the clean-room MOTU and Digital
Performer ecosystem abstraction. It adds independent song, picture, live and
scratch sequences, per-sequence conductor maps, reusable shared-resource
assignments, deterministic program chains and a planning-only manifest. Audio
transport, shared plug-in processing, hardware synchronization and rendering
remain evidence-gated. The **Multi-Cue Sequence & Shared Rack Rig** connects the
new project layer to scoring, picture, instruments, effects, mixing, monitoring
and delivery foundations.

Choose **Batch Delivery Workshop** for the clean-room Batchy & Friends workflow
abstraction. It turns canonical project audio into a reusable provider-neutral
recipe, any number of per-source deliverables, portable naming tokens and a pure
dry run with containment and collision checks. Existing paths default to
preserve-and-skip, versioned outputs are deterministic, and replacement remains
explicit intent. A one-file pilot must receive preview-render evidence and be
approved before a complete batch can reach an evidenced native adapter. The
**Safe Batch Delivery Rig** connects this coordinator to the single-file process
chain, monitoring and standards-gated mastering foundation. Browser controls do
not claim DSP, plug-in hosting, codec encoding, loudness measurement, file writes
or completed delivery.

Open **Rack** and choose **Idea Flow Workbench** for the composition foundation
inspired by the strongest general workflow lessons from Image-Line's public
product material. The original Poietek device combines durable multi-channel
patterns, deterministic chord/note tools, mixed pattern/audio/automation lanes,
automation curves and retrospective-capture intent. Recall stays disabled until
a real adapter reports a live stream and sufficient buffer; local loop drafts
accept only assets with explicit rights evidence and never claim that stretch or
pitch processing occurred. The **Idea-to-Arrangement Lab** starter template
connects this workbench to sampling, synthesis, effects, mixing and monitoring.

Choose **Session Variations Workbench** for the complementary song-development
layer derived from a clean-room review of Cakewalk Sonar and Next. Its original
Poietek views cover reusable song sections and alternate orders, timeline-linked
lyrics with a separate scratchpad, A/B mix-scene differences with explicit
preview-then-apply track recall, and large-session track filtering. A mix scene
never silently mutates the project or invents a plug-in state. When the active
project has tracks, the rack can save and apply the selected track-only scene
through `ProjectSession`, with dedicated project undo and redo controls.
Canonical composition commands now run through the same validated project and
`ProjectSession` boundary as production edits. Track-only mix scenes without
processor blobs can therefore save, apply, undo and redo; bus, master and
processor-state recall fail closed until their real project paths and adapters
exist. Composition extension schema 1.1 migrates the earlier 1.0 shape without
discarding pattern or automation work.

Choose **Live Session Hub** for the clean-room PreSonus ecosystem abstraction.
Its four rack views coordinate a durable mic/USB capture plan, deterministic
source-to-track naming handoff, evidence-gated virtual soundcheck, least-
privilege engineer/performer/observer policies and explicit endpoint/version
compatibility. The **Live Capture & Soundcheck Rig** starter template connects
the hub to the timeline, console and cue monitor. Saved policy is never presented
as a connected participant, and no device, route, stream, recording, playback or
interchange capability is claimed without adapter evidence.

Choose **Tracking Console & Capture Paths** for the clean-room Universal Audio
and LUNA workflow abstraction. It connects microphone, instrument and USB source
intent to canonical audio tracks while keeping monitor-only, cue-only and
record-processing stages separate. Routes can request a clean or processed
record path, source controls remain explicit hardware requests, and setup
snapshots preview their diff before one-step project recall. The **Capture Paths
& Cue Recall Rig** combines the console with the timeline, Live Session Hub,
mixer and control room. Active capture, monitoring, processor execution, device
control and latency are never claimed without returned adapter evidence.

Choose **Take Studio & Comp Builder** for the clean-room Apple Logic Pro and
Creator Studio workflow abstraction. It discovers only real canonical audio
clips with aligned project ranges, preserves each as a take lane, lets a creator
choose the source for each contiguous comp segment, validates exact media
offsets and destination collisions, then commits ordinary canonical audio clip
references while muting the source takes. The complete commit is one
`ProjectSession` undo point. The **Vocal Takes & Comping Rig** connects tracking,
comping, arrangement, vocal-edit planning, mixing and cue monitoring. Automatic
loop recording, audible swipe audition, time/pitch correction and flatten/merge
rendering remain explicit adapter gates.

Choose **Note Forge MIDI Lab** for the clean-room Ableton ecosystem abstraction.
It activates canonical project MIDI clips, creates a saved four-beat starter,
previews deterministic rhythm or scale-derived chord ideas, and derives
non-destructive quantize, seeded-feel, transpose and scale-constrained variations.
Commit preserves the source, creates a new canonical MIDI clip and records one
`ProjectSession` undo point. The **Portable MIDI Sketch & Performance Rig** joins
Note Forge to Performance Canvas, Idea Flow, original Poietek instruments, Motion
Matrix, mixing and monitoring. Audible MIDI playback, retrospective input capture,
MPE, external MIDI output, Link/network sync, Push/Move hardware and Ableton content
or project compatibility remain explicit adapter gates.

Choose **Technique Matrix & Score Bridge** for the refreshed clean-room
Steinberg scoring abstraction. It stores versioned performance directions and
one-note attributes, mutual-exclusion rules, score-marking bindings, exact sound
slots, keyswitch/CC/program intent and per-slot attack compensation in the
canonical project. Its deterministic review plan converts score beats to exact
ticks, carries directions forward, applies attributes to one note, refuses
unknown or conflicting markings and rejects a stale commit. The complete commit
is one `ProjectSession` undo point and records only `planned_for_adapter`; it does
not send MIDI, host a plug-in, import proprietary expression-map files or claim
audible playback. The **Composer Technique & Playback Intent Rig** connects the
bridge to Score & Parts, Note Forge, an original instrument, mixing and control-
room monitoring.

Choose **Editorial Memory & Clip Groups** for the clean-room Avid Pro Tools
ecosystem abstraction. It saves point, range and track-focus memories in the
canonical project, recalls an exact edit selection, pins critical tracks to the top
of Arrange, captures boundary-safe groups of real audio clips and previews numbered
batch display names before one atomic project commit. Stale previews fail before
mutation, source assets and disk filenames stay unchanged, and project undo reverses
the complete operation. The **Precision Editorial & Session Recall Rig** connects
the workbench to Horizon Arrange, Take Studio, project actions, mixing and monitoring.
AAF/OMF or Pro Tools Session interchange, speech transcription, AAX hosting, Avid
hardware, EUCON, HDX and immersive renderers remain explicit licensed, native, model
or physical-device gates.

Choose **Action & Extension Workshop** for the clean-room Cockos/REAPER
workflow abstraction. It exposes an explicit catalog of local canonical-project
actions, ordered macros with a no-change dry run, deterministic A/B cycles and
one-step `ProjectSession` undo/redo. Package declarations record source, version,
publisher, license, platform, requested capabilities and optional SHA-256
evidence without downloading or installing anything. Themes and language packs
remain metadata-only; scripts, DSP and native extensions remain non-executable
even after digest review until a separately reviewed sandbox or host adapter is
implemented. The **Editing Actions & Recall Rig** template connects this control
surface to the arranger, console and control room.

Choose **Motion Matrix** for the clean-room Bitwig workflow abstraction. Its
original project extension combines reusable macro, LFO, step and seeded-motion
sources with typed target routes, deterministic bar-phase preview and macro-only
scene recall. Per-note expression cannot invent input, and rack, track, plug-in
or hardware delivery stays unavailable until the matching adapter is observed.
The **Modular Motion & Performance Rig** template connects the matrix to the
idea workbench, synth, motion effect, console and control room. Macro saves,
route switches and scene recall run through the canonical `ProjectSession` so
they remain atomic and undoable; the UI does not claim audio-rate DSP.

Choose **Performance Canvas** for the clean-room Tracktion and Waveform workflow
abstraction. It adds a project-owned scene/slot grid, integer-tick launch
quantization, trigger/gate/toggle/repeat and legato intent, follow-action plans,
deterministic rehearsal capture and a previewable bridge into ordinary canonical
arrangement clips. The **Performance Canvas & Arrangement Rig** connects it to
Idea Flow, Motion Matrix, synthesis, mixing and monitoring. Starter creation and
arrangement commit each run as one `ProjectSession` edit, so undo and redo remain
atomic. The manual cursor is not presented as the audio clock; live playback,
automatic follow dispatch and controller operation stay unavailable until a real
sample-accurate adapter reports the required capabilities.

Choose **Production Regions** for the clean-room Acoustica and Mixcraft workflow
abstraction. A project region owns exact references to canonical audio clips,
arrangement clips and automation points, so a complete song section can be
previewed and moved or copied as one local project change. Capture refuses to
cut through clips, automation collisions fail before mutation, copied clips
receive deterministic identities, and project undo reverses the entire action.
The **Production Regions Arrangement Rig** connects the new workbench to Idea
Flow, Session Variations, mixing and monitoring. The explicit plan/apply model is
operational; native timeline drag gestures and audible scheduling remain honest
adapter gates.

Open **AI** for the independent offline Studio Brain and optional provider
router. The same screen now includes a provider-neutral **Generative Audio Lab**
for drafting samples, sections, cues and demos. It is deliberately secondary to
the production suite: every route is disabled, generation is unavailable until
a reviewed adapter is configured, source audio needs a rights attestation and
per-request consent, and any future output must remain preview-only until the
creator accepts an undoable import.

## Run and verify

```text
npm install
npm run dev
```

`npm run dev` now builds and serves the verified application at
`http://localhost:3000`, avoiding development dependency-optimizer failures in
restricted Windows environments. Developers who need live HMR on an unrestricted
machine can use `npm run dev:hmr`.

Before review or a GitHub push:

```text
npm run verify
```

The verification command checks formatting hygiene, full TypeScript, the strict
framework-independent core, native packaging contracts, all Node tests and the
production Vite build. GitHub workflows can then emit Windows, macOS, Linux,
Android and iOS validation artifacts from the operating systems that own those
toolchains. Signed mobile packages require the publisher's protected credentials;
no workflow silently uploads to a store.

## Architecture and status

- [Fourteen-volume professional specification series](docs/volumes/README.md)
- [Controlled master specification](docs/POIETEK_MASTER_SPECIFICATION.md)
- [UI, menu, settings, screen and workflow catalog](docs/UI_SCREEN_WORKFLOW_CATALOG.md)
- [Platform data, API, AI, security and cloud blueprint](docs/PLATFORM_DATA_API_SECURITY_BLUEPRINT.md)
- [Delivery, testing and documentation plan](docs/DELIVERY_TEST_DOCUMENTATION_PLAN.md)
- [System architecture](docs/ARCHITECTURE.md)
- [Scalable system architecture](docs/WORLD_CLASS_SYSTEM_ARCHITECTURE.md)
- [Staged roadmap](docs/ROADMAP.md)
- [SDS source coverage and traceability](docs/SDS_VISION_COVERAGE.md)
- [Integration baseline](docs/INTEGRATION_BASELINE.md)
- [Archive policy](docs/ARCHIVE_POLICY.md)
- [Professional workstation comparison](docs/PRO_DAW_COMPARISON.md)
- [Five-star competitive build plan](docs/FIVE_STAR_COMPETITIVE_BUILD_PLAN.md)
- [Killa Vic tool workflow abstraction](docs/KILLA_VIC_TOOL_ABSTRACTION.md)
- [Reason Studios rack abstraction](docs/REASON_STUDIOS_RACK_ABSTRACTION.md)
- [Steinberg production and scoring workflow abstraction](docs/STEINBERG_WORKFLOW_ABSTRACTION.md)
- [Nuendo dialog, picture, ADR and ReConform workflow abstraction](docs/NUENDO_POST_WORKFLOW_ABSTRACTION.md)
- [Image-Line composition workflow abstraction](docs/IMAGE_LINE_WORKFLOW_ABSTRACTION.md)
- [Cakewalk song-development and session workflow abstraction](docs/CAKEWALK_WORKFLOW_ABSTRACTION.md)
- [PreSonus live-production ecosystem abstraction](docs/PRESONUS_ECOSYSTEM_ABSTRACTION.md)
- [Cockos and REAPER action/extension abstraction](docs/COCKOS_REAPER_WORKFLOW_ABSTRACTION.md)
- [Bitwig modulation, Grid and hardware workflow abstraction](docs/BITWIG_WORKFLOW_ABSTRACTION.md)
- [MOTU and Digital Performer workflow abstraction](docs/MOTU_DIGITAL_PERFORMER_WORKFLOW_ABSTRACTION.md)
- [Batchy and Friends batch-delivery workflow abstraction](docs/BATCHY_WORKFLOW_ABSTRACTION.md)
- [Tracktion and Waveform performance workflow abstraction](docs/TRACKTION_WAVEFORM_WORKFLOW_ABSTRACTION.md)
- [Acoustica and Mixcraft workflow abstraction](docs/ACOUSTICA_MIXCRAFT_WORKFLOW_ABSTRACTION.md)
- [Universal Audio and LUNA workflow abstraction](docs/UNIVERSAL_AUDIO_LUNA_WORKFLOW_ABSTRACTION.md)
- [Apple Logic Pro and Creator Studio workflow abstraction](docs/APPLE_LOGIC_CREATOR_STUDIO_WORKFLOW_ABSTRACTION.md)
- [Ableton Live, Push, Move, Note, Link and Packs workflow abstraction](docs/ABLETON_WORKFLOW_ABSTRACTION.md)
- [Avid Pro Tools software, hardware, plug-in and support workflow abstraction](docs/AVID_PRO_TOOLS_WORKFLOW_ABSTRACTION.md)
- [Industry qualification and five-star evidence baseline](docs/INDUSTRY_QUALIFICATION.md)
- [Master 108-item build checklist and percentage dashboard](docs/MASTER_BUILD_CHECKLIST.md)
- [Fail-closed public release readiness register](docs/PUBLIC_RELEASE_READINESS.md)
- [Optional generative-audio architecture and provider boundaries](docs/GENERATIVE_AUDIO_ARCHITECTURE.md)
- [Business tier and monetization reference architecture](docs/BUSINESS_TIER_ARCHITECTURE.md)
- [One-app device-aware access architecture](docs/DEVICE_AWARE_ACCESS.md)
- [Native installers, mobile packages and signing architecture](docs/NATIVE_DISTRIBUTION.md)
- [Native desktop audio and MIDI device architecture](docs/NATIVE_DEVICE_IO.md)
- [Unified production, Poietek TV, community and marketplace](docs/UNIFIED_PRODUCTION_PLATFORM.md)
- [Governance, legal and help drafting pack](docs/GOVERNANCE_LEGAL_HELP_PACK.md)
- [Native scaffold boundary](src-tauri/README.md)
- [Portable C++ native core](native-core/README.md)

## Non-negotiable truth rules

- RMS and sample peak are never presented as LUFS or true peak.
- A432/A440 derivative playback never uses a tempo-changing playback-rate fake.
- Rights acceptance, registration, payment, blockchain evidence and hardware
  capabilities remain explicit external/evidence states.
- Provider secrets do not enter the browser bundle.
- Local durable save is the primary success condition; cloud/AI are optional.

The repository is intentionally not pushed or published by this build task.
