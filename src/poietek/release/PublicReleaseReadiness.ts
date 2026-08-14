export type PublicReleaseGateState =
  | 'verified'
  | 'working'
  | 'foundation'
  | 'missing'
  | 'external_gate';

export type PublicReleaseCategory =
  | 'product'
  | 'audio'
  | 'data'
  | 'web_pwa'
  | 'desktop'
  | 'mobile'
  | 'security'
  | 'privacy_legal'
  | 'accessibility'
  | 'cloud_collaboration'
  | 'commerce'
  | 'rights_publishing'
  | 'ai'
  | 'operations';

export interface PublicReleaseReference {
  label: string;
  url: string;
  authority: string;
}

export interface PublicReleaseGate {
  id: string;
  category: PublicReleaseCategory;
  title: string;
  state: PublicReleaseGateState;
  blocksPublicRelease: boolean;
  currentEvidence: readonly string[];
  requiredExit: string;
  references: readonly PublicReleaseReference[];
}

export interface PublicReleaseSummary {
  schemaVersion: '1.0.0';
  assessedAt: '2026-08-14';
  publicReleaseReady: boolean;
  decision: 'GO' | 'NO_GO';
  gateCount: number;
  verifiedCount: number;
  workingCount: number;
  foundationCount: number;
  missingCount: number;
  externalGateCount: number;
  blockingCount: number;
  categoriesCovered: number;
}

const reference = (label: string, url: string, authority: string): PublicReleaseReference => ({label, url, authority});
const WCAG = reference('Web Content Accessibility Guidelines 2.2', 'https://www.w3.org/TR/WCAG22/', 'W3C');
const PWA = reference('Making PWAs installable', 'https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable', 'MDN Web Docs');
const TAURI = reference('Tauri capability security', 'https://v2.tauri.app/security/capabilities/', 'Tauri');
const ASVS = reference('Application Security Verification Standard 5.0', 'https://owasp.org/www-project-application-security-verification-standard/', 'OWASP');
const APPLE = reference('App Review Guidelines', 'https://developer.apple.com/app-store/review/guidelines/', 'Apple');
const GOOGLE_DATA = reference('Google Play Data safety', 'https://support.google.com/googleplay/android-developer/answer/10787469?hl=en', 'Google Play');
const GOOGLE_PAYMENTS = reference('Google Play payments policy', 'https://support.google.com/googleplay/android-developer/answer/9858738?hl=en', 'Google Play');
const MICROSOFT = reference('Microsoft Store policies', 'https://learn.microsoft.com/en-us/windows/apps/publish/store-policies', 'Microsoft');

export const PUBLIC_RELEASE_CATEGORY_LABELS: Readonly<Record<PublicReleaseCategory, string>> = {
  product: 'Product and UX',
  audio: 'Audio correctness',
  data: 'Data integrity and recovery',
  web_pwa: 'Web and installed PWA',
  desktop: 'Desktop installers',
  mobile: 'Mobile packages',
  security: 'Security',
  privacy_legal: 'Privacy and legal',
  accessibility: 'Accessibility',
  cloud_collaboration: 'Cloud and collaboration',
  commerce: 'Commerce and subscriptions',
  rights_publishing: 'Rights and publishing',
  ai: 'AI safety and providers',
  operations: 'Release operations',
};

const gate = (
  id: string,
  category: PublicReleaseCategory,
  title: string,
  state: PublicReleaseGateState,
  currentEvidence: readonly string[],
  requiredExit: string,
  references: readonly PublicReleaseReference[] = [],
): PublicReleaseGate => ({
  id,
  category,
  title,
  state,
  blocksPublicRelease: state !== 'verified',
  currentEvidence,
  requiredExit,
  references,
});

