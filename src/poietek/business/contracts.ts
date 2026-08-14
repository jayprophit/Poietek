export const BUSINESS_TIER_SCHEMA_VERSION = "1.0.0" as const;

export type BusinessTierId =
  | "free"
  | "creator_perpetual"
  | "basic"
  | "pro"
  | "premium"
  | "teams"
  | "enterprise";

export type CommercialModel =
  | "free"
  | "perpetual_license"
  | "subscription"
  | "per_seat_subscription"
  | "custom_contract";

export interface ReferencePrice {
  kind: "free" | "fixed" | "range" | "starting_at" | "custom";
  currency: "GBP" | null;
  minimumMinorUnits: string | null;
  maximumMinorUnits: string | null;
  cadence: "one_time" | "month" | "year" | "custom";
  perSeat: boolean;
  approval: "historical_reference_not_approved";
  note: string;
}

export type EntitlementLimit =
  | {
      kind: "included_count";
      quantity: number;
      unit: string;
      period: "day" | "project" | "month" | "account";
      enforcement: "local" | "provider_required";
    }
  | {
      kind: "subject_to_fair_use";
      enforcement: "provider_required";
      policyStatus: "not_defined" | "draft" | "approved";
    }
  | {
      kind: "device_resource_limited";
      enforcement: "local";
    }
  | {
      kind: "configurable";
      enforcement: "provider_required" | "contract";
    };

export interface TierEntitlement {
  id: string;
  label: string;
  state:
    | "included"
    | "limited"
    | "not_included"
    | "add_on"
    | "configurable"
    | "requires_provider";
  limit: EntitlementLimit | null;
  notes: string;
  externalGates: string[];
}

export interface BusinessTierDefinition {
  id: BusinessTierId;
  order: number;
  name: string;
  audience: string;
  model: CommercialModel;
  inheritsFrom: BusinessTierId | null;
  referencePrice: ReferencePrice;
  entitlements: TierEntitlement[];
  restrictions: string[];
  externalGates: string[];
}

export interface BusinessTierGovernance {
  schemaVersion: typeof BUSINESS_TIER_SCHEMA_VERSION;
  commercialStatus: "reference_template";
  checkoutEnabled: false;
  pricingApproved: false;
  entitlementEnforcementAvailable: false;
  localProjectAccessDuringProviderFailure: "preserve_local_creation";
  purchasedItemContinuity: "subject_to_item_license_terms";
  source: {
    path: string;
    lineCount: number;
    characterCount: number;
    sha256: string;
    importedAt: string;
  };
  unresolvedDecisions: string[];
  requiredReleaseGates: string[];
}

export interface BusinessTierValidationIssue {
  code: string;
  path: string;
  message: string;
}
