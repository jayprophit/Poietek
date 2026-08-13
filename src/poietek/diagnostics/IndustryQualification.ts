export type QualificationLaneKind = 'system' | 'volume';

export type QualificationState =
  | 'verified'
  | 'working'
  | 'foundation'
  | 'specified'
  | 'external_gate';

export interface IndustryReferencePlatform {
  id: string;
  name: string;
  category: string;
  officialUrl: string;
  benchmarkSignal: string;
}

export interface QualificationCriterion {
  id: string;
  title: string;
  state: QualificationState;
  mandatory: boolean;
  evidence: string[];
  fiveStarExit: string;
}

export interface QualificationLaneDefinition {
  id: string;
  kind: QualificationLaneKind;
  order: number;
  name: string;
  purpose: string;
  peerIds: string[];
  criteria: QualificationCriterion[];
}

export interface QualificationLaneAssessment extends QualificationLaneDefinition {
  score: number;
  stars: number;
  fiveStarQualified: boolean;
  verifiedCriteria: number;
  requiredCriteria: number;
  blockers: number;
}

export interface IndustryQualificationSummary {
  schemaVersion: '1.0.0';
  assessedAt: '2026-08-14';
  laneCount: number;
  systemCount: number;
  volumeCount: number;
  score: number;
  stars: number;
  fiveStarQualified: boolean;
  qualifiedLanes: number;
  blockedLanes: number;
  verifiedCriteria: number;
  requiredCriteria: number;
}

const points: Record<QualificationState, number> = {
  verified: 100,
  working: 75,
  foundation: 40,
  specified: 20,
  external_gate: 0,
};

const criterion = (
  id: string,
  title: string,
  state: QualificationState,
  evidence: string[],
  fiveStarExit: string,
  mandatory = true,
): QualificationCriterion => ({id, title, state, mandatory, evidence, fiveStarExit});

const lane = (
  id: string,
  kind: QualificationLaneKind,
  order: number,
  name: string,
  purpose: string,
  peerIds: string[],
  criteria: QualificationCriterion[],
): QualificationLaneDefinition => ({id, kind, order, name, purpose, peerIds, criteria});

