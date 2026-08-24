import type {PoietekProject} from '../domain/types';
import type {
  EvaluatedModulationSource,
  ExternalModulationSource,
  LfoShape,
  ModulationControlFrame,
  ModulationObservation,
  ModulationRoute,
  ModulationSource,
  ModulationTarget,
  ModulationWorkflowState,
  MotionScene,
} from './contracts';
import {MODULATION_WORKFLOW_SCHEMA_VERSION} from './contracts';

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.max(minimum, Math.min(maximum, value));

const wrap = (value: number) => ((value % 1) + 1) % 1;

function requireIdAndName(value: {id: string; name: string}, label: string, issues: string[]): void {
  if (!value.id.trim() || !value.name.trim()) issues.push(`${label} requires an id and name.`);
}

function validateNormalized(value: number, label: string, issues: string[]): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) issues.push(`${label} must be between 0 and 1.`);
}

function validateSource(source: ModulationSource, issues: string[]): void {
  requireIdAndName(source, 'Modulation source', issues);
  validateNormalized(source.phaseOffset, `Modulation source ${source.id} phase offset`, issues);
  if (source.kind === 'macro') validateNormalized(source.value, `Macro ${source.id} value`, issues);
  if (source.kind === 'lfo' && (!Number.isFinite(source.cyclesPerBar) || source.cyclesPerBar <= 0 || source.cyclesPerBar > 64)) {
    issues.push(`LFO ${source.id} cycles per bar must be greater than 0 and no more than 64.`);
  }
  if (source.kind === 'step') {
    if (!source.values.length || source.values.length > 64) issues.push(`Step source ${source.id} requires between 1 and 64 values.`);
    source.values.forEach((value, index) => validateNormalized(value, `Step source ${source.id} value ${index}`, issues));
  }
  if (source.kind === 'random') {
    if (!source.seed.trim()) issues.push(`Random source ${source.id} requires a seed.`);
    if (!Number.isInteger(source.stepsPerBar) || source.stepsPerBar < 1 || source.stepsPerBar > 64) {
      issues.push(`Random source ${source.id} steps per bar must be a whole number from 1 to 64.`);
    }
  }
  if (isExternalSource(source) && !source.requiredCapability.trim()) {
    issues.push(`External source ${source.id} requires an adapter capability.`);
  }
}

function validateTarget(target: ModulationTarget, project: PoietekProject | undefined, issues: string[]): void {
  requireIdAndName(target, 'Modulation target', issues);
  if (![target.baseValue, target.minimum, target.maximum].every(Number.isFinite)) {
    issues.push(`Modulation target ${target.id} values must be finite.`);
  } else if (target.minimum >= target.maximum) {
    issues.push(`Modulation target ${target.id} minimum must be below its maximum.`);
  } else if (target.baseValue < target.minimum || target.baseValue > target.maximum) {
    issues.push(`Modulation target ${target.id} base value must be inside its range.`);
  }
  if (target.kind === 'control_slot') {
    if (target.referenceId !== null || target.parameterId !== null || target.requiredCapability !== null) {
      issues.push(`Control slot ${target.id} cannot claim an external reference or capability.`);
    }
    return;
  }
  if (!target.referenceId?.trim() || !target.parameterId?.trim()) {
    issues.push(`Modulation target ${target.id} requires a reference and parameter id.`);
  }
  if (target.kind === 'track_gain' || target.kind === 'track_pan') {
    if (target.requiredCapability !== 'timeline_control_frame') {
      issues.push(`Track target ${target.id} requires the timeline_control_frame capability.`);
    }
    if (project && !project.tracks.some((track) => track.id === target.referenceId)) {
      issues.push(`Track target ${target.id} references a missing canonical track.`);
    }
  } else if (!target.requiredCapability?.trim()) {
    issues.push(`External modulation target ${target.id} requires an adapter capability.`);
  }
}

function validateRoute(
  route: ModulationRoute,
  sourceIds: ReadonlySet<string>,
  targetIds: ReadonlySet<string>,
  issues: string[],
): void {
  if (!route.id.trim()) issues.push('Modulation route requires an id.');
  if (!sourceIds.has(route.sourceId)) issues.push(`Modulation route ${route.id} references a missing source.`);
  if (!targetIds.has(route.targetId)) issues.push(`Modulation route ${route.id} references a missing target.`);
  if (!Number.isFinite(route.amount) || route.amount < -1 || route.amount > 1) {
    issues.push(`Modulation route ${route.id} amount must be between -1 and 1.`);
  }
}

