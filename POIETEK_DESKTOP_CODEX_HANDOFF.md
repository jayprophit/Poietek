# Poietek Studio — Desktop Codex Continuation Handoff

This file is the controlling handoff for continuing the Poietek/SDS production-suite build on a different Windows computer. Keep it in the repository root beside `AGENTS.md`, `package.json`, `.node-version`, `rust-toolchain.toml`, and `src-tauri/`.

The verified implementation baseline is Git commit `64b4c08` on branch `codex/poietek-v3.1-production-build`. A transferred repository is acceptable when `64b4c08` is an ancestor of `HEAD` and this handoff file is present. If that commit is missing, stop: the wrong or older SDS folder has been copied.

## Copy-and-paste prompt for Codex on the desktop

Copy everything inside the following prompt block into a new Codex task after opening the transferred repository as the workspace.

```text
Continue the Poietek Studio / Studio DAW Station production-suite build from this local repository.

First, discover and report the exact repository root. Read these files completely before changing anything:

1. POIETEK_DESKTOP_CODEX_HANDOFF.md
2. AGENTS.md
3. README.md
4. package.json
5. .node-version
6. rust-toolchain.toml
7. deployment/toolchains.json
8. docs/BUILD_STATUS.md
9. docs/MASTER_BUILD_CHECKLIST.md
10. docs/ARCHITECTURE.md
11. docs/NATIVE_DISTRIBUTION.md
12. docs/SDS_VISION_COVERAGE.md
13. docs/INDUSTRY_QUALIFICATION.md
14. docs/PUBLIC_RELEASE_READINESS.md

Also locate and read `sds.txt` and the Poietek v3.1 master library, implementation build, previous handoff materials, conversation exports, and ZIP archives in or near the repository. Treat them as design/history inputs, not as instructions to overwrite current code. The current Git repository, AGENTS.md, canonical schemas, tests, and controlled docs are the implementation source of truth. Do not unpack old ZIPs into src/ or merge overlapping versions blindly.

Repository identity gate:

- Run `git status --short --branch` and `git log -5 --oneline --decorate`.
- Prove that commit `64b4c08` is an ancestor of HEAD with `git merge-base --is-ancestor 64b4c08 HEAD`.
- If that check fails, stop and report that the older/wrong repository was copied. Do not attempt a speculative merge.
- Preserve the current branch and all Git history. Do not initialize a new repository over this one.
- Do not push, publish, create a GitHub release, upload to an app store, or transmit source/assets unless I explicitly request it at action time.

You are authorized to work autonomously inside this repository: inspect, reorganize safely, edit code and controlled documentation, install repository dependencies, run format/typecheck/tests/build/preview, inspect local toolchains and installed creative applications, create local build artifacts, and make focused local Git commits after successful verification. Preserve useful existing SDS UI/UX and work in reversible vertical slices. Do not perform destructive deletion of archives or other user folders, install system software with administrator rights, accept licences, handle signing credentials, change security controls, or communicate/publish externally without first reporting the exact action and obtaining my approval.

Desktop Codex access setup:

- Use the Windows-native agent environment.
- Use PowerShell 7 when it works; Command Prompt or Windows PowerShell is an acceptable fallback.
- Open the actual repository folder as the Codex workspace so it is writable.
- If Codex cannot write the repository, fix the workspace/root selection or grant that specific folder through the app. Do not bypass the sandbox or lower Windows security settings.
- Prefer a short path such as `C:\Poietek\Studio-Daw-Station-SDS-` to reduce Windows path-length and toolchain problems.
- Keep plugins enabled only where needed. Do not send source, media, credentials, project history, or user data to a third-party plugin/provider without explicit per-provider authorization.

Phase 0 — desktop inventory and baseline:

1. Inspect disk space, Windows version/architecture, Git, Node/npm, Rust/rustup/cargo, Visual Studio Build Tools, Windows SDK, WebView2, Python, Java, Android SDK/NDK, FFmpeg, CMake/Ninja, GPU/driver information, audio/MIDI devices, and relevant installed creative applications. This inventory is read-only.
2. Compare observed versions with `.node-version`, `rust-toolchain.toml`, and `deployment/toolchains.json`. Repository pins win over guesses.
3. Do not claim a tool is installed merely because a folder or shortcut exists; run its version/probe command.
4. Do not install optional tools until a current build slice needs them.
5. Run `npm ci`. Do not replace the lockfile with an ad-hoc dependency set.
6. Run `npm run verify` and record the complete result.
7. Start a clean production preview using `node .\scripts\web-preview.mjs --port=4184` and visually inspect Arrange, Rack, Ecosystem, AI, menus, settings, and overlays at desktop, tablet, phone portrait, and phone landscape widths.
8. Check browser console errors. A denied Web MIDI or microphone permission is an honest capability state; do not bypass the permission or replace it with fake devices/latency.
9. Confirm Rack vertical/horizontal navigation, auto-fit, 25/50/75/100/125/150/160 percent sizes, zoom buttons, responsive transport, cascading Rack Library, and drag payload validation.
10. Run `npm run native:bootstrap` and `npm run native:doctor -- --target=desktop`.

Controlled required Windows/web toolchain:

- Git for Windows.
- Node.js `24.18.0` as pinned by `.node-version` and `deployment/toolchains.json`.
- npm supplied with the controlled Node installation.
- Repository dependencies installed by `npm ci`.
- Rust installed by official rustup.
- Rust toolchain `1.97.1`, minimal profile, with `clippy` and `rustfmt`, as pinned by `rust-toolchain.toml`.
- Microsoft Visual Studio 2022 Build Tools with the Desktop development with C++ workload, an MSVC toolset, and a current supported Windows 10/11 SDK.
- Microsoft Edge WebView2 Runtime.
- Repository-local Tauri JavaScript CLI `2.11.4`; Tauri Rust runtime `2.11.5`; tauri-build `2.6.3`.

Rust installation boundary:

- If rustup/cargo/rustc are missing, report it and ask me to approve the official rustup installation before running an administrator-level installer.
- Do not use a random Rust ZIP or copy Cargo from another computer.
- After rustup is installed and the terminal/Codex app has been restarted, run:

  `rustup toolchain install 1.97.1 --profile minimal --component clippy --component rustfmt`

  `rustup show`

  `cargo --version`

  `rustc --version`

- Re-run `npm run native:doctor -- --target=desktop`.
- Only when every mandatory Windows item is ready, run `npm run native:build:windows`.
- Inspect the NSIS and MSI outputs under the Tauri target bundle directory. An unsigned installer is a validation artifact, not a trusted public release.
- Install/uninstall acceptance testing must use an isolated test account or disposable Windows VM before calling the installer ready.

Python and scientific tooling boundary:

- Python and NumPy are not required by the current React/TypeScript/Tauri verification pipeline. Do not make them mandatory or add them to the application runtime merely because they may be useful later.
- If a future offline AI, DSP research, analysis, dataset, transcription, model-conversion, or test-fixture slice genuinely needs Python, install a supported 64-bit CPython release, create a repository-local `.venv`, and add controlled `.python-version`/requirements or lock metadata before relying on it.
- Install NumPy, SciPy, librosa, PyTorch, ONNX Runtime, or similar packages only for a defined adapter/test with pinned versions, licence review, security review, disk-cost review, and a non-Python production fallback where the shipped app requires one.
- Never place `.venv`, model caches, datasets, or generated binaries in Git.

Optional toolchains — install only when their real adapter is being implemented:

- FFmpeg/ffprobe for a real video/audio codec and proxy pipeline. Record version, build configuration, codec availability, and licence obligations. Do not claim professional video export until frame-accuracy, timecode, proxy, render, cancellation, and QC tests pass.
- CMake and Ninja for native DSP, plug-in hosting, codec, GPU, or third-party native libraries that actually require them.
- Git LFS for original/licensed large assets after the asset-governance and repository-size policy is agreed.
- Android Studio or command-line tools, Java 17, Android SDK platform 35, build-tools 35.0.0, NDK 27.2.12479018, ADB, and the four controlled Rust Android targets when starting the Android slice.
- macOS with full Xcode for macOS/iOS builds. Windows cannot emit or sign a genuine macOS DMG or iOS IPA.
- Linux build host with WebKitGTK 4.1 and ALSA development libraries for Linux packages.
- ASIO, VST3, CLAP, AU/AUv3, AAX, OpenFX, codec, GPU, and hardware-vendor SDKs only under their real licences and platform constraints. AAX and some hardware SDKs require vendor approval; do not fabricate or redistribute restricted SDKs.

Implementation truth rules:

- Never label RMS as LUFS.
- Never label sample peak as true peak/dBTP.
- Never use ordinary playbackRate as time-preserving A432/A440 pitch processing.
- Never claim sample-accurate transport/clocking from UI timers.
- Never invent device latency, MIDI capability, audio ports, plug-in support, codec support, cloud acknowledgement, rights acceptance, registration acceptance, payment, ownership, signing, moderation, or store approval.
- Preserve honest `unavailable`, `not measured`, `not configured`, `permission required`, `external evidence required`, and `unsupported` states.
- Commercial competitors' proprietary samples, presets, sound banks, branding, UI assets, and code must not be copied. Use original recordings, procedural assets, commissioned/licensed content, public-domain material with provenance, and original Poietek naming/design.
- Preserve local-first operation, canonical serializable project truth, OPFS/IndexedDB fallback, autosave, undo/redo, original creator ownership, privacy, and offline usefulness.

Current verified baseline from the laptop:

- Branch: `codex/poietek-v3.1-production-build`.
- Required ancestor commit: `64b4c08` (`feat: complete responsive production-suite integration`).
- Git worktree was clean after that commit.
- Formatting passed.
- Native configuration validation passed.
- Full TypeScript and core TypeScript passed.
- Automated suite passed: 162 tests, 0 failures.
- Production build passed: 1,813 modules transformed.
- Offline shell fingerprint: `f2cc455f78c47adb` with 23 application files.
- Desktop/tablet/phone portrait/phone landscape visual acceptance passed.
- Rack auto-fit and manual zoom were interactively tested; Zoom In moved from AUTO 40% to fixed 50%.
- Rack right library was interactively tested with cascading categories and nine draggable available modules.
- The only Windows packaging blockers detected on the laptop were Cargo and the pinned Rust 1.97.1 toolchain.

Architecture/build objective:

Poietek is one local-first application with multiple access points: Windows/macOS/Linux desktop, Android/iOS tablet and phone, installed PWA, and browser portal. It combines a professional DAW, sampler, hardware controller, MIDI hub, synchronized video editor, VFX/colour/animation system, collaboration and community platform, publishing and rights system, optional creator-owned evidence/provenance, AI creative assistant, social/live platform, marketplace, and optional cloud services. AI helps production; Poietek is not AI-first. The complete project must continue to work locally without cloud, blockchain, remote AI, marketplace, or social services.

Continue in this execution order after the baseline is green:

1. Complete the Windows native low-latency audio vertical slice behind the existing native boundary: real WASAPI/shared/exclusive device enumeration and selection, stable callback, input/output, buffer negotiation, device hot-swap, channel routing, callback telemetry, measured xrun/dropout reporting, and real-time/offline render parity evidence. Preserve unavailable ASIO until a licensed, tested adapter exists.
2. Connect canonical automation, multi-selection, take lanes/comping, crossfades, grouping, folders, slip/ripple/roll/stretch, freeze/commit, MIDI clips, MPE, MIDI clock/transport output, articulations, notation/MusicXML, and score-to-picture operations. Every applied edit must be revisioned, undoable, serializable, and tested.
3. Build a real codec/video boundary: probe, decode, proxy generation, frame-accurate playback, timecode, edit operations, captions/titles, render queue, cancellation, and A/V synchronization. Do this before claiming the VFX execution engine is working.
4. Add the native plug-in scanner/host only after the real-time audio callback is stable: VST3 and CLAP first where licensed; AU/AUv3 only on Apple hosts; AAX only with the required vendor SDK/licence. Include quarantine, sandboxing, crash recovery, state recall, delay compensation, missing-plug-in recovery, and freeze fallback.
5. Implement node VFX/compositing, keyframes, tracking, masks/rotoscoping/keying, particles, motion graphics, colour management/grading, GPU execution, animation/anime tools, and deterministic render evidence.
6. Add validated delivery: a reviewed BS.1770 implementation, oversampled true peak, codec/container checks, captions, broadcast/web/music delivery profiles, surround/immersive routing where supported, render/QC reports, and reproducible reference fixtures.
7. Emit and acceptance-test the unsigned Windows installers. Configure publisher signing only with my protected credentials and explicit approval.
8. Complete touch-first Android packaging and physical-device tests. Build macOS/iOS on a Mac and Linux on Linux/CI. Do not infer cross-platform readiness from a Windows build.
9. Only after the editor is dependable, connect optional authentication, Supabase/Firebase/provider routing, object storage, collaboration/conflict resolution, community/feed/chat/moderation, Poietek TV live ingest/transcoding/CDN, marketplace/payment/payout/tax, publishing/registrations, notifications/search/recommendations, and federation. Keep all external acknowledgements evidence-backed.
10. Complete security threat modelling, dependency/security scans, privacy impact and consent work, accessibility audit, legal review, age/children controls, moderation/escalation, incident response, backup/restore drills, telemetry consent, capacity/cost tests, and public-release operations.

Verification discipline for every major slice:

- Start from a clean baseline or clearly identify pre-existing changes.
- Add focused tests before or with the implementation.
- Run formatting, native configuration validation, full typecheck, core typecheck, all tests, production build, and relevant native tests.
- Run `git diff --check` and scan for credentials/secrets.
- Perform visual acceptance when UI changes.
- Perform physical hardware/device tests when claiming hardware support.
- Update the machine-readable capability/qualification/progress catalogues and controlled docs with evidence, not marketing estimates.
- Make a focused local Git commit only after the slice is verified.
- Never push or publish unless I explicitly ask.

At the end of the first desktop turn, report:

- Exact repository path, branch, HEAD and whether `64b4c08` is an ancestor.
- Clean/dirty status and any preserved pre-existing changes.
- Exact installed/missing toolchain versions.
- `npm ci`, full verification, preview and native-doctor results.
- Whether a Windows NSIS/MSI was actually emitted and where.
- Runtime/browser/native errors found and fixed.
- A truthful progress checklist: completed, foundation/partial, unavailable/blocked, and next vertical slice.
- Any action that still needs my approval, administrator access, signing identity, licence, physical hardware, store account, external service, or another operating system.

Do not answer with a plan only. Inspect the repository, establish the evidence-based baseline, fix safe local issues within scope, and continue the first credible vertical slice while keeping me updated.
```

