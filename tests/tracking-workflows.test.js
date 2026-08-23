import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const tracking = require('./.compiled-core/tracking-workflows/trackingConsole.js');
const commands = require('./.compiled-core/tracking-workflows/projectCommands.js');
const {createBlankProject} = require('./.compiled-core/domain/projectFactory.js');
const {ProjectSession} = require('./.compiled-core/project/ProjectSession.js');

const fixedTime = '2026-08-23T16:00:00.000Z';

test('starter Tracking Console creates canonical tracks, source paths, cues, and a runtime-free snapshot', () => {
  const project = commands.createStarterTrackingConsoleProject(createBlankProject('Tracking starter'), fixedTime);
  const state = commands.getProjectTrackingConsoleState(project);
  assert.equal(project.tracks.filter((track) => track.type === 'audio').length, 2);
  assert.deepEqual(state.sources.map((source) => source.kind), ['microphone', 'instrument', 'usb_left', 'usb_right']);
  assert.equal(state.routes.length, 2);
  assert.equal(state.cueBuses.length, 2);
  assert.equal(state.snapshots.length, 1);
  assert.deepEqual(state.snapshots[0].excludedRuntimeFields, ['runtimeObservations']);
  assert.equal('runtimeObservations' in state.snapshots[0].configuration, false);
  assert.deepEqual(tracking.validateTrackingConsoleState(state, project), []);
  assert.doesNotThrow(() => JSON.stringify(project));
});

test('clean and processed record plans keep monitor-only stages out of the printed path', () => {
  const project = commands.createStarterTrackingConsoleProject(createBlankProject('Path plan'), fixedTime);
  let state = commands.getProjectTrackingConsoleState(project);
  const clean = tracking.buildTrackingRoutePlan(state, 'tracking.route.vocal');
  assert.equal(clean.recordMode, 'clean');
  assert.deepEqual(clean.monitorStageIds, ['tracking.stage.vocal-comfort']);
  assert.deepEqual(clean.recordStageIds, []);
  assert.match(clean.claim, /excludes record-processing/);

  state = tracking.setTrackingStageEnabled(state, 'tracking.stage.vocal-print', true);
  state = tracking.updateTrackingRoute(state, 'tracking.route.vocal', {recordMode: 'processed'});
  const processed = tracking.buildTrackingRoutePlan(state, 'tracking.route.vocal');
  assert.deepEqual(processed.monitorStageIds, ['tracking.stage.vocal-comfort']);
  assert.deepEqual(processed.recordStageIds, ['tracking.stage.vocal-print']);
  assert.ok(processed.requirements.includes('processor_execution:tracking.stage.vocal-print'));
});

test('route validation rejects duplicate stages, missing tracks, and wrong path placement', () => {
  const project = commands.createStarterTrackingConsoleProject(createBlankProject('Validation'), fixedTime);
  const state = commands.getProjectTrackingConsoleState(project);
  const duplicate = structuredClone(state);
  duplicate.routes[0].monitorStageIds.push('tracking.stage.vocal-comfort');
  assert.match(tracking.validateTrackingConsoleState(duplicate, project).join(' '), /repeats a monitor stage/);
  const wrongPath = structuredClone(state);
  wrongPath.routes[0].recordStageIds.push('tracking.stage.vocal-comfort');
  assert.match(tracking.validateTrackingConsoleState(wrongPath, project).join(' '), /wrong path/);
  const missingTrack = structuredClone(state);
  missingTrack.routes[0].targetTrackId = 'track.missing';
  assert.match(tracking.validateTrackingConsoleState(missingTrack, project).join(' '), /missing track/);
});

test('input switches remain requests and cannot create device-control evidence', () => {
  const project = commands.createStarterTrackingConsoleProject(createBlankProject('Input intent'), fixedTime);
  let state = commands.getProjectTrackingConsoleState(project);
  state = tracking.updateTrackingSourceControls(state, 'tracking.source.mic-1', {
    gainDb: 36,
    phantomPower: 'on',
    highPass: 'on',
    polarity: 'invert',
  });
  const source = state.sources.find((candidate) => candidate.id === 'tracking.source.mic-1');
  assert.equal(source.inputControls.phantomPower, 'on');
  const readiness = tracking.evaluateTrackingRouteReadiness(state, 'tracking.route.vocal');
  assert.equal(readiness.inputControl, 'adapter_required');
  assert.equal(readiness.canClaimActiveCapture, false);
  assert.equal(state.runtimeObservations.length, 0);
});

test('runtime readiness advances only from explicit adapter observations', () => {
  const project = commands.createStarterTrackingConsoleProject(createBlankProject('Observed tracking'), fixedTime);
  let state = commands.getProjectTrackingConsoleState(project);
  state = tracking.setTrackingStageEnabled(state, 'tracking.stage.vocal-print', true);
  state = tracking.updateTrackingRoute(state, 'tracking.route.vocal', {captureIntent: 'armed', recordMode: 'processed'});
  let report = tracking.evaluateTrackingRouteReadiness(state, 'tracking.route.vocal');
  assert.equal(report.capture, 'adapter_required');
  assert.equal(report.recordProcessing, 'adapter_required');
  assert.equal(report.latency, 'adapter_required');

  state = tracking.recordTrackingRuntimeObservation(state, {
    id: 'observation.interface-a',
    adapterId: 'adapter.native-audio',
    deviceId: 'device.interface-a',
    observedAt: 1_787_500_000_000,
    availableInputChannels: [1, 2],
    availableOutputChannels: [1, 2],
    controllableSourceIds: ['tracking.source.mic-1'],
    activeCaptureRouteIds: ['tracking.route.vocal'],
    activeMonitorRouteIds: ['tracking.route.vocal'],
    executedStageIds: ['tracking.stage.vocal-comfort', 'tracking.stage.vocal-print'],
    measuredRoundTripMs: 7.4,
    evidenceReference: 'native-audio-observation-1',
  });
  report = tracking.evaluateTrackingRouteReadiness(state, 'tracking.route.vocal');
  assert.equal(report.capture, 'active_stream_observed');
  assert.equal(report.monitoring, 'active_stream_observed');
  assert.equal(report.recordProcessing, 'processing_observed');
  assert.equal(report.inputControl, 'route_observed');
  assert.equal(report.latency, 'measured');
  assert.equal(report.measuredRoundTripMs, 7.4);
  assert.equal(report.canClaimProcessedRecording, true);
});

