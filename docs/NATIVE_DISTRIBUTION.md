# Native distribution and installer architecture

Poietek is one application with shared project truth and multiple installation
surfaces. The web portal and PWA remain the universal access points. Tauri wraps
the same production frontend for supported desktop and mobile operating systems.

## Controlled toolchain

`deployment/toolchains.json` is the machine-readable packaging manifest.

| Tool | Controlled version | Purpose |
| --- | --- | --- |
| Node.js | 24.18.0 LTS | Frontend, tests, packaging helpers |
| Rust | 1.97.1 | Tauri native library and application shell |
| Tauri JavaScript CLI | 2.11.4 | Desktop/mobile generation and bundling |
| Tauri Rust crate | 2.11.5 | Native runtime |
| Tauri build crate | 2.6.3 | Build-time configuration |
| Java | 17 | Android Gradle build |
| Android minimum SDK | 24 | Android 7.0 and later |
| Android NDK | 27.2.12479018 | Rust/Android native compilation |
| iOS minimum version | 14.0 | iPhone and iPad deployment target |
| macOS minimum version | 10.15 | Desktop deployment target |

The Rust and Node pins live in `rust-toolchain.toml` and `.node-version`. The
repository-local Tauri CLI is intentionally installed at the exact controlled
version by `npm run native:bootstrap`. It is not added to the web dependency lock,
so ordinary PWA/web installs do not download platform-specific native binaries.

## Package matrix

| Platform | Architectures | Validation output | Distribution output |
| --- | --- | --- | --- |
| Microsoft Windows | x64; ARM64 preview | Unsigned NSIS setup and MSI | Signed setup/MSI or Microsoft Store submission after owner configuration |
| Apple macOS | Apple silicon; Intel | Unsigned `.app` and `.dmg` | Signed and notarized app/DMG or Mac App Store submission |
| Linux | x64; ARM64 preview | AppImage, Debian package, RPM | Repository/package signing remains distributor-specific |
| Google Android | ARM64 and ARMv7 device builds; x86 targets available | Debug-signed split APKs | Owner-signed Android App Bundle (`.aab`) for Google Play |
| Apple iOS/iPadOS | ARM64 device; Apple silicon and Intel simulator targets | Simulator `.app` | Owner-signed and provisioned `.ipa` |
| ChromeOS and other modern devices | Browser/PWA; Android package where supported by the device | Installable PWA | Portal/PWA deployment remains the compatibility path |
| Unsupported native operating system | Browser/PWA when standards support exists | Web application | No native capability is claimed |

ARM64 Windows and Linux use GitHub public-preview runners. Their workflow jobs
are allowed to report a preview failure without hiding failures in the stable x64
and macOS lanes. They must pass on real target hardware before being promoted to a
supported release lane.

## GitHub workflows

- `quality.yml` runs the complete web, contract, type, test and production-build
  gate on every branch push and pull request.
- `package-desktop.yml` creates workflow artifacts for Windows, macOS and Linux.
  It does not publish a GitHub Release or store listing.
- `package-mobile.yml` always offers Android APK and iOS simulator validation.
  A manually selected signed build uses the protected `native-signing`
  environment to produce AAB and IPA artifacts.
- `dependabot.yml` watches JavaScript, Rust and GitHub Action dependencies.

Tagging a commit with `v*` runs validation packaging. Tagging does not upload to
Microsoft Store, Google Play or App Store Connect. Store upload is a distinct,
owner-approved release operation.

## Required protected signing environment

Create a GitHub environment named `native-signing`, require reviewer approval,
and add only the secrets needed by the selected signed job.

Android secrets:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`
- `ANDROID_STORE_PASSWORD`

Apple secrets:

- `APPLE_CERTIFICATE_BASE64`
- `APPLE_CERTIFICATE_PASSWORD`
- `APPLE_DEVELOPMENT_TEAM`
- `APPLE_PROVISIONING_PROFILE_BASE64`

The Android helper writes a temporary keystore and Gradle properties with
restricted permissions, then applies an idempotent signing block to the generated
Android project. The Apple helper writes the certificate and provisioning profile
with restricted permissions; the workflow imports the certificate into an
ephemeral keychain and deletes that keychain and the temporary files afterward.
Secret values are never printed and the relevant file extensions are ignored by
Git.

The Apple provisioning profile must match `studio.poietek.app`, the distribution
certificate and the selected Apple team. The Android upload key must be the key
registered for this application in Play Console. A generated installer is not
proof that either store accepted the application.

## Local commands

```text
npm ci
npm run verify
npm run native:bootstrap
npm run native:doctor -- --target=desktop
```

Desktop package commands:

```text
npm run native:build:windows
npm run native:build:macos
npm run native:build:linux
```

Mobile package commands:

```text
npm run native:doctor -- --target=android
npm run mobile:android:init -- --ci
npm run mobile:android:build:apk -- --ci
npm run mobile:android:build:aab -- --ci

npm run native:doctor -- --target=ios
npm run mobile:ios:init -- --ci
npm run mobile:ios:build:simulator -- --ci
npm run mobile:ios:build:app-store -- --ci
```

Each command must run on the corresponding host. Windows packages should be built
on Windows; macOS and iOS require macOS, and iOS requires full Xcode. Linux needs
WebKitGTK 4.1 and ALSA development libraries. Android needs Android Studio or equivalent
SDK command-line tools, Java, platform tools, build tools and the NDK.

The generated `src-tauri/gen` mobile projects are build products in this phase and
remain ignored. Repeatable signing changes are applied by repository scripts.
When Poietek adds native audio sessions, background modes, microphone usage
descriptions or other platform entitlements, their reviewed templates must be
checked into source rather than edited only in generated output.

## Release gates that automation cannot replace

- Microsoft Partner Center, Apple Developer/App Store Connect and Google Play
  Console accounts belong to the publisher and cannot be invented by the app.
- Windows publisher signing, Apple signing/notarization and Android upload signing
  must use the owner's protected keys.
- Privacy manifests, permission descriptions, store declarations, age/content
  ratings, export compliance and data-safety forms require owner/legal review.
- Physical-device launch, audio input/output, interruption, background/foreground,
  suspend/resume, orientation, storage and upgrade testing are required.
- Native low-latency audio, desktop plug-in hosting and hardware drivers are not
  created by packaging. Those remain separate adapters and capability gates.
- The first successful remote native build must be reviewed before any artifact is
  described as production-ready. This local task cannot execute macOS/iOS or Linux
  runners and does not possess signing identities.

Primary platform guidance:

- <https://v2.tauri.app/start/prerequisites/>
- <https://v2.tauri.app/distribute/>
- <https://v2.tauri.app/distribute/google-play/>
- <https://v2.tauri.app/distribute/sign/android/>
- <https://v2.tauri.app/distribute/sign/ios/>
- <https://docs.github.com/actions/reference/runners/github-hosted-runners>
