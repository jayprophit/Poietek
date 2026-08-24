import React, { useState, useEffect } from 'react';
import { audioEngine } from '../../audio/engine';
import { Music, Sliders, Layers, Volume2, ShieldAlert } from 'lucide-react';

interface KeyboardWorkspaceProps {
  onSimulateMIDI: (type: 'note_on' | 'note_off', channel: number, note: number, velocity: number) => void;
}

export const KeyboardWorkspace: React.FC<KeyboardWorkspaceProps> = ({ onSimulateMIDI }) => {
  const [octave, setOctave] = useState<number>(4);
  const [keySize, setKeySize] = useState<number>(49);
  const [selectedWave, setSelectedWave] = useState<OscillatorType>('sawtooth');
  const [cutoff, setCutoff] = useState<number>(2500);
  const [pitchBend, setPitchBend] = useState<number>(0);
  const [modWheel, setModWheel] = useState<number>(20);
  const [sustain, setSustain] = useState<boolean>(false);
  const [activeScene, setActiveScene] = useState<string>('Scene 1: Synth Lead');

  // Interactive piano keys notes list (C3 to B5 depending on octave)
  const baseNote = octave * 12; // C4 = 60
  const whiteKeyOffsets = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21, 23, 24];
  const blackKeyOffsets: Record<number, number> = {
    0: 1, 1: 3, 3: 6, 4: 8, 5: 10,
    7: 13, 8: 15, 10: 18, 11: 20, 12: 22,
  };

  const scenes = [
    'Scene 1: Synth Lead',
    'Scene 2: DAW Mixer Controls',
    'Scene 3: Insert Effects Rack',
    'Scene 4: Global Transport',
    'Scene 5: Drum Pad Layer',
  ];

  const handleNoteOn = (noteNumber: number) => {
    audioEngine.triggerSynthNote(noteNumber, 110, selectedWave, cutoff);
    onSimulateMIDI('note_on', 1, noteNumber, 110);
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      {/* Keyboard Header Console */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Music className="w-5 h-5 text-purple-400" />
            Universal MIDI Keyboard Workspace
          </h2>
          <p className="text-xs text-slate-400">
            Supports 25 to 88-Key controllers, pitch/mod wheels, sustain, and multi-scene switching.
          </p>
        </div>

        {/* Keyboard Size & Octave Controls */}
        <div className="flex items-center gap-3 bg-slate-950 p-2 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-slate-400 mr-1">Keys:</span>
            {[25, 37, 49, 61, 88].map((size) => (
              <button
                key={size}
                onClick={() => setKeySize(size)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                  keySize === size
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {size}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
            <span className="text-xs font-bold text-slate-400">Octave:</span>
            <button
              onClick={() => setOctave((prev) => Math.max(1, prev - 1))}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold text-xs"
            >
              -
            </button>
            <span className="text-xs font-mono font-bold text-purple-300">C{octave}</span>
            <button
              onClick={() => setOctave((prev) => Math.min(7, prev + 1))}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold text-xs"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Hardware Scene Switcher Ribbon */}
      <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl flex items-center gap-2 overflow-x-auto">
        <Layers className="w-4 h-4 text-purple-400 ml-2" />
        <span className="text-xs font-bold text-slate-300 mr-2">Hardware Scenes:</span>
        {scenes.map((sc) => (
          <button
            key={sc}
            onClick={() => setActiveScene(sc)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              activeScene === sc
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            {sc}
          </button>
        ))}
      </div>

      {/* Main Piano Keybed & Expression Wheels */}
      <div className="bg-slate-950 border-2 border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
        {/* Synthesizer Engine Knobs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Oscillator Waveform</label>
            <select
              value={selectedWave}
              onChange={(e) => setSelectedWave(e.target.value as OscillatorType)}
              className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded p-2"
            >
              <option value="sawtooth">Sawtooth (Punchy Lead)</option>
              <option value="square">Square (Retro Chiptune)</option>
              <option value="sine">Sine (Smooth Sub)</option>
              <option value="triangle">Triangle (Warm Soft)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Lowpass Cutoff ({cutoff} Hz)
            </label>
            <input
              type="range"
              min="200"
              max="8000"
              step="50"
              value={cutoff}
              onChange={(e) => setCutoff(Number(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer"
            />
          </div>

          {/* Wheels Controls */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Modulation Wheel ({modWheel})</label>
            <input
              type="range"
              min="0"
              max="127"
              value={modWheel}
              onChange={(e) => setModWheel(Number(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <span className="text-xs font-bold text-slate-300">Sustain Pedal</span>
            <button
              onClick={() => setSustain(!sustain)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                sustain
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/40'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {sustain ? 'SUSTAIN ON' : 'PEDAL OFF'}
            </button>
          </div>
        </div>

        {/* Visual Keybed */}
        <div className="relative flex justify-center bg-slate-900 p-4 rounded-2xl border border-slate-800 overflow-x-auto min-h-[180px]">
          <div className="relative flex">
            {whiteKeyOffsets.map((offset, idx) => {
              const noteNum = baseNote + offset;
              const hasBlack = blackKeyOffsets[idx] !== undefined;
              const blackNoteNum = hasBlack ? baseNote + blackKeyOffsets[idx] : null;

              return (
                <div key={idx} className="relative">
                  {/* White Key */}
                  <button
                    onClick={() => handleNoteOn(noteNum)}
                    className="w-10 h-40 bg-slate-100 hover:bg-slate-200 active:bg-purple-300 border border-slate-400 rounded-b-lg transition shadow-md flex flex-col justify-end pb-2 items-center select-none cursor-pointer"
                  >
                    <span className="text-[10px] font-mono font-bold text-slate-600">#{noteNum}</span>
                  </button>

                  {/* Black Key overlay */}
                  {hasBlack && blackNoteNum && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNoteOn(blackNoteNum);
                      }}
                      className="absolute top-0 -right-3.5 w-7 h-24 bg-slate-950 hover:bg-slate-800 active:bg-purple-600 border border-slate-700 rounded-b-md z-10 transition shadow-lg flex flex-col justify-end pb-1 items-center select-none cursor-pointer"
                    >
                      <span className="text-[8px] font-mono text-purple-300 font-bold">#{blackNoteNum}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
