# Steinberg workflow abstraction for Poietek

Research refreshed: 2026-08-23

## Purpose and boundary

This study uses Steinberg's current public product pages, tutorials, support
architecture, stories and the two supplied product-menu screenshots as workflow
references. It extracts transferable production principles. It does not copy
Steinberg source code, product artwork, layouts, names for Poietek devices,
factory sounds, presets, sample content, licences, SDKs or proprietary
processing.

The screenshots were treated only as evidence of product and content taxonomy.
They show a portfolio organized around core applications, instruments,
expansions, sounds and loops, mobile applications, interfaces, remote/live
software and bundles. They were not treated as implementation instructions.

## What the portfolio teaches

### Cubase: an integrated music-production core

The current Cubase feature catalogue groups work into composing, recording,
sequencing, audio editing, mixing, instruments, effects, MIDI effects,
collaboration and video. High-value patterns for Poietek are:

- a Control Room distinct from the project mixer, with monitor sources, cue
  paths, dim, mono, talkback and references;
- composition services such as chord/harmony assistance, tempo/arranger tracks,
  note expression, articulation-aware MIDI and logical transforms;
- reversible editing through comping, audio pre-record, retrospective record,
  alignment, group editing, render-in-place and direct offline processing;
- one mixer surface for routing, channel strips, visibility, history,
  snapshots, VCA-like grouping and standards-aware meters;
- picture support and remote recording as production workflows rather than
  unrelated extras.

Poietek already has Arrange, Rack, audio import, waveforms, timeline playback,
editing, recording services, local durability and a console foundation. This
slice adds the missing monitor, MIDI logic, offline-process and cross-discipline
entry points without pretending their unavailable engines are complete.

Official references:

- <https://www.steinberg.net/cubase/>
- <https://www.steinberg.net/cubase/features/>
- <https://www.steinberg.net/cubase/new-features/>
- <https://www.steinberg.net/cubase/release-notes/15/>

The current Cubase 15 material adds several useful signals beyond the earlier
survey: redesigned Expression Maps with attack compensation and editor
integration, Pattern Sequencer and Modulators, stem separation, folder-track
summing, automation improvements, DAWproject exchange, quick export and a
redesigned Hub. Poietek treats these as workflow evidence, not a list of names
or UI to reproduce. The highest-value missing foundation was the durable bridge
between score markings and explicit instrument-switch intent; that is the slice
implemented in this refresh.

### Nuendo: post-production is a system, not one effect

Nuendo's public feature structure separates post production, game audio,
virtual reality, video, dialog editing, sound design, ADR, panning, mixing,
project merge, export/delivery and network features. The important abstraction
is the complete chain:

1. ingest picture, production sound and field-recorder material;
2. preserve timecode, versions, markers and reconform information;
3. edit dialog and sound design non-destructively;
4. manage ADR/Foley cues, takes, scripts and talent feedback;
5. pan and monitor stereo, surround, object, Ambisonic and binaural paths;
6. export stems, picture, interchange and queued delivery jobs with evidence.

Poietek now represents that chain with Picture & Dialog Post, Spatial Route
Designer, Revision Process Chain, Spectrum Layer Lab and Master Sequence &
Delivery devices. Codec, frame-clock, dialog AI, immersive renderer and delivery
backends remain explicit gates.

Official references:

- <https://www.steinberg.net/nuendo/>
- <https://www.steinberg.net/nuendo/features/>

The current Nuendo catalogue also reinforces Analyzer Track, Audio Batch
Analysis, Dialogue Transcription, Video Cut Detection, field-recorder import,
ReConform, AAF, Clip Packages, immersive panning and ADM/Dolby Atmos delivery.
Poietek keeps those as separate evidence-gated systems: a visible post control
never implies that a model, codec, licensed renderer or interchange parser ran.

### Dorico: scoring needs its own durable musical model

Dorico's product architecture treats notation as a first-class composition
system. Its public feature catalogue is divided into highlights, general,
notations, playback, engraving, input/editing, import/export and printing. The
five-mode structure—Setup, Write, Engrave, Play and Print—is particularly useful
because it separates musical truth from presentation and delivery.

Poietek's new score foundation includes:

- serializable score documents stored under a versioned canonical-project
  extension;
- players, instruments, transposition and staff counts;
- flows, time signatures, key signatures and consecutive measures;
- written pitches with explicit spelling, octave and alteration;
- voices, beat positions, durations, articulations, dynamics and lyrics;
- full-score and automatic per-player part layouts;
- validated part extraction;
- score modes for setup, writing, engraving intent, playback intent and print;
- articulation interpretation, project-tempo following and score-to-picture
  attachment intent;
- MusicXML export requests which stay unavailable without a validated adapter.

The interactive Score & Parts Workbench exposes the five modes, player/part
count, articulation playback and picture-follow controls. It is a real,
validated data foundation and an interactive control surface; it does not yet
claim professional engraving, notation audio playback, printing or MusicXML
conformance.

Official references:

