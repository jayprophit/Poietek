import React, { useState } from 'react';
import { WorkspaceType } from '../../types';
import {
  Grid,
  Flame,
  Music,
  Disc,
  Disc3,
  Sliders,
  Radio,
  Zap,
  Cpu,
  Layers,
  Share2,
  Scissors,
  Activity,
  Plus,
  Compass,
  ChevronDown,
  X,
  Sparkles,
} from 'lucide-react';

interface StudioRackNavProps {
  activeWorkspace: WorkspaceType;
  setActiveWorkspace: (ws: WorkspaceType) => void;
}

export const StudioRackNav: React.FC<StudioRackNavProps> = ({
  activeWorkspace,
  setActiveWorkspace,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const rackDevices: {
    id: WorkspaceType;
    label: string;
    category: string;
    icon: React.FC<{ className?: string }>;
    color: string;
  }[] = [
    { id: 'mpc', label: 'MPC Studio Drum Pad', category: 'SAMPLER', icon: Grid, color: 'border-indigo-500 text-indigo-400' },
    { id: 'sp404', label: 'SP-404 MKII Sampler', category: 'EFFECTS/SAMPLE', icon: Flame, color: 'border-amber-500 text-amber-400' },
    { id: 'keyboard', label: 'Analog Subtractive Synth', category: 'SYNTHESIZER', icon: Music, color: 'border-purple-500 text-purple-400' },
    { id: 'drum_machines', label: 'Studio Drum Computer', category: 'SEQUENCER', icon: Zap, color: 'border-rose-500 text-rose-400' },
    { id: 'edrum', label: 'E-Drum Mesh Kit', category: 'DRUMS', icon: Disc, color: 'border-yellow-500 text-yellow-400' },
    { id: 'dj', label: 'DJ Decks Console', category: 'PERFORMANCE', icon: Disc3, color: 'border-blue-500 text-blue-400' },
    { id: 'mixer', label: 'SSL Master Studio Mixer', category: 'MIXER', icon: Sliders, color: 'border-emerald-500 text-emerald-400' },
    { id: 'patchbay', label: 'CV & Audio Patch Bay', category: 'ROUTING', icon: Radio, color: 'border-cyan-500 text-cyan-400' },
    { id: 'mapper', label: 'Universal Hardware Mapper', category: 'HARDWARE', icon: Cpu, color: 'border-stone-400 text-stone-300' },
    { id: 'visual_editor', label: 'DIY Visual Controller Builder', category: 'CUSTOM DIY', icon: Layers, color: 'border-amber-600 text-amber-500' },
    { id: 'midi_matrix', label: 'MIDI Signal Matrix', category: 'MIDI PROCESSOR', icon: Share2, color: 'border-indigo-400 text-indigo-300' },
    { id: 'piano_roll', label: 'Piano Roll & Timeline', category: 'DAW SEQUENCER', icon: Grid, color: 'border-indigo-400 text-indigo-300' },
    { id: 'wave_sequencer', label: 'Multi-Track Audio Waveforms', category: 'AUDIO SEQUENCER', icon: Layers, color: 'border-blue-400 text-blue-300' },
    { id: 'fl_channel_rack', label: 'Pattern Step Channel Rack', category: 'PATTERN BEATS', icon: Zap, color: 'border-orange-400 text-orange-300' },
    { id: 'circle_fifths', label: 'Circle of Fifths Harmony', category: 'THEORY ENGINE', icon: Compass, color: 'border-amber-400 text-amber-300' },
    { id: 'melodyne_pitch', label: 'Pro Vocal Pitch Tuner', category: 'PITCH CORRECTION', icon: Activity, color: 'border-purple-400 text-purple-300' },
    { id: 'd_groove', label: 'D-Groove & ReGroove Pool', category: 'GROOVE/SHUFFLE', icon: Sliders, color: 'border-amber-500 text-amber-400' },
    { id: 'chop_lab', label: 'Chop Lab Stem Slicer', category: 'SAMPLING', icon: Scissors, color: 'border-emerald-400 text-emerald-300' },
    { id: 'health_latency', label: 'Device Health & Latency', category: 'SYSTEM', icon: Activity, color: 'border-rose-400 text-rose-300' },
  ];

  const activeDevice = rackDevices.find((d) => d.id === activeWorkspace) || rackDevices[0];

  return (
    <div className="bg-neutral-950 border-b border-neutral-800 px-4 py-2 select-none relative font-mono z-30">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Active Module Indicator */}
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-amber-400" />
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest hidden sm:inline">
            Active Module:
          </span>
          <span className="text-xs font-black text-amber-400 bg-neutral-900 px-2.5 py-1 rounded-lg border border-amber-500/30">
            {activeDevice.label}
          </span>
        </div>

        {/* Menu Toggle Button to show hidden modules panel */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`px-3 py-1.5 rounded-xl font-black text-xs transition flex items-center gap-2 border shadow ${
              isOpen
                ? 'bg-amber-500 text-neutral-950 border-amber-300 shadow-amber-500/20'
                : 'bg-neutral-900 hover:bg-neutral-800 text-amber-400 border-neutral-700'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{isOpen ? 'Close Module Selector' : '+ Select Hardware Module / Instrument'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Hidden Panel / Drawer revealed when user selects from menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full bg-neutral-950/98 border-b-2 border-amber-500 shadow-2xl p-4 z-50 backdrop-blur-xl animate-in slide-in-from-top-1 duration-150">
          <div className="max-w-7xl mx-auto space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Hardware Modules & Samplers Library
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-stone-800 p-1">
              {rackDevices.map((dev) => {
                const Icon = dev.icon;
                const isActive = activeWorkspace === dev.id;
                return (
                  <button
                    key={dev.id}
                    onClick={() => {
                      setActiveWorkspace(dev.id);
                      setIsOpen(false);
                    }}
                    className={`p-2.5 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                      isActive
                        ? 'bg-neutral-900 border-amber-400 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/20 scale-102'
                        : 'bg-neutral-900/80 border-neutral-800 hover:border-amber-500/50 hover:bg-neutral-900 text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-neutral-400'}`} />
                      <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest">
                        {dev.category}
                      </span>
                    </div>
                    <div className={`text-xs font-black truncate ${isActive ? 'text-amber-400' : 'text-neutral-100'}`}>
                      {dev.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
