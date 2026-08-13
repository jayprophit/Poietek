import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Minus,
  Maximize2,
  Minimize2,
  Move,
  Grid,
  Flame,
  Music,
  Disc,
  Disc3,
  Sliders,
  Radio,
  Zap,
  Cpu,
  Layers,
  Share2,
  Scissors,
  Activity,
  Compass,
  Tv,
  ExternalLink,
} from 'lucide-react';
import { WorkspaceType, MasterState, ConnectedDevice, TrackChannel } from '../../types';
import { ReasonSSLConsole } from '../rack/ReasonSSLConsole';

import { MPCWorkspace } from '../workspaces/MPCWorkspace';
import { SP404Workspace } from '../workspaces/SP404Workspace';
import { KeyboardWorkspace } from '../workspaces/KeyboardWorkspace';
import { EDrumWorkspace } from '../workspaces/EDrumWorkspace';
import { DJWorkspace } from '../workspaces/DJWorkspace';
import { BuiltInDrumMachines } from '../workspaces/BuiltInDrumMachines';
import { UniversalHardwareMapper } from '../mapper/UniversalHardwareMapper';
import { VisualDeviceEditor } from '../mapper/VisualDeviceEditor';
import { MIDIRoutingMatrix } from '../routing/MIDIRoutingMatrix';
import { ChopLab } from '../sampler/ChopLab';
import { DeviceHealthModal } from '../system/DeviceHealthModal';

import { MixerWorkspace } from '../workspaces/MixerWorkspace';
import { StudioRearPanel } from '../rack/StudioRearPanel';
import { CircleOfFifthsWheel } from './CircleOfFifthsWheel';
import { MelodynePitchEditor } from './MelodynePitchEditor';
import { DGrooveMixer } from './DGrooveMixer';
import { PianoRollSequencer } from './PianoRollSequencer';
import { CubaseLogicWaveformSequencer } from './CubaseLogicWaveformSequencer';
import { FLStudioChannelRack } from './FLStudioChannelRack';

interface FloatingWindow {
  id: WorkspaceType;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
}

interface FloatingWindowManagerProps {
  detachedWorkspaces: WorkspaceType[];
  onDockWorkspace: (ws: WorkspaceType) => void;
  masterState: MasterState;
  setMasterState: React.Dispatch<React.SetStateAction<MasterState>>;
  connectedDevices: ConnectedDevice[];
  openAIGrooveModal: () => void;
  channels?: TrackChannel[];
  setChannels?: React.Dispatch<React.SetStateAction<TrackChannel[]>>;
}

