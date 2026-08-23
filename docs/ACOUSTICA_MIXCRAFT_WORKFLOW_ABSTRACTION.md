# Acoustica and Mixcraft workflow abstraction

Research snapshot: 2026-08-23
Implementation status: one original production slice implemented; remaining
findings are mapped to existing Poietek foundations or explicit future gates.

## Purpose and clean-room boundary

This document studies Acoustica's public product, comparison, store, learning
and user-manual material to identify workflow principles that can improve
Poietek Studio. It is a functional abstraction, not a clone.

The implementation does not copy Acoustica or Mixcraft source code, binaries,
branding, interface artwork, screenshots, manuals, product names, presets,
samples, loops, instruments, effects, DSP, controller scripts or project/file
formats. `Production Regions`, its data model, starter material, interaction
design and tests are original Poietek work.

## Official research set

- [Mixcraft 10.6 product overview](https://acoustica.com/products/mixcraft)
- [Home Studio, Recording Studio and Pro Studio comparison](https://acoustica.com/products/mixcraft-10-compare)
- [Upgrade path](https://acoustica.com/products/mixcraft-10-upgrade)
- [Trial/download path](https://acoustica.com/products/mixcraft-10-download-free-trial)
- [Mixcraft store](https://store.acoustica.com/mixcraft)
- [Reviews](https://acoustica.com/reviews)
- [Videos and Mixcraft University](https://acoustica.com/videos)
- [Online manual and topic index](https://acoustica.com/mixcraft-10-manual/getting-started)
- [Track Regions](https://acoustica.com/mixcraft-10-manual/track-regions-mixcraft-pro-studio)
- [Performance Panel](https://acoustica.com/mixcraft-10-manual/performance-panel)
- [Video tracks and editing](https://acoustica.com/mixcraft-10-manual/video-tracks-and-editing)
- [Audio hardware setup](https://acoustica.com/mixcraft-10-manual/audio-hardware-setup)
- [Automation and controller mapping](https://acoustica.com/mixcraft-10-manual/automation-and-controller-mapping)
- [Plug-in manager](https://acoustica.com/mixcraft-10-manual/plug-in-manager)
- [Mixdown to audio and video](https://acoustica.com/mixcraft-10-manual/mixing-down-to-audio-and-video-files)
- [Acoustica product index](https://acoustica.com/products)
- [Pianissimo](https://store.acoustica.com/software/pianissimo)
- [Spin It Again](https://store.acoustica.com/software/spin-it-again)
- [CD/DVD Label Maker](https://store.acoustica.com/software/acoustica-cd-dvd-label-maker-3)
- [Current and legacy software catalogue](https://store.acoustica.com/software)

Prices, promotions and included third-party licences are intentionally not used
as Poietek requirements because they can change independently of the underlying
workflow lessons.

## Product-system findings

### 1. A wide workstation can still feel approachable

Mixcraft's public positioning combines multitrack audio/MIDI recording with a
large loop library, virtual instruments and effects, clip automation, a live
performance grid, notation, video work and hardware/controller support. The
important lesson is not the count of features; it is that a creator can start
with a task and progressively disclose complexity without changing products.

Poietek response:

- preserve the one-app Arrange, Rack, Ecosystem and AI shell;
- keep task-based starter rigs near the module library;
- use a canonical project across all desks rather than isolated demo states;
- expose honest readiness states where native audio, controller, plug-in or
  codec adapters have not been observed.

### 2. Edition comparison is also product information architecture

The current public comparison describes three editions: Home Studio, Recording
Studio and Pro Studio. It places foundational creation capabilities beside
advanced routing, automation, stem, region, pitch and audio-to-MIDI features.
This makes scope understandable before purchase.

Poietek should apply that clarity without pretending its proposed commercial
tiers are live. Studio Setup already labels each library item as production,
prototype, planned or external and states Web/native availability. The release
and business catalogues must continue to separate designed tiers from working
entitlements, checkout or store publication.

### 3. The core journey is end to end

The manual is organized around hardware setup, audio/MIDI recording, track and
clip editing, detail editors, mixer, library, performance, automation, effects,
instruments, plug-ins, controllers, mixdown, preferences and troubleshooting.
That is a useful acceptance journey for Poietek:

1. discover and verify the device;
2. create or open a durable project;
3. record/import real material;
4. edit clips, notes and automation;
5. arrange and compare song structure;
6. mix through an explicit graph;
7. inspect and export through measured capability gates;
8. reopen, recover and continue without provider dependency.

The repository has foundations across this chain, but the entire journey is not
yet five-star qualified. Native low-latency capture, plug-in hosting, advanced
DSP, standards analysis, video codecs and signed physical-device releases remain
separate evidence gates.

### 4. Performance and linear arrangement should meet

The Performance Panel provides a grid for playing MIDI and audio clips together,
with one active clip per track and controller-oriented operation. Poietek already
abstracted this principle into the original `Performance Canvas`: project-owned
scenes and slots, quantized launch intent, deterministic rehearsal capture and a
previewable arrangement commit. It deliberately does not claim an audible
sample-accurate live scheduler until one is observed.

### 5. Whole-section editing removes arrangement friction

The Pro Studio Track Regions workflow treats a master or submix interval as a
movable song section and carries region/lane automation when it is duplicated.
The user establishes boundaries, then moves or duplicates the section instead
of manipulating every clip separately.

This was the clearest high-value gap in Poietek. Existing Song Maps describe an
alternate section order, and the professional edit engine can move selected
clips, but neither previously persisted the exact cross-track membership of a
section and its automation or applied the complete section as one canonical
transaction.

Poietek implements the principle as **Production Regions** with a safer explicit
plan-and-apply interaction:

- a region belongs to exactly one canonical project;
- members are exact references to audio clips, arrangement clips or automation
  points rather than a loose time label;
- range capture can include all tracks/lanes or a selected subset;
- capture fails closed when a boundary cuts through a clip;
- move plans preserve clip identities;
- copy plans create deterministic new clip identities;
- selected automation moves or copies with the section;
- automation-point collisions block the plan before any mutation;
- preview is pure and does not change the project;
- apply changes clips, automation, the region map and history atomically;
- a complete action contributes one `ProjectSession` undo point;
- state serializes under `org.poietek.production-regions` schema `1.0.0`.

### 6. Notation and picture are normal production lanes

Mixcraft exposes notation editors and video editing in the same product family,
including a video track with clips/images/text and automatable visual effects.
Poietek already goes further in scope through Score & Parts, Sequence Assembly
and Picture & Dialog Post foundations. Those models are useful and durable, but
engraving, MusicXML import/export, frame-locked decode, picture effects, codecs
and rendered delivery remain adapter-gated rather than visually simulated.

### 7. Templates, autosave and plug-in recovery are product features

The public feature set highlights project templates, automatic saving, a quick
device/effect access path and a searchable plug-in manager with optional safe
mode. These are reliability and navigation features, not minor conveniences.

Poietek response:

- task-oriented starter rigs are exposed in Templates;
- canonical project writes and `ProjectSession` undo remain the mutation path;
- crash-recovery contracts remain distinct from ordinary autosave;
- the external plug-in slot and Studio Setup catalogue never claim that a native
  plug-in is loaded or processing audio without host evidence;
- a future native plug-in host should add quarantine, scan history, crash
  isolation, allow/deny state, architecture compatibility and recovery evidence
  before it is labelled operational.

### 8. Content is an ecosystem, but rights and provenance matter

Mixcraft combines its bundled library with an integrated store. The current
store taxonomy includes software, projects, sound collections, third-party
plug-ins, presets, templates, controller scripts, drum maps and other products.

Poietek should retain a comparable discovery shape while remaining rights-first:

- the current Sound Atlas and procedural one-shots are original and labelled;
- future packs need source, creator, licence, territory and modification rights;
- an external listing is not installed merely because its metadata is visible;
- downloads, execution, payment, entitlement, revocation and update trust each
  need separate evidence;
- no Acoustica, Mixcraft or third-party commercial content is included here.

### 9. Mobile control should be least privilege

Mixcraft Remote publicly describes transport, position, master volume, undo,
redo and save control from a phone or tablet. Poietek already has a one-app
device-aware shell and a remote-session foundation. A world-class implementation
should use scoped commands, project/session identity, expiring pairing,
capability negotiation, audit history and revocation rather than treating a
mobile page as automatically trusted.

### 10. Learning is part of the workflow

Acoustica connects the manual, videos, beginner/intermediate Mixcraft University
series, demos, presets, tutorials and user showcases. Poietek's guided templates
and planned Learning Centre should adopt this task progression:

- first project and audio setup;
- first import/record/edit/save cycle;
- patterns, clips and automation;
- arrangement regions and variants;
- mixing, inspection and delivery;
- scoring and picture workflows;
- native hardware and controller verification;
- recovery, rights and release preflight.

Lessons must be linked to current capability evidence so a tutorial never asks a
browser-only user to perform an unavailable native action.

## The wider Acoustica product family

The supporting product family reinforces several useful specialist-workflow
ideas:

| Product | Public workflow principle | Poietek abstraction |
| --- | --- | --- |
| Pianissimo | A focused playable instrument can combine an expressive source, performance controls and a small recording/sequencing path. | Keep dedicated instruments playable and parameter-focused, but route durable recording and arrangement back to the canonical project. Do not copy its samples, model, presets or interface. |
| Spin It Again | A guided source-capture path joins hookup/level help, monitoring, long recording, track detection, restoration and export. | Extend the existing Live Session Hub and recording service with an evidence-based transfer wizard, real level observation, explicit split review and reversible restoration previews. Never claim click/hiss removal without tested DSP. |
| CD/DVD Label Maker | Metadata import, reusable templates, output-target preview and alignment checks can turn delivery packaging into a guided task. | Add release-artwork and package-layout preflight only after rights, output dimensions, color/profile and print/export adapters exist. Physical disc tooling is not a current core priority. |
| Legacy catalogue | A vendor can preserve access while clearly labelling support status. | Retain migration readers and archive policy without presenting retired modules as supported production paths. |

## Poietek coverage matrix after this pass

| Mixcraft/Acoustica lesson | Poietek evidence | Current truth |
| --- | --- | --- |
| Audio project, track and clip foundation | Canonical project, media repository, Arrange and Web Audio scheduler | Operational supported slice; advanced edit/DSP coverage is incomplete. |
| Audio/MIDI capture setup | Recording core, Studio Setup, Live Session Hub, native endpoint inventory | Core/foundation; native low-latency routing and complete record UI remain gates. |
| Pattern, piano/step and automation work | Idea Flow, Beat Loom, Note Canvas, composition workflow | Mixed operational control model and prototypes; no invented MIDI/DSP delivery. |
| Performance grid | Performance Canvas | Project model/capture/arrangement bridge operational; audible scheduler/controller gated. |
| Whole-section clip plus automation editing | **Production Regions** | New operational model, plan and canonical project transaction. Native timeline drag remains gated. |
| Song structure alternatives and lyrics | Session Variations | Operational track-scene transaction plus broader prototype views. |
| Effects/instruments and plug-in ecosystem | Original rack/catalogue, external plug-in slot | Original operational/control-model mix; third-party native hosting gated. |
| Notation | Score & Parts Workbench | Serializable foundation; production engraving/import/export gated. |
| Video | Picture & Dialog Post, Sequence Assembly | Strong planning/control model; decode/frame clock/render adapters gated. |
| Templates/autosave/recovery | Starter rigs, local repository, recovery contracts | Templates and local project mutation active; full startup recovery UI incomplete. |
| Store/content | Studio library, Sound Atlas, commerce/rights contracts | Local original catalogue active; marketplace/payment/install delivery gated. |
| Mobile/remote | Device-aware one-app shell, Remote Session | Responsive access active; authenticated remote command transport gated. |
| Learning/support | Guided walkthroughs, controlled docs, planned Learning Centre | Foundation; complete in-app curriculum and searchable support path remain future work. |

## Production Regions implementation map

| Layer | Repository location | Responsibility |
| --- | --- | --- |
| Contract | `src/poietek/region-workflows/contracts.ts` | Versioned region, member, plan, operation and readiness types. |
| Pure model | `src/poietek/region-workflows/regions.ts` | Validation, range capture, deterministic plan and collision checks. |
| Project commands | `src/poietek/region-workflows/projectCommands.ts` | Canonical clip/automation edits, extension storage and original starter project. |
| Rack workbench | `src/components/rack/ProductionRegionsDevice.tsx` | Region selection/capture, move/copy plan, history and truthful readiness. |
| Application transaction | `src/App.tsx` | Busy guard, local `ProjectSession` mutation, refresh and undo boundary. |
| Discovery | rack catalogue, menus, Studio library and Templates | Searchable module and `Production Regions Arrangement Rig`. |
| Verification | `tests/region-workflows.test.js` and `tests/rack-navigation.test.js` | Model safety, determinism, canonical edit/undo and UI integration coverage. |

## User journey

1. Open Rack.
2. Search for **Production Regions** or choose **Production > Song Development
   & Mix Recall > Production Regions & Section Editing**.
3. Add the unit and choose **Create starter regions** for the original
   Foundation, Lift and Release example, or capture a range from existing
   canonical material.
4. Select a region, choose Move or Copy and set the destination bar.
5. Open **Plan** and inspect every source-to-destination member.
6. Apply the plan as one project change.
7. Inspect **History**, or use project undo/redo to reverse/reapply the whole
   section transaction.
8. Open **Readiness** to distinguish the working local model from audible
   playback and native drag adapters that are not yet present.

## Five-star acceptance targets

This pass does not relabel the complete application five-star. The new slice is
designed to meet a five-star control-model standard only when the following
evidence is all current:

- deterministic unit coverage for capture, move, copy and collisions;
- exact canonical audio/pattern/automation changes;
- one-step undo and redo with durable reopen coverage;
- desktop, tablet and phone interaction without overflow;
- keyboard and screen-reader names for all controls;
- stress tests on very large projects and long histories;
- performance budgets for plan generation and apply;
- timeline visualization/gesture parity when a native adapter is implemented;
- sample-accurate audible validation through the production scheduler;
- full product release gates, security, accessibility and physical-device tests.

Until those wider gates are satisfied, the honest wording is: **Production
Regions is an operational, tested project control model inside a still-evolving
cross-platform production application.**

## Next priorities abstracted from the research

1. Connect production-region overlays to the canonical Arrange timeline while
   preserving the existing pure preview and atomic command boundary.
2. Persist the legacy Rack layout in the canonical project so the visible unit
   stack reopens with the project. Production Region data already persists, but
   Rack placement remains a session-surface concern.
3. Finish the real record/monitor/recall surface over the existing recording
   core, with browser/native device evidence and safe cleanup.
4. Add a task-based start window that surfaces recent projects, recovery,
   templates, compatible hardware status and lessons without remote dependency.
5. Deepen plug-in discovery into native scan/quarantine/recovery evidence before
   enabling third-party execution.
6. Build a rights-aware content browser and package installer before exposing
   any commercial marketplace promise.
7. Complete scoring and picture adapters rather than adding further visual-only
   controls.
8. Turn the controlled documentation into searchable, version-aware in-app
   learning and troubleshooting paths.
