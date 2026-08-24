import React, { useState, useEffect } from 'react';
import { SamplePad, SequencePattern } from '../../types';
import { audioEngine } from '../../audio/engine';
import { Sliders, Volume2, RotateCcw, Grid, Music2, Sparkles } from 'lucide-react';

interface CanvasDrumGridWorkspaceProps {
  pads: SamplePad[];
  setPads: React.Dispatch<React.SetStateAction<SamplePad[]>>;
  bpm: number;
  isPlaying: boolean;
  onSimulateMIDI: (type: 'note_on' | 'note_off', channel: number, note: number, velocity: number) => void;
}

export const CanvasDrumGridWorkspace: React.FC<CanvasDrumGridWorkspaceProps> = ({
  pads,
  setPads,
  bpm,
  isPlaying,
  onSimulateMIDI,
}) => {
  const [selectedBank, setSelectedBank] = useState<string>('A');
  const [selectedPadId, setSelectedPadId] = useState<string>('pad_A_0');
  const [activeStep, setActiveStep] = useState<number>(0);

  // 16 Step Sequencer Matrix for Bank
  const [sequence, setSequence] = useState<Record<string, boolean[]>>(() => {
    const initial: Record<string, boolean[]> = {};
    for (let i = 0; i < 16; i++) {
      initial[`pad_A_${i}`] = Array(16).fill(false);
      // Default kick & snare pattern
      if (i === 0) initial[`pad_A_${i}`] = [true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false];
      if (i === 4) initial[`pad_A_${i}`] = [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false];
      if (i === 8) initial[`pad_A_${i}`] = Array(16).fill(true).map((_, step) => step % 2 === 0);
    }
    return initial;
  });

  const currentBankPads = pads.filter((p) => p.bank === selectedBank);
  const activePad = pads.find((p) => p.id === selectedPadId) || currentBankPads[0] || pads[0];

  // Sequencer playback loop
  useEffect(() => {
    if (!isPlaying) return;
    const stepIntervalMs = (60000 / bpm) / 4; // 16th notes
    const timer = setInterval(() => {
      setActiveStep((prev) => {
        const nextStep = (prev + 1) % 16;
        // Trigger pads active at nextStep
        currentBankPads.forEach((pad) => {
          if (sequence[pad.id]?.[nextStep]) {
            audioEngine.triggerPad(pad, 115);
          }
        });
        return nextStep;
      });
    }, stepIntervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, bpm, currentBankPads, sequence]);

  // QWERTY keyboard listener for MPC pads (1-4, Q-R, A-F, Z-V)
  useEffect(() => {
    const keyMap: Record<string, number> = {
      '1': 12, '2': 13, '3': 14, '4': 15,
      'q': 8,  'w': 9,  'e': 10, 'r': 11,
      'a': 4,  's': 5,  'd': 6,  'f': 7,
      'z': 0,  'x': 1,  'c': 2,  'v': 3,
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      const index = keyMap[e.key.toLowerCase()];
      if (index !== undefined && currentBankPads[index]) {
        const pad = currentBankPads[index];
        audioEngine.triggerPad(pad, 127);
        onSimulateMIDI('note_on', 10, pad.rootNote, 127);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentBankPads, onSimulateMIDI]);

  const toggleStep = (padId: string, stepIndex: number) => {
    setSequence((prev) => {
      const padSteps = [...(prev[padId] || Array(16).fill(false))];
      padSteps[stepIndex] = !padSteps[stepIndex];
      return { ...prev, [padId]: padSteps };
    });
  };

  const updatePadParam = (key: keyof SamplePad, value: any) => {
    if (!activePad) return;
    setPads((prev) =>
      prev.map((p) => (p.id === activePad.id ? { ...p, [key]: value } : p))
    );
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      {/* Canvas Grid header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 blur-2xl pointer-events-none" />
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <Grid className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl font-bold text-white tracking-tight">Canvas Drum Grid Workspace</h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                16 RGB Velocity Pads
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Original pad-sampler workspace with generic MIDI mapping. Keyboard shortcuts: [Z-V], [A-F], [Q-R], [1-4].
            </p>
          </div>

          {/* Bank Selector Tabs (Bank A - H) */}
          <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((bank) => (
              <button
                key={bank}
                onClick={() => setSelectedBank(bank)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  selectedBank === bank
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Bank {bank}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left column: 4x4 RGB pad grid */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Pads — Bank {selectedBank}
            </h3>
            <span className="text-xs text-slate-500 font-mono">MIDI Ch: 10</span>
          </div>

                {/* 4x4 performance grid */}
          <div className="grid grid-cols-4 gap-3 aspect-square">
            {[12, 13, 14, 15, 8, 9, 10, 11, 4, 5, 6, 7, 0, 1, 2, 3].map((gridIndex) => {
              const pad = currentBankPads[gridIndex] || {
                id: `pad_${selectedBank}_${gridIndex}`,
                name: `Pad ${selectedBank}${gridIndex + 1}`,
                color: '#6366f1',
                rootNote: 36 + gridIndex,
                bank: selectedBank,
                pitch: 0,
                volume: 0.8,
                pan: 0,
                startOffset: 0,
                endOffset: 1,
                loop: false,
              };

              const isSelected = pad.id === selectedPadId;

              return (
                <button
                  key={pad.id}
                  onClick={() => {
                    setSelectedPadId(pad.id);
                    audioEngine.triggerPad(pad, 127);
                    onSimulateMIDI('note_on', 10, pad.rootNote, 127);
                  }}
                  className={`relative rounded-xl p-3 flex flex-col justify-between text-left transition-all active:scale-95 border cursor-pointer select-none ${
                    isSelected
                      ? 'border-amber-400 bg-slate-800 shadow-lg shadow-amber-500/10 ring-2 ring-amber-400/30'
                      : 'border-slate-800 bg-slate-950 hover:bg-slate-800/80 hover:border-slate-700'
                  }`}
                  style={{
                    borderTopColor: pad.color,
                    borderTopWidth: '4px',
                  }}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[11px] font-bold text-slate-400">
                      {selectedBank}{(gridIndex + 1).toString().padStart(2, '0')}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">#{pad.rootNote}</span>
                  </div>

                  <div className="mt-2">
                    <p className="text-xs font-bold text-white truncate">{pad.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Pitch: {pad.pitch > 0 ? `+${pad.pitch}` : pad.pitch}st
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Q-Links & Pad Parameter Inspector */}
        <div className="lg:col-span-6 space-y-6">
          {/* Active Pad Inspector */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  Pad Inspector — {activePad ? activePad.name : 'Select Pad'}
                </h3>
                <span className="text-xs text-slate-400">Parameter controls & sample tuning</span>
              </div>
              <button
                onClick={() => audioEngine.triggerPad(activePad, 127)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition active:scale-95"
              >
                Audition Sound
              </button>
            </div>

            {activePad && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {/* Pitch Slider */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Pitch ({activePad.pitch > 0 ? `+${activePad.pitch}` : activePad.pitch} st)
                  </label>
                  <input
                    type="range"
                    min="-24"
                    max="24"
                    step="1"
                    value={activePad.pitch}
                    onChange={(e) => updatePadParam('pitch', Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                {/* Volume Slider */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Volume ({Math.round(activePad.volume * 100)}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={activePad.volume}
                    onChange={(e) => updatePadParam('volume', Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                {/* Pan Slider */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Pan ({activePad.pan === 0 ? 'C' : activePad.pan < 0 ? `L${Math.round(-activePad.pan * 100)}` : `R${Math.round(activePad.pan * 100)}`})
                  </label>
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.05"
                    value={activePad.pan}
                    onChange={(e) => updatePadParam('pan', Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                {/* Choke Group */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Choke Group</label>
                  <select
                    value={activePad.chokeGroup || 0}
                    onChange={(e) => updatePadParam('chokeGroup', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded p-1.5"
                  >
                    <option value="0">Off (No Choke)</option>
                    <option value="1">Group 1 (Hi-Hats)</option>
                    <option value="2">Group 2 (Mutes)</option>
                    <option value="3">Group 3</option>
                  </select>
                </div>

                {/* Color Pad Selector */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">RGB Color</label>
                  <input
                    type="color"
                    value={activePad.color || '#6366f1'}
                    onChange={(e) => updatePadParam('color', e.target.value)}
                    className="w-full h-7 bg-transparent cursor-pointer rounded"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 16-Step Pattern Sequencer for Bank */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Music2 className="w-4 h-4 text-emerald-400" />
                  Canvas Step Sequencer — Bank {selectedBank}
              </h3>
              <span className="text-xs text-slate-400 font-mono">1/16 Note Step Grid</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
              {currentBankPads.slice(0, 8).map((pad) => (
                <div key={pad.id} className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                  <span className="w-20 text-xs font-bold text-slate-300 truncate">{pad.name}</span>
                  <div className="grid grid-cols-16 gap-1 flex-1">
                    {Array.from({ length: 16 }).map((_, stepIdx) => {
                      const isActive = sequence[pad.id]?.[stepIdx];
                      const isCurrentPlayingStep = isPlaying && activeStep === stepIdx;

                      return (
                        <button
                          key={stepIdx}
                          onClick={() => toggleStep(pad.id, stepIdx)}
                          className={`h-7 rounded transition-all ${
                            isActive
                              ? 'bg-amber-500 shadow-md shadow-amber-500/30'
                              : 'bg-slate-800 hover:bg-slate-700'
                          } ${isCurrentPlayingStep ? 'ring-2 ring-white scale-105 z-10' : ''}`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
