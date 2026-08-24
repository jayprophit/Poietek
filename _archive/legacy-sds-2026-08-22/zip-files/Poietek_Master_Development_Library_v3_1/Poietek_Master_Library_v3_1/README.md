# Poietek

Poietek is a local-first, cross-platform creative production environment designed
to combine music production, sampling, MIDI, hardware control, DJ/live
performance, video/VFX, collaboration, AI/ML assistance, rights/credits,
publishing, community, and extensibility inside one portable project ecosystem.

The current SDS repository is the prototype foundation. **Poietek** is the working
master brand going forward.

---

## Core Product Rule

Poietek must work **offline first** and must never depend on a single cloud,
database, AI provider, storage service, or vendor account in order to create,
edit, save, play, record, or export a project.

The canonical project belongs to the creator.

External services are optional capability providers.

---

## Delivery Targets

Poietek should behave like a normal application on every supported platform.

### Installed applications

- Windows
- macOS
- Linux
- Android
- iOS
- iPadOS

Installed versions should launch directly from the operating system like ordinary
software. They should not require the user to manually open a browser.

The recommended shared-shell direction is **Tauri 2** around the React/TypeScript
frontend, with native integrations added for filesystem, audio, MIDI, plugins,
windowing, credentials, updates, notifications, and other platform features.

### Web

The browser version remains available as:

- Website
- Web App
- PWA

The web build should support offline startup after installation/caching and use
browser-native technologies such as IndexedDB, OPFS, Web Audio, AudioWorklet,
Web MIDI where available, and Service Workers.

---

# Local-First Architecture

Every important user edit commits locally first.

Typical flow:

```text
User action
    ↓
Command Bus
    ↓
Local Project Repository
    ↓
Local Asset Store
    ↓
UI confirms success
    ↓
Optional background sync/providers
```

Cloud availability must never be required for normal project editing.

If every external service is unavailable, Poietek should still be able to:

- create a project;
- import audio;
- record;
- edit;
- use MIDI;
- use local instruments/effects;
- arrange;
- mix;
- save;
- reopen;
- export;
- use local AI/ML models where installed;
- use locally cached project media.

---

# Combined Free-Tier Provider Strategy

For early development, Poietek should use **multiple free/open providers together**
instead of forcing one service to do every job.

The architecture should route each capability to the best available provider.

This is a **capability router**, not a vendor-specific architecture.

Example:

```text
Poietek
│
├── Local Device
│   ├── Project database
│   ├── Audio/video working media
│   ├── Offline AI/ML
│   ├── Cache
│   └── Crash recovery
│
├── Backend Router
│   ├── Supabase
│   ├── Firebase
│   ├── Self-hosted backend
│   └── Other compatible providers
│
├── Storage Router
│   ├── Local disk
│   ├── External drive
│   ├── TeraBox
│   ├── Google Drive
│   ├── OneDrive
│   ├── Dropbox
│   ├── Box
│   ├── Nextcloud / WebDAV
│   ├── S3-compatible storage
│   ├── Cloudflare R2
│   ├── Backblaze B2
│   ├── GitHub / GitLab for structured files
│   └── User-selected provider
│
├── AI / ML Router
│   ├── Local models
│   ├── Hugging Face models
│   ├── Optional cloud AI APIs
│   └── Future Poietek model providers
│
├── Media Processing Router
│   ├── Local CPU/GPU
│   ├── FFmpeg-compatible workers
│   ├── WebAssembly
│   ├── Native workers
│   └── Optional cloud jobs
│
└── Observability / Delivery
    ├── Firebase services where useful
    ├── Supabase services where useful
    ├── GitHub Actions
    └── Other free/open services
```

---

# Firebase + Supabase Together

Poietek does not need to choose Firebase **or** Supabase exclusively.

They can be combined as long as **one service owns each responsibility**.

A recommended free-first split is:

### Supabase

Best suited to the application data plane:

- authentication;
- PostgreSQL database;
- project directory;
- users/teams;
- comments;
- permissions;
- rights metadata;
- release metadata;
- Realtime presence/broadcast;
- future SQL-based analytics;
- optional small-object storage.

### Firebase

Useful as an optional supporting platform:

- Web Hosting;
- development/testing;
- Crashlytics;
- Performance Monitoring;
- Remote Config;
- App Distribution;
- Cloud Messaging / push notifications later;
- optional Firebase Auth if a migration or compatibility reason exists.

### Important rule

Do not keep the same canonical data independently in both Firestore and Supabase.

For example:

```text
Project membership → Supabase owns it.
Firebase → may observe/host/notify, but does not become a second authority.
```

If Firebase Auth is used later, it should map cleanly into the canonical Poietek
identity layer rather than create a second user universe.

---

# Backend Provider Abstraction

Poietek should expose a provider-neutral interface.

Conceptually:

```ts
interface BackendProvider {
  auth;
  projectDirectory;
  teams;
  comments;
  presence;
  syncRelay;
  notifications;
}
```

Possible implementations:

```text
LocalOnlyBackendProvider
SupabaseBackendProvider
FirebaseBackendProvider
SelfHostedBackendProvider
```

The project schema must never depend on any of these.

---

# Storage Router

Users may have:

