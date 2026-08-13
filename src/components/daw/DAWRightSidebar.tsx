import React, { useState, useEffect } from 'react';
import {
  PanelRightClose,
  PanelRightOpen,
  GripVertical,
  Sliders,
  Activity,
  Music,
  Zap,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Layers,
  Sparkles,
  Cpu,
  Radio,
  FolderPlus,
  Grid,
  Flame,
  Volume2,
  Maximize2,
  X,
  Plus,
} from 'lucide-react';
import { TrackChannel, WorkspaceType, ModuleType } from '../../types';

interface DAWRightSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  channels: TrackChannel[];
  setChannels: React.Dispatch<React.SetStateAction<TrackChannel[]>>;
  isQuickPaletteDocked: boolean;
  setIsQuickPaletteDocked: (docked: boolean) => void;
  quickPaletteComponent: React.ReactNode;
  onAddModuleToRack: (type: ModuleType) => void;
  onDetachWorkspace: (ws: WorkspaceType) => void;
  detachedWorkspaces: WorkspaceType[];
  bpm: number;
}

export const DAWRightSidebar: React.FC<DAWRightSidebarProps> = ({
  isOpen,
  onToggle,
  channels,
  setChannels,
  isQuickPaletteDocked,
  setIsQuickPaletteDocked,
  quickPaletteComponent,
  onAddModuleToRack,
  onDetachWorkspace,
  detachedWorkspaces,
  bpm,
}) => {
  // Cascaded fold states for right sidebar modules
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('studio_right_sidebar_folds');
      return saved ? JSON.parse(saved) : { quickPalette: false, mixer: false, regroove: true, dsp: false };
    } catch {
      return { quickPalette: false, mixer: false, regroove: true, dsp: false };
    }
  });

  // Docked widget modules order
  const [dockedModules, setDockedModules] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('studio_right_sidebar_modules');
      return saved ? JSON.parse(saved) : ['quickPalette', 'mixer', 'dsp', 'regroove'];
    } catch {
      return ['quickPalette', 'mixer', 'dsp', 'regroove'];
    }
  });

  useEffect(() => {
    localStorage.setItem('studio_right_sidebar_folds', JSON.stringify(collapsedSections));
  }, [collapsedSections]);

  useEffect(() => {
    localStorage.setItem('studio_right_sidebar_modules', JSON.stringify(dockedModules));
  }, [dockedModules]);

  const toggleFold = (sectionId: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const handlePopoutWindow = (title: string, contentId: string) => {
    const popWindow = window.open(
      '',
      `StudioUnit_${contentId}`,
      'width=800,height=600,left=200,top=100,resizable=yes,scrollbars=yes'
    );
    if (popWindow) {
      popWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title} - Multi-Monitor Studio Unit</title>
            <style>
              body {
                background-color: #0c0a09;
                color: #e7e5e4;
                font-family: monospace;
                margin: 0;
                padding: 16px;
              }
              .card {
                background: #1c1917;
                border: 2 border #d97706;
                border-radius: 12px;
                padding: 16px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.8);
              }
              h1 { color: #f59e0b; font-size: 16px; margin-top: 0; }
              p { color: #a8a29e; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>${title.toUpperCase()} [MULTI-MONITOR UNIT]</h1>
              <p>Active multi-monitor module output. Syncing with primary Reason master engine at ${bpm} BPM.</p>
              <button onclick="window.close()" style="background:#f59e0b; color:#000; font-weight:bold; border:none; padding:8px 16px; border-radius:6px; cursor:pointer;">
                Close Window & Return
              </button>
            </div>
          </body>
        </html>
      `);
    }
  };

  return (
    <>
      {/* Mobile/Tablet Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      <div className="relative flex shrink-0 z-50 lg:z-30 font-mono text-xs select-none">
        {/* Sidebar Expand / Collapse Edge Handle Bar */}
        <button
          onClick={onToggle}
          className="absolute top-1/2 -left-7 -translate-y-1/2 bg-stone-900 hover:bg-stone-800 text-amber-400 border-l-2 border-y-2 border-stone-700 py-4 px-1 rounded-l-xl shadow-2xl flex flex-col items-center justify-center gap-2 transition hover:scale-105 z-50"
          title={isOpen ? 'Collapse Right Sidebar' : 'Expand Right Studio Sidebar (Dock & Widgets)'}
        >
          {isOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
          <span className="text-[9px] font-black uppercase tracking-widest writing-mode-vertical rotate-180 text-amber-400/90">
            STUDIO DOCK
          </span>
        </button>

        {/* Main Right Sidebar Container */}
        <div
          className={`fixed inset-y-0 right-0 z-50 lg:static lg:z-30 bg-stone-950 border-l-2 border-stone-800 h-full flex flex-col shadow-2xl transition-all duration-300 overflow-hidden ${
            isOpen ? 'w-80' : 'w-0 border-l-0'
          }`}
        >
        {/* Sidebar Header */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-950 to-stone-900 p-3 border-b border-stone-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
            <span className="font-black text-stone-200 text-xs tracking-wider uppercase">
              STUDIO RIGHT SIDEBAR
            </span>
          </div>
          <span className="text-[10px] bg-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded border border-amber-500/30">
            DOCK & WIDGETS
          </span>
        </div>

        {/* Scrollable Docked Modules Stack */}
        <div className="p-3 space-y-3 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-stone-800">
          {/* Quick Palette Docked Module */}
          <div className="bg-stone-900/90 border border-stone-800 rounded-xl overflow-hidden shadow-lg transition">
            <div className="bg-stone-950 px-3 py-2 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 font-black">
                <GripVertical className="w-3.5 h-3.5 text-stone-500" />
                <span className="text-[11px] uppercase">QUICK OPTIONS PALETTE</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsQuickPaletteDocked(!isQuickPaletteDocked)}
                  className="px-2 py-0.5 rounded bg-stone-800 hover:bg-amber-500 hover:text-black text-amber-400 text-[9px] font-bold transition flex items-center gap-1"
                  title={isQuickPaletteDocked ? 'Undock to Float on Screen' : 'Dock in Right Sidebar'}
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>{isQuickPaletteDocked ? 'UNDOCK' : 'DOCK'}</span>
                </button>

                <button
                  onClick={() => toggleFold('quickPalette')}
                  className="p-1 rounded text-stone-400 hover:text-white"
                  title={collapsedSections.quickPalette ? 'Expand Unit' : 'Fold Unit'}
                >
                  {collapsedSections.quickPalette ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {!collapsedSections.quickPalette && (
              <div className="p-2 bg-stone-950">
                {isQuickPaletteDocked ? (
                  quickPaletteComponent
                ) : (
                  <div className="p-3 text-center border border-dashed border-stone-800 rounded-lg">
                    <p className="text-[10px] text-stone-400 font-bold">
                      Quick Palette currently floating on canvas.
                    </p>
                    <button
                      onClick={() => setIsQuickPaletteDocked(true)}
                      className="mt-2 px-3 py-1 bg-amber-500 text-neutral-950 font-black rounded-lg text-[10px] shadow"
                    >
                      Dock Quick Palette Here
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SSL Master Mixer Mini Strip */}
          <div className="bg-stone-900/90 border border-stone-800 rounded-xl overflow-hidden shadow-lg transition">
            <div className="bg-stone-950 px-3 py-2 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-stone-200 font-black">
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] uppercase">SSL MIXER MONITOR</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePopoutWindow('SSL Master Mixer', 'ssl_mixer')}
                  className="p-1 rounded text-stone-400 hover:text-amber-400"
                  title="Popout to Multi-Monitor Window"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDetachWorkspace('mixer')}
                  className="p-1 rounded text-stone-400 hover:text-indigo-400"
                  title="Detach Window"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => toggleFold('mixer')}
                  className="p-1 rounded text-stone-400 hover:text-white"
                >
                  {collapsedSections.mixer ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {!collapsedSections.mixer && (
              <div className="p-3 bg-stone-950 space-y-3">
                <div className="flex items-center justify-between text-[10px] font-bold text-stone-400 border-b border-stone-800 pb-1">
                  <span>ACTIVE TRACKS ({channels.length})</span>
                  <span className="text-emerald-400">MASTER PEAK: -1.2 dB</span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-stone-800 pr-1">
                  {channels.map((ch) => (
                    <div
                      key={ch.id}
                      className="bg-stone-900 border border-stone-800 p-2 rounded-lg flex items-center justify-between text-[10px]"
                    >
                      <span className="font-bold text-white truncate max-w-[120px]">{ch.name}</span>
                      <div className="flex items-center gap-2">
                        {/* Fader Level Slider */}
                        <input
                          type="range"
                          min="0"
                          max="1.2"
                          step="0.05"
                          value={ch.volume}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setChannels((prev) =>
                              prev.map((c) => (c.id === ch.id ? { ...c, volume: val } : c))
                            );
                          }}
                          className="w-16 accent-emerald-500 cursor-pointer"
                        />
                        <button
                          onClick={() => {
                            setChannels((prev) =>
                              prev.map((c) => (c.id === ch.id ? { ...c, mute: !c.mute } : c))
                            );
                          }}
                          className={`px-1.5 py-0.5 rounded font-black ${
                            ch.mute ? 'bg-rose-600 text-white' : 'bg-stone-800 text-stone-400'
                          }`}
                        >
                          M
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Hardware DSP & CPU Performance Monitor */}
          <div className="bg-stone-900/90 border border-stone-800 rounded-xl overflow-hidden shadow-lg transition">
            <div className="bg-stone-950 px-3 py-2 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sky-400 font-black">
                <Cpu className="w-3.5 h-3.5" />
                <span className="text-[11px] uppercase">AUDIO DSP & CPU METERS</span>
              </div>
              <button
                onClick={() => toggleFold('dsp')}
                className="p-1 rounded text-stone-400 hover:text-white"
              >
                {collapsedSections.dsp ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>

            {!collapsedSections.dsp && (
              <div className="p-3 bg-stone-950 space-y-3">
                <div>
                  <div className="flex justify-between text-[10px] text-stone-400 font-bold mb-1">
                    <span>DSP ENGINE LOAD</span>
                    <span className="text-emerald-400">14% (NORMAL)</span>
                  </div>
                  <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[14%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-stone-400 font-bold mb-1">
                    <span>WEBAUDIO BUFFER LATENCY</span>
                    <span className="text-sky-400">2.6 ms (128 Samples)</span>
                  </div>
                  <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-sky-500 h-full w-[20%]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Rack Device Adder */}
          <div className="bg-stone-900/90 border border-stone-800 rounded-xl overflow-hidden shadow-lg p-3 space-y-2">
            <span className="font-bold text-stone-300 text-[10px] uppercase block tracking-wider">
              QUICK RACK ADDER
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => onAddModuleToRack('subtractor')}
                className="p-2 bg-amber-500/10 hover:bg-amber-500 hover:text-black border border-amber-500/30 rounded-lg font-bold text-[10px] text-amber-400 transition text-left truncate"
              >
                + Subtractor Synth
              </button>
              <button
                onClick={() => onAddModuleToRack('thor')}
                className="p-2 bg-emerald-500/10 hover:bg-emerald-500 hover:text-black border border-emerald-500/30 rounded-lg font-bold text-[10px] text-emerald-400 transition text-left truncate"
              >
                + Thor Polysonic
              </button>
              <button
                onClick={() => onAddModuleToRack('mpc')}
                className="p-2 bg-indigo-500/10 hover:bg-indigo-500 hover:text-white border border-indigo-500/30 rounded-lg font-bold text-[10px] text-indigo-300 transition text-left truncate"
              >
                + MPC Drum Pad
              </button>
              <button
                onClick={() => onAddModuleToRack('sp404')}
                className="p-2 bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/30 rounded-lg font-bold text-[10px] text-rose-300 transition text-left truncate"
              >
                + SP-404 MKII
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 bg-stone-900 border-t border-stone-800 flex items-center justify-between text-[10px] text-stone-400 shrink-0">
          <span>REASON RACK HOST v12</span>
          <span className="text-amber-400 font-bold">READY</span>
        </div>
      </div>
    </div>
    </>
  );
};
