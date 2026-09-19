import type { AudioClip, PoietekProject } from "../../domain/src/types";
import { ticksToSeconds } from "./tempo";

export interface AudioTimelineItem {
  trackId: string;
  trackName: string;
  clip: AudioClip;
  startSeconds: number;
  endSeconds: number;
}

export function getAudioTimeline(project: PoietekProject): AudioTimelineItem[] {
  const { ppq } = project.settings;

  return project.tracks.flatMap((track) =>
    track.clips.flatMap((clip) => {
      if (clip.clipType !== "audio") return [];

      const startSeconds = ticksToSeconds(clip.startTick, project.tempoMap, ppq);
      const endSeconds = ticksToSeconds(
        clip.startTick + clip.durationTicks,
        project.tempoMap,
        ppq,
      );

      return [{
        trackId: track.id,
        trackName: track.name,
        clip,
        startSeconds,
        endSeconds,
      }];
    }),
  );
}
