POIETEK / STUDIO DAW STATION (SDS)
MASTER DEVELOPMENT LIBRARY — VERSION 1.0

Compiled from:
1) The complete product-development conversation supplied by the creator.
2) Deep review of GitHub repository: jayprophit/Studio-Daw-Station-SDS-
3) Current cross-platform/offline-first architecture recommendations.

WORKING PRODUCT NAME
Poietek is the working ecosystem name discussed in the design conversation.
Studio DAW Station (SDS) is the current repository/product label.
Final public branding should be chosen only after trademark/domain checks.

CORE RULE
One app. One project model. One creative graph. Many workspaces.
Offline first. Cloud optional. Hardware agnostic. Collaboration capable.
Professional depth without forcing beginners to see every advanced control.

LEGAL / CLEAN-ROOM RULE
Competitor products, patents, papers, hardware and interfaces may be studied for
functional principles, workflows and interoperability requirements. Do not copy
proprietary source code, protected assets, branded UI expression, undocumented
confidential protocols, or patented claims without appropriate legal review or
licensing. Compatibility layers should use documented/open interfaces wherever
possible.

===============================================================================

PURPOSE OF THIS BATCH
This ordered document set is designed so a human developer or an AI coding agent
can consume the project in sequence without losing the original vision.

The current GitHub repository is a useful UI/interaction prototype, not yet a
production DAW. The correct strategy is evolutionary:
- preserve useful React UI and workflow ideas;
- replace simulated/demo logic with stable engines and domain services;
- introduce a local-first project model before adding more surface features;
- add platform adapters so desktop, tablet, mobile and web share one project;
- add collaboration, rights, video and community as modules around the same data.

DOCUMENT ORDER