export const PUBLIC_RELEASE_GATES: readonly PublicReleaseGate[] = [
  gate('release-product-core', 'product', 'Core local studio workflow', 'working',
    ['Integrated arranger, rack, mixer, import, playback, recording and WAV export slices', 'Automated core and application-shell tests'],
    'Pass repeatable end-to-end acceptance on real projects, long sessions, large asset sets, undo/redo and destructive-edge cases.'),
  gate('release-product-ux', 'product', 'Cross-device professional UX and claim audit', 'foundation',
    ['Responsive shell, menu system and evidence-controlled feature catalogue', 'Unavailable adapters show honest unavailable states'],
    'Pass creator usability, keyboard, touch, high-DPI and small-screen acceptance, then review every public claim and screenshot.', [WCAG, APPLE, MICROSOFT]),

  gate('release-audio-engine', 'audio', 'Audio engine and device-I/O qualification', 'working',
    ['WebAudio transport, scheduling, gain, pan, mute/solo, capture and deterministic WAV export', 'Honest MIDI/device capability states without invented latency'],
    'Pass glitch, seek, loop, device loss, permissions, dropout, sample-rate, channel-layout and extended-session tests on a declared hardware matrix.'),
  gate('release-audio-standards', 'audio', 'Standards loudness, true peak and time-preserving pitch', 'missing',
    ['RMS/sample peak are not mislabelled LUFS/dBTP', 'A432/A440 requests preserve the original when a validated pitch backend is unavailable'],
    'Validate BS.1770 loudness/true-peak and a licensed or owned time-preserving pitch backend against accepted reference material.'),

  gate('release-data-durability', 'data', 'Local project and asset durability', 'working',
    ['Canonical model, IndexedDB autosave, OPFS/IndexedDB media storage and SHA-256 asset identity'],
    'Pass quota, interrupted-write, migration, eviction, duplicate-asset and multi-gigabyte project tests without silent data loss.'),
  gate('release-data-recovery', 'data', 'Crash recovery and backup restore', 'foundation',
    ['Recovery snapshot contracts and recovery UI foundations'],
    'Prove process-kill recovery, recover/skip/discard, unsaved-state labelling, backup export and clean cross-version restore.'),

  gate('release-pwa-contract', 'web_pwa', 'PWA install contract', 'verified',
    ['Manifest has name, short name, start URL, standalone display and 192/512/maskable icons', 'Secure-context service-worker registration and update-ready state'],
    'Keep automated manifest/icon validation and repeat install checks for every supported browser release.', [PWA]),
  gate('release-web-offline', 'web_pwa', 'Offline and browser compatibility qualification', 'working',
    ['Production build emits a content-hashed precache', 'Private media, provider, API, authorization and range requests are excluded from generic caching'],
    'Pass first-load, installed-load, update, rollback, offline navigation and cache-corruption tests on the declared browser/device matrix.', [PWA, WCAG]),

  gate('release-desktop-shell', 'desktop', 'Least-privilege native shell', 'working',
    ['Tauri 2 shell, production CSP and named main-window capability', 'Native IPC permissions remain empty until reviewed adapters exist'],
    'Add only required reviewed adapters and pass native integration/security tests for every permission and target.', [TAURI, ASVS]),
  gate('release-desktop-installers', 'desktop', 'Signed desktop installers and updates', 'external_gate',
    ['Windows, macOS and Linux build scripts and bundler targets exist'],
    'Build, sign, notarize where required, install, upgrade, roll back and uninstall release candidates on clean machines; publish checksums and provenance.', [APPLE, MICROSOFT]),

  gate('release-mobile-experience', 'mobile', 'Mobile and tablet product acceptance', 'foundation',
    ['Device-class adaptive shell and touch control foundations'],
    'Complete editing, safe-area, audio-session, interruption, backgrounding, storage, battery, thermal and accessibility acceptance.', [APPLE, GOOGLE_DATA, WCAG]),
  gate('release-mobile-packages', 'mobile', 'Signed Android and iOS packages', 'external_gate',
    ['Tauri mobile initialise/development/build scripts and declared minimum OS versions'],
    'Create signed packages, pass physical-device/device-farm tests and satisfy current store submission requirements.', [APPLE, GOOGLE_DATA]),

  gate('release-security-boundaries', 'security', 'Application security boundaries', 'working',
    ['CSP, deny-by-default native permissions, provider-secret restrictions and untrusted-extension validation'],
    'Map every trust boundary and complete an ASVS-based verification plan for web, native, media, plugin, provider and collaboration surfaces.', [ASVS, TAURI]),
  gate('release-security-assurance', 'security', 'Supply-chain and independent security assurance', 'missing',
    ['Pinned native framework versions and a JavaScript lockfile'],
    'Automate dependency/licence/secret/provenance checks, generate an SBOM, complete threat modelling and independent penetration testing, and remediate release findings.', [ASVS]),

  gate('release-privacy-inventory', 'privacy_legal', 'Data, SDK and processor inventory', 'foundation',
    ['Local-first contracts distinguish local, remote and provider processing', 'Remote adapters expose configuration and authorization state'],
    'Inventory every datum, purpose, location, retention rule, processor, SDK, permission and transfer for each released platform.', [APPLE, GOOGLE_DATA]),
  gate('release-privacy-terms', 'privacy_legal', 'Approved privacy notice, terms and user controls', 'missing',
    ['No final legal notice, price, service promise or rights acceptance is claimed'],
    'Publish owner/jurisdiction-approved privacy, product, content, copyright, refund and consumer terms with matching consent, export, deletion and support workflows.', [APPLE, GOOGLE_DATA, GOOGLE_PAYMENTS, MICROSOFT]),

  gate('release-accessibility-product', 'accessibility', 'WCAG 2.2 product conformance', 'foundation',
    ['Semantic labels, headings, status text and keyboard commands exist in major new surfaces'],
    'Complete automated and human WCAG 2.2 AA tests for keyboard, screen reader, focus, zoom/reflow, contrast, target size and non-drag alternatives.', [WCAG]),
  gate('release-accessibility-media', 'accessibility', 'Accessible time-based editing', 'missing',
    ['Some commands and numeric controls avoid direct waveform dragging'],
    'Provide and test non-pointer editing, meaningful time/clip announcements, labelled meters, reduced motion and accessible error recovery.', [WCAG]),

  gate('release-cloud-adapters', 'cloud_collaboration', 'Production cloud adapters', 'foundation',
    ['Supabase, Firebase and local provider contracts with honest configuration states', 'Local operation does not require an account'],
    'Complete one selected production adapter with authentication, authorization policies, migrations, backups, regional hosting, quota and outage tests.', [ASVS]),
  gate('release-collaboration', 'cloud_collaboration', 'Cross-device and team conflict safety', 'foundation',
    ['Serializable replica/change-envelope and team permission contracts'],
    'Implement authenticated sync, deterministic conflicts, offline reconciliation, role enforcement, revocation, audit history and project-scale load tests.', [ASVS]),

  gate('release-commerce-catalog', 'commerce', 'Governed tiers and entitlements', 'foundation',
    ['Seven reference tiers with inheritance, limits and validation', 'Checkout and pricing are unapproved and disabled'],
    'Approve price books, tax/currency rules, entitlements, refunds, trials, limits, support promises and change governance.', [APPLE, GOOGLE_PAYMENTS]),
  gate('release-commerce-billing', 'commerce', 'Store-compliant billing and fulfilment', 'external_gate',
    ['Contracts reject fulfilment without payment evidence'],
    'Integrate approved payment paths by platform/region and implement receipt verification, disclosure, cancellation, refund, failure and reconciliation.', [APPLE, GOOGLE_PAYMENTS]),

  gate('release-rights-acceptance', 'rights_publishing', 'Authoritative rights and split acceptance', 'external_gate',
    ['Contributor, split, rights, registration and provenance contracts reject invented acceptance or ownership'],
    'Connect identity, consent/signature and authority workflows with durable audit evidence, disputes, revocation rules and legal review.'),
  gate('release-publishing-delivery', 'rights_publishing', 'Publishing and registration delivery', 'external_gate',
    ['Release-readiness profiles and registration external-status contracts'],
    'Connect selected providers, validate metadata/assets, prove retry/reconciliation and require provider evidence for submitted, accepted or paid states.'),

  gate('release-ai-local', 'ai', 'Independent local AI runtime', 'foundation',
    ['Local/third-party provider catalogue, route policy and user-controlled enablement'],
    'Integrate a distributable local model/runtime with licensing, offline operation, hardware-aware limits, cancellation and quality/safety evaluation.', [ASVS]),
  gate('release-ai-providers', 'ai', 'Third-party AI provider safety', 'foundation',
    ['Providers are disabled until configured; secrets are not exposed through Vite', 'AI changes require preview, acceptance and undoable application'],
    'Complete authentication, data-use disclosure, model/version logging, cost controls, deletion rules, safety evaluation and failure isolation for every enabled provider.', [APPLE, GOOGLE_DATA, ASVS]),

  gate('release-operations-pipeline', 'operations', 'Repeatable release pipeline', 'foundation',
    ['Format, native-config, typecheck, core-test and production-build verification scripts'],
    'Run protected reproducible CI on every target and archive reports, artefacts, SBOM, signatures, checksums and provenance; block on required failures.', [ASVS]),
  gate('release-operations-public', 'operations', 'Crash, incident, support and store operations', 'missing',
    ['Local diagnostics and official requirement register foundations'],
    'Approve privacy-preserving crash reporting, incident/rollback/support/vulnerability processes and complete every selected store listing, declaration and certification.', [APPLE, GOOGLE_DATA, MICROSOFT]),
] as const;

