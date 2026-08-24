import assert from 'node:assert/strict';
import test from 'node:test';

import {
  TAKE_COMP_IMPLEMENTATION_ID,
  commitProjectTakeComp,
  createProjectTakeComp,
  findAlignedTakeCandidates,
  listProjectTakeComps,
  planProjectTakeComp,
  selectProjectTakeCompSegment,
} from './.compiled-core/engines/comping.js';
import {readProductionEngineReadiness} from './.compiled-core/engines/extension.js';
import {validateProductionEngineReadiness} from './.compiled-core/engines/validation.js';
import {ProjectSession} from './.compiled-core/project/ProjectSession.js';

const now = '2026-08-23T12:00:00.000Z';

function fixtureProject() {
  const clip = (id, assetId, name, sourceOffsetSeconds = 0) => ({
    id,
    clipType: 'audio',
    assetId,
    name,
    startTick: 1920,
    durationTicks: 1920,
    sourceOffsetSeconds,
    sourceDurationSeconds: 1,
    gainDb: 0,
    pan: 0,
    fadeInSeconds: 0,
    fadeOutSeconds: 0,
    muted: false,
  });
  const track = (id, name, order, clips) => ({
    id,
    type: 'audio',
    name,
    order,
    color: null,
    clips,
    mixer: {gainDb: 0, pan: 0, mute: false, solo: false},
  });
  return {
    id: 'project.take-comp',
    schemaVersion: '1.1.0',
    title: 'Take Comp Test',
    ownerId: null,
    teamId: null,
    createdAt: now,
    updatedAt: now,
    tempoMap: [{tick: 0, bpm: 120}],
    tracks: [
      track('track.take.1', 'Lead Take 1', 0, [clip('clip.take.1', 'asset.take.1', 'Lead 1', 0.25)]),
      track('track.take.2', 'Lead Take 2', 1, [clip('clip.take.2', 'asset.take.2', 'Lead 2', 1.5)]),
    ],
    assets: [
      {id: 'asset.take.1', mediaType: 'audio', contentHash: 'sha256-a', originalName: 'take-1.wav', mimeType: 'audio/wav', byteLength: 1000, durationSeconds: 4, sampleRate: 48000, channels: 1, createdAt: now, tags: [], metadata: {}},
      {id: 'asset.take.2', mediaType: 'audio', contentHash: 'sha256-b', originalName: 'take-2.wav', mimeType: 'audio/wav', byteLength: 1000, durationSeconds: 4, sampleRate: 48000, channels: 1, createdAt: now, tags: [], metadata: {}},
    ],
    contributors: [],
    rights: {state: 'draft'},
    releases: [],
    settings: {ppq: 960, sampleRate: 48000, tuning: {referenceNote: 'A4', referenceHz: 440, temperament: '12_tet', profileId: 'iso-a440-12tet'}},
    extensions: {},
  };
}

function createComp(project = fixtureProject()) {
  return createProjectTakeComp(project, {
    groupId: 'take.lead.main',
    name: 'Lead Vocal',
    sourceClipIds: ['clip.take.1', 'clip.take.2'],
    observedAt: now,
  });
}

test('aligned real audio clips become take-comp candidates', () => {
  const candidates = findAlignedTakeCandidates(fixtureProject());
  assert.equal(candidates.length, 1);
  assert.deepEqual(candidates[0].clipIds, ['clip.take.1', 'clip.take.2']);
  assert.equal(candidates[0].startTick, 1920);
  assert.equal(candidates[0].durationTicks, 1920);
  assert.match(candidates[0].label, /2 aligned takes/);
});

test('take comp creation stores lanes, segments, preview command and an honest local capability', () => {
  const project = createComp();
  const [summary] = listProjectTakeComps(project);
  assert.equal(summary.name, 'Lead Vocal');
  assert.equal(summary.takeLanes.length, 2);
  assert.equal(summary.segments.length, 2);
  assert.equal(summary.commandState, 'preview');
  assert.equal(summary.segments[0].startTick, 1920);
  assert.equal(summary.segments[1].startTick, 2880);

  const engine = readProductionEngineReadiness(project);
  assert.equal(engine.state, 'ready');
  assert.equal(engine.readiness.editing.compingCapability.state, 'available');
  assert.equal(engine.readiness.editing.compingCapability.implementationId, TAKE_COMP_IMPLEMENTATION_ID);
  assert.equal(engine.readiness.editing.compingCapability.metadata.consolidatedRender, false);
  assert.deepEqual(validateProductionEngineReadiness(engine.readiness), []);
  assert.ok(project.tracks.some((track) => track.id === summary.destinationTrackId && track.clips.length === 0));
});

