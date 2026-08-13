export type PoietekExecutionMode =
  | 'web-portal'
  | 'installed-pwa'
  | 'native-desktop'
  | 'native-mobile';

export type PoietekDeviceClass = 'desktop' | 'tablet' | 'mobile' | 'unknown';

export type EngineCapabilityState =
  | 'available'
  | 'fallback'
  | 'permission-required'
  | 'not-initialized'
  | 'unsupported';

export type PoietekEngineId =
  | 'project-store'
  | 'asset-store'
  | 'audio-playback'
  | 'offline-render'
  | 'audio-recording'
  | 'midi'
  | 'graphics'
  | 'workers'
  | 'wasm'
  | 'offline-shell'
  | 'network'
  | 'native-bridge'
  | 'native-audio';

export interface PoietekEngineCapability {
  id: PoietekEngineId;
  label: string;
  state: EngineCapabilityState;
  detail: string;
  evidence: string;
}

export interface DeploymentProbeInput {
  nativeBridge: boolean;
  nativeMobile: boolean;
  standalone: boolean;
  deviceClass: PoietekDeviceClass;
  online: boolean;
  secureContext: boolean;
  indexedDb: boolean;
  opfs: boolean;
  audioContext: boolean;
  offlineAudioContext: boolean;
  mediaRecorder: boolean;
  mediaDevices: boolean;
  midi: boolean;
  graphics: 'webgl2' | 'webgl' | 'canvas' | 'none';
  workers: boolean;
  wasm: boolean;
  serviceWorker: boolean;
}

export interface PoietekDeploymentSnapshot {
  schemaVersion: 1;
  mode: PoietekExecutionMode;
  deviceClass: PoietekDeviceClass;
  online: boolean;
  secureContext: boolean;
  installableSurface: boolean;
  engines: PoietekEngineCapability[];
}
