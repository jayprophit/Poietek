/**
 * REQ-p29-creative-ref-graph: reference-linked creative project graph.
 *
 * Registered scope: style/character/environment refs to scenes/shots over
 * canonical project truth (PoietekProject/Asset in domain/types.ts); DAW
 * scenes are arrangement, not visual refs.
 *
 * The graph owns NODES (scene/shot, project-scoped, stable ids) and EDGES
 * (typed refs from a scene/shot to a target). Everything else is a
 * reference, never a copy and never re-owned:
 *
 *   REFERENCE GRAPH != ASSET STORE (assets stay in the canonical project;
 *     edges carry assetRef strings, never audio/images/project files)
 *   REFERENCE TO ASSET != COPIED ASSET (no ingestion, no download, no fetch;
 *     EXTERNAL REF REGISTERED != EXTERNAL CONTENT INGESTED)
 *   GRAPH != LIBRARY (no catalogue duplication)
 *
 * Relation vocabulary is exactly the registered one. Direction is
 * load-bearing and tested (A REFERENCES B != B REFERENCES A):
 *
 *   STYLE_REF | CHARACTER_REF | ENVIRONMENT_REF
 *
 * Targets resolve three ways, and only three ways:
 * - scene/shot node refs must exist in this graph (UNKNOWN REF != EMPTY
 *   ASSET — rejected, never fabricated into placeholder nodes);
 * - asset refs are opaque canonical ids (accepted, never expanded into nodes);
 * - external refs are stable {source, ref} metadata (recorded, never fetched).
 *
 * What this is NOT (all recorded, all tested):
 * - not arrangement: DAW tracks/clips have no representation here and no
 *   arrangement vocabulary exists in this module;
 * - not authorship/licence: REFERENCES != AUTHORED_BY, REFERENCE != LICENCE;
 * - not generation: DERIVATION-style edges do not exist and no edge copies,
 *   renders, clones, or generates anything (RELATIONSHIP != SIDE EFFECT);
 * - not memory, not MAT Epistemic Graph, not Aetherius EvidenceGraph;
 * - no similarity inference (SIMILARITY != CREATIVE RELATIONSHIP), no model
 *   arbitration, no scores, no ranking, no cascade deletes (EDGE REMOVED !=
 *   TARGET ASSET DELETED — and no removal API exists at all).
 *
 * Graphs are caller-held plain data; every operation returns new arrays and
 * never mutates inputs. Deterministic throughout: canonical ordering,
 * explicit id tie-breaks, scrambled-input equality, no clock, no network.
 */

export type RefNodeKind = "scene" | "shot";

export interface RefNode {
  /** Stable identity. DISPLAY NAME != NODE ID; FILENAME != ASSET IDENTITY. */
  nodeId: string;
  kind: RefNodeKind;
  projectId: string;
  title?: string;
  provenance: string;
}

export type RefTarget =
  | { kind: "scene" | "shot"; nodeRef: string }
  | { kind: "asset"; assetRef: string }
  | { kind: "external"; source: string; ref: string };

export type RefRelation = "STYLE_REF" | "CHARACTER_REF" | "ENVIRONMENT_REF";

export const REF_RELATIONS: readonly RefRelation[] = [
  "STYLE_REF",
  "CHARACTER_REF",
  "ENVIRONMENT_REF",
];

export interface RefEdge {
  fromNodeId: string;
  relation: RefRelation;
  target: RefTarget;
  provenance: string;
}

export interface CreativeRefGraph {
  nodes: RefNode[];
  edges: RefEdge[];
}

export type RefGraphProblemCode =
  | "REF_INVALID_INPUT"
  | "REF_UNKNOWN_FIELD"
  | "REF_AUTHORITY_REJECTED"
  | "REF_SECRET_REJECTED"
  | "REF_PERSONALITY_REJECTED"
  | "REF_DUPLICATE_ID"
  | "REF_SELF_EDGE"
  | "REF_CONFLICT"
  | "REF_UNKNOWN_NODE"
  | "REF_SELF_EDGE"
  | "REF_UNKNOWN_RELATION";

export class RefGraphError extends Error {
  readonly code: RefGraphProblemCode;
  constructor(code: RefGraphProblemCode, message: string) {
    super(message);
    this.name = "RefGraphError";
    this.code = code;
  }
}

