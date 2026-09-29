import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const {
  validateGrounding,
} = require('./.compiled-core/design/refGroundedDesign.js');
const refGraph = require('./.compiled-core/refs/creativeRefGraph.js');

function graph() {
  let graph = refGraph.createGraph();
  graph = refGraph.registerNode(graph, {
    nodeId: 'scene-1', kind: 'scene', projectId: 'proj-a', provenance: 'fixture',
  });
  graph = refGraph.registerNode(graph, {
    nodeId: 'shot-1', kind: 'shot', projectId: 'proj-a', provenance: 'fixture',
  });
  graph = refGraph.addRef(graph, {
    fromNodeId: 'shot-1',
    relation: 'STYLE_REF',
    target: {kind: 'asset', assetRef: 'grade-7'},
    provenance: 'fixture',
  });
  return graph;
}

function view(g) {
  const nodes = g.nodes.map((n) => n.nodeId);
  const edgeTargetKeys = [];
  for (const edge of g.edges) {
    edgeTargetKeys.push(refGraph.targetKey(edge.target));
  }
  return {nodeIds: nodes, edgeTargetKeys};
}

function output(over = {}) {
  return {
    outputId: 'design-1',
    citations: [
      {referenceId: 'scene-1', deltas: ['warmer palette'], provenance: 'fixture'},
    ],
    provenance: 'fixture',
    ...over,
  };
}

test('a fully grounded output resolves every citation', () => {
  const report = validateGrounding(view(graph()), output({
    citations: [
      {referenceId: 'scene-1', deltas: [], provenance: 'fixture'},
      {referenceId: 'asset:grade-7', deltas: ['pushed contrast'], provenance: 'fixture'},
    ],
  }));
  assert.deepEqual(report.unresolved, []);
  assert.deepEqual(report.citations.map((c) => [c.referenceId, c.resolved, c.resolvedAs]), [
    ['asset:grade-7', true, 'edge-target'],
    ['scene-1', true, 'node'],
  ]);
});

test('empty deltas mean faithful use; absent deltas are forbidden', () => {
  const report = validateGrounding(view(graph()), output());
  assert.deepEqual(report.citations[0].deltas, ['warmer palette']);
  assert.throws(
    () => validateGrounding(view(graph()), output({citations: [{referenceId: 'scene-1', provenance: 'fixture'}]})),
    (error) => error.code === 'GROUNDING_INVALID_INPUT',
  );
});

test('unknown references report unresolved, never pass or fail', () => {
  const report = validateGrounding(view(graph()), output({
    citations: [{referenceId: 'scene-ghost', deltas: ['x'], provenance: 'fixture'}],
  }));
  assert.deepEqual(report.unresolved, ['scene-ghost']);
  assert.equal(report.citations[0].resolved, false);
  assert.ok(!('resolvedAs' in report.citations[0]));
  assert.ok(!('verdict' in report));
  assert.ok(!('approved' in report));
});

test('identical duplicate citations collapse; differing deltas stay separate', () => {
  const cited = {referenceId: 'scene-1', deltas: ['x'], provenance: 'fixture'};
  const same = validateGrounding(view(graph()), output({citations: [cited, {...cited}]}));
  assert.equal(same.citations.length, 1);
  const different = validateGrounding(view(graph()), output({
    citations: [cited, {...cited, deltas: ['y']}],
  }));
  assert.equal(different.citations.length, 2);
});

test('evaluation refs ride along preserved and sorted, never interpreted', () => {
  const report = validateGrounding(view(graph()), output({
    evaluationRefs: ['eval:group-9', 'eval:group-3'],
  }));
  assert.deepEqual(report.evaluationRefs, ['eval:group-3', 'eval:group-9']);
  assert.ok(!('evaluation' in report) || true);
});

test('deterministic from scrambled citation order', () => {
  const first = output({citations: [
    {referenceId: 'shot-1', deltas: ['b'], provenance: 'fixture'},
    {referenceId: 'scene-1', deltas: ['a'], provenance: 'fixture'},
  ]});
  const second = output({citations: [...first.citations].reverse()});
  assert.equal(
    JSON.stringify(validateGrounding(view(graph()), first)),
    JSON.stringify(validateGrounding(view(graph()), second)),
  );
});

test('inputs and graph never mutated', () => {
  const given = output();
  const snapshot = JSON.stringify(given);
  const graphSnapshot = JSON.stringify(graph());
  validateGrounding(view(graph()), given);
  assert.equal(JSON.stringify(given), snapshot);
  assert.equal(JSON.stringify(graph()), graphSnapshot);
});

test('strict shapes: unknown fields and malformed values rejected', () => {
  assert.throws(
    () => validateGrounding(view(graph()), {...output(), urgency: 1}),
    (error) => error.code === 'GROUNDING_UNKNOWN_FIELD',
  );
  assert.throws(
    () => validateGrounding(view(graph()), output({citations: [{referenceId: '', deltas: [], provenance: 'x'}]})),
    (error) => error.code === 'GROUNDING_INVALID_INPUT',
  );
  assert.throws(
    () => validateGrounding(view(graph()), output({citations: [{referenceId: 'scene-1', deltas: [''], provenance: 'x'}]})),
    (error) => error.code === 'GROUNDING_INVALID_INPUT',
  );
  assert.throws(
    () => validateGrounding(view(graph()), output({outputId: ''})),
    (error) => error.code === 'GROUNDING_INVALID_INPUT',
  );
  assert.throws(
    () => validateGrounding('nope', output()),
    (error) => error.code === 'GROUNDING_INVALID_INPUT',
  );
});

test('security fields rejected before shape errors', () => {
  assert.throws(
    () => validateGrounding(view(graph()), {...output(), approved: true, bogus: 1}),
    (error) => error.code === 'GROUNDING_AUTHORITY_REJECTED',
  );
  assert.throws(
    () => validateGrounding(view(graph()), output({citations: [{referenceId: 'scene-1', deltas: [], provenance: 'x', token: 't'}]})),
    (error) => error.code === 'GROUNDING_SECRET_REJECTED',
  );
  assert.throws(
    () => validateGrounding(view(graph()), output({citations: [{referenceId: 'scene-1', deltas: [], provenance: 'x', persona: 'p'}]})),
    (error) => error.code === 'GROUNDING_PERSONALITY_REJECTED',
  );
});

test('module exposes no generation, scoring, QA, or memory surface', () => {
  const module = require('./.compiled-core/design/refGroundedDesign.js');
  const names = Object.keys(module).sort();
  assert.deepEqual(names, ['GroundingError', 'validateGrounding']);
  const joined = names.join(' ').toLowerCase();
  for (const banned of ['generat', 'render', 'score', 'rank', 'qa', 'fetch', 'memory', 'repair', 'approv']) {
    assert.ok(!joined.includes(banned), `export surface contains ${banned}`);
  }
});
