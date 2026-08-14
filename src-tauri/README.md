# Poietek native shell

The Tauri 2 shell now has production bundle metadata, offline WebView2 installer
configuration for Windows, responsive window limits, icons, a strict content
security policy and one narrowly scoped, read-only device-inventory capability.
It packages the same local-first web runtime used by the browser portal and PWA.

On Windows, macOS and Linux, `list_native_studio_devices` uses CPAL and midir to
read operating-system audio and MIDI endpoint identity plus advertised audio
configurations. The command opens no stream or MIDI connection, sends no MIDI and
reports every endpoint as not selectable by the current native engine with
latency not measured. Its Tauri permission is the only custom privilege granted
to the main window.

It does not claim a native realtime audio engine, VST/AU hosting, unrestricted
filesystem access or hardware control. Those remain behind reviewed adapters.
Projects and media use
the browser-compatible `ProjectRepository` and `AssetStore` contracts inside the
webview until native implementations are added and migrated safely.

Run `npm run native:bootstrap`, then run the target-aware doctor before native
work, for example `npm run native:doctor -- --target=android`. Controlled versions
are stored in `deployment/toolchains.json`, `.node-version` and
`rust-toolchain.toml`. Installer output requires the target platform's external
build prerequisites:

- repository-local `@tauri-apps/cli` 2.11.4 installed by the bootstrap command;
- Rust stable with the platform target;
- the platform's native build tools and webview (plus ALSA development files on Linux);
- Android Studio/SDK/NDK for Android packages;
- macOS, Xcode and CocoaPods for iOS packages.

The local package scripts never install operating-system toolchains automatically.
GitHub runners install them inside disposable build machines. The Windows bundle
uses Tauri's offline WebView2 installer mode so the resulting NSIS setup can
install without a network connection. Code signing and platform smoke tests are
still release gates; an unsigned build must not be described as a published
release. See `docs/NATIVE_DISTRIBUTION.md` for the full package and signing matrix.

The production CSP deliberately blocks arbitrary remote origins. Add only exact,
reviewed provider endpoints when a configured Supabase, Firebase or AI adapter is
actually enabled. Do not replace this boundary with unrestricted `https:`.
