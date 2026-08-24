import type {AudioClip, PoietekProject, Track} from '../domain/types';
import {
  EDITORIAL_WORKFLOW_SCHEMA_VERSION,
  type CreateEditorialClipGroupInput,
  type EditorialBatchRenamePlan,
  type EditorialClipGroup,
  type EditorialClipReference,
  type EditorialEditPolicy,
  type EditorialMemoryLocation,
  type EditorialOperationRecord,
  type EditorialReadiness,
  type EditorialWorkflowState,
  type SaveEditorialMemoryInput,
} from './contracts';

const idPattern = /^[a-z0-9._-]{1,96}$/i;
const colorPattern = /^#[0-9a-f]{6}$/i;
const editPolicies = new Set<EditorialEditPolicy>(['free', 'grid', 'ripple_plan', 'location_plan']);

interface LocatedClip {
  track: Track;
  clip: AudioClip;
}

function cloneMemory(memory: EditorialMemoryLocation): EditorialMemoryLocation {
  return {...memory, trackIds: [...memory.trackIds]};
}

function cloneGroup(group: EditorialClipGroup): EditorialClipGroup {
  return {...group, clipReferences: group.clipReferences.map((reference) => ({...reference}))};
}

function cloneOperation(operation: EditorialOperationRecord): EditorialOperationRecord {
  return {...operation, affectedIds: [...operation.affectedIds]};
}

function locateClip(project: PoietekProject, reference: EditorialClipReference): LocatedClip | null {
  const track = project.tracks.find((candidate) => candidate.id === reference.trackId);
  const clip = track?.clips.find((candidate) => candidate.id === reference.clipId);
  return track && clip ? {track, clip} : null;
}

function requireOperationId(state: EditorialWorkflowState, operationId: string): void {
  if (!idPattern.test(operationId)) {
    throw new Error('Editorial operation id must contain only letters, numbers, dots, dashes or underscores.');
  }
  if (state.operationHistory.some((operation) => operation.id === operationId)) {
    throw new Error(`Editorial operation ${operationId} already exists.`);
  }
}

function validTimestamp(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}

function contained(clip: AudioClip, startTick: number, endTick: number): boolean {
  return clip.startTick >= startTick && clip.startTick + clip.durationTicks <= endTick;
}

function overlaps(clip: AudioClip, startTick: number, endTick: number): boolean {
  return clip.startTick < endTick && clip.startTick + clip.durationTicks > startTick;
}

function operation(
  id: string,
  kind: EditorialOperationRecord['kind'],
  performedAt: string,
  summary: string,
  affectedIds: string[],
  memoryId: string | null = null,
  groupId: string | null = null,
): EditorialOperationRecord {
  return {id, kind, memoryId, groupId, affectedIds: [...affectedIds], summary, performedAt};
}

export function createEditorialWorkflowState(projectId: string): EditorialWorkflowState {
  if (!projectId.trim()) throw new Error('Editorial Memory requires a project id.');
  return {
    schemaVersion: EDITORIAL_WORKFLOW_SCHEMA_VERSION,
    projectId,
    revision: 0,
    activeEditPolicy: 'grid',
    activeSelection: {startTick: 0, durationTicks: 0, trackIds: [], linkedToTransport: true},
    pinnedTrackIds: [],
    memoryLocations: [],
    clipGroups: [],
    operationHistory: [],
    lastRecalledMemoryId: null,
  };
}

