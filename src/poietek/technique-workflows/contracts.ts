export const TECHNIQUE_MATRIX_SCHEMA_VERSION = '1.0.0' as const;
export const TECHNIQUE_MATRIX_EXTENSION_KEY = 'org.poietek.performance-techniques' as const;

export type PerformanceTechniqueKind = 'direction' | 'attribute';
export type TechniqueTriggerKind = 'keyswitch' | 'cc' | 'program_change';

export interface PerformanceTechnique {
  id: string;
  name: string;
  kind: PerformanceTechniqueKind;
  mutualExclusionGroupId: string | null;
}

export interface TechniqueMutualExclusionGroup {
  id: string;
  name: string;
  techniqueIds: readonly string[];
}

export interface ScoreTechniqueBinding {
  scoreArticulation: string;
  techniqueId: string;
}

export interface TechniqueTriggerAction {
  kind: TechniqueTriggerKind;
  channel: number;
  note?: number;
  velocity?: number;
  durationTicks?: number;
  controller?: number;
  value?: number;
  program?: number;
}

export interface TechniqueSoundSlot {
  id: string;
  name: string;
  techniqueIds: readonly string[];
  actions: readonly TechniqueTriggerAction[];
  attackCompensationTicks: number;
}

export interface TechniqueMap {
  id: string;
  name: string;
  instrumentFamily: string;
  techniques: readonly PerformanceTechnique[];
  mutualExclusionGroups: readonly TechniqueMutualExclusionGroup[];
  scoreBindings: readonly ScoreTechniqueBinding[];
  soundSlots: readonly TechniqueSoundSlot[];
  defaultDirectionTechniqueIds: readonly string[];
}

export interface TechniqueAssignment {
  id: string;
  mapId: string;
  trackId: string;
  scoreId: string;
  playerId: string;
}

export interface PlannedTechniqueAction extends TechniqueTriggerAction {
  dispatchTick: number;
}

export interface TechniquePlaybackPlanEvent {
  scoreNoteId: string;
  playerId: string;
  noteStartTick: number;
  noteDurationTicks: number;
  soundSlotId: string;
  techniqueIds: readonly string[];
  actions: readonly PlannedTechniqueAction[];
}

export interface TechniquePlaybackPlan {
  schemaVersion: typeof TECHNIQUE_MATRIX_SCHEMA_VERSION;
  operationId: string;
  mapId: string;
  assignmentId: string;
  sourceSignature: string;
  ready: boolean;
  issues: readonly string[];
  events: readonly TechniquePlaybackPlanEvent[];
  executionClaim: 'control_plan_only';
}

export interface AppliedTechniquePlanRecord {
  operationId: string;
  mapId: string;
  assignmentId: string;
  sourceSignature: string;
  eventCount: number;
  state: 'planned_for_adapter';
  committedAt: string;
}

export interface TechniqueMatrixState {
  schemaVersion: typeof TECHNIQUE_MATRIX_SCHEMA_VERSION;
  projectId: string;
  revision: number;
  maps: readonly TechniqueMap[];
  assignments: readonly TechniqueAssignment[];
  appliedPlans: readonly AppliedTechniquePlanRecord[];
  updatedAt: string;
}

export interface TechniqueMatrixReadinessItem {
  id: string;
  label: string;
  state: 'ready' | 'adapter_required';
  message: string;
}
