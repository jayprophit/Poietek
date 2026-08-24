import React, { useState } from 'react';
import {
  Plus,
  FolderPlus,
  RefreshCw,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  BookOpen,
  Grid,
  Music,
  Sliders,
  Zap,
  Activity,
  Layers,
  Flame,
  X,
  Undo2,
  Redo2,
} from 'lucide-react';
import { WorkspaceType, ModuleType } from '../../types';

interface FloatingQuickPaletteProps {
  onAddModule: (type: ModuleType) => void;
  onToggleFlip: () => void;
  isFlipped: boolean;
  openAIGrooveModal: () => void;
  openTemplatesModal: () => void;
  onDetachWorkspace: () => void;
  autoHideBars: boolean;
  setAutoHideBars: (val: boolean) => void;
  activeWorkspace: WorkspaceType;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export const FloatingQuickPalette: React.FC<FloatingQuickPaletteProps> = ({
  onAddModule,
  onToggleFlip,
  isFlipped,
  openAIGrooveModal,
  openTemplatesModal,
  onDetachWorkspace,
  autoHideBars,
  setAutoHideBars,
  activeWorkspace,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState<boolean>(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 24, y: 110 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: Math.max(10, Math.min(window.innerWidth - 300, e.clientX - dragOffset.x)),
        y: Math.max(50, Math.min(window.innerHeight - 200, e.clientY - dragOffset.y)),
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  const moduleOptions: { type: ModuleType; label: string; icon: React.FC<{ className?: string }>; category: string }[] = [
    { type: 'folder_combinator', label: 'Combinator Bus Folder', icon: FolderPlus, category: 'BUS & GROUPS' },
      { type: 'mpc', label: 'Canvas Drum Grid', icon: Grid, category: 'SAMPLERS' },
      { type: 'sp404', label: 'Grain Deck Sampler', icon: Flame, category: 'SAMPLERS' },
    { type: 'keyboard', label: 'Analog Subtractive Synth', icon: Music, category: 'SYNTHS' },
    { type: 'drum_machines', label: 'Studio Drum Computer', icon: Zap, category: 'SEQUENCERS' },
      { type: 'mixer', label: 'Summit Master Console', icon: Sliders, category: 'MIXING' },
    { type: 'wave_sequencer', label: 'Multi-Track Audio Sequencer', icon: Layers, category: 'SEQUENCERS' },
    { type: 'fl_channel_rack', label: 'Pattern Step Channel Rack', icon: Zap, category: 'SEQUENCERS' },
      { type: 'melodyne_pitch', label: 'Vocal Contour Editor', icon: Activity, category: 'PITCH & HARMONY' },
    { type: 'chop_lab', label: 'Chop Lab Stem Slicer', icon: Layers, category: 'SAMPLERS' },
  ];

  return (
    <div
      style={{ top: `${position.y}px`, left: `${position.x}px` }}
      className="fixed z-[120] font-mono select-none"
    >
      <div className="bg-neutral-950/95 border-2 border-amber-500/70 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.95)] backdrop-blur-md overflow-hidden text-xs text-neutral-200 w-72">
        {/* Header Bar */}
        <div
          onMouseDown={handleMouseDown}
          className="bg-gradient-to-r from-neutral-900 via-stone-900 to-neutral-900 px-3 py-1.5 border-b border-amber-500/40 flex items-center justify-between cursor-move text-amber-400 font-black tracking-wider"
        >
          <div className="flex items-center gap-1.5">
            <GripVertical className="w-3.5 h-3.5 text-neutral-500" />
            <span className="text-[11px]">QUICK OPTIONS PALETTE</span>
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-label={isOpen ? 'Collapse Quick Options palette' : 'Expand Quick Options palette'}
            className="p-0.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isOpen && (
          <div className="p-2 space-y-2">
            {/* Action 1: Add Module to Rack Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                className="w-full py-2 px-3 rounded-xl bg-amber-500 text-neutral-950 font-black flex items-center justify-between hover:bg-amber-400 transition shadow-lg shadow-amber-500/20"
              >
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>ADD MODULE TO RACK</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${isAddMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isAddMenuOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-900 border-2 border-neutral-700 rounded-xl shadow-2xl p-1.5 z-50 max-h-64 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-stone-700">
                  {moduleOptions.map((opt, idx) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          onAddModule(opt.type);
                          setIsAddMenuOpen(false);
                        }}
                        className="w-full text-left p-2 rounded-lg bg-neutral-950/80 hover:bg-amber-500 hover:text-neutral-950 border border-neutral-800 flex items-center justify-between transition group"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5 text-amber-400 group-hover:text-neutral-950" />
                          <span className="font-bold">{opt.label}</span>
                        </div>
                        <span className="text-[9px] text-neutral-500 group-hover:text-neutral-900 font-bold uppercase">
                          {opt.category}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Undo / Redo Bar */}
            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className={`p-2 rounded-xl border text-[10px] font-bold transition flex items-center justify-center gap-1.5 ${
                  canUndo
                    ? 'bg-stone-900 hover:bg-stone-800 text-stone-200 border-amber-500/40 hover:text-amber-400'
                    : 'bg-neutral-900/50 text-neutral-600 border-neutral-800 cursor-not-allowed opacity-40'
                }`}
                title="Undo last rack stack change (Ctrl+Z)"
              >
                <Undo2 className="w-3.5 h-3.5 text-amber-400" />
                <span>UNDO RACK</span>
              </button>

              <button
                onClick={onRedo}
                disabled={!canRedo}
                className={`p-2 rounded-xl border text-[10px] font-bold transition flex items-center justify-center gap-1.5 ${
                  canRedo
                    ? 'bg-stone-900 hover:bg-stone-800 text-stone-200 border-amber-500/40 hover:text-amber-400'
                    : 'bg-neutral-900/50 text-neutral-600 border-neutral-800 cursor-not-allowed opacity-40'
                }`}
                title="Redo rack stack change (Ctrl+Y)"
              >
                <Redo2 className="w-3.5 h-3.5 text-amber-400" />
                <span>REDO RACK</span>
              </button>
            </div>

            {/* Grid Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              <button
                onClick={() => onAddModule('folder_combinator')}
                className="p-2 rounded-xl bg-stone-900 hover:bg-amber-500 hover:text-neutral-950 border border-stone-800 text-amber-400 font-bold transition flex items-center gap-1.5 text-[10px]"
                title="Create a Combinator Bus Folder to group modules"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>NEW BUS FOLDER</span>
              </button>

              <button
                onClick={onToggleFlip}
                className={`p-2 rounded-xl border text-[10px] font-bold transition flex items-center gap-1.5 ${
                  isFlipped
                    ? 'bg-amber-500 text-neutral-950 border-amber-300'
                    : 'bg-stone-900 hover:bg-stone-800 text-amber-400 border-stone-800'
                }`}
                title="Flip Rack to Rear Cables Sockets (TAB)"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isFlipped ? 'SHOW FRONT' : 'FLIP CABLES'}</span>
              </button>

              <button
                onClick={openTemplatesModal}
                className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-indigo-300 font-bold transition flex items-center gap-1.5 text-[10px]"
                title="Load or Save Studio Templates & Starter Songs"
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span>TEMPLATES</span>
              </button>

              <button
                onClick={openAIGrooveModal}
                className="p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500 hover:text-neutral-950 border border-amber-500/40 text-amber-300 font-bold transition flex items-center gap-1.5 text-[10px]"
                title="Open AI Groove Assistant"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>AI GROOVE</span>
              </button>
            </div>

            {/* Bottom Controls: Auto-Hide Bars & Detach */}
            <div className="border-t border-neutral-800 pt-2 space-y-1.5">
              <button
                onClick={() => setAutoHideBars(!autoHideBars)}
                className={`w-full py-1.5 px-2.5 rounded-lg border text-[10px] font-bold flex items-center justify-between transition ${
                  autoHideBars
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {autoHideBars ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5 text-neutral-400" />}
                  <span>AUTO-HIDE MENU BARS</span>
                </div>
                <span className="text-[9px] px-1 py-0.2 rounded bg-neutral-950 font-mono">
                  {autoHideBars ? 'ON' : 'OFF'}
                </span>
              </button>

              <button
                onClick={onDetachWorkspace}
                className="w-full py-1.5 px-2.5 rounded-lg bg-neutral-900 hover:bg-stone-800 border border-neutral-800 text-neutral-300 font-bold text-[10px] flex items-center justify-between transition"
              >
                <div className="flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                  <span>DETACH VIEW WINDOW</span>
                </div>
                <span className="text-[9px] text-neutral-500">MULTI-MONITOR</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
