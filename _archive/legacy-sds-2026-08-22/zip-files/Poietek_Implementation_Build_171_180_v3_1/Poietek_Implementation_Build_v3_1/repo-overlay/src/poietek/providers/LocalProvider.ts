import type {
  CapabilityProvider,
  ProviderCapability,
  ProviderHealth,
} from "./types";

export class LocalProvider implements CapabilityProvider {
  readonly id = "local";
  readonly priority = 1000;
  readonly capabilities: ProviderCapability[] = [
    "storage",
    "media_processing",
  ];

  async health(): Promise<ProviderHealth> {
    return {
      available: true,
      quotaState: "unknown",
      message: "Local-first provider is available.",
    };
  }
}
