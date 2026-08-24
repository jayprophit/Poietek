/**
 * Serializable, provider-neutral contracts for Poietek's wider platform.
 *
 * These records describe intent and observed external state. They do not perform
 * network calls, grant rights, settle payments, anchor a chain transaction, load
 * a plug-in, render media, or run an AI model.
 */

export const PLATFORM_FOUNDATION_SCHEMA_VERSION = "1.0.0" as const;
export const PLATFORM_FOUNDATION_EXTENSION_KEY =
  "org.poietek.platform-foundation" as const;

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export type CapabilityState =
  | "available"
  | "degraded"
  | "unavailable"
  | "not_evaluated"
  | "requires_configuration"
  | "requires_consent";

/** A serializable observation, never a promise that an operation will succeed. */
export interface CapabilityReport {
  capabilityId: string;
  state: CapabilityState;
  source: "local" | "native" | "provider" | "hardware" | "unknown";
  implementationId: string | null;
  observedAt: string | null;
  reasonCode: string | null;
  message: string | null;
  retryable: boolean;
  requiredConsentScope: string | null;
  metadata: JsonObject;
}

export type ExternalWorkflowState =
  | "not_submitted"
  | "queued"
  | "submitted"
  | "received"
  | "accepted"
  | "rejected"
  | "withdrawn"
  | "unknown";

/**
 * State reported by an outside party. `accepted` is only valid with an
 * authoritative source, reference and observation timestamp.
 */
export interface ExternalWorkflowStatus {
  state: ExternalWorkflowState;
  authorityId: string | null;
  externalReference: string | null;
  submittedAt: string | null;
  observedAt: string | null;
  message: string | null;
  rawStatus: string | null;
}

export interface CollaborationChangeEnvelope {
  id: string;
  projectId: string;
  actorId: string;
  replicaId: string;
  baseRevision: number;
  nextRevision: number;
  createdAt: string;
  commandType: string;
  payload: JsonObject;
  localCommit: {
    status: "committed";
    committedAt: string;
  };
  remoteDelivery:
    | { state: "not_requested" | "pending"; externalReference: null; observedAt: null }
    | {
        state: "acknowledged" | "rejected";
        externalReference: string;
        observedAt: string;
      };
}

export interface CollaborationMember {
  actorId: string;
  displayName: string;
  role: "owner" | "editor" | "commenter" | "viewer";
  externalMembership: ExternalWorkflowStatus;
}

export interface CollaborationReplica {
  replicaId: string;
  actorId: string;
  deviceLabel: string;
  platform: "web" | "pwa" | "desktop" | "mobile" | "unknown";
  lastLocalRevision: number;
  lastSeenAt: string;
  remoteCursor: string | null;
}

export interface CollaborationFoundation {
  localChangeLogCapability: CapabilityReport;
  remoteSyncCapability: CapabilityReport;
  teamId: string | null;
  members: CollaborationMember[];
  replicas: CollaborationReplica[];
  changes: CollaborationChangeEnvelope[];
  conflicts: Array<{
    id: string;
    changeIds: string[];
    status: "unresolved" | "resolved_locally" | "resolved_remotely";
    resolutionChangeId: string | null;
  }>;
}

export type IdentityVerification =
  | { state: "self_asserted" | "unverified"; authorityId: null; reference: null; observedAt: null }
  | {
      state: "verified" | "rejected" | "expired";
      authorityId: string;
      reference: string;
      observedAt: string;
    };

export interface ContributorIdentityClaim {
  scheme:
    | "ipi"
    | "isni"
    | "orcid"
    | "publisher"
    | "collecting_society"
    | "wallet"
    | "custom";
  value: string;
  verification: IdentityVerification;
}

export interface ContributorPassport {
  id: string;
  displayName: string;
  legalName: string | null;
  roles: string[];
  identityClaims: ContributorIdentityClaim[];
  createdAt: string;
  updatedAt: string;
  privateFieldsRef: string | null;
}

export type RightsAcceptance =
  | {
      state: "not_requested" | "pending";
      authorityId: null;
      externalReference: null;
      observedAt: null;
    }
  | {
      state: "accepted" | "declined" | "revoked";
      authorityId: string;
      externalReference: string;
      observedAt: string;
    };

export interface SplitShare {
  contributorId: string;
  basisPoints: number;
  role: string;
  acceptance: RightsAcceptance;
}

