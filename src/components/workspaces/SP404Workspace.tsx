import React, { useState } from 'react';
import { SamplePad } from '../../types';
import { audioEngine } from '../../audio/engine';
import { Flame, Disc, Radio, Sliders, Play, RefreshCw, Volume2 } from 'lucide-react';

interface SP404WorkspaceProps {
  pads: SamplePad[];
  setPads: React.Dispatch<React.SetStateAction<SamplePad[]>>;
  onSimulateMIDI: (type: 'note_on' | 'note_off', channel: number, note: number, velocity: number) => void;
}

export const SP404Workspace: React.FC<SP404WorkspaceProps> = ({
  pads,
  setPads,
  onSimulateMIDI,
}) => {
  const [activeBank, setActiveBank] = useState<string>('A');
  const [selectedEffect, setSelectedEffect] = useState<string>('Vinyl Sim');
  const [resampleMode, setResampleMode] = useState<boolean>(false);

  // CTRL Knob values
  const [ctrl1, setCtrl1] = useState<number>(64);
  const [ctrl2, setCtrl2] = useState<number>(80);
  const [ctrl3, setCtrl3] = useState<number>(45);

  const bankLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  const bankPads = pads.filter((p) => p.bank === activeBank);

  const spEffects = [
    { id: 'vinyl_sim', name: 'Vinyl Sim', color: 'bg-amber-600' },
    { id: 'isolator', name: 'Isolator', color: 'bg-rose-600' },
    { id: 'cassette', name: '303 Vinyl/Tape', color: 'bg-orange-600' },
    { id: 'filter_drive', name: 'Filter+Drive', color: 'bg-emerald-600' },
    { id: 'pitch_delay', name: 'Pitch Delay', color: 'bg-indigo-600' },
    { id: 'lofi_mfx', name: 'Super Lo-Fi MFX', color: 'bg-purple-600' },
  ];

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      {/* SP-404 Hardware Console Frame */}
      <div className="bg-slate-950 border-2 border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        {/* SP Brand Label & OLED Display Header */}
        <div className="flex flex-wrap items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white font-black shadow-lg shadow-orange-600/30">
              SP
            </div>
            <div>
              <h2 className="text-xl font-black tracking-widest text-white uppercase flex items-center gap-2">
                Roland SP-404MKII Studio
              </h2>
              <p className="text-xs text-slate-400">
                10 Sample Banks (A-J) • Dual MFX Processor • Live Resampling Engine
              </p>
            </div>
          </div>

          {/* Simulated Retro OLED Display Screen */}
          <div className="bg-emerald-950/80 border-2 border-emerald-500/40 rounded-xl px-5 py-3 text-emerald-400 font-mono shadow-inner min-w-[240px] text-center">
            <div className="text-[10px] text-emerald-600 uppercase font-semibold">OLED DISPLAY — BANK {activeBank}</div>
            <div className="text-lg font-bold tracking-wider text-emerald-300 mt-0.5">
              FX: {selectedEffect.toUpperCase()}
            </div>
            <div className="flex items-center justify-between text-[11px] text-emerald-500 mt-1 border-t border-emerald-800/50 pt-1">
              <span>CTRL1: {ctrl1}</span>
              <span>CTRL2: {ctrl2}</span>
              <span>CTRL3: {ctrl3}</span>
            </div>
          </div>
        </div>

        {/* Top Control Knobs & MFX Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 my-6">
          {/* CTRL 1-3 Tweakers */}
          <div className="md:col-span-6 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex items-center justify-around">
            <div className="text-center">
              <span className="text-[10px] font-mono text-slate-400 block mb-1">CTRL 1 (ISOLATOR)</span>
              <input
                type="range"
                min="0"
                max="127"
                value={ctrl1}
                onChange={(e) => setCtrl1(Number(e.target.value))}
                className="w-24 accent-orange-500 cursor-pointer"
              />
            </div>
            <div className="text-center pr-2 border-r border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 block mb-1">CTRL 2 (PITCH)</span>
              <input
                type="range"
                min="0"
                max="127"
                value={ctrl2}
                onChange={(e) => setCtrl2(Number(e.target.value))}
                className="w-24 accent-orange-500 cursor-pointer"
              />
            </div>
            <div className="text-center pl-2">
              <span className="text-[10px] font-mono text-slate-400 block mb-1">CTRL 3 (DRIVE/CUT)</span>
              <input
                type="range"
                min="0"
                max="127"
                value={ctrl3}
                onChange={(e) => setCtrl3(Number(e.target.value))}
                className="w-24 accent-orange-500 cursor-pointer"
              />
            </div>
          </div>

          {/* MFX Effect Selector Buttons */}
          <div className="md:col-span-6 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
            <span className="text-xs font-bold text-slate-300 block mb-2 uppercase tracking-wide">
              SP-404 MFX Effect Pads
            </span>
            <div className="grid grid-cols-3 gap-2">
              {spEffects.map((fx) => (
                <button
                  key={fx.id}
                  onClick={() => setSelectedEffect(fx.name)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold text-white transition active:scale-95 flex items-center justify-center gap-1.5 ${
                    selectedEffect === fx.name
                      ? `${fx.color} ring-2 ring-white shadow-lg`
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>{fx.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bank Selection Ribbon (Banks A - J) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 border-b border-slate-800">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider pr-2">SP Banks:</span>
          {bankLetters.map((letter) => (
            <button
              key={letter}
              onClick={() => setActiveBank(letter)}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
                activeBank === letter
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30 ring-2 ring-orange-500/50'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Bank {letter}
            </button>
          ))}
          <button
            onClick={() => setResampleMode(!resampleMode)}
            className={`ml-auto px-4 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
              resampleMode
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/40 animate-pulse'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{resampleMode ? 'RESAMPLE ACTIVE' : 'RESAMPLE'}</span>
          </button>
        </div>

        {/* 16 SP Rubber Performance Pad Matrix */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          {Array.from({ length: 16 }).map((_, i) => {
            const pad = bankPads[i] || {
              id: `sp_pad_${activeBank}_${i}`,
              name: `Sample ${activeBank}${(i + 1).toString().padStart(2, '0')}`,
              color: '#f97316',
              rootNote: 48 + i,
              bank: activeBank,
              pitch: 0,
              volume: 0.85,
              pan: 0,
              startOffset: 0,
              endOffset: 1,
              loop: false,
            };

            return (
              <button
                key={pad.id}
                onClick={() => {
                  audioEngine.triggerPad(pad, 127);
                  onSimulateMIDI('note_on', 1, pad.rootNote, 127);
                }}
                className="h-28 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-slate-800 hover:border-orange-500/60 p-3 flex flex-col justify-between text-left transition-all active:scale-95 hover:shadow-lg hover:shadow-orange-500/10 group cursor-pointer"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-orange-400 text-xs font-black flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition">
                    {i + 1}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">Bank {activeBank}</span>
                </div>

                <div>
                  <p className="text-xs font-bold text-white truncate group-hover:text-orange-300 transition">
                    {pad.name}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Vol: {Math.round(pad.volume * 100)}%
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
