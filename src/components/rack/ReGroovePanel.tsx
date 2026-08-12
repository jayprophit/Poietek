import React, { useState } from 'react';
import {
  Sliders,
  Sparkles,
  Zap,
  Activity,
  Check,
  RotateCcw,
  Power,
  Layers,
  Flame,
  Volume2,
} from 'lucide-react';
import { ReGroovePreset } from '../../types';

interface ReGroovePanelProps {
  currentBpm?: number;
  onApplyReGroove?: (preset: ReGroovePreset) => void;
}

const FACTORY_REGROOVE_PRESETS: ReGroovePreset[] = [
  { id: 'mpc_60_63', name: 'MPC 60 - 16 Swing 63%', description: 'Classic Roger Linn swing feel from the legendary Akai MPC60.', swingAmount: 63, intensity: 85, humanizeJitterMs: 4, grid: '1/16' },
  { id: 'sp404_drift', name: 'SP-404 Lofi Vinyl Drift', description: 'Unquantized un-synced micro-timing with velocity wobble.', swingAmount: 58, intensity: 95, humanizeJitterMs: 12, grid: '1/16' },
  { id: 'tr_909_heavy', name: 'TR-909 Heavy Shuffle 71%', description: 'Relentless house & techno shuffle groove.', swingAmount: 71, intensity: 90, humanizeJitterMs: 3, grid: '1/16' },
  { id: 'd_groove_3000', name: 'D-Groove MPC 3000 Triplets', description: 'Smooth laid-back boom bap bounce.', swingAmount: 66, intensity: 80, humanizeJitterMs: 6, grid: '1/16T' },
  { id: 'straight_16', name: '808 Precision Straight 16ths', description: 'Tight 0% swing laser-quantized grid.', swingAmount: 50, intensity: 50, humanizeJitterMs: 0, grid: '1/16' },
];

export const ReGroovePanel: React.FC<ReGroovePanelProps> = ({
  currentBpm = 94,
  onApplyReGroove,
}) => {
  const [activePreset, setActivePreset] = useState<ReGroovePreset>(FACTORY_REGROOVE_PRESETS[0]);
  const [swingAmount, setSwingAmount] = useState<number>(63);
  const [intensity, setIntensity] = useState<number>(85);
  const [humanizeJitter, setHumanizeJitter] = useState<number>(4);
  const [grid, setGrid] = useState<'1/16' | '1/8' | '1/32' | '1/16T'>('1/16');
  const [isBypassed, setIsBypassed] = useState<boolean>(false);
  const [appliedSuccess, setAppliedSuccess] = useState<boolean>(false);

  const handleSelectPreset = (p: ReGroovePreset) => {
    setActivePreset(p);
    setSwingAmount(p.swingAmount);
    setIntensity(p.intensity);
    setHumanizeJitter(p.humanizeJitterMs);
    setGrid(p.grid);
  };

  const handleApplyToSequencers = () => {
    const customPreset: ReGroovePreset = {
      ...activePreset,
      swingAmount,
      intensity,
      humanizeJitterMs: humanizeJitter,
      grid,
    };
    if (onApplyReGroove) {
      onApplyReGroove(customPreset);
    }
    setAppliedSuccess(true);
    setTimeout(() => setAppliedSuccess(false), 2000);
  };

  return (
    <div className="bg-gradient-to-r from-stone-950 via-neutral-900 to-stone-950 border-t-2 border-b-2 border-amber-500/80 rounded-2xl p-3 shadow-2xl font-mono select-none my-4">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-stone-800">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${isBypassed ? 'bg-neutral-800 text-neutral-500' : 'bg-amber-500 text-neutral-950 font-black'}`}>
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
              REGROOVE GLOBAL TIMING & SHUFFLE POOL
            </h3>
            <p className="text-[10px] text-stone-400">
              Applies hardware shuffle swing & micro-timing maps to FL Channel Rack, MPC, and Audio Waveform Sequencers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsBypassed(!isBypassed)}
            className={`px-3 py-1 rounded-xl text-[10px] font-black border flex items-center gap-1.5 transition ${
              isBypassed
                ? 'bg-rose-950/60 text-rose-300 border-rose-800'
                : 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
            }`}
          >
            <Power className="w-3 h-3" />
            <span>{isBypassed ? 'REGROOVE BYPASSED' : 'REGROOVE ACTIVE'}</span>
          </button>

          <button
            onClick={handleApplyToSequencers}
            disabled={isBypassed}
            className={`px-4 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow transition ${
              isBypassed
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                : 'bg-amber-500 hover:bg-amber-400 text-neutral-950'
            }`}
          >
            {appliedSuccess ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>{appliedSuccess ? 'SHUFFLE APPLIED!' : 'APPLY GLOBAL SHUFFLE'}</span>
          </button>
        </div>
      </div>

      {/* Main Body: Presets Selector + Realtime Swing Knobs/Sliders */}
      <div className={`pt-3 grid grid-cols-1 md:grid-cols-3 gap-4 transition-opacity ${isBypassed ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
        {/* Preset Selector List */}
        <div className="space-y-1.5 bg-neutral-950 p-2.5 rounded-xl border border-stone-800">
          <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider block">
            SHUFFLE PRESETS
          </span>
          <div className="space-y-1 max-h-36 overflow-y-auto scrollbar-thin scrollbar-thumb-stone-800 pr-1">
            {FACTORY_REGROOVE_PRESETS.map((p) => {
              const isSelected = activePreset.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPreset(p)}
                  className={`w-full text-left p-1.5 rounded-lg border text-xs font-bold transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:border-stone-700'
                  }`}
                >
                  <span className="truncate">{p.name}</span>
                  <span className="text-[9px] font-mono text-stone-500 shrink-0">{p.swingAmount}%</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Realtime Swing & Intensity Sliders */}
        <div className="space-y-3 bg-neutral-950 p-2.5 rounded-xl border border-stone-800">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-stone-300">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                SWING PERCENTAGE
              </span>
              <span className="text-amber-400">{swingAmount}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="80"
              value={swingAmount}
              onChange={(e) => setSwingAmount(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-stone-300">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-orange-400" />
                GROOVE INTENSITY
              </span>
              <span className="text-orange-400">{intensity}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="w-full accent-orange-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Humanize Jitter & Grid Quantize Controls */}
        <div className="space-y-3 bg-neutral-950 p-2.5 rounded-xl border border-stone-800">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-stone-300">
              <span className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                HUMANIZE JITTER
              </span>
              <span className="text-rose-400">{humanizeJitter} ms</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              value={humanizeJitter}
              onChange={(e) => setHumanizeJitter(Number(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
              GRID QUANTIZE RESOLUTION
            </span>
            <div className="grid grid-cols-4 gap-1 text-[10px] font-black">
              {(['1/16', '1/8', '1/32', '1/16T'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGrid(g)}
                  className={`py-1 rounded-lg border transition ${
                    grid === g
                      ? 'bg-amber-500 text-neutral-950 border-amber-400'
                      : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-white'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
