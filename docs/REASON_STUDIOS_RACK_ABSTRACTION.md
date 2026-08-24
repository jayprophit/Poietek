# Reason Studios Rack Abstraction for Poietek

Status: controlled product and implementation research

Research date: 2026-08-22

Reference owner: Reason Studios AB, formerly Propellerhead Software

This document records the useful product and workflow principles observed in the
current Reason Studios product pages and Reason 14 operation manual. It is not a
request to copy Reason's source code, visual trade dress, device names, graphics,
factory patches, samples, loops, sound packs, Rack Extensions, REX technology, or
proprietary DSP.

## Product-system findings

Reason is presented as several access modes around one core rack concept:

- Reason DAW combines rack, sequencer, recording, editing, mixer and sampling.
- Reason Rack Plugin brings rack workflows into another compatible DAW.
- Reason+ adds subscription-delivered devices, sounds and release services.
- ReCycle detects transients, stores slice timing and supports tempo-flexible loop
  rearrangement through the proprietary REX ecosystem.
- Rack Extensions provide a managed third-party device ecosystem.
- The factory library combines tagged patches, samples and sliced loops.
- Help is layered across getting-started videos, focused tutorials, a complete
  operation manual and support.

The product pages currently advertise Reason 14 as track-centric. Its Track Panel
puts signal chains, levels and sends beside the selected track, while retaining a
direct jump into the full rack. Other highlighted changes include track folders,
smarter clips, a revised piano roll, navigation controls, automatic tempo detection
on import and MIDI note chase.

## What makes the rack work

The strongest reusable principles are architectural rather than cosmetic:

1. Devices have roles. Players transform or create notes; instruments turn
   performance data into audio; effects process audio; utilities route or modulate;
   mixers collect and deliver signals.
2. The default path is immediate. A new device is placed and logically connected in
   a useful top-to-bottom order.
3. The default is not a prison. Rear connections expose audio, CV and gate so users
   can build sidechains, modulation, splits and parallel paths.
4. Front and rear tell different truths. Front panels expose musical parameters;
   rear panels explain ports and signal flow.
5. Containers make complex systems playable. A macro container groups devices and
   maps a small number of controls to deeper parameters.
6. One browser understands instruments, effects, Players, utilities, patches and
   third-party devices.
7. Sampling is acquisition-first. A selected sampler can record immediately, then
   preserve the captured result as editable project media.
8. Device state participates in native undo, project save and host recall.
9. Third-party devices are a managed boundary, not arbitrary code mixed directly
   into the editor process.
10. Learning is part of the product: overview, modulation basics, host-specific
    guides, tutorials, manual and support form a progressive path.

## Device-family abstraction

The current Reason catalogue demonstrates the breadth a mature rack needs. Poietek
groups the concepts into original families instead of making one-for-one clones.

| Reference family | Poietek abstraction | Current evidence |
| --- | --- | --- |
| Players, arpeggiators, chord and note tools | Motion Note Player, Harmony Wheel, Human Pulse Pool, Note Canvas | Control models; deterministic routing foundation |
| Subtractive, FM, granular, physical-model and sample instruments | Prism Poly Synth, Grain Deck, Canvas Drum Grid and Sound Atlas recipes | Mixed operational and controlled foundation states |
| Drum machines, sliced-loop players and drum designers | Pulse Drum Line, Beat Loom, Chop Lab | Working UI/core foundations; native timing still gated |
| Channel EQ, dynamics and master processing | Contour Four EQ, Forge Dynamics and Summit Mix Console | Control surfaces and data models implemented; production DSP remains pending |
| Reverb and delay families | Nebula Space and Orbit Echo | Saved control models; native/offline DSP adapters pending |
| Chorus, phaser, filter and timed modulation | Flux Motion | Saved control model; DSP adapter pending |
| Gain, stereo, split, merge, CV and gate utilities | Axis Gain & Stereo and Branch Audio & CV | Logical port and routing model implemented |
| Macro container devices | Macro Bus Container | Grouping and five macro controls implemented; canonical modulation map is next |
| Rack extensions and hosted plug-ins | External Plug-in Slot | Placement preserved; native licensed scanner/host required |
| Sliced-loop workflow | Poietek Chop Map and non-destructive slice model | Original 128-chop model implemented; no REX codec claim |

## Implemented in this slice

- Every rack catalogue entry now declares a device role.
- Every entry declares note, audio, CV and gate input/output capabilities.
- Every entry declares an honest engine state: `operational`, `control_model`, or
  `native_required`.
- New original Poietek catalogue foundations cover note Player, four-band EQ,
  compressor/gate, reverb, delay, modulation, gain/stereo, split/merge and an
  unavailable native plug-in slot.
- Adding a top-level device inserts it into a useful Player -> instrument -> effect
  -> utility -> mixer -> controller order.
- The rack derives automatic note and audio connections from actual modules.
- The front rack exposes a selectable signal-flow strip and jumps directly to a
  device.
- New control-model devices preserve adjustable parameters in rack history.
- The rear view is derived from the real rack and no longer displays hard-coded
  fictional device cables.
- The rear view distinguishes logical routing from an observed native DSP route.
- Grouped children render their own device type rather than the parent container.
- Non-workspace foundation devices no longer masquerade as detachable workspaces.

## Deliberate truth boundaries

The rack UI is not evidence that every device has a production DSP engine. A
`control_model` saves parameter intent and routing ports, but must not report audio
processing until a Web Audio or native adapter has rendered and measured it.
`native_required` means the state can be preserved but execution is unavailable.

The automatic signal-flow preview is deterministic logical intent. It is not a
sample-accurate cable graph and does not invent latency, delay compensation,
sidechain execution, CV voltage behavior or plug-in readiness. The canonical patch
graph and native engine must later acknowledge each active route.

## Next rack vertical slices

1. Move the rack stack, parameter state, macro maps and patch graph into the
   canonical `PoietekProject` extension with schema migration.
2. Implement an allocation-safe native graph compiler that acknowledges active
   routes and returns measured callback/latency evidence.
3. Connect the selected arranger track to its device chain, fader, sends and rack
   focus without duplicating project truth.
4. Add explicit sidechain, send/return, split/merge and parallel-channel commands.
5. Implement tested original EQ, dynamics, delay, modulation and reverb DSP in the
   C++ core, with offline/realtime parity fixtures.
6. Add controller-lock and per-device remote mappings stored in the project.
7. Implement patch and macro preset files using original/licensed content with
   provenance and versioning.
8. Add a native VST3/CLAP scanner and sandbox only after the realtime callback is
   stable and the relevant licences are reviewed.
9. Add progressive help: first-rack walkthrough, signal-flow lesson, modulation
   lesson, device reference and troubleshooting states.

## Live sources reviewed

- <https://www.reasonstudios.com/>
- <https://www.reasonstudios.com/reason>
- <https://www.reasonstudios.com/reason-rack>
- <https://www.reasonstudios.com/reason-daw>
- <https://www.reasonstudios.com/devices>
- <https://www.reasonstudios.com/sounds>
- <https://www.reasonstudios.com/new-in-14>
- <https://www.reasonstudios.com/recycle>
- <https://www.reasonstudios.com/help>
- <https://docs.reasonstudios.com/reason14>
