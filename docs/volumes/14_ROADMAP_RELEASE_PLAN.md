# Volume 14 — Roadmap & Release Plan

Document ID: `POI-VOL-14`
Edition: `1.0.0`
Primary domains: `DOM-ROADMAP`, `DOM-DEVELOPER`

## Delivery policy

Poietek advances through vertical slices with evidence gates. A phase is not
complete because a screen, contract or promotional comparison exists. It exits
only when implementation, tests, recovery, security/accessibility review,
documentation and honest user-facing status agree.

## P0-P10 program

| Phase | Outcome | Exit evidence |
| --- | --- | --- |
| P0 | Controlled source, architecture and repository | Master/14 volumes, status ledger, reproducible build, clean active tree |
| P1 | Trustworthy local creative core | Save/reopen, media, waveform, playback, autosave, undo, recovery and offline tests |
| P2 | Professional audio production | Record/edit/comp/mix/automation/render/export, standards fixtures and large sessions |
| P3 | Sampling, MIDI, hardware and clocking | Canonical programs/tracks, protocols, profiles, measurement and physical matrix |
| P4 | Signed desktop and mobile apps | Native adapters, plugin boundary, install/update/uninstall, permissions and devices |
| P5 | Cross-device collaboration and cloud | Identity, replicas, assets, conflicts, roles, tenant/outage/restore evidence |
| P6 | Rights, registration and publishing | Authority, agreement, receipt, idempotency, correction and legal review |
| P7 | Community, learning, marketplace and commerce | Moderation, privacy, accessibility, licences, settlement and consumer evidence |
| P8 | Video, VFX and cross-modal production | Proxy/edit/sync/caption/colour/VFX/render recovery and performance fixtures |
| P9 | AI, plugins, SDK and developer ecosystem | Consent/tools/evals, sandbox, packages, docs, conformance and compatibility |
| P10 | Certified public operations | Security/privacy/accessibility assessment, SLOs, support, DR and signed releases |

Phases may overlap only where their dependencies and security boundaries permit.
External gates—hardware, licensed SDKs, legal authorities, payment processors,
app stores, signing and independent standards validation—remain explicit.

## Release channels

- Development: internal, synthetic/test data, no compatibility promises.
- Preview: reviewable web build with visible limitations and short-lived data.
- Alpha: selected local workflows, migration/recovery required, no destructive
  automatic upgrade.
- Beta: defined platform/device matrices, support intake and compatibility notes.
- Release candidate: frozen schema/API, full evidence bundle and rollback drill.
- Stable: signed/approved artifacts with support and security lifecycle.
- Long-lived local edition: declared compatibility and migration window.

## Versioning and compatibility

Application, project schema, extension, database, API and SDK versions are related
but independently controlled. Releases publish supported project versions,
migrations, plugin/device/provider matrices, known limitations, deprecations and
export/rollback paths. A new application cannot silently make an older project
irrecoverable.

## Release evidence bundle

Every candidate contains source revision, dependency lock/SBOM/licences,
format/type/test/build results, schema/migrations, browser/platform/device
matrices, performance record, accessibility/security/privacy review, known
limitations, recovery/backup/rollback notes, hashes/signatures/provenance and
updated user/developer documentation.

## Quality gates

- No failing required automated or specialist tests.
- No unresolved critical security/privacy/data-loss issue.
- Project migration and recovery demonstrated.
- Offline behavior verified for local-required workflows.
- Accessibility acceptance for shipped screens/workflows.
- Performance budgets measured on declared profiles.
- Hardware/plugin/provider support backed by evidence.
- LUFS/dBTP, pitch, rights, payment and provenance truth rules preserved.
- Support, incident, rollback and deprecation ownership assigned.

## Current baseline

P0 is now established and P1 has an operational vertical slice. P2 contains real
working editor/mixer/record/render foundations but is not a complete professional
audio release. P3-P9 contain varying contracts, prototypes and safe defaults;
P10 remains a production-operations gate. Exact build truth is maintained in
`../BUILD_STATUS.md` rather than inferred from this roadmap.

## Publication rule

Local commits and verified artifacts may be prepared without publication. GitHub,
package registries, app stores, web hosting, cloud environments and public APIs
are pushed or deployed only with explicit authorization, configured credentials,
release evidence and the appropriate legal/security approval.
