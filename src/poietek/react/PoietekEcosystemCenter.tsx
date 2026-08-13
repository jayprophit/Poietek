import {useMemo, useState} from 'react';
import {
  CORE_ECOSYSTEM_PILLARS,
  SDS_VISION_CATALOG,
  SDS_VISION_CATALOG_VERSION,
  searchVisionCatalog,
  summarizeVisionCatalog,
  type VisionCapabilityStatus,
} from '../vision';
import './PoietekEcosystemCenter.css';

type StatusFilter = 'all' | VisionCapabilityStatus;

const statusLabels: Record<VisionCapabilityStatus, string> = {
  operational: 'Working now',
  foundation: 'Foundation built',
  planned: 'Planned slice',
  blocked_external: 'External gate',
};

export function PoietekEcosystemCenter() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const summary = useMemo(() => summarizeVisionCatalog(), []);
  const areas = useMemo(() => searchVisionCatalog(query).filter((area) => status === 'all' || area.status === status), [query, status]);

  return (
    <main className="poietek-ecosystem" aria-label="Poietek ecosystem architecture">
      <header className="poietek-ecosystem-hero">
        <div>
          <p>Creative operating system · vision catalogue {SDS_VISION_CATALOG_VERSION}</p>
          <h1>One studio. Thirteen connected systems.</h1>
          <span>The SDS vision is tracked here as executable capability, foundation, next slice, and honest release gate.</span>
        </div>
        <div className="poietek-ecosystem-totals" aria-label="Capability totals">
          <strong>{SDS_VISION_CATALOG.length}</strong>
          <span>architecture areas</span>
          <b>{summary.operational} working · {summary.foundation} foundations</b>
        </div>
      </header>

      <section className="poietek-pillar-section" aria-labelledby="ecosystem-pillars-heading">
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
      </section>

      <footer className="poietek-ecosystem-footer">
        “Foundation built” means versioned contracts, safe defaults and validation exist. It does not mean an external service, native engine, licensed catalogue or physical device has been connected.
      </footer>
    </main>
  );
}
