# Offline and cross-device deployment

Poietek has four execution modes backed by the same canonical project schema:

| Mode | Launch | Offline behavior | Package status |
| --- | --- | --- | --- |
| Browser portal | Visit an HTTPS deployment | Local projects remain usable after the production shell is cached | Web build is implemented |
| Installed web app | Browser **Install app** / **Add to Home Screen** | Standalone icon launch with cached shell and local storage | PWA assets and update flow are implemented |
| Local repository launcher | Double-click `Poietek Studio.cmd` on this Windows checkout | Starts the production bundle on loopback port 4173 | Implemented; requires Node.js for this developer launcher |
| Native desktop/mobile | OS icon launches the Tauri bundle | Frontend ships inside the application package | Pinned toolchains and packaging workflows are configured; remote runner and signing gates remain |

## What works without a network

- creating, opening and autosaving canonical local projects;
- IndexedDB project persistence and OPFS media storage where supported, with an
  honest IndexedDB asset fallback;
- import, waveform generation, timeline editing, Web Audio playback, recording
  where device permission exists, basic health analysis and WAV export;
- undo/redo, recovery snapshots, arrangement, rack and console views;
- the cached production UI after one successful installed-web-app load.

Cloud providers, collaboration transport, AI services, registration services,
payments, blockchain evidence and community federation are optional capabilities.
They must display unavailable or configuration-required states when offline.

## Ports and security boundaries

- `4173`: loopback production portal and double-click developer launcher;
- `3000`: development/HMR and Tauri development URL;
- `443`: optional HTTPS provider traffic only after exact origins and credentials
  are configured by an adapter.

The audio engine, MIDI, graphics, workers, IndexedDB, OPFS and native IPC do not
require public listening ports. The local launcher binds to `127.0.0.1` by default.
`npm run portal:lan` binds to the LAN only when deliberately requested; a remote
device still needs HTTPS for a securely installable PWA.

Application-shell caching never includes authenticated requests, API/provider
traffic, range requests or private project media. Project media remains in
OPFS/IndexedDB. Persistent-storage requests are user initiated and browsers may
still refuse them.

## Build and release sequence

1. `npm run verify` validates formatting, types, tests and the content-hashed
   offline web bundle.
2. `npm run local` opens the production loopback build.
3. `npm run native:bootstrap` installs the exact repository-local Tauri CLI
   without changing the web dependency lock.
4. `npm run native:doctor -- --target=<platform>` reports platform prerequisites
   without installing system toolchains.
5. The GitHub desktop workflow emits NSIS/MSI, app/DMG, AppImage, Debian and RPM
   validation artifacts on their native operating-system runners.
6. The mobile workflow emits Android debug APKs and an iOS simulator app. A
   manually approved run using the protected `native-signing` environment can
   emit an owner-signed Android AAB and iOS IPA.
7. Store submission, permissions review, privacy declarations and physical-device
   testing remain mandatory release gates.

See `docs/NATIVE_DISTRIBUTION.md` for the target matrix, secrets, local commands
and GitHub environment setup. Packaging does not automatically grant native audio,
plug-in or hardware capabilities.

No current package should be advertised as providing native low-latency audio,
desktop plugin hosting, measured latency, validated LUFS/dBTP or time-preserving
pitch processing until the corresponding reviewed backend is present.
