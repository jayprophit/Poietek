import type {PoietekProject} from '../domain/types';
import {getProjectCompositionWorkflow} from '../composition-workflows';
import {
  PRODUCTION_REGION_SCHEMA_VERSION,
  type CaptureProductionRegionInput,
  type ProductionRegion,
  type ProductionRegionAction,
  type ProductionRegionActionPlan,
  type ProductionRegionMemberReference,
  type ProductionRegionPlanEntry,
  type ProductionRegionReadiness,
  type ProductionRegionState,
} from './contracts';

const colorPattern = /^#[0-9a-f]{6}$/i;
const operationIdPattern = /^[a-z0-9._-]{1,64}$/i;

function memberKey(member: ProductionRegionMemberReference): string {
  return [member.kind, member.containerId, member.itemId ?? '', member.tick ?? ''].join(':');
}

function overlaps(startTick: number, durationTicks: number, regionStart: number, regionEnd: number): boolean {
  return startTick < regionEnd && startTick + durationTicks > regionStart;
}

function contained(startTick: number, durationTicks: number, regionStart: number, regionEnd: number): boolean {
  return startTick >= regionStart && startTick + durationTicks <= regionEnd;
}

function cloneMember(member: ProductionRegionMemberReference): ProductionRegionMemberReference {
  return {...member};
}

function cloneRegion(region: ProductionRegion): ProductionRegion {
  return {...region, members: region.members.map(cloneMember)};
}

export function createProductionRegionState(projectId: string): ProductionRegionState {
  if (!projectId.trim()) throw new Error('Production Regions require a project id.');
  return {
    schemaVersion: PRODUCTION_REGION_SCHEMA_VERSION,
    projectId,
    revision: 0,
    regions: [],
    operationHistory: [],
  };
}

export function validateProductionRegionState(
  state: ProductionRegionState,
  project?: PoietekProject,
): string[] {
  const issues: string[] = [];
  if (state.schemaVersion !== PRODUCTION_REGION_SCHEMA_VERSION) {
    issues.push('Unsupported Production Regions schema version.');
  }
  if (!state.projectId.trim()) issues.push('Production Regions project id is required.');
  if (!Number.isInteger(state.revision) || state.revision < 0) {
    issues.push('Production Regions revision must be a non-negative whole number.');
  }
  if (project && state.projectId !== project.id) {
    issues.push('Production Regions state belongs to another project.');
  }

  const composition = project ? getProjectCompositionWorkflow(project) : null;
  const regionIds = new Set<string>();
  for (const region of state.regions) {
    if (!region.id.trim() || !region.name.trim()) issues.push('Every production region requires an id and name.');
    if (regionIds.has(region.id)) issues.push(`Duplicate production region id ${region.id}.`);
    regionIds.add(region.id);
    if (!colorPattern.test(region.color)) issues.push(`Production region ${region.id} requires a six-digit hex color.`);
    if (!Number.isInteger(region.startTick) || region.startTick < 0) {
      issues.push(`Production region ${region.id} has an invalid start tick.`);
    }
    if (!Number.isInteger(region.durationTicks) || region.durationTicks < 1) {
      issues.push(`Production region ${region.id} has an invalid duration.`);
    }
    if (!region.members.length) issues.push(`Production region ${region.id} has no canonical members.`);
    if (Number.isNaN(Date.parse(region.createdAt))) issues.push(`Production region ${region.id} has an invalid creation time.`);
    const keys = new Set<string>();
    const regionEnd = region.startTick + region.durationTicks;
    for (const member of region.members) {
      const key = memberKey(member);
      if (keys.has(key)) issues.push(`Production region ${region.id} contains duplicate member ${key}.`);
      keys.add(key);
      if (!member.containerId.trim()) issues.push(`Production region ${region.id} has a member without a container.`);
      if (member.kind === 'automation_point') {
        if (member.itemId !== null || !Number.isInteger(member.tick) || member.tick! < region.startTick || member.tick! >= regionEnd) {
          issues.push(`Production region ${region.id} has an invalid automation-point reference.`);
        }
        if (project && !composition?.automationEnvelopes.some((envelope) => (
          envelope.id === member.containerId && envelope.points.some((point) => point.tick === member.tick)
        ))) issues.push(`Production region ${region.id} references missing automation point ${member.containerId}:${member.tick}.`);
        continue;
      }
      if (!member.itemId?.trim() || member.tick !== null) {
        issues.push(`Production region ${region.id} has an invalid clip reference.`);
        continue;
      }
      if (project && member.kind === 'audio_clip') {
        const track = project.tracks.find((candidate) => candidate.id === member.containerId);
        const clip = track?.clips.find((candidate) => candidate.id === member.itemId);
        if (!clip) issues.push(`Production region ${region.id} references missing audio clip ${member.itemId}.`);
        else if (!contained(clip.startTick, clip.durationTicks, region.startTick, regionEnd)) {
          issues.push(`Audio clip ${clip.id} is outside production region ${region.id}.`);
        }
      }
      if (project && member.kind === 'arrangement_clip') {
        const lane = composition?.lanes.find((candidate) => candidate.id === member.containerId);
        const clip = lane?.clips.find((candidate) => candidate.id === member.itemId);
        if (!clip) issues.push(`Production region ${region.id} references missing arrangement clip ${member.itemId}.`);
        else if (!contained(clip.startTick, clip.durationTicks, region.startTick, regionEnd)) {
          issues.push(`Arrangement clip ${clip.id} is outside production region ${region.id}.`);
        }
      }
    }
  }

  const operationIds = new Set<string>();
  for (const operation of state.operationHistory) {
    if (!operationIdPattern.test(operation.id)) issues.push('Production region operation id is invalid.');
    if (operationIds.has(operation.id)) issues.push(`Duplicate production region operation ${operation.id}.`);
    operationIds.add(operation.id);
    if (!operation.regionId.trim() || !operation.resultRegionId.trim()) issues.push(`Production region operation ${operation.id} has invalid region identity.`);
    if (!Number.isInteger(operation.sourceStartTick) || !Number.isInteger(operation.targetStartTick) || !Number.isInteger(operation.deltaTicks)) {
      issues.push(`Production region operation ${operation.id} has invalid timing.`);
    }
    if (!Number.isInteger(operation.memberCount) || operation.memberCount < 1) {
      issues.push(`Production region operation ${operation.id} has an invalid member count.`);
    }
    if (Number.isNaN(Date.parse(operation.performedAt))) issues.push(`Production region operation ${operation.id} has an invalid timestamp.`);
  }
  return issues;
}

