import {useMemo, useState} from 'react';
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
import './PoietekEcosystemCenter.css';

type StatusFilter = 'all' | VisionCapabilityStatus;
type EcosystemView = 'capabilities' | 'library';

const statusLabels: Record<VisionCapabilityStatus, string> = {
  operational: 'Working now',
  foundation: 'Foundation built',
  planned: 'Planned slice',
  blocked_external: 'External gate',
};

export function PoietekEcosystemCenter() {
  const [view, setView] = useState<EcosystemView>('capabilities');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const summary = useMemo(() => summarizeVisionCatalog(), []);
  const areas = useMemo(() => searchVisionCatalog(query).filter((area) => status === 'all' || area.status === status), [query, status]);
  const libraryVolumes = useMemo(() => searchDevelopmentLibrary(query).filter((volume) => status === 'all' || volume.status === status), [query, status]);

  return (
    <main className="poietek-ecosystem" aria-label="Poietek ecosystem architecture">
      <header className="poietek-ecosystem-hero">
        <div>
          <p>Creative operating system · controlled catalogue {SDS_VISION_CATALOG_VERSION}</p>
          <h1>{view === 'library' ? 'The complete development library.' : 'One studio. Thirteen connected systems.'}</h1>
          <span>{view === 'library' ? 'Every attached source volume is cross-walked to working evidence, staged architecture, professional documentation and honest gates.' : 'The SDS vision is tracked here as executable capability, foundation, next slice, and honest release gate.'}</span>
        </div>
        <div className="poietek-ecosystem-totals" aria-label="Capability totals">
          <strong>{view === 'library' ? DEVELOPMENT_LIBRARY_VOLUMES.length : SDS_VISION_CATALOG.length}</strong>
          <span>{view === 'library' ? 'source volumes mapped' : 'architecture areas'}</span>
          <b>{view === 'library' ? '20 core · 51–53 intelligence' : `${summary.operational} working · ${summary.foundation} foundations`}</b>
        </div>
      </header>

      <nav className="poietek-ecosystem-tabs" aria-label="Ecosystem views">
        <button type="button" className={view === 'capabilities' ? 'is-active' : ''} onClick={() => setView('capabilities')}>Capability architecture</button>
        <button type="button" className={view === 'library' ? 'is-active' : ''} onClick={() => setView('library')}>Development library</button>
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

      <footer className="poietek-ecosystem-footer">
        “Foundation built” means versioned contracts, safe defaults or validation exist. It does not mean an external service, native engine, licensed catalogue, copied commercial content or physical device has been connected.
      </footer>
    </main>
  );
}
