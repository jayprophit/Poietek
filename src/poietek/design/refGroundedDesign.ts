/**
 * REQ-p29-ref-grounded-design: reference-grounded design rule.
 *
 * Registered scope: design outputs cite reference IDs plus deltas; composes
 * with the creative graph and consistency dimensions.
 *
 * This is a VALIDATION RULE, not a generator, router, scorer, or QA gate: a
 * design output is grounded iff every cited reference resolves in the
 * creative reference graph and every citation carries its deltas explicitly.
 * The rule reads traces and reports; it writes nothing, generates nothing,
 * repairs nothing:
 *
 *   GROUNDING VALIDATION != GENERATION
 *   INCONSISTENCY DETECTED != INCONSISTENCY FIXED
 *
 * Composition, not duplication:
 * - Creative Reference Graph (`../refs/creativeRefGraph`): citations resolve
 *   against graph node ids and recorded edge targets. REFERENCE GRAPH !=
 *   REFERENCE-GROUNDED DESIGN EXECUTION — the graph owns relationships;
 *   this rule owns grounding validity.
 * - Consistency dimensions (`../consistency/multimodalConsistency`): caller-
 *   supplied evaluation ids ride along as opaque `evaluationRefs`, preserved
 *   and never reinterpreted. Existing dimension results are never broadened
 *   into reference-grounded meaning beyond their own contracts.
 * - Generation routing, visual QA, reference-grounded generation: separate
 *   owners or unregistered; untouched here.
 *
 * A citation is `{ referenceId, deltas, provenance }` where deltas is an
 * explicit array — possibly empty for faithful use — never an absent field:
 * an absent delta list would let "no changes" and "changes unstated" look
 * identical. Each delta is a caller-declared string describing what differs
 * from the cited reference; deltas are recorded, never verified against
 * media (DECLARED DELTA != OBSERVED DIFFERENCE).
 *
 * Resolution has exactly two honest outcomes per citation: resolved (as a
 * graph node, or as a recorded edge target) or UNRESOLVED with the id named.
 * Unknown is never a pass and never a fail — it is reported:
 *
 *   UNKNOWN != GROUNDED
 *   UNRESOLVED CITATION != FAILED DESIGN (no verdict is emitted at all)
 *
 * No verdicts, no scores, no ranking, no approval: the report states which
 * citations resolve and which do not. CONSISTENCY != APPROVAL applies here
 * as GROUNDING != APPROVAL. No authorship/licence inference
 * (REFERENCE != AUTHORSHIP, REFERENCE != LICENCE). No memory, no fetching,
 * no model calls, no network.
 *
 * Deterministic throughout: canonical ordering, explicit id tie-breaks,
 * scrambled-input equality, no clock, caller data never mutated.
 */

export type GroundingProblemCode =
  | "GROUNDING_INVALID_INPUT"
  | "GROUNDING_UNKNOWN_FIELD"
  | "GROUNDING_AUTHORITY_REJECTED"
  | "GROUNDING_SECRET_REJECTED"
  | "GROUNDING_PERSONALITY_REJECTED";

export class GroundingError extends Error {
  readonly code: GroundingProblemCode;
  constructor(code: GroundingProblemCode, message: string) {
    super(message);
    this.name = "GroundingError";
    this.code = code;
  }
}

export interface GroundingCitation {
  /** Canonical ref: a graph node id or a recorded edge-target key. */
  referenceId: string;
  /** Explicit differences from the cited reference; empty means faithful use. */
  deltas: string[];
  provenance: string;
}

export interface DesignOutput {
  outputId: string;
  citations: GroundingCitation[];
  /** Opaque evaluation ids (e.g. consistency groups), preserved verbatim. */
  evaluationRefs: string[];
  provenance: string;
}

export interface CitationReport {
  referenceId: string;
  resolved: boolean;
  /** How the reference resolved, when it did. */
  resolvedAs?: "node" | "edge-target";
  deltas: string[];
  provenance: string;
}

export interface GroundingReport {
  outputId: string;
  citations: CitationReport[];
  /** Cited ids that resolved nowhere. Reported, never a verdict. */
  unresolved: string[];
  evaluationRefs: string[];
  provenance: string;
}

const OUTPUT_FIELDS = ["outputId", "citations", "evaluationRefs", "provenance"] as const;
const CITATION_FIELDS = ["referenceId", "deltas", "provenance"] as const;

const AUTHORITY_KEYS = [
  "authorized", "approved", "canExecute", "canDeploy", "permission",
  "permissionGranted", "grantApproved", "policyBypass", "ownerOverride",
  "mergeAuthority", "score", "grade", "rating", "verdict",
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
 * unknown-field complaint.
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
      throw new GroundingError("GROUNDING_AUTHORITY_REJECTED", `${path}.${key}: grounding never carries authority, approval, or scores`);
    }
    if (SECRET_KEYS.includes(key)) {
      throw new GroundingError("GROUNDING_SECRET_REJECTED", `${path}.${key}: SECRET REF != SECRET VALUE`);
    }
    if (PERSONALITY_KEYS.includes(key)) {
      throw new GroundingError("GROUNDING_PERSONALITY_REJECTED", `${path}.${key}: a design record carries no stored person`);
    }
    assertNoViolations(nested, `${path}.${key}`, seen);
  }
}

