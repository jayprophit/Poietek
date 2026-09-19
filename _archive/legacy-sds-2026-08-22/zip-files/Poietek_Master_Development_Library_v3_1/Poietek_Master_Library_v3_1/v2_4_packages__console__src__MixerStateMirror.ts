import type {
  ConsoleAdapter,
  ConsoleParameterChange,
  ConsoleParameterValue,
} from "./ConsoleAdapter";

export type WriteConflictMode =
  | "last_touch"
  | "console_priority"
  | "poietek_priority"
  | "automation_priority"
  | "pickup"
  | "read_only";

export interface MirroredParameter {
  path: string;
  value: ConsoleParameterValue;
  lastSource: ConsoleParameterChange["source"];
  lastChangedAtMonotonicMs: number;
}

export class MixerStateMirror {
  private readonly state = new Map<string, MirroredParameter>();
  private unsubscribe?: () => void;

  constructor(
    private readonly adapter: ConsoleAdapter,
    private readonly conflictMode: WriteConflictMode = "last_touch",
  ) {}

  async start(): Promise<void> {
    const snapshot = await this.adapter.getStateSnapshot();

    for (const [path, value] of Object.entries(snapshot.parameters)) {
      this.state.set(path, {
        path,
        value,
        lastSource: "system",
        lastChangedAtMonotonicMs: performance.now(),
      });
    }

    this.unsubscribe = this.adapter.subscribe((change) => {
      this.state.set(change.path, {
        path: change.path,
        value: change.value,
        lastSource: change.source,
        lastChangedAtMonotonicMs: change.timestampMonotonicMs,
      });
    });
  }

  stop(): void {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
  }

  get(path: string): MirroredParameter | undefined {
    return this.state.get(path);
  }

  list(): MirroredParameter[] {
    return [...this.state.values()];
  }

  async setFromPoietek(
    path: string,
    value: ConsoleParameterValue,
    options?: { writeAutomation?: boolean },
  ): Promise<void> {
    if (this.conflictMode === "read_only") {
      throw new Error("Console mirror is read-only.");
    }

    await this.adapter.setParameter(path, value, {
      source: "poietek_ui",
      writeAutomation: options?.writeAutomation ?? false,
    });
  }
}
