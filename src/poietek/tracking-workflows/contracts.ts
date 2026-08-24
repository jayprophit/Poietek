export const TRACKING_CONSOLE_EXTENSION_KEY = 'org.poietek.tracking-console' as const;
export const TRACKING_CONSOLE_SCHEMA_VERSION = '1.0.0' as const;

export type TrackingSourceKind =
  | 'microphone'
  | 'line'
  | 'instrument'
  | 'digital'
  | 'usb_left'
  | 'usb_right'
  | 'virtual'
  | 'other';

export type InputSwitchIntent = 'unchanged' | 'off' | 'on';
export type InputPolarityIntent = 'unchanged' | 'normal' | 'invert';
export type InputImpedanceIntent = 'unchanged' | 'low' | 'high';

/** Requested input controls. These values are never evidence that hardware changed. */
export interface TrackingInputControlIntent {
  gainDb: number | null;
  phantomPower: InputSwitchIntent;
  highPass: InputSwitchIntent;
  polarity: InputPolarityIntent;
  impedance: InputImpedanceIntent;
}

export interface TrackingSource {
  id: string;
  name: string;
  kind: TrackingSourceKind;
  inputChannel: number | null;
  endpointId: string | null;
  inputControls: TrackingInputControlIntent;
}

export type TrackingStageKind =
  | 'preamp'
  | 'filter'
  | 'dynamics'
  | 'tone'
  | 'pedal'
  | 'external_insert'
  | 'utility';

export type TrackingStagePlacement = 'monitor' | 'record' | 'cue';
export type TrackingStageExecution = 'native_cpu' | 'device_dsp' | 'external_hardware';

export interface TrackingStage {
  id: string;
  name: string;
  kind: TrackingStageKind;
  placement: TrackingStagePlacement;
  execution: TrackingStageExecution;
  enabled: boolean;
  processorRef: string | null;
  sendEndpointId: string | null;
  returnEndpointId: string | null;
}

export interface TrackingCueBus {
  id: string;
  name: string;
  outputEndpointId: string | null;
  talkbackIntent: boolean;
}

export interface TrackingCueSend {
  cueId: string;
  levelDb: number;
  pan: number;
  preFader: boolean;
}

export type TrackingCaptureIntent = 'safe' | 'armed';
export type TrackingRecordMode = 'clean' | 'processed';

export interface TrackingRoute {
  id: string;
  name: string;
  sourceId: string;
  targetTrackId: string;
  captureIntent: TrackingCaptureIntent;
  monitorIntent: boolean;
  recordMode: TrackingRecordMode;
  monitorStageIds: readonly string[];
  recordStageIds: readonly string[];
  cueStageIds: readonly string[];
  cueSends: readonly TrackingCueSend[];
}

/** Adapter-supplied observations. Saved plans cannot manufacture these values. */
export interface TrackingRuntimeObservation {
  id: string;
  adapterId: string;
  deviceId: string;
  observedAt: number;
  availableInputChannels: readonly number[];
  availableOutputChannels: readonly number[];
  controllableSourceIds: readonly string[];
  activeCaptureRouteIds: readonly string[];
  activeMonitorRouteIds: readonly string[];
  executedStageIds: readonly string[];
  measuredRoundTripMs: number | null;
  evidenceReference?: string;
}

export interface TrackingConsoleConfiguration {
  sources: readonly TrackingSource[];
  stages: readonly TrackingStage[];
  cueBuses: readonly TrackingCueBus[];
  routes: readonly TrackingRoute[];
}

export interface TrackingSnapshot {
  id: string;
  name: string;
  capturedAt: string;
  configuration: TrackingConsoleConfiguration;
  excludedRuntimeFields: readonly ['runtimeObservations'];
}

export interface TrackingConsoleState extends TrackingConsoleConfiguration {
  schemaVersion: typeof TRACKING_CONSOLE_SCHEMA_VERSION;
  projectId: string;
  revision: number;
  snapshots: readonly TrackingSnapshot[];
  runtimeObservations: readonly TrackingRuntimeObservation[];
}

export interface TrackingRoutePlan {
  routeId: string;
  sourceId: string;
  targetTrackId: string;
  captureIntent: TrackingCaptureIntent;
  monitorIntent: boolean;
  recordMode: TrackingRecordMode;
  monitorStageIds: readonly string[];
  recordStageIds: readonly string[];
  cueStageIds: readonly string[];
  cueSends: readonly TrackingCueSend[];
  requirements: readonly string[];
  claim: string;
}

export type TrackingReadinessState =
  | 'not_requested'
  | 'adapter_required'
  | 'route_observed'
  | 'active_stream_observed'
  | 'processing_observed'
  | 'measured';

export interface TrackingRouteReadiness {
  routeId: string;
  capture: TrackingReadinessState;
  monitoring: TrackingReadinessState;
  recordProcessing: TrackingReadinessState;
  inputControl: TrackingReadinessState;
  latency: TrackingReadinessState;
  measuredRoundTripMs: number | null;
  canClaimActiveCapture: boolean;
  canClaimActiveMonitoring: boolean;
  canClaimProcessedRecording: boolean;
  message: string;
}

export interface TrackingSnapshotDiff {
  snapshotId: string;
  changedSourceIds: readonly string[];
  changedStageIds: readonly string[];
  changedCueBusIds: readonly string[];
  changedRouteIds: readonly string[];
  hasChanges: boolean;
  claim: string;
}

export interface TrackingConsoleReadiness {
  projectModel: 'ready';
  cleanRecordPlanning: 'ready';
  processedRecordPlanning: 'ready';
  cuePlanning: 'ready';
  snapshotRecall: 'ready';
  activeCapture: 'adapter_required';
  activeMonitoring: 'adapter_required';
  processorExecution: 'adapter_required';
  hardwareControl: 'adapter_required';
  latencyMeasurement: 'adapter_required';
}
