# Nuendo Post-Production Workflow Abstraction

Date: 2026-08-22
Status: clean-room product study plus implemented Poietek slice
Scope: Nuendo 15, its post-production disciplines, and closely related Steinberg production products

## Purpose and boundary

This study extracts general workflow lessons from Steinberg's official public product and help material. It does not copy Steinberg source code, visual identity, plug-ins, factory presets, sounds, documentation text, protected algorithms, trademarks as product branding, or proprietary interchange implementations.

Poietek remains an original local-first application. A saved control or project record must never masquerade as decoded video, active recording, measured intelligibility, Dolby Atmos rendering, Wwise connectivity, AAF/EDL interchange, or a finished broadcast deliverable. Those claims stay unavailable until a reviewed adapter returns evidence and passes fixtures.

The broader Steinberg scoring, music-production, spectral, mastering and content taxonomy remains in [STEINBERG_WORKFLOW_ABSTRACTION.md](STEINBERG_WORKFLOW_ABSTRACTION.md). This document focuses on the deeper Nuendo pass requested after that foundation.

## Official Nuendo 15 model

Steinberg positions Nuendo as an audio post-production and game-sound workstation. The current feature catalog groups work by post production, game audio, virtual reality, video, dialog editing, sound design, ADR, composing, recording, panning, mixing, project merge, export/delivery, networking, effects and content. That discipline-first navigation is more useful than presenting a long undifferentiated plug-in list.

Nuendo 15 adds or expands the following themes:

- an Analyzer Track for real-time or offline dialogue-intelligibility analysis;
- a revised film-mixing automation system with compact/dockable controls, touch-based parameter selection, automation copy/paste and clearer states;
- a redesigned ADR panel;
- MXF video import and additional video export options;
- channel-layout conversion and folder-owned group routing;
- scalable stock plug-in interfaces, a redesigned hub and broader DAWproject interchange;
- refined scoring and articulation tools inherited from the wider Steinberg music-production stack.

Sources:

- <https://www.steinberg.net/nuendo/new-features/>
- <https://www.steinberg.net/nuendo/features/>
- <https://www.steinberg.net/press/2026/nuendo-15/>
- <https://www.steinberg.net/nuendo/release-notes/15/>

## Workflow chain and Poietek response

| Production stage | Official Nuendo lesson | Poietek response in this pass | Remaining evidence gate |
| --- | --- | --- | --- |
| Session setup | Picture projects require explicit frame rate, timecode and video discipline; variable-frame-rate material is not treated as a safe professional baseline. | Project-owned frame-rate selection, validated start timecode, video asset reference and picture-follow intent. | Codec inspection, constant-frame-rate verification, decoded video and frame-clock evidence. |
| ADR preparation | ADR is marker-driven; cycle markers supply start/end positions, dialogue attributes and target context. | Canonical cues with number, kind, frame range, character, dialogue, notes, target track, field metadata and preferred take. | TTAL/EdiCue/ADR API and production CSV import fixtures. |
| Talent prompting | Pre/post roll, swipes, counters, timecode and dialogue overlays help talent focus on picture. | Durable overlay settings and an original talent-overlay preview inside the rack. | Frame-synchronous external video/talent display. |
| ADR operation | Rehearse, Record and Review are distinct transport states. | Explicit rehearse, record-ready and review *intent* plus approval status. | Physical input route, active capture stream, pre-record buffer and monitored playback evidence. |
| Takes | Dialogue and Foley sessions organize multiple takes against cues. | Take log references real canonical audio assets; one take can be marked preferred per cue. | Live ADR capture and external taker/session integration. |
| Production audio | Field Recorder Audio Import scans BWF/iXML metadata and proposes matching scene/take/tape recordings. | Deterministic scene/take/tape proposals from metadata already attached to canonical audio assets. | Filesystem scan, BWF/iXML parser, waveform audition and lane import. |
| Picture revisions | ReConform compares old/new EDLs, previews a Change EDL, requires manual validation and then applies edits. | Deterministic preview records unchanged, shifted and manual-review cues; stale or incomplete previews fail closed; safe apply is one `ProjectSession` undo point. | CMX3600/AAF parser, event-level audio conform, crossfade and picture replacement engine. |
| Interchange | Marker data can move through CSV/EDL and cue-oriented workflows. | Chronological, safely escaped local CSV cue-sheet export. | Encoding chooser, CSV/EDL/TTAL import, schema mapping and fixture corpus. |
| Mix and analysis | Dialogue intelligibility, loudness, automation, Adaptive Background Attenuation and post effects support final mixing. | Existing mixer, control room, spectral and offline-process foundations remain available beside the post workbench. | Validated BS.1770/true-peak/intelligibility analyzers, automation lanes, real DSP and film-mix control surface. |
| Immersive | ADM authoring, beds/objects, internal/external renderers, downmixes and Ambisonics require exact routing and format constraints. | Existing Spatial Route Designer saves bed/object/layout intent and keeps renderer claims gated. | Multichannel route observation, validated renderer, ADM import/export and 48 kHz delivery qualification. |
| Export | Job queues validate ranges, unique naming, selected channels and formats before rendering stems/cues. | Existing delivery-plan foundation plus locally working cue-sheet export; unsafe media deliverables remain disabled. | Render queue, cancellation cleanup, stems, naming engine, MXF/video codecs and standards QC. |
| Game audio | Game Audio Connect coordinates asset selection, preview, export, Wwise/WAAPI and optional Perforce. | No fake connection was added. The action/package foundations can later own explicit export recipes and provenance. | Reviewed WAAPI/game-engine adapter, authenticated network model, iXML payload fixtures and version-control integration. |

