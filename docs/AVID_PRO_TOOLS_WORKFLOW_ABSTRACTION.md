# Avid Pro Tools workflow abstraction for Poietek Studio

Date: 2026-08-23

Method: clean-room product, workflow, documentation and support analysis from Avid's public official material.

Implementation target: original Poietek terminology, interface, algorithms, schemas and local-first project services.

## 1. Official source set reviewed

- [Pro Tools product overview](https://www.avid.com/pro-tools)
- [Avid support](https://www.avid.com/support)
- [Current Pro Tools documentation](https://kb.avid.com/pkb/articles/en_US/Knowledge/Pro-Tools-Documentation)
- [Pro Tools 2026.4 release notes](https://kb.avid.com/pkb/articles/en_US/Knowledge/Pro-Tools-2026-4-Release-Notes)
- [Pro Tools Quick Reference Guide](https://resources.avid.com/SupportFiles/PT/Pro_Tools_Quick_Reference_Guide.pdf)
- [Pro Tools operating-system compatibility](https://kb.avid.com/pkb/articles/en_US/Compatibility/Pro-Tools-Operating-System-Compatibility-Chart)
- [Supported Pro Tools audio hardware and control surfaces](https://kb.avid.com/pkb/articles/en_US/Knowledge/Pro-Tools-Supported-Audio-Hardware-and-Control-Surfaces)
- [EUCON product-guide index](https://kb.avid.com/pkb/articles/en_US/Knowledge/EUCON-Product-Guides)
- [AAX SDK Pro Tools host guide](https://learn-cdn.avid.com/AAX_SDK_2p1p1/Documentation/Doxygen/output/html/a00274.html)
- [Avid Audio and MIDI Plug-Ins Guide](https://resources.avid.com/SupportFiles/PT/Audio_and_MIDI_Plugins_Guide_2024.10.pdf)
- [Pro Tools Sketch support](https://kb.avid.com/pkb/articles/en_US/Knowledge/Pro-Tools-Sketch-Support)
- [Pro Tools Cloud Collaboration FAQ](https://kb.avid.com/pkb/articles/en_US/Knowledge/Pro-Tools-Cloud-Collaboration-FAQ)
- [Pro Tools session compatibility and interchange](https://kb.avid.com/pkb/articles/en_US/Knowledge/en353093)

This review transfers general product and engineering lessons only. It does not
authorize copying Avid code, algorithms, interface artwork, manuals, sessions,
plug-ins, sounds, templates, trademarks, hardware designs or proprietary formats.

## 2. Product-system findings

### One session for recording, editing, MIDI, mixing and post

The current Pro Tools product page presents a single session as the centre of music,
recording, playlist comping, clip editing, MIDI, mixing, picture and immersive work.
The useful principle for Poietek is not a copied Edit or Mix window. It is that every
surface must operate on the same durable creative truth and share one history.

Poietek already follows that principle with `PoietekProject`, `ProjectSession`, the
Horizon Arranger, Take Studio, Note Forge, Picture Post and the rack workbenches. This
pass connects another missing editorial layer to that same project rather than keeping
markers, selected ranges or groups in React-only state.

### Playlists and comping

Pro Tools keeps alternate takes in playlists and supports comp assembly on a track.
Poietek's existing Take Studio already discovers aligned canonical audio, stores take
lanes, records contiguous source choices, commits ordinary clip references and exposes
one-step project undo. Automatic loop capture, audible lane audition and rendered
flattening remain separate engine work.

### Edit policies and context-aware tools

Avid's guide distinguishes grid-constrained and free editing plus specialized shuffle
and spot behaviours, while the product page describes trim, selection, clip movement,
fades and clip gain. Poietek already supports direct start, duration, gain, pan, fade,
mute, split and removal commands on real audio clips.

Editorial Memory now stores four explicit policies: Free, Grid, Ripple Plan and Locate
Plan. Free and Grid communicate current precision intent. Ripple Plan and Locate Plan
are visibly planning-only until collision-tested multi-track commands, timecode and
native timeline gestures are wired. Saving a label is never presented as completed DSP,
transport movement or machine control.

### Memory locations as more than markers

The official Quick Reference Guide describes Memory Locations as bookmarks that can
recall positions, selections and other session context. The transferable design lesson
is a typed, durable memory—not a decorative marker dot.

The new `org.poietek.editorial-memory` extension stores:

- point, range and track-view memory kinds;
- exact integer-tick start and duration;
- selected canonical track identities;
- pre-roll and post-roll intent;
- creator notes and creation time;
- the last recalled memory and active saved selection.

Recall is one `ProjectSession` transaction. It changes project-owned editorial state but
does not claim that the audio transport played, a hardware controller changed banks, or
a native window moved.

### Track pin for large sessions

The Pro Tools 2026.4 release notes introduce Track Pin to keep important tracks visible.
Poietek applies that broad usability principle through original track-focus pins. Pinned
canonical tracks sort before unpinned tracks in Arrange while retaining their original
project order inside each group. The pin is saved in the canonical project and can be
undone; it does not claim EUCON attention, a console layout or remote-surface banking.

### Clip groups and batch naming

Clip grouping and batch naming are valuable when editorial sessions contain many small
dialogue, music or sound-design clips. Poietek now captures an exact cohort only when
every selected audio clip is fully inside the requested range. A boundary that cuts a
clip fails before mutation. Groups contain references, not copied media.

Batch naming is a pure, deterministic preview over one exact group. Apply verifies that
the clip names still match the preview, refuses stale input, updates canonical clip
display names and records one project operation. It deliberately preserves Asset IDs,
content hashes, original asset names and disk files. Native disk-file rename requires a
separate containment, relinking, collision, recovery and creator-confirmation adapter.

### Selective session-data interchange

Pro Tools documentation exposes selective session-data import with track matching,
media choices, time mapping and attribute selection; AAF/OMF workflows add further
translation concerns. This is an important design target for Poietek's interoperability
fabric, but a filename picker or JSON declaration cannot substantiate it.

Poietek does not provide AAF/OMF or Pro Tools Session import in this pass. A future
adapter must include the applicable licences, parsers, sample-rate/timecode policy,
track and channel mapping, media copy/reference decisions, unique-ID handling, detailed
translation reports, failure fixtures and reversible canonical import.

### Sketch and non-linear creation

Pro Tools Sketch combines audio and MIDI clips in a scene/arrangement environment on
iPad and desktop. Poietek already covers the transferable idea through Performance
Canvas, Note Forge and the Portable MIDI rig. It does not read or write `.ptsketch`,
copy Sketch content or claim iPad-store availability.

### AAX plug-ins, instruments and effects

Avid's plug-in documentation covers AAX hosting and a wide inventory of audio and MIDI
processors. The AAX host guide also documents host-specific requirements. Poietek's
safe abstraction remains a format-neutral native plug-in boundary with scanner,
signature, quarantine, crash recovery, latency, state recall and missing-plug-in policy.

This pass does not host AAX, VST3, CLAP, Audio Unit or any Avid/AIR instrument or effect.
The existing External Plug-in Slot remains unavailable until a licensed native process
host and conformance suite exist.

### HDX, Carbon, MBOX, MTRX and control surfaces

Avid's compatibility material distinguishes HDX/HD Native engines, Core Audio, ASIO and
WASAPI, interfaces including Carbon, MBOX and MTRX families, and EUCON/HUI control
surfaces including S6, S4, S3, S1, Dock and Avid Control. That supports Poietek's policy
of separating device inventory, requested routing and observed capability evidence.

Poietek does not claim HDX DSP, Hybrid Engine behaviour, Carbon/MBOX/MTRX control,
EUCON, HUI, Sync X, sample-accurate hardware synchronization or measured latency. The
Tracking Console, Control Room and hardware contracts remain provider-neutral until
real devices, documentation, licences and measurements are available.

### Picture, transcription and immersive delivery

The current Pro Tools product and release material covers video/timecode, speech-to-text,
Dolby Atmos and MPEG-H workflows. Poietek already has original score/picture cue,
reconform, ADR and immersive-routing foundations, but it does not have the codec, local
speech model, licensed renderer, validated loudness engine or hardware output evidence
needed for equivalent production claims.

### Support and compatibility as product architecture

Avid maintains version-specific documentation, known issues, operating-system
qualification, hardware compatibility and end-of-support information. Poietek applies
that lesson by keeping module readiness, native-doctor evidence, release gates, build
status and explicit limitations visible. A platform icon or installer configuration is
not treated as proof that a toolchain, device or workflow passed acceptance.

## 3. Implemented clean-room slice

### Canonical engine

- Schema: `org.poietek.editorial-memory` version `1.0.0`.
- Typed point, range and view memories with exact integer ticks.
- Durable active selection, edit policy and track-focus pins.
- Exact audio clip groups with live canonical-reference validation.
- Pure deterministic batch display-name plans.
- Stale-preview refusal before mutation.
- Project-owned operation history and `ProjectSession` undo/redo.
- Full serialization with no `AudioBuffer`, filesystem handle, DOM object, network
  session, device port or native plug-in handle.

### Rack workflow

1. Edit Memory — initialize original starter memories, recall a typed memory, save a
   custom point/range/view and record edit-policy intent.
2. Clip Groups — capture only fully-contained real canonical audio clips.
3. Batch Names — preview numbered display names and apply them atomically without
   touching source assets or disk filenames.
4. System Map — separate working local features from AAF/OMF, transcription, AAX,
   hardware-control and immersive-render gates.

### Arrange integration

- Each canonical track header has an accessible pin toggle.
- Pinned tracks sort above unpinned tracks.
- Original order is stable within pinned and unpinned groups.
- The active editorial policy appears in the Arrange status readout.
- Pin/unpin is a saved canonical project mutation.

## 4. Cross-product map

| Avid lesson | Existing Poietek evidence | Change in this pass | Remaining gate |
| --- | --- | --- | --- |
| Session-centred editing and history | Canonical project and `ProjectSession` | Editorial state and operations use the same project transaction boundary | Deeper multi-selection timeline gestures |
| Memory Locations | Tempo/conductor/post markers | Typed point/range/view memories with track focus and recall history | Transport/window/hardware recall adapters |
| Track Pin | Track filtering and arranger ordering | Canonical pins drive focused Arrange order | Controller attention and multi-window persistence |
| Clip Groups | Production Regions | Exact audio-only clip cohorts independent of whole-song regions | Native grouped timeline gestures |
| Batch Rename | Batch Delivery naming plans | Pure clip display-name preview, stale checks and atomic apply | Contained disk rename/relink adapter |
| Playlist comping | Take Studio | No duplicate feature; connected in the Precision Editorial rig | Loop capture, audible audition and flatten render |
| Sketch | Performance Canvas and Note Forge | No duplicate feature; linked through the architecture map | Native mobile builds and external format handoff |
| Import Session Data / AAF / OMF | Interchange contracts | Explicit target mapping and evidence gates documented | Licensed parser, mapper and conformance fixtures |
| AAX and bundled plug-ins | External Plug-in Slot | Honest host boundary retained | Licensed scanner/host, signature and crash isolation |
| HDX/Carbon/MBOX/MTRX | Tracking and hardware contracts | Capability map linked to observed-adapter rules | Physical hardware, SDKs, drivers and measurements |
| EUCON surfaces | Mapper and control-room intent | Hardware state separated from project metadata | EUCON licence/SDK, network security and devices |
| Speech-to-text | Optional AI/provider boundaries | Local model requirement is explicit | Reviewed model, consent, timestamps and evaluation |
| Dolby Atmos / MPEG-H | Spatial routing intent | Renderer requirement is explicit | Licensed renderer, real outputs, loudness and fixtures |
| Support qualification | Native doctor and release gates | Current official support lessons recorded | Physical platform/device acceptance matrix |

## 5. Explicit non-claims

This pass does not provide or claim:

- Pro Tools Session, Sketch, AAF, OMF, MXF, Sibelius or Media Composer compatibility;
- AAX plug-in hosting or copied Avid/AIR instruments, effects, presets or content;
- EUCON, HUI, HDX, HD Native, Carbon, MBOX, MTRX, Sync X or control-surface support;
- sample-accurate punch, loop recording, automatic playlist creation or audible comp
  audition;
- Elastic Audio, pitch correction, ARA execution, audio-to-MIDI or spectral repair;
- speech transcription, word-level timestamps, speaker detection or text-based audio edit;
- video decode, timecode chase, machine control, satellite playback or NEXIS access;
- Dolby Atmos or MPEG-H rendering, ADM/MXF delivery, LUFS or dBTP measurement;
- Avid Cloud Collaboration, Avid Link account access, marketplace, licensing or iLok;
- copied Avid source code, algorithms, interface layout, documentation text, media,
  sessions, templates, trademarks or product artwork.

## 6. Acceptance contract

The slice is accepted only when these checks pass:

- strict core TypeScript and full application TypeScript;
- starter memory, recall, dangling-reference and boundary-safety tests;
- deterministic pure preview and stale-preview refusal tests;
- canonical name apply with asset/original-filename preservation;
- track-pin ordering and one-step project undo;
- rack, menu, template, library and documentation discovery;
- full regression suite, native configuration validation and production build;
- desktop and phone-width live QA without application errors or page-level horizontal
  overflow.

Future Avid-related claims must add their real adapters, licences, platform/device
observations and conformance evidence rather than expanding this document's wording.
