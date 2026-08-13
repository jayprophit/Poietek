import React, { useState } from 'react';
import {
  Grid,
  Play,
  Plus,
  RefreshCw,
  Scissors,
  Volume2,
  Wand2,
  Download,
  Upload,
  Sparkles,
  Zap,
  Music,
  SlidersHorizontal,
} from 'lucide-react';
import { audioEngine } from '../../audio/engine';

interface ChordPreset {
  name: string;
  genre: string;
  description: string;
  notesMap: Record<string, boolean>;
}

const MIDI_PROGRESSIONS: ChordPreset[] = [
  {
    name: 'Neo-Soul Jazz 9ths',
    genre: 'R&B / Soul',
    description: 'Silky lush Cmaj9 - Am9 - Dm9 - G13 extended harmonic movement.',
    notesMap: {
      '0-60': true, '0-64': true, '0-67': true, '0-71': true,
      '4-60': true, '4-64': true, '4-67': true, '4-72': true,
      '8-62': true, '8-65': true, '8-69': true, '8-72': true,
      '12-67': true, '12-71': true, '12-62': true, '12-65': true,
    },
  },
  {
    name: 'Trap Dark Minor Drill',
    genre: 'Trap / Drill',
    description: 'Aggressive Moody Cm - Ab - Fm - G7 sequence with fast rolls.',
    notesMap: {
      '0-60': true, '0-63': true, '0-67': true,
      '2-60': true, '2-63': true, '2-67': true,
      '4-68': true, '4-60': true, '4-63': true,
      '8-65': true, '8-68': true, '8-60': true,
      '12-67': true, '12-71': true, '12-62': true, '12-65': true,
    },
  },
  {
    name: 'Synthwave Cyberpunk 80s',
    genre: 'Synthwave',
    description: 'Retro Arpeggiated Drive Am - F - C - G with pumping octaves.',
    notesMap: {
      '0-69': true, '1-60': true, '2-69': true, '3-60': true,
      '4-65': true, '5-60': true, '6-65': true, '7-60': true,
      '8-72': true, '9-64': true, '10-72': true, '11-64': true,
      '12-67': true, '13-62': true, '14-67': true, '15-62': true,
    },
  },
  {
    name: 'Lofi Chill Hop Nostalgia',
    genre: 'Lo-Fi / Chill',
    description: 'Warm dusty tape Cmaj7 - Em7 - Dm7 - G7 jazz chord progression.',
    notesMap: {
      '0-60': true, '0-64': true, '0-67': true, '0-71': true,
      '4-64': true, '4-67': true, '4-71': true,
      '8-62': true, '8-65': true, '8-69': true, '8-72': true,
      '12-67': true, '12-71': true, '12-62': true, '12-65': true,
    },
  },
];