Official workflow sources:

- ADR and markers: <https://www.steinberg.help/r/nuendo/15.0/en/cubase_nuendo/topics/adr/adr_adr_and_marker_selection_c.html>
- ADR video/overlay setup: <https://www.steinberg.help/r/nuendo/15.0/en/cubase_nuendo/topics/adr/adr_adr_setup_video_r.html>
- Marker/ADR window: <https://www.steinberg.help/r/nuendo/15.0/en/cubase_nuendo/topics/markers/markers_marker_window_r.html>
- Field Recorder Audio Import: <https://www.steinberg.help/r/nuendo/15.0/en/cubase_nuendo/topics/audio_editing_to_picture/audio_editing_to_picture_field_recorder_audio_import_window_r.html>
- ReConform workflow: <https://www.steinberg.help/r/nuendo/15.0/en/cubase_nuendo/topics/reconform/reconform_workflow_c.html>
- EDL structure: <https://www.steinberg.help/r/nuendo/15.0/en/cubase_nuendo/topics/reconform/reconform_edls_r.html>
- Frame rates: <https://www.steinberg.help/r/nuendo/15.0/en/cubase_nuendo/topics/video/video_frame_rates_c.html>
- Marker CSV import: <https://www.steinberg.help/r/nuendo/15.0/en/cubase_nuendo/topics/markers/markers_importing_a_csv_file_t.html>
- CSV export: <https://www.steinberg.help/r/nuendo/15.0/en/cubase_nuendo/topics/markers/markers_exporting_markers_as_csv_file_t.html>
- Dolby Atmos authoring: <https://www.steinberg.help/r/nuendo/15.0/en/cubase_nuendo/topics/surround_sound/surround_sound_adm_authoring_dolby_atmos_about_c.html>
- Game Audio Connect: <https://www.steinberg.help/r/nuendo/15.0/en/cubase_nuendo/topics/game_audio_connect/game_audio_connect_c.html>
- Export job queues: <https://www.steinberg.help/r/nuendo/15.0/en/cubase_nuendo/topics/export_audio_mixdown/export_audio_mixdown_exporting_multiple_files_using_job_queues_t.html>

## Effects and content lessons

Nuendo's stock catalog spans restoration and dialogue tools, channel EQ and dynamics, post filtering, comparison EQ, saturation, modulation and sound-design effects, immersive panners, test/timecode generators, surround downmixing, headphone compensation, instruments, presets and production/game sound libraries.

Poietek should abstract that breadth into task-led families:

