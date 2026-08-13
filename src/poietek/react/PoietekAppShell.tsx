import {lazy, Suspense, useEffect, useState, type ReactNode} from 'react';
import './PoietekAppShell.css';
import {OfflineInstallCenter} from './OfflineInstallCenter';

const PoietekStudioWorkspace = lazy(async () => {
  const module = await import('./PoietekStudioWorkspace');
  return {default: module.PoietekStudioWorkspace};
});

const PoietekEcosystemCenter = lazy(async () => {
  const module = await import('./PoietekEcosystemCenter');
  return {default: module.PoietekEcosystemCenter};
});

type StudioArea = 'arrange' | 'rack' | 'ecosystem';

export function PoietekAppShell({children}: {children: ReactNode}) {
  const [area, setArea] = useState<StudioArea>(() => {
    if (typeof location !== 'undefined') {
      const requested = new URLSearchParams(location.search).get('area');
      if (requested === 'rack' || requested === 'arrange' || requested === 'ecosystem') return requested;
    }
    if (typeof sessionStorage === 'undefined') return 'arrange';
    const stored = sessionStorage.getItem('poietek-active-area');
    return stored === 'rack' || stored === 'ecosystem' ? stored : 'arrange';
  });

  useEffect(() => {
    sessionStorage.setItem('poietek-active-area', area);
  }, [area]);

  useEffect(() => {
    const switchArea = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key === 'F6') {
        event.preventDefault();
        setArea('rack');
      }
      if (event.key === 'F7') {
        event.preventDefault();
        setArea('arrange');
      }
      if (event.key === 'F8') {
        event.preventDefault();
        setArea('ecosystem');
      }
    };
    window.addEventListener('keydown', switchArea);
    return () => window.removeEventListener('keydown', switchArea);
  }, []);

  return (
    <div className="poietek-app-shell">
      <header className="poietek-command-bar">
        <div className="poietek-command-brand">
          <span aria-hidden="true">P</span>
          <div>
            <strong>POIETEK STUDIO</strong>
            <small>local production system</small>
          </div>
        </div>
        <nav aria-label="Primary studio areas">
          <button type="button" className={area === 'arrange' ? 'is-active' : ''} onClick={() => setArea('arrange')}>
            <span>F7</span>
            <strong>Arrange</strong>
            <small>timeline · mix · inspect</small>
          </button>
          <button type="button" className={area === 'rack' ? 'is-active' : ''} onClick={() => setArea('rack')}>
            <span>F6</span>
            <strong>Rack</strong>
            <small>devices · patching · sampling</small>
          </button>
          <button type="button" className={area === 'ecosystem' ? 'is-active' : ''} onClick={() => setArea('ecosystem')}>
            <span>F8</span>
            <strong>Ecosystem</strong>
            <small>vision · systems · roadmap</small>
          </button>
        </nav>
        <OfflineInstallCenter />
      </header>

      <div className="poietek-shell-stage">
        {area === 'rack' ? (
          <div className="poietek-rack-host">
            <p className="poietek-rack-mobile-note">Rack view is widest in landscape. Swipe sideways to reach every device.</p>
            {children}
          </div>
        ) : area === 'ecosystem' ? (
          <div className="poietek-ecosystem-host">
            <Suspense fallback={<div className="poietek-shell-loading" role="status">Opening the creative operating system…</div>}>
              <PoietekEcosystemCenter />
            </Suspense>
          </div>
        ) : (
          <div className="poietek-arrange-host">
            <Suspense fallback={<div className="poietek-shell-loading" role="status">Opening the local production workspace…</div>}>
              <PoietekStudioWorkspace />
            </Suspense>
          </div>
        )}
      </div>
    </div>
  );
}
