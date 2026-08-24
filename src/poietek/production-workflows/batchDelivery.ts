import type {Asset, PoietekProject} from '../domain/types';
import type {ProductionAdapterObservation} from './contracts';

export const BATCH_DELIVERY_EXTENSION_KEY = 'org.poietek.batch-delivery' as const;
export const BATCH_DELIVERY_SCHEMA_VERSION = '1.0.0' as const;

export type BatchRecipeNodeKind = 'gain' | 'equalizer' | 'dynamics' | 'noise_repair_intent' | 'space' | 'delay' | 'pitch_time' | 'channel_route' | 'external_plugin_slot' | 'meter';
export type BatchOutputFormat = 'wav' | 'aiff' | 'flac' | 'mp3' | 'ogg';
export type BatchSampleRate = 'source' | 44100 | 48000 | 88200 | 96000 | 176400 | 192000;
export type BatchBitDepth = 'source' | 16 | 24 | 32 | null;
export type BatchChannelLayout = 'source' | 'mono' | 'stereo' | 'graph';
export type BatchConflictPolicy = 'skip' | 'version' | 'replace_intent';
export type BatchNormalizationMode = 'none' | 'sample_peak' | 'loudness_target';
export type BatchPilotStatus = 'not_selected' | 'preview_required' | 'preview_observed' | 'approved';
export type BatchRunStatus = 'success' | 'partial' | 'failed' | 'cancelled';

export interface BatchRecipeNode {
  id: string;
  name: string;
  kind: BatchRecipeNodeKind;
  enabled: boolean;
  parameters: Readonly<Record<string, number | boolean | string>>;
  requiredCapability: string | null;
  engineState: 'control_model' | 'native_required' | 'external_required';
}

export interface BatchRecipeEdge { id: string; fromNodeId: string; toNodeId: string }

export interface BatchRecipe {
  id: string;
  name: string;
  description: string;
  nodes: readonly BatchRecipeNode[];
  edges: readonly BatchRecipeEdge[];
}

export interface BatchOutputVariant {
  id: string;
  name: string;
  format: BatchOutputFormat;
  sampleRate: BatchSampleRate;
  bitDepth: BatchBitDepth;
  channels: BatchChannelLayout;
  namingTemplate: string;
  normalization: BatchNormalizationMode;
  target: number | null;
  tailSeconds: number;
  conflictPolicy: BatchConflictPolicy;
}

export interface BatchPilotEvidence {
  adapterId: string;
  capability: 'batch_preview_render';
  planKey: string;
  evidenceReference: string;
  observedAt: number;
}

export interface BatchPilot {
  assetId: string | null;
  status: BatchPilotStatus;
  evidence: BatchPilotEvidence | null;
  approvedAt: number | null;
}

/** Aggregate adapter evidence only; deliberately not a per-file render manifest. */
export interface BatchRunObservation {
  adapterId: string;
  evidenceReference: string;
  planKey: string;
  sourceRevision: number;
  startedAt: number;
  finishedAt: number;
  status: BatchRunStatus;
  total: number;
  succeeded: number;
  failed: number;
  skipped: number;
}

export interface BatchDeliveryState {
  schemaVersion: typeof BATCH_DELIVERY_SCHEMA_VERSION;
  projectId: string;
  revision: number;
  sourceAssetIds: readonly string[];
  recipe: BatchRecipe;
  outputs: readonly BatchOutputVariant[];
  pilot: BatchPilot;
  lastRun: BatchRunObservation | null;
}

export interface BatchDryRunEntry {
  sourceAssetId: string;
  sourceName: string;
  outputVariantId: string;
  outputVariantName: string;
  relativePath: string;
  state: 'ready' | 'skipped' | 'blocked';
  issues: readonly string[];
  warnings: readonly string[];
}

export interface BatchDryRunPlan {
  schema: 'org.poietek.batch-delivery-plan/1.0.0';
  projectId: string;
  sourceRevision: number;
  planKey: string;
  entries: readonly BatchDryRunEntry[];
  collisionPaths: readonly string[];
  readyCount: number;
  skippedCount: number;
  blockedCount: number;
  canQueue: boolean;
  claim: string;
}

export interface BatchDeliveryReadiness {
  localPlanReady: boolean;
  pilotApproved: boolean;
  adaptersObserved: boolean;
  canRequestRender: boolean;
  requiredCapabilities: readonly string[];
  observedCapabilities: readonly string[];
  missingCapabilities: readonly string[];
  claim: string;
}

export interface BatchDryRunOptions {
  /** Must come from a filesystem adapter or an explicit user-supplied manifest. */
  existingRelativePaths?: readonly string[];
  versionLabel?: string;
}

