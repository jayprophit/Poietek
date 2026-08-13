import React from 'react';
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
} from 'lucide-react';

interface StudioRackNavProps {
  activeWorkspace: WorkspaceType;
  setActiveWorkspace: (ws: WorkspaceType) => void;
}

export const StudioRackNav: React.FC<StudioRackNavProps> = ({
  activeWorkspace,
  setActiveWorkspace,
}) => {
  const rackDevices: {
    id: WorkspaceType;
    label: string;
    category: string;
    icon: React.FC<{ className?: string }>;
    color: string;
  }[] = [
    { id: 'mpc', label: 'Canvas Drum Grid', category: 'SAMPLER', icon: Grid, color: 'border-indigo-500 text-indigo-400' },
    { id: 'sp404', label: 'Grain Deck Sampler', category: 'EFFECTS/SAMPLE', icon: Flame, color: 'border-amber-500 text-amber-400' },
    { id: 'keyboard', label: 'Analog Subtractive Synth', category: 'SYNTHESIZER', icon: Music, color: 'border-purple-500 text-purple-400' },
    { id: 'drum_machines', label: 'Studio Drum Computer', category: 'SEQUENCER', icon: Zap, color: 'border-rose-500 text-rose-400' },
    { id: 'edrum', label: 'E-Drum Mesh Kit', category: 'DRUMS', icon: Disc, color: 'border-yellow-500 text-yellow-400' },
    { id: 'dj', label: 'DJ Decks Console', category: 'PERFORMANCE', icon: Disc3, color: 'border-blue-500 text-blue-400' },
    { id: 'mixer', label: 'Summit Master Console', category: 'MIXER', icon: Sliders, color: 'border-emerald-500 text-emerald-400' },
    { id: 'patchbay', label: 'CV & Audio Patch Bay', category: 'ROUTING', icon: Radio, color: 'border-cyan-500 text-cyan-400' },
    { id: 'mapper', label: 'Universal Hardware Mapper', category: 'HARDWARE', icon: Cpu, color: 'border-stone-400 text-stone-300' },
    { id: 'visual_editor', label: 'DIY Visual Controller Builder', category: 'CUSTOM DIY', icon: Layers, color: 'border-amber-600 text-amber-500' },
    { id: 'midi_matrix', label: 'MIDI Signal Matrix', category: 'MIDI PROCESSOR', icon: Share2, color: 'border-indigo-400 text-indigo-300' },
    { id: 'piano_roll', label: 'Piano Roll & Timeline', category: 'DAW SEQUENCER', icon: Grid, color: 'border-indigo-400 text-indigo-300' },
    { id: 'wave_sequencer', label: 'Multi-Track Audio Waveforms', category: 'AUDIO SEQUENCER', icon: Layers, color: 'border-blue-400 text-blue-300' },
    { id: 'fl_channel_rack', label: 'Pattern Step Channel Rack', category: 'PATTERN BEATS', icon: Zap, color: 'border-orange-400 text-orange-300' },
    { id: 'circle_fifths', label: 'Circle of Fifths Harmony', category: 'THEORY ENGINE', icon: Compass, color: 'border-amber-400 text-amber-300' },
    { id: 'melodyne_pitch', label: 'Vocal Contour Editor', category: 'PITCH CORRECTION', icon: Activity, color: 'border-purple-400 text-purple-300' },
    { id: 'd_groove', label: 'Human Pulse Pool', category: 'GROOVE/SHUFFLE', icon: Sliders, color: 'border-amber-500 text-amber-400' },
    { id: 'chop_lab', label: 'Chop Lab Stem Slicer', category: 'SAMPLING', icon: Scissors, color: 'border-emerald-400 text-emerald-300' },
    { id: 'health_latency', label: 'Device Health & Latency', category: 'SYSTEM', icon: Activity, color: 'border-rose-400 text-rose-300' },
  ];

  return (
    <div className="bg-gradient-to-r from-neutral-900 via-stone-900 to-neutral-900 border-b-2 border-neutral-700 p-3 shadow-xl select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-mono font-black text-amber-400 uppercase tracking-widest">
            VIRTUAL STUDIO RACK PALETTE
          </span>
        </div>
        <span className="text-[10px] font-mono text-neutral-400">
          SELECT ACTIVE RACK MODULE TO BRING TO FRONT
        </span>
      </div>

      <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-neutral-700">
        {rackDevices.map((dev) => {
          const Icon = dev.icon;
          const isActive = activeWorkspace === dev.id;
          return (
            <button
              key={dev.id}
              onClick={() => setActiveWorkspace(dev.id)}
              className={`flex-none px-3 py-2 rounded-xl border-2 font-mono text-left transition-all ${
                isActive
                  ? 'bg-neutral-950 border-amber-400 shadow-lg shadow-amber-500/20 ring-1 ring-amber-400 scale-102'
                  : 'bg-neutral-900/90 border-neutral-700 hover:border-neutral-500 text-neutral-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-neutral-400'}`} />
                <span className="text-[9px] font-bold text-neutral-500 block uppercase">
                  {dev.category}
                </span>
              </div>
              <div className={`text-xs font-bold ${isActive ? 'text-white' : 'text-neutral-300'}`}>
                {dev.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
