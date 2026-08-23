export const MODULATION_WORKFLOW_SCHEMA_VERSION = '1.0.0' as const;
export const MODULATION_WORKFLOW_EXTENSION_KEY = 'org.poietek.motion-matrix' as const;

export type ModulationRange = 'unipolar' | 'bipolar';
export type LfoShape = 'sine' | 'triangle' | 'saw' | 'square';

interface ModulationSourceBase {
  id: string;
  name: string;
  enabled: boolean;
  range: ModulationRange;
  phaseOffset: number;
}

export interface MacroModulationSource extends ModulationSourceBase {
  kind: 'macro';
  value: number;
}

export interface LfoModulationSource extends ModulationSourceBase {
  kind: 'lfo';
  shape: LfoShape;
  cyclesPerBar: number;
}

export interface StepModulationSource extends ModulationSourceBase {
  kind: 'step';
  values: number[];
}

export interface RandomModulationSource extends ModulationSourceBase {
  kind: 'random';
  seed: string;
  stepsPerBar: number;
}

export type ExternalModulationSourceKind =
  | 'note_expression'
  | 'audio_follower'
  | 'hardware_control';

export interface ExternalModulationSource extends ModulationSourceBase {
  kind: ExternalModulationSourceKind;
  requiredCapability: string;
}

export type ModulationSource =
  | MacroModulationSource
  | LfoModulationSource
  | StepModulationSource
  | RandomModulationSource
  | ExternalModulationSource;

export type ModulationTargetKind =
  | 'control_slot'
  | 'track_gain'
  | 'track_pan'
  | 'rack_parameter'
  | 'plugin_parameter'
  | 'hardware_parameter';

export interface ModulationTarget {
  id: string;
  name: string;
  kind: ModulationTargetKind;
  baseValue: number;
  minimum: number;
  maximum: number;
  unit: string;
  referenceId: string | null;
  parameterId: string | null;
  requiredCapability: string | null;
}

export type ModulationCurve = 'linear' | 'ease_in' | 'ease_out';

export interface ModulationRoute {
  id: string;
  sourceId: string;
  targetId: string;
  amount: number;
  inputMode: ModulationRange;
  curve: ModulationCurve;
  enabled: boolean;
}

export interface MotionScene {
  id: string;
  name: string;
  macroValues: Record<string, number>;
}

export interface ModulationWorkflowState {
  schemaVersion: typeof MODULATION_WORKFLOW_SCHEMA_VERSION;
  projectId: string;
  revision: number;
  sources: ModulationSource[];
  targets: ModulationTarget[];
  routes: ModulationRoute[];
  scenes: MotionScene[];
  activeSceneId: string | null;
}

export interface ModulationObservation {
  sourceId: string;
  adapterId: string;
  capability: string;
  value: number;
  observedAt: number;
}

export type ModulationSourceStatus = 'ready' | 'adapter_required' | 'disabled';

export interface EvaluatedModulationSource {
  sourceId: string;
  value: number | null;
  status: ModulationSourceStatus;
  note: string;
}

export type ModulationDeliveryState = 'local_preview' | 'adapter_required';

export interface EvaluatedModulationTarget {
  targetId: string;
  value: number;
  contribution: number;
  activeRouteCount: number;
  deliveryState: ModulationDeliveryState;
  requiredCapability: string | null;
}

export interface ModulationControlFrame {
  phase: number;
  sources: EvaluatedModulationSource[];
  targets: EvaluatedModulationTarget[];
  claim: 'deterministic_control_preview';
  note: string;
}