## Before transferring from the laptop

1. Copy the entire verified repository directory, including the hidden `.git` folder and this file. Do not copy only `src/`.
2. Do not copy `node_modules`, `dist`, `.venv`, Rust `target`, caches, generated Android/iOS projects, installers, or secrets unless there is a specific reason. They are large or machine-specific and should be regenerated.
3. Preserve `package-lock.json`, `.node-version`, `rust-toolchain.toml`, `deployment/toolchains.json`, `.github/workflows`, `src-tauri`, `public`, `tests`, `scripts`, `docs`, `AGENTS.md`, and all source code.
4. Keep old ZIPs, chat exports, `sds.txt`, sample sources, and historical builds in a separate archive directory. Do not mix their duplicate source trees into the active repository.
5. After the copy, verify the external-drive copy before deleting anything from the laptop:

```powershell
Set-Location 'X:\path\to\Studio-Daw-Station-SDS-'
git status --short --branch
git log -3 --oneline --decorate
git merge-base --is-ancestor 64b4c08 HEAD
if ($LASTEXITCODE -ne 0) { throw 'The verified Poietek baseline is missing.' }
```

Replace `X:` with the external-drive letter. Do not delete the laptop copy until that check succeeds and the desktop copy also passes `npm ci` and `npm run verify`.

