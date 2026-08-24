export type CommandSource =
  | "ui"
  | "keyboard"
  | "midi"
  | "hardware"
  | "ai"
  | "automation"
  | "api"
  | "migration"
  | "system";

export interface CommandContext {
  projectId: string;
  actorId: string;
  clientId?: string;
  source: CommandSource;
  correlationId?: string;
}

export interface Command<TPayload = unknown> {
  id: string;
  type: string;
  createdAt: string;
  context: CommandContext;
  payload: TPayload;
}

export interface CommandResult {
  revision: string;
  changedObjectIds: string[];
  warnings: string[];
}

export interface CommandHandler<T extends Command = Command> {
  handles: T["type"];
  execute(command: T): Promise<CommandResult>;
}

export interface CommandBus {
  dispatch<T extends Command>(command: T): Promise<CommandResult>;
}
