import type {CapabilityReport, ExternalWorkflowStatus} from '../platform';

export const PRODUCTION_ENGINE_SCHEMA_VERSION = '1.0.0' as const;
export const PRODUCTION_ENGINE_EXTENSION_KEY = 'org.poietek.production-engines' as const;

export type DesktopAudioBackend = 'wasapi' | 'asio' | 'coreaudio' | 'alsa' | 'jack' | 'pipewire';
export type RuntimePlatform = 'windows' | 'macos' | 'linux' | 'android' | 'ios' | 'web' | 'unknown';

export interface NativeAudioPort {
  id: string;
  name: string;
  direction: 'input' | 'output';
  backend: DesktopAudioBackend;
  channelCount: number;
  supportedSampleRates: number[];
  supportedBufferFrames: number[];
  isDefault: boolean;
  observedAt: string;
}

export interface AudioRoute {
  id: string;
  sourceBusId: string;
  destinationPortId: string;
  channelMap: Array<{sourceChannel: number; destinationChannel: number}>;
  enabled: boolean;
}

export interface NativeAudioEngineState {
  platform: RuntimePlatform;
  enumerationCapability: CapabilityReport;
  realtimeCapability: CapabilityReport;
  hotSwapCapability: CapabilityReport;
  multiOutputCapability: CapabilityReport;
  ports: NativeAudioPort[];
  selectedInputPortIds: string[];
  selectedOutputPortIds: string[];
  sampleRate: number | null;
  bufferFrames: number | null;
  callback: {
    state: 'stopped' | 'starting' | 'running' | 'recovering' | 'failed';
    implementationId: string | null;
    startedAt: string | null;
    lastCallbackAt: string | null;
    measuredCallbackCount: number;
    dropoutCount: number;
    xrunCount: number;
    lastXrunAt: string | null;
    telemetrySource: 'native_callback' | 'not_measured';
  };
  routes: AudioRoute[];
  renderParity: {
    state: 'not_tested' | 'testing' | 'verified' | 'mismatch' | 'unsupported';
    realtimeDigest: string | null;
    offlineDigest: string | null;
    toleranceDb: number | null;
    testedAt: string | null;
    implementationId: string | null;
  };
}

export type EditOperationKind = 'move' | 'trim' | 'split' | 'slip' | 'ripple' | 'roll' | 'stretch' | 'crossfade' | 'group' | 'ungroup' | 'comp' | 'freeze' | 'commit';

export interface EditCommandRecord {
  id: string;
  projectId: string;
  kind: EditOperationKind;
  targetIds: string[];
  baseRevision: number;
  nextRevision: number;
  parameters: Record<string, string | number | boolean | null>;
  state: 'preview' | 'applied' | 'reverted' | 'rejected';
  undoable: boolean;
  createdAt: string;
  appliedAt: string | null;
  implementationId: string | null;
}

export interface TakeLane {
  id: string;
  trackId: string;
  name: string;
  clipIds: string[];
  muted: boolean;
}

export interface CompSegment {
  id: string;
  trackId: string;
  takeLaneId: string;
  sourceClipId: string;
  startTick: number;
  durationTicks: number;
  crossfadeInTicks: number;
  crossfadeOutTicks: number;
}

export interface AutomationPoint {
  tick: number;
  value: number;
  curve: 'step' | 'linear' | 'bezier';
  tension: number | null;
}

export interface ProfessionalEditState {
  commandCapability: CapabilityReport;
  stretchCapability: CapabilityReport;
  compingCapability: CapabilityReport;
  automationCapability: CapabilityReport;
  interchangeCapability: CapabilityReport;
  selectedObjectIds: string[];
  clipGroupIds: Record<string, string[]>;
  trackFolders: Array<{id: string; name: string; childTrackIds: string[]; routingBusId: string | null}>;
  takeLanes: TakeLane[];
  compSegments: CompSegment[];
  automationLanes: Array<{id: string; targetId: string; parameterId: string; mode: 'read' | 'touch' | 'latch' | 'write' | 'trim'; points: AutomationPoint[]}>;
  commands: EditCommandRecord[];
  interchange: Array<{id: string; format: 'aaf' | 'omf' | 'edl' | 'musicxml' | 'midi' | 'other'; direction: 'import' | 'export'; status: ExternalWorkflowStatus; limitations: string[]}>;
}

