# AGENTS.md — Poietek Engineering Rules

This repository is being migrated from the SDS concept prototype into Poietek, a
local-first cross-platform creative production system.

## Source of truth

Priority order:

1. Current checked-out code for actual implementation facts.
2. `DEVIN_START_HERE.md` and this file for working rules.
3. Latest Poietek Master Development Library v3.1 for product/architecture intent.
4. Latest Poietek Implementation Build v3.1 for current implementation direction.
5. Older Poietek ZIPs only for historical reference.

When code and specification disagree, identify the conflict explicitly. Do not
silently invent behavior.

## Preserve

Keep and progressively migrate the useful SDS UX:
- rack metaphor;
- front/rear patching;
- cascading/navigation menus;
- detachable/floating workspaces;
- hardware-centric views;
- templates;
- walkthrough/learning affordances.

Do not preserve architectural mistakes merely to preserve UI.

## Core architecture

Durable creative truth must not live only in React component state.

Use:
- canonical serializable `PoietekProject`;
- ProjectRepository;
- AssetStore;
- ProjectSession / command history;
- TimelineEngine / transport;
- AudioBackend;
- MidiBackend;
- Device/Console adapter layers;
- provider capability routing;
- local-first persistence;
- versioned schemas.

No serialized `AudioBuffer`, `MIDIPort`, DOM object or native runtime handle.

## Local-first rule

A local durable commit is the user's immediate success condition.
Cloud synchronization is asynchronous.

The creative editor must remain useful if:
- Supabase is unavailable;
- Firebase is unavailable;
- AI is disabled;
- the internet is unavailable;
- a blockchain provider is unavailable.

## Cloud/provider strategy

Use multiple providers by capability, not duplicate databases blindly.

Preferred direction:
- Local/OPFS/native filesystem: canonical media/project durability.
- Supabase: primary hosted application data candidate.
- Firebase: optional complementary services such as selected hosting/notifications/
  telemetry/distribution roles.
- BYOC/provider adapters: storage/media/model/compute services.

Users should not need separate third-party accounts for Poietek infrastructure
unless the external service legally/operationally requires the user's own account.

## Audio correctness

Never fake:
- LUFS using RMS;
- True Peak using sample peak;
- time-preserving A432/A440 playback with `playbackRate`;
- sample-accurate clock with UI timers.

Real-time audio work must avoid allocations/network/database calls on the realtime
thread.

## Tuning

Support A440, A432 and other reference pitches, historical temperaments, just
intonation, Scala/custom microtuning.

Creator original tuning is preserved.
Community player tuning is a derivative playback experience.
External destinations only retune when their actual target profile explicitly
requires it.

## Rights / royalties / provenance

Blockchain is optional evidence infrastructure, not copyright law.

Never:
- put private bank/tax/society credentials on a public chain;
- let AI invent ownership/splits;
- mark external registrations accepted merely because they were submitted.

Contributor approvals and rights versions must remain auditable.

## Hardware / consoles

Use documented capability negotiation.
Do not claim an analogue control is synchronized unless telemetry/control actually
exists.
Separate audio transport, sample clock, control state, metering and transport/timecode.

## AI

AI should consume deterministic measurements and structured project state.
AI changes must be represented as previewable/undoable commands where practical.

The user must be able to work with AI off.

## Cross-platform

Shared logical project format:
Web/PWA
Windows
macOS
Linux
iOS/iPadOS
Android.

Do not promise identical runtime capability.
Unsupported plugins/devices preserve state and use freeze/render/fallback where possible.

## Quality

No "5-star" claim is manually assigned.
Evidence must come from automated tests, benchmarks, real device/platform tests and
user validation.

## Git workflow

Before implementation:
- reproduce baseline;
- run typecheck/build;
- record existing failures.

Work in focused commits.
Do not mass-rename serialized/public identifiers without migration.
Do not delete prototype UI until replacement paths are verified.
Do not commit secrets.

## Current build objective

Complete the first trustworthy vertical slice:

Create/open project
-> import real audio
-> durable local storage
-> waveform
-> place on timeline
-> play
-> edit
-> save/reopen
-> undo
-> audio health
-> export
-> offline restart

Then:
recording
MIDI/hardware
native desktop
provider sync
collaboration
community player.
