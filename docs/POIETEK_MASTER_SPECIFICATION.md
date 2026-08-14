# Poietek Studio master product and system specification

Document ID: `POI-MASTER-001`
Version: `1.0.0`
Status: controlled living specification
Updated: 2026-08-13

## 1. Purpose and source authority

This is the controlling index for the Poietek/SDS creative operating system. It
consolidates the historical `sds.txt`, the v3.1 handoff material, the current
repository, and the implementation-status catalog into one traceable product
definition. It is intentionally an index and decision framework rather than a
claim that every envisioned service is already operational.

Authority order:

1. Validated runtime code and tests determine whether a capability works.
2. Versioned contracts determine the intended shape and truth rules for a
   foundation capability.
3. This specification determines product scope, terminology and acceptance.
4. `src/poietek/vision/catalog.ts` is the machine-readable status summary.
5. Historical conversation and ZIP artifacts are design inputs, not runtime
   truth and not instructions to overwrite newer code.

Professional publication is split into the fourteen numbered volumes indexed by
`docs/volumes/README.md`. The volumes elaborate this master for specialist
audiences; they do not create independent or conflicting implementation claims.

Historical source record:

| Source | Evidence |
| --- | --- |
| Full SDS conversation export | `C:\Users\jpowe\Desktop\Studio-Daw-Station-SDS-\sds.txt` |
| Decoded size | 5,504 lines / 152,303 characters |
| SHA-256 | `83b1cf2b4d103ef22f36d1a31442efc095469b330c84821b4cac3ab509163fff` |
| Consolidated coverage | `docs/SDS_VISION_COVERAGE.md` |
| Machine-readable scope | `src/poietek/vision/catalog.ts` |
| Current build truth | `docs/BUILD_STATUS.md` and automated tests |

## 2. Status vocabulary

Every requirement, control, screen, adapter and service uses one of these states:

| Status | Meaning |
| --- | --- |
| `operational` | Integrated into a real workflow, truthful about its result, and covered by relevant verification. |
| `foundation` | Serializable contracts, safe defaults or validation exist, but the end-to-end service is incomplete. |
| `prototype` | A useful interactive concept exists but is not canonical production truth. |
| `planned` | Accepted scope with an owner, dependency and acceptance boundary; no production claim. |
| `external-gate` | Requires configured services, legal authority, licensed SDK/content, physical hardware or independent validation. |
| `unavailable` | Deliberately exposed as unavailable on the current platform or configuration. |
| `retired` | Removed or superseded; retained only in Git history or the external archive. |

No marketing label, menu item, simulated meter, product-name match or provider
configuration may promote a feature to `operational`.

## 3. Vision

Poietek is a local-first creative operating system in which a creator can move
from an idea to a durable project, performance, collaborative revision, rights
record, release package, community rendition and commercial offering without
losing authorship, provenance or control of the original work.

The product combines thirteen systems around one versioned creative data model:

| ID | System | Current class | Product outcome |
| --- | --- | --- | --- |
| `CAP-01` | Professional DAW | operational vertical slice | Record, arrange, edit, mix, inspect and export durable projects. |
| `CAP-02` | Sampler and instruments | foundation/prototype | Chop, map, layer, synthesize, resample and perform original or licensed sounds. |
| `CAP-03` | Hardware controller | foundation | Map verified devices without inferring unsupported controls. |
| `CAP-04` | MIDI hub | foundation | Route notes/control and later clock, MPE, MIDI 2, OSC and network control. |
| `CAP-05` | Video editor | foundation | Share project time, assets, annotations, captions and delivery with picture. |
| `CAP-06` | VFX suite | foundation | Host a future render graph for compositing, colour, motion and audio-reactive visuals. |
| `CAP-07` | Collaboration platform | foundation | Commit locally, synchronize revisions, review and resolve conflicts. |
| `CAP-08` | Publishing platform | foundation | Prepare destination-specific packages without silently changing the creator original. |
| `CAP-09` | Rights platform | foundation | Track contributors, splits, agreements, clearances, registrations and evidence. |
| `CAP-10` | AI creative assistant | operational local core | Give project-aware guidance with optional consented provider routing and reversible actions. |
| `CAP-11` | Creator social network | foundation | Support creator identities, feeds, channels, remixes, comments and live spaces with moderation. |
| `CAP-12` | Marketplace | foundation | Sell original/licensed assets, tools, education and services with explicit licence and payment evidence. |
| `CAP-13` | Cloud platform | foundation | Add optional encrypted sync, backup, provider storage and remote compute without weakening offline use. |

