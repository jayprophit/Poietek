import type {PoietekProject} from '../domain/types';
import {
  addArrangementLane,
  addAutomationEnvelope,
  addPatternChannel,
  addPatternToWorkflow,
  createAutomationEnvelope,
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
  PRODUCTION_REGION_EXTENSION_KEY,
  type CaptureProductionRegionInput,
  type ProductionRegionAction,
  type ProductionRegionActionPlan,
  type ProductionRegionMemberReference,
  type ProductionRegionState,
} from './contracts';
import {
  buildProductionRegionActionPlan,
  captureProductionRegion,
  createProductionRegionState,
  validateProductionRegionState,
} from './regions';

interface StarterRegionSection {
  id: string;
  name: string;
  color: string;
  rhythmSteps: readonly number[];
  harmonySteps: readonly number[];
  harmonyNote: number;
  energy: readonly [number, number];
}

const STARTER_REGION_SECTIONS: readonly StarterRegionSection[] = [
  {id: 'foundation', name: 'Foundation', color: '#22d3ee', rhythmSteps: [0, 4, 8, 12], harmonySteps: [0, 8], harmonyNote: 48, energy: [0.32, 0.46]},
  {id: 'lift', name: 'Lift', color: '#f97316', rhythmSteps: [0, 3, 6, 8, 11, 14], harmonySteps: [0, 4, 8, 12], harmonyNote: 53, energy: [0.62, 0.82]},
  {id: 'release', name: 'Release', color: '#a78bfa', rhythmSteps: [0, 8, 12], harmonySteps: [0, 10], harmonyNote: 55, energy: [0.54, 0.28]},
];

function createStarterPattern(
  section: StarterRegionSection,
  role: 'rhythm' | 'harmony',
): CompositionPattern {
  const id = `production-regions.pattern.${role}.${section.id}`;
  let pattern = createPattern(id, `${section.name} · ${role === 'rhythm' ? 'Rhythm Current' : 'Harmony Field'}`, 16, 4);
  pattern = addPatternChannel(pattern, {
    id: `${id}.notes`,
    name: role === 'rhythm' ? 'Rhythm Current' : 'Harmony Field',
    kind: 'instrument',
    color: role === 'rhythm' ? '#fb7185' : '#c084fc',
    targetModuleId: null,
    mixerTargetId: null,
    muted: false,
    solo: false,
  });
  const steps = role === 'rhythm' ? section.rhythmSteps : section.harmonySteps;
  for (const [index, stepIndex] of steps.entries()) {
    pattern = setPatternStep(pattern, `${id}.notes`, stepIndex, {
      note: role === 'rhythm' ? (index % 3 === 1 ? 38 : 36) : section.harmonyNote + (index % 2 ? 7 : 0),
      velocity: Math.min(127, 82 + index * 5 + (section.id === 'lift' ? 8 : 0)),
      probability: section.id === 'release' && index > 0 ? 0.82 : 1,
      microShiftTicks: 0,
      lengthSteps: role === 'rhythm' ? 0.5 : 4,
    });
  }
  return pattern;
}

function addStarterComposition(
  state: CompositionWorkflowState,
  barLengthTicks: number,
): CompositionWorkflowState {
  const laneSpecs = [
    {id: 'production-regions.lane.rhythm', name: 'Rhythm Current', color: '#fb7185'},
    {id: 'production-regions.lane.harmony', name: 'Harmony Field', color: '#c084fc'},
  ] as const;
  let next = state;
  for (const lane of laneSpecs) {
    next = addArrangementLane(next, {id: lane.id, name: lane.name, binding: 'instrument', targetId: null});
  }
  const durationTicks = barLengthTicks * 2;
  for (const [sectionIndex, section] of STARTER_REGION_SECTIONS.entries()) {
    const startTick = sectionIndex * durationTicks;
    for (const role of ['rhythm', 'harmony'] as const) {
      const pattern = createStarterPattern(section, role);
      next = addPatternToWorkflow(next, pattern);
      next = placeArrangementClip(next, `production-regions.lane.${role}`, {
        id: `production-regions.clip.${role}.${section.id}`,
        sourceKind: 'pattern',
        sourceId: pattern.id,
        startTick,
        durationTicks,
        loopEnabled: true,
      });
    }
  }
  const energyPoints = STARTER_REGION_SECTIONS.flatMap((section, sectionIndex) => {
    const startTick = sectionIndex * durationTicks;
    return [
      {tick: startTick, value: section.energy[0], curve: 'smooth' as const, tension: 0.4},
      {tick: startTick + barLengthTicks, value: section.energy[1], curve: 'smooth' as const, tension: 0.4},
    ];
  });
  next = addAutomationEnvelope(next, createAutomationEnvelope(
    'production-regions.automation.energy',
    'master',
    'energy',
    energyPoints,
  ));
  return next;
}

