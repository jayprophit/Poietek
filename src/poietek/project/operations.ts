import type { Asset, AudioClip, PoietekProject, Track } from "../domain/types";
import { newId } from "../domain/ids";
import { secondsToTicks, ticksToSeconds } from "../timeline/tempo";

export function addAudioTrack(
  project: PoietekProject,
  name = "Audio Track",
): PoietekProject {
  const track: Track = {
    id: newId("trk"),
    type: "audio",
    name,
    order: project.tracks.length,
    color: null,
    clips: [],
    mixer: { gainDb: 0, pan: 0, mute: false, solo: false },
  };

  return { ...project, tracks: [...project.tracks, track] };
}

export function addMidiTrack(
  project: PoietekProject,
  name = "MIDI Track",
): PoietekProject {
  const track: Track = {
    id: newId("trk"),
    type: "midi",
    name,
    order: project.tracks.length,
    color: null,
    clips: [],
    mixer: { gainDb: 0, pan: 0, mute: false, solo: false },
  };

  return { ...project, tracks: [...project.tracks, track] };
}

export function addAsset(
  project: PoietekProject,
  asset: Asset,
): PoietekProject {
  if (project.assets.some((existing) => existing.id === asset.id)) return project;
  return { ...project, assets: [...project.assets, asset] };
}

export function addAudioClip(input: {
  project: PoietekProject;
  trackId: string;
  asset: Asset;
  startTick?: number;
}): PoietekProject {
  const { project, trackId, asset } = input;
  const track = project.tracks.find((candidate) => candidate.id === trackId);
  if (!track) throw new Error(`Track ${trackId} was not found.`);
  if (track.type !== "audio") {
    throw new Error(`Track ${trackId} is not an audio track.`);
  }
  if (!project.assets.some((candidate) => candidate.id === asset.id)) {
    throw new Error(`Asset ${asset.id} must be added to the project first.`);
  }
  if (asset.durationSeconds == null || asset.durationSeconds <= 0) {
    throw new Error(`Audio asset ${asset.id} does not have a usable duration.`);
  }

  const startTick = input.startTick ?? 0;
  if (!Number.isInteger(startTick) || startTick < 0) {
    throw new Error("Clip startTick must be a non-negative integer.");
  }

  const startSeconds = ticksToSeconds(
    startTick,
    project.tempoMap,
    project.settings.ppq,
  );
  const endTick = secondsToTicks(
    startSeconds + asset.durationSeconds,
    project.tempoMap,
    project.settings.ppq,
  );
  const durationTicks = Math.max(1, endTick - startTick);

  const clip: AudioClip = {
    id: newId("clp"),
    clipType: "audio",
    assetId: asset.id,
    name: asset.originalName,
    startTick,
    durationTicks,
    sourceOffsetSeconds: 0,
    sourceDurationSeconds: asset.durationSeconds,
    gainDb: 0,
    pan: 0,
    fadeInSeconds: 0,
    fadeOutSeconds: 0,
    muted: false,
  };

  return {
    ...project,
    tracks: project.tracks.map((track) =>
      track.id === trackId
        ? { ...track, clips: [...track.clips, clip] }
        : track,
    ),
  };
}

export function setProjectTuning(
  project: PoietekProject,
  referenceHz: number,
  profileId: string,
  temperament = "12_tet",
): PoietekProject {
  return {
    ...project,
    settings: {
      ...project.settings,
      tuning: {
        ...project.settings.tuning,
        referenceHz,
        profileId,
        temperament,
      },
    },
  };
}
