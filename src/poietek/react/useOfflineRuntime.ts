import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {probeBrowserDeployment, type PoietekDeploymentSnapshot} from '../deployment';
import {
  activatePoietekUpdate,
  inspectLocalStorage,
  registerPoietekServiceWorker,
  requestPersistentStorage,
  subscribePoietekServiceWorker,
  type PoietekServiceWorkerSnapshot,
  type PoietekStorageSnapshot,
} from '../pwa/registerServiceWorker';

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{outcome: 'accepted' | 'dismissed'; platform: string}>;
}

const initialServiceWorker: PoietekServiceWorkerSnapshot = {
  state: 'unsupported',
  registration: null,
  error: null,
};

const initialStorage: PoietekStorageSnapshot = {persisted: null, usage: null, quota: null};

export interface OfflineRuntimeController {
  deployment: PoietekDeploymentSnapshot;
  serviceWorker: PoietekServiceWorkerSnapshot;
  storage: PoietekStorageSnapshot;
  installAvailable: boolean;
  installGuidance: string | null;
  install(): Promise<boolean>;
  persistStorage(): Promise<boolean>;
  applyUpdate(): boolean;
}

export function useOfflineRuntime(): OfflineRuntimeController {
  const [deployment, setDeployment] = useState(() => probeBrowserDeployment());
  const [serviceWorker, setServiceWorker] = useState(initialServiceWorker);
  const [storage, setStorage] = useState(initialStorage);
  const [installAvailable, setInstallAvailable] = useState(false);
  const installPrompt = useRef<InstallPromptEvent | null>(null);

  useEffect(() => {
    const refresh = () => setDeployment(probeBrowserDeployment());
    window.addEventListener('online', refresh);
    window.addEventListener('offline', refresh);
    window.addEventListener('resize', refresh);
    return () => {
      window.removeEventListener('online', refresh);
      window.removeEventListener('offline', refresh);
      window.removeEventListener('resize', refresh);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = subscribePoietekServiceWorker(setServiceWorker);
    if (import.meta.env.PROD) void registerPoietekServiceWorker();
    void inspectLocalStorage().then(setStorage);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const beforeInstall = (event: Event) => {
      event.preventDefault();
      installPrompt.current = event as InstallPromptEvent;
      setInstallAvailable(true);
    };
    const installed = () => {
      installPrompt.current = null;
      setInstallAvailable(false);
      setDeployment(probeBrowserDeployment());
    };
    window.addEventListener('beforeinstallprompt', beforeInstall);
    window.addEventListener('appinstalled', installed);
    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstall);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);

  const install = useCallback(async () => {
    const prompt = installPrompt.current;
    if (!prompt) return false;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === 'accepted') {
      installPrompt.current = null;
      setInstallAvailable(false);
      return true;
    }
    return false;
  }, []);

  const persistStorage = useCallback(async () => {
    const persisted = await requestPersistentStorage();
    setStorage(await inspectLocalStorage());
    return persisted;
  }, []);

  const applyUpdate = useCallback(() => {
    const applied = activatePoietekUpdate(serviceWorker.registration);
    if (!applied) return false;
    navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), {once: true});
    return true;
  }, [serviceWorker.registration]);

  const installGuidance = useMemo(() => {
    if (deployment.mode !== 'web-portal') return null;
    if (!deployment.secureContext) return 'Installation requires HTTPS or a loopback address.';
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      return 'Use Share, then Add to Home Screen to install this studio.';
    }
    if (!installAvailable) return 'Use your browser’s Install app command when it is offered.';
    return null;
  }, [deployment.mode, deployment.secureContext, installAvailable]);

  return {
    deployment,
    serviceWorker,
    storage,
    installAvailable,
    installGuidance,
    install,
    persistStorage,
    applyUpdate,
  };
}
