import type { TimePreservingPitchRequest } from "../player/TimePreservingPitchBackend";
import type {
  CapabilityReport,
  ExternalWorkflowStatus,
  MoneyAmount,
} from "../platform/contracts";
import type {
  DestinationProfile,
  ReadinessCheck,
  ReleaseMeasurements,
  ReleaseReadinessResult,
} from "../release/ReleaseReadinessEngine";

export const COMMUNITY_FOUNDATION_SCHEMA_VERSION = "1.0.0" as const;

export type CommunityVisibility =
  | "private"
  | "unlisted"
  | "circle"
  | "public";

export type ModerationDecision =
  | {
      state: "not_requested" | "pending";
      authorityId: null;
      externalReference: null;
      observedAt: null;
      reasonCode: null;
    }
  | {
      state: "approved" | "restricted" | "rejected";
      authorityId: string;
      externalReference: string;
      observedAt: string;
      reasonCode: string | null;
    };

/** A claim with evidence, not a global truth or an invented reputation score. */
export interface CommunityTrustStatement {
  id: string;
  subjectId: string;
  kind:
    | "creator_attestation"
    | "moderator_decision"
    | "content_digest"
    | "license_evidence"
    | "community_note";
  statement: string;
  issuerId: string;
  evidenceReference: string | null;
  createdAt: string;
  expiresAt: string | null;
  visibility: CommunityVisibility;
}

export interface TuningIdentity {
  referenceNote: string;
  referenceHz: number;
  temperament: string;
  profileId: string;
}

export interface OriginalCommunityRendition {
  id: string;
  kind: "creator_original";
  assetId: string;
  mediaType: "audio" | "video";
  tuning: TuningIdentity;
  durationSeconds: number;
  contentDigest: string;
  createdAt: string;
  derivedFromRenditionId: null;
  generation: null;
}

/**
 * A separate output. Its existence never changes the creator-original asset or
 * the tuning metadata attached to that original.
 */
export interface TimePreservingDerivativeRendition {
  id: string;
  kind: "time_preserving_derivative";
  assetId: string;
  mediaType: "audio" | "video";
  tuning: TuningIdentity;
  durationSeconds: number;
  contentDigest: string;
  createdAt: string;
  derivedFromRenditionId: string;
  generation: {
    requestId: string;
    backendId: string;
    pitchShiftCents: number;
    preserveTempo: true;
    preserveDuration: true;
    renderedAt: string;
  };
}

export type CommunityRendition =
  | OriginalCommunityRendition
  | TimePreservingDerivativeRendition;

export type DerivativePlaybackState =
  | "draft"
  | "backend_unavailable"
  | "session_open"
  | "rendering"
  | "ready"
  | "failed";

/**
 * The request deliberately has no playback-rate field. A real time-preserving
 * DSP backend or a verified pre-rendered rendition is required.
 */
export interface DerivativePlaybackRequestRecord {
  id: string;
  originalRenditionId: string;
  request: TimePreservingPitchRequest;
  state: DerivativePlaybackState;
  backendCapability: CapabilityReport;
  backendId: string | null;
  sessionId: string | null;
  outputRenditionId: string | null;
  createdAt: string;
  updatedAt: string;
  errorCode: string | null;
  message: string | null;
}

