# Universal Audio and LUNA workflow abstraction

Research date: 2026-08-23

This note records a clean-room product and workflow study. It is an engineering input, not a claim of compatibility, endorsement, affiliation, or feature parity.

Poietek does not include Universal Audio or LUNA source code, binaries, device-control code, plug-in models, presets, impulse responses, samples, session formats, artwork, trade dress, product names, or licensed third-party emulations. The implementation described here is original Poietek code built around public workflow ideas and Poietek's canonical project, adapter, and evidence contracts.

## Official material reviewed

- [LUNA](https://www.uaudio.com/products/luna)
- [Universal Audio support](https://help.uaudio.com/hc/en-us)
- [Universal Audio articles and news](https://www.uaudio.com/blogs/ua)
- [UAD plug-ins](https://www.uaudio.com/collections/uad-plugins)
- [Plug-in bundles](https://www.uaudio.com/collections/plugin-bundles)
- [UAD Spark](https://www.uaudio.com/products/uad-spark)
- [Virtual instruments](https://www.uaudio.com/collections/virtual-instruments)
- [Audio interfaces](https://www.uaudio.com/pages/audio-interfaces)
- [UAFX pedals](https://www.uaudio.com/pages/uafx-pedals)
- [Microphones](https://www.uaudio.com/pages/microphones)
- [Analog hardware](https://www.uaudio.com/pages/analog-hardware)
- [UAD accelerators](https://www.uaudio.com/collections/accelerators)
- [LUNA concepts](https://help.uaudio.com/hc/en-us/articles/360041866251-LUNA-Concepts)
- [Recording audio in LUNA](https://help.uaudio.com/hc/en-us/articles/360041441112-Recording-Audio)
- [UAD Console overview](https://help.uaudio.com/hc/en-us/articles/25347160337556-UAD-Console-Overview)
- [UAD plug-in inserts](https://help.uaudio.com/hc/en-us/articles/25350369296660-UAD-Plug-In-Inserts)
- [Setting up cue mixes](https://help.uaudio.com/hc/en-us/articles/360046998992-Setting-up-Cue-Mixes-in-Console-and-Your-DAW)
- [Console sessions](https://help.uaudio.com/hc/en-us/articles/25357506048020-Console-Sessions)
- [Console Recall](https://help.uaudio.com/hc/en-us/articles/26489269396116-Console-Recall-Plug-In)
- [Using LUNA browsers and track presets](https://help.uaudio.com/hc/en-us/articles/44376645611156-Using-LUNA-Browsers)
- [Hardware inserts](https://help.uaudio.com/hc/en-us/articles/42265531595668-Using-Hardware-Inserts)
- [Bouncing and freezing tracks](https://help.uaudio.com/hc/en-us/articles/10540575702292-Bouncing-and-Freezing-Tracks)
- [Using UAD plug-ins](https://help.uaudio.com/hc/en-us/articles/5085501350932-Using-UAD-Plug-Ins-Manual)
- [UAD native and Spark system requirements](https://help.uaudio.com/hc/en-us/articles/5172379808276-System-Requirements-for-UA-Connect-UAD-Spark-and-UAD-Native-Plug-ins)
- [Volt 876 Console manual](https://help.uaudio.com/hc/en-us/articles/41288447947284-UAD-Console-for-Volt-876-Manual)

## Ecosystem analysis

### 1. LUNA: the recording session is the integration surface

The most useful lesson is not a visual resemblance to an analog console. It is that recording, editing, mixing, device routing, input controls, low-latency monitoring, cue buses, track presets, and session recall are presented as parts of one session workflow.

The current public LUNA material also emphasizes ARA integration, hardware inserts with latency compensation and presets, instrument-aware track presentation, tempo listening and extraction, multi-output instruments, autosave/version recovery, track presets, bounce, freeze, and operation with third-party interfaces. Several capabilities become deeper when supported UA hardware is observed.

Poietek response:

- Keep one serializable `PoietekProject` as the authority.
- Put tracking configuration inside the project rather than in rack-only React state.
- Make every recall an atomic `ProjectSession` mutation with undo and durable save.
- Separate portable workflow intent from runtime-specific device and processor evidence.

### 2. Apollo and Console: monitor and record paths are different products

UA's Console material makes the signal-flow distinction unusually explicit. Standard insert processing may be heard while a clean signal reaches the DAW, or it may be printed into the DAW. Cue buses can have their own performer balances. Apollo-specific low-latency and device-DSP behavior depends on hardware, mode, routing, and available resources.

Poietek response:

- A tracking route has separate ordered monitor, record, and cue stage lists.
- `clean` record mode excludes record-stage processors from the planned print path.
- `processed` record mode includes enabled record-stage processors but does not claim that they ran.
- Monitor-only and cue-only stages never silently enter the record path.
- An arm button stores `captureIntent: 'armed'`; it is not evidence of a running stream.
- An adapter observation must name active capture routes, active monitor routes, executed stages, and any measured latency before those claims become available.

### 3. Volt: useful integration should degrade gracefully

The interface family illustrates a useful product ladder. Different devices expose different combinations of direct monitoring, preamp modes, compression, auto-gain, cue mixes, talkback, mobile support, and session recall. A DAW should remain useful with a generic device while progressively enabling deeper control for a device that can prove it.

Poietek response:

- Sources use generic types: microphone, line, instrument, digital, USB left/right, virtual, or other.
- Input gain, phantom power, high-pass, polarity, and impedance are stored only as requests.
- `endpointId: null` is a valid planned state.
- A runtime adapter may later report input channels and controllable sources without changing the project schema.
- Unsupported controls remain visible as “adapter required”; they do not disappear or pretend to work.

### 4. Native plug-ins, device DSP, and accelerators: execution location matters

UA distinguishes computer-native processing from processing that runs on supported DSP hardware. Availability, tracking behavior, resource ceilings, and latency differ even when a processor has related native and DSP editions. UAD Spark provides a native subscription path; accelerators expand dedicated processing resources; Apollo combines interface and device-DSP roles.

Poietek response:

- Every tracking stage declares one execution location: `native_cpu`, `device_dsp`, or `external_hardware`.
- A saved processor reference is placement metadata, not proof that a licensed processor is installed.
- A stage becomes “processing observed” only when a reviewed adapter reports that exact stage ID as executed.
- No UA plug-in, subscription, license, account, or device format is assumed.
- Poietek's existing External Plug-in Slot remains the boundary for future VST3, CLAP, or Audio Unit hosting.

### 5. Hardware inserts and analog hardware: recall is incomplete without connections and measurement

UA's hardware-insert workflow models a physical send and return, performs a returned-signal latency calculation, and stores reusable routing presets. It also warns that real-time hardware must be processed in real time for bounce, freeze, and mixdown.

Poietek response:

- `external_insert` stages must use `external_hardware` execution.
- A partial send/return pair is invalid.
- A complete saved pair remains a plan until the endpoints are observed.
- Round-trip latency stays `null` until measured by an adapter.
- Future render, freeze, and bounce jobs that contain external stages must be explicitly real-time and cancellable.

### 6. Microphones and modeling systems: source identity and capture decisions need provenance

UA's microphone range includes conventional microphones, modeling-oriented microphones, and associated software. Some modeling processors require specific capture hardware or a particular multichannel recording arrangement.

Poietek response:

- Source kind, name, channel, and endpoint are explicit project data.
- Poietek will not describe a generic recorded track as a modeled microphone capture.
- A future microphone-profile system must store the physical source, channel topology, required processor, license, and post-capture choices independently.
- Any model choice must be a user-owned preset reference or licensed external processor state; no third-party mic models are bundled.

### 7. Pedals and instrument recording: the performer's path is not always the printed path

The UAFX product range reinforces the value of hands-on, stage-to-studio processing, MIDI control, and portable guitar chains. The architectural lesson is the need to represent an external performance chain without assuming it is controllable or recallable.

Poietek response:

- The starter includes an optional `external_hardware` instrument-pedal monitor stage.
- The stage begins bypassed and has no invented send, return, preset, or MIDI mapping.
- Future control support must come through Poietek's hardware contracts and store observations separately from project intent.

### 8. Presets, sessions, and recall: define exactly what a snapshot contains

UA exposes multiple recall scopes: track presets, plug-in scenes, Console sessions, project-embedded Console recall, and global hardware/I/O settings. The scopes are deliberately not identical.

Poietek response:

- A Tracking Console snapshot contains sources, stages, cue buses, and routes.
- It explicitly excludes `runtimeObservations`.
- Recall computes a source/stage/cue/route diff before application.
- Recall preserves current adapter observations but does not replay or reinterpret them.
- The whole recall is one canonical project mutation and therefore one undo point.

This avoids the dangerous ambiguity where recalling a UI snapshot could be mistaken for proof that phantom power, gain, routing, plug-ins, or a stream changed on physical hardware.

### 9. Support, installation, and licensing: operational readiness is part of product design

UA separates product discovery from installation, authorization, compatibility requirements, manuals, update management, and support. Native processors may require a manager and authorization service even when no interface is required.

Poietek response:

- Keep installation, license, plug-in discovery, processor availability, and session placement as different states.
- Never infer that a processor is usable from a catalog entry or saved reference.
- Preserve useful offline project editing when an external license service, device, or processor is absent.
- Add future compatibility diagnostics to the existing Device Health and External Plug-in Slot boundaries rather than to the portable project state.

## Implemented vertical slice

Extension key: `org.poietek.tracking-console`

Schema version: `1.0.0`

The new Tracking Console & Capture Paths rack device provides four views:

1. Paths — source-to-track cards, monitor/record separation, arm requests, monitor requests, and clean/processed selection.
2. Stages — source settings and path-specific processor-stage planning.
3. Recall — project-owned snapshots, a deterministic diff, and atomic recall.
4. Evidence — independent capture, monitoring, record processing, input control, and latency status.

The starter project adds:

- Mic / Input 1
- Instrument / Input 2
- USB Left
- USB Right
- Lead Vocal Capture audio track
- Instrument Capture audio track
- Artist Cue
- Producer Cue
- Vocal comfort dynamics on the monitor path
- A bypassed vocal print-tone stage on the record path
- A bypassed external instrument-pedal stage on the monitor path
- A bypassed performer cue-ambience stage
- Safe tracking defaults and a Safe tracking start snapshot

## Signal and evidence model

```text
Saved project intent

Source
  ├─ requested input controls ───────────────┐
  ├─ monitor stages ──> monitor intent       │
  ├─ cue stages ──────> cue sends            ├─ no live claim
  └─ record stages ───> clean / processed    │
                         target track ────────┘

Adapter observation

observed channels
  + controllable sources
  + active capture route IDs
  + active monitor route IDs
  + executed stage IDs
  + measured round-trip milliseconds
  = evidence-backed runtime report
```

Audio, control, and metadata remain separate:

- Audio: active streams and executed processors exist only behind reviewed adapters.
- Control: route choices, input requests, cue sends, stage enablement, and snapshots are canonical project data.
- Metadata: endpoint IDs, adapter IDs, observation timestamps, and evidence references describe what was observed.

## Capability truth table

| Capability | Current state | What is real now | Remaining gate |
|---|---|---|---|
| Source and track mapping | Production | Serializable project-owned routes and canonical audio tracks | None |
| Clean versus processed record planning | Production | Deterministic stage inclusion | Actual processor execution |
| Monitor-only and cue-only paths | Production | Separate validated path membership | Active output streams |
| Input-control requests | Production | Gain/switch/polarity/impedance intent | Device control and returned state |
| Setup snapshot, diff, recall, undo | Production | Runtime observations excluded; atomic project mutation | Physical-device recall |
| Mic/USB recording | Adapter required | Existing browser recorder elsewhere in Poietek; this device stores the coordinated plan | Route-aware recording adapter |
| Low-latency monitoring | Adapter required | Honest status report | Native or device-DSP stream evidence |
| Plug-in execution | Adapter required | Placement and execution-location metadata | Licensed host or device-DSP adapter |
| Hardware insert | Adapter required | Validated send/return planning contract | Physical I/O, real-time processing, latency measurement |
| Measured latency | Adapter required | Nullable observation field | Real adapter measurement |
| Microphone modeling | Not implemented | Source identity can be stored | Licensed compatible capture and processing workflow |
| Accelerator resource management | Not implemented | Execution location can be described | Hardware discovery, scheduling, telemetry, and recovery |
| Bounce and freeze | Not implemented | Architectural requirements documented | Render graph, media commit, restore, cancellation, parity tests |

## Tests added

The automated suite covers:

- Starter sources, tracks, routes, cues, and JSON serialization.
- Clean versus processed path construction.
- Monitor-stage isolation from the record path.
- Duplicate stage, wrong-placement, missing-track, and cross-project rejection.
- Input-control intent without fabricated hardware state.
- Evidence-gated capture, monitoring, processing, control, and latency reports.
- Broken runtime-observation rejection.
- Snapshot diff and recall with preserved runtime evidence.
- Atomic `ProjectSession` recall and undo.
- Rack catalog, menu, template, application handler, library, and UI wiring.

## Recommended next vertical slices

1. Route-aware native recording adapter
   - Resolve a planned source to an observed endpoint.
   - Return real active-stream evidence.
   - Commit captured media through the existing canonical asset pipeline.
   - Handle permission denial, disconnect, dropout, cancellation, and recovery.

2. Low-latency monitor and cue adapter
   - Separate main and performer output graphs.
   - Return stream IDs and device/channel evidence.
   - Measure latency; never estimate it from a marketing claim or buffer setting.

3. Track commit and restore
   - Render native processor graphs to new assets.
   - Preserve an archived source graph.
   - Make restore atomic and test render parity.
   - Force real-time operation when an external hardware stage is present.

4. Native plug-in host
   - Crash isolation, scan quarantine, license-aware availability, state migration, automation, delay compensation, and offline/realtime parity.
   - Never redistribute third-party plug-ins or factory content.

5. Hardware insert execution
   - Observed send/return endpoints, loop measurement, level alignment, cancellation, disconnect handling, and per-project presets.

6. Microphone capture profiles
   - Physical microphone and channel topology, provenance, raw-track retention, compatible licensed processor reference, and reversible post-capture choices.

7. Processing resource planner
   - CPU/device/external execution policy, explicit capacity observations, deterministic fallbacks, and warnings before a route becomes unavailable.

## Product conclusion

The durable lesson from Universal Audio's ecosystem is vertical integration with explicit mode boundaries. Poietek benefits most by making a complete recording decision understandable and recallable while being stricter about truth: a project can request an input control, a low-latency path, a cue mix, or printed processing, but the app must not present that request as a live capability until the responsible adapter returns evidence.
