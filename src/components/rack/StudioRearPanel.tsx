import React, { useState } from 'react';
import { WorkspaceType, MasterState } from '../../types';
import { Radio, RefreshCw, Zap, Sliders, Check, Plus, Trash2, ArrowRightLeft } from 'lucide-react';

interface StudioRearPanelProps {
  masterState: MasterState;
  onToggleFlip: () => void;
}

interface PatchConnection {
  id: string;
  fromUnit: string;
  fromJack: string;
  fromX: number; // percentage
  fromY: number; // px
  toUnit: string;
  toJack: string;
  toX: number; // percentage
  toY: number; // px
  color: string;
}

export const StudioRearPanel: React.FC<StudioRearPanelProps> = ({ masterState, onToggleFlip }) => {
  // Preset patch cables representing signal flow
  const [connections, setConnections] = useState<PatchConnection[]>([
    {
      id: 'cable_1',
      fromUnit: 'Canvas Drum Grid',
      fromJack: 'Main Audio Out L',
      fromX: 25,
      fromY: 180,
      toUnit: 'Hardware Interface',
      toJack: 'Audio In 1',
      toX: 18,
      toY: 60,
      color: '#ef4444', // Red cable
    },
    {
      id: 'cable_2',
      fromUnit: 'Canvas Drum Grid',
      fromJack: 'Main Audio Out R',
      fromX: 30,
      fromY: 180,
      toUnit: 'Hardware Interface',
      toJack: 'Audio In 2',
      toX: 23,
      toY: 60,
      color: '#ef4444', // Red cable
    },
    {
      id: 'cable_3',
      fromUnit: 'Analog Synth Engine',
      fromJack: 'CV Pitch Out',
      fromX: 60,
      fromY: 340,
      toUnit: 'Matrix Sequencer',
      toJack: 'CV Gate In',
      toX: 75,
      toY: 220,
      color: '#eab308', // Yellow CV cable
    },
    {
      id: 'cable_4',
      fromUnit: 'Grain Deck FX',
      fromJack: 'Send FX 1 Out',
      fromX: 82,
      fromY: 180,
      toUnit: 'Master Studio Mixer',
      toJack: 'Aux Return L/R',
      toX: 45,
      toY: 340,
      color: '#3b82f6', // Cyan audio cable
    },
  ]);

  const [selectedJack, setSelectedJack] = useState<{
    unit: string;
    jack: string;
    x: number;
    y: number;
  } | null>(null);

  const cableColors = ['#ef4444', '#f97316', '#eab308', '#10b981', '#06b6d4', '#8b5cf6', '#ec4899'];

  const handleJackClick = (unit: string, jack: string, x: number, y: number) => {
    if (!selectedJack) {
      setSelectedJack({ unit, jack, x, y });
    } else {
      // Connect
      if (selectedJack.unit === unit && selectedJack.jack === jack) {
        setSelectedJack(null);
        return;
      }
      const newCable: PatchConnection = {
        id: `cable_${Date.now()}`,
        fromUnit: selectedJack.unit,
        fromJack: selectedJack.jack,
        fromX: selectedJack.x,
        fromY: selectedJack.y,
        toUnit: unit,
        toJack: jack,
        toX: x,
        toY: y,
        color: cableColors[Math.floor(Math.random() * cableColors.length)],
      };
      setConnections((prev) => [...prev, newCable]);
      setSelectedJack(null);
    }
  };

  const removeCable = (id: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== id));
  };

  const resetDefaultRouting = () => {
    setConnections([
      { id: 'c1', fromUnit: 'Active Unit', fromJack: 'Main Out L', fromX: 20, fromY: 180, toUnit: 'Hardware Interface', toJack: 'In 1', toX: 18, toY: 60, color: '#ef4444' },
      { id: 'c2', fromUnit: 'Active Unit', fromJack: 'Main Out R', fromX: 25, fromY: 180, toUnit: 'Hardware Interface', toJack: 'In 2', toX: 23, toY: 60, color: '#ef4444' },
      { id: 'c3', fromUnit: 'Studio Mixer', fromJack: 'Send 1', fromX: 70, fromY: 340, toUnit: 'Grain Deck FX', toJack: 'FX In', toX: 80, toY: 180, color: '#3b82f6' },
    ]);
  };

  return (
    <div className="relative bg-neutral-950 min-h-[600px] border-2 border-neutral-800 rounded-2xl p-6 overflow-hidden select-none shadow-2xl">
      {/* Background Rack Rail Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:12px_12px] opacity-60" />

      {/* Top Rear Bar */}
      <div className="relative z-10 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 border-2 border-neutral-700 rounded-xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-sm font-mono font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
            <Radio className="w-4 h-4 animate-pulse" />
            HARDWARE REAR PANEL & CV/AUDIO PATCH BAY
          </h2>
          <p className="text-[11px] text-neutral-400 font-mono">
            Click any jack socket to route physical Audio & CV (Control Voltage) signals with dangling patch cords.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetDefaultRouting}
            className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-mono text-xs border border-neutral-600 transition flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
            <span>RESET DEFAULT PATCHING</span>
          </button>

          <button
            onClick={() => setConnections([])}
            className="px-3 py-1.5 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-300 font-mono text-xs border border-rose-800 transition flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>UNPLUG ALL</span>
          </button>

          <button
            onClick={onToggleFlip}
            className="px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black font-mono text-xs transition shadow-lg shadow-amber-500/20 flex items-center gap-1"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>FRONT RACK (TAB)</span>
          </button>
        </div>
      </div>

      {/* Interactive SVG Cables Overlay Layer */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-30">
        {connections.map((c) => {
          // Calculate realistic sag curve for patch cables
          const startX = (c.fromX / 100) * 1000; // approximate width scale
          const startY = c.fromY;
          const endX = (c.toX / 100) * 1000;
          const endY = c.toY;
          const sagY = Math.max(startY, endY) + 80;

          return (
            <g key={c.id} className="pointer-events-auto cursor-pointer" onClick={() => removeCable(c.id)}>
              {/* Cable Outer Shadow */}
              <path
                d={`M ${startX} ${startY} C ${startX} ${sagY}, ${endX} ${sagY}, ${endX} ${endY}`}
                fill="none"
                stroke="black"
                strokeWidth="7"
                strokeOpacity="0.6"
              />
              {/* Main Cable Wire */}
              <path
                d={`M ${startX} ${startY} C ${startX} ${sagY}, ${endX} ${sagY}, ${endX} ${endY}`}
                fill="none"
                stroke={c.color}
                strokeWidth="4"
                strokeLinecap="round"
              />
              {/* Plug End Rings */}
              <circle cx={startX} cy={startY} r="5" fill="#171717" stroke="#fbbf24" strokeWidth="1.5" />
              <circle cx={endX} cy={endY} r="5" fill="#171717" stroke="#fbbf24" strokeWidth="1.5" />
            </g>
          );
        })}
      </svg>

      {/* Rear Device Hardware Chassis Stacks */}
      <div className="relative z-10 space-y-6">
        {/* Unit 1: Hardware Interface Rear Chassis */}
        <div className="bg-gradient-to-r from-neutral-900 via-stone-900 to-neutral-900 border-2 border-neutral-700 rounded-2xl p-5 shadow-2xl relative">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-4">
            <span className="font-mono text-xs font-bold text-amber-500 uppercase tracking-wider">
              1. HARDWARE AUDIO & MIDI INTERFACE (REAR)
            </span>
            <span className="text-[10px] font-mono text-neutral-500">64 AUDIO I/O BUS • 16 MIDI CHANNELS</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Audio In Jack Sockets */}
            <div>
              <span className="text-[10px] font-mono font-bold text-neutral-400 block mb-2 uppercase">AUDIO INPUTS (1-8)</span>
              <div className="flex flex-wrap gap-2">
                {['In 1', 'In 2', 'In 3', 'In 4', 'In 5', 'In 6', 'In 7', 'In 8'].map((j, idx) => (
                  <button
                    key={j}
                    onClick={() => handleJackClick('Hardware Interface', j, 15 + idx * 4, 60)}
                    className={`w-10 h-10 rounded-full border-2 bg-neutral-950 flex items-center justify-center text-[9px] font-mono font-bold shadow-inner transition ${
                      selectedJack?.jack === j ? 'border-amber-400 bg-amber-950 text-white animate-pulse' : 'border-neutral-600 text-neutral-300 hover:border-amber-500'
                    }`}
                  >
                    {j}
                  </button>
                ))}
              </div>
            </div>

            {/* Audio Out Jack Sockets */}
            <div>
              <span className="text-[10px] font-mono font-bold text-neutral-400 block mb-2 uppercase">MASTER AUDIO OUTPUTS</span>
              <div className="flex flex-wrap gap-2">
                {['Out 1 (L)', 'Out 2 (R)', 'Monitor L', 'Monitor R'].map((j, idx) => (
                  <button
                    key={j}
                    onClick={() => handleJackClick('Hardware Interface', j, 45 + idx * 5, 60)}
                    className="w-10 h-10 rounded-full border-2 border-emerald-600 bg-neutral-950 flex items-center justify-center text-[9px] font-mono font-bold text-emerald-300 shadow-inner hover:border-emerald-400 transition"
                  >
                    {j}
                  </button>
                ))}
              </div>
            </div>

            {/* CV & Sync Jacks */}
            <div>
              <span className="text-[10px] font-mono font-bold text-neutral-400 block mb-2 uppercase">MASTER CV & CLOCK SYNC</span>
              <div className="flex flex-wrap gap-2">
                {['Gate Out', 'Pitch Out', 'Clock Sync', 'Reset CV'].map((j, idx) => (
                  <button
                    key={j}
                    onClick={() => handleJackClick('Hardware Interface', j, 75 + idx * 5, 60)}
                    className="w-10 h-10 rounded-full border-2 border-amber-600 bg-neutral-950 flex items-center justify-center text-[9px] font-mono font-bold text-amber-300 shadow-inner hover:border-amber-400 transition"
                  >
                    {j}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Unit 2: Active Workspace Instrument / Processor Unit (Rear) */}
        <div className="bg-gradient-to-r from-neutral-900 via-stone-900 to-neutral-900 border-2 border-neutral-700 rounded-2xl p-5 shadow-2xl relative">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-4">
            <span className="font-mono text-xs font-bold text-indigo-400 uppercase tracking-wider">
              2. ACTIVE RACK UNIT: {masterState.activeWorkspace.toUpperCase()} SAMPLER / INSTRUMENT (REAR)
            </span>
            <span className="text-[10px] font-mono text-neutral-500">INDIVIDUAL PAD AUDIO OUTS + CV MODULATION</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pad Direct Audio Outs */}
            <div>
              <span className="text-[10px] font-mono font-bold text-neutral-400 block mb-2 uppercase">DIRECT AUDIO OUTS</span>
              <div className="flex flex-wrap gap-2">
                {['Main Out L', 'Main Out R', 'Pad 1 Out', 'Pad 2 Out', 'Sub Out 1', 'Sub Out 2'].map((j, idx) => (
                  <button
                    key={j}
                    onClick={() => handleJackClick('Active Instrument', j, 18 + idx * 5, 180)}
                    className="w-10 h-10 rounded-full border-2 border-indigo-500 bg-neutral-950 flex items-center justify-center text-[8px] font-mono font-bold text-indigo-300 shadow-inner hover:border-indigo-400 transition"
                  >
                    {j}
                  </button>
                ))}
              </div>
            </div>

            {/* Modulation CV Inputs */}
            <div>
              <span className="text-[10px] font-mono font-bold text-neutral-400 block mb-2 uppercase">CV MODULATION INPUTS</span>
              <div className="flex flex-wrap gap-2">
                {['Pitch CV', 'Gate In', 'Filter Cutoff CV', 'Velocity CV'].map((j, idx) => (
                  <button
                    key={j}
                    onClick={() => handleJackClick('Active Instrument', j, 50 + idx * 6, 180)}
                    className="w-10 h-10 rounded-full border-2 border-amber-500 bg-neutral-950 flex items-center justify-center text-[8px] font-mono font-bold text-amber-300 shadow-inner hover:border-amber-400 transition"
                  >
                    {j}
                  </button>
                ))}
              </div>
            </div>

            {/* FX Send / Returns */}
            <div>
              <span className="text-[10px] font-mono font-bold text-neutral-400 block mb-2 uppercase">FX SENDS & AUX BUS</span>
              <div className="flex flex-wrap gap-2">
                {['Send 1 Out', 'Send 2 Out', 'Return 1 L/R', 'Return 2 L/R'].map((j, idx) => (
                  <button
                    key={j}
                    onClick={() => handleJackClick('Active Instrument', j, 78 + idx * 5, 180)}
                    className="w-10 h-10 rounded-full border-2 border-pink-500 bg-neutral-950 flex items-center justify-center text-[8px] font-mono font-bold text-pink-300 shadow-inner hover:border-pink-400 transition"
                  >
                    {j}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

          {/* Unit 3: Summit master mixer and effect rack rear */}
        <div className="bg-gradient-to-r from-neutral-900 via-stone-900 to-neutral-900 border-2 border-neutral-700 rounded-2xl p-5 shadow-2xl relative">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-4">
            <span className="font-mono text-xs font-bold text-emerald-400 uppercase tracking-wider">
              3. SUMMIT MASTER CONSOLE & BUS PROCESSING (REAR)
            </span>
            <span className="text-[10px] font-mono text-neutral-500">ANALOG BUS INSERTION & REVERB/DELAY SENDS</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <span className="text-[10px] font-mono font-bold text-neutral-400 block mb-2 uppercase">MIX BUS INSERTS & RETURNS</span>
              <div className="flex flex-wrap gap-2">
                {['Ch 1 In', 'Ch 2 In', 'Ch 3 In', 'Ch 4 In', 'Ch 5 In', 'Ch 6 In', 'Ch 7 In', 'Ch 8 In'].map((j, idx) => (
                  <button
                    key={j}
                    onClick={() => handleJackClick('Studio Mixer', j, 20 + idx * 4, 340)}
                    className="w-10 h-10 rounded-full border-2 border-emerald-500 bg-neutral-950 flex items-center justify-center text-[8px] font-mono font-bold text-emerald-300 shadow-inner hover:border-emerald-400 transition"
                  >
                    {j}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-mono font-bold text-neutral-400 block mb-2 uppercase">MASTER FX RETURN & SIDECHAIN</span>
              <div className="flex flex-wrap gap-2">
                {['Sidechain In', 'Reverb Send', 'Delay Send', 'Master Out L/R'].map((j, idx) => (
                  <button
                    key={j}
                    onClick={() => handleJackClick('Studio Mixer', j, 65 + idx * 7, 340)}
                    className="w-10 h-10 rounded-full border-2 border-cyan-500 bg-neutral-950 flex items-center justify-center text-[8px] font-mono font-bold text-cyan-300 shadow-inner hover:border-cyan-400 transition"
                  >
                    {j}
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
