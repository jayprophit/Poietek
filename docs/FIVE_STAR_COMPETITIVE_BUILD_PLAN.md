# Five-star competitive build plan

Reviewed: 2026-08-22. This is a benchmark and acceptance plan, not a marketing
award. A lane receives five stars only when every mandatory test and external
gate for that lane has objective evidence.

## Reference systems and transferable patterns

| Reference | Pattern worth adopting | Poietek interpretation | Boundary |
| --- | --- | --- | --- |
| Ableton Live | Session/arrangement flow, comping, linked editing and MPE | Fast creative capture plus revisioned multi-track edits and expressive MIDI | Do not copy UI, devices, content or proprietary algorithms |
| Bitwig Studio | Cross-platform design, modulation, hardware languages and configurable plug-in sandboxing | Modulation graph and crash-contained native workers | Plug-in formats and SDKs remain licence/platform gated |
| Cubase | Score, picture, immersive routing and mature project interchange | One canonical score/audio/picture project with validated delivery | Dolby, ARA and proprietary interchange require real licences |
| REAPER | Efficient native host, routing flexibility and customization | Small native kernel, explicit routing graph and extension contracts | Use public behavior as reference, never proprietary source |
| Ardour | Open cross-platform recording, routing and non-destructive sources | Reference open architecture and interoperability tests | GPL code cannot enter a closed distribution without compliance |
| JUCE | C++ cross-platform audio, device and plug-in framework | Evaluate as an adapter behind Poietek's C ABI | GPL/commercial licence decision required before integration |
| Tracktion Engine | High-level C++ sequencer model across desktop/mobile | Reference engine decomposition and benchmark methodology | GPL/commercial plus JUCE licensing must be approved |
| DaVinci Resolve | Media-to-edit-to-VFX/color-to-audio-to-deliver workflow | Progressive production desks over one project and render/QC pipeline | No copying of Fusion/Fairlight UI, nodes or proprietary processing |
| BandLab | Low-friction browser/mobile creation and sharing | Anonymous local creation, optional account and compact mobile workflows | Cloud never becomes the local save condition |
| Figma | Document-scoped realtime collaboration with offline client edits | Project-scoped collaboration sessions and visible conflicts | Audio/media operations need domain-specific conflict policy |
| Audius/Open Audio | Separate content, discovery and ledger concerns | Optional content/discovery adapters and evidence-only provenance | Blockchain remains optional and cannot establish copyright |
| Splice-like libraries | Search, audition, provenance and licence receipts | Original/licensed content catalogue with durable entitlement evidence | Never copy commercial samples, metadata or branding |

Primary references:

- Ableton Live manual: https://www.ableton.com/en/live-manual/
- Bitwig architecture: https://www.bitwig.com/modern-foundations/
- Steinberg Cubase: https://www.steinberg.net/cubase/
- Ardour manual and source: https://manual.ardour.org/ and https://git.ardour.org/ardour
- JUCE: https://juce.com/
- Tracktion Engine: https://github.com/Tracktion/tracktion_engine
- DaVinci Resolve: https://www.blackmagicdesign.com/products/davinciresolve
- BandLab Studio: https://help.bandlab.com/hc/en-us/articles/115002945153-Getting-Started-with-the-BandLab-Studio
- Figma multiplayer: https://www.figma.com/blog/how-figmas-multiplayer-technology-works/
- Audius protocol: https://docs.audius.co/learn/concepts/protocol/

## Architecture decision

Poietek uses layered implementation rather than one language everywhere:

1. C++20 native core for allocation-free DSP, codecs, plug-in hosting and
   performance-critical media kernels.
2. A stable C ABI so Rust, Swift, Kotlin, JavaScript/WASM and test hosts do not
   depend on C++ name mangling or object layout.
3. Rust/Tauri for the least-privilege desktop shell, native command validation,
   process supervision and future native adapters.
4. TypeScript domain/application contracts and React presentation for the shared
   web/PWA/device-aware product surface.