00  READ ME FIRST / Master Index
01  Product Vision, Principles and User Stories
02  Current Repository Deep Audit
03  Canonical Domain Model and Universal Project Format
04  Cross-Platform Application Architecture
05  Offline-First Storage, Sync, Collaboration and Versioning
06  Audio, MIDI, Hardware, Mapping and Plugin Architecture
07  DAW, Sampling, Composition, Mixing and Mastering Specification
08  Video, VFX, Visual Production and Unified Timeline
09  AI, Automation, Analysis and Creative Intelligence
10  Community, Messaging, Rights, Publishing and Monetisation
11  UI/UX, Workspaces, Learning, Accessibility and Customisation
12  Security, Privacy, Extensions, SDK and Operations
13  Migration Roadmap: SDS Prototype -> Production Platform
14  Master AI Builder Prompt
15  Acceptance Tests and Feature Traceability Matrix
16  Pitch, Time, Vocal Alignment & Audio-Note Editing Research
17  DJ, DVS, Live Remix, Set Preparation & Performance Architecture
18  Plugin Host, Synthesis, Modulation, Effects & Mastering Architecture
19  Connected Storage Fabric, Git Forges & Bring-Your-Own-Cloud
20  Open Resources, Third-Party Research & Firebase Web Prototype
21  UI/UX System, Frontend Architecture & Design Structure
22  Backend, Service Layer, API & Data Architecture
23  Complete System Architecture, Runtime Topology & Repository Structure
24  Engineering Operations, API Contracts, DevEx, Testing & Release Structure
25  Brand, Naming, Product Taxonomy & IP Clearance
26  Legal, Compliance, Policy, App-Store & Marketplace Architecture
27  Interoperability, File Formats, Codecs, Import/Export & Archival
28  Installation, Updates, Packaging, Localization, Support & Admin
29  Performance Budgets, Benchmarks, Certification & Compatibility
30  Master Gap Analysis & Remaining Roadmap
31  Project Schema v1
32  API Contract v1
33  Database Schema v1
34  Sync / CRDT Protocol v1
35  Audio Engine Detailed Technical Design v1
36  UI Wireframe Specification v1
37  Security Threat Model v1
38  Test Fixture Catalogue v1
39  First Vertical Slice Implementation Plan
40  Business, Hosting Cost & Sustainability Model
41  Command Bus, Domain Events & Undo Contract v1
42  Storage Provider SDK & Routing Contract v1
43  Device Profile Schema & Hardware Learn Contract v1
44  Extension / Plugin Manifest & Permission Model v1
45  Firebase Web MVP Data Mapping & Security Rules
46  PWA, Offline Boot & Local Storage Contract
47  Frontend State, Application Services & React Boundaries
48  Error, Telemetry & Observability Contract v1
49  CI/CD, Release Automation & Quality Gates v1
50  SDS -> Poietek Repository Migration Taskboard
51  Monorepo / Package Bootstrap
52  Project Factory, IDs & Validation Code
53  IndexedDB Local Project Repository Code
54  OPFS Asset Store, Hashing & Waveform Code
55  Command Bus / Undo Starter Code
56  Waveform / Timeline Read Model Code
57  WebAudio Backend / Transport Starter
58  React Arrangement Integration
59  PWA Service Worker / Offline Boot Code
60  Firebase Emulator + Current Repo Integration
61  Installed App & Native Runtime Architecture
62  Platform Packaging / App-Store Release Matrix
63  Supabase + Firebase Hybrid Backend
64  Website, Webapp & Installed Product Surfaces
65  Five-Star Competitive Benchmark Standard
66  Competitive Feature Benchmark — August 2026
67  Five-Star Gap Backlog
68  Benchmark Test Harness & Metrics
69  Release Certification & Five-Star Gate
70  Native + Hybrid Backend Integration Roadmap
101 Universal Console Bridge Architecture
102 Audio Clock, Timing & Sync Domains
103 Digital Console Bidirectional Control
104 Digital Audio Transport: USB, Optical & Network
105 Analogue & Hybrid Console Integration
106 Mixer State Mirror, Automation & Conflict Resolution
107 Console Profile & Adapter SDK
108 Patching, Routing, Scenes & Recall
109 Console Network Security & Remote Control
110 Console Sync Benchmark & Certification
111 Audio Health & AI Assistant Architecture
112 Recording Input Preflight & Gain Staging
113 Loudness, True-Peak & Standards Engine
114 Audio Fault & Quality Detection
115 AI Recommendations, Safety & Auto-Fix
116 Reference Listening, Calibration & Test Signals
117 Delivery Loudness / Platform Profile Registry
118 Live Console & Recording Health Guard
119 Audio Health Test & Benchmark Certification
120 End-to-End Record -> Mix -> Master -> Export Assistant
121 Technical Standards vs Style Norms Architecture
122 Music Genre Taxonomy & Reference Profiles
123 AI Music Style / Mix / Master Assistant
124 Film, TV & Visual Technical Standards Registry
125 Film Genre & Visual Style Reference Intelligence
126 AI Colour, HDR, Exposure & Visual QC Assistant
127 Captions, Accessibility, Dialogue & Content AI
128 Content Delivery Preflight Engine
129 Content Intelligence Model & Data Governance
130 Universal AI Standards & Creative Assistant Workflow
131 Public Release Readiness Engine
132 Tuning Reference & Musical Pitch Standards
133 Radio / TV Broadcast Release Profiles
134 Release Profile AI Fix Assistant
135 Cross-System Interoperability Fabric
136 Cross-Network & Protocol Router
137 Cross-Platform / Cross-Device Handoff
138 Cross-Language, Cross-Code & Runtime Bridges
139 Cross-Node Smart Resource Grid
140 Cross-Chain Evidence Portability
141 Cross-Media, Cross-Symbol & Cross-Idea Interoperability
142 Cross-Build & Interoperability Certification
143 Organic & Alternative Tuning Architecture
144 A432 & Alternative Reference-Pitch Policy
145 Harmonic Series & Just Intonation
146 Historical & Microtonal Temperaments
147 MIDI, Scala & Microtuning Interoperability
148 Audio Retuning & Sample Integrity
149 Tuning Health & AI Assistant
150 Tuning Automation & Regional Maps
151 Organic Mode for Sound Design
152 Tuning Benchmark & Release Compatibility
153 Alternative Tuning Creative Rights Policy
154 Public Release Tuning Compatibility Advisor
155 Dual Master: Original + Compatibility Export
156 Tuning Metadata & File Inspector
157 Community Tuning Library
158 Organic Tuning Community Discovery
159 Tuning History & Evidence Notes
160 Tuning Release UI End to End
161 Community Player Tuning Architecture
162 Listener Playback Tuning Preferences
163 Real-Time Pitch Shift & Tempo Preservation
164 Video Player Tuning & A/V Sync
165 Community Wall, Archive & Channel Tuning
166 Derived Tuning Renditions, Cache & CDN
167 External Platform Export: YouTube Profile
168 Public Radio/Broadcast: Tuning vs Delivery
169 Rights & Provenance for Alternate Playback Renditions
170 Community Tuned Player Tests & 5-Star Gate
171 Repo-Ready Implementation Foundation
172 Local Project Runtime, Session & Undo
173 Real Audio Import / Asset / Waveform
174 WebAudio Timeline Playback
175 Audio Health Implementation
176 Tuning / Community Player Build Boundary
177 Release Readiness Engine Code
178 Multi-Provider Capability Router Code
179 Native + PWA Build Scaffold
180 Repo Integration, Validation & Next Build
99  Complete Combined Master Specification

