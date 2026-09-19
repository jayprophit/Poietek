import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const techniques = require('./.compiled-core/technique-workflows/index.js');
const score = require('./.compiled-core/production-workflows/score.js');
const {createBlankProject} = require('./.compiled-core/domain/projectFactory.js');
const {ProjectSession} = require('./.compiled-core/project/ProjectSession.js');

const fixedTime = '2026-08-23T18:00:00.000Z';

function initializedProject() {
  return techniques.createStarterTechniqueMatrixProject(createBlankProject('Technique fixture'), fixedTime);
}

test('starter Technique Matrix creates a serializable score, instrument assignment and versioned map', () => {
  const project = initializedProject();
  const state = techniques.getProjectTechniqueMatrixState(project);
  const document = score.getProjectScoreDocument(project);
  assert.equal(state.schemaVersion, '1.0.0');
  assert.equal(state.maps.length, 1);
  assert.equal(state.maps[0].techniques.length, 5);
  assert.equal(state.maps[0].soundSlots.length, 9);
  assert.equal(state.assignments.length, 1);
  assert.equal(document.flows[0].measures[0].notes.length, 4);
  assert.ok(project.tracks.some((track) => track.id === state.assignments[0].trackId && track.type === 'instrument'));
  assert.deepEqual(techniques.validateTechniqueMatrixState(state, project), []);
  assert.doesNotThrow(() => JSON.stringify(project));
});

test('starter initialization preserves existing assets, media clips and unrelated extensions', () => {
  const project = createBlankProject('Preservation fixture');
  project.assets.push({
    id: 'asset-a', mediaType: 'audio', contentHash: 'hash-a', originalName: 'source.wav', mimeType: 'audio/wav', byteLength: 32,
    durationSeconds: 1, sampleRate: 48000, channels: 1, createdAt: fixedTime, tags: [], metadata: {fixture: true},
  });
  project.tracks.push({
    id: 'audio-a', type: 'audio', name: 'Source', order: 0, color: null, mixer: {gainDb: 0, pan: 0, mute: false, solo: false},
    clips: [{id: 'clip-a', clipType: 'audio', assetId: 'asset-a', name: 'Source clip', startTick: 0, durationTicks: 960, sourceOffsetSeconds: 0, sourceDurationSeconds: 1, gainDb: 0, pan: 0, fadeInSeconds: 0, fadeOutSeconds: 0, muted: false}],
  });
  project.extensions['fixture.keep'] = {keep: true};
  const assets = structuredClone(project.assets);
  const audioTrack = structuredClone(project.tracks[0]);
  const initialized = techniques.createStarterTechniqueMatrixProject(project, fixedTime);
  assert.deepEqual(initialized.assets, assets);
  assert.deepEqual(initialized.tracks.find((track) => track.id === 'audio-a'), audioTrack);
  assert.deepEqual(initialized.extensions['fixture.keep'], {keep: true});
});

test('score technique planning is deterministic, pure and models direction inheritance plus one-note attributes', () => {
  const project = initializedProject();
  const snapshot = structuredClone(project);
  const first = techniques.planProjectTechniquePlayback(project, 'technique-map-starter', 'technique-assignment-starter', 'plan-a');
  const second = techniques.planProjectTechniquePlayback(project, 'technique-map-starter', 'technique-assignment-starter', 'plan-a');
  assert.deepEqual(first, second);
  assert.deepEqual(project, snapshot);
  assert.equal(first.ready, true);
  assert.equal(first.executionClaim, 'control_plan_only');
  assert.deepEqual(first.events.map((event) => event.soundSlotId), [
    'slot-natural', 'slot-natural-staccato', 'slot-plucked', 'slot-plucked-accent',
  ]);
  assert.deepEqual(first.events.map((event) => event.noteStartTick), [0, 960, 1920, 2880]);
  assert.equal(first.events[1].actions[0].dispatchTick, 948);
  assert.equal(first.events[3].techniqueIds.includes('tech-accent'), true);
  assert.equal(first.events[3].techniqueIds.includes('tech-staccato'), false);
});

