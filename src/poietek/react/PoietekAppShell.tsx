import {lazy, Suspense, useEffect, useState, type ReactNode} from 'react';

const PoietekStudioWorkspace = lazy(async () => {
  const module = await import('./PoietekStudioWorkspace');
  return {default: module.PoietekStudioWorkspace};
});

export function PoietekAppShell({children}: {children: ReactNode}) {
  const [studioOpen, setStudioOpen] = useState(false);

  useEffect(() => {
    if (!studioOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setStudioOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [studioOpen]);

  return (
    <>
      {children}
      <button
        type="button"
        onClick={() => setStudioOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={studioOpen}
        style={{
          position: 'fixed',
          left: 14,
          bottom: 14,
          zIndex: 9998,
          border: '1px solid rgba(245,185,66,.58)',
          borderRadius: 9,
          padding: '9px 12px',
          color: '#ffe4ad',
          background: 'rgba(10,10,14,.94)',
          boxShadow: '0 8px 28px rgba(0,0,0,.4)',
          fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '.08em',
          cursor: 'pointer',
        }}
      >
        PROJECT · REAL AUDIO
      </button>

      {studioOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Poietek project and audio workspace"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 20000,
            display: 'grid',
            gridTemplateRows: 'auto minmax(0, 1fr)',
            color: '#e7efee',
            background: '#080b0d',
          }}
        >
          <div
            style={{
              minHeight: 42,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '7px 12px',
              borderBottom: '1px solid rgba(255,255,255,.12)',
              background: '#0e1417',
              fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
            }}
          >
            <div>
              <strong style={{fontSize: 12}}>POIETEK PRODUCTION WORKSPACE</strong>
              <span style={{marginLeft: 10, color: '#7f9292', fontSize: 10}}>
                Local project · real media · durable edits
              </span>
            </div>
            <button
              type="button"
              onClick={() => setStudioOpen(false)}
              aria-label="Return to the SDS rack"
              style={{
                border: '1px solid rgba(255,255,255,.2)',
                borderRadius: 7,
                padding: '6px 10px',
                color: '#f3d39b',
                background: '#15191b',
                cursor: 'pointer',
              }}
            >
              Return to SDS rack · Esc
            </button>
          </div>
          <div style={{minHeight: 0, overflow: 'auto'}}>
            <Suspense
              fallback={
                <div role="status" style={{padding: 28, color: '#afbfbd'}}>
                  Opening the local production workspace…
                </div>
              }
            >
              <PoietekStudioWorkspace />
            </Suspense>
          </div>
        </div>
      ) : null}
    </>
  );
}
