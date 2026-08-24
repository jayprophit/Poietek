"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLocalUnifiedProductionSuite = createLocalUnifiedProductionSuite;
const platform_1 = require("../platform");
const contracts_1 = require("./contracts");
const POLICY_KINDS = [
    ['terms', 'Terms of Service'],
    ['privacy', 'Privacy Notice'],
    ['community_rules', 'Community Rules'],
    ['acceptable_use', 'Acceptable Use Policy'],
    ['content_and_copyright', 'Content, Copyright and Takedown Policy'],
    ['marketplace_buyer', 'Marketplace Buyer Terms'],
    ['marketplace_seller', 'Marketplace Seller Terms'],
    ['fees_and_payouts', 'Fees, Commission and Payout Policy'],
    ['refunds_and_disputes', 'Refunds and Disputes Policy'],
    ['moderation_and_appeals', 'Moderation and Appeals Policy'],
    ['live_streaming', 'Live Streaming Rules'],
    ['donations', 'Donations and Creator Support Policy'],
    ['ai_use', 'AI Use and Disclosure Policy'],
    ['children_and_age_assurance', 'Children and Age Assurance Policy'],
    ['accessibility', 'Accessibility Standard'],
    ['security', 'Security and Responsible Disclosure Policy'],
    ['law_enforcement_requests', 'Law Enforcement Request Policy'],
    ['governance', 'Platform Governance Charter'],
    ['transparency_reporting', 'Transparency Reporting Policy'],
];
function createLocalUnifiedProductionSuite(options) {
    const now = options.now ?? new Date().toISOString();
    const localModel = (id) => (0, platform_1.availableCapability)(id, 'poietek.unified-project-model.v1', now, 'local');
    const configure = (id) => (0, platform_1.requiresConfigurationCapability)(id, 'No reviewed production provider or operational service is configured.');
    const unavailable = (id, message) => (0, platform_1.unavailableCapability)(id, 'NOT_IMPLEMENTED', message);
    return {
        schemaVersion: contracts_1.UNIFIED_PRODUCTION_SCHEMA_VERSION,
        projectId: options.projectId,
        revision: 0,
        createdAt: now,
        updatedAt: now,
        orchestration: {
            canonicalProjectIsSourceOfTruth: true,
            platformFoundationExtensionKey: 'org.poietek.platform-foundation',
            communityExtensionKey: 'org.poietek.community',
            hardwareExtensionKey: 'org.poietek.hardware',
        },
        ownership: {
            userContentOwnership: 'creator_or_agreed_rightsholders',
            poietekOwnership: 'software_brand_and_service_ip_only',
            noAutomaticTransfer: true,
            serviceLicence: {
                status: 'draft_not_accepted',
                policyVersion: 'draft-1',
                purposes: [],
                exclusive: false,
                ownershipTransfer: false,
                acceptanceReceiptId: null,
                acceptedAt: null,
            },
            works: [],
        },
        timeline: {
            masterClock: {
                kind: 'project_seconds_with_audio_sample_and_video_frame_maps',
                sampleRate: options.sampleRate ?? 48_000,
                frameRate: options.frameRate ?? 25,
                dropFrame: false,
                startTimecode: '00:00:00:00',
            },
            score: {
                modelCapability: localModel('unified.score_model'),
                notationCapability: unavailable('unified.notation_editor', 'The notation engraving and score editor is not implemented.'),
                cues: [],
            },
            picture: {
                timelineModelCapability: localModel('unified.picture_timeline_model'),
                decodeCapability: unavailable('unified.picture_decode', 'No reviewed video decode adapter is running.'),
                renderCapability: unavailable('unified.picture_render', 'No reviewed video/VFX renderer is running.'),
                clips: [],
                captionAssetIds: [],
                vfxGraphIds: [],
            },
            syncAnchors: [],
            programmeMasterAssetId: null,
        },
        television: {
            channelModelCapability: localModel('television.channel_model'),
            ingestCapability: configure('television.live_ingest'),
            deliveryCapability: configure('television.live_delivery'),
            liveChatCapability: configure('television.live_chat'),
            moderationCapability: configure('television.live_moderation'),
            donationCapability: configure('television.donations'),
            liveCommerceCapability: configure('television.live_commerce'),
            channels: [
                {
                    id: 'local-channel',
                    ownerContributorId: options.localActorId,
                    title: 'Private creator channel',
                    visibility: 'private',
                    externalChannelReference: null,
                },
            ],
            sessions: [],
        },
        community: {
            localCommunityModelCapability: localModel('community.local_model'),
            centralizedServiceCapability: configure('community.centralized_service'),
            federationCapability: configure('community.federation'),
            peerToPeerCapability: configure('community.peer_to_peer'),
            privateMessagingCapability: configure('community.private_messaging'),
            endToEndEncryptionCapability: unavailable('community.end_to_end_encryption', 'No audited end-to-end messaging protocol is implemented.'),
            moderationCapability: configure('community.moderation'),
            topology: 'local_private',
            spaces: [],
            publishedReleaseIds: [],
        },
        marketplace: {
            localListingCapability: localModel('marketplace.local_listing_model'),
            sellerVerificationCapability: configure('marketplace.seller_verification'),
            paymentCapability: configure('marketplace.payment'),
            taxReportingCapability: configure('marketplace.tax_reporting'),
            licenceDeliveryCapability: configure('marketplace.licence_delivery'),
            refundDisputeCapability: configure('marketplace.refunds_and_disputes'),
            commissionPolicy: {
                status: 'draft_requires_owner_approval',
                policyVersion: 'draft-1',
                rateBasisPoints: null,
                feeDisclosureAssetId: null,
                approvedByAuthorityId: null,
                approvedAt: null,
            },
            listings: [],
        },
        governance: {
            jurisdictionAssessmentCapability: configure('governance.jurisdiction_assessment'),
            ageAssuranceCapability: configure('governance.age_assurance'),
            moderationOperationsCapability: configure('governance.moderation_operations'),
            appealsCapability: configure('governance.appeals'),
            dataRightsCapability: configure('governance.data_rights'),
            transparencyReportingCapability: configure('governance.transparency_reporting'),
            policies: POLICY_KINDS.map(([kind, title]) => ({
                id: `policy-${kind}`,
                kind,
                title,
                version: 'draft-1',
                status: 'draft_requires_legal_review',
                documentAssetId: null,
                approvedByAuthorityId: null,
                approvedAt: null,
                effectiveAt: null,
                supersedesPolicyId: null,
            })),
            userPolicyAcceptances: [],
        },
    };
}
