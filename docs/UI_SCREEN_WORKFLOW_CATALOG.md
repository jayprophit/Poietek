# Poietek UI, screen, control and workflow catalog

Document ID: `POI-UI-001`
Derived from: `POI-MASTER-001`
Status vocabulary: operational, foundation, prototype, planned, external-gate,
unavailable and retired.

This catalog gives every screen and user command a durable identity. Repeated
rows represent one command rendered in more than one context; they do not create
separate transport or project truth.

## 1. Application shell and screens

| Screen ID | Screen/surface | Status | Purpose and primary controls |
| --- | --- | --- | --- |
| `SCR-001` | Application shell | operational | Global menu, area switcher, offline/install centre and active-area stage. |
| `SCR-002` | Arrange workspace | operational | Local projects, session status, transport, audio timeline, Console and Inspect desks. |
| `SCR-003` | Project rack | operational | New-project field, create, open, delete and local/offline explanation. |
| `SCR-004` | Arrange desk | operational | Real tracks/clips/waveforms, tools, ruler, playhead and clip/track inspector. |
| `SCR-005` | Console desk | operational slice | Track strips, gain, pan, mute and solo; unavailable input/insert/record-arm surfaces are labelled. |
| `SCR-006` | Audio Inspect desk | operational slice | Decoded PCM health, sample peak/RMS/DC/correlation/clipping and honest LUFS/dBTP unavailable states. |
| `SCR-007` | Rack workspace | prototype/foundation | Hardware-inspired device stack, browser, front/rear patching, folding, ordering and detachable workspaces. |
| `SCR-008` | Rack rear panel | prototype/foundation | Audio/CV cable intent and default patch reset; not a claim of physical routing. |
| `SCR-009` | Canvas Drum Grid | prototype | Pads, banks and pad parameters; canonical sampler-program migration remains planned. |
| `SCR-010` | Grain Deck | prototype | Pad banks, effects/resample concepts and performance controls. |
| `SCR-011` | Prism keyboard/synth | prototype | On-screen keyboard, oscillator, scenes, sustain and performance controls. |
| `SCR-012` | Pulse drum machines | prototype | Machine selection and pattern concept. |
| `SCR-013` | E-drum module | prototype | Pad/trigger and velocity-curve concept. |
| `SCR-014` | DJ performance deck | prototype | Deck/performance concept; real beatgrid/cue engine is planned. |
| `SCR-015` | Rack mixer | prototype | Eight-channel device mixer; canonical production mixing is in Console. |
| `SCR-016` | Audio/CV patch bay | prototype/foundation | Capture and routing concepts; real input capture belongs to Arrange. |
| `SCR-017` | Universal hardware mapper | foundation UI | Mapping tabs and Web MIDI state. |
| `SCR-018` | Visual device editor | prototype | User-authored surface and JSON export; profile verification is separate. |
| `SCR-019` | MIDI routing matrix | foundation UI | Route/processor concept with truthful Web MIDI capability state. |
| `SCR-020` | Circle of Fifths | prototype | Harmony/key exploration. |
| `SCR-021` | Vocal Contour | prototype/unavailable DSP | Pitch editor concept; production pitch DSP is not claimed. |
| `SCR-022` | Human Pulse Groove Pool | prototype | Groove selection and humanization concept. |
| `SCR-023` | Piano Roll | prototype | Note/pattern editor concept; canonical MIDI-track persistence is planned. |
| `SCR-024` | Horizon legacy waveform module | prototype/retained | Synthetic legacy module retained inside Rack; canonical wave editing is `SCR-004`. |
| `SCR-025` | Beat Loom channel rack | prototype | Step/pattern workflow concept. |
| `SCR-026` | Chop Lab | prototype | Slice-count, reverse and pad-map concept; canonical slicing is planned. |
| `SCR-027` | Device Health | foundation UI | MIDI capability, SysEx state, simulator opt-in and honest unmeasured latency. |
| `SCR-028` | Templates | prototype | Starter Rack builds and local template save/load. |
| `SCR-029` | Floating window manager | prototype | Detach/dock legacy Rack workspaces. |
| `SCR-030` | Studio Setup | operational settings | Eleven settings pages, profile persistence, validation and benchmark. |
| `SCR-031` | Offline/install centre | operational web/PWA | Engine capability snapshot, install, update activation and storage persistence request. |
| `SCR-032` | AI Studio | operational local core | Mode, local analysis, provider selection/configuration, health check and local save. |
| `SCR-033` | Ecosystem | operational scope/status view | Search/filter the machine-readable vision catalog and inspect status/gates. |
| `SCR-034` | Keyboard shortcuts dialog | operational | Current global shortcuts and workspace switching. |
| `SCR-035` | About/build truth dialog | operational | Local-first scope and explicit unavailable capability boundaries. |
| `SCR-036` | Crash recovery chooser | foundation | Recover, Skip and Discard semantics exist; full startup UI remains to be integrated. |
| `SCR-037` | Contributor/rights centre | planned | Passports, credits, splits, agreements, clearances, registrations and corrections. |
| `SCR-038` | Release/publishing centre | planned | Destination, metadata, identifiers, preflight, packages and external status. |
| `SCR-039` | Collaboration/review centre | planned | Members, presence, comments, changes, conflicts, branches and handoff. |
| `SCR-040` | Community/player/feed | foundation/planned UI | Creator pages, renditions, feeds, moderation and original-preserving tuning playback. |
| `SCR-041` | Marketplace | foundation/planned UI | Listings, licences, orders, fulfilment, statements and disputes. |
| `SCR-042` | Learning centre | foundation/planned UI | Onboarding, lessons, practice projects, theory and AI coach. |
| `SCR-043` | Video/VFX workspace | foundation/planned UI | Picture timeline, proxies, captions, colour, compositor and render jobs. |
| `SCR-044` | Developer centre | planned | SDKs, adapter status, logs, fixtures, validation and signing. |
| `SCR-045` | Organization administration | planned | Membership, roles, billing, retention, security, integrations and audit. |

