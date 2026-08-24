import type {
  CapabilityProvider,
  ProviderCapability,
} from "./types";

export interface ProviderSelection {
  capability: ProviderCapability;
  selected: CapabilityProvider | null;
  candidates: Array<{
    provider: CapabilityProvider;
    available: boolean;
    priority: number;
  }>;
}

export class CapabilityRouter {
  private providers: CapabilityProvider[] = [];

  register(provider: CapabilityProvider): void {
    this.providers = [
      ...this.providers.filter((existing) => existing.id !== provider.id),
      provider,
    ];
  }

  async select(capability: ProviderCapability): Promise<ProviderSelection> {
    const providers = this.providers
      .filter((provider) => provider.capabilities.includes(capability))
      .sort((a, b) => b.priority - a.priority);

    const candidates: ProviderSelection["candidates"] = [];

    for (const provider of providers) {
      let available = false;
      try {
        available = (await provider.health()).available;
      } catch {
        available = false;
      }

      candidates.push({
        provider,
        available,
        priority: provider.priority,
      });

      if (available) {
        return { capability, selected: provider, candidates };
      }
    }

    return { capability, selected: null, candidates };
  }
}
