import type {PoietekProject} from '../domain/types';
import {getProjectCompositionWorkflow} from '../composition-workflows';
import {
  PERFORMANCE_CANVAS_SCHEMA_VERSION,
  type ArrangementCaptureEntry,
  type ArrangementCapturePlan,
  type PerformanceCanvasState,
  type PerformanceEvent,
  type PerformanceFollowPlan,
  type PerformanceLane,
  type PerformanceReadiness,
  type PerformanceRuntimeCapability,
  type PerformanceRuntimeObservation,
  type PerformanceScene,
  type PerformanceSlot,
} from './contracts';

const clone = <T>(value: T): T => structuredClone(value);

function isWholeTick(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

export function createPerformanceCanvasState(
  projectId: string,
  barLengthTicks: number,
): PerformanceCanvasState {
  if (!projectId.trim()) throw new Error('Performance Canvas requires a project id.');
  if (!Number.isInteger(barLengthTicks) || barLengthTicks < 1) {
    throw new Error('Performance Canvas bar length must be a positive whole tick value.');
  }
  return {
    schemaVersion: PERFORMANCE_CANVAS_SCHEMA_VERSION,
    projectId,
    revision: 0,
    barLengthTicks,
    launchQuantizationTicks: barLengthTicks,
    lanes: [],
    scenes: [],
    slots: [],
    activeSlotIdsByLane: {},
    capture: {
      status: 'idle',
      takeId: null,
      startedAtTick: null,
      stoppedAtTick: null,
      cursorTick: 0,
      events: [],
      lastCommitId: null,
    },
  };
}

export function quantizePerformanceTick(requestedTick: number, quantumTicks: number): number {
  if (!isWholeTick(requestedTick)) throw new Error('Requested launch time must be a non-negative whole tick.');
  if (!Number.isInteger(quantumTicks) || quantumTicks < 1) {
    throw new Error('Launch quantization must be a positive whole tick value.');
  }
  return Math.ceil(requestedTick / quantumTicks) * quantumTicks;
}

export function validatePerformanceCanvasState(
  state: PerformanceCanvasState,
  project?: PoietekProject,
): string[] {
  const issues: string[] = [];
  if (state.schemaVersion !== PERFORMANCE_CANVAS_SCHEMA_VERSION) issues.push('Unsupported Performance Canvas schema version.');
  if (!state.projectId.trim()) issues.push('Performance Canvas project id is required.');
  if (!Number.isInteger(state.revision) || state.revision < 0) issues.push('Performance Canvas revision must be a non-negative whole number.');
  if (!Number.isInteger(state.barLengthTicks) || state.barLengthTicks < 1) issues.push('Performance Canvas bar length is invalid.');
  if (!Number.isInteger(state.launchQuantizationTicks) || state.launchQuantizationTicks < 1) issues.push('Performance Canvas launch quantization is invalid.');
  if (project && project.id !== state.projectId) issues.push('Performance Canvas belongs to another project.');

  const composition = project ? getProjectCompositionWorkflow(project) : null;
  const patternIds = new Set(composition?.patterns.map((pattern) => pattern.id) ?? []);
  const arrangementLaneIds = new Set(composition?.lanes.map((lane) => lane.id) ?? []);
  const audioAssetIds = new Set(project?.assets.filter((asset) => asset.mediaType === 'audio').map((asset) => asset.id) ?? []);
  const trackIds = new Set(project?.tracks.map((track) => track.id) ?? []);

  const laneIds = new Set<string>();
  for (const lane of state.lanes) {
    if (!lane.id.trim() || !lane.name.trim() || !lane.arrangementLaneId.trim()) issues.push('Performance lanes require id, name and arrangement lane.');
    if (laneIds.has(lane.id)) issues.push('Duplicate performance lane ' + lane.id + '.');
    laneIds.add(lane.id);
    if (project && !arrangementLaneIds.has(lane.arrangementLaneId)) issues.push('Performance lane ' + lane.id + ' references missing arrangement lane ' + lane.arrangementLaneId + '.');
    if (project && lane.targetTrackId !== null && !trackIds.has(lane.targetTrackId)) issues.push('Performance lane ' + lane.id + ' references missing track ' + lane.targetTrackId + '.');
  }

  const sceneIds = new Set<string>();
  for (const scene of state.scenes) {
    if (!scene.id.trim() || !scene.name.trim()) issues.push('Performance scenes require id and name.');
    if (sceneIds.has(scene.id)) issues.push('Duplicate performance scene ' + scene.id + '.');
    sceneIds.add(scene.id);
    if (!Number.isInteger(scene.followAfterBars) || scene.followAfterBars < 1 || scene.followAfterBars > 128) issues.push('Performance scene ' + scene.id + ' has an invalid follow length.');
  }

  const slotIds = new Set<string>();
  const occupiedCells = new Set<string>();
  for (const slot of state.slots) {
    if (!slot.id.trim() || !slot.name.trim() || !slot.sourceId.trim()) issues.push('Performance slots require id, name and source.');
    if (slotIds.has(slot.id)) issues.push('Duplicate performance slot ' + slot.id + '.');
    slotIds.add(slot.id);
    if (!laneIds.has(slot.laneId)) issues.push('Performance slot ' + slot.id + ' references missing lane ' + slot.laneId + '.');
    if (!sceneIds.has(slot.sceneId)) issues.push('Performance slot ' + slot.id + ' references missing scene ' + slot.sceneId + '.');
    const cell = slot.laneId + ':' + slot.sceneId;
    if (occupiedCells.has(cell)) issues.push('Performance cell ' + cell + ' contains more than one slot.');
    occupiedCells.add(cell);
    if (!Number.isInteger(slot.lengthTicks) || slot.lengthTicks < 1) issues.push('Performance slot ' + slot.id + ' has an invalid length.');
    if (project && slot.sourceKind === 'pattern' && !patternIds.has(slot.sourceId)) issues.push('Performance slot ' + slot.id + ' references missing pattern ' + slot.sourceId + '.');
    if (project && slot.sourceKind === 'audio' && !audioAssetIds.has(slot.sourceId)) issues.push('Performance slot ' + slot.id + ' references missing audio asset ' + slot.sourceId + '.');
  }

  for (const [laneId, slotId] of Object.entries(state.activeSlotIdsByLane)) {
    if (!laneIds.has(laneId)) issues.push('Active performance state references missing lane ' + laneId + '.');
    if (slotId !== null) {
      const slot = state.slots.find((candidate) => candidate.id === slotId);
      if (!slot || slot.laneId !== laneId) issues.push('Active slot ' + slotId + ' is not valid for lane ' + laneId + '.');
    }
  }

  const capture = state.capture;
  if (!isWholeTick(capture.cursorTick)) issues.push('Performance capture cursor is invalid.');
  if (capture.status === 'idle') {
    if (capture.takeId !== null || capture.startedAtTick !== null || capture.stoppedAtTick !== null || capture.events.length) issues.push('Idle performance capture must not retain a take.');
  } else {
    if (!capture.takeId?.trim() || capture.startedAtTick === null || !isWholeTick(capture.startedAtTick)) issues.push('Performance capture requires a take id and start tick.');
    if (capture.status === 'recording' && capture.stoppedAtTick !== null) issues.push('Recording performance capture cannot have a stop tick.');
    if ((capture.status === 'stopped' || capture.status === 'committed') && (capture.stoppedAtTick === null || !isWholeTick(capture.stoppedAtTick))) issues.push('Stopped performance capture requires a stop tick.');
  }
  if (capture.status !== 'committed' && capture.lastCommitId !== null) issues.push('Only a committed performance capture may retain a commit id.');

  const eventIds = new Set<string>();
  let lastScheduledTick = -1;
  for (const event of capture.events) {
    if (!event.id.trim() || eventIds.has(event.id)) issues.push('Performance events require unique ids.');
    eventIds.add(event.id);
    if (!isWholeTick(event.requestedTick) || !isWholeTick(event.scheduledTick) || event.scheduledTick < event.requestedTick) issues.push('Performance event ' + event.id + ' has invalid timing.');
    if (event.scheduledTick < lastScheduledTick) issues.push('Performance events must be stored in scheduled order.');
    lastScheduledTick = event.scheduledTick;
    if (!laneIds.has(event.laneId)) issues.push('Performance event ' + event.id + ' references missing lane.');
    if (event.kind === 'launch') {
      const slot = event.slotId ? state.slots.find((candidate) => candidate.id === event.slotId) : null;
      if (!slot || slot.laneId !== event.laneId) issues.push('Performance launch event ' + event.id + ' references an invalid slot.');
    } else if (event.slotId !== null) issues.push('Performance stop event ' + event.id + ' cannot reference a slot.');
    if (event.sceneId !== null && !sceneIds.has(event.sceneId)) issues.push('Performance event ' + event.id + ' references missing scene.');
  }
  return issues;
}

function appendCapturedEvent(
  state: PerformanceCanvasState,
  event: Omit<PerformanceEvent, 'id'>,
): PerformanceCanvasState {
  if (state.capture.status !== 'recording') return state;
  const takeId = state.capture.takeId;
  if (!takeId) throw new Error('Recording performance capture is missing its take id.');
  const nextEvent: PerformanceEvent = {
    ...event,
    id: takeId + '.event.' + String(state.capture.events.length + 1).padStart(3, '0'),
  };
  return {
    ...state,
    capture: {...state.capture, events: [...state.capture.events, nextEvent]},
  };
}

export function setPerformanceCursor(state: PerformanceCanvasState, tick: number): PerformanceCanvasState {
  if (!isWholeTick(tick)) throw new Error('Performance rehearsal cursor must be a non-negative whole tick.');
  if (state.capture.startedAtTick !== null && tick < state.capture.startedAtTick) throw new Error('Performance cursor cannot precede the active take.');
  return {...clone(state), revision: state.revision + 1, capture: {...clone(state.capture), cursorTick: tick}};
}

export function startPerformanceCapture(
  state: PerformanceCanvasState,
  takeId: string,
  startTick = state.capture.cursorTick,
): PerformanceCanvasState {
  if (!takeId.trim()) throw new Error('Performance take id is required.');
  if (!isWholeTick(startTick)) throw new Error('Performance take start must be a non-negative whole tick.');
  if (state.capture.status === 'recording') throw new Error('A performance take is already recording.');
  return {
    ...clone(state),
    revision: state.revision + 1,
    capture: {
      status: 'recording',
      takeId,
      startedAtTick: startTick,
      stoppedAtTick: null,
      cursorTick: startTick,
      events: [],
      lastCommitId: null,
    },
  };
}

export function stopPerformanceCapture(
  state: PerformanceCanvasState,
  requestedTick = state.capture.cursorTick,
): PerformanceCanvasState {
  if (state.capture.status !== 'recording') throw new Error('Performance capture is not recording.');
  const lastLaunch = [...state.capture.events].reverse().find((event) => event.kind === 'launch');
  const minimumEnd = lastLaunch ? lastLaunch.scheduledTick + state.launchQuantizationTicks : state.capture.startedAtTick ?? 0;
  const stoppedAtTick = Math.max(quantizePerformanceTick(requestedTick, state.launchQuantizationTicks), minimumEnd);
  return {
    ...clone(state),
    revision: state.revision + 1,
    capture: {...clone(state.capture), status: 'stopped', stoppedAtTick, cursorTick: stoppedAtTick},
  };
}

export function launchPerformanceSlot(
  state: PerformanceCanvasState,
  slotId: string,
  requestedTick = state.capture.cursorTick,
): PerformanceCanvasState {
  const slot = state.slots.find((candidate) => candidate.id === slotId);
  if (!slot) throw new Error('Performance slot ' + slotId + ' was not found.');
  const scheduledTick = quantizePerformanceTick(requestedTick, state.launchQuantizationTicks);
  const isToggleStop = slot.launchMode === 'toggle' && state.activeSlotIdsByLane[slot.laneId] === slot.id;
  let next: PerformanceCanvasState = {
    ...clone(state),
    revision: state.revision + 1,
    activeSlotIdsByLane: {...state.activeSlotIdsByLane, [slot.laneId]: isToggleStop ? null : slot.id},
  };
  next = appendCapturedEvent(next, {
    kind: isToggleStop ? 'stop' : 'launch',
    requestedTick,
    scheduledTick,
    laneId: slot.laneId,
    sceneId: slot.sceneId,
    slotId: isToggleStop ? null : slot.id,
  });
  return next;
}

export function launchPerformanceScene(
  state: PerformanceCanvasState,
  sceneId: string,
  requestedTick = state.capture.cursorTick,
): PerformanceCanvasState {
  if (!state.scenes.some((scene) => scene.id === sceneId)) throw new Error('Performance scene ' + sceneId + ' was not found.');
  const sceneSlots = state.lanes.map((lane) => state.slots.find((slot) => slot.laneId === lane.id && slot.sceneId === sceneId)).filter((slot): slot is PerformanceSlot => Boolean(slot));
  if (!sceneSlots.length) throw new Error('Performance scene ' + sceneId + ' has no launchable slots.');
  return sceneSlots.reduce((next, slot) => launchPerformanceSlot(next, slot.id, requestedTick), state);
}

export function stopPerformanceLane(
  state: PerformanceCanvasState,
  laneId: string,
  requestedTick = state.capture.cursorTick,
): PerformanceCanvasState {
  if (!state.lanes.some((lane) => lane.id === laneId)) throw new Error('Performance lane ' + laneId + ' was not found.');
  const scheduledTick = quantizePerformanceTick(requestedTick, state.launchQuantizationTicks);
  let next: PerformanceCanvasState = {
    ...clone(state),
    revision: state.revision + 1,
    activeSlotIdsByLane: {...state.activeSlotIdsByLane, [laneId]: null},
  };
  next = appendCapturedEvent(next, {kind: 'stop', requestedTick, scheduledTick, laneId, sceneId: null, slotId: null});
  return next;
}

export function planPerformanceFollow(
  state: PerformanceCanvasState,
  sceneId: string,
  fromTick: number,
): PerformanceFollowPlan {
  const sceneIndex = state.scenes.findIndex((scene) => scene.id === sceneId);
  if (sceneIndex === -1) throw new Error('Performance scene ' + sceneId + ' was not found.');
  if (!isWholeTick(fromTick)) throw new Error('Follow plan start must be a non-negative whole tick.');
  const scene = state.scenes[sceneIndex];
  let targetSceneId: string | null = null;
  if (scene.followAction === 'next') targetSceneId = state.scenes[(sceneIndex + 1) % state.scenes.length]?.id ?? null;
  if (scene.followAction === 'previous') targetSceneId = state.scenes[(sceneIndex - 1 + state.scenes.length) % state.scenes.length]?.id ?? null;
  if (scene.followAction === 'first') targetSceneId = state.scenes[0]?.id ?? null;
  return {
    sourceSceneId: scene.id,
    action: scene.followAction,
    targetSceneId,
    scheduledTick: scene.followAction === 'none' ? null : fromTick + scene.followAfterBars * state.barLengthTicks,
    claim: 'planning_only',
  };
}

export function evaluatePerformanceReadiness(
  state: PerformanceCanvasState,
  observations: readonly PerformanceRuntimeObservation[] = [],
): PerformanceReadiness {
  const observed = new Set(observations.flatMap((observation) => observation.capabilities));
  const liveRequired = new Set<PerformanceRuntimeCapability>(['sample_accurate_clock']);
  if (state.slots.some((slot) => slot.sourceKind === 'pattern')) liveRequired.add('pattern_playback');
  if (state.slots.some((slot) => slot.sourceKind === 'audio')) liveRequired.add('audio_clip_playback');
  const hasFollow = state.scenes.some((scene) => scene.followAction !== 'none');
  if (hasFollow) liveRequired.add('follow_scheduler');
  const missingCapabilities = [...liveRequired, 'controller_input' as const].filter((capability) => !observed.has(capability));
  return {
    controlModel: 'ready',
    arrangementCommit: (state.capture.status === 'stopped' || state.capture.status === 'committed') && state.capture.events.some((event) => event.kind === 'launch') ? 'ready' : 'capture_required',
    livePlayback: [...liveRequired].every((capability) => observed.has(capability)) ? 'ready' : 'adapter_required',
    controllerInput: observed.has('controller_input') ? 'ready' : 'adapter_required',
    followScheduling: !hasFollow || (observed.has('sample_accurate_clock') && observed.has('follow_scheduler')) ? 'ready' : 'adapter_required',
    missingCapabilities,
  };
}

export function buildArrangementCapturePlan(
  state: PerformanceCanvasState,
  commitId: string,
  insertionTick = 0,
): ArrangementCapturePlan {
  if (!commitId.trim()) throw new Error('Arrangement commit id is required.');
  if (!isWholeTick(insertionTick)) throw new Error('Arrangement insertion must be a non-negative whole tick.');
  if ((state.capture.status !== 'stopped' && state.capture.status !== 'committed') || !state.capture.takeId || state.capture.startedAtTick === null || state.capture.stoppedAtTick === null) {
    throw new Error('Stop a recorded performance take before building an arrangement plan.');
  }
  const entries: ArrangementCaptureEntry[] = [];
  const orderedEvents = state.capture.events.map((event, index) => ({event, index})).sort((left, right) => left.event.scheduledTick - right.event.scheduledTick || left.index - right.index);
  for (let orderedIndex = 0; orderedIndex < orderedEvents.length; orderedIndex += 1) {
    const {event} = orderedEvents[orderedIndex];
    if (event.kind !== 'launch' || !event.slotId) continue;
    const slot = state.slots.find((candidate) => candidate.id === event.slotId);
    const lane = state.lanes.find((candidate) => candidate.id === event.laneId);
    if (!slot || !lane) throw new Error('Captured performance event references missing project data.');
    const nextLaneEvent = orderedEvents.slice(orderedIndex + 1).map((candidate) => candidate.event).find((candidate) => candidate.laneId === event.laneId && candidate.scheduledTick > event.scheduledTick);
    const availableTicks = (nextLaneEvent?.scheduledTick ?? state.capture.stoppedAtTick) - event.scheduledTick;
    if (availableTicks < 1) continue;
    const durationTicks = slot.loopEnabled ? availableTicks : Math.min(availableTicks, slot.lengthTicks);
    entries.push({
      clipId: commitId + '.' + event.id,
      performanceEventId: event.id,
      laneId: lane.id,
      arrangementLaneId: lane.arrangementLaneId,
      slotId: slot.id,
      sourceKind: slot.sourceKind,
      sourceId: slot.sourceId,
      startTick: insertionTick + event.scheduledTick - state.capture.startedAtTick,
      durationTicks,
      loopEnabled: slot.loopEnabled,
    });
  }
  if (!entries.length) throw new Error('The recorded performance contains no arrangement clips.');
  return {takeId: state.capture.takeId, commitId, insertionTick, entries, status: 'ready', claim: 'canonical_arrangement_plan'};
}

export function markPerformanceCaptureCommitted(
  state: PerformanceCanvasState,
  commitId: string,
): PerformanceCanvasState {
  if (state.capture.status !== 'stopped') throw new Error('Only a stopped performance take can be committed.');
  if (!commitId.trim()) throw new Error('Performance commit id is required.');
  return {
    ...clone(state),
    revision: state.revision + 1,
    capture: {...clone(state.capture), status: 'committed', lastCommitId: commitId},
  };
}

export function createPerformanceLane(input: PerformanceLane): PerformanceLane {
  return clone(input);
}

export function createPerformanceScene(input: PerformanceScene): PerformanceScene {
  return clone(input);
}

export function createPerformanceSlot(input: PerformanceSlot): PerformanceSlot {
  return clone(input);
}
