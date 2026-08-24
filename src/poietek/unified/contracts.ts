import type {CapabilityReport, ExternalWorkflowStatus} from '../platform';

export const UNIFIED_PRODUCTION_SCHEMA_VERSION = '1.0.0' as const;
export const UNIFIED_PRODUCTION_EXTENSION_KEY =
  'org.poietek.unified-production-suite' as const;

export type ProductionWorkKind =
  | 'composition'
  | 'sound_recording'
  | 'film'
  | 'episode'
  | 'broadcast'
  | 'artwork'
  | 'plugin'
  | 'sample_pack'
  | 'other';

export interface ProductionWorkRecord {
  id: string;
  title: string;
  kind: ProductionWorkKind;
  ownerContributorIds: string[];
  rightsStatus:
    | 'creator_asserted'
    | 'split_pending'
    | 'documented'
    | 'disputed';
  rightsAgreementIds: string[];
  poietekOwnershipClaim: false;
  createdAt: string;
  updatedAt: string;
}

export interface CreatorOwnershipPolicy {
  userContentOwnership: 'creator_or_agreed_rightsholders';
  poietekOwnership: 'software_brand_and_service_ip_only';
  noAutomaticTransfer: true;
  serviceLicence: {
    status: 'draft_not_accepted' | 'accepted' | 'withdrawn';
    policyVersion: string;
    purposes: Array<
      | 'store_and_process'
      | 'display_to_selected_audience'
      | 'stream_selected_release'
      | 'deliver_purchased_licence'
      | 'moderate_for_safety'
    >;
    exclusive: false;
    ownershipTransfer: false;
    acceptanceReceiptId: string | null;
    acceptedAt: string | null;
  };
  works: ProductionWorkRecord[];
}

export interface ScoreCue {
  id: string;
  title: string;
  startTick: number;
  durationTicks: number;
  targetFrame: number | null;
  notationAssetId: string | null;
  midiTrackIds: string[];
  audioTrackIds: string[];
}

export interface PictureClipReference {
  id: string;
  assetId: string;
  trackId: string;
  startFrame: number;
  durationFrames: number;
  sourceStartFrame: number;
  linkedScoreCueIds: string[];
  vfxGraphId: string | null;
}

export interface UnifiedProductionTimeline {
  masterClock: {
    kind: 'project_seconds_with_audio_sample_and_video_frame_maps';
    sampleRate: number;
    frameRate: 23.976 | 24 | 25 | 29.97 | 30 | 50 | 59.94 | 60;
    dropFrame: boolean;
    startTimecode: string;
  };
  score: {
    modelCapability: CapabilityReport;
    notationCapability: CapabilityReport;
    cues: ScoreCue[];
  };
  picture: {
    timelineModelCapability: CapabilityReport;
    decodeCapability: CapabilityReport;
    renderCapability: CapabilityReport;
    clips: PictureClipReference[];
    captionAssetIds: string[];
    vfxGraphIds: string[];
  };
  syncAnchors: Array<{
    id: string;
    projectTick: number;
    projectSeconds: number;
    videoFrame: number;
    label: string;
  }>;
  programmeMasterAssetId: string | null;
}

export interface PoietekTvSession {
  id: string;
  channelId: string;
  title: string;
  sourceProjectId: string;
  programmeMasterAssetId: string | null;
  status:
    | 'draft'
    | 'scheduled'
    | 'starting'
    | 'live'
    | 'ended'
    | 'failed'
    | 'cancelled';
  visibility: 'private' | 'unlisted' | 'followers' | 'public';
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  externalSessionReference: string | null;
  interactions: {
    comments: boolean;
    reactions: boolean;
    sharing: boolean;
    donations: boolean;
    shop: boolean;
  };
  musicRightsDeclarationId: string | null;
  moderationPolicyVersion: string | null;
  viewerCount: {
    value: number | null;
    observedAt: string | null;
    source: 'provider_report' | 'not_measured';
  };
}

export interface PoietekTvFoundation {
  channelModelCapability: CapabilityReport;
  ingestCapability: CapabilityReport;
  deliveryCapability: CapabilityReport;
  liveChatCapability: CapabilityReport;
  moderationCapability: CapabilityReport;
  donationCapability: CapabilityReport;
  liveCommerceCapability: CapabilityReport;
  channels: Array<{
    id: string;
    ownerContributorId: string;
    title: string;
    visibility: 'private' | 'unlisted' | 'followers' | 'public';
    externalChannelReference: string | null;
  }>;
  sessions: PoietekTvSession[];
}