export const INDUSTRY_REFERENCE_PLATFORMS: IndustryReferencePlatform[] = [
  {
    id: 'ableton-live',
    name: 'Ableton Live',
    category: 'DAW and live performance',
    officialUrl: 'https://www.ableton.com/en/live/all-new-features/',
    benchmarkSignal: 'Arrangement and performance workflows, audio and MIDI transformation, devices, mixer and accessibility.',
  },
  {
    id: 'logic-pro',
    name: 'Logic Pro',
    category: 'DAW and content ecosystem',
    officialUrl: 'https://www.apple.com/logic-pro/',
    benchmarkSignal: 'Mac and iPad production, deep editing, instruments, effects, routing, pitch, tempo, spatial audio and assisted workflows.',
  },
  {
    id: 'pro-tools',
    name: 'Pro Tools',
    category: 'Professional audio and post-production',
    officialUrl: 'https://cdn-www.avid.com/-/media/avid/files/hero-products-pdf/pro-tools/pro_tools_ds_a4.pdf',
    benchmarkSignal: 'Professional recording, editing, mixing and audio post-production expectations.',
  },
  {
    id: 'fl-studio',
    name: 'FL Studio',
    category: 'Pattern, beat and production workflow',
    officialUrl: 'https://www.image-line.com/fl-studio/',
    benchmarkSignal: 'Fast pattern creation, piano-roll workflow, mixer, instruments, effects and long-term product updates.',
  },
  {
    id: 'mpc',
    name: 'Akai MPC',
    category: 'Sampler and hardware workflow',
    officialUrl: 'https://www.akaipro.com/mpc3/',
    benchmarkSignal: 'Standalone and desktop sampling, arrangement, automation, multisampling, disk streaming and hardware control.',
  },
  {
    id: 'resolve',
    name: 'DaVinci Resolve',
    category: 'Video, VFX, audio post and delivery',
    officialUrl: 'https://www.blackmagicdesign.com/uk/products/davinciresolve/',
    benchmarkSignal: 'Integrated edit, node compositing, colour, audio post, delivery and multi-user workflows.',
  },
  {
    id: 'blender',
    name: 'Blender',
    category: '3D and VFX creation',
    officialUrl: 'https://docs.blender.org/manual/en/dev/getting_started/about/index.html',
    benchmarkSignal: 'Cross-platform 3D, animation, simulation, compositing, motion tracking and video editing.',
  },
  {
    id: 'bandlab',
    name: 'BandLab',
    category: 'Cloud music creation and community',
    officialUrl: 'https://help.bandlab.com/hc/en-us/articles/115002945153-Getting-Started-with-the-BandLab-Studio',
    benchmarkSignal: 'Browser and mobile creation, audio and MIDI tracks, effects, samples, learning and creator workflows.',
  },
  {
    id: 'frame-io',
    name: 'Frame.io',
    category: 'Creative review and collaboration',
    officialUrl: 'https://help.frame.io/en/articles/9105251-commenting-on-your-media',
    benchmarkSignal: 'Frame-accurate comments, annotations, versions, review permissions and approval workflows.',
  },
  {
    id: 'splice',
    name: 'Splice',
    category: 'Licensed sound and plugin marketplace',
    officialUrl: 'https://splice.com/tools/desktop',
    benchmarkSignal: 'Searchable licensed sounds, local library sync, tempo/key preview, drag-and-drop and plugin management.',
  },
  {
    id: 'songtrust',
    name: 'Songtrust',
    category: 'Publishing administration',
    officialUrl: 'https://www.songtrust.com/',
    benchmarkSignal: 'Song entry, publishing administration, royalty collection and reporting without inventing acceptance.',
  },
  {
    id: 'supabase',
    name: 'Supabase',
    category: 'Backend and realtime platform',
    officialUrl: 'https://supabase.com/docs',
    benchmarkSignal: 'Postgres, authentication, storage, realtime, APIs, functions and row-level authorization.',
  },
  {
    id: 'firebase',
    name: 'Firebase',
    category: 'Cross-device cloud platform',
    officialUrl: 'https://firebase.google.com/docs/firestore/manage-data/enable-offline',
    benchmarkSignal: 'Offline persistence, queued writes and cross-device synchronization with documented conflict behaviour.',
  },
  {
    id: 'vst3',
    name: 'VST 3 SDK',
    category: 'Audio plugin standard',
    officialUrl: 'https://steinbergmedia.github.io/vst3_dev_portal/',
    benchmarkSignal: 'Native host and plugin contracts, event/audio processing, automation, packaging and validation.',
  },
  {
    id: 'clap',
    name: 'CLAP',
    category: 'Audio plugin standard',
    officialUrl: 'https://github.com/free-audio/clap',
    benchmarkSignal: 'Stable host/plugin ABI, extensions, automation and polyphonic capabilities.',
  },
  {
    id: 'openfx',
    name: 'OpenFX',
    category: 'Visual effects plugin standard',
    officialUrl: 'https://openfx.readthedocs.io/en/latest/Reference/',
    benchmarkSignal: 'Host/plugin image-effect API, parameters, rendering, threading and capability negotiation.',
  },
  {
    id: 'wcag',
    name: 'WCAG 2.2',
    category: 'Accessibility standard',
    officialUrl: 'https://www.w3.org/TR/WCAG22/',
    benchmarkSignal: 'Testable perceivable, operable, understandable and robust accessibility requirements.',
  },
  {
    id: 'owasp-asvs',
    name: 'OWASP ASVS',
    category: 'Application security standard',
    officialUrl: 'https://owasp.org/www-project-application-security-verification-standard/',
    benchmarkSignal: 'A testable basis for application security controls and secure development requirements.',
  },
];