HOW AN AI CODING AGENT SHOULD USE THESE FILES
1. Read 00-05 before changing architecture.
2. Read 06-12 before implementing the relevant subsystem.
3. Use 13 for implementation order.
4. Use 14 as the controlling agent prompt.
5. Use 15 as the definition of done.
6. Never implement a UI label as though the underlying feature exists. A feature
   is not complete until its domain model, persistence, engine behavior, error
   states, tests and platform capability checks exist.

NON-NEGOTIABLE PRODUCT REQUIREMENTS
- Core creation works offline.
- Internet is not required to open/edit a local project.
- Projects can later sync between a user's devices.
- Team projects support asynchronous and live collaboration.
- Audio/video binaries are not stored inside CRDT text structures.
- Every meaningful change is reversible or versioned.
- Hardware mappings are device-agnostic internally.
- Desktop, mobile, tablet and web use the same logical project format.
- Platform capability differences are explicit rather than hidden.
- AI actions are previewable, explainable and reversible.
- Quick Export never forces rights IDs.
- Release/Publish can optionally collect full rights and credit metadata.
- All contributors can be credited: artists, producers, engineers, musicians,
  visual artists, editors, camera crew, labels/publishers and other roles.
- Internal community sharing and external publishing are separate capabilities.
- The app may be free/community-driven; cloud costs can be separated from core
  creation if necessary without locking fundamental creative tools behind packs.

PRODUCT LAYERS
Layer 1 — Creator Studio
Layer 2 — Hardware Bridge
Layer 3 — Local Project/Asset System
Layer 4 — Sync & Collaboration
Layer 5 — AI/Analysis
Layer 6 — Rights/Credits
Layer 7 — Community/Marketplace
Layer 8 — Publishing/Distribution
Layer 9 — Developer Ecosystem

THE SINGLE MOST IMPORTANT FIRST ENGINEERING MOVE
Create a canonical serializable Project domain model and LocalProjectRepository.
Until that exists, adding more UI modules will increase technical debt.

VERSION 1.1 ADDITION
Document 16 adds clean-room research and architecture for real-time tuning, note-level editing, vocal/double alignment, audio-to-MIDI and later polyphonic audio-note editing.

VERSION 1.2 ADDITION
Document 17 adds the complete DJ/live-performance architecture: set preparation, beatgrids, decks, DVS, scratch, stems, performance grid, controller mapping, video/VJ, mobile, set history and live reliability.

VERSION 1.3 ADDITION
Document 18 adds third-party plug-in hosting, native synthesis, universal modulation, built-in effects, plugin sandboxing, VST3/CLAP/AU policy, AAX limitations, mastering architecture and plugin portability/freeze behavior.

VERSION 1.4 ADDITION
Document 19 adds user-selectable storage locations, Auto/Local/Custom modes, optional provider installation, Git/model-hub roles, BYOC, redundancy and team access.
Document 20 adds the open-resource registry, GitHub/Hugging Face research policy, closed-source clean-room inspiration policy, licence gates and Firebase Spark web-prototype adapter.

VERSION 1.5 ADDITION
Documents 21-24 define the complete UI/UX and frontend architecture, backend/service architecture, full system/runtime/repository topology, and engineering operations, API contracts, testing and release structure.

VERSION 1.6 ADDITION
Documents 25-30 add brand/naming architecture, legal/compliance, file/codec interoperability, installation/localization/support, measurable performance and certification, and a master gap analysis identifying concrete implementation artifacts still missing.

VERSION 1.7 ADDITION
Documents 31-40 are concrete implementation contracts. Companion machine-readable artifacts include project.schema.v1.json, openapi.v1.yaml, database.v1.sql and fixtures.

