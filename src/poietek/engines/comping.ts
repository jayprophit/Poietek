import type {AudioClip, PoietekProject, Track} from '../domain/types';
import {availableCapability} from '../platform';
import {ticksToSeconds} from '../timeline/tempo';
import type {
  CompSegment,
  EditCommandRecord,
  ProductionEngineReadiness,
  TakeLane,
} from './contracts';
import {createProductionEngineReadiness} from './defaults';
import {readProductionEngineReadiness, withProductionEngineReadiness} from './extension';

export const TAKE_COMP_IMPLEMENTATION_ID = 'poietek.core.take-comp.v1' as const;

export interface AlignedTakeCandidate {
  id: string;
  startTick: number;
  durationTicks: number;
  clipIds: readonly string[];
  trackIds: readonly string[];
  label: string;
}

export interface CreateTakeCompInput {
  groupId: string;
  name: string;
  sourceClipIds: readonly string[];
  destinationTrackId?: string;
  observedAt?: string;
}

export interface TakeCompSummary {
  groupId: string;
  name: string;
  destinationTrackId: string;
  startTick: number;
  durationTicks: number;
  takeLanes: readonly TakeLane[];
  segments: readonly CompSegment[];
  commandState: EditCommandRecord['state'];
}

export interface TakeCompPlan {
  groupId: string;
  destinationTrackId: string;
  ready: boolean;
  issues: readonly string[];
  outputClips: readonly AudioClip[];
  sourceClipIds: readonly string[];
  rangeStartTick: number;
  rangeDurationTicks: number;
  claim: string;
}

interface LocatedClip {
  track: Track;
  clip: AudioClip;
}

const idPattern = /^[a-z0-9._-]{1,96}$/i;

function locateClip(project: PoietekProject, clipId: string): LocatedClip | null {
  for (const track of project.tracks) {
    const clip = track.clips.find((candidate) => candidate.id === clipId);
    if (clip) return {track, clip};
  }
  return null;
}

function cloneLane(lane: TakeLane): TakeLane {
  return {...lane, clipIds: [...lane.clipIds]};
}

function cloneSegment(segment: CompSegment): CompSegment {
  return {...segment};
}

function groupPrefix(groupId: string, kind: 'lane' | 'segment' | 'clip'): string {
  return `${groupId}.${kind}.`;
}

function commandGroupId(command: EditCommandRecord): string | null {
  return command.kind === 'comp' && typeof command.parameters.groupId === 'string'
    ? command.parameters.groupId
    : null;
}

function requireStringParameter(
  command: EditCommandRecord,
  name: string,
): string {
  const value = command.parameters[name];
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Take comp command ${command.id} is missing ${name}.`);
  }
  return value;
}

function requireNumberParameter(
  command: EditCommandRecord,
  name: string,
): number {
  const value = command.parameters[name];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Take comp command ${command.id} is missing ${name}.`);
  }
  return value;
}

function getReadiness(project: PoietekProject, now: string): ProductionEngineReadiness {
  const result = readProductionEngineReadiness(project);
  if (result.state === 'ready') return result.readiness;
  if (result.state === 'missing') return createProductionEngineReadiness(project.id, 'unknown', now);
  if (result.state === 'unsupported_version') {
    throw new Error(`Take comping cannot use production-engine schema ${result.schemaVersion ?? 'unknown'}.`);
  }
  throw new Error(`Take comping found invalid production-engine state: ${result.issues.map((issue) => issue.message).join(' ')}`);
}

function compCapability(observedAt: string) {
  return availableCapability(
    'engine.edit.comping',
    TAKE_COMP_IMPLEMENTATION_ID,
    observedAt,
    'local',
    {
      operation: 'non_destructive_audio_clip_reference_comp',
      projectUndo: true,
      consolidatedRender: false,
    },
  );
}

