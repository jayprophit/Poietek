import React, { useState } from 'react';
import { Sliders, Zap, Flame, RefreshCw, Layers } from 'lucide-react';

export const DGrooveMixer: React.FC = () => {
  const [grooveChannels, setGrooveChannels] = useState([
    { id: 'ch_a', name: 'ReGroove Channel A1 (16 Shuffle)', swing: 58, timingJitter: 12, velocityJitter: 18, preset: 'MPC 3000 16-Swing' },
    { id: 'ch_b', name: 'ReGroove Channel B1 (8 Shuffle)', swing: 62, timingJitter: 8, velocityJitter: 10, preset: 'SP-1200 Boom Bap' },
    { id: 'ch_c', name: 'ReGroove Channel C1 (Push/Pull)', swing: 50, timingJitter: 22, velocityJitter: 25, preset: 'Dilla Human Push' },
    { id: 'ch_d', name: 'ReGroove Channel D1 (Straight)', swing: 50, timingJitter: 0, velocityJitter: 0, preset: 'Quantized Straight' },
  ]);

  const updateGroove = (id: string, field: string, val: number | string) => {
    setGrooveChannels((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: val } : c))
    );
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6 font-mono select-none">
      {/* Header */}
      <div className="bg-gradient-to-r from-neutral-900 via-stone-900 to-neutral-900 border-2 border-neutral-700 rounded-2xl p-5 shadow-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
              D-GROOVE & REGROOVE MIXER GROOVE POOL
            </h2>
            <p className="text-xs text-neutral-400">
              Pro ReGroove Mixer & Ableton Groove Pool real-time swing, micro-timing push/pull & velocity humanization.
            </p>
          </div>
        </div>
      </div>

      {/* Channels Matrix */}
      <div className="bg-neutral-950 border-2 border-neutral-700 rounded-3xl p-6 shadow-2xl space-y-4">
        <h3 className="text-xs font-bold text-neutral-300 uppercase border-b border-neutral-800 pb-2">
          Active ReGroove Channel Channels (A1 - D1)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {grooveChannels.map((ch) => (
            <div key={ch.id} className="bg-neutral-900 border-2 border-neutral-800 rounded-2xl p-4 space-y-4 shadow-lg">
              <div className="border-b border-neutral-800 pb-2">
                <span className="text-[10px] font-bold text-amber-500 block uppercase">{ch.preset}</span>
                <h4 className="text-xs font-black text-white">{ch.name}</h4>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-bold text-neutral-300 mb-1">
                  <span>Swing (%)</span>
                  <span className="text-amber-400">{ch.swing}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="75"
                  value={ch.swing}
                  onChange={(e) => updateGroove(ch.id, 'swing', Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-bold text-neutral-300 mb-1">
                  <span>Timing Jitter (ms)</span>
                  <span className="text-indigo-400">±{ch.timingJitter}ms</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={ch.timingJitter}
                  onChange={(e) => updateGroove(ch.id, 'timingJitter', Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-bold text-neutral-300 mb-1">
                  <span>Velocity Humanize</span>
                  <span className="text-emerald-400">{ch.velocityJitter}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={ch.velocityJitter}
                  onChange={(e) => updateGroove(ch.id, 'velocityJitter', Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
