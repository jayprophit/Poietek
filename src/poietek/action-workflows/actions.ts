import type {PoietekProject, Track} from '../domain/types';
import {updateTrackMixer} from '../project/editOperations';
import type {
  ActionCommandKind,
  ActionExecutionPlan,
  ActionPlanStep,
  ActionRecipe,
  ActionStep,
  ActionTarget,
  CycleAction,
} from './contracts';

export interface ActionCommandDefinition {
  command: ActionCommandKind;
  label: string;
  description: string;
  scope: 'project' | 'track';
  safety: 'local_project_only';
}

export const ACTION_COMMAND_CATALOG: readonly ActionCommandDefinition[] = [
  {command: 'project.set_tempo', label: 'Set project tempo', description: 'Set the first canonical tempo-map event.', scope: 'project', safety: 'local_project_only'},
  {command: 'track.set_gain', label: 'Set track gain', description: 'Set canonical track gain from -60 dB to +12 dB.', scope: 'track', safety: 'local_project_only'},
  {command: 'track.set_pan', label: 'Set track panorama', description: 'Set canonical track panorama from left to right.', scope: 'track', safety: 'local_project_only'},
  {command: 'track.set_mute', label: 'Set track mute', description: 'Enable or clear canonical track mute.', scope: 'track', safety: 'local_project_only'},
  {command: 'track.set_solo', label: 'Set track solo', description: 'Enable or clear canonical track solo.', scope: 'track', safety: 'local_project_only'},
  {command: 'track.rename', label: 'Rename one track', description: 'Rename one canonical project track.', scope: 'track', safety: 'local_project_only'},
];

const allowedCommands = new Set<ActionCommandKind>(ACTION_COMMAND_CATALOG.map((entry) => entry.command));

function finiteInRange(value: unknown, minimum: number, maximum: number, label: string): string | null {
  return typeof value !== 'number' || !Number.isFinite(value) || value < minimum || value > maximum
    ? `${label} must be between ${minimum} and ${maximum}.`
    : null;
}

function resolveTarget(project: PoietekProject, target: ActionTarget): Track[] {
  if (target.kind === 'project') return [];
  if (target.kind === 'all_tracks') return [...project.tracks];
  const track = project.tracks.find((candidate) => candidate.id === target.trackId);
  return track ? [track] : [];
}

function validateTarget(step: ActionStep, project?: PoietekProject): string[] {
  const issues: string[] = [];
  if (step.command === 'project.set_tempo') {
    if (step.target.kind !== 'project') issues.push('Project tempo actions require the project target.');
    return issues;
  }
  if (step.target.kind === 'project') issues.push(`${step.command} requires a track target.`);
  if (step.command === 'track.rename' && step.target.kind !== 'track') {
    issues.push('Track rename requires exactly one canonical track target.');
  }
  if (step.target.kind === 'track' && !step.target.trackId.trim()) issues.push('Track action target id is required.');
  if (project && step.target.kind !== 'project' && resolveTarget(project, step.target).length === 0) {
    issues.push(step.target.kind === 'track'
      ? `Track ${step.target.trackId} was not found.`
      : 'The all-tracks target requires at least one canonical track.');
  }
  return issues;
}

