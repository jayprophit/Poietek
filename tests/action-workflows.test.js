import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const actions = require('./.compiled-core/action-workflows/actions.js');
const packages = require('./.compiled-core/action-workflows/packages.js');
const commands = require('./.compiled-core/action-workflows/projectCommands.js');
const {createBlankProject} = require('./.compiled-core/domain/projectFactory.js');
const {ProjectSession} = require('./.compiled-core/project/ProjectSession.js');

function createActionProject() {
  const project = createBlankProject('Action project');
  project.tracks = [
    {id: 'track-vocal', type: 'audio', name: 'Lead Vocal', order: 0, color: null, clips: [], mixer: {gainDb: -3, pan: -0.25, mute: true, solo: true}},
    {id: 'track-music', type: 'audio', name: 'Music', order: 1, color: null, clips: [], mixer: {gainDb: -6, pan: 0.25, mute: true, solo: true}},
  ];
  return project;
}

function withStarterActions(project) {
  return commands.mutateProjectActionWorkflowState(project, (state) => commands.installStarterActionSet(state, project));
}

test('action workflow starter set round-trips through the canonical project extension', () => {
  const project = withStarterActions(createActionProject());
  const state = commands.getProjectActionWorkflowState(project);
  assert.equal(state.schemaVersion, '1.0.0');
  assert.equal(state.projectId, project.id);
  assert.equal(state.recipes.length, 3);
  assert.equal(state.cycles.length, 1);
  assert.equal(state.cycles[0].cursor, 0);
  assert.doesNotThrow(() => JSON.stringify(project));
  assert.deepEqual(commands.getProjectActionWorkflowState(project), state);
});

test('dry-run planning is pure and reports exact canonical targets', () => {
  const project = createActionProject();
  const before = structuredClone(project);
  const recipe = {
    id: 'mix-reset', name: 'Mix reset', description: 'Test', origin: 'user',
    steps: [
      {id: 'gain', command: 'track.set_gain', target: {kind: 'track', trackId: 'track-vocal'}, parameters: {gainDb: -2}},
      {id: 'solo', command: 'track.set_solo', target: {kind: 'all_tracks'}, parameters: {enabled: false}},
    ],
  };
  const plan = actions.planActionRecipe(project, recipe);
  assert.equal(plan.status, 'ready');
  assert.deepEqual(plan.steps.map((step) => step.targetCount), [1, 2]);
  assert.deepEqual(project, before);
});

test('a macro applies as one ProjectSession undo point without partial mutation', async () => {
  const saved = [];
  const repository = {save: async (project) => { saved.push(structuredClone(project)); }};
  const project = withStarterActions(createActionProject());
  const session = new ProjectSession(project, repository);
  const applied = await session.mutate((current) => commands.runProjectActionRecipe(
    current,
    'poietek.clear-track-focus',
    '2026-08-22T12:00:00.000Z',
  ));
  assert.deepEqual(applied.tracks.map((track) => [track.mixer.mute, track.mixer.solo]), [[false, false], [false, false]]);
  assert.equal(commands.getProjectActionWorkflowState(applied).lastExecution.stepCount, 2);
  assert.equal(session.canUndo(), true);
  const undone = await session.undo();
  assert.deepEqual(undone.tracks.map((track) => [track.mixer.mute, track.mixer.solo]), [[true, true], [true, true]]);
  assert.equal(session.canUndo(), false);
  assert.equal(saved.length, 2);
});

test('unknown commands and invalid later steps block the whole macro', () => {
  const project = createActionProject();
  const before = structuredClone(project);
  const unknown = {
    id: 'external', name: 'External', description: 'Must fail', origin: 'user',
    steps: [{id: 'shell', command: 'shell.execute', target: {kind: 'project'}, parameters: {command: 'anything'}}],
  };
  assert.equal(actions.planActionRecipe(project, unknown).status, 'blocked');
  assert.throws(() => actions.applyActionRecipe(project, unknown), /blocked/);

  const partlyInvalid = {
    id: 'partial', name: 'Partial', description: 'Must stay atomic', origin: 'user',
    steps: [
      {id: 'tempo', command: 'project.set_tempo', target: {kind: 'project'}, parameters: {bpm: 94}},
      {id: 'missing', command: 'track.set_pan', target: {kind: 'track', trackId: 'not-here'}, parameters: {pan: 0}},
    ],
  };
  assert.throws(() => actions.applyActionRecipe(project, partlyInvalid), /blocked/);
  assert.deepEqual(project, before);
});

