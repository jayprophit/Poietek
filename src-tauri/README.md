# Poietek native shell

The Tauri 2 shell now has production bundle metadata, offline WebView2 installer
configuration for Windows, responsive window limits, icons, a strict content
security policy and an empty native capability. It packages the same local-first
web runtime used by the browser portal and PWA.

It does not claim native audio, VST/AU hosting, unrestricted filesystem access or
hardware control. Those remain behind reviewed adapters. Projects and media use
the browser-compatible `ProjectRepository` and `AssetStore` contracts inside the
webview until native implementations are added and migrated safely.

Run `npm run native:doctor` before native work. On this checkout, installer output
requires all of the following external build prerequisites:

- `@tauri-apps/cli` installed as a local development dependency;
- Rust stable with the platform target;
- the platform's native build tools and webview;
- Android Studio/SDK/NDK for Android packages;
- macOS, Xcode and CocoaPods for iOS packages.

The package scripts never download those toolchains automatically. The Windows
bundle uses Tauri's offline WebView2 installer mode so the resulting NSIS setup can
install without a network connection. Code signing and platform smoke tests are
still release gates; an unsigned local build must not be described as a published
release.

The production CSP deliberately blocks arbitrary remote origins. Add only exact,
reviewed provider endpoints when a configured Supabase, Firebase or AI adapter is
actually enabled. Do not replace this boundary with unrestricted `https:`.
