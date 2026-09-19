export type ConsoleParameterValue = boolean | number | string;

export interface ConsoleParameterChange {
  path: string;
  value: ConsoleParameterValue;
  source:
    | "physical_console"
    | "poietek_ui"
    | "automation_playback"
    | "scene_recall"
    | "remote_client"
    | "system";
  timestampMonotonicMs: number;
  sequence?: number;
}

export interface ConsoleCapabilities {
  audioConnections: string[];
  controlProtocols: string[];
  clockSources: string[];

  bidirectionalControl: boolean;
  meters: boolean;
  routing: boolean;
  scenes: boolean;
  transport: boolean;
  preamps: boolean;
  eq: boolean;
  dynamics: boolean;
  sends: boolean;
  pans: boolean;
  faders: boolean;
  mutes: boolean;
  namesColors: boolean;
}

export interface ConsoleStateSnapshot {
  consoleId: string;
  capturedAt: string;
  parameters: Record<string, ConsoleParameterValue>;
  sceneName?: string;
  sceneExternalId?: string;
}

export interface ConsoleAdapter {
  readonly id: string;
  readonly displayName: string;

  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): Promise<boolean>;

  getCapabilities(): Promise<ConsoleCapabilities>;
  getStateSnapshot(): Promise<ConsoleStateSnapshot>;

  subscribe(
    callback: (change: ConsoleParameterChange) => void,
  ): () => void;

  setParameter(
    path: string,
    value: ConsoleParameterValue,
    options?: {
      source?: ConsoleParameterChange["source"];
      writeAutomation?: boolean;
    },
  ): Promise<void>;

  recallScene?(sceneId: string): Promise<void>;
  storeScene?(name: string): Promise<string>;

  getMeters?(): AsyncIterable<Record<string, number>>;
}
