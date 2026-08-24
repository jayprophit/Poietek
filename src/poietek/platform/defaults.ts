import {
  PLATFORM_FOUNDATION_SCHEMA_VERSION,
  type CapabilityReport,
  type CollaborationChangeEnvelope,
  type ExternalWorkflowStatus,
  type JsonObject,
  type PlatformFoundation,
} from "./contracts";

function capabilityBase(capabilityId: string): CapabilityReport {
  return {
    capabilityId,
    state: "not_evaluated",
    source: "unknown",
    implementationId: null,
    observedAt: null,
    reasonCode: null,
    message: null,
    retryable: false,
    requiredConsentScope: null,
    metadata: {},
  };
}

export function availableCapability(
  capabilityId: string,
  implementationId: string,
  observedAt: string,
  source: CapabilityReport["source"] = "local",
  metadata: JsonObject = {},
): CapabilityReport {
  return {
    ...capabilityBase(capabilityId),
    state: "available",
    source,
    implementationId,
    observedAt,
    metadata,
  };
}

export function unavailableCapability(
  capabilityId: string,
  reasonCode: string,
  message: string,
  retryable = false,
): CapabilityReport {
  return {
    ...capabilityBase(capabilityId),
    state: "unavailable",
    reasonCode,
    message,
    retryable,
  };
}

export function notEvaluatedCapability(
  capabilityId: string,
  message: string,
): CapabilityReport {
  return {
    ...capabilityBase(capabilityId),
    message,
  };
}

export function requiresConfigurationCapability(
  capabilityId: string,
  message: string,
): CapabilityReport {
  return {
    ...capabilityBase(capabilityId),
    state: "requires_configuration",
    reasonCode: "CONFIGURATION_REQUIRED",
    message,
  };
}

export function requiresConsentCapability(
  capabilityId: string,
  consentScope: string,
  message: string,
): CapabilityReport {
  return {
    ...capabilityBase(capabilityId),
    state: "requires_consent",
    reasonCode: "CONSENT_REQUIRED",
    message,
    requiredConsentScope: consentScope,
  };
}

export function isCapabilityUsable(report: CapabilityReport): boolean {
  return report.state === "available" || report.state === "degraded";
}