All operational screens require loading, empty, ready, busy/progress, permission,
recoverable-error, unavailable and destructive-confirmation states where relevant.
Planned public/network screens additionally require offline, authentication,
authorization, rate-limit, moderation, dispute and provider-outage states.

## 2. Global menu inventory

The implementation source is `src/poietek/react/StudioMenuBar.tsx`. Disabled
items remain visible when they communicate accepted scope, but include an
unavailable reason.

### File (`MENU-FILE`)

| Item ID | Item | Status/action |
| --- | --- | --- |
| `MENU-FILE-001` | New Project | operational; focus/select new-project field (`Ctrl/Cmd+N`). |
| `MENU-FILE-002` | Open Local Projects | operational; switch/focus local project rack (`Ctrl/Cmd+O`). |
| `MENU-FILE-003` | Save Project | operational local save (`Ctrl/Cmd+S`). |
| `MENU-FILE-004` | Import Audio… | operational real decode/store/waveform/clip (`Ctrl/Cmd+I`). |
| `MENU-FILE-005` | Export PCM WAV… | operational supported offline render and PCM16 encoding (`Ctrl/Cmd+E`). |
| `MENU-FILE-006` | Project Bundle / Stems… | unavailable until package/stem render workflow exists. |

### Edit (`MENU-EDIT`)

| Item ID | Item | Status/action |
| --- | --- | --- |
| `MENU-EDIT-001` | Undo | operational in active production area (`Ctrl/Cmd+Z`). |
| `MENU-EDIT-002` | Redo | operational (`Ctrl/Cmd+Shift+Z`). |
| `MENU-EDIT-003` | Studio Preferences… | operational; Profiles page (`Ctrl/Cmd+,`). |
| `MENU-EDIT-004` | Editing Preferences… | operational settings page. |
| `MENU-EDIT-005` | Appearance & Accessibility… | operational settings page. |

### Project (`MENU-PROJECT`)