function validateScene(scene: MotionScene, macroIds: ReadonlySet<string>, issues: string[]): void {
  requireIdAndName(scene, 'Motion scene', issues);
  for (const [sourceId, value] of Object.entries(scene.macroValues)) {
    if (!macroIds.has(sourceId)) issues.push(`Motion scene ${scene.id} references non-macro source ${sourceId}.`);
    validateNormalized(value, `Motion scene ${scene.id} macro ${sourceId}`, issues);
  }
}

export function validateModulationWorkflowState(
  state: ModulationWorkflowState,
  project?: PoietekProject,
): string[] {
  const issues: string[] = [];
  if (state.schemaVersion !== MODULATION_WORKFLOW_SCHEMA_VERSION) issues.push('Unsupported modulation workflow schema version.');
  if (!state.projectId.trim()) issues.push('Modulation workflow requires a project id.');
  if (project && state.projectId !== project.id) issues.push('Modulation workflow belongs to another project.');
  if (!Number.isInteger(state.revision) || state.revision < 0) issues.push('Modulation workflow revision must be a non-negative whole number.');

  const sourceIds = new Set<string>();
  for (const source of state.sources) {
    if (sourceIds.has(source.id)) issues.push(`Duplicate modulation source ${source.id}.`);
    sourceIds.add(source.id);
    validateSource(source, issues);
  }
  const targetIds = new Set<string>();
  for (const target of state.targets) {
    if (targetIds.has(target.id)) issues.push(`Duplicate modulation target ${target.id}.`);
    targetIds.add(target.id);
    validateTarget(target, project, issues);
  }
  const routeIds = new Set<string>();
  for (const route of state.routes) {
    if (routeIds.has(route.id)) issues.push(`Duplicate modulation route ${route.id}.`);
    routeIds.add(route.id);
    validateRoute(route, sourceIds, targetIds, issues);
  }
  const macroIds = new Set(state.sources.filter((source) => source.kind === 'macro').map((source) => source.id));
  const sceneIds = new Set<string>();
  for (const scene of state.scenes) {
    if (sceneIds.has(scene.id)) issues.push(`Duplicate motion scene ${scene.id}.`);
    sceneIds.add(scene.id);
    validateScene(scene, macroIds, issues);
  }
  if (state.activeSceneId !== null && !sceneIds.has(state.activeSceneId)) issues.push('Active motion scene is missing.');
  return issues;
}

export function createModulationWorkflowState(projectId: string): ModulationWorkflowState {
  if (!projectId.trim()) throw new Error('Modulation workflow requires a project id.');
  return {
    schemaVersion: MODULATION_WORKFLOW_SCHEMA_VERSION,
    projectId,
    revision: 0,
    sources: [],
    targets: [],
    routes: [],
    scenes: [],
    activeSceneId: null,
  };
}

export function createStarterMotionMatrix(projectId: string): ModulationWorkflowState {
  return {
    ...createModulationWorkflowState(projectId),
    revision: 1,
    sources: [
      {id: 'motion.expression', name: 'Expression', kind: 'macro', enabled: true, range: 'unipolar', phaseOffset: 0, value: 0.5},
      {id: 'motion.orbit', name: 'Orbit', kind: 'lfo', enabled: true, range: 'bipolar', phaseOffset: 0, shape: 'sine', cyclesPerBar: 1},
      {id: 'motion.pulse', name: 'Pulse Steps', kind: 'step', enabled: true, range: 'unipolar', phaseOffset: 0, values: [0.1, 0.8, 0.35, 1, 0.2, 0.65, 0.45, 0.9]},
      {id: 'motion.seed', name: 'Seed Motion', kind: 'random', enabled: true, range: 'bipolar', phaseOffset: 0, seed: 'poietek-motion-one', stepsPerBar: 8},
      {id: 'motion.touch', name: 'Per-note Touch', kind: 'note_expression', enabled: true, range: 'unipolar', phaseOffset: 0, requiredCapability: 'note_expression_observation'},
    ],
    targets: [
      {id: 'motion.tone', name: 'Tone', kind: 'control_slot', baseValue: 0.45, minimum: 0, maximum: 1, unit: '%', referenceId: null, parameterId: null, requiredCapability: null},
      {id: 'motion.movement', name: 'Movement', kind: 'control_slot', baseValue: 0.25, minimum: 0, maximum: 1, unit: '%', referenceId: null, parameterId: null, requiredCapability: null},
      {id: 'motion.rack-preview', name: 'Rack Parameter Preview', kind: 'rack_parameter', baseValue: 0.5, minimum: 0, maximum: 1, unit: '%', referenceId: 'selected-rack-device', parameterId: 'selected-parameter', requiredCapability: 'rack_parameter_control_frame'},
    ],
    routes: [
      {id: 'route.expression-tone', sourceId: 'motion.expression', targetId: 'motion.tone', amount: 0.45, inputMode: 'bipolar', curve: 'linear', enabled: true},
      {id: 'route.orbit-tone', sourceId: 'motion.orbit', targetId: 'motion.tone', amount: 0.2, inputMode: 'bipolar', curve: 'ease_in', enabled: true},
      {id: 'route.pulse-movement', sourceId: 'motion.pulse', targetId: 'motion.movement', amount: 0.55, inputMode: 'unipolar', curve: 'linear', enabled: true},
      {id: 'route.seed-movement', sourceId: 'motion.seed', targetId: 'motion.movement', amount: 0.15, inputMode: 'bipolar', curve: 'ease_out', enabled: true},
      {id: 'route.touch-rack', sourceId: 'motion.touch', targetId: 'motion.rack-preview', amount: 0.5, inputMode: 'unipolar', curve: 'linear', enabled: true},
    ],
    scenes: [
      {id: 'scene.still', name: 'Still', macroValues: {'motion.expression': 0.2}},
      {id: 'scene.open', name: 'Open', macroValues: {'motion.expression': 0.65}},
      {id: 'scene.lift', name: 'Lift', macroValues: {'motion.expression': 0.9}},
    ],
    activeSceneId: null,
  };
}

