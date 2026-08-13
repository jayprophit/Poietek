import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import test from "node:test";

const compiledCoreDirectory = new URL("./.compiled-core/", import.meta.url);
mkdirSync(compiledCoreDirectory, { recursive: true });
writeFileSync(
  new URL("package.json", compiledCoreDirectory),
  `${JSON.stringify({ private: true, type: "commonjs" }, null, 2)}\n`,
  "utf8",
);

const require = createRequire(import.meta.url);
const factory = require("./.compiled-core/domain/projectFactory.js");
const defaults = require("./.compiled-core/platform/defaults.js");
const pitch = require("./.compiled-core/player/TimePreservingPitchBackend.js");
const hubModule = require("./.compiled-core/community/hub.js");
const profiles = require("./.compiled-core/community/profiles.js");
const release = require("./.compiled-core/community/release.js");
const tuning = require("./.compiled-core/community/tuning.js");
const validation = require("./.compiled-core/community/validation.js");

const now = "2026-08-12T12:00:00.000Z";

function original() {
  return {
    id: "rendition-original",
    kind: "creator_original",
    assetId: "asset-original",
    mediaType: "video",
    tuning: { ...tuning.STANDARD_A440_TUNING },
    durationSeconds: 180,
    contentDigest: "sha256:original",
    createdAt: now,
    derivedFromRenditionId: null,
    generation: null,
  };
}

function catalogItem() {
  const source = original();
  return {
    id: "catalog-1",
    releaseId: "release-1",
    title: "Creator Original",
    creatorIds: ["creator-1"],
    originalRenditionId: source.id,
    renditions: [source],
    derivativeRequests: [],
    visibility: "private",
    circleIds: [],
    publicationState: "published_locally",
    moderation: hubModule.pendingModeration(),
    trustStatements: [],
    tags: [],
    localRevision: 1,
    createdAt: now,
    updatedAt: now,
  };
}

test("community hub defaults to local/private with unavailable remote adapters", () => {
  const hub = hubModule.createLocalCommunityHub({
    hubId: "hub-1",
    actorId: "actor-1",
    now,
  });

  assert.equal(hub.revision, 0);
  assert.equal(hub.store.paymentCapability.state, "requires_configuration");
  assert.equal(hub.offline.policy.mode, "manual");
  assert.deepEqual(hub.offline.policy.autoCacheVisibility, []);
  assert.deepEqual(validation.validateCommunityHub(hub), []);
});

test("built-in destinations distinguish original playback from A432 derivative delivery", () => {
  assert.equal(
    profiles.LOCAL_PRIVATE_LIBRARY_PROFILE.derivativePolicy.kind,
    "preserve_original_only",
  );
  assert.deepEqual(
    profiles.POIETEK_PUBLIC_A432_DERIVATIVE_PROFILE.releaseProfile.tuningRequirement,
    { kind: "none" },
  );
  assert.deepEqual(
    profiles.POIETEK_PUBLIC_A432_DERIVATIVE_PROFILE.derivativePolicy,
    {
      kind: "required_time_preserving_derivative",
      targetReferenceHz: 432,
    },
  );
});

test("local feed commits do not invent remote acknowledgement", () => {
  let hub = hubModule.createLocalCommunityHub({
    hubId: "hub-1",
    actorId: "actor-1",
    now,
  });
  hub = hubModule.addLocalCatalogItem({ hub, item: catalogItem(), now });
  hub = hubModule.appendLocalFeedEntry({
    hub,
    requestRemoteDelivery: true,
    now,
    entry: {
      id: "feed-1",
      catalogItemId: "catalog-1",
      actorId: "actor-1",
      kind: "publish",
      message: null,
      visibility: "private",
      circleIds: [],
      moderation: hubModule.pendingModeration(),
      createdAt: now,
    },
  });

  assert.equal(hub.feed[0].remoteDelivery.state, "queued");
  assert.equal(hub.feed[0].remoteDelivery.externalReference, null);
  assert.equal(hub.revision, 2);
});

test("A440 to A432 creates a separate strict time-preserving request", () => {
  const source = original();
  const request = tuning.createDerivativePlaybackRequest({
    id: "request-1",
    original: source,
    targetTuning: tuning.A432_REFERENCE_TUNING,
    createdAt: now,
    backendCapability: defaults.unavailableCapability(
      "player.time_preserving_pitch",
      "DSP_UNAVAILABLE",
      "No DSP backend is installed.",
    ),
  });

  assert.equal(request.request.sourceAssetId, source.assetId);
  assert.equal(request.request.preserveTempo, true);
  assert.equal(request.request.preserveDuration, true);
  assert.equal("playbackRate" in request.request, false);
  assert.equal(source.tuning.referenceHz, 440);
});

