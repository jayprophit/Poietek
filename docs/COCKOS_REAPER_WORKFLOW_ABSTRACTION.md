# Cockos and REAPER workflow abstraction

## Purpose and clean-room boundary

This note records the August 22, 2026 clean-room review requested for Poietek
Studio. It studies public product behaviour, documentation and ecosystem
boundaries; it does not copy REAPER, Cockos, SWS, ReaPack, themes, scripts,
plug-ins, names, artwork, media or source code. The implementation remains an
original Poietek design using the canonical Poietek project and `ProjectSession`.

The user-supplied `github.com/Cockos-Reaper-DAW` organization is not linked from
Cockos or REAPER's official developer pages. At review time it exposed two small
public repositories, eight followers and no public organization members. It is
therefore treated as unverified community material, not as Cockos source. No
code or metadata was imported from it.

## Public systems reviewed

### Cockos product shape

Cockos presents a deliberately small, composable product family:

- REAPER is the audio, MIDI and video production environment.
- ReaPlugs exposes a limited Windows VST subset.
- OSCII-bot is a focused programmable MIDI/OSC translator.
- NINJAM separates network collaboration from the workstation.
- JSFX separates a programmable low-latency effect language.
- WDL is the C++ library foundation used by Cockos applications.
- Deprecated tools are listed explicitly instead of being presented as active.

Poietek takes the architectural lesson—small components with honest status—not
the product names or implementations.

### REAPER workflow capabilities

The official feature material emphasizes:

- one flexible track type for audio, MIDI, video and routing;
- deep signal routing, nested folders, grouping and project tabs;
- regions and alternate arrangements;
- batch rendering, a render queue, a region render matrix, wildcard names,
  metadata, loudness/true-peak options and dry-run inspection;
- actions that can run alone or in ordered sequences and can be bound to keys,
  toolbars or controllers;
- themes, layouts and recalled screen arrangements;
- portable installation, small downloads and explicit platform variants;
- plug-in bridging/firewalling and a separately documented extension SDK.

Poietek already has canonical audio projects, explicit rack signal flow,
composition variants, mix scenes, monitoring gates, process-chain intent and
cross-platform shells. The highest-value uncovered area was a safe action and
extension model.

### ReaScript and JSFX

Official ReaScript documentation shows that scripts can call actions and much of
the host API, become actions, bind to controllers and manage explicit undo
blocks. Official JSFX documentation describes a live programmable audio/MIDI
effect environment. Those are powerful designs, but they also cross into file,
network, audio-thread, plug-in and native security boundaries.

Poietek therefore implements action composition without a general-purpose
script interpreter. It does not claim a JSFX equivalent, real-time script DSP,
file access, network access, plug-in execution or arbitrary host APIs. Those
remain future reviewed adapters with resource limits, cancellation, crash
containment, permission scopes and real-time safety tests.

### SWS/S&M

SWS is a collaborative open-source REAPER extension, not a Cockos-built core
feature. Its public materials reinforce the value of workflow extensions,
snapshots, cycle-style actions and community-maintained tools. Poietek abstracts
two ideas only:

1. deterministic cycles that advance through named recipes; and
2. explicit state recall that can be previewed and undone.

Poietek does not include SWS code, commands, names, binaries or packages.

### ReaPack

ReaPack demonstrates why package management needs repository, version, license,
platform and history metadata. The old GitHub repository was archived on June
3, 2026 and points to active Codeberg repositories, so Poietek does not vendor or
depend on the archived code. It abstracts provenance and review-state concepts
only.

The current Poietek model does not fetch repositories. A declaration can store a
source reference, semantic version, publisher, SPDX license, platform list,
requested capabilities and optional SHA-256. It starts as `declared`. A separate
digest-matched review observation is required for `verified`; quarantine needs a
reason. Verification never grants execution.

### Themes, language packs, Stash and learning material

Official REAPER documentation separates theme/layout development and small
language-pack files. Language packs support partial coverage, common strings,
Unicode encodings and an update/merge workflow. Poietek maps this to restricted
theme-token and translation-string package kinds with accessibility, coverage
and fallback expectations.

The REAPER Stash pages presented an automated-traffic challenge during review.
The challenge was not bypassed. Stash was considered only through official
REAPER links and accessible public metadata. The official video catalog and user
guide were used to confirm actions, custom actions, routing, render queues,
dry-run rendering, templates, screens and customization. The REAPER Blog is
explicitly labelled unofficial by REAPER and was not used as an authority for
implementation claims.

### Licensing and distribution

