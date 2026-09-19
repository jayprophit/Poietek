export type AnchorKind =
  | "rights_manifest"
  | "contributor_approval_batch"
  | "registration_receipt_batch"
  | "marketplace_settlement_batch"
  | "external_royalty_statement_batch"
  | "release_snapshot"
  | "provenance_snapshot";

export interface AnchorRequest {
  anchorId: string;
  objectIdHash: string;
  contentHash: string;
  metadataRoot: string;
  version: number;
  kind: AnchorKind;
  signedEventTime: string;
}

export interface AnchorReceipt {
  providerId: string;
  network: string;
  chainId?: string;
  transactionId: string;
  blockNumber?: string;
  blockTimestamp?: string;
  submittedAt: string;
  confirmedAt?: string;
  contractAddress?: string;
  anchorId: string;
}

export interface BlockchainAnchorProvider {
  readonly id: string;
  readonly network: string;

  isAvailable(): Promise<boolean>;
  estimateAnchorCost?(request: AnchorRequest): Promise<{
    nativeAmount?: string;
    fiatEstimate?: string;
    currency?: string;
  }>;

  anchor(request: AnchorRequest): Promise<AnchorReceipt>;
  verify(receipt: AnchorReceipt, expectedContentHash: string): Promise<boolean>;
}
