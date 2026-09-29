/**
 * REQ-p29-visual-qa: visual QA dimension suite.
 *
 * Registered scope: visual evaluation dimensions (reference/style/character
 * consistency, continuity, AV sync, UI correctness) feeding promotion/eval
 * runners.
 *
 * Six dimensions, exactly as registered — no more, no fewer. Three consume
 * existing units' outputs without reimplementing them; three evaluate
 * caller-declared structures deterministically:
 *
 *   reference-consistency <- ref-grounded-design GroundingReport
 *     (unresolved citations named; never reinterpreted)
 *   style-consistency     <- consistency DimensionResult (status projected
 *     as-is with provenance preserved)
 *   character-consistency <- consistency DimensionResult (same)
 *   continuity            <- declared scene environment vs member shots'
 *     declared environments (no media comparison anywhere)
 *   av-sync               <- declared offset vs declared tolerance
 *     (metadata validation, never media decoding)
 *   ui-correctness        <- declared expected vs observed element state,
 *     field by field (never rendering, never screenshots)
 *
 * VISUAL QA != MULTIMODAL CONSISTENCY: agreement logic lives in the
 * consistency module and is consumed here, never rebuilt. No
 * ScorerRegistry2. VISUAL QA != REFERENCE-GROUNDED DESIGN: citation
 * resolution lives there; this module reads its reports.
 *
 * AUTOMATED VISUAL QA != HUMAN VISUAL APPROVAL. A PASS here means the
 * declared checks held — nothing about beauty, usability, or release
 * fitness. MACHINE CHECK PASS != HUMAN EXPERIENCE PROVEN.
 *
 * NO MODEL JUDGEMENT anywhere: no VLM, no CLIP, no embeddings, no LLM
 * graders. Every result derives from explicit declared data by fixed rules.
 * CONSISTENCY != QUALITY and CHECK RESULTS != UNIVERSAL QUALITY SCORE hold
 * absolutely: results are per-dimension PASS/FAIL/UNKNOWN with explanations;
 * the suite summary counts outcomes (bookkeeping tallies, not a score).
 *
 * EXPECTED vs OBSERVED is always explicit: grounding reports, dimension
 * results, UI element pairs, AV declarations. SOURCE METADATA != RENDERED
 * VISUAL STATE is respected by never claiming media inspection — where only
 * metadata exists, the dimension says what it checked. PARTIAL OBSERVATION
 * != COMPLETE VISUAL PROOF: dimensions report the items they actually
 * evaluated; FRAME QA != VIDEO QA is preserved by evaluating exactly the
 * supplied shot/frame scope, never generalizing.
 *
 * UNKNOWN stays UNKNOWN: missing artifacts, missing refs, and unevaluatable
 * dimensions report UNKNOWN/UNAVAILABLE, never PASS and never FAIL.
 * NOT OBSERVED != OBSERVED FAILURE. QA detects and reports; it never
 * mutates, repairs, generates, approves, or releases:
 *
 *   QA FAILURE != REPAIR EXECUTION
 *   QA RESULT != PROMOTION (promotion/eval runners consume; this module
 *     never promotes, approves, or licenses anything)
 *   REFERENCE MATCH != COPYRIGHT / LICENCE JUDGEMENT
 *
 * Deterministic throughout: canonical ordering, explicit id tie-breaks,
 * scrambled-input equality, no clock, no network, caller data never mutated.
 */

export type QaStatus = "PASS" | "FAIL" | "UNKNOWN";

export type QaDimensionId =
  | "reference-consistency"
  | "style-consistency"
  | "character-consistency"
  | "continuity"
  | "av-sync"
  | "ui-correctness";

export const QA_DIMENSIONS: readonly QaDimensionId[] = [
  "reference-consistency",
  "style-consistency",
  "character-consistency",
  "continuity",
  "av-sync",
  "ui-correctness",
];

/** Minimal shapes consumed from sibling units. Referenced, never redefined. */
export interface GroundingInput {
  unresolved: string[];
}

export interface DimensionInput {
  status: "CONSISTENT" | "INCONSISTENT" | "UNKNOWN";
  agreedRef?: string;
  conflicts?: Array<{ ref: string; assetIds: string[] }>;
  unresolved?: string[];
}

export interface ContinuityGroup {
  sceneId: string;
  /** Declared environment refs of the scene itself (possibly empty). */
  sceneEnvironments: string[];
  shots: Array<{ shotId: string; environmentRefs: string[] }>;
  provenance: string;
}

