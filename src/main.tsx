import {lazy, StrictMode, Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import './index.css';
import {PoietekRuntimeProvider} from './poietek/react/PoietekRuntimeProvider';
import {PoietekRuntimeStatus} from './poietek/react/PoietekRuntimeStatus';
import {PoietekAppShell} from './poietek/react/PoietekAppShell';

const RackWorkspace = lazy(() => import('./App.tsx'));

// Native-first optimization: when running under Tauri (native shell), eagerly
// start loading the main workspace and other critical modules to avoid chunk
// fetch latency that harms startup responsiveness. This keeps the existing
// lazy-based code path but preloads modules for native deployments.
try {
  // @ts-ignore - window.__TAURI__ is injected by Tauri at runtime
  if (typeof (window as any).__TAURI__ !== 'undefined') {
    import('./App.tsx');
  }
} catch (e) {
  // ignore; best-effort
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PoietekRuntimeProvider>
      <PoietekAppShell>
        <Suspense fallback={<div className="poietek-shell-loading" role="status">Opening the device rack…</div>}>
          <RackWorkspace />
        </Suspense>
      </PoietekAppShell>
      <PoietekRuntimeStatus />
    </PoietekRuntimeProvider>
  </StrictMode>,
);