function assertCitation(value: unknown, index: number): GroundingCitation {
  if (!isPlainObject(value)) {
    throw new GroundingError("GROUNDING_INVALID_INPUT", `citations[${index}] must be an object`);
  }
  assertNoViolations(value, `citations[${index}]`, new Set());
  for (const key of Object.keys(value)) {
    if (!(CITATION_FIELDS as readonly string[]).includes(key)) {
      throw new GroundingError("GROUNDING_UNKNOWN_FIELD", `unknown citation field ${key}`);
    }
  }
  if (!nonEmpty(value.referenceId)) {
    throw new GroundingError("GROUNDING_INVALID_INPUT", `citations[${index}] needs a non-empty referenceId`);
  }
  if (!Array.isArray(value.deltas) || value.deltas.some((d) => !nonEmpty(d))) {
    throw new GroundingError(
      "GROUNDING_INVALID_INPUT",
      `citations[${index}] deltas must be an array of non-empty strings (empty means faithful use, absent is forbidden)`,
    );
  }
  if (!nonEmpty(value.provenance)) {
    throw new GroundingError("GROUNDING_INVALID_INPUT", `citations[${index}] provenance must be non-empty`);
  }
  return {
    referenceId: value.referenceId,
    deltas: [...(value.deltas as string[])].sort(),
    provenance: value.provenance,
  };
}

export interface RefGraphView {
  nodeIds: string[];
  /** Canonical edge-target keys recorded in the graph. */
  edgeTargetKeys: string[];
}

/**
 * Validate that a design output is grounded: every citation resolves in the
 * reference graph (as a node id or a recorded edge-target key) and carries
 * explicit deltas. Pure + deterministic: same output and graph view always
 * yield the same report. The graph is read, never written; the output is
 * read, never repaired.
 */
export function validateGrounding(graph: RefGraphView, input: unknown): GroundingReport {
  if (!isPlainObject(graph) || !Array.isArray(graph.nodeIds) || !Array.isArray(graph.edgeTargetKeys)) {
    throw new GroundingError("GROUNDING_INVALID_INPUT", "graph view must carry nodeIds and edgeTargetKeys arrays");
  }
  if (!isPlainObject(input)) {
    throw new GroundingError("GROUNDING_INVALID_INPUT", "design output must be an object");
  }
  assertNoViolations(input, "output", new Set());
  for (const key of Object.keys(input)) {
    if (!(OUTPUT_FIELDS as readonly string[]).includes(key)) {
      throw new GroundingError("GROUNDING_UNKNOWN_FIELD", `unknown design output field ${key}`);
    }
  }
  if (!nonEmpty(input.outputId)) {
    throw new GroundingError("GROUNDING_INVALID_INPUT", "outputId must be a non-empty stable id");
  }
  if (!nonEmpty(input.provenance)) {
    throw new GroundingError("GROUNDING_INVALID_INPUT", "provenance must be a non-empty string");
  }
  if (!Array.isArray(input.citations)) {
    throw new GroundingError("GROUNDING_INVALID_INPUT", "citations must be an array");
  }
  const citations = (input.citations as unknown[]).map(assertCitation);
  const evaluationRefs = input.evaluationRefs === undefined ? [] : input.evaluationRefs;
  if (!Array.isArray(evaluationRefs) || evaluationRefs.some((r) => !nonEmpty(r))) {
    throw new GroundingError("GROUNDING_INVALID_INPUT", "evaluationRefs must be an array of non-empty strings when present");
  }
  const nodes = new Set(graph.nodeIds);
  const targets = new Set(graph.edgeTargetKeys);
  const seenRefs = new Set<string>();
  const reports: CitationReport[] = [];
  const unresolved: string[] = [];
  for (const citation of [...citations].sort((a, b) => (a.referenceId < b.referenceId ? -1 : 1))) {
    if (seenRefs.has(citation.referenceId)) {
      // Same reference cited twice with identical content collapses to one
      // report row; differing deltas stay as separate rows because they say
      // different things. DUPLICATE CLAIM != CONTRADICTION either way.
      const prior = reports.find((r) => r.referenceId === citation.referenceId);
      if (prior !== undefined && JSON.stringify(prior.deltas) === JSON.stringify(citation.deltas)) continue;
    }
    seenRefs.add(citation.referenceId);
    if (nodes.has(citation.referenceId)) {
      reports.push({ referenceId: citation.referenceId, resolved: true, resolvedAs: "node", deltas: citation.deltas, provenance: citation.provenance });
    } else if (targets.has(citation.referenceId)) {
      reports.push({ referenceId: citation.referenceId, resolved: true, resolvedAs: "edge-target", deltas: citation.deltas, provenance: citation.provenance });
    } else {
      reports.push({ referenceId: citation.referenceId, resolved: false, deltas: citation.deltas, provenance: citation.provenance });
      unresolved.push(citation.referenceId);
    }
  }
  return {
    outputId: input.outputId as string,
    citations: reports,
    unresolved: [...unresolved].sort(),
    evaluationRefs: [...(evaluationRefs as string[])].sort(),
    provenance: input.provenance as string,
  };
}
