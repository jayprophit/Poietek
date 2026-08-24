import type { AudioClip, PoietekProject } from "../../domain/src/types";

export interface PlayableClip {
  project: PoietekProject;
  clip: AudioClip;
}

export interface AssetAudioResolver {
  resolveAudioBuffer(assetId: string, context: BaseAudioContext): Promise<AudioBuffer>;
}

export interface TransportSnapshot {
  state: "stopped" | "playing" | "paused";
  positionSeconds: number;
}

export interface AudioBackend {
  initialize(): Promise<void>;
  play(project: PoietekProject, fromSeconds?: number): Promise<void>;
  pause(): Promise<void>;
  stop(): Promise<void>;
  seek(seconds: number): Promise<void>;
  getTransport(): TransportSnapshot;
  setMasterGain(db: number): void;
  dispose(): Promise<void>;
}