test('unbound score articulations fail closed without inventing a fallback sound slot', () => {
  let project = initializedProject();
  const document = structuredClone(score.getProjectScoreDocument(project));
  document.flows[0].measures[0].notes[0].articulations = ['sul ponticello'];
  project = score.withProjectScoreDocument(project, document);
  const plan = techniques.planProjectTechniquePlayback(project, 'technique-map-starter', 'technique-assignment-starter', 'unknown-articulation');
  assert.equal(plan.ready, false);
  assert.match(plan.issues.join(' '), /unbound articulation/i);
});

test('mutually exclusive direction techniques on one score note fail closed', () => {
  let project = initializedProject();
  const document = structuredClone(score.getProjectScoreDocument(project));
  document.flows[0].measures[0].notes[0].articulations = ['arco', 'pizzicato'];
  project = score.withProjectScoreDocument(project, document);
  const plan = techniques.planProjectTechniquePlayback(project, 'technique-map-starter', 'technique-assignment-starter', 'direction-conflict');
  assert.equal(plan.ready, false);
  assert.match(plan.issues.join(' '), /conflicting techniques/i);
});

test('stale reviewed plans are refused after the canonical score changes', () => {
  let project = initializedProject();
  const plan = techniques.planProjectTechniquePlayback(project, 'technique-map-starter', 'technique-assignment-starter', 'stale-plan');
  const document = structuredClone(score.getProjectScoreDocument(project));
  document.flows[0].measures[0].notes[0].dynamic = 'pp';
  project = score.withProjectScoreDocument(project, document);
  assert.throws(() => techniques.commitProjectTechniquePlan(project, plan, fixedTime), /stale/i);
});

test('commit records adapter intent atomically, preserves score and media, and supports ProjectSession undo', async () => {
  const initial = initializedProject();
  const originalScore = structuredClone(score.getProjectScoreDocument(initial));
  const originalAssets = structuredClone(initial.assets);
  const plan = techniques.planProjectTechniquePlayback(initial, 'technique-map-starter', 'technique-assignment-starter', 'commit-plan');
  const saves = [];
  const session = new ProjectSession(initial, {save: async (project) => saves.push(structuredClone(project))});
  const committed = await session.mutate((project) => techniques.commitProjectTechniquePlan(project, plan, fixedTime));
  const state = techniques.getProjectTechniqueMatrixState(committed);
  assert.equal(state.appliedPlans.length, 1);
  assert.equal(state.appliedPlans[0].state, 'planned_for_adapter');
  assert.equal(state.appliedPlans[0].eventCount, 4);
  assert.deepEqual(score.getProjectScoreDocument(committed), originalScore);
  assert.deepEqual(committed.assets, originalAssets);
  assert.equal(session.canUndo(), true);
  const undone = await session.undo();
  assert.equal(techniques.getProjectTechniqueMatrixState(undone).appliedPlans.length, 0);
  assert.equal(saves.length, 2);
});

test('duplicate commits are refused and do not claim MIDI or audio execution', () => {
  const initial = initializedProject();
  const plan = techniques.planProjectTechniquePlayback(initial, 'technique-map-starter', 'technique-assignment-starter', 'only-once');
  const committed = techniques.commitProjectTechniquePlan(initial, plan, fixedTime);
  assert.throws(() => techniques.commitProjectTechniquePlan(committed, plan, fixedTime), /already committed/i);
  const readiness = techniques.getTechniqueMatrixReadiness(committed);
  assert.equal(readiness.find((item) => item.id === 'midi_output').state, 'adapter_required');
  assert.equal(readiness.find((item) => item.id === 'audible_playback').state, 'adapter_required');
  assert.equal(readiness.filter((item) => item.state === 'ready').length, 4);
});

test('cross-project and malformed assignments are rejected by canonical validation', () => {
  const initialized = initializedProject();
  const state = techniques.getProjectTechniqueMatrixState(initialized);
  const other = createBlankProject('Other project');
  assert.throws(() => techniques.withProjectTechniqueMatrixState(other, state), /another project|missing/i);
  const malformed = structuredClone(state);
  malformed.assignments[0].trackId = 'missing-track';
  assert.match(techniques.validateTechniqueMatrixState(malformed, initialized).join(' '), /existing MIDI or instrument track/i);
});
