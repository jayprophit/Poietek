import type {PoietekProject} from '../domain/types';
import {
  TRACKING_CONSOLE_SCHEMA_VERSION,
  type TrackingConsoleReadiness,
  type TrackingConsoleState,
  type TrackingCueBus,
  type TrackingInputControlIntent,
  type TrackingRoute,
  type TrackingRoutePlan,
  type TrackingRouteReadiness,
  type TrackingRuntimeObservation,
  type TrackingSnapshot,
  type TrackingSnapshotDiff,
  type TrackingSource,
  type TrackingStage,
} from './contracts';

const idPattern = /^[a-z0-9._-]{1,96}$/i;

const defaultInputControls = (): TrackingInputControlIntent => ({
  gainDb: null,
  phantomPower: 'unchanged',
  highPass: 'unchanged',
  polarity: 'unchanged',
  impedance: 'unchanged',
});

function cloneSource(source: TrackingSource): TrackingSource {
  return {...source, inputControls: {...source.inputControls}};
}

function cloneStage(stage: TrackingStage): TrackingStage {
  return {...stage};
}

function cloneCueBus(cue: TrackingCueBus): TrackingCueBus {
  return {...cue};
}

function cloneRoute(route: TrackingRoute): TrackingRoute {
  return {
    ...route,
    monitorStageIds: [...route.monitorStageIds],
    recordStageIds: [...route.recordStageIds],
    cueStageIds: [...route.cueStageIds],
    cueSends: route.cueSends.map((send) => ({...send})),
  };
}

function cloneConfiguration(state: TrackingConsoleState): TrackingSnapshot['configuration'] {
  return {
    sources: state.sources.map(cloneSource),
    stages: state.stages.map(cloneStage),
    cueBuses: state.cueBuses.map(cloneCueBus),
    routes: state.routes.map(cloneRoute),
  };
}

function cloneObservation(observation: TrackingRuntimeObservation): TrackingRuntimeObservation {
  return {
    ...observation,
    availableInputChannels: [...observation.availableInputChannels],
    availableOutputChannels: [...observation.availableOutputChannels],
    controllableSourceIds: [...observation.controllableSourceIds],
    activeCaptureRouteIds: [...observation.activeCaptureRouteIds],
    activeMonitorRouteIds: [...observation.activeMonitorRouteIds],
    executedStageIds: [...observation.executedStageIds],
  };
}

function cloneSnapshot(snapshot: TrackingSnapshot): TrackingSnapshot {
  return {
    ...snapshot,
    configuration: {
      sources: snapshot.configuration.sources.map(cloneSource),
      stages: snapshot.configuration.stages.map(cloneStage),
      cueBuses: snapshot.configuration.cueBuses.map(cloneCueBus),
      routes: snapshot.configuration.routes.map(cloneRoute),
    },
    excludedRuntimeFields: ['runtimeObservations'],
  };
}

function duplicates(values: readonly string[]): boolean {
  return new Set(values).size !== values.length;
}

function validLevel(value: number, minimum: number, maximum: number): boolean {
  return Number.isFinite(value) && value >= minimum && value <= maximum;
}

