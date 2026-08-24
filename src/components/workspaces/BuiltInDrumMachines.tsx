import React, { useState } from 'react';
import { MachineType } from '../../types';
import { audioEngine } from '../../audio/engine';
import { Zap, Music2, Grid, Sparkles, RefreshCw, Volume2 } from 'lucide-react';

export const BuiltInDrumMachines: React.FC = () => {
  const [activeMachine, setActiveMachine] = useState<MachineType>('classic_808');
  const [activeStep, setActiveStep] = useState<number>(0);

  const machines: { id: MachineType; label: string; desc: string }[] = [
    { id: 'classic_808', label: 'Classic 808 Machine', desc: 'Analog style sub kick, snare, hats, clap, rim' },
    { id: 'step_sequencer', label: '32-Step Matrix', desc: 'Detailed velocity, probability & swing controls' },
    { id: 'mpc_style', label: 'MPC-Style Sampler Machine', desc: '16 velocity pads with time stretch & chop' },
    { id: 'x0x_style', label: 'X0X Step Sequencer', desc: 'Classic hardware step button workflow' },
    { id: 'acoustic_kit', label: 'Acoustic Studio Drum Kit', desc: 'Multisampled acoustic drums with room ambience' },
    { id: 'percussion', label: 'World Percussion Machine', desc: 'Auxiliary percussion, congas, shakers, cowbell' },
    { id: 'generative', label: 'Generative AI Machine', desc: 'Algorithmic probability groove generator' },
  ];

  const triggerMachineSound = (sound: string) => {
    const pad = {
      id: `mach_${sound}`,
      name: sound.toUpperCase(),
      sampleUrl: sound,
      pitch: 0,
      volume: 0.9,
      pan: 0,
      startOffset: 0,
      endOffset: 1,
      loop: false,
      color: '#10b981',
      bank: 'A',
      rootNote: 36,
    };
    audioEngine.triggerPad(pad, 120);
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      {/* Drum Machines Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-400" />
            Built-In Software Drum Machines Suite
          </h2>
          <p className="text-xs text-slate-400">
            7 Internal software machines that run standalone or under external hardware control.
          </p>
        </div>
      </div>

      {/* Machine Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {machines.map((m) => (
          <button
            key={m.id}
            onClick={() => setActiveMachine(m.id)}
            className={`p-3 rounded-2xl border text-left transition-all ${
              activeMachine === m.id
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-600/30 font-bold'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-900'
            }`}
          >
            <span className="text-xs block font-bold leading-tight">{m.label}</span>
          </button>
        ))}
      </div>

      {/* Machine Sound Pad Array */}
      <div className="bg-slate-950 border-2 border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
          Active Engine: {machines.find((m) => m.id === activeMachine)?.label}
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { id: 'kick_808', name: 'Kick Drum' },
            { id: 'snare_808', name: 'Snare Drum' },
            { id: 'hihat_closed', name: 'Closed Hat' },
            { id: 'hihat_open', name: 'Open Hat' },
            { id: 'clap_classic', name: 'Analog Clap' },
            { id: 'tom_low', name: 'Low Tom' },
            { id: 'crash_cymbal', name: 'Crash Cymbal' },
            { id: 'rim_shot', name: 'Rimshot' },
          ].map((snd) => (
            <button
              key={snd.id}
              onClick={() => triggerMachineSound(snd.id)}
              className="p-5 rounded-2xl bg-slate-900 border-2 border-slate-800 hover:border-emerald-500 text-white font-bold text-sm text-center transition active:scale-95 shadow-md hover:bg-slate-800 cursor-pointer"
            >
              {snd.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
