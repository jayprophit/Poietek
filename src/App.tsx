import React, { useState, useEffect, useCallback } from 'react';
import {
  WorkspaceType,
  MasterState,
  ConnectedDevice,
  SamplePad,
  TrackChannel,
} from './types';
import { audioEngine } from './audio/engine';
import { midiManager } from './midi/manager';
import { HardwareInterfaceUnit } from './components/rack/HardwareInterfaceUnit';
import { StudioTransport } from './components/rack/StudioTransport';
import { StudioRearPanel } from './components/rack/StudioRearPanel';
import { StudioRackDevice } from './components/rack/StudioRackDevice';
import { RackRightSidebar } from './components/rack/RackRightSidebar';
import {
  createRackModuleItem,
  getRackModuleDefinition,
  isRackModuleType,
  isWorkspaceModuleType,
} from './components/rack/rackModuleCatalog';
import {insertRackModuleByRole} from './poietek/rack';

import { CanvasDrumGridWorkspace } from './components/workspaces/CanvasDrumGridWorkspace';
import { GrainDeckWorkspace } from './components/workspaces/GrainDeckWorkspace';
import { KeyboardWorkspace } from './components/workspaces/KeyboardWorkspace';
import { EDrumWorkspace } from './components/workspaces/EDrumWorkspace';
import { DJWorkspace } from './components/workspaces/DJWorkspace';
import { MixerWorkspace } from './components/workspaces/MixerWorkspace';
import { PatchBayWorkspace } from './components/workspaces/PatchBayWorkspace';
import { BuiltInDrumMachines } from './components/workspaces/BuiltInDrumMachines';
import { UniversalHardwareMapper } from './components/mapper/UniversalHardwareMapper';
import { VisualDeviceEditor } from './components/mapper/VisualDeviceEditor';
import { MIDIRoutingMatrix } from './components/routing/MIDIRoutingMatrix';
import { ChopLab } from './components/sampler/ChopLab';
import { DeviceHealthModal } from './components/system/DeviceHealthModal';
import { GenerativeGrooveModal } from './components/ai/GenerativeGrooveModal';

import { CircleOfFifthsWheel } from './components/daw/CircleOfFifthsWheel';
import { VocalContourEditor } from './components/daw/VocalContourEditor';
import { HumanPulseGroovePool } from './components/daw/HumanPulseGroovePool';
import { PianoRollSequencer } from './components/daw/PianoRollSequencer';
import { DAWBrowserSidebar } from './components/daw/DAWBrowserSidebar';
import { HorizonWaveformSequencer } from './components/daw/HorizonWaveformSequencer';
import { BeatLoomChannelRack } from './components/daw/BeatLoomChannelRack';
import { FloatingWindowManager } from './components/daw/FloatingWindowManager';

import { RackModuleItem, StudioTemplate, ModuleType } from './types';
import { RackStackManager } from './components/rack/RackStackManager';
import { TemplatesModal } from './components/daw/TemplatesModal';
import { GuidedWalkthroughBanner } from './components/daw/GuidedWalkthroughBanner';
import {markStudioCommandAreaReady, subscribeStudioCommands} from './poietek/react/studioCommands';
import {BrowserStudioSettingsRepository, type StudioPreferences} from './poietek/settings';
import {usePoietekRuntime} from './poietek/react/PoietekRuntimeProvider';
import {
  getProjectCompositionWorkflow,
  saveAndApplyProjectMixScene,
  type MixScene,
} from './poietek/composition-workflows';
import type {PoietekProject} from './poietek/domain/types';
import {
  mutateProjectLiveSessionState,
  type LiveSessionMutation,
  mutateProjectPicturePostState,
  type PicturePostMutation,
  mutateProjectSequenceAssemblyState,
  type SequenceAssemblyMutation,
  mutateProjectBatchDeliveryState,
  type BatchDeliveryMutation,
} from './poietek/production-workflows';
import {
  mutateProjectActionWorkflowState,
  runProjectActionRecipe,
  runProjectCycleAction,
  type ActionWorkflowMutation,
} from './poietek/action-workflows';
import {
  mutateProjectModulationWorkflowState,
  type ModulationWorkflowMutation,
} from './poietek/modulation-workflows';
import {
  commitProjectPerformanceCapture,
  createStarterPerformanceCanvasProject,
  mutateProjectPerformanceCanvasState,
  type PerformanceCanvasMutation,
} from './poietek/performance-workflows';
import {
  applyProjectProductionRegionAction,
  captureProjectProductionRegion,
  createStarterProductionRegionsProject,
  type CaptureProductionRegionInput,
  type ProductionRegionAction,
} from './poietek/region-workflows';
import {
  createStarterTrackingConsoleProject,
  mutateProjectTrackingConsoleState,
  type TrackingConsoleMutation,
} from './poietek/tracking-workflows';
import {
  commitProjectTakeComp,
  createProjectTakeComp,
  selectProjectTakeCompSegment,
} from './poietek/engines/comping';
import {
  commitProjectMidiOperation,
  createStarterMidiClip,
  type CreateStarterMidiClipInput,
  type NoteForgeOperationInput,
} from './poietek/engines/midiLab';
import {
  applyProjectEditorialBatchRename,
  createProjectEditorialClipGroup,
  createStarterEditorialProject,
  recallProjectEditorialMemory,
  saveProjectEditorialMemory,
  setProjectEditorialEditPolicy,
  type CreateEditorialClipGroupInput,
  type EditorialBatchRenamePlan,
  type EditorialEditPolicy,
  type SaveEditorialMemoryInput,
} from './poietek/editorial-workflows';
import {
  commitProjectTechniquePlan,
  createStarterTechniqueMatrixProject,
  type TechniquePlaybackPlan,
} from './poietek/technique-workflows';

type ImportedAudioAsset = {
  id: string;
  name: string;
  url: string;
  size: number;
};

const VIRTUAL_KEYBOARD_NOTES = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
];

function readStoredSession() {
  if (typeof window === 'undefined') return { user: 'Local Producer', platform: 'Desktop' };
  const saved = window.localStorage.getItem('poietek-desktop-session');
  if (!saved) return { user: 'Local Producer', platform: 'Desktop' };
  try {
    return JSON.parse(saved);
  } catch {
    return { user: 'Local Producer', platform: 'Desktop' };
  }
}

