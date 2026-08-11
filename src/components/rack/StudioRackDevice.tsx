import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Power, Settings, ExternalLink, RefreshCw } from 'lucide-react';

interface StudioRackDeviceProps {
  title: string;
  subtitle?: string;
  manufacturer?: string;
  tapeLabel?: string;
  badgeColor?: string;
  onDetach?: () => void;
  onToggleFlip?: () => void;
  children: React.ReactNode;
}

export const StudioRackDevice: React.FC<StudioRackDeviceProps> = ({
  title,
  subtitle,
  manufacturer = 'VIRTUAL STUDIO',
  tapeLabel,
  badgeColor = '#f59e0b',
  onDetach,
  onToggleFlip,
  children,
}) => {
  const [isFolded, setIsFolded] = useState<boolean>(false);
  const [powerOn, setPowerOn] = useState<boolean>(true);

  return (
    <div className="relative bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 border-y-2 border-neutral-700/80 shadow-[0_10px_25px_rgba(0,0,0,0.8)] rounded-lg overflow-hidden select-none my-4">
      {/* Left Rack Ear Rail with Chrome Screws */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-neutral-800 to-neutral-900 border-r border-neutral-700 flex flex-col justify-between py-2 items-center z-20 shadow-inner">
        <div className="w-3.5 h-3.5 rounded-full bg-slate-400 border border-slate-600 flex items-center justify-center shadow">
          <div className="w-2 h-0.5 bg-slate-700 transform rotate-45" />
        </div>
        <button
          onClick={() => setIsFolded(!isFolded)}
          className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition"
          title={isFolded ? 'Unfold Rack Unit' : 'Fold Rack Unit'}
        >
          {isFolded ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        <div className="w-3.5 h-3.5 rounded-full bg-slate-400 border border-slate-600 flex items-center justify-center shadow">
          <div className="w-2 h-0.5 bg-slate-700 transform -rotate-45" />
        </div>
      </div>

      {/* Right Rack Ear Rail with Chrome Screws */}
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-neutral-800 to-neutral-900 border-l border-neutral-700 flex flex-col justify-between py-2 items-center z-20 shadow-inner">
        <div className="w-3.5 h-3.5 rounded-full bg-slate-400 border border-slate-600 flex items-center justify-center shadow">
          <div className="w-2 h-0.5 bg-slate-700 transform -rotate-45" />
        </div>
        <button
          onClick={() => setPowerOn(!powerOn)}
          className={`p-1 rounded transition border ${
            powerOn
              ? 'bg-emerald-950 text-emerald-400 border-emerald-700 shadow-emerald-500/30'
              : 'bg-neutral-800 text-neutral-600 border-neutral-700'
          }`}
          title="Toggle Hardware Power"
        >
          <Power className="w-3.5 h-3.5" />
        </button>
        <div className="w-3.5 h-3.5 rounded-full bg-slate-400 border border-slate-600 flex items-center justify-center shadow">
          <div className="w-2 h-0.5 bg-slate-700 transform rotate-45" />
        </div>
      </div>

      {/* Rack Device Top Header Panel */}
      <div className="pl-10 pr-10 py-2.5 bg-gradient-to-r from-neutral-900 via-stone-900 to-neutral-900 border-b border-neutral-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Fold Arrow & Tape Label */}
          <div
            className="px-3 py-1 bg-amber-200/90 text-neutral-950 font-mono text-xs font-black uppercase tracking-wider rounded-sm shadow border border-amber-300 transform -rotate-1 cursor-pointer"
            onClick={() => setIsFolded(!isFolded)}
          >
            {tapeLabel || title}
          </div>

          {!isFolded && (
            <div>
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
                {manufacturer} • {subtitle || 'VIRTUAL RACK MODULE'}
              </span>
            </div>
          )}
        </div>

        {/* Status Indicators & Rack Quick Actions */}
        <div className="flex items-center gap-2 font-mono text-[10px]">
          {onToggleFlip && (
            <button
              onClick={onToggleFlip}
              className="px-2 py-1 rounded bg-stone-800 hover:bg-amber-500 hover:text-neutral-950 text-amber-400 font-bold transition flex items-center gap-1 border border-amber-500/30"
              title="Flip Rack to Rear Cable Patch Bay"
            >
              <RefreshCw className="w-3 h-3" />
              <span className="hidden md:inline">FLIP RACK</span>
            </button>
          )}

          {onDetach && (
            <button
              onClick={onDetach}
              className="px-2 py-1 rounded bg-stone-800 hover:bg-amber-500 hover:text-neutral-950 text-stone-300 font-bold transition flex items-center gap-1 border border-stone-700"
              title="Detach this device into a floating window"
            >
              <ExternalLink className="w-3 h-3 text-amber-400" />
              <span className="hidden md:inline">DETACH</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 bg-neutral-950 px-2.5 py-1 rounded border border-neutral-800">
            <span className="text-neutral-500">POWER</span>
            <div
              className={`w-2 h-2 rounded-full ${
                powerOn ? 'bg-emerald-400 shadow-md shadow-emerald-400/80 animate-pulse' : 'bg-neutral-700'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Main Content Area (Hidden if folded or powered off) */}
      {!isFolded && (
        <div className={`pl-8 pr-8 transition-opacity ${powerOn ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          {children}
        </div>
      )}
    </div>
  );
};
