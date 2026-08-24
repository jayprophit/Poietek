"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalProvider = void 0;
class LocalProvider {
    id = "local";
    priority = 1000;
    capabilities = [
        "storage",
        "media_processing",
    ];
    async health() {
        return {
            available: true,
            quotaState: "unknown",
            message: "Local-first provider is available.",
        };
    }
}
exports.LocalProvider = LocalProvider;
