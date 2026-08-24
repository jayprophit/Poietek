export interface ChainDescriptor {
  id: string;
  family: "evm" | "bitcoin" | "other";
  network: string;
  supportsAnchoring: boolean;
  supportsTypedApprovals: boolean;
  supportsSettlementProofs: boolean;
}

export interface ChainEvidenceAdapter {
  readonly descriptor: ChainDescriptor;

  anchor(input: {
    objectType: string;
    objectIdHash: string;
    contentHash: string;
    metadataRoot?: string;
    version: number;
  }): Promise<{
    transactionId: string;
    blockOrLedgerRef?: string;
    confirmedAt?: string;
  }>;

  verify(input: {
    transactionId: string;
    expectedContentHash: string;
  }): Promise<boolean>;
}

/**
 * Evidence portability only.
 * Cross-chain movement of tokens/funds is a separate high-risk subsystem.
 */
