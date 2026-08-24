# Repository consolidation and archive policy

The active repository is the single working implementation. Source-of-truth ZIPs
and the historical `sds.txt` remain immutable reference material outside it.

## Keep active

- `src`, `public`, `src-tauri`, `tests`, `scripts`, `docs`
- package/TypeScript/Vite configuration and lockfile
- the repository-root engineering rules

## Rebuild instead of archiving

- `node_modules`
- `dist`
- `tests/.compiled-core`
- local caches and logs

## Archive outside active source and Git

- partial clones and interrupted mirrors
- superseded implementation overlays
- duplicate dependency-recovery staging
- chat exports and design-history documents
- original ZIP files

Archives use a date-stamped directory, a JSON manifest and SHA-256 checksums for
small reference files. Moving a historical item into the archive is preferred to
deleting it. For a single-directory workstation installation, `_archive/` may sit
beneath the repository root only when it is ignored by Git, excluded from every
compiler/build input and treated as quarantine rather than application content.
The archive is never included in the application build or Git source.