const allowedTokens = new Set(['project', 'asset', 'variant', 'version', 'sample_rate', 'channels', 'hash8', 'counter', 'ext']);
const recipeNodeKinds = new Set<BatchRecipeNodeKind>(['gain', 'equalizer', 'dynamics', 'noise_repair_intent', 'space', 'delay', 'pitch_time', 'channel_route', 'external_plugin_slot', 'meter']);
const outputFormats = new Set<BatchOutputFormat>(['wav', 'aiff', 'flac', 'mp3', 'ogg']);
const sampleRates = new Set<BatchSampleRate>(['source', 44100, 48000, 88200, 96000, 176400, 192000]);
const bitDepths = new Set<BatchBitDepth>(['source', 16, 24, 32, null]);
const channelLayouts = new Set<BatchChannelLayout>(['source', 'mono', 'stereo', 'graph']);
const conflictPolicies = new Set<BatchConflictPolicy>(['skip', 'version', 'replace_intent']);
const normalizationModes = new Set<BatchNormalizationMode>(['none', 'sample_peak', 'loudness_target']);
const pilotStatuses = new Set<BatchPilotStatus>(['not_selected', 'preview_required', 'preview_observed', 'approved']);
const runStatuses = new Set<BatchRunStatus>(['success', 'partial', 'failed', 'cancelled']);
const reservedWindowsNames = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i;
const unsafeLiteralCharacters = /[<>:"|?*\u0000-\u001f]/;

export function createBatchDeliveryState(projectId: string): BatchDeliveryState {
  if (!projectId.trim()) throw new Error('Batch delivery requires a project id.');
  return {
    schemaVersion: BATCH_DELIVERY_SCHEMA_VERSION,
    projectId,
    revision: 0,
    sourceAssetIds: [],
    recipe: {id: 'batch-recipe-empty', name: 'Empty delivery recipe', description: 'A provider-neutral graph that has not been connected to a renderer.', nodes: [], edges: []},
    outputs: [],
    pilot: {assetId: null, status: 'not_selected', evidence: null, approvedAt: null},
    lastRun: null,
  };
}

export function createBatchDeliveryStarter(project: PoietekProject): BatchDeliveryState {
  const sourceAssetIds = project.assets.filter((asset) => asset.mediaType === 'audio').map((asset) => asset.id);
  const nodes: BatchRecipeNode[] = [
    {id: 'batch-node-trim', name: 'Trim and level intent', kind: 'gain', enabled: true, parameters: {gainDb: 0, trimSilence: false}, requiredCapability: 'batch_audio_render', engineState: 'native_required'},
    {id: 'batch-node-tone', name: 'Tone balance intent', kind: 'equalizer', enabled: true, parameters: {lowDb: 0, midDb: 0, highDb: 0}, requiredCapability: 'batch_equalizer', engineState: 'native_required'},
    {id: 'batch-node-safety', name: 'Delivery safety meter', kind: 'meter', enabled: true, parameters: {samplePeak: true}, requiredCapability: 'batch_sample_peak_analysis', engineState: 'native_required'},
  ];
  const outputs: BatchOutputVariant[] = [
    {id: 'batch-output-review-wav', name: 'Review WAV', format: 'wav', sampleRate: 'source', bitDepth: 24, channels: 'source', namingTemplate: '{project}/review/{counter:3}_{asset}_{version}.{ext}', normalization: 'none', target: null, tailSeconds: 0, conflictPolicy: 'skip'},
    {id: 'batch-output-archive-flac', name: 'Archive FLAC', format: 'flac', sampleRate: 'source', bitDepth: 24, channels: 'source', namingTemplate: '{project}/archive/{counter:3}_{asset}_{version}.{ext}', normalization: 'none', target: null, tailSeconds: 0, conflictPolicy: 'version'},
    {id: 'batch-output-mobile-preview', name: 'Mobile Preview', format: 'mp3', sampleRate: 44100, bitDepth: null, channels: 'stereo', namingTemplate: '{project}/preview/{counter:3}_{asset}_{variant}.{ext}', normalization: 'loudness_target', target: -16, tailSeconds: 0, conflictPolicy: 'skip'},
  ];
  return validateNext({
    ...createBatchDeliveryState(project.id),
    revision: 1,
    sourceAssetIds,
    recipe: {id: 'batch-recipe-media-delivery', name: 'Media Delivery Recipe', description: 'An original clean-room recipe for repeatable asset preparation, preview and delivery.', nodes, edges: [{id: 'batch-edge-trim-tone', fromNodeId: nodes[0].id, toNodeId: nodes[1].id}, {id: 'batch-edge-tone-safety', fromNodeId: nodes[1].id, toNodeId: nodes[2].id}]},
    outputs,
    pilot: {assetId: sourceAssetIds[0] ?? null, status: sourceAssetIds.length ? 'preview_required' : 'not_selected', evidence: null, approvedAt: null},
  }, project);
}

export function setBatchSourceAssetIds(state: BatchDeliveryState, project: PoietekProject, assetIds: readonly string[]): BatchDeliveryState {
  if (state.projectId !== project.id) throw new Error('Batch delivery state belongs to another project.');
  const unique = [...new Set(assetIds)];
  const audioIds = new Set(project.assets.filter((asset) => asset.mediaType === 'audio').map((asset) => asset.id));
  for (const assetId of unique) if (!audioIds.has(assetId)) throw new Error(`Batch source ${assetId} is not a canonical audio asset.`);
  const retainedPilotId = state.pilot.assetId && unique.includes(state.pilot.assetId) ? state.pilot.assetId : unique[0] ?? null;
  return validateNext({
    ...cloneState(state), revision: state.revision + 1, sourceAssetIds: unique,
    pilot: retainedPilotId ? {assetId: retainedPilotId, status: 'preview_required', evidence: null, approvedAt: null} : {assetId: null, status: 'not_selected', evidence: null, approvedAt: null},
    lastRun: null,
  }, project);
}

export function upsertBatchRecipeNode(state: BatchDeliveryState, node: BatchRecipeNode): BatchDeliveryState {
  validateNode(node);
  const nodes = state.recipe.nodes.some((candidate) => candidate.id === node.id)
    ? state.recipe.nodes.map((candidate) => candidate.id === node.id ? cloneNode(node) : cloneNode(candidate))
    : [...state.recipe.nodes.map(cloneNode), cloneNode(node)];
  return invalidatePilot(validateNext({...cloneState(state), revision: state.revision + 1, recipe: {...cloneRecipe(state.recipe), nodes}, lastRun: null}));
}

export function upsertBatchOutputVariant(state: BatchDeliveryState, output: BatchOutputVariant): BatchDeliveryState {
  validateOutput(output);
  const outputs = state.outputs.some((candidate) => candidate.id === output.id)
    ? state.outputs.map((candidate) => candidate.id === output.id ? {...output} : {...candidate})
    : [...state.outputs.map((candidate) => ({...candidate})), {...output}];
  return invalidatePilot(validateNext({...cloneState(state), revision: state.revision + 1, outputs, lastRun: null}));
}

export function selectBatchPilot(state: BatchDeliveryState, assetId: string): BatchDeliveryState {
  if (!state.sourceAssetIds.includes(assetId)) throw new Error('The pilot must be selected from the current batch source set.');
  return validateNext({...cloneState(state), revision: state.revision + 1, pilot: {assetId, status: 'preview_required', evidence: null, approvedAt: null}, lastRun: null});
}

export function observeBatchPilotPreview(state: BatchDeliveryState, evidence: BatchPilotEvidence): BatchDeliveryState {
  if (!state.pilot.assetId) throw new Error('Select one batch source before recording preview evidence.');
  if (!evidence.adapterId.trim() || !evidence.evidenceReference.trim()) throw new Error('Pilot preview evidence requires an adapter and evidence reference.');
  if (evidence.planKey !== createBatchPlanKey(state)) throw new Error('Pilot preview evidence belongs to another batch plan.');
  if (!Number.isFinite(evidence.observedAt) || evidence.observedAt <= 0) throw new Error('Pilot preview evidence requires a valid observation time.');
  return validateNext({...cloneState(state), revision: state.revision + 1, pilot: {assetId: state.pilot.assetId, status: 'preview_observed', evidence: {...evidence}, approvedAt: null}});
}

export function approveBatchPilot(state: BatchDeliveryState, approvedAt: number): BatchDeliveryState {
  if (state.pilot.status !== 'preview_observed' || !state.pilot.evidence) throw new Error('A pilot can be approved only after preview-render evidence is observed.');
  if (!Number.isFinite(approvedAt) || approvedAt < state.pilot.evidence.observedAt) throw new Error('Pilot approval time must follow its preview observation.');
  if (state.pilot.evidence.planKey !== createBatchPlanKey(state)) throw new Error('The batch plan changed after its pilot preview.');
  return validateNext({...cloneState(state), revision: state.revision + 1, pilot: {...clonePilot(state.pilot), status: 'approved', approvedAt}});
}

export function recordBatchRunObservation(state: BatchDeliveryState, observation: BatchRunObservation): BatchDeliveryState {
  validateRunObservation(observation);
  if (observation.sourceRevision !== state.revision) throw new Error('Batch run evidence belongs to a stale delivery revision.');
  if (observation.planKey !== createBatchPlanKey(state)) throw new Error('Batch run evidence belongs to another delivery plan.');
  return validateNext({...cloneState(state), revision: state.revision + 1, lastRun: {...observation}});
}

export function validateBatchNamingTemplate(template: string): string[] {
  const issues: string[] = [];
  const trimmed = template.trim();
  if (!trimmed) return ['Output naming template is required.'];
  if (trimmed.startsWith('/') || trimmed.startsWith('\\') || /^[a-z]:/i.test(trimmed)) issues.push('Output paths must be relative to the selected delivery root.');
  if (trimmed.includes('\\')) issues.push('Use forward slashes in portable output templates.');
  if (trimmed.split('/').some((segment) => segment === '' || segment === '.' || segment === '..')) issues.push('Output templates cannot contain empty, current-directory or parent-directory segments.');
  if (unsafeLiteralCharacters.test(stripTokens(trimmed))) issues.push('Output templates contain a character that is unsafe on supported desktop filesystems.');
  const tokenPattern = /\{([^{}]+)\}/g;
  let match: RegExpExecArray | null;
  while ((match = tokenPattern.exec(trimmed))) {
    const [tokenName, width] = match[1].split(':');
    if (!allowedTokens.has(tokenName)) issues.push(`Unknown output naming token {${match[1]}}.`);
    if (tokenName === 'counter' && width !== undefined && (!/^\d+$/.test(width) || Number(width) < 1 || Number(width) > 6)) issues.push('Counter width must be a whole number from 1 to 6.');
    if (tokenName !== 'counter' && width !== undefined) issues.push(`Token {${tokenName}} does not accept a width.`);
  }
  if (/[{}]/.test(trimmed.replace(tokenPattern, ''))) issues.push('Output naming template contains an incomplete token.');
  if (trimmed.length > 180) issues.push('Output naming template is too long for a portable delivery path.');
  return [...new Set(issues)];
}

export function createBatchDryRunPlan(state: BatchDeliveryState, project: PoietekProject, options: BatchDryRunOptions = {}): BatchDryRunPlan {
  const stateIssues = validateBatchDeliveryState(state, project);
  if (stateIssues.length) throw new Error(stateIssues.join(' '));
  const assets = new Map(project.assets.map((asset) => [asset.id, asset]));
  const existing = new Set((options.existingRelativePaths ?? []).map(normalizeComparisonPath));
  const planned = new Set<string>();
  const collisionPaths = new Set<string>();
  const entries: BatchDryRunEntry[] = [];
  const versionLabel = portableTokenValue(options.versionLabel ?? 'v1');
  state.sourceAssetIds.forEach((assetId, sourceIndex) => {
    const asset = assets.get(assetId)!;
    state.outputs.forEach((output) => {
      const issues: string[] = [];
      const warnings: string[] = [];
      let relativePath = '';
      try { relativePath = resolveBatchOutputPath(project, asset, output, sourceIndex + 1, versionLabel); }
      catch (reason) { issues.push(errorText(reason)); }
      let comparison = relativePath ? normalizeComparisonPath(relativePath) : '';
      const conflictsWithPlan = comparison ? planned.has(comparison) : false;
      const conflictsWithExisting = comparison ? existing.has(comparison) : false;
      if (conflictsWithPlan || conflictsWithExisting) {
        collisionPaths.add(relativePath);
        if (conflictsWithPlan) {
          if (output.conflictPolicy === 'version') {
            relativePath = findVersionedPath(relativePath, planned, existing);
            comparison = normalizeComparisonPath(relativePath);
            warnings.push('A dry-run collision was resolved with a new filename version.');
          } else issues.push('Two planned outputs resolve to the same portable path.');
        } else if (output.conflictPolicy === 'version') {
          relativePath = findVersionedPath(relativePath, planned, existing);
          comparison = normalizeComparisonPath(relativePath);
          warnings.push('An observed existing path was preserved and a new filename version was planned.');
        } else if (output.conflictPolicy === 'skip') warnings.push('An observed existing path will be preserved and this output will be skipped.');
        else warnings.push('Replacement is intent only and still requires explicit confirmation by the filesystem adapter.');
      }
      if (relativePath.length > 240) issues.push('Resolved output path exceeds the portable 240-character planning limit.');
      const entryState: BatchDryRunEntry['state'] = issues.length ? 'blocked' : conflictsWithExisting && output.conflictPolicy === 'skip' ? 'skipped' : 'ready';
      if (entryState === 'ready' && comparison) planned.add(comparison);
      entries.push({sourceAssetId: asset.id, sourceName: asset.originalName, outputVariantId: output.id, outputVariantName: output.name, relativePath, state: entryState, issues, warnings});
    });
  });
  const readyCount = entries.filter((entry) => entry.state === 'ready').length;
  const skippedCount = entries.filter((entry) => entry.state === 'skipped').length;
  const blockedCount = entries.filter((entry) => entry.state === 'blocked').length;
  const canQueue = entries.length > 0 && readyCount > 0 && blockedCount === 0;
  return {
    schema: 'org.poietek.batch-delivery-plan/1.0.0', projectId: state.projectId, sourceRevision: state.revision, planKey: createBatchPlanKey(state), entries,
    collisionPaths: [...collisionPaths].sort(), readyCount, skippedCount, blockedCount, canQueue,
    claim: canQueue ? 'Every output path was resolved inside a relative delivery root. This is a dry-run plan; no directory or media file was created.' : 'The batch remains planning-only until it has at least one safe output and every blocking path issue is resolved.',
  };
}

export function deriveBatchDeliveryReadiness(state: BatchDeliveryState, plan: BatchDryRunPlan, observations: readonly ProductionAdapterObservation[]): BatchDeliveryReadiness {
  if (plan.projectId !== state.projectId || plan.sourceRevision !== state.revision) throw new Error('Batch dry-run plan is stale.');
  if (plan.planKey !== createBatchPlanKey(state)) throw new Error('Batch dry-run plan belongs to another recipe or output set.');
  const requiredCapabilities = deriveRequiredCapabilities(state);
  const observed = new Set(observations.filter((item) => item.state === 'available' && Boolean(item.evidenceReference?.trim())).map((item) => item.capability));
  const observedCapabilities = requiredCapabilities.filter((capability) => observed.has(capability));
  const missingCapabilities = requiredCapabilities.filter((capability) => !observed.has(capability));
  const localPlanReady = plan.canQueue;
  const pilotApproved = state.pilot.status === 'approved' && Boolean(state.pilot.evidence && state.pilot.approvedAt && state.pilot.evidence.planKey === plan.planKey);
  const adaptersObserved = missingCapabilities.length === 0;
  const canRequestRender = localPlanReady && pilotApproved && adaptersObserved;
  const blockers = [!localPlanReady ? 'a safe dry run' : null, !pilotApproved ? 'an evidenced and approved one-file pilot' : null, !adaptersObserved ? `adapter evidence for ${missingCapabilities.join(', ')}` : null].filter((value): value is string => Boolean(value));
  return {
    localPlanReady, pilotApproved, adaptersObserved, canRequestRender, requiredCapabilities, observedCapabilities, missingCapabilities,
    claim: canRequestRender ? 'The plan, pilot and declared adapter capabilities are evidenced. A render request may be handed to the owning adapter; completion still requires a returned run observation.' : `Batch rendering is blocked pending ${blockers.join('; ')}.`,
  };
}

export function createBatchDeliveryManifest(state: BatchDeliveryState, project: PoietekProject, options: BatchDryRunOptions = {}): string {
  const plan = createBatchDryRunPlan(state, project, options);
  return JSON.stringify({
    schema: 'org.poietek.batch-delivery-manifest/1.0.0', project: {id: project.id, title: project.title}, sourceRevision: state.revision,
    recipe: cloneRecipe(state.recipe), outputs: state.outputs.map((output) => ({...output})), pilot: clonePilot(state.pilot), plan,
    truth: 'Planning metadata only. No audio, plug-in, analyzer, encoder, filesystem write or finished delivery is embedded or claimed.',
  }, null, 2);
}

export function validateBatchDeliveryState(state: BatchDeliveryState, project?: PoietekProject): string[] {
  const issues: string[] = [];
  if (state.schemaVersion !== BATCH_DELIVERY_SCHEMA_VERSION) issues.push('Unsupported batch delivery schema version.');
  if (!state.projectId?.trim()) issues.push('Batch delivery project id is required.');
  if (!Number.isInteger(state.revision) || state.revision < 0) issues.push('Batch delivery revision must be a non-negative whole number.');
  if (!Array.isArray(state.sourceAssetIds)) issues.push('Batch delivery source asset list is malformed.');
  if (!state.recipe || !Array.isArray(state.recipe.nodes) || !Array.isArray(state.recipe.edges)) issues.push('Batch delivery recipe is malformed.');
  if (!Array.isArray(state.outputs)) issues.push('Batch delivery output list is malformed.');
  if (!state.pilot) issues.push('Batch delivery pilot state is missing.');
  if (issues.length) return issues;
  if (project && state.projectId !== project.id) issues.push('Batch delivery state belongs to another canonical project.');
  if (new Set(state.sourceAssetIds).size !== state.sourceAssetIds.length) issues.push('Batch delivery source list repeats an asset id.');
  const assets = project ? new Map(project.assets.map((asset) => [asset.id, asset])) : null;
  for (const assetId of state.sourceAssetIds) {
    const asset = assets?.get(assetId);
    if (assets && (!asset || asset.mediaType !== 'audio')) issues.push(`Batch source ${assetId} is not a canonical audio asset.`);
  }
  try { validateRecipe(state.recipe); } catch (reason) { issues.push(errorText(reason)); }
  const outputIds = new Set<string>();
  for (const output of state.outputs) {
    if (outputIds.has(output.id)) issues.push(`Duplicate batch output ${output.id}.`);
    outputIds.add(output.id);
    try { validateOutput(output); } catch (reason) { issues.push(errorText(reason)); }
  }
  if (state.pilot.assetId && !state.sourceAssetIds.includes(state.pilot.assetId)) issues.push('Batch pilot is not part of the source set.');
  if (!pilotStatuses.has(state.pilot.status)) issues.push('Batch pilot status is unsupported.');
  if (state.pilot.status === 'not_selected' && state.pilot.assetId) issues.push('Unselected batch pilot cannot reference an asset.');
  if (state.pilot.status !== 'not_selected' && !state.pilot.assetId) issues.push('Selected batch pilot requires an asset.');
  if ((state.pilot.status === 'preview_observed' || state.pilot.status === 'approved') && !state.pilot.evidence) issues.push('Observed or approved batch pilot requires adapter evidence.');
  if (state.pilot.evidence && (!state.pilot.evidence.adapterId?.trim() || !state.pilot.evidence.evidenceReference?.trim() || !state.pilot.evidence.planKey?.trim() || state.pilot.evidence.capability !== 'batch_preview_render' || !Number.isFinite(state.pilot.evidence.observedAt))) issues.push('Batch pilot evidence is malformed.');
  if (state.pilot.evidence?.planKey && state.pilot.evidence.planKey !== createBatchPlanKey(state)) issues.push('Batch pilot evidence belongs to another recipe, source or output plan.');
  if (state.pilot.status === 'approved' && !state.pilot.approvedAt) issues.push('Approved batch pilot requires an approval time.');
  if (state.lastRun) {
    try { validateRunObservation(state.lastRun); } catch (reason) { issues.push(errorText(reason)); }
    if (state.lastRun.sourceRevision >= state.revision) issues.push('Stored batch run evidence must precede the current state revision.');
    if (state.lastRun.planKey !== createBatchPlanKey(state)) issues.push('Stored batch run evidence belongs to another recipe, source or output plan.');
  }
  return issues;
}

export function withProjectBatchDeliveryState(project: PoietekProject, state: BatchDeliveryState): PoietekProject {
  const issues = validateBatchDeliveryState(state, project);
  if (issues.length) throw new Error(issues.join(' '));
  return {...project, updatedAt: new Date().toISOString(), extensions: {...project.extensions, [BATCH_DELIVERY_EXTENSION_KEY]: cloneState(state)}};
}

export function getProjectBatchDeliveryState(project: PoietekProject): BatchDeliveryState | null {
  const value = project.extensions[BATCH_DELIVERY_EXTENSION_KEY];
  if (value === undefined) return null;
  if (!value || typeof value !== 'object') throw new Error('Batch delivery extension is malformed.');
  const state = value as BatchDeliveryState;
  const issues = validateBatchDeliveryState(state, project);
  if (issues.length) throw new Error(issues.join(' '));
  return cloneState(state);
}

export type BatchDeliveryMutation = (state: BatchDeliveryState) => BatchDeliveryState;

/** Stable non-cryptographic identity for the exact sources, recipe and outputs; not a media digest. */
export function createBatchPlanKey(state: BatchDeliveryState): string {
  const serialized = JSON.stringify({projectId: state.projectId, sourceAssetIds: state.sourceAssetIds, recipe: state.recipe, outputs: state.outputs});
  let hash = 0x811c9dc5;
  for (let index = 0; index < serialized.length; index += 1) {
    hash ^= serialized.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `batch-plan-${hash.toString(16).padStart(8, '0')}`;
}

export function mutateProjectBatchDeliveryState(project: PoietekProject, mutation: BatchDeliveryMutation): PoietekProject {
  const current = getProjectBatchDeliveryState(project) ?? createBatchDeliveryState(project.id);
  return withProjectBatchDeliveryState(project, mutation(current));
}

function resolveBatchOutputPath(project: PoietekProject, asset: Asset, output: BatchOutputVariant, counter: number, versionLabel: string): string {
  const templateIssues = validateBatchNamingTemplate(output.namingTemplate);
  if (templateIssues.length) throw new Error(templateIssues.join(' '));
  const originalBase = asset.originalName.replace(/\.[^.]+$/, '') || asset.originalName;
  const values: Record<string, string> = {
    project: portableTokenValue(project.title), asset: portableTokenValue(originalBase), variant: portableTokenValue(output.name), version: versionLabel,
    sample_rate: output.sampleRate === 'source' ? String(asset.sampleRate ?? 'source') : String(output.sampleRate),
    channels: output.channels === 'source' ? String(asset.channels ?? 'source') : output.channels,
    hash8: portableTokenValue(asset.contentHash.slice(0, 8) || 'nohash'), ext: output.format,
  };
  const resolved = output.namingTemplate.trim().replace(/\{([^{}]+)\}/g, (_whole, tokenSpec: string) => {
    const [tokenName, widthText] = tokenSpec.split(':');
    return tokenName === 'counter' ? String(counter).padStart(Number(widthText ?? 1), '0') : values[tokenName] ?? '';
  });
  const withExtension = new RegExp(`\\.${output.format}$`, 'i').test(resolved) ? resolved : `${resolved}.${output.format}`;
  const segments = withExtension.split('/');
  if (segments.some((segment) => !segment || segment === '.' || segment === '..')) throw new Error('Resolved output path contains an unsafe directory segment.');
  for (const segment of segments) if (unsafeLiteralCharacters.test(segment) || reservedWindowsNames.test(segment) || /[ .]$/.test(segment)) throw new Error(`Resolved output segment "${segment}" is not portable across supported desktop filesystems.`);
  return segments.join('/');
}

function deriveRequiredCapabilities(state: BatchDeliveryState): string[] {
  const required = new Set<string>(['batch_audio_render', 'batch_preview_render', 'batch_filesystem_delivery']);
  for (const node of state.recipe.nodes) if (node.enabled && node.requiredCapability) required.add(node.requiredCapability);
  for (const output of state.outputs) {
    if (output.format === 'flac' || output.format === 'mp3' || output.format === 'ogg') required.add(`batch_encoder_${output.format}`);
    if (output.normalization === 'sample_peak') required.add('batch_sample_peak_analysis');
    if (output.normalization === 'loudness_target') { required.add('bs1770_loudness_analysis'); required.add('oversampled_true_peak'); }
  }
  return [...required].sort();
}

function validateRecipe(recipe: BatchRecipe): void {
  if (!recipe.id.trim() || !recipe.name.trim()) throw new Error('Batch recipe requires an id and name.');
  const nodeIds = new Set<string>();
  for (const node of recipe.nodes) { if (nodeIds.has(node.id)) throw new Error(`Duplicate batch recipe node ${node.id}.`); nodeIds.add(node.id); validateNode(node); }
  const edgeIds = new Set<string>();
  const adjacency = new Map<string, string[]>();
  for (const edge of recipe.edges) {
    if (!edge.id.trim()) throw new Error('Batch recipe edges require ids.');
    if (edgeIds.has(edge.id)) throw new Error(`Duplicate batch recipe edge ${edge.id}.`);
    edgeIds.add(edge.id);
    if (!nodeIds.has(edge.fromNodeId) || !nodeIds.has(edge.toNodeId)) throw new Error(`Batch recipe edge ${edge.id} references a missing node.`);
    if (edge.fromNodeId === edge.toNodeId) throw new Error(`Batch recipe edge ${edge.id} cannot connect a node to itself.`);
    adjacency.set(edge.fromNodeId, [...(adjacency.get(edge.fromNodeId) ?? []), edge.toNodeId]);
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (nodeId: string) => {
    if (visiting.has(nodeId)) throw new Error('Batch recipe graph must not contain a cycle.');
    if (visited.has(nodeId)) return;
    visiting.add(nodeId);
    for (const next of adjacency.get(nodeId) ?? []) visit(next);
    visiting.delete(nodeId);
    visited.add(nodeId);
  };
  for (const nodeId of nodeIds) visit(nodeId);
}

function validateNode(node: BatchRecipeNode): void {
  if (!node.id.trim() || !node.name.trim()) throw new Error('Batch recipe nodes require an id and name.');
  if (!recipeNodeKinds.has(node.kind)) throw new Error(`Batch recipe node ${node.id} has an unsupported kind.`);
  if (!new Set(['control_model', 'native_required', 'external_required']).has(node.engineState)) throw new Error(`Batch recipe node ${node.id} has an unsupported engine state.`);
  if (node.engineState === 'control_model' && node.requiredCapability) throw new Error(`Control-model node ${node.id} cannot claim an adapter capability.`);
  if (node.engineState !== 'control_model' && !node.requiredCapability?.trim()) throw new Error(`Adapter-gated node ${node.id} must declare its required capability.`);
}

function validateOutput(output: BatchOutputVariant): void {
  if (!output.id.trim() || !output.name.trim()) throw new Error('Batch outputs require an id and name.');
  if (!outputFormats.has(output.format)) throw new Error(`${output.name} has an unsupported output format.`);
  if (!sampleRates.has(output.sampleRate)) throw new Error(`${output.name} has an unsupported sample-rate intent.`);
  if (!bitDepths.has(output.bitDepth)) throw new Error(`${output.name} has an unsupported bit-depth intent.`);
  if (!channelLayouts.has(output.channels)) throw new Error(`${output.name} has an unsupported channel-layout intent.`);
  if (!conflictPolicies.has(output.conflictPolicy)) throw new Error(`${output.name} has an unsupported conflict policy.`);
  if (!normalizationModes.has(output.normalization)) throw new Error(`${output.name} has an unsupported normalization mode.`);
  const namingIssues = validateBatchNamingTemplate(output.namingTemplate);
  if (namingIssues.length) throw new Error(`${output.name}: ${namingIssues.join(' ')}`);
  if ((output.format === 'mp3' || output.format === 'ogg') && output.bitDepth !== null) throw new Error(`${output.name} must leave PCM bit depth unset for ${output.format.toUpperCase()}.`);
  if (output.format !== 'mp3' && output.format !== 'ogg' && output.bitDepth === null) throw new Error(`${output.name} requires a PCM bit-depth intent.`);
  if (!Number.isFinite(output.tailSeconds) || output.tailSeconds < 0 || output.tailSeconds > 120) throw new Error(`${output.name} tail must be from 0 to 120 seconds.`);
  if (output.normalization === 'none' && output.target !== null) throw new Error(`${output.name} cannot declare a target when normalization is disabled.`);
  if (output.normalization !== 'none' && (!Number.isFinite(output.target) || output.target === null)) throw new Error(`${output.name} normalization requires a finite target.`);
  if (output.normalization === 'sample_peak' && (output.target! > 0 || output.target! < -60)) throw new Error(`${output.name} sample-peak target must be from -60 to 0 dBFS.`);
  if (output.normalization === 'loudness_target' && (output.target! > -5 || output.target! < -70)) throw new Error(`${output.name} loudness target must be from -70 to -5 LUFS.`);
}

function validateRunObservation(observation: BatchRunObservation): void {
  if (!observation.adapterId.trim() || !observation.evidenceReference.trim()) throw new Error('Batch run observation requires an adapter and evidence reference.');
  if (!observation.planKey?.trim()) throw new Error('Batch run observation requires the exact plan key.');
  if (!Number.isInteger(observation.sourceRevision) || observation.sourceRevision < 0) throw new Error('Batch run source revision is invalid.');
  if (!runStatuses.has(observation.status)) throw new Error('Batch run status is unsupported.');
  if (!Number.isFinite(observation.startedAt) || !Number.isFinite(observation.finishedAt) || observation.finishedAt < observation.startedAt) throw new Error('Batch run time range is invalid.');
  const counts = [observation.total, observation.succeeded, observation.failed, observation.skipped];
  if (counts.some((count) => !Number.isInteger(count) || count < 0)) throw new Error('Batch run counts must be non-negative whole numbers.');
  if (observation.succeeded + observation.failed + observation.skipped !== observation.total) throw new Error('Batch run result counts must add up to the total.');
  if (observation.status === 'success' && observation.failed > 0) throw new Error('Successful batch run evidence cannot contain failed items.');
}

function portableTokenValue(value: string): string {
  const normalized = value.trim().normalize('NFKC').replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').replace(/\s+/g, ' ').replace(/[ .]+$/g, '').replace(/^-+|-+$/g, '') || 'untitled';
  return reservedWindowsNames.test(normalized) ? `_${normalized}` : normalized;
}
function stripTokens(value: string): string { return value.replace(/\{[^{}]+\}/g, ''); }
function normalizeComparisonPath(value: string): string { return value.replace(/\\/g, '/').normalize('NFKC').toLocaleLowerCase(); }
function findVersionedPath(path: string, planned: ReadonlySet<string>, existing: ReadonlySet<string>): string {
  const match = /^(.*?)(\.[^./]+)$/.exec(path);
  const base = match?.[1] ?? path;
  const extension = match?.[2] ?? '';
  for (let version = 2; version <= 9999; version += 1) {
    const candidate = `${base}-v${version}${extension}`;
    const comparison = normalizeComparisonPath(candidate);
    if (!planned.has(comparison) && !existing.has(comparison)) return candidate;
  }
  throw new Error('Unable to resolve a unique versioned output path.');
}
function invalidatePilot(state: BatchDeliveryState): BatchDeliveryState {
  return {...state, pilot: state.pilot.assetId ? {assetId: state.pilot.assetId, status: 'preview_required', evidence: null, approvedAt: null} : {assetId: null, status: 'not_selected', evidence: null, approvedAt: null}};
}
function validateNext(state: BatchDeliveryState, project?: PoietekProject): BatchDeliveryState {
  const issues = validateBatchDeliveryState(state, project);
  if (issues.length) throw new Error(issues.join(' '));
  return state;
}
function cloneNode(node: BatchRecipeNode): BatchRecipeNode { return {...node, parameters: {...node.parameters}}; }
function cloneRecipe(recipe: BatchRecipe): BatchRecipe { return {...recipe, nodes: recipe.nodes.map(cloneNode), edges: recipe.edges.map((edge) => ({...edge}))}; }
function clonePilot(pilot: BatchPilot): BatchPilot { return {...pilot, evidence: pilot.evidence ? {...pilot.evidence} : null}; }
function cloneState(state: BatchDeliveryState): BatchDeliveryState {
  return {...state, sourceAssetIds: [...state.sourceAssetIds], recipe: cloneRecipe(state.recipe), outputs: state.outputs.map((output) => ({...output})), pilot: clonePilot(state.pilot), lastRun: state.lastRun ? {...state.lastRun} : null};
}
function errorText(reason: unknown): string { return reason instanceof Error ? reason.message : String(reason); }
