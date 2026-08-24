# Killa Vic tool abstraction for Poietek

Reviewed live on 2026-08-22. These public tools are workflow references only.
Poietek does not copy their code, interface, names, images, audio catalogues,
factory content, text, commercial claims or protected export implementations.

## Terminator

Observed workflow: acquisition and live recording, BPM/tap/click, project
save/open, MIDI rescan, waveform, pads, sequencer, drums, bass, beat finisher,
mixer, sends, gain matching, delay compensation, insert chains and export.

Poietek adopts one progressive path from capture to arrangement, clear project
and MIDI states, sample/drum/bass/return/master routing, and effects as project
data. The existing Arrange/Rack/Console shell stays canonical. Sample Record &
Recall now performs real browser capture, local import, track/clip creation and
take recall; native inserts and PDC remain measured engine gates.

## MPC Extractor

Observed workflow: provide a project manifest plus sample-data folder, load or
drop both, process locally, offer a demo and optionally use a desktop app.

Poietek adopts a focused numbered-input workflow, demo fixtures, explicit
local-only processing and validation before extraction. `StemExtractionJob`
separates manifest, source folder, adapter, outputs and limitations. Third-party
formats remain unsupported until specifications, licences and fixtures are
reviewed; possession of a folder never implies redistribution rights.

## Baethoven

Observed workflow: key, octave, scale and feel; scale/chord/drum/custom banks;
sixteen pads; chord spelling; keyboard/MIDI assignments; browse/load/clear; and
undo/redo.

Poietek's pure `createHarmonyPadBank` engine creates deterministic scale-safe
single-note, triad or seventh banks with visible MIDI notes. It needs no copied
samples. Feel/style will be a previewable transformation with undo and provenance.

## Julienne

Observed workflow: load/library/recents, turntable playback, speed, brake, ramp,
pitch, BPM/tap, tempo-lock stretch, non-destructive trim, waveform, chop markers,
zoom/fit, snap/grid, chop offset, gate, metronome, MIDI learn, eight banks of
sixteen pads and multiple DAW exports.

Poietek's `ChopMap` supports 128 sorted non-destructive ranges across eight banks,
MIDI assignment, gate and by-ear offset. A source/project BPM mismatch requires a
time-preserving backend and never silently uses tempo-changing playback rate.

## Drum Dojo

Observed workflow: genre starting points, six lanes, steps, mute/randomize,
velocity/shift/pan/repeat layers, BPM/sync, swing, pattern duplicate, undo/redo,
generation, groove extraction, MIDI, stems and project export.

Poietek's `DrumPattern` stores 16/32/64-step lanes with probability, velocity,
shift, pan, repeat, mute and swing. `renderDrumPattern` is deterministic for a
seed, enabling undo, tests and reproducible renders. Kits may contain only
original, procedural, commissioned, licensed or user-supplied sounds.

## Cypher Grid

The public route is account-gated. Its visible promise is melody generation,
piano-roll editing and royalty-status messaging. Poietek adopts the separation
between generation and editing, not blanket ownership language. Generated work
must record input lineage, algorithm/model, policy/licence evidence, preview state
and explicit creator acceptance.

## Feedback and ideas

The supplied `/ideasv` route returns 404; `/ideas` is active. It groups feedback
by tool and advertises account-free suggestions and voting. Poietek's
`LocalFeedbackIdea` begins as a private local draft. External submission is a
separate consented action with provider acknowledgement; projects, media, device
details and logs are never attached implicitly.

## Quality and architecture observations

- Baethoven and Julienne emitted a MutationObserver error involving a non-Node
  target. Poietek keeps console-clean visual acceptance as a release gate.
- Several reference tools are iframe-isolated. Poietek keeps one canonical
  project, command history and capability router so modules do not become silos.
- Login gates prevent full verification of some behavior; hidden behavior is not
  treated as evidence.

## Content-library policy

Competitor banks, playlists, loops and factory content are not source material.
Poietek uses original procedural audio, original recordings, commissioned packs,
public-domain material with provenance, reviewed licensed content, and local
user-supplied media. Every asset records hash, origin, licence/evidence, allowed
uses, attribution, derivatives, replicas and retention. Missing evidence means
unavailable for commercial redistribution—not “royalty free.”