const NODE_FIELDS = ["nodeId", "kind", "projectId", "title", "provenance"] as const;
const EDGE_FIELDS = ["fromNodeId", "relation", "target", "provenance"] as const;
const TARGET_FIELDS = ["kind", "nodeRef", "assetRef", "source", "ref"] as const;

const AUTHORITY_KEYS = [
  "authorized", "approved", "canExecute", "canDeploy", "permission",
  "permissionGranted", "grantApproved", "policyBypass", "ownerOverride",
  "mergeAuthority",
];

const SECRET_KEYS = ["apiKey", "secret", "token", "password", "privateKey", "credential"];

const PERSONALITY_KEYS = [
  "personality", "persona", "traits", "backstory", "biography",
  "autobiography", "identity", "dna", "soul", "selfModel",
];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Security-significant violations are diagnosed BEFORE generic shape errors,
 * so a smuggled credential is reported as itself and never disappears into
 * an unknown-field complaint.
 */
function assertNoViolations(value: unknown, path: string, seen: Set<unknown>): void {
  if (seen.has(value) || typeof value !== "object" || value === null) return;
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoViolations(item, `${path}[${index}]`, seen));
    return;
  }
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (AUTHORITY_KEYS.includes(key)) {
      throw new RefGraphError("REF_AUTHORITY_REJECTED", `${path}.${key}: references never carry authority`);
    }
    if (SECRET_KEYS.includes(key)) {
      throw new RefGraphError("REF_SECRET_REJECTED", `${path}.${key}: SECRET REF != SECRET VALUE`);
    }
    if (PERSONALITY_KEYS.includes(key)) {
      throw new RefGraphError("REF_PERSONALITY_REJECTED", `${path}.${key}: a reference record carries no stored person`);
    }
    assertNoViolations(nested, `${path}.${key}`, seen);
  }
}

/** Canonical target key. Identity, never content. */
export function targetKey(target: RefTarget): string {
  switch (target.kind) {
    case "scene":
    case "shot":
      return `${target.kind}:${target.nodeRef}`;
    case "asset":
      return `asset:${target.assetRef}`;
    case "external":
      return `external:${target.source}:${target.ref}`;
  }
}

function assertTarget(value: unknown): RefTarget {
  if (!isPlainObject(value)) {
    throw new RefGraphError("REF_INVALID_INPUT", "edge target must be an object");
  }
  for (const key of Object.keys(value)) {
    if (!(TARGET_FIELDS as readonly string[]).includes(key)) {
      throw new RefGraphError("REF_UNKNOWN_FIELD", `unknown target field ${key}`);
    }
  }
  if (value.kind !== "scene" && value.kind !== "shot" && value.kind !== "asset" && value.kind !== "external") {
    throw new RefGraphError("REF_INVALID_INPUT", "target kind must be scene, shot, asset, or external");
  }
  if (value.kind === "scene" || value.kind === "shot") {
    if (!nonEmpty(value.nodeRef)) {
      throw new RefGraphError("REF_INVALID_INPUT", "scene/shot targets need a non-empty nodeRef");
    }
    return { kind: value.kind, nodeRef: value.nodeRef };
  }
  if (value.kind === "asset") {
    // Opaque canonical asset id: accepted as declared, never expanded into a
    // node and never verified here. REFERENCE TO ASSET != COPIED ASSET.
    if (!nonEmpty(value.assetRef)) {
      throw new RefGraphError("REF_INVALID_INPUT", "asset targets need a non-empty assetRef");
    }
    return { kind: "asset", assetRef: value.assetRef };
  }
  if (!nonEmpty(value.source) || !nonEmpty(value.ref)) {
    throw new RefGraphError("REF_INVALID_INPUT", "external targets need non-empty source and ref: recorded, never fetched");
  }
  return { kind: "external", source: value.source, ref: value.ref };
}

export function createGraph(): CreativeRefGraph {
  return { nodes: [], edges: [] };
}

/**
 * Register one scene/shot node. Pure: returns a new graph, never mutates.
 * Same id + identical content is idempotent; same id + changed content is a
 * conflict (MULTIPLE CLAIMS != AUTOMATIC RESOLUTION).
 */