| Item ID | Item | Status/action |
| --- | --- | --- |
| `MENU-PROJECT-001` | Project Rack | operational. |
| `MENU-PROJECT-002` | Starter Songs & Templates… | prototype Rack templates. |
| `MENU-PROJECT-003` | Files, Autosave & Recovery… | operational settings/foundation recovery. |
| `MENU-PROJECT-004` | Tempo Map & Signature… | unavailable editor; canonical tempo-map model exists. |

### Track (`MENU-TRACK`)

| Item ID | Item | Status/action |
| --- | --- | --- |
| `MENU-TRACK-001` | Add Audio Track by Import… | operational. |
| `MENU-TRACK-002` | Show Arrangement | operational. |
| `MENU-TRACK-003` | Show Mix Console | operational slice. |
| `MENU-TRACK-004` | Add MIDI / Instrument Track | unavailable pending canonical MIDI/instrument tracks. |
| `MENU-TRACK-005` | Track Versions & Comping | unavailable pending take/comp engine. |

### Clip (`MENU-CLIP`)

| Item ID | Item | Status/action |
| --- | --- | --- |
| `MENU-CLIP-001` | Split at Playhead | operational per selected clip; global selection command is staged. |
| `MENU-CLIP-002` | Move, Trim, Gain & Fades | operational via Arrange inspector. |
| `MENU-CLIP-003` | Time Stretch / Warp | unavailable until validated time-preserving DSP. |
| `MENU-CLIP-004` | Pitch Correction | prototype UI/unavailable production DSP. |

### Audio (`MENU-AUDIO`)

| Item ID | Item | Status/action |
| --- | --- | --- |
| `MENU-AUDIO-001` | Audio Setup… | operational settings. |
| `MENU-AUDIO-002` | Recording Setup… | operational settings. |
| `MENU-AUDIO-003` | Audio Health Inspector | operational decoded-sample checks. |
| `MENU-AUDIO-004` | Export PCM WAV… | operational. |
| `MENU-AUDIO-005` | LUFS / True Peak Analysis | unavailable until validated BS.1770/oversampled backend. |

### MIDI (`MENU-MIDI`)

| Item ID | Item | Status/action |
| --- | --- | --- |
| `MENU-MIDI-001` | MIDI & Sync Setup… | operational settings with truthful capability state. |
| `MENU-MIDI-002` | MIDI Routing Matrix | foundation UI. |
| `MENU-MIDI-003` | Piano Roll | prototype. |
| `MENU-MIDI-004` | MIDI Learn / Hardware Mapper | foundation UI. |
| `MENU-MIDI-005` | MIDI Clock Output | unavailable until verified output scheduler/adapter. |

### Devices (`MENU-DEVICES`)

| Item ID | Item | Status/action |
| --- | --- | --- |
| `MENU-DEVICES-001` | Studio Rack | operational area/prototype devices (`F6`). |
| `MENU-DEVICES-002` | Flip Rack / Rear Patching | operational Rack UI (`Tab`). |
| `MENU-DEVICES-003` | Audio & CV Patch Bay | foundation/prototype. |
| `MENU-DEVICES-004` | Plug-in Manager… | operational preferences; native host remains gated. |
| `MENU-DEVICES-005` | Modules & Content… | operational catalog/status page. |

### Mixer (`MENU-MIXER`)

| Item ID | Item | Status/action |
| --- | --- | --- |
| `MENU-MIXER-001` | Production Console | operational track-mixer slice. |
| `MENU-MIXER-002` | Rack Mixing Desk | prototype. |
| `MENU-MIXER-003` | Routing & Patch Bay | foundation/prototype. |
| `MENU-MIXER-004` | Control Room / Cue Mixes | unavailable pending verified multi-output native I/O. |

### Transport (`MENU-TRANSPORT`)

