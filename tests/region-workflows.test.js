import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const regions = require('./.compiled-core/region-workflows/regions.js');
const commands = require('./.compiled-core/region-workflows/projectCommands.js');
const composition = require('./.compiled-core/composition-workflows/patterns.js');
const {createBlankProject} = require('./.compiled-core/domain/projectFactory.js');
const {ProjectSession} = require('./.compiled-core/project/ProjectSession.js');

const fixedTime = '2026-08-23T12:00:00.000Z';

test('starter Production Regions create project-owned sections, clips and automation', () => {
  const project = commands.createStarterProductionRegionsProject(createBlankProject('Region starter'), fixedTime);
  const state = commands.getProjectProductionRegionState(project);
  const compositionState = composition.getProjectCompositionWorkflow(project);
  assert.equal(state.regions.length, 3);
  assert.deepEqual(state.regions.map((region) => region.name), ['Foundation', 'Lift', 'Release']);
  assert.equal(compositionState.lanes.filter((lane) => lane.id.startsWith('production-regions.')).length, 2);
  assert.equal(compositionState.lanes.reduce((total, lane) => total + lane.clips.filter((clip) => clip.id.startsWith('production-regions.')).length, 0), 6);
  assert.equal(compositionState.automationEnvelopes.find((envelope) => envelope.id === 'production-regions.automation.energy').points.length, 6);
  assert.deepEqual(regions.validateProductionRegionState(state, project), []);
  assert.doesNotThrow(() => JSON.stringify(project));
});

test('region capture fails closed when a boundary cuts through canonical material', () => {
  const project = commands.createStarterProductionRegionsProject(createBlankProject('Boundary safety'), fixedTime);
  const state = commands.getProjectProductionRegionState(project);
  const bar = project.settings.ppq * 4;
  assert.throws(() => regions.captureProductionRegion(project, state, {
    id: 'unsafe-region',
    name: 'Unsafe',
    color: '#ffffff',
    startTick: bar,
    durationTicks: bar * 2,
    createdAt: fixedTime,
  }), /split canonical material/);
});

test('copy planning is deterministic and leaves project and region state unchanged', () => {
  const project = commands.createStarterProductionRegionsProject(createBlankProject('Region plan'), fixedTime);
  const state = commands.getProjectProductionRegionState(project);
  const snapshot = structuredClone(project);
  const target = project.settings.ppq * 4 * 6;
  const plan = regions.buildProductionRegionActionPlan(project, state, 'production-region.foundation', 'copy', target, 'copy.foundation');
  assert.equal(plan.entries.length, 4);
  assert.equal(plan.action, 'copy');
  assert.equal(plan.resultRegionId, 'production-region.foundation.copy.copy.foundation');
  assert.ok(plan.entries.filter((entry) => entry.kind === 'arrangement_clip').every((entry) => entry.targetItemId.endsWith('.region.copy.foundation')));
  assert.deepEqual(project, snapshot);
  assert.equal(state.operationHistory.length, 0);
});

test('a region copy commits clips and automation as one ProjectSession undo point', async () => {
  const initial = commands.createStarterProductionRegionsProject(createBlankProject('Atomic region copy'), fixedTime);
  const bar = initial.settings.ppq * 4;
  const saves = [];
  const session = new ProjectSession(initial, {save: async (snapshot) => saves.push(structuredClone(snapshot))});
  const copied = await session.mutate((project) => commands.applyProjectProductionRegionAction(
    project,
    'production-region.foundation',
    'copy',
    bar * 6,
    'copy.foundation',
    fixedTime,
  ));
  const copiedState = commands.getProjectProductionRegionState(copied);
  const copiedComposition = composition.getProjectCompositionWorkflow(copied);
  assert.equal(copiedState.regions.length, 4);
  assert.equal(copiedState.operationHistory.length, 1);
  assert.equal(copiedComposition.lanes.reduce((total, lane) => total + lane.clips.filter((clip) => clip.id.startsWith('production-regions.')).length, 0), 8);
  assert.equal(copiedComposition.automationEnvelopes.find((envelope) => envelope.id === 'production-regions.automation.energy').points.length, 8);
  assert.equal(session.canUndo(), true);

  const undone = await session.undo();
  assert.equal(commands.getProjectProductionRegionState(undone).regions.length, 3);
  assert.equal(composition.getProjectCompositionWorkflow(undone).lanes.reduce((total, lane) => total + lane.clips.filter((clip) => clip.id.startsWith('production-regions.')).length, 0), 6);
  assert.equal(saves.length, 2);
});