const systemLanes: QualificationLaneDefinition[] = [
  lane('system-professional-daw', 'system', 1, 'Professional DAW', 'Record, arrange, edit, mix, master and deliver complex sessions reliably.', ['ableton-live', 'logic-pro', 'pro-tools', 'fl-studio'], [
    criterion('project-audio-path', 'Canonical audio project path', 'working', ['Serializable project, real import, waveform, clips, playback, editing, save and undo are integrated.'], 'Prove long-session recovery, automation, comping, tempo maps, freeze, render and stress-tested multitrack workflows.'),
    criterion('mix-master', 'Professional mix and master', 'foundation', ['Track gain/pan/mute/solo and release-readiness contracts exist.'], 'Ship buses, sends, inserts, automation, control-room monitoring and validated BS.1770 LUFS/dBTP analysis.'),
    criterion('native-audio', 'Native low-latency engine', 'external_gate', ['Browser Web Audio is working; the native shell has no production audio backend.'], 'Pass measured device round-trip, dropout, clock, multichannel and sustained-load acceptance on supported operating systems.'),
    criterion('session-qualification', 'Interchange and session qualification', 'specified', ['Architecture and staged DAW gap plan are documented.'], 'Pass reference sessions, import/export interchange, accessibility and recovery suites with published hardware baselines.'),
  ]),
  lane('system-sampler', 'system', 2, 'Sampler', 'Capture, slice, map, sequence and perform original or licensed material.', ['mpc', 'fl-studio', 'logic-pro', 'splice'], [
    criterion('original-library', 'Original sound provenance', 'verified', ['Procedural one-shot kit and 24-recipe Sound Atlas are tested and marked Poietek original.'], 'Maintain provenance, deterministic renders and rights metadata for every bundled asset.'),
    criterion('sample-import', 'Real sample import and playback', 'working', ['Browser decoding, hashing, local asset storage, waveform and timeline playback are integrated.'], 'Add destructive-safe trim, slicing, choke groups, round robin, velocity layers and streaming validation.'),
    criterion('instrument-engine', 'Multisample instrument engine', 'specified', ['Recipes distinguish renderable content from recordings and engines still required.'], 'Ship voice allocation, modulation, filters, envelopes, time/pitch modes and measurable polyphony.'),
    criterion('sampling-hardware', 'Hardware sampling workflow', 'foundation', ['MIDI and versioned hardware/profile contracts exist.'], 'Qualify named devices through negotiated capabilities, pad feedback, sampling I/O and saved mappings.'),
  ]),
  lane('system-hardware-controller', 'system', 3, 'Hardware Controller', 'Map controls, routing, surfaces and console state without unsupported claims.', ['mpc', 'pro-tools'], [
    criterion('profile-contracts', 'Versioned device profiles', 'verified', ['Profile provenance, explicit selection and capability validation have passing core tests.'], 'Keep profiles versioned and reject unsubstantiated capability claims.'),
    criterion('mapping', 'Learn and mapping workflow', 'working', ['Web MIDI events, explicit simulators and visible hardware-centric views are integrated.'], 'Add conflict-safe learn, feedback, pages, motor/touch semantics and user profile export.'),
    criterion('console-sync', 'Console and transport sync', 'foundation', ['Control, transport, sample clock, metering and timecode domains are separated in contracts.'], 'Prove bidirectional adapters against supported surfaces with disconnect/reconnect and recall tests.'),
    criterion('hardware-lab', 'Measured hardware qualification', 'external_gate', ['No device latency, clock lock or hardware capability is fabricated.'], 'Run a physical device matrix with loopback evidence, firmware versions and repeatable acceptance reports.'),
  ]),
  lane('system-midi-hub', 'system', 4, 'MIDI Hub', 'Route, transform, clock and monitor MIDI devices and protocols.', ['ableton-live', 'logic-pro', 'mpc'], [
    criterion('web-midi', 'Honest MIDI discovery and events', 'working', ['Permission, unsupported, denied and error states are explicit; SysEx requires opt-in.'], 'Prove hot-plug, large-port routing and browser/platform compatibility.'),
    criterion('message-correctness', 'Message parsing correctness', 'verified', ['Pitch bend, channel pressure, zero-velocity note-off and malformed message tests pass.'], 'Extend conformance fixtures across channel voice, system realtime and MIDI 2.0 translation.'),
    criterion('routing-clock', 'Routing, transform and clock', 'foundation', ['Clock domains and routing contracts exist.'], 'Ship graph routing, filters, transforms, MIDI clock/MTC input and output with drift measurements.'),
    criterion('device-matrix', 'Device interoperability matrix', 'external_gate', ['Simulators are opt-in and are never presented as physical devices.'], 'Qualify real controllers, hubs and operating systems with recorded firmware and negotiated features.'),
  ]),
  lane('system-video-editor', 'system', 5, 'Video Editor', 'Edit synchronized picture, sound, captions and delivery formats.', ['resolve', 'frame-io', 'blender'], [
    criterion('video-model', 'Serializable video project model', 'foundation', ['Versioned video/VFX job and capability contracts exist.'], 'Integrate clips, tracks, transitions, markers, proxies, captions and undo into the canonical project.'),
    criterion('editor-workflow', 'Playable editing workflow', 'specified', ['UI and architecture volumes define the staged editor.'], 'Ship real demux/decode, frame-accurate trim, ripple/roll/slip, proxy playback and A/V sync.'),
    criterion('delivery', 'Codec and delivery pipeline', 'external_gate', ['Render jobs remain unavailable without a backend.'], 'Integrate licensed/available codecs, colour management, captions, loudness profiles and cancellable renders.'),
    criterion('review', 'Review and approval', 'foundation', ['Collaboration and version contracts preserve explicit authority states.'], 'Add frame-accurate annotations, review links, versions, roles and auditable approval evidence.'),
  ]),
  lane('system-vfx-suite', 'system', 6, 'VFX Suite', 'Composite, animate, track and render visual effects with extensibility.', ['resolve', 'blender', 'openfx'], [
    criterion('vfx-contracts', 'VFX graph and render contracts', 'foundation', ['Serializable render jobs and plugin capability states exist.'], 'Add node graph, parameter animation, masks and deterministic graph serialization.'),
    criterion('compositor', 'Working compositor', 'specified', ['No renderer is falsely reported as available.'], 'Ship GPU/CPU composition, colour-managed buffers, caching, tracking and reference-image tests.'),
    criterion('three-d', '3D and motion workflow', 'specified', ['The roadmap keeps 3D/VFX as a staged subsystem.'], 'Implement camera, transform, lighting, particles or integrate a clearly bounded interchange workflow.'),
    criterion('visual-plugins', 'Visual plugin host', 'external_gate', ['OpenFX is documented as a target; no plugin host claim is made.'], 'Build sandboxed OpenFX capability negotiation, crash isolation, validation and platform packaging.'),
  ]),
  lane('system-collaboration', 'system', 7, 'Collaboration Platform', 'Coordinate local-first projects, contributors, versions, review and conflict resolution.', ['frame-io', 'bandlab', 'supabase', 'firebase'], [
    criterion('local-replica', 'Local-first replica model', 'foundation', ['Change envelopes, replicas, conflict states and conservative defaults are versioned and tested.'], 'Integrate commands with durable change logs and deterministic merge/rebase behaviour.'),
    criterion('identity-roles', 'Identity, roles and invitations', 'specified', ['Permission and contributor contracts exist.'], 'Ship authenticated identities, least-privilege roles, invitations, revocation and audit logs.'),
    criterion('realtime-sync', 'Realtime synchronization', 'external_gate', ['Supabase and Firebase adapters report configuration and availability honestly.'], 'Pass offline queue, reconnect, conflict, large-asset and multi-device synchronization tests.'),
    criterion('review-approval', 'Media review and approval', 'foundation', ['Approval cannot be invented by validation rules.'], 'Ship timestamp/frame comments, annotations, versions and explicit signed approval records.'),
  ]),
  lane('system-publishing', 'system', 8, 'Publishing Platform', 'Prepare, validate, submit and track releases without confusing submission with acceptance.', ['bandlab', 'songtrust'], [
    criterion('release-readiness', 'Honest release readiness', 'working', ['Destination profiles and health gates explicitly leave LUFS/dBTP unmeasured.'], 'Add validated standards analysis, metadata, artwork and destination-specific conformance suites.'),
    criterion('release-package', 'Release package and metadata', 'foundation', ['Rights, contributor, registration and commerce contracts are serializable.'], 'Ship identifier, territory, credit, asset, version and delivery package validation.'),
    criterion('delivery-adapter', 'Distributor delivery adapters', 'external_gate', ['No external delivery or acceptance is claimed.'], 'Implement authorized provider adapters, idempotent submission, status polling, receipts and retry.'),
    criterion('reporting', 'Release and royalty reporting', 'specified', ['Publishing and database/API specifications define the boundary.'], 'Ingest normalized statements with provenance, reconciliation, exports and contributor-visible audit trails.'),
  ]),
  lane('system-rights', 'system', 9, 'Rights Management Platform', 'Capture contributors, splits, licences, registrations and evidence with explicit authority.', ['songtrust'], [
    criterion('rights-model', 'Rights and contributor model', 'verified', ['Contributor passports, splits, licences, registrations and evidence rules have passing validators.'], 'Preserve versioned evidence and prohibit ownership invention.'),
    criterion('split-approval', 'Split negotiation and approval', 'foundation', ['Approval authority, references and timestamps are required by contracts.'], 'Ship authenticated negotiation, signatures, amendments, disputes and immutable audit history.'),
    criterion('registration', 'External registration workflow', 'external_gate', ['Submission and acceptance are distinct external states.'], 'Integrate authorized societies/administrators with receipts, rejection handling and reconciliation.'),
    criterion('royalties', 'Royalty accounting and payouts', 'specified', ['Commerce and rights contracts forbid unsupported payment claims.'], 'Ship statement ingestion, allocation, tax/identity gates, payout providers and audited reconciliation.'),
  ]),
  lane('system-ai-assistant', 'system', 10, 'AI Creative Assistant', 'Offer optional local and third-party intelligence with consent, preview and undo.', ['logic-pro'], [
    criterion('provider-router', 'Provider-neutral capability routing', 'foundation', ['Local, Supabase, Firebase and multi-provider capability contracts exist.'], 'Integrate user-configured providers without exposing secrets and publish capability/retention disclosures.'),
    criterion('safe-actions', 'Preview, acceptance and undo', 'verified', ['Validators reject applied AI actions without preview, user acceptance and undoable commands.'], 'Keep every project-changing AI tool inside this command boundary.'),
    criterion('creative-tools', 'Working creative intelligence', 'specified', ['The AI center presents staged capabilities rather than simulated model results.'], 'Ship evaluated audio, MIDI, arrangement, mix, video and learning tools with fallback and uncertainty.'),
    criterion('model-evaluation', 'Quality, safety and provenance evaluation', 'external_gate', ['No independent model or external provider is represented as operational.'], 'Run task datasets, hallucination/rights tests, privacy reviews, latency/cost budgets and model-version tracking.'),
  ]),
  lane('system-social-network', 'system', 11, 'Social Network', 'Publish profiles, media and discussions with privacy, moderation and trust controls.', ['bandlab', 'frame-io'], [
    criterion('community-model', 'Private-by-default community model', 'foundation', ['Hub, feed, catalogue, visibility, moderation and trust contracts are tested.'], 'Integrate durable accounts, posts, follows, comments, notifications and export/delete workflows.'),
    criterion('media-player', 'Accessible community media player', 'foundation', ['Original-preserving A432 derivative boundary and offline cache defaults exist.'], 'Ship accessible playback, captions, queues, reporting, attribution and bandwidth controls.'),
    criterion('moderation', 'Moderation and safety operations', 'external_gate', ['Unproven moderation cannot be reported as available.'], 'Implement policy, reporting, appeals, age controls, abuse response, staffing and auditable service levels.'),
    criterion('discovery', 'Search, discovery and creator controls', 'specified', ['Feed/catalog contracts exist without ranking claims.'], 'Ship consent-aware discovery, filters, block/mute, recommendation explanations and manipulation defenses.'),
  ]),
  lane('system-marketplace', 'system', 12, 'Marketplace', 'License and deliver original or authorized assets, plugins and services.', ['splice'], [
    criterion('catalog-provenance', 'Original and licensed catalogue provenance', 'working', ['Original recipes are identified; purchase evidence is not equated with ownership.'], 'Require licence, territory, version, attribution and takedown metadata for every listing.'),
    criterion('store-contracts', 'Store, licence and fulfilment contracts', 'foundation', ['Validators reject fulfilment without payment evidence and reject ownership invention.'], 'Integrate carts, taxes, refunds, entitlements, download integrity and licence receipts.'),
    criterion('payments', 'Payment and payout providers', 'external_gate', ['No payment processor is connected or reported available.'], 'Complete provider, KYC/tax, fraud, dispute, refund and reconciliation acceptance.'),
    criterion('seller-platform', 'Seller and developer operations', 'specified', ['Developer and marketplace volumes define staged governance.'], 'Ship onboarding, review, analytics, support, versioning, deprecation and dispute workflows.'),
  ]),
  lane('system-cloud-platform', 'system', 13, 'Cloud Platform', 'Synchronize optional services while local durable work remains the success condition.', ['supabase', 'firebase', 'owasp-asvs'], [
    criterion('local-first', 'Offline local durability', 'working', ['IndexedDB project persistence, OPFS with fallback, recovery contracts and PWA shell exist.'], 'Pass storage-pressure, quota, corruption, recovery, migration and long-offline test matrices.'),
    criterion('provider-boundary', 'Provider abstraction and honest health', 'foundation', ['Local, Supabase and Firebase adapters use capability/configuration states.'], 'Ship authenticated production adapters, migrations, observability and portable export.'),
    criterion('sync', 'Cross-device data and asset sync', 'external_gate', ['No network synchronization is represented as working.'], 'Pass encrypted metadata/media sync, conflict, resume, integrity and deletion tests.'),
    criterion('operations', 'Security, reliability and operations', 'specified', ['Security/privacy and deployment specifications exist.'], 'Complete threat model, ASVS verification, backups/restore, incident response, SLOs and disaster exercises.'),
  ]),
];