export const PUBLIC_RELEASE_CATEGORIES = Object.keys(PUBLIC_RELEASE_CATEGORY_LABELS) as PublicReleaseCategory[];

export function summarizePublicReleaseReadiness(
  gates: readonly PublicReleaseGate[] = PUBLIC_RELEASE_GATES,
): PublicReleaseSummary {
  const blockingCount = gates.filter((item) => item.blocksPublicRelease && item.state !== 'verified').length;
  const categoriesCovered = new Set(gates.map((item) => item.category)).size;
  const publicReleaseReady = gates.length > 0 && categoriesCovered === PUBLIC_RELEASE_CATEGORIES.length && blockingCount === 0;
  return {
    schemaVersion: '1.0.0', assessedAt: '2026-08-14', publicReleaseReady,
    decision: publicReleaseReady ? 'GO' : 'NO_GO', gateCount: gates.length,
    verifiedCount: gates.filter((item) => item.state === 'verified').length,
    workingCount: gates.filter((item) => item.state === 'working').length,
    foundationCount: gates.filter((item) => item.state === 'foundation').length,
    missingCount: gates.filter((item) => item.state === 'missing').length,
    externalGateCount: gates.filter((item) => item.state === 'external_gate').length,
    blockingCount, categoriesCovered,
  };
}