- no cloud storage;
- one provider;
- several providers;
- an external SSD;
- NAS;
- private server;
- all of the above.

Poietek should allow:

### Auto — Recommended

Recommend the best available locations based on:

- connected providers;
- free capacity;
- upload/resume support;
- media size;
- team access;
- user preference;
- local disk speed;
- offline requirements.

Auto mode must never silently upload private projects without first receiving
permission.

### Local Only

Everything stays on the current device or user-selected drive.

No cloud account required.

### Choose Locations

Users may choose different locations for:

- project state;
- audio recordings;
- video;
- samples;
- AI models;
- waveform/cache files;
- backups;
- final exports;
- licences/contracts.

### Optional provider install

If a connector is not installed, Poietek may offer:

```text
Install Connector
Connect Account
Configure
Skip
```

Skip must always remain available.

---

# Content-Addressed Media

Large media should be identified by content hash.

Example:

```text
Asset
  id: vocal_take_07
  sha256: ...

Replicas
  ✓ Local SSD
  ✓ TeraBox
  ✓ External SSD
  - Google Drive
```

The project references the Asset ID, not a specific cloud URL.

Benefits:

- deduplication;
- integrity checking;
- offline caching;
- provider migration;
- multiple backup copies;
- cross-device synchronization.

---

# Suggested Storage Roles

Different providers are useful for different things.

### Local filesystem / OPFS

Best for:

- active recordings;
- realtime audio;
- video editing;
- project cache;
- offline use.

### Large cloud / object storage

Best for:

- WAV files;
- stems;
- video;
- proxies;
- archives;
- backups.

Possible providers include user-connected cloud drives or S3-compatible storage.

### Google Drive / OneDrive / similar drives

Useful for:

- project archives;
- MIDI;
- presets;
- artwork;
- licences;
- documents;
- optional media;
- backup copies.

### GitHub / GitLab / Git forges

Best for:

- source code;
- device profiles;
- JSON schemas;
- mappings;
- presets stored as text;
- documentation;
- workflows;
- extension code;
- project manifests.

Do **not** use ordinary Git as the default home for giant multitrack WAV/video
projects.

### Hugging Face / model hubs

Best for:

- optional AI/ML models;
- model cards;
- datasets;
- evaluation assets;
- research prototypes.

Models must pass licence, provenance, security, memory, runtime, and commercial-use
checks before Poietek enables them.

---

# AI / ML Capability Router

AI should be optional and provider-neutral.

Possible execution targets:

```text
Local model
Local DSP algorithm
Hugging Face model
Remote AI provider
Future Poietek Cloud model
User-supplied model
```

AI features can include:

- stem separation;
- pitch analysis;
- transcription;
- tagging;
- chord/key analysis;
- sample classification;
- mix suggestions;
- mastering suggestions;
- video captions;
- beat synchronization;
- search;
- project assistance.

### AI safety and creative-control rule

AI should produce:

```text
Preview
Diff
Structured Commands
Undo
```

It should not silently replace original project media.

Poietek must remain fully usable with AI disabled.

---

# Open Source and Free Resources

Poietek should make extensive use of high-quality open standards and open-source
software where licensing allows.

Candidate categories include:

- Tauri;
- Yjs;
- CLAP;
- VST3 SDK;
- Audio Unit interfaces on Apple platforms;
- Web Audio / AudioWorklet;
- Web MIDI;
- IndexedDB;
- OPFS;
- Service Workers;
- FFmpeg-compatible media infrastructure;
- Demucs-family source-separation research;
- Basic Pitch;
- model hubs such as Hugging Face;
- Git;
- WebDAV;
- S3-compatible protocols;
- open timeline/interchange standards;
- public DSP research.

Every dependency must enter a resource registry with:

```text
Name
Version
Source
Licence
Model licence
Dataset/provenance notes
Commercial-use status
Security notes
Classification
```

Classification:

```text
ADOPT
EVALUATE
REFERENCE ONLY
LICENCE REVIEW REQUIRED
COMMERCIAL OPTION
RESEARCH
```

"Open source" does not automatically mean "safe to embed."

---

# Closed / Proprietary Product Inspiration

Poietek may study publicly documented functionality from established commercial
software in order to understand user problems and successful workflow patterns.

Examples of reference categories:

- Ableton Live;
- Logic Pro;
- FL Studio;
- Bitwig Studio;
- Melodyne;
- Serato DJ Pro;
- rekordbox;
- Traktor;
- DaVinci Resolve;
- Serum;
- Vital;
- Omnisphere;
- FabFilter;
- Ozone;
- other professional creative tools.

Use:

- public documentation;
- public demos;
- public APIs;
- user feedback;
- published research;
- public patents for research awareness;
- lawful interoperability.

Do not use:

- stolen/leaked source;
- cracked proprietary resources;
- copied factory presets;
- copied UI assets;
- undocumented protected protocols;
- unlicensed copyrighted media.

Poietek should copy **problems solved and principles**, not proprietary expression.

---

# Native Plugin Strategy

Desktop:

```text
Windows: VST3 + CLAP
macOS: VST3 + CLAP + AU/AUv3
Linux: VST3 + CLAP + LV2 later
```

Apple mobile:

```text
Poietek native modules
AUv3 where supported
```

Web:

```text
Poietek native WebAudio/WASM modules
No claim of arbitrary VST3/AU desktop plugin hosting
```

Unsupported plug-ins remain preserved in the project and may use a freeze/bounce
render on devices that cannot execute them.

---

# 5-Star Quality Target

Poietek is being designed to reach a **5-star quality level** against specialist
category leaders.

The stars are evidence-based.

```text
1★ Prototype / concept
2★ Basic end-to-end functionality
3★ Production usable
4★ Competitive with established leaders
5★ Meets or exceeds best-in-class reference on agreed capability, reliability,
   workflow, output quality, performance and user validation
```

A feature may not be labelled 5★ merely because it exists.

5★ requires:

- completed acceptance tests;
- benchmark evidence;
- soak/stability testing;
- performance results;
- compatibility tests;
- accessibility testing;
- real-user workflow validation;
- no critical data-loss/security defect.

Reference leaders vary by category.

Examples:

```text
DAW / Arrangement      Ableton Live / Logic / FL Studio / Bitwig
Modulation             Bitwig
Pitch editing          Melodyne
DJ / DVS               Serato / rekordbox
Video / VFX / Post     DaVinci Resolve
Touch / Tablet         Logic Pro for iPad
Extensibility          Max for Live / plugin ecosystems
```

Poietek's target is 5★ across every declared flagship category.

Current prototype scores must remain honest until implementation catches up.

---

# Current Build Priority

The highest-priority milestone remains the local-first audio vertical slice.

```text
Create Project
    ↓
Import real WAV
    ↓
Store locally
    ↓
Generate real waveform
    ↓
Place on timeline
    ↓
Play / pause / seek
    ↓
Split
    ↓
Change gain
    ↓
Undo / redo
    ↓
Autosave
    ↓
Close
    ↓
Reopen offline
    ↓
Export real audio
```

This must pass before cloud collaboration becomes a dependency.

After that:

```text
Native desktop shell
MIDI input/output
Recording
Sampler
Mixer
PWA
Supabase backend
Optional Firebase services
Cross-device sync
Team collaboration
Plugins
Advanced DSP
Video
DJ
Rights
Community
```

---

# Development Principle

Every new feature must answer:

1. Where is its canonical data?
2. Which service owns it?
3. How does it work offline?
4. How is it persisted and migrated?
5. How is it exposed through the UI?
6. What happens when its provider/device/dependency is unavailable?
7. Can another provider replace the current one?
8. What licences/security/privacy obligations does it introduce?
9. How will it be benchmarked?
10. What evidence is required before calling it production-ready?

If those questions do not have answers, the feature architecture is not complete.

---

# Long-Term Goal

Poietek should become a creator-controlled system where:

```text
Local device
+ optional free/open services
+ user-owned cloud storage
+ optional managed Poietek services
+ open standards
+ native applications
+ web access
```

work together as one coherent creative environment.

The creator should never lose access to their core project simply because a
subscription ends, a cloud provider changes, the network goes down, or a specific
third-party service disappears.

# Rights, Contributor Identity, Royalties & Commerce

Poietek uses a **Contributor Passport** model.

Every artist, contributor, company, publisher or label receives a stable Poietek
Party ID. External society/provider identifiers such as PRS/MCPS CAE/IPI, PPL,
The MLC, SoundExchange and other provider IDs are mapped behind that Party ID
and resolved only when a registration/export needs them.

## Production-session login and sync

Contributors can join a project from their own device through a QR code, link or
invite, or can create a temporary guest identity on the studio device and claim
that contribution later.

Project owners/admins control:

- role and permissions;
- one-session, time-limited, project-lifetime, team-reusable or unlimited access;
- device/session limits;
- export permission;
- rights-edit permission;
- financial visibility;
- device/session revocation.

Removing project access never removes a contributor's historical credits or
approved rights.

## Finalization and registration

When a recording/video/content item is marked final, Poietek can:

1. resolve contributors and verified external identifiers;
2. check missing credits and rights;
3. request contributor approvals;
4. freeze a versioned Rights Manifest;
5. generate applicable DDEX/CWR/bulk/provider packages;
6. submit through official connectors when available or prepare portal/file handoff;
7. save provider receipts and returned identifiers;
8. embed an approved public metadata projection into the final media;
9. preserve the complete canonical manifest separately by hash.

A submission is never marked registered/accepted until the receiving provider
confirms it.

## Document-like embedded metadata

Audio, video, images and digital content can carry standard metadata and signed
provenance while Poietek maintains the complete Rights Manifest.

Selecting a file in Poietek can display:

- file/type/date/time/hash;
- authors/creators/contributors;
- ISRC/ISWC/PRS Tune Code and other identifiers;
- rights owners/shares/territories;
- licences;
- collecting-society registration state;
- provenance/C2PA verification;
- commerce policy and payout beneficiaries.

Sensitive banking, tax, private-contract and authentication data is never embedded
into public media.

## Marketplace and contributor payments

Poietek can support an internal creator marketplace for:

- songs;
- audio/video;
- samples and sample packs;
- clips;
- images;
- plugins;
- presets;
- skins/themes;
- templates;
- licences and other digital creator goods.