export interface CreatorCommunityFoundation {
  localCommunityModelCapability: CapabilityReport;
  centralizedServiceCapability: CapabilityReport;
  federationCapability: CapabilityReport;
  peerToPeerCapability: CapabilityReport;
  privateMessagingCapability: CapabilityReport;
  endToEndEncryptionCapability: CapabilityReport;
  moderationCapability: CapabilityReport;
  topology: 'local_private' | 'centralized' | 'federated' | 'peer_to_peer';
  spaces: Array<{
    id: string;
    ownerContributorId: string;
    kind: 'profile' | 'channel' | 'group' | 'forum' | 'chat' | 'showcase';
    title: string;
    visibility: 'private' | 'members' | 'followers' | 'public';
    moderationPolicyVersion: string | null;
  }>;
  publishedReleaseIds: string[];
}

export type MarketplaceCategory =
  | 'plugin'
  | 'instrument'
  | 'effect'
  | 'sample'
  | 'preset'
  | 'skin'
  | 'template'
  | 'project'
  | 'music'
  | 'video'
  | 'ticket'
  | 'service'
  | 'other';

export interface MarketplaceListingRecord {
  id: string;
  sellerId: string;
  category: MarketplaceCategory;
  title: string;
  assetOrReleaseId: string;
  status: 'draft' | 'submitted' | 'published' | 'suspended' | 'retired';
  licenceType:
    | 'personal'
    | 'commercial'
    | 'royalty_free'
    | 'royalty_bearing'
    | 'subscription'
    | 'custom';
  licenceTermsAssetId: string | null;
  priceCurrency: string;
  priceMinorUnits: string;
  sellerVerification: ExternalWorkflowStatus;
  publicationStatus: ExternalWorkflowStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreatorMarketplaceFoundation {
  localListingCapability: CapabilityReport;
  sellerVerificationCapability: CapabilityReport;
  paymentCapability: CapabilityReport;
  taxReportingCapability: CapabilityReport;
  licenceDeliveryCapability: CapabilityReport;
  refundDisputeCapability: CapabilityReport;
  commissionPolicy: {
    status: 'draft_requires_owner_approval' | 'approved' | 'retired';
    policyVersion: string;
    rateBasisPoints: number | null;
    feeDisclosureAssetId: string | null;
    approvedByAuthorityId: string | null;
    approvedAt: string | null;
  };
  listings: MarketplaceListingRecord[];
}

export type GovernancePolicyKind =
  | 'terms'
  | 'privacy'
  | 'community_rules'
  | 'acceptable_use'
  | 'content_and_copyright'
  | 'marketplace_buyer'
  | 'marketplace_seller'
  | 'fees_and_payouts'
  | 'refunds_and_disputes'
  | 'moderation_and_appeals'
  | 'live_streaming'
  | 'donations'
  | 'ai_use'
  | 'children_and_age_assurance'
  | 'accessibility'
  | 'security'
  | 'law_enforcement_requests'
  | 'governance'
  | 'transparency_reporting';

export interface GovernancePolicyRecord {
  id: string;
  kind: GovernancePolicyKind;
  title: string;
  version: string;
  status: 'draft_requires_legal_review' | 'approved' | 'effective' | 'retired';
  documentAssetId: string | null;
  approvedByAuthorityId: string | null;
  approvedAt: string | null;
  effectiveAt: string | null;
  supersedesPolicyId: string | null;
}

export interface UnifiedGovernanceFoundation {
  jurisdictionAssessmentCapability: CapabilityReport;
  ageAssuranceCapability: CapabilityReport;
  moderationOperationsCapability: CapabilityReport;
  appealsCapability: CapabilityReport;
  dataRightsCapability: CapabilityReport;
  transparencyReportingCapability: CapabilityReport;
  policies: GovernancePolicyRecord[];
  userPolicyAcceptances: Array<{
    id: string;
    actorId: string;
    policyId: string;
    policyVersion: string;
    decision: 'accepted' | 'declined' | 'withdrawn';
    recordedAt: string;
    externalReference: string | null;
  }>;
}

export interface UnifiedProductionSuite {
  schemaVersion: typeof UNIFIED_PRODUCTION_SCHEMA_VERSION;
  projectId: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
  orchestration: {
    canonicalProjectIsSourceOfTruth: true;
    platformFoundationExtensionKey: 'org.poietek.platform-foundation';
    communityExtensionKey: 'org.poietek.community';
    hardwareExtensionKey: 'org.poietek.hardware';
  };
  ownership: CreatorOwnershipPolicy;
  timeline: UnifiedProductionTimeline;
  television: PoietekTvFoundation;
  community: CreatorCommunityFoundation;
  marketplace: CreatorMarketplaceFoundation;
  governance: UnifiedGovernanceFoundation;
}