export function searchPublicReleaseGates(
  query = '',
  category: 'all' | PublicReleaseCategory = 'all',
  state: 'all' | PublicReleaseGateState = 'all',
  gates: readonly PublicReleaseGate[] = PUBLIC_RELEASE_GATES,
) {
  const needle = query.trim().toLocaleLowerCase();
  return gates.filter((item) => {
    if (category !== 'all' && item.category !== category) return false;
    if (state !== 'all' && item.state !== state) return false;
    if (!needle) return true;
    return [item.title, PUBLIC_RELEASE_CATEGORY_LABELS[item.category], item.requiredExit, ...item.currentEvidence,
      ...item.references.flatMap((entry) => [entry.label, entry.authority])]
      .some((value) => value.toLocaleLowerCase().includes(needle));
  });
}

export function validatePublicReleaseGates(gates: readonly PublicReleaseGate[] = PUBLIC_RELEASE_GATES): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  for (const item of gates) {
    if (ids.has(item.id)) issues.push(`Duplicate release gate id: ${item.id}`);
    ids.add(item.id);
    if (!item.currentEvidence.length) issues.push(`${item.id} has no current evidence statement`);
    if (!item.requiredExit.trim()) issues.push(`${item.id} has no required exit`);
    if (item.state !== 'verified' && !item.blocksPublicRelease) issues.push(`${item.id} is incomplete but does not block public release`);
  }
  for (const category of PUBLIC_RELEASE_CATEGORIES) {
    if (!gates.some((item) => item.category === category)) issues.push(`Missing public-release category: ${category}`);
  }
  return issues;
}
