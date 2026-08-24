import type { PoietekProject } from "../domain/types";
import type { ProjectRepository } from "./ProjectRepository";

export type ProjectMutation = (project: PoietekProject) => PoietekProject;

export class ProjectSession {
  private undoStack: PoietekProject[] = [];
  private redoStack: PoietekProject[] = [];
  private saveTail: Promise<void> = Promise.resolve();

  constructor(
    private current: PoietekProject,
    private readonly repository: ProjectRepository,
    private readonly maxHistory = 40,
  ) {}

  getSnapshot(): PoietekProject {
    return structuredClone(this.current);
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  async mutate(mutation: ProjectMutation): Promise<PoietekProject> {
    const before = structuredClone(this.current);
    const after = mutation(structuredClone(this.current));

    after.updatedAt = new Date().toISOString();

    this.undoStack.push(before);
    if (this.undoStack.length > this.maxHistory) this.undoStack.shift();
    this.redoStack = [];
    this.current = after;

    await this.queueSave();
    return this.getSnapshot();
  }

  async undo(): Promise<PoietekProject> {
    const previous = this.undoStack.pop();
    if (!previous) return this.getSnapshot();

    this.redoStack.push(structuredClone(this.current));
    this.current = previous;
    this.current.updatedAt = new Date().toISOString();
    await this.queueSave();
    return this.getSnapshot();
  }

  async redo(): Promise<PoietekProject> {
    const next = this.redoStack.pop();
    if (!next) return this.getSnapshot();

    this.undoStack.push(structuredClone(this.current));
    this.current = next;
    this.current.updatedAt = new Date().toISOString();
    await this.queueSave();
    return this.getSnapshot();
  }

  private queueSave(): Promise<void> {
    const snapshot = this.getSnapshot();
    this.saveTail = this.saveTail.then(() => this.repository.save(snapshot));
    return this.saveTail;
  }
}
