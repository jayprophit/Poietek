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
  Sliders,
  Plus,
  X,
  SlidersHorizontal,
  Check,
} from 'lucide-react';
import { RackColorTag } from '../../types';

interface MacroTarget {
  id: string;
  paramName: string;
  weight: number; // 0 to 100%
}

interface MacroKnobConfig {
  id: string;
  label: string;
  value: number; // 0 to 100
  targets: MacroTarget[];
}

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

const AVAILABLE_PARAMS = [
  'Filter Cutoff',
  'Resonance',
  'Reverb Wet/Dry',
  'Delay Feedback',
  'Distortion Drive',
  'Amp Decay',
  'Pitch Transpose',
  'LFO Rate',
  'Chorus Depth',
  'Sub Bass Gain',
  'Master Output Volume',
];

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
  const [isMacroPanelOpen, setIsMacroPanelOpen] = useState<boolean>(false);
  const [activeMappingMacroId, setActiveMappingMacroId] = useState<string | null>(null);

  // Performance Macro Knobs State
  const [macros, setMacros] = useState<MacroKnobConfig[]>([
    {
      id: 'macro_1',
      label: 'MACRO 1: CUTOFF / BRIGHT',
      value: 65,
      targets: [
        { id: 't1', paramName: 'Filter Cutoff', weight: 100 },
        { id: 't2', paramName: 'Distortion Drive', weight: 40 },
      ],
    },
    {
      id: 'macro_2',
      label: 'MACRO 2: SPACE / REVERB',
      value: 40,
      targets: [
        { id: 't3', paramName: 'Reverb Wet/Dry', weight: 80 },
        { id: 't4', paramName: 'Delay Feedback', weight: 50 },
      ],
    },
    {
      id: 'macro_3',
      label: 'MACRO 3: PUNCH / DECAY',
      value: 75,
      targets: [
        { id: 't5', paramName: 'Amp Decay', weight: 90 },
        { id: 't6', paramName: 'Sub Bass Gain', weight: 60 },
      ],
    },
    {
      id: 'macro_4',
      label: 'MACRO 4: MOTION / LFO',
      value: 30,
      targets: [
        { id: 't7', paramName: 'LFO Rate', weight: 100 },
        { id: 't8', paramName: 'Chorus Depth', weight: 50 },
      ],
    },
  ]);

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

  const handleUpdateMacroValue = (macroId: string, newValue: number) => {
    setMacros((prev) =>
      prev.map((m) => (m.id === macroId ? { ...m, value: newValue } : m))
    );
  };

  const handleAddTargetToMacro = (macroId: string, paramName: string) => {
    setMacros((prev) =>
      prev.map((m) => {
        if (m.id !== macroId) return m;
        if (m.targets.some((t) => t.paramName === paramName)) return m;
        return {
          ...m,
          targets: [
            ...m.targets,
            { id: `target_${Date.now()}_${Math.random()}`, paramName, weight: 80 },
          ],
        };
      })
    );
  };

  const handleRemoveTargetFromMacro = (macroId: string, targetId: string) => {
    setMacros((prev) =>
      prev.map((m) => {
        if (m.id !== macroId) return m;
        return { ...m, targets: m.targets.filter((t) => t.id !== targetId) };
      })
    );
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
          {!isFolded && (
            <button
              onClick={() => setIsMacroPanelOpen(!isMacroPanelOpen)}
              className={`px-2 py-0.5 rounded font-black transition flex items-center gap-1 border ${
                isMacroPanelOpen
                  ? 'bg-amber-500 text-neutral-950 border-amber-300 shadow-md'
                  : 'bg-stone-800 hover:bg-neutral-700 text-amber-400 border-stone-700'
              }`}
              title="Toggle Performance Macro Knobs Panel"
            >
              <Sliders className="w-3 h-3" />
              <span className="hidden sm:inline">MACROS</span>
            </button>
          )}

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

      {/* EXPANDABLE PERFORMANCE MACRO PANEL */}
      {!isFolded && isMacroPanelOpen && (
        <div className="mx-10 my-2 p-3 bg-neutral-950/95 border-2 border-amber-500/80 rounded-2xl shadow-2xl space-y-3 font-mono animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-black text-amber-400 uppercase tracking-widest">
                PERFORMANCE MACRO CONTROL PANEL
              </span>
            </div>
            <span className="text-[10px] text-neutral-400">
              Map multiple parameters to 1 knob for live performance expression
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {macros.map((macro) => {
              const isEditingMapping = activeMappingMacroId === macro.id;
              return (
                <div
                  key={macro.id}
                  className="bg-neutral-900 p-2.5 rounded-xl border border-stone-800 flex flex-col justify-between space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-amber-300 uppercase truncate max-w-[120px]">
                      {macro.label}
                    </span>
                    <button
                      onClick={() => setActiveMappingMacroId(isEditingMapping ? null : macro.id)}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition flex items-center gap-0.5 ${
                        isEditingMapping
                          ? 'bg-amber-500 text-neutral-950 font-black'
                          : 'bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700'
                      }`}
                      title="Configure Mapped Parameters for this Macro"
                    >
                      <SlidersHorizontal className="w-2.5 h-2.5" />
                      <span>{macro.targets.length} MAPPED</span>
                    </button>
                  </div>

                  {/* Rotary-styled macro knob slider */}
                  <div className="flex flex-col items-center py-1">
                    <div className="w-full relative flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={macro.value}
                        onChange={(e) => handleUpdateMacroValue(macro.id, Number(e.target.value))}
                        className="w-full accent-amber-500 cursor-pointer h-2 bg-neutral-950 rounded-lg"
                      />
                      <span className="text-xs font-mono font-black text-amber-400 w-10 text-right">
                        {macro.value}%
                      </span>
                    </div>

                    {/* Mapped Targets Live Values Readout */}
                    <div className="w-full pt-1 flex flex-wrap gap-1">
                      {macro.targets.map((t) => {
                        const calculatedVal = Math.round((macro.value * t.weight) / 100);
                        return (
                          <span
                            key={t.id}
                            className="text-[8px] bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800 text-stone-300 font-mono truncate max-w-full"
                          >
                            {t.paramName}: <strong className="text-amber-400">{calculatedVal}%</strong>
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Target Mapping Editor Drawer */}
                  {isEditingMapping && (
                    <div className="bg-neutral-950 p-2 rounded-lg border border-amber-500/60 space-y-2 mt-2">
                      <div className="flex items-center justify-between text-[9px] font-bold text-neutral-400 uppercase">
                        <span>Mapped Targets:</span>
                        <button
                          onClick={() => setActiveMappingMacroId(null)}
                          className="text-stone-500 hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Active Mapped Targets List */}
                      <div className="space-y-1 max-h-24 overflow-y-auto">
                        {macro.targets.length === 0 ? (
                          <div className="text-[9px] text-stone-500 italic p-1">No parameters mapped yet.</div>
                        ) : (
                          macro.targets.map((t) => (
                            <div
                              key={t.id}
                              className="flex items-center justify-between text-[9px] bg-neutral-900 px-2 py-1 rounded text-stone-300"
                            >
                              <span className="truncate">{t.paramName}</span>
                              <div className="flex items-center gap-1">
                                <span className="text-amber-400 font-bold">{t.weight}% Depth</span>
                                <button
                                  onClick={() => handleRemoveTargetFromMacro(macro.id, t.id)}
                                  className="text-rose-400 hover:text-rose-300 p-0.5"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Add New Target Parameter Selector */}
                      <div className="pt-1 border-t border-neutral-800">
                        <span className="text-[8px] text-stone-500 block mb-1 font-bold">ADD PARAMETER TARGET:</span>
                        <div className="flex flex-wrap gap-1">
                          {AVAILABLE_PARAMS.filter(
                            (p) => !macro.targets.some((t) => t.paramName === p)
                          ).map((paramName) => (
                            <button
                              key={paramName}
                              onClick={() => handleAddTargetToMacro(macro.id, paramName)}
                              className="text-[8px] px-1.5 py-0.5 bg-neutral-900 hover:bg-amber-500 hover:text-neutral-950 text-amber-300 rounded border border-neutral-800 transition font-bold"
                            >
                              + {paramName}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content Area (Hidden if folded or powered off) */}
      {!isFolded && (
        <div className={`pl-8 pr-8 transition-opacity ${powerOn ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          {children}
        </div>
      )}
    </div>
  );
};

