# Poietek native shell

The Tauri 2 shell now has production bundle metadata, offline WebView2 installer
configuration for Windows, responsive window limits, icons, a strict content
security policy and an empty native capability. It packages the same local-first
web runtime used by the browser portal and PWA.

It does not claim native audio, VST/AU hosting, unrestricted filesystem access or
hardware control. Those remain behind reviewed adapters. Projects and media use
the browser-compatible `ProjectRepository` and `AssetStore` contracts inside the
webview until native implementations are added and migrated safely.

Run `npm run native:bootstrap`, then run the target-aware doctor before native
work, for example `npm run native:doctor -- --target=android`. Controlled versions
are stored in `deployment/toolchains.json`, `.node-version` and
`rust-toolchain.toml`. Installer output requires the target platform's external
build prerequisites:

- repository-local `@tauri-apps/cli` 2.11.4 installed by the bootstrap command;
- Rust stable with the platform target;
- the platform's native build tools and webview;
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
