import {CREATIVE_TOOLKIT_SCHEMA_VERSION, type HarmonyPadBank} from './contracts';

const scales = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  pentatonic_minor: [0, 3, 5, 7, 10],
} as const;

const noteNames = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];

export function createHarmonyPadBank(input: {
  id: string;
  rootMidiNote: number;
  scale: keyof typeof scales;
  octave: number;
  voicing: 'triad' | 'seventh' | 'single_note';
  padCount?: number;
}): HarmonyPadBank {
  const padCount = input.padCount ?? 16;
  if (!Number.isInteger(input.rootMidiNote) || input.rootMidiNote < 0 || input.rootMidiNote > 127) throw new RangeError('Root MIDI note must be between 0 and 127.');
  if (!Number.isInteger(padCount) || padCount < 1 || padCount > 128) throw new RangeError('Pad count must be between 1 and 128.');
  const intervals = scales[input.scale];
  const chordSize = input.voicing === 'single_note' ? 1 : input.voicing === 'triad' ? 3 : 4;
  const pads = Array.from({length: padCount}, (_, index) => {
    const degree = index % intervals.length;
    const octaveOffset = Math.floor(index / intervals.length) * 12;
    const notes = Array.from({length: chordSize}, (_, voice) => {
      const scaleIndex = degree + voice * 2;
      const interval = intervals[scaleIndex % intervals.length] + Math.floor(scaleIndex / intervals.length) * 12;
      return Math.min(127, input.rootMidiNote + octaveOffset + interval);
    });
    return {
      id: `${input.id}:pad:${index + 1}`,
      bank: Math.floor(index / 16),
      pad: index % 16,
      midiNotes: notes,
      label: notes.map((note) => noteNames[note % 12]).join('·'),
    };
  });
  return {...input, schemaVersion: CREATIVE_TOOLKIT_SCHEMA_VERSION, pads};
}