export interface SplitProposal {
  id: string;
  workId: string;
  version: number;
  status: "draft" | "proposed" | "fully_accepted" | "disputed" | "superseded";
  shares: SplitShare[];
  createdAt: string;
  updatedAt: string;
  supersedesId: string | null;
}

export interface RightsAgreement {
  id: string;
  agreementType:
    | "song_split"
    | "master_ownership"
    | "session_release"
    | "sample_clearance"
    | "license"
    | "custom";
  version: number;
  documentAssetId: string | null;
  participantAcceptances: Array<{
    contributorId: string;
    acceptance: RightsAcceptance;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface RegistrationSubmission {
  id: string;
  workId: string;
  registrationType:
    | "copyright"
    | "performing_rights"
    | "mechanical_rights"
    | "neighbouring_rights"
    | "identifier"
    | "custom";
  providerId: string | null;
  payloadSnapshot: JsonObject;
  localStatus: "draft" | "queued" | "sent_to_adapter";
  externalStatus: ExternalWorkflowStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RightsFoundation {
  localRecordsCapability: CapabilityReport;
  externalRegistrationCapability: CapabilityReport;
  contributorPassports: ContributorPassport[];
  splitProposals: SplitProposal[];
  agreements: RightsAgreement[];
  registrations: RegistrationSubmission[];
}

export type ProvenanceEvidence =
  | {
      id: string;
      kind: "local_hash" | "digital_signature" | "timestamp_authority";
      subjectId: string;
      digestAlgorithm: string;
      digest: string;
      createdAt: string;
      authorityId: string | null;
      externalReference: string | null;
      legalEffect: "evidence_only_not_rights_determination";
      metadata: JsonObject;
    }
  | {
      id: string;
      kind: "blockchain_anchor";
      subjectId: string;
      digestAlgorithm: string;
      digest: string;
      createdAt: string;
      authorityId: string | null;
      externalReference: string | null;
      legalEffect: "evidence_only_not_rights_determination";
      metadata: JsonObject;
      anchor:
        | {
            state: "not_requested" | "pending" | "failed" | "unknown";
            network: string | null;
            transactionId: string | null;
            blockReference: string | null;
            observedAt: string | null;
          }
        | {
            state: "anchored";
            network: string;
            transactionId: string;
            blockReference: string;
            observedAt: string;
          };
    };

export interface ProvenanceFoundation {
  localHashingCapability: CapabilityReport;
  signatureCapability: CapabilityReport;
  timestampAuthorityCapability: CapabilityReport;
  blockchainCapability: CapabilityReport;
  blockchainEnabled: boolean;
  evidence: ProvenanceEvidence[];
}

export interface MoneyAmount {
  currency: string;
  minorUnits: string;
}

export interface StoreListing {
  id: string;
  assetOrReleaseId: string;
  title: string;
  status: "draft" | "queued" | "published" | "suspended" | "retired";
  price: MoneyAmount;
  licenseTermsAssetId: string | null;
  externalStatus: ExternalWorkflowStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CommerceOrder {
  id: string;
  listingId: string;
  purchaserReference: string | null;
  amount: MoneyAmount;
  localStatus: "draft" | "pending_provider" | "fulfilled" | "cancelled";
  paymentStatus: ExternalWorkflowStatus;
  fulfillmentReference: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CommerceFoundation {
  publishingCapability: CapabilityReport;
  paymentCapability: CapabilityReport;
  fulfillmentCapability: CapabilityReport;
  listings: StoreListing[];
  orders: CommerceOrder[];
}

export type ConsentDecision = "not_asked" | "granted" | "denied" | "withdrawn";

export interface ConsentReceipt {
  id: string;
  actorId: string;
  scope: string;
  policyVersion: string;
  decision: ConsentDecision;
  recordedAt: string;
  withdrawnAt: string | null;
  source: "local_user_action" | "provider_report" | "imported_record";
  externalReference: string | null;
}

export interface PrivacyFoundation {
  analytics: "disabled" | "local_only" | "consented_provider";
  crashReports: "disabled" | "local_only" | "consented_provider";
  remoteAiDataUse: "disabled" | "per_request_consent" | "consented_provider";
  providerModelTraining: "denied" | "provider_policy_only" | "explicitly_consented";
  publicProfile: "disabled" | "selected_fields";
  consentReceipts: ConsentReceipt[];
  security: {
    encryptedStorageCapability: CapabilityReport;
    credentialVaultCapability: CapabilityReport;
    auditLogCapability: CapabilityReport;
    lastSecurityReviewAt: string | null;
  };
  dataRequests: Array<{
    id: string;
    type: "export" | "delete" | "correct";
    createdAt: string;
    localStatus: "requested" | "prepared_locally" | "cancelled";
    externalStatus: ExternalWorkflowStatus;
  }>;
}

export interface LearningSuggestion {
  id: string;
  createdAt: string;
  topic: string;
  explanation: string;
  evidenceRefs: string[];
  actionProposal: JsonObject | null;
  status: "suggested" | "dismissed" | "accepted_for_preview" | "applied";
  previewDigest: string | null;
  appliedCommandId: string | null;
  appliedAt: string | null;
}

export interface LearningFoundation {
  enabled: boolean;
  assistantCapability: CapabilityReport;
  allowedContextScopes: string[];
  suggestions: LearningSuggestion[];
}

export type InterchangeSupport =
  | "unavailable"
  | "metadata_only"
  | "lossy"
  | "lossless"
  | "native";

export interface InterchangeFormatCapability {
  formatId: string;
  direction: "import" | "export" | "round_trip";
  support: InterchangeSupport;
  implementationId: string | null;
  limitations: string[];
  preserves: string[];
}

export interface ExternalSystemLink {
  id: string;
  systemId: string;
  externalProjectReference: string | null;
  capability: CapabilityReport;
  lastExchangeAt: string | null;
  lastExchangeDigest: string | null;
}

export interface InteroperabilityFoundation {
  formats: InterchangeFormatCapability[];
  externalSystems: ExternalSystemLink[];
}

export interface PluginInstanceRecord {
  instanceId: string;
  pluginId: string;
  pluginFormat: "vst2" | "vst3" | "au" | "aax" | "clap" | "web_audio" | "native" | "unknown";
  version: string | null;
  support: "available" | "missing" | "unavailable" | "render_only" | "quarantined";
  hostCapability: CapabilityReport;
  serializedState: JsonValue;
  frozenRenderAssetId: string | null;
  reason: string | null;
}

export interface PluginFoundation {
  scanningCapability: CapabilityReport;
  sandboxCapability: CapabilityReport;
  instances: PluginInstanceRecord[];
}

export interface MediaRenderJob {
  id: string;
  mediaType: "video" | "vfx" | "animation" | "image_sequence";
  status: "draft" | "queued" | "running" | "completed" | "failed" | "cancelled";
  capability: CapabilityReport;
  sourceAssetIds: string[];
  settings: JsonObject;
  outputAssetId: string | null;
  progress: number | null;
  errorCode: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VideoVfxFoundation {
  decodeCapability: CapabilityReport;
  timelineCapability: CapabilityReport;
  renderCapability: CapabilityReport;
  gpuCapability: CapabilityReport;
  jobs: MediaRenderJob[];
}

export interface AiActionProposal {
  id: string;
  createdAt: string;
  providerId: string | null;
  modelId: string | null;
  purpose: string;
  inputAssetIds: string[];
  contextScopes: string[];
  outputPreviewAssetIds: string[];
  status: "draft" | "preview_ready" | "rejected" | "accepted" | "applied" | "failed";
  previewDigest: string | null;
  userAcceptedAt: string | null;
  appliedCommandId: string | null;
  appliedAt: string | null;
  provenanceEvidenceIds: string[];
  errorCode: string | null;
}

export interface AiFoundation {
  inferenceCapability: CapabilityReport;
  mediaGenerationCapability: CapabilityReport;
  remoteProcessingDefault: "disabled" | "per_request_consent";
  projectChangesRequirePreview: true;
  projectChangesRequireUndoableCommand: true;
  actions: AiActionProposal[];
}

export interface PlatformFoundation {
  schemaVersion: typeof PLATFORM_FOUNDATION_SCHEMA_VERSION;
  projectId: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
  collaboration: CollaborationFoundation;
  rights: RightsFoundation;
  provenance: ProvenanceFoundation;
  commerce: CommerceFoundation;
  privacy: PrivacyFoundation;
  learning: LearningFoundation;
  interoperability: InteroperabilityFoundation;
  plugins: PluginFoundation;
  videoVfx: VideoVfxFoundation;
  ai: AiFoundation;
  extensions: Record<string, JsonValue>;
}