export type MidiEventRecord =
  | {tick: number; type: 'note'; channel: number; note: number; velocity: number; durationTicks: number; releaseVelocity: number | null; noteId: number | null}
  | {tick: number; type: 'cc'; channel: number; controller: number; value: number}
  | {tick: number; type: 'pitch_bend'; channel: number; value: number; noteId: number | null}
  | {tick: number; type: 'channel_pressure'; channel: number; value: number}
  | {tick: number; type: 'poly_pressure'; channel: number; note: number; value: number};

export interface MidiClipRecord {
  id: string;
  trackId: string;
  name: string;
  startTick: number;
  durationTicks: number;
  loopStartTick: number;
  loopEndTick: number;
  events: MidiEventRecord[];
}

export interface MidiScoringState {
  clipEditingCapability: CapabilityReport;
  mpeCapability: CapabilityReport;
  clockOutputCapability: CapabilityReport;
  notationCapability: CapabilityReport;
  musicXmlCapability: CapabilityReport;
  pictureScoringCapability: CapabilityReport;
  clips: MidiClipRecord[];
  transformations: Array<{id: string; kind: 'quantize' | 'humanize' | 'transpose' | 'legato' | 'velocity' | 'scale_constrain'; status: 'preview' | 'applied' | 'reverted'; sourceClipIds: string[]; outputClipIds: string[]; undoCommandId: string | null}>;
  clockOutputs: Array<{portId: string; sendClock: boolean; sendStartStop: boolean; sendMtc: boolean; offsetMilliseconds: number; observedAt: string | null}>;
  articulationMaps: Array<{id: string; instrumentId: string; entries: Array<{name: string; triggerKind: 'keyswitch' | 'cc' | 'program_change'; triggerValue: number}>}>;
  scoreDocuments: Array<{id: string; title: string; trackIds: string[]; musicXmlAssetId: string | null; status: 'draft' | 'rendered' | 'imported'; rendererImplementationId: string | null}>;
  pictureCues: Array<{id: string; title: string; targetFrame: number; targetTick: number; toleranceFrames: number; status: 'planned' | 'hit' | 'missed'}>;
}

export type PluginFormat = 'vst3' | 'au' | 'auv3' | 'clap' | 'aax';

export interface PluginDescriptor {
  id: string;
  format: PluginFormat;
  pathReference: string;
  vendor: string;
  name: string;
  version: string | null;
  scanState: 'discovered' | 'scanning' | 'ready' | 'quarantined' | 'missing' | 'incompatible';
  quarantineReason: string | null;
  lastScannedAt: string | null;
  binaryDigest: string | null;
  licenseEvidence: ExternalWorkflowStatus;
}

export interface PluginHostState {
  hostCapability: CapabilityReport;
  scanCapability: CapabilityReport;
  sandboxCapability: CapabilityReport;
  delayCompensationCapability: CapabilityReport;
  formatCapabilities: Record<PluginFormat, CapabilityReport>;
  plugins: PluginDescriptor[];
  instances: Array<{id: string; pluginId: string; trackId: string; bypassed: boolean; latencySamples: number | null; stateDigest: string | null; stateAssetId: string | null; recovery: 'not_needed' | 'state_restored' | 'missing_placeholder' | 'failed'}>;
  scanRuns: Array<{id: string; startedAt: string; endedAt: string | null; discovered: number; ready: number; quarantined: number; crashed: number; implementationId: string | null}>;
}

export interface VideoProxyRecord {
  id: string;
  sourceAssetId: string;
  proxyAssetId: string | null;
  status: 'queued' | 'running' | 'ready' | 'failed' | 'cancelled';
  width: number;
  height: number;
  frameRate: number;
  codec: string;
  implementationId: string | null;
  completedAt: string | null;
}

