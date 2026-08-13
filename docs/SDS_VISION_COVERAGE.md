# SDS vision coverage and expansion map

This is the traceable product map for the historical `sds.txt` supplied from the
Poietek/SDS conversation history.

- Source read: `C:\Users\jpowe\Desktop\Studio-Daw-Station-SDS-\sds.txt`
- Source size: 5,504 lines / 152,303 decoded characters
- SHA-256: `83b1cf2b4d103ef22f36d1a31442efc095469b330c84821b4cac3ab509163fff`
- Audit date: 2026-08-13
- Current catalogue: `src/poietek/vision/catalog.ts`, version 3.2.0

Additional development-library source integrated into the application:

- Source: attached `Poietek Complete Development Library` conversation export
- Source size: 2,221 lines / 30,024 decoded characters
- SHA-256: `9edcb809bff10246526ff7141185a82eef68dbe05440a5567ee81f0f1986dea2`
- App crosswalk: `src/poietek/vision/developmentLibrary.ts`
- Visible surface: Ecosystem → Development Library

The additional source contains Volumes 01–20, a proposed fifty-volume expansion
across ten professional parts, Appendices A–E, and Volumes 51–53 for the Creative
Operating System, Poietek Ecosystem and Creative Intelligence Layer. These are
mapped into the controlled fourteen-volume series rather than becoming a second,
conflicting specification hierarchy.

The historical conversation contains aspirational volumes, intermediate
architectures, download references, corrections and the v3.1 implementation
handoff. This document deduplicates that history. Current code remains the source
of truth for implementation claims.

## Status language

- **Operational** — implemented, integrated into a user workflow and covered by
  relevant automated/browser verification.
- **Foundation built** — versioned contracts, safe defaults and validation exist;
  the whole service or native engine is not being claimed.
- **Planned slice** — retained in the architecture and given a build boundary, but
  no useful end-to-end implementation exists yet.
- **External gate** — depends on hardware, licensed content/SDKs, a configured
  provider, a legal authority, platform toolchains or independent validation.

## The thirteen-system combination

| Required SDS system | Current build | What exists now | Major expansion boundary |
| --- | --- | --- | --- |
| Professional DAW | Operational vertical slice | Canonical projects, import, waveform arranger, editing, Web Audio transport, recording, mixer/console, health checks, WAV export, recovery and offline storage | Automation, take comping, elastic/spectral editing, validated standards metering and native low-latency I/O |
| Sampler | Foundation built | Rack sampler surfaces, procedural original kit, sound recipes and original-vs-recording-required catalogue | Canonical pad programs, chopping/transients, zones, resampling and real time-stretch/pitch DSP |
| Hardware controller | Foundation built | Truthful profiles, provenance, live adapter negotiation, patch routes, analogue inserts and explicit device observations | Manufacturer/curated profiles, physical devices and native USB/network adapters |
| MIDI hub | Foundation built | Web MIDI permission/capability state, correct parsing, explicit SysEx, mapping and separated clock contracts | Output, clock scheduling, MIDI 2/MPE, OSC, Bluetooth and native routing |
| Video editor | Foundation built | Canonical video track type plus serializable video/VFX render and interchange contracts | Real video clips, proxy media, WebCodecs/native codecs, picture timeline, caption and colour pipelines |
| VFX suite | Foundation built | Render-job, extension, plugin and interoperability contracts | Node compositor, GPU graph, shaders, particles, motion, 3D and validated colour/HDR output |
| Collaboration platform | Foundation built | Local change envelopes, replicas, conflicts, roles and local-first remote-delivery states | CRDT/operation sync, presence, review/comments, encrypted realtime transport and provider auth |
| Publishing platform | Foundation built | Release profiles, tuning preservation, WAV export, metadata/registration contracts and evidence-backed external states | Batch/stem packages, DDEX-oriented adapters, platform APIs and authoritative destination profiles |
| Rights management | Foundation built | Contributor passports, splits, agreements, clearances/registrations, correction history model and optional evidence receipts | User workflows, signatures, authority adapters, royalty accounting and jurisdictional legal review |
| AI creative assistant | Working locally | Independent offline Studio Brain, project-aware evidence findings, optional secure provider router, local Ollama adapter, per-request consent, preview/accept/undo rules and Creative Intent Lock | Native secret service, operational remote proxy, cross-modal models, reference licensing and provider-specific acceptance tests |
| Social network | Foundation built | Private local hub/feed/catalog, visibility/trust/moderation gates and creator/remix/tuning architecture | Identity, messaging, feeds/channels, moderation operations, live rooms and abuse/safety systems |
| Marketplace | Foundation built | Listings/orders, licence evidence boundaries, private catalogue and payment/fulfilment validation | Payment provider, seller/buyer UI, disputes, tax/consumer compliance and secure delivery |
| Cloud platform | Foundation built | Local/Supabase/Firebase provider adapters, capability routing, offline PWA, replica/storage policy and cross-device handoff | Configured encrypted sync, selective backup, key vault, conflict service, remote compute and operations |

## Cross-cutting SDS volumes

### Creative Operating System

Implemented in `src/poietek/creative-os/` as a versioned canonical project
extension:

- private local creator identity with evidence-gated verification;
- universal content-hashed asset records and replica observations;
- project/asset/creator/idea/session/release/rights/device graph;
- deterministic local graph, journal and annotation search;
- local/team/public annotation contracts with publication evidence;
- studio journal and decision/inspiration/checkpoint entries;
- Creative Intent Lock rules;
- cross-modal preflight findings classified as target requirement, technical best
  practice, reference norm or creative option;
- storage routing policy across OPFS, IndexedDB, native files, providers, peers and
  archives;
- cross-device handoff state, including playhead, selection, required assets and
  unsupported-plugin freeze/render fallback;
- validation that rejects remote-storage claims without evidence, target
  requirements without a target/requirement identifier, preflight passes without
  evidence and handoffs that discard unsupported plugin state.

Creative Intent Lock may convert style/reference advice into an optional creative
suggestion, but it cannot suppress a real requirement of the selected destination.

### UI, workspaces and accessibility

Operational or present:

- desktop/tablet/mobile responsive shell;
- Arrange, Rack, Console, Inspect and Ecosystem surfaces;
- keyboard workspace switching;
- focus-visible states, touch targets, reduced motion and themes;
- professional audio/MIDI/recording/editing/file/plugin/privacy settings;
- project and runtime diagnostics;
- install/update/storage deployment centre.

Next: persistent docking/floating layouts, key-command editor, complete screen
reader audit, captions/transcripts, high-contrast verification and adaptive control
surfaces.

### Universal timeline, asset manager and search

Operational audio timeline and assets now use durable project truth. The Creative
OS adds a cross-modal index so audio, MIDI, video, images, captions, rights,
documents, ideas and annotations can share stable IDs and relationships. Full
semantic search remains optional because embeddings require a model, consent and
data-governance choice.

### Audio, sampling, mixing and mastering

The first real production workflow is implemented. RMS and sample peak remain
correctly labelled; LUFS and dBTP remain `not_measured` until a validated
BS.1770-compatible backend exists. No UI timer is described as sample-accurate.
No copied commercial sample banks or plugins are included; sounds must be original,
procedural, licensed or user supplied.

### Hardware, consoles and timing

Desired configuration is separated from observation. Sample clock, audio
transport, MIDI clock/control, word clock, LTC/MTC and metering are separate
domains. Digital/analogue console state, scene/routing intent, physical loopback
evidence and privileged operations are retained without inferring a capability
from a product name.

### Tuning and community player

A432/A440 and destination logic are implemented as policy/contracts. Alternative
tunings remain creator choices. A compatibility or community rendition is always
separate from the original. The player never substitutes `playbackRate` for
time-preserving DSP. Until a real backend or pre-rendered rendition exists, it
returns the creator original and an honest unavailable state.

### Standards, style intelligence and final preflight

Formal requirements, destination requirements, technical practice, reference
norms and creative options are not conflated. Release readiness already blocks
required unmeasured standards. The new cross-modal model can aggregate audio,
music, video, captions, rights and metadata as validated analyzers become available.

### Rights, publishing, royalties and provenance

Submission is not acceptance. A split is not fully accepted without explicit
participant evidence. Blockchain is optional evidence and never ownership law.
Payment, fulfilment, registration and public publication require authoritative
references and observation times. External adapters remain configuration gates.

### Community, social, learning and marketplace

Local/private defaults and contracts exist for feeds, catalogues, collaboration,
learning suggestions and commerce. Networked services require identity,
moderation, safety, consent, payment and operational systems; they will not be
presented as live services before those exist.

### Plugins, SDK, video/VFX and developers

Serializable extension contracts preserve unsupported state. Native plugin formats
are preferences/capability targets, not browser claims. Full VST3/CLAP/AU/LV2,
OpenFX, hardware-driver and codec hosts require native processes, licensed SDKs,
sandboxing, scanning/quarantine, signing and platform test matrices.

### Security, privacy, compliance and sustainability

Current defaults are local/private, analytics-off and least privilege. The native
shell has a strict CSP and empty IPC capability. Future remote storage requires
encryption under the default policy. Credential vaults, encrypted native packages,
formal threat modelling, independent security review, legal compliance and
measurable compute/energy reporting remain real gates.

### Cross-system interoperability and resource mesh

The canonical project and versioned extensions are the stable meaning layer.
Provider, hardware, storage, interchange and evidence systems attach through
capability contracts. AAF/OMF/MusicXML and other external formats require
format-specific adapters and conformance fixtures. Cross-chain remains evidence
portability; money/token bridging is not part of the creative core.

## Build order beyond the current vertical slice

1. Complete advanced DAW editing: automation, comping, bounce/freeze, media relink
   and project packages.
2. Turn the sampler foundation into canonical pad/slice/multisample workflows.
3. Add MIDI output/clock and a user-authored hardware profile/mapping editor.
4. Add local rights/contributor/release interfaces before any authority adapter.
5. Add local collaboration comments/change history, then a reviewed sync adapter.
6. Add video clips/proxies and captions before colour/VFX render pipelines.
7. Add validated loudness/true-peak and target-profile registries.
8. Add a real time-preserving pitch backend and derived-rendition cache.
9. Add provider-backed community/social/marketplace services only with moderation,
   safety, consent, payment and dispute operations.
10. Add native plugin/media/hardware processes behind strict capabilities and
    platform-specific test matrices.

This map deliberately reaches beyond v3.1 while keeping implementation language
truthful. The Ecosystem screen reads the same machine-readable catalogue, so the
vision and the build cannot quietly drift apart.
