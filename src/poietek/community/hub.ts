import {
  notEvaluatedCapability,
  requiresConfigurationCapability,
  unavailableCapability,
} from "../platform/defaults";
import type {
  CapabilityReport,
  ExternalWorkflowStatus,
} from "../platform/contracts";
import {
  COMMUNITY_FOUNDATION_SCHEMA_VERSION,
  type CommunityCatalogItem,
  type CommunityFeedEntry,
  type LocalCommunityHub,
  type ModerationDecision,
} from "./contracts";

export function pendingModeration(): ModerationDecision {
  return {
    state: "not_requested",
    authorityId: null,
    externalReference: null,
    observedAt: null,
    reasonCode: null,
  };
}

export function remoteNotSubmitted(): ExternalWorkflowStatus {
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
export function createLocalCommunityHub(options: {
  hubId: string;
  actorId: string;
  now: string;
  maximumOfflineBytes?: number;
}): LocalCommunityHub {
  if (!options.hubId.trim() || !options.actorId.trim()) {
    throw new Error("Hub and actor ids are required.");
  }
  const maximumBytes = options.maximumOfflineBytes ?? 1_073_741_824;
  if (!Number.isSafeInteger(maximumBytes) || maximumBytes < 0) {
    throw new Error("Offline cache limit must be a non-negative safe integer.");
  }

  return {
    schemaVersion: COMMUNITY_FOUNDATION_SCHEMA_VERSION,
    hubId: options.hubId,
    actorId: options.actorId,
    revision: 0,
    catalog: [],
    feed: [],
    federationEndpoints: [],
    store: {
      publishingCapability: requiresConfigurationCapability(
        "community.store.publishing",
        "No store publishing adapter has been configured.",
      ),
      paymentCapability: requiresConfigurationCapability(
        "community.store.payment",
        "No payment adapter has been configured.",
      ),
      listings: [],
      purchases: [],
    },
    offline: {
      policy: {
        mode: "manual",
        maximumBytes,
        eviction: "least_recently_used",
        autoCacheVisibility: [],
        encryptedStorageCapability: notEvaluatedCapability(
          "community.offline.encrypted_storage",
          "Encrypted storage support has not been probed on this device.",
        ),
      },
      entries: [],
    },
    createdAt: options.now,
    updatedAt: options.now,
  };
}

export function unavailableFederationCapability(
  protocolId: string,
): CapabilityReport {
  return unavailableCapability(
    `community.federation.${protocolId}`,
    "ADAPTER_UNAVAILABLE",
    `No verified ${protocolId} federation adapter is installed.`,
  );
}

export function addLocalCatalogItem(options: {
  hub: LocalCommunityHub;
  item: CommunityCatalogItem;
  now: string;
}): LocalCommunityHub {
  if (options.hub.catalog.some((item) => item.id === options.item.id)) {
    throw new Error(`Catalog item ${options.item.id} already exists.`);
  }
  if (options.item.publicationState === "published_remotely") {
    throw new Error(
      "A local catalog insert cannot claim that remote publication succeeded.",
    );
  }
  return {
    ...options.hub,
    revision: options.hub.revision + 1,
    catalog: [...options.hub.catalog, options.item],
    updatedAt: options.now,
  };
}

export function appendLocalFeedEntry(options: {
  hub: LocalCommunityHub;
  entry: Omit<CommunityFeedEntry, "localRevision" | "remoteDelivery">;
  requestRemoteDelivery?: boolean;
  now: string;
}): LocalCommunityHub {
  if (
    !options.hub.catalog.some(
      (item) => item.id === options.entry.catalogItemId,
    )
  ) {
    throw new Error("Feed entry must reference a local catalog item.");
  }
  if (
    options.entry.visibility === "circle" &&
    options.entry.circleIds.length === 0
  ) {
    throw new Error("Circle visibility requires at least one circle id.");
  }
  const revision = options.hub.revision + 1;
  const remoteDelivery = options.requestRemoteDelivery
    ? {
        ...remoteNotSubmitted(),
        state: "queued" as const,
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
