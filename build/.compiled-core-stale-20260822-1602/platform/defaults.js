"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.availableCapability = availableCapability;
exports.unavailableCapability = unavailableCapability;
exports.notEvaluatedCapability = notEvaluatedCapability;
exports.requiresConfigurationCapability = requiresConfigurationCapability;
exports.requiresConsentCapability = requiresConsentCapability;
exports.isCapabilityUsable = isCapabilityUsable;
exports.externalNotSubmittedStatus = externalNotSubmittedStatus;
exports.createLocalPlatformFoundation = createLocalPlatformFoundation;
exports.createLocalCommittedChange = createLocalCommittedChange;
const contracts_1 = require("./contracts");
function capabilityBase(capabilityId) {
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
function availableCapability(capabilityId, implementationId, observedAt, source = "local", metadata = {}) {
    return {
        ...capabilityBase(capabilityId),
        state: "available",
        source,
        implementationId,
        observedAt,
        metadata,
    };
}
function unavailableCapability(capabilityId, reasonCode, message, retryable = false) {
    return {
        ...capabilityBase(capabilityId),
        state: "unavailable",
        reasonCode,
        message,
        retryable,
    };
}
function notEvaluatedCapability(capabilityId, message) {
    return {
        ...capabilityBase(capabilityId),
        message,
    };
}
function requiresConfigurationCapability(capabilityId, message) {
    return {
        ...capabilityBase(capabilityId),
        state: "requires_configuration",
        reasonCode: "CONFIGURATION_REQUIRED",
        message,
    };
}
function requiresConsentCapability(capabilityId, consentScope, message) {
    return {
        ...capabilityBase(capabilityId),
        state: "requires_consent",
        reasonCode: "CONSENT_REQUIRED",
        message,
        requiredConsentScope: consentScope,
    };
}
function isCapabilityUsable(report) {
    return report.state === "available" || report.state === "degraded";
}
function externalNotSubmittedStatus() {
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
/**
 * Creates privacy-preserving, local-only defaults. Optional remote capabilities
 * remain unevaluated or unavailable until a real adapter reports otherwise.
 */
function createLocalPlatformFoundation(options) {
    const now = options.now ?? new Date().toISOString();
    const localRecordImplementation = "poietek.canonical-project-extension.v1";
    const notConfigured = (capabilityId) => requiresConfigurationCapability(capabilityId, "No provider or native adapter has been configured for this capability.");
    const notMeasured = (capabilityId) => notEvaluatedCapability(capabilityId, "Runtime support has not been probed on this device.");
    return {
        schemaVersion: contracts_1.PLATFORM_FOUNDATION_SCHEMA_VERSION,
        projectId: options.projectId,
        revision: 0,
        createdAt: now,
        updatedAt: now,
        collaboration: {
            localChangeLogCapability: availableCapability("collaboration.local_change_log", localRecordImplementation, now),
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
            localRecordsCapability: availableCapability("rights.local_records", localRecordImplementation, now),
            externalRegistrationCapability: notConfigured("rights.external_registration"),
            contributorPassports: [],
            splitProposals: [],
            agreements: [],
            registrations: [],
        },
        provenance: {
            localHashingCapability: notMeasured("provenance.local_hashing"),
            signatureCapability: notConfigured("provenance.digital_signature"),
            timestampAuthorityCapability: notConfigured("provenance.timestamp_authority"),
            blockchainCapability: unavailableCapability("provenance.blockchain_anchor", "USER_DISABLED", "Optional blockchain evidence is disabled."),
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
                auditLogCapability: availableCapability("security.local_audit_log_contract", localRecordImplementation, now),
                lastSecurityReviewAt: null,
            },
            dataRequests: [],
        },
        learning: {
            enabled: false,
            assistantCapability: unavailableCapability("learning.assistant", "USER_DISABLED", "The learning assistant is disabled by default."),
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
/**
 * Records local success independently of any remote provider. A caller may queue
 * remote delivery, but this helper never reports remote acknowledgement.
 */
function createLocalCommittedChange(options) {
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
