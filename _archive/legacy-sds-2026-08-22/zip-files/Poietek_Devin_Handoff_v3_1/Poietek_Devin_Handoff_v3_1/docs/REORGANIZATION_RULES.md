# Reorganization Rules

Recommended repository target:

apps/
  web/
  desktop/
packages/
  domain/
  project/
  assets/
  commands/
  timeline/
  audio-contracts/
  audio-web/
  midi/
  devices/
  console/
  player/
  release/
  rights/
  providers/
native/
server/
schemas/
fixtures/
docs/
tests/
tools/

However, do **not** perform the full monorepo migration as the first change.

Start by integrating under the current Vite repository as `src/poietek/`.
After the real audio vertical slice passes, migrate packages incrementally with
import aliases and tests.

Do not:
- unpack old ZIP trees directly into `src/`;
- create `v1`, `v2`, `v3` duplicate code folders;
- retain competitor-inspired component names as permanent public naming;
- destroy working UI in a big-bang reorganization.
