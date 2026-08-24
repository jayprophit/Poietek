"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CapabilityRouter = void 0;
class CapabilityRouter {
    providers = [];
    register(provider) {
        this.providers = [
            ...this.providers.filter((existing) => existing.id !== provider.id),
            provider,
        ];
    }
    async select(capability) {
        const providers = this.providers
            .filter((provider) => provider.capabilities.includes(capability))
            .sort((a, b) => b.priority - a.priority);
        const candidates = [];
        for (const provider of providers) {
            let available = false;
            try {
                available = (await provider.health()).available;
            }
            catch {
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
exports.CapabilityRouter = CapabilityRouter;
