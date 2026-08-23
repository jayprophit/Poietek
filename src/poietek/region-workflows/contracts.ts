export const PRODUCTION_REGION_SCHEMA_VERSION = '1.0.0' as const;
export const PRODUCTION_REGION_EXTENSION_KEY = 'org.poietek.production-regions' as const;

export type ProductionRegionMemberKind =
  | 'audio_clip'
  | 'arrangement_clip'
  | 'automation_point';

export interface ProductionRegionMemberReference {
  kind: ProductionRegionMemberKind;
  containerId: string;
  itemId: string | null;
  tick: number | null;
}

export interface ProductionRegion {
  id: string;
  name: string;
  color: string;
  startTick: number;
  durationTicks: number;
  members: ProductionRegionMemberReference[];
  createdAt: string;
}

export type ProductionRegionAction = 'move' | 'copy';

export interface ProductionRegionOperationRecord {
  id: string;
  regionId: string;
  resultRegionId: string;
  action: ProductionRegionAction;
  sourceStartTick: number;
  targetStartTick: number;
  deltaTicks: number;
  memberCount: number;
  performedAt: string;
}

export interface ProductionRegionState {
  schemaVersion: typeof PRODUCTION_REGION_SCHEMA_VERSION;
  projectId: string;
  revision: number;
  regions: ProductionRegion[];
  operationHistory: ProductionRegionOperationRecord[];
}

export interface CaptureProductionRegionInput {
  id: string;
  name: string;
  color: string;
  startTick: number;
  durationTicks: number;
  includeAudioTracks?: boolean;
  includeArrangementLanes?: boolean;
  includeAutomation?: boolean;
  trackIds?: string[];
  arrangementLaneIds?: string[];
  createdAt?: string;
}

export interface ProductionRegionPlanEntry {
  kind: ProductionRegionMemberKind;
  containerId: string;
  sourceItemId: string | null;
  targetItemId: string | null;
  sourceTick: number;
  targetTick: number;
}

export interface ProductionRegionActionPlan {
  operationId: string;
  regionId: string;
  resultRegionId: string;
  action: ProductionRegionAction;
  sourceStartTick: number;
  targetStartTick: number;
  deltaTicks: number;
  durationTicks: number;
  entries: ProductionRegionPlanEntry[];
}

export interface ProductionRegionReadiness {
  localModel: 'ready';
  capture: 'ready';
  moveAndCopy: 'ready';
  atomicProjectCommit: 'ready';
  audiblePlayback: 'adapter_required';
  nativeDragGesture: 'adapter_required';
}
