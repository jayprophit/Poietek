import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const {
  QA_DIMENSIONS,
  evaluateVisualQa,
} = require('./.compiled-core/qa/visualQa.js');

function input(over = {}) {
  return {
    suiteId: 'suite-1',
    provenance: 'fixture',
    ...over,
  };
}

function consistent(agreedRef = 'char:hero') {
  return {status: 'CONSISTENT', agreedRef};
}

function inconsistent() {
  return {
    status: 'INCONSISTENT',
    conflicts: [{ref: 'style:a', assetIds: ['a1']}, {ref: 'style:b', assetIds: ['a2']}],
    unresolved: [],
  };
}

test('declares exactly the six registered dimensions', () => {
  assert.deepEqual([...QA_DIMENSIONS], [
    'reference-consistency',
    'style-consistency',
    'character-consistency',
    'continuity',
    'av-sync',
    'ui-correctness',
  ]);
});

test('empty suite reports every dimension UNKNOWN, never a pass', () => {
  const report = evaluateVisualQa(input());
  assert.equal(report.outcomes.length, 6);
  assert.ok(report.outcomes.every((o) => o.status === 'UNKNOWN'));
  assert.deepEqual(report.summary, {pass: 0, fail: 0, unknown: 6});
});

test('reference consistency passes on clean grounding, fails naming unresolved', () => {
  const clean = evaluateVisualQa(input({grounding: {unresolved: []}}));
  assert.equal(clean.outcomes.find((o) => o.dimension === 'reference-consistency').status, 'PASS');
  const dirty = evaluateVisualQa(input({grounding: {unresolved: ['scene-ghost', 'asset:gone']}}));
  const outcome = dirty.outcomes.find((o) => o.dimension === 'reference-consistency');
  assert.equal(outcome.status, 'FAIL');
  assert.match(outcome.detail, /scene-ghost/);
  assert.match(outcome.detail, /asset:gone/);
});

test('style and character dimensions project consistency results faithfully', () => {
  const report = evaluateVisualQa(input({styleResult: consistent('style:noir'), characterResult: inconsistent()}));
  assert.equal(report.outcomes.find((o) => o.dimension === 'style-consistency').status, 'PASS');
  const character = report.outcomes.find((o) => o.dimension === 'character-consistency');
  assert.equal(character.status, 'FAIL');
  assert.match(character.detail, /style:a/);
  assert.match(character.detail, /style:b/);
});

test('unknown consistency results stay UNKNOWN, never pass', () => {
  const report = evaluateVisualQa(input({styleResult: {status: 'UNKNOWN'}}));
  assert.equal(report.outcomes.find((o) => o.dimension === 'style-consistency').status, 'UNKNOWN');
});

test('continuity passes when shots sit inside the scene environment', () => {
  const report = evaluateVisualQa(input({
    continuityGroups: [{
      sceneId: 'scene-1',
      sceneEnvironments: ['env:desert'],
      shots: [
        {shotId: 'shot-1', environmentRefs: ['env:desert']},
        {shotId: 'shot-2', environmentRefs: []},
      ],
      provenance: 'fixture',
    }],
  }));
  const outcome = report.outcomes.find((o) => o.dimension === 'continuity');
  assert.equal(outcome.status, 'PASS');
});

test('continuity fails naming the stray shot, preserving scene scope', () => {
  const report = evaluateVisualQa(input({
    continuityGroups: [{
      sceneId: 'scene-1',
      sceneEnvironments: ['env:desert'],
      shots: [{shotId: 'shot-9', environmentRefs: ['env:arctic']}],
      provenance: 'fixture',
    }],
  }));
  const outcome = report.outcomes.find((o) => o.dimension === 'continuity');
  assert.equal(outcome.status, 'FAIL');
  assert.match(outcome.detail, /shot-9/);
  assert.match(outcome.detail, /env:arctic/);
});

test('continuity with no evaluatable shots is UNKNOWN', () => {
  const report = evaluateVisualQa(input({
    continuityGroups: [{
      sceneId: 'scene-1', sceneEnvironments: [], shots: [], provenance: 'fixture',
    }],
  }));
  assert.equal(report.outcomes.find((o) => o.dimension === 'continuity').status, 'UNKNOWN');
});

test('av-sync checks declared offset against declared tolerance only', () => {
  const good = evaluateVisualQa(input({
    avSync: [{declarationId: 'av-1', audioRef: 'a', videoRef: 'v', offsetMs: 40, maxAllowedOffsetMs: 80, provenance: 'fixture'}],
  }));
  assert.equal(good.outcomes.find((o) => o.dimension === 'av-sync').status, 'PASS');
  const bad = evaluateVisualQa(input({
    avSync: [{declarationId: 'av-1', audioRef: 'a', videoRef: 'v', offsetMs: 120, maxAllowedOffsetMs: 80, provenance: 'fixture'}],
  }));
  const outcome = bad.outcomes.find((o) => o.dimension === 'av-sync');
  assert.equal(outcome.status, 'FAIL');
  assert.match(outcome.detail, /av-1/);
});

test('av-sync rejects non-finite and negative tolerances', () => {
  for (const maxAllowedOffsetMs of [Number.NaN, -1, Number.POSITIVE_INFINITY]) {
    assert.throws(
      () => evaluateVisualQa(input({
        avSync: [{declarationId: 'av-1', audioRef: 'a', videoRef: 'v', offsetMs: 0, maxAllowedOffsetMs, provenance: 'fixture'}],
      })),
      (error) => error.code === 'QA_INVALID_INPUT',
    );
  }
});

