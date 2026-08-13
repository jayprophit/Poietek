import React from 'react';
import {
  Play,
  Square,
  Circle,
  Sliders,
  Radio,
  Cpu,
  Layers,
  Activity,
  Music,
  Scissors,
  Share2,
  Wand2,
  Volume2,
  Grid,
  Disc,
  Disc3,
  Flame,
  Zap,
} from 'lucide-react';
import { WorkspaceType, MasterState, ConnectedDevice } from '../types';

interface NavigationProps {
  masterState: MasterState;
  setMasterState: React.Dispatch<React.SetStateAction<MasterState>>;
  connectedDevices: ConnectedDevice[];
  onTriggerPlayStop: () => void;
  onTriggerRecord: () => void;
  onTapTempo: () => void;
  openAIGrooveModal: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  masterState,
  setMasterState,
  connectedDevices,
  onTriggerPlayStop,
  onTriggerRecord,
  onTapTempo,
  openAIGrooveModal,
}) => {
  const activeDevCount = connectedDevices.filter((d) => d.connected).length;
  const measuredLatencies = connectedDevices
    .filter((device) => device.connected && device.latencyMeasurement?.status === 'measured')
    .map((device) => device.latencyMeasurement?.roundTripMs)
    .filter((value): value is number => typeof value === 'number');
  const avgLatency = measuredLatencies.length
    ? `${(measuredLatencies.reduce((sum, value) => sum + value, 0) / measuredLatencies.length).toFixed(1)}ms`
    : 'not measured';

  const navItems: { id: WorkspaceType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'mpc', label: 'Canvas Grid', icon: Grid },
    { id: 'sp404', label: 'Grain Deck', icon: Flame },
    { id: 'keyboard', label: 'Keyboard', icon: Music },
    { id: 'edrum', label: 'E-Drum Kit', icon: Disc },
    { id: 'dj', label: 'DJ Decks', icon: Disc3 },
    { id: 'mixer', label: 'Studio Mixer', icon: Sliders },
    { id: 'patchbay', label: 'Audio Patch Bay', icon: Radio },
    { id: 'drum_machines', label: 'Drum Machines', icon: Zap },
    { id: 'mapper', label: 'Universal Mapper', icon: Cpu },
    { id: 'visual_editor', label: 'Visual Editor', icon: Layers },
    { id: 'midi_matrix', label: 'MIDI Matrix', icon: Share2 },
    { id: 'chop_lab', label: 'Chop Lab', icon: Scissors },
    { id: 'health_latency', label: 'Health & Latency', icon: Activity },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 px-4 py-2.5 shadow-lg select-none">
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-600 to-amber-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              Universal Studio Station
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Hardware Platform
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Universal Hardware Mapping & Instrument Control Platform
            </p>
          </div>
        </div>

        {/* Universal Transport & BPM Clock */}
        <div className="flex items-center gap-3 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
          {/* BPM & Tap Tempo */}
          <div className="flex items-center gap-2 pr-3 border-r border-slate-800">
            <div className="text-center">
              <span className="text-[10px] text-slate-400 font-mono block leading-none uppercase">BPM</span>
              <input
                type="number"
                min="40"
                max="240"
                value={masterState.bpm}
                onChange={(e) =>
                  setMasterState((prev) => ({ ...prev, bpm: Math.max(40, Math.min(240, Number(e.target.value))) }))
                }
                className="w-12 text-center text-sm font-bold bg-transparent text-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-500 rounded"
              />
            </div>
            <button
              onClick={onTapTempo}
              className="px-2 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 rounded transition"
            >
              TAP
            </button>
          </div>

          {/* Transport Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onTriggerPlayStop}
              className={`p-2 rounded-lg transition flex items-center justify-center ${
                masterState.isPlaying
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title={masterState.isPlaying ? 'Stop Playback' : 'Start Playback'}
            >
              {masterState.isPlaying ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>

            <button
              onClick={onTriggerRecord}
              className={`p-2 rounded-lg transition flex items-center justify-center ${
                masterState.isRecording
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/40 animate-pulse'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
              title="Toggle Record"
            >
              <Circle className="w-4 h-4 fill-current" />
            </button>

            <button
              onClick={() =>
                setMasterState((prev) => ({ ...prev, metronome: !prev.metronome }))
              }
              className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md border transition ${
                masterState.metronome
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-500 border-slate-700 hover:text-slate-300'
              }`}
            >
              METRO
            </button>
          </div>

          {/* Master Volume */}
          <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
            <Volume2 className="w-4 h-4 text-slate-400" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={masterState.masterVolume}
              onChange={(e) =>
                setMasterState((prev) => ({ ...prev, masterVolume: Number(e.target.value) }))
              }
              className="w-20 accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>
        </div>

          {/* Hardware status and previewable assistant button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800/80 text-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-semibold text-slate-300">
              {activeDevCount} Device{activeDevCount !== 1 ? 's' : ''} Connected
            </span>
            <span className="text-slate-500 font-mono">({avgLatency})</span>
          </div>

          <button
            onClick={openAIGrooveModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/20 active:scale-95 transition"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>AI Groove</span>
          </button>
        </div>
      </div>

      {/* Workspace Navigation Bar */}
      <nav className="flex items-center gap-1 overflow-x-auto mt-3 pt-2 border-t border-slate-800/60 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = masterState.activeWorkspace === item.id;
          return (
            <button
              key={item.id}
              onClick={() =>
                setMasterState((prev) => ({ ...prev, activeWorkspace: item.id }))
              }
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};
