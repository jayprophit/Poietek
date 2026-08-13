import type {VisionCapabilityStatus} from './catalog';

export const DEVELOPMENT_LIBRARY_SOURCE = {
  title: 'Poietek Complete Development Library',
  sourceKind: 'attached conversation export',
  lineCount: 2221,
  characterCount: 30024,
  sha256: '9edcb809bff10246526ff7141185a82eef68dbe05440a5567ee81f0f1986dea2',
  importedAt: '2026-08-13',
} as const;

export interface DevelopmentLibraryVolume {
  id: string;
  sourceNumber: string;
  title: string;
  purpose: string;
  status: VisionCapabilityStatus;
  professionalVolumes: string[];
  domainIds: string[];
  capabilities: string[];
  currentEvidence: string[];
  gates: string[];
}

export interface DevelopmentLibraryPart {
  id: string;
  title: string;
  sourceRange: string;
  capabilities: string[];
}

export interface DevelopmentLibraryAppendix {
  id: string;
  title: string;
  topics: string[];
}

export const DEVELOPMENT_LIBRARY_VOLUMES: readonly DevelopmentLibraryVolume[] = [
  {
    id: 'library-01', sourceNumber: '01', title: 'Vision, White Paper & Philosophy', status: 'foundation',
    purpose: 'Mission, market, creator value, ethics, community philosophy and long-term direction.',
    professionalVolumes: ['POI-VOL-01', 'POI-VOL-14'], domainIds: ['local-creative-core', 'sustainability-ethics', 'business-administration'],
    capabilities: ['mission', 'vision', 'goals', 'problems being solved', 'market analysis', 'competitor principles', 'user personas', 'creator ecosystem', 'long-term roadmap', 'business model', 'community philosophy', 'Creator Bill of Rights'],
    currentEvidence: ['controlled master specification', 'fourteen-volume professional series', 'machine-readable ecosystem catalog'],
    gates: ['market validation', 'governance and legal review'],
  },
  {
    id: 'library-02', sourceNumber: '02', title: 'Complete Functional Specification', status: 'foundation',
    purpose: 'A traceable inventory of every feature, command, screen, setting, workflow and interaction state.',
    professionalVolumes: ['POI-MASTER-001', 'POI-UI-001'], domainIds: ['profiles-workspaces', 'local-creative-core'],
    capabilities: ['every feature', 'every button', 'every menu', 'every screen', 'every workflow', 'every interaction', 'loading and empty states', 'offline and unavailable states', 'permissions', 'acceptance evidence'],
    currentEvidence: ['45-screen catalog', '13 global menus', '11 settings pages', '18 controlled workflows', 'coverage regression tests'],
    gates: ['continued command-manifest migration for remaining legacy rack controls'],
  },
  {
    id: 'library-03', sourceNumber: '03', title: 'User Interface Bible', status: 'foundation',
    purpose: 'One adaptive interface language for desktop, tablet, phone, PWA and browser portal.',
    professionalVolumes: ['POI-VOL-11'], domainIds: ['profiles-workspaces', 'learning-accessibility', 'deployment-operations'],
    capabilities: ['desktop UI', 'tablet UI', 'mobile UI', 'web UI', 'docking', 'cascading menus', 'tooltips and hover help', 'accessibility', 'themes', 'skins', 'window management', 'workspaces', 'beginner mode', 'professional mode', 'studio mode', 'educational mode', 'accessibility mode'],
    currentEvidence: ['responsive Arrange/Rack shell', 'global menu bar', 'Studio Setup', 'themes and named profiles', 'focus and reduced-motion rules'],
    gates: ['complete screen-reader audit', 'persistent docking and key-command editor', 'physical mobile/tablet matrix'],
  },
  {
    id: 'library-04', sourceNumber: '04', title: 'Audio Engine', status: 'foundation',
    purpose: 'Professional recording, editing, DSP, routing, mixing, automation, mastering and rendering.',
    professionalVolumes: ['POI-VOL-03'], domainIds: ['audio-production', 'release-preflight'],
    capabilities: ['recording', 'monitoring', 'editing', 'DSP', 'effects', 'mixer', 'automation', 'routing', 'buses', 'mastering', 'stem export', 'offline rendering', 'audio analysis'],
    currentEvidence: ['real import/decode', 'waveforms and timeline playback', 'recording ingestion', 'gain/pan/fades/mute/solo', 'offline render and PCM WAV'],
    gates: ['validated LUFS/dBTP', 'native low-latency I/O', 'full processor/bus/automation graph'],
  },
  {
    id: 'library-05', sourceNumber: '05', title: 'Sampling Engine', status: 'foundation',
    purpose: 'Original/licensed sample capture, chopping, mapping, performance and resampling.',
    professionalVolumes: ['POI-VOL-04'], domainIds: ['sampling-instruments', 'asset-search'],
    capabilities: ['hardware-inspired pad workflows', 'sample chopping', 'transient and manual slicing', 'pad assignment', 'velocity zones', 'choke groups', 'time stretch', 'pitch', 'resample', 'multisamples', 'drum machines', 'sequencers', 'AI sample suggestions'],
    currentEvidence: ['rack sampler prototypes', 'procedural original kit', 'Sound Atlas recipes', 'canonical asset import'],
    gates: ['canonical program schema and editor', 'time/pitch DSP', 'original, licensed or user-supplied recordings'],
  },
  {
    id: 'library-06', sourceNumber: '06', title: 'MIDI & Hardware', status: 'foundation',
    purpose: 'Truthful discovery, routing, mapping, timing and control for studio and performance devices.',
    professionalVolumes: ['POI-VOL-04'], domainIds: ['midi-hardware', 'console-clocking', 'interoperability'],
    capabilities: ['USB', 'MIDI 1', 'MIDI 2 and UMP', 'MPE', 'OSC', 'Bluetooth', 'Wi-Fi and network control', 'device detection', 'profiles', 'controllers', 'keyboards', 'pad controllers', 'DJ hardware', 'mixers', 'lighting', 'cameras', 'microphones', 'audio interfaces', 'driver SDK', 'official firmware update handoff'],
    currentEvidence: ['truthful Web MIDI manager', 'explicit SysEx consent', 'profile and mapping foundations', 'clock-domain and loopback evidence contracts'],
    gates: ['MIDI output/clock engine', 'physical devices', 'manufacturer documentation and official update mechanisms', 'native adapters'],
  },
  {
    id: 'library-07', sourceNumber: '07', title: 'Video Engine', status: 'foundation',
    purpose: 'Picture editing and delivery synchronized with the universal project timeline.',
    professionalVolumes: ['POI-VOL-05'], domainIds: ['video-vfx', 'release-preflight'],
    capabilities: ['video timeline', 'editing', 'animation', 'transitions', 'motion graphics', 'colour', 'node compositing', '3D', 'AI video assistance', 'beat sync', 'camera tools', 'captions', 'proxy media'],
    currentEvidence: ['serializable video tracks and render-job contracts', 'shared time/asset architecture'],
    gates: ['codec/proxy backend', 'picture timeline UI', 'validated frame/audio sync and colour pipeline'],
  },
  {
    id: 'library-08', sourceNumber: '08', title: 'Visual Effects Library', status: 'planned',
    purpose: 'A GPU-capable, audio-reactive visual and compositing effect system.',
    professionalVolumes: ['POI-VOL-05'], domainIds: ['video-vfx', 'plugins-developer'],
    capabilities: ['particles', 'smoke', 'fire', 'lighting', 'fog', 'rain', 'snow', 'visualisers', 'audio-reactive effects', 'shaders', 'GPU acceleration', 'masks', 'tracking', 'keying', 'paint and cleanup'],
    currentEvidence: ['render-job, plugin and capability contracts'],
    gates: ['GPU/native/WASM render graph', 'OpenFX-style host', 'performance and colour conformance'],
  },
  {
    id: 'library-09', sourceNumber: '09', title: 'AI Architecture', status: 'foundation',
    purpose: 'Independent local creative intelligence with optional, consented specialist providers.',
    professionalVolumes: ['POI-VOL-06'], domainIds: ['creative-intelligence', 'learning-accessibility'],
    capabilities: ['general assistant', 'producer', 'composer', 'songwriter', 'mix engineer', 'mastering engineer', 'teacher', 'project manager', 'rights assistant', 'marketing assistant', 'business assistant', 'video editor', 'colourist', 'graphic designer', 'code assistant', 'custom AI module'],
    currentEvidence: ['local Studio Brain', 'project-aware findings', 'provider catalog', 'consent and configuration validation', 'preview/accept/undo contracts'],
    gates: ['secure remote proxy and credential vault', 'provider-specific adapters/evaluations', 'licensed models/reference data'],
  },
  {
    id: 'library-10', sourceNumber: '10', title: 'Creator Community', status: 'foundation',
    purpose: 'Creator identity, collaboration, social discovery, live spaces and safe community participation.',
    professionalVolumes: ['POI-VOL-07'], domainIds: ['collaboration-community', 'tuning-player'],
    capabilities: ['profiles', 'messages', 'teams', 'groups', 'forums', 'following', 'likes', 'comments', 'creator pages', 'portfolios', 'live rooms', 'streaming', 'competitions', 'leaderboards', 'remixes', 'forking', 'Git-style version history', 'governance', 'voting', 'creator reputation'],
    currentEvidence: ['local/private hub, feed and catalog contracts', 'replicas/change/conflict foundations', 'moderation gates'],
    gates: ['identity and realtime services', 'moderation/abuse operations', 'privacy and child-safety policy'],
  },
  {
    id: 'library-11', sourceNumber: '11', title: 'Rights Management', status: 'foundation',
    purpose: 'Evidence-backed contributors, credits, splits, agreements, clearances and approvals.',
    professionalVolumes: ['POI-VOL-08'], domainIds: ['rights-provenance'],
    capabilities: ['contributors', 'songwriters', 'artists', 'labels', 'publishers', 'session musicians', 'video editors', 'camera operators', 'graphic designers', 'credits', 'contribution tracking', 'AI contribution suggestions', 'split agreements', 'approval workflows', 'sample clearance', 'correction history'],
    currentEvidence: ['passports, splits, agreements and evidence contracts', 'validation against invented acceptance'],
    gates: ['identity/signature authorities', 'legal review', 'user acceptance and external receipts'],
  },
  {
    id: 'library-12', sourceNumber: '12', title: 'Publishing', status: 'foundation',
    purpose: 'Metadata, identifiers, destination packages, distribution status and direct delivery.',
    professionalVolumes: ['POI-VOL-08'], domainIds: ['publishing-delivery', 'release-preflight'],
    capabilities: ['music streaming destinations', 'video and social destinations', 'community/chat destinations', 'export', 'metadata', 'DDEX-oriented exchange', 'ISRC and identifiers', 'PRO support', 'credits', 'distribution', 'direct sales', 'subscriptions', 'licensing'],
    currentEvidence: ['destination profiles', 'WAV export', 'release readiness', 'external registration state contracts'],
    gates: ['configured destination/distributor APIs', 'identifier authorities', 'validated delivery profiles and legal review'],
  },
  {
    id: 'library-13', sourceNumber: '13', title: 'Cloud Platform', status: 'foundation',
    purpose: 'Optional accounts, encrypted replicas, project sync, sharing, backup and remote compute.',
    professionalVolumes: ['POI-VOL-09'], domainIds: ['storage-router', 'deployment-operations'],
    capabilities: ['accounts', 'sync', 'projects', 'storage', 'offline mode', 'conflict resolution', 'backups', 'version history', 'sharing', 'live editing', 'servers', 'cloud-assisted rendering'],
    currentEvidence: ['local-first storage', 'provider-neutral router', 'Supabase/Firebase adapter foundations', 'replica/change contracts'],
    gates: ['authenticated encrypted sync', 'key management', 'conflict service', 'backup/restore operations'],
  },
  {
    id: 'library-14', sourceNumber: '14', title: 'Database Design', status: 'foundation',
    purpose: 'Canonical project ownership plus local and remote records, relationships, APIs and permissions.',
    professionalVolumes: ['POI-VOL-10'], domainIds: ['local-creative-core', 'collaboration-community', 'rights-provenance'],
    capabilities: ['tables and stores', 'relationships', 'APIs', 'permissions', 'users', 'projects', 'audio', 'video', 'assets', 'messages', 'rights', 'payments', 'migrations', 'retention and deletion', 'audit'],
    currentEvidence: ['canonical project schema', 'IndexedDB repositories', 'OPFS media', 'versioned extensions and platform contracts'],
    gates: ['remote relational migrations', 'tenant isolation', 'public API and webhook conformance'],
  },
  {
    id: 'library-15', sourceNumber: '15', title: 'Plugin SDK', status: 'foundation',
    purpose: 'Safe audio, video, AI, hardware, marketplace and developer extensions.',
    professionalVolumes: ['POI-VOL-12'], domainIds: ['plugins-developer', 'interoperability'],
    capabilities: ['VST3', 'CLAP', 'Audio Unit', 'LV2', 'OpenFX', 'AI plugins', 'hardware drivers', 'marketplace SDK', 'provider SDK', 'themes', 'extensions', 'developer portal', 'documentation'],
    currentEvidence: ['serializable plugin/extension contracts', 'missing-plugin fallback intent', 'least-privilege native boundary'],
    gates: ['native sandbox host', 'licensed format SDKs', 'scanner/quarantine', 'code signing and compatibility lab'],
  },
  {
    id: 'library-16', sourceNumber: '16', title: 'Security', status: 'foundation',
    purpose: 'Protect private projects, identity, licences, payments, cloud services and extension boundaries.',
    professionalVolumes: ['POI-VOL-13'], domainIds: ['privacy-security', 'sustainability-ethics'],
    capabilities: ['encryption', 'privacy', 'licensing security', 'authentication', 'authorization', 'payments security', 'cloud security', 'GDPR-oriented controls', 'tenant isolation', 'audit', 'incident response', 'software provenance'],
    currentEvidence: ['private defaults', 'browser secret prohibition', 'strict native CSP', 'empty Tauri IPC allowlist', 'claim validation'],
    gates: ['formal threat model', 'identity/key services', 'independent security/privacy/legal review'],
  },
  {
    id: 'library-17', sourceNumber: '17', title: 'Learning Platform', status: 'foundation',
    purpose: 'Accessible, contextual learning from first launch through advanced production and certification.',
    professionalVolumes: ['POI-VOL-07', 'POI-VOL-11'], domainIds: ['learning-accessibility', 'creative-intelligence'],
    capabilities: ['tutorials', 'walkthroughs', 'interactive lessons', 'genre templates', 'example projects', 'music theory', 'mixing', 'mastering', 'video editing', 'certification', 'knowledge base', 'hardware manuals', 'learning by example'],
    currentEvidence: ['learning contracts and preferences', 'contextual local AI guidance', 'tutorial inventory'],
    gates: ['curriculum and lesson engine', 'original/licensed teaching media', 'accessibility and certification governance'],
  },
  {
    id: 'library-18', sourceNumber: '18', title: 'Marketplace', status: 'foundation',
    purpose: 'Licensed creative assets, tools, learning and professional services with evidence-backed fulfilment.',
    professionalVolumes: ['POI-VOL-08'], domainIds: ['commerce-marketplace', 'rights-provenance'],
    capabilities: ['sample packs', 'plugins', 'themes', 'skins', 'templates', 'projects', 'courses', 'presets', 'fonts', 'visual effects', 'artwork', 'services', 'collaboration', 'commission work', 'mixing', 'mastering', 'session work', 'voice overs', 'design', 'education'],
    currentEvidence: ['listing, licence, order and payment-evidence contracts', 'private local catalog defaults'],
    gates: ['payment provider', 'seller/buyer interfaces', 'tax/consumer/dispute/fraud operations', 'secure fulfilment'],
  },
  {
    id: 'library-19', sourceNumber: '19', title: 'Software Architecture', status: 'foundation',
    purpose: 'Shared frontend/core plus browser, native, media, provider and cloud adapter boundaries.',
    professionalVolumes: ['POI-VOL-02'], domainIds: ['interoperability', 'deployment-operations', 'privacy-security'],
    capabilities: ['backend', 'frontend', 'cloud', 'desktop', 'mobile', 'audio engine', 'video engine', 'GPU', 'AI engine', 'scaling', 'deployment', 'testing'],
    currentEvidence: ['versioned production core', 'React shell', 'PWA', 'Tauri scaffold', 'provider/hardware/platform contracts', 'verification pipeline'],
    gates: ['production backend/native/media services and platform certification'],
  },
  {
    id: 'library-20', sourceNumber: '20', title: 'Development Roadmap', status: 'foundation',
    purpose: 'Evidence-gated progression from controlled foundation to supported public operations.',
    professionalVolumes: ['POI-VOL-14'], domainIds: ['deployment-operations', 'business-administration'],
    capabilities: ['prototype', 'MVP', 'alpha', 'beta', 'release candidate', 'stable release', 'enterprise', 'future features', 'migration roadmap', 'acceptance tests and traceability'],
    currentEvidence: ['P0-P10 program', 'build status', 'automated verification and honest unavailable states'],
    gates: ['phase-specific implementation, recovery, security, accessibility, performance and release evidence'],
  },
  {
    id: 'library-51', sourceNumber: '51', title: 'The Creative Operating System', status: 'foundation',
    purpose: 'One project core, timeline, asset language, studio memory and interface across every creative discipline.',
    professionalVolumes: ['POI-VOL-01', 'POI-VOL-02'], domainIds: ['creative-os', 'asset-search', 'storage-router', 'profiles-workspaces'],
    capabilities: ['Project Core', 'universal timeline', 'universal asset manager', 'universal browser', 'AI memory', 'Creative DNA', 'intelligent studio', 'smart hardware', 'specialist Studio AI', 'knowledge base', 'marketplace', 'studio network', 'one database', 'one history', 'one save format'],
    currentEvidence: ['Creative OS extension', 'canonical audio timeline/assets', 'graph/search/journal/annotation contracts', 'shared app shell'],
    gates: ['canonical MIDI/video/image/task tracks', 'cross-project UI', 'consented memory and semantic indexing'],
  },
  {
    id: 'library-52', sourceNumber: '52', title: 'The Poietek Ecosystem', status: 'foundation',
    purpose: 'Portable creator identity, projects, assets, graph, search, dashboard, knowledge and sustainable profiles.',
    professionalVolumes: ['POI-VOL-01', 'POI-VOL-07', 'POI-VOL-09', 'POI-VOL-11'], domainIds: ['creative-os', 'asset-search', 'collaboration-community', 'learning-accessibility', 'sustainability-ethics'],
    capabilities: ['creator identity', 'universal project format', 'universal asset format', 'Creative Graph', 'semantic universal search', 'Studio Dashboard', 'AI Studio Manager', 'Knowledge Engine', 'learning by example', 'album/podcast/film/game/video/live/education templates', 'keyboard and screen-reader access', 'high contrast and UI scaling', 'colour-blind palettes', 'captions', 'voice control where practical', 'maximum quality', 'balanced mode', 'battery saving', 'cloud-assisted rendering'],
    currentEvidence: ['creator/project/asset graph contracts', 'local search', 'profiles and privacy settings', 'responsive application shell'],
    gates: ['identity/sync services', 'semantic model consent', 'dashboard and resource telemetry', 'accessibility certification'],
  },
  {
    id: 'library-53', sourceNumber: '53', title: 'The Creative Intelligence Layer', status: 'foundation',
    purpose: 'Consented intelligence that organizes, teaches and suggests across the whole creative graph without taking control.',
    professionalVolumes: ['POI-VOL-06'], domainIds: ['creative-intelligence', 'creative-os', 'release-preflight'],
    capabilities: ['Creative Graph intelligence', 'Studio Memory', 'universal typed or voice command system', 'visual Smart Automation', 'intelligent organization and duplicate detection', 'AI music assistant', 'AI video assistant', 'adaptive AI Studio Teacher', 'timeline intelligence', 'universal annotations', 'Studio Journal', 'Inspiration Mode', 'workflow profile', 'explain why', 'non-imitative creative brainstorming'],
    currentEvidence: ['local project-aware assistant', 'creative graph/search', 'annotations and journal contracts', 'health/preflight findings', 'preview/accept/undo policy'],
    gates: ['command palette/tool implementation', 'visual automation runtime', 'consented durable memory', 'cross-modal models and evaluation'],
  },
] as const;

