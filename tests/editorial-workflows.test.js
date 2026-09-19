import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const editorial = require('./.compiled-core/editorial-workflows/index.js');
const {createBlankProject} = require('./.compiled-core/domain/projectFactory.js');
const {ProjectSession} = require('./.compiled-core/project/ProjectSession.js');

const fixedTime = '2026-08-23T15:00:00.000Z';

function audioProject() {
  const blank = createBlankProject('Editorial fixture');
  return {
    ...blank,
    assets: [{
      id: 'asset.dialogue', mediaType: 'audio', contentHash: 'dialogue-hash', originalName: 'dialogue-source.wav', mimeType: 'audio/wav',
      byteLength: 64, durationSeconds: 8, sampleRate: 48000, channels: 1, createdAt: fixedTime, tags: [], metadata: {source: 'test fixture'},
    }],
    tracks: [
      {
        id: 'track.dialogue-a', type: 'audio', name: 'Dialogue A', order: 0, color: '#22d3ee', mixer: {gainDb: 0, pan: 0, mute: false, solo: false},
        clips: [
          {id: 'clip.line-1', clipType: 'audio', assetId: 'asset.dialogue', name: 'Line One', startTick: 0, durationTicks: 1920, sourceOffsetSeconds: 0, sourceDurationSeconds: 2, gainDb: 0, pan: 0, fadeInSeconds: 0, fadeOutSeconds: 0, muted: false},
          {id: 'clip.line-2', clipType: 'audio', assetId: 'asset.dialogue', name: 'Line Two', startTick: 1920, durationTicks: 1920, sourceOffsetSeconds: 2, sourceDurationSeconds: 2, gainDb: 0, pan: 0, fadeInSeconds: 0, fadeOutSeconds: 0, muted: false},
        ],
      },
      {
        id: 'track.dialogue-b', type: 'audio', name: 'Dialogue B', order: 1, color: '#a78bfa', mixer: {gainDb: 0, pan: 0, mute: false, solo: false},
        clips: [
          {id: 'clip.alt-1', clipType: 'audio', assetId: 'asset.dialogue', name: 'Alternate One', startTick: 0, durationTicks: 1920, sourceOffsetSeconds: 4, sourceDurationSeconds: 2, gainDb: 0, pan: 0, fadeInSeconds: 0, fadeOutSeconds: 0, muted: false},
        ],
      },
    ],
  };
}

test('starter Editorial Memory creates serializable points, ranges, view focus and track pins', () => {
  const project = editorial.createStarterEditorialProject(audioProject(), fixedTime);
  const state = editorial.getProjectEditorialWorkflow(project);
  assert.equal(state.memoryLocations.length, 3);
  assert.deepEqual(state.memoryLocations.map((memory) => memory.kind), ['point', 'range', 'view']);
  assert.deepEqual(state.pinnedTrackIds, ['track.dialogue-a', 'track.dialogue-b']);
  assert.equal(state.activeSelection.durationTicks, project.settings.ppq * 4 * 8);
  assert.deepEqual(editorial.validateEditorialWorkflowState(state, project), []);
  assert.doesNotThrow(() => JSON.stringify(project));
});

test('memory recall changes only durable editorial selection and preserves canonical media', () => {
  const initial = editorial.createStarterEditorialProject(audioProject(), fixedTime);
  const snapshot = structuredClone(initial.assets);
  const recalled = editorial.recallProjectEditorialMemory(initial, 'editorial.memory.session-start', 'recall.start', fixedTime);
  const state = editorial.getProjectEditorialWorkflow(recalled);
  assert.equal(state.lastRecalledMemoryId, 'editorial.memory.session-start');
  assert.equal(state.activeSelection.startTick, 0);
  assert.equal(state.activeSelection.durationTicks, 0);
  assert.deepEqual(recalled.assets, snapshot);
});

test('clip-group capture fails closed when a requested boundary cuts through audio', () => {
  const initial = editorial.createStarterEditorialProject(audioProject(), fixedTime);
  assert.throws(() => editorial.createProjectEditorialClipGroup(initial, {
    id: 'group.unsafe', name: 'Unsafe', color: '#ffffff', startTick: 960, durationTicks: 1920, createdAt: fixedTime,
  }), /boundary cuts through/);
});

test('clip-group capture stores exact ordered canonical references', () => {
  const initial = editorial.createStarterEditorialProject(audioProject(), fixedTime);
  const grouped = editorial.createProjectEditorialClipGroup(initial, {
    id: 'group.dialogue', name: 'Dialogue Set', color: '#f59e0b', startTick: 0, durationTicks: 3840, createdAt: fixedTime, operationId: 'create.dialogue.group',
  });
  const group = editorial.getProjectEditorialWorkflow(grouped).clipGroups[0];
  assert.deepEqual(group.clipReferences.map((reference) => reference.clipId), ['clip.line-1', 'clip.alt-1', 'clip.line-2']);
  assert.equal(group.startTick, 0);
  assert.equal(group.endTick, 3840);
});