| Item ID | Item | Status/action |
| --- | --- | --- |
| `MENU-TRANSPORT-001` | Play / Pause | operational in current production area (`Space`). |
| `MENU-TRANSPORT-002` | Stop | operational. |
| `MENU-TRANSPORT-003` | Return to Zero | operational. |
| `MENU-TRANSPORT-004` | Record Audio Input | operational canonical Arrange capture (`R`). |
| `MENU-TRANSPORT-005` | Metronome / Click | operational Rack transport; production scheduler migration remains planned. |

### View (`MENU-VIEW`)

| Item ID | Item | Status/action |
| --- | --- | --- |
| `MENU-VIEW-001` | Arrange | operational (`F7`). |
| `MENU-VIEW-002` | Rack | operational (`F6`). |
| `MENU-VIEW-003` | Ecosystem | operational (`F8`). |
| `MENU-VIEW-004` | AI Studio | operational (`F9`). |
| `MENU-VIEW-005` | Mix Console | operational slice. |
| `MENU-VIEW-006` | Audio Inspector | operational slice. |

### Window (`MENU-WINDOW`)

| Item ID | Item | Status/action |
| --- | --- | --- |
| `MENU-WINDOW-001` | Toggle Full Screen | operational where Fullscreen API is allowed (`F11` browser default/menu action). |
| `MENU-WINDOW-002` | Detached Rack Windows | prototype. |
| `MENU-WINDOW-003` | Multi-monitor Layouts | unavailable pending native persistence. |

### Help (`MENU-HELP`)

| Item ID | Item | Status/action |
| --- | --- | --- |
| `MENU-HELP-001` | Keyboard Shortcuts | operational. |
| `MENU-HELP-002` | System Benchmark… | operational evidence-derived benchmark. |
| `MENU-HELP-003` | Privacy & Security… | operational settings. |
| `MENU-HELP-004` | About Poietek Studio | operational build-truth dialog. |

## 3. Studio Setup page and field inventory

Every value is versioned in `StudioSettingsDocument 1.0.0`, validated and stored
locally. A requested setting is not evidence that a browser/native driver honored
it. Profiles are Balanced Studio, Responsive Tracking, Large Mix and Portable
Sketch, plus validated custom profiles.

| Page ID | Page | Fields/actions |
| --- | --- | --- |
| `SET-001` | Profiles | Active profile; apply built-in/custom profile; custom profile name; create/update/delete/export/import profile; restore defaults; validation feedback. |
| `SET-002` | Audio | Input device; output device; requested sample rate; requested buffer frames; mono/stereo recording channels; monitoring mode; latency-compensation policy; low-latency mode and ceiling; suspend when idle; reset after device change; rescan/inspect devices. |
| `SET-003` | MIDI & Sync | Default input/output; SysEx request; MIDI thru; note chase; jump/pickup/relative takeover; clock off/send/receive; clock input/output; MTC off/quarter/full frame; 24/25/29.97/30 frame rate; send start/stop; capability/simulator state. |
| `SET-004` | Recording | Count-in; pre-roll; take-lane policy; auto input monitoring; incomplete-take retention; filename pattern; browser MIME preference; requested export depth; dither policy; verified encoder notice. |
| `SET-005` | Editing | Snap enabled; resolution; snap to events; ripple off/track/all; auto crossfade; default fade; follow playhead; return on stop; scrub audition. Controls whose engine is staged remain preference-only and labelled. |
| `SET-006` | Files & Recovery | Autosave interval; checkpoint interval; retained snapshots; copy imported media; hash verification; missing-media warning; preferred project/export labels; recovery/storage explanation. |
| `SET-007` | Plug-ins | Requested VST3/CLAP/Audio Unit formats; scan at native startup; verify new; quarantine crashes; sandbox; suspend silent; window mode; custom search folders; native-only/unavailable notice. |
| `SET-008` | Modules & Content | Catalog search; production/prototype/planned/native-only states; original content provenance and limitation. |
| `SET-009` | Appearance | Midnight/graphite/high-contrast theme; comfortable/compact/touch density; interface scale; digital/broadcast/extended meter scale; reduced motion; tooltips; learning hints; auto-hide transport bars. |
| `SET-010` | Privacy | Local-first fixed true; crash reports ask/never; analytics fixed false; remote-provider permission; community discovery; diagnostic path redaction; stable/manual updates; export/delete/correct direction in platform contracts. |
| `SET-011` | Benchmark | Run benchmark; per-metric observations; derived score/rating; capability notes; no fixed five-star claim. |

