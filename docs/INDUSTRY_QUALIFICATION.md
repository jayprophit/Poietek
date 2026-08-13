# Industry qualification — evidence baseline

Assessment date: 2026-08-14
Model version: 1.0.0

## Outcome

Poietek currently scores **53/100 (2.5/5.0)** across 27 controlled lanes:
thirteen product systems and fourteen professional specification volumes. Zero
lanes currently qualify for five stars. This is a useful, tested architecture
with several working vertical slices; it is not yet a world-class production
suite across every promised discipline.

The target remains 5.0. A lane receives five stars only when every mandatory
criterion is verified. A specification, prototype, contract, simulated device or
configured provider is not counted as finished implementation.

## Method

| State | Points | Meaning |
| --- | ---: | --- |
| Specified | 20 | Controlled requirements and an acceptance path exist. |
| Foundation | 40 | Versioned contracts, validators or safe defaults exist. |
| Working | 75 | An integrated useful slice works, but full release acceptance remains. |
| Verified | 100 | Repeatable implementation and acceptance evidence satisfy the criterion. |
| External gate | 0 | A device, provider, legal authority, codec, payment rail or independent test is required. |

The lane score is the mean of its mandatory criteria. Displayed stars are the
score mapped to a half-star scale, except that **5.0 is reserved** for a lane in
which every mandatory criterion is verified. The overall score is the mean of
all lane scores; overall five-star qualification requires all 27 lanes to
qualify.

This is not a popularity or market-share ranking. The reference products were
selected as representative, established category leaders with official,
inspectable capability documentation. Their names identify reference workflows;
their protected interfaces, sounds, presets and artwork are not copied.

## Current thirteen-system scorecard

| System | Score | Stars | Main five-star blocker |
| --- | ---: | ---: | --- |
| Professional DAW | 34 | 1.5 | Native low-latency engine, full mixing/automation, interchange and long-session acceptance. |
| Sampler | 59 | 3.0 | Production instrument engine, slicing/mapping depth and qualified hardware workflow. |
| Hardware Controller | 54 | 2.5 | Physical surface adapters and a measured device/firmware matrix. |
| MIDI Hub | 54 | 2.5 | Routing/transform/clock engine and real-device interoperability matrix. |
| Video Editor | 25 | 1.5 | Integrated frame-accurate editor, codec/proxy/render and review workflow. |
| VFX Suite | 20 | 1.0 | Working compositor, GPU/CPU renderer, tracking/3D and sandboxed visual plugins. |
| Collaboration Platform | 25 | 1.5 | Authenticated identities, durable change transport, conflict resolution and media review. |
| Publishing Platform | 34 | 1.5 | Validated release packages and authorized delivery/status/reporting adapters. |
| Rights Management Platform | 40 | 2.0 | Authenticated split approval, external registration and audited royalty accounting. |
| AI Creative Assistant | 40 | 2.0 | Working evaluated models/tools, user-configured provider adapters and model governance. |
| Social Network | 25 | 1.5 | Production identity/feed/media systems and staffed moderation/safety operations. |
| Marketplace | 34 | 1.5 | Payment, entitlement, tax/refund, seller and catalogue-governance operations. |
| Cloud Platform | 34 | 1.5 | Production sync, encryption, conflict tests, observability, backup/restore and incident readiness. |

## Current fourteen-volume scorecard

The controlled documents and their traceability tests are stronger than the
product systems they specify. Documentation is not allowed to lift an unfinished
product to five stars.

| Volume | Score | Stars |
| --- | ---: | ---: |
| 01 Vision & White Paper | 74 | 3.5 |
| 02 Software Architecture | 74 | 3.5 |
| 03 Audio Production System | 65 | 3.5 |
| 04 Sampler & Hardware Integration | 65 | 3.5 |
| 05 Video & VFX System | 60 | 3.0 |
| 06 AI System Architecture | 65 | 3.5 |
| 07 Community & Collaboration Platform | 65 | 3.5 |
| 08 Rights, Licensing & Publishing | 65 | 3.5 |
| 09 Cloud & Synchronisation | 65 | 3.5 |
| 10 Database & API Specification | 65 | 3.5 |
| 11 Desktop, Mobile & Web UI/UX | 74 | 3.5 |
| 12 Plugin SDK & Developer Documentation | 65 | 3.5 |
| 13 Security & Privacy | 65 | 3.5 |
| 14 Roadmap & Release Plan | 74 | 3.5 |

## Official reference set

The app embeds the same source records in the searchable **Ecosystem → Industry
qualification** screen.

- [Ableton Live](https://www.ableton.com/en/live/all-new-features/) — arrangement, performance, audio/MIDI transformation, mixer and accessibility.
- [Logic Pro](https://www.apple.com/logic-pro/) — desktop/tablet production, instruments, effects, routing, pitch/tempo and assisted workflows.
- [Pro Tools](https://cdn-www.avid.com/-/media/avid/files/hero-products-pdf/pro-tools/pro_tools_ds_a4.pdf) — professional recording, editing, mixing and post-production.
- [FL Studio](https://www.image-line.com/fl-studio/) — pattern, piano-roll, mixer, instrument and effect workflows.
- [Akai MPC](https://www.akaipro.com/mpc3/) — standalone/desktop sampling, multisampling, arrangement, automation and hardware operation.
- [DaVinci Resolve](https://www.blackmagicdesign.com/uk/products/davinciresolve/) — video edit, node VFX, colour, audio post, delivery and collaboration.
- [Blender](https://docs.blender.org/manual/en/dev/getting_started/about/index.html) — cross-platform 3D, animation, simulation, compositing, tracking and video.
- [BandLab Studio](https://help.bandlab.com/hc/en-us/articles/115002945153-Getting-Started-with-the-BandLab-Studio) — browser/mobile audio and MIDI creation, instruments, effects and learning.
- [Frame.io](https://help.frame.io/en/articles/9105251-commenting-on-your-media) — time/frame-based review, annotation and collaboration.
- [Splice Desktop](https://splice.com/tools/desktop) — licensed catalogue discovery, local sync, tempo/key preview and plugin management.
- [Songtrust](https://www.songtrust.com/) — song entry, publishing administration, royalty collection and reporting.
- [Supabase](https://supabase.com/docs) — Postgres, auth, storage, realtime, APIs and functions.
- [Firebase offline persistence](https://firebase.google.com/docs/firestore/manage-data/enable-offline) — offline reads/writes and reconnection synchronization.
- [VST 3](https://steinbergmedia.github.io/vst3_dev_portal/) and [CLAP](https://github.com/free-audio/clap) — audio plugin host/processor contracts.
- [OpenFX](https://openfx.readthedocs.io/en/latest/Reference/) — image-effect plugin hosting and rendering contracts.
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) — testable accessibility conformance.
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/) — testable application-security requirements.

## Separate machine benchmark

Studio Setup contains a real local browser benchmark for deterministic DSP,
scheduler jitter, OfflineAudioContext rendering and temporary IndexedDB
throughput. That result describes one device/browser run. It does not compare
commercial products and does not measure audio-interface round trip, driver
latency, clock lock, plugins, LUFS or true peak. The two scores must always remain
visibly separate.

## Five-star release rule

Poietek may say **target: five stars** today. It may say **five-star qualified**
only after the in-app model reports 27/27 qualified lanes and the evidence bundle
contains repeatable platform, device, performance, recovery, accessibility,
security, interoperability and operational acceptance results. User reviews or
marketing language can never replace that evidence.
