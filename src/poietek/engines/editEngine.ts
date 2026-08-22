import type {AudioClip, PoietekProject, Track} from '../domain/types';
import type {MidiClipRecord, MidiEventRecord} from './contracts';

export type CoreEditResult =
  | {ok: true; project: PoietekProject; changedClipIds: string[]}
  | {ok: false; project: PoietekProject; changedClipIds: []; code: string; message: string};

const failure = (project: PoietekProject, code: string, message: string): CoreEditResult => ({ok: false, project, changedClipIds: [], code, message});

function updateClips(project: PoietekProject, ids: Set<string>, update: (clip: AudioClip, track: Track) => AudioClip): PoietekProject {
  return {
    ...project,
    updatedAt: new Date().toISOString(),
    tracks: project.tracks.map((track) => ({...track, clips: track.clips.map((clip) => ids.has(clip.id) ? update(clip, track) : clip)})),
  };
}

function findClip(project: PoietekProject, id: string) {
  for (const track of project.tracks) {
    const clip = track.clips.find((candidate) => candidate.id === id);
    if (clip) return {track, clip};
  }
  return null;
}

export function moveAudioClips(project: PoietekProject, clipIds: string[], deltaTicks: number): CoreEditResult {
  const unique = new Set(clipIds);
  if (!unique.size) return failure(project, 'NO_SELECTION', 'Select at least one audio clip.');
  const selected = [...unique].map((id) => findClip(project, id));
  if (selected.some((item) => !item)) return failure(project, 'CLIP_NOT_FOUND', 'Every selected clip must exist.');
  if (selected.some((item) => item && item.clip.startTick + deltaTicks < 0)) return failure(project, 'NEGATIVE_POSITION', 'A clip cannot move before project start.');
  return {ok: true, project: updateClips(project, unique, (clip) => ({...clip, startTick: clip.startTick + deltaTicks})), changedClipIds: [...unique]};
}

export function slipAudioClip(project: PoietekProject, clipId: string, deltaSeconds: number): CoreEditResult {
  if (!Number.isFinite(deltaSeconds)) return failure(project, 'INVALID_SLIP', 'Slip offset must be finite.');
  const found = findClip(project, clipId);
  if (!found) return failure(project, 'CLIP_NOT_FOUND', 'Audio clip was not found.');
  const asset = project.assets.find((candidate) => candidate.id === found.clip.assetId);
  const nextOffset = found.clip.sourceOffsetSeconds + deltaSeconds;
  if (nextOffset < 0) return failure(project, 'SOURCE_BEFORE_START', 'Slip cannot move before the source start.');
  if (asset?.durationSeconds !== null && asset?.durationSeconds !== undefined) {
    const sourceDuration = found.clip.sourceDurationSeconds ?? asset.durationSeconds - found.clip.sourceOffsetSeconds;
    if (nextOffset + sourceDuration > asset.durationSeconds + 1e-9) return failure(project, 'SOURCE_AFTER_END', 'Slip would move the clip beyond the source media.');
  }
  return {ok: true, project: updateClips(project, new Set([clipId]), (clip) => ({...clip, sourceOffsetSeconds: nextOffset})), changedClipIds: [clipId]};
}

export function rippleTrimAudioClipEnd(project: PoietekProject, clipId: string, nextDurationTicks: number): CoreEditResult {
  if (!Number.isInteger(nextDurationTicks) || nextDurationTicks <= 0) return failure(project, 'INVALID_DURATION', 'Ripple duration must be a positive whole tick value.');
  const found = findClip(project, clipId);
  if (!found) return failure(project, 'CLIP_NOT_FOUND', 'Audio clip was not found.');
  const delta = nextDurationTicks - found.clip.durationTicks;
  const oldEnd = found.clip.startTick + found.clip.durationTicks;
  const affected = found.track.clips.filter((clip) => clip.id === clipId || clip.startTick >= oldEnd).map((clip) => clip.id);
  const affectedIds = new Set(affected);
  if (found.track.clips.some((clip) => clip.startTick >= oldEnd && clip.startTick + delta < 0)) return failure(project, 'NEGATIVE_POSITION', 'Ripple would move a clip before project start.');
  const nextProject = updateClips(project, affectedIds, (clip) => clip.id === clipId ? {...clip, durationTicks: nextDurationTicks} : {...clip, startTick: clip.startTick + delta});
  return {ok: true, project: nextProject, changedClipIds: affected};
}

export function setAudioClipCrossfade(project: PoietekProject, leftClipId: string, rightClipId: string, durationSeconds: number): CoreEditResult {
  if (!Number.isFinite(durationSeconds) || durationSeconds < 0) return failure(project, 'INVALID_CROSSFADE', 'Crossfade duration must be a non-negative finite value.');
  const left = findClip(project, leftClipId);
  const right = findClip(project, rightClipId);
  if (!left || !right) return failure(project, 'CLIP_NOT_FOUND', 'Both crossfade clips must exist.');
  if (left.track.id !== right.track.id) return failure(project, 'TRACK_MISMATCH', 'Crossfade clips must be on the same track.');
  if (left.clip.startTick > right.clip.startTick) return setAudioClipCrossfade(project, rightClipId, leftClipId, durationSeconds);
  const ids = new Set([leftClipId, rightClipId]);
  const nextProject = updateClips(project, ids, (clip) => clip.id === leftClipId ? {...clip, fadeOutSeconds: durationSeconds} : {...clip, fadeInSeconds: durationSeconds});
  return {ok: true, project: nextProject, changedClipIds: [leftClipId, rightClipId]};
}

const clamp = (value: number, minimum: number, maximum: number) => Math.max(minimum, Math.min(maximum, value));

function mapMidiEvents(clip: MidiClipRecord, map: (event: MidiEventRecord) => MidiEventRecord): MidiClipRecord {
  return {...clip, events: clip.events.map(map).sort((a, b) => a.tick - b.tick)};
}

export function quantizeMidiClip(clip: MidiClipRecord, gridTicks: number, strength = 1): MidiClipRecord {
  if (!Number.isInteger(gridTicks) || gridTicks <= 0) throw new Error('Quantize grid must be a positive whole tick value.');
  const amount = clamp(strength, 0, 1);
  return mapMidiEvents(clip, (event) => {
    const target = Math.round(event.tick / gridTicks) * gridTicks;
    return {...event, tick: Math.max(0, Math.round(event.tick + (target - event.tick) * amount))};
  });
}

export function transposeMidiClip(clip: MidiClipRecord, semitones: number): MidiClipRecord {
  if (!Number.isInteger(semitones)) throw new Error('Transpose amount must be a whole semitone value.');
  return mapMidiEvents(clip, (event) => event.type === 'note' || event.type === 'poly_pressure' ? {...event, note: clamp(event.note + semitones, 0, 127)} : event);
}

export function scaleMidiVelocity(clip: MidiClipRecord, factor: number, offset = 0): MidiClipRecord {
  if (!Number.isFinite(factor) || !Number.isFinite(offset)) throw new Error('Velocity transform values must be finite.');
  return mapMidiEvents(clip, (event) => event.type === 'note' ? {...event, velocity: Math.round(clamp(event.velocity * factor + offset, 1, 127))} : event);
}