test('cycle actions advance deterministically and remain project-scoped', () => {
  let project = withStarterActions(createActionProject());
  project = commands.runProjectCycleAction(project, 'poietek.tempo-a-b', '2026-08-22T12:01:00.000Z');
  assert.equal(project.tempoMap[0].bpm, 94);
  assert.equal(commands.getProjectActionWorkflowState(project).cycles[0].cursor, 1);
  project = commands.runProjectCycleAction(project, 'poietek.tempo-a-b', '2026-08-22T12:02:00.000Z');
  assert.equal(project.tempoMap[0].bpm, 120);
  assert.equal(commands.getProjectActionWorkflowState(project).cycles[0].cursor, 0);

  const foreignState = commands.createActionWorkflowState('another-project');
  assert.throws(() => commands.withProjectActionWorkflowState(project, foreignState), /another project/);
});

test('package declarations cannot self-assert verification or execution', () => {
  const digest = 'ab'.repeat(32);
  const manifest = packages.declareWorkflowPackage({
    id: 'pkg.safe-actions',
    name: 'Safe Actions',
    version: '1.0.0',
    kind: 'action_pack',
    publisher: 'Example Publisher',
    source: {kind: 'repository', reference: 'https://example.invalid/actions'},
    digest: {algorithm: 'sha256', value: digest},
    licenseSpdx: 'MIT',
    requestedCapabilities: ['project_read', 'project_write'],
    platforms: ['web', 'windows'],
    minimumProjectSchema: '1.1.0',
    trust: 'verified',
    reviewEvidence: {reviewerId: 'self', reviewedAt: '2026-08-22T00:00:00.000Z', digestSha256: digest, evidenceReference: 'self'},
    quarantineReason: null,
  });
  assert.equal(manifest.trust, 'declared');
  assert.equal(manifest.reviewEvidence, null);
  assert.equal(packages.deriveWorkflowPackageReadiness(manifest).canExecute, false);
  assert.throws(() => packages.verifyWorkflowPackage(manifest, {
    packageId: manifest.id,
    digestSha256: 'cd'.repeat(32),
    reviewerId: 'reviewer-1',
    reviewedAt: '2026-08-22T12:00:00.000Z',
    evidenceReference: 'review:1',
    projectSchema: '1.1.0',
  }), /does not match/);
  const verified = packages.verifyWorkflowPackage(manifest, {
    packageId: manifest.id,
    digestSha256: digest,
    reviewerId: 'reviewer-1',
    reviewedAt: '2026-08-22T12:00:00.000Z',
    evidenceReference: 'review:1',
    projectSchema: '1.1.0',
  });
  assert.equal(verified.trust, 'verified');
  assert.equal(packages.deriveWorkflowPackageReadiness(verified).state, 'metadata_ready');
  assert.equal(packages.deriveWorkflowPackageReadiness(verified).canExecute, false);
});

test('verified script, DSP and native manifests still require a separate host adapter', () => {
  for (const kind of ['script', 'dsp', 'native_extension']) {
    const digest = kind.charCodeAt(0).toString(16).padStart(2, '0').repeat(32);
    const declared = packages.declareWorkflowPackage({
      id: `pkg.${kind}`,
      name: kind,
      version: '1.0.0',
      kind,
      publisher: 'Reviewed Publisher',
      source: {kind: 'local_file', reference: `${kind}.package`},
      digest: {algorithm: 'sha256', value: digest},
      licenseSpdx: null,
      requestedCapabilities: kind === 'dsp' ? ['audio_process'] : kind === 'native_extension' ? ['native_host'] : ['project_read'],
      platforms: ['windows'],
      minimumProjectSchema: '1.1.0',
    });
    const verified = packages.verifyWorkflowPackage(declared, {
      packageId: declared.id,
      digestSha256: digest,
      reviewerId: 'reviewer-2',
      reviewedAt: '2026-08-22T13:00:00.000Z',
      evidenceReference: `review:${kind}`,
      projectSchema: '1.1.0',
    });
    const readiness = packages.deriveWorkflowPackageReadiness(verified);
    assert.equal(readiness.state, 'host_adapter_required');
    assert.equal(readiness.canExecute, false);
  }
});

test('package quarantine is explicit and blocks even metadata loading', () => {
  const declared = packages.declareWorkflowPackage({
    id: 'pkg.quarantine', name: 'Quarantine', version: '1.0.0', kind: 'theme', publisher: 'Publisher',
    source: {kind: 'repository', reference: 'https://example.invalid/theme'}, digest: null, licenseSpdx: null,
    requestedCapabilities: ['theme_tokens'], platforms: ['web'], minimumProjectSchema: '1.1.0',
  });
  const quarantined = packages.quarantineWorkflowPackage(declared, 'Digest changed after review.');
  const readiness = packages.deriveWorkflowPackageReadiness(quarantined);
  assert.equal(readiness.state, 'quarantined');
  assert.equal(readiness.canLoadMetadata, false);
  assert.equal(readiness.canExecute, false);
});
