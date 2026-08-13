# Poietek Studio

Poietek Studio is the production migration of the Studio DAW Station (SDS): a
local-first creative audio workspace that preserves the useful hardware/rack UX
while moving durable projects, media, playback and platform capabilities into a
versioned architecture.

## Current working vertical slice

Open the SDS interface, then choose **PROJECT · REAL AUDIO** at the lower left.
The production workspace can create/open local projects, import and decode real
audio, persist media, display real waveform peaks, place clips on the timeline,
play/pause/stop/seek, save/reopen, undo/redo and run honest basic PCM health
checks. Recording, offline rendering, PCM WAV export and crash recovery are
implemented as core services and are the next controls to wire into this screen.

## Run and verify

```text
npm install
npm run dev
```

Before review or a GitHub push:

```text
npm run verify
```

The verification command checks formatting hygiene, full TypeScript, the strict
framework-independent core, all Node tests and the production Vite build.

## Architecture and status

- [System architecture](docs/ARCHITECTURE.md)
- [Staged roadmap](docs/ROADMAP.md)
- [Integration baseline](docs/INTEGRATION_BASELINE.md)
- [Archive policy](docs/ARCHIVE_POLICY.md)
- [Native scaffold boundary](src-tauri/README.md)

## Non-negotiable truth rules

- RMS and sample peak are never presented as LUFS or true peak.
- A432/A440 derivative playback never uses a tempo-changing playback-rate fake.
- Rights acceptance, registration, payment, blockchain evidence and hardware
  capabilities remain explicit external/evidence states.
- Provider secrets do not enter the browser bundle.
- Local durable save is the primary success condition; cloud/AI are optional.

The repository is intentionally not pushed or published by this build task.