export function registerNode(graph: CreativeRefGraph, input: unknown): CreativeRefGraph {
  if (!isPlainObject(graph) || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
    throw new RefGraphError("REF_INVALID_INPUT", "graph must carry nodes and edges arrays");
  }
  if (!isPlainObject(input)) {
    throw new RefGraphError("REF_INVALID_INPUT", "node must be an object");
  }
  assertNoViolations(input, "node", new Set());
  for (const key of Object.keys(input)) {
    if (!(NODE_FIELDS as readonly string[]).includes(key)) {
      throw new RefGraphError("REF_UNKNOWN_FIELD", `unknown node field ${key}`);
    }
  }
  if (!nonEmpty(input.nodeId)) {
    throw new RefGraphError("REF_INVALID_INPUT", "nodeId must be a non-empty stable id");
  }
  if (input.kind !== "scene" && input.kind !== "shot") {
    throw new RefGraphError("REF_INVALID_INPUT", "node kind must be scene or shot: arrangement entities have no representation here");
  }
  if (!nonEmpty(input.projectId)) {
    throw new RefGraphError("REF_INVALID_INPUT", "projectId must be non-empty: references live in projects");
  }
  if (input.title !== undefined && !nonEmpty(input.title)) {
    throw new RefGraphError("REF_INVALID_INPUT", "title must be non-empty when present");
  }
  if (!nonEmpty(input.provenance)) {
    throw new RefGraphError("REF_INVALID_INPUT", "provenance must be a non-empty string");
  }
  const node: RefNode = {
    nodeId: input.nodeId,
    kind: input.kind,
    projectId: input.projectId,
    ...(input.title === undefined ? {} : { title: input.title as string }),
    provenance: input.provenance,
  };
  const existing = graph.nodes.find((n) => n.nodeId === node.nodeId);
  if (existing !== undefined) {
    if (JSON.stringify(existing) === JSON.stringify(node)) {
      return { nodes: [...graph.nodes], edges: [...graph.edges] };
    }
    throw new RefGraphError("REF_CONFLICT", `node ${node.nodeId} already registered with different content`);
  }
  return {
    nodes: [...graph.nodes, node].sort((a, b) => (a.nodeId < b.nodeId ? -1 : 1)),
    edges: [...graph.edges],
  };
}

/**
 * Add one typed ref edge. Pure: returns a new graph, never mutates.
 * Scene/shot targets must exist (UNKNOWN REF != EMPTY ASSET); asset and
 * external targets are caller-declared and stay opaque. A node referencing
 * itself is meaningless and rejected. Identical re-registration is
 * idempotent; same (from, relation, target) with different provenance is a
 * conflict — provenance is evidence, not decoration.
 */
export function addRef(graph: CreativeRefGraph, input: unknown): CreativeRefGraph {
  if (!isPlainObject(graph) || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
    throw new RefGraphError("REF_INVALID_INPUT", "graph must carry nodes and edges arrays");
  }
  if (!isPlainObject(input)) {
    throw new RefGraphError("REF_INVALID_INPUT", "edge must be an object");
  }
  assertNoViolations(input, "edge", new Set());
  for (const key of Object.keys(input)) {
    if (!(EDGE_FIELDS as readonly string[]).includes(key)) {
      throw new RefGraphError("REF_UNKNOWN_FIELD", `unknown edge field ${key}`);
    }
  }
  if (!nonEmpty(input.fromNodeId)) {
    throw new RefGraphError("REF_INVALID_INPUT", "fromNodeId must be a non-empty stable id");
  }
  if (!REF_RELATIONS.includes(input.relation as RefRelation)) {
    throw new RefGraphError("REF_UNKNOWN_RELATION", `relation must be one of ${REF_RELATIONS.join(", ")}: no convenient relation types are added`);
  }
  if (!nonEmpty(input.provenance)) {
    throw new RefGraphError("REF_INVALID_INPUT", "provenance must be a non-empty string");
  }
  const byId = new Map(graph.nodes.map((n) => [n.nodeId, n]));
  if (!byId.has(input.fromNodeId as string)) {
    throw new RefGraphError("REF_UNKNOWN_NODE", `edge source ${input.fromNodeId} is not a registered node`);
  }
  const target = assertTarget(input.target);
  if ((target.kind === "scene" || target.kind === "shot") && !byId.has(target.nodeRef)) {
    throw new RefGraphError("REF_UNKNOWN_NODE", `edge target ${target.nodeRef} is not a registered node: UNKNOWN REF != EMPTY ASSET`);
  }
  if ((target.kind === "scene" || target.kind === "shot") && target.nodeRef === input.fromNodeId) {
    throw new RefGraphError("REF_SELF_EDGE", `node ${input.fromNodeId} cannot reference itself`);
  }
  const edge: RefEdge = {
    fromNodeId: input.fromNodeId as string,
    relation: input.relation as RefRelation,
    target,
    provenance: input.provenance as string,
  };
  const sameTriple = graph.edges.filter(
    (e) => e.fromNodeId === edge.fromNodeId && e.relation === edge.relation && targetKey(e.target) === targetKey(edge.target),
  );
  if (sameTriple.some((e) => JSON.stringify(e) === JSON.stringify(edge))) return { nodes: [...graph.nodes], edges: [...graph.edges] };
  if (sameTriple.length > 0) {
    throw new RefGraphError("REF_CONFLICT", `edge ${edge.fromNodeId} ${edge.relation} ${targetKey(edge.target)} already recorded with different provenance`);
  }
  const order = (e: RefEdge): string => `${e.fromNodeId}\n${e.relation}\n${targetKey(e.target)}`;
  return {
    nodes: [...graph.nodes],
    edges: [...graph.edges, edge].sort((a, b) => (order(a) < order(b) ? -1 : 1)),
  };
}