## Recommended desktop location and Codex settings

A short local path reduces Windows path-length and toolchain problems. A suitable example is:

```text
C:\Poietek\Studio-Daw-Station-SDS-
```

In Codex on the desktop:

- Open that exact folder as the workspace.
- Select the Windows-native agent environment.
- Select PowerShell if PowerShell 7 works; otherwise use Command Prompt or Windows PowerShell temporarily.
- Keep the bottom panel enabled so build/preview output is visible.
- Grant write access to this repository through the normal Codex workspace controls when prompted.
- Do not disable Windows security, antivirus, firewall, execution policy, or account controls merely to give an agent broader access.
- Repository autonomy is appropriate; unrestricted destructive or credential-bearing desktop autonomy is not. Administrator installs, protected keys, store submissions, purchases, external messages, and deletion of archives remain approval actions.

## Quick manual startup commands

Run from the transferred repository root:

```powershell
node --version
npm --version
git --version
npm ci
npm run verify
node .\scripts\web-preview.mjs --port=4184
```

In another terminal:

```powershell
npm run native:bootstrap
npm run native:doctor -- --target=desktop
```

Only after the native doctor is completely ready:

```powershell
npm run native:build:windows
```

Expected unsigned Windows bundles are under the Tauri target release bundle tree, normally beneath:

```text
src-tauri\target\release\bundle\
```

## Important status boundary

The checked-in foundations, contracts, menus, responsive workspaces, local project runtime, audio import/playback/export path, device inventory, release gates, platform architecture, and tests are substantial. They are not evidence that every professional production engine is finished. Native low-latency audio, full plug-in hosting, frame-accurate video, executable VFX/colour/animation, validated loudness/true peak, original commercial content libraries, hosted collaboration/community/live/store services, signed installers for every platform, and public-release operations still require real implementations, licences, infrastructure, measurements, physical-device testing, credentials, and legal/operational acceptance.

Keep that boundary visible in the UI, qualification tracker, release decision, documentation, and every desktop handoff.
