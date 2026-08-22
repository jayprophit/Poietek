import React, { useRef, useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Plus,
  Trash2,
  Copy,
  FolderPlus,
  Move,
  GripVertical,
  Maximize2,
  ExternalLink,
  RefreshCw,
  FolderMinus,
  Undo2,
  Redo2,
  RotateCcw,
} from 'lucide-react';
import { RackModuleItem, WorkspaceType, ModuleType, MasterState, SamplePad, TrackChannel } from '../../types';
import { StudioRackDevice } from './StudioRackDevice';
import { CombinatorFolderDevice } from './CombinatorFolderDevice';

import { CanvasDrumGridWorkspace } from '../workspaces/CanvasDrumGridWorkspace';
import { GrainDeckWorkspace } from '../workspaces/GrainDeckWorkspace';
import { KeyboardWorkspace } from '../workspaces/KeyboardWorkspace';
import { EDrumWorkspace } from '../workspaces/EDrumWorkspace';
import { DJWorkspace } from '../workspaces/DJWorkspace';
import { MixerWorkspace } from '../workspaces/MixerWorkspace';
import { PatchBayWorkspace } from '../workspaces/PatchBayWorkspace';
import { BuiltInDrumMachines } from '../workspaces/BuiltInDrumMachines';
import { UniversalHardwareMapper } from '../mapper/UniversalHardwareMapper';
import { VisualDeviceEditor } from '../mapper/VisualDeviceEditor';
import { MIDIRoutingMatrix } from '../routing/MIDIRoutingMatrix';
import { ChopLab } from '../sampler/ChopLab';
import { DeviceHealthModal } from '../system/DeviceHealthModal';

import { CircleOfFifthsWheel } from '../daw/CircleOfFifthsWheel';
import { VocalContourEditor } from '../daw/VocalContourEditor';
import { HumanPulseGroovePool } from '../daw/HumanPulseGroovePool';
import { PianoRollSequencer } from '../daw/PianoRollSequencer';
import { HorizonWaveformSequencer } from '../daw/HorizonWaveformSequencer';
import { BeatLoomChannelRack } from '../daw/BeatLoomChannelRack';
import { ViewportNavigator } from '../shared/ViewportNavigator';
import {
  createRackModuleItem,
  isRackModuleType,
  POIETEK_RACK_DRAG_TYPE,
} from './rackModuleCatalog';

interface RackStackManagerProps {
  rackModules: RackModuleItem[];
  setRackModules: React.Dispatch<React.SetStateAction<RackModuleItem[]>>;
  masterState: MasterState;
  setMasterState: React.Dispatch<React.SetStateAction<MasterState>>;
  pads: SamplePad[];
  setPads: React.Dispatch<React.SetStateAction<SamplePad[]>>;
  channels: TrackChannel[];
  setChannels: React.Dispatch<React.SetStateAction<TrackChannel[]>>;
  connectedDevices: any[];
  handleSimulateMIDI: () => void;
  onDetachWorkspace: (ws: WorkspaceType) => void;
  onToggleFlip: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  zoom: number;
  onZoomChange(zoom: number): void;
  autoFit: boolean;
  onAutoFitChange(autoFit: boolean): void;
}

