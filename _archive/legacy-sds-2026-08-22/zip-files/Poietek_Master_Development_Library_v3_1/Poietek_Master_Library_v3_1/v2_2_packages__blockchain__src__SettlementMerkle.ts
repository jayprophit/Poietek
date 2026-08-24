export interface SettlementLeaf {
  settlementId: string;
  partyIdHash: string;
  currency: string;
  amountMinor: bigint;
  sourceType: "marketplace" | "royalty_statement" | "licence" | "tip" | "other";
  sourceRefHash: string;
}

/**
 * IMPORTANT:
 * This file defines the canonical leaf fields only.
 * Use a vetted Merkle tree implementation for production.
 * Do not implement ad-hoc Merkle hashing differently across clients.
 */
export function canonicalSettlementLeaf(input: SettlementLeaf): string {
  return JSON.stringify({
    settlementId: input.settlementId,
    partyIdHash: input.partyIdHash,
    currency: input.currency,
    amountMinor: input.amountMinor.toString(),
    sourceType: input.sourceType,
    sourceRefHash: input.sourceRefHash,
  });
}
