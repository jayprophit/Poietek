export const EDITORIAL_WORKFLOW_SCHEMA_VERSION = '1.0.0' as const;
export const EDITORIAL_WORKFLOW_EXTENSION_KEY = 'org.poietek.editorial-memory' as const;

export type EditorialEditPolicy = 'free' | 'grid' | 'ripple_plan' | 'location_plan';
export type EditorialMemoryKind = 'point' | 'range' | 'view';

export interface EditorialSelection {
  startTick: number;
  durationTicks: number;
  trackIds: string[];
  linkedToTransport: boolean;
}

export interface EditorialMemoryLocation {
  id: string;
  name: string;
  color: string;
  kind: EditorialMemoryKind;
  startTick: number;
  durationTicks: number;
  trackIds: string[];
  preRollTicks: number;
  postRollTicks: number;
  notes: string;
  createdAt: string;
}

export interface EditorialClipReference {
  trackId: string;
  clipId: string;
}

export interface EditorialClipGroup {
  id: string;
  name: string;
  color: string;
  startTick: number;
  endTick: number;
  clipReferences: EditorialClipReference[];
  createdAt: string;
}

export type EditorialOperationKind =
  | 'save_memory'
  | 'recall_memory'
  | 'create_clip_group'
  | 'batch_clip_rename'
  | 'pin_tracks'
  | 'set_edit_policy';

export interface EditorialOperationRecord {
  id: string;
  kind: EditorialOperationKind;
  memoryId: string | null;
  groupId: string | null;
  affectedIds: string[];
  summary: string;
  performedAt: string;
}

export interface EditorialWorkflowState {
  schemaVersion: typeof EDITORIAL_WORKFLOW_SCHEMA_VERSION;
  projectId: string;
  revision: number;
  activeEditPolicy: EditorialEditPolicy;
  activeSelection: EditorialSelection;
  pinnedTrackIds: string[];
  memoryLocations: EditorialMemoryLocation[];
  clipGroups: EditorialClipGroup[];
  operationHistory: EditorialOperationRecord[];
  lastRecalledMemoryId: string | null;
}

export interface SaveEditorialMemoryInput {
  id: string;
  name: string;
  color: string;
  kind: EditorialMemoryKind;
  startTick: number;
  durationTicks: number;
  trackIds?: string[];
  preRollTicks?: number;
  postRollTicks?: number;
  notes?: string;
  createdAt?: string;
  operationId?: string;
}

export interface CreateEditorialClipGroupInput {
  id: string;
  name: string;
  color: string;
  startTick: number;
  durationTicks: number;
  trackIds?: string[];
  createdAt?: string;
  operationId?: string;
}

export interface EditorialBatchRenameEntry {
  trackId: string;
  clipId: string;
  sourceName: string;
  outputName: string;
  sequenceNumber: number;
}

export interface EditorialBatchRenamePlan {
  operationId: string;
  groupId: string;
  prefix: string;
  startingNumber: number;
  digits: number;
  entries: EditorialBatchRenameEntry[];
  claim: string;
}

export interface EditorialReadiness {
  canonicalState: 'ready';
  memoryLocations: 'ready';
  clipGroups: 'ready';
  batchDisplayRename: 'ready';
  projectUndo: 'ready';
  diskFileRename: 'native_adapter_required';
  sessionInterchange: 'licensed_adapter_required';
  speechToText: 'model_adapter_required';
  controlSurfaces: 'hardware_adapter_required';
  pluginHosting: 'licensed_native_host_required';
  immersiveDelivery: 'licensed_renderer_required';
}