export default function App() {
  const {
    runtime: projectRuntime,
    status: projectRuntimeStatus,
    refreshProject,
  } = usePoietekRuntime();
  const [canonicalProject, setCanonicalProject] = useState<PoietekProject | null>(null);
  const [projectEditBusy, setProjectEditBusy] = useState(false);
  const [sessionProfile, setSessionProfile] = useState(() => readStoredSession());
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [virtualKeyboardOpen, setVirtualKeyboardOpen] = useState(true);
  const [controlRoomPinned, setControlRoomPinned] = useState(true);
  const [mixerPinned, setMixerPinned] = useState(true);
  const [dropActive, setDropActive] = useState(false);
  const [importedAudio, setImportedAudio] = useState<ImportedAudioAsset[]>([]);
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>([]);
  const [syncCode, setSyncCode] = useState('PST-42D7');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('poietek-desktop-session', JSON.stringify(sessionProfile));
    }
  }, [sessionProfile]);

  useEffect(() => {
    const handleStorage = () => {
      setSessionProfile(readStoredSession());
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorage);
      return () => window.removeEventListener('storage', handleStorage);
    }
    return undefined;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const generated = `PST-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    setSyncCode(generated);
  }, []);

  const handleAudioDrop = useCallback((files: FileList | File[]) => {
    const nextFiles = Array.from(files)
      .filter((file) => file.type.startsWith('audio/') || file.name.toLowerCase().endsWith('.wav') || file.name.toLowerCase().endsWith('.aiff') || file.name.toLowerCase().endsWith('.mp3'))
      .map((file) => ({
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        url: URL.createObjectURL(file),
        size: file.size,
      }));

    if (nextFiles.length > 0) {
      setImportedAudio((current) => [...nextFiles, ...current].slice(0, 12));
    }
  }, []);

  const handleVirtualMIDI = useCallback((note: string) => {
    const pitch = { C: 60, 'C#': 61, D: 62, 'D#': 63, E: 64, F: 65, 'F#': 66, G: 67, 'G#': 68, A: 69, 'A#': 70, B: 71 }[note] ?? 60;
    const firstDev = connectedDevices[0]?.id || 'virt_mpc_01';
    midiManager.simulateInput(firstDev, 'note_on', 1, pitch, 100);
    window.setTimeout(() => midiManager.simulateInput(firstDev, 'note_off', 1, pitch, 0), 160);
  }, [connectedDevices]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const updateUser = () => {
      const nextLocal = readStoredSession();
      setSessionProfile((current) => ({ ...current, ...nextLocal }));
    };
    updateUser();
    window.addEventListener('poietek:preferences-applied', updateUser);
    return () => window.removeEventListener('poietek:preferences-applied', updateUser);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onDrop = (event: DragEvent) => {
      event.preventDefault();
      setDropActive(false);
      if (event.dataTransfer?.files?.length) {
        handleAudioDrop(event.dataTransfer.files);
      }
    };
    const onDragOver = (event: DragEvent) => {
      event.preventDefault();
      setDropActive(true);
    };
    const onDragLeave = (event: DragEvent) => {
      event.preventDefault();
      setDropActive(false);
    };
    window.addEventListener('drop', onDrop);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    return () => {
      window.removeEventListener('drop', onDrop);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
    };
  }, [handleAudioDrop]);

  useEffect(() => {
    if (projectRuntimeStatus !== 'ready') return;
    setCanonicalProject(projectRuntime.getSession().getSnapshot());
  }, [projectRuntime, projectRuntimeStatus]);

  const adoptCanonicalProject = useCallback((project: PoietekProject) => {
    setCanonicalProject(project);
    refreshProject();
  }, [refreshProject]);

  const handleApplyProjectMixScene = useCallback(async (scene: MixScene) => {
    if (projectRuntimeStatus !== 'ready') throw new Error('The local project session is still starting.');
    if (projectEditBusy) throw new Error('Another project edit is already in progress.');
    setProjectEditBusy(true);
    try {
      const next = await projectRuntime.getSession().mutate((current) => saveAndApplyProjectMixScene(current, scene));
      adoptCanonicalProject(next);
    } finally {
      setProjectEditBusy(false);
    }
  }, [adoptCanonicalProject, projectEditBusy, projectRuntime, projectRuntimeStatus]);

  const handleMutateLiveSession = useCallback(async (mutation: LiveSessionMutation) => {
    if (projectRuntimeStatus !== 'ready') throw new Error('The local project session is still starting.');
    if (projectEditBusy) throw new Error('Another project edit is already in progress.');
    setProjectEditBusy(true);
    try {
      const next = await projectRuntime.getSession().mutate((current) => (
        mutateProjectLiveSessionState(current, mutation)
      ));
      adoptCanonicalProject(next);
    } finally {
      setProjectEditBusy(false);
    }
  }, [adoptCanonicalProject, projectEditBusy, projectRuntime, projectRuntimeStatus]);

  const handleInitializeTrackingConsole = useCallback(async () => {
    if (projectRuntimeStatus !== 'ready') throw new Error('The local project session is still starting.');
    if (projectEditBusy) throw new Error('Another project edit is already in progress.');
    setProjectEditBusy(true);
    try {
      const next = await projectRuntime.getSession().mutate((current) => createStarterTrackingConsoleProject(current));
      adoptCanonicalProject(next);
    } finally {
      setProjectEditBusy(false);
    }
  }, [adoptCanonicalProject, projectEditBusy, projectRuntime, projectRuntimeStatus]);

  const handleMutateTrackingConsole = useCallback(async (mutation: TrackingConsoleMutation) => {
    if (projectRuntimeStatus !== 'ready') throw new Error('The local project session is still starting.');
    if (projectEditBusy) throw new Error('Another project edit is already in progress.');
    setProjectEditBusy(true);
    try {
      const next = await projectRuntime.getSession().mutate((current) => mutateProjectTrackingConsoleState(current, mutation));
      adoptCanonicalProject(next);
    } finally {
      setProjectEditBusy(false);
    }
  }, [adoptCanonicalProject, projectEditBusy, projectRuntime, projectRuntimeStatus]);

  const handleCreateTakeComp = useCallback(async (
    sourceClipIds: readonly string[],
    groupId: string,
    name: string,
  ) => {
    if (projectRuntimeStatus !== 'ready') throw new Error('The local project session is still starting.');
    if (projectEditBusy) throw new Error('Another project edit is already in progress.');
    setProjectEditBusy(true);
    try {
      const next = await projectRuntime.getSession().mutate((current) => createProjectTakeComp(current, {
        groupId,
        name,
        sourceClipIds,
      }));
      adoptCanonicalProject(next);
    } finally {
      setProjectEditBusy(false);
    }
  }, [adoptCanonicalProject, projectEditBusy, projectRuntime, projectRuntimeStatus]);

  const handleSelectTakeForSegment = useCallback(async (
    groupId: string,
    segmentId: string,
    takeLaneId: string,
  ) => {
    if (projectRuntimeStatus !== 'ready') throw new Error('The local project session is still starting.');
    if (projectEditBusy) throw new Error('Another project edit is already in progress.');
    setProjectEditBusy(true);
    try {
      const next = await projectRuntime.getSession().mutate((current) => (
        selectProjectTakeCompSegment(current, groupId, segmentId, takeLaneId)
      ));
      adoptCanonicalProject(next);
    } finally {
      setProjectEditBusy(false);
    }
  }, [adoptCanonicalProject, projectEditBusy, projectRuntime, projectRuntimeStatus]);

  const handleCommitTakeComp = useCallback(async (groupId: string) => {
    if (projectRuntimeStatus !== 'ready') throw new Error('The local project session is still starting.');
    if (projectEditBusy) throw new Error('Another project edit is already in progress.');
    setProjectEditBusy(true);
    try {
      const next = await projectRuntime.getSession().mutate((current) => commitProjectTakeComp(current, groupId));
      adoptCanonicalProject(next);
    } finally {
      setProjectEditBusy(false);
    }
  }, [adoptCanonicalProject, projectEditBusy, projectRuntime, projectRuntimeStatus]);

  const handleCreateStarterMidiClip = useCallback(async (input: CreateStarterMidiClipInput) => {
    if (projectRuntimeStatus !== 'ready') throw new Error('The local project session is still starting.');
    if (projectEditBusy) throw new Error('Another project edit is already in progress.');
    setProjectEditBusy(true);
    try {
      const next = await projectRuntime.getSession().mutate((current) => createStarterMidiClip(current, input));
      adoptCanonicalProject(next);
    } finally {
      setProjectEditBusy(false);
    }
  }, [adoptCanonicalProject, projectEditBusy, projectRuntime, projectRuntimeStatus]);

  const handleCommitMidiOperation = useCallback(async (input: NoteForgeOperationInput) => {
    if (projectRuntimeStatus !== 'ready') throw new Error('The local project session is still starting.');
    if (projectEditBusy) throw new Error('Another project edit is already in progress.');
    setProjectEditBusy(true);
    try {
      const next = await projectRuntime.getSession().mutate((current) => commitProjectMidiOperation(current, input));
      adoptCanonicalProject(next);
    } finally {
      setProjectEditBusy(false);
    }
  }, [adoptCanonicalProject, projectEditBusy, projectRuntime, projectRuntimeStatus]);

  const handleInitializeTechniqueMatrix = useCallback(async () => {
    if (projectRuntimeStatus !== 'ready') throw new Error('The local project session is still starting.');
    if (projectEditBusy) throw new Error('Another project edit is already in progress.');
    setProjectEditBusy(true);
    try {
      const next = await projectRuntime.getSession().mutate((current) => createStarterTechniqueMatrixProject(current));
      adoptCanonicalProject(next);
    } finally {
      setProjectEditBusy(false);
    }
  }, [adoptCanonicalProject, projectEditBusy, projectRuntime, projectRuntimeStatus]);

  const handleCommitTechniquePlan = useCallback(async (plan: TechniquePlaybackPlan) => {
    if (projectRuntimeStatus !== 'ready') throw new Error('The local project session is still starting.');
    if (projectEditBusy) throw new Error('Another project edit is already in progress.');
    setProjectEditBusy(true);
    try {
      const next = await projectRuntime.getSession().mutate((current) => commitProjectTechniquePlan(current, plan));
      adoptCanonicalProject(next);
    } finally {
      setProjectEditBusy(false);
    }
  }, [adoptCanonicalProject, projectEditBusy, projectRuntime, projectRuntimeStatus]);

  const handleMutatePicturePost = useCallback(async (mutation: PicturePostMutation) => {
    if (projectRuntimeStatus !== 'ready') throw new Error('The local project session is still starting.');
    if (projectEditBusy) throw new Error('Another project edit is already in progress.');
    setProjectEditBusy(true);
    try {
      const next = await projectRuntime.getSession().mutate((current) => (
        mutateProjectPicturePostState(current, mutation)
      ));
      adoptCanonicalProject(next);
    } finally {
      setProjectEditBusy(false);
    }
  }, [adoptCanonicalProject, projectEditBusy, projectRuntime, projectRuntimeStatus]);

  const handleMutateSequenceAssembly = useCallback(async (mutation: SequenceAssemblyMutation) => {
    if (projectRuntimeStatus !== 'ready') throw new Error('The local project session is still starting.');
    if (projectEditBusy) throw new Error('Another project edit is already in progress.');
    setProjectEditBusy(true);
    try {
      const next = await projectRuntime.getSession().mutate((current) => (
        mutateProjectSequenceAssemblyState(current, mutation)
      ));
      adoptCanonicalProject(next);
    } finally {
      setProjectEditBusy(false);
    }
  }, [adoptCanonicalProject, projectEditBusy, projectRuntime, projectRuntimeStatus]);

  const handleMutateBatchDelivery = useCallback(async (mutation: BatchDeliveryMutation) => {
    if (projectRuntimeStatus !== 'ready') throw new Error('The local project session is still starting.');
    if (projectEditBusy) throw new Error('Another project edit is already in progress.');
    setProjectEditBusy(true);
    try {
      const next = await projectRuntime.getSession().mutate((current) => (
        mutateProjectBatchDeliveryState(current, mutation)
      ));
      adoptCanonicalProject(next);
    } finally {
      setProjectEditBusy(false);
    }
  }, [adoptCanonicalProject, projectEditBusy, projectRuntime, projectRuntimeStatus]);

  const handleMutateActionWorkflow = useCallback(async (mutation: ActionWorkflowMutation) => {
    if (projectRuntimeStatus !== 'ready') throw new Error('The local project session is still starting.');
    if (projectEditBusy) throw new Error('Another project edit is already in progress.');
    setProjectEditBusy(true);
    try {
      const next = await projectRuntime.getSession().mutate((current) => (
        mutateProjectActionWorkflowState(current, mutation)
      ));
      adoptCanonicalProject(next);
    } finally {
      setProjectEditBusy(false);
    }
  }, [adoptCanonicalProject, projectEditBusy, projectRuntime, projectRuntimeStatus]);

  const handleRunActionRecipe = useCallback(async (recipeId: string) => {
    if (projectRuntimeStatus !== 'ready') throw new Error('The local project session is still starting.');
    if (projectEditBusy) throw new Error('Another project edit is already in progress.');
    setProjectEditBusy(true);
    try {
      const next = await projectRuntime.getSession().mutate((current) => runProjectActionRecipe(current, recipeId));
      adoptCanonicalProject(next);
    } finally {
      setProjectEditBusy(false);
    }
  }, [adoptCanonicalProject, projectEditBusy, projectRuntime, projectRuntimeStatus]);

  const handleRunCycleAction = useCallback(async (cycleId: string) => {
    if (projectRuntimeStatus !== 'ready') throw new Error('The local project session is still starting.');
    if (projectEditBusy) throw new Error('Another project edit is already in progress.');
    setProjectEditBusy(true);
    try {
      const next = await projectRuntime.getSession().mutate((current) => runProjectCycleAction(current, cycleId));
      adoptCanonicalProject(next);
    } finally {
      setProjectEditBusy(false);
    }
  }, [adoptCanonicalProject, projectEditBusy, projectRuntime, projectRuntimeStatus]);

  const handleMutateModulationWorkflow = useCallback(async (mutation: ModulationWorkflowMutation) => {
    if (projectRuntimeStatus !== 'ready') throw new Error('The local project session is still starting.');
    if (projectEditBusy) throw new Error('Another project edit is already in progress.');
    setProjectEditBusy(true);
    try {
      const next = await projectRuntime.getSession().mutate((current) => (
        mutateProjectModulationWorkflowState(current, mutation)
      ));
      adoptCanonicalProject(next);
    } finally {
      setProjectEditBusy(false);
    }
  }, [adoptCanonicalProject, projectEditBusy, projectRuntime, projectRuntimeStatus]);

  const handleInitializePerformanceCanvas = useCallback(async () => {
    if (projectRuntimeStatus !== 'ready') throw new Error('The local project session is still starting.');
    if (projectEditBusy) throw new Error('Another project edit is already in progress.');
    setProjectEditBusy(true);
    try {
      const next = await projectRuntime.getSession().mutate((current) => createStarterPerformanceCanvasProject(current));
      adoptCanonicalProject(next);
    } finally {
      setProjectEditBusy(false);
    }
  }, [adoptCanonicalProject, projectEditBusy, projectRuntime, projectRuntimeStatus]);

  const handleMutatePerformanceCanvas = useCallback(async (mutation: PerformanceCanvasMutation) => {
    if (projectRuntimeStatus !== 'ready') throw new Error('The local project session is still starting.');
    if (projectEditBusy) throw new Error('Another project edit is already in progress.');
    setProjectEditBusy(true);
    try {
      const next = await projectRuntime.getSession().mutate((current) => mutateProjectPerformanceCanvasState(current, mutation));
      adoptCanonicalProject(next);
    } finally {
      setProjectEditBusy(false);
    }
  }, [adoptCanonicalProject, projectEditBusy, projectRuntime, projectRuntimeStatus]);

  const handleCommitPerformanceCapture = useCallback(async (commitId: string, insertionTick: number) => {
    if (projectRuntimeStatus !== 'ready') throw new Error('The local project session is still starting.');
    if (projectEditBusy) throw new Error('Another project edit is already in progress.');
    setProjectEditBusy(true);
    try {
      const next = await projectRuntime.getSession().mutate((current) => commitProjectPerformanceCapture(current, commitId, insertionTick));
      adoptCanonicalProject(next);
    } finally {
      setProjectEditBusy(false);
    }
  }, [adoptCanonicalProject, projectEditBusy, projectRuntime, projectRuntimeStatus]);

  const handleInitializeProductionRegions = useCallback(async () => {
    if (projectRuntimeStatus !== 'ready') throw new Error('The local project session is still starting.');
    if (projectEditBusy) throw new Error('Another project edit is already in progress.');
    setProjectEditBusy(true);
    try {
      const next = await projectRuntime.getSession().mutate((current) => createStarterProductionRegionsProject(current));
      adoptCanonicalProject(next);
    } finally {
      setProjectEditBusy(false);
    }
  }, [adoptCanonicalProject, projectEditBusy, projectRuntime, projectRuntimeStatus]);

  const handleCaptureProductionRegion = useCallback(async (input: CaptureProductionRegionInput) => {
    if (projectRuntimeStatus !== 'ready') throw new Error('The local project session is still starting.');
    if (projectEditBusy) throw new Error('Another project edit is already in progress.');
    setProjectEditBusy(true);
    try {
      const next = await projectRuntime.getSession().mutate((current) => captureProjectProductionRegion(current, input));
      adoptCanonicalProject(next);
    } finally {
      setProjectEditBusy(false);
    }
  }, [adoptCanonicalProject, projectEditBusy, projectRuntime, projectRuntimeStatus]);

  const handleApplyProductionRegionAction = useCallback(async (
    regionId: string,
    action: ProductionRegionAction,
    targetStartTick: number,
    operationId: string,
  ) => {
    if (projectRuntimeStatus !== 'ready') throw new Error('The local project session is still starting.');
    if (projectEditBusy) throw new Error('Another project edit is already in progress.');
    setProjectEditBusy(true);
    try {
      const next = await projectRuntime.getSession().mutate((current) => applyProjectProductionRegionAction(
        current,
        regionId,
        action,
        targetStartTick,
        operationId,
      ));
      adoptCanonicalProject(next);
    } finally {
      setProjectEditBusy(false);
    }
  }, [adoptCanonicalProject, projectEditBusy, projectRuntime, projectRuntimeStatus]);

  const handleInitializeEditorial = useCallback(async () => {
    if (projectRuntimeStatus !== 'ready') throw new Error('The local project session is still starting.');
    if (projectEditBusy) throw new Error('Another project edit is already in progress.');
    setProjectEditBusy(true);
    try {
      const next = await projectRuntime.getSession().mutate((current) => createStarterEditorialProject(current));
      adoptCanonicalProject(next);
    } finally {
      setProjectEditBusy(false);
    }
  }, [adoptCanonicalProject, projectEditBusy, projectRuntime, projectRuntimeStatus]);

  const handleSaveEditorialMemory = useCallback(async (input: SaveEditorialMemoryInput) => {
    if (projectRuntimeStatus !== 'ready') throw new Error('The local project session is still starting.');
    if (projectEditBusy) throw new Error('Another project edit is already in progress.');
    setProjectEditBusy(true);
    try {
      const next = await projectRuntime.getSession().mutate((current) => saveProjectEditorialMemory(current, input));
      adoptCanonicalProject(next);
    } finally {
      setProjectEditBusy(false);
    }
  }, [adoptCanonicalProject, projectEditBusy, projectRuntime, projectRuntimeStatus]);

  const handleRecallEditorialMemory = useCallback(async (memoryId: string, operationId: string) => {
    if (projectRuntimeStatus !== 'ready') throw new Error('The local project session is still starting.');
    if (projectEditBusy) throw new Error('Another project edit is already in progress.');
    setProjectEditBusy(true);
    try {
      const next = await projectRuntime.getSession().mutate((current) => recallProjectEditorialMemory(current, memoryId, operationId));
      adoptCanonicalProject(next);
    } finally {
      setProjectEditBusy(false);
    }
  }, [adoptCanonicalProject, projectEditBusy, projectRuntime, projectRuntimeStatus]);

  const handleCreateEditorialClipGroup = useCallback(async (input: CreateEditorialClipGroupInput) => {
    if (projectRuntimeStatus !== 'ready') throw new Error('The local project session is still starting.');
    if (projectEditBusy) throw new Error('Another project edit is already in progress.');
    setProjectEditBusy(true);
    try {
      const next = await projectRuntime.getSession().mutate((current) => createProjectEditorialClipGroup(current, input));
      adoptCanonicalProject(next);
    } finally {
      setProjectEditBusy(false);
    }
  }, [adoptCanonicalProject, projectEditBusy, projectRuntime, projectRuntimeStatus]);

  const handleApplyEditorialBatchRename = useCallback(async (plan: EditorialBatchRenamePlan) => {
    if (projectRuntimeStatus !== 'ready') throw new Error('The local project session is still starting.');
    if (projectEditBusy) throw new Error('Another project edit is already in progress.');
    setProjectEditBusy(true);
    try {
      const next = await projectRuntime.getSession().mutate((current) => applyProjectEditorialBatchRename(current, plan));
      adoptCanonicalProject(next);
    } finally {
      setProjectEditBusy(false);
    }
  }, [adoptCanonicalProject, projectEditBusy, projectRuntime, projectRuntimeStatus]);

  const handleSetEditorialEditPolicy = useCallback(async (policy: EditorialEditPolicy, operationId: string) => {
    if (projectRuntimeStatus !== 'ready') throw new Error('The local project session is still starting.');
    if (projectEditBusy) throw new Error('Another project edit is already in progress.');
    setProjectEditBusy(true);
    try {
      const next = await projectRuntime.getSession().mutate((current) => setProjectEditorialEditPolicy(current, policy, operationId));
      adoptCanonicalProject(next);
    } finally {
      setProjectEditBusy(false);
    }
  }, [adoptCanonicalProject, projectEditBusy, projectRuntime, projectRuntimeStatus]);

  const handleUndoProject = useCallback(async () => {
    if (projectRuntimeStatus !== 'ready') throw new Error('The local project session is still starting.');
    if (projectEditBusy) throw new Error('Another project edit is already in progress.');
    setProjectEditBusy(true);
    try {
      adoptCanonicalProject(await projectRuntime.getSession().undo());
    } finally {
      setProjectEditBusy(false);
    }
  }, [adoptCanonicalProject, projectEditBusy, projectRuntime, projectRuntimeStatus]);

  const handleRedoProject = useCallback(async () => {
    if (projectRuntimeStatus !== 'ready') throw new Error('The local project session is still starting.');
    if (projectEditBusy) throw new Error('Another project edit is already in progress.');
    setProjectEditBusy(true);
    try {
      adoptCanonicalProject(await projectRuntime.getSession().redo());
    } finally {
      setProjectEditBusy(false);
    }
  }, [adoptCanonicalProject, projectEditBusy, projectRuntime, projectRuntimeStatus]);

  const canUndoProject = projectRuntimeStatus === 'ready' && projectRuntime.getSession().canUndo();
  const canRedoProject = projectRuntimeStatus === 'ready' && projectRuntime.getSession().canRedo();
  const activeProjectMixSceneId = canonicalProject
    ? getProjectCompositionWorkflow(canonicalProject)?.activeMixSceneId ?? null
    : null;

  // Master Global App State
  const [masterState, setMasterState] = useState<MasterState>({
    bpm: 94,
    isPlaying: false,
    isRecording: false,
    currentStep: 0,
    metronome: false,
    masterVolume: 0.85,
    reverbLevel: 0.25,
    delayLevel: 0.15,
    activeWorkspace: 'mpc',
    learningModeActive: false,
  });

  const [isAIGrooveOpen, setIsAIGrooveOpen] = useState<boolean>(false);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isBrowserOpen, setIsBrowserOpen] = useState<boolean>(() =>
    typeof window === 'undefined' || window.matchMedia('(min-width: 1280px)').matches,
  );
  const [isRackLibraryOpen, setIsRackLibraryOpen] = useState<boolean>(() =>
    typeof window === 'undefined' || window.matchMedia('(min-width: 1200px)').matches,
  );
  const [detachedWorkspaces, setDetachedWorkspaces] = useState<WorkspaceType[]>([]);

  const [isTemplatesOpen, setIsTemplatesOpen] = useState<boolean>(false);
  const [isWalkthroughActive, setIsWalkthroughActive] = useState<boolean>(() =>
    typeof window === 'undefined' || window.matchMedia('(min-width: 900px)').matches,
  );
  const [autoHideBars, setAutoHideBars] = useState<boolean>(false);
  const [rackZoom, setRackZoom] = useState<number>(1);
  const [rackAutoFit, setRackAutoFit] = useState<boolean>(true);

  // Infinite Rack Modules State with Undo/Redo History Stack
  const [rackHistory, setRackHistory] = useState<RackModuleItem[][]>([
    [
      { id: 'start_idea', type: 'composition_workbench', title: 'Idea Flow Workbench', tapeLabel: 'IDEA FLOW', parameters: {view: 'pattern', activePattern: 'pattern-a', swing: 0.5, scaleRoot: 0, scaleType: 'major', noteTool: 'original', automationCurve: 'smooth', automationMid: 0.78, captureArmed: false} },
      { id: 'start_motion', type: 'motion_matrix', title: 'Motion Matrix', tapeLabel: 'MOTION MATRIX', parameters: {view: 'modulators'} },
      { id: 'start_score', type: 'score_workbench', title: 'Score & Parts Workbench', tapeLabel: 'SCORE WORKBENCH', parameters: {scoreMode: 'write', playerCount: 1, articulationPlayback: true, followPicture: false} },
      { id: 'start_mpc', type: 'mpc', title: 'Canvas Drum Grid', tapeLabel: 'FOUNDRY KIT' },
      { id: 'start_synth', type: 'keyboard', title: 'Analog Subtractive Synth', tapeLabel: 'LEAD SYNTH' },
      {
        id: 'start_bus',
        type: 'folder_combinator',
        title: 'Drums & FX Bus Folder',
        tapeLabel: 'COMBINATOR BUS',
        subModuleIds: ['start_sp404'],
      },
      { id: 'start_sp404', type: 'sp404', title: 'Grain Deck Sampler', tapeLabel: 'TEXTURE FX', groupId: 'start_bus' },
      { id: 'start_pitch', type: 'melodyne_pitch', title: 'Vocal Contour Editor', tapeLabel: 'PITCH MAP' },
      { id: 'start_mixer', type: 'mixer', title: 'Summit Master Console', tapeLabel: 'MASTER CONSOLE' },
      { id: 'start_control_room', type: 'control_room', title: 'Monitor, Cue & Talkback', tapeLabel: 'CONTROL ROOM', parameters: {source: 'main', monitorFormat: 'stereo', cueBusCount: 2, dimDb: -20, dimEnabled: false, monoEnabled: false, talkbackEnabled: false} },
    ],
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const rackModules = rackHistory[historyIndex] || [];

  const setRackModules = useCallback(
    (action: React.SetStateAction<RackModuleItem[]>) => {
      setRackHistory((prevHistory) => {
        const currentRack = prevHistory[historyIndex] || [];
        const nextRack = typeof action === 'function' ? action(currentRack) : action;

        if (JSON.stringify(currentRack) === JSON.stringify(nextRack)) {
          return prevHistory;
        }

        const sliced = prevHistory.slice(0, historyIndex + 1);
        const newHistory = [...sliced, nextRack];
        setHistoryIndex(newHistory.length - 1);
        return newHistory;
      });
    },
    [historyIndex]
  );

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex((prev) => prev - 1);
    }
  }, [historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < rackHistory.length - 1) {
      setHistoryIndex((prev) => prev + 1);
    }
  }, [historyIndex, rackHistory.length]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < rackHistory.length - 1;

  // Keyboard Shortcuts Listener for Undo (Ctrl+Z / Cmd+Z) and Redo (Ctrl+Y / Cmd+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement &&
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)
      ) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  const handleAddModuleToRack = (type: ModuleType) => {
    const newModule = createRackModuleItem(type);
    setRackModules((prev) => {
      const annotate = (module: RackModuleItem) => {
        const definition = getRackModuleDefinition(module.type);
        return {
          id: module.id,
          title: module.title,
          role: definition.role,
          inputs: definition.inputs,
          outputs: definition.outputs,
          groupId: module.groupId,
          module,
        };
      };
      return insertRackModuleByRole(prev.map(annotate), annotate(newModule))
        .map((entry) => entry.module);
    });
  };

  const handleLoadTemplate = (template: StudioTemplate) => {
    setRackModules(template.modules);
    setMasterState((prev) => ({ ...prev, bpm: template.bpm }));
    if (template.hasWalkthrough) {
      setIsWalkthroughActive(true);
    } else {
      setIsWalkthroughActive(false);
    }
  };

  const handleDetachWorkspace = (ws: WorkspaceType) => {
    if (!detachedWorkspaces.includes(ws)) {
      setDetachedWorkspaces((prev) => [...prev, ws]);
    }
  };

  const handleDockWorkspace = (ws: WorkspaceType) => {
    setDetachedWorkspaces((prev) => prev.filter((w) => w !== ws));
  };

  // Keyboard shortcut: TAB key toggles Flip Rack (Rear patch cables panel)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
          return;
        }
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Initialize 128 Pads across Banks A to H (16 per bank)
  const [pads, setPads] = useState<SamplePad[]>(() => {
    const bankLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const sampleIds = [
      'kick_808', 'snare_808', 'hihat_closed', 'hihat_open',
      'clap_classic', 'tom_low', 'tom_mid', 'tom_high',
      'crash_cymbal', 'rim_shot', 'kick_punch', 'snare_sp',
      'synth_bass', 'synth_lead', 'synth_chord', 'vinyl_scratch'
    ];
    const padNames = [
      'Kick 808', 'Snare 808', 'Closed Hat', 'Open Hat',
      'Analog Clap', 'Low Tom', 'Mid Tom', 'High Tom',
      'Crash Cymbal', 'Rimshot', 'Punch Kick', 'Lo-Fi Snare',
      'Synth Bass', 'Synth Lead', 'Maj7 Chord', 'Vinyl Scratch'
    ];

    const allPads: SamplePad[] = [];
    bankLetters.forEach((bank) => {
      for (let i = 0; i < 16; i++) {
        allPads.push({
          id: `pad_${bank}_${i}`,
          name: `${padNames[i]} (${bank})`,
          sampleUrl: sampleIds[i],
          pitch: 0,
          volume: 0.85,
          pan: 0,
          startOffset: 0,
          endOffset: 1,
          loop: false,
          color: bank === 'A' ? '#6366f1' : bank === 'B' ? '#f97316' : '#10b981',
          bank,
          rootNote: 36 + i,
        });
      }
    });
    return allPads;
  });

  // Initialize 8 Studio Track Mixer Channels
  const [channels, setChannels] = useState<TrackChannel[]>([
    { id: 'ch_1', name: 'Canvas Grid Bank A', color: '#6366f1', volume: 0.85, pan: 0, mute: false, solo: false, eqLow: 0, eqMid: 0, eqHigh: 0, sendReverb: 0.2, sendDelay: 0.1, assignedPadIds: [], instrumentType: 'sampler' },
    { id: 'ch_2', name: 'Grain Deck Sampler', color: '#f97316', volume: 0.9, pan: 0, mute: false, solo: false, eqLow: 2, eqMid: -1, eqHigh: 1, sendReverb: 0.3, sendDelay: 0.2, assignedPadIds: [], instrumentType: 'sampler' },
    { id: 'ch_3', name: 'MIDI Synth Lead', color: '#a855f7', volume: 0.8, pan: -0.2, mute: false, solo: false, eqLow: 0, eqMid: 2, eqHigh: 2, sendReverb: 0.4, sendDelay: 0.3, assignedPadIds: [], instrumentType: 'synth' },
    { id: 'ch_4', name: 'E-Drum Kit', color: '#eab308', volume: 0.9, pan: 0, mute: false, solo: false, eqLow: 3, eqMid: 0, eqHigh: 1, sendReverb: 0.1, sendDelay: 0, assignedPadIds: [], instrumentType: 'e_drum' },
    { id: 'ch_5', name: 'DJ Deck A', color: '#3b82f6', volume: 0.85, pan: -0.5, mute: false, solo: false, eqLow: 0, eqMid: 0, eqHigh: 0, sendReverb: 0, sendDelay: 0, assignedPadIds: [], instrumentType: 'dj_deck' },
    { id: 'ch_6', name: 'DJ Deck B', color: '#ec4899', volume: 0.85, pan: 0.5, mute: false, solo: false, eqLow: 0, eqMid: 0, eqHigh: 0, sendReverb: 0, sendDelay: 0, assignedPadIds: [], instrumentType: 'dj_deck' },
    { id: 'ch_7', name: 'Vocal / Input 1', color: '#10b981', volume: 0.8, pan: 0, mute: false, solo: false, eqLow: -1, eqMid: 1, eqHigh: 2, sendReverb: 0.5, sendDelay: 0.2, assignedPadIds: [], instrumentType: 'sampler' },
    { id: 'ch_8', name: 'Master FX Bus', color: '#64748b', volume: 0.95, pan: 0, mute: false, solo: false, eqLow: 0, eqMid: 0, eqHigh: 0, sendReverb: 0, sendDelay: 0, assignedPadIds: [], instrumentType: 'sampler' },
  ]);

  // Init Web MIDI and scan devices
  useEffect(() => {
    midiManager.initMIDI().then(() => {
      setConnectedDevices(midiManager.getConnectedDevices());
    });

    const unsubscribe = midiManager.subscribe((device, type, channel, number, value) => {
      setConnectedDevices(midiManager.getConnectedDevices());
    });

    return () => unsubscribe();
  }, []);

  // Metronome click loop when playing
  useEffect(() => {
    if (!masterState.isPlaying || !masterState.metronome) return;
    const intervalMs = 60000 / masterState.bpm;
    let step = 0;
    const timer = setInterval(() => {
      audioEngine.triggerMetronome(step % 4 === 0);
      step++;
    }, intervalMs);
    return () => clearInterval(timer);
  }, [masterState.isPlaying, masterState.metronome, masterState.bpm]);

  // Handle Play/Stop
  const handleTogglePlayStop = useCallback(() => {
    audioEngine.initAudio();
    setMasterState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  // Tap Tempo calculation
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const handleTapTempo = useCallback(() => {
    const now = Date.now();
    setTapTimes((prev) => {
      const recent = [...prev.filter((t) => now - t < 3000), now];
      if (recent.length >= 2) {
        const intervals = [];
        for (let i = 1; i < recent.length; i++) {
          intervals.push(recent[i] - recent[i - 1]);
        }
        const avgMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const calculatedBpm = Math.round(60000 / avgMs);
        if (calculatedBpm >= 40 && calculatedBpm <= 240) {
          setMasterState((st) => ({ ...st, bpm: calculatedBpm }));
        }
      }
      return recent;
    });
  }, []);

  // Simulate MIDI event manually
  const handleSimulateMIDI = useCallback(
    (type: 'note_on' | 'note_off' | 'cc', channel: number, number: number, value: number) => {
      const firstDev = connectedDevices[0]?.id || 'virt_mpc_01';
      midiManager.simulateInput(firstDev, type, channel, number, value);
    },
    [connectedDevices]
  );

  // Apply AI Generated Groove
  const handleApplyAIGroove = (style: string, newBpm: number) => {
    setMasterState((prev) => ({ ...prev, bpm: newBpm }));
  };

  useEffect(() => subscribeStudioCommands((command) => {
    switch (command.id) {
      case 'edit-undo':
        handleUndo();
        break;
      case 'edit-redo':
        handleRedo();
        break;
      case 'transport-play-toggle':
        handleTogglePlayStop();
        break;
      case 'transport-stop':
        setMasterState((current) => ({...current, isPlaying: false, currentStep: 0}));
        break;
      case 'transport-return-zero':
        setMasterState((current) => ({...current, currentStep: 0}));
        break;
      case 'transport-metronome-toggle':
        setMasterState((current) => ({...current, metronome: !current.metronome}));
        break;
      case 'rack-flip':
        setIsFlipped((current) => !current);
        break;
      case 'rack-templates':
        setIsTemplatesOpen(true);
        break;
      case 'rack-workspace': {
        if (!command.value) break;
        if (!isRackModuleType(command.value)) break;
        if (isWorkspaceModuleType(command.value)) {
          setMasterState((current) => ({...current, activeWorkspace: command.value as WorkspaceType}));
        }
        handleAddModuleToRack(command.value);
        break;
      }
    }
  }), [handleRedo, handleTogglePlayStop, handleUndo]);

  useEffect(() => {
    markStudioCommandAreaReady('rack', true);
    return () => markStudioCommandAreaReady('rack', false);
  }, []);

  useEffect(() => {
    setAutoHideBars(new BrowserStudioSettingsRepository().load().preferences.appearance.autoHideTransportBars);
    const applyAppearance = (event: Event) => {
      const preferences = (event as CustomEvent<StudioPreferences>).detail;
      setAutoHideBars(preferences.appearance.autoHideTransportBars);
    };
    window.addEventListener('poietek:preferences-applied', applyAppearance);
    return () => window.removeEventListener('poietek:preferences-applied', applyAppearance);
  }, []);

  return (
    <div className="poietek-rack-app h-screen w-screen bg-stone-950 text-neutral-100 flex flex-col font-mono selection:bg-amber-500 selection:text-neutral-950 antialiased overflow-hidden select-none relative">
      {/* Starter Song Interactive Walkthrough Banner */}
      {isWalkthroughActive && (
        <GuidedWalkthroughBanner
          onDismiss={() => setIsWalkthroughActive(false)}
          onJumpToModule={(ws) => {
            setMasterState((prev) => ({ ...prev, activeWorkspace: ws as WorkspaceType }));
            handleAddModuleToRack(ws as ModuleType);
          }}
        />
      )}

      {/* Main Full-Screen DAW Workspace (Browser Left + Mahogany Wood Hardware Rack Center) */}
      <div className="poietek-rack-workspace flex-1 flex overflow-hidden bg-stone-950 relative">
        {/* Left Studio DAW Browser Sidebar */}
        <DAWBrowserSidebar
          activeWorkspace={masterState.activeWorkspace}
          setActiveWorkspace={(ws) => {
            setMasterState((prev) => ({ ...prev, activeWorkspace: ws }));
            handleAddModuleToRack(ws);
          }}
          isOpen={isBrowserOpen}
          onToggle={() => setIsBrowserOpen((prev) => !prev)}
        />

        {/* Center Studio Workstation Container */}
        <div className="poietek-rack-center flex-1 min-h-0 flex flex-col overflow-hidden bg-stone-900 border-x-[14px] border-[#381e0e] shadow-[inset_0_0_50px_rgba(0,0,0,0.9)]">
          {/* 1U Studio Hardware Audio & MIDI Interface (Top Rack Unit) */}
          <div className="poietek-rack-hardware shrink-0 p-2 bg-stone-950 border-b-2 border-stone-800">
            <HardwareInterfaceUnit
              connectedDevices={connectedDevices}
              bpm={masterState.bpm}
              isFlipped={isFlipped}
              onToggleFlip={() => setIsFlipped((prev) => !prev)}
            />
          </div>

          <div className="shrink-0 border-b border-stone-800 bg-[#1a1817] px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded border border-emerald-500/60 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-300">
                  Local-first session
                </div>
                <div className="text-sm text-stone-200">
                  <span className="text-stone-400">Logged in as</span> {sessionProfile.user || 'Local Producer'}
                </div>
                <div className="rounded-full border border-amber-500/50 bg-amber-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-amber-200">
                  {deviceMode}
                </div>
              </div>

              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-stone-400">
                <button
                  type="button"
                  onClick={() => setDeviceMode('desktop')}
                  className={`rounded border px-2 py-1 ${deviceMode === 'desktop' ? 'border-cyan-500 bg-cyan-500/10 text-cyan-200' : 'border-stone-700 bg-stone-900 text-stone-300'}`}
                >
                  Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceMode('tablet')}
                  className={`rounded border px-2 py-1 ${deviceMode === 'tablet' ? 'border-violet-500 bg-violet-500/10 text-violet-200' : 'border-stone-700 bg-stone-900 text-stone-300'}`}
                >
                  Tablet
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceMode('mobile')}
                  className={`rounded border px-2 py-1 ${deviceMode === 'mobile' ? 'border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-200' : 'border-stone-700 bg-stone-900 text-stone-300'}`}
                >
                  Mobile
                </button>
                <button
                  type="button"
                  onClick={() => setVirtualKeyboardOpen((value) => !value)}
                  className="rounded border border-stone-700 bg-stone-900 px-2 py-1 text-stone-200"
                >
                  {virtualKeyboardOpen ? 'Hide MIDI keyboard' : 'Show MIDI keyboard'}
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-stone-300">
              <div className="rounded border border-stone-700 bg-stone-900 px-2 py-1">
                Sync code: <span className="font-semibold text-amber-300">{syncCode}</span>
              </div>
              <div className="rounded border border-stone-700 bg-stone-900 px-2 py-1">
                Cloud/browser login: <span className="text-emerald-300">ready</span>
              </div>
              <div className="rounded border border-stone-700 bg-stone-900 px-2 py-1">
                Local project store: <span className="text-cyan-300">{canonicalProject ? 'synced' : 'initialising'}</span>
              </div>
              <button
                type="button"
                onClick={() => setMixerPinned((value) => !value)}
                className="rounded border border-stone-700 bg-stone-900 px-2 py-1"
              >
                {mixerPinned ? 'Mixer pinned' : 'Mixer floating'}
              </button>
              <button
                type="button"
                onClick={() => setControlRoomPinned((value) => !value)}
                className="rounded border border-stone-700 bg-stone-900 px-2 py-1"
              >
                {controlRoomPinned ? 'Control room pinned' : 'Control room compact'}
              </button>
            </div>
          </div>

          <div className="shrink-0 border-b border-stone-800 bg-stone-950/80 px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-stone-400">
                <span className="rounded bg-stone-800 px-2 py-1">Tracks + buses</span>
                <span className="rounded bg-stone-800 px-2 py-1">Mix / master</span>
                <span className="rounded bg-stone-800 px-2 py-1">Control room</span>
              </div>

              <div className="flex items-center gap-3 text-xs text-stone-300">
                <div className="rounded border border-stone-700 bg-stone-900 px-2 py-1">Drum bus</div>
                <div className="rounded border border-stone-700 bg-stone-900 px-2 py-1">Synth bus</div>
                <div className="rounded border border-stone-700 bg-stone-900 px-2 py-1">Vocal bus</div>
                <div className="rounded border border-amber-500/50 bg-amber-500/10 px-2 py-1 text-amber-200">Master</div>
              </div>
            </div>
          </div>

          <div className={`shrink-0 border-b border-stone-800 bg-[#141110] px-4 py-3 transition-all ${dropActive ? 'ring-2 ring-cyan-500/60' : ''}`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-xs text-stone-300">
                <span className="text-[10px] uppercase tracking-[0.28em] text-stone-500">Audio import</span>
                <div className="rounded border border-dashed border-cyan-500/50 bg-cyan-500/5 px-3 py-2 text-cyan-200">
                  Drag audio files here for instant queue + preview
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-stone-200">
                {importedAudio.length === 0 ? (
                  <span className="text-stone-500">No audio loaded</span>
                ) : (
                  importedAudio.map((asset) => (
                    <div key={asset.id} className="rounded border border-stone-700 bg-stone-900 px-2 py-1">
                      {asset.name}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {virtualKeyboardOpen && (
            <div className="shrink-0 border-b border-stone-800 bg-[#191715] px-4 py-3">
              <div className="flex items-center justify-between gap-4 mb-2">
                <div className="text-[10px] uppercase tracking-[0.3em] text-stone-400">Virtual MIDI keyboard</div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-300">USB / browser controller</div>
              </div>
              <div className="flex gap-1 overflow-x-auto pb-1">
                {VIRTUAL_KEYBOARD_NOTES.map((note) => (
                  <button
                    key={note}
                    type="button"
                    onPointerDown={() => handleVirtualMIDI(note)}
                    onPointerUp={() => handleVirtualMIDI(note)}
                    className={`min-w-[38px] rounded-t border px-1 py-2 text-[10px] font-semibold ${note.includes('#') ? 'border-stone-700 bg-stone-900 text-stone-100 shadow-inner shadow-black/40' : 'border-amber-500/40 bg-amber-500/10 text-amber-200'}`}
                  >
                    {note}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Main Virtual Studio Infinite Stacked Rack Display */}
          <main className="poietek-legacy-rack-main min-h-0 flex flex-1 flex-col overflow-hidden p-4">
            {isFlipped ? (
              /* REAR PANEL VIEW WITH CABLES */
              <StudioRearPanel
                rackModules={rackModules}
                onToggleFlip={() => setIsFlipped(false)}
              />
            ) : (
              /* Infinite hardware-inspired stacked rack modules */
              <RackStackManager
                rackModules={rackModules}
                setRackModules={setRackModules}
                masterState={masterState}
                setMasterState={setMasterState}
                pads={pads}
                setPads={setPads}
                channels={channels}
                setChannels={setChannels}
                connectedDevices={connectedDevices}
                handleSimulateMIDI={handleSimulateMIDI}
                onDetachWorkspace={handleDetachWorkspace}
                onToggleFlip={() => setIsFlipped((prev) => !prev)}
                onUndo={handleUndo}
                onRedo={handleRedo}
                canUndo={canUndo}
                canRedo={canRedo}
                zoom={rackZoom}
                onZoomChange={setRackZoom}
                autoFit={rackAutoFit}
                onAutoFitChange={setRackAutoFit}
                project={canonicalProject}
                activeProjectMixSceneId={activeProjectMixSceneId}
                projectEditBusy={projectEditBusy}
                canUndoProject={canUndoProject}
                canRedoProject={canRedoProject}
                onApplyProjectMixScene={handleApplyProjectMixScene}
                onInitializeTrackingConsole={handleInitializeTrackingConsole}
                onMutateTrackingConsole={handleMutateTrackingConsole}
                onCreateTakeComp={handleCreateTakeComp}
                onSelectTakeForSegment={handleSelectTakeForSegment}
                onCommitTakeComp={handleCommitTakeComp}
                onCreateStarterMidiClip={handleCreateStarterMidiClip}
                onCommitMidiOperation={handleCommitMidiOperation}
                onInitializeTechniqueMatrix={handleInitializeTechniqueMatrix}
                onCommitTechniquePlan={handleCommitTechniquePlan}
                onMutateLiveSession={handleMutateLiveSession}
                onMutatePicturePost={handleMutatePicturePost}
                onMutateSequenceAssembly={handleMutateSequenceAssembly}
                onMutateBatchDelivery={handleMutateBatchDelivery}
                onMutateActionWorkflow={handleMutateActionWorkflow}
                onRunActionRecipe={handleRunActionRecipe}
                onRunCycleAction={handleRunCycleAction}
                onMutateModulationWorkflow={handleMutateModulationWorkflow}
                onInitializePerformanceCanvas={handleInitializePerformanceCanvas}
                onMutatePerformanceCanvas={handleMutatePerformanceCanvas}
                onCommitPerformanceCapture={handleCommitPerformanceCapture}
                onInitializeProductionRegions={handleInitializeProductionRegions}
                onCaptureProductionRegion={handleCaptureProductionRegion}
                onApplyProductionRegionAction={handleApplyProductionRegionAction}
                onInitializeEditorial={handleInitializeEditorial}
                onSaveEditorialMemory={handleSaveEditorialMemory}
                onRecallEditorialMemory={handleRecallEditorialMemory}
                onCreateEditorialClipGroup={handleCreateEditorialClipGroup}
                onApplyEditorialBatchRename={handleApplyEditorialBatchRename}
                onSetEditorialEditPolicy={handleSetEditorialEditPolicy}
                onUndoProject={handleUndoProject}
                onRedoProject={handleRedoProject}
              />
            )}
          </main>
        </div>

        <RackRightSidebar
          isOpen={isRackLibraryOpen}
          onToggle={() => setIsRackLibraryOpen((current) => !current)}
          activeWorkspace={masterState.activeWorkspace}
          onSelectWorkspace={(workspace) => setMasterState((current) => ({...current, activeWorkspace: workspace}))}
          onAddModule={handleAddModuleToRack}
          onToggleFlip={() => setIsFlipped((current) => !current)}
          isFlipped={isFlipped}
          openAIGrooveModal={() => setIsAIGrooveOpen(true)}
          openTemplatesModal={() => setIsTemplatesOpen(true)}
          onDetachWorkspace={() => handleDetachWorkspace(masterState.activeWorkspace)}
          autoHideBars={autoHideBars}
          setAutoHideBars={setAutoHideBars}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
        />
      </div>

      {/* Fixed Bottom Studio Transport Console */}
      <div
        className={`poietek-rack-transport transition-all duration-300 z-40 ${
          autoHideBars
            ? 'h-2 hover:h-auto overflow-hidden opacity-30 hover:opacity-100 bg-amber-500/30'
            : ''
        }`}
      >
        <StudioTransport
          masterState={masterState}
          setMasterState={setMasterState}
          connectedDevices={connectedDevices}
          onTriggerPlayStop={handleTogglePlayStop}
          onTapTempo={handleTapTempo}
          isFlipped={isFlipped}
          onToggleFlip={() => setIsFlipped((prev) => !prev)}
          openAIGrooveModal={() => setIsAIGrooveOpen(true)}
        />
      </div>

      {/* Starter Songs & Custom Templates Modal */}
      <TemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onLoadTemplate={handleLoadTemplate}
        currentRackModules={rackModules}
        bpm={masterState.bpm}
      />

      {/* Previewable local groove-assistant concept */}
      <GenerativeGrooveModal
        isOpen={isAIGrooveOpen}
        onClose={() => setIsAIGrooveOpen(false)}
        onApplyGroove={handleApplyAIGroove}
      />

      {/* Detachable Multi-Window Floating System */}
      <FloatingWindowManager
        detachedWorkspaces={detachedWorkspaces}
        onDockWorkspace={handleDockWorkspace}
        masterState={masterState}
        setMasterState={setMasterState}
        connectedDevices={connectedDevices}
        openAIGrooveModal={() => setIsAIGrooveOpen(true)}
      />
    </div>
  );
}
