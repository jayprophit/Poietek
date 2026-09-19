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

    try {
      const response = await fetch(
        `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(this.config.projectId)}/databases/(default)/documents?pageSize=1`,
        { method: "GET" },
      );

      // A 401/403 still proves the endpoint/project route is reachable;
      // authenticated feature operations need a valid user/app token.
      return {
        available: response.status < 500,
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
