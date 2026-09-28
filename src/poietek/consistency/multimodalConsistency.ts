/**
 * REQ-p29-multimodal-consistency: consistency dimensions across generated
 * assets as scorer-registry entries (never a universal score).
 *
 * Registered scope: dimensions live AS entries in a scorer registry, over
 * generated assets. Generation routing exists (ai/generativeAudio) and is
 * reused by reference only; consistency scoring did not exist and is what
 * this module adds:
 *
 *   CONSISTENCY SCORING != GENERATION ROUTING
 *
 * The three dimensions reuse the Creative Reference Graph's registered
 * relation vocabulary — character, style, environment — evaluated as
 * declared canonical refs, never as appearance, similarity, or model
 * judgment:
 *
 *   CONSISTENCY != SIMILARITY
 *   SAME DISPLAY NAME != SAME ENTITY
 *   SAME LOOK != SAME CANONICAL CHARACTER
 *   CONSISTENCY RULE != HIDDEN MODEL JUDGMENT
 *   TEXT MENTIONS "HERO" != CANONICAL CHARACTER REF
 *
 * Each dimension asks one question of a caller-declared asset group: do the
 * assets that declare this ref agree? Agreement is CONSISTENT, disagreement
 * is INCONSISTENT with every side preserved, absence is UNKNOWN — never a
 * pass, never a fail:
 *
 *   UNKNOWN != CONSISTENT
 *   NO CONTRADICTION OBSERVED != CONSISTENCY PROVEN
 *   CONFLICT != AUTOMATIC RESOLUTION (no newest/first/score/model choice)
 *
 * Results are per-dimension, never blended. There is no universal score, no
 * star rating, no confidence percentage:
 *
 *   RULE COUNT != QUALITY SCORE
 *   CONSISTENT != GOOD, CONSISTENT != CORRECT (no quality scoring here)
 *   CONSISTENCY PASS != APPROVAL (no release/rights authority anywhere)
 *
 * Everything evaluated is caller-DECLARED. This module performs no media
 * observation, so it never claims an observed fact:
 *
 *   DECLARED REF != OBSERVED MEDIA FACT
 *
 * Assets stay distinct no matter what they share (SAME REFERENCE SET !=
 * SAME ASSET), versions are carried opaquely without float-to-latest
 * (ASSET ID != LATEST ASSET VERSION), and detection never mutates
 * (INCONSISTENCY DETECTED != INCONSISTENCY FIXED — no auto-repair).
 *
 * Asset payloads are never embedded (CONSISTENCY RECORD != ASSET STORE);
 * refs to the canonical Asset model stay refs. No licence/authorship
 * inference (REFERENCE != AUTHORSHIP, REFERENCE != LICENCE, CONSISTENT WITH
 * REFERENCE != LEGALLY REUSABLE). No memory, no MAT/Aetherius graph
 * duplication, no embeddings, no vector search, no model calls, no
 * generation, no fetching, no network.
 *
 * Deterministic throughout: canonical ordering, explicit id tie-breaks,
 * scrambled-input equality, no clock, integer-free arithmetic on strings
 * only (no floats anywhere, so no float-ordering hazard exists by
 * construction).
 */

export type ConsistencyDimensionId =
  | "character-consistency"
  | "style-consistency"
  | "environment-consistency";

export const CONSISTENCY_DIMENSIONS: readonly ConsistencyDimensionId[] = [
  "character-consistency",
  "style-consistency",
  "environment-consistency",
];

/** Which declared ref field a dimension reads. Fixed per dimension. */
const DIMENSION_REF_FIELD: Record<ConsistencyDimensionId, "characterRef" | "styleRef" | "environmentRef"> = {
  "character-consistency": "characterRef",
  "style-consistency": "styleRef",
  "environment-consistency": "environmentRef",
};

export type ConsistencyStatus = "CONSISTENT" | "INCONSISTENT" | "UNKNOWN";

