import type {PoietekProject, Track} from '../domain/types';
import {updateTrackMixer} from '../project/editOperations';
import type {
  CompositionWorkflowState,
  LyricCue,
  MixScene,
  PatternStep,
  SongArrangementVariant,
  SongSection,
} from './contracts';
import {addMixScene, createMixScene, upsertMixScene} from './mixScenes';
import {
  addArrangementLane,
  addPatternChannel,
  addPatternToWorkflow,
  clonePattern,
  createPattern,
  createCompositionWorkflowState,
  getProjectCompositionWorkflow,
  placeArrangementClip,
  replacePatternInWorkflow,
  setPatternStep,
  withProjectCompositionWorkflow,
} from './patterns';
import {addSongArrangement, addSongSection, upsertLyricCue} from './songMap';

export type CompositionWorkflowMutation = (state: CompositionWorkflowState) => CompositionWorkflowState;

export const PATTERN_RACK_STARTER_PATTERN_ID = 'poietek-beat-seed' as const;
export const PATTERN_RACK_LANE_ID = 'poietek-pattern-lane' as const;

export type PatternRackAction =
  | {type: 'initialize_starter'}
  | {type: 'toggle_step'; patternId: string; channelId: string; stepIndex: number; note: number}
  | {type: 'set_swing'; patternId: string; swing: number}
  | {type: 'clone_pattern'; patternId: string}
  | {type: 'place_next'; patternId: string};

const starterChannels = [
  {id: 'kick', name: 'Kick trigger', note: 36, color: '#22d3ee', kind: 'sampler', active: [0, 4, 8, 12]},
  {id: 'snare', name: 'Snare trigger', note: 38, color: '#fb7185', kind: 'sampler', active: [4, 12]},
  {id: 'hat', name: 'Closed hat trigger', note: 42, color: '#fbbf24', kind: 'sampler', active: [0, 2, 4, 6, 8, 10, 12, 14]},
  {id: 'bass', name: 'Bass note lane', note: 43, color: '#a78bfa', kind: 'instrument', active: [0, 6, 8, 14]},
] as const;

function createStarterPattern() {
  let pattern = {...createPattern(PATTERN_RACK_STARTER_PATTERN_ID, 'Poietek Beat Seed'), swing: 0.55};
  for (const definition of starterChannels) {
    pattern = addPatternChannel(pattern, {
      id: definition.id,
      name: definition.name,
      kind: definition.kind,
      color: definition.color,
      targetModuleId: null,
      mixerTargetId: null,
      muted: false,
      solo: false,
    });
    for (const stepIndex of definition.active) {
      pattern = setPatternStep(pattern, definition.id, stepIndex, {
        note: definition.note,
        velocity: stepIndex % 4 === 0 ? 116 : 98,
        probability: 1,
        microShiftTicks: 0,
        lengthSteps: 1,
      });
    }
  }
  return pattern;
}

function getPatternOrThrow(state: CompositionWorkflowState, patternId: string) {
  const pattern = state.patterns.find((candidate) => candidate.id === patternId);
  if (!pattern) throw new Error(`Pattern ${patternId} was not found.`);
  return pattern;
}

function nextAvailableId(base: string, used: ReadonlySet<string>): string {
  if (!used.has(base)) return base;
  let index = 2;
  while (used.has(`${base}-${index}`)) index += 1;
  return `${base}-${index}`;
}

function patternDurationTicks(pattern: ReturnType<typeof createPattern>): number {
  return Math.max(1, Math.round(pattern.stepCount * (480 / pattern.stepsPerBeat)));
}

export function mutateProjectCompositionWorkflow(
  project: PoietekProject,
  mutation: CompositionWorkflowMutation,
): PoietekProject {
  const current = getProjectCompositionWorkflow(project) ?? createCompositionWorkflowState(project.id);
  const next = mutation(current);
  if (next.projectId !== project.id) throw new Error('Composition command returned state for another project.');
  return withProjectCompositionWorkflow(project, next);
}

