export const COMPOSITION_WORKFLOW_SCHEMA_VERSION = '1.1.0' as const;
export const COMPOSITION_WORKFLOW_EXTENSION_KEY = 'org.poietek.composition-workflows' as const;

export type PatternChannelKind = 'sampler' | 'instrument' | 'midi' | 'automation';

export interface PatternStep {
  stepIndex: number;
  note: number;
  velocity: number;
  probability: number;
  microShiftTicks: number;
  lengthSteps: number;
}

export interface PatternChannel {
  id: string;
  name: string;
  kind: PatternChannelKind;
  color: string;
  targetModuleId: string | null;
  mixerTargetId: string | null;
  muted: boolean;
  solo: boolean;
  steps: PatternStep[];
}

export interface CompositionPattern {
  id: string;
  name: string;
  stepCount: number;
  stepsPerBeat: number;
  swing: number;
  channels: PatternChannel[];
}

export type ArrangementSourceKind = 'pattern' | 'audio' | 'automation';
export type ArrangementLaneBinding = 'free' | 'instrument' | 'audio' | 'automation';

export interface ArrangementClip {
  id: string;
  sourceKind: ArrangementSourceKind;
  sourceId: string;
  startTick: number;
  durationTicks: number;
  loopEnabled: boolean;
}

export interface ArrangementLane {
  id: string;
  name: string;
  binding: ArrangementLaneBinding;
  targetId: string | null;
  clips: ArrangementClip[];
}

export type AutomationCurve = 'hold' | 'linear' | 'smooth';

export interface CompositionAutomationPoint {
  tick: number;
  value: number;
  curve: AutomationCurve;
  tension: number;
}

export interface CompositionAutomationEnvelope {
  id: string;
  targetId: string;
  parameterId: string;
  points: CompositionAutomationPoint[];
}

export interface RetrospectiveCaptureObservation {
  adapterId: string;
  streamId: string;
  observedAt: number;
  bufferedSeconds: number;
  sampleRate: number;
  channels: number;
}

export interface RetrospectiveCaptureState {
  maximumSeconds: number;
  armedIntent: boolean;
  observation: RetrospectiveCaptureObservation | null;
  lastRecallAssetId: string | null;
}

export type LoopSourceRole = 'drums' | 'bass' | 'harmony' | 'melody' | 'vocal' | 'texture';
export type LoopSourceRights = 'original' | 'licensed' | 'public_domain';

export interface LoopSourceDescriptor {
  assetId: string;
  role: LoopSourceRole;
  bpm: number;
  key: string | null;
  durationSeconds: number;
  rights: LoopSourceRights;
  rightsEvidenceReference: string;
}

export interface LoopStarterSelection {
  role: LoopSourceRole;
  assetId: string;
  sourceBpm: number;
  sourceKey: string | null;
  requiresTimeStretch: boolean;
  requiresPitchShift: boolean;
}

export interface LoopStarterDraft {
  id: string;
  seed: string;
  targetBpm: number;
  targetKey: string | null;
  selections: LoopStarterSelection[];
  missingRoles: LoopSourceRole[];
  status: 'incomplete' | 'ready_for_preview';
  renderState: 'not_requested';
}

export type SongSectionKind = 'intro' | 'verse' | 'pre_chorus' | 'chorus' | 'bridge' | 'breakdown' | 'outro' | 'custom';

export interface SongSection {
  id: string;
  name: string;
  kind: SongSectionKind;
  sourceStartTick: number;
  durationTicks: number;
  color: string;
}

export interface SongArrangementVariant {
  id: string;
  name: string;
  sectionIds: string[];
}

export interface ResolvedSongSection {
  sectionId: string;
  occurrenceIndex: number;
  arrangementStartTick: number;
  durationTicks: number;
}

export type LyricCueKind = 'lead' | 'backing' | 'direction';

export interface LyricCue {
  id: string;
  text: string;
  startTick: number;
  durationTicks: number;
  kind: LyricCueKind;
}

export interface LyricDocument {
  scratchpad: string;
  cues: LyricCue[];
}

export type MixSceneTargetKind = 'track' | 'bus' | 'master';

export interface MixSceneTargetState {
  targetId: string;
  kind: MixSceneTargetKind;
  gainDb: number;
  pan: number;
  mute: boolean;
  solo: boolean;
  processorStateReferences: Record<string, string>;
}

export interface MixScene {
  id: string;
  name: string;
  createdAt: string;
  targets: MixSceneTargetState[];
}

export interface CompositionWorkflowState {
  schemaVersion: typeof COMPOSITION_WORKFLOW_SCHEMA_VERSION;
  projectId: string;
  revision: number;
  patterns: CompositionPattern[];
  lanes: ArrangementLane[];
  automationEnvelopes: CompositionAutomationEnvelope[];
  retrospectiveCapture: RetrospectiveCaptureState;
  loopStarterDrafts: LoopStarterDraft[];
  songSections: SongSection[];
  songArrangements: SongArrangementVariant[];
  lyrics: LyricDocument;
  mixScenes: MixScene[];
  activeMixSceneId: string | null;
}
