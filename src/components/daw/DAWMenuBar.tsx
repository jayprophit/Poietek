import React, { useState } from 'react';
import {
  FileText,
  Sliders,
  Play,
  Layers,
  Cpu,
  Tv,
  Settings,
  HelpCircle,
  Scissors,
  Download,
  FolderOpen,
  Save,
  RotateCcw,
  Sparkles,
  Music,
  Maximize2,
  Grid,
  Activity,
  Compass,
  Volume2,
  Menu,
  X,
  ChevronRight,
  ExternalLink,
  Radio,
  Flame,
  Zap,
  Disc,
  Disc3,
  Share2,
  RefreshCw,
  Undo2,
  Redo2,
} from 'lucide-react';
import { WorkspaceType } from '../../types';

interface DAWMenuBarProps {
  activeWorkspace: WorkspaceType;
  setActiveWorkspace: (ws: WorkspaceType) => void;
  isFlipped: boolean;
  onToggleFlip: () => void;
  openAIGrooveModal: () => void;
  openTemplatesModal?: () => void;
  bpm: number;
  detachedWorkspaces?: WorkspaceType[];
  onDetachWorkspace?: (ws: WorkspaceType) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export const DAWMenuBar: React.FC<DAWMenuBarProps> = ({
  activeWorkspace,
  setActiveWorkspace,
  isFlipped,
  onToggleFlip,
  openAIGrooveModal,
  openTemplatesModal,
  bpm,
  detachedWorkspaces = [],
  onDetachWorkspace,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [isBurgerOpen, setIsBurgerOpen] = useState<boolean>(false);

  const toggleMenu = (menu: string) => {
    setActiveMenu((prev) => (prev === menu ? null : menu));
    setActiveSubmenu(null);
  };

  const closeMenu = () => {
    setActiveMenu(null);
    setActiveSubmenu(null);
  };

  return (
    <div className="bg-neutral-900 border-b-2 border-neutral-800 text-neutral-300 font-mono text-xs select-none relative z-50">
      {/* DAW Desktop Top Bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-neutral-950 border-b border-neutral-800">
        {/* Left Section: Burger Icon + App Logo & Menus */}
        <div className="flex items-center gap-1.5">
          {/* Burger Menu Button (Mobile & Desktop Quick Navigation) */}
          <button
            onClick={() => setIsBurgerOpen(!isBurgerOpen)}
            className={`p-1.5 rounded transition flex items-center justify-center ${
              isBurgerOpen
                ? 'bg-amber-500 text-neutral-950 shadow-md'
                : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700 hover:text-amber-400'
            }`}
            title="Toggle Studio Suite Navigation Drawer"
          >
            {isBurgerOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          {/* Logo Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-neutral-950 font-black tracking-widest shadow">
            <Cpu className="w-4 h-4" />
            <span className="text-xs">STUDIO DAW SUITE</span>
          </div>

          {/* UNDO / REDO QUICK ACTION BUTTONS */}
          <div className="flex items-center gap-1 ml-1 border-r border-neutral-800 pr-2">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`px-2 py-1 rounded font-black text-[10px] transition flex items-center gap-1 border ${
                canUndo
                  ? 'bg-stone-800 hover:bg-stone-700 text-stone-200 border-amber-500/40 hover:text-amber-400 shadow'
                  : 'bg-stone-900/60 text-stone-600 border-stone-800 cursor-not-allowed opacity-40'
              }`}
              title="Undo Rack Module Action (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="hidden sm:inline">UNDO</span>
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className={`px-2 py-1 rounded font-black text-[10px] transition flex items-center gap-1 border ${
                canRedo
                  ? 'bg-stone-800 hover:bg-stone-700 text-stone-200 border-amber-500/40 hover:text-amber-400 shadow'
                  : 'bg-stone-900/60 text-stone-600 border-stone-800 cursor-not-allowed opacity-40'
              }`}
              title="Redo Rack Module Action (Ctrl+Y or Ctrl+Shift+Z)"
            >
              <Redo2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="hidden sm:inline">REDO</span>
            </button>
          </div>

          {/* FLIP RACK BUTTON (Hardware Cables Access for Touch / Desktop) */}
          <button
            onClick={onToggleFlip}
            className={`px-2.5 py-1 rounded font-black text-[11px] transition flex items-center gap-1.5 border shadow ${
              isFlipped
                ? 'bg-amber-500 text-neutral-950 border-amber-300 shadow-amber-500/30'
                : 'bg-stone-800 hover:bg-stone-700 text-amber-400 border-amber-500/40'
            }`}
            title="Flip Rack to Rear Patch Bay & Cable Sockets"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFlipped ? 'rotate-180 transition-transform duration-300' : ''}`} />
            <span>{isFlipped ? 'SHOW FRONT FACES' : 'FLIP RACK CABLES'}</span>
          </button>

          {/* Desktop Cascading Menu Bar Items */}
          <div className="hidden lg:flex items-center gap-1 relative ml-2">
            {/* FILE MENU (Cascading) */}
            <div className="relative">
              <button
                onClick={() => toggleMenu('file')}
                className={`px-2.5 py-1 rounded hover:bg-neutral-800 hover:text-white transition font-bold ${
                  activeMenu === 'file' ? 'bg-neutral-800 text-amber-400' : ''
                }`}
              >
                File
              </button>
              {activeMenu === 'file' && (
                <div className="absolute top-full left-0 mt-1 w-60 bg-neutral-900 border-2 border-neutral-700 rounded-xl shadow-2xl py-1 text-xs text-neutral-200 z-50">
                  <button
                    onClick={() => {
                      if (openTemplatesModal) openTemplatesModal();
                      closeMenu();
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-amber-500 hover:text-neutral-950 flex items-center justify-between font-bold text-amber-400"
                  >
                    <span>Starter Songs & Templates...</span>
                    <span className="text-[10px] opacity-60">LOAD</span>
                  </button>
                  <button onClick={closeMenu} className="w-full text-left px-3 py-1.5 hover:bg-amber-500 hover:text-neutral-950 flex items-center justify-between">
                    <span>Save Custom Build as Template...</span>
                  </button>
                  <div className="border-t border-neutral-800 my-1" />

                  {/* Submenu: Export Options */}
                  <div className="relative" onMouseEnter={() => setActiveSubmenu('export')}>
                    <button className="w-full text-left px-3 py-1.5 hover:bg-amber-500 hover:text-neutral-950 flex items-center justify-between font-bold">
                      <span>Export Audio & Stems</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    {activeSubmenu === 'export' && (
                      <div className="absolute left-full top-0 ml-1 w-52 bg-neutral-900 border-2 border-neutral-700 rounded-xl shadow-2xl py-1 text-xs text-neutral-200">
                        <button onClick={closeMenu} className="w-full text-left px-3 py-1.5 hover:bg-amber-500 hover:text-neutral-950">Master Mix WAV (32-Bit)</button>
                        <button onClick={closeMenu} className="w-full text-left px-3 py-1.5 hover:bg-amber-500 hover:text-neutral-950">Isolated Instrument Stems</button>
                        <button onClick={closeMenu} className="w-full text-left px-3 py-1.5 hover:bg-amber-500 hover:text-neutral-950">MP3 High-Bitrate Preview</button>
                        <button onClick={closeMenu} className="w-full text-left px-3 py-1.5 hover:bg-amber-500 hover:text-neutral-950">MIDI Pattern Sequences</button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* VIRTUAL RACK MODULES MENU */}
            <div className="relative">
              <button
                onClick={() => toggleMenu('rack')}
                className={`px-2.5 py-1 rounded hover:bg-neutral-800 hover:text-amber-400 transition font-bold ${
                  activeMenu === 'rack' ? 'bg-neutral-800 text-amber-400' : ''
                }`}
              >
                Studio Rack
              </button>
              {activeMenu === 'rack' && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-neutral-900 border-2 border-neutral-700 rounded-xl shadow-2xl py-1 text-xs text-neutral-200 z-50">
                  <button onClick={() => { setActiveWorkspace('mpc'); closeMenu(); }} className="w-full text-left px-3 py-1.5 hover:bg-amber-500 hover:text-neutral-950 flex items-center justify-between font-bold">
                    <span>MPC Studio Drum Pad</span>
                    <span className="text-[10px] opacity-60">SAMPLER</span>
                  </button>
                  <button onClick={() => { setActiveWorkspace('keyboard'); closeMenu(); }} className="w-full text-left px-3 py-1.5 hover:bg-amber-500 hover:text-neutral-950 flex items-center justify-between font-bold">
                    <span>Analog Subtractive Synth</span>
                    <span className="text-[10px] opacity-60">SYNTH</span>
                  </button>
                  <button onClick={() => { setActiveWorkspace('sp404'); closeMenu(); }} className="w-full text-left px-3 py-1.5 hover:bg-amber-500 hover:text-neutral-950 flex items-center justify-between">
                    <span>SP-404 MKII MFX Sampler</span>
                  </button>
                  <button onClick={() => { setActiveWorkspace('mixer'); closeMenu(); }} className="w-full text-left px-3 py-1.5 hover:bg-amber-500 hover:text-neutral-950 flex items-center justify-between font-bold">
                    <span>SSL 9000 Master Mixer</span>
                    <span className="text-[10px] text-emerald-400">MIX</span>
                  </button>
                  <button onClick={() => { setActiveWorkspace('patchbay'); closeMenu(); }} className="w-full text-left px-3 py-1.5 hover:bg-amber-500 hover:text-neutral-950 flex items-center justify-between">
                    <span>Audio & CV Patch Bay</span>
                  </button>
                </div>
              )}
            </div>

            {/* DAW VIEWS & SEQUENCERS */}
            <div className="relative">
              <button
                onClick={() => toggleMenu('daw')}
                className={`px-2.5 py-1 rounded hover:bg-neutral-800 hover:text-indigo-400 transition font-bold ${
                  activeMenu === 'daw' ? 'bg-neutral-800 text-indigo-400' : ''
                }`}
              >
                Sequencers & Views
              </button>
              {activeMenu === 'daw' && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-neutral-900 border-2 border-neutral-700 rounded-xl shadow-2xl py-1 text-xs text-neutral-200 z-50">
                  <button onClick={() => { setActiveWorkspace('wave_sequencer'); closeMenu(); }} className="w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white flex items-center justify-between font-bold">
                    <span>Multi-Track Waveform Sequencer</span>
                    <span className="text-[10px] text-indigo-400">AUDIO</span>
                  </button>
                  <button onClick={() => { setActiveWorkspace('fl_channel_rack'); closeMenu(); }} className="w-full text-left px-3 py-1.5 hover:bg-orange-600 hover:text-white flex items-center justify-between font-bold">
                    <span>Pattern Step Channel Rack</span>
                    <span className="text-[10px] text-orange-400">STEPS</span>
                  </button>
                  <button onClick={() => { setActiveWorkspace('piano_roll'); closeMenu(); }} className="w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white flex items-center justify-between">
                    <span>Timeline Piano Roll</span>
                  </button>
                  <button onClick={() => { setActiveWorkspace('melodyne_pitch'); closeMenu(); }} className="w-full text-left px-3 py-1.5 hover:bg-purple-600 hover:text-white flex items-center justify-between">
                    <span>Pro Vocal Pitch Editor</span>
                  </button>
                  <button onClick={() => { setActiveWorkspace('circle_fifths'); closeMenu(); }} className="w-full text-left px-3 py-1.5 hover:bg-amber-500 hover:text-neutral-950 flex items-center justify-between">
                    <span>Circle of Fifths Harmony Matrix</span>
                  </button>
                  <button onClick={() => { setActiveWorkspace('d_groove'); closeMenu(); }} className="w-full text-left px-3 py-1.5 hover:bg-amber-500 hover:text-neutral-950 flex items-center justify-between">
                    <span>ReGroove / D-Groove Shuffle Pool</span>
                  </button>
                </div>
              )}
            </div>

            {/* DETACH WINDOWS (FLOATING MULTI-SCREEN) */}
            {onDetachWorkspace && (
              <button
                onClick={() => onDetachWorkspace(activeWorkspace)}
                className="px-2.5 py-1 rounded bg-stone-800 text-stone-200 hover:bg-amber-500 hover:text-neutral-950 transition font-bold flex items-center gap-1.5 border border-stone-700"
                title="Detach active view into a draggable floating window for multi-screen editing"
              >
                <ExternalLink className="w-3 h-3 text-amber-400" />
                <span>Detach Window</span>
              </button>
            )}

            {/* AI TOOL ASSISTANT */}
            <button
              onClick={openAIGrooveModal}
              className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-neutral-950 transition font-black flex items-center gap-1.5 border border-amber-500/40"
            >
              <Sparkles className="w-3 h-3" />
              <span>AI Groove Assistant</span>
            </button>
          </div>
        </div>

        {/* Right Status Info */}
        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-neutral-400">BPM: <strong className="text-amber-400">{bpm}</strong></span>
          <span className="hidden sm:inline text-neutral-400">Driver: <strong className="text-emerald-400">Studio Pro 64</strong></span>
        </div>
      </div>

      {/* CASCADING BURGER SLIDE-OUT DRAWER (For Touch, Tablet, or Compact Mobile) */}
      {isBurgerOpen && (
        <div className="fixed inset-0 top-9 bg-neutral-950/95 z-[100] p-4 font-mono text-xs overflow-y-auto backdrop-blur-lg animate-in slide-in-from-top-2 duration-200 border-b-2 border-amber-500">
          <div className="max-w-xl mx-auto space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <span className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
                <Menu className="w-4 h-4 text-amber-400" />
                STUDIO DAW SUITE CASCADING NAVIGATION
              </span>
              <button
                onClick={() => setIsBurgerOpen(false)}
                className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onToggleFlip();
                  setIsBurgerOpen(false);
                }}
                className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold hover:bg-amber-500 hover:text-neutral-950 transition flex items-center justify-between"
              >
                <span>{isFlipped ? 'Show Front Rack' : 'Flip to Rear Patch Bay'}</span>
                <RefreshCw className="w-4 h-4" />
              </button>

              {onDetachWorkspace && (
                <button
                  onClick={() => {
                    onDetachWorkspace(activeWorkspace);
                    setIsBurgerOpen(false);
                  }}
                  className="p-3 rounded-xl bg-stone-800 border border-stone-700 text-stone-200 font-bold hover:bg-amber-500 hover:text-neutral-950 transition flex items-center justify-between"
                >
                  <span>Detach Window</span>
                  <ExternalLink className="w-4 h-4 text-amber-400" />
                </button>
              )}
            </div>

            {/* Cascading Categories */}
            <div className="space-y-3 pt-2">
              <div className="border border-neutral-800 rounded-2xl p-3 bg-neutral-900/60">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-2">
                  1. Sequencers & Timelines
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => { setActiveWorkspace('wave_sequencer'); setIsBurgerOpen(false); }}
                    className="p-2.5 rounded-xl bg-neutral-900 hover:bg-indigo-600 hover:text-white border border-neutral-800 text-left font-bold flex items-center gap-2"
                  >
                    <Layers className="w-4 h-4 text-blue-400" />
                    <span>Multi-Track Waveforms</span>
                  </button>
                  <button
                    onClick={() => { setActiveWorkspace('fl_channel_rack'); setIsBurgerOpen(false); }}
                    className="p-2.5 rounded-xl bg-neutral-900 hover:bg-orange-600 hover:text-white border border-neutral-800 text-left font-bold flex items-center gap-2"
                  >
                    <Zap className="w-4 h-4 text-orange-400" />
                    <span>Pattern Step Channel Rack</span>
                  </button>
                  <button
                    onClick={() => { setActiveWorkspace('piano_roll'); setIsBurgerOpen(false); }}
                    className="p-2.5 rounded-xl bg-neutral-900 hover:bg-indigo-600 hover:text-white border border-neutral-800 text-left font-bold flex items-center gap-2"
                  >
                    <Grid className="w-4 h-4 text-indigo-400" />
                    <span>Timeline Piano Roll</span>
                  </button>
                  <button
                    onClick={() => { setActiveWorkspace('melodyne_pitch'); setIsBurgerOpen(false); }}
                    className="p-2.5 rounded-xl bg-neutral-900 hover:bg-purple-600 hover:text-white border border-neutral-800 text-left font-bold flex items-center gap-2"
                  >
                    <Activity className="w-4 h-4 text-purple-400" />
                    <span>Pro Vocal Pitch Tuner</span>
                  </button>
                </div>
              </div>

              <div className="border border-neutral-800 rounded-2xl p-3 bg-neutral-900/60">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-2">
                  2. Instruments & Samplers
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => { setActiveWorkspace('mpc'); setIsBurgerOpen(false); }}
                    className="p-2.5 rounded-xl bg-neutral-900 hover:bg-amber-500 hover:text-neutral-950 border border-neutral-800 text-left font-bold flex items-center gap-2"
                  >
                    <Grid className="w-4 h-4 text-amber-400" />
                    <span>MPC Studio Drum Pad</span>
                  </button>
                  <button
                    onClick={() => { setActiveWorkspace('keyboard'); setIsBurgerOpen(false); }}
                    className="p-2.5 rounded-xl bg-neutral-900 hover:bg-amber-500 hover:text-neutral-950 border border-neutral-800 text-left font-bold flex items-center gap-2"
                  >
                    <Music className="w-4 h-4 text-purple-400" />
                    <span>Analog Subtractive Synth</span>
                  </button>
                  <button
                    onClick={() => { setActiveWorkspace('sp404'); setIsBurgerOpen(false); }}
                    className="p-2.5 rounded-xl bg-neutral-900 hover:bg-amber-500 hover:text-neutral-950 border border-neutral-800 text-left font-bold flex items-center gap-2"
                  >
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span>SP-404 MKII MFX Sampler</span>
                  </button>
                  <button
                    onClick={() => { setActiveWorkspace('mixer'); setIsBurgerOpen(false); }}
                    className="p-2.5 rounded-xl bg-neutral-900 hover:bg-amber-500 hover:text-neutral-950 border border-neutral-800 text-left font-bold flex items-center gap-2"
                  >
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    <span>SSL 9000 Studio Mixer</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
