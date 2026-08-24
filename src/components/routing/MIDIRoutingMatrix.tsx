import React, { useState } from 'react';
import { MIDIProcessorConfig } from '../../types';
import { Share2, Sliders, Music, Zap, Layers, Plus } from 'lucide-react';

export const MIDIRoutingMatrix: React.FC = () => {
  const [processors, setProcessors] = useState<MIDIProcessorConfig[]>([
    { id: 'proc_1', type: 'transpose', enabled: true, settings: { semitones: 0 } },
    { id: 'proc_2', type: 'scale', enabled: true, settings: { scale: 'Minor Pentatonic' } },
    { id: 'proc_3', type: 'chord', enabled: false, settings: { chordType: 'maj7' } },
    { id: 'proc_4', type: 'humanize', enabled: true, settings: { amount: 15 } },
  ]);

  const toggleProcessor = (id: string) => {
    setProcessors((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Share2 className="w-5 h-5 text-indigo-400" />
            MIDI Router & Signal Processor Modules
          </h2>
          <p className="text-xs text-slate-400">
            Real-time MIDI processing chain between physical controllers and target instruments.
          </p>
        </div>
      </div>

      {/* Processors Chain */}
      <div className="bg-slate-950 border-2 border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase">Active MIDI Insert Processors</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {processors.map((proc) => (
            <div
              key={proc.id}
              className={`border-2 rounded-2xl p-4 transition-all ${
                proc.enabled
                  ? 'bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/20'
                  : 'bg-slate-950 border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black text-indigo-300 uppercase">{proc.type}</span>
                <button
                  onClick={() => toggleProcessor(proc.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    proc.enabled ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {proc.enabled ? 'ACTIVE' : 'BYPASS'}
                </button>
              </div>

              {proc.type === 'transpose' && (
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Transpose ({proc.settings.semitones} st)</label>
                  <input
                    type="range"
                    min="-24"
                    max="24"
                    value={proc.settings.semitones}
                    onChange={(e) =>
                      setProcessors((prev) =>
                        prev.map((p) =>
                          p.id === proc.id
                            ? { ...p, settings: { ...p.settings, semitones: Number(e.target.value) } }
                            : p
                        )
                      )
                    }
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>
              )}

              {proc.type === 'scale' && (
                <div>
                  <label className="text-[10px] text-slate-400">Scale Quantizer</label>
                  <select className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded p-1.5 mt-1">
                    <option value="minor_pentatonic">Minor Pentatonic</option>
                    <option value="major_diatonic">Major Diatonic</option>
                    <option value="blues">Blues Scale</option>
                    <option value="dorian">Dorian Mode</option>
                  </select>
                </div>
              )}

              {proc.type === 'humanize' && (
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Velocity Jitter ({proc.settings.amount})</label>
                  <input
                    type="range"
                    min="1"
                    max="40"
                    value={proc.settings.amount}
                    onChange={(e) =>
                      setProcessors((prev) =>
                        prev.map((p) =>
                          p.id === proc.id
                            ? { ...p, settings: { ...p.settings, amount: Number(e.target.value) } }
                            : p
                        )
                      )
                    }
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
