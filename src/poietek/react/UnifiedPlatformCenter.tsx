import {
  COMPLIANCE_BASELINE_CATALOG,
  COMMUNITY_MODE_CATALOG,
  GOVERNANCE_POLICY_CATALOG,
  HELP_FAQ_CATALOG,
  MARKETPLACE_CATEGORIES,
  POIETEK_TV_CATALOG,
  UNIFIED_CREATOR_STAGES,
  type DeliveryState,
} from '../unified';
import './UnifiedPlatformCenter.css';
import {ProductionEngineConsole} from './ProductionEngineConsole';

const stateLabel: Record<DeliveryState, string> = {
  working_model: 'Working model',
  foundation: 'Foundation',
  planned: 'Planned',
  external_gate: 'External gate',
};

function CapabilityCards({items}: {items: typeof UNIFIED_CREATOR_STAGES}) {
  return <div className="unified-card-grid">{items.map((item) => (
    <article key={item.id} className={`unified-card is-${item.state}`}>
      <header><h3>{item.title}</h3><small>{stateLabel[item.state]}</small></header>
      <p>{item.summary}</p>
      <footer><b>Production exit</b><span>{item.exit}</span></footer>
    </article>
  ))}</div>;
}

export function UnifiedPlatformCenter({mode}: {mode: 'creator' | 'governance'}) {
  if (mode === 'creator') return <>
    <section className="unified-boundary" aria-labelledby="creator-ownership-heading">
      <div><p>Creator ownership firewall</p><h2 id="creator-ownership-heading">Your project is not Poietek property.</h2></div>
      <p>Poietek is designed to own its software, brand and service intellectual property—not the music, films, broadcasts or products that users create. Service permission is separately versioned, non-exclusive and purpose-limited. No acceptance or rights clearance is fabricated.</p>
      <dl><div><dt>User works</dt><dd>Creator or agreed rightsholders</dd></div><div><dt>Automatic transfer</dt><dd>Forbidden</dd></div><div><dt>Service licence</dt><dd>Draft · not accepted</dd></div><div><dt>Commission</dt><dd>Not decided</dd></div></dl>
    </section>

    <ProductionEngineConsole />

    <section className="unified-section" aria-labelledby="unified-project-heading">
      <div className="unified-heading"><div><p>One canonical project</p><h2 id="unified-project-heading">Score → sound → picture → programme → audience</h2></div><span>One project ID · one revision history · one rights record</span></div>
      <CapabilityCards items={UNIFIED_CREATOR_STAGES} />
    </section>

    <section className="unified-section" aria-labelledby="poietek-tv-heading">
      <div className="unified-heading"><div><p>Poietek TV</p><h2 id="poietek-tv-heading">Create, programme and watch together</h2></div><span>Live claims require observed provider evidence</span></div>
      <CapabilityCards items={POIETEK_TV_CATALOG} />
    </section>

    <section className="unified-two-column">
      <div className="unified-section"><div className="unified-heading"><div><p>Community topology</p><h2>Private, hosted and decentralized</h2></div></div><CapabilityCards items={COMMUNITY_MODE_CATALOG} /></div>
      <div className="unified-section"><div className="unified-heading"><div><p>Creator marketplace</p><h2>Company and community catalogue</h2></div><span>Checkout remains off</span></div><div className="unified-category-cloud">{MARKETPLACE_CATEGORIES.map((item) => <span key={item.id}>{item.label}</span>)}</div><aside className="unified-callout"><strong>Publication is fail-closed</strong><p>A listing cannot become public without seller verification, durable licence terms and provider acknowledgement. Payments, consumer remedies, tax reporting and payouts still require real services and review.</p></aside></div>
    </section>
  </>;

  return <>
    <section className="unified-legal-warning" role="note">
      <strong>Governance drafting workspace—not effective legal terms</strong>
      <p>These policy records, FAQs and compliance controls are a product architecture pack. They require the company’s legal identity, jurisdiction decisions, service providers, operational procedures and qualified legal approval before public use.</p>
    </section>

    <section className="unified-section" aria-labelledby="policy-register-heading">
      <div className="unified-heading"><div><p>Controlled policy register</p><h2 id="policy-register-heading">Nineteen documents, all honestly draft</h2></div><span>No acceptance recorded</span></div>
      <div className="unified-policy-grid">{GOVERNANCE_POLICY_CATALOG.map((policy) => <article key={policy.kind}><span>{policy.title}</span><p>{policy.purpose}</p><small>Legal review required</small></article>)}</div>
    </section>

    <section className="unified-section" aria-labelledby="faq-heading">
      <div className="unified-heading"><div><p>Help centre</p><h2 id="faq-heading">Ownership, AI, TV, community and selling</h2></div></div>
      <div className="unified-faq">{HELP_FAQ_CATALOG.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div>
    </section>

    <section className="unified-section" aria-labelledby="compliance-heading">
      <div className="unified-heading"><div><p>Public-launch controls</p><h2 id="compliance-heading">Compliance evidence matrix</h2></div><span>Official sources · jurisdiction review still required</span></div>
      <div className="unified-compliance">{COMPLIANCE_BASELINE_CATALOG.map((item) => <article key={item.area}><div><h3>{item.area}</h3><small>{stateLabel[item.status]}</small></div><p>{item.control}</p><a href={item.url} target="_blank" rel="noreferrer">Official source ↗</a></article>)}</div>
    </section>
  </>;
}
