import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const canvas = require('./.compiled-core/performance-workflows/canvas.js');
const commands = require('./.compiled-core/performance-workflows/projectCommands.js');
const composition = require('./.compiled-core/composition-workflows/patterns.js');
const {createBlankProject} = require('./.compiled-core/domain/projectFactory.js');
const {ProjectSession} = require('./.compiled-core/project/ProjectSession.js');

test('starter Performance Canvas creates project-owned sources, scenes and arrangement lanes', () => {
  const blank = createBlankProject('Performance starter');
  const project = commands.createStarterPerformanceCanvasProject(blank);
  const state = commands.getProjectPerformanceCanvasState(project);
  const compositionState = composition.getProjectCompositionWorkflow(project);
  assert.equal(state.lanes.length, 3);
  assert.equal(state.scenes.length, 4);
  assert.equal(state.slots.length, 12);
  assert.equal(compositionState.patterns.length, 12);
  assert.equal(compositionState.lanes.length, 3);
  assert.deepEqual(canvas.validatePerformanceCanvasState(state, project), []);
  assert.doesNotThrow(() => JSON.stringify(project));
});

test('scene launches quantize deterministically and capture one event per lane', () => {
  const project = commands.createStarterPerformanceCanvasProject(createBlankProject('Quantized performance'));
  let state = commands.getProjectPerformanceCanvasState(project);
  state = canvas.startPerformanceCapture(state, 'take.quantized', 0);
  state = canvas.launchPerformanceScene(state, 'scene.spark', 1);
  assert.equal(state.capture.events.length, 3);
  assert.ok(state.capture.events.every((event) => event.scheduledTick === state.launchQuantizationTicks));
  assert.equal(Object.values(state.activeSlotIdsByLane).filter(Boolean).length, 3);
  state = canvas.stopPerformanceCapture(state, state.barLengthTicks * 2);
  assert.equal(state.capture.status, 'stopped');
  assert.ok(state.capture.stoppedAtTick > state.capture.events[0].scheduledTick);
});

test('launch modes and follow plans remain explicit project intent', () => {
  const project = commands.createStarterPerformanceCanvasProject(createBlankProject('Launch intent'));
  const initial = commands.getProjectPerformanceCanvasState(project);
  const started = canvas.launchPerformanceSlot(initial, 'slot.pulse.spark', 0);
  assert.equal(started.activeSlotIdsByLane['lane.pulse'], 'slot.pulse.spark');
  const toggledOff = canvas.launchPerformanceSlot(started, 'slot.pulse.spark', 0);
  assert.equal(toggledOff.activeSlotIdsByLane['lane.pulse'], null);
  const follow = canvas.planPerformanceFollow(initial, 'scene.air', initial.barLengthTicks);
  assert.equal(follow.targetSceneId, 'scene.resolve');
  assert.equal(follow.scheduledTick, initial.barLengthTicks * 3);
  assert.equal(follow.claim, 'planning_only');
  const stopFollow = canvas.planPerformanceFollow(initial, 'scene.resolve', 0);
  assert.equal(stopFollow.targetSceneId, null);
  assert.equal(stopFollow.action, 'stop');
});

test('runtime readiness fails closed and accepts only observed capabilities', () => {
  const project = commands.createStarterPerformanceCanvasProject(createBlankProject('Performance evidence'));
  const state = commands.getProjectPerformanceCanvasState(project);
  const blocked = canvas.evaluatePerformanceReadiness(state);
  assert.equal(blocked.livePlayback, 'adapter_required');
  assert.equal(blocked.controllerInput, 'adapter_required');
  assert.ok(blocked.missingCapabilities.includes('sample_accurate_clock'));
  const ready = canvas.evaluatePerformanceReadiness(state, [{
    adapterId: 'native-performance-runtime',
    observedAt: 1,
    capabilities: ['sample_accurate_clock', 'pattern_playback', 'controller_input', 'follow_scheduler'],
  }]);
  assert.equal(ready.livePlayback, 'ready');
  assert.equal(ready.controllerInput, 'ready');
  assert.equal(ready.followScheduling, 'ready');
});

test('captured performance commits atomically to canonical arrangement clips', async () => {
  let project = commands.createStarterPerformanceCanvasProject(createBlankProject('Arrangement capture'));
  let state = commands.getProjectPerformanceCanvasState(project);
  state = canvas.startPerformanceCapture(state, 'take.arrangement', 0);
  state = canvas.launchPerformanceScene(state, 'scene.spark', 0);
  state = canvas.setPerformanceCursor(state, state.barLengthTicks * 2);
  state = canvas.launchPerformanceScene(state, 'scene.drive', state.capture.cursorTick);
  state = canvas.setPerformanceCursor(state, state.barLengthTicks * 4);
  state = canvas.stopPerformanceCapture(state);
  project = commands.withProjectPerformanceCanvasState(project, state);

  const plan = canvas.buildArrangementCapturePlan(state, 'commit.arrangement', 0);
  assert.equal(plan.entries.length, 6);
  assert.equal(plan.claim, 'canonical_arrangement_plan');

  const saves = [];
  const session = new ProjectSession(project, {save: async (snapshot) => saves.push(structuredClone(snapshot))});
  const committed = await session.mutate((current) => commands.commitProjectPerformanceCapture(current, 'commit.arrangement', 0));
  assert.equal(commands.getProjectPerformanceCanvasState(committed).capture.status, 'committed');
  assert.equal(composition.getProjectCompositionWorkflow(committed).lanes.reduce((total, lane) => total + lane.clips.length, 0), 6);
  assert.equal(session.canUndo(), true);

  const undone = await session.undo();
  assert.equal(commands.getProjectPerformanceCanvasState(undone).capture.status, 'stopped');
  assert.equal(composition.getProjectCompositionWorkflow(undone).lanes.reduce((total, lane) => total + lane.clips.length, 0), 0);
  assert.equal(saves.length, 2);
});

test('non-looping slots stop at their declared source length in arrangement plans', () => {
  const project = commands.createStarterPerformanceCanvasProject(createBlankProject('One shot performance'));
  let state = commands.getProjectPerformanceCanvasState(project);
  state.slots.find((slot) => slot.id === 'slot.pulse.spark').loopEnabled = false;
  state = canvas.startPerformanceCapture(state, 'take.one-shot', 0);
  state = canvas.launchPerformanceSlot(state, 'slot.pulse.spark', 0);
  state = canvas.setPerformanceCursor(state, state.barLengthTicks * 4);
  state = canvas.stopPerformanceCapture(state);
  const entry = canvas.buildArrangementCapturePlan(state, 'commit.one-shot').entries[0];
  assert.equal(entry.durationTicks, state.slots.find((slot) => slot.id === 'slot.pulse.spark').lengthTicks);
  assert.equal(entry.loopEnabled, false);
});

test('Performance Canvas rejects cross-project state and missing canonical sources', () => {
  const first = commands.createStarterPerformanceCanvasProject(createBlankProject('First performance'));
  const second = createBlankProject('Second performance');
  const state = commands.getProjectPerformanceCanvasState(first);
  assert.throws(() => commands.withProjectPerformanceCanvasState(second, state), /another project|missing arrangement lane/);

  const brokenProject = structuredClone(first);
  const compositionState = composition.getProjectCompositionWorkflow(brokenProject);
  compositionState.patterns = compositionState.patterns.filter((pattern) => pattern.id !== state.slots[0].sourceId);
  brokenProject.extensions['org.poietek.composition-workflows'] = compositionState;
  assert.throws(() => commands.getProjectPerformanceCanvasState(brokenProject), /missing pattern/);
});
