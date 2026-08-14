# Poietek Studio

Poietek Studio is the production migration of the Studio DAW Station (SDS): a
local-first creative audio workspace that preserves the useful hardware/rack UX
while moving durable projects, media, playback and platform capabilities into a
versioned architecture.

It is one application with device-aware access points. On launch it detects the
active desktop, tablet, mobile or other form factor plus touch/pointer,
orientation and browser/installed/native surface, then applies only that device's
layout and available capabilities. The canonical project remains the same across
every access point.

The application now opens in the **Arrange** desk: real imported audio, stored
waveforms, clip editing and the track-linked console. Select **Rack** (or press
F6) for the modular device stack and rear patching; press F7 to return to the
arranger. This preserves the tactile rack workflow while making the canonical
song timeline the center of the production experience.

The bundled Sound Atlas contains original sound-design recipes and a procedural
one-shot kit. It does not include copied commercial factory banks, presets or
recordings. Designs that require new multisampling or unfinished engines are
labelled accordingly in Studio Setup.

## Current working vertical slice

Open the application in **Arrange**. The production workspace can create/open
local projects, import and decode real
audio, persist media, display real waveform peaks, place clips on the timeline,
play/pause/stop/seek, save/reopen, undo/redo and run honest basic PCM health
checks. Recording, offline rendering, PCM WAV export and crash recovery are
implemented as core services and are the next controls to wire into this screen.

Choose **Studio Setup** in the top menu or compact navigation drawer to configure
global audio, MIDI/sync, recording, editing, file/recovery, plug-in, appearance,
privacy and profile settings. The setup window also contains the honest module
catalog and repeatable local benchmark. Requested driver settings remain
requests until a real browser/native adapter reports what the device accepted.

Open **Ecosystem** and select **Development Library** to inspect the complete
attached requirements crosswalk: Volumes 01–20, the proposed fifty-volume parts,
Appendices A–E and Creative OS Volumes 51–53. Search results show what is working,
what is only specified, which professional volume owns it and what real gate
remains.

Select **Industry qualification** in the same screen for the evidence-based
comparison across all thirteen product systems and fourteen professional
volumes. The current baseline is 53/100 (2.5/5.0), with zero lanes falsely
labelled five-star complete. Every card links its official reference set, shows
current repository evidence and states the acceptance work needed to reach 5.0.

## Run and verify

```text
npm install
npm run dev
```

`npm run dev` now builds and serves the verified application at
`http://localhost:3000`, avoiding development dependency-optimizer failures in
restricted Windows environments. Developers who need live HMR on an unrestricted
machine can use `npm run dev:hmr`.

Before review or a GitHub push:

```text
npm run verify
```

The verification command checks formatting hygiene, full TypeScript, the strict
framework-independent core, native packaging contracts, all Node tests and the
production Vite build. GitHub workflows can then emit Windows, macOS, Linux,
Android and iOS validation artifacts from the operating systems that own those
toolchains. Signed mobile packages require the publisher's protected credentials;
no workflow silently uploads to a store.

## Architecture and status

- [Fourteen-volume professional specification series](docs/volumes/README.md)
- [Controlled master specification](docs/POIETEK_MASTER_SPECIFICATION.md)
- [UI, menu, settings, screen and workflow catalog](docs/UI_SCREEN_WORKFLOW_CATALOG.md)
- [Platform data, API, AI, security and cloud blueprint](docs/PLATFORM_DATA_API_SECURITY_BLUEPRINT.md)
- [Delivery, testing and documentation plan](docs/DELIVERY_TEST_DOCUMENTATION_PLAN.md)
- [System architecture](docs/ARCHITECTURE.md)
- [Staged roadmap](docs/ROADMAP.md)
- [SDS source coverage and traceability](docs/SDS_VISION_COVERAGE.md)
- [Integration baseline](docs/INTEGRATION_BASELINE.md)
- [Archive policy](docs/ARCHIVE_POLICY.md)
- [Professional workstation comparison](docs/PRO_DAW_COMPARISON.md)
- [Industry qualification and five-star evidence baseline](docs/INDUSTRY_QUALIFICATION.md)
- [Master 108-item build checklist and percentage dashboard](docs/MASTER_BUILD_CHECKLIST.md)
- [One-app device-aware access architecture](docs/DEVICE_AWARE_ACCESS.md)
- [Native installers, mobile packages and signing architecture](docs/NATIVE_DISTRIBUTION.md)
- [Native scaffold boundary](src-tauri/README.md)

## Non-negotiable truth rules

- RMS and sample peak are never presented as LUFS or true peak.
- A432/A440 derivative playback never uses a tempo-changing playback-rate fake.
- Rights acceptance, registration, payment, blockchain evidence and hardware
  capabilities remain explicit external/evidence states.
- Provider secrets do not enter the browser bundle.
- Local durable save is the primary success condition; cloud/AI are optional.

The repository is intentionally not pushed or published by this build task.