export const DEVELOPMENT_LIBRARY_PARTS: readonly DevelopmentLibraryPart[] = [
  {id: 'part-foundation', title: 'Foundation', sourceRange: 'Volumes 1–5', capabilities: ['vision and ethics', 'functional specification', 'interface and experience modes', 'software architecture']},
  {id: 'part-audio', title: 'Audio', sourceRange: 'Volumes 6–12', capabilities: ['music theory and composition', 'recording and editing', 'mixing and mastering', 'DSP, instruments and samplers', 'sequencing, automation, routing and analysis AI']},
  {id: 'part-video', title: 'Video', sourceRange: 'Volumes 13–18', capabilities: ['timeline and editing', 'motion, animation and VFX', 'lighting and compositing', 'colour, rendering, camera and AI video']},
  {id: 'part-hardware', title: 'Hardware', sourceRange: 'Volumes 19–23', capabilities: ['MIDI 1/2 and MPE', 'OSC, USB, Bluetooth and Wi-Fi', 'control surfaces and performance devices', 'future devices and driver SDK']},
  {id: 'part-ai', title: 'AI', sourceRange: 'Volumes 24–30', capabilities: ['producer/composer/songwriter', 'video/mix/master specialists', 'teacher, project, rights and business assistants']},
  {id: 'part-community', title: 'Creator Community', sourceRange: 'Volumes 31–36', capabilities: ['profiles, messaging, teams and groups', 'projects, history and forking', 'competitions, streaming and monetisation', 'governance and reputation']},
  {id: 'part-publishing', title: 'Publishing', sourceRange: 'Volumes 37–40', capabilities: ['metadata, credits and contributors', 'PRO/publishing/distribution', 'streaming, sales, subscriptions, licensing and rights']},
  {id: 'part-cloud', title: 'Cloud', sourceRange: 'Volumes 41–43', capabilities: ['servers, storage and backups', 'collaboration and live editing', 'sync, offline mode and conflicts']},
  {id: 'part-developers', title: 'Developers', sourceRange: 'Volumes 44–47', capabilities: ['plugin, hardware and marketplace SDKs', 'themes and extensions', 'developer portal and documentation']},
  {id: 'part-company', title: 'Company', sourceRange: 'Volumes 48–50', capabilities: ['business, marketing and investment', 'roadmap, legal, security and privacy', 'testing, enterprise and future technology']},
] as const;

