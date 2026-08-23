export const PERFORMANCE_CANVAS_SCHEMA_VERSION = '1.0.0' as const;
export const PERFORMANCE_CANVAS_EXTENSION_KEY = 'org.poietek.performance-canvas' as const;

export type PerformanceSourceKind = 'pattern' | 'audio';
export type PerformanceLaunchMode = 'trigger' | 'gate' | 'toggle' | 'repeat';
export type PerformanceFollowAction = 'none' | 'next' | 'previous' | 'first' | 'stop';

export interface PerformanceLane {
  id: string;
  name: string;
  color: string;
  arrangementLaneId: string;
  targetTrackId: string | null;
}

export interface PerformanceScene {
  id: string;
  name: string;
  color: string;
  followAction: PerformanceFollowAction;
  followAfterBars: number;
}

export interface PerformanceSlot {
  id: string;
  laneId: string;
  sceneId: string;
  name: string;
  sourceKind: PerformanceSourceKind;
  sourceId: string;
  lengthTicks: number;
  loopEnabled: boolean;
  launchMode: PerformanceLaunchMode;
  legato: boolean;
}

export type PerformanceEventKind = 'launch' | 'stop';

export interface PerformanceEvent {
  id: string;
  kind: PerformanceEventKind;
  requestedTick: number;
  scheduledTick: number;
  laneId: string;
  sceneId: string | null;
  slotId: string | null;
}

export type PerformanceCaptureStatus = 'idle' | 'recording' | 'stopped' | 'committed';

export interface PerformanceCapture {
  status: PerformanceCaptureStatus;
  takeId: string | null;
  startedAtTick: number | null;
  stoppedAtTick: number | null;
  cursorTick: number;
  events: PerformanceEvent[];
  lastCommitId: string | null;
}

export interface PerformanceCanvasState {
  schemaVersion: typeof PERFORMANCE_CANVAS_SCHEMA_VERSION;
  projectId: string;
  revision: number;
  barLengthTicks: number;
  launchQuantizationTicks: number;
  lanes: PerformanceLane[];
  scenes: PerformanceScene[];
  slots: PerformanceSlot[];
  activeSlotIdsByLane: Record<string, string | null>;
  capture: PerformanceCapture;
}

export type PerformanceRuntimeCapability =
  | 'sample_accurate_clock'
  | 'pattern_playback'
  | 'audio_clip_playback'
  | 'controller_input'
  | 'follow_scheduler';

export interface PerformanceRuntimeObservation {
  adapterId: string;
  observedAt: number;
  capabilities: PerformanceRuntimeCapability[];
}

export interface PerformanceReadiness {
  controlModel: 'ready';
  arrangementCommit: 'ready' | 'capture_required';
  livePlayback: 'ready' | 'adapter_required';
  controllerInput: 'ready' | 'adapter_required';
  followScheduling: 'ready' | 'adapter_required';
  missingCapabilities: PerformanceRuntimeCapability[];
}

export interface PerformanceFollowPlan {
  sourceSceneId: string;
  action: PerformanceFollowAction;
  targetSceneId: string | null;
  scheduledTick: number | null;
  claim: 'planning_only';
}

export interface ArrangementCaptureEntry {
  clipId: string;
  performanceEventId: string;
  laneId: string;
  arrangementLaneId: string;
  slotId: string;
  sourceKind: PerformanceSourceKind;
  sourceId: string;
  startTick: number;
  durationTicks: number;
  loopEnabled: boolean;
}

export interface ArrangementCapturePlan {
  takeId: string;
  commitId: string;
  insertionTick: number;
  entries: ArrangementCaptureEntry[];
  status: 'ready';
  claim: 'canonical_arrangement_plan';
}