## 4. Product philosophy and non-negotiable rules

| ID | Rule |
| --- | --- |
| `PHI-001` | Local device state is the primary working copy; network failure must not make core creation unusable. |
| `PHI-002` | The canonical project is JSON-serializable and never stores browser/native handles, streams, ports or `AudioBuffer`. |
| `PHI-003` | Original creator media and metadata are preserved. Compatibility, tuning or delivery versions are separate derivatives. |
| `PHI-004` | AI proposes, explains and previews. A user accepts material changes, and accepted changes are undoable commands. |
| `PHI-005` | Creative Intent Lock may demote stylistic advice, but it cannot suppress a formal destination requirement. |
| `PHI-006` | Rights submission is not acceptance; payment initiation is not settlement; a blockchain receipt is evidence, not ownership law. |
| `PHI-007` | RMS is not LUFS, sample peak is not dBTP, timer animation is not sample-accurate scheduling, and name matching is not hardware verification. |
| `PHI-008` | Secrets never enter a browser bundle. Remote model/provider access uses a secure proxy, native vault or explicit external authorization. |
| `PHI-009` | Commercial sounds, presets, brands and code are not copied. Content is original, procedural, licensed or supplied by the user. |
| `PHI-010` | Accessibility, privacy, portability, sustainability and creator agency are architecture requirements, not later cosmetic additions. |
| `PHI-011` | Unsupported plugins, devices and formats retain serialized intent and an honest fallback rather than silently disappearing. |
| `PHI-012` | Capability state is derived from evidence and observation time, and can degrade or become unavailable. |
| `PHI-013` | A tier catalogue is policy, not runtime truth: reference pricing never enables checkout, payment initiation is not settlement, purchased content follows its licence, and local creation survives provider failure. |

## 5. Complete requirement domains

These domain IDs ensure that every category requested in the historical design is
owned and traceable. Detailed screens and controls live in
`docs/UI_SCREEN_WORKFLOW_CATALOG.md`; technical boundaries live in
`docs/PLATFORM_DATA_API_SECURITY_BLUEPRINT.md`.