Each product references a **versioned Commerce Policy**. A transaction freezes
that policy version and produces immutable ledger entries.

Credit, rights and payment are separate concepts:

```text
Credit       = who contributed
Rights       = who owns/administers/licences what
Payment      = who receives money for this transaction/agreement
```

Internal marketplace sales can automatically allocate money according to approved
Commerce Policies through an eligible marketplace payment rail. External society
royalties remain controlled and paid by the relevant society/provider; Poietek
tracks registration, statements and reconciliation.

## Fans, listeners and supporters

The ecosystem may support:

- purchases;
- tips;
- gifts;
- memberships/subscriptions;
- pay-what-you-want support;
- creator storefronts.

A fan payment never creates copyright ownership.

Mobile payment routing must follow the current Apple/Google rules for the user's
storefront, territory and transaction type.

## Managed infrastructure

Poietek may combine Firebase, Supabase, object storage, GitHub, Hugging Face and
other free/open or paid services behind the scenes.

Those infrastructure accounts belong to the Poietek operator during the managed
service phase. Ordinary users receive a straightforward Poietek workflow and do
not need accounts with each infrastructure provider.

Where a collecting society, distributor, payment processor or tax/KYC provider
requires a direct user mandate/account/onboarding, Poietek guides or integrates
that official process rather than impersonating the user.

A sustainable public service may therefore monetize optional managed cloud,
collaboration, AI/compute and marketplace services while preserving a local-first
creator-owned project format.

# Optional Blockchain / Smart-Contract Evidence Ledger

Poietek may use an optional blockchain/smart-contract layer as a **tamper-evident
evidence and settlement-proof system**.

It is deliberately not the sole rights database.

The full private ledger remains local/hosted and contains contributor identities,
external society identifiers, contracts, registration receipts, statements,
payments, tax/payout data and other private information.

The public ledger should contain only privacy-safe evidence such as:

- Rights Manifest hashes;
- content hashes;
- manifest versions;
- contributor-approval commitments;
- registration-receipt batch roots;
- settlement Merkle roots;
- release/provenance snapshot hashes;
- blockchain transaction/block receipts.

## Time and date

Poietek records:

1. signed application event time;
2. Poietek/server receipt time where applicable;
3. blockchain block number and inclusion timestamp;
4. optional independent trusted timestamp/transparency receipt.

`block.timestamp` is evidence of chain inclusion time, not Poietek's precision
studio clock.

## Contributor approvals

A specific version/hash of the Rights Manifest may be approved using normal
Poietek account/passkey workflows or optional EIP-712 typed-data signatures.

Smart-contract wallets can be supported through ERC-1271-compatible signature
validation.

No contributor must own cryptocurrency merely to receive a credit or ordinary
fiat payout.

## Settlement proofs

Detailed payout and royalty lines remain private.

Poietek can create a Merkle root covering a settlement batch and anchor that root
on-chain. A contributor can then receive their line plus an inclusion proof,
showing that their payment/royalty record was included in the anchored settlement
without publishing every participant's finances.

## Payment rails

Blockchain is optional.

Poietek can route settlement through:

- Stripe Connect;
- Apple/Google-approved payment rails;
- bank/payment processors;
- other compliant marketplace rails;
- future audited on-chain rails.

Rights and payment policies remain independent of the rail used.

## Privacy and corrections

Never write banking, tax, private contracts, email addresses, private society
credentials or unreleased media to a public chain.

Rights corrections create a new manifest version and a new anchor. Historical
anchors remain immutable and are marked superseded rather than rewritten.

## Security

Smart contracts that can move user funds require independent security audits,
legal/compliance review, key-management design, emergency controls and extensive
testing before production.

Poietek should begin with **anchor-only contracts** that do not custody funds.

# Creator Proofs, Compliance, Decentralized Media & Learning

Poietek distinguishes **blockchain consensus mechanisms** from **application-level
proofs**.

Poietek does not need to invent its own Proof-of-Work, Proof-of-Stake, DPoS, PBFT,
Proof-of-Space or similar chain simply to use those concepts. The optional evidence
ledger can use a mature external network while the application creates creator-
specific proofs that directly solve production problems.

Primary Poietek proofs include:

- Proof of Contribution;
- Proof of User Consent;
- Proof of Identity;
- Proof of Data Integrity;
- Proof of Transaction History;
- Proof of Interoperability;
- Proof of Chaos/Resilience;
- Proof of Learning/Competency;
- transparent reputation/impact/engagement evidence where appropriate.

Proof records are versioned, signed/verified where useful, privacy classified and
optionally anchored to the evidence blockchain layer.

## Decentralized creator-media inspiration

Poietek studies decentralized/open creator platforms alongside mainstream media
products.

Useful patterns include:

- Audius-style artist control, APIs, authorized applications and remix lineage;
- Livepeer-style separation between protocol/network compute and creator-facing
  applications, plus decentralized video/AI processing;
- LBRY/Odysee-style protocol/app separation, P2P content delivery, cross-device
  clients, creator pricing/tipping and external channel syncing;
- YouTube-style channels, playlists, subscriptions, comments, creator analytics,
  uploads, captions and reporting.

Poietek combines these ideas with its local-first project model.

