export interface BackendSession {
  userId: string;
  accessToken?: string;
}

export interface ProjectDirectoryEntry {
  id: string;
  title: string;
  schemaVersion: string;
  modifiedAt: string;
  visibility: "private" | "team" | "unlisted" | "public";
}

export interface ProjectComment {
  id: string;
  projectId: string;
  authorId: string;
  body: string;
  createdAt: string;
  anchor?: Record<string, unknown> | null;
  resolved: boolean;
}

export interface BackendProvider {
  readonly id: string;

  getSession(): Promise<BackendSession | null>;
  signOut(): Promise<void>;

  listProjects(): Promise<ProjectDirectoryEntry[]>;
  upsertProjectDirectory(entry: ProjectDirectoryEntry): Promise<void>;

  listComments(projectId: string): Promise<ProjectComment[]>;
  addComment(
    projectId: string,
    body: string,
    anchor?: Record<string, unknown>,
  ): Promise<ProjectComment>;

  setPresence(projectId: string, state: Record<string, unknown>): Promise<void>;
  subscribePresence(
    projectId: string,
    callback: (states: Record<string, unknown>[]) => void,
  ): () => void;
}
