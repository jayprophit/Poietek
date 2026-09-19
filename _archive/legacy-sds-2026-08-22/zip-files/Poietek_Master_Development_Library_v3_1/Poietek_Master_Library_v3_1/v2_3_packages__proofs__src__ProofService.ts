export type ProofType =
  | "contribution" | "consent" | "identity" | "data_integrity"
  | "transaction_history" | "interoperability" | "reputation" | "impact"
  | "engagement" | "location" | "chaos_resilience" | "discovery"
  | "legacy" | "environmental_impact" | "trust_bundle"
  | "proof_of_concept" | "customization" | "learning_competency";

export interface ProofRecord {
  proofId: string;
  proofType: ProofType;
  subjectType: string;
  subjectId: string;
  issuerType: string;
  issuerId: string;
  createdAt: string;
  expiresAt?: string;
  evidence: Record<string, unknown>[];
  contentHash?: string;
  verificationStatus:
    | "unverified" | "self_attested" | "verified"
    | "expired" | "revoked" | "failed";
}

export interface ProofService {
  issue(input: Omit<ProofRecord, "proofId" | "createdAt">): Promise<ProofRecord>;
  verify(proofId: string): Promise<ProofRecord>;
  revoke(proofId: string, reason: string): Promise<void>;
  list(subjectType: string, subjectId: string): Promise<ProofRecord[]>;
}