function validateConfiguration(
  configuration: TrackingSnapshot['configuration'],
  project?: PoietekProject,
): string[] {
  const issues: string[] = [];
  const sourceIds = new Set<string>();
  const stageIds = new Set<string>();
  const cueIds = new Set<string>();
  const routeIds = new Set<string>();
  const knownTrackIds = project ? new Set(project.tracks.map((track) => track.id)) : null;

  for (const source of configuration.sources) {
    if (!idPattern.test(source.id) || !source.name.trim()) issues.push('Every tracking source requires a valid id and name.');
    if (sourceIds.has(source.id)) issues.push(`Duplicate tracking source ${source.id}.`);
    sourceIds.add(source.id);
    if (source.inputChannel !== null && (!Number.isInteger(source.inputChannel) || source.inputChannel < 1)) {
      issues.push(`Tracking source ${source.id} has an invalid input channel.`);
    }
    if (source.inputControls.gainDb !== null && !validLevel(source.inputControls.gainDb, -20, 80)) {
      issues.push(`Tracking source ${source.id} has an invalid requested gain.`);
    }
  }

  for (const stage of configuration.stages) {
    if (!idPattern.test(stage.id) || !stage.name.trim()) issues.push('Every tracking stage requires a valid id and name.');
    if (stageIds.has(stage.id)) issues.push(`Duplicate tracking stage ${stage.id}.`);
    stageIds.add(stage.id);
    if (stage.kind === 'external_insert' && stage.execution !== 'external_hardware') {
      issues.push(`External insert ${stage.id} must use external-hardware execution.`);
    }
    if ((stage.sendEndpointId === null) !== (stage.returnEndpointId === null)) {
      issues.push(`Tracking stage ${stage.id} requires both send and return endpoints, or neither.`);
    }
  }

  for (const cue of configuration.cueBuses) {
    if (!idPattern.test(cue.id) || !cue.name.trim()) issues.push('Every cue bus requires a valid id and name.');
    if (cueIds.has(cue.id)) issues.push(`Duplicate tracking cue ${cue.id}.`);
    cueIds.add(cue.id);
  }

  for (const route of configuration.routes) {
    if (!idPattern.test(route.id) || !route.name.trim()) issues.push('Every tracking route requires a valid id and name.');
    if (routeIds.has(route.id)) issues.push(`Duplicate tracking route ${route.id}.`);
    routeIds.add(route.id);
    if (!sourceIds.has(route.sourceId)) issues.push(`Tracking route ${route.id} references missing source ${route.sourceId}.`);
    if (!route.targetTrackId.trim()) issues.push(`Tracking route ${route.id} requires a canonical target track.`);
    if (knownTrackIds && !knownTrackIds.has(route.targetTrackId)) {
      issues.push(`Tracking route ${route.id} references missing track ${route.targetTrackId}.`);
    }
    for (const [placement, ids] of [
      ['monitor', route.monitorStageIds],
      ['record', route.recordStageIds],
      ['cue', route.cueStageIds],
    ] as const) {
      if (duplicates(ids)) issues.push(`Tracking route ${route.id} repeats a ${placement} stage.`);
      for (const stageId of ids) {
        const stage = configuration.stages.find((candidate) => candidate.id === stageId);
        if (!stage) issues.push(`Tracking route ${route.id} references missing stage ${stageId}.`);
        else if (stage.placement !== placement) issues.push(`Tracking route ${route.id} places stage ${stageId} on the wrong path.`);
      }
    }
    if (duplicates(route.cueSends.map((send) => send.cueId))) {
      issues.push(`Tracking route ${route.id} repeats a cue send.`);
    }
    for (const send of route.cueSends) {
      if (!cueIds.has(send.cueId)) issues.push(`Tracking route ${route.id} references missing cue ${send.cueId}.`);
      if (!validLevel(send.levelDb, -96, 12)) issues.push(`Tracking route ${route.id} has an invalid cue level.`);
      if (!validLevel(send.pan, -1, 1)) issues.push(`Tracking route ${route.id} has an invalid cue pan.`);
    }
  }
  return issues;
}

export function createTrackingConsoleState(projectId: string): TrackingConsoleState {
  if (!projectId.trim()) throw new Error('Tracking Console requires a project id.');
  return {
    schemaVersion: TRACKING_CONSOLE_SCHEMA_VERSION,
    projectId,
    revision: 0,
    sources: [],
    stages: [],
    cueBuses: [],
    routes: [],
    snapshots: [],
    runtimeObservations: [],
  };
}

