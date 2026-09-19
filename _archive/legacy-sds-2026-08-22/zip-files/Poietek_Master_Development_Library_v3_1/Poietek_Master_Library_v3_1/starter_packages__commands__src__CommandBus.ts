import type { PoietekProject } from "../../domain/src/types";
import type { ProjectRepository } from "../../project/src/ProjectRepository";
import { applyProjectCommand } from "./reducer";
import type { ProjectCommand } from "./types";

export interface CommandResult {
  revision: string;
  project: PoietekProject;
  changedObjectIds: string[];
}

export class LocalCommandBus {
  private undoStack: ProjectCommand[] = [];
  private redoStack: ProjectCommand[] = [];

  constructor(
    private readonly repository: ProjectRepository,
    private project: PoietekProject,
  ) {}

  current(): PoietekProject {
    return structuredClone(this.project);
  }

  async dispatch(command: ProjectCommand): Promise<CommandResult> {
    const applied = applyProjectCommand(this.project, command);
    const revision = await this.repository.save(applied.project);

    this.project = applied.project;

    if (applied.inverse) {
      this.undoStack.push(applied.inverse);
      this.redoStack = [];
    }

    return {
      revision,
      project: this.current(),
      changedObjectIds: applied.changedObjectIds,
    };
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  async undo(): Promise<CommandResult | null> {
    const command = this.undoStack.pop();
    if (!command) return null;

    const applied = applyProjectCommand(this.project, command);
    const revision = await this.repository.save(applied.project);
    this.project = applied.project;

    if (applied.inverse) this.redoStack.push(applied.inverse);

    return {
      revision,
      project: this.current(),
      changedObjectIds: applied.changedObjectIds,
    };
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  async redo(): Promise<CommandResult | null> {
    const command = this.redoStack.pop();
    if (!command) return null;

    const applied = applyProjectCommand(this.project, command);
    const revision = await this.repository.save(applied.project);
    this.project = applied.project;

    if (applied.inverse) this.undoStack.push(applied.inverse);

    return {
      revision,
      project: this.current(),
      changedObjectIds: applied.changedObjectIds,
    };
  }
}