A future Poietek Hub can provide:

```text
Creator Channel
Catalog
Audio/Video Player
Live Streams
Playlists
Feed
Search
Subscriptions
Comments
Remixes/Forks
Store
Tips/Support
Rights/Provenance Inspector
Creator Analytics
```

Media delivery is routed rather than hard-wired:

```text
Local cache
Poietek-managed storage/CDN
User-owned cloud
P2P/decentralized replicas
Decentralized video/compute
External platform integration
```

Decentralization does not remove moderation, copyright, privacy or marketplace
responsibilities from the Poietek application.

## Privacy and security

Poietek is being designed around jurisdiction-aware privacy modules and a secure
development program rather than a one-size-fits-all compliance badge.

Initial engineering baselines include:

- NIST Cybersecurity Framework;
- NIST Secure Software Development Framework;
- NIST AI Risk Management Framework;
- PCI scope minimization through external payment processors.

GDPR/UK GDPR, CCPA/CPRA, Colorado, Utah, PIPL, Singapore PDPA and Australian
Privacy Act requirements are enabled according to actual jurisdictional scope and
legal review.

ISO/IEC 27001 and SOC 2 are future hosted-service assurance targets, not current
certification claims.

HIPAA and GLBA are conditional only if Poietek enters those regulated sectors.

## DevOps and MLOps

Code, models, datasets and releases each have provenance.

Poietek evaluates open tooling such as:

- GitHub for code/review/CI/releases;
- MLflow for model lifecycle, experiment tracking and registry;
- Hugging Face for model discovery/model cards/licence metadata;
- DVC-style dataset/experiment versioning where useful.

Models move through controlled maturity states and cannot become production models
solely because they are popular.

## Optional Bitcoin-native research

Ordinals/Inscriptions and Runes/Runestones are research/optional collectible and
provenance formats, not Poietek's canonical rights system.

OP_CAT remains a proposal/dependency risk and must not be required by product-
critical workflows unless the relevant network actually activates the needed
capability.

DAO governance may eventually assist community grants and open-source stewardship.
DeFi and ETF-style investment products are outside the core creator application.

## Smart Resource Mesh

Poietek defines a Smart Resource Mesh as its own capability-routing architecture.

Jobs can be scheduled to the best permitted resource:

- local CPU/GPU;
- LAN workstation;
- mobile companion;
- self-hosted worker;
- free-tier cloud;
- managed cloud;
- decentralized compute network.

Routing considers privacy, latency, cost, capability, availability, licence and
energy.

## MML and spatial experiences

Metaverse Markup Language is an optional future research path for interactive 3D
creator spaces, virtual studios, learning rooms, performances and immersive
audio/video experiences. It is not required for the core DAW.

## AI Learning Assistant

Poietek Learn can build personalized roadmaps inside the actual studio.

Examples:

- first beat;
- first song;
- sampling;
- recording;
- MIDI/hardware;
- synthesis;
- mixing/mastering;
- DJ/live;
- video/VFX;
- rights/royalties;
- creator business;
- plugin/app development.

The assistant can explain controls, create practice projects, highlight UI,
suggest the next skill and review evidence. It remains optional, supports offline
curriculum/local inference where possible, and requires preview/approval before
changing creative work.

# Mixing Console / Desk Synchronization

Poietek includes a **Universal Console Bridge** for digital, analogue and hybrid
mixing desks.

A supported digital console can synchronize bidirectionally:

```text
Physical desk fader / mute / pan / scene
                  ↓
           Console Adapter
                  ↓
          Mixer State Mirror
                  ↓
              Poietek UI

Poietek UI / automation
                  ↓
          Mixer State Mirror
                  ↓
           Console Adapter
                  ↓
      Physical digital console
```

This lets changes made on the desk appear in Poietek, while supported changes made
in Poietek are sent back to the desk.

## Separate synchronization planes

Poietek never confuses these:

- **Audio transport** — USB Audio, MADI, ADAT, AES3, AES50, Dante/AES67, analogue
  audio through converters;
- **Sample clock** — Word Clock, PTP, embedded MADI/ADAT/AES3/AES50 clock, etc.;
- **Control state** — MIDI, NRPN/SysEx, MIDI-over-TCP, OSC, AES70, EUCON/HUI/
  Mackie-style or documented vendor protocols;
- **Transport/timecode** — MMC/MTC/timecode where supported;
- **Metering** — high-rate live telemetry;
- **Scenes/recall** — desk snapshots and safe recall.

An optical cable alone is not a protocol. Poietek distinguishes, for example,
optical MADI from ADAT optical and configures the appropriate channel/clock model.

## Digital desks

Supported adapters can expose whichever parameters the manufacturer/protocol makes
available, such as:

- faders;
- mutes;
- pan;
- names/colors;
- preamps;
- EQ;
- gates/compressors;
- sends;
- buses/DCAs;
- routing;
- scenes;
- meters;
- transport.

A digital desk moving a motorized fader should update Poietek immediately. A
Poietek automation move can move the physical motorized fader when the hardware
supports it.

## Analogue desks

A purely analogue, uninstrumented knob or fader cannot be remotely read or moved
by software.

Poietek therefore supports several analogue integration levels:

