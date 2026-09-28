# Creative Reference Graph

Reference-linked creative project graph (REQ-p29-creative-ref-graph, P29):
style/character/environment refs to scenes/shots over canonical project
truth (PoietekProject/Asset in `src/poietek/domain/types.ts`).

Implementation: `src/poietek/refs/creativeRefGraph.ts`. Tests:
`tests/creative-ref-graph.test.js` (19 tests, `node --test`, via the core
compile pipeline in `tsconfig.core.json`).

## What it is

Nodes are scenes and shots with stable ids in a project. Edges are typed
refs — `STYLE_REF`, `CHARACTER_REF`, `ENVIRONMENT_REF` — from a scene/shot
to a target: another scene/shot (must exist), a canonical asset (opaque
`assetRef`, never expanded), or an external `{source, ref}` (recorded, never
fetched). Queries: `refsFor`, `referencedBy`, `nodesInProject`, and bounded
cycle-safe deterministic `traverse` over node-to-node edges.

## What it is not

- Not an asset store: edges carry refs, never audio/images/project files.
- Not arrangement: DAW tracks/clips have no representation here.
- Not authorship or licence: references confer neither.
- Not generation: no edge copies, renders, clones, or generates anything.
- Not memory, not MAT Epistemic Graph, not Aetherius EvidenceGraph.
- No similarity inference, no model arbitration, no scores, no ranking,
  no cascade deletes, no removal API at all.

## Boundaries

- REFERENCE != COPY; EXTERNAL REF REGISTERED != EXTERNAL CONTENT INGESTED.
- SAME TEXT != SAME SOURCE (provenance decides identity, not wording).
- DUPLICATE != CONTRADICTION (contradictions are never merged).
- UNKNOWN REF != EMPTY ASSET (unknown scene/shot targets rejected).
- Edge identity is (from, relation, target); identical re-registration is
  idempotent, changed provenance conflicts.
- Graphs are caller-held plain data; operations return new collections and
  never mutate inputs. No clock, no network.
