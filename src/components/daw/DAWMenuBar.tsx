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
  User,
  HardDrive,
  Keyboard,
  ShieldCheck,
  Check,
  ChevronDown,
  ShoppingBag,
} from 'lucide-react';
import { WorkspaceType } from '../../types';

interface DAWMenuBarProps {
  activeWorkspace: WorkspaceType;
  setActiveWorkspace: (ws: WorkspaceType) => void;
  isFlipped: boolean;
  onToggleFlip: () => void;
  openAIGrooveModal: () => void;
  openTemplatesModal?: () => void;
  openSettingsModal?: () => void;
  openProfileModal?: () => void;
  openShortcutsModal?: () => void;
  openStoreModal?: () => void;
  bpm: number;
  detachedWorkspaces?: WorkspaceType[];
  onDetachWorkspace?: (ws: WorkspaceType) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  autoSaveEnabled?: boolean;
  lastAutoSaveTime?: string;
  onTriggerManualSave?: () => void;
  onFoldAllModules?: () => void;
  onUnfoldAllModules?: () => void;
  onResetProject?: () => void;
}

export const DAWMenuBar: React.FC<DAWMenuBarProps> = ({
  activeWorkspace,
  setActiveWorkspace,
  isFlipped,
  onToggleFlip,
  openAIGrooveModal,
  openTemplatesModal,
  openSettingsModal,
  openProfileModal,
  openShortcutsModal,
  openStoreModal,
  bpm,
  detachedWorkspaces = [],
  onDetachWorkspace,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  autoSaveEnabled = true,
  lastAutoSaveTime = '',
  onTriggerManualSave,
  onFoldAllModules,
  onUnfoldAllModules,
  onResetProject,
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [isBurgerOpen, setIsBurgerOpen] = useState<boolean>(false);
  const [autoSaveToast, setAutoSaveToast] = useState<boolean>(false);

  const toggleMenu = (menu: string) => {
    setActiveMenu((prev) => (prev === menu ? null : menu));
    setActiveSubmenu(null);
  };

  const closeMenu = () => {
    setActiveMenu(null);
    setActiveSubmenu(null);
  };

  const handleManualSave = () => {
    if (onTriggerManualSave) onTriggerManualSave();
    setAutoSaveToast(true);
    setTimeout(() => setAutoSaveToast(false), 2500);
    closeMenu();
  };

  return (
    <div className="bg-neutral-900 border-b-2 border-neutral-800 text-neutral-300 font-mono text-xs select-none relative z-[250]">
      {/* DAW Desktop Top Bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-neutral-950 border-b border-neutral-800 flex-wrap gap-1">
        {/* Left Section: Burger Icon + App Logo & Menus */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Burger Menu Button */}
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
          <div className="flex items-center gap-1 border-r border-neutral-800 pr-2">
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
              title="Redo Rack Module Action (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="hidden sm:inline">REDO</span>
            </button>
          </div>

          {/* FLIP RACK BUTTON */}
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
            <span>{isFlipped ? 'FRONT FACES' : 'FLIP CABLES'}</span>
          </button>

          {/* Desktop Cascading Menu Bar Items */}
          <div className="hidden lg:flex items-center gap-1 relative ml-1">
            {/* FILE MENU */}
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
                <div className="absolute top-full left-0 mt-1 w-64 bg-neutral-900 border-2 border-neutral-700 rounded-xl shadow-2xl py-1 text-xs text-neutral-200 z-50">
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
                  <button
                    onClick={handleManualSave}
                    className="w-full text-left px-3 py-1.5 hover:bg-amber-500 hover:text-neutral-950 flex items-center justify-between font-bold"
                  >
                    <span>Save Project Now</span>
                    <span className="text-[10px] text-emerald-400">AUTOSAVE</span>
                  </button>

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

                  <div className="border-t border-neutral-800 my-1" />
                  <button
                    onClick={() => {
                      if (openSettingsModal) openSettingsModal();
                      closeMenu();
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-amber-500 hover:text-neutral-950 flex items-center justify-between"
                  >
                    <span>Auto-Save Settings...</span>
                  </button>
                  {onResetProject && (
                    <button
                      onClick={() => {
                        onResetProject();
                        closeMenu();
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-rose-950 text-rose-400 flex items-center justify-between"
                    >
                      <span>Reset Project to Factory Default</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* EDIT MENU */}
            <div className="relative">
              <button
                onClick={() => toggleMenu('edit')}
                className={`px-2.5 py-1 rounded hover:bg-neutral-800 hover:text-white transition font-bold ${
                  activeMenu === 'edit' ? 'bg-neutral-800 text-amber-400' : ''
                }`}
              >
                Edit
              </button>
              {activeMenu === 'edit' && (
                <div className="absolute top-full left-0 mt-1 w-60 bg-neutral-900 border-2 border-neutral-700 rounded-xl shadow-2xl py-1 text-xs text-neutral-200 z-50">
                  <button
                    onClick={() => {
                      if (onUndo) onUndo();
                      closeMenu();
                    }}
                    disabled={!canUndo}
                    className="w-full text-left px-3 py-1.5 hover:bg-amber-500 hover:text-neutral-950 flex items-center justify-between disabled:opacity-40"
                  >
                    <span>Undo Operation</span>
                    <span className="text-[10px] opacity-60">Ctrl+Z</span>
                  </button>
                  <button
                    onClick={() => {
                      if (onRedo) onRedo();
                      closeMenu();
                    }}
                    disabled={!canRedo}
                    className="w-full text-left px-3 py-1.5 hover:bg-amber-500 hover:text-neutral-950 flex items-center justify-between disabled:opacity-40"
                  >
                    <span>Redo Operation</span>
                    <span className="text-[10px] opacity-60">Ctrl+Y</span>
                  </button>
                  <div className="border-t border-neutral-800 my-1" />
                  {onFoldAllModules && (
                    <button
                      onClick={() => {
                        onFoldAllModules();
                        closeMenu();
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-amber-500 hover:text-neutral-950 flex items-center justify-between font-bold"
                    >
                      <span>Fold All Rack Modules</span>
                      <span className="text-[10px] text-amber-400">CASCADING</span>
                    </button>
                  )}
                  {onUnfoldAllModules && (
                    <button
                      onClick={() => {
                        onUnfoldAllModules();
                        closeMenu();
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-amber-500 hover:text-neutral-950 flex items-center justify-between font-bold"
                    >
                      <span>Expand All Rack Modules</span>
                    </button>
                  )}
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
                  <button onClick={() => { setActiveWorkspace('subtractor_synth'); closeMenu(); }} className="w-full text-left px-3 py-1.5 hover:bg-amber-500 hover:text-neutral-950 flex items-center justify-between font-bold">
                    <span>Subtractor Poly Synth</span>
                    <span className="text-[10px] text-purple-400">SYNTH</span>
                  </button>
                  <button onClick={() => { setActiveWorkspace('thor_synth'); closeMenu(); }} className="w-full text-left px-3 py-1.5 hover:bg-amber-500 hover:text-neutral-950 flex items-center justify-between font-bold">
                    <span>Thor Polysonic Synth</span>
                    <span className="text-[10px] text-emerald-400">SYNTH</span>
                  </button>
                  <button onClick={() => { setActiveWorkspace('sp404'); closeMenu(); }} className="w-full text-left px-3 py-1.5 hover:bg-amber-500 hover:text-neutral-950 flex items-center justify-between">
                    <span>SP-404 MKII MFX Sampler</span>
                  </button>
                  <button onClick={() => { setActiveWorkspace('mixer'); closeMenu(); }} className="w-full text-left px-3 py-1.5 hover:bg-amber-500 hover:text-neutral-950 flex items-center justify-between font-bold">
                    <span>SSL 9000 Master Mixer</span>
                    <span className="text-[10px] text-emerald-400">MIX</span>
                  </button>
                </div>
              )}
            </div>

            {/* SEQUENCERS & VIEWS */}
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
                </div>
              )}
            </div>

            {/* OPTIONS & PREFERENCES MENU */}
            <div className="relative">
              <button
                onClick={() => toggleMenu('options')}
                className={`px-2.5 py-1 rounded hover:bg-neutral-800 hover:text-white transition font-bold ${
                  activeMenu === 'options' ? 'bg-neutral-800 text-amber-400' : ''
                }`}
              >
                Options & Preferences
              </button>
              {activeMenu === 'options' && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-neutral-900 border-2 border-neutral-700 rounded-xl shadow-2xl py-1 text-xs text-neutral-200 z-50">
                  <button
                    onClick={() => {
                      if (openSettingsModal) openSettingsModal();
                      closeMenu();
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-amber-500 hover:text-neutral-950 flex items-center justify-between font-bold text-amber-400"
                  >
                    <span>Studio Preferences & Audio Engine...</span>
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (openProfileModal) openProfileModal();
                      closeMenu();
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-amber-500 hover:text-neutral-950 flex items-center justify-between font-bold"
                  >
                    <span>Producer Profile & License...</span>
                    <User className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (openStoreModal) openStoreModal();
                      closeMenu();
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-amber-500 hover:text-neutral-950 flex items-center justify-between font-bold text-amber-400"
                  >
                    <span>Reason Shop & Extension Marketplace...</span>
                    <ShoppingBag className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (openShortcutsModal) openShortcutsModal();
                      closeMenu();
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-amber-500 hover:text-neutral-950 flex items-center justify-between"
                  >
                    <span>Keyboard Hotkeys & Shortcuts Reference</span>
                    <Keyboard className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* SHOP & PLUGINS BUTTON */}
            <button
              onClick={() => openStoreModal && openStoreModal()}
              className="px-2.5 py-1 rounded bg-amber-500 text-neutral-950 hover:bg-amber-400 transition font-black flex items-center gap-1.5 shadow"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>SHOP & PLUGINS</span>
            </button>

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

        {/* Right Status Info: Auto-Save Badge & Producer Profile */}
        <div className="flex items-center gap-3 text-[11px] shrink-0">
          {/* Real-Time Auto-Save Status Badge */}
          <button
            onClick={handleManualSave}
            className={`px-2.5 py-0.5 rounded-full border text-[10px] font-black transition flex items-center gap-1.5 ${
              autoSaveToast
                ? 'bg-emerald-500 text-neutral-950 border-emerald-300 shadow-md scale-105'
                : autoSaveEnabled
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-700/60 hover:border-emerald-500'
                : 'bg-neutral-800 text-neutral-500 border-neutral-700'
            }`}
            title="Click to Trigger Immediate Save to Local Storage"
          >
            <div
              className={`w-2 h-2 rounded-full ${
                autoSaveEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-600'
              }`}
            />
            <HardDrive className="w-3 h-3" />
            <span>
              {autoSaveToast
                ? 'PROJECT SAVED!'
                : autoSaveEnabled
                ? `AUTOSAVE ${lastAutoSaveTime ? `(${lastAutoSaveTime})` : 'ON'}`
                : 'AUTOSAVE OFF'}
            </span>
          </button>

          {/* Producer Profile Button */}
          {openProfileModal && (
            <button
              onClick={openProfileModal}
              className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-amber-400 font-bold border border-stone-700 flex items-center gap-1.5 transition"
              title="Open Producer Profile & License Info"
            >
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">PRODUCER</span>
            </button>
          )}

          <span className="text-neutral-400">
            BPM: <strong className="text-amber-400">{bpm}</strong>
          </span>
        </div>
      </div>

      {/* CASCADING BURGER SLIDE-OUT DRAWER */}
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => {
                  if (openStoreModal) openStoreModal();
                  setIsBurgerOpen(false);
                }}
                className="p-3 rounded-xl bg-amber-500 border border-amber-400 text-neutral-950 font-black hover:bg-amber-400 transition flex items-center justify-between shadow"
              >
                <span>Plugin Shop</span>
                <ShoppingBag className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  if (openProfileModal) openProfileModal();
                  setIsBurgerOpen(false);
                }}
                className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold hover:bg-amber-500 hover:text-neutral-950 transition flex items-center justify-between"
              >
                <span>Producer Profile</span>
                <User className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  if (openSettingsModal) openSettingsModal();
                  setIsBurgerOpen(false);
                }}
                className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-200 font-bold hover:bg-amber-500 hover:text-neutral-950 transition flex items-center justify-between"
              >
                <span>Preferences</span>
                <Settings className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  handleManualSave();
                  setIsBurgerOpen(false);
                }}
                className="p-3 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold hover:bg-emerald-500 hover:text-neutral-950 transition flex items-center justify-between"
              >
                <span>Save Project</span>
                <HardDrive className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
