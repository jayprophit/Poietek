export type PoietekExecutionMode =
  | 'web-portal'
  | 'installed-pwa'
  | 'native-desktop'
  | 'native-mobile';

export type PoietekDeviceClass = 'desktop' | 'tablet' | 'mobile' | 'other' | 'unknown';

export type PoietekDeviceOrientation = 'portrait' | 'landscape' | 'square' | 'unknown';
export type PoietekInputMode = 'mouse-keyboard' | 'touch' | 'hybrid' | 'unknown';
export type PoietekDeviceLayout = 'expanded' | 'compact' | 'handheld';
export type PoietekPrimaryNavigation = 'top' | 'compact' | 'bottom';
export type PoietekRackPresentation = 'full-width' | 'horizontal-scroll';

export interface DeviceRuntimeProbeInput {
  viewportWidth: number;
  viewportHeight: number;
  pixelRatio: number;
  coarsePointer: boolean;
  finePointer: boolean;
  hover: boolean;
  maxTouchPoints: number;
  mobileHint: boolean;
  nativeBridge: boolean;
  standalone: boolean;
}

export interface PoietekDeviceRuntimeProfile {
  schemaVersion: 1;
  deviceClass: PoietekDeviceClass;
  orientation: PoietekDeviceOrientation;
  inputMode: PoietekInputMode;
  layout: PoietekDeviceLayout;
  primaryNavigation: PoietekPrimaryNavigation;
  rackPresentation: PoietekRackPresentation;
  executionSurface: 'browser' | 'installed' | 'native';
  viewport: {width: number; height: number; pixelRatio: number};
  touchTargetPx: 32 | 44;
  showKeyboardShortcuts: boolean;
  reasons: string[];
}

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
