import React, { useState, useEffect } from 'react';
import { audioEngine } from '../../audio/engine';
import { X, Sliders, Volume2, Music, Sparkles, ChevronLeft, ChevronRight, Keyboard, Zap } from 'lucide-react';

interface VirtualPianoKeyboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetInstrumentName?: string;
}

export const VirtualPianoKeyboardModal: React.FC<VirtualPianoKeyboardModalProps> = ({
  isOpen,
  onClose,
  targetInstrumentName = 'Subtractor Polyphonic Synth',
}) => {
  const [octave, setOctave] = useState<number>(4);
  const [velocity, setVelocity] = useState<number>(100);
  const [synthWave, setSynthWave] = useState<OscillatorType>('sawtooth');
  const [activeKeys, setActiveKeys] = useState<Set<number>>(new Set());
  const [pitchBend, setPitchBend] = useState<number>(0);
  const [modWheel, setModWheel] = useState<number>(64);

  // QWERTY keyboard to semitone offset map (2 Octaves)
  // Row 1: A S D F G H J K L ; ' (White keys C to E)
  // W E T Y U O P (Black keys C#, D#, F#, G#, A#, C#, D#)
  const qwertyKeyMap: Record<string, number> = {
    a: 0, // C
    w: 1, // C#
    s: 2, // D
    e: 3, // D#
    d: 4, // E
    f: 5, // F
    t: 6, // F#
    g: 7, // G
    y: 8, // G#
    h: 9, // A
    u: 10, // A#
    j: 11, // B
    k: 12, // C (+1)
    o: 13, // C# (+1)
    l: 14, // D (+1)
    p: 15, // D# (+1)
    ';': 16, // E (+1)
  };

  const keysPerOctave = [
    { note: 'C', isBlack: false, offset: 0 },
    { note: 'C#', isBlack: true, offset: 1 },
    { note: 'D', isBlack: false, offset: 2 },
    { note: 'D#', isBlack: true, offset: 3 },
    { note: 'E', isBlack: false, offset: 4 },
    { note: 'F', isBlack: false, offset: 5 },
    { note: 'F#', isBlack: true, offset: 6 },
    { note: 'G', isBlack: false, offset: 7 },
    { note: 'G#', isBlack: true, offset: 8 },
    { note: 'A', isBlack: false, offset: 9 },
    { note: 'A#', isBlack: true, offset: 10 },
    { note: 'B', isBlack: false, offset: 11 },
  ];

  // Build 2 full octaves of keys
  const pianoKeys = [
    ...keysPerOctave.map((k) => ({ ...k, midiNote: (octave + 1) * 12 + k.offset, label: k.note })),
    ...keysPerOctave.map((k) => ({ ...k, midiNote: (octave + 2) * 12 + k.offset, label: `${k.note}'` })),
    { note: 'C', isBlack: false, offset: 24, midiNote: (octave + 3) * 12, label: 'C High' },
  ];

  const playNote = (midiNote: number) => {
    audioEngine.initAudio();
    const finalMidiNote = midiNote + Math.round(pitchBend / 32);
    const cutoff = 500 + (modWheel / 127) * 4500;
    audioEngine.triggerSynthNote(finalMidiNote, velocity, synthWave, cutoff);
    setActiveKeys((prev) => new Set(prev).add(midiNote));
    setTimeout(() => {
      setActiveKeys((prev) => {
        const next = new Set(prev);
        next.delete(midiNote);
        return next;
      });
    }, 250);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const key = e.key.toLowerCase();
      if (qwertyKeyMap[key] !== undefined) {
        const offset = qwertyKeyMap[key];
        const baseMidi = (octave + 1) * 12 + offset;
        playNote(baseMidi);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, octave, velocity, synthWave, pitchBend, modWheel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-x-0 bottom-10 z-[200] max-w-5xl mx-auto px-4 select-none animate-in slide-in-from-bottom-5 duration-200">
      <div className="bg-neutral-950 border-2 border-amber-500/80 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] p-4 text-white space-y-3 backdrop-blur-md">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-mono font-black text-sm text-white uppercase tracking-wider">
                  VIRTUAL ONSCREEN PIANO CONTROLLER
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  QWERTY & TOUCH READY
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Target: <span className="text-amber-300 font-bold">{targetInstrumentName}</span> (Use QWERTY keys <code className="text-amber-400">A-S-D-F-G-H-J-K</code> or click/touch keys)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Control Sliders & Octave Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-900/80 p-3 rounded-xl border border-neutral-800 text-xs">
          {/* Octave Controls */}
          <div className="flex items-center justify-between bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800">
            <span className="font-black text-[10px] text-amber-400 uppercase">OCTAVE: C{octave}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setOctave((o) => Math.max(1, o - 1))}
                className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setOctave((o) => Math.min(7, o + 1))}
                className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Synth Waveform Selector */}
          <div className="flex items-center justify-between bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800">
            <span className="font-black text-[10px] text-indigo-400 uppercase">WAVE: {synthWave.toUpperCase()}</span>
            <select
              value={synthWave}
              onChange={(e) => setSynthWave(e.target.value as OscillatorType)}
              className="bg-neutral-800 text-white font-bold rounded px-2 py-0.5 text-[10px] outline-none border border-neutral-700"
            >
              <option value="sawtooth">SAW</option>
              <option value="square">SQUARE</option>
              <option value="sine">SINE</option>
              <option value="triangle">TRIANGLE</option>
            </select>
          </div>

          {/* Velocity Slider */}
          <div className="flex items-center gap-2 bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800">
            <span className="font-black text-[10px] text-emerald-400 uppercase whitespace-nowrap">VEL: {velocity}</span>
            <input
              type="range"
              min="20"
              max="127"
              value={velocity}
              onChange={(e) => setVelocity(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer h-1"
            />
          </div>

          {/* Mod Wheel Cutoff Slider */}
          <div className="flex items-center gap-2 bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800">
            <span className="font-black text-[10px] text-amber-400 uppercase whitespace-nowrap">MOD: {modWheel}</span>
            <input
              type="range"
              min="0"
              max="127"
              value={modWheel}
              onChange={(e) => setModWheel(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-1"
            />
          </div>
        </div>

        {/* Interactive 2-Octave Piano Keys Container */}
        <div className="relative h-32 bg-neutral-900 p-2 rounded-xl border border-neutral-800 flex overflow-x-auto select-none touch-none scrollbar-none">
          {pianoKeys.map((k) => {
            if (k.isBlack) return null; // Black keys are absolute-positioned overlayed

            const isActive = activeKeys.has(k.midiNote);

            return (
              <div
                key={k.midiNote}
                onMouseDown={() => playNote(k.midiNote)}
                onTouchStart={(e) => {
                  e.preventDefault();
                  playNote(k.midiNote);
                }}
                className={`relative flex-1 min-w-[32px] h-full rounded-b-lg border-b-4 transition cursor-pointer flex flex-col justify-end pb-2 items-center text-[10px] font-black ${
                  isActive
                    ? 'bg-amber-400 text-neutral-950 border-amber-600 shadow-inner scale-[0.98]'
                    : 'bg-stone-100 hover:bg-stone-200 text-neutral-800 border-stone-400 shadow'
                }`}
              >
                <span className="opacity-70">{k.label}</span>
              </div>
            );
          })}

          {/* Overlay Black Keys */}
          <div className="absolute inset-x-2 top-2 h-20 pointer-events-none flex">
            {pianoKeys.map((k, idx) => {
              if (!k.isBlack) return <div key={idx} className="flex-1 min-w-[32px] pointer-events-none" />;

              const isActive = activeKeys.has(k.midiNote);

              return (
                <div
                  key={k.midiNote}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    playNote(k.midiNote);
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    playNote(k.midiNote);
                  }}
                  className={`pointer-events-auto absolute z-20 w-6 h-18 -ml-3 rounded-b-md border-b-2 transition cursor-pointer flex flex-col justify-end pb-1 items-center text-[8px] font-bold ${
                    isActive
                      ? 'bg-amber-500 text-neutral-950 border-amber-700 shadow-inner'
                      : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 border-neutral-950 shadow-2xl'
                  }`}
                  style={{
                    left: `${((idx - 0.5) / pianoKeys.length) * 100}%`,
                  }}
                >
                  <span>{k.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
