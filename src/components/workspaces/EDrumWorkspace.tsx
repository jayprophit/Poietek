import React, { useState } from 'react';
import { audioEngine } from '../../audio/engine';
import { Disc, Zap, Sliders, RefreshCw, Volume2 } from 'lucide-react';

interface EDrumWorkspaceProps {
  onSimulateMIDI: (type: 'note_on' | 'note_off', channel: number, note: number, velocity: number) => void;
}

export const EDrumWorkspace: React.FC<EDrumWorkspaceProps> = ({ onSimulateMIDI }) => {
  const [velocityCurve, setVelocityCurve] = useState<'linear' | 'soft' | 'hard'>('linear');
  const [selectedRemapTarget, setSelectedRemapTarget] = useState<string>('Software 808 Kit');

  const drumPads = [
    { id: 'kick', name: 'Kick Drum', note: 36, sample: 'kick_punch', color: 'border-rose-500' },
    { id: 'snare_head', name: 'Snare (Center Head)', note: 38, sample: 'snare_808', color: 'border-amber-500' },
    { id: 'snare_rim', name: 'Snare (Rim Shot)', note: 40, sample: 'rim_shot', color: 'border-amber-400' },
    { id: 'hihat_closed', name: 'Hi-Hat (Closed Pad)', note: 42, sample: 'hihat_closed', color: 'border-cyan-500' },
    { id: 'hihat_open', name: 'Hi-Hat (Open Pad)', note: 46, sample: 'hihat_open', color: 'border-cyan-400' },
    { id: 'hihat_pedal', name: 'Hi-Hat Foot Pedal', note: 44, sample: 'hihat_closed', color: 'border-cyan-600' },
    { id: 'tom_1', name: 'Tom 1 (Rack Left)', note: 48, sample: 'tom_high', color: 'border-indigo-500' },
    { id: 'tom_2', name: 'Tom 2 (Rack Right)', note: 45, sample: 'tom_mid', color: 'border-indigo-400' },
    { id: 'tom_3', name: 'Tom 3 (Floor Tom)', note: 41, sample: 'tom_low', color: 'border-indigo-600' },
    { id: 'crash', name: 'Crash Cymbal (Choke)', note: 49, sample: 'crash_cymbal', color: 'border-emerald-500' },
    { id: 'ride', name: 'Ride Cymbal', note: 51, sample: 'crash_cymbal', color: 'border-blue-500' },
  ];

  const handleHitPad = (pad: typeof drumPads[0]) => {
    // Generate sample pad mock
    audioEngine.triggerPad(
      {
        id: pad.id,
        name: pad.name,
        sampleUrl: pad.sample,
        pitch: 0,
        volume: 0.9,
        pan: 0,
        startOffset: 0,
        endOffset: 1,
        loop: false,
        color: '#f59e0b',
        bank: 'A',
        rootNote: pad.note,
      },
      120
    );
    onSimulateMIDI('note_on', 10, pad.note, 120);
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      {/* E-Drum Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Disc className="w-5 h-5 text-amber-400" />
            Electronic Drum Kit Workspace
          </h2>
          <p className="text-xs text-slate-400">
            Alesis, Roland V-Drums, Yamaha, and custom e-drum pad triggers with universal drum remapping.
          </p>
        </div>

        {/* Velocity Curve Selector */}
        <div className="flex items-center gap-3 bg-slate-950 p-2 rounded-xl border border-slate-800">
          <span className="text-xs font-bold text-slate-400">Velocity Curve:</span>
          {(['linear', 'soft', 'hard'] as const).map((curve) => (
            <button
              key={curve}
              onClick={() => setVelocityCurve(curve)}
              className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition ${
                velocityCurve === curve
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {curve}
            </button>
          ))}
        </div>
      </div>

      {/* Drum Remapping Matrix Header */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-bold text-white">Drum Remapping Destination:</span>
          <select
            value={selectedRemapTarget}
            onChange={(e) => setSelectedRemapTarget(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-xs text-amber-400 font-bold rounded-lg p-2"
          >
            <option value="Software 808 Kit">Software 808 Machine</option>
            <option value="MPC Pad Grid">MPC Bank A Pad Grid</option>
            <option value="SP-404 Sampler">Roland SP-404 Sampler</option>
            <option value="VST Plugin Layer">VST Acoustic Drums Layer</option>
          </select>
        </div>
        <span className="text-xs text-slate-400 font-mono">MIDI Ch: 10 (Standard Percussion)</span>
      </div>

      {/* Interactive E-Kit Pads Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {drumPads.map((pad) => (
          <button
            key={pad.id}
            onClick={() => handleHitPad(pad)}
            className={`p-5 rounded-2xl bg-slate-950 border-2 ${pad.color} hover:border-amber-400 text-left transition-all active:scale-95 shadow-lg group cursor-pointer flex flex-col justify-between min-h-[120px]`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 group-hover:text-amber-300">
                MIDI #{pad.note}
              </span>
              <Zap className="w-4 h-4 text-amber-400 opacity-60 group-hover:opacity-100 transition" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-white truncate">{pad.name}</h3>
              <p className="text-[10px] text-slate-500 font-mono mt-1">
                Mapped to: <span className="text-emerald-400 font-semibold">{selectedRemapTarget}</span>
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