export function createStarterTrackingConsoleState(
  projectId: string,
  vocalTrackId: string,
  instrumentTrackId: string,
  capturedAt = new Date().toISOString(),
): TrackingConsoleState {
  if (!vocalTrackId.trim() || !instrumentTrackId.trim()) {
    throw new Error('Starter tracking routes require two canonical audio tracks.');
  }
  let state: TrackingConsoleState = {
    ...createTrackingConsoleState(projectId),
    sources: [
      {id: 'tracking.source.mic-1', name: 'Mic / Input 1', kind: 'microphone', inputChannel: 1, endpointId: null, inputControls: defaultInputControls()},
      {id: 'tracking.source.instrument-2', name: 'Instrument / Input 2', kind: 'instrument', inputChannel: 2, endpointId: null, inputControls: {...defaultInputControls(), impedance: 'high'}},
      {id: 'tracking.source.usb-left', name: 'USB Left', kind: 'usb_left', inputChannel: 1, endpointId: null, inputControls: defaultInputControls()},
      {id: 'tracking.source.usb-right', name: 'USB Right', kind: 'usb_right', inputChannel: 2, endpointId: null, inputControls: defaultInputControls()},
    ],
    stages: [
      {id: 'tracking.stage.vocal-comfort', name: 'Vocal comfort dynamics', kind: 'dynamics', placement: 'monitor', execution: 'device_dsp', enabled: true, processorRef: null, sendEndpointId: null, returnEndpointId: null},
      {id: 'tracking.stage.vocal-print', name: 'Vocal print tone', kind: 'tone', placement: 'record', execution: 'device_dsp', enabled: false, processorRef: null, sendEndpointId: null, returnEndpointId: null},
      {id: 'tracking.stage.instrument-pedal', name: 'Instrument pedal monitor', kind: 'pedal', placement: 'monitor', execution: 'external_hardware', enabled: false, processorRef: null, sendEndpointId: null, returnEndpointId: null},
      {id: 'tracking.stage.cue-space', name: 'Performer cue ambience', kind: 'tone', placement: 'cue', execution: 'native_cpu', enabled: false, processorRef: null, sendEndpointId: null, returnEndpointId: null},
    ],
    cueBuses: [
      {id: 'tracking.cue.artist', name: 'Artist Cue', outputEndpointId: null, talkbackIntent: true},
      {id: 'tracking.cue.producer', name: 'Producer Cue', outputEndpointId: null, talkbackIntent: false},
    ],
    routes: [
      {
        id: 'tracking.route.vocal', name: 'Lead vocal path', sourceId: 'tracking.source.mic-1', targetTrackId: vocalTrackId,
        captureIntent: 'safe', monitorIntent: true, recordMode: 'clean',
        monitorStageIds: ['tracking.stage.vocal-comfort'], recordStageIds: ['tracking.stage.vocal-print'], cueStageIds: ['tracking.stage.cue-space'],
        cueSends: [{cueId: 'tracking.cue.artist', levelDb: 0, pan: 0, preFader: true}],
      },
      {
        id: 'tracking.route.instrument', name: 'Instrument path', sourceId: 'tracking.source.instrument-2', targetTrackId: instrumentTrackId,
        captureIntent: 'safe', monitorIntent: true, recordMode: 'clean',
        monitorStageIds: ['tracking.stage.instrument-pedal'], recordStageIds: [], cueStageIds: [],
        cueSends: [{cueId: 'tracking.cue.artist', levelDb: -3, pan: 0, preFader: true}],
      },
    ],
  };
  state = captureTrackingSnapshot(state, 'tracking.snapshot.safe-start', 'Safe tracking start', capturedAt);
  return state;
}

export function validateTrackingConsoleState(
  state: TrackingConsoleState,
  project?: PoietekProject,
): string[] {
  const issues = validateConfiguration(state, project);
  if (state.schemaVersion !== TRACKING_CONSOLE_SCHEMA_VERSION) issues.push('Unsupported Tracking Console schema version.');
  if (!state.projectId.trim()) issues.push('Tracking Console project id is required.');
  if (!Number.isInteger(state.revision) || state.revision < 0) issues.push('Tracking Console revision must be a non-negative whole number.');
  if (project && state.projectId !== project.id) issues.push('Tracking Console state belongs to another project.');

  const routeIds = new Set(state.routes.map((route) => route.id));
  const sourceIds = new Set(state.sources.map((source) => source.id));
  const stageIds = new Set(state.stages.map((stage) => stage.id));
  const observationIds = new Set<string>();
  for (const observation of state.runtimeObservations) {
    if (!idPattern.test(observation.id) || !observation.adapterId.trim() || !observation.deviceId.trim()) {
      issues.push('Runtime observations require valid observation, adapter and device ids.');
    }
    if (observationIds.has(observation.id)) issues.push(`Duplicate tracking observation ${observation.id}.`);
    observationIds.add(observation.id);
    if (!Number.isFinite(observation.observedAt) || observation.observedAt <= 0) issues.push(`Tracking observation ${observation.id} requires a real observation time.`);
    if (observation.measuredRoundTripMs !== null && (!Number.isFinite(observation.measuredRoundTripMs) || observation.measuredRoundTripMs < 0)) {
      issues.push(`Tracking observation ${observation.id} has an invalid measured round-trip latency.`);
    }
    if (duplicates(observation.availableInputChannels.map(String)) || observation.availableInputChannels.some((channel) => !Number.isInteger(channel) || channel < 1)) {
      issues.push(`Tracking observation ${observation.id} has invalid input channels.`);
    }
    if (duplicates(observation.availableOutputChannels.map(String)) || observation.availableOutputChannels.some((channel) => !Number.isInteger(channel) || channel < 1)) {
      issues.push(`Tracking observation ${observation.id} has invalid output channels.`);
    }
    for (const sourceId of observation.controllableSourceIds) if (!sourceIds.has(sourceId)) issues.push(`Tracking observation ${observation.id} references missing source ${sourceId}.`);
    for (const routeId of [...observation.activeCaptureRouteIds, ...observation.activeMonitorRouteIds]) if (!routeIds.has(routeId)) issues.push(`Tracking observation ${observation.id} references missing route ${routeId}.`);
    for (const executedStageId of observation.executedStageIds) if (!stageIds.has(executedStageId)) issues.push(`Tracking observation ${observation.id} references missing stage ${executedStageId}.`);
  }

  const snapshotIds = new Set<string>();
  for (const snapshot of state.snapshots) {
    if (!idPattern.test(snapshot.id) || !snapshot.name.trim()) issues.push('Tracking snapshots require a valid id and name.');
    if (snapshotIds.has(snapshot.id)) issues.push(`Duplicate tracking snapshot ${snapshot.id}.`);
    snapshotIds.add(snapshot.id);
    if (Number.isNaN(Date.parse(snapshot.capturedAt))) issues.push(`Tracking snapshot ${snapshot.id} has an invalid capture time.`);
    if (snapshot.excludedRuntimeFields.length !== 1 || snapshot.excludedRuntimeFields[0] !== 'runtimeObservations') {
      issues.push(`Tracking snapshot ${snapshot.id} must exclude runtime observations.`);
    }
    issues.push(...validateConfiguration(snapshot.configuration).map((issue) => `Snapshot ${snapshot.id}: ${issue}`));
  }
  return issues;
}