function validateNext(state: ModulationWorkflowState): ModulationWorkflowState {
  const issues = validateModulationWorkflowState(state);
  if (issues.length) throw new Error(issues.join(' '));
  return state;
}

export function setMacroSourceValue(
  state: ModulationWorkflowState,
  sourceId: string,
  value: number,
): ModulationWorkflowState {
  validateNormalized(value, `Macro ${sourceId} value`, []);
  if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error(`Macro ${sourceId} value must be between 0 and 1.`);
  const source = state.sources.find((candidate) => candidate.id === sourceId);
  if (!source) throw new Error(`Modulation source ${sourceId} was not found.`);
  if (source.kind !== 'macro') throw new Error(`Modulation source ${sourceId} is not a macro.`);
  return validateNext({
    ...state,
    revision: state.revision + 1,
    activeSceneId: null,
    sources: state.sources.map((candidate) => candidate.id === sourceId ? {...candidate, value} : structuredClone(candidate)),
  });
}

export function setModulationRouteEnabled(
  state: ModulationWorkflowState,
  routeId: string,
  enabled: boolean,
): ModulationWorkflowState {
  if (!state.routes.some((route) => route.id === routeId)) throw new Error(`Modulation route ${routeId} was not found.`);
  return validateNext({
    ...state,
    revision: state.revision + 1,
    routes: state.routes.map((route) => route.id === routeId ? {...route, enabled} : {...route}),
  });
}

export function recallMotionScene(state: ModulationWorkflowState, sceneId: string): ModulationWorkflowState {
  const scene = state.scenes.find((candidate) => candidate.id === sceneId);
  if (!scene) throw new Error(`Motion scene ${sceneId} was not found.`);
  const macroIds = new Set(state.sources.filter((source) => source.kind === 'macro').map((source) => source.id));
  for (const sourceId of Object.keys(scene.macroValues)) {
    if (!macroIds.has(sourceId)) throw new Error(`Motion scene ${sceneId} references non-macro source ${sourceId}.`);
  }
  return validateNext({
    ...state,
    revision: state.revision + 1,
    activeSceneId: sceneId,
    sources: state.sources.map((source) => source.kind === 'macro' && scene.macroValues[source.id] !== undefined
      ? {...source, value: scene.macroValues[source.id]}
      : structuredClone(source)),
  });
}

function isExternalSource(source: ModulationSource): source is ExternalModulationSource {
  return source.kind === 'note_expression' || source.kind === 'audio_follower' || source.kind === 'hardware_control';
}

function shapeValue(shape: LfoShape, phase: number): number {
  if (shape === 'sine') return (Math.sin(phase * Math.PI * 2) + 1) / 2;
  if (shape === 'triangle') return 1 - Math.abs(phase * 2 - 1);
  if (shape === 'saw') return phase;
  return phase < 0.5 ? 0 : 1;
}