export const PianoRollSequencer: React.FC = () => {
  const [selectedPattern, setSelectedPattern] = useState<string>('Pattern 1');
  const [activeNotes, setActiveNotes] = useState<Record<string, boolean>>({
    '0-60': true,
    '0-64': true,
    '0-67': true,
    '4-62': true,
    '4-65': true,
    '4-69': true,
    '8-64': true,
    '8-67': true,
    '8-71': true,
    '12-60': true,
    '12-64': true,
    '12-67': true,
  });

  const [velocities, setVelocities] = useState<number[]>(
    Array(16).fill(100)
  );

  const notesList = [
    { note: 'C5', pitch: 72, isBlack: false },
    { note: 'B4', pitch: 71, isBlack: false },
    { note: 'A♯4', pitch: 70, isBlack: true },
    { note: 'A4', pitch: 69, isBlack: false },
    { note: 'G♯4', pitch: 68, isBlack: true },
    { note: 'G4', pitch: 67, isBlack: false },
    { note: 'F♯4', pitch: 66, isBlack: true },
    { note: 'F4', pitch: 65, isBlack: false },
    { note: 'E4', pitch: 64, isBlack: false },
    { note: 'D♯4', pitch: 63, isBlack: true },
    { note: 'D4', pitch: 62, isBlack: false },
    { note: 'C♯4', pitch: 61, isBlack: true },
    { note: 'C4', pitch: 60, isBlack: false },
  ];

  const stepsCount = 16;

  const toggleNote = (stepIdx: number, pitch: number) => {
    audioEngine.initAudio();
    audioEngine.triggerMetronome(stepIdx % 4 === 0);
    const key = `${stepIdx}-${pitch}`;
    const nextState = !activeNotes[key];
    setActiveNotes((prev) => ({ ...prev, [key]: nextState }));

    if (nextState) {
      audioEngine.playSampleAudition(
        'sawtooth',
        440 * Math.pow(2, (pitch - 69) / 12),
        ((velocities[stepIdx] || 100) / 100) * 0.6
      );
    }
  };

  const handleInjectProgression = (preset: ChordPreset) => {
    audioEngine.initAudio();
    setActiveNotes(preset.notesMap);
  };

  const handleHumanize = () => {
    audioEngine.initAudio();
    const newVels = velocities.map((v) =>
      Math.min(127, Math.max(40, v + Math.floor((Math.random() - 0.5) * 30)))
    );
    setVelocities(newVels);
  };

  const handleClear = () => {
    setActiveNotes({});
  };

  const handleExportMIDI = () => {
    const midiData = {
      title: `${selectedPattern}_MIDI_Sequence`,
      bpm: 120,
      timeSignature: '4/4',
      activeNotes,
      velocities,
    };
    const blob = new Blob([JSON.stringify(midiData, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${selectedPattern}_Reason_MIDI.json`;
    a.click();
  };

  const handleImportMIDI = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.activeNotes) {
          setActiveNotes(parsed.activeNotes);
        }
        if (parsed.velocities && Array.isArray(parsed.velocities)) {
          setVelocities(parsed.velocities);
        }
      } catch (err) {
        console.error('Invalid MIDI file', err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6 font-mono select-none">
      {/* Header */}
      <div className="bg-gradient-to-r from-neutral-900 via-stone-900 to-neutral-900 border-2 border-neutral-700 rounded-2xl p-5 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center text-indigo-400 shadow">
            <Grid className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
              PIANO ROLL & MIDI HARMONY SEQUENCER
            </h2>
            <p className="text-xs text-neutral-400">
              Polyphonic 16-step grid, chord progression generator, velocity lanes & MIDI export/import.
            </p>
          </div>
        </div>

        {/* Pattern & Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {['Pattern 1', 'Pattern 2', 'Pattern 3'].map((pat) => (
            <button
              key={pat}
              onClick={() => setSelectedPattern(pat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                selectedPattern === pat
                  ? 'bg-indigo-600 text-white border-indigo-400 font-black shadow'
                  : 'bg-neutral-800 text-neutral-400 border-neutral-700'
              }`}
            >
              {pat}
            </button>
          ))}

          <button
            onClick={handleHumanize}
            className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500 hover:text-neutral-950 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-black transition flex items-center gap-1 shadow"
            title="Humanize velocity and micro-groove"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>HUMANIZE</span>
          </button>

          <button
            onClick={handleClear}
            className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-xl text-xs font-black transition flex items-center gap-1"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>CLEAR</span>
          </button>

          <button
            onClick={handleExportMIDI}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1 shadow"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT MIDI</span>
          </button>

          <label className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>IMPORT MIDI</span>
            <input type="file" accept=".json,.mid" onChange={handleImportMIDI} className="hidden" />
          </label>
        </div>
      </div>

      {/* Preset Chord Progressions Row */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Wand2 className="w-4 h-4" />
            <span>SMART CHORD PROGRESSION GENERATOR & HARMONY INJECTOR</span>
          </span>
          <span className="text-[10px] text-neutral-500 uppercase">1-CLICK PIANO ROLL POPULATION</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {MIDI_PROGRESSIONS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handleInjectProgression(preset)}
              className="p-3 bg-neutral-950 hover:bg-indigo-950/80 border border-neutral-800 hover:border-indigo-500 rounded-xl text-left transition group space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-xs text-white group-hover:text-indigo-300 uppercase">
                  {preset.name}
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold">
                  {preset.genre}
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 leading-tight">{preset.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Piano Roll Layout */}
      <div className="bg-neutral-950 border-2 border-neutral-700 rounded-3xl p-2 sm:p-4 shadow-2xl overflow-auto max-w-full touch-pan-x touch-pan-y scrollbar-thin scrollbar-thumb-stone-700 space-y-4">
        <div className="min-w-[720px] space-y-2">
          {/* Step Numbers Top Bar */}
          <div className="flex items-center sticky top-0 z-20 bg-neutral-950 pb-2 border-b border-neutral-800">
            {/* Corner Box for Piano Key Header */}
            <div className="w-20 shrink-0 sticky left-0 z-30 bg-neutral-950 text-[10px] font-black text-amber-400 uppercase tracking-wider px-1">
              KEYS
            </div>

            {/* Step Numbers */}
            <div className="flex-1 flex items-center pl-2">
              {Array.from({ length: stepsCount }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 text-center text-[10px] font-bold ${
                    i % 4 === 0 ? 'text-amber-400 border-l border-amber-500/50' : 'text-neutral-600'
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          {/* Note Grid Rows */}
          <div className="space-y-1">
            {notesList.map((n) => (
              <div key={n.pitch} className="flex items-center h-7 gap-2">
                {/* Left Sticky Piano Key Label */}
                <div
                  className={`w-20 shrink-0 sticky left-0 z-20 h-full rounded-lg border flex items-center justify-between px-2 text-xs font-black shadow ${
                    n.isBlack
                      ? 'bg-neutral-900 border-neutral-800 text-neutral-400'
                      : 'bg-neutral-200 border-neutral-300 text-neutral-950'
                  }`}
                >
                  <span>{n.note}</span>
                  <span className="text-[9px] opacity-70">#{n.pitch}</span>
                </div>

                {/* 16 Step Cells */}
                <div className="flex-1 flex gap-1 h-full min-w-[600px]">
                  {Array.from({ length: stepsCount }).map((_, stepIdx) => {
                    const key = `${stepIdx}-${n.pitch}`;
                    const isActive = !!activeNotes[key];
                    const isBeatStart = stepIdx % 4 === 0;

                    return (
                      <button
                        key={stepIdx}
                        onClick={() => toggleNote(stepIdx, n.pitch)}
                        className={`flex-1 h-full rounded-md border transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-amber-500 to-amber-400 border-amber-200 shadow-md shadow-amber-500/30 scale-95'
                            : isBeatStart
                            ? 'bg-neutral-900 border-neutral-700 hover:border-amber-500'
                            : 'bg-neutral-950 border-neutral-800/80 hover:border-neutral-600'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Velocity Lane Section */}
          <div className="pt-4 border-t border-neutral-800 flex items-center gap-2">
            <div className="w-20 shrink-0 sticky left-0 z-20 text-[10px] font-black text-indigo-400 uppercase tracking-wider flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3" />
              <span>VELOCITY</span>
            </div>
            <div className="flex-1 flex gap-1 items-end h-16 bg-neutral-900/60 p-2 rounded-xl border border-neutral-800 min-w-[600px]">
              {velocities.map((vel, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end gap-1 group">
                  <div
                    className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t transition-all group-hover:from-amber-500 group-hover:to-amber-400 cursor-ns-resize"
                    style={{ height: `${(vel / 127) * 100}%` }}
                    onClick={() => {
                      const newVel = vel >= 120 ? 50 : vel + 25;
                      const copy = [...velocities];
                      copy[idx] = newVel;
                      setVelocities(copy);
                    }}
                  />
                  <span className="text-[8px] font-bold text-neutral-500 group-hover:text-amber-400">{vel}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