test('region move preserves clip identities and relocates selected automation', () => {
  const initial = commands.createStarterProductionRegionsProject(createBlankProject('Region move'), fixedTime);
  const bar = initial.settings.ppq * 4;
  const moved = commands.applyProjectProductionRegionAction(
    initial,
    'production-region.release',
    'move',
    bar * 8,
    'move.release',
    fixedTime,
  );
  const state = commands.getProjectProductionRegionState(moved);
  const region = state.regions.find((candidate) => candidate.id === 'production-region.release');
  assert.equal(region.startTick, bar * 8);
  assert.equal(state.regions.length, 3);
  const compositionState = composition.getProjectCompositionWorkflow(moved);
  assert.equal(compositionState.lanes.find((lane) => lane.id === 'production-regions.lane.rhythm').clips.find((clip) => clip.id === 'production-regions.clip.rhythm.release').startTick, bar * 8);
  assert.deepEqual(compositionState.automationEnvelopes.find((envelope) => envelope.id === 'production-regions.automation.energy').points.map((point) => point.tick), [0, bar, bar * 2, bar * 3, bar * 8, bar * 9]);
});

test('automation collisions block unsafe region copies before any mutation', () => {
  const project = commands.createStarterProductionRegionsProject(createBlankProject('Region collision'), fixedTime);
  const state = commands.getProjectProductionRegionState(project);
  const bar = project.settings.ppq * 4;
  assert.throws(() => regions.buildProductionRegionActionPlan(
    project,
    state,
    'production-region.foundation',
    'copy',
    bar * 2,
    'copy.collision',
  ), /Automation point collision/);
});

test('canonical audio clips participate in safe production region copies', () => {
  const blank = createBlankProject('Audio region');
  const project = {
    ...blank,
    assets: [{
      id: 'asset.audio', mediaType: 'audio', contentHash: 'hash', originalName: 'Original.wav', mimeType: 'audio/wav',
      byteLength: 8, durationSeconds: 2, sampleRate: 48000, channels: 2, createdAt: fixedTime, tags: [], metadata: {},
    }],
    tracks: [{
      id: 'track.audio', type: 'audio', name: 'Audio', order: 0, color: '#22d3ee', mixer: {gainDb: 0, pan: 0, mute: false, solo: false},
      clips: [{
        id: 'clip.audio', clipType: 'audio', assetId: 'asset.audio', name: 'Original.wav', startTick: 0, durationTicks: 1920,
        sourceOffsetSeconds: 0, sourceDurationSeconds: 2, gainDb: 0, pan: 0, fadeInSeconds: 0, fadeOutSeconds: 0, muted: false,
      }],
    }],
  };
  const captured = commands.captureProjectProductionRegion(project, {
    id: 'audio.region', name: 'Audio Region', color: '#22d3ee', startTick: 0, durationTicks: 1920,
    includeArrangementLanes: false, includeAutomation: false, createdAt: fixedTime,
  });
  const copied = commands.applyProjectProductionRegionAction(captured, 'audio.region', 'copy', 3840, 'copy.audio', fixedTime);
  assert.equal(copied.tracks[0].clips.length, 2);
  assert.equal(copied.tracks[0].clips[1].id, 'clip.audio.region.copy.audio');
  assert.equal(copied.tracks[0].clips[1].startTick, 3840);
  assert.equal(commands.getProjectProductionRegionState(copied).regions.length, 2);
});

test('Production Regions reject cross-project state and missing canonical references', () => {
  const first = commands.createStarterProductionRegionsProject(createBlankProject('First regions'), fixedTime);
  const second = createBlankProject('Second regions');
  const state = commands.getProjectProductionRegionState(first);
  assert.throws(() => commands.withProjectProductionRegionState(second, state), /another project|missing/);
  const broken = structuredClone(first);
  const compositionState = composition.getProjectCompositionWorkflow(broken);
  compositionState.lanes.find((lane) => lane.id === 'production-regions.lane.rhythm').clips = [];
  broken.extensions['org.poietek.composition-workflows'] = compositionState;
  assert.throws(() => commands.getProjectProductionRegionState(broken), /missing arrangement clip/);
});