test('ui-correctness compares declared fields, absence is UNKNOWN', () => {
  const element = {
    elementId: 'btn-play',
    expected: {x: '10', y: '20', label: 'Play'},
    observed: {x: '10', y: '20', label: 'Play'},
    provenance: 'fixture',
  };
  const report = evaluateVisualQa(input({uiElements: [element]}));
  assert.equal(report.outcomes.find((o) => o.dimension === 'ui-correctness').status, 'PASS');
  const missing = evaluateVisualQa(input({
    uiElements: [{elementId: 'btn-play', expected: {x: '10'}, provenance: 'fixture'}],
  }));
  assert.equal(missing.outcomes.find((o) => o.dimension === 'ui-correctness').status, 'UNKNOWN');
  const drifted = evaluateVisualQa(input({
    uiElements: [{...element, observed: {x: '10', y: '99', label: 'Play'}}],
  }));
  const outcome = drifted.outcomes.find((o) => o.dimension === 'ui-correctness');
  assert.equal(outcome.status, 'FAIL');
  assert.match(outcome.detail, /y: expected 20, observed 99/);
});

test('summary counts outcomes without scoring them', () => {
  const report = evaluateVisualQa(input({
    grounding: {unresolved: []},
    styleResult: consistent(),
    characterResult: inconsistent(),
  }));
  assert.deepEqual(report.summary, {pass: 2, fail: 1, unknown: 3});
  const body = JSON.stringify(report);
  for (const banned of ['"score"', '"grade"', '"rating"', '"verdict"', '"approved"']) {
    assert.ok(!body.includes(banned), `suite contains ${banned}`);
  }
});

test('deterministic from scrambled input', () => {
  const first = input({
    continuityGroups: [
      {sceneId: 's2', sceneEnvironments: ['e2'], shots: [{shotId: 't2', environmentRefs: ['e2']}], provenance: 'f'},
      {sceneId: 's1', sceneEnvironments: ['e1'], shots: [{shotId: 't1', environmentRefs: ['e1']}], provenance: 'f'},
    ],
    avSync: [
      {declarationId: 'b', audioRef: 'a', videoRef: 'v', offsetMs: 0, maxAllowedOffsetMs: 10, provenance: 'f'},
      {declarationId: 'a', audioRef: 'a', videoRef: 'v', offsetMs: 0, maxAllowedOffsetMs: 10, provenance: 'f'},
    ],
  });
  const scrambled = {
    ...first,
    continuityGroups: [...first.continuityGroups].reverse(),
    avSync: [...first.avSync].reverse(),
  };
  assert.equal(JSON.stringify(evaluateVisualQa(first)), JSON.stringify(evaluateVisualQa(scrambled)));
});

test('inputs are never mutated', () => {
  const given = input({
    grounding: {unresolved: ['z', 'a']},
    uiElements: [{elementId: 'e', expected: {x: '1'}, observed: {x: '1'}, provenance: 'f'}],
  });
  const snapshot = JSON.stringify(given);
  evaluateVisualQa(given);
  assert.equal(JSON.stringify(given), snapshot);
});

test('strict shapes: unknown fields and malformed values rejected', () => {
  assert.throws(
    () => evaluateVisualQa({...input(), urgency: 1}),
    (error) => error.code === 'QA_UNKNOWN_FIELD',
  );
  assert.throws(
    () => evaluateVisualQa(input({suiteId: ''})),
    (error) => error.code === 'QA_INVALID_INPUT',
  );
  assert.throws(
    () => evaluateVisualQa(input({grounding: {unresolved: ['']}})),
    (error) => error.code === 'QA_INVALID_INPUT',
  );
  assert.throws(
    () => evaluateVisualQa(input({styleResult: {status: 'MAYBE'}})),
    (error) => error.code === 'QA_INVALID_INPUT',
  );
  assert.throws(
    () => evaluateVisualQa(input({continuityGroups: 'nope'})),
    (error) => error.code === 'QA_INVALID_INPUT',
  );
});

test('security fields rejected before shape errors; no approval surface', () => {
  assert.throws(
    () => evaluateVisualQa({...input(), approved: true, bogus: 1}),
    (error) => error.code === 'QA_AUTHORITY_REJECTED',
  );
  assert.throws(
    () => evaluateVisualQa(input({uiElements: [{elementId: 'e', expected: {x: '1'}, token: 't', provenance: 'f'}]})),
    (error) => error.code === 'QA_SECRET_REJECTED',
  );
  assert.throws(
    () => evaluateVisualQa(input({avSync: [{declarationId: 'a', audioRef: 'x', videoRef: 'y', offsetMs: 0, maxAllowedOffsetMs: 1, provenance: 'x', persona: 'p'}]})),
    (error) => error.code === 'QA_PERSONALITY_REJECTED',
  );
  const report = evaluateVisualQa(input({grounding: {unresolved: []}}));
  assert.ok(!('approved' in report));
  assert.ok(!('verdict' in report));
});

test('module exposes no generation, scoring, model, or memory surface', () => {
  const module = require('./.compiled-core/qa/visualQa.js');
  const names = Object.keys(module).sort();
  assert.deepEqual(names, ['QA_DIMENSIONS', 'QaError', 'evaluateVisualQa']);
  const joined = names.join(' ').toLowerCase();
  for (const banned of ['generat', 'render', 'score', 'rank', 'model', 'embed', 'fetch', 'memory', 'repair', 'approv']) {
    assert.ok(!joined.includes(banned), `export surface contains ${banned}`);
  }
});
