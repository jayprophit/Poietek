import type {
  NativeDeviceInventorySnapshot,
  NativeStudioDeviceInventory,
} from './contracts';
import {validateNativeStudioDeviceInventory} from './validation';

type NativeInvoke = <T>(command: string, args?: Record<string, unknown>) => Promise<T>;
type SnapshotListener = (snapshot: NativeDeviceInventorySnapshot) => void;

function nativeInvoke(): NativeInvoke | null {
  if (typeof window === 'undefined') return null;
  const candidate = window as Window & {
    __TAURI__?: {core?: {invoke?: NativeInvoke}};
  };
  return candidate.__TAURI__?.core?.invoke ?? null;
}

function initialSnapshot(): NativeDeviceInventorySnapshot {
  const native = nativeInvoke() !== null;
  return {
    status: native ? 'idle' : 'unavailable',
    runtime: native ? 'native' : 'web',
    inventory: null,
    message: native
      ? 'Native device inventory has not run yet.'
      : 'The browser build uses Web Audio and Web MIDI device discovery.',
    lastError: null,
  };
}

class NativeStudioDeviceInventoryService {
  private snapshot = initialSnapshot();
  private readonly listeners = new Set<SnapshotListener>();
  private scanPromise: Promise<NativeDeviceInventorySnapshot> | null = null;
  private watchReferences = 0;
  private pollTimer: number | null = null;
  private focusHandler: (() => void) | null = null;

  getSnapshot = (): NativeDeviceInventorySnapshot => this.snapshot;

  subscribe = (listener: SnapshotListener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private publish(next: NativeDeviceInventorySnapshot): void {
    this.snapshot = next;
    this.listeners.forEach((listener) => listener(next));
  }

  scan = async (): Promise<NativeDeviceInventorySnapshot> => {
    const invoke = nativeInvoke();
    if (!invoke) {
      const unavailable: NativeDeviceInventorySnapshot = {
        status: 'unavailable',
        runtime: 'web',
        inventory: null,
        message: 'Native inventory is unavailable in this browser surface.',
        lastError: null,
      };
      this.publish(unavailable);
      return unavailable;
    }
    if (this.scanPromise) return this.scanPromise;

    this.publish({
      ...this.snapshot,
      status: 'scanning',
      runtime: 'native',
      message: 'Scanning operating-system audio and MIDI endpoints…',
      lastError: null,
    });

    this.scanPromise = (async () => {
      try {
        const candidate = await invoke<unknown>('list_native_studio_devices');
        if (!validateNativeStudioDeviceInventory(candidate)) {
          throw new Error('The native device adapter returned an invalid inventory.');
        }
        const inventory = candidate as NativeStudioDeviceInventory;
        const next: NativeDeviceInventorySnapshot = {
          status: inventory.supported ? 'ready' : 'unavailable',
          runtime: 'native',
          inventory,
          message: inventory.supported
            ? `Detected ${inventory.audioInputs.length} audio input(s), ${inventory.audioOutputs.length} audio output(s), ${inventory.midiInputs.length} MIDI input(s), and ${inventory.midiOutputs.length} MIDI output(s).`
            : inventory.engine.message,
          lastError: null,
        };
        this.publish(next);
        return next;
      } catch (reason) {
        const message = reason instanceof Error ? reason.message : String(reason);
        const next: NativeDeviceInventorySnapshot = {
          ...this.snapshot,
          status: 'error',
          runtime: 'native',
          message: 'The native device scan failed without changing current engine routing.',
          lastError: message,
        };
        this.publish(next);
        return next;
      } finally {
        this.scanPromise = null;
      }
    })();

    return this.scanPromise;
  };

  startWatching = (pollIntervalMs = 5000): (() => void) => {
    if (!nativeInvoke()) return () => undefined;
    this.watchReferences += 1;
    if (this.watchReferences === 1 && typeof window !== 'undefined') {
      void this.scan();
      this.focusHandler = () => void this.scan();
      window.addEventListener('focus', this.focusHandler);
      this.pollTimer = window.setInterval(
        () => void this.scan(),
        Math.max(2000, pollIntervalMs),
      );
    }

    let stopped = false;
    return () => {
      if (stopped) return;
      stopped = true;
      this.watchReferences = Math.max(0, this.watchReferences - 1);
      if (this.watchReferences !== 0 || typeof window === 'undefined') return;
      if (this.focusHandler) window.removeEventListener('focus', this.focusHandler);
      if (this.pollTimer !== null) window.clearInterval(this.pollTimer);
      this.focusHandler = null;
      this.pollTimer = null;
    };
  };
}

export const nativeStudioDeviceInventory =
  new NativeStudioDeviceInventoryService();
