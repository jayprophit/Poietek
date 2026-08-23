import type {PoietekProject} from '../domain/types';
import {
  addArrangementLane,
  addPatternChannel,
  addPatternToWorkflow,
  createCompositionWorkflowState,
  createPattern,
  getProjectCompositionWorkflow,
  placeArrangementClip,
  setPatternStep,
  withProjectCompositionWorkflow,
  type CompositionPattern,
  type CompositionWorkflowState,
} from '../composition-workflows';
import {
  PERFORMANCE_CANVAS_EXTENSION_KEY,
  type PerformanceCanvasState,
  type PerformanceFollowAction,
  type PerformanceLaunchMode,
} from './contracts';
import {
  buildArrangementCapturePlan,
  createPerformanceCanvasState,
  markPerformanceCaptureCommitted,
  validatePerformanceCanvasState,
} from './canvas';

interface StarterSceneSpec {
  id: string;
  name: string;
  color: string;
  followAction: PerformanceFollowAction;
  followAfterBars: number;
  launchMode: PerformanceLaunchMode;
}

interface StarterLaneSpec {
  id: string;
  name: string;
  color: string;
  note: number;
  stepSets: readonly (readonly number[])[];
}

const STARTER_SCENES: readonly StarterSceneSpec[] = [
  {id: 'scene.spark', name: 'Spark', color: '#22d3ee', followAction: 'next', followAfterBars: 2, launchMode: 'toggle'},
  {id: 'scene.drive', name: 'Drive', color: '#f97316', followAction: 'next', followAfterBars: 4, launchMode: 'repeat'},
  {id: 'scene.air', name: 'Air', color: '#a78bfa', followAction: 'next', followAfterBars: 2, launchMode: 'gate'},
  {id: 'scene.resolve', name: 'Resolve', color: '#34d399', followAction: 'stop', followAfterBars: 2, launchMode: 'trigger'},
];

const STARTER_LANES: readonly StarterLaneSpec[] = [
  {id: 'lane.pulse', name: 'Pulse', color: '#fb7185', note: 36, stepSets: [[0, 4, 8, 12], [0, 3, 6, 8, 11, 14], [0, 8], [0, 4, 10]]},
  {id: 'lane.low', name: 'Low Current', color: '#38bdf8', note: 43, stepSets: [[0, 8], [0, 6, 8, 14], [0, 12], [0, 7]]},
  {id: 'lane.light', name: 'Harmony Light', color: '#c084fc', note: 60, stepSets: [[0, 8], [0, 4, 8, 12], [0], [0, 10]]},
];

function createStarterPattern(
  lane: StarterLaneSpec,
  scene: StarterSceneSpec,
  sceneIndex: number,
): CompositionPattern {
  const patternId = 'performance.pattern.' + lane.id.slice(5) + '.' + scene.id.slice(6);
  let pattern = createPattern(patternId, scene.name + ' · ' + lane.name, 16, 4);
  pattern = addPatternChannel(pattern, {
    id: patternId + '.notes',
    name: lane.name,
    kind: 'instrument',
    color: lane.color,
    targetModuleId: null,
    mixerTargetId: null,
    muted: false,
    solo: false,
  });
  const steps = lane.stepSets[sceneIndex] ?? [];
  for (const [noteIndex, stepIndex] of steps.entries()) {
    pattern = setPatternStep(pattern, patternId + '.notes', stepIndex, {
      note: Math.min(127, lane.note + (sceneIndex === 3 && noteIndex === steps.length - 1 ? 5 : 0)),
      velocity: Math.min(127, 82 + sceneIndex * 8 + (noteIndex % 2) * 9),
      probability: sceneIndex === 2 && noteIndex > 0 ? 0.75 : 1,
      microShiftTicks: 0,
      lengthSteps: lane.id === 'lane.pulse' ? 0.5 : 2,
    });
  }
  return pattern;
}

export function createStarterPerformanceCanvasState(
  projectId: string,
  barLengthTicks: number,
): PerformanceCanvasState {
  const state = createPerformanceCanvasState(projectId, barLengthTicks);
  const lanes = STARTER_LANES.map((lane) => ({
    id: lane.id,
    name: lane.name,
    color: lane.color,
    arrangementLaneId: 'performance.arrangement.' + lane.id.slice(5),
    targetTrackId: null,
  }));
  const scenes = STARTER_SCENES.map(({launchMode: _launchMode, ...scene}) => scene);
  const slots = STARTER_LANES.flatMap((lane) => STARTER_SCENES.map((scene, sceneIndex) => ({
    id: 'slot.' + lane.id.slice(5) + '.' + scene.id.slice(6),
    laneId: lane.id,
    sceneId: scene.id,
    name: scene.name + ' ' + lane.name,
    sourceKind: 'pattern' as const,
    sourceId: 'performance.pattern.' + lane.id.slice(5) + '.' + scene.id.slice(6),
    lengthTicks: barLengthTicks * (sceneIndex === 1 ? 2 : 1),
    loopEnabled: true,
    launchMode: scene.launchMode,
    legato: sceneIndex === 2,
  })));
  return {
    ...state,
    revision: 1,
    lanes,
    scenes,
    slots,
    activeSlotIdsByLane: Object.fromEntries(lanes.map((lane) => [lane.id, null])),
  };
}