export function createStarterPatternRackProject(project: PoietekProject): PoietekProject {
  return mutateProjectCompositionWorkflow(project, (state) => {
    if (state.patterns.length) return state;
    let next = addPatternToWorkflow(state, createStarterPattern());
    if (!next.lanes.some((lane) => lane.id === PATTERN_RACK_LANE_ID)) {
      next = addArrangementLane(next, {
        id: PATTERN_RACK_LANE_ID,
        name: 'Pattern ideas',
        binding: 'instrument',
        targetId: null,
      });
    }
    return next;
  });
}

export function toggleProjectPatternStep(
  project: PoietekProject,
  patternId: string,
  channelId: string,
  stepIndex: number,
  note: number,
): PoietekProject {
  if (!Number.isInteger(note) || note < 0 || note > 127) {
    throw new Error('Pattern step note must be a MIDI note from 0 to 127.');
  }
  return mutateProjectCompositionWorkflow(project, (state) => {
    const pattern = getPatternOrThrow(state, patternId);
    const channel = pattern.channels.find((candidate) => candidate.id === channelId);
    if (!channel) throw new Error(`Pattern channel ${channelId} was not found.`);
    const existing = channel.steps.find((step) => step.stepIndex === stepIndex);
    const step: Omit<PatternStep, 'stepIndex'> | null = existing ? null : {
      note,
      velocity: stepIndex % pattern.stepsPerBeat === 0 ? 116 : 98,
      probability: 1,
      microShiftTicks: 0,
      lengthSteps: 1,
    };
    return replacePatternInWorkflow(state, setPatternStep(pattern, channelId, stepIndex, step));
  });
}

export function setProjectPatternSwing(
  project: PoietekProject,
  patternId: string,
  swing: number,
): PoietekProject {
  if (!Number.isFinite(swing) || swing < 0 || swing > 1) {
    throw new Error('Pattern swing must be between 0 and 1.');
  }
  return mutateProjectCompositionWorkflow(project, (state) => {
    const pattern = getPatternOrThrow(state, patternId);
    return replacePatternInWorkflow(state, {...pattern, swing});
  });
}

export function cloneProjectPatternVariation(
  project: PoietekProject,
  patternId: string,
): PoietekProject {
  return mutateProjectCompositionWorkflow(project, (state) => {
    const pattern = getPatternOrThrow(state, patternId);
    const usedIds = new Set(state.patterns.map((candidate) => candidate.id));
    const id = nextAvailableId(`${pattern.id}-variation`, usedIds);
    return addPatternToWorkflow(state, clonePattern(pattern, id, `${pattern.name} variation`));
  });
}

export function placeProjectPatternNext(
  project: PoietekProject,
  patternId: string,
): PoietekProject {
  return mutateProjectCompositionWorkflow(project, (state) => {
    const pattern = getPatternOrThrow(state, patternId);
    let next = state;
    let lane = next.lanes.find((candidate) => candidate.binding === 'instrument');
    if (!lane) {
      const usedLaneIds = new Set(next.lanes.map((candidate) => candidate.id));
      const laneId = nextAvailableId(PATTERN_RACK_LANE_ID, usedLaneIds);
      next = addArrangementLane(next, {
        id: laneId,
        name: 'Pattern ideas',
        binding: 'instrument',
        targetId: null,
      });
      lane = next.lanes.find((candidate) => candidate.id === laneId);
    }
    if (!lane) throw new Error('Pattern arrangement lane could not be created.');
    const durationTicks = patternDurationTicks(pattern);
    const startTick = lane.clips.reduce(
      (latest, clip) => Math.max(latest, clip.startTick + clip.durationTicks),
      0,
    );
    const usedClipIds = new Set(next.lanes.flatMap((candidate) => candidate.clips.map((clip) => clip.id)));
    const clipId = nextAvailableId(`${pattern.id}-clip`, usedClipIds);
    return placeArrangementClip(next, lane.id, {
      id: clipId,
      sourceKind: 'pattern',
      sourceId: pattern.id,
      startTick,
      durationTicks,
      loopEnabled: true,
    });
  });
}

