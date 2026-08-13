export type PoietekServiceWorkerState =
  | 'unsupported'
  | 'registering'
  | 'ready'
  | 'update-ready'
  | 'error';

export interface PoietekServiceWorkerSnapshot {
  state: PoietekServiceWorkerState;
  registration: ServiceWorkerRegistration | null;
  error: string | null;
}

export interface PoietekStorageSnapshot {
  persisted: boolean | null;
  usage: number | null;
  quota: number | null;
}

type Listener = (snapshot: PoietekServiceWorkerSnapshot) => void;

const listeners = new Set<Listener>();
let registrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;
let current: PoietekServiceWorkerSnapshot = {
  state: 'unsupported',
  registration: null,
  error: null,
};

function publish(next: PoietekServiceWorkerSnapshot) {
  current = next;
  for (const listener of listeners) listener(current);
}

function isNativeShell() {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

function watchRegistration(registration: ServiceWorkerRegistration) {
  const reportWaiting = () => {
    if (registration.waiting) {
      publish({state: 'update-ready', registration, error: null});
    }
  };

  reportWaiting();
  registration.addEventListener('updatefound', () => {
    const installing = registration.installing;
    installing?.addEventListener('statechange', () => {
      if (installing.state === 'installed') {
        publish({
          state: navigator.serviceWorker.controller ? 'update-ready' : 'ready',
          registration,
          error: null,
        });
      }
    });
  });

  window.addEventListener('online', () => void registration.update());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void registration.update();
  });
}

export function subscribePoietekServiceWorker(listener: Listener): () => void {
  listeners.add(listener);
  listener(current);
  return () => {
    listeners.delete(listener);
  };
}

export async function registerPoietekServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (
    typeof navigator === 'undefined' ||
    typeof window === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !window.isSecureContext ||
    isNativeShell()
  ) {
    publish({state: 'unsupported', registration: null, error: null});
    return null;
  }

  if (registrationPromise) return registrationPromise;
  publish({state: 'registering', registration: null, error: null});
  registrationPromise = navigator.serviceWorker
    .register('/poietek-sw.js', {scope: '/', updateViaCache: 'none'})
    .then((registration) => {
      watchRegistration(registration);
      publish({
        state: registration.waiting ? 'update-ready' : 'ready',
        registration,
        error: null,
      });
      return registration;
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      publish({state: 'error', registration: null, error: message});
      registrationPromise = null;
      return null;
    });

  return registrationPromise;
}

export function activatePoietekUpdate(registration: ServiceWorkerRegistration | null): boolean {
  if (!registration?.waiting) return false;
  registration.waiting.postMessage({type: 'POIETEK_ACTIVATE_UPDATE'});
  return true;
}

export async function inspectLocalStorage(): Promise<PoietekStorageSnapshot> {
  if (typeof navigator === 'undefined' || !navigator.storage) {
    return {persisted: null, usage: null, quota: null};
  }
  const [persisted, estimate] = await Promise.all([
    navigator.storage.persisted?.().catch(() => false) ?? Promise.resolve(null),
    navigator.storage.estimate?.().catch((): StorageEstimate => ({})) ?? Promise.resolve<StorageEstimate>({}),
  ]);
  return {
    persisted,
    usage: typeof estimate.usage === 'number' ? estimate.usage : null,
    quota: typeof estimate.quota === 'number' ? estimate.quota : null,
  };
}

export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.storage?.persist) return false;
  return navigator.storage.persist();
}