export function validateEditorialWorkflowState(
  state: EditorialWorkflowState,
  project?: PoietekProject,
): string[] {
  const issues: string[] = [];
  if (state.schemaVersion !== EDITORIAL_WORKFLOW_SCHEMA_VERSION) issues.push('Unsupported Editorial Memory schema version.');
  if (!state.projectId.trim()) issues.push('Editorial Memory project id is required.');
  if (project && state.projectId !== project.id) issues.push('Editorial Memory state belongs to another project.');
  if (!Number.isInteger(state.revision) || state.revision < 0) issues.push('Editorial Memory revision must be a non-negative whole number.');
  if (!editPolicies.has(state.activeEditPolicy)) issues.push('Editorial edit policy is invalid.');
  if (!Number.isInteger(state.activeSelection.startTick) || state.activeSelection.startTick < 0) issues.push('Editorial selection start is invalid.');
  if (!Number.isInteger(state.activeSelection.durationTicks) || state.activeSelection.durationTicks < 0) issues.push('Editorial selection duration is invalid.');

  const projectTrackIds = new Set(project?.tracks.map((track) => track.id) ?? []);
  const validateTrackIds = (trackIds: readonly string[], context: string) => {
    const seen = new Set<string>();
    for (const trackId of trackIds) {
      if (!trackId.trim() || seen.has(trackId)) issues.push(`${context} contains an invalid or duplicate track ${trackId}.`);
      seen.add(trackId);
      if (project && !projectTrackIds.has(trackId)) issues.push(`${context} references missing track ${trackId}.`);
    }
  };
  validateTrackIds(state.activeSelection.trackIds, 'Editorial selection');
  validateTrackIds(state.pinnedTrackIds, 'Pinned track list');

  const memoryIds = new Set<string>();
  for (const memory of state.memoryLocations) {
    if (!idPattern.test(memory.id) || !memory.name.trim()) issues.push('Every editorial memory requires a valid id and name.');
    if (memoryIds.has(memory.id)) issues.push(`Duplicate editorial memory ${memory.id}.`);
    memoryIds.add(memory.id);
    if (!colorPattern.test(memory.color)) issues.push(`Editorial memory ${memory.id} has an invalid color.`);
    if (!Number.isInteger(memory.startTick) || memory.startTick < 0) issues.push(`Editorial memory ${memory.id} has an invalid start.`);
    if (!Number.isInteger(memory.durationTicks) || memory.durationTicks < 0) issues.push(`Editorial memory ${memory.id} has an invalid duration.`);
    if (memory.kind === 'point' && memory.durationTicks !== 0) issues.push(`Point memory ${memory.id} must have zero duration.`);
    if (memory.kind === 'range' && memory.durationTicks < 1) issues.push(`Range memory ${memory.id} must have a positive duration.`);
    if (!Number.isInteger(memory.preRollTicks) || memory.preRollTicks < 0 || !Number.isInteger(memory.postRollTicks) || memory.postRollTicks < 0) {
      issues.push(`Editorial memory ${memory.id} has invalid pre-roll or post-roll.`);
    }
    if (!validTimestamp(memory.createdAt)) issues.push(`Editorial memory ${memory.id} has an invalid creation time.`);
    validateTrackIds(memory.trackIds, `Editorial memory ${memory.id}`);
  }
  if (state.lastRecalledMemoryId && !memoryIds.has(state.lastRecalledMemoryId)) issues.push('Last recalled editorial memory is missing.');

  const groupIds = new Set<string>();
  for (const group of state.clipGroups) {
    if (!idPattern.test(group.id) || !group.name.trim()) issues.push('Every editorial clip group requires a valid id and name.');
    if (groupIds.has(group.id)) issues.push(`Duplicate editorial clip group ${group.id}.`);
    groupIds.add(group.id);
    if (!colorPattern.test(group.color)) issues.push(`Editorial clip group ${group.id} has an invalid color.`);
    if (!Number.isInteger(group.startTick) || group.startTick < 0 || !Number.isInteger(group.endTick) || group.endTick <= group.startTick) {
      issues.push(`Editorial clip group ${group.id} has an invalid range.`);
    }
    if (!group.clipReferences.length) issues.push(`Editorial clip group ${group.id} is empty.`);
    if (!validTimestamp(group.createdAt)) issues.push(`Editorial clip group ${group.id} has an invalid creation time.`);
    const referenceKeys = new Set<string>();
    let observedStart = Number.POSITIVE_INFINITY;
    let observedEnd = 0;
    for (const reference of group.clipReferences) {
      const key = `${reference.trackId}:${reference.clipId}`;
      if (referenceKeys.has(key)) issues.push(`Editorial clip group ${group.id} contains duplicate reference ${key}.`);
      referenceKeys.add(key);
      const located = project ? locateClip(project, reference) : null;
      if (project && !located) issues.push(`Editorial clip group ${group.id} references missing clip ${key}.`);
      if (located) {
        observedStart = Math.min(observedStart, located.clip.startTick);
        observedEnd = Math.max(observedEnd, located.clip.startTick + located.clip.durationTicks);
      }
    }
    if (project && group.clipReferences.length && Number.isFinite(observedStart) && (group.startTick !== observedStart || group.endTick !== observedEnd)) {
      issues.push(`Editorial clip group ${group.id} range no longer matches its canonical clips.`);
    }
  }

  const operationIds = new Set<string>();
  for (const item of state.operationHistory) {
    if (!idPattern.test(item.id)) issues.push('Editorial operation id is invalid.');
    if (operationIds.has(item.id)) issues.push(`Duplicate editorial operation ${item.id}.`);
    operationIds.add(item.id);
    if (!item.summary.trim() || !validTimestamp(item.performedAt)) issues.push(`Editorial operation ${item.id} is incomplete.`);
  }
  return issues;
}