export interface AvSyncDeclaration {
  declarationId: string;
  audioRef: string;
  videoRef: string;
  /** Declared offset in milliseconds. Sign convention is the caller's. */
  offsetMs: number;
  /** Declared tolerance in milliseconds. Non-negative. */
  maxAllowedOffsetMs: number;
  provenance: string;
}

export interface UiElementCheck {
  elementId: string;
  /** Declared expected state. Flat string map; compared field by field. */
  expected: Record<string, string>;
  /** Observed state, or absent when unobserved. */
  observed?: Record<string, string>;
  provenance: string;
}

export interface QaSuiteInput {
  suiteId: string;
  grounding?: GroundingInput;
  styleResult?: DimensionInput;
  characterResult?: DimensionInput;
  continuityGroups?: ContinuityGroup[];
  avSync?: AvSyncDeclaration[];
  uiElements?: UiElementCheck[];
  provenance: string;
}

export interface DimensionOutcome {
  dimension: QaDimensionId;
  status: QaStatus;
  detail: string;
  evidence: string[];
}

export interface QaSuiteResult {
  suiteId: string;
  outcomes: DimensionOutcome[];
  /** Outcome tallies for runner consumption. Counts, not a quality score. */
  summary: { pass: number; fail: number; unknown: number };
  provenance: string;
}

export type QaProblemCode =
  | "QA_INVALID_INPUT"
  | "QA_UNKNOWN_FIELD"
  | "QA_AUTHORITY_REJECTED"
  | "QA_SECRET_REJECTED"
  | "QA_PERSONALITY_REJECTED";

export class QaError extends Error {
  readonly code: QaProblemCode;
  constructor(code: QaProblemCode, message: string) {
    super(message);
    this.name = "QaError";
    this.code = code;
  }
}

const SUITE_FIELDS = [
  "suiteId", "grounding", "styleResult", "characterResult",
  "continuityGroups", "avSync", "uiElements", "provenance",
] as const;

const GROUP_FIELDS = ["sceneId", "sceneEnvironments", "shots", "provenance"] as const;
const AV_FIELDS = ["declarationId", "audioRef", "videoRef", "offsetMs", "maxAllowedOffsetMs", "provenance"] as const;
const UI_FIELDS = ["elementId", "expected", "observed", "provenance"] as const;

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

function nonEmptyList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(nonEmpty);
}

