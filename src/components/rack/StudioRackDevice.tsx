import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Power,
  Settings,
  ExternalLink,
  RefreshCw,
  MoreVertical,
  Palette,
  Trash2,
  Copy,
  Maximize2,
  Minimize2,
  Activity,
  Zap,
} from 'lucide-react';
import { RackColorTag } from '../../types';

interface StudioRackDeviceProps {
  title: string;
  subtitle?: string;
  manufacturer?: string;
  tapeLabel?: string;
  colorTag?: RackColorTag;
  isFolded?: boolean;
  onToggleFold?: () => void;
  onSetColorTag?: (color: RackColorTag) => void;
  onDetach?: () => void;
  onToggleFlip?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  children: React.ReactNode;
}

const COLOR_MAP: Record<RackColorTag, { border: string; bg: string; text: string; ring: string }> = {
  amber: { border: 'border-amber-500/80', bg: 'bg-amber-500', text: 'text-amber-400', ring: 'ring-amber-500/50' },
  cyan: { border: 'border-cyan-500/80', bg: 'bg-cyan-500', text: 'text-cyan-400', ring: 'ring-cyan-500/50' },
  rose: { border: 'border-rose-500/80', bg: 'bg-rose-500', text: 'text-rose-400', ring: 'ring-rose-500/50' },
  emerald: { border: 'border-emerald-500/80', bg: 'bg-emerald-500', text: 'text-emerald-400', ring: 'ring-emerald-500/50' },
  violet: { border: 'border-purple-500/80', bg: 'bg-purple-500', text: 'text-purple-400', ring: 'ring-purple-500/50' },
  gold: { border: 'border-yellow-500/80', bg: 'bg-yellow-500', text: 'text-yellow-400', ring: 'ring-yellow-500/50' },
  neutral: { border: 'border-neutral-600/80', bg: 'bg-neutral-500', text: 'text-neutral-400', ring: 'ring-neutral-500/50' },
  slate: { border: 'border-slate-500/80', bg: 'bg-slate-500', text: 'text-slate-400', ring: 'ring-slate-500/50' },
};

