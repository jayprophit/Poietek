"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BUSINESS_TIER_CATALOG = exports.BUSINESS_TIER_GOVERNANCE = void 0;
exports.resolveTierEntitlements = resolveTierEntitlements;
exports.searchBusinessTiers = searchBusinessTiers;
exports.formatReferencePrice = formatReferencePrice;
const contracts_1 = require("./contracts");
const referencePrice = (kind, minimumMinorUnits, maximumMinorUnits, cadence, perSeat = false) => ({
    kind,
    currency: kind === "custom" ? null : "GBP",
    minimumMinorUnits,
    maximumMinorUnits,
    cadence,
    perSeat,
    approval: "historical_reference_not_approved",
    note: "Reference structure only. Price, tax treatment, billing channel and availability are not approved.",
});
const entitlement = (id, label, state, notes, limit = null, externalGates = []) => ({ id, label, state, notes, limit, externalGates });
exports.BUSINESS_TIER_GOVERNANCE = {
    schemaVersion: contracts_1.BUSINESS_TIER_SCHEMA_VERSION,
    commercialStatus: "reference_template",
    checkoutEnabled: false,
    pricingApproved: false,
    entitlementEnforcementAvailable: false,
    localProjectAccessDuringProviderFailure: "preserve_local_creation",
    purchasedItemContinuity: "subject_to_item_license_terms",
    source: {
        path: "C:\\Users\\jpowe\\.codex\\attachments\\02c0086c-2f16-4453-ae43-2933876a79dc\\pasted-text.txt",
        lineCount: 191,
        characterCount: 11454,
        sha256: "80e5a16154b05ea09271a1ce817d251225c0487e7d5cb5a2c7586545f58f45ef",
        importedAt: "2026-08-14",
    },
    unresolvedDecisions: [
        "Approve final tier names, prices, currencies, regions, taxes and billing channels.",
        "Define whether Basic, Pro and higher subscriptions inherit Creator export and content entitlements.",
        "Define fair-use, abuse, queueing and monthly cost controls before offering high-volume AI or collaboration.",
        "Select merchant-of-record, refund, cancellation, chargeback, trial, grace-period and offline-license policies.",
        "Define storage ownership, retention, deletion and portability for cloud projects and lifetime access.",
        "Obtain legal review for consumer, accessibility, privacy, tax, employment, marketplace and music-rights obligations in each launch region.",
        "Decide which payment and optional blockchain capabilities are permitted on each app store and device family.",
    ],
    requiredReleaseGates: [
        "Owner approval of a versioned price book and entitlement matrix.",
        "Server-authoritative billing and entitlement adapter with signed webhook verification and idempotency.",
        "Secure account, organization, seat, licence, receipt, refund and audit data model.",
        "Tax, invoice, refund, cancellation, trial and consumer-rights review for each sales region.",
        "Accessible purchase, cancellation, renewal and restore-purchase workflows.",
        "Provider cost budgets, rate limits, fair-use rules and outage-safe local behavior.",
        "Store-review, sandbox-payment and restore-purchase acceptance on every distribution channel.",
    ],
};
const deviceLimit = { kind: "device_resource_limited", enforcement: "local" };
const fairUse = { kind: "subject_to_fair_use", enforcement: "provider_required", policyStatus: "not_defined" };
exports.BUSINESS_TIER_CATALOG = [
    {
        id: "free",
        order: 1,
        name: "Free Forever",
        audience: "People evaluating the local creative core and learning the workflow.",
        model: "free",
        inheritsFrom: null,
        referencePrice: referencePrice("free", "0", "0", "one_time"),
        entitlements: [
            entitlement("local_core", "Offline local creative core", "included", "Project size is governed by device resources and tested engine limits, not an unbounded marketing promise.", deviceLimit),
            entitlement("mp3_export", "128 kbps MP3 export profile", "requires_provider", "The reference proposes MP3; a licensed and validated encoder is still required.", null, ["Validated MP3 encoder and metadata tests"]),
            entitlement("basic_content", "Basic original devices and effects", "included", "Only Poietek-original, procedural, licensed or user-supplied content may be bundled."),
            entitlement("ai_generation", "AI requests", "limited", "Reference allowance; remote execution requires consent, provider budgets and server-side enforcement.", { kind: "included_count", quantity: 10, unit: "requests", period: "day", enforcement: "provider_required" }, ["Configured AI provider and cost controls"]),
            entitlement("sample_detection", "Sample-detection findings", "limited", "A finding is not identification, ownership or legal clearance.", { kind: "included_count", quantity: 5, unit: "detections", period: "project", enforcement: "provider_required" }, ["Validated detection service and legal wording"]),
            entitlement("license_records", "Licence-record attachments", "limited", "Local rights records do not prove external acceptance.", { kind: "included_count", quantity: 1, unit: "records", period: "project", enforcement: "local" }),
            entitlement("collaboration", "Remote collaboration", "not_included", "Local file sharing remains separate from authenticated remote collaboration."),
        ],
        restrictions: ["No commercial entitlement is active in this reference catalogue.", "Remote services may be unavailable without configuration and consent."],
        externalGates: ["Approved free-service cost budget", "Abuse controls", "Encoder/provider acceptance"],
    },
    {
        id: "creator_perpetual",
        order: 2,
        name: "Creator Perpetual",
        audience: "Creators who prefer a one-time licence for a defined major version.",
        model: "perpetual_license",
        inheritsFrom: null,
        referencePrice: referencePrice("range", "19900", "59900", "one_time"),
        entitlements: [
            entitlement("local_core", "Offline local creative core", "included", "Perpetual access applies only to the purchased version and approved licence terms.", deviceLimit),
            entitlement("wav24_export", "24-bit WAV export", "included", "PCM WAV exists; final export profiles and metadata remain versioned."),
            entitlement("starter_pack", "Original starter content pack", "limited", "Reference bundle of five devices/effects and ten original or licensed samples.", { kind: "included_count", quantity: 15, unit: "items", period: "account", enforcement: "local" }),
            entitlement("cloud_projects", "Optional synchronized projects", "limited", "Local projects remain primary; remote copies require a configured provider.", { kind: "included_count", quantity: 50, unit: "projects", period: "account", enforcement: "provider_required" }, ["Authenticated encrypted sync provider"]),
            entitlement("sample_detection", "Sample-detection findings", "limited", "Reference allowance; no finding is a clearance decision.", { kind: "included_count", quantity: 20, unit: "detections", period: "project", enforcement: "provider_required" }, ["Validated detection service"]),
            entitlement("license_records", "Licence-record attachments", "limited", "Reference allowance for five records per project.", { kind: "included_count", quantity: 5, unit: "records", period: "project", enforcement: "local" }),
            entitlement("marketplace_access", "Marketplace browsing and purchases", "requires_provider", "Purchases require approved licences, payment evidence, receipts and restore-purchase behavior.", null, ["Marketplace, payment and fulfilment providers"]),
            entitlement("collaboration", "Remote collaboration", "not_included", "No remote collaboration entitlement is proposed for this tier."),
        ],
        restrictions: ["Major-version upgrade policy is not approved.", "Subscription services do not become perpetual unless the item licence says so."],
        externalGates: ["Signed licence policy", "Activation and offline grace design", "Restore-purchase acceptance"],
    },
    {
        id: "basic",
        order: 3,
        name: "Basic Membership",
        audience: "Individual creators who want modest online allowances without team collaboration.",
        model: "subscription",
        inheritsFrom: null,
        referencePrice: referencePrice("fixed", "1200", "1200", "month"),
        entitlements: [
            entitlement("local_core", "Offline local creative core", "included", "Local creation must remain available during provider or billing outages under an approved grace policy.", deviceLimit),
            entitlement("marketplace_rentals", "Monthly marketplace rentals", "limited", "Reference allowance of five eligible rentals; licence duration and offline behavior remain undefined.", { kind: "included_count", quantity: 5, unit: "rentals", period: "month", enforcement: "provider_required" }, ["Marketplace entitlement service"]),
            entitlement("ai_generation", "AI requests", "limited", "Reference allowance; requires provider budgets and consent.", { kind: "included_count", quantity: 100, unit: "requests", period: "day", enforcement: "provider_required" }, ["Configured AI provider and cost controls"]),
            entitlement("cloud_projects", "Optional synchronized projects", "limited", "Reference allowance of one hundred projects; bytes, versions and retention are unresolved.", { kind: "included_count", quantity: 100, unit: "projects", period: "account", enforcement: "provider_required" }, ["Authenticated encrypted sync provider"]),
            entitlement("license_records", "Licence-record attachments", "limited", "Reference allowance for ten records per project.", { kind: "included_count", quantity: 10, unit: "records", period: "project", enforcement: "local" }),
            entitlement("collaboration", "Remote collaboration", "not_included", "No remote collaboration entitlement is proposed for this tier."),
            entitlement("export_package", "Paid export entitlement", "configurable", "The source does not define which Creator export rights Basic inherits.", { kind: "configurable", enforcement: "contract" }),
        ],
        restrictions: ["Creator-tier inheritance is unresolved.", "Cancellation, grace and retained-rental behavior require approved terms."],
        externalGates: ["Billing provider", "Entitlement service", "Cancellation and refund policy"],
    },
    {
        id: "pro",
        order: 4,
        name: "Pro Membership",
        audience: "Professional individual creators using collaboration, rights preparation and online services.",
        model: "subscription",
        inheritsFrom: null,
        referencePrice: referencePrice("fixed", "2200", "2200", "month"),
        entitlements: [
            entitlement("local_core", "Offline local creative core", "included", "Local access survives temporary provider failure under the final licence and grace policy.", deviceLimit),
            entitlement("shop_access", "Eligible marketplace catalogue", "requires_provider", "The source's unbounded wording is converted to fair-use and item-licence rules.", fairUse, ["Marketplace service", "Approved fair-use policy"]),
            entitlement("ai_generation", "AI requests", "requires_provider", "High-volume use requires consent, provider capacity, abuse prevention and fair-use rules.", fairUse, ["Configured AI providers", "Approved fair-use and cost policy"]),
            entitlement("cloud_storage", "Optional synchronized storage", "limited", "Reference allowance of 100 GB; local project truth remains primary.", { kind: "included_count", quantity: 100, unit: "GB", period: "account", enforcement: "provider_required" }, ["Authenticated encrypted storage and sync"]),
            entitlement("sample_clearance_pathway", "Sample-clearance preparation pathway", "requires_provider", "Evidence collection and external pathways cannot clear a sample or provide legal advice by themselves.", null, ["Rights-provider adapters", "Legal review"]),
            entitlement("license_records", "Licence-record attachments", "included", "Local records are device-resource limited and do not prove authority acceptance.", deviceLimit),
            entitlement("collaboration", "Remote collaboration", "limited", "Reference maximum of two collaborators in addition to the owner.", { kind: "included_count", quantity: 2, unit: "collaborators", period: "project", enforcement: "provider_required" }, ["Authenticated collaboration service"]),
            entitlement("major_upgrades", "Major upgrades during membership", "included", "Applies only while membership is active under approved versioning terms."),
            entitlement("export_package", "Professional export package", "configurable", "Inheritance from Creator is not explicit in the reference.", { kind: "configurable", enforcement: "contract" }),
        ],
        restrictions: ["Fair-use and inheritance policies are not defined.", "Clearance assistance is not clearance, representation or legal advice."],
        externalGates: ["Collaboration identity and sync", "Rights-provider review", "Fair-use policy"],
    },
    {
        id: "premium",
        order: 5,
        name: "Premium Membership",
        audience: "Advanced creators needing broader collaboration, support and early-access programs.",
        model: "subscription",
        inheritsFrom: "pro",
        referencePrice: referencePrice("fixed", "3200", "3200", "month"),
        entitlements: [
            entitlement("collaboration", "Remote collaboration", "requires_provider", "Production must use published fair-use and capacity rules rather than an unbounded promise.", fairUse, ["Collaboration service", "Approved fair-use policy"]),
            entitlement("early_access", "Optional early-access channel", "included", "Participation is opt-in, reversible and separate from stable projects."),
            entitlement("events", "Member events", "requires_provider", "Invite and eligibility rules are not approved.", null, ["Events program and terms"]),
            entitlement("bug_bounties", "Responsible testing rewards", "configurable", "Reference rewards are not offers until scope, severity and payment rules are published.", { kind: "configurable", enforcement: "contract" }, ["Security disclosure and reward terms"]),
            entitlement("exclusive_appearance", "Optional appearance packs", "add_on", "Only original or licensed themes and assets may be distributed."),
            entitlement("priority_support", "Priority support queue", "requires_provider", "Response targets are not an SLA unless contracted.", null, ["Support operation and service policy"]),
            entitlement("bulk_ai", "Bulk AI analysis", "requires_provider", "Requires consent, job controls, provider budgets and fair-use rules.", fairUse, ["Batch AI service and cost controls"]),
        ],
        restrictions: ["Early access is not production availability.", "Reward amounts and support targets are not approved offers."],
        externalGates: ["Support and events operations", "Responsible disclosure program", "Batch AI infrastructure"],
    },
    {
        id: "teams",
        order: 6,
        name: "Teams Membership",
        audience: "Studios, labels, production teams, educators and managed groups.",
        model: "per_seat_subscription",
        inheritsFrom: "premium",
        referencePrice: referencePrice("fixed", "3200", "3200", "month", true),
        entitlements: [
            entitlement("team_admin", "Organization administration", "requires_provider", "Membership, roles, invitations, revocation, seats and audit events require an authenticated organization service.", null, ["Organization identity and administration service"]),
            entitlement("shared_team_folders", "Shared team storage", "requires_provider", "Retention, region, ownership, deletion and portability are unresolved.", { kind: "configurable", enforcement: "contract" }, ["Encrypted team storage and policy"]),
            entitlement("service_level", "Contracted service level", "configurable", "No SLA exists until targets, exclusions, support hours and remedies are signed.", { kind: "configurable", enforcement: "contract" }, ["Approved SLA and support operation"]),
            entitlement("billing_admin", "Seat and billing administration", "requires_provider", "Billing roles never grant creative-content access by default.", null, ["Billing and entitlement service"]),
        ],
        restrictions: ["Every seat needs explicit membership and least-privilege roles.", "Billing administration is separate from project ownership."],
        externalGates: ["Organization account model", "Seat billing", "Administrator security review"],
    },
    {
        id: "enterprise",
        order: 7,
        name: "Enterprise",
        audience: "Organizations requiring negotiated deployment, compliance, support or branding.",
        model: "custom_contract",
        inheritsFrom: "teams",
        referencePrice: referencePrice("starting_at", "50000", null, "month"),
        entitlements: [
            entitlement("dedicated_deployment", "Dedicated deployment options", "configurable", "Architecture, tenancy, region, backup, recovery and operations are contract-specific.", { kind: "configurable", enforcement: "contract" }, ["Security architecture and operations acceptance"]),
            entitlement("white_label", "Custom branding", "configurable", "Branding cannot remove licensing, safety, attribution or legal notices where required.", { kind: "configurable", enforcement: "contract" }, ["Brand and legal approval"]),
            entitlement("training", "Organization training", "configurable", "Curriculum, delivery, accessibility and support scope are negotiated.", { kind: "configurable", enforcement: "contract" }),
            entitlement("custom_compliance", "Custom compliance package", "configurable", "Compliance is assessed against an explicit framework and scope; it is never implied by the tier name.", { kind: "configurable", enforcement: "contract" }, ["Independent legal and security review"]),
            entitlement("custom_integrations", "Custom integrations", "configurable", "Every adapter remains least-privilege and separately accepted.", { kind: "configurable", enforcement: "contract" }, ["Integration scope and acceptance suite"]),
        ],
        restrictions: ["No dedicated service, certification or white-label right exists without a signed contract.", "The reference starting price is not a quote."],
        externalGates: ["Sales and legal approval", "Security review", "Contracted acceptance criteria"],
    },
];
function resolveTierEntitlements(tierId, catalog = exports.BUSINESS_TIER_CATALOG) {
    const tiers = new Map(catalog.map((tier) => [tier.id, tier]));
    const visiting = new Set();
    const resolved = new Map();
    const addTier = (id) => {
        if (visiting.has(id))
            throw new Error(`Tier inheritance cycle at ${id}.`);
        const tier = tiers.get(id);
        if (!tier)
            throw new Error(`Unknown business tier ${id}.`);
        visiting.add(id);
        if (tier.inheritsFrom)
            addTier(tier.inheritsFrom);
        tier.entitlements.forEach((item) => resolved.set(item.id, item));
        visiting.delete(id);
    };
    addTier(tierId);
    return [...resolved.values()];
}
function searchBusinessTiers(query) {
    const tokens = query.toLocaleLowerCase().split(/[^\p{L}\p{N}]+/u).filter((token) => token.length > 1);
    return exports.BUSINESS_TIER_CATALOG.filter((tier) => {
        if (!tokens.length)
            return true;
        const haystack = [tier.name, tier.audience, tier.model, ...tier.entitlements.flatMap((item) => [item.label, item.notes, ...item.externalGates]), ...tier.restrictions, ...tier.externalGates].join(" ").toLocaleLowerCase();
        return tokens.every((token) => haystack.includes(token));
    });
}
const pounds = (minorUnits) => `£${(Number(minorUnits) / 100).toLocaleString("en-GB", { maximumFractionDigits: 2 })}`;
function formatReferencePrice(price) {
    if (price.kind === "free")
        return "Reference £0";
    if (price.kind === "custom")
        return "Reference custom quote";
    const cadence = price.cadence === "one_time" ? " one-time" : price.cadence === "month" ? "/month" : price.cadence === "year" ? "/year" : "";
    const seat = price.perSeat ? " per user" : "";
    if (price.kind === "range" && price.minimumMinorUnits && price.maximumMinorUnits)
        return `Reference ${pounds(price.minimumMinorUnits)}–${pounds(price.maximumMinorUnits)}${cadence}${seat}`;
    if (price.kind === "starting_at" && price.minimumMinorUnits)
        return `Reference from ${pounds(price.minimumMinorUnits)}${cadence}${seat}`;
    return price.minimumMinorUnits ? `Reference ${pounds(price.minimumMinorUnits)}${cadence}${seat}` : "Reference price undecided";
}