| Domain ID | Scope that must be covered | Primary specification/evidence |
| --- | --- | --- |
| `DOM-VISION` | Overall vision, principles, success measures, ownership and terminology | This document; `SDS_VISION_COVERAGE.md` |
| `DOM-FEATURE` | Every operational, foundation, prototype and planned capability | `src/poietek/vision/catalog.ts`; capability table above |
| `DOM-MENU` | Every global menu, item, shortcut, enabled state and unavailable reason | `StudioMenuBar.tsx`; UI catalog |
| `DOM-SETTINGS` | Every settings page, field, profile, validation rule, platform limitation and migration | `src/poietek/settings/`; UI catalog |
| `DOM-CONTROL` | Every button/control group, effect, destructive action, permission prompt and feedback state | UI catalog; component tests |
| `DOM-SCREEN` | Every shell area, desk, rack device, modal, mobile state, empty/error/loading state and future service surface | UI catalog |
| `DOM-WORKFLOW` | Create, import, record, edit, mix, export, recover, perform, collaborate, clear rights, publish, sell, learn and administer | Section 8; UI catalog |
| `DOM-AI` | Local assistant, provider router, model catalog, consent, context, memory, generation, evaluation and governance | AI section; platform blueprint |
| `DOM-HARDWARE` | Audio/MIDI devices, consoles, control, routing, clock domains, timecode, metering, profiles and evidence | Hardware section; platform blueprint |
| `DOM-DATA` | Canonical project, assets, settings, recovery, platform extensions, indexes, local/remote persistence and migrations | Platform blueprint |
| `DOM-API` | Internal commands, provider adapters, local/native bridges, remote service APIs, events, webhooks and error envelopes | Platform blueprint |
| `DOM-SECURITY` | Threat boundaries, least privilege, encryption, credentials, privacy, abuse prevention, audit, retention and compliance gates | Platform blueprint |
| `DOM-CLOUD` | Optional storage/sync/compute providers, replicas, conflict handling, quotas, outage behavior and portability | Platform blueprint |
| `DOM-COMMUNITY` | Identity, profiles, feeds, comments, messages, moderation, remix lineage, tuning player and federation policy | Platform contracts; community contracts |
| `DOM-RIGHTS` | Passports, splits, signatures, agreements, clearances, registrations, corrections, provenance and royalties | Platform contracts; workflow catalog |
| `DOM-PUBLISHING` | Metadata, identifiers, destination profiles, preflight, delivery, release status and analytics consent | Community/release contracts; roadmap |
| `DOM-PLUGIN` | Web/native plugin formats, VFX formats, scanning, sandboxing, quarantine, missing state, freeze/render and licences | Platform blueprint |
| `DOM-SDK` | Versioned schemas, commands, UI extensions, hardware/provider/storage adapters, fixtures and compatibility | Platform blueprint |
| `DOM-DEVELOPER` | Repository structure, tooling, build, lint/typecheck/test, preview, native doctor, release and contribution rules | `ARCHITECTURE.md`; delivery plan |
| `DOM-ACCESSIBILITY` | Keyboard, focus, touch, contrast, scaling, reduced motion, screen readers, captions, transcripts and adaptive layouts | UI catalog; delivery plan |
| `DOM-LEARNING` | Onboarding, contextual hints, walkthroughs, courses, practice projects, coach and explainable AI | UI catalog; learning contracts |
| `DOM-USERS` | Creator, performer, engineer, producer, editor, collaborator, rights/publishing, buyer/seller, educator/student, moderator, administrator and developer | Section 6 |
| `DOM-PERMISSIONS` | Project roles, organization roles, capability grants, consent scopes, device/browser permissions and privileged actions | Section 7; platform blueprint |
| `DOM-ROADMAP` | Every delivery phase, dependency, gate, acceptance test and non-goal | `ROADMAP.md`; delivery plan |
| `DOM-BUSINESS` | Tiers, price books, licences, subscriptions, entitlements, usage, seats, receipts, refunds, marketplace revenue and commercial release gates | `BUSINESS_TIER_ARCHITECTURE.md`; business contracts |

## 6. User types

User types describe goals; they do not automatically grant permissions.

| ID | User type | Primary needs |
| --- | --- | --- |
| `USR-001` | Solo creator/songwriter | Fast offline capture, arranging, instruments, lyrics/notes, mix and release preparation. |
| `USR-002` | Producer/beat maker | Sampling, sequencing, sound design, groove, automation, collaboration and commercial packs. |
| `USR-003` | Recording/mix/mastering engineer | Reliable I/O, routing, editing, metering, recall, delivery profiles and audit evidence. |
| `USR-004` | Musician/performer/DJ | Low-latency instruments, controllers, cues, scenes, decks, performance capture and resilience. |
| `USR-005` | Video editor/VFX artist | Shared timeline, proxies, captions, colour, compositing, render jobs and audio handoff. |
| `USR-006` | Collaborator/session contributor | Scoped project access, comments, uploads, versions, credits, splits and approvals. |
| `USR-007` | Label/publisher/rights administrator | Metadata, agreements, registrations, corrections, release status and royalty evidence. |
| `USR-008` | Educator/student | Guided projects, theory/production lessons, safe practice media and progress privacy. |
| `USR-009` | Community listener/fan | Creator-approved playback, tuning derivatives, follows, purchases and privacy controls. |
| `USR-010` | Seller/service provider/buyer | Listings, licences, orders, fulfilment, disputes and receipts. |
| `USR-011` | Moderator/trust-and-safety operator | Reports, queues, evidence, appeals, sanctions and auditable decisions. |
| `USR-012` | Organization administrator | Membership, policy, billing, retention, integrations and security review. |
| `USR-013` | Developer/integrator/hardware maker | SDKs, schemas, fixtures, adapters, signing, diagnostics and compatibility certification. |

## 7. Roles, permission levels and consent

Project roles:

