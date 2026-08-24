export interface UserIdentity {
  id: string;
  displayName: string;
  email?: string | null;
}

export interface ProjectDirectoryRecord {
  id: string;
  title: string;
  schemaVersion: string;
  modifiedAt: string;
  visibility: "private" | "team" | "unlisted" | "public";
}

export interface HostedAuthService {
  currentUser(): Promise<UserIdentity | null>;
  signOut(): Promise<void>;
}

export interface HostedProjectDirectoryService {
  listProjects(): Promise<ProjectDirectoryRecord[]>;
  upsertProject(record: ProjectDirectoryRecord): Promise<void>;
}

export interface RealtimeRelay {
  connect(projectId: string): Promise<void>;
  disconnect(projectId: string): Promise<void>;
  publish(projectId: string, payload: Uint8Array): Promise<void>;
  subscribe(projectId: string, listener: (payload: Uint8Array) => void): () => void;
}

export interface HostedBackend {
  id: string;
  auth: HostedAuthService;
  projects: HostedProjectDirectoryService;
  realtime?: RealtimeRelay;
}