- <https://www.steinberg.net/dorico/>
- <https://www.steinberg.net/dorico/features/>
- <https://www.steinberg.net/dorico/new-features/>
- <https://www.steinberg.help/r/dorico-pro/6.1/en/dorico/topics/library/library_playback_techniques_c.html>
- <https://www.steinberg.help/r/dorico-pro/6.1/en/dorico/topics/library/library_expression_maps_dialog_r.html>
- <https://www.steinberg.help/r/dorico-pro/6.1/en/dorico/topics/play_mode/play_mode_playback_templates_c.html>

Dorico 6 adds another important abstraction: proofreading, cutaways, cycle
playback, chord-symbol rows, improved MusicXML and score/key-editor development
all sit on top of the musical model. Its manuals distinguish persistent
direction techniques from one-note attribute techniques, allow mutual-exclusion
groups, and connect notations to expression/percussion maps and playback
templates. The new Poietek Technique Matrix uses those general principles in an
original provider-neutral schema.

### SpectraLayers: waveform and spectral domains should cooperate

SpectraLayers presents audio as selectable visual material organized into
layers, with manual spectral selection plus assisted separation, repair and
restoration. Its ARA-oriented integration highlights a valuable principle:
specialist editors should preserve non-destructive timeline context instead of
creating disconnected copies by default.

Poietek's Spectrum Layer Lab therefore stores selection mode, intended
operation, sensitivity and preview-only policy. It exposes the request and its
adapter boundary in the Rack and Production Workflow Map. It never fabricates a
spectrum, isolated object, repaired result or separated stem.

Official references:

- <https://www.steinberg.net/spectralayers/>
- <https://www.steinberg.net/spectralayers/new-features/>

SpectraLayers 13 expands the same selection-first model with sound-effect and
voice separation, ambience reconstruction/healing, repair tools, level checks,
layout presets, batch project opening and a larger host bridge. Poietek keeps
those capabilities visible as requested operations while analysis and render
results remain blocked behind reviewed adapters.

### WaveLab: mastering needs sequence, batch and delivery contexts

Although WaveLab was not one of the initial typed URLs, it appears in the
supplied product menu and is part of the same public portfolio. Its public
overview distinguishes single-file Audio Editor work, multi-clip Audio Montage,
batch processing, spectral editing, hardware/external editor integration and
immersive mastering.

Poietek abstracts these ideas into Revision Process Chain and Master Sequence &
Delivery. The core process chain is immutable and revisioned, preserves
per-process bypass and defaults to preview-only. A render request becomes ready
only when an offline renderer observation exists. Delivery can store profile,
loudness target and true-peak limit intent, but standards are visibly not
measured until reviewed BS.1770 and oversampled true-peak analyzers return
evidence.

Official reference:

- <https://www.steinberg.net/wavelab/>
- <https://www.steinberg.net/wavelab/new-features/>
- <https://www.steinberg.net/wavelab/release-notes/13/>

WaveLab 13 reinforces multichannel/Atmos montage work, multicore rendering,
A/B-synchronized tabs, protected files, stem/group rendering and delivery
reports. These findings strengthen Poietek's separation between mastering
policy, measured analysis, approved render and delivery evidence.

### Instruments, content and product topology

Steinberg's public instrument catalogue uses understandable families—bundles,
samplers, guitars, cinematic, bass, drums/percussion, vocal, orchestra, strings,
keys, synthesizers, world and mobile—and separates software instruments from
expansions, sounds/loops and bundles. Its More Products taxonomy separates
software, apps, interfaces and bundles.

Poietek benefits from the taxonomy but not the commercial content itself:

- Studio Setup continues to catalogue original modules, effects, MIDI tools,
  utilities, procedural content and user/third-party boundaries;
- the catalogue includes the expanded production workflow family and each exact
  limitation;
- original or licensed content remains mandatory; Steinberg banks, presets,
  loops, sounds and trademarks are not bundled;
- platform applications and hardware integrations remain adapters to the same
  project truth, not separate incompatible products.

Official reference:

- <https://www.steinberg.net/vst-instruments/>
- <https://www.steinberg.net/vst-instruments/halion/>
- <https://www.steinberg.net/audio-interfaces/>
- <https://www.steinberg.net/cubasis/update/>
- <https://www.steinberg.net/vst-live/>
- <https://www.steinberg.net/vst-connect/>

The wider current portfolio also confirms why one canonical project must serve
desktop, mobile and performance surfaces. Cubasis provides mobile production
and DAWproject exchange; VST Live organizes shows and media; VST Connect keeps
remote performer recordings local-first; HALion and Absolute organize an
instrument/content ecosystem; and the IXO/UR interface families expose real I/O
only through hardware and driver capability. Poietek abstracts these as shared
project truth plus independently observed platform, content and device adapters.

### Tutorials, support and stories: learning is part of the product

The public Tutorials area covers getting sound in/out, connecting hardware,
recording, basic processing, effects, mixing, mastering, songwriting, samples,
loops and genre workflows. The Help Center separates searchable support,
downloads, manuals, forums, videos and contact. Stories organize proof around
working creators and real disciplines such as scoring, spectral repair,
mastering and immersive sound.