export function saveEditorialMemory(
  project: PoietekProject,
  state: EditorialWorkflowState,
  input: SaveEditorialMemoryInput,
): EditorialWorkflowState {
  if (state.projectId !== project.id) throw new Error('Editorial Memory state belongs to another project.');
  if (!idPattern.test(input.id) || !input.name.trim()) throw new Error('Editorial memory requires a valid id and name.');
  if (state.memoryLocations.some((memory) => memory.id === input.id)) throw new Error(`Editorial memory ${input.id} already exists.`);
  if (!colorPattern.test(input.color)) throw new Error('Editorial memory color must be a six-digit hex value.');
  if (!Number.isInteger(input.startTick) || input.startTick < 0) throw new Error('Editorial memory start must be a non-negative whole tick.');
  const durationTicks = input.kind === 'point' ? 0 : input.durationTicks;
  if (!Number.isInteger(durationTicks) || durationTicks < (input.kind === 'range' ? 1 : 0)) throw new Error('Editorial memory duration is invalid.');
  const trackIds = [...new Set(input.trackIds ?? [])];
  for (const trackId of trackIds) if (!project.tracks.some((track) => track.id === trackId)) throw new Error(`Editorial memory references missing track ${trackId}.`);
  const createdAt = input.createdAt ?? new Date().toISOString();
  if (!validTimestamp(createdAt)) throw new Error('Editorial memory creation time is invalid.');
  const operationId = input.operationId ?? `memory.${input.id}`;
  requireOperationId(state, operationId);
  const memory: EditorialMemoryLocation = {
    id: input.id,
    name: input.name.trim(),
    color: input.color,
    kind: input.kind,
    startTick: input.startTick,
    durationTicks,
    trackIds,
    preRollTicks: input.preRollTicks ?? 0,
    postRollTicks: input.postRollTicks ?? 0,
    notes: input.notes?.trim() ?? '',
    createdAt,
  };
  return {
    ...state,
    revision: state.revision + 1,
    memoryLocations: [...state.memoryLocations.map(cloneMemory), memory],
    clipGroups: state.clipGroups.map(cloneGroup),
    operationHistory: [...state.operationHistory.map(cloneOperation), operation(operationId, 'save_memory', createdAt, `Saved ${memory.kind} memory ${memory.name}.`, [memory.id], memory.id)],
  };
}

export function recallEditorialMemory(
  project: PoietekProject,
  state: EditorialWorkflowState,
  memoryId: string,
  operationId: string,
  performedAt = new Date().toISOString(),
): EditorialWorkflowState {
  const issues = validateEditorialWorkflowState(state, project);
  if (issues.length) throw new Error(issues.join(' '));
  requireOperationId(state, operationId);
  const memory = state.memoryLocations.find((candidate) => candidate.id === memoryId);
  if (!memory) throw new Error(`Editorial memory ${memoryId} was not found.`);
  return {
    ...state,
    revision: state.revision + 1,
    activeSelection: {
      startTick: memory.startTick,
      durationTicks: memory.durationTicks,
      trackIds: [...memory.trackIds],
      linkedToTransport: state.activeSelection.linkedToTransport,
    },
    memoryLocations: state.memoryLocations.map(cloneMemory),
    clipGroups: state.clipGroups.map(cloneGroup),
    lastRecalledMemoryId: memory.id,
    operationHistory: [...state.operationHistory.map(cloneOperation), operation(operationId, 'recall_memory', performedAt, `Recalled ${memory.name} into the saved edit selection.`, [memory.id, ...memory.trackIds], memory.id)],
  };
}

