import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {PoietekRuntimeProvider} from './poietek/react/PoietekRuntimeProvider';
import {PoietekRuntimeStatus} from './poietek/react/PoietekRuntimeStatus';
import {PoietekAppShell} from './poietek/react/PoietekAppShell';
import {registerPoietekServiceWorker} from './poietek/pwa/registerServiceWorker';

if (import.meta.env.PROD) {
  void registerPoietekServiceWorker().catch((error) => {
    console.warn('Poietek offline shell could not be registered.', error);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PoietekRuntimeProvider>
      <PoietekAppShell>
        <App />
      </PoietekAppShell>
      <PoietekRuntimeStatus />
    </PoietekRuntimeProvider>
  </StrictMode>,
);
