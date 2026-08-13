import {useEffect, useRef, useState} from 'react';
import {useOfflineRuntime} from './useOfflineRuntime';
import type {PoietekDeviceRuntimeProfile} from '../deployment';

function formatBytes(value: number | null) {
  if (value == null) return 'Not reported';
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`;
  return `${(value / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

const modeLabels = {
  'web-portal': 'Browser portal',
  'installed-pwa': 'Installed web app',
  'native-desktop': 'Native desktop shell',
  'native-mobile': 'Native mobile shell',
};

const deviceLabels = {desktop: 'Desktop', tablet: 'Tablet', mobile: 'Mobile', other: 'Other device', unknown: 'Unknown device'};
const inputLabels = {'mouse-keyboard': 'mouse + keys', touch: 'touch', hybrid: 'touch + pointer', unknown: 'input unknown'};

export function OfflineInstallCenter({deviceProfile}: {deviceProfile: PoietekDeviceRuntimeProfile}) {
  const runtime = useOfflineRuntime();
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (panel.current && !panel.current.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [open]);

  const readyCount = runtime.deployment.engines.filter((engine) =>
    engine.state === 'available' || engine.state === 'fallback',
  ).length;

  return (
    <div className="poietek-offline-center" ref={panel}>
      <button
        type="button"
        className={`poietek-offline-trigger ${runtime.deployment.online ? 'is-online' : 'is-offline'}`}
        aria-label={`${runtime.deployment.online ? 'Local and online' : 'Local offline'} deployment center`}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
      >
        <i />
        <span>
          <strong>{runtime.deployment.online ? 'Local + online' : 'Local offline'}</strong>
          <small>{deviceLabels[deviceProfile.deviceClass]} · {modeLabels[runtime.deployment.mode]} · {readyCount} engines ready</small>
        </span>
      </button>

      {open && (
        <section className="poietek-offline-panel" role="dialog" aria-label="Installation and engine status">
          <header>
            <div>
              <p>Deployment center</p>
              <h2>{modeLabels[runtime.deployment.mode]}</h2>
            </div>
            <button type="button" aria-label="Close deployment center" onClick={() => setOpen(false)}>×</button>
          </header>

          <div className="poietek-offline-summary">
            <span><i className="is-ready" /> Active device <b>{deviceLabels[deviceProfile.deviceClass]} · {inputLabels[deviceProfile.inputMode]}</b></span>
            <span><i className={runtime.deployment.online ? 'is-ready' : 'is-warn'} /> Network <b>{runtime.deployment.online ? 'available' : 'offline'}</b></span>
            <span><i className={runtime.serviceWorker.state === 'ready' ? 'is-ready' : 'is-warn'} /> Offline shell <b>{runtime.serviceWorker.state.replace('-', ' ')}</b></span>
            <span><i className={runtime.storage.persisted ? 'is-ready' : 'is-warn'} /> Storage <b>{runtime.storage.persisted ? 'persistent' : 'best effort'}</b></span>
          </div>

          <div className="poietek-offline-actions">
            {runtime.installAvailable && (
              <button type="button" onClick={() => void runtime.install()}>Install on this device</button>
            )}
            {runtime.serviceWorker.state === 'update-ready' && (
              <button type="button" onClick={runtime.applyUpdate}>Restart with update</button>
            )}
            {runtime.storage.persisted === false && (
              <button type="button" onClick={() => void runtime.persistStorage()}>Protect local storage</button>
            )}
          </div>

          {runtime.installGuidance && <p className="poietek-install-guidance">{runtime.installGuidance}</p>}
          <p className="poietek-storage-usage">Device storage used: {formatBytes(runtime.storage.usage)} of {formatBytes(runtime.storage.quota)} available to this origin.</p>

          <div className="poietek-engine-list" aria-label="Runtime engines">
            {runtime.deployment.engines.map((engine) => (
              <article key={engine.id} title={engine.evidence}>
                <i className={`is-${engine.state}`} />
                <div>
                  <strong>{engine.label}</strong>
                  <small>{engine.detail}</small>
                </div>
                <span>{engine.state.replace('-', ' ')}</span>
              </article>
            ))}
          </div>

          <footer>
            This is the active {deviceLabels[deviceProfile.deviceClass].toLowerCase()} access point. The same canonical project opens everywhere, while this interface exposes only capabilities detected on this device. Private projects and imported media stay in the project store.
          </footer>
        </section>
      )}
    </div>
  );
}