test("unavailable pitch backend leaves the creator original as fallback", async () => {
  const source = original();
  const item = catalogItem();
  const draft = tuning.createDerivativePlaybackRequest({
    id: "request-1",
    original: source,
    targetTuning: tuning.A432_REFERENCE_TUNING,
    createdAt: now,
    backendCapability: defaults.unavailableCapability(
      "player.time_preserving_pitch",
      "DSP_UNAVAILABLE",
      "No DSP backend is installed.",
    ),
  });
  const unavailable = await tuning.openDerivativePlaybackSession({
    request: draft,
    backend: new pitch.UnavailableTimePreservingPitchBackend(),
    now: "2026-08-12T12:01:00.000Z",
  });

  assert.equal(unavailable.state, "backend_unavailable");
  assert.equal(unavailable.outputRenditionId, null);
  assert.equal(
    tuning.selectCommunityPlaybackRendition({
      catalogItem: item,
      targetReferenceHz: 432,
    }).id,
    source.id,
  );
});

test("destination-specific release blocks unmeasured standards and missing required derivative", () => {
  const project = factory.createBlankProject("Community release");
  const item = catalogItem();
  item.visibility = "public";
  item.moderation = {
    state: "approved",
    authorityId: "moderator-1",
    externalReference: "moderation-1",
    observedAt: now,
    reasonCode: null,
  };
  const result = release.assessCommunityRelease({
    project,
    measurements: {},
    catalogItem: item,
    destination: {
      id: "community-video-a432",
      label: "Community video A432 rendition",
      releaseProfile: {
        id: "community-video-a432-audio",
        label: "Community audio delivery",
        tuningRequirement: { kind: "none" },
        audio: { integratedLufs: -14, truePeakMaxDbtp: -1 },
      },
      allowedVisibility: ["public"],
      moderation: "required_before_remote_publish",
      federation: "not_required",
      commerce: "disabled",
      derivativePolicy: {
        kind: "required_time_preserving_derivative",
        targetReferenceHz: 432,
      },
    },
  });

  assert.equal(result.ready, false);
  assert.equal(result.checks.find((item) => item.id === "integrated-loudness").status, "not_measured");
  assert.equal(result.checks.find((item) => item.id === "true-peak").status, "not_measured");
  assert.equal(result.checks.find((item) => item.id === "community-tuning-derivative").status, "fail");
  assert.equal(project.settings.tuning.referenceHz, 440);
});

test("validation rejects a duration-changing derivative and ownership invention", () => {
  const hub = hubModule.createLocalCommunityHub({
    hubId: "hub-1",
    actorId: "actor-1",
    now,
  });
  const item = catalogItem();
  item.renditions.push({
    id: "rendition-a432",
    kind: "time_preserving_derivative",
    assetId: "asset-a432",
    mediaType: "video",
    tuning: { ...tuning.A432_REFERENCE_TUNING },
    durationSeconds: 184,
    contentDigest: "sha256:derivative",
    createdAt: now,
    derivedFromRenditionId: item.originalRenditionId,
    generation: {
      requestId: "request-1",
      backendId: "dsp-1",
      pitchShiftCents: -31.7666536334,
      preserveTempo: true,
      preserveDuration: true,
      renderedAt: now,
    },
  });
  hub.catalog.push(item);
  hub.store.listings.push({
    id: "listing-1",
    catalogItemId: item.id,
    title: item.title,
    status: "published",
    price: { currency: "GBP", minorUnits: "999" },
    licenseId: "license-1",
    licenseTermsAssetId: "terms-1",
    publicationStatus: hubModule.remoteNotSubmitted(),
    createdAt: now,
    updatedAt: now,
  });
  hub.store.purchases.push({
    id: "purchase-1",
    listingId: "listing-1",
    purchaserReference: "purchaser-1",
    amount: { currency: "GBP", minorUnits: "999" },
    localStatus: "confirmed",
    paymentStatus: hubModule.remoteNotSubmitted(),
    licenseEvidence: {
      id: "evidence-1",
      licenseId: "license-1",
      licenseTermsAssetId: "terms-1",
      licenseeReference: "purchaser-1",
      evidenceDigest: "sha256:evidence",
      issuedAt: now,
      issuerId: "store-1",
      externalReference: "license-proof-1",
      legalEffect: "copyright_ownership",
    },
    createdAt: now,
    updatedAt: now,
  });

  const codes = validation.validateCommunityHub(hub).map((item) => item.code);
  assert.ok(codes.includes("DERIVATIVE_DURATION_CHANGED"));
  assert.ok(codes.includes("PURCHASE_PAYMENT_EVIDENCE_REQUIRED"));
  assert.ok(codes.includes("LICENSE_LEGAL_EFFECT_INVALID"));
});
