export interface ExternalIdentifier {
  namespace: string;
  kind: string;
  value: string;
  verification: "self_declared" | "format_checked" | "provider_confirmed" | "admin_verified";
  maskedDisplay?: string;
}

export interface ExternalIdentifierVault {
  put(partyId: string, identifier: ExternalIdentifier): Promise<void>;
  listForDisplay(partyId: string): Promise<Array<Omit<ExternalIdentifier, "value"> & { maskedValue: string }>>;
  resolveForExport(
    partyId: string,
    purpose: "prs" | "ppl" | "mlc" | "soundexchange" | "ddex" | "distribution",
  ): Promise<ExternalIdentifier[]>;
}
