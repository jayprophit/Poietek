import type {
  CapabilityProvider,
  ProviderCapability,
  ProviderHealth,
} from "./types";

export interface FirebaseRestConfig {
  projectId: string;
}

export class FirebaseRestProvider implements CapabilityProvider {
  readonly id = "firebase";
  readonly priority = 500;
  readonly capabilities: ProviderCapability[] = [
    "project_directory",
    "notifications",
    "hosting",
    "telemetry",
  ];

  constructor(private readonly config: FirebaseRestConfig) {}

  async health(): Promise<ProviderHealth> {
    const start = performance.now();

    if (!this.config.projectId.trim()) {
      return {
        available: false,
        latencyMs: 0,
        quotaState: "unknown",
        message: "Firebase projectId is not configured.",
      };
    }

    try {
      const response = await fetch(
        `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(this.config.projectId)}/databases/(default)/documents?pageSize=1`,
        { method: "GET" },
      );

      return {
        // Reachability alone is insufficient: an unauthorized provider cannot
        // currently perform the capability the router is selecting.
        available: response.ok,
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