Global settings actions: close, Cancel and Save settings. Saving invalid values is
blocked with field paths. Profile/import/export errors must remain recoverable.

## 4. Operational control inventory

This table defines the user-visible control groups. Repeated track/clip/pad rows
are parameterized controls with stable behavior, not separately named features.

| Control ID | Surface | Controls and required feedback |
| --- | --- | --- |
| `BTN-SHELL-001` | Area switcher | Arrange, Rack, Ecosystem, AI; active state and F-key. |
| `BTN-SHELL-002` | Offline centre | Open/close, Install, Restart with update, Protect local storage; permission/result state. |
| `BTN-PROJECT-001` | Project rack | Create `+`, open, delete; busy disable, destructive confirmation and media-retention notice. |
| `BTN-SESSION-001` | Session strip | Undo, redo, Import audio; capability/busy state. |
| `BTN-TRANSPORT-001` | Arrange transport | Play/pause, stop, record, seek; no duplicate transport on the same screen. |
| `BTN-DESK-001` | Desk tabs | Arrange, Console, Inspect; active state. |
| `BTN-ARRANGE-001` | Tool selector | Pointer, Range, Draw, Audition; non-operational tools must not imply an edit occurred. |
| `BTN-ARRANGE-002` | Track lane | Select track, mute, solo, seek/ruler, select clip. |
| `BTN-ARRANGE-003` | Clip inspector | Start, duration trim, gain, pan, fade in/out, mute, split at playhead and Remove. |
| `BTN-CONSOLE-001` | Channel strip | Input status, inserts 1–3, record arm, mute, solo, gain and pan; pending DSP/input controls disabled with reason. |
| `BTN-HEALTH-001` | Inspector | Analyze asset and dismiss status/error. |
| `BTN-RACK-001` | Rack transport | Return zero, play/stop, tap tempo, click, master volume, flip and AI Groove; one instance only. |
| `BTN-RACK-002` | Rack device | Power, fold/unfold, move up/down, delete, tape label, flip and detach. |
| `BTN-RACK-003` | Rack manager | Undo/redo Rack, add device, group/folder and reorder. |
| `BTN-RACK-004` | Rear patching | Select jack, create/remove cable intent, Reset Default Patching and Front Rack. |
| `BTN-RACK-005` | Browser/palette | Open/close, filter/search, select device, Templates, AI Groove, auto-hide and detach. |
| `BTN-SAMPLER-001` | Drum/Grain/Chop | Bank, pad trigger/select, pitch/level/pan/start/end/loop, resample, slice count, reverse and Chop & Map. Prototype state must be visible. |
| `BTN-MIDI-001` | MIDI/mapper | Permission/initialize, explicit simulator, route/source/destination, processor toggle, mapping capture and Export Profile JSON. |
| `BTN-AI-001` | AI Studio | Mode, Analyze Project, provider, endpoint/model/configuration, Check Route and Save Locally; remote consent and health state. |
| `BTN-ECOSYSTEM-001` | Ecosystem | Search/filter/status and capability card selection. |
| `BTN-DIALOG-001` | Dialogs | Close, Cancel, Save/Apply; Escape, focus management and destructive confirmation where relevant. |

## 5. Workflow-to-screen map

