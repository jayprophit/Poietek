# Volume 09 — Cloud & Synchronisation

Document ID: `POI-VOL-09`
Edition: `1.0.0`
Primary domains: `CAP-13`, `DOM-CLOUD`, `DOM-SECURITY`

## Principle

Cloud is optional infrastructure for sync, backup, collaboration, provider AI,
rendering and public platform features. A cloud account or connection is not a
prerequisite for local project creation, editing, recording, playback, export or
recovery.

## Provider-neutral service model

The platform router exposes capabilities rather than provider objects. Supabase,
Firebase or another approved implementation can supply identity, relational data,
realtime signals, object storage or functions behind adapters. Canonical project
JSON, commands, rights states and SDKs do not contain provider-specific types.

## Synchronisation protocol

- Stable project, replica, actor and change identifiers.
- Ordered, validated change envelopes with base revision/vector information.
- Durable local outbox before network transfer.
- Resumable content-addressed asset upload/download with checksum verification.
- Idempotent remote append and acknowledgement separate from local success.
- Snapshot/compaction rules that preserve auditable history.
- Conflict categories with deterministic merge or explicit human resolution.
- Cursors and retry state per replica/provider.

## Storage classes

1. Local project database and settings.
2. Local primary media store (OPFS/browser or configured native storage).
3. Recovery checkpoints and local cache/indexes.
4. Optional encrypted remote project replicas.
5. Optional content-addressed object media and derivatives.
6. Public/community media only after authorized publishing.
7. Backups with declared region, retention, restore and deletion policy.

## Connectivity states

Offline, metered, constrained, captive/unauthenticated, online, degraded and
provider-unavailable states affect transfer policy but never rewrite creative
truth. Users can pause sync, choose Wi-Fi-only behavior, inspect queues/conflicts,
retry, remove a replica and export their portable data.

## Encryption and credentials

Traffic uses authenticated encryption. Server-side storage, key management and
backup encryption are documented per environment. Sensitive client credentials
use secure native storage or server-side proxies; browser bundles contain no
provider secrets. End-to-end encrypted features require explicit key recovery,
sharing and loss behavior rather than vague claims.

## Resilience and operations

Services define service objectives, health, queues, dead-letter handling,
backpressure, rate limits, quotas, regional availability, backups, point-in-time
restore, restore rehearsal, incident response, data export and provider exit.
Local-only continuation is part of every provider outage plan.

## Local workstation capacity

The one-terabyte local edition is a deployment/storage profile, not an assumed
device capability. Import, record, sync and render check actual free space,
browser quota/persistence, configured media roots, cache budgets and cleanup
policy before writing.

## Current status and acceptance

Local repositories, OPFS/IndexedDB asset fallback, provider capability routing,
Supabase/Firebase foundations, serializable replica/change contracts and offline
deployment states exist. No authenticated production sync, encrypted remote
asset pipeline, conflict transport or public cloud deployment is claimed.
Acceptance requires outage, replay, idempotency, conflict, quota, encryption,
tenant-isolation, backup/restore and provider-migration tests.
