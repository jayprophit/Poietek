export type SocietyConnectorMode =
  | "official_api"
  | "partner_api"
  | "ddex_feed"
  | "cwr_export"
  | "bulk_file_export"
  | "authorized_agent"
  | "portal_handoff"
  | "statement_import"
  | "read_only_lookup";

export interface RegistrationPackage {
  projectId: string;
  rightsManifestId: string;
  kind: "musical_work" | "sound_recording" | "music_video" | "performer_claim" | "release";
  payload: Record<string, unknown>;
}

export interface RegistrationReceipt {
  provider: string;
  status: "prepared" | "submitted" | "accepted" | "rejected" | "pending" | "manual_action_required";
  submissionId?: string;
  externalIds?: Record<string, string>;
  submittedAt?: string;
  confirmedAt?: string;
  message?: string;
}

export interface SocietyConnector {
  readonly id: string;
  readonly modes: SocietyConnectorMode[];
  validate(pkg: RegistrationPackage): Promise<string[]>;
  prepare(pkg: RegistrationPackage): Promise<RegistrationPackage>;
  submit?(pkg: RegistrationPackage): Promise<RegistrationReceipt>;
  exportFile?(pkg: RegistrationPackage): Promise<Blob>;
  openPortalHandoff?(pkg: RegistrationPackage): Promise<void>;
  checkStatus?(receipt: RegistrationReceipt): Promise<RegistrationReceipt>;
}
