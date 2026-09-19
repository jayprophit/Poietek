export type PaymentRailType =
  | "stripe_connect"
  | "apple_iap"
  | "google_play_billing"
  | "paypal_marketplace"
  | "external_web_checkout"
  | "bank_transfer"
  | "other";

export interface PaymentAllocation {
  partyId: string;
  amountMinor: number;
  reason: string;
}

export interface PaymentRail {
  readonly id: string;
  readonly type: PaymentRailType;

  canUse(input: {
    platform: "web" | "windows" | "macos" | "linux" | "ios" | "ipados" | "android";
    territory?: string;
    productType: string;
    digital: boolean;
    transactionKind: "sale" | "subscription" | "tip" | "donation" | "payout";
  }): Promise<boolean>;

  createCheckout(input: {
    orderId: string;
    amountMinor: number;
    currency: string;
    allocations: PaymentAllocation[];
  }): Promise<{ checkoutRef: string }>;
}
