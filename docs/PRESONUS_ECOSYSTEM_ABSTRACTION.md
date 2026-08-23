# PreSonus ecosystem abstraction for Poietek Studio

Status: clean-room product research and implemented vertical slice

Research date: 2026-08-22

Scope: public, official product, technology, developer, support and company material

## Executive result

The most useful lesson is not a particular panel, colour scheme or branded
effect. It is the way recording software, a live mixer, mobile control, performer
cue control, notation, plug-ins and project handoff share one session vocabulary.
Poietek already has separate recording, rack, monitoring, scoring, remote and
project foundations. The missing foundation was a truthful coordination layer
between them.

This pass adds an original **Live Session Hub**. It stores a versioned capture
plan in the canonical project, maps source names to canonical tracks, evaluates
virtual-soundcheck readiness, saves least-privilege remote access policy,
records device/version observations and exposes interchange gates. It does not
copy PreSonus code, product names, visual trade dress, manuals, presets, SDKs,
sounds or proprietary protocols.

## Current product and brand context

The PreSonus Software product page currently groups Studio One, Capture,
Universal Control/UC Surface, Studio One Remote, Capture for iPad, QMix-UC,
plug-ins managed through PreSonus Hub and Notion. Its central pattern is a family
of focused clients around recording, mixing, remote control and notation:

- <https://presonus.software/>

The former Studio One product link now redirects to the current Fender Studio
Pro product page. As of this review, the current product describes recording,
production, mixing, mastering and performance in one application, with separate
mastering and show workflows. Poietek documents both names accurately instead
of treating an older brand snapshot as current:

- <https://www.fender.com/products/fender-studio-pro>

PreSonus support also documents the 2026 rename from PreSonus Universal Control
to Fender Universal Control v5 and an explicit compatibility break for older
AI/RM/RML/CS18AI families. That is a strong reason to model product, firmware,
software and protocol compatibility as evidence rather than infer it from a
brand or device name:

- <https://support.presonus.com/hc/en-us/articles/42636356381709-PreSonus-Universal-Control-is-now-called-Fender-Universal-Control-v5-for-Mac-and-PC>
- <https://support.presonus.com/hc/en-us/articles/41192180732429-StudioLive-AI-and-RM-RML-General-Reference-Overview-2025-and-beyond>

## Product-to-principle matrix

| Official product or workflow | Publicly described value | Poietek abstraction | Implementation truth |
| --- | --- | --- | --- |
| Studio One / current Fender Studio Pro | Record, arrange, mix, master and perform in connected pages | One canonical project with focused Arrange, Rack, score, master and live-session workbenches | Existing project and workbench architecture; no claim of complete feature parity |
| Capture | Fast multitrack recording designed around StudioLive | Capture channel plan with safe/armed intent and track binding | Plan is durable; no input opens until a capture adapter is observed |
| Capture and StudioLive sync | Track/channel naming handoff and virtual soundcheck | Deterministic source-to-track rename plan and soundcheck readiness state | Names are proposed, not silently changed; playback is adapter-gated |
| Universal Control / UC Surface | Remote mixer and device control | Endpoint observations plus engineer access policy | No mixer or peer is claimed from a saved policy |
| QMix-UC | Performer control over an assigned aux mix | Performer role limited to one named cue and read-only scope | Least-privilege rule is enforced by pure model tests |
| Studio One Remote | Remote application control | Transport/full-mix scopes reserved for engineer policy | Authentication and network control remain unavailable |
| Notion | Composition, notation and performance | Existing Score & Parts Workbench with a project extension | Engraving, playback and MusicXML remain validated-adapter work |
| Plug-ins and PreSonus Hub | Installable host-integrated processing | Existing plug-in boundary plus explicit adapter readiness | No VST/ARA/extension host support is claimed |
| StudioLive Series III | Integrated live mix, recording, playback, streaming and monitor mixes | Capture, route, cue, soundcheck and compatibility evidence in one hub | Hardware I/O remains external and fail-closed |

Official workflow references:

- <https://www.presonus.com/products/studiolive-se-24-digital-console-mixer>
- <https://support.presonus.com/hc/en-us/articles/210048143-Capture-Sync-Features>
- <https://support.presonus.com/hc/en-us/articles/360003900011-StudioLive-Series-III-Studio-One-integration-and-Audio-processing>
- <https://support.presonus.com/hc/en-us/articles/4651318689165-StudioLive-Series-III-How-to-use-your-StudioLive-Series-III-with-external-hardware-in-Studio-One-with-Pipeline-and-Interface-Mode>
- <https://support.presonus.com/hc/en-us/articles/210047633-StudioLive-AI-with-UC-Surface-iOS-PC-Mac-Device-Permissions>

## Technology lessons

PreSonus describes three foundations on its technology page:

1. **CCL** is a modern C++ cross-platform framework spanning desktop, mobile,
   Linux and embedded targets, with hardware-accelerated high-DPI multi-touch
   interfaces.
2. **UCNET** supplies discovery, monitoring, parameter control and firmware
   update communication across software and hardware.
3. **State Space Modeling** represents analogue circuit topology and nonlinear
   components for real-time processing.

Sources:

- <https://presonus.software/technology>
- <https://ccl.dev/>
- <https://ccl.dev/features>
- <https://github.com/cclsoftware/ccl-framework>

Poietek already follows a compatible layered direction: a portable C++20
real-time core, a Rust/Tauri boundary, a TypeScript domain/application layer and
a responsive React presentation. A wholesale CCL migration would replace
rather than strengthen that working boundary, add licensing and integration
risk, and is therefore not part of this slice. The ideas retained are:

- no dynamic-allocation assumptions in real-time paths;
- versioned narrow boundaries between DSP, host, project and UI;
- a high-DPI, multi-touch, accessible presentation;
- device discovery and control represented as observations, not optimistic UI;
- independently testable device and compatibility adapters.

State-space analogue modelling is a future DSP research track. Poietek does not
claim modelled analogue effects merely because a control surface contains
compressor, amplifier or console-shaped parameters.

## Developer and interchange lessons

The official developer page describes Mix Engine FX, ARA, Audioloop, Musicloop,
DAWproject and host extension points. These are different integration classes
and must not be collapsed into one generic “supports everything” flag:

- **Mix Engine FX** requires deeper access to individual sources and the summed
  signal than a conventional insert.
- **ARA** allows a host and plug-in to exchange musical timeline and audio data.
- **Audioloop** combines audio with musical tempo/slicing metadata.
- **Musicloop** adds performance and instrument/effect preset information.
- **DAWproject** is an open DAW interchange package, not Poietek's native project
  document.
- **Sound Variation discovery** allows a host to discover instrument-specific
  articulations and playing techniques.

Sources:

- <https://presonus.software/developer>
- <https://presonus.software/blog/10-years-of-ara>
- <https://presonus.software/blog/sound-variation-api-now-availble>
- <https://github.com/bitwig/dawproject>
- <https://github.com/fenderdigital/presonus-plugin-extensions>

The Live Session Hub therefore reports five independent adapter gates:
DAWproject, Audioloop, Musicloop, audio-document access and articulation
discovery. No exporter, importer, plug-in host or SDK compatibility is claimed
until a reviewed adapter returns evidence and its payload passes fixtures.

The Linux public-beta article is another useful boundary signal: plug-in GUIs
and desktop integration can differ by platform even when a DAW core runs there.
Poietek keeps plug-in scanning, execution and windows behind platform-specific
native-host contracts:

- <https://presonus.software/blog/studio-one-6-5-for-linux>

## Implemented Live Session Hub

### Canonical state

`org.poietek.live-session-hub` schema `1.0.0` stores:

- revisioned mic, line, instrument, USB-left, USB-right, network or other
  capture-channel plans;
- safe/armed intent without claiming that a device or stream is active;
- optional canonical track bindings and an explicit naming authority;
- local remote-access policy for engineer, performer and observer roles;
- one-cue-only performer assignment and consent acknowledgement;
- endpoint observations with adapter, direction, state, timestamp, reported
  versions, compatibility and evidence reference;
- virtual-soundcheck audio-asset selection and desired output endpoint.

Every write goes through the existing `ProjectSession`, project validation,
durable repository save and undo/redo history.

### Fail-closed workflows

Capture state distinguishes:

1. a saved channel plan;
2. an observed input endpoint;
3. an observed active capture stream.

Virtual soundcheck advances only through:

1. a real audio asset in the canonical project;
2. an available, non-incompatible output observation;
3. a `virtual_soundcheck_playback` adapter observation;
4. later stream evidence from the owning adapter before active playback may be
   claimed.

Remote policy is intentionally narrower than an actual remote session. The
model enforces role scopes, requires a cue id for assigned-cue access, requires
local consent acknowledgement for performer and engineer policies, and prevents
an engineer from minting another engineer policy. Authentication, participant
identity, encryption and network connection remain separate capabilities.

### Product surfaces

- Rack library entry: **Live Session Hub**
- Production menu entry under monitor, master and remote workflows
- Four responsive rack views: Capture, Soundcheck, Remote Roles and Handoff
- Starter template: **Live Capture & Soundcheck Rig**
- Ecosystem/library entry with explicit implementation and limitation labels

## Explicitly not implemented

- PreSonus, Fender, Studio One, StudioLive, Capture, UC Surface, QMix, Notion or
  other branded UI/code/content copies;
- mixer discovery, remote parameter writes, firmware update or device control;
- a proprietary UCNET implementation;
- multitrack capture from a named hardware product;
- actual virtual-soundcheck playback or physical I/O switching;
- Mix Engine FX, ARA, plug-in-extension, Audioloop, Musicloop or DAWproject
  compatibility claims;
- state-space-modelled effects;
- third-party factory sounds, loops, presets, demos or manuals.

These are engineering programmes with hardware, licensing, conformance,
security, latency, recovery and cross-platform acceptance requirements. The new
hub creates the durable contract and visible truth boundary needed to implement
them safely.

## Five-star acceptance gates

A five-star label is a release outcome, not a design assertion. The Live
Session Hub may be rated production-ready only when all of these have evidence:

- 32-or-more-channel sustained capture with drop-out, disk-pressure and recovery
  tests on every supported desktop platform;
- measured round-trip latency and drift, never a guessed latency display;
- physical-mixer channel-name round trip with conflict and rollback fixtures;
- virtual soundcheck that proves route isolation, feedback safety and stream
  teardown;
- authenticated remote peers, encrypted transport, revocation and
  least-privilege penetration tests;
- device, software, firmware and protocol compatibility fixtures;
- DAWproject and any loop/interchange export/import golden-file conformance;
- screen-reader, keyboard, touch-target, contrast and 200% zoom acceptance;
- desktop, tablet and phone layouts with no clipped critical state;
- signed native installers, crash recovery, diagnostics and support runbooks.

Until then, Poietek accurately labels the hub as a tested prototype/control
model with external execution requirements.
