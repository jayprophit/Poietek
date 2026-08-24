export type ProductionWorkflowKind =
  | 'control_room'
  | 'midi_transformer'
  | 'score_workbench'
  | 'technique_matrix'
  | 'spectral_workbench'
  | 'offline_process_chain'
  | 'batch_delivery'
  | 'picture_post'
  | 'sequence_assembly'
  | 'immersive_monitor'
  | 'mastering_delivery'
  | 'live_session_hub'
  | 'remote_session';

export type ProductionWorkflowEngineState =
  | 'control_model'
  | 'native_required'
  | 'external_required';

export interface ProductionWorkflowDefinition {
  kind: ProductionWorkflowKind;
  moduleType: ProductionWorkflowKind;
  discipline: string;
  summary: string;
  engineState: ProductionWorkflowEngineState;
  localCapabilities: readonly string[];
  requiredCapabilities: readonly string[];
  truthNote: string;
}

export interface ProductionAdapterObservation {
  adapterId: string;
  capability: string;
  state: 'available' | 'unavailable';
  observedAt: number;
  evidenceReference?: string;
}

export type ProductionReadinessStatus =
  | 'control_model'
  | 'adapter_required'
  | 'adapter_observed';

export interface ProductionReadinessReport {
  kind: ProductionWorkflowKind;
  status: ProductionReadinessStatus;
  observedCapabilities: readonly string[];
  missingCapabilities: readonly string[];
  claim: string;
}

export type MonitorSource = 'main' | 'cue_a' | 'cue_b' | 'reference';
export type MonitorFormat = 'mono' | 'stereo' | '5.1' | '7.1.4' | 'ambisonic_1oa';

export interface ControlRoomRouteObservation {
  adapterId: string;
  outputDeviceId: string;
  outputChannels: number;
  observedAt: number;
  activeStreamId?: string;
}

export interface ControlRoomState {
  schemaVersion: '1.0.0';
  source: MonitorSource;
  monitorFormat: MonitorFormat;
  cueBusCount: number;
  dimDb: number;
  dimEnabled: boolean;
  monoEnabled: boolean;
  talkbackEnabled: boolean;
  routeObservation?: ControlRoomRouteObservation;
}

export type ControlRoomRouteState =
  | 'not_observed'
  | 'route_observed'
  | 'active_stream_observed';

export interface ControlRoomReport {
  state: ControlRoomRouteState;
  canClaimActiveMonitoring: boolean;
  message: string;
}

export interface MidiNoteMessage {
  type: 'note_on' | 'note_off';
  channel: number;
  note: number;
  velocity: number;
}

export interface MidiTransformRule {
  bypass: boolean;
  transposeSemitones: number;
  velocityScale: number;
  lowNote: number;
  highNote: number;
  outputChannel: number;
}

export type MidiTransformResult =
  | {kind: 'forward'; message: MidiNoteMessage}
  | {kind: 'filtered'; reason: string};

export type OfflineProcessKind =
  | 'gain'
  | 'trim_silence'
  | 'normalize_sample_peak'
  | 'reverse'
  | 'fade'
  | 'dc_offset_repair'
  | 'resample';

export interface OfflineProcessStep {
  id: string;
  kind: OfflineProcessKind;
  enabled: boolean;
  parameters: Readonly<Record<string, number | boolean | string>>;
}

export interface OfflineProcessChain {
  schemaVersion: '1.0.0';
  sourceAssetId: string;
  revision: number;
  previewOnly: true;
  steps: readonly OfflineProcessStep[];
}

export interface OfflineRenderRequest {
  chain: OfflineProcessChain;
  state: 'adapter_required' | 'ready_for_adapter';
  adapterId?: string;
  message: string;
}
