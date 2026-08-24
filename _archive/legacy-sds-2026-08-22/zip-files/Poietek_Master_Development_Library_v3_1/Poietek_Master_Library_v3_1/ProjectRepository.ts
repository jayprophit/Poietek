export interface ProjectSummary {
  id: string;
  title: string;
  schemaVersion: string;
  updatedAt: string;
}

export interface ProjectRepository<TProject> {
  create(project: TProject): Promise<void>;
  get(projectId: string): Promise<TProject | null>;
  save(project: TProject, expectedRevision?: string): Promise<string>;
  list(): Promise<ProjectSummary[]>;
  delete(projectId: string): Promise<void>;
  createCheckpoint(projectId: string, name: string): Promise<string>;
}
