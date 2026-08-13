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
const contracts = require("./.compiled-core/platform/contracts.js");
const defaults = require("./.compiled-core/platform/defaults.js");
const extension = require("./.compiled-core/platform/extension.js");
const validation = require("./.compiled-core/platform/validation.js");

const now = "2026-08-12T12:00:00.000Z";

function makeFoundation() {
  return defaults.createLocalPlatformFoundation({
    projectId: "project-1",
    localActorId: "actor-1",
    localReplicaId: "replica-1",
    platform: "desktop",
    now,
  });
}

test("local foundation is versioned, JSON-safe and private by default", () => {
  const foundation = makeFoundation();
  const roundTrip = JSON.parse(JSON.stringify(foundation));

  assert.equal(
    foundation.schemaVersion,
    contracts.PLATFORM_FOUNDATION_SCHEMA_VERSION,
  );
  assert.equal(foundation.collaboration.localChangeLogCapability.state, "available");
  assert.equal(
    foundation.collaboration.remoteSyncCapability.state,
    "requires_configuration",
  );
  assert.equal(foundation.privacy.analytics, "disabled");
  assert.equal(foundation.privacy.remoteAiDataUse, "disabled");
  assert.equal(foundation.privacy.providerModelTraining, "denied");
  assert.equal(foundation.provenance.blockchainEnabled, false);
  assert.equal(foundation.ai.projectChangesRequirePreview, true);
  assert.equal(foundation.ai.projectChangesRequireUndoableCommand, true);
  assert.deepEqual(roundTrip, foundation);
  assert.deepEqual(validation.validatePlatformFoundation(foundation), []);
});

test("a local collaboration commit never invents remote acknowledgement", () => {
  const change = defaults.createLocalCommittedChange({
    id: "change-1",
    projectId: "project-1",
    actorId: "actor-1",
    replicaId: "replica-1",
    baseRevision: 4,
    createdAt: now,
    commandType: "track.rename",
    payload: { trackId: "track-1", name: "Lead" },
    requestRemoteDelivery: true,
  });

  assert.deepEqual(change.localCommit, { status: "committed", committedAt: now });
  assert.deepEqual(change.remoteDelivery, {
    state: "pending",
    externalReference: null,
    observedAt: null,
  });
  assert.equal(change.nextRevision, 5);
});

test("rights are not fully accepted without explicit external evidence", () => {
  const foundation = makeFoundation();
  foundation.rights.contributorPassports.push(
    {
      id: "contributor-1",
      displayName: "One",
      legalName: null,
      roles: ["writer"],
      identityClaims: [],
      createdAt: now,
      updatedAt: now,
      privateFieldsRef: null,
    },
    {
      id: "contributor-2",
      displayName: "Two",
      legalName: null,
      roles: ["producer"],
      identityClaims: [],
      createdAt: now,
      updatedAt: now,
      privateFieldsRef: null,
    },
  );
  foundation.rights.splitProposals.push({
    id: "split-1",
    workId: "work-1",
    version: 1,
    status: "fully_accepted",
    createdAt: now,
    updatedAt: now,
    supersedesId: null,
    shares: [
      {
        contributorId: "contributor-1",
        basisPoints: 5000,
        role: "writer",
        acceptance: {
          state: "accepted",
          authorityId: "",
          externalReference: "",
          observedAt: "",
        },
      },
      {
        contributorId: "contributor-2",
        basisPoints: 5000,
        role: "producer",
        acceptance: {
          state: "pending",
          authorityId: null,
          externalReference: null,
          observedAt: null,
        },
      },
    ],
  });

  const codes = validation
    .validatePlatformFoundation(foundation)
    .map((item) => item.code);
  assert.ok(codes.includes("RIGHTS_ACCEPTANCE_AUTHORITY_REQUIRED"));
  assert.ok(codes.includes("RIGHTS_ACCEPTANCE_REFERENCE_REQUIRED"));
  assert.ok(codes.includes("RIGHTS_ACCEPTANCE_OBSERVATION_REQUIRED"));
  assert.ok(codes.includes("SPLIT_ACCEPTANCE_INCOMPLETE"));
});