function seededUnit(seed: string, step: number): number {
  let hash = 2166136261;
  const input = `${seed}:${step}`;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function mapRange(value: number, range: ModulationSource['range']): number {
  return range === 'bipolar' ? value * 2 - 1 : value;
}

function evaluateSource(
  source: ModulationSource,
  phase: number,
  observations: readonly ModulationObservation[],
): EvaluatedModulationSource {
  if (!source.enabled) return {sourceId: source.id, value: null, status: 'disabled', note: 'Source is disabled.'};
  if (source.kind === 'macro') return {sourceId: source.id, value: mapRange(source.value, source.range), status: 'ready', note: 'Project-owned macro value.'};
  if (source.kind === 'lfo') {
    const value = shapeValue(source.shape, wrap((phase + source.phaseOffset) * source.cyclesPerBar));
    return {sourceId: source.id, value: mapRange(value, source.range), status: 'ready', note: 'Deterministic control-rate preview.'};
  }
  if (source.kind === 'step') {
    const index = Math.floor(wrap(phase + source.phaseOffset) * source.values.length) % source.values.length;
    return {sourceId: source.id, value: mapRange(source.values[index], source.range), status: 'ready', note: `Deterministic step ${index + 1} of ${source.values.length}.`};
  }
  if (source.kind === 'random') {
    const step = Math.floor(wrap(phase + source.phaseOffset) * source.stepsPerBar);
    return {sourceId: source.id, value: mapRange(seededUnit(source.seed, step), source.range), status: 'ready', note: `Seeded step ${step + 1} of ${source.stepsPerBar}.`};
  }
  const observation = observations.find((candidate) => candidate.sourceId === source.id && candidate.capability === source.requiredCapability);
  if (!observation || !observation.adapterId.trim() || !Number.isFinite(observation.observedAt) || !Number.isFinite(observation.value)) {
    return {sourceId: source.id, value: null, status: 'adapter_required', note: `Requires observed ${source.requiredCapability}.`};
  }
  const normalized = clamp(observation.value, source.range === 'bipolar' ? -1 : 0, 1);
  return {sourceId: source.id, value: normalized, status: 'ready', note: `Observed by ${observation.adapterId}.`};
}

function applyCurve(value: number, curve: ModulationRoute['curve']): number {
  const sign = Math.sign(value);
  const magnitude = Math.abs(value);
  if (curve === 'ease_in') return sign * magnitude * magnitude;
  if (curve === 'ease_out') return sign * (1 - (1 - magnitude) * (1 - magnitude));
  return value;
}

function routeInput(value: number, source: ModulationSource, route: ModulationRoute): number {
  if (route.inputMode === 'bipolar' && source.range === 'unipolar') return value * 2 - 1;
  if (route.inputMode === 'unipolar' && source.range === 'bipolar') return (value + 1) / 2;
  return value;
}

export function evaluateModulationControlFrame(
  state: ModulationWorkflowState,
  phase: number,
  observations: readonly ModulationObservation[] = [],
  project?: PoietekProject,
): ModulationControlFrame {
  if (!Number.isFinite(phase)) throw new Error('Modulation phase must be finite.');
  const issues = validateModulationWorkflowState(state, project);
  if (issues.length) throw new Error(issues.join(' '));
  const normalizedPhase = wrap(phase);
  const sources = state.sources.map((source) => evaluateSource(source, normalizedPhase, observations));
  const sourceValues = new Map(sources.map((source) => [source.sourceId, source]));
  const sourceDefinitions = new Map(state.sources.map((source) => [source.id, source]));
  const targets = state.targets.map((target) => {
    let contribution = 0;
    let activeRouteCount = 0;
    for (const route of state.routes.filter((candidate) => candidate.enabled && candidate.targetId === target.id)) {
      const evaluated = sourceValues.get(route.sourceId);
      const source = sourceDefinitions.get(route.sourceId);
      if (!evaluated || evaluated.value === null || !source) continue;
      contribution += applyCurve(routeInput(evaluated.value, source, route), route.curve) * route.amount * (target.maximum - target.minimum);
      activeRouteCount += 1;
    }
    return {
      targetId: target.id,
      value: clamp(target.baseValue + contribution, target.minimum, target.maximum),
      contribution,
      activeRouteCount,
      deliveryState: target.kind === 'control_slot' ? 'local_preview' as const : 'adapter_required' as const,
      requiredCapability: target.requiredCapability,
    };
  });
  return {
    phase: normalizedPhase,
    sources,
    targets,
    claim: 'deterministic_control_preview',
    note: 'Control-frame preview only. It does not claim audio-rate DSP, plug-in, rack, timeline, or hardware delivery.',
  };
}