const volumeNames = [
  'Vision & White Paper',
  'Software Architecture',
  'Audio Production System',
  'Sampler & Hardware Integration',
  'Video & VFX System',
  'AI System Architecture',
  'Community & Collaboration Platform',
  'Rights, Licensing & Publishing',
  'Cloud & Synchronisation',
  'Database & API Specification',
  'Desktop, Mobile & Web UI/UX',
  'Plugin SDK & Developer Documentation',
  'Security & Privacy',
  'Roadmap & Release Plan',
] as const;

const volumePeers: string[][] = [
  ['ableton-live', 'logic-pro', 'resolve'],
  ['supabase', 'firebase', 'vst3'],
  ['ableton-live', 'logic-pro', 'pro-tools'],
  ['mpc', 'splice'],
  ['resolve', 'blender', 'openfx'],
  ['logic-pro', 'owasp-asvs'],
  ['bandlab', 'frame-io', 'supabase'],
  ['songtrust', 'bandlab'],
  ['supabase', 'firebase'],
  ['supabase', 'firebase', 'owasp-asvs'],
  ['bandlab', 'logic-pro', 'wcag'],
  ['vst3', 'clap', 'openfx'],
  ['owasp-asvs', 'wcag', 'supabase'],
  ['ableton-live', 'resolve', 'owasp-asvs'],
];

