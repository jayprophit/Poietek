import React from 'react';
import { ConnectedDevice } from '../../types';
import { Cpu, Wifi, Radio, Zap, Activity, Volume2, ShieldAlert } from 'lucide-react';

interface HardwareInterfaceUnitProps {
  connectedDevices: ConnectedDevice[];
  bpm: number;
  isFlipped: boolean;
  onToggleFlip: () => void;
}

export const HardwareInterfaceUnit: React.FC<HardwareInterfaceUnitProps> = ({
  connectedDevices,
  bpm,
  isFlipped,
  onToggleFlip,
}) => {
  const activeDevs = connectedDevices.filter((d) => d.connected);
  const avgLat =
    activeDevs.length > 0
      ? (activeDevs.reduce((s, d) => s + d.latencyMs, 0) / activeDevs.length).toFixed(1)
      : '1.2';

  return (
    <div className="relative bg-gradient-to-r from-slate-900 via-neutral-900 to-slate-900 border-y-2 border-slate-700/80 shadow-2xl overflow-hidden select-none my-1">
      {/* Rack Ears & Side Bolts */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-neutral-800 to-neutral-900 border-r border-neutral-700 flex flex-col justify-between py-1.5 items-center z-10 shadow-inner">
        <div className="w-3.5 h-3.5 rounded-full bg-slate-400 border border-slate-600 flex items-center justify-center shadow">
          <div className="w-2 h-0.5 bg-slate-700 transform rotate-45" />
        </div>
        <span className="text-[7px] font-mono font-bold text-neutral-500 uppercase tracking-tighter -rotate-90">1U AUDIO</span>
        <div className="w-3.5 h-3.5 rounded-full bg-slate-400 border border-slate-600 flex items-center justify-center shadow">
          <div className="w-2 h-0.5 bg-slate-700 transform -rotate-45" />
        </div>
      </div>

      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-neutral-800 to-neutral-900 border-l border-neutral-700 flex flex-col justify-between py-1.5 items-center z-10 shadow-inner">
        <div className="w-3.5 h-3.5 rounded-full bg-slate-400 border border-slate-600 flex items-center justify-center shadow">
          <div className="w-2 h-0.5 bg-slate-700 transform -rotate-45" />
        </div>
        <span className="text-[7px] font-mono font-bold text-neutral-500 uppercase tracking-tighter rotate-90">STUDIO AUDIO</span>
        <div className="w-3.5 h-3.5 rounded-full bg-slate-400 border border-slate-600 flex items-center justify-center shadow">
          <div className="w-2 h-0.5 bg-slate-700 transform rotate-45" />
        </div>
      </div>

      {/* Main Metal Faceplate Content */}
      <div className="px-10 py-2.5 flex flex-wrap items-center justify-between gap-4 bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:8px_8px]">
        {/* Device Title & Brand Tape */}
        <div className="flex items-center gap-3">
          {/* Handwritten-style Tape Label */}
          <div className="bg-amber-100/90 text-neutral-900 px-3 py-1 rounded-sm shadow-md font-mono text-xs font-black tracking-wider uppercase border border-amber-300 transform -rotate-1">
            HARDWARE INTERFACE
          </div>

          <div className="hidden sm:flex flex-col">
            <span className="text-[10px] font-mono font-black text-amber-500 uppercase tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              64 CHANNEL AUDIO & MIDI DRIVER
            </span>
            <span className="text-[9px] text-neutral-400 font-mono">
              ASIO / WEB AUDIO ENGINE @ 48.0 kHz 24-BIT
            </span>
          </div>
        </div>

        {/* Metering & LED Matrix Indicator */}
        <div className="flex items-center gap-6 bg-neutral-950/90 border border-neutral-800 rounded-lg px-4 py-1.5 shadow-inner">
          {/* Audio Out Meters */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase">OUT 1-2</span>
            <div className="flex gap-0.5">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-3 rounded-xs ${
                    i < 6 ? 'bg-emerald-500' : i < 7 ? 'bg-amber-400' : 'bg-rose-500'
                  } opacity-90 shadow-sm shadow-emerald-500/50`}
                />
              ))}
            </div>
          </div>

          {/* MIDI Activity Lights */}
          <div className="flex items-center gap-3 border-x border-neutral-800 px-3">
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-mono text-neutral-500">MIDI IN</span>
              <div className="w-2 h-2 rounded-full bg-amber-400 shadow-md shadow-amber-400/80 animate-ping" />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-mono text-neutral-500">MIDI OUT</span>
              <div className="w-2 h-2 rounded-full bg-indigo-400 shadow-md shadow-indigo-400/80" />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-mono text-neutral-500">SYNC</span>
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-md shadow-emerald-400/80" />
            </div>
          </div>

          {/* Latency / Driver Specs */}
          <div className="text-right font-mono">
            <span className="text-[9px] text-neutral-400 block">BUFFER LATENCY</span>
            <span className="text-xs font-bold text-emerald-400">{avgLat} ms</span>
          </div>
        </div>

        {/* Flip Rack Key Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleFlip}
            className={`px-3 py-1.5 rounded text-xs font-mono font-black uppercase transition shadow-md flex items-center gap-1.5 border ${
              isFlipped
                ? 'bg-amber-500 text-neutral-950 border-amber-300 shadow-amber-500/30 ring-2 ring-amber-400'
                : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700 border-neutral-600'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{isFlipped ? 'SHOW FRONT (TAB)' : 'FLIP RACK (TAB)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