REAPER currently presents one functional product with discounted and commercial
licenses based on use, plus a full-function evaluation. Poietek does not copy
pricing or license terms. The useful product lesson is to avoid technically
crippling the creative core merely to create artificial editions. Poietek's
business architecture remains separately governed.

## Implemented Poietek slice

### Canonical extension

The new versioned project extension is:

```text
org.poietek.action-extension-workshop
schemaVersion: 1.0.0
```

It stores:

- ordered action recipes;
- deterministic cycle actions and their current cursor;
- package manifests and trust state;
- the last successful action execution record; and
- a monotonically increasing extension revision.

All values are JSON-safe and round-trip inside the canonical project.

### Explicit action allowlist

The first production allowlist is intentionally narrow:

| Command | Scope | Validation |
| --- | --- | --- |
| `project.set_tempo` | Project | 20–400 BPM |
| `track.set_gain` | One/all tracks | -60 to +12 dB |
| `track.set_pan` | One/all tracks | -1 to +1 |
| `track.set_mute` | One/all tracks | Boolean only |
| `track.set_solo` | One/all tracks | Boolean only |
| `track.rename` | Exactly one track | Non-empty, max 128 characters |

Unknown commands, unknown parameters, missing tracks, empty all-track targets,
duplicate step IDs, empty recipes and recipes over 64 steps fail closed.

### Dry run and atomic application

Every recipe produces a dry-run plan with target counts, step summaries and
blocked reasons. Dry-run is pure: it changes neither the project nor the action
cursor.

Application validates the complete recipe first and creates a new project only
after every step is ready. The UI submits that result through one
`ProjectSession.mutate` call. The whole macro is therefore one canonical undo
point; an invalid step cannot leave a partially edited project.

The original starter set contains two project-tempo recipes, a deterministic
tempo A/B cycle and, when tracks exist, a safe unmute/clear-solo recipe. It does
not execute when installed.

### Package and extension boundary

Package kinds are `action_pack`, `theme`, `language_pack`, `script`, `dsp` and
`native_extension`. Trust is `declared`, `verified` or `quarantined`.

The browser UI can declare metadata only. It never:

- downloads a source reference;
- reads a local package file;
- imports action contents;
- injects CSS or translated strings;
- loads a script, DSP module or native binary;
- grants file, network, audio, MIDI or native-host access; or
- marks a package verified without digest-matched reviewer evidence.

Verified script, DSP and native-extension manifests still report
`host_adapter_required` and `canExecute: false`. This is a security property,
not a missing UI toggle.

### Product surfaces

The Action & Extension Workshop is available through:

- Edit, Project, Production and Devices menus;
- the rack library and drag/add catalog;
- the Editing Actions & Recall Rig template;
- the Studio library catalog;
- desktop, tablet and phone rack layouts; and
- project-level undo and redo controls.

## Follow-on acceptance gates

The following are deliberately not claimed complete:

1. A global searchable command palette and user key/controller binding editor.
2. User-authored arbitrary action recipes in a full visual builder.
3. Selection-context actions for clips, envelopes, regions and score objects.
4. Transactional repository sync, download staging, signature transparency,
   dependency resolution, downgrade/rollback and obsolete-package handling.
5. A constrained theme-token renderer with contrast and motion acceptance tests.
6. A localization extraction/merge tool with plural rules, right-to-left layout
   tests, fallback coverage and stale-string reports.
7. A sandboxed scripting language with quotas, cancellation, scoped host APIs,
   deterministic project transactions and signed distribution.
8. A real-time-safe DSP SDK and crash-isolated native extension host.
9. Render-queue execution and verified dry-run audio statistics.
10. Full action audit logs, controller learn and portable configuration export.

Each item needs its own implementation and evidence. The existence of package
metadata must never be used as proof that an extension is installed, compatible,
safe, active or producing audio.

## Reference set

- <https://www.cockos.com/>
- <https://www.reaper.fm/about.php>
- <https://www.reaper.fm/download.php>
- <https://www.reaper.fm/purchase.php>
- <https://www.reaper.fm/userguide.php>
- <https://www.reaper.fm/videos.php>
- <https://www.reaper.fm/sdk/reascript/reascript.php>
- <https://www.reaper.fm/sdk/js/js.php>
- <https://www.reaper.fm/sdk/plugin/plugin.php>
- <https://www.reaper.fm/sdk/walter/>
- <https://www.reaper.fm/langpack/>
- <https://sws-extension.org/>
- <https://github.com/cfillion/reapack>
- <https://stash.reaper.fm/>
- <https://stash.reaper.fm/tag/Themes>
- <https://reaperblog.net/> (unofficial; context only)
- <https://github.com/Cockos-Reaper-DAW> (unverified community organization; no code used)
