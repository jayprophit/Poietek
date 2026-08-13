import React, { useState } from 'react';
import {
  Activity,
  Sliders,
  Music,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Layers,
  Sparkles,
  Maximize2,
  Minimize2,
  Radio,
} from 'lucide-react';
import { CubaseLogicWaveformSequencer } from './CubaseLogicWaveformSequencer';
import { DGrooveMixer } from './DGrooveMixer';
import { KeyboardWorkspace } from '../workspaces/KeyboardWorkspace';

interface BottomDAWAndReGroovePanelProps {
  isDAWDetached: boolean;
  isReGrooveDetached: boolean;
  isKeyboardDetached: boolean;
  onDetachDAW: () => void;
  onDockDAW: () => void;
  onDetachReGroove: () => void;
  onDockReGroove: () => void;
  onDetachKeyboard: () => void;
  onDockKeyboard: () => void;
  onSimulateMIDI?: () => void;
}

export const BottomDAWAndReGroovePanel: React.FC<BottomDAWAndReGroovePanelProps> = ({
  isDAWDetached,
  isReGrooveDetached,
  isKeyboardDetached,
  onDetachDAW,
  onDockDAW,
  onDetachReGroove,
  onDockReGroove,
  onDetachKeyboard,
  onDockKeyboard,
  onSimulateMIDI,
}) => {
  const [activeTab, setActiveTab] = useState<'daw' | 'regroove' | 'keyboard' | 'split'>(() => {
    try {
      const saved = localStorage.getItem('studio_bottom_panel_active_tab');
      return (saved as any) || 'daw';
    } catch {
      return 'daw';
    }
  });
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('studio_bottom_panel_collapsed');
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const [panelHeight, setPanelHeight] = useState<'compact' | 'medium' | 'large' | 'max'>(() => {
    try {
      const saved = localStorage.getItem('studio_bottom_panel_height');
      return (saved as any) || 'large';
    } catch {
      return 'large';
    }
  });

  React.useEffect(() => {
    localStorage.setItem('studio_bottom_panel_active_tab', activeTab);
  }, [activeTab]);

  React.useEffect(() => {
    localStorage.setItem('studio_bottom_panel_collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  React.useEffect(() => {
    localStorage.setItem('studio_bottom_panel_height', panelHeight);
  }, [panelHeight]);

  const heightClasses = {
    compact: 'max-h-64',
    medium: 'max-h-96',
    large: 'max-h-[520px]',
    max: 'max-h-[80vh]',
  };

  const allDetached = isDAWDetached && isReGrooveDetached && isKeyboardDetached;

  if (allDetached) {
    return (
      <div className="bg-stone-950 border-2 border-dashed border-indigo-500/50 rounded-xl p-3 flex items-center justify-between font-mono text-xs text-stone-300 shadow-xl">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-400" />
          <span className="font-black text-indigo-400 uppercase tracking-widest">
            ALL BOTTOM UNITS (DAW, REGROOVE, KEYBOARD) DETACHED TO FLOATING WINDOWS
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onDockDAW}
            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-lg text-[10px] shadow"
          >
            DOCK DAW
          </button>
          <button
            onClick={onDockReGroove}
            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black rounded-lg text-[10px] shadow"
          >
            DOCK REGROOVE
          </button>
          <button
            onClick={onDockKeyboard}
            className="px-2.5 py-1 bg-violet-600 hover:bg-violet-500 text-white font-black rounded-lg text-[10px] shadow"
          >
            DOCK KEYBOARD
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-950 border-t-2 border-stone-800 shadow-2xl font-mono text-xs select-none overflow-hidden flex flex-col">
      {/* Top Header Bar with Tab Selection */}
      <div className="bg-stone-900 border-b border-stone-800 px-3 py-1.5 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black bg-indigo-500 text-white px-2 py-0.5 rounded tracking-widest">
            REASON WORKSTATION
          </span>
          <span className="font-black text-white text-xs tracking-wider">
            AUDIO DAW • REGROOVE MATRIX • MIDI KEYBOARD
          </span>
        </div>

        {/* Tab Selection Buttons */}
        <div className="flex items-center gap-1 bg-black p-0.5 rounded-lg border border-stone-800 text-[10px] font-bold">
          <button
            onClick={() => {
              setActiveTab('daw');
              setIsCollapsed(false);
            }}
            className={`px-3 py-1 rounded transition flex items-center gap-1.5 ${
              activeTab === 'daw'
                ? 'bg-indigo-600 text-white font-black shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>AUDIO DAW TIMELINE</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('regroove');
              setIsCollapsed(false);
            }}
            className={`px-3 py-1 rounded transition flex items-center gap-1.5 ${
              activeTab === 'regroove'
                ? 'bg-amber-500 text-neutral-950 font-black shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>REGROOVE MIXER</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('keyboard');
              setIsCollapsed(false);
            }}
            className={`px-3 py-1 rounded transition flex items-center gap-1.5 ${
              activeTab === 'keyboard'
                ? 'bg-violet-600 text-white font-black shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>🎹 MIDI KEYBOARD</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('split');
              setIsCollapsed(false);
            }}
            className={`px-2.5 py-1 rounded transition flex items-center gap-1.5 ${
              activeTab === 'split'
                ? 'bg-purple-600 text-white font-black shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>SPLIT VIEW</span>
          </button>
        </div>

        {/* Right Actions: Height Selector, Fold & Detach Options */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Panel Resize Height Switcher */}
          {!isCollapsed && (
            <div className="flex items-center gap-1 bg-black/60 px-1.5 py-0.5 rounded-lg border border-stone-800 text-[9px] font-bold">
              <span className="text-stone-500 uppercase tracking-wider hidden sm:inline">HEIGHT:</span>
              <button
                onClick={() => setPanelHeight('compact')}
                className={`px-1.5 py-0.5 rounded transition ${
                  panelHeight === 'compact' ? 'bg-amber-500 text-black font-black' : 'text-stone-400 hover:text-white'
                }`}
                title="Compact Height (250px)"
              >
                S
              </button>
              <button
                onClick={() => setPanelHeight('medium')}
                className={`px-1.5 py-0.5 rounded transition ${
                  panelHeight === 'medium' ? 'bg-amber-500 text-black font-black' : 'text-stone-400 hover:text-white'
                }`}
                title="Medium Height (380px)"
              >
                M
              </button>
              <button
                onClick={() => setPanelHeight('large')}
                className={`px-1.5 py-0.5 rounded transition ${
                  panelHeight === 'large' ? 'bg-amber-500 text-black font-black' : 'text-stone-400 hover:text-white'
                }`}
                title="Large View (520px)"
              >
                L
              </button>
              <button
                onClick={() => setPanelHeight('max')}
                className={`px-1.5 py-0.5 rounded transition ${
                  panelHeight === 'max' ? 'bg-amber-500 text-black font-black' : 'text-stone-400 hover:text-white'
                }`}
                title="Full View (80vh)"
              >
                MAX
              </button>
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded text-[10px] font-bold flex items-center gap-1 border border-stone-700 transition"
            title={isCollapsed ? 'Expand Panel' : 'Collapse Panel'}
          >
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            <span>{isCollapsed ? 'EXPAND PANEL' : 'FOLD PANEL'}</span>
          </button>

          {!isDAWDetached && activeTab === 'daw' && (
            <button
              onClick={onDetachDAW}
              className="px-2 py-1 bg-indigo-500/20 hover:bg-indigo-500 hover:text-white text-indigo-300 rounded text-[10px] font-bold flex items-center gap-1 border border-indigo-500/40 transition"
              title="Detach Audio DAW into a floating window"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>DETACH DAW</span>
            </button>
          )}

          {!isReGrooveDetached && activeTab === 'regroove' && (
            <button
              onClick={onDetachReGroove}
              className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500 hover:text-black text-amber-400 rounded text-[10px] font-black flex items-center gap-1 border border-amber-500/40 transition"
              title="Detach ReGroove Mixer into a floating window"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>DETACH REGROOVE</span>
            </button>
          )}

          {!isKeyboardDetached && activeTab === 'keyboard' && (
            <button
              onClick={onDetachKeyboard}
              className="px-2 py-1 bg-violet-500/20 hover:bg-violet-500 hover:text-white text-violet-300 rounded text-[10px] font-black flex items-center gap-1 border border-violet-500/40 transition"
              title="Detach Keyboard Controller into a floating window"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>DETACH KEYBOARD</span>
            </button>
          )}
        </div>
      </div>

      {/* Panel Content Body */}
      {!isCollapsed && (
        <div className={`${heightClasses[panelHeight]} overflow-y-auto scrollbar-thin scrollbar-thumb-stone-800 p-2 bg-stone-950 transition-all duration-300`}>
          {activeTab === 'daw' && (
            <div>
              {isDAWDetached ? (
                <div className="p-4 bg-stone-900 border border-stone-800 rounded-xl text-center">
                  <span className="text-amber-400 font-bold block">
                    AUDIO DAW TIMELINE DETACHED TO FLOATING WINDOW
                  </span>
                  <button
                    onClick={onDockDAW}
                    className="mt-2 px-3 py-1 bg-indigo-600 text-white font-bold rounded-lg text-xs shadow"
                  >
                    Dock Back to Bottom
                  </button>
                </div>
              ) : (
                <CubaseLogicWaveformSequencer />
              )}
            </div>
          )}

          {activeTab === 'regroove' && (
            <div>
              {isReGrooveDetached ? (
                <div className="p-4 bg-stone-900 border border-stone-800 rounded-xl text-center">
                  <span className="text-amber-400 font-bold block">
                    REGROOVE MIXER DETACHED TO FLOATING WINDOW
                  </span>
                  <button
                    onClick={onDockReGroove}
                    className="mt-2 px-3 py-1 bg-amber-500 text-black font-bold rounded-lg text-xs shadow"
                  >
                    Dock Back to Bottom
                  </button>
                </div>
              ) : (
                <DGrooveMixer />
              )}
            </div>
          )}

          {activeTab === 'keyboard' && (
            <div>
              {isKeyboardDetached ? (
                <div className="p-4 bg-stone-900 border border-stone-800 rounded-xl text-center">
                  <span className="text-violet-400 font-bold block">
                    MIDI KEYBOARD CONTROLLER DETACHED TO FLOATING WINDOW (DRAG & DROP ANYWHERE)
                  </span>
                  <button
                    onClick={onDockKeyboard}
                    className="mt-2 px-3 py-1 bg-violet-600 text-white font-bold rounded-lg text-xs shadow"
                  >
                    Dock Back to Bottom Panel
                  </button>
                </div>
              ) : (
                <KeyboardWorkspace onSimulateMIDI={onSimulateMIDI} />
              )}
            </div>
          )}

          {activeTab === 'split' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="border border-stone-800 rounded-xl overflow-hidden p-1 bg-stone-900">
                {isDAWDetached ? (
                  <div className="p-3 text-center text-stone-500 font-bold">AUDIO DAW DETACHED</div>
                ) : (
                  <CubaseLogicWaveformSequencer />
                )}
              </div>
              <div className="border border-stone-800 rounded-xl overflow-hidden p-1 bg-stone-900">
                {isKeyboardDetached ? (
                  <div className="p-3 text-center text-stone-500 font-bold">KEYBOARD DETACHED</div>
                ) : (
                  <KeyboardWorkspace onSimulateMIDI={onSimulateMIDI} />
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
