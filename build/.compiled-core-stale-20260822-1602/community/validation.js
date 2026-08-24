"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCommunityHub = validateCommunityHub;
const defaults_1 = require("../platform/defaults");
function issue(code, path, message) {
    return { code, path, message };
}
function hasText(value) {
    return typeof value === "string" && value.trim().length > 0;
}
function validTime(value) {
    return hasText(value) && Number.isFinite(Date.parse(value));
}
function validateCatalogItem(item, index) {
    const issues = [];
    const base = `catalog[${index}]`;
    const original = item.renditions.find((rendition) => rendition.id === item.originalRenditionId);
    if (!original || original.kind !== "creator_original") {
        issues.push(issue("ORIGINAL_RENDITION_REQUIRED", base, "Catalog item must reference one creator-original rendition."));
    }
    if (item.visibility === "circle" && item.circleIds.length === 0) {
        issues.push(issue("CIRCLE_ID_REQUIRED", `${base}.circleIds`, "Circle visibility requires at least one circle id."));
    }
    if (item.publicationState === "published_remotely" &&
        item.moderation.state === "pending") {
        issues.push(issue("REMOTE_PUBLICATION_UNVERIFIED", base, "Remote publication cannot be inferred while moderation is pending."));
    }
    if (item.moderation.state !== "not_requested" &&
        item.moderation.state !== "pending" &&
        (!hasText(item.moderation.authorityId) ||
            !hasText(item.moderation.externalReference) ||
            !validTime(item.moderation.observedAt))) {
        issues.push(issue("MODERATION_EVIDENCE_REQUIRED", `${base}.moderation`, "A moderation decision requires authority, reference and observation evidence."));
    }
    item.renditions.forEach((rendition, renditionIndex) => {
        if (rendition.kind !== "time_preserving_derivative")
            return;
        if (rendition.derivedFromRenditionId !== item.originalRenditionId) {
            issues.push(issue("DERIVATIVE_SOURCE_INVALID", `${base}.renditions[${renditionIndex}]`, "A compatibility rendition must derive from the creator original."));
        }
        if (original &&
            Math.abs(rendition.durationSeconds - original.durationSeconds) >= 0.001) {
            issues.push(issue("DERIVATIVE_DURATION_CHANGED", `${base}.renditions[${renditionIndex}]`, "A time-preserving derivative must retain the original duration."));
        }
        if (!hasText(rendition.generation.backendId) ||
            !hasText(rendition.generation.requestId) ||
            !validTime(rendition.generation.renderedAt)) {
            issues.push(issue("DERIVATIVE_DSP_EVIDENCE_REQUIRED", `${base}.renditions[${renditionIndex}].generation`, "A derivative requires real DSP backend and render evidence."));
        }
    });
    return issues;
}
function validateCommunityHub(hub) {
    const issues = [];
    if (!Number.isSafeInteger(hub.revision) || hub.revision < 0) {
        issues.push(issue("REVISION_INVALID", "revision", "Revision must be a non-negative safe integer."));
    }
    if (!Number.isSafeInteger(hub.offline.policy.maximumBytes) || hub.offline.policy.maximumBytes < 0) {
        issues.push(issue("CACHE_LIMIT_INVALID", "offline.policy.maximumBytes", "Cache limit must be a non-negative safe integer."));
    }
    hub.catalog.forEach((item, index) => issues.push(...validateCatalogItem(item, index)));
    const catalogIds = new Set(hub.catalog.map((item) => item.id));
    hub.feed.forEach((entry, index) => {
        if (!catalogIds.has(entry.catalogItemId)) {
            issues.push(issue("FEED_CATALOG_ITEM_MISSING", `feed[${index}]`, "Feed entry references a missing catalog item."));
        }
        if (entry.remoteDelivery.state === "accepted" &&
            (!hasText(entry.remoteDelivery.authorityId) || !hasText(entry.remoteDelivery.externalReference) || !validTime(entry.remoteDelivery.observedAt))) {
            issues.push(issue("REMOTE_DELIVERY_EVIDENCE_REQUIRED", `feed[${index}].remoteDelivery`, "Accepted remote delivery requires authority, reference and observation evidence."));
        }
    });
    hub.federationEndpoints.forEach((endpoint, index) => {
        if ((0, defaults_1.isCapabilityUsable)(endpoint.capability) && !hasText(endpoint.endpointUrl)) {
            issues.push(issue("FEDERATION_ENDPOINT_REQUIRED", `federationEndpoints[${index}]`, "A usable federation adapter requires an endpoint URL."));
        }
    });
    const listingIds = new Set(hub.store.listings.map((listing) => listing.id));
    hub.store.purchases.forEach((purchase, index) => {
        const base = `store.purchases[${index}]`;
        if (!listingIds.has(purchase.listingId)) {
            issues.push(issue("PURCHASE_LISTING_MISSING", base, "Purchase references a missing listing."));
        }
        if (purchase.localStatus === "confirmed") {
            if (purchase.paymentStatus.state !== "accepted") {
                issues.push(issue("PURCHASE_PAYMENT_EVIDENCE_REQUIRED", base, "Confirmed purchase requires accepted payment evidence."));
            }
            if (!purchase.licenseEvidence) {
                issues.push(issue("PURCHASE_LICENSE_EVIDENCE_REQUIRED", base, "Confirmed purchase requires issued license evidence."));
            }
        }
        if (purchase.licenseEvidence && purchase.licenseEvidence.legalEffect !== "license_evidence_only_not_ownership_determination") {
            issues.push(issue("LICENSE_LEGAL_EFFECT_INVALID", `${base}.licenseEvidence`, "License evidence cannot determine ownership."));
        }
    });
    return issues;
}
