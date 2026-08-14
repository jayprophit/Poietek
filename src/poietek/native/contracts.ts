export type NativeDeviceInventoryStatus =
  | 'idle'
  | 'scanning'
  | 'ready'
  | 'unavailable'
  | 'error';

export type NativeDeviceDirection = 'input' | 'output';

export interface NativeAudioConfigRange {
  channels: number;
  minSampleRate: number;
  maxSampleRate: number;
  minBufferFrames: number | null;
  maxBufferFrames: number | null;
  sampleFormat: string;
}

export interface NativePreferredAudioConfig {
  channels: number;
  sampleRate: number;
  minBufferFrames: number | null;
  maxBufferFrames: number | null;
  sampleFormat: string;
}

export interface NativeAudioDevice {
  id: string;
  name: string;
  host: string;
  direction: NativeDeviceDirection;
  isDefault: boolean;
  capabilityStatus: 'detected' | 'probe_error';
  capabilityMessage: string | null;
  supportedConfigs: NativeAudioConfigRange[];
  preferredConfig: NativePreferredAudioConfig | null;
  selectableByNativeEngine: false;
  latencyStatus: 'not_measured';
  latencyMs: null;
}

export interface NativeMidiPort {
  id: string;
  name: string;
  direction: NativeDeviceDirection;
  capabilityStatus: 'detected' | 'probe_error';
  capabilityMessage: string | null;
  selectableByNativeEngine: false;
}

export interface NativeStudioDeviceInventory {
  schemaVersion: 1;
  platform: string;
  supported: boolean;
  scannedAtEpochMs: number;
  audioHosts: string[];
  audioInputs: NativeAudioDevice[];
  audioOutputs: NativeAudioDevice[];
  midiInputs: NativeMidiPort[];
  midiOutputs: NativeMidiPort[];
  engine: {
    status: 'inventory_only';
    message: string;
  };
  warnings: string[];
}

export interface NativeDeviceInventorySnapshot {
  status: NativeDeviceInventoryStatus;
  runtime: 'native' | 'web';
  inventory: NativeStudioDeviceInventory | null;
  message: string;
  lastError: string | null;
}