export function createEditorialClipGroup(
  project: PoietekProject,
  state: EditorialWorkflowState,
  input: CreateEditorialClipGroupInput,
): EditorialWorkflowState {
  if (state.projectId !== project.id) throw new Error('Editorial Memory state belongs to another project.');
  if (!idPattern.test(input.id) || !input.name.trim()) throw new Error('Editorial clip group requires a valid id and name.');
  if (state.clipGroups.some((group) => group.id === input.id)) throw new Error(`Editorial clip group ${input.id} already exists.`);
  if (!colorPattern.test(input.color)) throw new Error('Editorial clip group color must be a six-digit hex value.');
  if (!Number.isInteger(input.startTick) || input.startTick < 0 || !Number.isInteger(input.durationTicks) || input.durationTicks < 1) {
    throw new Error('Editorial clip group requires a non-negative start and positive whole-tick duration.');
  }
  const endTick = input.startTick + input.durationTicks;
  const allowedTrackIds = input.trackIds?.length ? new Set(input.trackIds) : null;
  if (allowedTrackIds) for (const trackId of allowedTrackIds) if (!project.tracks.some((track) => track.id === trackId && track.type === 'audio')) throw new Error(`Editorial clip group requires existing audio track ${trackId}.`);
  const selected: LocatedClip[] = [];
  const boundaryConflicts: string[] = [];
  for (const track of project.tracks.filter((candidate) => candidate.type === 'audio')) {
    if (allowedTrackIds && !allowedTrackIds.has(track.id)) continue;
    for (const clip of track.clips) {
      if (!overlaps(clip, input.startTick, endTick)) continue;
      if (!contained(clip, input.startTick, endTick)) boundaryConflicts.push(clip.id);
      else selected.push({track, clip});
    }
  }
  if (boundaryConflicts.length) throw new Error(`Clip-group boundary cuts through canonical clips: ${boundaryConflicts.join(', ')}.`);
  if (!selected.length) throw new Error('No canonical audio clips were fully contained in the requested clip-group range.');
  selected.sort((left, right) => left.clip.startTick - right.clip.startTick || left.track.order - right.track.order || left.clip.id.localeCompare(right.clip.id));
  const createdAt = input.createdAt ?? new Date().toISOString();
  if (!validTimestamp(createdAt)) throw new Error('Editorial clip-group creation time is invalid.');
  const operationId = input.operationId ?? `group.${input.id}`;
  requireOperationId(state, operationId);
  const group: EditorialClipGroup = {
    id: input.id,
    name: input.name.trim(),
    color: input.color,
    startTick: Math.min(...selected.map(({clip}) => clip.startTick)),
    endTick: Math.max(...selected.map(({clip}) => clip.startTick + clip.durationTicks)),
    clipReferences: selected.map(({track, clip}) => ({trackId: track.id, clipId: clip.id})),
    createdAt,
  };
  return {
    ...state,
    revision: state.revision + 1,
    memoryLocations: state.memoryLocations.map(cloneMemory),
    clipGroups: [...state.clipGroups.map(cloneGroup), group],
    operationHistory: [...state.operationHistory.map(cloneOperation), operation(operationId, 'create_clip_group', createdAt, `Grouped ${group.clipReferences.length} exact canonical clips as ${group.name}.`, group.clipReferences.map((reference) => reference.clipId), null, group.id)],
  };
}

