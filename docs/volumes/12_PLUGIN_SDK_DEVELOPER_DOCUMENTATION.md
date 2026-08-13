# Volume 12 — Plugin SDK & Developer Documentation

Document ID: `POI-VOL-12`
Edition: `1.0.0`
Primary domains: `DOM-PLUGIN`, `DOM-SDK`, `DOM-DEVELOPER`

## Developer platform objective

Poietek's developer platform extends the studio without allowing extensions to
silently corrupt projects, escape permissions, invent capability state or make
sessions unrecoverable. Public APIs are versioned, documented and tested against
the canonical schema and command system.

## Extension families

- Project extension schemas and migrations.
- Audio/MIDI processors and instruments.
- Hardware/controller profiles and adapters.
- Storage, sync and provider adapters.
- AI model/tool modules.
- Import/export/interchange adapters.
- Video/VFX processors and render backends.
- UI panels/inspectors using an approved component/command surface.
- Rights, registration, publishing and commerce connectors with evidence rules.

## Plugin standards strategy

Web Audio/worklet modules are the browser path. Native hosting may target CLAP,
VST3, Audio Unit and LV2 where platform/licensing/testing permit. AAX and other
proprietary SDK paths remain explicit external gates. Video/VFX may target an
OpenFX-style boundary. Format names are compatibility standards/trademarks, not
Poietek-owned formats.

## Hosting safety

- Discovery/scanning is isolated, bounded and cancellable.
- Plugin binaries never load in the UI process when isolation is available.
- Crash/timeout/quarantine state is recorded with recovery controls.
- Permissions cover files, network, devices, UI, compute and project commands.
- State chunks/parameters are versioned and size-limited.
- Automation and latency/tail reports are validated.
- Offline render support is declared and tested separately from real time.
- Missing/unsupported plugins preserve identity, parameters and routes with
  bypass, substitute-by-user or freeze/render fallback.

## Planned SDK packages

| Package | Responsibility |
| --- | --- |
| `@poietek/schema` | Project, extension, command and event schemas |
| `@poietek/core` | Pure validators, migrations and supported commands |
| `@poietek/provider-sdk` | Storage/sync/AI/platform capability adapters |
| `@poietek/hardware-sdk` | Profiles, discovery, observations, routing and clock domains |
| `@poietek/media-sdk` | Import/export/render job and derivative contracts |
| `@poietek/ui-sdk` | Approved accessible components and command bindings |
| Native SDK crates/packages | Least-privilege bridge and host contracts by platform |

Package names describe the planned public shape; publication is not claimed.

## API/version policy

Semantic versions, compatibility tables, deprecation windows, feature discovery
and migration guides apply to public packages. Unknown extension versions remain
unsupported but preserved where safe. Breaking project/schema changes require
migration fixtures and a documented rollback/export path.

## Developer workflow

1. Read `README.md`, `ARCHITECTURE.md`, the master specification and relevant
   volume.
2. Install pinned dependencies and run the verified local workflow.
3. Add/change schema and pure behavior before UI or external adapters.
4. Include validation, failure/unavailable states and migration/compatibility.
5. Add unit, contract, integration, security and accessibility evidence.
6. Run `npm run verify` and relevant native/platform checks.
7. Document requirement IDs, limitations and release impact.

## Tooling and documentation

The repository provides formatting, TypeScript, strict core compilation, Node
tests, Vite production/offline build, local/LAN preview, Tauri doctor/build and
mobile initialization commands. Planned developer deliverables include generated
schema, OpenAPI/AsyncAPI, API/SDK reference, examples, fixtures, compatibility
lab, changelog, security advisories and deprecation dashboards.

## Current status and acceptance

Internal public barrels, versioned contracts, validators, fixtures and repeatable
verification are active. No public npm/native SDK release or production native
plugin host is claimed. SDK exit requires stable schemas, package/API docs,
examples, conformance suite, sandbox/crash tests, signing/provenance, compatibility
matrix and support/deprecation policy.
