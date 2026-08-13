import React, { useState } from 'react';
import { audioEngine } from '../../audio/engine';
import { Disc3, Volume2, Play, Sliders, Repeat, Zap } from 'lucide-react';

export const DJWorkspace: React.FC = () => {
  const [crossfader, setCrossfader] = useState<number>(50); // 0 (Deck A) to 100 (Deck B)

  // Deck A State
  const [deckA, setDeckA] = useState({
    playing: false,
    tempo: 124.0,
    volume: 0.9,
    eqLow: 0,
    eqMid: 0,
    eqHigh: 0,
    jogAngle: 0,
  });

  // Deck B State
  const [deckB, setDeckB] = useState({
    playing: false,
    tempo: 128.0,
    volume: 0.85,
    eqLow: 0,
    eqMid: 0,
    eqHigh: 0,
    jogAngle: 0,
  });

  const triggerHotCue = (deck: 'A' | 'B', cueNum: number) => {
    const sampleId = cueNum % 2 === 0 ? 'kick_punch' : 'snare_808';
    audioEngine.triggerPad({
      id: `dj_cue_${deck}_${cueNum}`,
      name: `Cue ${cueNum}`,
      sampleUrl: sampleId,
      pitch: deck === 'A' ? 0 : 2,
      volume: 0.9,
      pan: deck === 'A' ? -0.5 : 0.5,
      startOffset: 0,
      endOffset: 1,
      loop: false,
      color: '#3b82f6',
      bank: 'A',
      rootNote: 60 + cueNum,
    });
  };

  const spinJog = (deck: 'A' | 'B') => {
    if (deck === 'A') {
      setDeckA((prev) => ({ ...prev, jogAngle: (prev.jogAngle + 45) % 360 }));
      audioEngine.triggerPad({
        id: 'scratch_a',
        name: 'Scratch A',
        sampleUrl: 'vinyl_scratch',
        pitch: 0,
        volume: 0.8,
        pan: -0.5,
        startOffset: 0,
        endOffset: 1,
        loop: false,
        color: '#3b82f6',
        bank: 'A',
        rootNote: 60,
      });
    } else {
      setDeckB((prev) => ({ ...prev, jogAngle: (prev.jogAngle + 45) % 360 }));
      audioEngine.triggerPad({
        id: 'scratch_b',
        name: 'Scratch B',
        sampleUrl: 'vinyl_scratch',
        pitch: 3,
        volume: 0.8,
        pan: 0.5,
        startOffset: 0,
        endOffset: 1,
        loop: false,
        color: '#ec4899',
        bank: 'B',
        rootNote: 62,
      });
    }
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      {/* DJ Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Disc3 className="w-5 h-5 text-indigo-400" />
            DJ Controller & Mixing Decks
          </h2>
          <p className="text-xs text-slate-400">
            Dual CDJ / Pioneer style decks with capacitive jog wheel scratch, hot cues, and 3-band EQ.
          </p>
        </div>
      </div>

      {/* Main DJ Console Layout: Deck A | Central Mixer | Deck B */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Deck A */}
        <div className="lg:col-span-5 bg-slate-950 border-2 border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-sm font-black text-indigo-400 tracking-wider">DECK A</span>
            <span className="text-xs font-mono font-bold text-slate-300">{deckA.tempo.toFixed(1)} BPM</span>
          </div>

          {/* Jog Wheel Deck A */}
          <div className="flex flex-col items-center justify-center py-4">
            <button
              onClick={() => spinJog('A')}
              className="w-44 h-44 rounded-full bg-slate-900 border-4 border-indigo-500/50 hover:border-indigo-400 flex items-center justify-center shadow-xl relative cursor-pointer active:scale-95 transition"
              style={{ transform: `rotate(${deckA.jogAngle}deg)` }}
            >
              <div className="w-20 h-20 rounded-full bg-slate-950 border-2 border-slate-800 flex items-center justify-center">
                <Disc3 className="w-8 h-8 text-indigo-400 animate-spin" />
              </div>
            </button>
            <span className="text-[10px] text-slate-500 font-mono mt-2">CLICK TO SCRATCH JOG</span>
          </div>

          {/* Hot Cues 1-4 */}
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((cue) => (
              <button
                key={cue}
                onClick={() => triggerHotCue('A', cue)}
                className="py-2 bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/50 text-indigo-200 text-xs font-bold rounded-xl active:scale-95 transition"
              >
                CUE {cue}
              </button>
            ))}
          </div>
        </div>

        {/* Central DJ Mixer */}
        <div className="lg:col-span-2 bg-slate-900 border-2 border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col justify-between space-y-4 text-center">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block border-b border-slate-800 pb-2">
            DJ MIXER
          </span>

          {/* Channel Faders */}
          <div className="flex justify-around items-end h-40">
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-mono text-indigo-400">CH A</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={deckA.volume}
                onChange={(e) => setDeckA((prev) => ({ ...prev, volume: Number(e.target.value) }))}
                className="h-28 accent-indigo-500 cursor-pointer [writing-mode:vertical-lr] [direction:rtl]"
              />
            </div>

            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-mono text-pink-400">CH B</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={deckB.volume}
                onChange={(e) => setDeckB((prev) => ({ ...prev, volume: Number(e.target.value) }))}
                className="h-28 accent-pink-500 cursor-pointer [writing-mode:vertical-lr] [direction:rtl]"
              />
            </div>
          </div>

          {/* Crossfader */}
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 block mb-1">CROSSFADER</span>
            <input
              type="range"
              min="0"
              max="100"
              value={crossfader}
              onChange={(e) => setCrossfader(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
              <span>DECK A</span>
              <span>DECK B</span>
            </div>
          </div>
        </div>

        {/* Deck B */}
        <div className="lg:col-span-5 bg-slate-950 border-2 border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-sm font-black text-pink-400 tracking-wider">DECK B</span>
            <span className="text-xs font-mono font-bold text-slate-300">{deckB.tempo.toFixed(1)} BPM</span>
          </div>

          {/* Jog Wheel Deck B */}
          <div className="flex flex-col items-center justify-center py-4">
            <button
              onClick={() => spinJog('B')}
              className="w-44 h-44 rounded-full bg-slate-900 border-4 border-pink-500/50 hover:border-pink-400 flex items-center justify-center shadow-xl relative cursor-pointer active:scale-95 transition"
              style={{ transform: `rotate(${deckB.jogAngle}deg)` }}
            >
              <div className="w-20 h-20 rounded-full bg-slate-950 border-2 border-slate-800 flex items-center justify-center">
                <Disc3 className="w-8 h-8 text-pink-400 animate-spin" />
              </div>
            </button>
            <span className="text-[10px] text-slate-500 font-mono mt-2">CLICK TO SCRATCH JOG</span>
          </div>

          {/* Hot Cues 1-4 */}
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((cue) => (
              <button
                key={cue}
                onClick={() => triggerHotCue('B', cue)}
                className="py-2 bg-pink-600/30 hover:bg-pink-600 border border-pink-500/50 text-pink-200 text-xs font-bold rounded-xl active:scale-95 transition"
              >
                CUE {cue}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