export interface ScorerEntry {
  /** Stable identity. Same id twice is a duplicate, never an update. */
  scorerId: string;
  dimension: ConsistencyDimensionId;
  version: string;
  description: string;
  provenance: string;
}

export interface ConsistencyAsset {
  assetId: string;
  version?: string;
  characterRef?: string;
  styleRef?: string;
  environmentRef?: string;
  sceneRef?: string;
  shotRef?: string;
  provenance: string;
}

export interface ConsistencyGroup {
  groupId: string;
  assets: ConsistencyAsset[];
  provenance: string;
}

export interface RefAgreement {
  ref: string;
  assetIds: string[];
}

export interface DimensionResult {
  groupId: string;
  dimension: ConsistencyDimensionId;
  scorerId: string;
  status: ConsistencyStatus;
  /** The single agreed ref when CONSISTENT; absent otherwise. */
  agreedRef?: string;
  /** Every distinct declared value with its holders when INCONSISTENT. */
  conflicts: RefAgreement[];
  /** Assets that did not declare this dimension's ref. Neither pass nor fail. */
  unresolved: string[];
}

export type ConsistencyProblemCode =
  | "CONSISTENCY_INVALID_INPUT"
  | "CONSISTENCY_UNKNOWN_FIELD"
  | "CONSISTENCY_AUTHORITY_REJECTED"
  | "CONSISTENCY_SECRET_REJECTED"
  | "CONSISTENCY_PERSONALITY_REJECTED"
  | "CONSISTENCY_DUPLICATE_ID"
  | "CONSISTENCY_CONFLICT"
  | "CONSISTENCY_UNKNOWN_DIMENSION"
  | "CONSISTENCY_UNKNOWN_SCORER";

export class ConsistencyError extends Error {
  readonly code: ConsistencyProblemCode;
  constructor(code: ConsistencyProblemCode, message: string) {
    super(message);
    this.name = "ConsistencyError";
    this.code = code;
  }
}

const SCORER_FIELDS = ["scorerId", "dimension", "version", "description", "provenance"] as const;
const ASSET_FIELDS = [
  "assetId", "version", "characterRef", "styleRef", "environmentRef",
  "sceneRef", "shotRef", "provenance",
] as const;
const GROUP_FIELDS = ["groupId", "assets", "provenance"] as const;

const AUTHORITY_KEYS = [
  "authorized", "approved", "canExecute", "canDeploy", "permission",
  "permissionGranted", "grantApproved", "policyBypass", "ownerOverride",
  "mergeAuthority", "score", "grade", "rating",
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
 * so a smuggled grant is reported as itself and never disappears into an
 * unknown-field complaint. Note `score`/`grade`/`rating` are authority-adjacent
 * here: this module must never emit them.
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
      throw new ConsistencyError("CONSISTENCY_AUTHORITY_REJECTED", `${path}.${key}: consistency never carries authority, approval, or scores`);
    }
    if (SECRET_KEYS.includes(key)) {
      throw new ConsistencyError("CONSISTENCY_SECRET_REJECTED", `${path}.${key}: SECRET REF != SECRET VALUE`);
    }
    if (PERSONALITY_KEYS.includes(key)) {
      throw new ConsistencyError("CONSISTENCY_PERSONALITY_REJECTED", `${path}.${key}: a consistency record carries no stored person`);
    }
    assertNoViolations(nested, `${path}.${key}`, seen);
  }
}

/** The built-in registry: one entry per registered dimension. */
export function createRegistry(): ScorerEntry[] {
  return CONSISTENCY_DIMENSIONS.map((dimension) => ({
    scorerId: `scorer:${dimension}`,
    dimension,
    version: "1.0.0",
    description: `Declared ${dimension.split("-")[0]}-ref agreement across a caller-declared asset group`,
    provenance: "poietek-consistency-builtin",
  }));
}

