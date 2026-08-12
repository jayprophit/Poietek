import React from 'react';
import {
  X,
  ExternalLink,
  Sliders,
  Activity,
  Music,
  Grid,
  Flame,
  Radio,
  Layers,
  Cpu,
  Share2,
  Scissors,
  Check,
  Disc,
} from 'lucide-react';
import { WorkspaceType } from '../../types';

interface UnitDetachSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  detachedWorkspaces: WorkspaceType[];
  onDetachWorkspace: (ws: WorkspaceType) => void;
  onDockWorkspace: (ws: WorkspaceType) => void;
}

export const UnitDetachSelectorModal: React.FC<UnitDetachSelectorModalProps> = ({
  isOpen,
  onClose,
  detachedWorkspaces,
  onDetachWorkspace,
  onDockWorkspace,
}) => {
  if (!isOpen) return null;

  const units: {
    id: WorkspaceType;
    title: string;
    description: string;
    icon: React.FC<{ className?: string }>;
    category: 'console' | 'daw' | 'rack' | 'tools';
    hotkey?: string;
  }[] = [
    {
      id: 'mixer',
      title: 'SSL 9000 Master Mixing Console',
      description: 'SSL 8-channel master desk with 3-band parametric EQ & master bus compression.',
      icon: Sliders,
      category: 'console',
      hotkey: 'F5',
    },
    {
      id: 'wave_sequencer',
      title: 'Multi-Track Audio DAW Sequencer',
      description: 'Audio timeline with waveform visualization, multi-track audio regions & editing tools.',
      icon: Activity,
      category: 'daw',
      hotkey: 'F7',
    },
    {
      id: 'd_groove',
      title: 'ReGroove Groove Mixer & Shuffle Pool',
      description: '16-channel micro-timing, swing, slide, humanization & groove quantizer.',
      icon: Sliders,
      category: 'daw',
      hotkey: 'F8',
    },
    {
      id: 'patchbay',
      title: 'Main Rack Stack & Patch Cable Rear View',
      description: 'Infinite Reason modular rack with rear-panel CV & audio cable routing.',
      icon: Radio,
      category: 'rack',
      hotkey: 'F6',
    },
    {
      id: 'mpc',
      title: 'MPC Studio Drum Pad Sampler',
      description: '16-pad drum computer with sample slicing, velocity pads & note repeat.',
      icon: Grid,
      category: 'rack',
    },
    {
      id: 'sp404',
      title: 'SP-404 MKII MFX Sampler',
      description: 'Lofi vinyl crackle, tape echo, pitch shift, & sample trigger pads.',
      icon: Flame,
      category: 'rack',
    },
    {
      id: 'keyboard',
      title: 'Analog Subtractive Synth',
      description: 'Subtractor dual oscillator synth with resonant filters & ADSR envelopes.',
      icon: Music,
      category: 'rack',
    },
    {
      id: 'piano_roll',
      title: 'Timeline Piano Roll Editor',
      description: 'Full note piano roll sequencer with velocity bars & quantize grid.',
      icon: Layers,
      category: 'daw',
    },
    {
      id: 'melodyne_pitch',
      title: 'Pro Vocal Pitch Editor (Melodyne)',
      description: 'Vocal pitch correction, formant shift, note snap & tuning editor.',
      icon: Scissors,
      category: 'tools',
    },
    {
      id: 'mapper',
      title: 'Universal Hardware MIDI Mapper',
      description: 'Physical MIDI hardware mapping, CC knob binding & device profiles.',
      icon: Cpu,
      category: 'tools',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-stone-900 border-2 border-amber-500/60 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="bg-stone-950 px-5 py-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
              <ExternalLink className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
                DETACHABLE WINDOWS & UNITS MANAGER
              </h2>
              <p className="text-xs text-stone-400">
                Detach workstation components into draggable multi-monitor floating windows (Reason F5/F6/F7 style)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content - Units Grid */}
        <div className="p-5 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-stone-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {units.map((unit) => {
              const Icon = unit.icon;
              const isDetached = detachedWorkspaces.includes(unit.id);

              return (
                <div
                  key={unit.id}
                  className={`p-3.5 rounded-xl border text-left flex items-start justify-between gap-3 transition ${
                    isDetached
                      ? 'bg-amber-500/10 border-amber-500/60 text-stone-200'
                      : 'bg-stone-950 border-stone-800 text-stone-300 hover:border-amber-500/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-stone-900 border border-stone-800 text-amber-400 shrink-0 mt-0.5">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-black text-white">{unit.title}</h3>
                        {unit.hotkey && (
                          <span className="text-[9px] font-black bg-stone-800 px-1.5 py-0.5 rounded text-amber-400 border border-stone-700">
                            {unit.hotkey}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-stone-400 mt-1">{unit.description}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (isDetached) {
                        onDockWorkspace(unit.id);
                      } else {
                        onDetachWorkspace(unit.id);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black shrink-0 flex items-center gap-1 transition ${
                      isDetached
                        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow'
                        : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow'
                    }`}
                  >
                    {isDetached ? (
                      <>
                        <X className="w-3.5 h-3.5" />
                        <span>DOCK BACK</span>
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>DETACH UNIT</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-stone-950 px-5 py-3 border-t border-stone-800 flex items-center justify-between text-xs text-stone-500">
          <span>Detached Windows Active: <strong className="text-amber-400">{detachedWorkspaces.length}</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-white font-bold transition"
          >
            CLOSE MANAGER
          </button>
        </div>
      </div>
    </div>
  );
};