export const DEVELOPMENT_LIBRARY_APPENDICES: readonly DevelopmentLibraryAppendix[] = [
  {id: 'appendix-a', title: 'History of Music Production', topics: ['ancient instruments', 'analogue studios', 'MIDI', 'DAWs', 'AI', 'modern production']},
  {id: 'appendix-b', title: 'History of Video Production', topics: ['film', 'television', 'animation', 'CGI/VFX', 'game engines', 'virtual production']},
  {id: 'appendix-c', title: 'Open Standards', topics: ['MIDI', 'OSC', 'OpenFX', 'VST', 'CLAP', 'LV2', 'DDEX', 'Broadcast Wave', 'AAF', 'OMF', 'MPEG', 'OpenTimelineIO', 'USD', 'glTF']},
  {id: 'appendix-d', title: 'Research Library', topics: ['patent survey without protected reproduction', 'academic DSP/HCI/ML/MIR research', 'signal processing', 'accessibility', 'cloud architecture']},
  {id: 'appendix-e', title: 'Inspiration Library', topics: ['transferable DAW and creative-tool principles', 'film, theatre, broadcast and game workflows', 'open-source interface patterns', 'original design without copied protected expression']},
] as const;

export function searchDevelopmentLibrary(query: string): DevelopmentLibraryVolume[] {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return [...DEVELOPMENT_LIBRARY_VOLUMES];
  return DEVELOPMENT_LIBRARY_VOLUMES.filter((volume) => [
    volume.sourceNumber, volume.title, volume.purpose, ...volume.professionalVolumes,
    ...volume.domainIds, ...volume.capabilities, ...volume.currentEvidence, ...volume.gates,
  ].some((value) => value.toLocaleLowerCase().includes(normalized)));
}

export function validateDevelopmentLibraryDomainLinks(
  validDomainIds: ReadonlySet<string>,
): {valid: boolean; missing: string[]} {
  const missing = [...new Set(DEVELOPMENT_LIBRARY_VOLUMES.flatMap((volume) =>
    volume.domainIds.filter((id) => !validDomainIds.has(id))))];
  return {valid: missing.length === 0, missing};
}
