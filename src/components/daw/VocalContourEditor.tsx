import React, { useState } from 'react';
import { Activity, Sliders, Volume2, Wand2, RefreshCw, Sparkles, ShieldCheck } from 'lucide-react';

export const VocalContourEditor: React.FC = () => {
  const [pitchCorrection, setPitchCorrection] = useState<number>(85); // %
  const [formantShift, setFormantShift] = useState<number>(0); // semitones
  const [vibratoAmount, setVibratoAmount] = useState<number>(50); // %
  const [scaleLock, setScaleLock] = useState<string>('C Major / A Minor');

  // Simulated pitch blobs
  const [notes, setNotes] = useState([
    { id: 1, note: 'C4', offsetMs: 0, durationMs: 400, originalPitch: 60.2, correctedPitch: 60 },
    { id: 2, note: 'E4', offsetMs: 420, durationMs: 380, originalPitch: 64.4, correctedPitch: 64 },
    { id: 3, note: 'G4', offsetMs: 820, durationMs: 450, originalPitch: 67.1, correctedPitch: 67 },
    { id: 4, note: 'A4', offsetMs: 1300, durationMs: 500, originalPitch: 69.3, correctedPitch: 69 },
    { id: 5, note: 'C5', offsetMs: 1820, durationMs: 600, originalPitch: 72.0, correctedPitch: 72 },
  ]);

  const snapAllToScale = () => {
    setPitchCorrection(100);
    setNotes((prev) =>
      prev.map((n) => ({
        ...n,
        originalPitch: n.correctedPitch,
      }))
    );
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6 font-mono select-none">
      {/* Header */}
      <div className="bg-gradient-to-r from-neutral-900 via-stone-900 to-neutral-900 border-2 border-neutral-700 rounded-2xl p-5 shadow-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/50 flex items-center justify-center text-purple-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-purple-400 uppercase tracking-widest flex items-center gap-2">
              STUDIO PRO VOCAL PITCH & HARMONY EDITOR
            </h2>
            <p className="text-xs text-neutral-400">
              Per-note pitch tuning graph, formant shifter & auto-tune scale quantizer.
            </p>
          </div>
        </div>

        <button
          onClick={snapAllToScale}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>SNAP ALL NOTES TO SCALE</span>
        </button>
      </div>

      {/* Main Pitch Graph Canvas & Sliders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pitch Graph Panel */}
        <div className="lg:col-span-8 bg-neutral-950 border-2 border-neutral-700 rounded-3xl p-6 shadow-2xl relative min-h-[350px]">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-4">
            <span className="text-xs font-bold text-neutral-400 uppercase">
              STUDIO VOCAL NOTE GRAPH (C3 - C5 RANGE)
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">SCALE LOCK: {scaleLock}</span>
          </div>

          {/* Piano Key Pitch Graph Grid */}
          <div className="relative w-full h-[260px] bg-neutral-900 rounded-2xl border border-neutral-800 p-4 overflow-hidden">
            {/* Horizontal pitch guides */}
            {['C5', 'A4', 'G4', 'E4', 'C4'].map((pKey, idx) => (
              <div
                key={pKey}
                style={{ top: `${idx * 20 + 10}%` }}
                className="absolute left-0 right-0 border-b border-neutral-800/60 text-[9px] font-bold text-neutral-600 pl-2 pointer-events-none"
              >
                {pKey}
              </div>
            ))}

            {/* Note Blobs */}
            {notes.map((n) => (
              <div
                key={n.id}
                style={{
                  left: `${(n.offsetMs / 2500) * 100}%`,
                  width: `${(n.durationMs / 2500) * 100}%`,
                  top: `${(1 - (n.correctedPitch - 60) / 12) * 60 + 20}%`,
                }}
                className="absolute h-8 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 border-2 border-purple-400 shadow-lg flex items-center justify-center text-xs font-black text-white cursor-pointer hover:scale-105 transition"
              >
                <span>{n.note}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pitch Shifter Control Panel */}
        <div className="lg:col-span-4 bg-neutral-900 border-2 border-neutral-700 rounded-3xl p-6 shadow-2xl space-y-5">
          <h3 className="text-xs font-bold text-neutral-300 uppercase border-b border-neutral-800 pb-2">
            Tuning & Formant Controls
          </h3>

          <div>
            <div className="flex justify-between text-xs font-bold text-neutral-300 mb-1">
              <span>Auto-Tune Correction Speed</span>
              <span className="text-purple-400">{pitchCorrection}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={pitchCorrection}
              onChange={(e) => setPitchCorrection(Number(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-neutral-300 mb-1">
              <span>Formant Shift ({formantShift} st)</span>
              <span className="text-amber-400">{formantShift > 0 ? `+${formantShift}` : formantShift}</span>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              value={formantShift}
              onChange={(e) => setFormantShift(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-neutral-300 mb-1">
              <span>Vibrato Smoothing</span>
              <span className="text-emerald-400">{vibratoAmount}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={vibratoAmount}
              onChange={(e) => setVibratoAmount(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-neutral-300 block mb-1">Scale Lock Quantizer</label>
            <select
              value={scaleLock}
              onChange={(e) => setScaleLock(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-700 text-xs text-white rounded-xl p-2.5"
            >
              <option value="C Major / A Minor">C Major / A Minor</option>
              <option value="G Major / E Minor">G Major / E Minor</option>
              <option value="D Minor / F Major">D Minor / F Major</option>
              <option value="Chromatic (Unquantized)">Chromatic (Unquantized)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