1. **Audio integration** through an audio interface/converter.
2. **Clock integration** on the digital converter/network side.
3. **Partial automation** where a desk exposes motor faders, VCA/mute automation,
   digitally controlled preamps or other documented control.
4. **Hybrid/digitally controlled analogue** two-way control for exposed parameters.
5. **Manual recall** for controls that have no telemetry.

Manual controls are shown as manual values/notes/photos, never falsely presented as
live synchronized state.

## Clock domains

One synchronous digital-audio domain should have a deliberate clock leader.

Poietek shows the complete clock plan and lock state and can model:

- internal clock;
- Word Clock;
- Dante PTP;
- AES67 PTPv2;
- embedded MADI;
- embedded ADAT;
- AES3;
- AES50;
- sample-rate-conversion bridges.

Clock-source or sample-rate changes are safety-sensitive and should not silently
occur during recording/live performance.

## Console profiles

Every supported desk has a versioned Console Profile describing:

- firmware;
- audio/control connections;
- clock capabilities;
- readable/writable parameters;
- scenes/routing/meters;
- analogue/manual limitations;
- verification evidence.

Unsupported controls remain disabled rather than simulated.

# Audio Health, Recording Checks & AI Recommendations

Poietek includes a **Recording & Mix Health Engine**.

The core measurements come from deterministic DSP. AI is used to interpret those
measurements, explain the problem and recommend the safest next action.

AI does **not** invent peak/loudness values.

## Measurements

Poietek can measure or derive:

- sample peak / dBFS;
- standards-compliant True Peak / dBTP;
- RMS;
- Integrated, Momentary and Short-Term LUFS;
- Loudness Range;
- clipping and near-clipping;
- crest factor/dynamic density;
- noise floor;
- DC offset;
- phase/stereo correlation;
- silence/dropouts;
- hum;
- clicks/pops;
- spectral balance;
- left/right balance;
- monitoring/delivery warnings.

Standards-compliant loudness/true-peak measurement is implemented separately and
validated against appropriate ITU/EBU reference material. RMS is never relabelled
as LUFS and sample peak is never relabelled as True Peak.

## Check My Level

Before recording, the creator can press **Check My Level**.

Poietek asks the performer to play/sing the loudest expected passage, measures the
actual source and gives contextual advice.

A conservative Poietek 24-bit capture starting profile can prefer observed peaks
around/below -12 dBFS, warn as peaks approach -6 dBFS and raise a critical
headroom warning near -1 dBFS. These are Poietek engineering defaults, not a
universal recording standard, and are adapted according to the source, crest
factor and noise floor.

If clipping occurs in the microphone preamp, mixer or converter, Poietek advises
changing the analogue/input gain rather than pretending a downstream digital
fader can repair it.

With a verified digital console adapter, Poietek can propose a remote preamp
change, but the user normally previews/approves it first.

## AI assistant

Recommendations are evidence-based.

Example:

```text
Vocal CH2

Peak            -2.1 dBFS
Clipped samples 0
Noise floor     Good
Clock           Locked

Recommendation:
There is no clipping, but the channel has less headroom than the other vocal.
Reduce the input/preamp gain slightly and repeat the loudest chorus.
```

Actions are classified as:

- advice only;
- previewable project command;
- manual hardware action;
- requires more measurement.

Potentially dangerous operations such as phantom power, clock-source changes,
sample-rate changes, large preamp changes or live routing changes are not silently
performed.

## Recording Health Guard

During recording/live performance, Poietek can watch:

- all armed-input levels;
- digital clipping;
- clock lock;
- audio dropouts;
- buffer underruns;
- CPU;
- disk write health;
- remaining storage;
- network-audio health;
- console connection/redundancy.

The system can provide a simple **REC SAFE / WARNING / CRITICAL** view.

## Delivery profiles

Loudness targets are updateable profiles, not permanent project laws.

Current examples include:

- EBU R128 programme loudness;
- Spotify playback/mastering preview;
- Apple Digital Masters audition workflow;
- custom broadcaster/podcast/video targets.

Poietek always distinguishes a playback-normalization recommendation from an
artistic mastering decision.

## Reference and calibration

Poietek can generate safe test signals and store room/device calibration profiles.

A digital reference level is not automatically an acoustic SPL reading. Poietek
only displays calibrated SPL when an actual measurement/calibration method has
supplied it.

# Industry Standards, Genre Intelligence & Visual AI

Poietek uses a two-layer content intelligence system.

## 1. Formal Standards Registry

Formal standards and delivery specifications are stored as versioned profiles.

Examples include:

- ITU-R BT.709 for SDR HDTV workflows;
- ITU-R BT.2100 for HDR television workflows;
- SMPTE D-Cinema/DCP standards families;
- SMPTE ST 2067 IMF;
- SMPTE ST 2110 where professional IP-facility workflows require it;
- ITU-R BS.1770 / EBU R128 loudness profiles;
- WebVTT and target-specific timed-text/caption formats.

Broadcaster, streamer, cinema, festival, client and platform specifications can be
added as updateable profiles.

Internet/platform requirements are never hard-coded permanently into the Project
schema because they can change.

## 2. Genre / Style Reference Registry