function validateNext(state: TrackingConsoleState): TrackingConsoleState {
  const issues = validateTrackingConsoleState(state);
  if (issues.length) throw new Error(issues.join(' '));
  return state;
}

export function updateTrackingRoute(
  state: TrackingConsoleState,
  routeId: string,
  patch: Partial<Pick<TrackingRoute, 'captureIntent' | 'monitorIntent' | 'recordMode' | 'cueSends'>>,
): TrackingConsoleState {
  if (!state.routes.some((route) => route.id === routeId)) throw new Error(`Tracking route ${routeId} was not found.`);
  return validateNext({
    ...state,
    revision: state.revision + 1,
    routes: state.routes.map((route) => route.id === routeId
      ? cloneRoute({...route, ...patch, cueSends: patch.cueSends ?? route.cueSends})
      : cloneRoute(route)),
  });
}

export function updateTrackingSourceControls(
  state: TrackingConsoleState,
  sourceId: string,
  patch: Partial<TrackingInputControlIntent>,
): TrackingConsoleState {
  if (!state.sources.some((source) => source.id === sourceId)) throw new Error(`Tracking source ${sourceId} was not found.`);
  return validateNext({
    ...state,
    revision: state.revision + 1,
    sources: state.sources.map((source) => source.id === sourceId
      ? {...cloneSource(source), inputControls: {...source.inputControls, ...patch}}
      : cloneSource(source)),
  });
}

export function setTrackingStageEnabled(
  state: TrackingConsoleState,
  stageId: string,
  enabled: boolean,
): TrackingConsoleState {
  if (!state.stages.some((stage) => stage.id === stageId)) throw new Error(`Tracking stage ${stageId} was not found.`);
  return validateNext({
    ...state,
    revision: state.revision + 1,
    stages: state.stages.map((stage) => stage.id === stageId ? {...stage, enabled} : cloneStage(stage)),
  });
}

export function recordTrackingRuntimeObservation(
  state: TrackingConsoleState,
  observation: TrackingRuntimeObservation,
): TrackingConsoleState {
  const runtimeObservations = state.runtimeObservations.some((candidate) => candidate.id === observation.id)
    ? state.runtimeObservations.map((candidate) => candidate.id === observation.id ? cloneObservation(observation) : cloneObservation(candidate))
    : [...state.runtimeObservations.map(cloneObservation), cloneObservation(observation)];
  return validateNext({...state, revision: state.revision + 1, runtimeObservations});
}

function activeStages(state: TrackingConsoleState, ids: readonly string[]): TrackingStage[] {
  const idSet = new Set(ids);
  return state.stages.filter((stage) => idSet.has(stage.id) && stage.enabled);
}

