# Poietek / SDS — Devin Start Here

Repository already connected:
`jayprophit/Studio-Daw-Station-SDS-`

## Do not start from the oldest conversation ZIP

Use three layers of truth:

1. **GitHub repository**
   - Existing SDS concept/prototype UI.
   - Treat as the live codebase to migrate, not discard blindly.

2. **Poietek Master Development Library v3.1**
   - Product, architecture, standards, rights, hardware, community, AI, release,
     tuning, cross-platform and implementation specifications through document 180.
   - This is the current product/specification source of truth.

3. **Poietek Implementation Build v3.1**
   - Current repo-ready implementation overlay.
   - Contains `src/poietek/`, integration patches, Tauri/PWA scaffolding and
     validation results.

Older ZIPs are historical/archive material. Do not merge all older snapshots into
the working repository. If a current document references missing historical detail,
inspect the older batch deliberately instead.

## First task

Do NOT immediately rewrite the entire app.

First:
- index and inspect the repository;
- read `AGENTS.md`;
- read the latest master README/index and docs 171-180;
- inspect the v3.1 implementation overlay;
- produce a migration report mapping overlay files to the existing repository;
- run the existing repository before changing it;
- establish a passing baseline;
- create a branch;
- integrate the foundation in small commits;
- keep the existing rack/workspace UX functioning.

After the foundation is integrated, continue the build sequence in
`docs/BUILD_SEQUENCE.md`.
