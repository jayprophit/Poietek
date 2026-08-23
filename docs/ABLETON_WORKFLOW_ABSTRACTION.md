# Ableton workflow abstraction for Poietek Studio

Date: 2026-08-23

Method: clean-room product and workflow analysis from Ableton's public, official material.

Implementation target: original Poietek architecture, terminology, interface, algorithms and project schema.

## 1. Source set reviewed

- [Ableton product home](https://www.ableton.com/en/)
- [Live](https://www.ableton.com/en/live/)
- [Live 12 feature inventory](https://www.ableton.com/en/live/all-new-features/)
- [Live edition comparison](https://www.ableton.com/en/live/compare-editions/)
- [Push](https://www.ableton.com/en/push/)
- [Move](https://www.ableton.com/en/move/)
- [Note](https://www.ableton.com/en/note/)
- [Link](https://www.ableton.com/en/link/)
- [Link developer documentation](https://ableton.github.io/link/)
- [Shop](https://www.ableton.com/en/shop/)
- [Packs](https://www.ableton.com/en/packs/)
- [Help and learning](https://www.ableton.com/en/help/)

This document records transferable product lessons. It is not an interoperability
claim, a compatibility statement or permission to copy Ableton code, UI, artwork,
manual text, devices, presets, sounds, Packs, projects, trademarks or commercial
content.

## 2. Product-system lessons

### Live: one project, two creative tempos

The useful abstraction is the separation between fast, reversible idea work and
deliberate arrangement work. Current Live material emphasizes MIDI transformations,
constraint-based melody/chord/rhythm generators, scale-aware editing, a searchable
tagged browser, stacked clip/device views, Session/Arrangement workflows, modulation
and expressive note data.

Poietek already has complementary pieces:

- Performance Canvas for project-owned scenes, rehearsal capture and arrangement commit;
- Idea Flow for pattern, automation and retrospective-capture intent;
- Motion Matrix for project-owned modulators, routes and scene recall;
- Horizon Arranger and ProjectSession for canonical arrangement edits and undo;
- Sound Atlas and the library catalogue for original, provenance-labelled content.

The important missing foundation was canonical MIDI clip creation and transformation.
The previous production-engine default explicitly reported MIDI clip editing as not
implemented. A visual piano roll or logical-control model could not close that gap.

### Push: deep control without hiding the computer boundary

Push combines expressive pads, sampling, sequencing, clip launch, track/device control,
audio I/O and optional standalone operation. The transferable principle is not a copied
controller layout; it is a single surface that exposes the complete state transition
from input to clip to sound to performance.

Poietek applies that principle through focused rack workbenches over one canonical
project. Physical-pad pressure, pitch/slide gestures, Push hardware, CV/gate, audio I/O,
standalone transfer and stem separation are not claimed. Each requires real hardware,
licensed SDK or DSP evidence.

### Move: constrain the sketch so the idea survives

Move's public workflow stresses portability, a small number of flexible tracks,
sampling, step sequencing, built-in sound shaping and later transfer to Live. The
benefit for Poietek is a focused starter rig and a low-decision idea path—not an
imitation of Move's industrial design or bundled content.

The new Portable MIDI Sketch & Performance Rig therefore combines Note Forge,
Performance Canvas, Idea Flow, Poietek's original drum/synth devices, Motion Matrix,
mixing and monitoring. It does not claim cloud transfer, Wi-Fi device management,
battery operation, built-in microphone/speaker hardware or Move Set compatibility.

### Note: capture first, organize second

Note presents beat, melody, sampling, automation, clip/scene variation, phone-mic
capture and retrospective MIDI capture as a quick mobile workflow. Poietek already has
device-aware layouts and browser audio recording, but it does not yet have an observed
MIDI input buffer that can substantiate retrospective capture. That button remains out
of Note Forge rather than presenting a timer or fabricated notes as captured input.

The transferable idea implemented now is that a creator can make one canonical starter
clip, derive multiple deterministic variations, keep the source intact and use the same
project on desktop, tablet, phone or installed/native shells.

### Link: decentralized musical synchronization

Ableton's developer documentation describes tempo, beat, phase and optional start/stop
sharing between independent timelines on a local network. It also distinguishes
realtime-safe audio-thread state capture/commit from application-thread access. That is
a concrete native/realtime engineering commitment, not a UI preference.

Poietek does not claim Link integration, peer discovery, network tempo/phase alignment,
quantized remote transport or Link Audio. A future implementation must integrate and
review the actual SDK/library, licensing, native timing boundary, thread safety,
network permission, drop/rejoin behavior, latency evidence and multi-device tests.

### Packs and Shop: discoverability, provenance and clear dependencies

Ableton separates the core product, extensions and Packs, with instruments, effects,
tools and sounds presented as discoverable additions. Poietek's safe abstraction is a
metadata-rich Development Library: implementation state, platform availability,
capabilities, limitations, licence/provenance and external/native requirements.

Poietek does not copy Ableton Packs, pricing, product bundles, commercial assets or
sound-similarity models. Optional third-party content must carry its own reviewed
licence and provenance evidence. Machine-learning similarity remains unavailable until
a model, data policy, consent path, index worker and evaluation set exist.

### Help and learning: capability-specific guidance

Ableton's manuals, tutorials, learning sites, knowledge base, training and community
programs reinforce a layered teaching path. Poietek should continue connecting each
operational screen to a focused tutorial and each unavailable capability to a concrete
explanation of the missing adapter/evidence. A disabled control must teach the user what
is required; it must not merely look inactive.

## 3. Implemented Poietek slice: Note Forge MIDI Lab

Note Forge is an original Poietek workbench, not an Ableton-compatible device.

### Canonical engine

- Activates `engine.midi.clip_editing` with implementation id
  `poietek.core.note-forge.v1`.
- Stores serializable `MidiClipRecord` objects in the versioned production-engine
  project extension and points each clip at a canonical MIDI/instrument track.
- Creates a real MIDI track and four-beat starter clip when requested.
- Keeps audio clips and MIDI event records in their existing canonical ownership
  locations; no duplicate UI-only clip store is introduced.
- Validates clip identity, loop/timing ranges, channel, note, velocity, controller,
  pressure, pitch-bend, duration and transformation references.

### Deterministic generators

- Rhythm Pulse uses an original integer-seeded pulse distribution with explicit
  step count, pulse count, step duration, note and seed.
- Chord Path uses an original integer-seeded scale-degree selection and diatonic
  triad construction with explicit root, scale, chord count and duration.
- Repeating the same seed and constraints returns the same preview.
- No AI provider, network request, training data, hidden random state or copyrighted
  MIDI material is used.

### Non-destructive transformations

- Quantize with visible grid and strength.
- Seeded timing/velocity humanization.
- Semitone transpose.
- Velocity scale and offset in the engine API.
- Major, minor and minor-pentatonic constraint.
- Legato duration fitting in the engine API.
- Every preview is pure: it does not mutate the project.
- Commit creates a new output clip, preserves the source clip, stores an applied
  transformation record and runs through one `ProjectSession` undo point.

### Rack workflow

The rack device contains four views:

1. Clip Ideas — inspect and select canonical clips or create a starter clip.
2. Variations — select a source, operation and visible constraints; preview and commit.
3. Generators — choose Rhythm Pulse or Chord Path, seed and musical constraints;
   preview and commit.
4. Readiness — separate working local records/algorithms/undo from every runtime gate.

The panel exposes exact note count, duration and a velocity overview. It deliberately
does not include a play button because the production MIDI scheduler/instrument route
is not yet observed.

## 4. Cross-product map

| Ableton product lesson | Existing Poietek evidence | Change in this pass | Remaining gate |
| --- | --- | --- | --- |
| Live MIDI transformations and generators | Pure MIDI edit helpers; visual note tools | Canonical clips, generator/variation plans and commit history | Audible scheduler, full editor gestures, chance/MPE data |
| Live Session-to-Arrangement path | Performance Canvas | Portable rig connects Note Forge and performance/arrangement layers | Sample-accurate live launch/follow adapter |
| Push integrated creation surface | Modular rack and mapper | Focused Note Forge workbench over canonical state | Physical controller profile, expressive input and audio I/O evidence |
| Move portable constraints and handoff | Device-aware shell, local project | Portable MIDI Sketch & Performance Rig | Native mobile builds and evidenced cross-device transfer |
| Note quick capture and variations | Browser recorder, Idea Flow capture intent | One-click starter and deterministic clip variations | Observed retrospective MIDI input buffer and mobile capture QA |
| Link independent network timelines | Clock/output capability contracts | Explicit readiness gate and architecture boundary | Reviewed Link integration, realtime thread and multi-device tests |
| Packs discoverability | Sound Atlas and Development Library | Production Note Forge catalogue record with licence/limits | Rights-cleared content expansion and install/dependency manager |
| Help and learning | Governance/help and starter templates | Focused workflow document and guided starter rig | Interactive Note Forge lesson and accessibility test matrix |

## 5. Explicit non-claims

This pass does not provide or claim:

- Ableton Live Set, Push, Move, Note, Link, Max for Live or Pack compatibility;
- copied Ableton algorithms, MIDI generators, transforms, interface layouts or content;
- retrospective MIDI capture or proof that notes came from a performer;
- MIDI clock, MTC, Link tempo/beat/phase/start-stop or network audio;
- external MIDI output, an audible instrument route or sample-accurate playback;
- MPE input/editing/playback, per-note pressure, pitch or slide capture;
- stem separation, warping, pitch correction, bounce/freeze or neural sound search;
- Wi-Fi/cloud handoff, a connected hardware controller or mobile-store package;
- Max for Live hosting, third-party plug-in execution or proprietary Packs.

## 6. Acceptance evidence

The slice is accepted only when all of the following pass:

- strict core TypeScript compilation;
- full application TypeScript compilation;
- deterministic generator and transform tests;
- canonical validation and dangling-reference refusal tests;
- preview purity, source preservation and ProjectSession undo tests;
- rack/menu/template/library discovery tests;
- full regression suite, native configuration check and production bundle;
- desktop and phone-width browser QA with no application errors or page-level
  horizontal overflow.

The build status records the observed results. Future claims must be added only after
their real adapter and evidence suite exist.
