import type {
  CapabilityProvider,
  ProviderCapability,
  ProviderHealth,
} from "./types";

export interface SupabaseRestConfig {
  url: string;
  anonKey: string;
}

export class SupabaseRestProvider implements CapabilityProvider {
  readonly id = "supabase";
  readonly priority = 600;
  readonly capabilities: ProviderCapability[] = [
    "auth",
    "project_directory",
    "realtime",
    "comments",
    "storage",
  ];

  constructor(private readonly config: SupabaseRestConfig) {}

  async health(): Promise<ProviderHealth> {
    const start = performance.now();

    try {
      const response = await fetch(
        `${this.config.url.replace(/\/$/, "")}/rest/v1/`,
        {
          method: "HEAD",
          headers: {
            apikey: this.config.anonKey,
          },
        },
      );

      return {
        available: response.ok || response.status === 404,
        latencyMs: performance.now() - start,
        quotaState: "unknown",
        message: `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        available: false,
        latencyMs: performance.now() - start,
        quotaState: "unknown",
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