VERSION 1.8 ADDITION
Documents 41-50 add command/event contracts, storage/device/extension schemas, Firebase security rules, PWA behavior, frontend service boundaries, error/telemetry contracts, CI templates, and the concrete SDS-to-Poietek repository migration taskboard.

VERSION 1.9 ADDITION
Documents 51-60 include actual starter TypeScript/JavaScript code for the first local-first audio vertical slice, plus Firebase emulator scaffolding.

VERSION 1.10 ADDITION
Documents 61-70 make installed desktop/mobile/tablet behavior a formal requirement, add Tauri 2 starter packaging, Supabase+Firebase hybrid backend architecture, and a measurable five-star competitive certification framework.

VERSION 2.0 ADDITION
Documents 61-70 formalize installed native apps, Tauri packaging, Supabase/Firebase backend roles, Supabase RLS, and evidence-based 5-star competitive benchmarking against current category leaders.

README UPDATE — MULTI-PROVIDER FREE-TIER ARCHITECTURE
README.md now defines Poietek's combined Firebase/Supabase strategy, capability routing, BYOC storage, AI/ML provider routing, native-app delivery, open-source resource policy, and evidence-based 5-star quality targets.

VERSION 2.1 ADDITION
Documents 71-80 add contributor passports, external society identifier abstraction, project/session access policies, embedded rights metadata, DDEX/C2PA provenance, registration/reconciliation, marketplace splits, fan support and sustainable managed-service monetization.

VERSION 2.2 ADDITION
Documents 81-90 add an optional hybrid blockchain evidence ledger, contributor cryptographic approvals, triple time proof, smart-contract hash anchoring, Merkle settlement proofs, walletless/account-abstraction UX, privacy/correction rules and blockchain security gates.

VERSION 2.3 ADDITION
Documents 91-100 classify proof mechanisms, add creator Proof Records and ZKP research, global privacy/security architecture, DevSecOps/MLOps, decentralized music/video inspiration, DAO/NFT/Ordinals classification, creator media/player/feed architecture, Smart Resource Mesh/MML/automation, and AI learning roadmaps.

VERSION 2.4 ADDITION
Documents 101-110 add universal digital/analogue/hybrid console synchronization, separate audio/clock/control planes, USB/MADI/ADAT/AES3/AES50/Dante/AES67 routing, bidirectional desk state, analogue capability limits, scenes, secure remote control and console certification.

VERSION 2.5 ADDITION
Documents 111-120 add deterministic audio-health measurement, recording level preflight, ITU/EBU loudness/true-peak architecture, clipping/noise/phase/fault checks, contextual AI recommendations, calibration/test signals, updateable delivery profiles, live-console recording health guard and audio-health certification.

VERSION 2.6 ADDITION
Documents 121-130 add a formal delivery-standards registry, open/adaptive music genre taxonomy and style reference profiles, AI music mix/master guidance, film/TV/HDR/DCP/IMF profiles, visual-style intelligence, colour/HDR QC, captions/accessibility, universal delivery preflight and creative-intent safeguards.

VERSION 2.7 ADDITION
Documents 131-142 add target-based public release readiness (including ISO A440 tuning, EBU/ITU/ATSC broadcast profiles) plus cross-system/network/platform/device/chain/node/program/app/language/code/media/build/idea/grid interoperability.

VERSION 2.8 ADDITION
Documents 143-152 add A432 and other reference-pitch options, harmonic/just intonation, historical and microtonal temperaments, Scala/MTS/MIDI2 tuning interop, non-destructive audio retuning, tuning-health AI and Organic Mode.

VERSION 2.9 ADDITION
Documents 153-160 preserve alternative/organic tunings in community and public release, add destination-specific compatibility advisories, dual original/A440 exports, tuning metadata inspection, community tuning sharing/forking and verified historical notes.

VERSION 3.0 ADDITION
Documents 161-170 separate canonical creator tuning from community-player tuning and external delivery, add listener A432/A440/custom playback, tempo-preserving video-safe retuning, derived rendition caching, current YouTube export rules, broadcaster-specific tuning policy, provenance and 5-star player tests.

VERSION 3.1 ADDITION
Documents 171-180 return development to implementation: repo-ready src/poietek runtime, local persistence, real audio import/waveforms, WebAudio playback, audio-health code, release readiness, provider routing, Tauri/PWA scaffolding, exact integration patches and passing validation.
