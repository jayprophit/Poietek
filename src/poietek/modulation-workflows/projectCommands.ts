import type {PoietekProject} from '../domain/types';
import type {ModulationWorkflowState} from './contracts';
import {MODULATION_WORKFLOW_EXTENSION_KEY} from './contracts';
import {
  createModulationWorkflowState,
  recallMotionScene,
  validateModulationWorkflowState,
} from './matrix';

export function withProjectModulationWorkflowState(
  project: PoietekProject,
  state: ModulationWorkflowState,
): PoietekProject {
  const issues = validateModulationWorkflowState(state, project);
  if (issues.length) throw new Error(issues.join(' '));
  return {
    ...project,
    updatedAt: new Date().toISOString(),
    extensions: {...project.extensions, [MODULATION_WORKFLOW_EXTENSION_KEY]: structuredClone(state)},
  };
}

export function getProjectModulationWorkflowState(project: PoietekProject): ModulationWorkflowState | null {
  const value = project.extensions[MODULATION_WORKFLOW_EXTENSION_KEY];
  if (value === undefined) return null;
  if (!value || typeof value !== 'object') throw new Error('Modulation workflow extension is malformed.');
  const state = value as ModulationWorkflowState;
  const issues = validateModulationWorkflowState(state, project);
  if (issues.length) throw new Error(issues.join(' '));
  return structuredClone(state);
}

export type ModulationWorkflowMutation = (state: ModulationWorkflowState) => ModulationWorkflowState;

export function mutateProjectModulationWorkflowState(
  project: PoietekProject,
  mutation: ModulationWorkflowMutation,
): PoietekProject {
  const current = getProjectModulationWorkflowState(project) ?? createModulationWorkflowState(project.id);
  const next = mutation(current);
  return withProjectModulationWorkflowState(project, next);
}

export function recallProjectMotionScene(project: PoietekProject, sceneId: string): PoietekProject {
  const state = getProjectModulationWorkflowState(project);
  if (!state) throw new Error('The project has no saved modulation workflow.');
  return withProjectModulationWorkflowState(project, recallMotionScene(state, sceneId));
}
