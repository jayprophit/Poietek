import type {PoietekProject} from '../domain/types';
import {
  EDITORIAL_WORKFLOW_EXTENSION_KEY,
  type CreateEditorialClipGroupInput,
  type EditorialBatchRenamePlan,
  type EditorialEditPolicy,
  type EditorialWorkflowState,
  type SaveEditorialMemoryInput,
} from './contracts';
import {
  applyEditorialBatchRenamePlan,
  createEditorialClipGroup,
  createEditorialWorkflowState,
  recallEditorialMemory,
  saveEditorialMemory,
  setEditorialEditPolicy,
  toggleEditorialTrackPin,
  validateEditorialWorkflowState,
} from './editorial';

export function getProjectEditorialWorkflow(project: PoietekProject): EditorialWorkflowState | null {
  const value = project.extensions[EDITORIAL_WORKFLOW_EXTENSION_KEY];
  if (value == null) return null;
  const state = structuredClone(value) as EditorialWorkflowState;
  const issues = validateEditorialWorkflowState(state, project);
  if (issues.length) throw new Error(`Invalid Editorial Memory state: ${issues.join(' ')}`);
  return state;
}

export function withProjectEditorialWorkflow(
  project: PoietekProject,
  state: EditorialWorkflowState,
): PoietekProject {
  const issues = validateEditorialWorkflowState(state, project);
  if (issues.length) throw new Error(`Cannot save Editorial Memory state: ${issues.join(' ')}`);
  return {...project, extensions: {...project.extensions, [EDITORIAL_WORKFLOW_EXTENSION_KEY]: structuredClone(state)}};
}

function requireState(project: PoietekProject): EditorialWorkflowState {
  return getProjectEditorialWorkflow(project) ?? createEditorialWorkflowState(project.id);
}

export function createStarterEditorialProject(
  project: PoietekProject,
  observedAt = new Date().toISOString(),
): PoietekProject {
  const existing = getProjectEditorialWorkflow(project);
  if (existing?.memoryLocations.length) throw new Error('Editorial Memory starter locations already exist for this project.');
  const bar = project.settings.ppq * 4;
  const orderedTrackIds = [...project.tracks].sort((left, right) => left.order - right.order).map((track) => track.id);
  let state = existing ?? createEditorialWorkflowState(project.id);
  state = saveEditorialMemory(project, state, {
    id: 'editorial.memory.session-start', name: 'Session Start', color: '#22d3ee', kind: 'point', startTick: 0, durationTicks: 0,
    notes: 'Stable return point at the beginning of the canonical project.', createdAt: observedAt, operationId: 'editorial.starter.memory.start',
  });
  state = saveEditorialMemory(project, state, {
    id: 'editorial.memory.first-eight', name: 'First Eight Bars', color: '#a78bfa', kind: 'range', startTick: 0, durationTicks: bar * 8,
    trackIds: orderedTrackIds, preRollTicks: bar, postRollTicks: bar, notes: 'Saved editorial range with one-bar context on both sides.', createdAt: observedAt, operationId: 'editorial.starter.memory.range',
  });
  state = saveEditorialMemory(project, state, {
    id: 'editorial.memory.focus-view', name: 'Primary Track Focus', color: '#f59e0b', kind: 'view', startTick: 0, durationTicks: bar * 4,
    trackIds: orderedTrackIds.slice(0, 4), notes: 'Track focus is durable; actual window geometry remains device-local.', createdAt: observedAt, operationId: 'editorial.starter.memory.view',
  });
  state = {
    ...state,
    pinnedTrackIds: state.pinnedTrackIds.length ? [...state.pinnedTrackIds] : orderedTrackIds.slice(0, 3),
    activeSelection: {startTick: 0, durationTicks: bar * 8, trackIds: orderedTrackIds, linkedToTransport: true},
  };
  return withProjectEditorialWorkflow(project, state);
}

export function saveProjectEditorialMemory(project: PoietekProject, input: SaveEditorialMemoryInput): PoietekProject {
  return withProjectEditorialWorkflow(project, saveEditorialMemory(project, requireState(project), input));
}

export function recallProjectEditorialMemory(
  project: PoietekProject,
  memoryId: string,
  operationId: string,
  performedAt?: string,
): PoietekProject {
  return withProjectEditorialWorkflow(project, recallEditorialMemory(project, requireState(project), memoryId, operationId, performedAt));
}

export function createProjectEditorialClipGroup(project: PoietekProject, input: CreateEditorialClipGroupInput): PoietekProject {
  return withProjectEditorialWorkflow(project, createEditorialClipGroup(project, requireState(project), input));
}

export function applyProjectEditorialBatchRename(
  project: PoietekProject,
  plan: EditorialBatchRenamePlan,
  performedAt?: string,
): PoietekProject {
  const result = applyEditorialBatchRenamePlan(project, requireState(project), plan, performedAt);
  return withProjectEditorialWorkflow(result.project, result.state);
}

export function setProjectEditorialEditPolicy(
  project: PoietekProject,
  policy: EditorialEditPolicy,
  operationId: string,
  performedAt?: string,
): PoietekProject {
  return withProjectEditorialWorkflow(project, setEditorialEditPolicy(requireState(project), policy, operationId, performedAt));
}

export function toggleProjectEditorialTrackPin(
  project: PoietekProject,
  trackId: string,
  operationId: string,
  performedAt?: string,
): PoietekProject {
  return withProjectEditorialWorkflow(project, toggleEditorialTrackPin(project, requireState(project), trackId, operationId, performedAt));
}
