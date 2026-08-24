"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SDS_VISION_CATALOG = exports.CORE_ECOSYSTEM_PILLARS = exports.SDS_VISION_CATALOG_VERSION = void 0;
exports.summarizeVisionCatalog = summarizeVisionCatalog;
exports.searchVisionCatalog = searchVisionCatalog;
exports.SDS_VISION_CATALOG_VERSION = '3.3.0';
exports.CORE_ECOSYSTEM_PILLARS = [
    { id: 'professional-daw', name: 'Professional DAW', domainIds: ['local-creative-core', 'audio-production', 'profiles-workspaces'], status: 'operational', promise: 'Record, arrange, edit, mix, inspect and export durable local projects.' },
    { id: 'sampler', name: 'Sampler', domainIds: ['sampling-instruments', 'asset-search'], status: 'foundation', promise: 'Chop, map, layer, resample and design original sounds in the device rack.' },
    { id: 'hardware-controller', name: 'Hardware controller', domainIds: ['midi-hardware', 'console-clocking'], status: 'foundation', promise: 'Turn verified physical devices into capability-negotiated studio surfaces.' },
    { id: 'midi-hub', name: 'MIDI hub', domainIds: ['midi-hardware', 'interoperability'], status: 'foundation', promise: 'Route notes, control, clock and mappings without inventing device capabilities.' },
    { id: 'video-editor', name: 'Video editor', domainIds: ['video-vfx', 'release-preflight'], status: 'foundation', promise: 'Edit picture, sound, captions and delivery metadata on a shared timeline.' },
    { id: 'vfx-suite', name: 'VFX suite', domainIds: ['video-vfx', 'plugins-developer'], status: 'foundation', promise: 'Compose motion, colour, particles, shaders and audio-reactive visuals through a render graph.' },
    { id: 'collaboration-platform', name: 'Collaboration platform', domainIds: ['collaboration-community', 'creative-os'], status: 'foundation', promise: 'Commit locally, synchronize revisions, resolve conflicts and preserve creative history.' },
    { id: 'publishing-platform', name: 'Publishing platform', domainIds: ['publishing-delivery', 'release-preflight'], status: 'foundation', promise: 'Prepare traceable packages for a selected destination without changing the creator original.' },
    { id: 'rights-platform', name: 'Rights management', domainIds: ['rights-provenance', 'publishing-delivery'], status: 'foundation', promise: 'Track contributors, splits, agreements, clearances, registrations and evidence.' },
    { id: 'ai-assistant', name: 'AI creative assistant', domainIds: ['creative-intelligence', 'learning-accessibility'], status: 'operational', promise: 'Offer independent local project guidance plus optional, consented and securely routed model providers.' },
    { id: 'social-network', name: 'Creator social network', domainIds: ['collaboration-community', 'tuning-player'], status: 'foundation', promise: 'Support private-to-public creator pages, feeds, comments, channels, remixes and live rooms.' },
    { id: 'marketplace', name: 'Marketplace', domainIds: ['commerce-marketplace', 'rights-provenance'], status: 'foundation', promise: 'Sell original assets, tools, learning and services with explicit licences and payment evidence.' },
    { id: 'cloud-platform', name: 'Cloud platform', domainIds: ['storage-router', 'deployment-operations', 'privacy-security'], status: 'foundation', promise: 'Add optional encrypted sync, backup, providers and remote compute without weakening local-first work.' },
];
exports.SDS_VISION_CATALOG = [
    {
        id: 'local-creative-core', category: 'Create', name: 'Local creative core', status: 'operational', horizon: 'now',
        purpose: 'Canonical projects, durable local media, undo, recovery and offline editing.',
        currentEvidence: ['PoietekProject 1.1', 'IndexedDB repository', 'OPFS asset store with fallback', 'ProjectSession', 'crash recovery'],
        advances: ['Project package import/export', 'media relinking', 'branchable project snapshots'], gates: [],
    },
    {
        id: 'audio-production', category: 'Create', name: 'Audio production engine', status: 'operational', horizon: 'now',
        purpose: 'Recording, waveform editing, mixing, routing, rendering and deterministic audio checks.',
        currentEvidence: ['real browser decode/import', 'Web Audio timeline playback', 'gain/pan/mute/solo', 'browser recording', 'PCM WAV export'],
        advances: ['automation lanes', 'take comping', 'elastic audio', 'spectrogram editing', 'freeze/bounce'],
        gates: ['validated LUFS/dBTP backend', 'native low-latency adapter for professional desktop I/O'],
    },
    {
        id: 'sampling-instruments', category: 'Create', name: 'Sampling, instruments and sound design', status: 'foundation', horizon: 'next',
        purpose: 'Chopping, pads, multisampling, synthesis, resampling and original sound libraries.',
        currentEvidence: ['rack sampler UI', 'procedural original kit', 'sound recipe catalogue', 'original library status registry'],
        advances: ['canonical pad programs', 'slice/transient editor', 'multisample zones', 'resampling pipeline', 'MPE instruments'],
        gates: ['licensed or original recordings for non-procedural sound packs', 'real time-stretch/pitch DSP'],
    },
    {
        id: 'midi-hardware', category: 'Connect', name: 'MIDI and hardware integration', status: 'foundation', horizon: 'next',
        purpose: 'Capability-negotiated MIDI, controller profiles, audio interfaces, patching and studio devices.',
        currentEvidence: ['truthful Web MIDI manager', 'explicit SysEx consent', 'versioned hardware profiles', 'adapter negotiation', 'patch verification'],
        advances: ['MIDI output and clock', 'MIDI 2/MPE adapters', 'OSC', 'Bluetooth/network controllers', 'profile editor'],
        gates: ['physical devices and manufacturer documentation', 'native USB/network adapters where web APIs cannot reach hardware'],
    },
    {
        id: 'console-clocking', category: 'Connect', name: 'Digital, analogue and hybrid consoles', status: 'foundation', horizon: 'next',
        purpose: 'Mixer state mirror, scenes, routing, analogue recall, metering and separate clock domains.',
        currentEvidence: ['console/device contracts', 'analogue insert recall', 'sample/MIDI/word/LTC-MTC domains', 'loopback evidence model'],
        advances: ['privileged command confirmation', 'state conflict resolution', 'scene diff/recall', 'Dante/AES67/MADI adapter contracts'],
        gates: ['console-specific adapters', 'network security review', 'physical loopback and clock measurements'],
    },
    {
        id: 'dj-live-performance', category: 'Perform', name: 'DJ and live performance', status: 'planned', horizon: 'later',
        purpose: 'Decks, beatgrids, cueing, looping, performance scenes, lighting and live reliability.',
        currentEvidence: ['prototype DJ rack modules', 'tempo-map foundation'],
        advances: ['variable-tempo beatgrids', 'quantized cue engine', 'stem decks', 'performance recorder', 'show-control timeline'],
        gates: ['sample-accurate scheduler', 'real audio-worklet/native engine', 'licensed controller profiles'],
    },
    {
        id: 'video-vfx', category: 'Create', name: 'Video, animation and VFX', status: 'foundation', horizon: 'later',
        purpose: 'Picture editing, colour, compositing, motion graphics, captions, 3D and audio-reactive visuals.',
        currentEvidence: ['serializable video/VFX render-job contracts', 'plugin/interchange capability model'],
        advances: ['canonical video clips', 'proxy media', 'node compositor', 'colour pipeline', 'caption tracks', 'GPU render graph'],
        gates: ['codec/render backends', 'WebCodecs/native media support', 'validated colour and HDR profiles'],
    },
    {
        id: 'creative-intelligence', category: 'Assist', name: 'AI creative intelligence', status: 'operational', horizon: 'now',
        purpose: 'Optional mix, master, composition, visual, rights, marketing, learning and project assistance.',
        currentEvidence: ['independent offline Studio Brain', 'project-aware evidence findings', 'secure provider catalogue and adapters', 'per-request remote consent', 'preview/accept/undo AI contract', 'Creative Intent Lock classifier'],
        advances: ['native secure credential service', 'operational provider proxy', 'cross-modal analysis graph', 'personal My Sound profile'],
        gates: ['model/provider configuration', 'consent and data governance', 'licensed training/reference data'],
    },
    {
        id: 'creative-os', category: 'Organise', name: 'Creative Operating System', status: 'foundation', horizon: 'next',
        purpose: 'Creator identity, universal assets, creative graph, search, annotations, journal and cross-device continuity.',
        currentEvidence: ['versioned Creative OS extension', 'local graph/search', 'journal/annotation contracts', 'handoff and storage policy'],
        advances: ['workspace-wide command palette', 'visual graph', 'project branches', 'universal annotations UI', 'studio journal UI'],
        gates: ['provider adapters for remote graph/sync', 'migration tooling for external project formats'],
    },
    {
        id: 'asset-search', category: 'Organise', name: 'Universal assets, browser and search', status: 'foundation', horizon: 'next',
        purpose: 'Content-hashed media, metadata, tags, relationships, duplicate detection and rights-aware discovery.',
        currentEvidence: ['SHA-256 assets', 'universal asset record', 'local graph search', 'sound catalogue'],
        advances: ['waveform/spectrogram thumbnails', 'semantic search adapter', 'duplicate resolver', 'bulk metadata editor'],
        gates: ['optional AI embedding consent', 'large-library indexing worker'],
    },
    {
        id: 'storage-router', category: 'Organise', name: 'Storage router and smart resource mesh', status: 'foundation', horizon: 'next',
        purpose: 'Route verified assets across local, native, provider, peer and archive replicas without losing local truth.',
        currentEvidence: ['OPFS/IndexedDB fallback', 'replica observation contracts', 'hash verification policy', 'provider router'],
        advances: ['quota-aware placement', 'selective sync', 'encrypted remote replicas', 'repair/redundancy jobs', 'compute job routing'],
        gates: ['configured storage providers', 'reviewed encryption/key vault', 'peer consent and network transport'],
    },
    {
        id: 'collaboration-community', category: 'Share', name: 'Collaboration and creator community', status: 'foundation', horizon: 'later',
        purpose: 'Teams, comments, messaging, feeds, creator pages, portfolios, live rooms, remixing and version history.',
        currentEvidence: ['local change envelopes', 'replica/conflict contracts', 'private local hub/feed/catalog defaults', 'moderation capability gates'],
        advances: ['CRDT/operation sync', 'presence/comments', 'fork lineage', 'creator channels', 'moderation queue', 'live rooms'],
        gates: ['identity/auth provider', 'moderation operations', 'encrypted realtime transport', 'abuse and child-safety policies'],
    },
    {
        id: 'tuning-player', category: 'Share', name: 'Tuning and community derivative player', status: 'foundation', horizon: 'next',
        purpose: 'Protect creator tuning while supporting compatible, traceable listener renditions.',
        currentEvidence: ['A432/A440 destination profiles', 'time-preserving backend contract', 'original-preserving fallback', 'community tuning contracts'],
        advances: ['Scala SCL/KBM', 'microtonal editor', 'A/B player', 'derived rendition cache', 'video-sync validation'],
        gates: ['real time-preserving DSP or pre-rendered rendition', 'rendition rights and provenance evidence'],
    },
    {
        id: 'rights-provenance', category: 'Protect', name: 'Rights, contributors and provenance', status: 'foundation', horizon: 'next',
        purpose: 'Contributor passports, splits, agreements, approvals, registrations and optional evidence receipts.',
        currentEvidence: ['passports/splits/agreements contracts', 'external workflow evidence rules', 'optional blockchain evidence model', 'validation against invented acceptance'],
        advances: ['split proposal UI', 'signed approvals', 'sample-clearance workflow', 'correction/supersession history', 'royalty statements'],
        gates: ['identity/signature provider', 'registration authorities', 'legal review by jurisdiction'],
    },
    {
        id: 'publishing-delivery', category: 'Release', name: 'Publishing, metadata and delivery', status: 'foundation', horizon: 'next',
        purpose: 'Release packages, credits, identifiers, DDEX-oriented metadata and destination-specific delivery.',
        currentEvidence: ['release destination profiles', 'external registration status', 'WAV export', 'tuning preservation policy'],
        advances: ['metadata editor', 'stems/batch export', 'sidecar manifests', 'DDEX adapter contracts', 'caption/package outputs'],
        gates: ['distributor/platform APIs', 'identifier authorities', 'validated delivery specifications'],
    },
    {
        id: 'release-preflight', category: 'Release', name: 'Universal standards and preflight', status: 'foundation', horizon: 'next',
        purpose: 'Separate formal requirements, technical practice, reference norms and creative choices across media.',
        currentEvidence: ['release-readiness engine', 'honest LUFS/dBTP unmeasured states', 'cross-modal finding model', 'Creative Intent Lock'],
        advances: ['versioned standards registry', 'audio/video/caption/rights aggregate report', 'preview conform copies'],
        gates: ['validated BS.1770 loudness/true-peak', 'colour/HDR/caption validators', 'authoritative target profiles'],
    },
    {
        id: 'commerce-marketplace', category: 'Business', name: 'Marketplace, commerce and services', status: 'foundation', horizon: 'later',
        purpose: 'Listings for original samples, plugins, templates, projects, courses and creator services.',
        currentEvidence: ['listing/order contracts', 'payment evidence validation', 'private local catalogue'],
        advances: ['seller dashboard', 'license receipts', 'fulfilment downloads', 'commission escrow workflow', 'tax reporting adapters'],
        gates: ['payment provider', 'consumer/tax/legal review', 'fraud and dispute operations'],
    },
    {
        id: 'privacy-security', category: 'Protect', name: 'Privacy, security and compliance', status: 'foundation', horizon: 'next',
        purpose: 'Consent, least privilege, local-first defaults, encryption, auditability and data-subject workflows.',
        currentEvidence: ['private defaults', 'consent receipts', 'strict native CSP', 'empty Tauri capability', 'no credential-in-Vite policy'],
        advances: ['credential vault', 'encrypted native project packages', 'audit log UI', 'threat model', 'retention controls'],
        gates: ['platform keychain adapters', 'independent security review', 'jurisdiction-specific compliance review'],
    },
    {
        id: 'plugins-developer', category: 'Extend', name: 'Plugins, SDK and developer platform', status: 'foundation', horizon: 'later',
        purpose: 'Web/native extensions, instruments, effects, VFX, hardware adapters and safe marketplaces.',
        currentEvidence: ['serializable plugin contracts', 'unavailable/native-only states', 'native plugin preferences', 'Tauri capability boundary'],
        advances: ['versioned SDK', 'sandbox process host', 'scanner/quarantine', 'CLAP/VST3/AU/LV2/OpenFX adapters', 'developer docs'],
        gates: ['native process host', 'format SDK licensing', 'code signing and malware review'],
    },
    {
        id: 'interoperability', category: 'Connect', name: 'Cross-system interoperability fabric', status: 'foundation', horizon: 'next',
        purpose: 'Stable schemas and adapters across platforms, devices, apps, languages, media, nodes and evidence systems.',
        currentEvidence: ['canonical JSON project', 'provider/hardware/interchange contracts', 'Tauri/Web shared frontend', 'evidence portability'],
        advances: ['AAF/OMF/MIDI/MusicXML interchange', 'schema RPC', 'Rust/WASM ABI', 'external app bridges', 'certification fixtures'],
        gates: ['format-specific conformance suites', 'licensed SDKs', 'physical cross-platform testing'],
    },
    {
        id: 'learning-accessibility', category: 'Learn', name: 'Learning and accessibility', status: 'foundation', horizon: 'next',
        purpose: 'Walkthroughs, contextual teaching, templates, theory, production lessons and inclusive control.',
        currentEvidence: ['learning suggestion contracts', 'learning hints preference', 'keyboard shortcuts', 'focus states', 'reduced motion'],
        advances: ['interactive lesson engine', 'practice projects', 'screen-reader pass', 'captions/transcripts', 'adaptive control layouts'],
        gates: ['curriculum and accessibility testing', 'licensed/open lesson media'],
    },
    {
        id: 'profiles-workspaces', category: 'Operate', name: 'Profiles, settings and workspaces', status: 'operational', horizon: 'now',
        purpose: 'Professional audio, MIDI, recording, editing, file, plugin, appearance and privacy preferences.',
        currentEvidence: ['versioned settings repository', 'built-in profiles', 'setup modal', 'rack/arranger/console workspaces'],
        advances: ['workspace docking persistence', 'per-device profiles', 'command/key map editor', 'profile import/export'], gates: [],
    },
    {
        id: 'deployment-operations', category: 'Operate', name: 'Cross-platform deployment and operations', status: 'foundation', horizon: 'next',
        purpose: 'Web portal, PWA, local launcher, desktop/mobile packages, diagnostics, testing and staged releases.',
        currentEvidence: ['content-hashed offline PWA', 'local launcher', 'Tauri bundle config', 'native doctor', 'automated verification'],
        advances: ['signed desktop installers', 'Android/iOS projects', 'update signing', 'crash recovery reports', 'release channels'],
        gates: ['Rust/Tauri CLI', 'Android toolchain and platform build tools', 'code-signing identities', 'physical-device matrix'],
    },
    {
        id: 'business-administration', category: 'Business', name: 'Creator business and administration', status: 'planned', horizon: 'later',
        purpose: 'Portfolio, project planning, client work, labels/publishers, marketing, analytics and enterprise administration.',
        currentEvidence: ['role/permission and commerce foundations'],
        advances: ['project briefs', 'deliverable approvals', 'client portal', 'campaign planning', 'organisation controls'],
        gates: ['business-domain product design', 'provider integrations', 'privacy-safe analytics'],
    },
    {
        id: 'sustainability-ethics', category: 'Govern', name: 'Ethics, sustainability and creator rights', status: 'foundation', horizon: 'later',
        purpose: 'Creator agency, transparent AI, portable data, responsible compute and community governance.',
        currentEvidence: ['optional AI', 'local-first policy', 'no ownership invention', 'evidence-only blockchain', 'unavailable-state rules'],
        advances: ['Creator Bill of Rights UI', 'compute/energy budgets', 'model disclosure cards', 'community governance records'],
        gates: ['governance process', 'independent policy/legal review', 'measurable sustainability telemetry'],
    },
];
function summarizeVisionCatalog(areas = exports.SDS_VISION_CATALOG) {
    return areas.reduce((summary, area) => {
        summary[area.status] += 1;
        return summary;
    }, { operational: 0, foundation: 0, planned: 0, blocked_external: 0 });
}
function searchVisionCatalog(query, areas = exports.SDS_VISION_CATALOG) {
    const tokens = query.toLocaleLowerCase().split(/[^\p{L}\p{N}]+/u).filter((token) => token.length > 1);
    if (!tokens.length)
        return [...areas];
    return areas.filter((area) => {
        const haystack = [area.category, area.name, area.purpose, ...area.currentEvidence, ...area.advances, ...area.gates].join(' ').toLocaleLowerCase();
        return tokens.every((token) => haystack.includes(token));
    });
}
