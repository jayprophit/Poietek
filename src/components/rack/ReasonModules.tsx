import React, { useState, useEffect, useRef } from 'react';
import {
  Sliders,
  Activity,
  Zap,
  Volume2,
  Sparkles,
  Flame,
  Radio,
  Layers,
  Music,
  RotateCcw,
  RefreshCw,
  Power,
  ChevronRight,
  ChevronLeft,
  FolderOpen,
} from 'lucide-react';
import { audioEngine } from '../../audio/engine';

// ---------------------------------------------------------------------------
// 1. SUBTRACTOR POLYPHONIC ANALOG SYNTHESIZER
// ---------------------------------------------------------------------------
export const SubtractorSynthDevice: React.FC = () => {
  const [osc1Wave, setOsc1Wave] = useState<'saw' | 'square' | 'triangle' | 'noise'>('saw');
  const [osc2Wave, setOsc2Wave] = useState<'saw' | 'square' | 'triangle' | 'noise'>('square');
  const [osc2Semi, setOsc2Semi] = useState<number>(7);
  const [filterCutoff, setFilterCutoff] = useState<number>(75);
  const [filterRes, setFilterRes] = useState<number>(45);
  const [filterType, setFilterType] = useState<'LP24' | 'LP12' | 'BP12' | 'HP24'>('LP24');
  const [attack, setAttack] = useState<number>(10);
  const [decay, setDecay] = useState<number>(40);
  const [sustain, setSustain] = useState<number>(80);
  const [release, setRelease] = useState<number>(30);
  const [patchName, setPatchName] = useState<string>('Fat Analog Bass Line');

  const patches = [
    'Fat Analog Bass Line',
    'Warm Poly Synth Pad',
    'Chiptune Lead Pulse',
    'Classic Reso Sweep',
    'Sub Sonic Subtractor',
  ];

  const handleTriggerNote = (freq: number) => {
    try {
      audioEngine.playSynthTone(freq, 'sawtooth', 0.8, filterCutoff * 50);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-teal-950 border-2 border-teal-600/70 rounded-xl p-3 font-mono text-xs text-teal-100 shadow-2xl space-y-3">
      {/* Top Banner & Patch Browser */}
      <div className="bg-teal-950/90 border border-teal-800/80 p-2 rounded-lg flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-amber-400 bg-black/60 px-2 py-0.5 rounded border border-amber-500/40 uppercase tracking-widest">
            SUBTRACTOR
          </span>
          <span className="text-[10px] font-bold text-teal-300">POLYPHONIC SYNTHESIZER</span>
        </div>

        {/* Reason Patch Browser */}
        <div className="flex items-center gap-1.5 bg-black/80 px-2.5 py-1 rounded border border-teal-700/60">
          <button
            onClick={() => {
              const idx = patches.indexOf(patchName);
              const prev = idx > 0 ? patches[idx - 1] : patches[patches.length - 1];
              setPatchName(prev);
            }}
            className="text-teal-400 hover:text-amber-400 font-bold px-1"
          >
            &lt;
          </button>
          <span className="text-[11px] font-black text-amber-300 min-w-[150px] text-center truncate">
            {patchName}
          </span>
          <button
            onClick={() => {
              const idx = patches.indexOf(patchName);
              const next = idx < patches.length - 1 ? patches[idx + 1] : patches[0];
              setPatchName(next);
            }}
            className="text-teal-400 hover:text-amber-400 font-bold px-1"
          >
            &gt;
          </button>
          <FolderOpen className="w-3.5 h-3.5 text-amber-400 ml-1 cursor-pointer" />
        </div>
      </div>

      {/* Main Control Panel: OSC 1, OSC 2, FILTER 1, ENVELOPES */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-black/40 p-2.5 rounded-lg border border-teal-900/60">
        {/* OSC 1 */}
        <div className="bg-teal-950/60 p-2 rounded border border-teal-800/60 space-y-2">
          <div className="text-[9px] font-black text-amber-400 uppercase tracking-wider border-b border-teal-800 pb-1">
            OSCILLATOR 1
          </div>
          <div className="space-y-1.5 text-[10px]">
            <span className="text-teal-300 block font-bold">Waveform</span>
            <div className="grid grid-cols-2 gap-1">
              {(['saw', 'square', 'triangle', 'noise'] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => setOsc1Wave(w)}
                  className={`py-0.5 px-1 rounded text-[9px] font-bold uppercase transition ${
                    osc1Wave === w
                      ? 'bg-amber-500 text-black font-black shadow'
                      : 'bg-teal-900/60 text-teal-300 hover:bg-teal-800'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* OSC 2 */}
        <div className="bg-teal-950/60 p-2 rounded border border-teal-800/60 space-y-2">
          <div className="text-[9px] font-black text-amber-400 uppercase tracking-wider border-b border-teal-800 pb-1">
            OSCILLATOR 2 (FM)
          </div>
          <div className="space-y-1.5 text-[10px]">
            <div className="flex items-center justify-between">
              <span className="text-teal-300">Semi Detune:</span>
              <span className="text-amber-400 font-bold">{osc2Semi} st</span>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              value={osc2Semi}
              onChange={(e) => setOsc2Semi(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="grid grid-cols-2 gap-1 pt-1">
              {(['saw', 'square', 'triangle', 'noise'] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => setOsc2Wave(w)}
                  className={`py-0.5 px-1 rounded text-[9px] font-bold uppercase transition ${
                    osc2Wave === w
                      ? 'bg-amber-500 text-black font-black shadow'
                      : 'bg-teal-900/60 text-teal-300 hover:bg-teal-800'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* FILTER 1 */}
        <div className="bg-teal-950/60 p-2 rounded border border-teal-800/60 space-y-2">
          <div className="text-[9px] font-black text-amber-400 uppercase tracking-wider border-b border-teal-800 pb-1">
            FILTER 1
          </div>
          <div className="space-y-1.5 text-[10px]">
            <div className="flex items-center justify-between">
              <span className="text-teal-300">Cutoff:</span>
              <span className="text-amber-400 font-bold">{filterCutoff}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={filterCutoff}
              onChange={(e) => setFilterCutoff(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex items-center justify-between pt-1">
              <span className="text-teal-300">Resonance:</span>
              <span className="text-amber-400 font-bold">{filterRes}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={filterRes}
              onChange={(e) => setFilterRes(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>
        </div>

        {/* AMP ENVELOPE (ADSR) */}
        <div className="bg-teal-950/60 p-2 rounded border border-teal-800/60 space-y-2">
          <div className="text-[9px] font-black text-amber-400 uppercase tracking-wider border-b border-teal-800 pb-1">
            AMP ENVELOPE (ADSR)
          </div>
          <div className="grid grid-cols-4 gap-1 text-[9px] text-center pt-1">
            <div>
              <span className="text-teal-400 font-bold block">A</span>
              <input
                type="range"
                min="0"
                max="100"
                value={attack}
                onChange={(e) => setAttack(Number(e.target.value))}
                className="h-16 accent-amber-500 [writing-mode:vertical-lr] [direction:rtl] mx-auto my-1 cursor-pointer"
              />
            </div>
            <div>
              <span className="text-teal-400 font-bold block">D</span>
              <input
                type="range"
                min="0"
                max="100"
                value={decay}
                onChange={(e) => setDecay(Number(e.target.value))}
                className="h-16 accent-amber-500 [writing-mode:vertical-lr] [direction:rtl] mx-auto my-1 cursor-pointer"
              />
            </div>
            <div>
              <span className="text-teal-400 font-bold block">S</span>
              <input
                type="range"
                min="0"
                max="100"
                value={sustain}
                onChange={(e) => setSustain(Number(e.target.value))}
                className="h-16 accent-amber-500 [writing-mode:vertical-lr] [direction:rtl] mx-auto my-1 cursor-pointer"
              />
            </div>
            <div>
              <span className="text-teal-400 font-bold block">R</span>
              <input
                type="range"
                min="0"
                max="100"
                value={release}
                onChange={(e) => setRelease(Number(e.target.value))}
                className="h-16 accent-amber-500 [writing-mode:vertical-lr] [direction:rtl] mx-auto my-1 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mini Keyboard Trigger Bar */}
      <div className="flex items-center gap-1 overflow-x-auto bg-black/60 p-1.5 rounded-lg border border-teal-900/60">
        <span className="text-[9px] font-bold text-amber-400 uppercase mr-2 shrink-0">TEST KEYS:</span>
        {[
          { note: 'C3', freq: 130.81 },
          { note: 'D3', freq: 146.83 },
          { note: 'E3', freq: 164.81 },
          { note: 'F3', freq: 174.61 },
          { note: 'G3', freq: 196.0 },
          { note: 'A3', freq: 220.0 },
          { note: 'B3', freq: 246.94 },
          { note: 'C4', freq: 261.63 },
        ].map((k) => (
          <button
            key={k.note}
            onClick={() => handleTriggerNote(k.freq)}
            className="px-3 py-1 bg-teal-900 hover:bg-amber-500 hover:text-black text-teal-200 font-bold rounded text-[10px] transition border border-teal-700/60 shrink-0"
          >
            {k.note}
          </button>
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 2. RV7000 MKII ADVANCED REVERB MODULE
// ---------------------------------------------------------------------------
export const RV7000ReverbDevice: React.FC = () => {
  const [algo, setAlgo] = useState<'Plate' | 'Hall' | 'Room' | 'Gated' | 'Spring' | 'Reverse'>('Plate');
  const [decayTime, setDecayTime] = useState<number>(2.8); // seconds
  const [hfDamp, setHfDamp] = useState<number>(6.5); // kHz
  const [predelay, setPredelay] = useState<number>(25); // ms
  const [dryWet, setDryWet] = useState<number>(40); // %

  return (
    <div className="bg-gradient-to-r from-zinc-800 via-stone-900 to-zinc-800 border-2 border-slate-600 rounded-xl p-3 font-mono text-xs text-stone-100 shadow-2xl space-y-3">
      {/* Header Banner */}
      <div className="bg-stone-950 border border-slate-700 p-2 rounded-lg flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/40 uppercase tracking-widest">
            RV7000 MkII
          </span>
          <span className="text-[10px] font-bold text-slate-300">ADVANCED CONVOLUTION REVERB</span>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-cyan-400 font-bold bg-black/60 px-2.5 py-1 rounded border border-cyan-500/30">
          <span>ALGORITHM:</span>
          <span className="text-white font-black uppercase">{algo} REVERB</span>
        </div>
      </div>

      {/* Main Screen & Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* IR Curve Display Screen */}
        <div className="bg-cyan-950/30 border border-cyan-700/50 rounded-lg p-2.5 space-y-2">
          <div className="flex items-center justify-between text-[9px] font-bold text-cyan-400">
            <span>IMPULSE RESPONSE CURVE</span>
            <span>DECAY: {decayTime.toFixed(1)}s</span>
          </div>

          <div className="h-20 bg-black/80 rounded border border-cyan-800/60 p-2 flex items-center justify-center relative overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 100 40">
              <path
                d={`M 0,5 Q 15,${35 - decayTime * 5} 100,38`}
                fill="none"
                stroke="#22d3ee"
                strokeWidth="2.5"
              />
              {Array.from({ length: 24 }).map((_, i) => (
                <line
                  key={i}
                  x1={i * 4}
                  y1={38}
                  x2={i * 4}
                  y2={Math.max(5, 38 - Math.exp(-i * (0.15 / decayTime)) * 32)}
                  stroke="#0891b2"
                  strokeWidth="1"
                />
              ))}
            </svg>
          </div>
        </div>

        {/* Algorithm Buttons */}
        <div className="bg-stone-950/60 p-2.5 rounded-lg border border-slate-700/60 space-y-2">
          <span className="text-[9px] font-black text-cyan-400 uppercase tracking-wider block">
            REVERB ALGORITHMS
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {(['Plate', 'Hall', 'Room', 'Gated', 'Spring', 'Reverse'] as const).map((a) => (
              <button
                key={a}
                onClick={() => setAlgo(a)}
                className={`py-1.5 px-2 rounded text-[10px] font-bold uppercase transition border ${
                  algo === a
                    ? 'bg-cyan-500 text-black border-cyan-300 font-black shadow'
                    : 'bg-stone-900 text-slate-300 border-slate-800 hover:border-cyan-500'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Knobs & Sliders */}
        <div className="bg-stone-950/60 p-2.5 rounded-lg border border-slate-700/60 space-y-2">
          <span className="text-[9px] font-black text-cyan-400 uppercase tracking-wider block">
            REVERB DYNAMICS & MIX
          </span>
          <div className="space-y-1.5 text-[10px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Decay Time:</span>
              <span className="text-cyan-400 font-bold">{decayTime.toFixed(1)} s</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="10.0"
              step="0.1"
              value={decayTime}
              onChange={(e) => setDecayTime(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-300">Dry / Wet Mix:</span>
              <span className="text-amber-400 font-bold">{dryWet}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={dryWet}
              onChange={(e) => setDryWet(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 3. THE ECHO TAPE DELAY & WOBBLER MODULE
// ---------------------------------------------------------------------------
export const TheEchoDelayDevice: React.FC = () => {
  const [delayTime, setDelayTime] = useState<string>('1/8');
  const [feedback, setFeedback] = useState<number>(55);
  const [wobble, setWobble] = useState<number>(30);
  const [pingPong, setPingPong] = useState<boolean>(true);
  const [dryWet, setDryWet] = useState<number>(35);

  return (
    <div className="bg-gradient-to-r from-amber-950 via-stone-900 to-amber-950 border-2 border-amber-600/70 rounded-xl p-3 font-mono text-xs text-amber-100 shadow-2xl space-y-3">
      <div className="bg-amber-950/90 border border-amber-700/80 p-2 rounded-lg flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-black bg-amber-400 px-2 py-0.5 rounded uppercase tracking-widest">
            THE ECHO
          </span>
          <span className="text-[10px] font-bold text-amber-200">ANALOG TAPE DELAY & WOBBLER</span>
        </div>

        <button
          onClick={() => setPingPong(!pingPong)}
          className={`px-3 py-1 rounded text-[10px] font-black transition border ${
            pingPong
              ? 'bg-amber-500 text-black border-amber-300 shadow'
              : 'bg-amber-950 text-amber-400 border-amber-800'
          }`}
        >
          PING PONG STEREO: {pingPong ? 'ON' : 'OFF'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-black/40 p-2.5 rounded-lg border border-amber-900/60">
        {/* Time sync */}
        <div className="bg-amber-950/60 p-2.5 rounded border border-amber-800/60 space-y-2">
          <span className="text-[9px] font-black text-amber-400 uppercase tracking-wider block">
            DELAY TIME SYNC
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {['1/16', '1/8', '1/8T', '1/4', '1/2', 'FREE MS'].map((t) => (
              <button
                key={t}
                onClick={() => setDelayTime(t)}
                className={`py-1 rounded text-[10px] font-bold transition ${
                  delayTime === t
                    ? 'bg-amber-500 text-black font-black shadow'
                    : 'bg-amber-900/40 text-amber-300 hover:bg-amber-800'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Feedback & Roll */}
        <div className="bg-amber-950/60 p-2.5 rounded border border-amber-800/60 space-y-2">
          <span className="text-[9px] font-black text-amber-400 uppercase tracking-wider block">
            FEEDBACK & REPEAT
          </span>
          <div className="space-y-2 text-[10px]">
            <div className="flex items-center justify-between">
              <span className="text-amber-200">Feedback:</span>
              <span className="text-amber-400 font-bold">{feedback}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="110"
              value={feedback}
              onChange={(e) => setFeedback(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Wobble / Tape Flutter */}
        <div className="bg-amber-950/60 p-2.5 rounded border border-amber-800/60 space-y-2">
          <span className="text-[9px] font-black text-amber-400 uppercase tracking-wider block">
            TAPE WOBBLE & DRIFT
          </span>
          <div className="space-y-2 text-[10px]">
            <div className="flex items-center justify-between">
              <span className="text-amber-200">Pitch Jitter:</span>
              <span className="text-rose-400 font-bold">{wobble}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={wobble}
              onChange={(e) => setWobble(Number(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 4. SCREAM 4 SOUND DESTRUCTION UNIT
// ---------------------------------------------------------------------------
export const Scream4DistortionDevice: React.FC = () => {
  const [type, setType] = useState<'Overdrive' | 'Distortion' | 'Fuzz' | 'Tube' | 'Tape' | 'Feedback'>('Overdrive');
  const [damage, setDamage] = useState<number>(65);
  const [paramP1, setParamP1] = useState<number>(40);
  const [paramP2, setParamP2] = useState<number>(80);

  return (
    <div className="bg-gradient-to-r from-rose-950 via-stone-900 to-rose-950 border-2 border-rose-600/80 rounded-xl p-3 font-mono text-xs text-rose-100 shadow-2xl space-y-3">
      <div className="bg-rose-950/90 border border-rose-700/80 p-2 rounded-lg flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-black bg-rose-500 px-2 py-0.5 rounded uppercase tracking-widest">
            SCREAM 4
          </span>
          <span className="text-[10px] font-bold text-rose-200">SOUND DESTRUCTION UNIT</span>
        </div>
        <span className="text-[9px] text-amber-400 font-bold">MODE: {type.toUpperCase()}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-black/40 p-2.5 rounded-lg border border-rose-900/60">
        <div className="bg-rose-950/60 p-2.5 rounded border border-rose-800/60 space-y-2">
          <span className="text-[9px] font-black text-rose-400 uppercase tracking-wider block">
            DAMAGE TYPE
          </span>
          <div className="grid grid-cols-2 gap-1">
            {(['Overdrive', 'Distortion', 'Fuzz', 'Tube', 'Tape', 'Feedback'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setType(d)}
                className={`py-1 rounded text-[10px] font-bold transition ${
                  type === d
                    ? 'bg-rose-500 text-black font-black shadow'
                    : 'bg-rose-900/40 text-rose-300 hover:bg-rose-800'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-rose-950/60 p-2.5 rounded border border-rose-800/60 space-y-2 col-span-2">
          <span className="text-[9px] font-black text-rose-400 uppercase tracking-wider block">
            MAIN DAMAGE & CONTOUR KNOBS
          </span>
          <div className="space-y-2 text-[10px]">
            <div className="flex items-center justify-between">
              <span className="text-rose-200">Damage Drive:</span>
              <span className="text-rose-400 font-bold">{damage}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={damage}
              onChange={(e) => setDamage(Number(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer"
            />

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-rose-300 block text-[9px]">P1 (Tone/Body): {paramP1}%</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={paramP1}
                  onChange={(e) => setParamP1(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
              <div>
                <span className="text-rose-300 block text-[9px]">P2 (Resonance): {paramP2}%</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={paramP2}
                  onChange={(e) => setParamP2(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 5. SIDECHAIN TOOL & DUCKER ENVELOPE
// ---------------------------------------------------------------------------
export const SidechainDuckerDevice: React.FC = () => {
  const [duckAmount, setDuckAmount] = useState<number>(75);
  const [pumpRate, setPumpRate] = useState<'1/4' | '1/8' | '1/16'>('1/4');

  return (
    <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border-2 border-indigo-600/80 rounded-xl p-3 font-mono text-xs text-indigo-100 shadow-2xl space-y-3">
      <div className="bg-indigo-950/90 border border-indigo-700/80 p-2 rounded-lg flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-black bg-indigo-400 px-2 py-0.5 rounded uppercase tracking-widest">
            SIDECHAIN DUCKER
          </span>
          <span className="text-[10px] font-bold text-indigo-300">DYNAMIC PUMPING DUCKER</span>
        </div>
        <div className="text-[10px] font-bold text-emerald-400 bg-black/60 px-2 py-0.5 rounded border border-emerald-500/40">
          BEAT SYNC: {pumpRate}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-black/40 p-2.5 rounded-lg border border-indigo-900/60">
        {/* Animated Pumping Waveform Canvas */}
        <div className="bg-indigo-950/60 p-2 rounded border border-indigo-800/60 space-y-1">
          <span className="text-[9px] font-black text-indigo-300 uppercase">PUMP ENVELOPE CURVE</span>
          <div className="h-16 bg-black/80 rounded border border-indigo-800 p-2 flex items-center justify-center relative overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 100 30">
              <path
                d={`M 0,5 Q 10,${5 + duckAmount * 0.2} 25,28 T 50,5 T 75,28 T 100,5`}
                fill="none"
                stroke="#818cf8"
                strokeWidth="2.5"
              />
            </svg>
          </div>
        </div>

        <div className="bg-indigo-950/60 p-2.5 rounded border border-indigo-800/60 space-y-2">
          <span className="text-[9px] font-black text-indigo-300 uppercase">DUCKING DEPTH & RATE</span>
          <div className="space-y-2 text-[10px]">
            <div className="flex items-center justify-between">
              <span className="text-indigo-200">Ducking Amount:</span>
              <span className="text-amber-400 font-bold">{duckAmount}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={duckAmount}
              onChange={(e) => setDuckAmount(Number(e.target.value))}
              className="w-full accent-indigo-400 cursor-pointer"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-indigo-200">Pump Trigger Rate:</span>
              <div className="flex gap-1">
                {(['1/4', '1/8', '1/16'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setPumpRate(r)}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold transition ${
                      pumpRate === r
                        ? 'bg-amber-500 text-black font-black shadow'
                        : 'bg-indigo-900/60 text-indigo-300'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 6. REASON SCALES & CHORDS PLAYER MODULE
// ---------------------------------------------------------------------------
export const ScalesAndChordsPlayerDevice: React.FC = () => {
  const [scale, setScale] = useState<string>('C Major');
  const [chordType, setChordType] = useState<string>('7th Chords');

  return (
    <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-950 border-2 border-blue-600/80 rounded-xl p-3 font-mono text-xs text-blue-100 shadow-2xl space-y-3">
      <div className="bg-blue-950/90 border border-blue-700/80 p-2 rounded-lg flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-black bg-blue-400 px-2 py-0.5 rounded uppercase tracking-widest">
            SCALES & CHORDS
          </span>
          <span className="text-[10px] font-bold text-blue-300">MIDI PLAYER UTILITY</span>
        </div>
        <span className="text-[9px] font-black text-amber-400">HARMONIC QUANTIZER</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-black/40 p-2.5 rounded-lg border border-blue-900/60">
        <div className="bg-blue-950/60 p-2.5 rounded border border-blue-800/60 space-y-2">
          <span className="text-[9px] font-black text-blue-300 uppercase block">KEY & SCALE</span>
          <div className="grid grid-cols-2 gap-1">
            {['C Major', 'A Minor', 'D Dorian', 'F Lydian', 'G Mixolydian', 'Pentatonic'].map((s) => (
              <button
                key={s}
                onClick={() => setScale(s)}
                className={`py-1 rounded text-[10px] font-bold transition ${
                  scale === s
                    ? 'bg-amber-500 text-black font-black shadow'
                    : 'bg-blue-900/40 text-blue-300 hover:bg-blue-800'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-blue-950/60 p-2.5 rounded border border-blue-800/60 space-y-2">
          <span className="text-[9px] font-black text-blue-300 uppercase block">CHORD EXTENSION</span>
          <div className="grid grid-cols-2 gap-1">
            {['Single Note', 'Triad', '7th Chords', '9th Extended'].map((c) => (
              <button
                key={c}
                onClick={() => setChordType(c)}
                className={`py-1 rounded text-[10px] font-bold transition ${
                  chordType === c
                    ? 'bg-blue-500 text-black font-black shadow'
                    : 'bg-blue-900/40 text-blue-300 hover:bg-blue-800'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
// ---------------------------------------------------------------------------
// 7. THOR POLYSONIC SYNTHESIZER
// ---------------------------------------------------------------------------
export const ThorPolySynthDevice: React.FC = () => {
  const [showProgrammer, setShowProgrammer] = useState<boolean>(true);
  const [osc1Type, setOsc1Type] = useState<'Analog' | 'Wavetable' | 'FM' | 'PhaseMod'>('Analog');
  const [osc2Type, setOsc2Type] = useState<'Analog' | 'Wavetable' | 'FM' | 'PhaseMod'>('FM');
  const [filter1Cutoff, setFilter1Cutoff] = useState<number>(80);
  const [modWheel, setModWheel] = useState<number>(40);
  const [pitchBend, setPitchBend] = useState<number>(0);
  const [patchName, setPatchName] = useState<string>('Epic Thor Supersaw');

  const patches = ['Epic Thor Supersaw', 'Cyberpunk Bass Pulse', 'Space Odyssey Lead', 'Ambient Glass Pad', 'Monster FM Stabs'];

  const handleTestNote = (freq: number) => {
    try {
      audioEngine.playSynthTone(freq, 'sawtooth', 0.8, filter1Cutoff * 40);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-gradient-to-r from-zinc-950 via-slate-900 to-zinc-950 border-2 border-stone-600 rounded-xl p-3 font-mono text-xs text-stone-100 shadow-2xl space-y-3">
      {/* Top Banner */}
      <div className="bg-stone-950/90 border border-stone-700 p-2 rounded-lg flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-black bg-gradient-to-r from-amber-400 to-amber-500 px-2.5 py-0.5 rounded uppercase tracking-widest shadow">
            THOR
          </span>
          <span className="text-[10px] font-bold text-amber-300">POLYSONIC SYNTHESIZER</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowProgrammer(!showProgrammer)}
            className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black font-black text-[10px] transition shadow"
          >
            {showProgrammer ? 'HIDE PROGRAMMER' : 'SHOW PROGRAMMER'}
          </button>
          <div className="flex items-center gap-1 bg-black/80 px-2 py-1 rounded border border-amber-800/60 text-[10px] font-bold text-amber-300">
            <FolderOpen className="w-3.5 h-3.5 text-amber-400 cursor-pointer" />
            <span className="max-w-[120px] truncate">{patchName}</span>
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-black/50 p-2.5 rounded-lg border border-stone-800">
        {/* Mod Wheels & Pitch Bend */}
        <div className="bg-stone-900/80 p-2 rounded border border-stone-700 flex flex-col justify-between space-y-2">
          <span className="text-[9px] font-black text-amber-400 uppercase">PERFORMANCE WHEELS</span>
          <div className="grid grid-cols-2 gap-2 text-[9px] text-center">
            <div>
              <span className="text-stone-300 block mb-1 font-bold">PITCH</span>
              <input
                type="range"
                min="-100"
                max="100"
                value={pitchBend}
                onChange={(e) => setPitchBend(Number(e.target.value))}
                onMouseUp={() => setPitchBend(0)}
                className="h-16 accent-amber-500 [writing-mode:vertical-lr] [direction:rtl] mx-auto cursor-pointer"
              />
            </div>
            <div>
              <span className="text-stone-300 block mb-1 font-bold">MOD</span>
              <input
                type="range"
                min="0"
                max="100"
                value={modWheel}
                onChange={(e) => setModWheel(Number(e.target.value))}
                className="h-16 accent-amber-500 [writing-mode:vertical-lr] [direction:rtl] mx-auto cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* OSC 1 Slot */}
        <div className="bg-stone-900/80 p-2.5 rounded border border-stone-700 space-y-2">
          <span className="text-[9px] font-black text-amber-400 uppercase block border-b border-stone-700 pb-1">
            OSC 1 (PRIMARY)
          </span>
          <div className="grid grid-cols-2 gap-1 text-[9px]">
            {(['Analog', 'Wavetable', 'FM', 'PhaseMod'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setOsc1Type(t)}
                className={`py-1 rounded font-bold uppercase transition ${
                  osc1Type === t ? 'bg-amber-500 text-black font-black' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* OSC 2 Slot */}
        <div className="bg-stone-900/80 p-2.5 rounded border border-stone-700 space-y-2">
          <span className="text-[9px] font-black text-amber-400 uppercase block border-b border-stone-700 pb-1">
            OSC 2 (SECONDARY)
          </span>
          <div className="grid grid-cols-2 gap-1 text-[9px]">
            {(['Analog', 'Wavetable', 'FM', 'PhaseMod'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setOsc2Type(t)}
                className={`py-1 rounded font-bold uppercase transition ${
                  osc2Type === t ? 'bg-amber-500 text-black font-black' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* FILTER 1 */}
        <div className="bg-stone-900/80 p-2.5 rounded border border-stone-700 space-y-2">
          <span className="text-[9px] font-black text-amber-400 uppercase block border-b border-stone-700 pb-1">
            MULTI-MODE FILTER 1
          </span>
          <div className="space-y-2 text-[10px]">
            <div className="flex items-center justify-between">
              <span className="text-stone-300">Cutoff:</span>
              <span className="text-amber-400 font-bold">{filter1Cutoff}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={filter1Cutoff}
              onChange={(e) => setFilter1Cutoff(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Expanded Programmer Section */}
      {showProgrammer && (
        <div className="bg-black/70 p-3 rounded-lg border border-amber-900/60 space-y-2">
          <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest block">
            THOR MODULATION MATRIX & ROUTING
          </span>
          <div className="grid grid-cols-3 gap-2 text-[10px]">
            <div className="bg-stone-900/90 p-2 rounded border border-stone-800 flex justify-between">
              <span className="text-stone-400">LFO 1 &gt; Filter Cutoff:</span>
              <span className="text-emerald-400 font-bold">+65%</span>
            </div>
            <div className="bg-stone-900/90 p-2 rounded border border-stone-800 flex justify-between">
              <span className="text-stone-400">ModWheel &gt; FM Depth:</span>
              <span className="text-amber-400 font-bold">+40%</span>
            </div>
            <div className="bg-stone-900/90 p-2 rounded border border-stone-800 flex justify-between">
              <span className="text-stone-400">Amp Env &gt; Stereo Pan:</span>
              <span className="text-cyan-400 font-bold">L/R Ping</span>
            </div>
          </div>
        </div>
      )}

      {/* Test Keys */}
      <div className="flex items-center gap-1 overflow-x-auto bg-black/60 p-1.5 rounded-lg border border-stone-800">
        <span className="text-[9px] font-bold text-amber-400 uppercase mr-2 shrink-0">TEST THOR:</span>
        {[130.81, 164.81, 196.0, 220.0, 261.63, 329.63].map((f, i) => (
          <button
            key={i}
            onClick={() => handleTestNote(f)}
            className="px-3 py-1 bg-amber-950 hover:bg-amber-500 hover:text-black text-amber-200 font-bold rounded text-[10px] transition border border-amber-800/60 shrink-0"
          >
            NOTE {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 8. POLYTONE DUAL-LAYER SYNTHESIZER
// ---------------------------------------------------------------------------
export const PolytoneSynthDevice: React.FC = () => {
  const [layerMix, setLayerMix] = useState<number>(50); // Layer A vs Layer B
  const [layerAWave, setLayerAWave] = useState<'Saw' | 'Pulse' | 'Sine'>('Saw');
  const [layerBWave, setLayerBWave] = useState<'Saw' | 'Pulse' | 'Sine'>('Pulse');

  return (
    <div className="bg-gradient-to-r from-violet-950 via-slate-900 to-violet-950 border-2 border-violet-600/80 rounded-xl p-3 font-mono text-xs text-violet-100 shadow-2xl space-y-3">
      <div className="bg-violet-950/90 border border-violet-700/80 p-2 rounded-lg flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-black bg-violet-400 px-2 py-0.5 rounded uppercase tracking-widest">
            POLYTONE
          </span>
          <span className="text-[10px] font-bold text-violet-300">DUAL-LAYER ANALOG SYNTHESIZER</span>
        </div>
        <span className="text-[9px] font-black text-amber-400">WARM VINTAGE TIMBRE</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-black/40 p-2.5 rounded-lg border border-violet-900/60">
        {/* Layer A */}
        <div className="bg-violet-950/60 p-2.5 rounded border border-violet-800/60 space-y-2">
          <span className="text-[9px] font-black text-violet-300 uppercase block">LAYER A (WARM LEAD)</span>
          <div className="flex gap-1 text-[9px]">
            {(['Saw', 'Pulse', 'Sine'] as const).map((w) => (
              <button
                key={w}
                onClick={() => setLayerAWave(w)}
                className={`py-1 px-2 rounded font-bold uppercase transition flex-1 ${
                  layerAWave === w ? 'bg-violet-400 text-black font-black' : 'bg-violet-900/50 text-violet-200'
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        {/* Morph Slider */}
        <div className="bg-violet-950/60 p-2.5 rounded border border-violet-800/60 space-y-2">
          <div className="flex justify-between text-[9px] font-black text-amber-400">
            <span>LAYER A: {100 - layerMix}%</span>
            <span>LAYER B: {layerMix}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={layerMix}
            onChange={(e) => setLayerMix(Number(e.target.value))}
            className="w-full accent-amber-400 cursor-pointer"
          />
          <span className="text-[9px] text-violet-300 block text-center">LAYER MORPH BALANCE</span>
        </div>

        {/* Layer B */}
        <div className="bg-violet-950/60 p-2.5 rounded border border-violet-800/60 space-y-2">
          <span className="text-[9px] font-black text-violet-300 uppercase block">LAYER B (SUB BASS)</span>
          <div className="flex gap-1 text-[9px]">
            {(['Saw', 'Pulse', 'Sine'] as const).map((w) => (
              <button
                key={w}
                onClick={() => setLayerBWave(w)}
                className={`py-1 px-2 rounded font-bold uppercase transition flex-1 ${
                  layerBWave === w ? 'bg-violet-400 text-black font-black' : 'bg-violet-900/50 text-violet-200'
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 9. MIMIC CREATIVE SAMPLER
// ---------------------------------------------------------------------------
export const MimicSamplerDevice: React.FC = () => {
  const [pitchShift, setPitchShift] = useState<number>(0);
  const [sliceMode, setSliceMode] = useState<'Transient' | 'Grid' | 'Manual'>('Transient');

  return (
    <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-2 border-emerald-600/80 rounded-xl p-3 font-mono text-xs text-emerald-100 shadow-2xl space-y-3">
      <div className="bg-emerald-950/90 border border-emerald-700/80 p-2 rounded-lg flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-black bg-emerald-400 px-2 py-0.5 rounded uppercase tracking-widest">
            MIMIC
          </span>
          <span className="text-[10px] font-bold text-emerald-300">CREATIVE PITCH & SLICE SAMPLER</span>
        </div>
        <span className="text-[9px] font-black text-amber-400">SMART TRANSIENT SLICER</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-black/40 p-2.5 rounded-lg border border-emerald-900/60">
        {/* Waveform Visualization */}
        <div className="bg-emerald-950/60 p-2.5 rounded border border-emerald-800/60 space-y-1">
          <span className="text-[9px] font-black text-emerald-300 uppercase block">SAMPLE SLICE WAVEFORM</span>
          <div className="h-16 bg-black/80 rounded border border-emerald-800 p-2 flex items-center justify-center relative overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 100 30">
              <path
                d="M 0,15 Q 10,2 20,15 T 40,28 T 60,5 T 80,22 T 100,15"
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
              />
              {[20, 40, 60, 80].map((x) => (
                <line key={x} x1={x} y1={0} x2={x} y2={30} stroke="#fbbf24" strokeWidth="1" strokeDasharray="2,2" />
              ))}
            </svg>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-emerald-950/60 p-2.5 rounded border border-emerald-800/60 space-y-2">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-emerald-200">Pitch Shift:</span>
            <span className="text-amber-400 font-bold">{pitchShift} st</span>
          </div>
          <input
            type="range"
            min="-12"
            max="12"
            value={pitchShift}
            onChange={(e) => setPitchShift(Number(e.target.value))}
            className="w-full accent-emerald-400 cursor-pointer"
          />

          <div className="flex justify-between items-center text-[10px] pt-1">
            <span className="text-emerald-200">Slice Mode:</span>
            <div className="flex gap-1">
              {(['Transient', 'Grid', 'Manual'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setSliceMode(m)}
                  className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                    sliceMode === m ? 'bg-amber-500 text-black font-black' : 'bg-emerald-900/60 text-emerald-200'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 10. PULVERIZER DEMOLITION UNIT
// ---------------------------------------------------------------------------
export const PulverizerDemolitionDevice: React.FC = () => {
  const [squash, setSquash] = useState<number>(70);
  const [dirt, setDirt] = useState<number>(50);

  return (
    <div className="bg-gradient-to-r from-amber-950 via-stone-900 to-amber-950 border-2 border-amber-700/80 rounded-xl p-3 font-mono text-xs text-amber-100 shadow-2xl space-y-3">
      <div className="bg-amber-950/90 border border-amber-800/80 p-2 rounded-lg flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-black bg-amber-500 px-2 py-0.5 rounded uppercase tracking-widest">
            PULVERIZER
          </span>
          <span className="text-[10px] font-bold text-amber-200">DEMOLITION COMPRESSOR & DIRT UNIT</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-black/40 p-2.5 rounded-lg border border-amber-900/60">
        <div className="bg-amber-950/60 p-2.5 rounded border border-amber-800/60 space-y-2">
          <div className="flex justify-between text-[10px]">
            <span className="text-amber-200">Squash Compression:</span>
            <span className="text-amber-400 font-bold">{squash}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={squash}
            onChange={(e) => setSquash(Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>

        <div className="bg-amber-950/60 p-2.5 rounded border border-amber-800/60 space-y-2">
          <div className="flex justify-between text-[10px]">
            <span className="text-amber-200">Dirt Distortion:</span>
            <span className="text-rose-400 font-bold">{dirt}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={dirt}
            onChange={(e) => setDirt(Number(e.target.value))}
            className="w-full accent-rose-500 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 11. AUDIOMATIC RETRO TRANSFORMER
// ---------------------------------------------------------------------------
export const AudiomaticRetroDevice: React.FC = () => {
  const [retroMode, setRetroMode] = useState<'Tape' | 'Phonograph' | 'MP3' | 'Futura' | 'Tube'>('Tape');
  const [transform, setTransform] = useState<number>(65);

  return (
    <div className="bg-gradient-to-r from-orange-950 via-stone-900 to-orange-950 border-2 border-orange-600/80 rounded-xl p-3 font-mono text-xs text-orange-100 shadow-2xl space-y-3">
      <div className="bg-orange-950/90 border border-orange-700/80 p-2 rounded-lg flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-black bg-orange-400 px-2 py-0.5 rounded uppercase tracking-widest">
            AUDIOMATIC
          </span>
          <span className="text-[10px] font-bold text-orange-200">RETRO TRANSFORMER</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-black/40 p-2.5 rounded-lg border border-orange-900/60">
        <div className="bg-orange-950/60 p-2.5 rounded border border-orange-800/60 space-y-2">
          <span className="text-[9px] font-black text-orange-300 uppercase block">CHARACTER PRESET</span>
          <div className="grid grid-cols-3 gap-1">
            {(['Tape', 'Phonograph', 'MP3', 'Futura', 'Tube'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setRetroMode(m)}
                className={`py-1 rounded text-[9px] font-bold ${
                  retroMode === m ? 'bg-orange-400 text-black font-black' : 'bg-orange-900/50 text-orange-200'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-orange-950/60 p-2.5 rounded border border-orange-800/60 space-y-2">
          <div className="flex justify-between text-[10px]">
            <span className="text-orange-200">Transform Amount:</span>
            <span className="text-amber-400 font-bold">{transform}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={transform}
            onChange={(e) => setTransform(Number(e.target.value))}
            className="w-full accent-orange-400 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 12. SPIDER AUDIO & CV MERGER / SPLITTER
// ---------------------------------------------------------------------------
export const SpiderCvSplitterDevice: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-zinc-900 via-stone-900 to-zinc-900 border-2 border-stone-600 rounded-xl p-3 font-mono text-xs text-stone-200 shadow-2xl space-y-2">
      <div className="flex items-center justify-between border-b border-stone-800 pb-1">
        <span className="text-[10px] font-black text-amber-400 uppercase">SPIDER AUDIO & CV SPLITTER / MERGER</span>
        <span className="text-[9px] text-stone-400">PASSTHROUGH ROUTING UTILITY</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[10px] bg-black/60 p-2 rounded">
        <div className="border-r border-stone-800 pr-2">
          <span className="text-amber-400 font-bold block mb-1">AUDIO MERGER</span>
          <span>In A L/R + In B L/R &rarr; Out L/R</span>
        </div>
        <div>
          <span className="text-cyan-400 font-bold block mb-1">CV SPLITTER</span>
          <span>CV In &rarr; 4x Buffered CV Outputs</span>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 13. LINEMIXER 6:2 MICRO MIXER
// ---------------------------------------------------------------------------
export const LineMixer62Device: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-neutral-900 via-stone-900 to-neutral-900 border-2 border-stone-700 rounded-xl p-3 font-mono text-xs text-stone-200 shadow-2xl space-y-2">
      <div className="flex items-center justify-between border-b border-stone-800 pb-1">
        <span className="text-[10px] font-black text-emerald-400 uppercase">MICRO MIX LINE MIXER 6:2</span>
        <span className="text-[9px] text-stone-400">6 STEREO INPUT CHANNELS</span>
      </div>
      <div className="grid grid-cols-6 gap-1 text-[9px] text-center bg-black/60 p-2 rounded">
        {[1, 2, 3, 4, 5, 6].map((ch) => (
          <div key={ch} className="border-r border-stone-800 last:border-0 px-1">
            <span className="text-emerald-400 font-bold block">CH {ch}</span>
            <span className="text-[8px] text-stone-400">L/R</span>
          </div>
        ))}
      </div>
    </div>
  );
};