/**
 * Security-significant violations are diagnosed BEFORE generic shape errors,
 * so a smuggled approval is reported as itself and never disappears into an
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
      throw new QaError("QA_AUTHORITY_REJECTED", `${path}.${key}: QA never carries authority, approval, or scores`);
    }
    if (SECRET_KEYS.includes(key)) {
      throw new QaError("QA_SECRET_REJECTED", `${path}.${key}: SECRET REF != SECRET VALUE`);
    }
    if (PERSONALITY_KEYS.includes(key)) {
      throw new QaError("QA_PERSONALITY_REJECTED", `${path}.${key}: a QA record carries no stored person`);
    }
    assertNoViolations(nested, `${path}.${key}`, seen);
  }
}

function checkDimensionInput(value: unknown, path: string): DimensionInput {
  if (!isPlainObject(value)) {
    throw new QaError("QA_INVALID_INPUT", `${path} must be an object`);
  }
  if (!["CONSISTENT", "INCONSISTENT", "UNKNOWN"].includes(value.status as string)) {
    throw new QaError("QA_INVALID_INPUT", `${path}.status must be CONSISTENT, INCONSISTENT, or UNKNOWN`);
  }
  const out: DimensionInput = { status: value.status as DimensionInput["status"] };
  if (value.agreedRef !== undefined) {
    if (!nonEmpty(value.agreedRef)) {
      throw new QaError("QA_INVALID_INPUT", `${path}.agreedRef must be non-empty when present`);
    }
    out.agreedRef = value.agreedRef;
  }
  if (value.conflicts !== undefined) {
    if (!Array.isArray(value.conflicts)) {
      throw new QaError("QA_INVALID_INPUT", `${path}.conflicts must be an array when present`);
    }
    out.conflicts = (value.conflicts as unknown[]).map((entry, index) => {
      if (!isPlainObject(entry) || !nonEmpty(entry.ref) || !Array.isArray(entry.assetIds) || entry.assetIds.some((id) => !nonEmpty(id))) {
        throw new QaError("QA_INVALID_INPUT", `${path}.conflicts[${index}] needs a non-empty ref and assetIds`);
      }
      return { ref: entry.ref as string, assetIds: [...(entry.assetIds as string[])] };
    });
  }
  if (value.unresolved !== undefined) {
    if (!Array.isArray(value.unresolved) || value.unresolved.some((id) => !nonEmpty(id))) {
      throw new QaError("QA_INVALID_INPUT", `${path}.unresolved must be non-empty strings when present`);
    }
    out.unresolved = [...(value.unresolved as string[])];
  }
  return out;
}

function projectDimension(
  dimension: QaDimensionId,
  result: DimensionInput | undefined,
): DimensionOutcome {
  // Faithful projection of the consistency unit's verdict with provenance
  // preserved: same meaning, QA vocabulary. Nothing reinterpreted.
  if (result === undefined) {
    return { dimension, status: "UNKNOWN", detail: "no evaluation supplied", evidence: [] };
  }
  if (result.status === "CONSISTENT") {
    return {
      dimension,
      status: "PASS",
      detail: result.agreedRef !== undefined ? `agreed on ${result.agreedRef}` : "agreed",
      evidence: [],
    };
  }
  if (result.status === "INCONSISTENT") {
    const conflicts = (result.conflicts ?? [])
      .map((c) => `${c.ref} held by ${[...c.assetIds].sort().join(", ")}`)
      .sort();
    return {
      dimension,
      status: "FAIL",
      detail: conflicts.length > 0 ? `conflicting refs: ${conflicts.join("; ")}` : "conflicting refs",
      evidence: [],
    };
  }
  return {
    dimension,
    status: "UNKNOWN",
    detail: "evaluation unresolved; UNKNOWN != CONSISTENT",
    evidence: [],
  };
}

function checkContinuityGroup(value: unknown, index: number): { failures: string[]; evaluated: boolean } {
  if (!isPlainObject(value)) {
    throw new QaError("QA_INVALID_INPUT", `continuityGroups[${index}] must be an object`);
  }
  for (const key of Object.keys(value)) {
    if (!(GROUP_FIELDS as readonly string[]).includes(key)) {
      throw new QaError("QA_UNKNOWN_FIELD", `unknown continuity group field ${key}`);
    }
  }
  if (!nonEmpty(value.sceneId) || !nonEmpty(value.provenance)) {
    throw new QaError("QA_INVALID_INPUT", `continuityGroups[${index}] needs non-empty sceneId and provenance`);
  }
  if (!Array.isArray(value.sceneEnvironments) || value.sceneEnvironments.some((e) => !nonEmpty(e))) {
    throw new QaError("QA_INVALID_INPUT", `continuityGroups[${index}] sceneEnvironments must be an array of non-empty strings`);
  }
  if (!Array.isArray(value.shots)) {
    throw new QaError("QA_INVALID_INPUT", `continuityGroups[${index}] shots must be an array`);
  }
  const failures: string[] = [];
  let evaluated = false;
  for (const shot of value.shots as unknown[]) {
    if (!isPlainObject(shot) || !nonEmpty(shot.shotId) || !Array.isArray(shot.environmentRefs) || shot.environmentRefs.some((e) => !nonEmpty(e))) {
      throw new QaError("QA_INVALID_INPUT", `continuityGroups[${index}] shots need non-empty shotId and environmentRefs`);
    }
    // A shot is continuous when every environment it declares is among the
    // scene's declared environments. Shots declaring nothing are unevaluated
    // for continuity (UNKNOWN), never failed and never passed.
    const declared = (shot.environmentRefs as string[]).filter((e) => e.length > 0);
    if (declared.length === 0) continue;
    evaluated = true;
    const sceneSet = new Set(value.sceneEnvironments as string[]);
    const stray = declared.filter((e) => !sceneSet.has(e)).sort();
    if (stray.length > 0) {
      failures.push(`shot ${shot.shotId} declares ${stray.join(", ")} outside scene ${(value.sceneId as string)}`);
    }
  }
  return { failures, evaluated };
}

function checkAvSync(value: unknown, index: number): { ok: boolean; evaluated: boolean; detail: string } {
  if (!isPlainObject(value)) {
    throw new QaError("QA_INVALID_INPUT", `avSync[${index}] must be an object`);
  }
  for (const key of Object.keys(value)) {
    if (!(AV_FIELDS as readonly string[]).includes(key)) {
      throw new QaError("QA_UNKNOWN_FIELD", `unknown av-sync field ${key}`);
    }
  }
  if (!nonEmpty(value.declarationId) || !nonEmpty(value.audioRef) || !nonEmpty(value.videoRef) || !nonEmpty(value.provenance)) {
    throw new QaError("QA_INVALID_INPUT", `avSync[${index}] needs non-empty declarationId, audioRef, videoRef, provenance`);
  }
  if (typeof value.offsetMs !== "number" || !Number.isFinite(value.offsetMs)) {
    throw new QaError("QA_INVALID_INPUT", `avSync[${index}] offsetMs must be a finite number`);
  }
  if (typeof value.maxAllowedOffsetMs !== "number" || !Number.isFinite(value.maxAllowedOffsetMs) || (value.maxAllowedOffsetMs as number) < 0) {
    throw new QaError("QA_INVALID_INPUT", `avSync[${index}] maxAllowedOffsetMs must be a non-negative finite number`);
  }
  // Declared metadata only: no media is decoded here, so this checks the
  // declaration against its own tolerance, nothing more.
  const ok = Math.abs(value.offsetMs as number) <= (value.maxAllowedOffsetMs as number);
  return {
    ok,
    evaluated: true,
    detail: `${value.declarationId}: |${value.offsetMs}|ms vs tolerance ${(value.maxAllowedOffsetMs as number)}ms`,
  };
}

function checkUiElement(value: unknown, index: number): { status: QaStatus; detail: string } {
  if (!isPlainObject(value)) {
    throw new QaError("QA_INVALID_INPUT", `uiElements[${index}] must be an object`);
  }
  for (const key of Object.keys(value)) {
    if (!(UI_FIELDS as readonly string[]).includes(key)) {
      throw new QaError("QA_UNKNOWN_FIELD", `unknown ui-element field ${key}`);
    }
  }
  if (!nonEmpty(value.elementId) || !nonEmpty(value.provenance)) {
    throw new QaError("QA_INVALID_INPUT", `uiElements[${index}] needs non-empty elementId and provenance`);
  }
  if (!isPlainObject(value.expected)) {
    throw new QaError("QA_INVALID_INPUT", `uiElements[${index}] expected must be an object`);
  }
  for (const [k, v] of Object.entries(value.expected as Record<string, unknown>)) {
    if (typeof v !== "string") {
      throw new QaError("QA_INVALID_INPUT", `uiElements[${index}] expected values must be strings`);
    }
    void k;
  }
  if (value.observed === undefined) {
    return { status: "UNKNOWN", detail: `${value.elementId}: unobserved; NOT OBSERVED != OBSERVED FAILURE` };
  }
  if (!isPlainObject(value.observed)) {
    throw new QaError("QA_INVALID_INPUT", `uiElements[${index}] observed must be an object when present`);
  }
  const mismatches: string[] = [];
  for (const field of Object.keys(value.expected as Record<string, unknown>).sort()) {
    const expected = (value.expected as Record<string, string>)[field]!;
    const observed = (value.observed as Record<string, unknown>)[field];
    if (observed !== expected) {
      mismatches.push(`${field}: expected ${expected}, observed ${typeof observed === "string" ? observed : "absent"}`);
    }
  }
  if (mismatches.length === 0) {
    return { status: "PASS", detail: `${value.elementId}: all declared fields match` };
  }
  return { status: "FAIL", detail: `${value.elementId}: ${mismatches.join("; ")}` };
}

/**
 * Evaluate the six registered dimensions over caller-declared inputs plus
 * consumed grounding/consistency outputs. Pure + deterministic: same inputs
 * always yield the same suite. Reads everything, mutates nothing, generates
 * nothing, approves nothing.
 */
