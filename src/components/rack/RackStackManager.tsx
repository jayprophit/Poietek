import React, { useState } from 'react';
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
  ZoomIn,
  ZoomOut,
  Maximize,
} from 'lucide-react';
import { RackModuleItem, WorkspaceType, ModuleType, MasterState, SamplePad, TrackChannel, RackColorTag } from '../../types';
import { StudioRackDevice } from './StudioRackDevice';
import { CombinatorFolderDevice } from './CombinatorFolderDevice';

import { MPCWorkspace } from '../workspaces/MPCWorkspace';
import { SP404Workspace } from '../workspaces/SP404Workspace';
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
import { MelodynePitchEditor } from '../daw/MelodynePitchEditor';
import { DGrooveMixer } from '../daw/DGrooveMixer';
import { PianoRollSequencer } from '../daw/PianoRollSequencer';
import { CubaseLogicWaveformSequencer } from '../daw/CubaseLogicWaveformSequencer';
import { WaveformTimeline } from '../daw/WaveformTimeline';
import { FLStudioChannelRack } from '../daw/FLStudioChannelRack';
import { ReGroovePanel } from './ReGroovePanel';
import {
  SubtractorSynthDevice,
  RV7000ReverbDevice,
  TheEchoDelayDevice,
  Scream4DistortionDevice,
  SidechainDuckerDevice,
  ScalesAndChordsPlayerDevice,
  ThorPolySynthDevice,
  PolytoneSynthDevice,
  MimicSamplerDevice,
  PulverizerDemolitionDevice,
  AudiomaticRetroDevice,
  SpiderCvSplitterDevice,
  LineMixer62Device,
} from './ReasonModules';

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
}) => {
  const [isAddMenuOpen, setIsAddMenuOpen] = useState<boolean>(false);
  const [rackZoom, setRackZoom] = useState<number>(100); // 70% to 130%
  const [isGroupSelectMode, setIsGroupSelectMode] = useState<boolean>(false);
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);

  const handleToggleModuleSelection = (id: string) => {
    setSelectedModuleIds((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
  };

  const handleCreateSmartGroup = () => {
    if (selectedModuleIds.length === 0) return;

    const folderId = `folder_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const folderModule: RackModuleItem = {
      id: folderId,
      type: 'folder_combinator',
      title: `Smart Bus Container (${selectedModuleIds.length} Units)`,
      tapeLabel: 'SMART BUS',
      subModuleIds: [...selectedModuleIds],
      colorTag: 'amber',
      macroParams: {
        filterCutoff: 100,
        drive: 15,
        reverbDepth: 20,
        delayLevel: 10,
        masterVol: 90,
      },
    };

    setRackModules((prev) => {
      const updated = prev.map((m) => {
        if (selectedModuleIds.includes(m.id)) {
          return { ...m, groupId: folderId };
        }
        return m;
      });
      return [folderModule, ...updated];
    });

    setSelectedModuleIds([]);
    setIsGroupSelectMode(false);
  };

  const handleFoldAllModules = () => {
    setRackModules((prev) => prev.map((m) => ({ ...m, isFolded: true })));
  };

  const handleUnfoldAllModules = () => {
    setRackModules((prev) => prev.map((m) => ({ ...m, isFolded: false })));
  };

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

  const handleSetColorTag = (id: string, color: RackColorTag) => {
    setRackModules((prev) =>
      prev.map((m) => (m.id === id ? { ...m, colorTag: color } : m))
    );
  };

  const handleAddModule = (type: ModuleType, targetFolderId?: string) => {
    const newId = `mod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    let title = 'Studio Rack Unit';
    let tapeLabel = 'RACK UNIT';

    switch (type) {
      case 'folder_combinator':
        title = 'Combinator Bus Folder';
        tapeLabel = 'BUS FOLDER';
        break;
      case 'mpc':
        title = 'MPC Studio Drum Pad';
        tapeLabel = 'DRUM SAMPLER';
        break;
      case 'sp404':
        title = 'SP-404 MKII Sampler';
        tapeLabel = 'MFX SAMPLER';
        break;
      case 'keyboard':
        title = 'Analog Subtractive Synth';
        tapeLabel = 'SUBTRACTIVE SYNTH';
        break;
      case 'edrum':
        title = 'E-Drum Mesh Kit';
        tapeLabel = 'MESH DRUMS';
        break;
      case 'dj':
        title = 'DJ Performance Decks';
        tapeLabel = 'DJ CONSOLE';
        break;
      case 'mixer':
        title = 'SSL 9000 Master Mixer';
        tapeLabel = 'MASTER CONSOLE';
        break;
      case 'drum_machines':
        title = 'Studio Drum Computer';
        tapeLabel = 'STEP DRUMS';
        break;
      case 'wave_sequencer':
        title = 'Multi-Track Audio Sequencer';
        tapeLabel = 'AUDIO TIMELINE';
        break;
      case 'fl_channel_rack':
        title = 'Pattern Step Channel Rack';
        tapeLabel = '16-STEP RACK';
        break;
      case 'melodyne_pitch':
        title = 'Pro Vocal Pitch Editor';
        tapeLabel = 'AUTO TUNER';
        break;
      case 'circle_fifths':
        title = 'Circle of Fifths Harmony Wheel';
        tapeLabel = 'HARMONY AI';
        break;
      case 'piano_roll':
        title = 'Universal Piano Roll';
        tapeLabel = 'MIDI GRID';
        break;
      case 'chop_lab':
        title = 'Chop Lab Stem Slicer';
        tapeLabel = 'STEM CHOPPER';
        break;
      case 'subtractor_synth':
        title = 'Subtractor Polyphonic Synth';
        tapeLabel = 'SUBTRACTIVE SYNTH';
        break;
      case 'rv7000_reverb':
        title = 'RV7000 MkII Advanced Reverb';
        tapeLabel = 'CONVOLUTION REVERB';
        break;
      case 'the_echo_delay':
        title = 'The Echo Digital Tape Delay';
        tapeLabel = 'TAPE DELAY';
        break;
      case 'scream4_distortion':
        title = 'Scream 4 Sound Destruction';
        tapeLabel = 'DISTORTION UNIT';
        break;
      case 'sidechain_ducker':
        title = 'Dynamic Sidechain Ducker';
        tapeLabel = 'SIDECHAIN DUCKER';
        break;
      case 'scales_chords':
        title = 'Scales & Chords Player';
        tapeLabel = 'HARMONIC PLAYER';
        break;
      case 'thor_synth':
        title = 'Thor Polysonic Synthesizer';
        tapeLabel = 'THOR SYNTH';
        break;
      case 'polytone_synth':
        title = 'Polytone Dual Synth';
        tapeLabel = 'POLYTONE SYNTH';
        break;
      case 'mimic_sampler':
        title = 'Mimic Creative Sampler';
        tapeLabel = 'MIMIC SAMPLER';
        break;
      case 'pulverizer_comp':
        title = 'Pulverizer Demolition Unit';
        tapeLabel = 'PULVERIZER COMP';
        break;
      case 'audiomatic_retro':
        title = 'Audiomatic Retro Unit';
        tapeLabel = 'RETRO TRANSFORMER';
        break;
      case 'spider_cv_splitter':
        title = 'Spider Audio & CV Merger/Splitter';
        tapeLabel = 'SPIDER SPLITTER';
        break;
      case 'line_mixer_6_2':
        title = 'Line Mixer 6:2';
        tapeLabel = 'LINE MIXER 6:2';
        break;
      default:
        title = 'Studio Module';
    }

    const newModule: RackModuleItem = {
      id: newId,
      type,
      title,
      tapeLabel,
      groupId: targetFolderId,
      isFolded: false,
      colorTag: 'amber',
    };

    setRackModules((prev) => {
      if (targetFolderId) {
        return prev.map((m) =>
          m.id === targetFolderId
            ? { ...m, subModuleIds: [...(m.subModuleIds || []), newId] }
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
        return <MPCWorkspace pads={pads} setPads={setPads} bpm={masterState.bpm} isPlaying={masterState.isPlaying} onSimulateMIDI={handleSimulateMIDI} />;
      case 'sp404':
        return <SP404Workspace pads={pads} setPads={setPads} onSimulateMIDI={handleSimulateMIDI} />;
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
        return <MelodynePitchEditor />;
      case 'd_groove':
        return <DGrooveMixer />;
      case 'piano_roll':
        return <PianoRollSequencer />;
      case 'wave_sequencer':
        return <WaveformTimeline bpm={masterState.bpm} />;
      case 'fl_channel_rack':
        return <FLStudioChannelRack />;
      case 'subtractor_synth':
        return <SubtractorSynthDevice />;
      case 'rv7000_reverb':
        return <RV7000ReverbDevice />;
      case 'the_echo_delay':
        return <TheEchoDelayDevice />;
      case 'scream4_distortion':
        return <Scream4DistortionDevice />;
      case 'sidechain_ducker':
        return <SidechainDuckerDevice />;
      case 'scales_chords':
        return <ScalesAndChordsPlayerDevice />;
      case 'thor_synth':
        return <ThorPolySynthDevice />;
      case 'polytone_synth':
        return <PolytoneSynthDevice />;
      case 'mimic_sampler':
        return <MimicSamplerDevice />;
      case 'pulverizer_comp':
        return <PulverizerDemolitionDevice />;
      case 'audiomatic_retro':
        return <AudiomaticRetroDevice />;
      case 'spider_cv_splitter':
        return <SpiderCvSplitterDevice />;
      case 'line_mixer_6_2':
        return <LineMixer62Device />;
      default:
        return null;
    }
  };

  // Top level modules (not inside a folder)
  const topLevelModules = rackModules.filter((m) => !m.groupId);

  return (
    <div className="space-y-4 font-mono select-none pb-12">
      {/* Top Rack Stack Manager Header Controls */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-2.5 px-4 flex items-center justify-between shadow-xl flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
            STUDIO RACK STACK
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-bold border border-amber-500/20">
            {rackModules.length} {rackModules.length === 1 ? 'UNIT' : 'UNITS'} ACTIVE
          </span>
        </div>

        {/* Rack Cascading Fold / Expand All & Zoom Slider Control */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setIsGroupSelectMode(!isGroupSelectMode);
              if (isGroupSelectMode) setSelectedModuleIds([]);
            }}
            className={`px-3 py-1 rounded-xl font-black text-xs transition flex items-center gap-1.5 border ${
              isGroupSelectMode
                ? 'bg-amber-500 text-neutral-950 border-amber-300 shadow-md'
                : 'bg-neutral-800 text-amber-400 hover:bg-neutral-700 border-neutral-700'
            }`}
            title="Select multiple rack modules to group into a Combinator container"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>{isGroupSelectMode ? 'EXIT GROUP SELECT' : 'SMART GROUP'}</span>
          </button>

          <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs">
            <button
              onClick={handleFoldAllModules}
              className="px-2.5 py-1 rounded bg-stone-800 hover:bg-amber-500 hover:text-black text-amber-400 font-black text-[10px] flex items-center gap-1 transition"
              title="Collapse all modules into compact 1U bars"
            >
              <ChevronUp className="w-3 h-3" />
              <span>FOLD ALL</span>
            </button>
            <button
              onClick={handleUnfoldAllModules}
              className="px-2.5 py-1 rounded bg-stone-800 hover:bg-amber-500 hover:text-black text-amber-400 font-black text-[10px] flex items-center gap-1 transition"
              title="Expand all modules to full faceplates"
            >
              <ChevronDown className="w-3 h-3" />
              <span>EXPAND ALL</span>
            </button>
          </div>

          <div className="flex items-center gap-2 bg-neutral-950 px-3 py-1 rounded-xl border border-neutral-800 text-xs">
            <ZoomOut className="w-3.5 h-3.5 text-neutral-400" />
            <span className="text-[10px] text-neutral-400 font-bold hidden sm:inline">ZOOM</span>
            <input
              type="range"
              min="70"
              max="130"
              value={rackZoom}
              onChange={(e) => setRackZoom(Number(e.target.value))}
              className="w-20 sm:w-28 accent-amber-500 cursor-pointer"
            />
            <ZoomIn className="w-3.5 h-3.5 text-neutral-400" />
            <span className="text-[10px] text-amber-400 font-bold w-8">{rackZoom}%</span>
          </div>
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

      {/* Smart Group Selection Active Floating Bar */}
      {isGroupSelectMode && (
        <div className="bg-amber-500 text-neutral-950 p-3 rounded-2xl shadow-2xl flex items-center justify-between font-mono animate-in slide-in-from-top-2 border-2 border-amber-300">
          <div className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5 stroke-[2.5]" />
            <div>
              <span className="text-xs font-black uppercase tracking-wider block">
                SMART GROUP MULTI-SELECT ACTIVE
              </span>
              <span className="text-[10px] font-bold opacity-90">
                {selectedModuleIds.length} {selectedModuleIds.length === 1 ? 'module' : 'modules'} selected to nest into container
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateSmartGroup}
              disabled={selectedModuleIds.length === 0}
              className={`px-4 py-2 rounded-xl text-xs font-black transition border ${
                selectedModuleIds.length > 0
                  ? 'bg-neutral-950 text-amber-400 hover:bg-neutral-900 border-amber-400 shadow-lg cursor-pointer'
                  : 'bg-neutral-950/40 text-neutral-700 border-neutral-800 cursor-not-allowed'
              }`}
            >
              CREATE COMBINATOR CONTAINER ({selectedModuleIds.length})
            </button>
            <button
              onClick={() => {
                setIsGroupSelectMode(false);
                setSelectedModuleIds([]);
              }}
              className="px-3 py-2 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 text-xs font-bold"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}

      {/* Main Scaled Rack Container */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
        }}
        onDrop={(e) => {
          e.preventDefault();
          const moduleType = e.dataTransfer.getData('moduleType') || e.dataTransfer.getData('text/plain');
          if (moduleType) {
            handleAddModule(moduleType as ModuleType);
          }
        }}
        style={{
          transform: `scale(${rackZoom / 100})`,
          transformOrigin: 'top center',
          transition: 'transform 0.15s ease-out',
        }}
        className="space-y-4 min-h-[160px] p-2 border-2 border-dashed border-transparent hover:border-amber-500/30 rounded-3xl transition"
      >
        {topLevelModules.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-neutral-800 rounded-3xl bg-neutral-950/80 my-4 space-y-3">
            <h3 className="text-sm font-black text-amber-400 uppercase tracking-widest">
              THE STUDIO RACK STACK CAN HOLD INFINITE UNITS
            </h3>
            <p className="text-xs text-neutral-400 max-w-md mx-auto font-sans">
              Your studio rack is empty. Select samplers, synthesizers, sequencers, or Combinator Bus Folders from the left DAW Browser or click below to build your rig.
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
                      colorTag={subMod.colorTag || 'amber'}
                      isFolded={subMod.isFolded}
                      onToggleFold={() => handleToggleFoldModule(subMod.id)}
                      onSetColorTag={(c) => handleSetColorTag(subMod.id, c)}
                      onDetach={() => onDetachWorkspace(subMod.type as WorkspaceType)}
                      onToggleFlip={onToggleFlip}
                      onDelete={() => handleDeleteModule(subMod.id)}
                      onDuplicate={() => handleDuplicateModule(subMod)}
                    >
                      {renderModuleContent(subMod.type)}
                    </StudioRackDevice>
                  )}
                />
              );
            }

            const isSelected = selectedModuleIds.includes(mod.id);

            return (
              <div key={mod.id} className="relative group">
                {isGroupSelectMode && (
                  <div
                    onClick={() => handleToggleModuleSelection(mod.id)}
                    className={`absolute left-0 top-0 bottom-0 w-12 z-30 flex items-center justify-center cursor-pointer transition rounded-l-xl border-r ${
                      isSelected
                        ? 'bg-amber-500 text-neutral-950 border-amber-400 font-black'
                        : 'bg-neutral-950/90 text-neutral-500 hover:text-amber-400 border-neutral-800'
                    }`}
                    title="Click to select module for Smart Group container"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="w-4 h-4 accent-neutral-950 cursor-pointer"
                    />
                  </div>
                )}

                <div className={isGroupSelectMode ? 'pl-12' : ''}>
                  <StudioRackDevice
                    title={mod.title}
                    tapeLabel={mod.tapeLabel}
                    subtitle="STACKED VIRTUAL RACK UNIT"
                    colorTag={mod.colorTag || 'amber'}
                    isFolded={mod.isFolded}
                    onToggleFold={() => handleToggleFoldModule(mod.id)}
                    onSetColorTag={(c) => handleSetColorTag(mod.id, c)}
                    onDetach={() => onDetachWorkspace(mod.type as WorkspaceType)}
                    onToggleFlip={onToggleFlip}
                    onDelete={() => handleDeleteModule(mod.id)}
                    onDuplicate={() => handleDuplicateModule(mod)}
                  >
                    {renderModuleContent(mod.type)}
                  </StudioRackDevice>
                </div>
              </div>
            );
          })
        )}
      </div>

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
              { type: 'subtractor_synth', name: 'Subtractor Polyphonic Synth' },
              { type: 'rv7000_reverb', name: 'RV7000 MkII Reverb FX' },
              { type: 'the_echo_delay', name: 'The Echo Tape Delay FX' },
              { type: 'scream4_distortion', name: 'Scream 4 Distortion FX' },
              { type: 'sidechain_ducker', name: 'Dynamic Sidechain Ducker' },
              { type: 'scales_chords', name: 'Scales & Chords Player' },
              { type: 'mpc', name: 'MPC Studio Drum Pad' },
              { type: 'sp404', name: 'SP-404 MKII Sampler' },
              { type: 'keyboard', name: 'Analog Subtractive Synth' },
              { type: 'edrum', name: 'E-Drum Mesh Kit' },
              { type: 'drum_machines', name: 'Studio Drum Computer' },
              { type: 'wave_sequencer', name: 'Multi-Track Audio Sequencer' },
              { type: 'fl_channel_rack', name: 'Pattern Step Channel Rack' },
              { type: 'melodyne_pitch', name: 'Pro Vocal Pitch Editor' },
              { type: 'circle_fifths', name: 'Circle of Fifths Harmony' },
              { type: 'piano_roll', name: 'Universal Piano Roll' },
              { type: 'chop_lab', name: 'Chop Lab Stem Slicer' },
              { type: 'mixer', name: 'SSL 9000 Master Mixer' },
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

      {/* REGROOVE GLOBAL TIMING & SHUFFLE POOL PANEL */}
      <ReGroovePanel currentBpm={masterState.bpm} />
    </div>
  );
};
