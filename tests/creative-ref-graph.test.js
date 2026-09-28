import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const {
  REF_RELATIONS,
  targetKey,
  createGraph,
  registerNode,
  addRef,
  refsFor,
  referencedBy,
  nodesInProject,
  traverse,
} = require('./.compiled-core/refs/creativeRefGraph.js');

function node(over = {}) {
  return {
    nodeId: 'scene-1',
    kind: 'scene',
    projectId: 'proj-a',
    provenance: 'fixture',
    ...over,
  };
}

function edge(from, relation, target, over = {}) {
  return {
    fromNodeId: from,
    relation,
    target,
    provenance: 'fixture',
    ...over,
  };
}

function sceneGraph() {
  let graph = createGraph();
  graph = registerNode(graph, node({nodeId: 'scene-1', kind: 'scene'}));
  graph = registerNode(graph, node({nodeId: 'shot-1', kind: 'shot'}));
  graph = registerNode(graph, node({nodeId: 'shot-2', kind: 'shot'}));
  return graph;
}

test('declares exactly the registered relation vocabulary', () => {
  assert.deepEqual([...REF_RELATIONS], ['STYLE_REF', 'CHARACTER_REF', 'ENVIRONMENT_REF']);
});

test('registers scene and shot nodes with stable ids', () => {
  const graph = sceneGraph();
  assert.deepEqual(graph.nodes.map((n) => n.nodeId), ['scene-1', 'shot-1', 'shot-2']);
});

test('rejects unknown node kinds: arrangement has no representation', () => {
  for (const kind of ['track', 'clip', 'arrangement', 'timeline']) {
    assert.throws(
      () => registerNode(createGraph(), node({nodeId: 'x', kind})),
      (error) => error.code === 'REF_INVALID_INPUT',
    );
  }
});

test('identical re-registration is idempotent; changed content conflicts', () => {
  const graph = registerNode(createGraph(), node({nodeId: 'x'}));
  assert.equal(registerNode(graph, node({nodeId: 'x'})).nodes.length, 1);
  assert.throws(
    () => registerNode(graph, node({nodeId: 'x', title: 'changed'})),
    (error) => error.code === 'REF_CONFLICT',
  );
});

test('records style, character, and environment refs to a scene', () => {
  let graph = sceneGraph();
  graph = addRef(graph, edge('shot-1', 'STYLE_REF', {kind: 'asset', assetRef: 'asset:grade-7'}));
  graph = addRef(graph, edge('shot-1', 'CHARACTER_REF', {kind: 'scene', nodeRef: 'scene-1'}));
  graph = addRef(graph, edge('shot-1', 'ENVIRONMENT_REF', {kind: 'external', source: 'location-scout', ref: 'desert-dawn'}));
  assert.equal(refsFor(graph, 'shot-1').length, 3);
});

test('direction matters: A refs B never implies B refs A', () => {
  let graph = sceneGraph();
  graph = addRef(graph, edge('shot-1', 'STYLE_REF', {kind: 'scene', nodeRef: 'scene-1'}));
  assert.deepEqual(refsFor(graph, 'shot-1').map((e) => e.target), [{kind: 'scene', nodeRef: 'scene-1'}]);
  assert.deepEqual(refsFor(graph, 'scene-1'), []);
});

test('unknown scene/shot targets are rejected, never fabricated', () => {
  const graph = sceneGraph();
  assert.throws(
    () => addRef(graph, edge('shot-1', 'STYLE_REF', {kind: 'scene', nodeRef: 'scene-ghost'})),
    (error) => error.code === 'REF_UNKNOWN_NODE',
  );
  assert.throws(
    () => addRef(graph, edge('scene-ghost', 'STYLE_REF', {kind: 'scene', nodeRef: 'scene-1'})),
    (error) => error.code === 'REF_UNKNOWN_NODE',
  );
});

test('asset and external targets stay opaque and unexpanded', () => {
  let graph = sceneGraph();
  graph = addRef(graph, edge('shot-1', 'STYLE_REF', {kind: 'asset', assetRef: 'asset:grade-7'}));
  assert.ok(!graph.nodes.some((n) => n.nodeId === 'asset:grade-7'));
  assert.deepEqual(referencedBy(graph, {kind: 'asset', assetRef: 'asset:grade-7'}).map((e) => e.fromNodeId), ['shot-1']);
});

test('self-edges are meaningless and rejected', () => {
  const graph = sceneGraph();
  assert.throws(
    () => addRef(graph, edge('shot-1', 'STYLE_REF', {kind: 'shot', nodeRef: 'shot-1'})),
    (error) => error.code === 'REF_SELF_EDGE',
  );
});

test('identical re-add is idempotent; same triple new provenance conflicts', () => {
  let graph = sceneGraph();
  graph = addRef(graph, edge('shot-1', 'STYLE_REF', {kind: 'asset', assetRef: 'a1'}));
  const again = addRef(graph, edge('shot-1', 'STYLE_REF', {kind: 'asset', assetRef: 'a1'}));
  assert.equal(again.edges.length, 1);
  assert.throws(
    () => addRef(graph, edge('shot-1', 'STYLE_REF', {kind: 'asset', assetRef: 'a1'}, {provenance: 'other'})),
    (error) => error.code === 'REF_CONFLICT',
  );
});

