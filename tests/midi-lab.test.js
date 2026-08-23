import assert from 'node:assert/strict';
import test from 'node:test';

import {
  NOTE_FORGE_IMPLEMENTATION_ID,
  commitProjectMidiOperation,
  createStarterMidiClip,
  listProjectMidiClips,
  planProjectMidiOperation,
} from './.compiled-core/engines/midiLab.js';
import {readProductionEngineReadiness} from './.compiled-core/engines/extension.js';
import {validateProductionEngineReadiness} from './.compiled-core/engines/validation.js';
import {ProjectSession} from './.compiled-core/project/ProjectSession.js';

const now = '2026-08-23T14:00:00.000Z';

function fixtureProject() {
  return {
    id: 'project.note-forge',
    schemaVersion: '1.1.0',
    title: 'Note Forge Test',
    ownerId: null,
    teamId: null,
    createdAt: now,
    updatedAt: now,
    tempoMap: [{tick: 0, bpm: 120}],
    tracks: [],
    assets: [],
    contributors: [],
    rights: {state: 'draft'},
    releases: [],
    settings: {ppq: 960, sampleRate: 48000, tuning: {referenceNote: 'A4', referenceHz: 440, temperament: '12_tet', profileId: 'iso-a440-12tet'}},
    extensions: {},
  };
}

function starter() {
  return createStarterMidiClip(fixtureProject(), {
    trackId: 'track.note-forge',
    clipId: 'clip.starter',
    trackName: 'Idea Track',
    clipName: 'Starter Pulse',
    observedAt: now,
  });
}

test('starter creates a canonical MIDI track, clip and honest local capability', () => {
  const project = starter();
  assert.equal(project.tracks[0].type, 'midi');
  assert.equal(project.tracks[0].clips.length, 0);
  assert.equal(listProjectMidiClips(project)[0].events.length, 4);
  const engine = readProductionEngineReadiness(project);
  assert.equal(engine.state, 'ready');
  assert.equal(engine.readiness.midiScoring.clipEditingCapability.implementationId, NOTE_FORGE_IMPLEMENTATION_ID);
  assert.equal(engine.readiness.midiScoring.clipEditingCapability.metadata.audiblePlayback, false);
  assert.equal(engine.readiness.midiScoring.mpeCapability.state, 'unavailable');
  assert.equal(engine.readiness.midiScoring.clockOutputCapability.state, 'unavailable');
  assert.deepEqual(validateProductionEngineReadiness(engine.readiness), []);
});

test('rhythm generation is deterministic for the same seed and visible constraints', () => {
  const input = {id: 'op.rhythm', outputClipId: 'clip.rhythm', trackId: 'track.note-forge', outputName: 'Rhythm 7/16', kind: 'rhythm_generate', seed: 42, rootNote: 36, stepCount: 16, pulses: 7, stepTicks: 240, observedAt: now};
  const first = planProjectMidiOperation(starter(), input);
  const second = planProjectMidiOperation(starter(), input);
  assert.equal(first.ready, true);
  assert.deepEqual(first.outputClip, second.outputClip);
  assert.equal(first.outputClip.events.length, 7);
  assert.match(first.claim, /deterministic local MIDI pattern/);
});

test('chord generation creates scale-derived triads without a source clip', () => {
  const plan = planProjectMidiOperation(starter(), {id: 'op.chords', outputClipId: 'clip.chords', trackId: 'track.note-forge', outputName: 'Minor Chords', kind: 'chord_generate', seed: 9, rootNote: 48, scale: 'minor', chordCount: 4, chordTicks: 960, observedAt: now});
  assert.equal(plan.ready, true);
  assert.equal(plan.sourceClipIds.length, 0);
  assert.equal(plan.outputClip.events.length, 12);
  assert.ok(plan.outputClip.events.every((event) => event.type === 'note' && [0, 2, 3, 5, 7, 8, 10].includes((event.note - 48) % 12)));
});