export function validateActionStep(step: ActionStep, project?: PoietekProject): string[] {
  const issues: string[] = [];
  if (!step.id.trim()) issues.push('Action step id is required.');
  if (!allowedCommands.has(step.command)) issues.push(`Action command ${String(step.command)} is not allowlisted.`);
  issues.push(...validateTarget(step, project));
  const keys = Object.keys(step.parameters);
  switch (step.command) {
    case 'project.set_tempo': {
      const issue = finiteInRange(step.parameters.bpm, 20, 400, 'Project tempo');
      if (issue) issues.push(issue);
      if (keys.some((key) => key !== 'bpm')) issues.push('Project tempo only accepts the bpm parameter.');
      break;
    }
    case 'track.set_gain': {
      const issue = finiteInRange(step.parameters.gainDb, -60, 12, 'Track gain');
      if (issue) issues.push(issue);
      if (keys.some((key) => key !== 'gainDb')) issues.push('Track gain only accepts the gainDb parameter.');
      break;
    }
    case 'track.set_pan': {
      const issue = finiteInRange(step.parameters.pan, -1, 1, 'Track pan');
      if (issue) issues.push(issue);
      if (keys.some((key) => key !== 'pan')) issues.push('Track pan only accepts the pan parameter.');
      break;
    }
    case 'track.set_mute':
    case 'track.set_solo':
      if (typeof step.parameters.enabled !== 'boolean') issues.push(`${step.command} requires a boolean enabled parameter.`);
      if (keys.some((key) => key !== 'enabled')) issues.push(`${step.command} only accepts the enabled parameter.`);
      break;
    case 'track.rename': {
      const name = step.parameters.name;
      if (typeof name !== 'string' || !name.trim() || name.trim().length > 128) {
        issues.push('Track rename requires a non-empty name of at most 128 characters.');
      }
      if (keys.some((key) => key !== 'name')) issues.push('Track rename only accepts the name parameter.');
      break;
    }
  }
  return issues;
}

export function validateActionRecipe(recipe: ActionRecipe, project?: PoietekProject): string[] {
  const issues: string[] = [];
  if (!recipe.id.trim() || !recipe.name.trim()) issues.push('Action recipes require an id and name.');
  if (!recipe.steps.length) issues.push('Action recipes require at least one step.');
  if (recipe.steps.length > 64) issues.push('Action recipes are limited to 64 steps.');
  const stepIds = new Set<string>();
  for (const step of recipe.steps) {
    if (stepIds.has(step.id)) issues.push(`Duplicate action step ${step.id}.`);
    stepIds.add(step.id);
    issues.push(...validateActionStep(step, project).map((issue) => `${step.id || 'unnamed step'}: ${issue}`));
  }
  return issues;
}

function describeStep(step: ActionStep, targetCount: number): string {
  switch (step.command) {
    case 'project.set_tempo': return `Set project tempo to ${step.parameters.bpm} BPM`;
    case 'track.set_gain': return `Set ${targetCount} track${targetCount === 1 ? '' : 's'} to ${step.parameters.gainDb} dB`;
    case 'track.set_pan': return `Set panorama on ${targetCount} track${targetCount === 1 ? '' : 's'} to ${step.parameters.pan}`;
    case 'track.set_mute': return `${step.parameters.enabled ? 'Mute' : 'Unmute'} ${targetCount} track${targetCount === 1 ? '' : 's'}`;
    case 'track.set_solo': return `${step.parameters.enabled ? 'Solo' : 'Clear solo on'} ${targetCount} track${targetCount === 1 ? '' : 's'}`;
    case 'track.rename': return `Rename one track to ${String(step.parameters.name).trim()}`;
  }
}

export function planActionRecipe(project: PoietekProject, recipe: ActionRecipe): ActionExecutionPlan {
  const recipeIssues = validateActionRecipe(recipe);
  const steps = recipe.steps.map<ActionPlanStep>((step) => {
    const issues = [...recipeIssues.filter((issue) => issue.startsWith(`${step.id}:`)), ...validateActionStep(step, project)];
    const targetCount = step.target.kind === 'project' ? 1 : resolveTarget(project, step.target).length;
    return {
      stepId: step.id,
      command: step.command,
      targetCount,
      status: issues.length ? 'blocked' : 'ready',
      summary: describeStep(step, targetCount),
      ...(issues.length ? {reason: issues.join(' ')} : {}),
    };
  });
  if (recipeIssues.some((issue) => !recipe.steps.some((step) => issue.startsWith(`${step.id}:`)))) {
    return {
      projectId: project.id,
      recipeId: recipe.id,
      status: 'blocked',
      steps,
      summary: recipeIssues.join(' '),
    };
  }
  const blocked = steps.filter((step) => step.status === 'blocked');
  return {
    projectId: project.id,
    recipeId: recipe.id,
    status: blocked.length ? 'blocked' : 'ready',
    steps,
    summary: blocked.length
      ? `${blocked.length} of ${steps.length} steps are blocked.`
      : `${steps.length} allowlisted project step${steps.length === 1 ? '' : 's'} ready; nothing has changed yet.`,
  };
}