5. Platform-native mobile packaging and thin integrations where browser/Tauri
   capabilities are insufficient.
6. Optional regional cloud cells for identity, sync, collaboration, media,
   community, commerce, publishing and AI routing.

This mirrors the separation found in mature systems—native engines beneath
product/application layers—without forcing project state, policy, networking or
UI into unsafe real-time code.

## Five-star acceptance matrix

| Lane | Five-star exit evidence | Current honest state |
| --- | --- | --- |
| Project durability | Migration fixtures, crash recovery, autosave, undo/redo, corruption and restore tests | Foundation/verified slices |
| Audio engine | Real device enumeration, stable callback, measured xruns, hot-swap, routing and offline parity on representative hardware | Native contracts plus initial C++ DSP kernel; device callback unavailable |
| Editing | Automation, linked edits, comping, fades, groups, folders, stretch, freeze and interchange are revisioned and tested | Partial |
| MIDI/score | MIDI clips, MPE, clock/MTC, articulations, MusicXML and score-to-picture hardware tests | Foundation/partial |
| Plug-ins | VST3/CLAP scan, sandbox, quarantine, crash recovery, PDC and state recall | Unavailable until licensed native host exists |
| Video/VFX/color | Probe/decode/proxy, frame clock, node graph, GPU render, cancellation, color management and fixtures | Contracts only |
| Delivery | Reviewed BS.1770, oversampled true peak, codec/container/caption QC and reproducible profiles | Unavailable/not measured |
| Desktop | Windows/macOS/Linux installers, upgrades, uninstall, signing and physical acceptance | Web build verified; native packaging blocked locally |
| Mobile/tablet | Touch workflows, Android/iOS packages, lifecycle, permissions, hardware and store acceptance | Responsive UI foundation only |
| Web/PWA | Offline install, browser capability fallbacks, accessibility, recovery, performance and update safety | Strong verified foundation; full acceptance pending |
| Collaboration | Offline operations, authorization, presence, conflict UX, recovery, load and residency evidence | Contracts/local foundation |
| Community/live | Moderation, abuse response, ingest/transcode/CDN, captions, rights and capacity exercises | Foundation/unavailable services |
| Rights/publishing | Auditable splits, licences, registrations, disputes and external receipts | Evidence contracts only |
| Commerce | Approved catalogue, payments, refunds, payouts, tax, fraud and reconciliation | Disabled foundation |
| AI | Local/remote policy, consent, lineage, evaluation, safety and undoable acceptance | Optional disabled foundation |
| Security/privacy | Threat models, SBOM, signed supply chain, penetration tests, DPIA, deletion and incident exercises | Partial documentation |
| Accessibility/global | WCAG audit, keyboard/screen-reader/touch acceptance, localization and low-bandwidth tests | Partial |
| Operations | SLOs, telemetry consent, backup restore, regional failover, rollback, capacity and support runbooks | Planned |

No row may be changed to five stars based on documentation, competitor parity or
an unavailable-state contract alone. `docs/INDUSTRY_QUALIFICATION.md` and
`docs/PUBLIC_RELEASE_READINESS.md` remain the controlled score and release gate.

## Build sequence

1. Compile and integrate the C++ DSP ABI; add sanitizers, fuzzing and parity fixtures.
2. Implement WASAPI shared/exclusive callback and measured telemetry on Windows.
3. Add equivalent Core Audio, Linux and mobile adapters behind the same boundary.
4. Complete professional editing/MIDI before plug-in and codec expansion.
5. Add isolated plug-in and media worker processes with licence review.
6. Complete delivery analysis/QC and unsigned installer acceptance.
7. Add optional identity/sync/collaboration, then community/live/commerce.
8. Run security, accessibility, legal, physical-device and operations exits.

Open-source dependencies are adopted only after licence, maintenance, security,
binary-size and platform review. Closed-source products provide workflow and
acceptance inspiration only; their code, content, branding and protected assets
are never copied.
