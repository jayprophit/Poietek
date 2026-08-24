export type ProviderCapability =
  | "auth"
  | "project_directory"
  | "realtime"
  | "comments"
  | "notifications"
  | "hosting"
  | "storage"
  | "ai"
  | "media_processing"
  | "telemetry";

export interface ProviderHealth {
  available: boolean;
  latencyMs?: number;
  quotaState?: "healthy" | "limited" | "exhausted" | "unknown";
  message?: string;
}

export interface CapabilityProvider {
  readonly id: string;
  readonly capabilities: ProviderCapability[];
  readonly priority: number;

  health(): Promise<ProviderHealth>;
}
