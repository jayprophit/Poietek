export interface AllocationRule {
  partyId: string;
  shareBasisPoints: number;
  reason: string;
}

export interface Allocation {
  partyId: string;
  amountMinor: number;
  reason: string;
}

/**
 * Deterministic integer allocation using the largest-remainder method.
 * Shares must total 10,000 basis points (100%).
 */
export function allocateMinorUnits(
  distributableMinor: number,
  rules: AllocationRule[],
): Allocation[] {
  if (!Number.isInteger(distributableMinor) || distributableMinor < 0) {
    throw new Error("distributableMinor must be a non-negative integer.");
  }

  const total = rules.reduce((sum, rule) => sum + rule.shareBasisPoints, 0);
  if (total !== 10_000) {
    throw new Error(`Shares must total 10000 basis points; got ${total}.`);
  }

  const parts = rules.map((rule, index) => {
    const numerator = distributableMinor * rule.shareBasisPoints;
    return {
      index,
      rule,
      base: Math.floor(numerator / 10_000),
      remainder: numerator % 10_000,
    };
  });

  const baseTotal = parts.reduce((sum, part) => sum + part.base, 0);
  const remaining = distributableMinor - baseTotal;
  const ranked = [...parts].sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  const bonus = new Set(ranked.slice(0, remaining).map((item) => item.index));

  return parts.map((part) => ({
    partyId: part.rule.partyId,
    amountMinor: part.base + (bonus.has(part.index) ? 1 : 0),
    reason: part.rule.reason,
  }));
}
