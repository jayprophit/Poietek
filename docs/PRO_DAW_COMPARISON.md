# Professional workstation comparison and gap register

This document compares workflow categories, not proprietary code, branding,
factory presets, recorded media, patented algorithms, or paid plug-ins. Product
names below identify the applications reviewed. Poietek feature and device names
remain original.

## Sources reviewed on 2026-08-13

- Ableton Live 12 manual: settings, library, plug-ins, recording, warping, and
  launch behavior — <https://www.ableton.com/en/manual/first-steps/>
- Steinberg Cubase 15 feature catalog and operation manual —
  <https://www.steinberg.net/cubase/features/>
- Image-Line FL Studio audio, MIDI, general, file, and plug-in settings —
  <https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/envsettings.htm>
- Apple Logic Pro audio-device and latency-compensation documentation —
  <https://support.apple.com/guide/logicpro/work-with-plug-in-latencies-lgcpe11997ba/mac>
- Apple GarageBand product workflow — <https://www.apple.com/mac/garageband/>
- Avid Pro Tools documentation and playback-engine setup —
  <https://kb.avid.com/pkb/articles/en_US/Knowledge/Pro-Tools-Documentation>
- Reason 14 workflow, rack, devices, and standalone capabilities —
  <https://www.reasonstudios.com/shop/product/reason-14/>
- REAPER audio/MIDI setup and customization guide —
  <https://www.reaper.fm/userguide.php>
- Audacity tracks, clips, audio setup, monitoring, history, recovery, export,
  spectrogram, and effects documentation — <https://manual.audacityteam.org/>

## Cross-product feature matrix

| Professional category | Common mature behavior | Poietek current state | Next implementation gate |
| --- | --- | --- | --- |
| Project/session lifecycle | New/open/save-as, templates, consolidation, backups, missing-media repair | Canonical project, local repository, autosave, templates, media hashes, crash-recovery services | Wire recovery and consolidation controls; project migration UI |
| Audio devices | Driver/host, input/output, channels, sample rate, buffer, rescan, control panel | Complete preference model, browser enumeration and honest context report | Tauri native driver adapter and verified device negotiation |
| MIDI and synchronization | Input/output enable, mappings, clock, timecode, chase, control surfaces | Honest input manager, mapping tools, saved clock/timecode preferences | Output scheduler, clock/MTC adapters, timestamp and jitter fixtures |
| Recording | Count-in, pre-roll, monitoring, take lanes, punch, retrospective capture | Real browser recorder service, MIME negotiation, cleanup, saved defaults | Wire controls; take lanes, punch, retrospective buffer |
| Audio editing | Split, trim, slip, fades, crossfades, comping, warp, transient tools | Real durable waveform/timeline playback | Non-destructive edit commands, snap engine, fades, take comping |
| MIDI editing | Piano roll, step entry, drum grid, expression, articulation | Piano-roll/step prototypes and live MIDI processors | Canonical MIDI clips, automation, articulation maps, output |
| Mixer | Inserts, sends, groups, folders, VCAs, automation, latency compensation | Legacy mixer prototype; production gain/pan/mute/solo | Canonical mixer graph, buses, automation, processor latency graph |
| Built-in instruments | Synths, samplers, drum machines, multisampled/acoustic libraries | Original Web Audio instrument and sampler prototypes | Canonical presets, automation, polyphony tests, original recorded content |
| Effects | EQ, dynamics, reverb, delay, modulation, distortion, restoration, metering | Real legacy EQ/delay/reverb paths; production basic health analysis | Production insert graph, dynamics, render parity, conformance tests |
| Plug-in ecosystem | Scanning, validation, favorites, presets, latency, sandbox, crash quarantine | Complete preference/capability contracts; web unavailable | Native scanner and isolated host with user-licensed plug-ins |
| Browser/content | Search, tags, previews, favorites, packs, missing-content repair | Existing browser plus versioned honest module/content catalog | Canonical favorites, preview service, pack manifest and checksums |
| Export | Mix, selection, stems, formats, rates, depth, metadata, progress/cancel | Offline render and verified PCM16 WAV service | UI wiring, stems, 24-bit/float encoders, metadata, cancel/progress |
| Analysis/mastering | Loudness, true peak, spectrum, phase, clipping, delivery profiles | PCM RMS/sample peak/DC/correlation and release profiles | Validated BS.1770 and oversampled true-peak fixtures |
| Video/post | Video timeline, timecode, surround/immersive, interchange | Serializable render/interoperability contracts | Decode/proxy/render adapters, interchange round trips |
| Collaboration | Cloud projects, review, roles, comments, conflict handling | Local-first replicas/team/rights contracts | Authenticated transport, encryption, conflicts, review UI |
| Accessibility/learning | Scalable UI, contrast, reduced motion, tooltips, guided lessons | Persisted scale/theme/density/reduced-motion settings and walkthrough | Keyboard audit, screen-reader pass, WCAG testing, lesson engine |
| Diagnostics | CPU meter, disk meter, dropout reporting, plug-in profiling | Repeatable browser DSP/scheduler/offline/storage benchmark | Project stress fixtures, audio-thread/dropout telemetry, native profiler |

## Original Poietek naming

Serialized workspace ids such as `mpc`, `sp404`, `melodyne_pitch`, and
`fl_channel_rack` are retained temporarily for backward compatibility with old
templates. They are implementation identifiers, not product claims. Visible and
source component names now use Poietek terminology:

- Canvas Drum Grid
- Grain Deck Sampler
- Prism Poly Synth
- Pulse Drum Line
- Vocal Contour Editor
- Human Pulse Groove Pool
- Horizon Waveform Sequencer
- Beat Loom Step Rack
- Summit Master Console
- Studio EQ
- Echo Grid
- Space Weave
- Arc Bus Compressor
- Summit Limiter
- Quiet Field restoration
- Signal Loom MIDI tools
- Foundry One-Shot Kit

Actual third-party hardware names may appear only in device profiles and mapping
suggestions. A name match is not treated as verified capability. Third-party
plug-ins remain user-supplied and require their own licences.

## Benchmark interpretation

The Studio Setup benchmark measures deterministic JavaScript DSP throughput,
UI-thread timer jitter, `OfflineAudioContext` render throughput, and a temporary
IndexedDB write/read. The temporary benchmark database is deleted after the
test. The score is derived from measured values; a five-star result is possible
but never forced.

It does not compare copyrighted applications, and it does not measure physical
round-trip latency, driver stability, external clock lock, third-party plug-in
performance, LUFS, true peak, or a complete production session. Those require
separate fixtures and hardware evidence.