Music genres and visual genres are not treated as universal technical standards.

Poietek can use an open taxonomy such as MusicBrainz plus community/user-defined
genres and build reference distributions from licensed/open/user-selected
material.

A music Style Reference Profile may describe:

- tempo;
- meter/key tendencies;
- loudness and true-peak distributions;
- crest/dynamic range;
- spectral balance;
- bass energy;
- stereo width;
- section lengths;
- instrumentation and arrangement density.

A film/visual profile may describe:

- shot-length distribution;
- motion;
- contrast;
- colour palette;
- luminance/saturation;
- dialogue/music/effects balance;
- scene pacing.

These are descriptive references, not mandatory rules.

## AI Standards & Creative Assistant

Every AI recommendation must identify what kind of advice it is:

```text
REQUIRED BY TARGET
TECHNICAL BEST PRACTICE
REFERENCE NORM
CREATIVE OPTION
```

For example:

```text
Broadcast loudness:
FAIL — required by selected delivery profile.

Sub-bass:
Heavier than 85% of selected genre references.
CREATIVE OPTION — no change required.

Captions:
Missing.
REQUIRED BY TARGET.

Colour:
Project is BT.709 and selected HDR target expects BT.2100.
REQUIRED BY TARGET.
```

The assistant always distinguishes measured facts from aesthetic preference.

## Creative Intent Lock

Users can explicitly preserve choices such as:

- keep heavy bass;
- retain distortion;
- keep narrow stereo;
- keep high dynamics;
- preserve film grain;
- keep warm colour cast;
- keep vocal dry.

AI must not "correct" a deliberate style simply because it differs from a reference
average.

## Universal Content Preflight

Poietek can run the same preflight concept across:

- music;
- podcasts;
- audiobooks;
- films;
- TV;
- music videos;
- social video;
- live streams;
- images/artwork;
- animation;
- game assets;
- immersive media.

The final export report can combine:

- audio health;
- video/colour compliance;
- captions/accessibility;
- metadata;
- rights/provenance;
- delivery packaging;
- style/reference observations.

Formal failures can block export if the user/client policy requires it; creative
observations remain advisory.

# Public Release Readiness & Cross-System Interoperability

Poietek distinguishes four different kinds of "standard":

1. **Musical reference standards** — for example ISO standard pitch A4 = 440 Hz.
2. **Formal technical standards** — loudness measurement, colour, cinema packaging,
   captions, timecode, etc.
3. **Destination/provider specifications** — radio station, broadcaster, streaming
   platform, distributor, festival or client delivery requirements.
4. **Creative genre/style references** — descriptive, never mandatory.

A=440 Hz is a tuning reference, not a universal radio broadcast rule.

Before public release the user chooses a destination profile. Poietek checks the
actual final master against that profile and produces a Release Readiness result.

Example:

```text
RADIO RELEASE CHECK

Tuning reference          A440 / PASS
Audio format              PASS
Programme loudness        FAIL
True peak                 PASS
ISRC                      PASS
Rights Manifest           PASS
Metadata                  PASS

NOT READY
1 required fix
```

The AI assistant explains the exact requirement, cites the selected profile and
can preview a safe conforming render.

## Cross-System Fabric

Poietek is designed to cross:

- networks;
- operating systems;
- devices;
- optional evidence chains;
- runtime systems;
- compute nodes;
- programs/apps/dApps;
- programming languages;
- code/build systems;
- symbol/vocabulary layers;
- audio/image/video representations;
- creative ideas;
- resource grids.

This is implemented through stable domain IDs, versioned schemas, content hashes,
capability descriptors, adapters, durable queues and round-trip certification.

Cross-chain support is limited to evidence portability by default. Moving
cryptocurrency/tokens across bridges is a separate high-risk feature and is not a
core dependency.

# Organic, Alternative & Microtonal Tuning

Poietek treats tuning as a first-class creative system.

Available reference-pitch options can include:

- A4 = 415 Hz;
- A4 = 430 Hz;
- A4 = 432 Hz;
- A4 = 435 Hz;
- A4 = 438 Hz;
- A4 = 440 Hz;
- A4 = 442 Hz;
- A4 = 443 Hz;
- A4 = 444 Hz;
- custom frequency.

The standard ISO reference remains A4 = 440 Hz, but users are free to choose
another reference where it suits the creative, historical or ensemble context.

A4=432 Hz is available as an **Alternative / Organic** creative preset. Poietek
does not present 432 Hz as a medically proven or universally "natural" frequency.
Any health-related claims remain research-only unless strong evidence and
appropriate review support them.

## Organic mode

Organic mode can combine a reference pitch with more acoustically meaningful
tools such as:

- just intonation;
- harmonic-series ratios;
- adaptive just intonation;
- historical temperaments;
- microtonal EDO systems;
- Scala SCL/KBM tunings;
- humanized timing/velocity;
- subtle tuning drift;
- natural impulse responses and performance variation.

The exact technical changes are always visible.

## Historical and microtonal systems

Poietek supports or plans to support:

- 12-tone equal temperament;
- just intonation;
- Pythagorean tuning;
- quarter-comma meantone;
- Werckmeister;
- Vallotti;
- 19-EDO;
- 24-EDO;
- 31-EDO;
- custom equal divisions;
- Scala SCL/KBM;
- custom ratio maps.