export const FloatingWindowManager: React.FC<FloatingWindowManagerProps> = ({
  detachedWorkspaces,
  onDockWorkspace,
  masterState,
  setMasterState,
  connectedDevices,
  openAIGrooveModal,
  channels = [],
  setChannels = () => {},
}) => {
  const [windows, setWindows] = useState<Record<string, FloatingWindow>>({});
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [topZIndex, setTopZIndex] = useState<number>(100);

  // Initialize new floating windows when added to detachedWorkspaces
  useEffect(() => {
    setWindows((prev) => {
      const updated = { ...prev };
      detachedWorkspaces.forEach((ws, idx) => {
        if (!updated[ws]) {
          const offsetX = 60 + (idx % 4) * 40;
          const offsetY = 60 + (idx % 4) * 40;
          updated[ws] = {
            id: ws,
            title: getWorkspaceTitle(ws),
            x: offsetX,
            y: offsetY,
            width: Math.min(850, window.innerWidth - 80),
            height: Math.min(520, window.innerHeight - 120),
            isMinimized: false,
            isMaximized: false,
            zIndex: topZIndex + idx + 1,
          };
        }
      });
      // Remove windows that are no longer in detachedWorkspaces
      Object.keys(updated).forEach((key) => {
        if (!detachedWorkspaces.includes(key as WorkspaceType)) {
          delete updated[key];
        }
      });
      return updated;
    });
    setTopZIndex((z) => z + detachedWorkspaces.length + 1);
  }, [detachedWorkspaces]);

  const bringToFront = (ws: WorkspaceType) => {
    setActiveWindowId(ws);
    const nextZ = topZIndex + 1;
    setTopZIndex(nextZ);

    setWindows((prev) => {
      const existing = prev[ws] || {
        id: ws,
        title: getWorkspaceTitle(ws),
        x: 80,
        y: 80,
        width: Math.min(850, window.innerWidth - 80),
        height: Math.min(520, window.innerHeight - 120),
        isMinimized: false,
        isMaximized: false,
        zIndex: nextZ,
      };

      return {
        ...prev,
        [ws]: {
          ...existing,
          isMinimized: false,
          zIndex: nextZ,
        },
      };
    });
  };

  const toggleMinimize = (ws: WorkspaceType) => {
    setWindows((prev) => {
      if (!prev[ws]) return prev;
      return {
        ...prev,
        [ws]: {
          ...prev[ws],
          isMinimized: !prev[ws].isMinimized,
        },
      };
    });
  };

  const toggleMaximize = (ws: WorkspaceType) => {
    setWindows((prev) => {
      if (!prev[ws]) return prev;
      return {
        ...prev,
        [ws]: {
          ...prev[ws],
          isMaximized: !prev[ws].isMaximized,
        },
      };
    });
  };

  // Dragging logic
  const handleDragStart = (e: React.MouseEvent, ws: WorkspaceType) => {
    e.preventDefault();
    bringToFront(ws);

    const win = windows[ws];
    if (!win || win.isMaximized) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = win.x;
    const initialY = win.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      setWindows((prev) => {
        if (!prev[ws]) return prev;
        return {
          ...prev,
          [ws]: {
            ...prev[ws],
            x: Math.max(0, Math.min(window.innerWidth - 100, initialX + deltaX)),
            y: Math.max(0, Math.min(window.innerHeight - 100, initialY + deltaY)),
          },
        };
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  function getWorkspaceTitle(ws: WorkspaceType): string {
    switch (ws) {
      case 'mpc': return 'MPC Studio Drum Pad';
      case 'sp404': return 'SP-404 MKII Sampler';
      case 'keyboard': return 'Analog Subtractive Synth';
      case 'edrum': return 'E-Drum Mesh Trigger Kit';
      case 'dj': return 'DJ Performance Decks';
      case 'mixer': return 'SSL 9000 Pro Master Console';
      case 'patchbay': return 'Audio & CV Hardware Patch Bay';
      case 'drum_machines': return 'Studio Drum Computer';
      case 'mapper': return 'Universal Hardware Mapper';
      case 'visual_editor': return 'DIY Visual Controller Builder';
      case 'midi_matrix': return 'MIDI Signal Matrix';
      case 'chop_lab': return 'Chop Lab Stem Slicer';
      case 'health_latency': return 'System Health & Latency';
      case 'circle_fifths': return 'Circle of Fifths Harmony';
      case 'melodyne_pitch': return 'Pro Vocal Pitch Editor';
      case 'd_groove': return 'D-Groove Shuffle Pool';
      case 'piano_roll': return 'Universal Piano Roll';
      case 'wave_sequencer': return 'Multi-Track Audio Sequencer';
      case 'fl_channel_rack': return 'Pattern Step Channel Rack';
      default: return 'Detached Module';
    }
  }

  const renderWorkspaceComponent = (ws: WorkspaceType) => {
    switch (ws) {
      case 'mpc': return <MPCWorkspace pads={[]} setPads={() => {}} bpm={masterState.bpm} isPlaying={masterState.isPlaying} onSimulateMIDI={() => {}} />;
      case 'sp404': return <SP404Workspace pads={[]} setPads={() => {}} onSimulateMIDI={() => {}} />;
      case 'keyboard': return <KeyboardWorkspace onSimulateMIDI={() => {}} />;
      case 'edrum': return <EDrumWorkspace onSimulateMIDI={() => {}} />;
      case 'dj': return <DJWorkspace />;
      case 'mixer': return <ReasonSSLConsole channels={channels} setChannels={setChannels} isDetached={true} onDock={() => onDockWorkspace('mixer')} />;
      case 'patchbay': return <StudioRearPanel masterState={masterState} onToggleFlip={() => {}} />;
      case 'drum_machines': return <BuiltInDrumMachines />;
      case 'mapper': return <UniversalHardwareMapper connectedDevices={connectedDevices} onSimulateMIDI={() => {}} />;
      case 'visual_editor': return <VisualDeviceEditor />;
      case 'midi_matrix': return <MIDIRoutingMatrix />;
      case 'chop_lab': return <ChopLab pads={[]} setPads={() => {}} />;
      case 'health_latency': return <DeviceHealthModal connectedDevices={connectedDevices} />;
      case 'circle_fifths': return <CircleOfFifthsWheel />;
      case 'melodyne_pitch': return <MelodynePitchEditor />;
      case 'd_groove': return <DGrooveMixer />;
      case 'piano_roll': return <PianoRollSequencer />;
      case 'wave_sequencer': return <CubaseLogicWaveformSequencer />;
      case 'fl_channel_rack': return <FLStudioChannelRack />;
      default: return null;
    }
  };

  if (detachedWorkspaces.length === 0) return null;

  return (
    <>
      {/* Floating Windows Render Layer */}
      {detachedWorkspaces.map((ws) => {
        const win = windows[ws];
        if (!win || win.isMinimized) return null;

        const style: React.CSSProperties = win.isMaximized
          ? {
              position: 'fixed',
              top: '40px',
              left: '0px',
              right: '0px',
              bottom: '36px',
              zIndex: win.zIndex,
            }
          : {
              position: 'fixed',
              top: `${win.y}px`,
              left: `${win.x}px`,
              width: `${win.width}px`,
              height: `${win.height}px`,
              zIndex: win.zIndex,
            };

        return (
          <div
            key={ws}
            style={style}
            onClick={() => bringToFront(ws)}
            className="bg-neutral-950 border-2 border-amber-500/70 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden select-none animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Window Title Bar */}
            <div
              onMouseDown={(e) => handleDragStart(e, ws)}
              className={`px-3 py-2 bg-gradient-to-r ${
                activeWindowId === ws
                  ? 'from-neutral-900 via-amber-950/80 to-neutral-900 border-b border-amber-500/50'
                  : 'from-neutral-900 to-neutral-950 border-b border-neutral-800'
              } flex items-center justify-between cursor-move select-none`}
            >
              <div className="flex items-center gap-2">
                <Move className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-mono font-black text-amber-400 uppercase tracking-wider">
                  {win.title}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  FLOATING WINDOW
                </span>
              </div>

              {/* Window Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMinimize(ws);
                  }}
                  className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition"
                  title="Minimize Window"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMaximize(ws);
                  }}
                  className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition"
                  title={win.isMaximized ? 'Restore Window Size' : 'Maximize Window'}
                >
                  {win.isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDockWorkspace(ws);
                  }}
                  className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-400 text-neutral-950 text-[10px] font-black tracking-wider transition flex items-center gap-1"
                  title="Dock back to main Studio Rack"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>DOCK</span>
                </button>
              </div>
            </div>

            {/* Window Body Container */}
            <div className="flex-1 overflow-y-auto bg-stone-900 p-2 scrollbar-thin scrollbar-thumb-stone-700">
              {renderWorkspaceComponent(ws)}
            </div>
          </div>
        );
      })}

      {/* Floating Windows Taskbar Dock at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 h-9 bg-neutral-950/95 border-t border-amber-500/40 px-3 flex items-center justify-between gap-2 z-[999] backdrop-blur-md font-mono text-xs select-none">
        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
          <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest mr-1 flex items-center gap-1 whitespace-nowrap">
            <Tv className="w-3.5 h-3.5 animate-pulse" />
            DETACHED WINDOWS ({detachedWorkspaces.length}):
          </span>

          {detachedWorkspaces.map((ws) => {
            const win = windows[ws];
            const isMin = win?.isMinimized;
            const isActive = activeWindowId === ws && !isMin;

            return (
              <button
                key={ws}
                onClick={() => bringToFront(ws)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition whitespace-nowrap border ${
                  isActive
                    ? 'bg-amber-500 text-neutral-950 border-amber-300 shadow-lg'
                    : isMin
                    ? 'bg-neutral-900 text-amber-400 border-amber-500/50 hover:bg-neutral-800 animate-pulse'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border-neutral-700'
                }`}
                title={isMin ? 'Click to restore minimized window' : 'Bring window to front'}
              >
                <span>{getWorkspaceTitle(ws)}</span>
                {isMin && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/30 text-amber-300 font-mono font-black">
                    MINIMIZED
                  </span>
                )}
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    onDockWorkspace(ws);
                  }}
                  className="p-0.5 rounded hover:bg-neutral-900/50 text-neutral-400 hover:text-white"
                  title="Dock Window"
                >
                  <X className="w-3 h-3" />
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => detachedWorkspaces.forEach(onDockWorkspace)}
          className="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-amber-400 transition whitespace-nowrap"
        >
          Dock All Windows
        </button>
      </div>
    </>
  );
};