| Role | Read | Comment | Edit project | Manage members | Delete/publish |
| --- | --- | --- | --- | --- | --- |
| Owner | yes | yes | yes | yes | yes, with confirmation and external authority where required |
| Editor | yes | yes | yes | no | no by default |
| Commenter | yes | yes | no | no | no |
| Viewer | yes | no | no | no | no |

Future organization/service roles are additive: billing administrator, rights
administrator, release manager, support operator, moderator, security auditor and
developer. They must be scoped to an organization/service and never silently
inherit project ownership.

Permission classes:

| ID | Permission class | Examples and rule |
| --- | --- | --- |
| `PERM-LOCAL` | Local project mutation | Requires an open project and an undoable command where content changes. |
| `PERM-DEVICE` | Browser/device | Microphone, MIDI, SysEx, storage persistence, notifications, camera and file-system access are requested just in time. |
| `PERM-REMOTE` | Remote data transfer | Requires enabled provider, allowed data classes, policy and per-request consent where configured. |
| `PERM-TEAM` | Collaboration | Requires membership, project role and authenticated replica. |
| `PERM-PUBLISH` | Public release/community | Requires owner/release-manager authority, complete preflight and explicit visibility choice. |
| `PERM-RIGHTS` | Rights approval/registration | Requires participant/rights-admin authority and evidence; the application cannot self-accept. |
| `PERM-COMMERCE` | Listing/payment/fulfilment | Requires seller/billing authority and authoritative payment/provider evidence. |
| `PERM-HARDWARE` | Privileged hardware command | Requires verified adapter/capability, explicit target and confirmation for destructive recall/routing. |
| `PERM-ADMIN` | Organization/service administration | Requires strong authentication, least privilege, audit logging and separation from creative content access. |

## 8. Required end-to-end workflows

| Workflow ID | Workflow | Minimum truthful completion |
| --- | --- | --- |
| `WF-001` | Create and reopen offline project | Create → autosave → close → reopen same validated project without network. |
| `WF-002` | Import audio | Select file → hash → decode → store media → waveform → asset/track/clip → autosave. |
| `WF-003` | Record audio | Probe capability → permission → capture → cleanup → decode → waveform/health → track/clip → autosave. |
| `WF-004` | Arrange and edit | Select → move/trim/gain/pan/fade/mute/split/remove → validate → undo/redo → persist. |
| `WF-005` | Mix and route | Track gain/pan/mute/solo → buses/sends/inserts as adapters mature → playback/export parity. |
| `WF-006` | Recover a crash | Discover checkpoint → Recover/Skip/Discard → label recovered state unsaved → explicit save. |
| `WF-007` | Export | Select scope/profile → render supported graph → encode → metadata/limitations → download/write → verify. |
| `WF-008` | Sample and resample | Load/record → detect/slice → map zones/pads → process → perform → resample → canonical program. |
| `WF-009` | Connect hardware | Permission/discovery → identify/profile → negotiate → map/route → measure/verify → save desired state. |
| `WF-010` | Collaborate | Local commit → signed/authenticated change envelope → sync → conflict/review → accepted merge → offline continuation. |
| `WF-011` | Contributor and rights | Add passport → propose roles/splits → participant acceptance → agreements/clearance → correction history. |
| `WF-012` | Publish | Select destination → metadata/identifiers → preflight → creator-approved derivatives → submit → observe external status. |
| `WF-013` | Community share/remix | Choose visibility/licence/tuning → moderation gates → publish → trace playback/remix lineage → correction/takedown. |
| `WF-014` | Marketplace order | Draft listing/licence → publish evidence → payment provider → fulfilment only after evidence → receipt/dispute. |
| `WF-015` | AI assistance | Select mode/context/data → local or consented route → evidence findings → preview → accept/reject → undoable apply. |
| `WF-016` | Learn | Assess goal → recommend lesson → practice in safe project → explain evidence → private progress → optional sharing. |
| `WF-017` | Video/VFX delivery | Ingest/proxy → shared timeline → edit/caption/grade/composite → render job → validated output package. |
| `WF-018` | Cross-device handoff | Commit → inventory/hash → route replicas → open supported state → relink/freeze missing capabilities → continue offline. |
| `WF-019` | Purchase or restore entitlement | Approved regional price → secure provider checkout or restore → verified event → durable receipt → signed entitlement snapshot → offline grace without locking local projects. |

## 9. AI product requirements