| Workflow | Entry | Main screens | Exit/evidence |
| --- | --- | --- | --- |
| Create/reopen | File or project rack | `SCR-003`, `SCR-002` | Validated local project summary/snapshot. |
| Import | File/Track/Audio or session strip | `SCR-002`, `SCR-004` | Hashed asset, track, clip, waveform and local save. |
| Record | Transport/R | `SCR-002` | Permission, recorded asset/track/clip, cleanup and save. |
| Edit/mix | Arrange/Console | `SCR-004`, `SCR-005` | Validated undoable project revision and playback/export parity for supported graph. |
| Inspect/export | Audio/File | `SCR-006`, `SCR-002` | Honest measurements and PCM16 WAV with limitations. |
| Configure | Edit/Audio/MIDI/Devices/Help | `SCR-030` | Validated settings document/profile. |
| Hardware/MIDI | Devices/MIDI | `SCR-007`, `SCR-017`–`SCR-019`, `SCR-027` | Capability observation/profile/mapping; not invented verification. |
| AI | F9/menu | `SCR-032` | Evidence-linked response; project unchanged unless later preview/accept/apply workflow is used. |
| Install/offline | Shell status | `SCR-031` | Deployment capability snapshot and explicit browser response. |
| Rights/release/community/marketplace | future shell areas | `SCR-037`–`SCR-041` | Evidence-backed external states; no self-declared acceptance/payment/publication. |
| Learn/develop/admin | future role surfaces | `SCR-042`, `SCR-044`, `SCR-045` | Scoped progress, validated adapter or audited administrative action. |

## 6. Responsive and accessibility contract

- Desktop: persistent menu and area bar, efficient keyboard focus order, Rack and
  Arrange optimized for wide workspaces.
- Tablet: touch-density profile, horizontal menu/track navigation, panels that can
  collapse without hiding status or destructive context.
- Phone: safe-area aware shell, scrollable top menus, full-width menu popovers,
  minimum 44 px coarse-pointer targets and Rack landscape guidance.
- Keyboard: all global menus, dialogs and operational controls must be reachable;
  shortcuts never fire while editing text/select controls.
- Focus: visible focus indicator, focus enters modal, Escape closes, and focus
  returns to the invoking control.
- Visual: UI scaling, high-contrast theme, non-color status text, scalable meters
  and no information conveyed only through animation.
- Motion: `prefers-reduced-motion` and the stored reduce-motion preference disable
  decorative motion without hiding progress.
- Screen readers: semantic headings/regions, labels for icon buttons, live regions
  for save/progress/error, table alternatives for visual graphs and announced
  disabled reasons.
- Media: future tutorials/community/video require captions, transcripts, audio
  description metadata and keyboard-controllable players.
- Input: mouse, touch, pen, keyboard, switch/assistive technology and mapped MIDI
  control must converge on the same commands and permission rules.

## 7. Tutorial and help inventory

| Tutorial ID | Tutorial | Status |
| --- | --- | --- |
| `EDU-001` | First launch, offline storage and install | operational explanation/foundation guided flow. |
| `EDU-002` | Create, import, waveform and save | operational workflow; guided lesson planned. |
| `EDU-003` | Record and input permission | operational workflow; guided lesson planned. |
| `EDU-004` | Arrange, split, trim, fades and undo | operational workflow; guided lesson planned. |
| `EDU-005` | Console, buses/routing concepts and export | operational slice; advanced DSP lesson staged. |
| `EDU-006` | Rack front/rear, devices and patching | existing walkthrough/prototype. |
| `EDU-007` | MIDI permission, mapper and honest latency | foundation UI. |
| `EDU-008` | Audio health versus LUFS/True Peak | operational explanation. |
| `EDU-009` | AI local/remote consent and Creative Intent Lock | operational concepts; interactive tutorial planned. |
| `EDU-010` | Contributors, splits, registrations and corrections | planned with legal-review gate. |
| `EDU-011` | Destination preflight, tuning and derivatives | foundation/planned UI. |
| `EDU-012` | Community safety, licence and marketplace purchase | planned with moderation/payment/legal gates. |
| `EDU-013` | Developer SDK and adapter certification | planned. |

## 8. UI acceptance gates

Before a screen/control is called operational it must have: real command wiring;
disabled/busy/progress/error feedback; keyboard/touch access; permission and
offline behavior; status terminology from the master specification; no duplicate
ownership surface; unit/integration coverage; and responsive visual review on the
supported breakpoint matrix.
