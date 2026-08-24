# Unified Production, Poietek TV, Community and Marketplace

Status: controlled architecture and local product foundation. Network services,
public broadcasting, payments, moderation operations and legal acceptance are
not represented as active.

## Product boundary

Poietek is one production application with several device-aware access surfaces,
not a collection of disconnected editors. A `PoietekProject` is the canonical
source of truth. The versioned `org.poietek.unified-production-suite` extension
orchestrates specialist audio, platform, community and hardware foundations
without copying or replacing their data.

One project can contain:

1. tempo, meter, score cues, MIDI and instrument tracks;
2. recorded or imported audio, samples, rack devices, edits and mix decisions;
3. picture clips, captions, graphics and VFX-graph references;
4. sample/time/frame sync anchors and programme-master references;
5. credits, contributors, rights evidence, licences and release destinations;
6. Poietek TV channel and session records;
7. selected community audiences and marketplace licence listings.

The master clock uses project seconds with explicit audio-sample and video-frame
maps. A score cue may point at a target frame, and a picture clip may link back to
score cues. This creates the contract for composing to picture without claiming
that the unfinished notation, video decode or VFX render engines are running.

## Creator ownership firewall

The intended product policy is:

- user productions belong to their creator or agreed rightsholders;
- Poietek owns only its software, brand, service and other company intellectual
  property—not the user's music, film, stream, artwork or product;
- using the application causes no automatic ownership transfer;
- any online-service licence must be versioned, non-exclusive, purpose-limited
  and evidenced by a user receipt;
- Poietek cannot determine disputes or grant rights in third-party material;
- contributor splits, employment, commissioned work, joint authorship, samples,
  performances and existing contracts can affect actual ownership.

The validator rejects a Poietek ownership claim on a user work and rejects an
“accepted” service licence without a versioned receipt and time.

## Poietek TV

The model supports creator channels, schedules and broadcast sessions, with
independent capability gates for ingest, delivery, chat, moderation, donations
and live commerce. A session cannot claim `live` unless real ingest and delivery
capabilities have been observed, an external session reference and start time
exist, and moderation is available. Viewer counts accept provider observations
only.

The intended viewer surface includes watch, comment, react, share, support the
creator and buy a licensed item. Each interaction remains independently
controllable by the channel owner and platform policy. Public operation requires
licensed ingest/transcoding/CDN infrastructure, captions, music and broadcast
rights, safety operations, abuse reporting, appeals, payment and consumer flows.

## Community topology

The safe default is local/private. The architecture then permits separately
reviewed modes:

- a hosted Poietek service for profiles, follows, feeds, groups, forums, chat,
  showcases and releases;
- federation between compatible independently operated communities;
- optional peer-to-peer distribution and discovery;
- private direct/group messaging.

Federated and peer-to-peer do not mean ungoverned. Trust, signing, moderation,
reporting, revocation, privacy and abuse controls are still required. Private
messaging must not claim end-to-end encryption until an audited protocol and key
lifecycle are implemented.

## Marketplace and revenue

The marketplace catalogue covers Poietek and community-contributor plug-ins,
instruments, effects, samples, presets, skins, templates, projects, music, video,
tickets and services. The company may charge a disclosed commission, but this
build deliberately sets no percentage. An approved rate requires an explicit
basis-point value, durable fee disclosure, owner approval identity and time.

A public digital listing requires authoritative seller verification, provider
publication acknowledgement and durable licence terms. Payments, tax reporting,
consumer information, digital-content consent, fulfilment, refunds, disputes,
payouts and fraud controls require reviewed adapters and operations.

Purchase or blockchain evidence is evidence of a transaction or timestamp. It is
not automatically copyright ownership.

## Delivery sequence

1. Complete score, MIDI and picture editing on the canonical local project.
2. Connect reviewed video decode/render and native audio engines.
3. Add local preview, captions, programme QC and deterministic render tests.
4. Deploy authenticated collaboration and hosted community in a test region.
5. Complete safety, privacy, children, accessibility and legal acceptance.
6. Pilot Poietek TV with private/unlisted channels and operational moderation.
7. Pilot verified sellers and sandbox payments; reconcile tax and refunds.
8. Qualify public broadcast, community and marketplace release gates.
9. Add federation and peer-to-peer only after dedicated threat and governance
   reviews.

## Implementation map

- `src/poietek/domain`: canonical project and media references.
- `src/poietek/unified`: orchestration contracts, defaults, validation and catalog.
- `src/poietek/platform`: rights, collaboration, privacy, AI, plugins, video/VFX
  and provider-neutral commerce.
- `src/poietek/community`: local/private hub, feed, release and tuning foundations.
- `src/poietek/react/UnifiedPlatformCenter.tsx`: creator and governance views.
- `tests/unified-production-suite.test.js`: fail-closed ownership, TV, commerce and
  policy assertions.