export function buildEditorialBatchRenamePlan(
  project: PoietekProject,
  state: EditorialWorkflowState,
  groupId: string,
  prefix: string,
  startingNumber: number,
  digits: number,
  operationId: string,
): EditorialBatchRenamePlan {
  const issues = validateEditorialWorkflowState(state, project);
  if (issues.length) throw new Error(issues.join(' '));
  requireOperationId(state, operationId);
  const group = state.clipGroups.find((candidate) => candidate.id === groupId);
  if (!group) throw new Error(`Editorial clip group ${groupId} was not found.`);
  const safePrefix = prefix.trim();
  if (!safePrefix || safePrefix.length > 48 || /[\\/:*?"<>|]/.test(safePrefix)) throw new Error('Batch rename prefix must be 1–48 filename-safe characters.');
  if (!Number.isInteger(startingNumber) || startingNumber < 0 || startingNumber > 999999) throw new Error('Batch rename starting number is invalid.');
  if (!Number.isInteger(digits) || digits < 1 || digits > 6) throw new Error('Batch rename digits must be between 1 and 6.');
  const entries = group.clipReferences.map((reference, index) => {
    const located = locateClip(project, reference);
    if (!located) throw new Error(`Editorial clip ${reference.clipId} is missing.`);
    const sequenceNumber = startingNumber + index;
    return {
      ...reference,
      sourceName: located.clip.name,
      outputName: `${safePrefix}_${String(sequenceNumber).padStart(digits, '0')}`,
      sequenceNumber,
    };
  });
  return {
    operationId,
    groupId,
    prefix: safePrefix,
    startingNumber,
    digits,
    entries,
    claim: 'Preview only. Applying changes canonical clip display names; asset names and files remain unchanged.',
  };
}

export function applyEditorialBatchRenamePlan(
  project: PoietekProject,
  state: EditorialWorkflowState,
  plan: EditorialBatchRenamePlan,
  performedAt = new Date().toISOString(),
): {project: PoietekProject; state: EditorialWorkflowState} {
  const issues = validateEditorialWorkflowState(state, project);
  if (issues.length) throw new Error(issues.join(' '));
  requireOperationId(state, plan.operationId);
  const group = state.clipGroups.find((candidate) => candidate.id === plan.groupId);
  if (!group) throw new Error(`Editorial clip group ${plan.groupId} was not found.`);
  if (plan.entries.length !== group.clipReferences.length) throw new Error('Batch rename preview is stale because the clip group changed.');
  const outputs = new Set<string>();
  for (const entry of plan.entries) {
    const located = locateClip(project, entry);
    if (!located || located.clip.name !== entry.sourceName) throw new Error(`Batch rename preview is stale for clip ${entry.clipId}.`);
    if (!entry.outputName.trim() || outputs.has(entry.outputName)) throw new Error('Batch rename output names must be non-empty and unique inside the group.');
    outputs.add(entry.outputName);
  }
  const renameByClip = new Map(plan.entries.map((entry) => [`${entry.trackId}:${entry.clipId}`, entry.outputName]));
  const renamedProject: PoietekProject = {
    ...project,
    tracks: project.tracks.map((track) => ({
      ...track,
      clips: track.clips.map((clip) => {
        const name = renameByClip.get(`${track.id}:${clip.id}`);
        return name ? {...clip, name} : clip;
      }),
    })),
  };
  const nextState: EditorialWorkflowState = {
    ...state,
    revision: state.revision + 1,
    memoryLocations: state.memoryLocations.map(cloneMemory),
    clipGroups: state.clipGroups.map(cloneGroup),
    operationHistory: [...state.operationHistory.map(cloneOperation), operation(plan.operationId, 'batch_clip_rename', performedAt, `Renamed ${plan.entries.length} clip display names using ${plan.prefix}. Asset and disk names were preserved.`, plan.entries.map((entry) => entry.clipId), null, plan.groupId)],
  };
  return {project: renamedProject, state: nextState};
}

export function setEditorialEditPolicy(
  state: EditorialWorkflowState,
  policy: EditorialEditPolicy,
  operationId: string,
  performedAt = new Date().toISOString(),
): EditorialWorkflowState {
  if (!editPolicies.has(policy)) throw new Error('Editorial edit policy is invalid.');
  requireOperationId(state, operationId);
  return {
    ...state,
    revision: state.revision + 1,
    activeEditPolicy: policy,
    memoryLocations: state.memoryLocations.map(cloneMemory),
    clipGroups: state.clipGroups.map(cloneGroup),
    operationHistory: [...state.operationHistory.map(cloneOperation), operation(operationId, 'set_edit_policy', performedAt, `Saved ${policy.replaceAll('_', ' ')} as the editorial policy.`, [policy])],
  };
}

export function toggleEditorialTrackPin(
  project: PoietekProject,
  state: EditorialWorkflowState,
  trackId: string,
  operationId: string,
  performedAt = new Date().toISOString(),
): EditorialWorkflowState {
  if (!project.tracks.some((track) => track.id === trackId)) throw new Error(`Track ${trackId} was not found.`);
  requireOperationId(state, operationId);
  const pinned = state.pinnedTrackIds.includes(trackId)
    ? state.pinnedTrackIds.filter((id) => id !== trackId)
    : [...state.pinnedTrackIds, trackId];
  return {
    ...state,
    revision: state.revision + 1,
    pinnedTrackIds: pinned,
    memoryLocations: state.memoryLocations.map(cloneMemory),
    clipGroups: state.clipGroups.map(cloneGroup),
    operationHistory: [...state.operationHistory.map(cloneOperation), operation(operationId, 'pin_tracks', performedAt, `${pinned.includes(trackId) ? 'Pinned' : 'Unpinned'} track ${trackId}.`, [trackId])],
  };
}

export function evaluateEditorialReadiness(): EditorialReadiness {
  return {
    canonicalState: 'ready',
    memoryLocations: 'ready',
    clipGroups: 'ready',
    batchDisplayRename: 'ready',
    projectUndo: 'ready',
    diskFileRename: 'native_adapter_required',
    sessionInterchange: 'licensed_adapter_required',
    speechToText: 'model_adapter_required',
    controlSurfaces: 'hardware_adapter_required',
    pluginHosting: 'licensed_native_host_required',
    immersiveDelivery: 'licensed_renderer_required',
  };
}
