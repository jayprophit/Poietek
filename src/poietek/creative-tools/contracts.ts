export const CREATIVE_TOOLKIT_SCHEMA_VERSION = '1.0.0' as const;

export interface ChopPoint {
  id: string;
  sourceSeconds: number;
  endSeconds: number;
  bank: number;
  pad: number;
  midiNote: number;
  gate: boolean;
}

export interface ChopMap {
  schemaVersion: typeof CREATIVE_TOOLKIT_SCHEMA_VERSION;
  id: string;
  assetId: string;
  sourceDurationSeconds: number;
  sourceBpm: number | null;
  projectBpm: number;
  playbackMode: 'original_speed' | 'time_preserving_stretch_required';
  chopOffsetMilliseconds: number;
  points: ChopPoint[];
}

export interface HarmonyPad {
  id: string;
  bank: number;
  pad: number;
  midiNotes: number[];
  label: string;
}

export interface HarmonyPadBank {
  schemaVersion: typeof CREATIVE_TOOLKIT_SCHEMA_VERSION;
  id: string;
  rootMidiNote: number;
  scale: 'major' | 'minor' | 'dorian' | 'mixolydian' | 'pentatonic_minor';
  octave: number;
  voicing: 'triad' | 'seventh' | 'single_note';
  pads: HarmonyPad[];
}

export interface DrumStep {
  active: boolean;
  probability: number;
  velocity: number;
  shiftTicks: number;
  pan: number;
  repeat: 1 | 2 | 3 | 4;
}

export interface DrumLane {
  id: string;
  name: string;
  sampleAssetId: string | null;
  muted: boolean;
  steps: DrumStep[];
}

export interface DrumPattern {
  schemaVersion: typeof CREATIVE_TOOLKIT_SCHEMA_VERSION;
  id: string;
  name: string;
  bpm: number;
  swing: number;
  stepCount: 16 | 32 | 64;
  lanes: DrumLane[];
}

export interface RenderedDrumHit {
  laneId: string;
  step: number;
  velocity: number;
  pan: number;
  repeat: number;
  offsetTicks: number;
}

export interface StemExtractionJob {
  schemaVersion: typeof CREATIVE_TOOLKIT_SCHEMA_VERSION;
  id: string;
  projectId: string;
  manifestFormat: 'poietek' | 'mpc_xpj' | 'ableton_als' | 'generic';
  projectManifestAssetId: string;
  sourceFolderHandleId: string | null;
  state: 'draft' | 'ready' | 'extracting' | 'completed' | 'failed' | 'unsupported';
  localOnly: true;
  implementationId: string | null;
  outputAssetIds: string[];
  limitations: string[];
}

export interface LocalFeedbackIdea {
  schemaVersion: typeof CREATIVE_TOOLKIT_SCHEMA_VERSION;
  id: string;
  toolId: string;
  title: string;
  detail: string;
  votes: number;
  state: 'draft' | 'queued_for_consent' | 'submitted' | 'declined';
  createdAt: string;
  externalReference: string | null;
}
