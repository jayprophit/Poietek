import type {PoietekProject} from '../domain/types';
import {applyActionRecipe, createStarterActionSet, validateActionRecipe} from './actions';
import type {
  ActionRecipe,
  ActionWorkflowState,
  CycleAction,
  DeclaredWorkflowPackage,
  WorkflowPackageManifest,
} from './contracts';
import {ACTION_WORKFLOW_EXTENSION_KEY, ACTION_WORKFLOW_SCHEMA_VERSION} from './contracts';
import {declareWorkflowPackage, validateWorkflowPackageManifest} from './packages';

export function createActionWorkflowState(projectId: string): ActionWorkflowState {
  if (!projectId.trim()) throw new Error('Action workflow requires a project id.');
  return {
    schemaVersion: ACTION_WORKFLOW_SCHEMA_VERSION,
    projectId,
    revision: 0,
    recipes: [],
    cycles: [],
    packages: [],
    lastExecution: null,
  };
}

export function validateActionWorkflowState(state: ActionWorkflowState, project?: PoietekProject): string[] {
  const issues: string[] = [];
  if (state.schemaVersion !== ACTION_WORKFLOW_SCHEMA_VERSION) issues.push('Unsupported action workflow schema version.');
  if (!state.projectId.trim()) issues.push('Action workflow project id is required.');
  if (project && state.projectId !== project.id) issues.push('Action workflow belongs to another project.');
  if (!Number.isInteger(state.revision) || state.revision < 0) issues.push('Action workflow revision must be a non-negative whole number.');
  const recipeIds = new Set<string>();
  for (const recipe of state.recipes) {
    if (recipeIds.has(recipe.id)) issues.push(`Duplicate action recipe ${recipe.id}.`);
    recipeIds.add(recipe.id);
    issues.push(...validateActionRecipe(recipe));
  }
  const cycleIds = new Set<string>();
  for (const cycle of state.cycles) {
    if (!cycle.id.trim() || !cycle.name.trim()) issues.push('Cycle actions require an id and name.');
    if (cycleIds.has(cycle.id)) issues.push(`Duplicate cycle action ${cycle.id}.`);
    cycleIds.add(cycle.id);
    if (cycle.recipeIds.length < 2) issues.push(`Cycle action ${cycle.id} requires at least two recipes.`);
    if (new Set(cycle.recipeIds).size !== cycle.recipeIds.length) issues.push(`Cycle action ${cycle.id} contains duplicate recipes.`);
    if (cycle.recipeIds.some((recipeId) => !recipeIds.has(recipeId))) issues.push(`Cycle action ${cycle.id} references a missing recipe.`);
    if (!Number.isInteger(cycle.cursor) || cycle.cursor < 0 || cycle.cursor >= Math.max(1, cycle.recipeIds.length)) {
      issues.push(`Cycle action ${cycle.id} has an invalid cursor.`);
    }
  }
  const packageIds = new Set<string>();
  for (const manifest of state.packages) {
    if (packageIds.has(manifest.id)) issues.push(`Duplicate workflow package ${manifest.id}.`);
    packageIds.add(manifest.id);
    issues.push(...validateWorkflowPackageManifest(manifest));
  }
  if (state.lastExecution) {
    if (!recipeIds.has(state.lastExecution.recipeId)) issues.push('Last action execution references a missing recipe.');
    if (state.lastExecution.cycleId && !cycleIds.has(state.lastExecution.cycleId)) issues.push('Last action execution references a missing cycle.');
    if (Number.isNaN(Date.parse(state.lastExecution.executedAt))) issues.push('Last action execution time must be an ISO date.');
  }
  return issues;
}

function validateNext(state: ActionWorkflowState): ActionWorkflowState {
  const issues = validateActionWorkflowState(state);
  if (issues.length) throw new Error(issues.join(' '));
  return state;
}

export function upsertActionRecipe(state: ActionWorkflowState, recipe: ActionRecipe): ActionWorkflowState {
  const recipeIssues = validateActionRecipe(recipe);
  if (recipeIssues.length) throw new Error(recipeIssues.join(' '));
  const recipes = state.recipes.some((candidate) => candidate.id === recipe.id)
    ? state.recipes.map((candidate) => candidate.id === recipe.id ? structuredClone(recipe) : structuredClone(candidate))
    : [...state.recipes.map((candidate) => structuredClone(candidate)), structuredClone(recipe)];
  return validateNext({...state, revision: state.revision + 1, recipes});
}

export function upsertCycleAction(state: ActionWorkflowState, cycle: CycleAction): ActionWorkflowState {
  const cycles = state.cycles.some((candidate) => candidate.id === cycle.id)
    ? state.cycles.map((candidate) => candidate.id === cycle.id ? structuredClone(cycle) : structuredClone(candidate))
    : [...state.cycles.map((candidate) => structuredClone(candidate)), structuredClone(cycle)];
  return validateNext({...state, revision: state.revision + 1, cycles});
}