const volumeImplementationState: QualificationState[] = [
  'working', 'working', 'foundation', 'foundation', 'specified', 'foundation', 'foundation',
  'foundation', 'foundation', 'foundation', 'working', 'foundation', 'foundation', 'working',
];

const volumeLanes: QualificationLaneDefinition[] = volumeNames.map((name, index) => {
  const number = index + 1;
  const key = String(number).padStart(2, '0');
  const implementationState = volumeImplementationState[index];
  return lane(
    `volume-${key}`,
    'volume',
    number,
    name,
    `Professional Volume ${key} controls the requirements, evidence, decisions and release gates for ${name.toLowerCase()}.`,
    volumePeers[index],
    [
      criterion(`v${key}-controlled`, 'Controlled specification', 'verified', [`docs/volumes/VOLUME_${key}_*.md is indexed and structurally tested.`], 'Keep ownership, dependencies, decisions and acceptance criteria under version control.'),
      criterion(`v${key}-traceability`, 'Source and architecture traceability', 'verified', ['The master specification, SDS coverage map and development-library crosswalk link source intent to architecture.'], 'Maintain stable requirement IDs and bidirectional code/test/release evidence.'),
      criterion(`v${key}-implementation`, 'Production implementation', implementationState, ['Current code evidence is reported by the system and development-library catalogues.'], 'Complete every mandatory implementation, integration, device/provider and platform acceptance item in this volume.'),
      criterion(`v${key}-release`, 'Independent release evidence', 'specified', ['The delivery plan defines staged verification and honest unavailable states.'], 'Publish repeatable conformance, performance, accessibility, security and recovery results for this volume.'),
    ],
  );
});

