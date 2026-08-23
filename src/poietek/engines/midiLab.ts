import type {PoietekProject, Track} from '../domain/types';
import {availableCapability} from '../platform';
import type {
  MidiClipRecord,
  MidiEventRecord,
  MidiTransformationKind,
  MidiTransformationRecord,
  ProductionEngineReadiness,
} from './contracts';
import {createProductionEngineReadiness} from './defaults';
import {quantizeMidiClip, scaleMidiVelocity, transposeMidiClip} from './editEngine';
import {readProductionEngineReadiness, withProductionEngineReadiness} from './extension';

export const NOTE_FORGE_IMPLEMENTATION_ID = 'poietek.core.note-forge.v1' as const;

export type MusicalScale = 'major' | 'minor' | 'minor_pentatonic';

export type NoteForgeOperationInput =
  | {id: string; outputClipId: string; sourceClipId: string; outputName: string; kind: 'quantize'; gridTicks: number; strength: number; observedAt?: string}
  | {id: string; outputClipId: string; sourceClipId: string; outputName: string; kind: 'humanize'; seed: number; timingTicks: number; velocityAmount: number; observedAt?: string}
  | {id: string; outputClipId: string; sourceClipId: string; outputName: string; kind: 'transpose'; semitones: number; observedAt?: string}
  | {id: string; outputClipId: string; sourceClipId: string; outputName: string; kind: 'velocity'; factor: number; offset: number; observedAt?: string}
  | {id: string; outputClipId: string; sourceClipId: string; outputName: string; kind: 'scale_constrain'; rootNote: number; scale: MusicalScale; observedAt?: string}
  | {id: string; outputClipId: string; sourceClipId: string; outputName: string; kind: 'legato'; gapTicks: number; observedAt?: string}
  | {id: string; outputClipId: string; trackId: string; outputName: string; kind: 'rhythm_generate'; seed: number; rootNote: number; stepCount: number; pulses: number; stepTicks: number; observedAt?: string}
  | {id: string; outputClipId: string; trackId: string; outputName: string; kind: 'chord_generate'; seed: number; rootNote: number; scale: MusicalScale; chordCount: number; chordTicks: number; observedAt?: string};

export interface NoteForgePlan {
  ready: boolean;
  issues: string[];
  operationId: string;
  kind: MidiTransformationKind;
  sourceClipIds: string[];
  outputClip: MidiClipRecord | null;
  claim: string;
}

export interface CreateStarterMidiClipInput {
  trackId: string;
  clipId: string;
  trackName?: string;
  clipName?: string;
  startTick?: number;
  observedAt?: string;
}

const scaleIntervals: Record<MusicalScale, readonly number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  minor_pentatonic: [0, 3, 5, 7, 10],
};

const clamp = (value: number, minimum: number, maximum: number) => Math.max(minimum, Math.min(maximum, value));
const integer = (value: number) => Number.isSafeInteger(value);
const sortEvents = (events: MidiEventRecord[]) => [...events].sort((a, b) => a.tick - b.tick || ('note' in a ? a.note : 0) - ('note' in b ? b.note : 0));

function fitEventsInsideClip(clip: MidiClipRecord): MidiClipRecord {
  return {
    ...clip,
    events: sortEvents(clip.events.map((event) => {
      const tick = clamp(Math.round(event.tick), 0, clip.durationTicks - 1);
      if (event.type !== 'note') return {...event, tick};
      return {...event, tick, durationTicks: clamp(Math.round(event.durationTicks), 1, clip.durationTicks - tick)};
    })),
  };
}

function nextUnit(seed: number, index: number): number {
  let value = (Math.trunc(seed) ^ Math.imul(index + 1, 0x9e3779b1)) | 0;
  value = Math.imul(value ^ (value >>> 16), 0x21f0aaad);
  value = Math.imul(value ^ (value >>> 15), 0x735a2d97);
  return ((value ^ (value >>> 15)) >>> 0) / 0x100000000;
}

