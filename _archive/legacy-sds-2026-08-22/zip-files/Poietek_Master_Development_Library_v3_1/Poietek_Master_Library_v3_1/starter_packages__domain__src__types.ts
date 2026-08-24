export type ProjectId = string;
export type TrackId = string;
export type ClipId = string;
export type AssetId = string;

export interface TempoEvent {
  tick: number;
  bpm: number;
}

export interface TimeSignatureEvent {
  tick: number;
  numerator: number;
  denominator: 1 | 2 | 4 | 8 | 16 | 32 | 64;
}

export type AssetMediaType =
  | "audio"
  | "midi"
  | "video"
  | "image"
  | "document"
  | "preset"
  | "project_fragment"
  | "model"
  | "other";

export type AssetReplicaState =
  | "available"
  | "uploading"
  | "queued"
  | "offline"
  | "missing"
  | "error"
  | "evicted";

export interface AssetReplica {
  id: string;
  providerId: string;
  locator: string;
  state: AssetReplicaState;
  verifiedHash?: string | null;
  lastVerifiedAt?: string | null;
  accessClass:
    | "private_owner"
    | "team_shared"
    | "public"
    | "app_managed"
    | "external_shared_link";
}

export interface Asset {
  id: AssetId;
  mediaType: AssetMediaType;
  contentHash: string;
  originalName: string;
  mimeType?: string | null;
  byteLength: number;
  durationSeconds?: number | null;
  sampleRate?: number | null;
  channels?: number | null;
  tags: string[];
  provenance: Record<string, unknown>;
  license: Record<string, unknown>;
  replicas: AssetReplica[];
}

export interface BaseClip {
  id: ClipId;
  clipType: "audio" | "midi" | "video";
  startTick: number;
  durationTicks: number;
  muted: boolean;
  name?: string;
  color?: string | null;
}

export interface AudioClip extends BaseClip {
  clipType: "audio";
  assetId: AssetId;
  sourceOffsetSeconds: number;
  sourceDurationSeconds?: number | null;
  gainDb: number;
  pan: number;
  fadeInSeconds: number;
  fadeOutSeconds: number;
  operations: Record<string, unknown>[];
}

export interface MidiNote {
  id: string;
  startTick: number;
  durationTicks: number;
  note: number;
  velocity: number;
  releaseVelocity?: number | null;
  probability: number;
  microOffsetTicks: number;
  expression: Record<string, unknown>;
}

export interface MidiClip extends BaseClip {
  clipType: "midi";
  notes: MidiNote[];
  controllers: Record<string, unknown>[];
}

export interface VideoClip extends BaseClip {
  clipType: "video";
  assetId: AssetId;
  sourceOffsetSeconds: number;
  transform: Record<string, unknown>;
  effects: Record<string, unknown>[];
}

export type Clip = AudioClip | MidiClip | VideoClip;

export interface MixerState {
  gainDb: number;
  pan: number;
  mute: boolean;
  solo: boolean;
  sends: Record<string, unknown>[];
}

export type TrackType =
  | "audio"
  | "midi"
  | "instrument"
  | "hybrid"
  | "video"
  | "automation"
  | "lighting";

export interface Track {
  id: TrackId;
  type: TrackType;
  name: string;
  order: number;
  color?: string | null;
  clips: Clip[];
  mixer: MixerState;
  routing: Record<string, unknown>;
  plugins: Record<string, unknown>[];
  automation: Record<string, unknown>[];
  contributorAssignmentIds: string[];
}

export interface ProjectSettings {
  ppq: number;
  sampleRate: 44100 | 48000 | 88200 | 96000 | 176400 | 192000;
  storagePolicy: Record<string, unknown>;
  defaultRender: Record<string, unknown>;
}

export interface PoietekProject {
  id: ProjectId;
  schemaVersion: "1.0.0";
  title: string;
  ownerId: string | null;
  teamId: string | null;
  createdAt: string;
  updatedAt: string;
  tempoMap: TempoEvent[];
  timeSignatureMap: TimeSignatureEvent[];
  keyMap: Record<string, unknown>[];
  tracks: Track[];
  buses: Record<string, unknown>[];
  assets: Asset[];
  deviceAssignments: Record<string, unknown>[];
  mappings: Record<string, unknown>[];
  contributors: Record<string, unknown>[];
  rights: Record<string, unknown>;
  releases: Record<string, unknown>[];
  snapshots: Record<string, unknown>[];
  settings: ProjectSettings;
  extensions: Record<string, unknown>;
}