export function externalNotSubmittedStatus(): ExternalWorkflowStatus {
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

export interface LocalPlatformFoundationOptions {
  projectId: string;
  localActorId: string;
  localReplicaId: string;
  deviceLabel?: string;
  platform?: "web" | "pwa" | "desktop" | "mobile" | "unknown";
  now?: string;
}

/**
 * Creates privacy-preserving, local-only defaults. Optional remote capabilities
 * remain unevaluated or unavailable until a real adapter reports otherwise.
 */
export function createLocalPlatformFoundation(
  options: LocalPlatformFoundationOptions,
): PlatformFoundation {
  const now = options.now ?? new Date().toISOString();
  const localRecordImplementation = "poietek.canonical-project-extension.v1";
  const notConfigured = (capabilityId: string) =>
    requiresConfigurationCapability(
      capabilityId,
      "No provider or native adapter has been configured for this capability.",
    );
  const notMeasured = (capabilityId: string) =>
    notEvaluatedCapability(
      capabilityId,
      "Runtime support has not been probed on this device.",
    );

  return {
    schemaVersion: PLATFORM_FOUNDATION_SCHEMA_VERSION,
    projectId: options.projectId,
    revision: 0,
    createdAt: now,
    updatedAt: now,
    collaboration: {
      localChangeLogCapability: availableCapability(
        "collaboration.local_change_log",
        localRecordImplementation,
        now,
      ),
      remoteSyncCapability: notConfigured("collaboration.remote_sync"),
      teamId: null,
      members: [
        {
          actorId: options.localActorId,
          displayName: "Local owner",
          role: "owner",
          externalMembership: externalNotSubmittedStatus(),
        },
      ],
      replicas: [
        {
          replicaId: options.localReplicaId,
          actorId: options.localActorId,
          deviceLabel: options.deviceLabel ?? "This device",
          platform: options.platform ?? "unknown",
          lastLocalRevision: 0,
          lastSeenAt: now,
          remoteCursor: null,
        },
      ],
      changes: [],
      conflicts: [],
    },
    rights: {
      localRecordsCapability: availableCapability(
        "rights.local_records",
        localRecordImplementation,
        now,
      ),
      externalRegistrationCapability: notConfigured(
        "rights.external_registration",
      ),
      contributorPassports: [],
      splitProposals: [],
      agreements: [],
      registrations: [],
    },
    provenance: {
      localHashingCapability: notMeasured("provenance.local_hashing"),
      signatureCapability: notConfigured("provenance.digital_signature"),
      timestampAuthorityCapability: notConfigured(
        "provenance.timestamp_authority",
      ),
      blockchainCapability: unavailableCapability(
        "provenance.blockchain_anchor",
        "USER_DISABLED",
        "Optional blockchain evidence is disabled.",
      ),
      blockchainEnabled: false,
      evidence: [],
    },
    commerce: {
      publishingCapability: notConfigured("commerce.store_publishing"),
      paymentCapability: notConfigured("commerce.payment"),
      fulfillmentCapability: notConfigured("commerce.fulfillment"),
      listings: [],
      orders: [],
    },
    privacy: {
      analytics: "disabled",
      crashReports: "disabled",
      remoteAiDataUse: "disabled",
      providerModelTraining: "denied",
      publicProfile: "disabled",
      consentReceipts: [],
      security: {
        encryptedStorageCapability: notMeasured("security.encrypted_storage"),
        credentialVaultCapability: notMeasured("security.credential_vault"),
        auditLogCapability: availableCapability(
          "security.local_audit_log_contract",
          localRecordImplementation,
          now,
        ),
        lastSecurityReviewAt: null,
      },
      dataRequests: [],
    },
    learning: {
      enabled: false,
      assistantCapability: unavailableCapability(
        "learning.assistant",
        "USER_DISABLED",
        "The learning assistant is disabled by default.",
      ),
      allowedContextScopes: [],
      suggestions: [],
    },
    interoperability: {
      formats: [],
      externalSystems: [],
    },
    plugins: {
      scanningCapability: notMeasured("plugins.scanning"),
      sandboxCapability: notMeasured("plugins.sandbox"),
      instances: [],
    },
    videoVfx: {
      decodeCapability: notMeasured("video.decode"),
      timelineCapability: notMeasured("video.timeline"),
      renderCapability: notMeasured("video.render"),
      gpuCapability: notMeasured("video.gpu_acceleration"),
      jobs: [],
    },
    ai: {
      inferenceCapability: notConfigured("ai.inference"),
      mediaGenerationCapability: notConfigured("ai.media_generation"),
      remoteProcessingDefault: "disabled",
      projectChangesRequirePreview: true,
      projectChangesRequireUndoableCommand: true,
      actions: [],
    },
    extensions: {},
  };
}

export interface LocalChangeOptions {
  id: string;
  projectId: string;
  actorId: string;
  replicaId: string;
  baseRevision: number;
  createdAt: string;
  commandType: string;
  payload?: JsonObject;
  requestRemoteDelivery?: boolean;
}

/**
 * Records local success independently of any remote provider. A caller may queue
 * remote delivery, but this helper never reports remote acknowledgement.
 */
export function createLocalCommittedChange(
  options: LocalChangeOptions,
): CollaborationChangeEnvelope {
  if (!Number.isSafeInteger(options.baseRevision) || options.baseRevision < 0) {
    throw new Error("baseRevision must be a non-negative safe integer.");
  }

  return {
    id: options.id,
    projectId: options.projectId,
    actorId: options.actorId,
    replicaId: options.replicaId,
    baseRevision: options.baseRevision,
    nextRevision: options.baseRevision + 1,
    createdAt: options.createdAt,
    commandType: options.commandType,
    payload: options.payload ?? {},
    localCommit: {
      status: "committed",
      committedAt: options.createdAt,
    },
    remoteDelivery: {
      state: options.requestRemoteDelivery ? "pending" : "not_requested",
      externalReference: null,
      observedAt: null,
    },
  };
}