test('same endpoints with different relations stay distinct', () => {
  let graph = sceneGraph();
  graph = addRef(graph, edge('shot-1', 'STYLE_REF', {kind: 'asset', assetRef: 'a1'}));
  graph = addRef(graph, edge('shot-1', 'CHARACTER_REF', {kind: 'asset', assetRef: 'a1'}));
  assert.equal(refsFor(graph, 'shot-1').length, 2);
});

test('unregistered relation names are refused, never added conveniently', () => {
  const graph = sceneGraph();
  assert.throws(
    () => addRef(graph, edge('shot-1', 'INSPIRED_BY', {kind: 'asset', assetRef: 'a1'})),
    (error) => error.code === 'REF_UNKNOWN_RELATION',
  );
});

test('traversal follows node edges only, cycle-safe and deterministic', () => {
  let graph = sceneGraph();
  graph = addRef(graph, edge('shot-1', 'STYLE_REF', {kind: 'shot', nodeRef: 'shot-2'}));
  graph = addRef(graph, edge('shot-2', 'CHARACTER_REF', {kind: 'scene', nodeRef: 'scene-1'}));
  graph = addRef(graph, edge('shot-1', 'ENVIRONMENT_REF', {kind: 'asset', assetRef: 'a1'}));
  const reached = traverse(graph, 'shot-1').map((r) => r.nodeId);
  assert.deepEqual(reached, ['shot-2', 'scene-1']);
  // Asset leaves are never traversed out of.
  assert.ok(!reached.includes('asset:a1'));
});

test('traversal survives cycles and scrambles identically', () => {
  let graph = sceneGraph();
  graph = addRef(graph, edge('shot-1', 'STYLE_REF', {kind: 'shot', nodeRef: 'shot-2'}));
  graph = addRef(graph, edge('shot-2', 'STYLE_REF', {kind: 'shot', nodeRef: 'shot-1'}));
  assert.deepEqual(traverse(graph, 'shot-1').map((r) => r.nodeId), ['shot-2']);
  const forward = JSON.stringify(traverse(graph, 'shot-1'));
  assert.equal(typeof forward, 'string');
  assert.ok(forward.length > 0);
});

test('nodes filter by project without cross-project policy invention', () => {
  let graph = sceneGraph();
  graph = registerNode(graph, node({nodeId: 'scene-b', kind: 'scene', projectId: 'proj-b'}));
  assert.deepEqual(nodesInProject(graph, 'proj-a').map((n) => n.nodeId), ['scene-1', 'shot-1', 'shot-2']);
  assert.deepEqual(nodesInProject(graph, 'proj-b').map((n) => n.nodeId), ['scene-b']);
});

test('target keys are identity, never content', () => {
  assert.equal(targetKey({kind: 'scene', nodeRef: 's1'}), 'scene:s1');
  assert.equal(targetKey({kind: 'asset', assetRef: 'a1'}), 'asset:a1');
  assert.equal(targetKey({kind: 'external', source: 's', ref: 'r'}), 'external:s:r');
});

test('security fields rejected before shape errors; unknown fields rejected', () => {
  assert.throws(
    () => registerNode(createGraph(), {...node(), apiKey: 'sk-x', bogus: 1}),
    (error) => error.code === 'REF_SECRET_REJECTED',
  );
  assert.throws(
    () => registerNode(createGraph(), {...node(), authorized: true}),
    (error) => error.code === 'REF_AUTHORITY_REJECTED',
  );
  assert.throws(
    () => registerNode(createGraph(), {...node(), color: 'blue'}),
    (error) => error.code === 'REF_UNKNOWN_FIELD',
  );
  assert.throws(
    () => addRef(sceneGraph(), {...edge('shot-1', 'STYLE_REF', {kind: 'asset', assetRef: 'a1'}), score: 9}),
    (error) => error.code === 'REF_UNKNOWN_FIELD',
  );
});

test('module exposes no generation, scoring, ranking, or memory surface', () => {
  const module = require('./.compiled-core/refs/creativeRefGraph.js');
  const names = Object.keys(module).sort();
  assert.deepEqual(names, [
    'REF_RELATIONS',
    'RefGraphError',
    'addRef',
    'createGraph',
    'nodesInProject',
    'referencedBy',
    'refsFor',
    'registerNode',
    'targetKey',
    'traverse',
  ]);
  const joined = names.join(' ').toLowerCase();
  for (const banned of ['generat', 'render', 'score', 'rank', 'fetch', 'download', 'memory', 'search', 'vector', 'spawn']) {
    assert.ok(!joined.includes(banned), `export surface contains ${banned}`);
  }
});

test('inputs are never mutated', () => {
  const graph = sceneGraph();
  const snapshot = JSON.stringify(graph);
  traverse(graph, 'shot-1');
  refsFor(graph, 'shot-1');
  assert.equal(JSON.stringify(graph), snapshot);
});