test('transformation planning is pure and leaves the canonical source unchanged', () => {
  const project = starter();
  const before = structuredClone(project);
  const plan = planProjectMidiOperation(project, {id: 'op.transpose', outputClipId: 'clip.transpose', sourceClipId: 'clip.starter', outputName: 'Starter +7', kind: 'transpose', semitones: 7, observedAt: now});
  assert.equal(plan.ready, true);
  assert.deepEqual(project, before);
  assert.deepEqual(plan.outputClip.events.filter((event) => event.type === 'note').map((event) => event.note), [67, 70, 72, 74]);
  assert.match(plan.claim, /source remains unchanged/);
});

test('committing adds a non-destructive variation and applied undo record', () => {
  const source = starter();
  const project = commitProjectMidiOperation(source, {id: 'op.humanize', outputClipId: 'clip.humanized', sourceClipId: 'clip.starter', outputName: 'Humanized Pulse', kind: 'humanize', seed: 17, timingTicks: 24, velocityAmount: 8, observedAt: now});
  const clips = listProjectMidiClips(project);
  assert.equal(clips.length, 2);
  assert.deepEqual(clips[0], listProjectMidiClips(source)[0]);
  const engine = readProductionEngineReadiness(project);
  assert.equal(engine.state, 'ready');
  assert.deepEqual(engine.readiness.midiScoring.transformations[0].sourceClipIds, ['clip.starter']);
  assert.deepEqual(engine.readiness.midiScoring.transformations[0].outputClipIds, ['clip.humanized']);
  assert.match(engine.readiness.midiScoring.transformations[0].undoCommandId, /project-undo/);
  assert.deepEqual(validateProductionEngineReadiness(engine.readiness), []);
});

test('ProjectSession undo removes a whole committed variation in one step', async () => {
  const saves = [];
  const session = new ProjectSession(starter(), {save: async (project) => saves.push(structuredClone(project))});
  await session.mutate((project) => commitProjectMidiOperation(project, {id: 'op.scale', outputClipId: 'clip.scale', sourceClipId: 'clip.starter', outputName: 'C Minor', kind: 'scale_constrain', rootNote: 60, scale: 'minor', observedAt: now}));
  assert.equal(listProjectMidiClips(session.getSnapshot()).length, 2);
  await session.undo();
  assert.equal(listProjectMidiClips(session.getSnapshot()).length, 1);
  assert.equal(saves.length, 2);
});

test('invalid generation and output collisions fail closed', () => {
  const project = starter();
  const invalid = planProjectMidiOperation(project, {id: 'op.invalid', outputClipId: 'clip.invalid', trackId: 'track.note-forge', outputName: 'Invalid Rhythm', kind: 'rhythm_generate', seed: 1, rootNote: 36, stepCount: 8, pulses: 9, stepTicks: 240, observedAt: now});
  assert.equal(invalid.ready, false);
  assert.match(invalid.issues.join(' '), /pulses must fit/);
  assert.throws(() => commitProjectMidiOperation(project, {id: 'op.collision', outputClipId: 'clip.starter', sourceClipId: 'clip.starter', outputName: 'Collision', kind: 'quantize', gridTicks: 240, strength: 1, observedAt: now}), /already exists/);
  assert.equal(listProjectMidiClips(project).length, 1);
});

test('engine validation rejects out-of-range MIDI data and dangling transformations', () => {
  const project = starter();
  const engine = readProductionEngineReadiness(project);
  assert.equal(engine.state, 'ready');
  engine.readiness.midiScoring.clips[0].events[0].velocity = 200;
  engine.readiness.midiScoring.transformations.push({id: 'op.dangling', kind: 'transpose', status: 'applied', sourceClipIds: ['missing'], outputClipIds: ['missing'], undoCommandId: null});
  const codes = validateProductionEngineReadiness(engine.readiness).map((issue) => issue.code);
  assert.ok(codes.includes('MIDI_EVENT_INVALID'));
  assert.ok(codes.includes('MIDI_TRANSFORMATION_SOURCE_MISSING'));
  assert.ok(codes.includes('MIDI_TRANSFORMATION_OUTPUT_MISSING'));
  assert.ok(codes.includes('MIDI_TRANSFORMATION_UNPROVEN'));
});