## MIDI interoperability

The tuning engine negotiates the best available method:

```text
MIDI 2.0 per-note pitch
        ↓
MIDI Tuning Standard
        ↓
Native/host tuning API
        ↓
Scala SCL/KBM
        ↓
MPE/per-channel pitch bend
        ↓
Rendered audio fallback
```

Unsupported instruments are never silently assumed to be tuned correctly.

## Tuning AI

Poietek can compare imported recordings, hardware instruments and collaborators
against the session reference and show measured pitch offsets.

Example:

```text
Session: A432

Piano stem:
Closer to A440
Approximate offset: +31.8 cents

[Keep Original]
[Preview Retune]
[Change Session]
[Mark Intentional]
```

Original audio remains untouched unless the creator explicitly renders/applies a
retuning operation.

# Alternative Tuning Community & Public Release Compatibility

Poietek fully supports alternative tuning systems such as A432, historical pitch,
just intonation, microtonal scales and custom tunings in private projects, team
projects and public community releases.

The project owner controls the canonical tuning.

Poietek never silently converts alternative tuning to A440.

## Public release

A440 is the current ISO standard musical-pitch reference, but it is not a blanket
rule that every radio station, streaming platform or public music release must use
A440.

Therefore Poietek uses a **compatibility advisory** rather than a false automatic
failure.

For an A432 project with no explicit destination tuning requirement:

```text
Tuning status: PASS

Project: A432

Advisory:
A440 is the standard interoperability reference.
Keep your original master or create a separate A440 compatibility version if a
client/collaborator specifically requests one.
```

If a destination/client explicitly specifies A440, Poietek preserves the original
A432 project and offers a separate compatibility render/copy.

## Community

Creators can publish, share, rate and fork tuning profiles.

Examples:

- A432 / 12-TET;
- A432 / Just Intonation;
- A415 historical;
- Pythagorean;
- Meantone;
- Werckmeister;
- Vallotti;
- 19/24/31-EDO;
- Scala SCL/KBM;
- custom ratio systems.

Community pages include exact technical tuning information so users know what a
preset actually does.

"Organic", "meditative" and similar labels are creative categories. Poietek does
not convert those labels into unsupported medical claims.

# Community Player Tuning vs External Delivery

Poietek separates **how a release is stored**, **how the community player presents
it**, and **how an external platform receives it**.

## Creator original

The canonical creator master always retains its original tuning.

Example:

```text
Original Master
A432
```

Poietek never silently overwrites it with A440.

## Community player

Inside Poietek Hub, the audio/video player, wall, feed, archive, creator channel,
playlist and learning environments may support optional tuned playback.

Possible listener modes:

```text
Creator Original
A432
A440
A442
Custom
```

A creator can enable or disable listener retuning.

When a finished master is played at another reference, Poietek uses a
**tempo-preserving, duration-preserving pitch transformation**. A normal music
video must remain synchronized with its video, captions and chapters.

For reference:

```text
A440 -> A432 ≈ -31.76665 cents
A432 -> A440 ≈ +31.76665 cents
```

The player always indicates when playback has been transformed.

Popular alternate playback versions can be cached as derived renditions so the
system does not repeatedly process the same master.

## External platforms

Poietek does not assume an external platform requires A440.

The selected destination profile controls the export.

For example, current YouTube upload specifications focus on encoding properties
such as sample rate, codec, frame rate, colour and channel layout. Poietek
therefore preserves an A432 master for YouTube unless YouTube or another selected
destination actually publishes an explicit tuning-reference requirement.

For radio/broadcast, Poietek checks the specific broadcaster/station profile.
Loudness and format requirements remain separate from musical tuning.

If a destination explicitly requires another tuning reference, Poietek preserves
the original and creates a separate compatibility rendition rather than changing
the creator master.

# Implementation Build v3.1

Poietek development has moved back from architecture/specification into an
implementation overlay targeted at the current SDS GitHub repository.

The v3.1 build introduces a real `src/poietek/` application/runtime layer while
allowing the existing concept UI to continue running.

Implemented foundations include:

- canonical serializable Poietek Project v1.1;
- IndexedDB project persistence;
- serialized autosave;
- starter whole-project undo/redo;
- OPFS media storage with IndexedDB fallback;
- SHA-256 media identity;
- real browser audio decoding/import metadata;
- waveform peak pyramids;
- WebAudio timeline clip playback;
- deterministic peak/RMS/clipping/DC/correlation health checks;
- destination-based release readiness;
- provider capability routing for local/Supabase/Firebase roles;
- PWA shell;
- Tauri 2 native shell scaffold;
- React runtime/provider integration.

The build deliberately does not fake:

- standards-compliant LUFS/True Peak before a validated BS.1770 engine is wired;
- time-preserving A432/A440 playback through `playbackRate`;
- finished native audio/MIDI/plugin hosting;
- completed cloud authentication/sync.

The community tuned-player architecture now has a proper
`TimePreservingPitchBackend` boundary. Until a real DSP backend is integrated,
Poietek must play the creator original or a pre-rendered tuned rendition rather
than altering tempo/video duration.

