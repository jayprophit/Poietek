import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const chops = require('./.compiled-core/creative-tools/chops.js');
const harmony = require('./.compiled-core/creative-tools/harmony.js');
const drums = require('./.compiled-core/creative-tools/drums.js');
const workflows = require('./.compiled-core/creative-tools/workflows.js');

test('non-destructive chop maps sort points and assign eight banks of sixteen pads', () => {
  const map = chops.createChopMap({id: 'map-1', assetId: 'asset-1', sourceDurationSeconds: 10, projectBpm: 90, sourceBpm: 80, sourceSeconds: [4, 0, 2], chopOffsetMilliseconds: 10});
  assert.deepEqual(chops.validateChopMap(map), []);
  assert.deepEqual(map.points.map((point) => point.sourceSeconds), [0.01, 2.01, 4.01]);
  assert.equal(map.playbackMode, 'time_preserving_stretch_required');
});

test('harmony pads deterministically spell scale-safe chords', () => {
  const bank = harmony.createHarmonyPadBank({id: 'bank-1', rootMidiNote: 57, scale: 'minor', octave: 4, voicing: 'triad'});
  assert.equal(bank.pads.length, 16);
  assert.deepEqual(bank.pads[0].midiNotes, [57, 60, 64]);
  assert.equal(bank.pads[0].label, 'A·C·E');
});

test('probability sequencing is deterministic for a supplied seed', () => {
  const step = {active: true, probability: 0.5, velocity: 0.8, shiftTicks: -2, pan: 0, repeat: 1};
  const pattern = {schemaVersion: '1.0.0', id: 'pattern-1', name: 'Original kit', bpm: 92, swing: 0.25, stepCount: 16, lanes: [{id: 'kick', name: 'Kick', sampleAssetId: null, muted: false, steps: Array.from({length: 16}, () => ({...step}))}]};
  assert.deepEqual(drums.validateDrumPattern(pattern), []);
  assert.deepEqual(drums.renderDrumPattern(pattern, 42), drums.renderDrumPattern(pattern, 42));
});

test('external stem formats stay local and unavailable until an adapter exists', () => {
  const job = workflows.createLocalStemExtractionJob({id: 'job-1', projectId: 'project-1', manifestFormat: 'mpc_xpj', projectManifestAssetId: 'manifest-1', sourceFolderHandleId: 'folder-1'});
  assert.equal(job.localOnly, true);
  assert.equal(job.implementationId, null);
  assert.match(job.limitations[0], /reviewed, tested adapter/);
});

test('feedback remains a local draft until consented external submission', () => {
  const idea = workflows.createLocalFeedbackIdea({id: 'idea-1', toolId: 'chop-lab', title: 'Add transient sensitivity', detail: 'Expose a previewable threshold control.', createdAt: '2026-08-22T00:00:00.000Z'});
  assert.equal(idea.state, 'draft');
  assert.equal(workflows.voteForLocalIdea(idea).votes, 2);
  assert.equal(idea.externalReference, null);
});