export interface CommunityCatalogItem {
  id: string;
  releaseId: string;
  title: string;
  creatorIds: string[];
  originalRenditionId: string;
  renditions: CommunityRendition[];
  derivativeRequests: DerivativePlaybackRequestRecord[];
  visibility: CommunityVisibility;
  circleIds: string[];
  publicationState:
    | "draft"
    | "published_locally"
    | "published_remotely"
    | "withdrawn";
  moderation: ModerationDecision;
  trustStatements: CommunityTrustStatement[];
  tags: string[];
  localRevision: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityFeedEntry {
  id: string;
  catalogItemId: string;
  actorId: string;
  kind: "publish" | "repost" | "recommend" | "update";
  message: string | null;
  visibility: CommunityVisibility;
  circleIds: string[];
  moderation: ModerationDecision;
  createdAt: string;
  localRevision: number;
  remoteDelivery: ExternalWorkflowStatus;
}

export interface FederationEndpoint {
  id: string;
  protocolId: string;
  endpointUrl: string | null;
  direction: "publish" | "subscribe" | "bidirectional";
  capability: CapabilityReport;
  trustPolicy: "manual" | "allow_list" | "provider_moderated";
  lastSyncAt: string | null;
  remoteCursor: string | null;
}

export interface CommunityStoreListing {
  id: string;
  catalogItemId: string;
  title: string;
  status: "draft" | "queued" | "published" | "suspended" | "retired";
  price: MoneyAmount;
  licenseId: string;
  licenseTermsAssetId: string;
  publicationStatus: ExternalWorkflowStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityLicenseEvidence {
  id: string;
  licenseId: string;
  licenseTermsAssetId: string;
  licenseeReference: string;
  evidenceDigest: string;
  issuedAt: string;
  issuerId: string;
  externalReference: string;
  legalEffect: "license_evidence_only_not_ownership_determination";
}

export interface CommunityPurchaseRecord {
  id: string;
  listingId: string;
  purchaserReference: string | null;
  amount: MoneyAmount;
  localStatus: "draft" | "pending_provider" | "confirmed" | "cancelled";
  paymentStatus: ExternalWorkflowStatus;
  licenseEvidence: CommunityLicenseEvidence | null;
  createdAt: string;
  updatedAt: string;
}

export interface OfflineCachePolicy {
  mode: "metadata_only" | "selected_media" | "manual";
  maximumBytes: number;
  eviction: "least_recently_used" | "manual";
  autoCacheVisibility: CommunityVisibility[];
  encryptedStorageCapability: CapabilityReport;
}

export interface CommunityCacheEntry {
  catalogItemId: string;
  renditionId: string;
  state: "queued" | "cached" | "missing" | "evicted" | "failed";
  byteLength: number | null;
  contentDigest: string | null;
  cachedAt: string | null;
  lastAccessedAt: string | null;
  errorCode: string | null;
}

export interface LocalCommunityHub {
  schemaVersion: typeof COMMUNITY_FOUNDATION_SCHEMA_VERSION;
  hubId: string;
  actorId: string;
  revision: number;
  catalog: CommunityCatalogItem[];
  feed: CommunityFeedEntry[];
  federationEndpoints: FederationEndpoint[];
  store: {
    publishingCapability: CapabilityReport;
    paymentCapability: CapabilityReport;
    listings: CommunityStoreListing[];
    purchases: CommunityPurchaseRecord[];
  };
  offline: {
    policy: OfflineCachePolicy;
    entries: CommunityCacheEntry[];
  };
  createdAt: string;
  updatedAt: string;
}

export type CommunityDerivativePolicy =
  | { kind: "preserve_original_only" }
  | {
      kind: "optional_time_preserving_derivative";
      targetReferenceHz: number;
    }
  | {
      kind: "required_time_preserving_derivative";
      targetReferenceHz: number;
    };

export interface CommunityDestinationProfile {
  id: string;
  label: string;
  releaseProfile: DestinationProfile;
  allowedVisibility: CommunityVisibility[];
  moderation: "not_required" | "required_before_remote_publish";
  federation: "not_required" | "optional" | "required";
  commerce: "disabled" | "optional" | "required";
  derivativePolicy: CommunityDerivativePolicy;
}

export interface CommunityReleaseAssessment {
  profileId: string;
  ready: boolean;
  base: ReleaseReadinessResult;
  checks: ReadinessCheck[];
}

export interface CommunityReleaseAssessmentInput {
  destination: CommunityDestinationProfile;
  project: Parameters<
    typeof import("../release/ReleaseReadinessEngine").checkReleaseReadiness
  >[0]["project"];
  measurements: ReleaseMeasurements;
  catalogItem: CommunityCatalogItem;
  federationCapability?: CapabilityReport;
}

export interface CommunityValidationIssue {
  code: string;
  path: string;
  message: string;
}
