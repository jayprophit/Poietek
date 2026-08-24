"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pendingModeration = pendingModeration;
exports.remoteNotSubmitted = remoteNotSubmitted;
exports.createLocalCommunityHub = createLocalCommunityHub;
exports.unavailableFederationCapability = unavailableFederationCapability;
exports.addLocalCatalogItem = addLocalCatalogItem;
exports.appendLocalFeedEntry = appendLocalFeedEntry;
const defaults_1 = require("../platform/defaults");
const contracts_1 = require("./contracts");
function pendingModeration() {
    return {
        state: "not_requested",
        authorityId: null,
        externalReference: null,
        observedAt: null,
        reasonCode: null,
    };
}
function remoteNotSubmitted() {
    return {
        state: "not_submitted",
        authorityId: null,
        externalReference: null,
        submittedAt: null,
        observedAt: null,
        message: null,
        rawStatus: null,
    };
}
/** Privacy-first local catalog. No endpoint, payment, or moderation is implied. */
function createLocalCommunityHub(options) {
    if (!options.hubId.trim() || !options.actorId.trim()) {
        throw new Error("Hub and actor ids are required.");
    }
    const maximumBytes = options.maximumOfflineBytes ?? 1_073_741_824;
    if (!Number.isSafeInteger(maximumBytes) || maximumBytes < 0) {
        throw new Error("Offline cache limit must be a non-negative safe integer.");
    }
    return {
        schemaVersion: contracts_1.COMMUNITY_FOUNDATION_SCHEMA_VERSION,
        hubId: options.hubId,
        actorId: options.actorId,
        revision: 0,
        catalog: [],
        feed: [],
        federationEndpoints: [],
        store: {
            publishingCapability: (0, defaults_1.requiresConfigurationCapability)("community.store.publishing", "No store publishing adapter has been configured."),
            paymentCapability: (0, defaults_1.requiresConfigurationCapability)("community.store.payment", "No payment adapter has been configured."),
            listings: [],
            purchases: [],
        },
        offline: {
            policy: {
                mode: "manual",
                maximumBytes,
                eviction: "least_recently_used",
                autoCacheVisibility: [],
                encryptedStorageCapability: (0, defaults_1.notEvaluatedCapability)("community.offline.encrypted_storage", "Encrypted storage support has not been probed on this device."),
            },
            entries: [],
        },
        createdAt: options.now,
        updatedAt: options.now,
    };
}
function unavailableFederationCapability(protocolId) {
    return (0, defaults_1.unavailableCapability)(`community.federation.${protocolId}`, "ADAPTER_UNAVAILABLE", `No verified ${protocolId} federation adapter is installed.`);
}
function addLocalCatalogItem(options) {
    if (options.hub.catalog.some((item) => item.id === options.item.id)) {
        throw new Error(`Catalog item ${options.item.id} already exists.`);
    }
    if (options.item.publicationState === "published_remotely") {
        throw new Error("A local catalog insert cannot claim that remote publication succeeded.");
    }
    return {
        ...options.hub,
        revision: options.hub.revision + 1,
        catalog: [...options.hub.catalog, options.item],
        updatedAt: options.now,
    };
}
function appendLocalFeedEntry(options) {
    if (!options.hub.catalog.some((item) => item.id === options.entry.catalogItemId)) {
        throw new Error("Feed entry must reference a local catalog item.");
    }
    if (options.entry.visibility === "circle" &&
        options.entry.circleIds.length === 0) {
        throw new Error("Circle visibility requires at least one circle id.");
    }
    const revision = options.hub.revision + 1;
    const remoteDelivery = options.requestRemoteDelivery
        ? {
            ...remoteNotSubmitted(),
            state: "queued",
            submittedAt: options.now,
            message: "Queued locally; no remote acknowledgement has been received.",
        }
        : remoteNotSubmitted();
    return {
        ...options.hub,
        revision,
        feed: [
            ...options.hub.feed,
            { ...options.entry, localRevision: revision, remoteDelivery },
        ],
        updatedAt: options.now,
    };
}
