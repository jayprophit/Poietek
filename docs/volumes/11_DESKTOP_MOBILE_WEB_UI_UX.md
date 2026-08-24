# Volume 11 — Desktop, Mobile & Web UI/UX

Document ID: `POI-VOL-11`
Edition: `1.0.0`
Primary domains: `DOM-MENU`, `DOM-SETTINGS`, `DOM-CONTROL`, `DOM-SCREEN`, `DOM-ACCESSIBILITY`

## Experience model

Poietek presents one adaptive studio rather than unrelated desktop, mobile and
web products. Arrange is the canonical song/timeline desk; Rack is a first-class
modular workspace; Console, Inspect, Sampler, MIDI, Video/VFX, AI, Ecosystem and
platform centres connect to the same project, selection and command system.

## Global application structure

- One professional global menu system: File, Edit, Project, Track, Clip, Audio,
  MIDI, Devices, Mixer, Transport, View, Window and Help.
- One canonical transport and one project/session source of truth.
- Workspace/desk navigation with clear current context.
- Status surfaces for save, offline/sync, audio/MIDI/device capability, recording,
  render/export, jobs and unavailable reasons.
- Studio Setup for global preferences and named portable profiles.
- Command search/shortcut reference as a planned scalable path to every action.

## Screen and control inventory

The controlled inventory in `../UI_SCREEN_WORKFLOW_CATALOG.md` identifies 45
screens/surfaces, 11 settings pages, 13 menus, operational control groups, 18
workflows and 13 tutorials. Repeated channel strips, pads, track headers and rack
parameters use parameterized control classes; every instance invokes a common
command/state contract rather than creating duplicate behavior.

## Desktop experience

Desktop layouts prioritize dense multitrack editing, scalable panes, detachable
or docked specialist surfaces, keyboard commands, precision pointer editing,
multi-monitor layout profiles and professional status visibility. Native builds
add permitted file/device/plugin operations without changing project semantics.

## Tablet experience

Tablet layouts emphasize touch-sized controls, adaptive split panes, rack/pad
performance, gesture-safe timeline navigation, external keyboard/controller
support and explicit mode/tool state. Precision actions provide numeric/property
editing and avoid gesture-only access.

## Phone experience

Phone layouts focus on capture, playback, review/comment, simple clip edits,
sampler/performance, AI guidance, publishing status and community use. Complex
mix/routing/video tasks use staged panels rather than scaled-down desktop
clutter. Phone limitations are visible and project-compatible.

## Browser and installed PWA

The web portal works without installation where browser capabilities permit.
The PWA provides an installed icon, cached shell, local storage and offline
startup. The UI distinguishes browser permission gates, quota/persistence,
service-worker updates and native-only capabilities. LAN portal exposure is an
explicit action with visible address and stop control.

## Interaction states

Every asynchronous or capability-dependent control supports applicable idle,
pending, progress, success, empty, offline, permission-needed, denied,
unavailable, retryable error, terminal error and cancellation states. Destructive
actions state scope and recovery. Unsupported commands explain the required
adapter/evidence instead of silently doing nothing.

## Accessibility requirements

- Complete keyboard traversal and documented shortcuts without pointer traps.
- Visible focus, semantic names/roles/values and screen-reader status updates.
- WCAG-informed contrast, scalable text/UI and no color-only meaning.
- Touch targets, alternate precision inputs and orientation/responsive support.
- Reduced motion and flashing safeguards.
- Captions, transcripts and text alternatives for learning/community/video.
- Accessible wave/timeline summaries and numeric editing paths.
- User-controlled theme, density, contrast and accessibility profiles.

## UI design and acceptance process

Design tokens, component anatomy, responsive breakpoints, interaction specs,
content language, empty/error/loading/unavailable states and prototype flows are
reviewed before implementation. Acceptance includes screenshot/regression review,
keyboard/screen-reader/touch testing, zoom/contrast/reduced-motion checks,
critical workflow automation and real-device/browser matrices.

## Current status

The unified Arrange/Rack shell, global menus, real waveform arrangement,
track-linked console slice, Inspect, 11-page Studio Setup, local AI centre,
ecosystem status centre and offline/install centre are present. Many specialist
screens remain prototypes, foundations or planned services and retain honest
states. Signed native/mobile packages and full device testing remain phase gated.
