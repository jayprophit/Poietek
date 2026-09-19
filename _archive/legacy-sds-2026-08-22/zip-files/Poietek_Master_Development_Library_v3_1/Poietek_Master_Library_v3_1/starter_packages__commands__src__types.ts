import type { PoietekProject } from "../../domain/src/types";

export type ProjectCommand =
  | {
      id: string;
      type: "AddTrack";
      payload: { track: PoietekProject["tracks"][number] };
    }
  | {
      id: string;
      type: "SetClipGain";
      payload: { trackId: string; clipId: string; gainDb: number };
    }
  | {
      id: string;
      type: "SplitAudioClip";
      payload: { trackId: string; clipId: string; splitTick: number; rightClipId: string };
    };

export interface AppliedCommand {
  project: PoietekProject;
  inverse: ProjectCommand | null;
  changedObjectIds: string[];
}