export interface VideoRenderJob {
  id: string;
  projectId: string;
  status: 'draft' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  sourceRevision: number;
  profileId: string;
  outputAssetId: string | null;
  progress: number | null;
  implementationId: string | null;
  providerReference: string | null;
  startedAt: string | null;
  completedAt: string | null;
  errorCode: string | null;
}

export interface VideoEngineState {
  decodeCapability: CapabilityReport;
  proxyCapability: CapabilityReport;
  framePlaybackCapability: CapabilityReport;
  editCapability: CapabilityReport;
  captionCapability: CapabilityReport;
  multicamCapability: CapabilityReport;
  renderCapability: CapabilityReport;
  codecImplementationId: string | null;
  proxies: VideoProxyRecord[];
  renderJobs: VideoRenderJob[];
  captions: Array<{id: string; language: string; kind: 'subtitles' | 'captions'; cues: Array<{startFrame: number; endFrame: number; text: string}>; validationState: 'not_checked' | 'valid' | 'invalid'}>;
  multicamGroups: Array<{id: string; sourceAssetIds: string[]; syncMethod: 'timecode' | 'waveform' | 'marker' | 'manual'; syncEvidenceId: string | null}>;
}

export interface VfxNodeRecord {
  id: string;
  type: 'source' | 'transform' | 'mask' | 'keyer' | 'tracker' | 'roto' | 'paint' | 'particle' | 'text' | 'color' | 'merge' | 'output' | 'custom';
  name: string;
  parameters: Record<string, string | number | boolean | null>;
  inputs: Array<{socket: string; sourceNodeId: string; sourceSocket: string}>;
  keyframes: Array<{parameterId: string; frame: number; value: number; interpolation: 'hold' | 'linear' | 'bezier'}>;
  implementationId: string | null;
}

export interface VfxColorAnimationState {
  graphCapability: CapabilityReport;
  gpuCapability: CapabilityReport;
  trackingCapability: CapabilityReport;
  rotoKeyCapability: CapabilityReport;
  particleCapability: CapabilityReport;
  colorCapability: CapabilityReport;
  animationCapability: CapabilityReport;
  graphs: Array<{id: string; name: string; width: number; height: number; frameRate: number; nodes: VfxNodeRecord[]; outputNodeId: string | null; renderState: 'draft' | 'ready' | 'rendering' | 'completed' | 'failed'}>;
  colorManagement: {system: 'unmanaged' | 'ocio'; configAssetId: string | null; workingSpace: string | null; displayTransform: string | null; implementationId: string | null};
}

export interface DeliveryCheck {
  id: string;
  kind: 'loudness_bs1770' | 'true_peak_oversampled' | 'caption' | 'codec_container' | 'channel_layout' | 'timecode' | 'color_space' | 'flash_pattern' | 'package';
  state: 'not_measured' | 'running' | 'pass' | 'fail' | 'unavailable';
  implementationId: string | null;
  standard: string | null;
  measuredAt: string | null;
  evidenceAssetId: string | null;
  value: number | string | null;
  message: string;
}

export interface ValidatedDeliveryState {
  qcCapability: CapabilityReport;
  profiles: Array<{id: string; name: string; destination: 'web' | 'broadcast' | 'cinema' | 'archive' | 'music' | 'custom'; container: string; videoCodec: string | null; audioCodec: string; channelLayout: 'mono' | 'stereo' | '5.1' | '7.1' | 'immersive' | 'custom'; requiresLoudness: boolean; requiresTruePeak: boolean; requiresCaptions: boolean; approval: ExternalWorkflowStatus}>;
  checks: DeliveryCheck[];
}

export interface ProductionEngineReadiness {
  schemaVersion: typeof PRODUCTION_ENGINE_SCHEMA_VERSION;
  projectId: string;
  revision: number;
  updatedAt: string;
  nativeAudio: NativeAudioEngineState;
  editing: ProfessionalEditState;
  midiScoring: MidiScoringState;
  plugins: PluginHostState;
  video: VideoEngineState;
  vfx: VfxColorAnimationState;
  delivery: ValidatedDeliveryState;
}
