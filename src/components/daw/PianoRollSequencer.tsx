import React, { useState } from 'react';
import { Grid, Play, Plus, RefreshCw, Scissors, Volume2, Wand2 } from 'lucide-react';
import { audioEngine } from '../../audio/engine';

export const PianoRollSequencer: React.FC = () => {
  const [selectedPattern, setSelectedPattern] = useState<string>('Pattern 1');
  const [activeNotes, setActiveNotes] = useState<Record<string, boolean>>({
    '0-36': true,
    '4-38': true,
    '8-36': true,
    '12-42': true,
  });

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
    setActiveNotes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6 font-mono select-none">
      {/* Header */}
      <div className="bg-gradient-to-r from-neutral-900 via-stone-900 to-neutral-900 border-2 border-neutral-700 rounded-2xl p-5 shadow-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center text-indigo-400">
            <Grid className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
              PIANO ROLL & PATTERN SEQUENCER TIMELINE
            </h2>
            <p className="text-xs text-neutral-400">
              Studio Pro 1/16th step note grid with velocity lanes, pitch roll & polyphonic drawing.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
        </div>
      </div>

      {/* Main Piano Roll Layout */}
      <div className="bg-neutral-950 border-2 border-neutral-700 rounded-3xl p-6 shadow-2xl space-y-4">
        {/* Step Numbers Top Bar */}
        <div className="flex items-center pl-24 pr-2">
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

        {/* Note Grid Rows */}
        <div className="space-y-1">
          {notesList.map((n) => (
            <div key={n.pitch} className="flex items-center h-8 gap-1">
              {/* Left Piano Key Label */}
              <div
                className={`w-20 h-full rounded-lg border flex items-center justify-between px-2 text-xs font-black shadow ${
                  n.isBlack
                    ? 'bg-neutral-900 border-neutral-800 text-neutral-400'
                    : 'bg-neutral-200 border-neutral-300 text-neutral-950'
                }`}
              >
                <span>{n.note}</span>
                <span className="text-[9px] opacity-70">#{n.pitch}</span>
              </div>

              {/* 16 Step Cells */}
              <div className="flex-1 flex gap-1 h-full">
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
      </div>
    </div>
  );
};