function renameTrack(project: PoietekProject, trackId: string, name: string): PoietekProject {
  return {
    ...project,
    tracks: project.tracks.map((track) => track.id === trackId ? {...track, name: name.trim()} : track),
  };
}

function applyStep(project: PoietekProject, step: ActionStep): PoietekProject {
  if (step.command === 'project.set_tempo') {
    return {
      ...project,
      tempoMap: project.tempoMap.map((event, index) => index === 0
        ? {...event, bpm: step.parameters.bpm as number}
        : {...event}),
    };
  }
  const tracks = resolveTarget(project, step.target);
  return tracks.reduce((current, track) => {
    switch (step.command) {
      case 'track.set_gain': return updateTrackMixer(current, track.id, {gainDb: step.parameters.gainDb as number});
      case 'track.set_pan': return updateTrackMixer(current, track.id, {pan: step.parameters.pan as number});
      case 'track.set_mute': return updateTrackMixer(current, track.id, {mute: step.parameters.enabled as boolean});
      case 'track.set_solo': return updateTrackMixer(current, track.id, {solo: step.parameters.enabled as boolean});
      case 'track.rename': return renameTrack(current, track.id, step.parameters.name as string);
      case 'project.set_tempo': return current;
    }
  }, project);
}

/** Applies only the explicit allowlist above. It cannot invoke scripts, plug-ins, the shell, files, or the network. */
export function applyActionRecipe(project: PoietekProject, recipe: ActionRecipe): PoietekProject {
  const plan = planActionRecipe(project, recipe);
  if (plan.status !== 'ready') throw new Error(`Action recipe is blocked: ${plan.summary}`);
  return recipe.steps.reduce((current, step) => applyStep(current, step), structuredClone(project));
}

export function createStarterActionSet(project: PoietekProject): {
  recipes: readonly ActionRecipe[];
  cycles: readonly CycleAction[];
} {
  const recipes: ActionRecipe[] = [
    {
      id: 'poietek.quick-sketch-94',
      name: 'Quick Sketch · 94 BPM',
      description: 'Prepare the canonical project for a measured sketch tempo.',
      origin: 'poietek',
      steps: [{id: 'tempo-94', command: 'project.set_tempo', target: {kind: 'project'}, parameters: {bpm: 94}}],
    },
    {
      id: 'poietek.performance-pulse-120',
      name: 'Performance Pulse · 120 BPM',
      description: 'Recall a second tempo through the same undoable action path.',
      origin: 'poietek',
      steps: [{id: 'tempo-120', command: 'project.set_tempo', target: {kind: 'project'}, parameters: {bpm: 120}}],
    },
  ];
  if (project.tracks.length) {
    recipes.push({
      id: 'poietek.clear-track-focus',
      name: 'Clear Track Focus',
      description: 'Unmute and clear solo on every canonical project track.',
      origin: 'poietek',
      steps: [
        {id: 'unmute-all', command: 'track.set_mute', target: {kind: 'all_tracks'}, parameters: {enabled: false}},
        {id: 'clear-solo-all', command: 'track.set_solo', target: {kind: 'all_tracks'}, parameters: {enabled: false}},
      ],
    });
  }
  return {
    recipes,
    cycles: [{
      id: 'poietek.tempo-a-b',
      name: 'Tempo A/B Cycle',
      recipeIds: ['poietek.quick-sketch-94', 'poietek.performance-pulse-120'],
      cursor: 0,
    }],
  };
}
