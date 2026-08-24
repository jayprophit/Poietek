"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBusinessTierCatalog = validateBusinessTierCatalog;
const catalog_1 = require("./catalog");
const issue = (code, path, message) => ({ code, path, message });
const isMoney = (value) => value === null || /^\d+$/.test(value);
function validateBusinessTierCatalog(catalog = catalog_1.BUSINESS_TIER_CATALOG, governance = catalog_1.BUSINESS_TIER_GOVERNANCE) {
    const issues = [];
    const ids = new Set();
    const orders = new Set();
    if (governance.commercialStatus === "reference_template" && (governance.checkoutEnabled || governance.pricingApproved || governance.entitlementEnforcementAvailable)) {
        issues.push(issue("REFERENCE_CANNOT_BE_LIVE", "governance", "A reference template cannot enable checkout, approved pricing or entitlement enforcement."));
    }
    if (!governance.requiredReleaseGates.length || !governance.unresolvedDecisions.length) {
        issues.push(issue("GOVERNANCE_GATES_REQUIRED", "governance", "Reference pricing requires unresolved decisions and release gates."));
    }
    catalog.forEach((tier, index) => {
        const path = `tiers[${index}]`;
        if (ids.has(tier.id))
            issues.push(issue("DUPLICATE_TIER_ID", `${path}.id`, `Duplicate tier id ${tier.id}.`));
        if (orders.has(tier.order))
            issues.push(issue("DUPLICATE_TIER_ORDER", `${path}.order`, `Duplicate tier order ${tier.order}.`));
        ids.add(tier.id);
        orders.add(tier.order);
        if (!isMoney(tier.referencePrice.minimumMinorUnits) || !isMoney(tier.referencePrice.maximumMinorUnits)) {
            issues.push(issue("REFERENCE_PRICE_INVALID", `${path}.referencePrice`, "Reference money must use non-negative integer minor units."));
        }
        if (tier.referencePrice.approval !== "historical_reference_not_approved") {
            issues.push(issue("REFERENCE_PRICE_APPROVAL_INVALID", `${path}.referencePrice.approval`, "Every imported price must remain explicitly unapproved."));
        }
        if (tier.model === "free" && (tier.referencePrice.minimumMinorUnits !== "0" || tier.referencePrice.maximumMinorUnits !== "0")) {
            issues.push(issue("FREE_PRICE_INVALID", `${path}.referencePrice`, "The free tier reference price must be zero."));
        }
        if ((tier.model === "subscription" || tier.model === "per_seat_subscription") && !["month", "year"].includes(tier.referencePrice.cadence)) {
            issues.push(issue("RECURRING_CADENCE_REQUIRED", `${path}.referencePrice.cadence`, "A subscription reference requires a monthly or annual cadence."));
        }
        if (tier.model === "per_seat_subscription" && !tier.referencePrice.perSeat) {
            issues.push(issue("SEAT_PRICE_REQUIRED", `${path}.referencePrice.perSeat`, "A per-seat subscription must identify its reference as per seat."));
        }
        if (!tier.entitlements.length)
            issues.push(issue("TIER_ENTITLEMENTS_REQUIRED", `${path}.entitlements`, "Every tier requires explicit entitlements."));
        const entitlementIds = new Set();
        tier.entitlements.forEach((entitlement, entitlementIndex) => {
            const entitlementPath = `${path}.entitlements[${entitlementIndex}]`;
            if (entitlementIds.has(entitlement.id))
                issues.push(issue("DUPLICATE_ENTITLEMENT_ID", `${entitlementPath}.id`, `Duplicate entitlement ${entitlement.id} within ${tier.id}.`));
            entitlementIds.add(entitlement.id);
            if ((entitlement.state === "requires_provider" || entitlement.state === "configurable") && !entitlement.externalGates.length && !tier.externalGates.length) {
                issues.push(issue("EXTERNAL_GATE_REQUIRED", entitlementPath, "Provider or configurable entitlements require an external gate."));
            }
            if (/\bunlimited\b/i.test(`${entitlement.label} ${entitlement.notes}`) && !["subject_to_fair_use", "device_resource_limited", "configurable"].includes(entitlement.limit?.kind ?? "")) {
                issues.push(issue("UNBOUNDED_PROMISE_REJECTED", entitlementPath, "An unlimited claim requires a fair-use, device-resource or configurable boundary."));
            }
            if (entitlement.limit?.kind === "included_count" && (!Number.isInteger(entitlement.limit.quantity) || entitlement.limit.quantity < 0)) {
                issues.push(issue("ENTITLEMENT_QUANTITY_INVALID", `${entitlementPath}.limit.quantity`, "Included quantities must be non-negative integers."));
            }
        });
    });
    catalog.forEach((tier, index) => {
        if (tier.inheritsFrom && !ids.has(tier.inheritsFrom)) {
            issues.push(issue("UNKNOWN_PARENT_TIER", `tiers[${index}].inheritsFrom`, `Unknown parent tier ${tier.inheritsFrom}.`));
        }
    });
    return issues;
}