export function evaluateVisualQa(input: unknown): QaSuiteResult {
  if (!isPlainObject(input)) {
    throw new QaError("QA_INVALID_INPUT", "QA suite input must be an object");
  }
  assertNoViolations(input, "input", new Set());
  for (const key of Object.keys(input)) {
    if (!(SUITE_FIELDS as readonly string[]).includes(key)) {
      throw new QaError("QA_UNKNOWN_FIELD", `unknown suite field ${key}`);
    }
  }
  if (!nonEmpty(input.suiteId) || !nonEmpty(input.provenance)) {
    throw new QaError("QA_INVALID_INPUT", "suiteId and provenance must be non-empty");
  }
  const outcomes: DimensionOutcome[] = [];

  // Reference consistency: unresolved grounding citations named, verbatim.
  const grounding = input.grounding as { unresolved?: unknown } | undefined;
  if (grounding === undefined) {
    outcomes.push({ dimension: "reference-consistency", status: "UNKNOWN", detail: "no grounding report supplied", evidence: [] });
  } else {
    if (!isPlainObject(grounding) || !Array.isArray(grounding.unresolved) || grounding.unresolved.some((u) => !nonEmpty(u))) {
      throw new QaError("QA_INVALID_INPUT", "grounding.unresolved must be an array of non-empty strings");
    }
    const unresolved = [...(grounding.unresolved as string[])].sort();
    outcomes.push(
      unresolved.length === 0
        ? { dimension: "reference-consistency", status: "PASS", detail: "every citation resolved", evidence: [] }
        : { dimension: "reference-consistency", status: "FAIL", detail: `unresolved citations: ${unresolved.join(", ")}`, evidence: unresolved },
    );
  }

  outcomes.push(projectDimension("style-consistency", input.styleResult === undefined ? undefined : checkDimensionInput(input.styleResult, "styleResult")));
  outcomes.push(projectDimension("character-consistency", input.characterResult === undefined ? undefined : checkDimensionInput(input.characterResult, "characterResult")));

  const groups = input.continuityGroups === undefined ? [] : input.continuityGroups;
  if (!Array.isArray(groups)) {
    throw new QaError("QA_INVALID_INPUT", "continuityGroups must be an array when present");
  }
  const continuityFailures: string[] = [];
  let continuityEvaluated = false;
  groups.forEach((group, index) => {
    const result = checkContinuityGroup(group, index);
    continuityEvaluated = continuityEvaluated || result.evaluated;
    continuityFailures.push(...result.failures);
  });
  continuityFailures.sort();
  outcomes.push(
    groups.length === 0 || !continuityEvaluated
      ? { dimension: "continuity", status: "UNKNOWN", detail: "no evaluatable shot declarations supplied", evidence: [] }
      : continuityFailures.length === 0
        ? { dimension: "continuity", status: "PASS", detail: "every declared shot environment sits inside its scene", evidence: [] }
        : { dimension: "continuity", status: "FAIL", detail: continuityFailures.join("; "), evidence: [] },
  );

  const avSync = input.avSync === undefined ? [] : input.avSync;
  if (!Array.isArray(avSync)) {
    throw new QaError("QA_INVALID_INPUT", "avSync must be an array when present");
  }
  const avFailures: string[] = [];
  avSync.forEach((declaration, index) => {
    const result = checkAvSync(declaration, index);
    if (!result.ok) avFailures.push(result.detail);
  });
  avFailures.sort();
  outcomes.push(
    avSync.length === 0
      ? { dimension: "av-sync", status: "UNKNOWN", detail: "no AV declarations supplied", evidence: [] }
      : avFailures.length === 0
        ? { dimension: "av-sync", status: "PASS", detail: "every declared offset sits inside its tolerance", evidence: [] }
        : { dimension: "av-sync", status: "FAIL", detail: avFailures.join("; "), evidence: [] },
  );

  const uiElements = input.uiElements === undefined ? [] : input.uiElements;
  if (!Array.isArray(uiElements)) {
    throw new QaError("QA_INVALID_INPUT", "uiElements must be an array when present");
  }
  const uiResults = (uiElements as unknown[]).map((element, index) => checkUiElement(element, index));
  const uiFails = uiResults.filter((r) => r.status === "FAIL").map((r) => r.detail).sort();
  const uiSawAnyObserved = uiResults.some((r) => r.status !== "UNKNOWN");
  outcomes.push(
    uiElements.length === 0 || !uiSawAnyObserved
      ? { dimension: "ui-correctness", status: "UNKNOWN", detail: "no observed UI state supplied", evidence: [] }
      : uiFails.length === 0
        ? { dimension: "ui-correctness", status: "PASS", detail: "every observed field matches its declaration", evidence: [] }
        : { dimension: "ui-correctness", status: "FAIL", detail: uiFails.join("; "), evidence: [] },
  );

  const summary = {
    pass: outcomes.filter((o) => o.status === "PASS").length,
    fail: outcomes.filter((o) => o.status === "FAIL").length,
    unknown: outcomes.filter((o) => o.status === "UNKNOWN").length,
  };
  return {
    suiteId: input.suiteId as string,
    outcomes,
    summary,
    provenance: input.provenance as string,
  };
}
