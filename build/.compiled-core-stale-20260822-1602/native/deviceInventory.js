"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nativeStudioDeviceInventory = void 0;
const validation_1 = require("./validation");
function nativeInvoke() {
    if (typeof window === 'undefined')
        return null;
    const candidate = window;
    return candidate.__TAURI__?.core?.invoke ?? null;
}
function initialSnapshot() {
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
    snapshot = initialSnapshot();
    listeners = new Set();
    scanPromise = null;
    watchReferences = 0;
    pollTimer = null;
    focusHandler = null;
    getSnapshot = () => this.snapshot;
    subscribe = (listener) => {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    };
    publish(next) {
        this.snapshot = next;
        this.listeners.forEach((listener) => listener(next));
    }
    scan = async () => {
        const invoke = nativeInvoke();
        if (!invoke) {
            const unavailable = {
                status: 'unavailable',
                runtime: 'web',
                inventory: null,
                message: 'Native inventory is unavailable in this browser surface.',
                lastError: null,
            };
            this.publish(unavailable);
            return unavailable;
        }
        if (this.scanPromise)
            return this.scanPromise;
        this.publish({
            ...this.snapshot,
            status: 'scanning',
            runtime: 'native',
            message: 'Scanning operating-system audio and MIDI endpoints…',
            lastError: null,
        });
        this.scanPromise = (async () => {
            try {
                const candidate = await invoke('list_native_studio_devices');
                if (!(0, validation_1.validateNativeStudioDeviceInventory)(candidate)) {
                    throw new Error('The native device adapter returned an invalid inventory.');
                }
                const inventory = candidate;
                const next = {
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
            }
            catch (reason) {
                const message = reason instanceof Error ? reason.message : String(reason);
                const next = {
                    ...this.snapshot,
                    status: 'error',
                    runtime: 'native',
                    message: 'The native device scan failed without changing current engine routing.',
                    lastError: message,
                };
                this.publish(next);
                return next;
            }
            finally {
                this.scanPromise = null;
            }
        })();
        return this.scanPromise;
    };
    startWatching = (pollIntervalMs = 5000) => {
        if (!nativeInvoke())
            return () => undefined;
        this.watchReferences += 1;
        if (this.watchReferences === 1 && typeof window !== 'undefined') {
            void this.scan();
            this.focusHandler = () => void this.scan();
            window.addEventListener('focus', this.focusHandler);
            this.pollTimer = window.setInterval(() => void this.scan(), Math.max(2000, pollIntervalMs));
        }
        let stopped = false;
        return () => {
            if (stopped)
                return;
            stopped = true;
            this.watchReferences = Math.max(0, this.watchReferences - 1);
            if (this.watchReferences !== 0 || typeof window === 'undefined')
                return;
            if (this.focusHandler)
                window.removeEventListener('focus', this.focusHandler);
            if (this.pollTimer !== null)
                window.clearInterval(this.pollTimer);
            this.focusHandler = null;
            this.pollTimer = null;
        };
    };
}
exports.nativeStudioDeviceInventory = new NativeStudioDeviceInventoryService();
