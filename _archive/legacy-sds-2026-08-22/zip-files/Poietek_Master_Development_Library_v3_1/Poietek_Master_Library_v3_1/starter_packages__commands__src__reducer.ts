import type { AudioClip, PoietekProject, Track } from "../../domain/src/types";
import type { AppliedCommand, ProjectCommand } from "./types";

function replaceTrack(project: PoietekProject, trackId: string, nextTrack: Track): PoietekProject {
  return {
    ...project,
    updatedAt: new Date().toISOString(),
    tracks: project.tracks.map((track) => (track.id === trackId ? nextTrack : track)),
  };
}

export function applyProjectCommand(
  project: PoietekProject,
  command: ProjectCommand,
): AppliedCommand {
  if (command.type === "AddTrack") {
    const nextTrack = {
      ...command.payload.track,
      order: project.tracks.length,
    };

    return {
      project: {
        ...project,
        updatedAt: new Date().toISOString(),
        tracks: [...project.tracks, nextTrack],
      },
      inverse: null,
      changedObjectIds: [nextTrack.id],
    };
  }

  if (command.type === "SetClipGain") {
    const track = project.tracks.find((item) => item.id === command.payload.trackId);
    if (!track) throw new Error(`Track ${command.payload.trackId} not found.`);

    const clip = track.clips.find((item) => item.id === command.payload.clipId);
    if (!clip || clip.clipType !== "audio") throw new Error("Audio clip not found.");

    const inverse: ProjectCommand = {
      id: crypto.randomUUID(),
      type: "SetClipGain",
      payload: {
        trackId: track.id,
        clipId: clip.id,
        gainDb: clip.gainDb,
      },
    };

    const nextTrack: Track = {
      ...track,
      clips: track.clips.map((item) =>
        item.id === clip.id && item.clipType === "audio"
          ? { ...item, gainDb: command.payload.gainDb }
          : item,
      ),
    };

    return {
      project: replaceTrack(project, track.id, nextTrack),
      inverse,
      changedObjectIds: [clip.id],
    };
  }

  if (command.type === "SplitAudioClip") {
    const track = project.tracks.find((item) => item.id === command.payload.trackId);
    if (!track) throw new Error(`Track ${command.payload.trackId} not found.`);

    const index = track.clips.findIndex((item) => item.id === command.payload.clipId);
    const clip = track.clips[index];

    if (!clip || clip.clipType !== "audio") throw new Error("Audio clip not found.");

    const splitOffsetTicks = command.payload.splitTick - clip.startTick;
    if (splitOffsetTicks <= 0 || splitOffsetTicks >= clip.durationTicks) {
      throw new Error("Split position must be inside the clip.");
    }

    const leftDuration = splitOffsetTicks;
    const rightDuration = clip.durationTicks - splitOffsetTicks;

    const sourceSecondsPerTick =
      clip.sourceDurationSeconds && clip.durationTicks > 0
        ? clip.sourceDurationSeconds / clip.durationTicks
        : 0;

    const left: AudioClip = {
      ...clip,
      durationTicks: leftDuration,
      sourceDurationSeconds:
        clip.sourceDurationSeconds == null
          ? null
          : leftDuration * sourceSecondsPerTick,
    };

    const right: AudioClip = {
      ...clip,
      id: command.payload.rightClipId,
      startTick: command.payload.splitTick,
      durationTicks: rightDuration,
      sourceOffsetSeconds:
        clip.sourceOffsetSeconds + leftDuration * sourceSecondsPerTick,
      sourceDurationSeconds:
        clip.sourceDurationSeconds == null
          ? null
          : rightDuration * sourceSecondsPerTick,
    };

    const nextClips = [...track.clips];
    nextClips.splice(index, 1, left, right);

    return {
      project: replaceTrack(project, track.id, { ...track, clips: nextClips }),
      inverse: null,
      changedObjectIds: [left.id, right.id],
    };
  }

  const neverCommand: never = command;
  throw new Error(`Unhandled command ${(neverCommand as { type?: string }).type ?? "unknown"}.`);
}
