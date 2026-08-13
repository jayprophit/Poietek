import type { PoietekProject } from "../domain/types";
import { validateProject } from "../domain/validate";
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
    const issues = validateProject(after);
    if (issues.length) {
      throw new Error(`Project mutation failed validation: ${issues.join(" | ")}`);
    }

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
    const save = this.saveTail
      .catch(() => undefined)
      .then(() => this.repository.save(snapshot));

    // Keep the serialization tail usable after a failed write, while returning
    // the real save promise so the initiating operation still observes failure.
    this.saveTail = save.catch(() => undefined);
    return save;
  }
}
