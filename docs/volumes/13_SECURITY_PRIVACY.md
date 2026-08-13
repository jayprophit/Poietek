# Volume 13 — Security & Privacy

Document ID: `POI-VOL-13`
Edition: `1.0.0`
Primary domains: `DOM-SECURITY`, `DOM-PERMISSIONS`, `DOM-ACCESSIBILITY`

## Security objective

Protect unreleased creative work, identity, contributor/right records, provider
credentials, payments, community safety and platform integrity while preserving
offline agency and data portability. Capability denial or provider outage must
fail safely without corrupting local projects.

## Trust boundaries

Browser UI, service worker, canonical core, local databases/media, native bridge,
plugin/driver processes, local model endpoints, remote APIs, providers, webhooks,
community content and administrator tools are separate trust zones. Data is
validated and authorized whenever it crosses a boundary.

## Controlled requirements

- `SEC-001`: least privilege for browser, native, service and administrative
  capabilities.
- `SEC-002`: no raw provider secrets in browser bundles, logs or project JSON.
- `SEC-003`: authentication plus resource/role authorization for remote access.
- `SEC-004`: tenant and project isolation in data and object storage.
- `SEC-005`: encryption in transit and documented at-rest/key policy.
- `SEC-006`: schema validation, bounded inputs and safe media parsing.
- `SEC-007`: CSRF/XSS/CSP/clickjacking and secure session controls for web.
- `SEC-008`: replay protection, signatures and idempotency for external effects.
- `SEC-009`: plugin, worker, AI tool and render isolation with resource limits.
- `SEC-010`: auditable privileged, rights, publishing and commerce operations.
- `SEC-011`: privacy consent, minimization, purpose, retention, export and delete.
- `SEC-012`: dependency, provenance, SBOM, vulnerability and secret scanning.
- `SEC-013`: backups, recovery, incident response and notification process.
- `SEC-014`: abuse prevention, moderation, reporting, appeals and transparency.

## Privacy model

Default projects, AI context and media are local/private. Remote processing,
sync, publishing, analytics and community visibility require purpose-specific
choice. Settings state what data, destination, retention, cost and withdrawal
apply. Legal/evidence retention exceptions are separated from general account
deletion and explained to authorized users.

## High-sensitivity data

Unreleased media, private messages/comments, identity verification, contracts,
tax/banking information, minors' data, biometrics/voice likeness, provider
credentials and payment/registration receipts require stricter field access,
encryption, masking, audit and retention. AI providers receive only the minimum
authorized context.

## Native, plugin and hardware safety

Native IPC is allowlisted and scoped to approved roots/operations. Plugin scans
and execution are isolated and quarantinable. Hardware/SysEx privileges are
explicit and off by default where risk exists. Device names and messages are
untrusted input. LAN portal exposure is opt-in and visible.

## Community and AI safety

Moderation provides block, mute, report, review, reason, appeal and emergency
paths. AI tools use permission scopes, schema validation, egress gates, prompt
injection defenses, human acceptance and undo. Generated media and identity
features require consent, provenance and applicable safety policy.

## Compliance and assurance

The platform maintains a data inventory, processors/regions, lawful-purpose
review, age/territory policy, accessibility obligations, licence/SBOM records,
risk assessments, penetration testing, recovery rehearsal and incident/security
advisory process. Legal compliance is reviewed by qualified authority and is not
inferred from a checkbox.

## Current status and acceptance

Conservative local/private defaults, browser secret prohibitions, strict claim
validators, provider/native boundaries and least-privilege Tauri scaffold exist.
Production cloud, identity, payment, public community and third-party processing
require full threat model, security testing, tenant isolation, key/backup
operations, privacy/legal review, accessibility assessment and incident drills.
