# Poietek v3.1 integration baseline

Date recorded: 2026-08-12

## Inputs inspected

The working checkout is:

`C:\Users\jpowe\Documents\Codex\2026-08-11\referenced-chatgpt-conversation-this-is-an\work\Studio-Daw-Station-SDS-build`

The v3.1 implementation source inspected for this slice is:

`C:\Users\jpowe\Desktop\Studio-Daw-Station-SDS-\zip-files\Poietek_Implementation_Build_171_180_v3_1\Poietek_Implementation_Build_v3_1`

The extracted master library and handoff material remain reference inputs under
the Desktop project's `zip-files` directory. They are not copied wholesale into
the application source tree.

The following v3.1 integration patches were reviewed but not applied in this
slice because their target files are owned by the main integration work:

- `integration/App.tsx.patch` adds the missing `reverbLevel` and `delayLevel`
  defaults;
- `integration/main.tsx.patch` installs the runtime provider/status and service
  worker registration;
- `integration/index.html.patch` adds the PWA manifest and theme colour;
- `integration/package.json.patch` renames the package and proposes Tauri
  dependencies and scripts.

## Baseline facts

- The checkout is still named `react-example` at package version `0.0.0`.
- The existing web commands are `dev`, `build`, `preview`, `clean` and `lint`.
- The current Vite development command uses port 3000, matching the native
  scaffold.
- The original v3.1 core configuration addressed `repo-overlay/src/poietek`;
  `tsconfig.core.json` now targets the checkout's real `src/poietek` location.
- The original CommonJS test cannot run unchanged inside this package because
  the package declares `type: module`. The adapted test is ESM and marks only its
  generated `.compiled-core` directory as CommonJS.
- No format, lint, core compile, unit test, web build, Cargo check or Tauri build
  result is claimed in this note. Execution was intentionally deferred until the
  other concurrent integration slices finish.

## Validation commands for the merged slice

From the repository root, after all expected `src/poietek` files are present:

```text
npx tsc -p tsconfig.core.json
node --test tests/pure-core.test.js
```

The first command emits framework-independent modules into the ignored
`tests/.compiled-core` directory. The test covers tuning math, explicit
time-preserving-pitch unavailability, tempo conversion, clipping, honest
standards-measurement unavailability, release tuning behavior, canonical-project
validation, serialized session persistence/undo and provider fallback routing.

## Native scaffold boundary

`src-tauri` is a security-minimal shell, not an installable release claim. It has
no native commands or plugins, grants the main window no IPC permissions, uses a
restrictive CSP and keeps bundling disabled. Package scripts/dependencies, icons,
installer metadata, signing, platform-specific permissions and smoke tests remain
required before bundling can be enabled.

Remote providers are intentionally blocked by the native CSP until each trusted
origin is explicitly allowlisted. Browser/PWA local-first behavior is unaffected
by this native-only policy.

## Follow-up decisions

1. `ReleaseReadinessResult.ready` is now false when a destination requires LUFS
   or dBTP values and the standards analyzer reports `not_measured`.
2. Apply or supersede each reviewed integration patch against the current SDS UI
   rather than applying it blindly.
3. Add the Tauri CLI/scripts in a package-owned slice, then validate the config
   schema and Rust dependency resolution before enabling installer bundles.
4. Add only narrowly scoped native capabilities when real repository, asset,
   dialog, device or DSP adapters exist. Never grant broad home-directory access.
