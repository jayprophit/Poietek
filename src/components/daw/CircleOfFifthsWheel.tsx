import React, { useState } from 'react';
import { Compass, Music, Zap, Sparkles, Volume2, ShieldCheck } from 'lucide-react';
import { audioEngine } from '../../audio/engine';

export const CircleOfFifthsWheel: React.FC = () => {
  const [selectedKey, setSelectedKey] = useState<string>('C');
  const [mode, setMode] = useState<'major' | 'minor'>('major');

  const circleKeys = [
    { name: 'C', minor: 'Am', sharpFlat: '0 ♯/♭', color: '#6366f1' },
    { name: 'G', minor: 'Em', sharpFlat: '1 ♯', color: '#8b5cf6' },
    { name: 'D', minor: 'Bm', sharpFlat: '2 ♯', color: '#ec4899' },
    { name: 'A', minor: 'F♯m', sharpFlat: '3 ♯', color: '#f43f5e' },
    { name: 'E', minor: 'C♯m', sharpFlat: '4 ♯', color: '#f97316' },
    { name: 'B', minor: 'G♯m', sharpFlat: '5 ♯', color: '#eab308' },
    { name: 'F♯/G♭', minor: 'D♯m/E♭m', sharpFlat: '6 ♯/♭', color: '#84cc16' },
    { name: 'D♭/C♯', minor: 'B♭m', sharpFlat: '5 ♭', color: '#10b981' },
    { name: 'A♭', minor: 'Fm', sharpFlat: '4 ♭', color: '#06b6d4' },
    { name: 'E♭', minor: 'Cm', sharpFlat: '3 ♭', color: '#0284c7' },
    { name: 'B♭', minor: 'Gm', sharpFlat: '2 ♭', color: '#3b82f6' },
    { name: 'F', minor: 'Dm', sharpFlat: '1 ♭', color: '#6366f1' },
  ];

  const getRelativeChords = (key: string) => {
    switch (key) {
      case 'C':
        return { I: 'C Major', ii: 'D minor', iii: 'E minor', IV: 'F Major', V: 'G Major', vi: 'A minor', vii: 'B dim' };
      case 'G':
        return { I: 'G Major', ii: 'A minor', iii: 'B minor', IV: 'C Major', V: 'D Major', vi: 'E minor', vii: 'F# dim' };
      case 'F':
        return { I: 'F Major', ii: 'G minor', iii: 'A minor', IV: 'Bb Major', V: 'C Major', vi: 'D minor', vii: 'E dim' };
      default:
        return { I: `${key} Major`, ii: 'ii Minor', iii: 'iii Minor', IV: 'IV Major', V: 'V Major', vi: 'vi Minor', vii: 'vii Dim' };
    }
  };

  const currentChords = getRelativeChords(selectedKey);

  const playChord = (chordName: string) => {
    audioEngine.initAudio();
    audioEngine.triggerMetronome(true);
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6 select-none font-mono">
      {/* Header */}
      <div className="bg-gradient-to-r from-neutral-900 via-stone-900 to-neutral-900 border-2 border-neutral-700 rounded-2xl p-5 shadow-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
            <Compass className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-lg font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
              CIRCLE OF FIFTHS HARMONY WHEEL & CHORD ENGINE
            </h2>
            <p className="text-xs text-neutral-400">
              Interactive key modulator, relative scale matrix & automatic harmony chord generator.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode('major')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
              mode === 'major'
                ? 'bg-amber-500 text-neutral-950 border-amber-300 font-black shadow'
                : 'bg-neutral-800 text-neutral-400 border-neutral-700'
            }`}
          >
            MAJOR KEYS
          </button>
          <button
            onClick={() => setMode('minor')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
              mode === 'minor'
                ? 'bg-amber-500 text-neutral-950 border-amber-300 font-black shadow'
                : 'bg-neutral-800 text-neutral-400 border-neutral-700'
            }`}
          >
            RELATIVE MINOR
          </button>
        </div>
      </div>

      {/* Main Wheel Grid & Chords Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Circle Graphic Panel */}
        <div className="lg:col-span-7 bg-neutral-900 border-2 border-neutral-700 rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-center relative min-h-[380px]">
          <span className="text-xs font-bold text-amber-500 block mb-4 uppercase">
            HARMONIC KEY WHEEL — CLICK KEY TO LOCK HARMONY
          </span>

          {/* Radial Wheel */}
          <div className="relative w-72 h-72 rounded-full border-4 border-neutral-700 bg-neutral-950 flex items-center justify-center shadow-2xl">
            {circleKeys.map((k, idx) => {
              const angle = (idx * 30 - 90) * (Math.PI / 180);
              const radius = 105; // px
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              const isSelected = selectedKey === k.name;

              return (
                <button
                  key={k.name}
                  onClick={() => setSelectedKey(k.name)}
                  style={{
                    transform: `translate(${x}px, ${y}px)`,
                  }}
                  className={`absolute w-12 h-12 rounded-full font-bold text-xs transition-all flex flex-col items-center justify-center border-2 shadow-lg ${
                    isSelected
                      ? 'bg-amber-500 border-amber-200 text-neutral-950 scale-125 z-20 ring-4 ring-amber-500/40 font-black'
                      : 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:border-neutral-400 hover:scale-110'
                  }`}
                >
                  <span>{mode === 'major' ? k.name : k.minor}</span>
                  <span className="text-[8px] opacity-70 font-normal">{k.sharpFlat}</span>
                </button>
              );
            })}

            {/* Inner Center Orb */}
            <div className="w-24 h-24 rounded-full bg-neutral-900 border-2 border-amber-500/60 flex flex-col items-center justify-center shadow-inner text-center p-2">
              <span className="text-[9px] text-neutral-500 block uppercase">KEY CENTER</span>
              <span className="text-lg font-black text-amber-400">{selectedKey}</span>
              <span className="text-[9px] text-emerald-400 font-bold uppercase">{mode}</span>
            </div>
          </div>
        </div>

        {/* Diatonic Chord Palette */}
        <div className="lg:col-span-5 bg-neutral-900 border-2 border-neutral-700 rounded-3xl p-6 shadow-2xl space-y-4">
          <h3 className="text-xs font-bold text-neutral-300 uppercase border-b border-neutral-800 pb-2 flex items-center gap-2">
            <Music className="w-4 h-4 text-amber-400" />
            Diatonic Scale Chords for Key of {selectedKey}
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {Object.entries(currentChords).map(([deg, name]) => (
              <button
                key={deg}
                onClick={() => playChord(name)}
                className="bg-neutral-950 hover:bg-neutral-800 border-2 border-neutral-800 hover:border-amber-500 rounded-2xl p-3 text-left transition shadow group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-500 uppercase">{deg}</span>
                  <Volume2 className="w-3.5 h-3.5 text-neutral-600 group-hover:text-amber-400 transition" />
                </div>
                <div className="text-xs font-black text-neutral-200 mt-1">{name}</div>
              </button>
            ))}
          </div>

          <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-2">
            <span className="text-[10px] text-neutral-400 block font-bold uppercase">PROGRESION SUGGESTIONS</span>
            <div className="flex gap-2">
              {['I - IV - V - I', 'ii - V - I', 'I - vi - IV - V'].map((prog) => (
                <button
                  key={prog}
                  onClick={() => playChord(prog)}
                  className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-[10px] font-bold border border-neutral-700 transition"
                >
                  {prog}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