function cloneReadiness(project: PoietekProject, now: string): ProductionEngineReadiness {
  const result = readProductionEngineReadiness(project);
  if (result.state === 'invalid') throw new Error(`Production engine state is invalid: ${result.issues.map((issue) => issue.message).join(' ')}`);
  if (result.state === 'unsupported_version') throw new Error(`Production engine schema ${result.schemaVersion ?? 'unknown'} is unsupported.`);
  const readiness = result.state === 'ready'
    ? structuredClone(result.readiness)
    : createProductionEngineReadiness(project.id, 'web', now);
  readiness.midiScoring.clipEditingCapability = availableCapability(
    'engine.midi.clip_editing',
    NOTE_FORGE_IMPLEMENTATION_ID,
    now,
    'local',
    {
      operation: 'deterministic_project_midi_clip_variations',
      projectUndo: true,
      audiblePlayback: false,
      retrospectiveInputCapture: false,
      networkSync: false,
    },
  );
  return readiness;
}

function requireMidiTrack(project: PoietekProject, trackId: string): Track {
  const track = project.tracks.find((candidate) => candidate.id === trackId);
  if (!track) throw new Error('The target MIDI track does not exist.');
  if (track.type !== 'midi' && track.type !== 'instrument') throw new Error('Note Forge can only write to a MIDI or instrument track.');
  return track;
}

function completeMutation(project: PoietekProject, readiness: ProductionEngineReadiness, now: string): PoietekProject {
  readiness.revision += 1;
  readiness.updatedAt = now;
  return withProductionEngineReadiness({...project, updatedAt: now}, readiness);
}

function validateIdentity(value: string, label: string): void {
  if (!value.trim()) throw new Error(`${label} is required.`);
}

export function listProjectMidiClips(project: PoietekProject): MidiClipRecord[] {
  const result = readProductionEngineReadiness(project);
  if (result.state === 'missing') return [];
  if (result.state !== 'ready') throw new Error('The project MIDI engine state is unavailable or invalid.');
  return structuredClone(result.readiness.midiScoring.clips);
}

export function createStarterMidiClip(project: PoietekProject, input: CreateStarterMidiClipInput): PoietekProject {
  validateIdentity(input.trackId, 'Track id');
  validateIdentity(input.clipId, 'Clip id');
  const now = input.observedAt ?? new Date().toISOString();
  const readiness = cloneReadiness(project, now);
  if (readiness.midiScoring.clips.some((clip) => clip.id === input.clipId)) throw new Error('The MIDI clip id already exists.');
  let tracks = project.tracks;
  let track = tracks.find((candidate) => candidate.id === input.trackId);
  if (!track) {
    track = {
      id: input.trackId,
      type: 'midi',
      name: input.trackName?.trim() || 'Note Forge Ideas',
      order: tracks.length,
      color: '#62d7c4',
      clips: [],
      mixer: {gainDb: 0, pan: 0, mute: false, solo: false},
    };
    tracks = [...tracks, track];
  } else if (track.type !== 'midi' && track.type !== 'instrument') {
    throw new Error('The starter clip target must be a MIDI or instrument track.');
  }
  const beat = project.settings.ppq;
  const duration = beat * 4;
  const offsets = [0, 3, 5, 7];
  const velocities = [104, 82, 94, 88];
  readiness.midiScoring.clips.push({
    id: input.clipId,
    trackId: track.id,
    name: input.clipName?.trim() || 'Starter pulse',
    startTick: input.startTick ?? 0,
    durationTicks: duration,
    loopStartTick: 0,
    loopEndTick: duration,
    events: [0, 1, 2, 3].map((step) => ({
      tick: step * beat,
      type: 'note' as const,
      channel: 0,
      note: 60 + offsets[step]!,
      velocity: velocities[step]!,
      durationTicks: Math.max(1, Math.round(beat * 0.72)),
      releaseVelocity: null,
      noteId: null,
    })),
  });
  return completeMutation({...project, tracks}, readiness, now);
}

function humanize(clip: MidiClipRecord, seed: number, timingTicks: number, velocityAmount: number): MidiClipRecord {
  if (!integer(timingTicks) || timingTicks < 0) throw new Error('Humanize timing must be a non-negative whole tick value.');
  if (!integer(velocityAmount) || velocityAmount < 0 || velocityAmount > 127) throw new Error('Humanize velocity must be a whole value from 0 to 127.');
  return {
    ...clip,
    events: sortEvents(clip.events.map((event, index) => {
      const timing = Math.round((nextUnit(seed, index * 2) * 2 - 1) * timingTicks);
      const tickLimit = event.type === 'note' ? clip.durationTicks - event.durationTicks : clip.durationTicks - 1;
      const tick = clamp(event.tick + timing, 0, Math.max(0, tickLimit));
      if (event.type !== 'note') return {...event, tick};
      const velocity = Math.round(clamp(event.velocity + (nextUnit(seed, index * 2 + 1) * 2 - 1) * velocityAmount, 1, 127));
      return {...event, tick, velocity};
    })),
  };
}