function assertScorer(value: unknown): ScorerEntry {
  if (!isPlainObject(value)) {
    throw new ConsistencyError("CONSISTENCY_INVALID_INPUT", "scorer entry must be an object");
  }
  assertNoViolations(value, "scorer", new Set());
  for (const key of Object.keys(value)) {
    if (!(SCORER_FIELDS as readonly string[]).includes(key)) {
      throw new ConsistencyError("CONSISTENCY_UNKNOWN_FIELD", `unknown scorer field ${key}`);
    }
  }
  if (!nonEmpty(value.scorerId) || !nonEmpty(value.version) || !nonEmpty(value.description) || !nonEmpty(value.provenance)) {
    throw new ConsistencyError("CONSISTENCY_INVALID_INPUT", "scorerId, version, description, and provenance must be non-empty");
  }
  if (!CONSISTENCY_DIMENSIONS.includes(value.dimension as ConsistencyDimensionId)) {
    throw new ConsistencyError("CONSISTENCY_UNKNOWN_DIMENSION", `dimension must be one of ${CONSISTENCY_DIMENSIONS.join(", ")}: no convenient dimensions are added`);
  }
  return {
    scorerId: value.scorerId,
    dimension: value.dimension as ConsistencyDimensionId,
    version: value.version,
    description: value.description,
    provenance: value.provenance,
  };
}

/**
 * Register one scorer entry. Same id + identical content is idempotent;
 * same id + changed content is a conflict. Scorer identity is the entry id,
 * never the dimension: two entries may cover one dimension with different
 * versions, but they never silently overwrite each other.
 */
export function registerScorer(registry: ScorerEntry[], input: unknown): ScorerEntry[] {
  if (!Array.isArray(registry)) {
    throw new ConsistencyError("CONSISTENCY_INVALID_INPUT", "registry must be an array");
  }
  const entry = assertScorer(input);
  const existing = registry.find((e) => e.scorerId === entry.scorerId);
  if (existing !== undefined) {
    if (JSON.stringify(existing) === JSON.stringify(entry)) return [...registry];
    throw new ConsistencyError("CONSISTENCY_CONFLICT", `scorer ${entry.scorerId} already registered with different content`);
  }
  return [...registry, entry].sort((a, b) => (a.scorerId < b.scorerId ? -1 : 1));
}

function assertAsset(value: unknown, index: number): ConsistencyAsset {
  if (!isPlainObject(value)) {
    throw new ConsistencyError("CONSISTENCY_INVALID_INPUT", `assets[${index}] must be an object`);
  }
  assertNoViolations(value, `assets[${index}]`, new Set());
  for (const key of Object.keys(value)) {
    if (!(ASSET_FIELDS as readonly string[]).includes(key)) {
      throw new ConsistencyError("CONSISTENCY_UNKNOWN_FIELD", `unknown asset field ${key}`);
    }
  }
  if (!nonEmpty(value.assetId)) {
    throw new ConsistencyError("CONSISTENCY_INVALID_INPUT", `assets[${index}] needs a non-empty assetId`);
  }
  for (const field of ["characterRef", "styleRef", "environmentRef", "sceneRef", "shotRef", "version"] as const) {
    if (value[field] !== undefined && !nonEmpty(value[field])) {
      throw new ConsistencyError("CONSISTENCY_INVALID_INPUT", `assets[${index}] ${field} must be non-empty when present`);
    }
  }
  if (!nonEmpty(value.provenance)) {
    throw new ConsistencyError("CONSISTENCY_INVALID_INPUT", `assets[${index}] provenance must be non-empty`);
  }
  return {
    assetId: value.assetId,
    ...(value.version === undefined ? {} : { version: value.version as string }),
    ...(value.characterRef === undefined ? {} : { characterRef: value.characterRef as string }),
    ...(value.styleRef === undefined ? {} : { styleRef: value.styleRef as string }),
    ...(value.environmentRef === undefined ? {} : { environmentRef: value.environmentRef as string }),
    ...(value.sceneRef === undefined ? {} : { sceneRef: value.sceneRef as string }),
    ...(value.shotRef === undefined ? {} : { shotRef: value.shotRef as string }),
    provenance: value.provenance,
  };
}