1. dialog cleanup and intelligibility;
2. editorial gain, fades and offline revision chains;
3. creative sound design and spectral layers;
4. surround/immersive placement and monitoring;
5. test, sync and diagnostic utilities;
6. searchable, rights-aware sound effects and presets;
7. standards-aware mastering and delivery.

This pass does not copy or rebundle any Steinberg content. Poietek's Sound Atlas remains original and rights-aware. Effects that are not backed by tested DSP remain control models or adapter requests.

## Related Steinberg ecosystem lessons

- **Nuendo Live** emphasizes fast setup, a single reliable record view, arm-all, naming schemes, pre-record, marker management, timecode reception and virtual soundcheck. Poietek already abstracts these ideas in the Live Session Hub, while physical recording and soundcheck stay evidence-gated. Official source: <https://www.steinberg.net/nuendo-live/features/>.
- **VST Connect Pro** extends remote recording and ADR with cue mix, talkback, performer-side local capture and remote prompting. Poietek's Remote Performer Session preserves the useful local-record-first and consent concepts without claiming a Steinberg cloud connection. Official source: <https://www.steinberg.net/vst-connect/>.
- **WaveLab Go / WaveLab** contributes repair, analysis and mastering workflow. Poietek keeps spectral/offline work non-destructive and delivery analysis fail-closed where no validated engine exists.
- **Cubase/Dorico-derived composing and scoring** explains why a post workstation still needs expression maps, music tools and notation. Poietek's Score & Parts Workbench remains a canonical project foundation with MusicXML/engraving gates.

## Implemented architecture

The new core is `src/poietek/production-workflows/picturePost.ts`.

It provides:

- extension key `org.poietek.picture-post`, schema `1.0.0`;
- project and revision ownership;
- SMPTE conversion for 23.976, 24, 25, 29.97, 29.97 drop-frame, 30, 30 drop-frame, 50, 59.94 and 60 workflows;
- invalid drop-frame label rejection;
- canonical ADR/Foley/SFX/music/review cues;
- honest ADR session intent and approval states;
- canonical audio-asset take references and preferred-take validation;
- scene/take/tape metadata match proposals;
- deterministic Change-EDL-style segment previews;
- manual-review blocking for gaps, cut crossings and duration changes;
- stale-preview rejection and atomic application;
- chronological CSV cue-sheet generation;
- project validation and JSON-safe round trip.

The dedicated rack workbench exposes five touch-safe views:

1. ADR cues and talent overlay;
2. stored take references;
3. ReConform preview/apply;
4. field-audio metadata proposals;
5. cue-sheet delivery and explicit native gates.

The Production and Devices menus route to the workbench, and the new **Dialog, ADR & Foley Post Rig** connects it to the arrangement, spectral/offline tools, mixer, control room and delivery foundation.

## Acceptance evidence in this pass

Focused tests prove:

- non-drop and drop-frame round trips plus skipped-label rejection;
- canonical project round trip;
- audio-only take references and cross-cue preferred-take rejection;
- intent-only ADR states;
- metadata-evidence matching;
- deterministic safe/blocked reconform plans;
- stale plan rejection;
- chronological escaped CSV;
- one-step ProjectSession apply/undo/redo;
- cross-project, missing-track and missing-video rejection.

## Next production slices

1. Define a fixture-driven CMX3600 reader and Change EDL mapping without direct filesystem mutation.
2. Add CSV/TTAL mapping with encoding preview, attribute assignment and explicit import confirmation.
3. Implement real BWF/iXML metadata extraction in a least-privilege native adapter.
4. Connect cue ranges to canonical timeline events while preserving non-destructive source offsets and fades.
5. Build frame-accurate picture decode tests using constant-frame-rate fixtures and measured A/V sync.
6. Connect browser/native input capture to selected ADR cues and retain actual stream evidence.
7. Add a cancellable validated stem/job queue and unique naming-plan preflight.
8. Qualify real dialogue intelligibility, BS.1770 loudness and true-peak analyzers against standards fixtures.
9. Add ADM/immersive adapters only after multichannel route, 48 kHz, object/bed and export validation.
10. Add a separately permissioned game-audio adapter; never enable Wwise, WAAPI, Perforce or engine claims from a saved setting alone.
