# Professional production gap plan

Poietek is not yet comparable as a complete production product to established
desktop or mobile DAWs. This document turns that fact into an implementable,
testable sequence. “Foundation” does not mean an audible or shippable feature.

## Evidence used

The feature baseline was derived from current primary manuals and standards,
including:

- [Ableton Live 12 concepts and manual](https://www.ableton.com/en/manual/live-concepts/)
- [Ableton automation and envelopes](https://www.ableton.com/en/live-manual/11/automation-and-editing-envelopes/)
- [Ableton comping](https://www.ableton.com/en/live-manual/11/comping/)
- [Logic Pro Smart Tempo](https://support.apple.com/guide/logicpro/smart-tempo-overview-lgcp9281e70c/mac)
- [Logic Pro Flex Time and Pitch](https://support.apple.com/guide/logicpro/flex-time-algorithms-and-parameters-lgcpa77a4a3f/mac)
- [Cubase Pro 15 Audio Connections / Control Room](https://www.steinberg.help/r/cubase-pro/15.0/en/cubase_nuendo/topics/vst_connections/vst_connections_window_r.html)
- [Reason rack workflow](https://docs.reasonstudios.com/reason12/working-with-the-rack)
- [FL Studio Channel Rack and Step Sequencer](https://www.image-line.com/fl-studio-learning-content/fl-studio-online-manual/html/channelrack.htm)
- [FL Studio Playlist](https://www.image-line.com/fl-studio-learning-content/fl-studio-online-manual/html/playlist.htm)
- [FL Studio recording](https://www.image-line.com/fl-studio-learning-content/fl-studio-online-manual/html/recording.htm)
- [DAWproject exchange format](https://github.com/bitwig/dawproject)
- [Audacity tracks and clips](https://manual.audacityteam.org/man/audacity_tracks_and_clips.html)
- [Ollama local chat API](https://docs.ollama.com/api/chat)
- [OpenAI API quickstart](https://platform.openai.com/docs/quickstart/make-your-first-api-request)
- [Google Gemini key security](https://ai.google.dev/gemini-api/docs/api-key)
- [xAI inference API](https://docs.x.ai/developers/rest-api-reference/inference)
- [DeepSeek chat API](https://api-docs.deepseek.com/api/create-chat-completion/)
- [Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers/en/index)

These products are references for user needs and workflows, not sources of
Poietek code, names, presets, samples or visual assets.

## What is operational today

- canonical local project create/open/save;
- content-hashed audio assets in OPFS with IndexedDB fallback;
- browser audio import and real decoding;
- waveform peaks and multitrack audio timeline;
- non-destructive move, trim, split, gain, pan, fades and mute;
- Web Audio playback, track/clip gain and pan, mute/solo;
- microphone recording with capability and cleanup handling;
- real project PCM WAV export;
- project autosave, undo/redo and crash-recovery snapshots;
- deterministic basic audio-health measurements;
- explicit unavailable LUFS, dBTP and time-preserving pitch states;
- professional preference profiles and truthful device/MIDI foundations;
- offline/PWA/local launcher and Tauri packaging foundation;
- independent local project assistant and optional provider router.

## Critical missing production paths

| Priority | System | Missing operational behavior | Acceptance gate |
| --- | --- | --- | --- |
| P0 | MIDI project model | Durable notes, CC, pitch, pressure, MPE, program changes and tempo/time-signature events | Save/reopen/undo/export tests preserve every event sample/tick position. |
| P0 | Piano roll and step sequencer | Select, draw, move, resize, duplicate, quantize, velocity, probability, ratchet and scale awareness | Keyboard, mouse, touch and external MIDI edit the same command model. |
| P0 | Signal graph | Inserts, pre/post sends, groups, buses, returns, sidechains, master/control-room paths | Graph validation prevents loops; offline and realtime renders match within tolerance. |
| P0 | Automation | Track/clip lanes, read/touch/latch/write, trim, curves and parameter discovery | Sample/tick-timed playback and complete command history. |
| P0 | Recording | Punch, loop recording, take lanes, comping, pre-roll, count-in and input routing | Recoverable takes with no stream leaks or destructive loss. |
| P0 | Native audio | Low-latency device backend, buffer negotiation, exclusive/shared modes and dropout reporting | Measured callback stability and physical-loopback latency evidence. |
| P1 | Sampler engine | Slicing, key/velocity zones, round robin, envelopes, filters, modulation, choke groups and disk streaming | Deterministic render tests and original/licensed source provenance. |
| P1 | Instrument/effect graph | Polyphonic voice engine, modulation matrix, macro controls and preset migration | Reproducible offline render and bounded realtime allocations. |
| P1 | Time and pitch | Validated transient detection, time stretch, warp markers, pitch correction and formant control | Duration/pitch test vectors; no playback-rate substitution. |
| P1 | Freeze/bounce | Track, selection, stems, in-place bounce and plugin fallback renders | Round-trip state restore and cancellation-safe files. |
| P1 | Plugin host | VST3/CLAP/AU discovery, scan quarantine, state, automation, delay compensation and sandboxing | Native-only, signed capability; crash cannot take down project recovery. |
| P1 | Library | Metadata, preview bus, favourites, tags, duplicates, missing-media relink and licence/provenance filters | Large-library search benchmark and portable paths. |
| P2 | Session/performance | Scenes, clip launch quantization, follow actions, performance recording and controller mappings | Deterministic scene-to-arrangement capture. |
| P2 | Advanced mixer | VCA/DCA, folders, cue mixes, talkback, monitor sets, surround/immersive layouts | Explicit I/O mapping and channel-format validation. |
| P2 | Score and notation | Staff editing, articulation maps, lyrics, chord/tempo tracks and MusicXML | Round-trip interchange tests. |
| P2 | Video | Real frame/codec pipeline, proxies, thumbnails, captions, timecode and export | Audio/video sync drift and frame-accurate edit tests. |
| P2 | VFX | Compositor/render graph, masks, tracking, colour and audio-reactive controls | Reproducible render jobs with unavailable GPU/codec states. |
| P2 | Collaboration | Authenticated replicas, presence, comments, revisions, locks/conflicts and encrypted media sync | Offline conflict simulation and provider integration tests. |
| P2 | Publishing/rights | Authority-backed registrations, licences, splits, statements, payments and takedown flows | External evidence IDs and audit logs; never infer acceptance. |

## AI architecture delivered in this slice

The local `Poietek Studio Brain` is always available and is independent of any
model vendor. It analyzes only the canonical project snapshot and returns
evidence-linked observations, technical guidance, creative options, destination
requirements and safety findings. It cannot modify the project.

Optional provider adapters are configuration, not bundled dependency. Browser
code never accepts an API key. Remote providers require a same-origin secure
proxy or native secure store; local Ollama is restricted to loopback. Provider
selection, model, permitted data categories, consent and unavailable/error state
are visible to the user. A custom adapter must declare its execution location,
model, endpoint, data access and credential reference.

## Staged implementation order

1. Durable MIDI events plus piano roll, step sequencer and virtual keyboard.
2. Signal graph, buses/sends, automation and project-aware meters.
3. Take lanes, comping, punch/loop recording and freeze/bounce.
4. Native realtime audio and sandboxed plugin host.
5. Sampler/instrument engines and original sound-library production.
6. Validated stretch/pitch and standards loudness analyzers.
7. Session performance, advanced control room and immersive routing.
8. Operational collaboration and secure AI proxy/native credential service.
9. Video, VFX, publishing, rights and marketplace provider slices.

Each stage must pass format, strict type checking, unit/integration tests,
production build, offline restart, responsive UI checks and a source/credential
audit before the next stage is promoted.
