import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const {
  CONSISTENCY_DIMENSIONS,
  createRegistry,
  registerScorer,
  evaluateDimension,
  evaluateAll,
} = require('./.compiled-core/consistency/multimodalConsistency.js');

function asset(over = {}) {
  return {
    assetId: 'asset-a1',
    characterRef: 'char:hero',
    styleRef: 'style:noir',
    environmentRef: 'env:desert-dawn',
    sceneRef: 'scene-1',
    provenance: 'fixture',
    ...over,
  };
}

function group(assets, over = {}) {
  return {groupId: 'group-1', assets, provenance: 'fixture', ...over};
}

function registry() {
  return createRegistry();
}

test('declares exactly the three ref-grounded dimensions', () => {
  assert.deepEqual([...CONSISTENCY_DIMENSIONS], [
    'character-consistency',
    'style-consistency',
    'environment-consistency',
  ]);
});

test('built-in registry holds one entry per dimension', () => {
  const entries = registry();
  assert.equal(entries.length, 3);
  assert.deepEqual(entries.map((e) => e.scorerId).sort(), [
    'scorer:character-consistency',
    'scorer:environment-consistency',
    'scorer:style-consistency',
  ]);
});

test('identical scorer re-registration is idempotent; changed content conflicts', () => {
  const entries = registry();
  const entry = {
    scorerId: 'scorer:custom',
    dimension: 'style-consistency',
    version: '1.0.0',
    description: 'custom style check',
    provenance: 'fixture',
  };
  assert.equal(registerScorer(entries, entry).length, 4);
  assert.equal(registerScorer(registerScorer(entries, entry), entry).length, 4);
  assert.throws(
    () => registerScorer(registerScorer(entries, entry), {...entry, version: '2.0.0'}),
    (error) => error.code === 'CONSISTENCY_CONFLICT',
  );
});

test('unregistered dimensions and scorers are refused', () => {
  assert.throws(
    () => registerScorer(registry(), {
      scorerId: 'scorer:vibes',
      dimension: 'vibe-consistency',
      version: '1.0.0',
      description: 'x',
      provenance: 'fixture',
    }),
    (error) => error.code === 'CONSISTENCY_UNKNOWN_DIMENSION',
  );
  assert.throws(
    () => evaluateDimension(registry(), 'scorer:ghost', group([])),
    (error) => error.code === 'CONSISTENCY_UNKNOWN_SCORER',
  );
});

test('agreeing refs are CONSISTENT with the ref named', () => {
  const result = evaluateDimension(
    registry(),
    'scorer:character-consistency',
    group([asset({assetId: 'a1'}), asset({assetId: 'a2'})]),
  );
  assert.equal(result.status, 'CONSISTENT');
  assert.equal(result.agreedRef, 'char:hero');
  assert.deepEqual(result.conflicts, []);
  assert.deepEqual(result.unresolved, []);
});

test('disagreement is INCONSISTENT with every side preserved', () => {
  const result = evaluateDimension(
    registry(),
    'scorer:style-consistency',
    group([
      asset({assetId: 'a1', styleRef: 'style:noir'}),
      asset({assetId: 'a2', styleRef: 'style:pastel'}),
    ]),
  );
  assert.equal(result.status, 'INCONSISTENT');
  assert.deepEqual(result.conflicts, [
    {ref: 'style:noir', assetIds: ['a1']},
    {ref: 'style:pastel', assetIds: ['a2']},
  ]);
  assert.ok(!('agreedRef' in result));
});

test('undeclared assets are unresolved: never a pass, never a fail', () => {
  const full = asset({assetId: 'a1'});
  delete full.environmentRef;
  const result = evaluateDimension(registry(), 'scorer:environment-consistency', group([full]));
  assert.equal(result.status, 'UNKNOWN');
  assert.deepEqual(result.unresolved, ['a1']);
  assert.deepEqual(result.conflicts, []);
});

test('empty declaration set is UNKNOWN, not consistent', () => {
  const result = evaluateDimension(registry(), 'scorer:character-consistency', group([]));
  assert.equal(result.status, 'UNKNOWN');
});

test('each dimension reads only its own ref field', () => {
  const assets = [asset({assetId: 'a1', characterRef: 'char:hero', styleRef: 'style:a'}),
                  asset({assetId: 'a2', characterRef: 'char:hero', styleRef: 'style:b'})];
  assert.equal(evaluateDimension(registry(), 'scorer:character-consistency', group(assets)).status, 'CONSISTENT');
  assert.equal(evaluateDimension(registry(), 'scorer:style-consistency', group(assets)).status, 'INCONSISTENT');
  // Environment refs agree here, so that dimension passes independently.
  assert.equal(evaluateDimension(registry(), 'scorer:environment-consistency', group(assets)).status, 'CONSISTENT');
});