function addStarterCompositionData(
  state: CompositionWorkflowState,
): CompositionWorkflowState {
  let next = state;
  for (const lane of STARTER_LANES) {
    const arrangementLaneId = 'performance.arrangement.' + lane.id.slice(5);
    if (next.lanes.some((candidate) => candidate.id === arrangementLaneId)) {
      throw new Error('Performance Canvas starter arrangement lane ' + arrangementLaneId + ' already exists.');
    }
    next = addArrangementLane(next, {
      id: arrangementLaneId,
      name: lane.name + ' performance',
      binding: 'instrument',
      targetId: null,
    });
    for (const [sceneIndex, scene] of STARTER_SCENES.entries()) {
      const pattern = createStarterPattern(lane, scene, sceneIndex);
      if (next.patterns.some((candidate) => candidate.id === pattern.id)) {
        throw new Error('Performance Canvas starter pattern ' + pattern.id + ' already exists.');
      }
      next = addPatternToWorkflow(next, pattern);
    }
  }
  return next;
}

export function withProjectPerformanceCanvasState(
  project: PoietekProject,
  state: PerformanceCanvasState,
): PoietekProject {
  const issues = validatePerformanceCanvasState(state, project);
  if (issues.length) throw new Error(issues.join(' '));
  return {
    ...project,
    updatedAt: new Date().toISOString(),
    extensions: {...project.extensions, [PERFORMANCE_CANVAS_EXTENSION_KEY]: structuredClone(state)},
  };
}

export function getProjectPerformanceCanvasState(project: PoietekProject): PerformanceCanvasState | null {
  const value = project.extensions[PERFORMANCE_CANVAS_EXTENSION_KEY];
  if (value === undefined) return null;
  if (!value || typeof value !== 'object') throw new Error('Performance Canvas extension is malformed.');
  const state = value as PerformanceCanvasState;
  const issues = validatePerformanceCanvasState(state, project);
  if (issues.length) throw new Error(issues.join(' '));
  return structuredClone(state);
}

export type PerformanceCanvasMutation = (state: PerformanceCanvasState) => PerformanceCanvasState;

export function mutateProjectPerformanceCanvasState(
  project: PoietekProject,
  mutation: PerformanceCanvasMutation,
): PoietekProject {
  const current = getProjectPerformanceCanvasState(project);
  if (!current) throw new Error('Create a Performance Canvas before editing it.');
  return withProjectPerformanceCanvasState(project, mutation(current));
}

export function createStarterPerformanceCanvasProject(project: PoietekProject): PoietekProject {
  if (getProjectPerformanceCanvasState(project)) throw new Error('This project already contains a Performance Canvas.');
  const currentComposition = getProjectCompositionWorkflow(project) ?? createCompositionWorkflowState(project.id);
  const nextComposition = addStarterCompositionData(currentComposition);
  const projectWithComposition = withProjectCompositionWorkflow(project, nextComposition);
  const state = createStarterPerformanceCanvasState(project.id, project.settings.ppq * 4);
  return withProjectPerformanceCanvasState(projectWithComposition, state);
}

export function commitProjectPerformanceCapture(
  project: PoietekProject,
  commitId: string,
  insertionTick = 0,
): PoietekProject {
  const performance = getProjectPerformanceCanvasState(project);
  const composition = getProjectCompositionWorkflow(project);
  if (!performance || !composition) throw new Error('Performance Canvas and composition state are required for arrangement capture.');
  const plan = buildArrangementCapturePlan(performance, commitId, insertionTick);
  let nextComposition = composition;
  for (const entry of plan.entries) {
    nextComposition = placeArrangementClip(nextComposition, entry.arrangementLaneId, {
      id: entry.clipId,
      sourceKind: entry.sourceKind,
      sourceId: entry.sourceId,
      startTick: entry.startTick,
      durationTicks: entry.durationTicks,
      loopEnabled: entry.loopEnabled,
    });
  }
  const withArrangement = withProjectCompositionWorkflow(project, nextComposition);
  return withProjectPerformanceCanvasState(withArrangement, markPerformanceCaptureCommitted(performance, commitId));
}