export function withProjectProductionRegionState(
  project: PoietekProject,
  state: ProductionRegionState,
): PoietekProject {
  const issues = validateProductionRegionState(state, project);
  if (issues.length) throw new Error(issues.join(' '));
  return {
    ...project,
    updatedAt: new Date().toISOString(),
    extensions: {
      ...project.extensions,
      [PRODUCTION_REGION_EXTENSION_KEY]: structuredClone(state),
    },
  };
}

export function getProjectProductionRegionState(project: PoietekProject): ProductionRegionState | null {
  const value = project.extensions[PRODUCTION_REGION_EXTENSION_KEY];
  if (value === undefined) return null;
  if (!value || typeof value !== 'object') throw new Error('Production Regions extension is malformed.');
  const state = value as ProductionRegionState;
  const issues = validateProductionRegionState(state, project);
  if (issues.length) throw new Error(issues.join(' '));
  return structuredClone(state);
}

export type ProductionRegionMutation = (state: ProductionRegionState) => ProductionRegionState;

export function mutateProjectProductionRegionState(
  project: PoietekProject,
  mutation: ProductionRegionMutation,
): PoietekProject {
  const current = getProjectProductionRegionState(project);
  if (!current) throw new Error('Create Production Regions before editing them.');
  const next = mutation(current);
  if (next.projectId !== project.id) throw new Error('Production Regions mutation returned state for another project.');
  return withProjectProductionRegionState(project, next);
}

export function captureProjectProductionRegion(
  project: PoietekProject,
  input: CaptureProductionRegionInput,
): PoietekProject {
  const current = getProjectProductionRegionState(project) ?? createProductionRegionState(project.id);
  return withProjectProductionRegionState(project, captureProductionRegion(project, current, input));
}

function memberFromEntry(entry: ProductionRegionActionPlan['entries'][number]): ProductionRegionMemberReference {
  return {
    kind: entry.kind,
    containerId: entry.containerId,
    itemId: entry.targetItemId,
    tick: entry.kind === 'automation_point' ? entry.targetTick : null,
  };
}

function applyPlanToCanonicalProject(
  project: PoietekProject,
  plan: ProductionRegionActionPlan,
): PoietekProject {
  const audioEntries = plan.entries.filter((entry) => entry.kind === 'audio_clip');
  let nextProject: PoietekProject = {
    ...project,
    tracks: project.tracks.map((track) => {
      const entries = audioEntries.filter((entry) => entry.containerId === track.id);
      if (!entries.length) return {...track, clips: track.clips.map((clip) => ({...clip}))};
      const entryBySourceId = new Map(entries.map((entry) => [entry.sourceItemId, entry]));
      const moved = track.clips.map((clip) => {
        const entry = entryBySourceId.get(clip.id);
        return entry && plan.action === 'move' ? {...clip, startTick: entry.targetTick} : {...clip};
      });
      const copies = plan.action === 'copy' ? track.clips.flatMap((clip) => {
        const entry = entryBySourceId.get(clip.id);
        return entry ? [{...clip, id: entry.targetItemId!, name: `${clip.name} copy`, startTick: entry.targetTick}] : [];
      }) : [];
      return {...track, clips: [...moved, ...copies].sort((left, right) => left.startTick - right.startTick || left.id.localeCompare(right.id))};
    }),
  };

  const arrangementEntries = plan.entries.filter((entry) => entry.kind === 'arrangement_clip');
  const automationEntries = plan.entries.filter((entry) => entry.kind === 'automation_point');
  if (arrangementEntries.length || automationEntries.length) {
    const composition = getProjectCompositionWorkflow(nextProject);
    if (!composition) throw new Error('Production region plan requires missing composition state.');
    const nextComposition: CompositionWorkflowState = {
      ...composition,
      revision: composition.revision + 1,
      lanes: composition.lanes.map((lane) => {
        const entries = arrangementEntries.filter((entry) => entry.containerId === lane.id);
        const entryBySourceId = new Map(entries.map((entry) => [entry.sourceItemId, entry]));
        const moved = lane.clips.map((clip) => {
          const entry = entryBySourceId.get(clip.id);
          return entry && plan.action === 'move' ? {...clip, startTick: entry.targetTick} : {...clip};
        });
        const copies = plan.action === 'copy' ? lane.clips.flatMap((clip) => {
          const entry = entryBySourceId.get(clip.id);
          return entry ? [{...clip, id: entry.targetItemId!, startTick: entry.targetTick}] : [];
        }) : [];
        return {...lane, clips: [...moved, ...copies].sort((left, right) => left.startTick - right.startTick || left.id.localeCompare(right.id))};
      }),
      automationEnvelopes: composition.automationEnvelopes.map((envelope) => {
        const entries = automationEntries.filter((entry) => entry.containerId === envelope.id);
        if (!entries.length) return {...envelope, points: envelope.points.map((point) => ({...point}))};
        const entryBySourceTick = new Map(entries.map((entry) => [entry.sourceTick, entry]));
        const moved = envelope.points.map((point) => {
          const entry = entryBySourceTick.get(point.tick);
          return entry && plan.action === 'move' ? {...point, tick: entry.targetTick} : {...point};
        });
        const copies = plan.action === 'copy' ? envelope.points.flatMap((point) => {
          const entry = entryBySourceTick.get(point.tick);
          return entry ? [{...point, tick: entry.targetTick}] : [];
        }) : [];
        return {...envelope, points: [...moved, ...copies].sort((left, right) => left.tick - right.tick)};
      }),
    };
    nextProject = withProjectCompositionWorkflow(nextProject, nextComposition);
  }
  return nextProject;
}

