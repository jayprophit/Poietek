import {useMemo, useState} from 'react';
import {
  INDUSTRY_QUALIFICATION_ASSESSMENTS,
  INDUSTRY_REFERENCE_PLATFORMS,
  searchIndustryQualification,
  summarizeIndustryQualification,
  type QualificationLaneKind,
  type QualificationState,
} from '../diagnostics';
import {
  CORE_ECOSYSTEM_PILLARS,
  DEVELOPMENT_LIBRARY_APPENDICES,
  DEVELOPMENT_LIBRARY_PARTS,
  DEVELOPMENT_LIBRARY_SOURCE,
  DEVELOPMENT_LIBRARY_VOLUMES,
  SDS_VISION_CATALOG,
  SDS_VISION_CATALOG_VERSION,
  searchDevelopmentLibrary,
  searchVisionCatalog,
  summarizeVisionCatalog,
  type VisionCapabilityStatus,
} from '../vision';
import {
  searchMasterBuildChecklist,
  summarizeMasterBuildProgress,
  type BuildChecklistStatus,
} from '../progress';
import {
  BUSINESS_TIER_CATALOG,
  BUSINESS_TIER_GOVERNANCE,
  formatReferencePrice,
  resolveTierEntitlements,
  searchBusinessTiers,
  type EntitlementLimit,
  type TierEntitlement,
} from '../business';
import {
  PUBLIC_RELEASE_CATEGORIES,
  PUBLIC_RELEASE_CATEGORY_LABELS,
  searchPublicReleaseGates,
  summarizePublicReleaseReadiness,
  type PublicReleaseCategory,
  type PublicReleaseGateState,
} from '../release/PublicReleaseReadiness';
import './PoietekEcosystemCenter.css';

type StatusFilter = 'all' | VisionCapabilityStatus;
type EcosystemView = 'capabilities' | 'library' | 'business' | 'progress' | 'release' | 'benchmark';
type BenchmarkKindFilter = 'all' | QualificationLaneKind;
type ProgressStatusFilter = 'all' | BuildChecklistStatus;
type ReleaseCategoryFilter = 'all' | PublicReleaseCategory;
type ReleaseStateFilter = 'all' | PublicReleaseGateState;

const statusLabels: Record<VisionCapabilityStatus, string> = {
  operational: 'Working now',
  foundation: 'Foundation built',
  planned: 'Planned slice',
  blocked_external: 'External gate',
};

const qualificationLabels: Record<QualificationState, string> = {
  verified: 'Verified',
  working: 'Working slice',
  foundation: 'Foundation',
  specified: 'Specified',
  external_gate: 'External gate',
};

const progressLabels: Record<BuildChecklistStatus, string> = {
  complete: 'Complete',
  partly_done: 'Partly done',
  missing: 'Missing',
  blocked_external: 'External gate',
};

const releaseStateLabels: Record<PublicReleaseGateState, string> = {
  verified: 'Verified',
  working: 'Working, acceptance due',
  foundation: 'Foundation only',
  missing: 'Missing',
  external_gate: 'External evidence required',
};

const entitlementLabels: Record<TierEntitlement['state'], string> = {
  included: 'Proposed included',
  limited: 'Reference allowance',
  not_included: 'Not included',
  add_on: 'Separate add-on',
  configurable: 'Decision required',
  requires_provider: 'External service gate',
};

const describeLimit = (limit: EntitlementLimit | null) => {
  if (!limit) return null;
  if (limit.kind === 'included_count') return `${limit.quantity} ${limit.unit} per ${limit.period}`;
  if (limit.kind === 'subject_to_fair_use') return 'Subject to an approved fair-use policy';
  if (limit.kind === 'device_resource_limited') return 'Limited by verified device and engine capacity';
  return 'Configured by an approved contract or price book';
};