function constrainToScale(clip: MidiClipRecord, rootNote: number, scale: MusicalScale): MidiClipRecord {
  if (!integer(rootNote) || rootNote < 0 || rootNote > 127) throw new Error('Scale root must be a MIDI note from 0 to 127.');
  const allowed = scaleIntervals[scale];
  if (!allowed) throw new Error('The requested musical scale is unavailable.');
  const constrain = (note: number) => {
    let best = note;
    let distance = Number.POSITIVE_INFINITY;
    for (let candidate = 0; candidate <= 127; candidate += 1) {
      const relative = ((candidate - rootNote) % 12 + 12) % 12;
      if (!allowed.includes(relative)) continue;
      const candidateDistance = Math.abs(candidate - note);
      if (candidateDistance < distance || (candidateDistance === distance && candidate < best)) {
        best = candidate;
        distance = candidateDistance;
      }
    }
    return best;
  };
  return {...clip, events: clip.events.map((event) => event.type === 'note' || event.type === 'poly_pressure' ? {...event, note: constrain(event.note)} : event)};
}

function applyLegato(clip: MidiClipRecord, gapTicks: number): MidiClipRecord {
  if (!integer(gapTicks) || gapTicks < 0) throw new Error('Legato gap must be a non-negative whole tick value.');
  const events = sortEvents(clip.events);
  return {...clip, events: events.map((event, index) => {
    if (event.type !== 'note') return event;
    const next = events.slice(index + 1).find((candidate) => candidate.type === 'note' && candidate.channel === event.channel);
    const endTick = next ? Math.max(event.tick + 1, next.tick - gapTicks) : clip.durationTicks;
    return {...event, durationTicks: Math.max(1, endTick - event.tick)};
  })};
}

function euclideanPulse(step: number, stepCount: number, pulses: number, rotation: number): boolean {
  const current = (step + rotation) % stepCount;
  return Math.floor((current + 1) * pulses / stepCount) !== Math.floor(current * pulses / stepCount);
}

function generateRhythm(input: Extract<NoteForgeOperationInput, {kind: 'rhythm_generate'}>): MidiClipRecord {
  if (!integer(input.stepCount) || input.stepCount < 4 || input.stepCount > 64) throw new Error('Rhythm steps must be a whole value from 4 to 64.');
  if (!integer(input.pulses) || input.pulses < 1 || input.pulses > input.stepCount) throw new Error('Rhythm pulses must fit within the step count.');
  if (!integer(input.stepTicks) || input.stepTicks <= 0) throw new Error('Rhythm step length must be a positive whole tick value.');
  if (!integer(input.rootNote) || input.rootNote < 0 || input.rootNote > 127) throw new Error('Rhythm note must be from 0 to 127.');
  const durationTicks = input.stepCount * input.stepTicks;
  const rotation = Math.floor(nextUnit(input.seed, 0) * input.stepCount);
  const events: MidiEventRecord[] = [];
  for (let step = 0; step < input.stepCount; step += 1) {
    if (!euclideanPulse(step, input.stepCount, input.pulses, rotation)) continue;
    events.push({
      tick: step * input.stepTicks,
      type: 'note',
      channel: 0,
      note: input.rootNote,
      velocity: Math.round(72 + nextUnit(input.seed, step + 1) * 42),
      durationTicks: Math.max(1, Math.round(input.stepTicks * 0.56)),
      releaseVelocity: null,
      noteId: null,
    });
  }
  return {id: input.outputClipId, trackId: input.trackId, name: input.outputName, startTick: 0, durationTicks, loopStartTick: 0, loopEndTick: durationTicks, events};
}

