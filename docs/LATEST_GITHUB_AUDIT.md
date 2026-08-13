# Latest Google Studio / GitHub prototype audit

Audit date: 2026-08-13

Source: `jayprophit/Studio-Daw-Station-SDS-`, default branch `main`

Latest inspected commit: `536ea275e9b6c58f578656d3a9ab9caf1233d6be`

This repository is treated as a concept and interaction source, not a replacement
for the validated local Poietek build. It currently has four commits. The latest
two add a large audio clip editor, direct-to-disk recorder, preset/demo bar,
right sidebar, virtual keyboard, project manager, language UI, platform modal,
analyser and additional rack/console presentation.

## Strong ideas retained or mapped

| Prototype idea | Poietek treatment |
| --- | --- |
| Modular arranger, rack, browser and console | Preserve as separate focused workspaces backed by one canonical project. |
| Audio clip inspector | Map only to durable non-destructive clip commands. Do not keep a second clip truth in React state. |
| Direct-to-disk recording | Use the existing recording backend, asset ingestion, cleanup and explicit capability states. |
| Project manager | Use `ProjectRepository`, `ProjectSession`, recovery and asset storage—not a metadata-only local-storage list. |
| Analyser and meters | Keep as a UI goal. Measurements must come from the routed audio graph and label their actual measurement type. |
| Dockable sidebars and bottom panel | Keep as workspace-layout inspiration; persist layout separately from the creative project. |
| Virtual keyboard | Retain as a planned accessible MIDI input surface once the durable MIDI-note model and instrument graph are active. |
| Presets and demos | Use original Poietek recipes and recordings only. Never copy commercial factory content. |
| Language and accessibility | Keep real translated interface strings and RTL/accessibility support; do not label string decoration as AI translation. |
| AI assistant | Replaced by the independent local Studio Brain plus optional secure model adapters. |

## Reproduced and source-confirmed defects

1. **The supplied preview URL was blank.** The browser still had a cached Poietek
   HTML shell at `127.0.0.1:4181`, but the root was empty and a direct connection
   to that port was refused. A preview launcher must own the server lifecycle and
   report a stopped server instead of leaving a white cached shell.
2. **No production quality gate.** The remote `package.json` is still named
   `react-example`, has only `dev`, `build`, `preview`, `clean` and a TypeScript
   `lint` alias, and declares no test or formatting workflow. The POSIX `rm -rf`
   clean command is not portable to normal PowerShell use.
3. **The AI groove feature is simulated.** It waits with `setTimeout`, returns a
   fixed description and labels the result as Gemini-generated without making a
   model request or recording model/evidence provenance.
4. **Export does not render the project.** `renderProjectToWav` synthesizes a new
   16-second random drum/chord demo. It does not render the clips, routing,
   automation or device state the user made.
5. **Project persistence is metadata-only.** The project manager delays for 250
   ms and stores a project list in `localStorage`. The load callback in `App.tsx`
   triggers a save rather than loading a canonical project and assets.
6. **Durable truth remains in a very large React component.** `App.tsx` is over
   900 lines and owns extensive rack, window, panel, project and workspace state.
7. **Settings are presentation values rather than negotiated engine state.** The
   modal writes many unrelated strings to `localStorage`; selected sample rate,
   buffer, driver and MIDI settings are not proof that the browser or hardware
   accepted them.
8. **Recording/download lifecycle is incomplete.** The direct recorder creates
   an object URL for WAV download without revoking it. Resource cleanup must be
   owned by the recorder/export lifecycle.
9. **Unsupported platform claims are displayed as fact.** The UI says “100%
   feature parity”, “instant cloud sync”, “zero configuration”, “all modalities
   ready” and automatic support for input devices that have not been enumerated
   or negotiated.
10. **The language “AI” is not translation.** For most inputs it appends a flag
    and language name; it must be labelled unavailable or routed to a configured
    translation implementation.
11. **Nondeterministic generated media is mixed with product behavior.** The
    audio engine uses many `Math.random()` paths for generated factory samples,
    effects and the false project export. Original procedural content needs a
    seed, recipe/version provenance and repeatable tests.
12. **Unsafe type escapes and unverified profiles remain.** `as any` is used in
    platform/profile paths, weakening the capability checks needed for hardware,
    native and mobile behavior.
13. **Commercial product identity appears in UI and content descriptions.** The
    useful workflow ideas can be abstracted, but product names, factory banks,
    presets, logos and copyrighted sounds must not become Poietek content.

## Integration decision

No remote file was copied wholesale. The local build already has stronger
implementations for projects, media, recording, waveforms, playback, export,
recovery, settings, hardware truth and offline deployment. The first selected
integration slice is therefore the missing AI product:

- operational independent offline assistant;
- project-aware evidence-linked findings;
- OpenAI, Anthropic, Gemini, xAI, DeepSeek, Kimi and Hugging Face metadata;
- local Ollama adapter;
- external connector states for Microsoft Copilot and Manus;
- OpenAI-compatible and custom-module extension points;
- IndexedDB settings with remote AI disabled by default;
- secure-store credential references only;
- per-request remote consent;
- no automatic project mutation.

## Source update procedure

Future Google Studio exports should be compared by commit SHA. Import only a
bounded feature or interaction pattern at a time, write a migration into the
canonical model, run the full verification suite, and record why each remote
implementation was accepted, rewritten or rejected.
