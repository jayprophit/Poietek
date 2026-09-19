export type ProjectId = string;
export type AssetId = string;
export type TrackId = string;
export type ClipId = string;

export interface TempoEvent {
  tick: number;
  bpm: number;
}

export interface Asset {
  id: AssetId;
  mediaType: "audio" | "midi" | "video" | "image" | "other";
  contentHash: string;
  originalName: string;
  mimeType: string | null;
  byteLength: number;
  durationSeconds: number | null;
  sampleRate: number | null;
  channels: number | null;
  createdAt: string;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface AudioClip {
  id: ClipId;
  clipType: "audio";
  assetId: AssetId;
  name: string;
  startTick: number;
  durationTicks: number;
  sourceOffsetSeconds: number;
  sourceDurationSeconds: number | null;
  gainDb: number;
  pan: number;
  fadeInSeconds: number;
  fadeOutSeconds: number;
  muted: boolean;
}

export interface Track {
  id: TrackId;
  type: "audio" | "midi" | "instrument" | "video";
  name: string;
  order: number;
  color: string | null;
  clips: AudioClip[];
  mixer: {
    gainDb: number;
    pan: number;
    mute: boolean;
    solo: boolean;
  };
}

export interface TuningSettings {
  referenceNote: string;
  referenceHz: number;
  temperament: string;
  profileId: string;
}

export interface ProjectSettings {
  ppq: number;
  sampleRate: 44100 | 48000 | 88200 | 96000 | 176400 | 192000;
  tuning: TuningSettings;
}

export interface PoietekProject {
  id: ProjectId;
  schemaVersion: "1.1.0";
  title: string;
  ownerId: string | null;
  teamId: string | null;
  createdAt: string;
  updatedAt: string;
  tempoMap: TempoEvent[];
  tracks: Track[];
  assets: Asset[];
  contributors: Record<string, unknown>[];
  rights: Record<string, unknown>;
  releases: Record<string, unknown>[];
  settings: ProjectSettings;
  extensions: Record<string, unknown>;
}
