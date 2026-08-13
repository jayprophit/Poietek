# AGENTS.md — Poietek Engineering Rules

This repository is being migrated from the SDS concept prototype into Poietek, a
local-first cross-platform creative production system.

## Source of truth

Priority order:

1. Current checked-out code for actual implementation facts.
2. The latest user instructions and this file for working rules.
3. Latest Poietek Master Development Library v3.1 for product/architecture intent.
4. Latest Poietek Implementation Build v3.1 for current implementation direction.
5. `sds.txt` for historical intent, corrections, and missing details.
6. Older Poietek ZIPs only for historical reference.

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
- `ProjectRepository`;
- `AssetStore`;
- `ProjectSession` / command history;
- timeline engine / transport;
- audio backend;
- MIDI backend;
- device/console adapter layers;
- provider capability routing;
- local-first persistence;
- versioned schemas.

Never serialize `AudioBuffer`, `MIDIPort`, DOM objects, streams, or native handles.

## Local-first rule

A local durable commit is the user's immediate success condition. Cloud
synchronization is asynchronous. The creative editor must remain useful when
cloud providers, AI, blockchain, or the internet are unavailable.

## Audio correctness

Never fake:

- LUFS using RMS;
- true peak using sample peak;
- time-preserving A432/A440 playback with `playbackRate`;
- sample-accurate clock with UI timers;
- device latency or hardware capabilities without measurement/negotiation.

Real-time audio work must avoid allocations, network access, and database calls on
the real-time thread.

## Rights, AI, and provenance

Blockchain is optional evidence infrastructure, not copyright law. AI must not
invent ownership or splits. Submission is not external registration acceptance.
Rights approvals and versions must be explicit and auditable. AI remains optional;
project-changing actions should be previewable and undoable.

## Cross-platform and hardware

Use a shared logical project format across web/PWA, desktop, and mobile, while
reporting platform capability honestly. Unsupported plugins/devices preserve state
and use freeze/render/fallback where possible. Separate audio transport, sample
clock, control state, metering, and timecode.

## Quality and workflow

- Reproduce and record the baseline before integration.
- Work in focused vertical slices.
- Run format, lint, typecheck, tests, and build after each major slice.
- Do not mass-rename serialized/public identifiers without migration.
- Do not delete prototype UI until replacements are verified.
- Do not commit secrets or publish unsupported quality claims.
- Do not push or publish to GitHub unless the user explicitly asks.

The first trustworthy vertical slice is:

Create/open project → import real audio → durable local storage → waveform → place
on timeline → play/edit → save/reopen → undo/redo → audio health → WAV export →
offline restart.
