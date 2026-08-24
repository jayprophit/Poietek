"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.probeBrowserDeviceProfile = probeBrowserDeviceProfile;
exports.probeBrowserDeployment = probeBrowserDeployment;
const deviceProfile_1 = require("./deviceProfile");
const derive_1 = require("./derive");
function matchesMedia(query) {
    return typeof window !== 'undefined' && window.matchMedia?.(query).matches === true;
}
function probeBrowserDeviceProfile() {
    const browser = typeof window !== 'undefined' && typeof navigator !== 'undefined';
    const viewportWidth = browser ? window.visualViewport?.width ?? window.innerWidth : 0;
    const viewportHeight = browser ? window.visualViewport?.height ?? window.innerHeight : 0;
    const userAgent = browser ? navigator.userAgent : '';
    return (0, deviceProfile_1.deriveDeviceRuntimeProfile)({
        viewportWidth,
        viewportHeight,
        pixelRatio: browser ? window.devicePixelRatio : 1,
        coarsePointer: matchesMedia('(pointer: coarse)'),
        finePointer: matchesMedia('(pointer: fine)'),
        hover: matchesMedia('(hover: hover)'),
        maxTouchPoints: browser ? navigator.maxTouchPoints || 0 : 0,
        mobileHint: browser && (navigator.userAgentData?.mobile === true || /Android|iPhone|iPod/i.test(userAgent)),
        nativeBridge: browser && '__TAURI_INTERNALS__' in window,
        standalone: browser && (matchesMedia('(display-mode: standalone)') || navigator.standalone === true),
    });
}
function detectGraphics() {
    if (typeof document === 'undefined')
        return 'none';
    try {
        const canvas = document.createElement('canvas');
        if (canvas.getContext('webgl2'))
            return 'webgl2';
        if (canvas.getContext('webgl'))
            return 'webgl';
        if (canvas.getContext('2d'))
            return 'canvas';
    }
    catch {
        // Capability probing is best effort and never elevates an unavailable engine.
    }
    return 'none';
}
function probeBrowserDeployment() {
    const browser = typeof window !== 'undefined' && typeof navigator !== 'undefined';
    const nativeBridge = browser && '__TAURI_INTERNALS__' in window;
    const standalone = browser && (window.matchMedia?.('(display-mode: standalone)').matches === true || navigator.standalone === true);
    const userAgent = browser ? navigator.userAgent : '';
    const nativeMobile = nativeBridge && /Android|iPhone|iPad|iPod/i.test(userAgent);
    return (0, derive_1.deriveDeploymentSnapshot)({
        nativeBridge,
        nativeMobile,
        standalone,
        deviceClass: probeBrowserDeviceProfile().deviceClass,
        online: browser ? navigator.onLine : false,
        secureContext: browser ? window.isSecureContext : false,
        indexedDb: typeof indexedDB !== 'undefined',
        opfs: browser && typeof navigator.storage?.getDirectory === 'function',
        audioContext: browser && ('AudioContext' in window || 'webkitAudioContext' in window),
        offlineAudioContext: browser && 'OfflineAudioContext' in window,
        mediaRecorder: typeof MediaRecorder !== 'undefined',
        mediaDevices: browser && typeof navigator.mediaDevices?.getUserMedia === 'function',
        midi: browser && typeof navigator.requestMIDIAccess === 'function',
        graphics: detectGraphics(),
        workers: typeof Worker !== 'undefined',
        wasm: typeof WebAssembly !== 'undefined',
        serviceWorker: browser && 'serviceWorker' in navigator,
    });
}
