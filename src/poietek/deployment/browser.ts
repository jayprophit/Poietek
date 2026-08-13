import type {DeploymentProbeInput, PoietekDeviceClass, PoietekDeploymentSnapshot} from './contracts';
import {deriveDeploymentSnapshot} from './derive';

declare global {
  interface Navigator {
    standalone?: boolean;
  }

  interface Window {
    __TAURI_INTERNALS__?: unknown;
  }
}

function detectDeviceClass(): PoietekDeviceClass {
  const width = typeof window === 'undefined' ? 0 : window.innerWidth;
  const coarse = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
  if (width > 0 && width < 680) return 'mobile';
  if (width > 0 && width < 1100 && coarse) return 'tablet';
  if (width > 0) return 'desktop';
  return 'unknown';
}

function detectGraphics(): DeploymentProbeInput['graphics'] {
  if (typeof document === 'undefined') return 'none';
  try {
    const canvas = document.createElement('canvas');
    if (canvas.getContext('webgl2')) return 'webgl2';
    if (canvas.getContext('webgl')) return 'webgl';
    if (canvas.getContext('2d')) return 'canvas';
  } catch {
    // Capability probing is best effort and never elevates an unavailable engine.
  }
  return 'none';
}

export function probeBrowserDeployment(): PoietekDeploymentSnapshot {
  const browser = typeof window !== 'undefined' && typeof navigator !== 'undefined';
  const nativeBridge = browser && '__TAURI_INTERNALS__' in window;
  const standalone = browser && (
    window.matchMedia?.('(display-mode: standalone)').matches === true || navigator.standalone === true
  );
  const userAgent = browser ? navigator.userAgent : '';
  const nativeMobile = nativeBridge && /Android|iPhone|iPad|iPod/i.test(userAgent);

  return deriveDeploymentSnapshot({
    nativeBridge,
    nativeMobile,
    standalone,
    deviceClass: detectDeviceClass(),
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
