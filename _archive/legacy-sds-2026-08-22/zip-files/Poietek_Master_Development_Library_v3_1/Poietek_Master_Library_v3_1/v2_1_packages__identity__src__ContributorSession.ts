export type AccessMode =
  | "one_session"
  | "time_limited"
  | "project_lifetime"
  | "team_reusable"
  | "organisation"
  | "unlimited";

export interface ContributorSession {
  sessionId: string;
  projectId: string;
  partyId: string;
  deviceId: string;
  role: string;
  accessMode: AccessMode;
  permissions: string[];
  createdAt: string;
  expiresAt?: string | null;
  status: "active" | "suspended" | "revoked" | "expired";
}

export interface JoinRequest {
  projectId: string;
  inviteToken: string;
  deviceId: string;
  existingPartyId?: string;
}

export interface ContributorAccessService {
  createInvite(input: {
    projectId: string;
    role: string;
    accessMode: AccessMode;
    expiresAt?: string;
    permissions?: string[];
  }): Promise<{ inviteToken: string; joinUrl: string }>;

  join(request: JoinRequest): Promise<ContributorSession>;
  revokeSession(sessionId: string): Promise<void>;
  revokeDevice(projectId: string, deviceId: string): Promise<void>;
  listSessions(projectId: string): Promise<ContributorSession[]>;
}
