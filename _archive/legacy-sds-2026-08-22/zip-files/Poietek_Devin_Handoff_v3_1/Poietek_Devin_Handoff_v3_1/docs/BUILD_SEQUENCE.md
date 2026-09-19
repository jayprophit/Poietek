# Poietek Build Sequence

## Phase 0 — Establish baseline

1. Pull current `main`.
2. Create a feature branch.
3. Install dependencies.
4. Run current typecheck/build.
5. Record existing failures separately from new failures.
6. Launch prototype and identify critical preserved workflows.

Exit:
A repeatable development command and baseline report.

## Phase 1 — Integrate v3.1 runtime foundation

1. Copy `src/poietek/`.
2. Apply the minimal `MasterState` fix.
3. Integrate `PoietekRuntimeProvider`.
4. Integrate PWA registration.
5. Add Tauri scaffolding but do not block web build.
6. Keep existing App UI operational.

Exit:
Existing UI loads with durable local Poietek project runtime underneath.

## Phase 2 — Real audio vertical slice

1. Add Import Audio command/UI to Browser.
2. Persist Blob to AssetStore.
3. Persist Asset to Project.
4. Create/use canonical audio track.
5. Add clip to timeline.
6. Draw real waveform.
7. Connect transport to `WebAudioTimelinePlayer`.
8. Implement move/trim/split/gain.
9. Wire global undo/redo to ProjectSession.
10. Save, close, reopen and replay.

Exit:
Real imported WAV/audio survives restart and edits correctly.

## Phase 3 — Recording & health

1. Enumerate audio inputs.
2. Select input.
3. Add Check My Level.
4. Record to durable asset.
5. Clip/dropout/disk/clock guard.
6. Standards loudness integration only after validated implementation.

Exit:
Record a real vocal/instrument safely and reopen it offline.

## Phase 4 — Export

1. Offline mix/render graph.
2. WAV writer.
3. Range selection.
4. metadata/tuning/right references.
5. destination preflight.
6. export evidence fixture.

Exit:
Offline project can import -> edit -> export without network.

## Phase 5 — Native desktop

1. Tauri `dev`.
2. Native open/save dialogs.
3. native app data.
4. crash recovery.
5. native audio/MIDI adapter spike.
6. installer packaging test on each desktop OS.

Exit:
Normal installed desktop app launches without a browser.

## Phase 6 — Provider connectivity

1. Supabase auth/project directory adapter.
2. RLS tests.
3. optional Firebase roles.
4. provider-health/cost/quota routing.
5. never duplicate canonical media into every provider.

## Phase 7 — Cross-device/team

1. Sync structured state.
2. content-addressed media chunks.
3. conflict handling.
4. comments/presence.
5. roles/access.
6. rights/contributor approvals.

## Phase 8 — Community

1. Hub player/channel/feed.
2. original + derivative rendition model.
3. creator-controlled listener tuning.
4. high-quality time-preserving pitch backend.
5. marketplace/rights settlement integration.

## Rule

Do not start Phase N+1 by leaving broken foundations in Phase N.
Small verified vertical slices beat giant rewrites.