test("blockchain remains optional evidence and cannot imply ownership", () => {
  const foundation = makeFoundation();
  foundation.provenance.blockchainEnabled = true;
  foundation.provenance.evidence.push({
    id: "evidence-1",
    kind: "blockchain_anchor",
    subjectId: "asset-1",
    digestAlgorithm: "SHA-256",
    digest: "abc",
    createdAt: now,
    authorityId: null,
    externalReference: null,
    legalEffect: "copyright_ownership",
    metadata: {},
    anchor: {
      state: "anchored",
      network: "",
      transactionId: "",
      blockReference: "",
      observedAt: "",
    },
  });

  const codes = validation
    .validatePlatformFoundation(foundation)
    .map((item) => item.code);
  assert.ok(codes.includes("PROVENANCE_LEGAL_EFFECT_INVALID"));
  assert.ok(codes.includes("BLOCKCHAIN_ANCHOR_EVIDENCE_REQUIRED"));
  assert.ok(codes.includes("BLOCKCHAIN_ENABLED_WITHOUT_CAPABILITY"));
});

test("commerce cannot report fulfillment before external payment evidence", () => {
  const foundation = makeFoundation();
  foundation.commerce.orders.push({
    id: "order-1",
    listingId: "listing-1",
    purchaserReference: null,
    amount: { currency: "GBP", minorUnits: "999" },
    localStatus: "fulfilled",
    paymentStatus: defaults.externalNotSubmittedStatus(),
    fulfillmentReference: null,
    createdAt: now,
    updatedAt: now,
  });

  assert.ok(
    validation
      .validatePlatformFoundation(foundation)
      .some((item) => item.code === "ORDER_FULFILLMENT_EVIDENCE_REQUIRED"),
  );
});

test("plugins, renders and AI actions preserve unavailable or incomplete state", () => {
  const foundation = makeFoundation();
  foundation.plugins.instances.push({
    instanceId: "plugin-instance-1",
    pluginId: "plugin-1",
    pluginFormat: "vst3",
    version: null,
    support: "available",
    hostCapability: defaults.unavailableCapability(
      "plugins.host.vst3",
      "HOST_UNAVAILABLE",
      "No VST3 host is active.",
    ),
    serializedState: {},
    frozenRenderAssetId: null,
    reason: null,
  });
  foundation.videoVfx.jobs.push({
    id: "render-1",
    mediaType: "video",
    status: "completed",
    capability: defaults.notEvaluatedCapability(
      "video.render.job",
      "No renderer was probed.",
    ),
    sourceAssetIds: ["video-1"],
    settings: {},
    outputAssetId: null,
    progress: 1,
    errorCode: null,
    createdAt: now,
    updatedAt: now,
  });
  foundation.ai.actions.push({
    id: "ai-1",
    createdAt: now,
    providerId: null,
    modelId: null,
    purpose: "suggest an edit",
    inputAssetIds: [],
    contextScopes: [],
    outputPreviewAssetIds: [],
    status: "applied",
    previewDigest: null,
    userAcceptedAt: null,
    appliedCommandId: null,
    appliedAt: null,
    provenanceEvidenceIds: [],
    errorCode: null,
  });

  const codes = validation
    .validatePlatformFoundation(foundation)
    .map((item) => item.code);
  assert.ok(codes.includes("PLUGIN_HOST_UNAVAILABLE"));
  assert.ok(codes.includes("RENDER_OUTPUT_REQUIRED"));
  assert.ok(codes.includes("AI_PREVIEW_REQUIRED"));
  assert.ok(codes.includes("AI_USER_ACCEPTANCE_REQUIRED"));
  assert.ok(codes.includes("AI_UNDOABLE_COMMAND_REQUIRED"));
});

test("canonical project extension rejects unknown versions and project mismatch", () => {
  const project = { id: "project-1", extensions: {} };
  const foundation = makeFoundation();
  const attached = extension.withPlatformFoundation(project, foundation);

  assert.equal(extension.readPlatformFoundation(attached).state, "ready");
  assert.equal(project.extensions[contracts.PLATFORM_FOUNDATION_EXTENSION_KEY], undefined);

  const unsupported = {
    id: "project-1",
    extensions: {
      [contracts.PLATFORM_FOUNDATION_EXTENSION_KEY]: {
        ...foundation,
        schemaVersion: "99.0.0",
      },
    },
  };
  assert.deepEqual(extension.readPlatformFoundation(unsupported), {
    state: "unsupported_version",
    schemaVersion: "99.0.0",
  });

  assert.throws(
    () =>
      extension.withPlatformFoundation(
        { id: "another-project", extensions: {} },
        foundation,
      ),
    /does not match/,
  );
});
