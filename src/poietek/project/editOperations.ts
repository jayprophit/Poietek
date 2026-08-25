import type {AudioClip, PoietekProject, Track} from '../domain/types';
import {newId} from '../domain/ids';
import {ticksToSeconds} from '../timeline/tempo';

export type TrackMixerPatch = Partial<Track['mixer']>;

export type AudioClipPatch = Partial<
  Pick<
    AudioClip,
    | 'name'
    | 'startTick'
    | 'durationTicks'
    | 'sourceOffsetSeconds'
    | 'sourceDurationSeconds'
    | 'gainDb'
    | 'pan'
    | 'fadeInSeconds'
    | 'fadeOutSeconds'
    | 'muted'
  >
>;

function finiteInRange(value: number, minimum: number, maximum: number, label: string) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new Error(`${label} must be between ${minimum} and ${maximum}.`);
  }
}

function findAudioClip(project: PoietekProject, trackId: string, clipId: string) {
  const track = project.tracks.find((candidate) => candidate.id === trackId);
  if (!track) throw new Error(`Track ${trackId} was not found.`);
  if (track.type !== 'audio') throw new Error(`Track ${trackId} is not an audio track.`);
  const clip = track.clips.find((candidate) => candidate.id === clipId);
  if (!clip) throw new Error(`Clip ${clipId} was not found on track ${trackId}.`);
  return {track, clip};
}

export function updateTrackMixer(
  project: PoietekProject,
  trackId: string,
  patch: TrackMixerPatch,
): PoietekProject {
  const track = project.tracks.find((candidate) => candidate.id === trackId);
  if (!track) throw new Error(`Track ${trackId} was not found.`);

  const mixer = {...track.mixer, ...patch};
  finiteInRange(mixer.gainDb, -60, 12, 'Track gain');
  finiteInRange(mixer.pan, -1, 1, 'Track pan');

  return {
    ...project,
    tracks: project.tracks.map((candidate) =>
      candidate.id === trackId ? {...candidate, mixer} : candidate,
    ),
  };
}

export function updateAudioClip(
  project: PoietekProject,
  trackId: string,
  clipId: string,
  patch: AudioClipPatch,
): PoietekProject {
  const {clip} = findAudioClip(project, trackId, clipId);
  const next = {...clip, ...patch};
  if (!next.name.trim()) throw new Error('Clip name cannot be empty.');
  if (!Number.isInteger(next.startTick) || next.startTick < 0) {
    throw new Error('Clip start must be a non-negative whole tick.');
  }
  if (!Number.isInteger(next.durationTicks) || next.durationTicks < 1) {
    throw new Error('Clip duration must be at least one tick.');
  }
  if (!Number.isFinite(next.sourceOffsetSeconds) || next.sourceOffsetSeconds < 0) {
    throw new Error('Source offset must be a non-negative finite number.');
  }
  if (
    next.sourceDurationSeconds != null &&
    (!Number.isFinite(next.sourceDurationSeconds) || next.sourceDurationSeconds <= 0)
  ) {
    throw new Error('Source duration must be positive when present.');
  }
  finiteInRange(next.gainDb, -60, 24, 'Clip gain');
  finiteInRange(next.pan, -1, 1, 'Clip pan');
  finiteInRange(next.fadeInSeconds, 0, 60 * 60, 'Fade in');
  finiteInRange(next.fadeOutSeconds, 0, 60 * 60, 'Fade out');

  const clipDurationSeconds =
    ticksToSeconds(
      next.startTick + next.durationTicks,
      project.tempoMap,
      project.settings.ppq,
    ) -
    ticksToSeconds(next.startTick, project.tempoMap, project.settings.ppq);
  if (next.fadeInSeconds + next.fadeOutSeconds > clipDurationSeconds + 1e-6) {
    throw new Error('Combined fades cannot be longer than the clip.');
  }

  return {
    ...project,
    tracks: project.tracks.map((track) =>
      track.id === trackId
        ? {
            ...track,
            clips: track.clips.map((candidate) =>
              candidate.id === clipId ? next : candidate,
            ),
          }
        : track,
    ),
  };
}

export function removeAudioClip(
  project: PoietekProject,
  trackId: string,
  clipId: string,
): PoietekProject {
  findAudioClip(project, trackId, clipId);
  return {
    ...project,
    tracks: project.tracks.map((track) =>
      track.id === trackId
        ? {...track, clips: track.clips.filter((clip) => clip.id !== clipId)}
        : track,
    ),
  };
}

export function duplicateAudioClip(
  project: PoietekProject,
  trackId: string,
  clipId: string,
): PoietekProject {
  const {clip} = findAudioClip(project, trackId, clipId);

  const duplicate: AudioClip = {
    ...clip,
    id: newId('clp'),
    name: `${clip.name} Copy`,
    startTick: clip.startTick + clip.durationTicks,
  };

  return {
    ...project,
    tracks: project.tracks.map((track) =>
      track.id === trackId
        ? {
            ...track,
            clips: track.clips.flatMap((candidate) =>
              candidate.id === clipId
                ? [candidate, duplicate]
                : [candidate],
            ),
          }
        : track,
    ),
  };
}

export function splitAudioClipAtTick(
  project: PoietekProject,
  trackId: string,
  clipId: string,
  splitTick: number,
): PoietekProject {
  const {clip} = findAudioClip(project, trackId, clipId);
  const clipEndTick = clip.startTick + clip.durationTicks;
  if (!Number.isInteger(splitTick) || splitTick <= clip.startTick || splitTick >= clipEndTick) {
    throw new Error('Split point must be a whole tick inside the clip.');
  }

  const clipStartSeconds = ticksToSeconds(
    clip.startTick,
    project.tempoMap,
    project.settings.ppq,
  );
  const splitSeconds = ticksToSeconds(splitTick, project.tempoMap, project.settings.ppq);
  const offsetDelta = splitSeconds - clipStartSeconds;
  const firstDurationTicks = splitTick - clip.startTick;
  const secondDurationTicks = clipEndTick - splitTick;
  const first: AudioClip = {
    ...clip,
    durationTicks: firstDurationTicks,
    sourceDurationSeconds:
      clip.sourceDurationSeconds == null
        ? offsetDelta
        : Math.min(clip.sourceDurationSeconds, offsetDelta),
    fadeOutSeconds: 0,
  };
  const second: AudioClip = {
    ...clip,
    id: newId('clp'),
    name: `${clip.name} B`,
    startTick: splitTick,
    durationTicks: secondDurationTicks,
    sourceOffsetSeconds: clip.sourceOffsetSeconds + offsetDelta,
    sourceDurationSeconds:
      clip.sourceDurationSeconds == null
        ? null
        : Math.max(0.000001, clip.sourceDurationSeconds - offsetDelta),
    fadeInSeconds: 0,
  };

  return {
    ...project,
    tracks: project.tracks.map((track) =>
      track.id === trackId
        ? {
            ...track,
            clips: track.clips.flatMap((candidate) =>
              candidate.id === clipId ? [first, second] : [candidate],
            ),
          }
        : track,
    ),
  };
}