export function applyProjectPatternRackAction(
  project: PoietekProject,
  action: PatternRackAction,
): PoietekProject {
  switch (action.type) {
    case 'initialize_starter':
      return createStarterPatternRackProject(project);
    case 'toggle_step':
      return toggleProjectPatternStep(
        project,
        action.patternId,
        action.channelId,
        action.stepIndex,
        action.note,
      );
    case 'set_swing':
      return setProjectPatternSwing(project, action.patternId, action.swing);
    case 'clone_pattern':
      return cloneProjectPatternVariation(project, action.patternId);
    case 'place_next':
      return placeProjectPatternNext(project, action.patternId);
  }
}

export function addProjectSongSection(project: PoietekProject, section: SongSection): PoietekProject {
  return mutateProjectCompositionWorkflow(project, (state) => addSongSection(state, section));
}

export function addProjectSongArrangement(
  project: PoietekProject,
  arrangement: SongArrangementVariant,
): PoietekProject {
  return mutateProjectCompositionWorkflow(project, (state) => addSongArrangement(state, arrangement));
}

export function upsertProjectLyricCue(project: PoietekProject, cue: LyricCue): PoietekProject {
  return mutateProjectCompositionWorkflow(project, (state) => upsertLyricCue(state, cue));
}

export function addProjectMixScene(project: PoietekProject, scene: MixScene): PoietekProject {
  return mutateProjectCompositionWorkflow(project, (state) => addMixScene(state, scene));
}

export function upsertProjectMixScene(project: PoietekProject, scene: MixScene): PoietekProject {
  return mutateProjectCompositionWorkflow(project, (state) => upsertMixScene(state, scene));
}

export type ProjectTrackMixScenePatches = Readonly<Record<string, Partial<Track['mixer']>>>;

export function createProjectTrackMixScene(
  project: PoietekProject,
  sceneId: string,
  sceneName: string,
  patches: ProjectTrackMixScenePatches = {},
  createdAt = new Date().toISOString(),
): MixScene {
  if (!project.tracks.length) throw new Error('A project mix scene requires at least one canonical track.');
  const knownTrackIds = new Set(project.tracks.map((track) => track.id));
  for (const trackId of Object.keys(patches)) {
    if (!knownTrackIds.has(trackId)) throw new Error(`Mix scene patch track ${trackId} was not found.`);
  }
  return createMixScene(sceneId, sceneName, project.tracks.map((track) => ({
    targetId: track.id,
    kind: 'track',
    ...track.mixer,
    ...patches[track.id],
    processorStateReferences: {},
  })), createdAt);
}

export function saveAndApplyProjectMixScene(project: PoietekProject, scene: MixScene): PoietekProject {
  return applyProjectMixScene(upsertProjectMixScene(project, scene), scene.id);
}

export function applyProjectMixScene(project: PoietekProject, sceneId: string): PoietekProject {
  const state = getProjectCompositionWorkflow(project);
  if (!state) throw new Error('The project does not contain composition workflow state.');
  const scene = state.mixScenes.find((candidate) => candidate.id === sceneId);
  if (!scene) throw new Error(`Mix scene ${sceneId} was not found.`);

  let nextProject = project;
  for (const target of scene.targets) {
    if (target.kind !== 'track') throw new Error(`Mix scene target ${target.targetId} requires unsupported ${target.kind} recall.`);
    if (Object.keys(target.processorStateReferences).length) throw new Error(`Mix scene target ${target.targetId} requires a processor-state adapter.`);
    if (!nextProject.tracks.some((track) => track.id === target.targetId)) throw new Error(`Mix scene target track ${target.targetId} was not found.`);
    nextProject = updateTrackMixer(nextProject, target.targetId, {
      gainDb: target.gainDb,
      pan: target.pan,
      mute: target.mute,
      solo: target.solo,
    });
  }

  const nextState: CompositionWorkflowState = {
    ...state,
    revision: state.revision + 1,
    activeMixSceneId: sceneId,
  };
  return withProjectCompositionWorkflow(nextProject, nextState);
}
