# Poietek native shell status

This directory is a deliberately minimal Tauri 2 scaffold. It is not yet an
installer-ready desktop release.

Current guarantees:

- the shell loads the existing Vite application from port 3000 in development
  and from `../dist` in a production build;
- the main window has an explicit empty capability, so the webview receives no
  native IPC permissions;
- production and development CSPs are enabled rather than set to `null`;
- no Rust commands, filesystem scopes, device permissions, plugins, updater,
  signing identity, file associations or remote origins are enabled;
- application bundling is disabled until icons, installer metadata, signing and
  platform smoke tests exist.

The production CSP intentionally blocks external network origins. Supabase,
Firebase, AI or other provider endpoints must remain unavailable in the native
shell until their exact trusted origins are reviewed and added to `connect-src`.
Do not replace that boundary with an unrestricted `https:` source.

Before native development can run, a separate reviewed package update must add
the Tauri 2 JavaScript CLI (and the API package only when the frontend actually
uses it), plus desktop scripts. That package change is intentionally outside this
scaffold-only integration slice.

Native project and asset storage must be introduced behind the existing
`ProjectRepository` and `AssetStore` contracts. Hardware, time-preserving pitch,
standards loudness and true-peak support must each remain explicitly unavailable
until a real implementation is negotiated or validated.