export const StudioRackDevice: React.FC<StudioRackDeviceProps> = ({
  title,
  subtitle,
  manufacturer = 'REASON STUDIO',
  tapeLabel,
  colorTag = 'amber',
  isFolded: isFoldedControlled,
  onToggleFold,
  onSetColorTag,
  onDetach,
  onToggleFlip,
  onDelete,
  onDuplicate,
  children,
}) => {
  const [localIsFolded, setLocalIsFolded] = useState<boolean>(false);
  const [powerOn, setPowerOn] = useState<boolean>(true);
  const [contextMenuOpen, setContextMenuOpen] = useState<boolean>(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const activeColor = COLOR_MAP[colorTag] || COLOR_MAP.amber;

  const isFolded = isFoldedControlled !== undefined ? isFoldedControlled : localIsFolded;

  const handleToggleFold = () => {
    if (onToggleFold) {
      onToggleFold();
    } else {
      setLocalIsFolded(!localIsFolded);
    }
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuOpen(true);
  };

  return (
    <div
      onContextMenu={handleContextMenu}
      className={`relative bg-gradient-to-r from-neutral-900 via-stone-950 to-neutral-900 border-2 ${activeColor.border} shadow-[0_12px_30px_rgba(0,0,0,0.9)] rounded-xl overflow-hidden select-none my-2 transition-all border-l-[12px] border-r-[12px] border-l-amber-950 border-r-amber-950`}
    >
      {/* Top Left Color Indicator Accent Bar */}
      <div className={`h-1 w-full ${activeColor.bg}`} />

      {/* Left Reason Metallic Rack Ear Rail with Chrome Screws */}
      <div className="absolute left-0 top-1 bottom-0 w-8 bg-gradient-to-r from-stone-800 via-stone-700 to-stone-900 border-r border-stone-600 flex flex-col justify-between py-1.5 items-center z-20 shadow-lg">
        <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-slate-200 to-slate-500 border border-slate-700 flex items-center justify-center shadow-md">
          <div className="w-2 h-0.5 bg-slate-800 transform rotate-45" />
        </div>
        <button
          onClick={handleToggleFold}
          className="p-1 rounded bg-stone-900 hover:bg-stone-700 text-amber-400 hover:text-white transition border border-stone-700"
          title={isFolded ? 'Unfold Rack Unit (Expand)' : 'Fold Rack Unit (Collapse)'}
        >
          {isFolded ? <ChevronRight className="w-3.5 h-3.5 stroke-[3]" /> : <ChevronDown className="w-3.5 h-3.5 stroke-[3]" />}
        </button>
        <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-slate-200 to-slate-500 border border-slate-700 flex items-center justify-center shadow-md">
          <div className="w-2 h-0.5 bg-slate-800 transform -rotate-45" />
        </div>
      </div>

      {/* Right Reason Metallic Rack Ear Rail with Chrome Screws */}
      <div className="absolute right-0 top-1 bottom-0 w-8 bg-gradient-to-l from-stone-800 via-stone-700 to-stone-900 border-l border-stone-600 flex flex-col justify-between py-1.5 items-center z-20 shadow-lg">
        <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-slate-200 to-slate-500 border border-slate-700 flex items-center justify-center shadow-md">
          <div className="w-2 h-0.5 bg-slate-800 transform -rotate-45" />
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
        <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-slate-200 to-slate-500 border border-slate-700 flex items-center justify-center shadow-md">
          <div className="w-2 h-0.5 bg-slate-800 transform rotate-45" />
        </div>
      </div>

      {/* 1U CASCADING COLLAPSED BAR OR EXPANDED HEADER */}
      <div
        className={`pl-10 pr-10 ${isFolded ? 'py-1.5 bg-stone-950' : 'py-2.5 bg-gradient-to-r from-neutral-900 via-stone-900 to-neutral-900'} border-b border-neutral-800 flex items-center justify-between gap-3 transition-all`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Tape Label Sticker */}
          <div
            className="px-2.5 py-0.5 bg-amber-200/95 text-neutral-950 font-mono text-xs font-black uppercase tracking-wider rounded-xs shadow border border-amber-300 transform -rotate-1 cursor-pointer shrink-0 hover:scale-105 transition"
            onClick={handleToggleFold}
            title="Click to Fold/Unfold Module"
          >
            {tapeLabel || title}
          </div>

          {/* LCD Status Screen when Folded */}
          {isFolded ? (
            <div
              className="flex items-center gap-2 bg-black px-2.5 py-1 rounded border border-stone-800 font-mono text-[10px] cursor-pointer"
              onClick={handleToggleFold}
            >
              <span className="text-emerald-400 font-bold truncate max-w-[180px] sm:max-w-xs">
                {title}
              </span>
              <span className="text-stone-500 hidden md:inline">• [1U FOLDED]</span>
              <div className="w-12 h-2 bg-stone-900 rounded overflow-hidden flex items-center hidden sm:flex">
                <div className="w-3/4 h-full bg-emerald-500 animate-pulse" />
              </div>
            </div>
          ) : (
            <div>
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block truncate">
                {manufacturer} • {subtitle || 'VIRTUAL RACK MODULE'}
              </span>
            </div>
          )}
        </div>

        {/* Status Indicators & Quick Actions */}
        <div className="flex items-center gap-2 font-mono text-[10px] shrink-0">
          <button
            onClick={handleToggleFold}
            className="px-2 py-0.5 rounded bg-stone-800 hover:bg-amber-500 hover:text-black text-amber-400 font-black transition flex items-center gap-1 border border-stone-700"
            title={isFolded ? 'Expand Rack Module' : 'Fold Rack Module'}
          >
            {isFolded ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
            <span className="hidden sm:inline">{isFolded ? 'EXPAND' : 'FOLD'}</span>
          </button>

          {onToggleFlip && !isFolded && (
            <button
              onClick={onToggleFlip}
              className="px-2 py-0.5 rounded bg-stone-800 hover:bg-amber-500 hover:text-neutral-950 text-amber-400 font-bold transition flex items-center gap-1 border border-amber-500/30"
              title="Flip Rack to Rear Cable Patch Bay"
            >
              <RefreshCw className="w-3 h-3" />
              <span className="hidden md:inline">FLIP</span>
            </button>
          )}

          {onDetach && (
            <button
              onClick={onDetach}
              className="px-2 py-0.5 rounded bg-stone-800 hover:bg-amber-500 hover:text-neutral-950 text-stone-300 font-bold transition flex items-center gap-1 border border-stone-700"
              title="Detach this device into a floating window"
            >
              <ExternalLink className="w-3 h-3 text-amber-400" />
              <span className="hidden md:inline">DETACH</span>
            </button>
          )}

          {/* Context Options Dropdown Menu Button */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setContextMenuOpen(!contextMenuOpen)}
              className="p-1 rounded bg-stone-800 hover:bg-neutral-700 text-stone-300 border border-stone-700"
              title="Module Options & Color Tag"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {/* Context Menu Dropdown */}
            {contextMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-neutral-950 border-2 border-neutral-700 rounded-xl shadow-2xl p-2 z-50 text-xs font-mono space-y-2">
                <div className="px-2 py-1 text-[9px] font-bold text-neutral-500 uppercase border-b border-neutral-800 flex items-center gap-1">
                  <Palette className="w-3 h-3 text-amber-400" />
                  <span>COLOR TAG FRAME</span>
                </div>

                {/* Color Tags Picker */}
                <div className="grid grid-cols-4 gap-1.5 p-1 bg-neutral-900 rounded-lg">
                  {(['amber', 'cyan', 'rose', 'emerald', 'violet', 'gold', 'neutral', 'slate'] as RackColorTag[]).map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        if (onSetColorTag) onSetColorTag(c);
                        setContextMenuOpen(false);
                      }}
                      className={`h-5 rounded-md border transition ${COLOR_MAP[c].bg} ${
                        colorTag === c ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                      title={`Color Tag: ${c}`}
                    />
                  ))}
                </div>

                <div className="space-y-1 pt-1 border-t border-neutral-800">
                  <button
                    onClick={() => {
                      handleToggleFold();
                      setContextMenuOpen(false);
                    }}
                    className="w-full text-left px-2 py-1 rounded hover:bg-neutral-900 text-neutral-300 flex items-center justify-between"
                  >
                    <span>{isFolded ? 'Expand Rack' : 'Fold Rack'}</span>
                  </button>

                  {onDuplicate && (
                    <button
                      onClick={() => {
                        onDuplicate();
                        setContextMenuOpen(false);
                      }}
                      className="w-full text-left px-2 py-1 rounded hover:bg-neutral-900 text-amber-400 flex items-center justify-between"
                    >
                      <span>Duplicate Unit</span>
                      <Copy className="w-3 h-3" />
                    </button>
                  )}

                  {onDelete && (
                    <button
                      onClick={() => {
                        onDelete();
                        setContextMenuOpen(false);
                      }}
                      className="w-full text-left px-2 py-1 rounded hover:bg-rose-950 text-rose-400 flex items-center justify-between"
                    >
                      <span>Remove Unit</span>
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 bg-neutral-950 px-2 py-1 rounded border border-neutral-800">
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