export function PoietekEcosystemCenter() {
  const [view, setView] = useState<EcosystemView>('capabilities');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [benchmarkKind, setBenchmarkKind] = useState<BenchmarkKindFilter>('all');
  const [progressKind, setProgressKind] = useState<BenchmarkKindFilter>('all');
  const [progressStatus, setProgressStatus] = useState<ProgressStatusFilter>('all');
  const [releaseCategory, setReleaseCategory] = useState<ReleaseCategoryFilter>('all');
  const [releaseState, setReleaseState] = useState<ReleaseStateFilter>('all');
  const summary = useMemo(() => summarizeVisionCatalog(), []);
  const qualificationSummary = useMemo(() => summarizeIndustryQualification(), []);
  const progressSummary = useMemo(() => summarizeMasterBuildProgress(), []);
  const releaseSummary = useMemo(() => summarizePublicReleaseReadiness(), []);
  const benchmarkReferences = useMemo(
    () => new Map(INDUSTRY_REFERENCE_PLATFORMS.map((item) => [item.id, item])),
    [],
  );
  const areas = useMemo(() => searchVisionCatalog(query).filter((area) => status === 'all' || area.status === status), [query, status]);
  const libraryVolumes = useMemo(() => searchDevelopmentLibrary(query).filter((volume) => status === 'all' || volume.status === status), [query, status]);
  const benchmarkLanes = useMemo(
    () => searchIndustryQualification(query, benchmarkKind),
    [query, benchmarkKind],
  );
  const progressLanes = useMemo(
    () => searchMasterBuildChecklist(query, progressKind, progressStatus),
    [query, progressKind, progressStatus],
  );
  const businessTiers = useMemo(() => searchBusinessTiers(query), [query]);
  const releaseGates = useMemo(
    () => searchPublicReleaseGates(query, releaseCategory, releaseState),
    [query, releaseCategory, releaseState],
  );

  return (
    <main className="poietek-ecosystem" aria-label="Poietek ecosystem architecture">
      <header className="poietek-ecosystem-hero">
        <div>
          <p>Creative operating system · controlled catalogue {SDS_VISION_CATALOG_VERSION}</p>
          <h1>{view === 'library' ? 'The complete development library.' : view === 'business' ? 'A business structure, before a price book.' : view === 'progress' ? 'Build to 100%, evidence first.' : view === 'release' ? 'Public release is a hard no-go.' : view === 'benchmark' ? 'Five stars must be proven.' : 'One studio. Thirteen connected systems.'}</h1>
          <span>{view === 'library' ? 'Every attached source volume is cross-walked to working evidence, staged architecture, professional documentation and honest gates.' : view === 'business' ? 'Seven proposed tiers preserve the supplied commercial shape while pricing, checkout, entitlement enforcement and service promises remain explicitly unapproved.' : view === 'progress' ? 'All 108 mandatory criteria from the thirteen product systems and fourteen professional volumes are tracked as complete, partly done, missing or externally blocked.' : view === 'release' ? 'A public release stays blocked until product, audio, recovery, platform, accessibility, security, privacy, legal and operational acceptance evidence is complete.' : view === 'benchmark' ? 'Twenty-seven qualification lanes compare the thirteen-system product and fourteen professional volumes with official category-leader capabilities. Working code, tests and independent acceptance—not ambition—control the rating.' : 'The SDS vision is tracked here as executable capability, foundation, next slice, and honest release gate.'}</span>
        </div>
        <div className="poietek-ecosystem-totals" aria-label="Capability totals">
          <strong>{view === 'library' ? DEVELOPMENT_LIBRARY_VOLUMES.length : view === 'business' ? BUSINESS_TIER_CATALOG.length : view === 'progress' ? `${progressSummary.strictCompletionPercent}%` : view === 'release' ? releaseSummary.decision.replace('_', '-') : view === 'benchmark' ? `${qualificationSummary.stars.toFixed(1)}★` : SDS_VISION_CATALOG.length}</strong>
          <span>{view === 'library' ? 'source volumes mapped' : view === 'business' ? 'reference tiers · checkout off' : view === 'progress' ? 'strictly verified complete' : view === 'release' ? 'public-release decision' : view === 'benchmark' ? 'current evidence rating' : 'architecture areas'}</span>
          <b>{view === 'library' ? '20 core · 51–53 intelligence' : view === 'business' ? 'B0 catalogue foundation only' : view === 'progress' ? `${progressSummary.overallProgressPercent}% weighted delivery progress` : view === 'release' ? `${releaseSummary.blockingCount}/${releaseSummary.gateCount} gates still block release` : view === 'benchmark' ? `${qualificationSummary.qualifiedLanes}/${qualificationSummary.laneCount} lanes five-star qualified` : `${summary.operational} working · ${summary.foundation} foundations`}</b>
        </div>
      </header>

      <nav className="poietek-ecosystem-tabs" aria-label="Ecosystem views">
        <button type="button" className={view === 'capabilities' ? 'is-active' : ''} onClick={() => setView('capabilities')}>Capability architecture</button>
        <button type="button" className={view === 'library' ? 'is-active' : ''} onClick={() => setView('library')}>Development library</button>
        <button type="button" className={view === 'business' ? 'is-active' : ''} onClick={() => setView('business')}>Business tiers</button>
        <button type="button" className={view === 'progress' ? 'is-active' : ''} onClick={() => setView('progress')}>Build checklist</button>
        <button type="button" className={view === 'release' ? 'is-active' : ''} onClick={() => setView('release')}>Release control</button>
        <button type="button" className={view === 'benchmark' ? 'is-active' : ''} onClick={() => setView('benchmark')}>Industry qualification</button>
      </nav>

      {view === 'capabilities' && <><section className="poietek-pillar-section" aria-labelledby="ecosystem-pillars-heading">
        <div className="poietek-ecosystem-heading">
          <div><p>Core combination</p><h2 id="ecosystem-pillars-heading">Every system in the original SDS vision</h2></div>
          <span>Local-first core · optional network</span>
        </div>
        <div className="poietek-pillar-grid">
          {CORE_ECOSYSTEM_PILLARS.map((pillar, index) => (
            <article key={pillar.id} className={`poietek-pillar is-${pillar.status}`}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div><h3>{pillar.name}</h3><p>{pillar.promise}</p></div>
              <small>{statusLabels[pillar.status]}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="poietek-vision-section" aria-labelledby="vision-map-heading">
        <div className="poietek-ecosystem-heading">
          <div><p>Build map</p><h2 id="vision-map-heading">Expanded SDS capability architecture</h2></div>
          <span>{areas.length} areas shown</span>
        </div>
        <div className="poietek-vision-controls">
          <label>
            <span>Search the whole system</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="audio, rights, video, hardware, cloud…" />
          </label>
          <div role="group" aria-label="Capability status filter">
            {(['all', 'operational', 'foundation', 'planned', 'blocked_external'] as const).map((item) => (
              <button key={item} type="button" className={status === item ? 'is-active' : ''} onClick={() => setStatus(item)}>
                {item === 'all' ? 'All' : statusLabels[item]}
              </button>
            ))}
          </div>
        </div>

        <div className="poietek-vision-grid">
          {areas.map((area) => (
            <article key={area.id} className={`poietek-vision-card is-${area.status}`}>
              <header>
                <div><span>{area.category}</span><h3>{area.name}</h3></div>
                <small>{statusLabels[area.status]}</small>
              </header>
              <p>{area.purpose}</p>
              <div className="poietek-vision-evidence">
                <h4>In the build</h4>
                <ul>{area.currentEvidence.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
              <details>
                <summary>Expansion path</summary>
                <div><h4>Advance next</h4><ul>{area.advances.map((item) => <li key={item}>{item}</li>)}</ul></div>
                {area.gates.length > 0 && <div className="poietek-vision-gates"><h4>Real gates</h4><ul>{area.gates.map((item) => <li key={item}>{item}</li>)}</ul></div>}
              </details>
            </article>
          ))}
        </div>
        {!areas.length && <div className="poietek-vision-empty"><strong>No matching area</strong><span>Try a broader word or show every status.</span></div>}
      </section></>}

      {view === 'library' && <>
        <section className="poietek-library-source" aria-labelledby="development-library-source-heading">
          <div>
            <p>Controlled source record</p>
            <h2 id="development-library-source-heading">{DEVELOPMENT_LIBRARY_SOURCE.title}</h2>
            <span>The source is preserved as requirements data. A listed idea is not promoted to a working feature without code, integration and evidence.</span>
          </div>
          <dl>
            <div><dt>Lines</dt><dd>{DEVELOPMENT_LIBRARY_SOURCE.lineCount.toLocaleString()}</dd></div>
            <div><dt>Characters</dt><dd>{DEVELOPMENT_LIBRARY_SOURCE.characterCount.toLocaleString()}</dd></div>
            <div><dt>Imported</dt><dd>{DEVELOPMENT_LIBRARY_SOURCE.importedAt}</dd></div>
            <div className="is-hash"><dt>SHA-256</dt><dd>{DEVELOPMENT_LIBRARY_SOURCE.sha256}</dd></div>
          </dl>
        </section>

        <section className="poietek-vision-section" aria-labelledby="development-library-heading">
          <div className="poietek-ecosystem-heading">
            <div><p>Source-to-build crosswalk</p><h2 id="development-library-heading">Twenty core volumes plus Creative OS 51–53</h2></div>
            <span>{libraryVolumes.length} volumes shown</span>
          </div>
          <div className="poietek-vision-controls">
            <label>
              <span>Search volumes, features, evidence and gates</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="sampling, semantic search, Studio Journal, DDEX…" />
            </label>
            <div role="group" aria-label="Development library status filter">
              {(['all', 'operational', 'foundation', 'planned', 'blocked_external'] as const).map((item) => (
                <button key={item} type="button" className={status === item ? 'is-active' : ''} onClick={() => setStatus(item)}>
                  {item === 'all' ? 'All' : statusLabels[item]}
                </button>
              ))}
            </div>
          </div>

          <div className="poietek-library-grid">
            {libraryVolumes.map((volume) => (
              <article key={volume.id} className={`poietek-library-card is-${volume.status}`}>
                <header><span>Volume {volume.sourceNumber}</span><small>{statusLabels[volume.status]}</small></header>
                <h3>{volume.title}</h3>
                <p>{volume.purpose}</p>
                <div className="poietek-library-links" aria-label="Professional volume and architecture links">
                  {volume.professionalVolumes.map((item) => <span key={item}>{item}</span>)}
                  {volume.domainIds.map((item) => <span key={item}>{item}</span>)}
                </div>
                <details>
                  <summary>{volume.capabilities.length} requirements mapped</summary>
                  <div><h4>Required scope</h4><ul>{volume.capabilities.map((item) => <li key={item}>{item}</li>)}</ul></div>
                  <div><h4>Evidence in this build</h4><ul>{volume.currentEvidence.map((item) => <li key={item}>{item}</li>)}</ul></div>
                  {volume.gates.length > 0 && <div className="poietek-vision-gates"><h4>Remaining gates</h4><ul>{volume.gates.map((item) => <li key={item}>{item}</li>)}</ul></div>}
                </details>
              </article>
            ))}
          </div>
          {!libraryVolumes.length && <div className="poietek-vision-empty"><strong>No matching volume</strong><span>Try a feature, professional volume ID or architecture area.</span></div>}
        </section>

        <section className="poietek-library-expansion" aria-labelledby="library-expansion-heading">
          <div className="poietek-ecosystem-heading">
            <div><p>Fifty-volume expansion</p><h2 id="library-expansion-heading">Ten professional parts</h2></div>
            <span>Modular growth · no destructive rewrite</span>
          </div>
          <div className="poietek-library-part-grid">
            {DEVELOPMENT_LIBRARY_PARTS.map((part, index) => <article key={part.id}><span>{String(index + 1).padStart(2, '0')}</span><div><h3>{part.title}</h3><small>{part.sourceRange}</small><p>{part.capabilities.join(' · ')}</p></div></article>)}
          </div>
        </section>

        <section className="poietek-library-expansion" aria-labelledby="library-appendices-heading">
          <div className="poietek-ecosystem-heading">
            <div><p>Research and originality</p><h2 id="library-appendices-heading">Five source appendices</h2></div>
            <span>Learn principles · do not copy protected expression</span>
          </div>
          <div className="poietek-library-appendix-grid">
            {DEVELOPMENT_LIBRARY_APPENDICES.map((appendix) => <article key={appendix.id}><h3>{appendix.title}</h3><p>{appendix.topics.join(' · ')}</p></article>)}
          </div>
        </section>
      </>}

      {view === 'business' && <>
        <section className="poietek-business-notice" aria-labelledby="business-tier-heading">
          <div><p>Monetization foundation · schema {BUSINESS_TIER_GOVERNANCE.schemaVersion}</p><h2 id="business-tier-heading">Prices are planning references—not live offers</h2><span>Checkout is disabled. Pricing is unapproved. No account entitlement, payment, subscription, marketplace order or provider service is represented as active.</span></div>
          <dl>
            <div><dt>Reference tiers</dt><dd>{BUSINESS_TIER_CATALOG.length}</dd></div>
            <div><dt>Checkout</dt><dd>Off</dd></div>
            <div><dt>Pricing</dt><dd>Unapproved</dd></div>
            <div><dt>Current phase</dt><dd>B0</dd></div>
          </dl>
        </section>

        <section className="poietek-vision-section" aria-labelledby="business-catalog-heading">
          <div className="poietek-ecosystem-heading"><div><p>Reference commercial structure</p><h2 id="business-catalog-heading">Free, perpetual, membership, teams and enterprise</h2></div><span>{businessTiers.length} of {BUSINESS_TIER_CATALOG.length} tiers shown</span></div>
          <div className="poietek-vision-controls"><label><span>Search tiers, entitlements and gates</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="AI, collaboration, cloud, marketplace, support…" /></label></div>
          <div className="poietek-business-grid">
            {businessTiers.map((tier) => {
              const entitlements = resolveTierEntitlements(tier.id);
              return <article key={tier.id} className="poietek-business-card">
                <header><div><span>Tier {String(tier.order).padStart(2, '0')} · {tier.model.replaceAll('_', ' ')}</span><h3>{tier.name}</h3></div><strong>{formatReferencePrice(tier.referencePrice)}</strong></header>
                <p>{tier.audience}</p>
                {tier.inheritsFrom && <small className="poietek-business-inherits">Extends {BUSINESS_TIER_CATALOG.find((item) => item.id === tier.inheritsFrom)?.name}</small>}
                <div className="poietek-business-entitlements">
                  {entitlements.map((item) => <details key={item.id} className={`is-${item.state}`}><summary><span>{item.label}</span><small>{entitlementLabels[item.state]}</small></summary><div>{describeLimit(item.limit) && <b>{describeLimit(item.limit)}</b>}<p>{item.notes}</p>{item.externalGates.length > 0 && <ul>{item.externalGates.map((gate) => <li key={gate}>{gate}</li>)}</ul>}</div></details>)}
                </div>
                <details className="poietek-business-terms"><summary>Restrictions and release gates</summary><div><h4>Restrictions</h4><ul>{tier.restrictions.map((item) => <li key={item}>{item}</li>)}</ul><h4>External gates</h4><ul>{tier.externalGates.map((item) => <li key={item}>{item}</li>)}</ul></div></details>
              </article>;
            })}
          </div>
          {!businessTiers.length && <div className="poietek-vision-empty"><strong>No matching business tier</strong><span>Try a service, audience, allowance or external gate.</span></div>}
        </section>

        <section className="poietek-business-decisions" aria-labelledby="business-decisions-heading">
          <div><p>Owner, legal and operational decisions</p><h2 id="business-decisions-heading">What must be settled before any sale</h2></div>
          <div><article><h3>Open decisions</h3><ol>{BUSINESS_TIER_GOVERNANCE.unresolvedDecisions.map((item) => <li key={item}>{item}</li>)}</ol></article><article><h3>Release gates</h3><ol>{BUSINESS_TIER_GOVERNANCE.requiredReleaseGates.map((item) => <li key={item}>{item}</li>)}</ol></article></div>
        </section>
      </>}

      {view === 'progress' && <>
        <section className="poietek-progress-summary" aria-labelledby="master-progress-heading">
          <div className="poietek-progress-primary">
            <p>SDS source audit · {progressSummary.assessedAt}</p>
            <h2 id="master-progress-heading">{progressSummary.overallProgressPercent}% weighted progress</h2>
            <span>{progressSummary.strictCompletionPercent}% is strictly verified. Plans and foundations earn progress, but they do not count as finished.</span>
          </div>
          <div className="poietek-progress-measures">
            <article><span>Product implementation</span><strong>{progressSummary.productProgressPercent}%</strong><small>{progressSummary.productStrictCompletionPercent}% strictly complete</small></article>
            <article><span>Architecture & delivery</span><strong>{progressSummary.architectureProgressPercent}%</strong><small>{progressSummary.architectureStrictCompletionPercent}% strictly complete</small></article>
            <article className="is-complete"><span>Complete</span><strong>{progressSummary.counts.complete}</strong><small>of {progressSummary.counts.total} criteria</small></article>
            <article className="is-partial"><span>Partly done</span><strong>{progressSummary.counts.partly_done}</strong><small>{progressSummary.counts.working} working · {progressSummary.counts.foundation} foundations</small></article>
            <article className="is-missing"><span>Missing</span><strong>{progressSummary.counts.missing}</strong><small>specified, not implemented</small></article>
            <article className="is-gate"><span>External gates</span><strong>{progressSummary.counts.blocked_external}</strong><small>real evidence still required</small></article>
          </div>
          <aside><strong>World-class completion rule</strong><span>100% means all 108 mandatory criteria are verified and all 27 lanes qualify. No contract, mock, submission, hardware name or benchmark claim can substitute for working acceptance evidence.</span></aside>
        </section>

        <section className="poietek-vision-section" aria-labelledby="master-checklist-heading">
          <div className="poietek-ecosystem-heading">
            <div><p>Controlled progress register</p><h2 id="master-checklist-heading">Thirteen systems plus fourteen professional volumes</h2></div>
            <span>{progressLanes.length} of {progressSummary.laneCount} lanes shown</span>
          </div>
          <div className="poietek-vision-controls poietek-progress-controls">
            <label>
              <span>Search items, evidence and professional exits</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="automation, sampler, video, rights, security…" />
            </label>
            <div role="group" aria-label="Progress lane filter">
              {(['all', 'system', 'volume'] as const).map((item) => <button key={item} type="button" className={progressKind === item ? 'is-active' : ''} onClick={() => setProgressKind(item)}>{item === 'all' ? 'All 27' : item === 'system' ? '13 systems' : '14 volumes'}</button>)}
            </div>
            <div role="group" aria-label="Progress status filter">
              {(['all', 'complete', 'partly_done', 'missing', 'blocked_external'] as const).map((item) => <button key={item} type="button" className={progressStatus === item ? 'is-active' : ''} onClick={() => setProgressStatus(item)}>{item === 'all' ? 'Every status' : progressLabels[item]}</button>)}
            </div>
          </div>

          <div className="poietek-progress-grid">
            {progressLanes.map((lane) => (
              <article key={lane.id} className="poietek-progress-card">
                <header><div><span>{lane.kind === 'system' ? `System ${String(lane.order).padStart(2, '0')}` : `Volume ${String(lane.order).padStart(2, '0')}`}</span><h3>{lane.name}</h3></div><strong>{lane.progressPercent}%</strong></header>
                <div className="poietek-progress-track" aria-label={`${lane.progressPercent}% weighted progress`}><span style={{width: `${lane.progressPercent}%`}} /></div>
                <p>{lane.purpose}</p>
                <div className="poietek-progress-card-totals"><span>{lane.strictCompletionPercent}% strictly complete</span><b>{lane.completeItems}/{lane.requiredItems} verified</b></div>
                <div className="poietek-progress-items">
                  {lane.items.map((item) => (
                    <details key={item.id} className={`is-${item.status}`}>
                      <summary><input type="checkbox" checked={item.status === 'complete'} readOnly tabIndex={-1} aria-label={`${item.title}: ${progressLabels[item.status]}`} /><span>{item.title}</span><small>{progressLabels[item.status]}</small></summary>
                      <div><b>Current evidence</b><ul>{item.evidence.map((evidence) => <li key={evidence}>{evidence}</li>)}</ul></div>
                      <div className="poietek-progress-exit"><b>Required for professional completion</b><p>{item.professionalExit}</p></div>
                    </details>
                  ))}
                </div>
              </article>
            ))}
          </div>
          {!progressLanes.length && <div className="poietek-vision-empty"><strong>No matching checklist lane</strong><span>Try another status, broader search or show both systems and volumes.</span></div>}
        </section>
      </>}

      {view === 'release' && <>
        <section className="poietek-release-decision" aria-labelledby="public-release-heading">
          <div>
            <p>Controlled release decision · assessed {releaseSummary.assessedAt}</p>
            <h2 id="public-release-heading">{releaseSummary.decision.replace('_', '-')} · do not publish as a finished product</h2>
            <span>{releaseSummary.blockingCount} of {releaseSummary.gateCount} release gates remain incomplete. A working slice or architecture foundation is not public acceptance.</span>
          </div>
          <dl>
            <div className="is-verified"><dt>Verified</dt><dd>{releaseSummary.verifiedCount}</dd></div>
            <div className="is-working"><dt>Working</dt><dd>{releaseSummary.workingCount}</dd></div>
            <div className="is-foundation"><dt>Foundation</dt><dd>{releaseSummary.foundationCount}</dd></div>
            <div className="is-missing"><dt>Missing</dt><dd>{releaseSummary.missingCount}</dd></div>
            <div className="is-external"><dt>External gates</dt><dd>{releaseSummary.externalGateCount}</dd></div>
          </dl>
          <aside><strong>Fail closed</strong><span>The decision becomes GO only when every blocking gate is verified and all {releaseSummary.categoriesCovered} required categories remain covered.</span></aside>
        </section>

        <section className="poietek-vision-section" aria-labelledby="public-release-gates-heading">
          <div className="poietek-ecosystem-heading"><div><p>Public-use acceptance register</p><h2 id="public-release-gates-heading">Exact evidence required before release</h2></div><span>{releaseGates.length} of {releaseSummary.gateCount} gates shown</span></div>
          <div className="poietek-release-controls">
            <label><span>Search evidence, exits and authorities</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="recovery, LUFS, privacy, signing, accessibility…" /></label>
            <label><span>Category</span><select value={releaseCategory} onChange={(event) => setReleaseCategory(event.target.value as ReleaseCategoryFilter)}><option value="all">All categories</option>{PUBLIC_RELEASE_CATEGORIES.map((item) => <option key={item} value={item}>{PUBLIC_RELEASE_CATEGORY_LABELS[item]}</option>)}</select></label>
            <label><span>Evidence state</span><select value={releaseState} onChange={(event) => setReleaseState(event.target.value as ReleaseStateFilter)}><option value="all">Every state</option>{(['verified', 'working', 'foundation', 'missing', 'external_gate'] as const).map((item) => <option key={item} value={item}>{releaseStateLabels[item]}</option>)}</select></label>
          </div>
          <div className="poietek-release-grid">
            {releaseGates.map((item) => <article key={item.id} className={`poietek-release-card is-${item.state}`}>
              <header><div><span>{PUBLIC_RELEASE_CATEGORY_LABELS[item.category]}</span><h3>{item.title}</h3></div><small>{releaseStateLabels[item.state]}</small></header>
              <div><h4>Current evidence</h4><ul>{item.currentEvidence.map((evidence) => <li key={evidence}>{evidence}</li>)}</ul></div>
              <div className="poietek-release-exit"><h4>Required exit</h4><p>{item.requiredExit}</p></div>
              {item.references.length > 0 && <footer><b>Official requirements</b><div>{item.references.map((reference) => <a key={reference.url} href={reference.url} target="_blank" rel="noreferrer">{reference.authority} · {reference.label}</a>)}</div></footer>}
            </article>)}
          </div>
          {!releaseGates.length && <div className="poietek-vision-empty"><strong>No matching release gate</strong><span>Try a broader term or show every category and state.</span></div>}
        </section>
      </>}

      {view === 'benchmark' && <>
        <section className="poietek-benchmark-summary" aria-labelledby="industry-qualification-heading">
          <div className="poietek-benchmark-score">
            <p>Evidence assessment · {qualificationSummary.assessedAt}</p>
            <h2 id="industry-qualification-heading">Current {qualificationSummary.stars.toFixed(1)} / 5.0</h2>
            <span>Target 5.0 · qualification is withheld until every mandatory criterion in every lane is verified.</span>
          </div>
          <dl>
            <div><dt>Overall score</dt><dd>{qualificationSummary.score}/100</dd></div>
            <div><dt>Five-star lanes</dt><dd>{qualificationSummary.qualifiedLanes}/{qualificationSummary.laneCount}</dd></div>
            <div><dt>Verified gates</dt><dd>{qualificationSummary.verifiedCriteria}/{qualificationSummary.requiredCriteria}</dd></div>
            <div><dt>Externally blocked</dt><dd>{qualificationSummary.blockedLanes} lanes</dd></div>
          </dl>
          <aside>
            <strong>Two different benchmarks</strong>
            <span>This qualification measures product maturity against published capabilities and release evidence. Studio Setup → Benchmark separately measures this device’s browser DSP, scheduler, offline-render and local-storage paths.</span>
          </aside>
        </section>

        <section className="poietek-vision-section" aria-labelledby="qualification-lanes-heading">
          <div className="poietek-ecosystem-heading">
            <div><p>Current versus target</p><h2 id="qualification-lanes-heading">Thirteen systems plus fourteen controlled volumes</h2></div>
            <span>{benchmarkLanes.length} of {INDUSTRY_QUALIFICATION_ASSESSMENTS.length} lanes shown</span>
          </div>
          <div className="poietek-vision-controls poietek-benchmark-controls">
            <label>
              <span>Search criteria, evidence, gaps and reference platforms</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="automation, MIDI, rights, WCAG, render…" />
            </label>
            <div role="group" aria-label="Qualification lane filter">
              {(['all', 'system', 'volume'] as const).map((item) => (
                <button key={item} type="button" className={benchmarkKind === item ? 'is-active' : ''} onClick={() => setBenchmarkKind(item)}>
                  {item === 'all' ? 'All 27' : item === 'system' ? '13 systems' : '14 volumes'}
                </button>
              ))}
            </div>
          </div>

          <div className="poietek-benchmark-grid">
            {benchmarkLanes.map((item) => (
              <article key={item.id} className={`poietek-benchmark-card ${item.fiveStarQualified ? 'is-qualified' : ''}`}>
                <header>
                  <div><span>{item.kind === 'system' ? `System ${String(item.order).padStart(2, '0')}` : `Volume ${String(item.order).padStart(2, '0')}`}</span><h3>{item.name}</h3></div>
                  <div className="poietek-benchmark-rating" aria-label={`${item.stars.toFixed(1)} out of five stars`}><strong>{item.stars.toFixed(1)}★</strong><small>{item.score}/100</small></div>
                </header>
                <p>{item.purpose}</p>
                <div className="poietek-benchmark-peers">
                  <b>Official reference set</b>
                  <div>{item.peerIds.map((id) => {
                    const reference = benchmarkReferences.get(id);
                    return reference ? <a key={id} href={reference.officialUrl} target="_blank" rel="noreferrer" title={reference.benchmarkSignal}>{reference.name}</a> : null;
                  })}</div>
                </div>
                <div className="poietek-benchmark-criteria">
                  {item.criteria.map((entry) => (
                    <details key={entry.id} className={`is-${entry.state}`}>
                      <summary><span>{entry.title}</span><small>{qualificationLabels[entry.state]}</small></summary>
                      <div><b>Current evidence</b><ul>{entry.evidence.map((evidence) => <li key={evidence}>{evidence}</li>)}</ul></div>
                      <div className="poietek-benchmark-exit"><b>Five-star exit</b><p>{entry.fiveStarExit}</p></div>
                    </details>
                  ))}
                </div>
                <footer><span>{item.verifiedCriteria}/{item.requiredCriteria} mandatory criteria verified</span><b>{item.fiveStarQualified ? 'Five-star qualified' : item.blockers ? `${item.blockers} external gate${item.blockers === 1 ? '' : 's'}` : 'Evidence incomplete'}</b></footer>
              </article>
            ))}
          </div>
          {!benchmarkLanes.length && <div className="poietek-vision-empty"><strong>No matching qualification lane</strong><span>Try a system, volume, reference platform, requirement or gate.</span></div>}
        </section>

        <section className="poietek-benchmark-method" aria-labelledby="benchmark-method-heading">
          <div><p>Qualification method</p><h2 id="benchmark-method-heading">No purchased review score. No marketing shortcut.</h2></div>
          <ol>
            <li><strong>Specified · 20 points</strong><span>A controlled requirement and acceptance path exist.</span></li>
            <li><strong>Foundation · 40 points</strong><span>Versioned contracts, validators or safe defaults exist.</span></li>
            <li><strong>Working · 75 points</strong><span>A useful integrated slice works, but full release acceptance is incomplete.</span></li>
            <li><strong>Verified · 100 points</strong><span>Implementation and repeatable acceptance evidence satisfy the criterion.</span></li>
          </ol>
          <p>An external gate contributes zero until the device, provider, legal authority, codec, payment rail or independent test is genuinely connected and evidenced. A lane receives five stars only when every mandatory criterion is verified.</p>
        </section>
      </>}

      <footer className="poietek-ecosystem-footer">
        “Foundation built” means versioned contracts, safe defaults or validation exist. It does not mean an external service, native engine, licensed catalogue, copied commercial content or physical device has been connected.
      </footer>
    </main>
  );
}
