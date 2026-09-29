# Reference-Grounded Design Rule

Validation that design outputs cite reference IDs plus deltas
(REQ-p29-ref-grounded-design, P29).

Implementation: `src/poietek/design/refGroundedDesign.ts`. Tests:
`tests/ref-grounded-design.test.js` (10 tests, `node --test`, via the
core compile pipeline in `tsconfig.core.json`).

## What it is

`validateGrounding(graphView, output)` checks that every citation in a
design output resolves in the Creative Reference Graph — as a node id or a
recorded edge-target key — and carries explicit deltas (empty means faithful
use; absent is forbidden). Unresolved ids are reported, never passed or
failed: there is no verdict here. Caller-supplied evaluation refs ride along
preserved, never reinterpreted.

## What it is not

- Not generation, routing, visual QA, or reference-grounded generation.
- Not scoring, ranking, approval, authorship, or licence inference.
- Not auto-repair: detection never mutates.
- Not memory, not MAT/Aetherius graph duplication.

## Boundaries

- UNKNOWN != GROUNDED; unresolved citations are reported, not verdicts.
- DUPLICATE CLAIM != CONTRADICTION (identical re-citation collapses;
  differing deltas stay separate rows).
- DECLARED DELTA != OBSERVED DIFFERENCE (deltas are recorded, never verified
  against media).
- Deterministic canonical ordering; no caller mutation; no clock/network.
