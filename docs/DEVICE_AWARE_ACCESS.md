# One application, multiple device-aware access points

Poietek is one application with one canonical project model. Desktop, tablet,
mobile, installed PWA, native shell and browser portal are access points to the
same logical product; they are not independently forked applications.

## Runtime rule

At application launch—and again after rotation, resizing or input-capability
changes—the local runtime derives one active device profile from evidence
reported by the current device:

- viewport width and height;
- portrait or landscape orientation;
- coarse and fine pointer support;
- hover support;
- maximum touch points;
- browser mobile hint where available;
- browser, installed-app or native execution surface;
- device pixel ratio.

The profile is session-local UI state. It is not stored inside the canonical
creative project and it is not allowed to change audio, rights or release truth.
When authenticated account sessions are added, the same rule applies immediately
after sign-in: the signed-in session receives the profile of the device that is
actually running it, not the layout last used on a different device.

## Active profiles

| Detected access point | Layout | Navigation | Input treatment | Rack |
| --- | --- | --- | --- | --- |
| Desktop | Expanded | Full top navigation | Pointer/keyboard shortcuts visible | Full-width professional rack |
| Tablet | Compact | Compact top navigation | 44 px touch-safe controls; hybrid pointer supported | Full-width rack with compact chrome |
| Mobile | Handheld | Persistent bottom navigation | 44 px touch targets; shortcut badges hidden without a keyboard | Deliberate horizontal rack workspace |
| Other/unidentified | Compact | Compact top navigation | Only reported capabilities are enabled | Conservative fallback |

A phone remains a phone when rotated into landscape because the shortest side,
touch evidence and mobile hint participate in classification. A tablet with a
keyboard or pointer becomes a hybrid-input tablet rather than being falsely
reported as a desktop.

## Capability boundary

Form factor adapts presentation. Runtime probes separately control whether audio
recording, MIDI, offline storage, graphics, workers, WebAssembly, installation,
network services or native bridges are available. A mobile layout does not imply
mobile-native audio, and a desktop layout does not imply that a native plugin host
exists.

The deployment centre shows only the current access point and its detected engine
states. Projects remain portable: unsupported devices preserve canonical state
and use documented fallbacks, freeze/render interchange or an honest unavailable
state.

## Responsive acceptance matrix

Every release must verify at least:

1. Desktop pointer/keyboard at 1440 × 900.
2. Tablet touch or hybrid input at 1024 × 768 and 768 × 1024.
3. Mobile touch at 390 × 844 and 844 × 390.
4. An unidentified/no-window fallback without invented device capability.
5. No page-level horizontal overflow, obscured navigation or unreachable setup
   controls at each access point.
6. Rotation updates orientation and layout without changing the canonical project.
7. Browser, installed-PWA and native execution surfaces retain honest engine
   availability.
