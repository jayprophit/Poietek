import type {
  DeploymentProbeInput,
  EngineCapabilityState,
  PoietekDeploymentSnapshot,
  PoietekEngineCapability,
  PoietekEngineId,
} from './contracts';

function capability(
  id: PoietekEngineId,
  label: string,
  state: EngineCapabilityState,
  detail: string,
  evidence: string,
): PoietekEngineCapability {
  return {id, label, state, detail, evidence};
}

export function deriveDeploymentSnapshot(input: DeploymentProbeInput): PoietekDeploymentSnapshot {
  const mode = input.nativeBridge
    ? input.nativeMobile
      ? 'native-mobile'
      : 'native-desktop'
    : input.standalone
      ? 'installed-pwa'
      : 'web-portal';

  const engines: PoietekEngineCapability[] = [
    capability(
      'project-store',
      'Project store',
      input.indexedDb ? 'available' : 'unsupported',
      input.indexedDb ? 'Versioned projects can be stored on this device.' : 'IndexedDB is unavailable.',
      'Browser capability probe: indexedDB',
    ),
    capability(
      'asset-store',
      'Media store',
      input.opfs ? 'available' : input.indexedDb ? 'fallback' : 'unsupported',
      input.opfs
        ? 'Private media can use origin-private file storage.'
        : input.indexedDb
          ? 'Origin-private files are unavailable; IndexedDB fallback will be used.'
          : 'No durable media store is available.',
      input.opfs ? 'Browser capability probe: navigator.storage.getDirectory' : 'Fallback capability probe',
    ),
    capability(
      'audio-playback',
      'Audio engine',
      input.audioContext ? 'not-initialized' : 'unsupported',
      input.audioContext ? 'Available after a user starts playback.' : 'Web Audio is unavailable.',
      'Browser capability probe: AudioContext',
    ),
    capability(
      'offline-render',
      'Render engine',
      input.offlineAudioContext ? 'available' : 'unsupported',
      input.offlineAudioContext ? 'Offline audio rendering is available.' : 'OfflineAudioContext is unavailable.',
      'Browser capability probe: OfflineAudioContext',
    ),
    capability(
      'audio-recording',
      'Recording engine',
      input.mediaRecorder && input.mediaDevices ? 'permission-required' : 'unsupported',
      input.mediaRecorder && input.mediaDevices
        ? 'Available after explicit microphone permission.'
        : 'Required recording APIs are unavailable.',
      'Browser capability probe: MediaRecorder and mediaDevices.getUserMedia',
    ),
    capability(
      'midi',
      'MIDI engine',
      input.midi ? 'permission-required' : 'unsupported',
      input.midi ? 'Available after explicit MIDI permission and device negotiation.' : 'Web MIDI is unavailable.',
      'Browser capability probe: navigator.requestMIDIAccess',
    ),
    capability(
      'graphics',
      'Graphics engine',
      input.graphics === 'none' ? 'unsupported' : input.graphics === 'canvas' ? 'fallback' : 'available',
      input.graphics === 'none'
        ? 'Canvas rendering is unavailable.'
        : input.graphics === 'canvas'
          ? '2D canvas fallback is available.'
          : `${input.graphics.toUpperCase()} acceleration is available.`,
      `Canvas context probe: ${input.graphics}`,
    ),
    capability(
      'workers',
      'Worker engine',
      input.workers ? 'available' : 'unsupported',
      input.workers ? 'Background worker execution is available.' : 'Web Workers are unavailable.',
      'Browser capability probe: Worker',
    ),
    capability(
      'wasm',
      'DSP extension engine',
      input.wasm ? 'available' : 'unsupported',
      input.wasm ? 'WebAssembly modules can run when a validated backend is supplied.' : 'WebAssembly is unavailable.',
      'Browser capability probe: WebAssembly',
    ),
    capability(
      'offline-shell',
      'Offline application shell',
      input.nativeBridge || (input.serviceWorker && input.secureContext) ? 'available' : 'unsupported',
      input.nativeBridge
        ? 'Application assets are bundled with the native shell.'
        : input.serviceWorker && input.secureContext
          ? 'The production shell can be cached after its first successful load.'
          : 'Service workers require a supported secure origin.',
      input.nativeBridge ? 'Tauri bundle probe' : 'Browser capability probe: serviceWorker and secureContext',
    ),
    capability(
      'network',
      'Online services',
      input.online ? 'available' : 'not-initialized',
      input.online ? 'A network is currently reachable.' : 'Offline: local editing remains available.',
      'Browser online event and navigator.onLine',
    ),
    capability(
      'native-bridge',
      'Native bridge',
      input.nativeBridge ? 'available' : 'unsupported',
      input.nativeBridge ? 'Running inside the reviewed native shell.' : 'Browser/PWA mode does not expose native IPC.',
      'Tauri runtime marker probe',
    ),
    capability(
      'native-audio',
      'Native low-latency audio',
      'unsupported',
      'No reviewed native audio adapter is installed; Web Audio remains the active backend.',
      'Adapter registry: no native backend negotiated',
    ),
  ];

  return {
    schemaVersion: 1,
    mode,
    deviceClass: input.deviceClass,
    online: input.online,
    secureContext: input.secureContext,
    installableSurface: !input.nativeBridge && input.serviceWorker && input.secureContext,
    engines,
  };
}