export function captureProductionRegion(
  project: PoietekProject,
  state: ProductionRegionState,
  input: CaptureProductionRegionInput,
): ProductionRegionState {
  if (state.projectId !== project.id) throw new Error('Production Regions state belongs to another project.');
  if (!input.id.trim() || !input.name.trim()) throw new Error('Production region id and name are required.');
  if (state.regions.some((region) => region.id === input.id)) throw new Error(`Production region ${input.id} already exists.`);
  if (!colorPattern.test(input.color)) throw new Error('Production region color must be a six-digit hex value.');
  if (!Number.isInteger(input.startTick) || input.startTick < 0) throw new Error('Production region start must be a non-negative whole tick.');
  if (!Number.isInteger(input.durationTicks) || input.durationTicks < 1) throw new Error('Production region duration must be a positive whole tick value.');
  const createdAt = input.createdAt ?? new Date().toISOString();
  if (Number.isNaN(Date.parse(createdAt))) throw new Error('Production region creation time is invalid.');

  const endTick = input.startTick + input.durationTicks;
  const members: ProductionRegionMemberReference[] = [];
  const boundaryConflicts: string[] = [];
  const allowedTrackIds = input.trackIds?.length ? new Set(input.trackIds) : null;
  if (input.includeAudioTracks !== false) {
    for (const track of project.tracks) {
      if (allowedTrackIds && !allowedTrackIds.has(track.id)) continue;
      for (const clip of track.clips) {
        if (!overlaps(clip.startTick, clip.durationTicks, input.startTick, endTick)) continue;
        if (!contained(clip.startTick, clip.durationTicks, input.startTick, endTick)) {
          boundaryConflicts.push(`audio clip ${clip.id}`);
          continue;
        }
        members.push({kind: 'audio_clip', containerId: track.id, itemId: clip.id, tick: null});
      }
    }
  }

  const composition = getProjectCompositionWorkflow(project);
  const allowedLaneIds = input.arrangementLaneIds?.length ? new Set(input.arrangementLaneIds) : null;
  if (input.includeArrangementLanes !== false && composition) {
    for (const lane of composition.lanes) {
      if (allowedLaneIds && !allowedLaneIds.has(lane.id)) continue;
      for (const clip of lane.clips) {
        if (!overlaps(clip.startTick, clip.durationTicks, input.startTick, endTick)) continue;
        if (!contained(clip.startTick, clip.durationTicks, input.startTick, endTick)) {
          boundaryConflicts.push(`arrangement clip ${clip.id}`);
          continue;
        }
        members.push({kind: 'arrangement_clip', containerId: lane.id, itemId: clip.id, tick: null});
      }
    }
  }
  if (input.includeAutomation !== false && composition) {
    for (const envelope of composition.automationEnvelopes) {
      for (const point of envelope.points) {
        if (point.tick >= input.startTick && point.tick < endTick) {
          members.push({kind: 'automation_point', containerId: envelope.id, itemId: null, tick: point.tick});
        }
      }
    }
  }
  if (boundaryConflicts.length) {
    throw new Error('Production region boundaries split canonical material: ' + boundaryConflicts.join(', ') + '. Move the boundary or split the material first.');
  }
  if (!members.length) throw new Error('No canonical clips or automation points were found inside this production region.');
  const region: ProductionRegion = {
    id: input.id,
    name: input.name,
    color: input.color,
    startTick: input.startTick,
    durationTicks: input.durationTicks,
    members: members.sort((left, right) => memberKey(left).localeCompare(memberKey(right))),
    createdAt,
  };
  return {
    ...state,
    revision: state.revision + 1,
    regions: [...state.regions.map(cloneRegion), region],
    operationHistory: state.operationHistory.map((operation) => ({...operation})),
  };
}