export function installStarterActionSet(state: ActionWorkflowState, project: PoietekProject): ActionWorkflowState {
  if (state.projectId !== project.id) throw new Error('Starter actions belong to another project.');
  const starter = createStarterActionSet(project);
  const starterRecipeIds = new Set(starter.recipes.map((recipe) => recipe.id));
  const starterCycleIds = new Set(starter.cycles.map((cycle) => cycle.id));
  return validateNext({
    ...state,
    revision: state.revision + 1,
    recipes: [...state.recipes.filter((recipe) => !starterRecipeIds.has(recipe.id)), ...starter.recipes],
    cycles: [...state.cycles.filter((cycle) => !starterCycleIds.has(cycle.id)), ...starter.cycles],
  });
}

export function addDeclaredWorkflowPackage(
  state: ActionWorkflowState,
  input: DeclaredWorkflowPackage,
): ActionWorkflowState {
  const manifest = declareWorkflowPackage(input);
  const packages = state.packages.some((candidate) => candidate.id === manifest.id)
    ? state.packages.map((candidate) => candidate.id === manifest.id ? manifest : structuredClone(candidate))
    : [...state.packages.map((candidate) => structuredClone(candidate)), manifest];
  return validateNext({...state, revision: state.revision + 1, packages});
}

export function replaceWorkflowPackage(
  state: ActionWorkflowState,
  manifest: WorkflowPackageManifest,
): ActionWorkflowState {
  if (!state.packages.some((candidate) => candidate.id === manifest.id)) throw new Error(`Workflow package ${manifest.id} was not found.`);
  const packages = state.packages.map((candidate) => candidate.id === manifest.id ? structuredClone(manifest) : structuredClone(candidate));
  return validateNext({...state, revision: state.revision + 1, packages});
}

export function withProjectActionWorkflowState(
  project: PoietekProject,
  state: ActionWorkflowState,
): PoietekProject {
  const issues = validateActionWorkflowState(state, project);
  if (issues.length) throw new Error(issues.join(' '));
  return {
    ...project,
    updatedAt: new Date().toISOString(),
    extensions: {...project.extensions, [ACTION_WORKFLOW_EXTENSION_KEY]: structuredClone(state)},
  };
}

export function getProjectActionWorkflowState(project: PoietekProject): ActionWorkflowState | null {
  const value = project.extensions[ACTION_WORKFLOW_EXTENSION_KEY];
  if (value === undefined) return null;
  if (!value || typeof value !== 'object') throw new Error('Action workflow extension is malformed.');
  const state = value as ActionWorkflowState;
  const issues = validateActionWorkflowState(state, project);
  if (issues.length) throw new Error(issues.join(' '));
  return structuredClone(state);
}

export type ActionWorkflowMutation = (state: ActionWorkflowState) => ActionWorkflowState;

export function mutateProjectActionWorkflowState(
  project: PoietekProject,
  mutation: ActionWorkflowMutation,
): PoietekProject {
  const current = getProjectActionWorkflowState(project) ?? createActionWorkflowState(project.id);
  return withProjectActionWorkflowState(project, mutation(current));
}

export function runProjectActionRecipe(
  project: PoietekProject,
  recipeId: string,
  executedAt = new Date().toISOString(),
): PoietekProject {
  const state = getProjectActionWorkflowState(project);
  if (!state) throw new Error('The project has no saved action workflow.');
  const recipe = state.recipes.find((candidate) => candidate.id === recipeId);
  if (!recipe) throw new Error(`Action recipe ${recipeId} was not found.`);
  const applied = applyActionRecipe(project, recipe);
  return withProjectActionWorkflowState(applied, {
    ...state,
    revision: state.revision + 1,
    lastExecution: {
      recipeId,
      cycleId: null,
      executedAt,
      stepCount: recipe.steps.length,
      description: recipe.name,
    },
  });
}

export function runProjectCycleAction(
  project: PoietekProject,
  cycleId: string,
  executedAt = new Date().toISOString(),
): PoietekProject {
  const state = getProjectActionWorkflowState(project);
  if (!state) throw new Error('The project has no saved action workflow.');
  const cycle = state.cycles.find((candidate) => candidate.id === cycleId);
  if (!cycle) throw new Error(`Cycle action ${cycleId} was not found.`);
  const recipeId = cycle.recipeIds[cycle.cursor];
  const recipe = state.recipes.find((candidate) => candidate.id === recipeId);
  if (!recipe) throw new Error(`Cycle action ${cycleId} references missing recipe ${recipeId}.`);
  const applied = applyActionRecipe(project, recipe);
  const nextCursor = (cycle.cursor + 1) % cycle.recipeIds.length;
  return withProjectActionWorkflowState(applied, {
    ...state,
    revision: state.revision + 1,
    cycles: state.cycles.map((candidate) => candidate.id === cycleId ? {...candidate, cursor: nextCursor} : structuredClone(candidate)),
    lastExecution: {
      recipeId,
      cycleId,
      executedAt,
      stepCount: recipe.steps.length,
      description: `${cycle.name}: ${recipe.name}`,
    },
  });
}
