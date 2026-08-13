# Volume 10 — Database & API Specification

Document ID: `POI-VOL-10`
Edition: `1.0.0`
Primary domains: `DOM-DATA`, `DOM-API`

## Source of data truth

The versioned `PoietekProject` is the portable creative document. Local
repositories are the primary edit store. Remote relational tables are searchable
projections, coordination state and platform records; they do not replace the
project format. Large media bytes remain in content-addressed asset storage.

## Canonical project areas

- Identity, title, schema version, created/updated timestamps and preferences.
- Tempo and time-signature maps.
- Tracks, clips and mixer state.
- Asset metadata and content hashes.
- Markers, contributors and metadata as schemas mature.
- Versioned extensions for recovery, hardware, creative OS, collaboration,
  rights, community and later domains.

Runtime handles, decoded buffers, streams, MIDI ports, native handles, provider
clients and raw secrets are prohibited.

## Local stores

| Store | Purpose |
| --- | --- |
| Projects | Validated project snapshots and revision metadata |
| Assets | Media manifests and IndexedDB fallback bytes |
| Waveforms/indexes | Rebuildable derived data |
| Recovery | Unsaved checkpoints and resolution state |
| Settings/profiles | Versioned global preferences and portable named profiles |
| Changes/outbox | Local collaboration envelopes and remote acknowledgement state |
| Replicas | Device/provider cursors and conflict metadata |
| AI records | Consent, provider configuration references, provenance and accepted actions |
| Audit | Security/platform evidence subject to policy and retention |

## Remote relational areas

Identity/users, organisations/memberships, projects/roles, replicas/changes,
asset manifests/objects, invitations/comments/reviews, contributor passports,
split proposals/acceptances, rights evidence/agreements, release candidates,
registrations/receipts, profiles/posts/media/moderation, listings/licences/orders,
royalty statements, consents/provider jobs/webhooks and append-only audit events.
Every tenant-owned row carries organization/project authority and policy indexes.

## Internal commands and events

Commands include project create/open/save, asset import, track/clip edits,
transport intent, recording, render/export, recovery, settings, collaboration,
rights, release and AI proposal/acceptance. Events state completed local facts or
observed external facts and include stable IDs, schema version, project/actor,
timestamp, correlation/causation and payload. Events never assert unobserved
external outcomes.

## Remote API conventions

- Versioned HTTPS resource/command endpoints plus secure realtime channels.
- Strong authentication and per-resource authorization.
- JSON-schema validation at ingress/egress.
- Idempotency keys for changes, uploads, registrations, orders and webhooks.
- Cursor pagination, filtering and bounded payloads.
- Structured error code, message, retryability, field issues, correlation ID and
  safe details.
- ETag/revision or change-base checks for concurrency.
- Rate limit/quota headers without leaking tenant information.
- Audit and consent reference for sensitive actions.

## Native bridge API

Native commands are separately versioned and allowlisted for narrow operations:
dialogs, approved filesystem roots, secure credentials, explicit device adapters,
plugin scan/host isolation and installer/update tasks. Arbitrary shell execution
or broad filesystem access is not part of the public bridge.

## Webhooks and external adapters

Inbound webhooks require signature, timestamp/replay checks, schema version,
idempotent processing and evidence storage. Polling adapters apply equivalent
authority/reference rules. External status becomes accepted, settled or anchored
only from a configured authoritative response.

## Migrations, retention and deletion

Migrations are versioned, deterministic and tested from supported historical
fixtures. Backward compatibility and deprecation windows are documented. Project
deletion, remote erasure, legal/evidence retention, backup expiry and public
withdrawal are distinct workflows with receipts and exceptions.

## Current status and acceptance

Canonical schema/validation, local project/assets/settings/recovery persistence,
versioned extensions, internal core contracts and provider interfaces are
operational or foundational. The remote relational platform and public APIs are
blueprints, not running services. Detailed tables/routes live in
`../PLATFORM_DATA_API_SECURITY_BLUEPRINT.md`; production requires schema,
migration, API contract, authz, tenant, load, webhook and restore tests.
