import type {MidiClipRecord, MidiEventRecord} from '../engines/contracts';

export type PianoRollScale = 'major' | 'minor' | 'dorian' | 'mixolydian' | 'pentatonic';

export interface DetectedChord {
  tick: number;
  rootPitchClass: number;
  name: string;
  noteNumbers: number[];
}

const NOTE_NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'] as const;
const SCALE_INTERVALS: Record<PianoRollScale, readonly number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  pentatonic: [0, 2, 4, 7, 9],
};
const CHORDS: readonly {intervals: readonly number[]; suffix: string}[] = [
  {intervals: [0, 4, 7, 11], suffix: 'maj7'},
  {intervals: [0, 4, 7, 10], suffix: '7'},
  {intervals: [0, 3, 7, 10], suffix: 'm7'},
  {intervals: [0, 3, 6, 9], suffix: 'dim7'},
  {intervals: [0, 4, 7], suffix: ''},
  {intervals: [0, 3, 7], suffix: 'm'},
  {intervals: [0, 3, 6], suffix: 'dim'},
  {intervals: [0, 4, 8], suffix: 'aug'},
  {intervals: [0, 2, 7], suffix: 'sus2'},
  {intervals: [0, 5, 7], suffix: 'sus4'},
] as const;

const isNote = (event: MidiEventRecord): event is Extract<MidiEventRecord, {type: 'note'}> =>
  event.type === 'note';
const pitchClass = (note: number) => ((note % 12) + 12) % 12;
const eventSort = (left: MidiEventRecord, right: MidiEventRecord) =>
  left.tick - right.tick || (isNote(left) && isNote(right) ? left.note - right.note : left.type.localeCompare(right.type));

export function detectChords(clip: MidiClipRecord): DetectedChord[] {
  const groups = new Map<number, Extract<MidiEventRecord, {type: 'note'}>[]>();
  for (const event of clip.events) {
    if (!isNote(event)) continue;
    groups.set(event.tick, [...(groups.get(event.tick) ?? []), event]);
  }
  const detected: DetectedChord[] = [];
  for (const [tick, notes] of [...groups].sort(([left], [right]) => left - right)) {
    const classes = [...new Set(notes.map((event) => pitchClass(event.note)))].sort((a, b) => a - b);
    if (classes.length < 3) continue;
    let match: DetectedChord | null = null;
    for (const root of classes) {
      const relative = classes.map((value) => (value - root + 12) % 12).sort((a, b) => a - b);
      const definition = CHORDS.find((candidate) => candidate.intervals.length === relative.length
        && candidate.intervals.every((interval, index) => interval === relative[index]));
      if (definition) {
        match = {
          tick,
          rootPitchClass: root,
          name: `${NOTE_NAMES[root]}${definition.suffix}`,
          noteNumbers: notes.map((event) => event.note).sort((a, b) => a - b),
        };
        break;
      }
    }
    if (match) detected.push(match);
  }
  return detected;
}

export function strumMidiChords(
  clip: MidiClipRecord,
  spacingTicks: number,
  direction: 'up' | 'down' = 'up',
): MidiClipRecord {
  if (!Number.isInteger(spacingTicks) || spacingTicks < 0) {
    throw new Error('Strum spacing must be a non-negative whole tick value.');
  }
  const groups = new Map<number, Extract<MidiEventRecord, {type: 'note'}>[]>();
  clip.events.filter(isNote).forEach((event) => groups.set(event.tick, [...(groups.get(event.tick) ?? []), event]));
  const offsets = new Map<MidiEventRecord, number>();
  for (const notes of groups.values()) {
    if (notes.length < 2) continue;
    const ordered = [...notes].sort((left, right) => direction === 'up' ? left.note - right.note : right.note - left.note);
    ordered.forEach((event, index) => offsets.set(event, index * spacingTicks));
  }
  return {
    ...clip,
    events: clip.events.map((event) => {
      if (!isNote(event)) return {...event};
      const offset = offsets.get(event) ?? 0;
      return {
        ...event,
        tick: Math.min(Math.max(0, clip.durationTicks - 1), event.tick + offset),
        durationTicks: Math.max(1, Math.min(event.durationTicks, clip.durationTicks - Math.min(clip.durationTicks - 1, event.tick + offset))),
      };
    }).sort(eventSort),
  };
}

export function chopMidiNotes(clip: MidiClipRecord, segmentTicks: number): MidiClipRecord {
  if (!Number.isInteger(segmentTicks) || segmentTicks < 1) {
    throw new Error('Chop length must be a positive whole tick value.');
  }
  const events: MidiEventRecord[] = [];
  for (const event of clip.events) {
    if (!isNote(event) || event.durationTicks <= segmentTicks) {
      events.push({...event});
      continue;
    }
    for (let offset = 0; offset < event.durationTicks; offset += segmentTicks) {
      events.push({
        ...event,
        tick: event.tick + offset,
        durationTicks: Math.min(segmentTicks, event.durationTicks - offset),
        noteId: null,
      });
    }
  }
  return {...clip, events: events.sort(eventSort)};
}

export function glueMidiNotes(clip: MidiClipRecord, maximumGapTicks = 0): MidiClipRecord {
  if (!Number.isInteger(maximumGapTicks) || maximumGapTicks < 0) {
    throw new Error('Glue gap must be a non-negative whole tick value.');
  }
  const passthrough = clip.events.filter((event) => !isNote(event)).map((event) => ({...event}));
  const notes = clip.events.filter(isNote).map((event) => ({...event})).sort((left, right) =>
    left.channel - right.channel || left.note - right.note || left.tick - right.tick);
  const glued: Extract<MidiEventRecord, {type: 'note'}>[] = [];
  for (const note of notes) {
    const previous = glued[glued.length - 1];
    const previousEnd = previous ? previous.tick + previous.durationTicks : -1;
    if (previous && previous.channel === note.channel && previous.note === note.note
      && note.tick <= previousEnd + maximumGapTicks) {
      previous.durationTicks = Math.max(previousEnd, note.tick + note.durationTicks) - previous.tick;
      previous.noteId = null;
    } else {
      glued.push(note);
    }
  }
  return {...clip, events: [...passthrough, ...glued].sort(eventSort)};
}

export function constrainMidiClipToScale(
  clip: MidiClipRecord,
  rootPitchClass: number,
  scale: PianoRollScale,
): MidiClipRecord {
  if (!Number.isInteger(rootPitchClass) || rootPitchClass < 0 || rootPitchClass > 11) {
    throw new Error('Scale root must be a pitch class from 0 to 11.');
  }
  const allowed = new Set(SCALE_INTERVALS[scale].map((interval) => (rootPitchClass + interval) % 12));
  const nearest = (note: number): number => {
    if (allowed.has(pitchClass(note))) return note;
    for (let distance = 1; distance < 12; distance += 1) {
      const lower = note - distance;
      if (lower >= 0 && allowed.has(pitchClass(lower))) return lower;
      const upper = note + distance;
      if (upper <= 127 && allowed.has(pitchClass(upper))) return upper;
    }
    return note;
  };
  return {
    ...clip,
    events: clip.events.map((event) => isNote(event) || event.type === 'poly_pressure'
      ? {...event, note: nearest(event.note)}
      : {...event}).sort(eventSort),
  };
}

