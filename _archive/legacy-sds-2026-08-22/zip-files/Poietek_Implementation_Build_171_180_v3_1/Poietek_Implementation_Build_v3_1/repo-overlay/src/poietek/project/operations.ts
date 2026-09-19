import type { Asset, AudioClip, PoietekProject, Track } from "../domain/types";
import { newId } from "../domain/ids";

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
  const bpm = project.tempoMap[0]?.bpm ?? 120;
  const secondsPerBeat = 60 / bpm;
  const beats = (asset.durationSeconds ?? 1) / secondsPerBeat;
  const durationTicks = Math.max(1, Math.round(beats * project.settings.ppq));

  const clip: AudioClip = {
    id: newId("clp"),
    clipType: "audio",
    assetId: asset.id,
    name: asset.originalName,
    startTick: input.startTick ?? 0,
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