export function buildTrackingRoutePlan(
  state: TrackingConsoleState,
  routeId: string,
): TrackingRoutePlan {
  const route = state.routes.find((candidate) => candidate.id === routeId);
  if (!route) throw new Error(`Tracking route ${routeId} was not found.`);
  const source = state.sources.find((candidate) => candidate.id === route.sourceId)!;
  const monitorStages = activeStages(state, route.monitorStageIds);
  const recordStages = route.recordMode === 'processed' ? activeStages(state, route.recordStageIds) : [];
  const cueStages = activeStages(state, route.cueStageIds);
  const requirements: string[] = [];
  if (!source.endpointId) requirements.push('input_endpoint_observation');
  if (route.captureIntent === 'armed') requirements.push('capture_stream_observation');
  if (route.monitorIntent) requirements.push('monitor_stream_observation');
  for (const stage of [...monitorStages, ...recordStages, ...cueStages]) requirements.push(`processor_execution:${stage.id}`);
  for (const stage of [...monitorStages, ...recordStages, ...cueStages].filter((candidate) => candidate.kind === 'external_insert')) {
    if (!stage.sendEndpointId || !stage.returnEndpointId) requirements.push(`hardware_insert_connection:${stage.id}`);
    requirements.push(`hardware_insert_latency:${stage.id}`);
  }
  for (const send of route.cueSends) {
    const cue = state.cueBuses.find((candidate) => candidate.id === send.cueId)!;
    if (!cue.outputEndpointId) requirements.push(`cue_output_observation:${cue.id}`);
  }
  return {
    routeId: route.id,
    sourceId: route.sourceId,
    targetTrackId: route.targetTrackId,
    captureIntent: route.captureIntent,
    monitorIntent: route.monitorIntent,
    recordMode: route.recordMode,
    monitorStageIds: monitorStages.map((stage) => stage.id),
    recordStageIds: recordStages.map((stage) => stage.id),
    cueStageIds: cueStages.map((stage) => stage.id),
    cueSends: route.cueSends.map((send) => ({...send})),
    requirements: [...new Set(requirements)],
    claim: route.recordMode === 'clean'
      ? 'The record path excludes record-processing stages; monitoring and cue stages remain audition-only plans.'
      : 'The record path requests enabled record stages, but processing is not claimed until an adapter reports their execution.',
  };
}

export function evaluateTrackingRouteReadiness(
  state: TrackingConsoleState,
  routeId: string,
): TrackingRouteReadiness {
  const route = state.routes.find((candidate) => candidate.id === routeId);
  if (!route) throw new Error(`Tracking route ${routeId} was not found.`);
  const source = state.sources.find((candidate) => candidate.id === route.sourceId)!;
  const observations = state.runtimeObservations;
  const inputObserved = source.inputChannel !== null && observations.some((observation) => (
    observation.availableInputChannels.includes(source.inputChannel!)
  ));
  const sourceControllable = observations.some((observation) => observation.controllableSourceIds.includes(source.id));
  const captureActive = observations.some((observation) => observation.activeCaptureRouteIds.includes(route.id));
  const monitorActive = observations.some((observation) => observation.activeMonitorRouteIds.includes(route.id));
  const enabledRecordStageIds = route.recordMode === 'processed'
    ? activeStages(state, route.recordStageIds).map((stage) => stage.id)
    : [];
  const executedStageIds = new Set(observations.flatMap((observation) => observation.executedStageIds));
  const processingObserved = enabledRecordStageIds.length > 0
    && enabledRecordStageIds.every((stageId) => executedStageIds.has(stageId));
  const measured = observations
    .filter((observation) => observation.measuredRoundTripMs !== null)
    .sort((left, right) => right.observedAt - left.observedAt)[0]?.measuredRoundTripMs ?? null;
  const capture: TrackingRouteReadiness['capture'] = route.captureIntent === 'safe'
    ? 'not_requested'
    : captureActive ? 'active_stream_observed' : inputObserved ? 'route_observed' : 'adapter_required';
  const monitoring: TrackingRouteReadiness['monitoring'] = !route.monitorIntent
    ? 'not_requested'
    : monitorActive ? 'active_stream_observed' : inputObserved ? 'route_observed' : 'adapter_required';
  const recordProcessing: TrackingRouteReadiness['recordProcessing'] = route.recordMode === 'clean' || enabledRecordStageIds.length === 0
    ? 'not_requested'
    : processingObserved ? 'processing_observed' : 'adapter_required';
  const inputControl: TrackingRouteReadiness['inputControl'] = sourceControllable ? 'route_observed' : 'adapter_required';
  return {
    routeId,
    capture,
    monitoring,
    recordProcessing,
    inputControl,
    latency: measured === null ? 'adapter_required' : 'measured',
    measuredRoundTripMs: measured,
    canClaimActiveCapture: route.captureIntent === 'armed' && captureActive,
    canClaimActiveMonitoring: route.monitorIntent && monitorActive,
    canClaimProcessedRecording: route.recordMode === 'processed' && processingObserved && captureActive,
    message: captureActive
      ? 'A reviewed adapter reported an active capture stream. Other claims remain independently evidence-gated.'
      : 'The project stores routing intent only; no active capture stream has been observed.',
  };
}

