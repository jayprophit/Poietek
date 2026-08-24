import type {
  OfflineProcessChain,
  OfflineProcessStep,
  OfflineRenderRequest,
  ProductionAdapterObservation,
} from './contracts';

export function createOfflineProcessChain(sourceAssetId: string): OfflineProcessChain {
  if (!sourceAssetId.trim()) throw new Error('Offline processing requires a source asset identifier.');
  return {
    schemaVersion: '1.0.0',
    sourceAssetId,
    revision: 0,
    previewOnly: true,
    steps: [],
  };
}

export function appendOfflineProcessStep(
  chain: OfflineProcessChain,
  step: OfflineProcessStep,
): OfflineProcessChain {
  if (!step.id.trim()) throw new Error('Offline process steps require an identifier.');
  if (chain.steps.some((candidate) => candidate.id === step.id)) {
    throw new Error(`Duplicate offline process step: ${step.id}`);
  }
  return {
    ...chain,
    revision: chain.revision + 1,
    steps: [...chain.steps, {...step, parameters: {...step.parameters}}],
  };
}

export function setOfflineProcessStepEnabled(
  chain: OfflineProcessChain,
  stepId: string,
  enabled: boolean,
): OfflineProcessChain {
  if (!chain.steps.some((step) => step.id === stepId)) {
    throw new Error(`Unknown offline process step: ${stepId}`);
  }
  return {
    ...chain,
    revision: chain.revision + 1,
    steps: chain.steps.map((step) => step.id === stepId ? {...step, enabled} : step),
  };
}

export function createOfflineRenderRequest(
  chain: OfflineProcessChain,
  observations: readonly ProductionAdapterObservation[],
): OfflineRenderRequest {
  const adapter = observations.find((observation) => (
    observation.capability === 'offline_audio_render' && observation.state === 'available'
  ));
  if (!adapter) {
    return {
      chain,
      state: 'adapter_required',
      message: 'The process chain is preserved as preview-only intent; no compatible offline renderer was observed.',
    };
  }
  return {
    chain,
    state: 'ready_for_adapter',
    adapterId: adapter.adapterId,
    message: 'A compatible renderer was observed. The owning project session must still preview and commit the returned asset revision.',
  };
}