test('same reference set across distinct assets never merges them', () => {
  const first = asset({assetId: 'a1'});
  const second = asset({assetId: 'a2'});
  const result = evaluateDimension(registry(), 'scorer:character-consistency', group([first, second]));
  assert.equal(result.status, 'CONSISTENT');
  assert.equal(result.agreedRef, 'char:hero');
});

test('versions ride along opaquely without float-to-latest', () => {
  const result = evaluateDimension(
    registry(),
    'scorer:character-consistency',
    group([
      asset({assetId: 'a1', version: '1.0.0'}),
      asset({assetId: 'a1-v2', version: '2.0.0'}),
    ]),
  );
  assert.equal(result.status, 'CONSISTENT');
});

test('duplicate asset ids in one evaluation are rejected', () => {
  assert.throws(
    () => evaluateDimension(registry(), 'scorer:character-consistency', group([asset({assetId: 'a1'}), asset({assetId: 'a1'})])),
    (error) => error.code === 'CONSISTENCY_DUPLICATE_ID',
  );
});

test('evaluateAll returns per-dimension results with no universal score', () => {
  const results = evaluateAll(registry(), group([asset({assetId: 'a1'}), asset({assetId: 'a2'})]));
  assert.equal(results.length, 3);
  assert.ok(results.every((r) => r.status === 'CONSISTENT'));
  // Scorer *identity* (scorerId) is legitimate; standalone score fields are
  // not. Match JSON keys, not substrings, so scorerId never trips the check.
  const keys = new Set();
  for (const result of results) {
    for (const key of Object.keys(result)) keys.add(key);
  }
  for (const banned of ['score', 'grade', 'stars', 'overall', 'composite', 'rating', 'trust']) {
    assert.ok(!keys.has(banned), `result contains ${banned}`);
  }
});

test('deterministic from scrambled asset order', () => {
  const assets = [
    asset({assetId: 'a3', styleRef: 'style:b'}),
    asset({assetId: 'a1', styleRef: 'style:a'}),
    asset({assetId: 'a2', styleRef: 'style:b'}),
  ];
  const forward = evaluateDimension(registry(), 'scorer:style-consistency', group(assets));
  const reversed = evaluateDimension(registry(), 'scorer:style-consistency', group([...assets].reverse()));
  assert.equal(JSON.stringify(forward), JSON.stringify(reversed));
  assert.equal(forward.status, 'INCONSISTENT');
});

test('inputs are never mutated', () => {
  const assets = [asset({assetId: 'a1'}), asset({assetId: 'a2'})];
  const snapshot = JSON.stringify(assets);
  evaluateAll(registry(), group(assets));
  assert.equal(JSON.stringify(assets), snapshot);
});

test('strict shapes: unknown fields and malformed values rejected', () => {
  assert.throws(
    () => evaluateDimension(registry(), 'scorer:character-consistency', group([{...asset({assetId: 'a1'}), mood: 'dark'}])),
    (error) => error.code === 'CONSISTENCY_UNKNOWN_FIELD',
  );
  assert.throws(
    () => evaluateDimension(registry(), 'scorer:character-consistency', group([{...asset({assetId: 'a1'}), characterRef: ''}])),
    (error) => error.code === 'CONSISTENCY_INVALID_INPUT',
  );
  assert.throws(
    () => evaluateDimension(registry(), 'scorer:character-consistency', group('nope')),
    (error) => error.code === 'CONSISTENCY_INVALID_INPUT',
  );
  assert.throws(
    () => evaluateDimension(registry(), 'scorer:character-consistency', {groupId: '', assets: [], provenance: 'x'}),
    (error) => error.code === 'CONSISTENCY_INVALID_INPUT',
  );
});

test('security fields rejected before shape errors; no auth/secret/persona surface', () => {
  assert.throws(
    () => evaluateDimension(registry(), 'scorer:character-consistency', group([{...asset({assetId: 'a1'}), approved: true}])),
    (error) => error.code === 'CONSISTENCY_AUTHORITY_REJECTED',
  );
  assert.throws(
    () => evaluateDimension(registry(), 'scorer:character-consistency', group([{...asset({assetId: 'a1'}), apiKey: 'sk-x', bogus: 1}])),
    (error) => error.code === 'CONSISTENCY_SECRET_REJECTED',
  );
  assert.throws(
    () => evaluateDimension(registry(), 'scorer:character-consistency', group([{...asset({assetId: 'a1'}), persona: 'p'}])),
    (error) => error.code === 'CONSISTENCY_PERSONALITY_REJECTED',
  );
  const module = require('./.compiled-core/consistency/multimodalConsistency.js');
  const names = Object.keys(module).sort();
  assert.deepEqual(names, [
    'CONSISTENCY_DIMENSIONS',
    'ConsistencyError',
    'createRegistry',
    'evaluateAll',
    'evaluateDimension',
    'registerScorer',
  ]);
});
