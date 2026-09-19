export interface TimePreservingPitchRequest {
  sourceAssetId: string;
  sourceReferenceHz: number;
  targetReferenceHz: number;
  mediaType: "audio" | "video";
  preserveTempo: true;
  preserveDuration: true;
}

export interface TimePreservingPitchSession {
  id: string;
  pitchShiftCents: number;
  latencySeconds: number;
}

export interface TimePreservingPitchBackend {
  readonly id: string;
  isAvailable(): Promise<boolean>;
  open(request: TimePreservingPitchRequest): Promise<TimePreservingPitchSession>;
  close(sessionId: string): Promise<void>;
}

/**
 * Correct fallback: play the creator original.
 * Do NOT use playbackRate because it changes speed/duration and would desync video.
 */
export class UnavailableTimePreservingPitchBackend
implements TimePreservingPitchBackend {
  readonly id = "unavailable";

  async isAvailable(): Promise<boolean> {
    return false;
  }

  async open(): Promise<TimePreservingPitchSession> {
    throw new Error(
      "TIME_PRESERVING_PITCH_UNAVAILABLE: play the creator original or use a pre-rendered compatible rendition.",
    );
  }

  async close(): Promise<void> {}
}

export function referenceShiftCents(sourceHz: number, targetHz: number): number {
  if (sourceHz <= 0 || targetHz <= 0) {
    throw new Error("Reference frequencies must be positive.");
  }
  return 1200 * Math.log2(targetHz / sourceHz);
}
