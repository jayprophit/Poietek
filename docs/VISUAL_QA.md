# Visual QA Dimension Suite

Visual evaluation dimensions feeding promotion/eval runners
(REQ-p29-visual-qa, P29).

Implementation: `src/poietek/qa/visualQa.ts`. Tests:
`tests/visual-qa.test.js` (17 tests, `node --test`, via the core compile
pipeline in `tsconfig.core.json`).

## What it is

`evaluateVisualQa()` evaluates six registered dimensions —
reference-consistency, style-consistency, character-consistency, continuity,
av-sync, ui-correctness — and returns per-dimension PASS/FAIL/UNKNOWN
outcomes plus outcome tallies for runner consumption.

Three dimensions consume existing units without reimplementing them:
reference-consistency reads ref-grounded-design grounding reports;
style/character consistency project multimodal-consistency dimension
results faithfully. Three evaluate caller-declared structures
deterministically: continuity (shot environments inside scene
environments), av-sync (declared offset vs declared tolerance), and
ui-correctness (declared expected vs observed element state, field by
field).

## What it is not

- Not generation, routing, visual inspection by model, or auto-repair.
- Not scores, ranking, approval, authorship, or licence judgement.
- Not memory, not MAT/Aetherius graph duplication.

## Boundaries

- AUTOMATED VISUAL QA != HUMAN VISUAL APPROVAL.
- UNKNOWN stays UNKNOWN; missing artifacts never pass or fail.
- EXPECTED vs OBSERVED always explicit; SOURCE METADATA != RENDERED STATE.
- PARTIAL OBSERVATION != COMPLETE PROOF; FRAME QA != VIDEO QA.
- No model judgement anywhere; deterministic canonical ordering; no caller
  mutation; no clock/network.
