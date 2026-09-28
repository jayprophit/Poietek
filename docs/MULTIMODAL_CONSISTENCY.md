# Multimodal Consistency Dimensions

Consistency dimensions across generated assets as scorer-registry entries,
never a universal score (REQ-p29-multimodal-consistency, P29).

Implementation: `src/poietek/consistency/multimodalConsistency.ts`. Tests:
`tests/multimodal-consistency.test.js` (17 tests, `node --test`, via the
core compile pipeline in `tsconfig.core.json`).

## What it is

A scorer registry holding one entry per registered dimension —
`character-consistency`, `style-consistency`, `environment-consistency` —
grounded in the Creative Reference Graph's relation vocabulary. `evaluateDimension`
checks declared canonical refs across a caller-declared asset group:
agreement is CONSISTENT, disagreement is INCONSISTENT with every side
preserved, absence is UNKNOWN (never a pass, never a fail). `evaluateAll`
runs every dimension; results stay per-dimension, never blended.

## What it is not

- Not generation, routing, visual QA, or reference-grounded design.
- Not similarity, embeddings, or model judgment of any kind.
- Not authorship or licence inference; not approval of anything.
- Not scores, ranking, auto-repair, memory, or MAT/Aetherius graph
  duplication.

## Boundaries

- CONSISTENCY != SIMILARITY; SAME LOOK != SAME CANONICAL CHARACTER.
- DECLARED REF != OBSERVED MEDIA FACT (no media observation exists here).
- UNKNOWN != CONSISTENT; NO CONTRADICTION OBSERVED != CONSISTENCY PROVEN.
- CONFLICT != AUTOMATIC RESOLUTION; INCONSISTENCY DETECTED != FIXED.
- SAME REFERENCE SET != SAME ASSET (no dedup across assets).
- ASSET ID != LATEST ASSET VERSION (versions ride opaquely).
- Deterministic canonical ordering; no caller mutation; no clock/network.
