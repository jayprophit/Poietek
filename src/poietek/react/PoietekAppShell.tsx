import {lazy, Suspense, useCallback, useEffect, useState, type ReactNode} from 'react';
import './PoietekAppShell.css';
import {OfflineInstallCenter} from './OfflineInstallCenter';
import {StudioMenuBar} from './StudioMenuBar';
import {
  dispatchStudioCommand,
  isStudioCommandAreaReady,
  subscribeStudioCommandAreaReady,
  type StudioArea,
  type StudioCommandDetail,
} from './studioCommands';
import {BrowserStudioSettingsRepository, type StudioPreferences} from '../settings';
import type {StudioSetupTab} from './StudioSetupModal';
import {useDeviceRuntimeProfile} from './useDeviceRuntimeProfile';
import {DeviceOrientationControl} from './DeviceOrientationControl';
import {
  nativeStudioDeviceInventory,
  type NativeDeviceInventorySnapshot,
} from '../native';

const PoietekStudioWorkspace = lazy(async () => {
  const module = await import('./PoietekStudioWorkspace');
  return {default: module.PoietekStudioWorkspace};
});

const PoietekEcosystemCenter = lazy(async () => {
  const module = await import('./PoietekEcosystemCenter');
  return {default: module.PoietekEcosystemCenter};
});

const PoietekAiCenter = lazy(async () => {
  const module = await import('./PoietekAiCenter');
  return {default: module.PoietekAiCenter};
});

const StudioSetupModal = lazy(async () => {
  const module = await import('./StudioSetupModal');
  return {default: module.StudioSetupModal};
});

// Native-first prefetch: when running under the Tauri native shell, eagerly
// import these modules so the renderer has them available immediately. This
// avoids relying on delayed lazy-chunk fetches during startup on desktop/mobile.
try {
  // @ts-ignore
  if (typeof (window as any).__TAURI__ !== 'undefined') {
    import('./PoietekStudioWorkspace');
    import('./PoietekEcosystemCenter');
    import('./PoietekAiCenter');
    import('./StudioSetupModal');
  }
} catch (e) {
  // Best-effort: ignore failures
}