function itemTick(project: PoietekProject, member: ProductionRegionMemberReference): number {
  if (member.kind === 'automation_point') return member.tick!;
  if (member.kind === 'audio_clip') {
    const clip = project.tracks.find((track) => track.id === member.containerId)?.clips.find((candidate) => candidate.id === member.itemId);
    if (!clip) throw new Error(`Audio clip ${member.itemId} was not found.`);
    return clip.startTick;
  }
  const composition = getProjectCompositionWorkflow(project);
  const clip = composition?.lanes.find((lane) => lane.id === member.containerId)?.clips.find((candidate) => candidate.id === member.itemId);
  if (!clip) throw new Error(`Arrangement clip ${member.itemId} was not found.`);
  return clip.startTick;
}

function copyItemId(itemId: string, operationId: string): string {
  return `${itemId}.region.${operationId}`;
}

export function buildProductionRegionActionPlan(
  project: PoietekProject,
  state: ProductionRegionState,
  regionId: string,
  action: ProductionRegionAction,
  targetStartTick: number,
  operationId: string,
): ProductionRegionActionPlan {
  if (state.projectId !== project.id) throw new Error('Production Regions state belongs to another project.');
  const issues = validateProductionRegionState(state, project);
  if (issues.length) throw new Error(issues.join(' '));
  const region = state.regions.find((candidate) => candidate.id === regionId);
  if (!region) throw new Error(`Production region ${regionId} was not found.`);
  if (action !== 'move' && action !== 'copy') throw new Error('Production region action must be move or copy.');
  if (!Number.isInteger(targetStartTick) || targetStartTick < 0) throw new Error('Production region target must be a non-negative whole tick.');
  if (!operationIdPattern.test(operationId)) throw new Error('Production region operation id must contain only letters, numbers, dots, dashes or underscores.');
  if (state.operationHistory.some((operation) => operation.id === operationId)) throw new Error(`Production region operation ${operationId} already exists.`);
  const deltaTicks = targetStartTick - region.startTick;
  if (deltaTicks === 0) throw new Error('Production region destination must differ from its current start.');
  const resultRegionId = action === 'move' ? region.id : `${region.id}.copy.${operationId}`;
  if (action === 'copy' && state.regions.some((candidate) => candidate.id === resultRegionId)) {
    throw new Error(`Copied production region ${resultRegionId} already exists.`);
  }

  const entries: ProductionRegionPlanEntry[] = region.members.map((member) => {
    const sourceTick = itemTick(project, member);
    const targetTick = sourceTick + deltaTicks;
    if (targetTick < 0) throw new Error(`Production region member ${memberKey(member)} would move before project start.`);
    return {
      kind: member.kind,
      containerId: member.containerId,
      sourceItemId: member.itemId,
      targetItemId: member.itemId && action === 'copy' ? copyItemId(member.itemId, operationId) : member.itemId,
      sourceTick,
      targetTick,
    };
  });

  if (action === 'copy') {
    const canonicalClipIds = new Set(project.tracks.flatMap((track) => track.clips.map((clip) => clip.id)));
    const composition = getProjectCompositionWorkflow(project);
    const arrangementClipIds = new Set(composition?.lanes.flatMap((lane) => lane.clips.map((clip) => clip.id)) ?? []);
    for (const entry of entries) {
      if (entry.kind === 'audio_clip' && canonicalClipIds.has(entry.targetItemId!)) throw new Error(`Copied audio clip ${entry.targetItemId} already exists.`);
      if (entry.kind === 'arrangement_clip' && arrangementClipIds.has(entry.targetItemId!)) throw new Error(`Copied arrangement clip ${entry.targetItemId} already exists.`);
    }
  }

  const composition = getProjectCompositionWorkflow(project);
  for (const envelope of composition?.automationEnvelopes ?? []) {
    const selectedEntries = entries.filter((entry) => entry.kind === 'automation_point' && entry.containerId === envelope.id);
    if (!selectedEntries.length) continue;
    const selectedSourceTicks = new Set(selectedEntries.map((entry) => entry.sourceTick));
    const occupied = new Set(envelope.points
      .filter((point) => action === 'copy' || !selectedSourceTicks.has(point.tick))
      .map((point) => point.tick));
    for (const entry of selectedEntries) {
      if (occupied.has(entry.targetTick)) throw new Error(`Automation point collision on ${envelope.id} at tick ${entry.targetTick}.`);
      occupied.add(entry.targetTick);
    }
  }

  return {
    operationId,
    regionId,
    resultRegionId,
    action,
    sourceStartTick: region.startTick,
    targetStartTick,
    deltaTicks,
    durationTicks: region.durationTicks,
    entries,
  };
}

export function evaluateProductionRegionReadiness(): ProductionRegionReadiness {
  return {
    localModel: 'ready',
    capture: 'ready',
    moveAndCopy: 'ready',
    atomicProjectCommit: 'ready',
    audiblePlayback: 'adapter_required',
    nativeDragGesture: 'adapter_required',
  };
}
