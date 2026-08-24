"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUnifiedProductionSuite = validateUnifiedProductionSuite;
const contracts_1 = require("./contracts");
const usable = (capability) => capability.state === 'available' || capability.state === 'degraded';
const acceptedExternal = (status) => status.state === 'accepted' &&
    Boolean(status.authorityId && status.externalReference && status.observedAt);
function validateUnifiedProductionSuite(suite) {
    const issues = [];
    const add = (code, path, message) => issues.push({ code, path, message });
    if (suite.schemaVersion !== contracts_1.UNIFIED_PRODUCTION_SCHEMA_VERSION) {
        add('UNSUPPORTED_VERSION', 'schemaVersion', 'Unknown unified suite version.');
    }
    if (!suite.projectId)
        add('PROJECT_REQUIRED', 'projectId', 'Project id is required.');
    if (!suite.orchestration.canonicalProjectIsSourceOfTruth) {
        add('CANONICAL_PROJECT_REQUIRED', 'orchestration', 'One canonical project must remain the source of truth.');
    }
    if (suite.ownership.userContentOwnership !==
        'creator_or_agreed_rightsholders' ||
        suite.ownership.poietekOwnership !== 'software_brand_and_service_ip_only' ||
        !suite.ownership.noAutomaticTransfer) {
        add('OWNERSHIP_POLICY_INVALID', 'ownership', 'User productions cannot transfer to Poietek automatically.');
    }
    if (suite.ownership.serviceLicence.exclusive ||
        suite.ownership.serviceLicence.ownershipTransfer) {
        add('SERVICE_LICENCE_TOO_BROAD', 'ownership.serviceLicence', 'The platform service licence must remain non-exclusive and cannot transfer ownership.');
    }
    if (suite.ownership.serviceLicence.status === 'accepted' &&
        (!suite.ownership.serviceLicence.acceptanceReceiptId ||
            !suite.ownership.serviceLicence.acceptedAt)) {
        add('LICENCE_ACCEPTANCE_UNPROVEN', 'ownership.serviceLicence', 'An accepted service licence requires a versioned user receipt and time.');
    }
    suite.ownership.works.forEach((work, index) => {
        if (work.poietekOwnershipClaim)
            add('PLATFORM_OWNERSHIP_FORBIDDEN', `ownership.works[${index}]`, 'A user work cannot carry a Poietek ownership claim.');
        if (work.ownerContributorIds.length === 0)
            add('WORK_OWNER_REQUIRED', `ownership.works[${index}].ownerContributorIds`, 'At least one asserted or documented rightsholder is required.');
    });
    if (suite.timeline.masterClock.sampleRate <= 0) {
        add('SAMPLE_RATE_INVALID', 'timeline.masterClock.sampleRate', 'Sample rate must be positive.');
    }
    suite.timeline.syncAnchors.forEach((anchor, index) => {
        if (anchor.projectTick < 0 || anchor.projectSeconds < 0 || anchor.videoFrame < 0)
            add('SYNC_ANCHOR_INVALID', `timeline.syncAnchors[${index}]`, 'Score, time and frame anchors cannot be negative.');
    });
    suite.television.sessions.forEach((session, index) => {
        const path = `television.sessions[${index}]`;
        if (session.status === 'live') {
            if (!usable(suite.television.ingestCapability) || !usable(suite.television.deliveryCapability))
                add('LIVE_CAPABILITY_UNPROVEN', path, 'A session cannot be live without observed ingest and delivery capabilities.');
            if (!session.externalSessionReference || !session.startedAt)
                add('LIVE_SESSION_EVIDENCE_REQUIRED', path, 'A live session requires an external reference and start time.');
            if (!session.moderationPolicyVersion || !usable(suite.television.moderationCapability))
                add('LIVE_MODERATION_REQUIRED', path, 'Public live interaction requires an effective moderation policy and capability.');
        }
        if (session.interactions.donations && !usable(suite.television.donationCapability))
            add('DONATION_CAPABILITY_UNPROVEN', `${path}.interactions.donations`, 'Donations require a configured payment/support adapter.');
        if (session.interactions.shop && !usable(suite.television.liveCommerceCapability))
            add('LIVE_COMMERCE_UNPROVEN', `${path}.interactions.shop`, 'Live shopping requires a configured commerce adapter.');
        if (session.viewerCount.value !== null && session.viewerCount.source !== 'provider_report')
            add('VIEWER_COUNT_UNPROVEN', `${path}.viewerCount`, 'Viewer counts require provider observation.');
    });
    if (suite.community.topology !== 'local_private' &&
        suite.community.topology === 'centralized' &&
        !usable(suite.community.centralizedServiceCapability))
        add('CENTRAL_SERVICE_UNPROVEN', 'community.topology', 'Centralized community mode requires a configured service.');
    if (suite.community.topology === 'federated' && !usable(suite.community.federationCapability))
        add('FEDERATION_UNPROVEN', 'community.topology', 'Federation requires an observed adapter.');
    if (suite.community.topology === 'peer_to_peer' && !usable(suite.community.peerToPeerCapability))
        add('P2P_UNPROVEN', 'community.topology', 'Peer-to-peer mode requires an observed adapter.');
    if (usable(suite.community.endToEndEncryptionCapability) && (!suite.community.endToEndEncryptionCapability.implementationId || !suite.community.endToEndEncryptionCapability.observedAt))
        add('ENCRYPTION_CLAIM_UNPROVEN', 'community.endToEndEncryptionCapability', 'Encryption cannot be presented as available without an implementation and observation.');
    const commission = suite.marketplace.commissionPolicy;
    if (commission.status === 'approved') {
        if (!Number.isInteger(commission.rateBasisPoints) || commission.rateBasisPoints === null || commission.rateBasisPoints < 0 || commission.rateBasisPoints > 10_000)
            add('COMMISSION_RATE_INVALID', 'marketplace.commissionPolicy.rateBasisPoints', 'An approved commission must be an explicit basis-point rate from zero to 100%.');
        if (!commission.feeDisclosureAssetId || !commission.approvedByAuthorityId || !commission.approvedAt)
            add('COMMISSION_APPROVAL_UNPROVEN', 'marketplace.commissionPolicy', 'Approved fees require disclosure and owner approval evidence.');
    }
    else if (commission.rateBasisPoints !== null) {
        add('DRAFT_COMMISSION_MUST_BE_UNSET', 'marketplace.commissionPolicy.rateBasisPoints', 'A draft commission cannot be treated as a decided rate.');
    }
    suite.marketplace.listings.forEach((listing, index) => {
        if (listing.status === 'published') {
            if (!acceptedExternal(listing.sellerVerification))
                add('SELLER_VERIFICATION_REQUIRED', `marketplace.listings[${index}].sellerVerification`, 'A published seller requires authoritative verification.');
            if (!acceptedExternal(listing.publicationStatus))
                add('LISTING_PUBLICATION_UNPROVEN', `marketplace.listings[${index}].publicationStatus`, 'A published listing requires provider acknowledgement.');
            if (!listing.licenceTermsAssetId)
                add('LISTING_LICENCE_REQUIRED', `marketplace.listings[${index}].licenceTermsAssetId`, 'A published digital listing requires durable licence terms.');
        }
    });
    suite.governance.policies.forEach((policy, index) => {
        if (policy.status === 'effective' && (!policy.documentAssetId || !policy.approvedByAuthorityId || !policy.approvedAt || !policy.effectiveAt))
            add('EFFECTIVE_POLICY_UNPROVEN', `governance.policies[${index}]`, 'An effective policy requires a durable document, authority approval and effective time.');
    });
    return issues;
}