test('source selection updates one segment and comp planning derives exact media offsets', () => {
  let project = createComp();
  const initial = listProjectTakeComps(project)[0];
  project = selectProjectTakeCompSegment(
    project,
    initial.groupId,
    initial.segments[0].id,
    initial.takeLanes[1].id,
    '2026-08-23T12:01:00.000Z',
  );
  const plan = planProjectTakeComp(project, initial.groupId);
  assert.equal(plan.ready, true);
  assert.equal(plan.outputClips.length, 2);
  assert.equal(plan.outputClips[0].assetId, 'asset.take.2');
  assert.equal(plan.outputClips[0].sourceOffsetSeconds, 1.5);
  assert.equal(plan.outputClips[0].sourceDurationSeconds, 0.5);
  assert.equal(plan.outputClips[1].sourceOffsetSeconds, 2);
  assert.match(plan.claim, /non-destructive canonical audio clip references/);
});

test('commit creates canonical comp clips, mutes source takes and records an applied command', () => {
  let project = createComp();
  const summary = listProjectTakeComps(project)[0];
  project = commitProjectTakeComp(project, summary.groupId, '2026-08-23T12:02:00.000Z');

  const destination = project.tracks.find((track) => track.id === summary.destinationTrackId);
  assert.deepEqual(destination.clips.map((clip) => [clip.id, clip.startTick, clip.durationTicks]), [
    ['take.lead.main.clip.1', 1920, 960],
    ['take.lead.main.clip.2', 2880, 960],
  ]);
  assert.ok(project.tracks.flatMap((track) => track.clips).filter((clip) => clip.id.startsWith('clip.take.')).every((clip) => clip.muted));
  assert.equal(listProjectTakeComps(project)[0].commandState, 'applied');

  const engine = readProductionEngineReadiness(project);
  assert.equal(engine.state, 'ready');
  const command = engine.readiness.editing.commands.find((item) => item.kind === 'comp');
  assert.equal(command.implementationId, TAKE_COMP_IMPLEMENTATION_ID);
  assert.equal(command.undoable, true);
  assert.equal(command.nextRevision, command.baseRevision + 1);
  assert.deepEqual(validateProductionEngineReadiness(engine.readiness), []);
});

test('ProjectSession undo restores source takes and removes the complete comp in one step', async () => {
  const saves = [];
  const repository = {save: async (project) => saves.push(structuredClone(project))};
  const session = new ProjectSession(createComp(), repository);
  const groupId = listProjectTakeComps(session.getSnapshot())[0].groupId;
  await session.mutate((project) => commitProjectTakeComp(project, groupId, '2026-08-23T12:03:00.000Z'));
  assert.ok(session.getSnapshot().tracks.flatMap((track) => track.clips).some((clip) => clip.id === 'take.lead.main.clip.1'));
  await session.undo();
  assert.ok(session.getSnapshot().tracks.flatMap((track) => track.clips).filter((clip) => clip.id.startsWith('clip.take.')).every((clip) => !clip.muted));
  assert.ok(!session.getSnapshot().tracks.flatMap((track) => track.clips).some((clip) => clip.id.startsWith('take.lead.main.clip.')));
  assert.equal(saves.length, 2);
});

test('comp creation fails closed for unaligned source ranges', () => {
  const project = fixtureProject();
  project.tracks[1].clips[0].startTick = 2400;
  assert.throws(() => createComp(project), /exactly aligned project ranges/);
});

test('comp preview refuses unrelated material in the destination range', () => {
  let project = createComp();
  const summary = listProjectTakeComps(project)[0];
  project = {
    ...project,
    tracks: project.tracks.map((track) => track.id === summary.destinationTrackId
      ? {...track, clips: [{...fixtureProject().tracks[0].clips[0], id: 'clip.unrelated'}]}
      : track),
  };
  const plan = planProjectTakeComp(project, summary.groupId);
  assert.equal(plan.ready, false);
  assert.match(plan.issues.join(' '), /overlaps the comp range/);
  assert.throws(() => commitProjectTakeComp(project, summary.groupId), /overlaps the comp range/);
});