/**
 * Evaluate one dimension over a caller-declared asset group. Pure:
 * deterministic, no mutation, no model calls, no fetching. Assets declaring
 * the dimension's ref must agree; assets that do not declare it are listed
 * as unresolved (UNKNOWN for them — never a pass, never a fail); an empty
 * declaration set is UNKNOWN for the dimension.
 */
export function evaluateDimension(
  registry: ScorerEntry[],
  scorerId: string,
  group: unknown,
): DimensionResult {
  if (!Array.isArray(registry)) {
    throw new ConsistencyError("CONSISTENCY_INVALID_INPUT", "registry must be an array");
  }
  const scorer = registry.find((e) => e.scorerId === scorerId);
  if (scorer === undefined) {
    throw new ConsistencyError("CONSISTENCY_UNKNOWN_SCORER", `scorer ${scorerId} is not registered`);
  }
  if (!isPlainObject(group)) {
    throw new ConsistencyError("CONSISTENCY_INVALID_INPUT", "group must be an object");
  }
  assertNoViolations(group, "group", new Set());
  for (const key of Object.keys(group)) {
    if (!(GROUP_FIELDS as readonly string[]).includes(key)) {
      throw new ConsistencyError("CONSISTENCY_UNKNOWN_FIELD", `unknown group field ${key}`);
    }
  }
  if (!nonEmpty(group.groupId) || !nonEmpty(group.provenance)) {
    throw new ConsistencyError("CONSISTENCY_INVALID_INPUT", "groupId and provenance must be non-empty");
  }
  if (!Array.isArray(group.assets)) {
    throw new ConsistencyError("CONSISTENCY_INVALID_INPUT", "assets must be an array");
  }
  const assets = (group.assets as unknown[]).map(assertAsset);
  const ids = assets.map((a) => a.assetId);
  if (new Set(ids).size !== ids.length) {
    throw new ConsistencyError("CONSISTENCY_DUPLICATE_ID", "asset ids must be unique within one evaluation");
  }
  const field = DIMENSION_REF_FIELD[scorer.dimension];
  const declared = assets.filter((a) => a[field] !== undefined);
  const unresolved = assets.filter((a) => a[field] === undefined).map((a) => a.assetId).sort();
  if (declared.length === 0) {
    return {
      groupId: group.groupId as string,
      dimension: scorer.dimension,
      scorerId: scorer.scorerId,
      status: "UNKNOWN",
      conflicts: [],
      unresolved,
    };
  }
  const byRef = new Map<string, string[]>();
  for (const asset of [...declared].sort((a, b) => (a.assetId < b.assetId ? -1 : 1))) {
    const ref = asset[field] as string;
    const holders = byRef.get(ref) ?? [];
    holders.push(asset.assetId);
    byRef.set(ref, holders);
  }
  if (byRef.size === 1) {
    const agreedRef = [...byRef.keys()][0] as string;
    return {
      groupId: group.groupId as string,
      dimension: scorer.dimension,
      scorerId: scorer.scorerId,
      status: "CONSISTENT",
      agreedRef,
      conflicts: [],
      unresolved,
    };
  }
  return {
    groupId: group.groupId as string,
    dimension: scorer.dimension,
    scorerId: scorer.scorerId,
    status: "INCONSISTENT",
    conflicts: [...byRef.entries()]
      .map(([ref, assetIds]) => ({ ref, assetIds: [...assetIds].sort() }))
      .sort((a, b) => (a.ref < b.ref ? -1 : 1)),
    unresolved,
  };
}

/**
 * Evaluate every registered dimension over one group, in canonical scorer
 * order. Results are per-dimension only: no universal score is ever emitted.
 */
export function evaluateAll(
  registry: ScorerEntry[],
  group: unknown,
): DimensionResult[] {
  return [...registry]
    .sort((a, b) => (a.scorerId < b.scorerId ? -1 : 1))
    .map((scorer) => evaluateDimension(registry, scorer.scorerId, group));
}