Poietek applies this structurally:

- Help now opens a Production Workflow Map in Ecosystem;
- the map explains what every workflow can do locally and which evidence is
  still required;
- Setup's searchable Modules & Content catalogue includes every new workflow;
- a Score to Picture & Delivery template demonstrates the connected system;
- unavailable capabilities stay discoverable with reasons instead of vanishing
  or appearing as fake working buttons.

Official references:

- <https://www.steinberg.net/tutorials/>
- <https://helpcenter.steinberg.de/hc/en-us>
- <https://www.steinberg.net/stories/>

## Implemented Poietek production family

| Poietek module | Local implementation now | Honest remaining gate |
| --- | --- | --- |
| Score & Parts Workbench | Score modes, validated score document, players, flows, measures, notes, written pitch, parts and project extension | Engraving engine, playback renderer, printing and MusicXML conformance |
| Technique Matrix & Score Bridge | Versioned direction/attribute techniques, mutual-exclusion groups, normalized score bindings, exact keyswitch/CC/program slots, attack compensation, deterministic tick plan, stale-plan refusal, canonical commit and undo | Live MIDI dispatch, plug-in host response, audible articulation playback and reviewed third-party map import |
| Logic Note Transformer | Tested range filter, transpose, velocity scale and channel remap | Active MIDI input/output adapter |
| Monitor, Cue & Talkback | Source, format, cue, dim, mono and talkback state plus strict route evaluation | Observed native route and active monitor stream |
| Spectrum Layer Lab | Selection, operation and preview-only request model | Spectral analysis and process renderer |
| Revision Process Chain | Immutable steps, bypass, revision and renderer request | Offline renderer and project-session commit of returned asset |
| Picture & Dialog Post | Timecode, picture-follow, proxy and ADR control model | Decode, frame clock, A/V sync, reconform and video render |
| Spatial Route Designer | Format, bed/object and binaural-preview intent | Multichannel route and compatible immersive renderer |
| Master Sequence & Delivery | Delivery profile and standards-target intent | BS.1770, true peak and validated delivery render |
| Remote Performer Session | Role, consent, local-record-first and transfer intent | Authenticated session and encrypted transfer evidence |

## Architecture decisions

1. Score truth lives in `PoietekProject.extensions`, not only in React state.
2. Production workflow definitions are shared by Rack and Ecosystem so status
   language cannot drift silently.
3. A configured control is not equivalent to an active processor, device,
   renderer, remote participant or external acceptance.
4. Native and remote functionality attaches through observed adapter
   capabilities.
5. Offline processing returns a new asset revision; it does not destructively
   overwrite the source.
6. Target LUFS and dBTP values are policy intent, never measurement results.
7. Original Poietek naming and presentation remain distinct from every reference
   product.
8. Score technique plans match exact technique sets. Unknown articulations,
   mutual-exclusion conflicts and stale previews fail before project mutation.

## Implemented slice: Technique Matrix & Score Bridge

The versioned `org.poietek.performance-techniques` project extension owns maps,
assignments and committed adapter-intent records. The starter map is original
Poietek data and includes persistent directions, one-note attributes,
mutual-exclusion rules, normalized score bindings, exact sound slots and
explicit keyswitch actions. Planning is pure and deterministic: score beat
positions become exact project ticks, directions carry forward, attributes do
not, and attack compensation changes only trigger dispatch time.

The score itself and all source assets remain unchanged by a plan commit. The
commit re-derives the plan and rejects stale score, map, assignment, PPQ or track
state before recording `planned_for_adapter` through `ProjectSession`. It does
not generate MIDI clips, send MIDI bytes, host an instrument or claim sound.
The **Composer Technique & Playback Intent Rig** and updated **Score to Picture
& Delivery Rig** connect this bridge to Score & Parts, Note Forge, an original
instrument surface, mixing and monitoring.

## Five-star exit path for this family

This slice is a foundation, not a five-star completion claim. The production
family can qualify only after:

- score editing is integrated into the canonical command/undo timeline and
  passes MusicXML round-trip, engraving, accessibility and print fixtures;
- live technique dispatch is validated against real instruments, scheduling,
  latency, chase/reset behavior, project reload and third-party interchange
  fixtures without weakening exact-match or conflict gates;
- control-room routing is verified with physical multi-output interfaces,
  talkback, cue paths, reconnect and measured latency;
- spectral and offline renders pass deterministic audio fixtures, cancellation,
  preview/commit and recovery tests;
- picture post passes codec, proxy, timecode, frame-accuracy, A/V sync, ADR and
  reconform acceptance;
- surround/immersive paths pass channel-layout, renderer, binaural/downmix and
  delivery fixtures on supported hosts;
- BS.1770 loudness, oversampled true peak, batch render and delivery QC are
  independently validated;
- remote sessions pass identity, consent, encryption, dropout, resume, local
  fallback and rights/privacy review.