export function captureTrackingSnapshot(
  state: TrackingConsoleState,
  id: string,
  name: string,
  capturedAt = new Date().toISOString(),
): TrackingConsoleState {
  if (!idPattern.test(id) || !name.trim()) throw new Error('Tracking snapshots require a valid id and name.');
  if (Number.isNaN(Date.parse(capturedAt))) throw new Error('Tracking snapshot capture time is invalid.');
  const snapshot: TrackingSnapshot = {
    id,
    name: name.trim(),
    capturedAt,
    configuration: cloneConfiguration(state),
    excludedRuntimeFields: ['runtimeObservations'],
  };
  const snapshots = state.snapshots.some((candidate) => candidate.id === id)
    ? state.snapshots.map((candidate) => candidate.id === id ? snapshot : cloneSnapshot(candidate))
    : [...state.snapshots.map(cloneSnapshot), snapshot];
  return validateNext({...state, revision: state.revision + 1, snapshots});
}

function changedIds<T extends {id: string}>(current: readonly T[], saved: readonly T[]): string[] {
  const currentById = new Map(current.map((item) => [item.id, JSON.stringify(item)]));
  const savedById = new Map(saved.map((item) => [item.id, JSON.stringify(item)]));
  return [...new Set([...currentById.keys(), ...savedById.keys()])]
    .filter((id) => currentById.get(id) !== savedById.get(id))
    .sort();
}

export function diffTrackingSnapshot(
  state: TrackingConsoleState,
  snapshotId: string,
): TrackingSnapshotDiff {
  const snapshot = state.snapshots.find((candidate) => candidate.id === snapshotId);
  if (!snapshot) throw new Error(`Tracking snapshot ${snapshotId} was not found.`);
  const changedSourceIds = changedIds(state.sources, snapshot.configuration.sources);
  const changedStageIds = changedIds(state.stages, snapshot.configuration.stages);
  const changedCueBusIds = changedIds(state.cueBuses, snapshot.configuration.cueBuses);
  const changedRouteIds = changedIds(state.routes, snapshot.configuration.routes);
  const hasChanges = Boolean(changedSourceIds.length || changedStageIds.length || changedCueBusIds.length || changedRouteIds.length);
  return {
    snapshotId,
    changedSourceIds,
    changedStageIds,
    changedCueBusIds,
    changedRouteIds,
    hasChanges,
    claim: hasChanges
      ? 'Recall will replace saved routing intent while preserving adapter-supplied runtime observations.'
      : 'The current routing intent already matches this snapshot.',
  };
}

export function recallTrackingSnapshot(
  state: TrackingConsoleState,
  snapshotId: string,
): TrackingConsoleState {
  const snapshot = state.snapshots.find((candidate) => candidate.id === snapshotId);
  if (!snapshot) throw new Error(`Tracking snapshot ${snapshotId} was not found.`);
  return validateNext({
    ...state,
    ...cloneSnapshot(snapshot).configuration,
    revision: state.revision + 1,
    snapshots: state.snapshots.map(cloneSnapshot),
    runtimeObservations: state.runtimeObservations.map(cloneObservation),
  });
}

export function getTrackingConsoleReadiness(): TrackingConsoleReadiness {
  return {
    projectModel: 'ready',
    cleanRecordPlanning: 'ready',
    processedRecordPlanning: 'ready',
    cuePlanning: 'ready',
    snapshotRecall: 'ready',
    activeCapture: 'adapter_required',
    activeMonitoring: 'adapter_required',
    processorExecution: 'adapter_required',
    hardwareControl: 'adapter_required',
    latencyMeasurement: 'adapter_required',
  };
}