export function applyProjectProductionRegionAction(
  project: PoietekProject,
  regionId: string,
  action: ProductionRegionAction,
  targetStartTick: number,
  operationId: string,
  performedAt = new Date().toISOString(),
): PoietekProject {
  if (Number.isNaN(Date.parse(performedAt))) throw new Error('Production region operation time is invalid.');
  const state = getProjectProductionRegionState(project);
  if (!state) throw new Error('Production Regions state is required.');
  const plan = buildProductionRegionActionPlan(project, state, regionId, action, targetStartTick, operationId);
  const sourceRegion = state.regions.find((region) => region.id === regionId)!;
  const nextProject = applyPlanToCanonicalProject(project, plan);
  const resultRegion = {
    ...sourceRegion,
    id: plan.resultRegionId,
    name: action === 'copy' ? `${sourceRegion.name} copy` : sourceRegion.name,
    startTick: plan.targetStartTick,
    members: plan.entries.map(memberFromEntry),
    createdAt: action === 'copy' ? performedAt : sourceRegion.createdAt,
  };
  const nextState: ProductionRegionState = {
    ...state,
    revision: state.revision + 1,
    regions: action === 'move'
      ? state.regions.map((region) => region.id === sourceRegion.id ? resultRegion : region)
      : [...state.regions, resultRegion],
    operationHistory: [...state.operationHistory, {
      id: plan.operationId,
      regionId: sourceRegion.id,
      resultRegionId: resultRegion.id,
      action,
      sourceStartTick: plan.sourceStartTick,
      targetStartTick: plan.targetStartTick,
      deltaTicks: plan.deltaTicks,
      memberCount: plan.entries.length,
      performedAt,
    }],
  };
  return withProjectProductionRegionState(nextProject, nextState);
}

export function createStarterProductionRegionsProject(
  project: PoietekProject,
  createdAt = new Date().toISOString(),
): PoietekProject {
  if (getProjectProductionRegionState(project)) throw new Error('This project already contains Production Regions.');
  const barLengthTicks = project.settings.ppq * 4;
  const currentComposition = getProjectCompositionWorkflow(project) ?? createCompositionWorkflowState(project.id);
  const nextComposition = addStarterComposition(currentComposition, barLengthTicks);
  let nextProject = withProjectCompositionWorkflow(project, nextComposition);
  let regionState = createProductionRegionState(project.id);
  const durationTicks = barLengthTicks * 2;
  for (const [index, section] of STARTER_REGION_SECTIONS.entries()) {
    regionState = captureProductionRegion(nextProject, regionState, {
      id: `production-region.${section.id}`,
      name: section.name,
      color: section.color,
      startTick: index * durationTicks,
      durationTicks,
      includeAudioTracks: false,
      includeArrangementLanes: true,
      includeAutomation: true,
      arrangementLaneIds: ['production-regions.lane.rhythm', 'production-regions.lane.harmony'],
      createdAt,
    });
  }
  nextProject = withProjectProductionRegionState(nextProject, regionState);
  return nextProject;
}
