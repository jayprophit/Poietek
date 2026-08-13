import {lazy, StrictMode, Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import './index.css';
import {PoietekRuntimeProvider} from './poietek/react/PoietekRuntimeProvider';
import {PoietekRuntimeStatus} from './poietek/react/PoietekRuntimeStatus';
import {PoietekAppShell} from './poietek/react/PoietekAppShell';

const RackWorkspace = lazy(() => import('./App.tsx'));

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
