import type {
  CompositionWorkflowState,
  MixScene,
  MixSceneTargetState,
} from './contracts';

export interface MixSceneDifference {
  targetId: string;
  changedFields: Array<'gainDb' | 'pan' | 'mute' | 'solo' | 'processors'>;
}

function cloneTarget(target: MixSceneTargetState): MixSceneTargetState {
  return {...target, processorStateReferences: {...target.processorStateReferences}};
}

export function createMixScene(
  id: string,
  name: string,
  targets: readonly MixSceneTargetState[],
  createdAt = new Date().toISOString(),
): MixScene {
  if (!id.trim() || !name.trim()) throw new Error('Mix scene id and name are required.');
  if (Number.isNaN(Date.parse(createdAt))) throw new Error('Mix scene creation time must be an ISO-compatible date.');
  const ids = new Set<string>();
  for (const target of targets) {
    if (!target.targetId.trim() || ids.has(target.targetId)) throw new Error('Mix scene target ids must be present and unique.');
    ids.add(target.targetId);
    if (!Number.isFinite(target.gainDb) || !Number.isFinite(target.pan) || target.pan < -1 || target.pan > 1) throw new Error(`Mix scene target ${target.targetId} has invalid gain or pan.`);
  }
  return {id, name, createdAt, targets: targets.map(cloneTarget)};
}

export function addMixScene(state: CompositionWorkflowState, scene: MixScene): CompositionWorkflowState {
  if (state.mixScenes.some((candidate) => candidate.id === scene.id)) throw new Error(`Mix scene ${scene.id} already exists.`);
  const validated = createMixScene(scene.id, scene.name, scene.targets, scene.createdAt);
  return {...state, revision: state.revision + 1, mixScenes: [...state.mixScenes.map((candidate) => ({...candidate, targets: candidate.targets.map(cloneTarget)})), validated]};
}

export function upsertMixScene(state: CompositionWorkflowState, scene: MixScene): CompositionWorkflowState {
  const validated = createMixScene(scene.id, scene.name, scene.targets, scene.createdAt);
  const existingIndex = state.mixScenes.findIndex((candidate) => candidate.id === scene.id);
  const mixScenes = state.mixScenes.map((candidate) => ({...candidate, targets: candidate.targets.map(cloneTarget)}));
  if (existingIndex === -1) mixScenes.push(validated);
  else mixScenes[existingIndex] = validated;
  return {...state, revision: state.revision + 1, mixScenes};
}

export function compareMixScenes(left: MixScene, right: MixScene): MixSceneDifference[] {
  const leftTargets = new Map(left.targets.map((target) => [target.targetId, target]));
  const rightTargets = new Map(right.targets.map((target) => [target.targetId, target]));
  const ids = [...new Set([...leftTargets.keys(), ...rightTargets.keys()])].sort();
  return ids.flatMap((targetId) => {
    const a = leftTargets.get(targetId);
    const b = rightTargets.get(targetId);
    if (!a || !b) return [{targetId, changedFields: ['gainDb', 'pan', 'mute', 'solo', 'processors']} satisfies MixSceneDifference];
    const changedFields: MixSceneDifference['changedFields'] = [];
    if (a.gainDb !== b.gainDb) changedFields.push('gainDb');
    if (a.pan !== b.pan) changedFields.push('pan');
    if (a.mute !== b.mute) changedFields.push('mute');
    if (a.solo !== b.solo) changedFields.push('solo');
    if (JSON.stringify(a.processorStateReferences) !== JSON.stringify(b.processorStateReferences)) changedFields.push('processors');
    return changedFields.length ? [{targetId, changedFields}] : [];
  });
}

export function createMixSceneRecallPlan(scene: MixScene): {sceneId: string; targets: MixSceneTargetState[]; status: 'preview'} {
  return {sceneId: scene.id, targets: scene.targets.map(cloneTarget), status: 'preview'};
}
