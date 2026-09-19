import type {
  BackendProvider,
  BackendSession,
  ProjectComment,
  ProjectDirectoryEntry,
} from "./BackendProvider";

export class LocalOnlyBackendProvider implements BackendProvider {
  readonly id = "local-only";

  async getSession(): Promise<BackendSession | null> {
    return null;
  }

  async signOut(): Promise<void> {}

  async listProjects(): Promise<ProjectDirectoryEntry[]> {
    return [];
  }

  async upsertProjectDirectory(_entry: ProjectDirectoryEntry): Promise<void> {}

  async listComments(_projectId: string): Promise<ProjectComment[]> {
    return [];
  }

  async addComment(): Promise<ProjectComment> {
    throw new Error("NETWORK_FEATURE_DISABLED: Local-only projects have no remote comments.");
  }

  async setPresence(): Promise<void> {}

  subscribePresence(
    _projectId: string,
    callback: (states: Record<string, unknown>[]) => void,
  ): () => void {
    callback([]);
    return () => {};
  }
}