function nextDestinationTrackId(project: PoietekProject, groupId: string): string {
  const base = `track.${groupId}.comp`.replace(/[^a-z0-9._-]/gi, '-').slice(0, 92);
  let candidate = base;
  let suffix = 2;
  while (project.tracks.some((track) => track.id === candidate)) {
    candidate = `${base.slice(0, 88)}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

function makeDestinationTrack(project: PoietekProject, id: string, name: string): Track {
  return {
    id,
    type: 'audio',
    name: `${name} Comp`,
    order: project.tracks.reduce((maximum, track) => Math.max(maximum, track.order), -1) + 1,
    color: '#c084fc',
    clips: [],
    mixer: {gainDb: 0, pan: 0, mute: false, solo: false},
  };
}

function overlaps(
  leftStart: number,
  leftDuration: number,
  rightStart: number,
  rightDuration: number,
): boolean {
  return leftStart < rightStart + rightDuration && rightStart < leftStart + leftDuration;
}

function durationSeconds(project: PoietekProject, startTick: number, durationTicks: number): number {
  return ticksToSeconds(startTick + durationTicks, project.tempoMap, project.settings.ppq)
    - ticksToSeconds(startTick, project.tempoMap, project.settings.ppq);
}

export function findAlignedTakeCandidates(project: PoietekProject): AlignedTakeCandidate[] {
  const grouped = new Map<string, LocatedClip[]>();
  for (const track of project.tracks) {
    if (track.type !== 'audio') continue;
    for (const clip of track.clips) {
      if (clip.muted || !project.assets.some((asset) => asset.id === clip.assetId)) continue;
      const key = `${clip.startTick}:${clip.durationTicks}`;
      grouped.set(key, [...(grouped.get(key) ?? []), {track, clip}]);
    }
  }

  return [...grouped.values()]
    .filter((group) => group.length >= 2)
    .map((group) => {
      const [{clip}] = group;
      const clipIds = group.map((item) => item.clip.id).sort();
      const trackIds = [...new Set(group.map((item) => item.track.id))].sort();
      return {
        id: `aligned.${clip.startTick}.${clip.durationTicks}.${clipIds[0]}`,
        startTick: clip.startTick,
        durationTicks: clip.durationTicks,
        clipIds,
        trackIds,
        label: `${group.length} aligned takes · tick ${clip.startTick}–${clip.startTick + clip.durationTicks}`,
      };
    })
    .sort((left, right) => left.startTick - right.startTick || left.id.localeCompare(right.id));
}

export function listProjectTakeComps(project: PoietekProject): TakeCompSummary[] {
  const result = readProductionEngineReadiness(project);
  if (result.state === 'missing') return [];
  if (result.state !== 'ready') throw new Error('Take comping requires valid production-engine state.');

  const summaries: TakeCompSummary[] = [];
  const commands = result.readiness.editing.commands.filter((command) => commandGroupId(command));
  for (const command of commands) {
    const groupId = commandGroupId(command)!;
    if (summaries.some((summary) => summary.groupId === groupId)) continue;
    summaries.push({
      groupId,
      name: requireStringParameter(command, 'name'),
      destinationTrackId: requireStringParameter(command, 'destinationTrackId'),
      startTick: requireNumberParameter(command, 'rangeStartTick'),
      durationTicks: requireNumberParameter(command, 'rangeDurationTicks'),
      takeLanes: result.readiness.editing.takeLanes
        .filter((lane) => lane.id.startsWith(groupPrefix(groupId, 'lane')))
        .map(cloneLane),
      segments: result.readiness.editing.compSegments
        .filter((segment) => segment.id.startsWith(groupPrefix(groupId, 'segment')))
        .map(cloneSegment)
        .sort((left, right) => left.startTick - right.startTick),
      commandState: command.state,
    });
  }
  return summaries;
}

export function createProjectTakeComp(
  project: PoietekProject,
  input: CreateTakeCompInput,
): PoietekProject {
  if (!idPattern.test(input.groupId)) throw new Error('Take comp group id must use letters, numbers, dots, dashes or underscores.');
  if (!input.name.trim()) throw new Error('Take comp name is required.');
  const sourceClipIds = [...new Set(input.sourceClipIds)];
  if (sourceClipIds.length < 2) throw new Error('Take comping requires at least two source clips.');

  const sources = sourceClipIds.map((clipId) => {
    const found = locateClip(project, clipId);
    if (!found) throw new Error(`Take source clip ${clipId} was not found.`);
    if (found.track.type !== 'audio') throw new Error(`Take source clip ${clipId} must be on an audio track.`);
    if (!project.assets.some((asset) => asset.id === found.clip.assetId)) {
      throw new Error(`Take source clip ${clipId} references missing media.`);
    }
    return found;
  });
  const [{clip: reference}] = sources;
  if (sources.some(({clip}) => clip.startTick !== reference.startTick || clip.durationTicks !== reference.durationTicks)) {
    throw new Error('Take source clips must have exactly aligned project ranges.');
  }
  if (reference.durationTicks < sourceClipIds.length) {
    throw new Error('Take range is too short to create one initial segment per source.');
  }

  const observedAt = input.observedAt ?? new Date().toISOString();
  const readiness = getReadiness(project, observedAt);
  if (readiness.editing.commands.some((command) => commandGroupId(command) === input.groupId)) {
    throw new Error(`Take comp ${input.groupId} already exists.`);
  }

  const destinationTrackId = input.destinationTrackId ?? nextDestinationTrackId(project, input.groupId);
  const existingDestination = project.tracks.find((track) => track.id === destinationTrackId);
  if (existingDestination && existingDestination.type !== 'audio') {
    throw new Error('Take comp destination must be an audio track.');
  }
  let nextProject = existingDestination
    ? project
    : {...project, tracks: [...project.tracks.map((track) => ({...track, clips: track.clips.map((clip) => ({...clip}))})), makeDestinationTrack(project, destinationTrackId, input.name)]};

  const lanes: TakeLane[] = sources.map(({track, clip}, index) => ({
    id: `${input.groupId}.lane.${index + 1}`,
    trackId: track.id,
    name: `Take ${index + 1} · ${clip.name}`,
    clipIds: [clip.id],
    muted: false,
  }));

  const baseDuration = Math.floor(reference.durationTicks / lanes.length);
  const remainder = reference.durationTicks % lanes.length;
  let cursor = reference.startTick;
  const segments: CompSegment[] = lanes.map((lane, index) => {
    const segmentDuration = baseDuration + (index < remainder ? 1 : 0);
    const segment: CompSegment = {
      id: `${input.groupId}.segment.${index + 1}`,
      trackId: destinationTrackId,
      takeLaneId: lane.id,
      sourceClipId: lane.clipIds[0],
      startTick: cursor,
      durationTicks: segmentDuration,
      crossfadeInTicks: 0,
      crossfadeOutTicks: 0,
    };
    cursor += segmentDuration;
    return segment;
  });

  const nextRevision = readiness.revision + 1;
  const command: EditCommandRecord = {
    id: `${input.groupId}.command`,
    projectId: project.id,
    kind: 'comp',
    targetIds: [...sourceClipIds, destinationTrackId],
    baseRevision: readiness.revision,
    nextRevision,
    parameters: {
      groupId: input.groupId,
      name: input.name,
      destinationTrackId,
      rangeStartTick: reference.startTick,
      rangeDurationTicks: reference.durationTicks,
      segmentCount: segments.length,
    },
    state: 'preview',
    undoable: true,
    createdAt: observedAt,
    appliedAt: null,
    implementationId: null,
  };

  const nextReadiness: ProductionEngineReadiness = {
    ...readiness,
    revision: nextRevision,
    updatedAt: observedAt,
    editing: {
      ...readiness.editing,
      compingCapability: compCapability(observedAt),
      takeLanes: [...readiness.editing.takeLanes.map(cloneLane), ...lanes],
      compSegments: [...readiness.editing.compSegments.map(cloneSegment), ...segments],
      commands: [...readiness.editing.commands.map((item) => ({...item, targetIds: [...item.targetIds], parameters: {...item.parameters}})), command],
    },
  };
  nextProject = withProductionEngineReadiness(nextProject, nextReadiness);
  return nextProject;
}

export function selectProjectTakeCompSegment(
  project: PoietekProject,
  groupId: string,
  segmentId: string,
  takeLaneId: string,
  observedAt = new Date().toISOString(),
): PoietekProject {
  const readiness = getReadiness(project, observedAt);
  const summary = listProjectTakeComps(project).find((candidate) => candidate.groupId === groupId);
  if (!summary) throw new Error(`Take comp ${groupId} was not found.`);
  const segment = summary.segments.find((candidate) => candidate.id === segmentId);
  if (!segment) throw new Error(`Take comp segment ${segmentId} was not found.`);
  const lane = summary.takeLanes.find((candidate) => candidate.id === takeLaneId);
  if (!lane) throw new Error(`Take lane ${takeLaneId} does not belong to comp ${groupId}.`);
  const source = lane.clipIds
    .map((clipId) => locateClip(project, clipId))
    .find((item): item is LocatedClip => Boolean(
      item
      && item.clip.startTick <= segment.startTick
      && item.clip.startTick + item.clip.durationTicks >= segment.startTick + segment.durationTicks,
    ));
  if (!source) throw new Error(`Take lane ${takeLaneId} has no source covering segment ${segmentId}.`);

  const nextRevision = readiness.revision + 1;
  const nextReadiness: ProductionEngineReadiness = {
    ...readiness,
    revision: nextRevision,
    updatedAt: observedAt,
    editing: {
      ...readiness.editing,
      compingCapability: compCapability(observedAt),
      takeLanes: readiness.editing.takeLanes.map(cloneLane),
      compSegments: readiness.editing.compSegments.map((candidate) => candidate.id === segmentId
        ? {...candidate, takeLaneId, sourceClipId: source.clip.id}
        : cloneSegment(candidate)),
      commands: readiness.editing.commands.map((command) => commandGroupId(command) === groupId
        ? {
            ...command,
            targetIds: [...command.targetIds],
            parameters: {...command.parameters},
            baseRevision: readiness.revision,
            nextRevision,
            state: 'preview',
            appliedAt: null,
            implementationId: null,
          }
        : {...command, targetIds: [...command.targetIds], parameters: {...command.parameters}}),
    },
  };
  return withProductionEngineReadiness(project, nextReadiness);
}

export function planProjectTakeComp(project: PoietekProject, groupId: string): TakeCompPlan {
  const summary = listProjectTakeComps(project).find((candidate) => candidate.groupId === groupId);
  if (!summary) throw new Error(`Take comp ${groupId} was not found.`);
  const issues: string[] = [];
  const outputClips: AudioClip[] = [];
  const sourceClipIds = [...new Set(summary.takeLanes.flatMap((lane) => lane.clipIds))];
  const destination = project.tracks.find((track) => track.id === summary.destinationTrackId);
  if (!destination || destination.type !== 'audio') issues.push('The comp destination audio track is missing.');

  const expectedEnd = summary.startTick + summary.durationTicks;
  let cursor = summary.startTick;
  for (const [index, segment] of summary.segments.entries()) {
    if (segment.trackId !== summary.destinationTrackId) issues.push(`Segment ${segment.id} targets the wrong destination track.`);
    if (segment.startTick !== cursor) issues.push(`Segment ${segment.id} leaves a gap or overlap in the comp range.`);
    if (segment.durationTicks < 1) issues.push(`Segment ${segment.id} has no duration.`);
    if (segment.crossfadeInTicks < 0 || segment.crossfadeOutTicks < 0
      || segment.crossfadeInTicks + segment.crossfadeOutTicks >= segment.durationTicks) {
      issues.push(`Segment ${segment.id} has invalid transition timing.`);
    }
    cursor = segment.startTick + segment.durationTicks;

    const lane = summary.takeLanes.find((candidate) => candidate.id === segment.takeLaneId);
    if (!lane || !lane.clipIds.includes(segment.sourceClipId)) {
      issues.push(`Segment ${segment.id} references a source outside its take lane.`);
      continue;
    }
    const source = locateClip(project, segment.sourceClipId);
    if (!source) {
      issues.push(`Segment ${segment.id} references missing source clip ${segment.sourceClipId}.`);
      continue;
    }
    if (source.clip.startTick > segment.startTick
      || source.clip.startTick + source.clip.durationTicks < segment.startTick + segment.durationTicks) {
      issues.push(`Source clip ${source.clip.id} does not cover segment ${segment.id}.`);
      continue;
    }
    const asset = project.assets.find((candidate) => candidate.id === source.clip.assetId);
    if (!asset) {
      issues.push(`Source clip ${source.clip.id} references missing media.`);
      continue;
    }

    const offsetDeltaSeconds = durationSeconds(
      project,
      source.clip.startTick,
      segment.startTick - source.clip.startTick,
    );
    const segmentDurationSeconds = durationSeconds(project, segment.startTick, segment.durationTicks);
    const sourceOffsetSeconds = source.clip.sourceOffsetSeconds + offsetDeltaSeconds;
    const availableFromClip = source.clip.sourceDurationSeconds;
    if (availableFromClip !== null && offsetDeltaSeconds + segmentDurationSeconds > availableFromClip + 1e-6) {
      issues.push(`Source clip ${source.clip.id} does not contain enough decoded duration for segment ${segment.id}.`);
      continue;
    }
    if (asset.durationSeconds !== null && sourceOffsetSeconds + segmentDurationSeconds > asset.durationSeconds + 1e-6) {
      issues.push(`Source asset ${asset.id} ends before segment ${segment.id}.`);
      continue;
    }

    outputClips.push({
      ...source.clip,
      id: `${groupId}.clip.${index + 1}`,
      name: `${summary.name} · ${source.clip.name} · ${index + 1}`,
      startTick: segment.startTick,
      durationTicks: segment.durationTicks,
      sourceOffsetSeconds,
      sourceDurationSeconds: segmentDurationSeconds,
      fadeInSeconds: durationSeconds(project, segment.startTick, segment.crossfadeInTicks),
      fadeOutSeconds: durationSeconds(
        project,
        segment.startTick + segment.durationTicks - segment.crossfadeOutTicks,
        segment.crossfadeOutTicks,
      ),
      muted: false,
    });
  }
  if (cursor !== expectedEnd) issues.push('Comp segments do not cover the complete take range.');

  if (destination) {
    const managedPrefix = groupPrefix(groupId, 'clip');
    for (const clip of destination.clips) {
      if (clip.id.startsWith(managedPrefix)) continue;
      if (overlaps(clip.startTick, clip.durationTicks, summary.startTick, summary.durationTicks)) {
        issues.push(`Destination clip ${clip.id} overlaps the comp range.`);
      }
    }
  }

  const ready = issues.length === 0 && outputClips.length === summary.segments.length;
  return {
    groupId,
    destinationTrackId: summary.destinationTrackId,
    ready,
    issues,
    outputClips,
    sourceClipIds,
    rangeStartTick: summary.startTick,
    rangeDurationTicks: summary.durationTicks,
    claim: ready
      ? `Ready to create ${outputClips.length} non-destructive canonical audio clip references and mute ${sourceClipIds.length} source take clips as one project edit.`
      : `Comp preview is blocked by ${issues.length} validation issue${issues.length === 1 ? '' : 's'}; no project clips were changed.`,
  };
}

export function commitProjectTakeComp(
  project: PoietekProject,
  groupId: string,
  observedAt = new Date().toISOString(),
): PoietekProject {
  const plan = planProjectTakeComp(project, groupId);
  if (!plan.ready) throw new Error(plan.issues.join(' '));
  const readiness = getReadiness(project, observedAt);
  const sourceIds = new Set(plan.sourceClipIds);
  const managedPrefix = groupPrefix(groupId, 'clip');

  const nextProject: PoietekProject = {
    ...project,
    tracks: project.tracks.map((track) => {
      const sourceUpdated = track.clips.map((clip) => sourceIds.has(clip.id) ? {...clip, muted: true} : {...clip});
      if (track.id !== plan.destinationTrackId) return {...track, clips: sourceUpdated};
      return {
        ...track,
        clips: [
          ...sourceUpdated.filter((clip) => !clip.id.startsWith(managedPrefix)),
          ...plan.outputClips.map((clip) => ({...clip})),
        ].sort((left, right) => left.startTick - right.startTick || left.id.localeCompare(right.id)),
      };
    }),
  };

  const nextRevision = readiness.revision + 1;
  const nextReadiness: ProductionEngineReadiness = {
    ...readiness,
    revision: nextRevision,
    updatedAt: observedAt,
    editing: {
      ...readiness.editing,
      compingCapability: compCapability(observedAt),
      takeLanes: readiness.editing.takeLanes.map(cloneLane),
      compSegments: readiness.editing.compSegments.map(cloneSegment),
      commands: readiness.editing.commands.map((command) => commandGroupId(command) === groupId
        ? {
            ...command,
            targetIds: [...command.targetIds],
            parameters: {...command.parameters, outputClipCount: plan.outputClips.length},
            baseRevision: readiness.revision,
            nextRevision,
            state: 'applied',
            undoable: true,
            appliedAt: observedAt,
            implementationId: TAKE_COMP_IMPLEMENTATION_ID,
          }
        : {...command, targetIds: [...command.targetIds], parameters: {...command.parameters}}),
    },
  };
  return withProductionEngineReadiness(nextProject, nextReadiness);
}