The independent Poietek Studio Brain is the default. Optional routes include local
models, Ollama, OpenAI-compatible endpoints, OpenAI, Anthropic, Gemini, xAI,
DeepSeek, Kimi, Copilot, Manus, Hugging Face and a custom module contract. A
catalog entry is not a promise that a provider is configured or callable.

AI modes: project, arrangement, mix, sampling, release, rights and learning.
Future cross-modal modes add video, VFX, artwork, captions, marketing and studio
operations. Data classes are explicit: project metadata, audio features, lyrics,
media, rights and personal data.

Mandatory AI controls:

- provider/model/endpoint and execution-location disclosure;
- local/remote indicator and health state;
- requested data and consent preview;
- no raw browser secret storage;
- evidence-linked findings and confidence/limitation language;
- preview, accept and reject for proposed changes;
- canonical undo command for applied changes;
- provenance record for generated or transformed media;
- opt-out, history retention and deletion controls;
- model evaluation, abuse/safety and regression gates before release.

## 10. Hardware and protocol requirements

Protocol families are independent capabilities, not one generic “connected” flag:

- audio I/O: Web Audio/MediaDevices now; ASIO, WASAPI, Core Audio, ALSA/JACK and
  platform mobile audio behind native adapters;
- MIDI: Web MIDI, MIDI 1 input parsing and explicit SysEx now; MIDI output/clock,
  MPE, MIDI 2 UMP, Bluetooth MIDI and RTP/network MIDI as staged adapters;
- control: MIDI CC/NRPN, Mackie-style/HUI-style mapped control where legally and
  technically appropriate, OSC, HID, serial, USB and vendor network APIs;
- audio networks and digital links: Dante/AES67, AVB, MADI, ADAT, S/PDIF and AES3
  only through verified hardware/network adapters;
- timing: audio transport, sample clock, MIDI clock/control, word clock,
  LTC/MTC and meter observations remain separate domains;
- video/show: genlock, timecode, Art-Net/sACN/DMX and show-control timelines are
  later capability domains;
- consoles: digital control-only sync, scene/routing diff and analogue recall are
  separated from actual audio transport and metering.

Every device profile records provenance, user selection and observations. Latency
requires physical loopback or another declared measurement source. Connection or
product-name matching never proves a port, clock lock, meter or remote-control
capability.

## 11. Derived delivery set

This master specification controls the following maintained artifacts:

| Deliverable requested | Controlled artifact |
| --- | --- |
| Software architecture | `docs/ARCHITECTURE.md` |
| UI designs, screens, menus, controls and workflows | `docs/UI_SCREEN_WORKFLOW_CATALOG.md` |
| Database schema and data lifecycle | `docs/PLATFORM_DATA_API_SECURITY_BLUEPRINT.md` |
| API documentation and adapter boundaries | `docs/PLATFORM_DATA_API_SECURITY_BLUEPRINT.md` |
| AI architecture | this document, platform blueprint and `src/poietek/ai/` |
| Backend and cloud services | platform blueprint and delivery plan |
| Frontend | architecture, UI catalog and `src/poietek/react/` |
| Mobile, desktop, PWA and browser web application | `docs/OFFLINE_DEPLOYMENT.md`; delivery plan |
| Deployment and operations | `docs/OFFLINE_DEPLOYMENT.md`; delivery plan |
| Testing and release gates | `docs/DELIVERY_TEST_DOCUMENTATION_PLAN.md` |
| Product/user/developer documentation | delivery plan and repository `docs/` index in `README.md` |
| Roadmap phases | `docs/ROADMAP.md` and delivery plan |

## 12. Definition of coverage and change control

A domain is “covered” when it has all of the following:

1. A stable requirement ID and responsible subsystem.
2. A status using the vocabulary in section 2.
3. User types, permissions and consent boundaries.
4. Data owned and data explicitly not owned.
5. Commands/APIs and failure/unavailable states.
6. Security, privacy, accessibility and offline behavior.
7. Acceptance tests or a named external gate.
8. Documentation and migration impact.

New features must update this specification or a linked controlled artifact,
`src/poietek/vision/catalog.ts` when scope/status changes, and automated coverage
tests. A feature may not be marked operational until the code, user workflow and
verification agree.
