import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const matrix = require('./.compiled-core/modulation-workflows/matrix.js');
const commands = require('./.compiled-core/modulation-workflows/projectCommands.js');
const {createBlankProject} = require('./.compiled-core/domain/projectFactory.js');
const {ProjectSession} = require('./.compiled-core/project/ProjectSession.js');

test('starter motion matrix is valid, deterministic and JSON portable', () => {
  const state = matrix.createStarterMotionMatrix('project-motion');
  assert.deepEqual(matrix.validateModulationWorkflowState(state), []);
  assert.equal(state.sources.length, 5);
  assert.equal(state.routes.length, 5);
  assert.equal(state.scenes.length, 3);
  const first = matrix.evaluateModulationControlFrame(state, 0.375);
  const second = matrix.evaluateModulationControlFrame(state, 0.375);
  assert.deepEqual(first, second);
  assert.doesNotThrow(() => JSON.stringify(state));
  assert.equal(first.claim, 'deterministic_control_preview');
});

test('source shapes, steps and seeded motion evaluate inside declared ranges', () => {
  const state = matrix.createStarterMotionMatrix('project-sources');
  const start = matrix.evaluateModulationControlFrame(state, 0);
  const quarter = matrix.evaluateModulationControlFrame(state, 0.25);
  const source = (frame, id) => frame.sources.find((candidate) => candidate.sourceId === id);
  assert.equal(source(start, 'motion.orbit').value, 0);
  assert.equal(source(quarter, 'motion.orbit').value, 1);
  assert.equal(source(start, 'motion.pulse').value, 0.1);
  assert.equal(source(quarter, 'motion.pulse').value, 0.35);
  assert.ok(source(start, 'motion.seed').value >= -1 && source(start, 'motion.seed').value <= 1);
});

test('routes sum, curve and clamp into deterministic target previews', () => {
  const state = matrix.createStarterMotionMatrix('project-targets');
  const frame = matrix.evaluateModulationControlFrame(state, 0.25);
  const tone = frame.targets.find((target) => target.targetId === 'motion.tone');
  const movement = frame.targets.find((target) => target.targetId === 'motion.movement');
  assert.equal(tone.activeRouteCount, 2);
  assert.ok(tone.value >= 0 && tone.value <= 1);
  assert.equal(tone.deliveryState, 'local_preview');
  assert.equal(movement.activeRouteCount, 2);
  assert.match(frame.note, /does not claim audio-rate DSP/);
});

test('external sources fail closed without an observation and accept matching evidence', () => {
  const state = matrix.createStarterMotionMatrix('project-evidence');
  const blocked = matrix.evaluateModulationControlFrame(state, 0.5);
  const blockedTouch = blocked.sources.find((source) => source.sourceId === 'motion.touch');
  assert.equal(blockedTouch.status, 'adapter_required');
  assert.equal(blockedTouch.value, null);

  const observed = matrix.evaluateModulationControlFrame(state, 0.5, [{
    sourceId: 'motion.touch',
    adapterId: 'mpe-input-1',
    capability: 'note_expression_observation',
    value: 0.75,
    observedAt: 1,
  }]);
  assert.equal(observed.sources.find((source) => source.sourceId === 'motion.touch').value, 0.75);
  assert.equal(observed.targets.find((target) => target.targetId === 'motion.rack-preview').deliveryState, 'adapter_required');
});

test('macro edits and route toggles are immutable and validated', () => {
  const state = matrix.createStarterMotionMatrix('project-edits');
  const edited = matrix.setMacroSourceValue(state, 'motion.expression', 0.72);
  assert.equal(state.sources.find((source) => source.id === 'motion.expression').value, 0.5);
  assert.equal(edited.sources.find((source) => source.id === 'motion.expression').value, 0.72);
  assert.equal(edited.revision, state.revision + 1);
  const disabled = matrix.setModulationRouteEnabled(edited, 'route.orbit-tone', false);
  assert.equal(disabled.routes.find((route) => route.id === 'route.orbit-tone').enabled, false);
  assert.throws(() => matrix.setMacroSourceValue(state, 'motion.orbit', 0.5), /not a macro/);
  assert.throws(() => matrix.setMacroSourceValue(state, 'motion.expression', 2), /between 0 and 1/);
});

test('motion scenes recall atomically through the canonical project session', async () => {
  const blank = createBlankProject('Motion scene session');
  const project = commands.withProjectModulationWorkflowState(blank, matrix.createStarterMotionMatrix(blank.id));
  const saves = [];
  const session = new ProjectSession(project, {save: async (snapshot) => saves.push(structuredClone(snapshot))});
  const recalled = await session.mutate((current) => commands.recallProjectMotionScene(current, 'scene.lift'));
  const recalledState = commands.getProjectModulationWorkflowState(recalled);
  assert.equal(recalledState.activeSceneId, 'scene.lift');
  assert.equal(recalledState.sources.find((source) => source.id === 'motion.expression').value, 0.9);
  assert.equal(session.canUndo(), true);
  const undone = await session.undo();
  assert.equal(commands.getProjectModulationWorkflowState(undone).activeSceneId, null);
  assert.equal(commands.getProjectModulationWorkflowState(undone).sources.find((source) => source.id === 'motion.expression').value, 0.5);
  const redone = await session.redo();
  assert.equal(commands.getProjectModulationWorkflowState(redone).activeSceneId, 'scene.lift');
  assert.equal(saves.length, 3);
});

test('project extension rejects cross-project and malformed graphs', () => {
  const first = createBlankProject('First');
  const second = createBlankProject('Second');
  const state = matrix.createStarterMotionMatrix(first.id);
  assert.throws(() => commands.withProjectModulationWorkflowState(second, state), /another project/);

  const missingSource = structuredClone(state);
  missingSource.routes[0].sourceId = 'missing';
  assert.match(matrix.validateModulationWorkflowState(missingSource).join(' '), /missing source/);

  const duplicateTarget = structuredClone(state);
  duplicateTarget.targets[1].id = duplicateTarget.targets[0].id;
  assert.match(matrix.validateModulationWorkflowState(duplicateTarget).join(' '), /Duplicate modulation target/);
});

test('track targets require canonical tracks and a timeline delivery adapter', () => {
  const project = createBlankProject('Track target');
  const state = matrix.createStarterMotionMatrix(project.id);
  state.targets.push({
    id: 'target.track-pan', name: 'Lead pan', kind: 'track_pan', baseValue: 0, minimum: -1, maximum: 1,
    unit: '', referenceId: 'missing-track', parameterId: 'pan', requiredCapability: 'timeline_control_frame',
  });
  assert.match(matrix.validateModulationWorkflowState(state, project).join(' '), /missing canonical track/);
  state.targets[state.targets.length - 1].referenceId = 'track-later';
  project.tracks.push({id: 'track-later', type: 'audio', name: 'Track', order: 0, color: null, clips: [], mixer: {gainDb: 0, pan: 0, mute: false, solo: false}});
  assert.deepEqual(matrix.validateModulationWorkflowState(state, project), []);
  const frame = matrix.evaluateModulationControlFrame(state, 0.5, [], project);
  assert.equal(frame.targets.find((target) => target.targetId === 'target.track-pan').deliveryState, 'adapter_required');
});