function generateChords(input: Extract<NoteForgeOperationInput, {kind: 'chord_generate'}>): MidiClipRecord {
  if (!integer(input.chordCount) || input.chordCount < 1 || input.chordCount > 16) throw new Error('Chord count must be a whole value from 1 to 16.');
  if (!integer(input.chordTicks) || input.chordTicks <= 0) throw new Error('Chord length must be a positive whole tick value.');
  if (!integer(input.rootNote) || input.rootNote < 0 || input.rootNote > 115) throw new Error('Chord root must be a MIDI note from 0 to 115.');
  const intervals = scaleIntervals[input.scale];
  if (!intervals) throw new Error('The requested chord scale is unavailable.');
  const durationTicks = input.chordCount * input.chordTicks;
  const events: MidiEventRecord[] = [];
  for (let chord = 0; chord < input.chordCount; chord += 1) {
    const degree = Math.floor(nextUnit(input.seed, chord) * intervals.length);
    const degrees = [degree, degree + 2, degree + 4];
    degrees.forEach((scaleDegree, voice) => {
      const octave = Math.floor(scaleDegree / intervals.length) * 12;
      const note = clamp(input.rootNote + intervals[scaleDegree % intervals.length]! + octave, 0, 127);
      events.push({tick: chord * input.chordTicks, type: 'note', channel: 0, note, velocity: 92 - voice * 7, durationTicks: input.chordTicks, releaseVelocity: null, noteId: null});
    });
  }
  return {id: input.outputClipId, trackId: input.trackId, name: input.outputName, startTick: 0, durationTicks, loopStartTick: 0, loopEndTick: durationTicks, events: sortEvents(events)};
}

export function planProjectMidiOperation(project: PoietekProject, input: NoteForgeOperationInput): NoteForgePlan {
  const issues: string[] = [];
  const generator = input.kind === 'rhythm_generate' || input.kind === 'chord_generate';
  try {
    validateIdentity(input.id, 'Operation id');
    validateIdentity(input.outputClipId, 'Output clip id');
    validateIdentity(input.outputName, 'Output clip name');
    const existing = listProjectMidiClips(project);
    if (existing.some((clip) => clip.id === input.outputClipId)) throw new Error('The output MIDI clip id already exists.');
    let output: MidiClipRecord;
    let sourceClipIds: string[] = [];
    if (generator) {
      requireMidiTrack(project, input.trackId);
      output = input.kind === 'rhythm_generate' ? generateRhythm(input) : generateChords(input);
    } else {
      const source = existing.find((clip) => clip.id === input.sourceClipId);
      if (!source) throw new Error('Select a canonical MIDI source clip first.');
      requireMidiTrack(project, source.trackId);
      sourceClipIds = [source.id];
      if (input.kind === 'quantize') output = quantizeMidiClip(source, input.gridTicks, input.strength);
      else if (input.kind === 'humanize') output = humanize(source, input.seed, input.timingTicks, input.velocityAmount);
      else if (input.kind === 'transpose') output = transposeMidiClip(source, input.semitones);
      else if (input.kind === 'velocity') output = scaleMidiVelocity(source, input.factor, input.offset);
      else if (input.kind === 'scale_constrain') output = constrainToScale(source, input.rootNote, input.scale);
      else output = applyLegato(source, input.gapTicks);
      output = fitEventsInsideClip({...output, id: input.outputClipId, name: input.outputName, startTick: source.startTick + source.durationTicks});
    }
    return {
      ready: true,
      issues,
      operationId: input.id,
      kind: input.kind,
      sourceClipIds,
      outputClip: output,
      claim: generator
        ? 'A deterministic local MIDI pattern was generated from the visible constraints. It has not been played, exported or sent to hardware.'
        : 'A non-destructive MIDI variation was derived from the source clip. The source remains unchanged and the preview has not been played or sent to hardware.',
    };
  } catch (error) {
    issues.push(error instanceof Error ? error.message : String(error));
    return {ready: false, issues, operationId: input.id, kind: input.kind, sourceClipIds: [], outputClip: null, claim: 'No project MIDI data was changed.'};
  }
}

export function commitProjectMidiOperation(project: PoietekProject, input: NoteForgeOperationInput): PoietekProject {
  const plan = planProjectMidiOperation(project, input);
  if (!plan.ready || !plan.outputClip) throw new Error(plan.issues.join(' ') || 'The MIDI operation is not ready.');
  const now = input.observedAt ?? new Date().toISOString();
  const readiness = cloneReadiness(project, now);
  if (readiness.midiScoring.transformations.some((record) => record.id === input.id)) throw new Error('The MIDI operation id already exists.');
  readiness.midiScoring.clips.push(plan.outputClip);
  const record: MidiTransformationRecord = {
    id: input.id,
    kind: input.kind,
    status: 'applied',
    sourceClipIds: plan.sourceClipIds,
    outputClipIds: [plan.outputClip.id],
    undoCommandId: `${input.id}.project-undo.${readiness.revision + 1}`,
  };
  readiness.midiScoring.transformations.push(record);
  return completeMutation(project, readiness, now);
}