export const INDUSTRY_QUALIFICATION_LANES: QualificationLaneDefinition[] = [
  ...systemLanes,
  ...volumeLanes,
];

export function assessQualificationLane(definition: QualificationLaneDefinition): QualificationLaneAssessment {
  const required = definition.criteria.filter((item) => item.mandatory);
  const score = required.length === 0
    ? 0
    : Math.round(required.reduce((sum, item) => sum + points[item.state], 0) / required.length);
  const blockers = required.filter((item) => item.state === 'external_gate').length;
  const verifiedCriteria = required.filter((item) => item.state === 'verified').length;
  const fiveStarQualified = required.length > 0 && verifiedCriteria === required.length && blockers === 0;
  return {
    ...definition,
    score,
    stars: fiveStarQualified ? 5 : Math.round((score / 20) * 2) / 2,
    fiveStarQualified,
    verifiedCriteria,
    requiredCriteria: required.length,
    blockers,
  };
}

export const INDUSTRY_QUALIFICATION_ASSESSMENTS = INDUSTRY_QUALIFICATION_LANES.map(assessQualificationLane);

export function summarizeIndustryQualification(
  assessments: QualificationLaneAssessment[] = INDUSTRY_QUALIFICATION_ASSESSMENTS,
): IndustryQualificationSummary {
  const requiredCriteria = assessments.reduce((sum, item) => sum + item.requiredCriteria, 0);
  const verifiedCriteria = assessments.reduce((sum, item) => sum + item.verifiedCriteria, 0);
  const score = assessments.length === 0
    ? 0
    : Math.round(assessments.reduce((sum, item) => sum + item.score, 0) / assessments.length);
  const qualifiedLanes = assessments.filter((item) => item.fiveStarQualified).length;
  const blockedLanes = assessments.filter((item) => item.blockers > 0).length;
  return {
    schemaVersion: '1.0.0',
    assessedAt: '2026-08-14',
    laneCount: assessments.length,
    systemCount: assessments.filter((item) => item.kind === 'system').length,
    volumeCount: assessments.filter((item) => item.kind === 'volume').length,
    score,
    stars: Math.round((score / 20) * 2) / 2,
    fiveStarQualified: assessments.length > 0 && qualifiedLanes === assessments.length,
    qualifiedLanes,
    blockedLanes,
    verifiedCriteria,
    requiredCriteria,
  };
}

export function searchIndustryQualification(
  query: string,
  kind: 'all' | QualificationLaneKind = 'all',
): QualificationLaneAssessment[] {
  const normalized = query.trim().toLowerCase();
  const references = new Map(INDUSTRY_REFERENCE_PLATFORMS.map((item) => [item.id, item]));
  return INDUSTRY_QUALIFICATION_ASSESSMENTS.filter((item) => {
    if (kind !== 'all' && item.kind !== kind) return false;
    if (!normalized) return true;
    const peerText = item.peerIds.map((id) => references.get(id)?.name ?? id).join(' ');
    const criterionText = item.criteria
      .flatMap((entry) => [entry.title, entry.state, entry.evidence.join(' '), entry.fiveStarExit])
      .join(' ');
    return [item.name, item.purpose, peerText, criterionText].join(' ').toLowerCase().includes(normalized);
  });
}