export function PoietekAppShell({children}: {children: ReactNode}) {
  const deviceProfile = useDeviceRuntimeProfile();
  const [area, setArea] = useState<StudioArea>(() => {
    if (typeof location !== 'undefined') {
      const requested = new URLSearchParams(location.search).get('area');
      if (requested === 'rack' || requested === 'arrange' || requested === 'ecosystem' || requested === 'ai') return requested;
    }
    if (typeof sessionStorage === 'undefined') return 'arrange';
    const stored = sessionStorage.getItem('poietek-active-area');
    return stored === 'rack' || stored === 'ecosystem' || stored === 'ai' ? stored : 'arrange';
  });
  const [setupTab, setSetupTab] = useState<StudioSetupTab>('profiles');
  const [setupOpen, setSetupOpen] = useState(false);
  const [pendingCommand, setPendingCommand] = useState<{detail: StudioCommandDetail; area: StudioArea} | null>(null);
  const [nativeDevices, setNativeDevices] = useState<NativeDeviceInventorySnapshot>(() => nativeStudioDeviceInventory.getSnapshot());

  const applyStudioPreferences = useCallback((preferences: StudioPreferences) => {
    document.documentElement.dataset.poietekTheme = preferences.appearance.theme;
    document.documentElement.dataset.poietekDensity = preferences.appearance.density;
    document.documentElement.dataset.poietekReduceMotion = String(preferences.appearance.reduceMotion);
    document.documentElement.style.setProperty('--poietek-ui-scale', String(preferences.appearance.interfaceScalePercent / 100));
    window.dispatchEvent(new CustomEvent<StudioPreferences>('poietek:preferences-applied', {detail: preferences}));
  }, []);

  useEffect(() => {
    applyStudioPreferences(new BrowserStudioSettingsRepository().load().preferences);
  }, [applyStudioPreferences]);

  useEffect(() => {
    const unsubscribe = nativeStudioDeviceInventory.subscribe(setNativeDevices);
    const stopWatching = nativeStudioDeviceInventory.startWatching();
    return () => {
      unsubscribe();
      stopWatching();
    };
  }, []);

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
      if (event.key === 'F9') {
        event.preventDefault();
        setArea('ai');
      }
      if ((event.ctrlKey || event.metaKey) && event.key === ',') {
        event.preventDefault();
        setSetupTab('profiles');
        setSetupOpen(true);
      }
    };
    window.addEventListener('keydown', switchArea);
    return () => window.removeEventListener('keydown', switchArea);
  }, []);

  useEffect(() => {
    if (!pendingCommand || pendingCommand.area !== area) return;
    const deliver = () => {
      dispatchStudioCommand(pendingCommand.detail);
      setPendingCommand(null);
    };
    if (isStudioCommandAreaReady(area)) {
      deliver();
      return;
    }
    return subscribeStudioCommandAreaReady((readyArea) => {
      if (readyArea === area) deliver();
    });
  }, [area, pendingCommand]);

  const runCommand = useCallback((detail: StudioCommandDetail, targetArea?: StudioArea) => {
    if (targetArea && targetArea !== area) {
      setPendingCommand({detail, area: targetArea});
      setArea(targetArea);
      return;
    }
    dispatchStudioCommand(detail);
  }, [area]);

  const openSetup = useCallback((tab: StudioSetupTab) => {
    setSetupTab(tab);
    setSetupOpen(true);
  }, []);

  useEffect(() => {
    const handleStudioShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable || target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return;
      const commandKey = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();
      let detail: StudioCommandDetail | null = null;
      let targetArea: StudioArea | undefined;

      if (commandKey && key === 'n') { detail = {id: 'project-new'}; targetArea = 'arrange'; }
      else if (commandKey && key === 'o') { detail = {id: 'project-open'}; targetArea = 'arrange'; }
      else if (commandKey && key === 's') { detail = {id: 'project-save'}; targetArea = 'arrange'; }
      else if (commandKey && key === 'i') { detail = {id: 'audio-import'}; targetArea = 'arrange'; }
      else if (commandKey && key === 'e') { detail = {id: 'audio-export-wav'}; targetArea = 'arrange'; }
      else if (commandKey && key === 'z') {
        detail = {id: event.shiftKey ? 'edit-redo' : 'edit-undo'};
        targetArea = area === 'rack' ? 'rack' : 'arrange';
      } else if (!commandKey && event.code === 'Space') {
        detail = {id: 'transport-play-toggle'};
        targetArea = area === 'rack' ? 'rack' : 'arrange';
      } else if (!commandKey && key === 'r') {
        detail = {id: 'transport-record-toggle'};
        targetArea = 'arrange';
      }

      if (!detail) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      runCommand(detail, targetArea);
    };
    window.addEventListener('keydown', handleStudioShortcut, {capture: true});
    return () => window.removeEventListener('keydown', handleStudioShortcut, {capture: true});
  }, [area, runCommand]);

  return (
    <div
      className="poietek-app-shell"
      data-device-class={deviceProfile.deviceClass}
      data-device-layout={deviceProfile.layout}
      data-input-mode={deviceProfile.inputMode}
      data-orientation={deviceProfile.orientation}
    >
      <StudioMenuBar
        activeArea={area}
        onAreaChange={setArea}
        onCommand={runCommand}
        onOpenSetup={openSetup}
      />
      <header className="poietek-command-bar">
        <div className="poietek-command-brand">
          <span aria-hidden="true">P</span>
          <div>
            <strong>POIETEK STUDIO</strong>
            <small>{deviceProfile.deviceClass} · {deviceProfile.inputMode}</small>
          </div>
        </div>
        <nav aria-label="Primary studio areas">
          <button type="button" className={area === 'arrange' ? 'is-active' : ''} onClick={() => setArea('arrange')}>
            <span aria-hidden={!deviceProfile.showKeyboardShortcuts}>F7</span>
            <strong>Arrange</strong>
            <small>timeline · mix · inspect</small>
          </button>
          <button type="button" className={area === 'rack' ? 'is-active' : ''} onClick={() => setArea('rack')}>
            <span aria-hidden={!deviceProfile.showKeyboardShortcuts}>F6</span>
            <strong>Rack</strong>
            <small>devices · patching · sampling</small>
          </button>
          <button type="button" className={area === 'ecosystem' ? 'is-active' : ''} onClick={() => {
            sessionStorage.setItem('poietek-ecosystem-view', 'community');
            window.dispatchEvent(new CustomEvent('poietek:ecosystem-view', {detail: 'community'}));
            setArea('ecosystem');
          }}>
            <span aria-hidden={!deviceProfile.showKeyboardShortcuts}>●</span>
            <strong>Community</strong>
            <small>share · profile · marketplace</small>
          </button>
          <button type="button" className={area === 'ai' ? 'is-active' : ''} onClick={() => setArea('ai')}>
            <span aria-hidden={!deviceProfile.showKeyboardShortcuts}>F9</span>
            <strong>AI</strong>
            <small>chat · prompts · notes</small>
          </button>
        </nav>
        <div className="poietek-command-utilities">
          <DeviceOrientationControl deviceProfile={deviceProfile} />
          {nativeDevices.runtime === 'native' && <button type="button" className={`poietek-native-device-status is-${nativeDevices.status}`} onClick={() => openSetup('devices')} title="Open native device inventory">
            <span aria-hidden="true">●</span>
            <strong>{nativeDevices.status === 'ready' && nativeDevices.inventory ? `${nativeDevices.inventory.audioInputs.length + nativeDevices.inventory.audioOutputs.length} audio · ${nativeDevices.inventory.midiInputs.length + nativeDevices.inventory.midiOutputs.length} MIDI` : nativeDevices.status === 'scanning' ? 'Scanning devices…' : nativeDevices.status === 'error' ? 'Device scan error' : 'Desktop devices'}</strong>
            <small>{nativeDevices.status === 'ready' ? 'detected · inventory only' : 'open Studio Setup'}</small>
          </button>}
          <OfflineInstallCenter deviceProfile={deviceProfile} />
        </div>
      </header>

      <div className="poietek-shell-stage">
        {area === 'rack' ? (
          <div className="poietek-rack-host">
            <p className="poietek-rack-mobile-note">Rack auto-fit is active. Rotate or swipe to inspect every device without losing desktop controls.</p>
            {children}
          </div>
        ) : area === 'ecosystem' ? (
          <div className="poietek-ecosystem-host">
            <Suspense fallback={<div className="poietek-shell-loading" role="status">Opening the creative operating system…</div>}>
              <PoietekEcosystemCenter />
            </Suspense>
          </div>
        ) : area === 'ai' ? (
          <div className="poietek-ai-host">
            <Suspense fallback={<div className="poietek-shell-loading" role="status">Opening the independent studio brain…</div>}>
              <PoietekAiCenter />
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

      {setupOpen && (
        <Suspense fallback={<div className="poietek-setup-loading" role="status">Opening Studio Setup…</div>}>
          <StudioSetupModal
            isOpen
            initialTab={setupTab}
            onClose={() => setSetupOpen(false)}
            onApplied={applyStudioPreferences}
          />
        </Suspense>
      )}
    </div>
  );
}