export const RackStackManager: React.FC<RackStackManagerProps> = ({
  rackModules,
  setRackModules,
  masterState,
  setMasterState,
  pads,
  setPads,
  channels,
  setChannels,
  connectedDevices,
  handleSimulateMIDI,
  onDetachWorkspace,
  onToggleFlip,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  zoom,
  onZoomChange,
  autoFit,
  onAutoFitChange,
}) => {
  const [isAddMenuOpen, setIsAddMenuOpen] = useState<boolean>(false);
  const [isLibraryDragOver, setIsLibraryDragOver] = useState<boolean>(false);
  const dragDepth = useRef(0);

  // Helper functions for stack management
  const handleMoveModule = (id: string, direction: 'up' | 'down') => {
    setRackModules((prev) => {
      const idx = prev.findIndex((m) => m.id === id);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;

      const updated = [...prev];
      const [item] = updated.splice(idx, 1);
      updated.splice(targetIdx, 0, item);
      return updated;
    });
  };

  const handleDuplicateModule = (mod: RackModuleItem) => {
    const newMod: RackModuleItem = {
      ...mod,
      id: `mod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: `${mod.title} (Copy)`,
    };
    setRackModules((prev) => [...prev, newMod]);
  };

  const handleDeleteModule = (id: string) => {
    setRackModules((prev) => prev.filter((m) => m.id !== id && m.groupId !== id));
  };

  const handleToggleFoldModule = (id: string) => {
    setRackModules((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isFolded: !m.isFolded } : m))
    );
  };

  const handleAddModule = (type: ModuleType, targetFolderId?: string) => {
    const newModule = createRackModuleItem(type, targetFolderId);

    setRackModules((prev) => {
      if (targetFolderId) {
        // Attach to folder
        return prev.map((m) =>
          m.id === targetFolderId
            ? { ...m, subModuleIds: [...(m.subModuleIds || []), newModule.id] }
            : m
        ).concat(newModule);
      }
      return [...prev, newModule];
    });
  };

  const handleUpdateFolderParams = (folderId: string, params: Partial<RackModuleItem['macroParams']>) => {
    setRackModules((prev) =>
      prev.map((m) =>
        m.id === folderId
          ? {
              ...m,
              macroParams: {
                filterCutoff: 100,
                drive: 10,
                reverbDepth: 25,
                delayLevel: 15,
                masterVol: 85,
                ...m.macroParams,
                ...params,
              },
            }
          : m
      )
    );
  };

  const handleUpdateFolderTitle = (folderId: string, newTitle: string) => {
    setRackModules((prev) =>
      prev.map((m) => (m.id === folderId ? { ...m, title: newTitle } : m))
    );
  };

  // Render individual Workspace module body
  const renderModuleContent = (type: ModuleType) => {
    switch (type) {
      case 'mpc':
        return <CanvasDrumGridWorkspace pads={pads} setPads={setPads} bpm={masterState.bpm} isPlaying={masterState.isPlaying} onSimulateMIDI={handleSimulateMIDI} />;
      case 'sp404':
        return <GrainDeckWorkspace pads={pads} setPads={setPads} onSimulateMIDI={handleSimulateMIDI} />;
      case 'keyboard':
        return <KeyboardWorkspace onSimulateMIDI={handleSimulateMIDI} />;
      case 'edrum':
        return <EDrumWorkspace onSimulateMIDI={handleSimulateMIDI} />;
      case 'dj':
        return <DJWorkspace />;
      case 'mixer':
        return <MixerWorkspace channels={channels} setChannels={setChannels} />;
      case 'patchbay':
        return <PatchBayWorkspace />;
      case 'drum_machines':
        return <BuiltInDrumMachines />;
      case 'mapper':
        return <UniversalHardwareMapper connectedDevices={connectedDevices} onSimulateMIDI={handleSimulateMIDI} />;
      case 'visual_editor':
        return <VisualDeviceEditor />;
      case 'midi_matrix':
        return <MIDIRoutingMatrix />;
      case 'chop_lab':
        return <ChopLab pads={pads} setPads={setPads} />;
      case 'health_latency':
        return <DeviceHealthModal connectedDevices={connectedDevices} />;
      case 'circle_fifths':
        return <CircleOfFifthsWheel />;
      case 'melodyne_pitch':
        return <VocalContourEditor />;
      case 'd_groove':
        return <HumanPulseGroovePool />;
      case 'piano_roll':
        return <PianoRollSequencer />;
      case 'wave_sequencer':
        return <HorizonWaveformSequencer />;
      case 'fl_channel_rack':
        return <BeatLoomChannelRack />;
      default:
        return null;
    }
  };

  // Top level modules (not inside a folder)
  const topLevelModules = rackModules.filter((m) => !m.groupId);

  return (
    <ViewportNavigator
      ariaLabel="Studio rack viewport"
      zoom={zoom}
      onZoomChange={onZoomChange}
      minZoom={0.25}
      maxZoom={1.6}
      zoomStep={0.1}
      autoFit={autoFit}
      onAutoFitChange={onAutoFitChange}
      fitContentWidth={760}
      zoomPresets={[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.6]}
      variant="rack"
      contentClassName="min-w-[760px] p-3"
    >
    <div
      className={`relative space-y-4 pb-12 font-mono select-none transition ${isLibraryDragOver ? 'rounded-2xl ring-2 ring-cyan-300 ring-offset-4 ring-offset-slate-950' : ''}`}
      onDragEnter={(event) => {
        if (!Array.from(event.dataTransfer.types).includes(POIETEK_RACK_DRAG_TYPE)) return;
        event.preventDefault();
        dragDepth.current += 1;
        setIsLibraryDragOver(true);
      }}
      onDragOver={(event) => {
        if (!Array.from(event.dataTransfer.types).includes(POIETEK_RACK_DRAG_TYPE)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
      }}
      onDragLeave={(event) => {
        if (!Array.from(event.dataTransfer.types).includes(POIETEK_RACK_DRAG_TYPE)) return;
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (dragDepth.current === 0) setIsLibraryDragOver(false);
      }}
      onDrop={(event) => {
        const type = event.dataTransfer.getData(POIETEK_RACK_DRAG_TYPE);
        if (!isRackModuleType(type)) return;
        event.preventDefault();
        dragDepth.current = 0;
        setIsLibraryDragOver(false);
        handleAddModule(type);
      }}
    >
      {isLibraryDragOver && (
        <div className="pointer-events-none sticky top-2 z-[80] mx-auto flex w-fit items-center gap-2 rounded-full border border-cyan-300 bg-slate-950/95 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-cyan-200 shadow-2xl" aria-live="polite">
          <Plus className="h-4 w-4" /> Drop to add device to rack
        </div>
      )}
      {/* Top Rack Stack Manager Header Controls */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-2.5 px-4 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
            STUDIO RACK STACK
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-bold border border-amber-500/20">
            {rackModules.length} {rackModules.length === 1 ? 'UNIT' : 'UNITS'} ACTIVE
          </span>
          <label className="hidden items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-[9px] text-slate-400 md:flex">
            <span>JUMP</span>
            <select
              defaultValue=""
              aria-label="Jump to rack unit"
              onChange={(event) => {
                const id = event.target.value;
                if (id) document.getElementById(`rack-module-${id}`)?.scrollIntoView({behavior: 'smooth', block: 'start'});
                event.currentTarget.value = '';
              }}
              className="max-w-44 bg-slate-950 text-[10px] font-bold text-slate-200 outline-none"
            >
              <option value="" disabled>Choose unit…</option>
              {topLevelModules.map((module) => <option key={module.id} value={module.id}>{module.title}</option>)}
            </select>
          </label>
        </div>

        {/* Undo / Redo & Clear Stack Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border-r border-neutral-800 pr-2">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`px-3 py-1 rounded-lg text-xs font-black flex items-center gap-1.5 transition border ${
                canUndo
                  ? 'bg-neutral-800 hover:bg-neutral-700 text-stone-200 border-amber-500/40 hover:text-amber-400 shadow'
                  : 'bg-neutral-950 text-neutral-600 border-neutral-800 cursor-not-allowed opacity-40'
              }`}
              title="Undo last rack change (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5 text-amber-400" />
              <span>UNDO</span>
            </button>

            <button
              onClick={onRedo}
              disabled={!canRedo}
              className={`px-3 py-1 rounded-lg text-xs font-black flex items-center gap-1.5 transition border ${
                canRedo
                  ? 'bg-neutral-800 hover:bg-neutral-700 text-stone-200 border-amber-500/40 hover:text-amber-400 shadow'
                  : 'bg-neutral-950 text-neutral-600 border-neutral-800 cursor-not-allowed opacity-40'
              }`}
              title="Redo rack change (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5 text-amber-400" />
              <span>REDO</span>
            </button>
          </div>

          <button
            onClick={() => setRackModules([])}
            disabled={rackModules.length === 0}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 border ${
              rackModules.length > 0
                ? 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border-rose-800/50'
                : 'bg-neutral-950 text-neutral-600 border-neutral-800 cursor-not-allowed opacity-40'
            }`}
            title="Clear all modules from studio rack stack"
          >
            <Trash2 className="w-3 h-3 text-rose-400" />
            <span>CLEAR RACK</span>
          </button>
        </div>
      </div>

      {topLevelModules.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-neutral-800 rounded-3xl bg-neutral-950/80 my-4 space-y-3">
          <h3 className="text-sm font-black text-amber-400 uppercase tracking-widest">
            THE STUDIO RACK CAN CAN HOLD INFINITE STACKED MODULES
          </h3>
          <p className="text-xs text-neutral-400 max-w-md mx-auto font-sans">
            Your studio rack is empty. Add samplers, synthesizers, sequencers, or Combinator Bus Folders below to build your custom modular rig.
          </p>
          <button
            onClick={() => handleAddModule('mpc')}
            className="px-6 py-2.5 rounded-xl bg-amber-500 text-neutral-950 font-black text-xs hover:bg-amber-400 transition shadow-lg shadow-amber-500/20"
          >
            + ADD FIRST MODULE TO RACK
          </button>
        </div>
      ) : (
        topLevelModules.map((mod) => {
          if (mod.type === 'folder_combinator') {
            const subMods = rackModules.filter((m) => m.groupId === mod.id);
            return (
              <CombinatorFolderDevice
                key={mod.id}
                folderModule={mod}
                subModules={subMods}
                onUpdateFolderParams={handleUpdateFolderParams}
                onUpdateTitle={handleUpdateFolderTitle}
                onToggleFoldFolder={handleToggleFoldModule}
                onRemoveFolder={handleDeleteModule}
                onMoveFolder={handleMoveModule}
                onAddModuleToFolder={(folderId, type) => handleAddModule(type, folderId)}
                renderSubModuleComponent={(subMod) => (
                  <StudioRackDevice
                    key={subMod.id}
                    title={subMod.title}
                    tapeLabel={subMod.tapeLabel}
                    subtitle="GROUPED BUS MODULE"
                    onDetach={() => onDetachWorkspace(subMod.type as WorkspaceType)}
                    onToggleFlip={onToggleFlip}
                  >
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-1 mb-2">
                      <div className="flex items-center gap-1.5 text-[10px] text-neutral-400">
                        <button
                          onClick={() => handleMoveModule(subMod.id, 'up')}
                          className="hover:text-white p-0.5"
                          title="Move Up"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleMoveModule(subMod.id, 'down')}
                          className="hover:text-white p-0.5"
                          title="Move Down"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDuplicateModule(subMod)}
                          className="hover:text-amber-400 p-0.5 ml-1"
                          title="Duplicate Module"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleDeleteModule(subMod.id)}
                        className="text-[10px] text-rose-400 hover:text-rose-300 font-bold px-1.5 py-0.5 rounded bg-rose-950/40 border border-rose-800/40"
                      >
                        Remove
                      </button>
                    </div>
                    {renderModuleContent(mod.type)}
                  </StudioRackDevice>
                )}
              />
            );
          }

          return (
              <div key={mod.id} id={`rack-module-${mod.id}`} className="relative scroll-mt-3 group">
              {/* Stack Item Quick Reorder & Controls Strip */}
              <div className="flex items-center justify-between bg-neutral-900 border-x-2 border-t-2 border-neutral-800 rounded-t-xl px-3 py-1 text-[10px]">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-3 h-3 text-neutral-500 cursor-move" />
                  <span className="text-amber-400 font-black uppercase tracking-wider">
                    {mod.title}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-stone-800 text-stone-300 font-bold border border-stone-700">
                    {mod.tapeLabel}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleMoveModule(mod.id, 'up')}
                    className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                    title="Move Module Up in Rack Stack"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleMoveModule(mod.id, 'down')}
                    className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                    title="Move Module Down in Rack Stack"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDuplicateModule(mod)}
                    className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                    title="Duplicate Module"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteModule(mod.id)}
                    className="p-1 rounded bg-neutral-800 hover:bg-rose-900 text-neutral-400 hover:text-rose-300"
                    title="Remove Module from Rack"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <StudioRackDevice
                title={mod.title}
                tapeLabel={mod.tapeLabel}
                subtitle="STACKED VIRTUAL RACK UNIT"
                onDetach={() => onDetachWorkspace(mod.type as WorkspaceType)}
                onToggleFlip={onToggleFlip}
              >
                {renderModuleContent(mod.type)}
              </StudioRackDevice>
            </div>
          );
        })
      )}

      {/* INFINITE RACK ADD MODULE BOTTOM BAR */}
      <div className="relative pt-2">
        <button
          onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
          className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-neutral-950 font-black text-xs tracking-wider shadow-2xl hover:brightness-110 transition flex items-center justify-center gap-2 border-2 border-amber-300"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ ADD ANOTHER MODULE TO INFINITE RACK STACK</span>
        </button>

        {isAddMenuOpen && (
          <div className="absolute left-0 right-0 bottom-full mb-2 bg-neutral-950 border-2 border-neutral-700 rounded-2xl shadow-2xl p-3 z-50 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-stone-700">
            {[
              { type: 'folder_combinator', name: 'Combinator Bus Folder' },
            { type: 'mpc', name: 'Canvas Drum Grid' },
            { type: 'sp404', name: 'Grain Deck Sampler' },
              { type: 'keyboard', name: 'Analog Subtractive Synth' },
              { type: 'edrum', name: 'E-Drum Mesh Kit' },
              { type: 'drum_machines', name: 'Studio Drum Computer' },
              { type: 'wave_sequencer', name: 'Multi-Track Audio Sequencer' },
              { type: 'fl_channel_rack', name: 'Pattern Step Channel Rack' },
            { type: 'melodyne_pitch', name: 'Vocal Contour Editor' },
              { type: 'circle_fifths', name: 'Circle of Fifths Harmony' },
              { type: 'piano_roll', name: 'Universal Piano Roll' },
              { type: 'chop_lab', name: 'Chop Lab Stem Slicer' },
            { type: 'mixer', name: 'Summit Master Console' },
            ].map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  handleAddModule(item.type as ModuleType);
                  setIsAddMenuOpen(false);
                }}
                className="p-2.5 rounded-xl bg-neutral-900 hover:bg-amber-500 hover:text-neutral-950 border border-neutral-800 text-left font-black text-xs transition"
              >
                {item.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
    </ViewportNavigator>
  );
};