test('batch rename planning is deterministic, pure and limited to display names', () => {
  let project = editorial.createStarterEditorialProject(audioProject(), fixedTime);
  project = editorial.createProjectEditorialClipGroup(project, {
    id: 'group.dialogue', name: 'Dialogue Set', color: '#f59e0b', startTick: 0, durationTicks: 3840, createdAt: fixedTime, operationId: 'create.dialogue.group',
  });
  const state = editorial.getProjectEditorialWorkflow(project);
  const snapshot = structuredClone(project);
  const plan = editorial.buildEditorialBatchRenamePlan(project, state, 'group.dialogue', 'Scene_07_DX', 1, 3, 'rename.dialogue');
  assert.deepEqual(plan.entries.map((entry) => entry.outputName), ['Scene_07_DX_001', 'Scene_07_DX_002', 'Scene_07_DX_003']);
  assert.match(plan.claim, /asset names and files remain unchanged/i);
  assert.deepEqual(project, snapshot);
});

test('batch rename commits atomically while preserving assets and source filenames', async () => {
  let initial = editorial.createStarterEditorialProject(audioProject(), fixedTime);
  initial = editorial.createProjectEditorialClipGroup(initial, {
    id: 'group.dialogue', name: 'Dialogue Set', color: '#f59e0b', startTick: 0, durationTicks: 3840, createdAt: fixedTime, operationId: 'create.dialogue.group',
  });
  const plan = editorial.buildEditorialBatchRenamePlan(initial, editorial.getProjectEditorialWorkflow(initial), 'group.dialogue', 'Scene_07_DX', 1, 2, 'rename.dialogue');
  const saves = [];
  const session = new ProjectSession(initial, {save: async (project) => saves.push(structuredClone(project))});
  const renamed = await session.mutate((project) => editorial.applyProjectEditorialBatchRename(project, plan, fixedTime));
  assert.deepEqual(renamed.tracks.flatMap((track) => track.clips.map((clip) => clip.name)), ['Scene_07_DX_01', 'Scene_07_DX_03', 'Scene_07_DX_02']);
  assert.equal(renamed.assets[0].originalName, 'dialogue-source.wav');
  assert.equal(editorial.getProjectEditorialWorkflow(renamed).operationHistory.at(-1).kind, 'batch_clip_rename');
  assert.equal(session.canUndo(), true);
  const undone = await session.undo();
  assert.deepEqual(undone.tracks.flatMap((track) => track.clips.map((clip) => clip.name)), ['Line One', 'Line Two', 'Alternate One']);
  assert.equal(saves.length, 2);
});

test('stale batch previews fail before mutating changed clip names', () => {
  let project = editorial.createStarterEditorialProject(audioProject(), fixedTime);
  project = editorial.createProjectEditorialClipGroup(project, {
    id: 'group.dialogue', name: 'Dialogue Set', color: '#f59e0b', startTick: 0, durationTicks: 3840, createdAt: fixedTime, operationId: 'create.dialogue.group',
  });
  const plan = editorial.buildEditorialBatchRenamePlan(project, editorial.getProjectEditorialWorkflow(project), 'group.dialogue', 'Dialogue', 10, 2, 'rename.dialogue');
  project.tracks[0].clips[0].name = 'Changed Since Preview';
  assert.throws(() => editorial.applyProjectEditorialBatchRename(project, plan, fixedTime), /preview is stale/);
});

test('track pin and edit-policy changes are canonical, validated and undoable', async () => {
  const initial = editorial.createStarterEditorialProject(audioProject(), fixedTime);
  const session = new ProjectSession(initial, {save: async () => undefined});
  const changed = await session.mutate((project) => {
    let next = editorial.toggleProjectEditorialTrackPin(project, 'track.dialogue-a', 'unpin.dialogue-a', fixedTime);
    next = editorial.setProjectEditorialEditPolicy(next, 'free', 'policy.free', fixedTime);
    return next;
  });
  const state = editorial.getProjectEditorialWorkflow(changed);
  assert.deepEqual(state.pinnedTrackIds, ['track.dialogue-b']);
  assert.equal(state.activeEditPolicy, 'free');
  assert.deepEqual(editorial.validateEditorialWorkflowState(state, changed), []);
  const undone = await session.undo();
  assert.deepEqual(editorial.getProjectEditorialWorkflow(undone).pinnedTrackIds, ['track.dialogue-a', 'track.dialogue-b']);
});