/** Outgoing refs of one node, in canonical order. */
export function refsFor(graph: CreativeRefGraph, nodeId: string): RefEdge[] {
  return graph.edges
    .filter((e) => e.fromNodeId === nodeId)
    .map((e) => JSON.parse(JSON.stringify(e)) as RefEdge);
}

/** Incoming refs to one target key, in canonical order. */
export function referencedBy(graph: CreativeRefGraph, target: RefTarget): RefEdge[] {
  const key = targetKey(target);
  return graph.edges
    .filter((e) => targetKey(e.target) === key)
    .map((e) => JSON.parse(JSON.stringify(e)) as RefEdge);
}

/** Nodes of one project, in canonical id order. */
export function nodesInProject(graph: CreativeRefGraph, projectId: string): RefNode[] {
  return graph.nodes
    .filter((n) => n.projectId === projectId)
    .map((n) => JSON.parse(JSON.stringify(n)) as RefNode);
}

/**
 * Bounded transitive traversal over node-to-node edges only (asset and
 * external targets are leaves: nothing traverses out of them). Cycle-safe
 * via visited set, deterministic via canonical neighbour order.
 */
export function traverse(
  graph: CreativeRefGraph,
  nodeId: string,
  options: { relations?: RefRelation[]; maxDepth?: number } = {},
): Array<{ nodeId: string; depth: number; via: RefRelation }> {
  const relations = options.relations ?? [...REF_RELATIONS];
  for (const relation of relations) {
    if (!REF_RELATIONS.includes(relation)) {
      throw new RefGraphError("REF_UNKNOWN_RELATION", `unknown traversal relation ${relation}`);
    }
  }
  const maxDepth = options.maxDepth ?? 10;
  if (!Number.isInteger(maxDepth) || maxDepth < 1) {
    throw new RefGraphError("REF_INVALID_INPUT", "maxDepth must be a positive integer");
  }
  const visited = new Set<string>([nodeId]);
  const reached: Array<{ nodeId: string; depth: number; via: RefRelation }> = [];
  let frontier = [nodeId];
  for (let depth = 0; depth < maxDepth && frontier.length > 0; depth += 1) {
    const next: string[] = [];
    for (const current of frontier) {
      const neighbours = graph.edges
        .filter((e) => e.fromNodeId === current && relations.includes(e.relation))
        .filter((e) => e.target.kind === "scene" || e.target.kind === "shot")
        .sort((a, b) => {
          const ka = targetKey(a.target);
          const kb = targetKey(b.target);
          return a.relation === b.relation ? (ka < kb ? -1 : 1) : a.relation < b.relation ? -1 : 1;
        });
      for (const edge of neighbours) {
        const id = (edge.target as { nodeRef: string }).nodeRef;
        if (visited.has(id)) continue;
        visited.add(id);
        reached.push({ nodeId: id, depth: depth + 1, via: edge.relation });
        next.push(id);
      }
    }
    frontier = [...new Set(next)].sort();
  }
  return reached;
}
