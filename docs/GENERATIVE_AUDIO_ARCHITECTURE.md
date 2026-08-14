# Generative Audio Architecture

Document ID: `POI-AUDIO-AI-001`

Edition: `1.0.0`

Assessment date: `2026-08-14`

Status: `FOUNDATION — NO GENERATION PROVIDER CONNECTED`

## Product position

Poietek is a production suite with optional AI assistance. It is not an AI-first song generator.

The canonical DAW, sampler, rack, mixer, timeline, recording, editing, hardware, MIDI, video, VFX, collaboration, rights and publishing systems remain usable independently of generative audio. The Generative Audio Lab is an optional production instrument inside AI Studio. It drafts material for audition and returns accepted results to normal project workflows as separate, content-hashed media assets.

No provider is enabled by default. No consumer account session is scraped or automated. No model, weight file, API credential, wallet, third-party sound library, licence, payment plan or provider availability is bundled or implied.

## Original Poietek workflow language

The Lab uses provider-neutral production workflows:

1. **Idea Variations** — audition several musical directions.
2. **Sample Forge** — draft short one-shots, textures, foley, ambience and phrases.
3. **Section Continue** — draft before or after owned source audio.
4. **Region Recompose** — draft a replacement for a selected time range.
5. **Owned-Audio Variation** — explore controlled alternatives without altering the source.
6. **Adaptive Score Draft** — create duration, structure and energy-shaped cues.
7. **Lyrics-to-Demo** — audition creator-supplied lyrics with labelled synthetic vocals.
8. **Stem Drafts** — receive only stems a connected provider genuinely returns.
9. **Accompaniment Draft** — draft separate backing around an owned guide.

These are common production operations, not copies of another product’s screen, terminology, model, code, artwork, presets or sound catalogue.

## Inspiration and adapter catalogue

The controlled catalogue records thirteen optional references or adapter candidates:

- Suno and Udio are external-product workflow references. Poietek does not assume a public API and does not automate consumer sessions.
- Stability Audio, Loudly and Mubert have official API surfaces that may support future secure server/native adapters after contractual, privacy and output-licence review.
- SOUNDRAW is a reference for duration, energy, section, instrument and stem-oriented handoff. No undocumented API is assumed.
- ACE-Step, HeartMuLa, DiffRhythm and Stable Audio Open are candidates for separately installed local sidecars. Poietek does not bundle their code or weights and does not claim a model capability until the installed runtime reports and passes it.
- Sound Protocol is a community/provenance reference, not an audio generator. The former Sound.xyz application is offline. A digital collectible or blockchain record cannot imply copyright ownership.
- Bittensor is a decentralized-network candidate only through a named, reviewed subnet protocol. Bittensor itself is not a universal music-generation API. A wallet or TAO is never required for local Poietek production.
- Custom audio model is a versioned extension point for user-selected local or hosted systems.

## Non-negotiable safety and integrity rules

- The original project and source clips remain unchanged during generation.
- Provider output enters an audition tray as `preview_only`.
- Project insertion requires an explicit user acceptance and an undoable command.
- Source audio cannot leave the device without a per-request rights attestation and remote-data consent.
- A user attestation records the user’s statement; it is not external rights verification.
- Voice references require explicit identity consent evidence.
- The user must review creative direction and remove requests to imitate a named living artist or protected recording.
- Output remains labelled AI-generated with provider, model, version, workflow, time, source-asset identifiers and licence/terms evidence references.
- `originalityVerified` and `ownershipDetermined` default to `false`.
- Provider terms, training-data claims, commercial-use rights and output licences remain external evidence.
- Credentials stay in a native secure store or server boundary, never in the web bundle or project document.
- Local models are probed for real hardware, memory, model and workflow capabilities.
- Stems are labelled as stems only when the adapter actually returns separate layers.
- Generation never substitutes for LUFS, true peak, time-preserving pitch, mastering, rights acceptance or release approval.

## Adapter boundary

Every future adapter must declare:

- provider and model identity;
- exact execution location;
- endpoint and credential-reference rules;
- supported input and output media;
- supported workflows and limits;
- duration, sample-rate, channels and format constraints;
- progress, cancellation, retry and cost semantics;
- source-audio handling and retention;
- training/model/output licence evidence;
- moderation and blocked-content behaviour;
- provenance fields;
- health and capability negotiation;
- deterministic failure and unavailable states.

A route becomes queue-eligible only when it is enabled, reports `ready`, has a reviewed terms-evidence reference, and the draft passes every rights, consent, capability and input validation rule.

## Current implementation boundary

Implemented now:

- Versioned serializable contracts.
- Nine workflow definitions.
- Thirteen controlled provider/reference definitions.
- Fail-closed route defaults.
- Rights, source-media, creative-direction, duration, variation, provider capability and remote-consent validation.
- Preview-first plan calculation.
- AI Studio draft form, source-asset selection, route catalogue, official-source links and visible blockers.
- Tests proving that no route is connected or enabled by default.

Not implemented yet:

- Provider authentication.
- API or sidecar transport.
- Model downloads or runtime management.
- Audio generation.
- Progress/cancel/polling.
- Credit or wallet transactions.
- Audition-tray audio playback.
- Generated-output ingestion into the canonical project.
- Provider-specific licence evidence retrieval.
- Independent quality, similarity, safety or originality evaluation.

Those remain public-release blockers until implemented and accepted with real evidence.
