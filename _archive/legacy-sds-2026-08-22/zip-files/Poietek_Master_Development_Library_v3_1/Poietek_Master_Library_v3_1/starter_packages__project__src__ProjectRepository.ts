import type { PoietekProject } from "../../domain/src/types";

export interface ProjectSummary {
  id: string;
  title: string;
  schemaVersion: string;
  updatedAt: string;
}

export interface ProjectRepository {
  create(project: PoietekProject): Promise<void>;
  get(projectId: string): Promise<PoietekProject | null>;
  save(project: PoietekProject): Promise<string>;
  list(): Promise<ProjectSummary[]>;
  delete(projectId: string): Promise<void>;
}