test('runtime observations fail closed on invented or broken references', () => {
  const project = commands.createStarterTrackingConsoleProject(createBlankProject('Broken observation'), fixedTime);
  const state = commands.getProjectTrackingConsoleState(project);
  assert.throws(() => tracking.recordTrackingRuntimeObservation(state, {
    id: 'observation.invalid', adapterId: 'adapter.test', deviceId: 'device.test', observedAt: 1,
    availableInputChannels: [1], availableOutputChannels: [1, 2], controllableSourceIds: [],
    activeCaptureRouteIds: ['route.missing'], activeMonitorRouteIds: [], executedStageIds: [], measuredRoundTripMs: null,
  }), /missing route/);
  assert.throws(() => tracking.recordTrackingRuntimeObservation(state, {
    id: 'observation.invalid-latency', adapterId: 'adapter.test', deviceId: 'device.test', observedAt: 1,
    availableInputChannels: [1], availableOutputChannels: [1, 2], controllableSourceIds: [],
    activeCaptureRouteIds: [], activeMonitorRouteIds: [], executedStageIds: [], measuredRoundTripMs: -1,
  }), /invalid measured round-trip/);
});

test('snapshot diff and recall restore intent while preserving runtime evidence', () => {
  const project = commands.createStarterTrackingConsoleProject(createBlankProject('Recall tracking'), fixedTime);
  let state = commands.getProjectTrackingConsoleState(project);
  state = tracking.recordTrackingRuntimeObservation(state, {
    id: 'observation.keep', adapterId: 'adapter.keep', deviceId: 'device.keep', observedAt: 1,
    availableInputChannels: [1], availableOutputChannels: [1, 2], controllableSourceIds: [],
    activeCaptureRouteIds: [], activeMonitorRouteIds: [], executedStageIds: [], measuredRoundTripMs: null,
  });
  state = tracking.updateTrackingRoute(state, 'tracking.route.vocal', {captureIntent: 'armed', recordMode: 'processed'});
  const diff = tracking.diffTrackingSnapshot(state, 'tracking.snapshot.safe-start');
  assert.equal(diff.hasChanges, true);
  assert.deepEqual(diff.changedRouteIds, ['tracking.route.vocal']);
  const recalled = tracking.recallTrackingSnapshot(state, 'tracking.snapshot.safe-start');
  assert.equal(recalled.routes.find((route) => route.id === 'tracking.route.vocal').captureIntent, 'safe');
  assert.equal(recalled.routes.find((route) => route.id === 'tracking.route.vocal').recordMode, 'clean');
  assert.equal(recalled.runtimeObservations.length, 1);
  assert.equal(recalled.runtimeObservations[0].id, 'observation.keep');
  assert.equal(tracking.diffTrackingSnapshot(recalled, 'tracking.snapshot.safe-start').hasChanges, false);
});

test('Tracking Console recall is one durable ProjectSession undo point', async () => {
  const starter = commands.createStarterTrackingConsoleProject(createBlankProject('Atomic tracking'), fixedTime);
  const changed = commands.mutateProjectTrackingConsoleState(starter, (state) => (
    tracking.updateTrackingRoute(state, 'tracking.route.vocal', {captureIntent: 'armed', recordMode: 'processed'})
  ));
  const saves = [];
  const session = new ProjectSession(changed, {save: async (snapshot) => saves.push(structuredClone(snapshot))});
  const recalled = await session.mutate((project) => commands.mutateProjectTrackingConsoleState(project, (state) => (
    tracking.recallTrackingSnapshot(state, 'tracking.snapshot.safe-start')
  )));
  assert.equal(commands.getProjectTrackingConsoleState(recalled).routes[0].captureIntent, 'safe');
  const undone = await session.undo();
  assert.equal(commands.getProjectTrackingConsoleState(undone).routes[0].captureIntent, 'armed');
  assert.equal(session.canRedo(), true);
  assert.equal(saves.length, 2);
});

test('Tracking Console rejects cross-project state and reports honest capability boundaries', () => {
  const first = commands.createStarterTrackingConsoleProject(createBlankProject('First tracking'), fixedTime);
  const second = createBlankProject('Second tracking');
  const state = commands.getProjectTrackingConsoleState(first);
  assert.throws(() => commands.withProjectTrackingConsoleState(second, state), /another project|missing track/);
  assert.deepEqual(tracking.getTrackingConsoleReadiness(), {
    projectModel: 'ready', cleanRecordPlanning: 'ready', processedRecordPlanning: 'ready', cuePlanning: 'ready', snapshotRecall: 'ready',
    activeCapture: 'adapter_required', activeMonitoring: 'adapter_required', processorExecution: 'adapter_required', hardwareControl: 'adapter_required', latencyMeasurement: 'adapter_required',
  });
});
