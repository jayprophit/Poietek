import type { PoietekProject, ProjectId } from "../domain/types";

export interface ProjectSummary {
  id: ProjectId;
  title: string;
  updatedAt: string;
}

export interface ProjectRepository {
  get(id: ProjectId): Promise<PoietekProject | null>;
  save(project: PoietekProject): Promise<void>;
  list(): Promise<ProjectSummary[]>;
  delete(id: ProjectId): Promise<void>;
}
