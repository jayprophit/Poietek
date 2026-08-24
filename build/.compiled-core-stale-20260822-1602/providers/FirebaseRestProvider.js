"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirebaseRestProvider = void 0;
class FirebaseRestProvider {
    config;
    id = "firebase";
    priority = 500;
    capabilities = [
        "project_directory",
        "notifications",
        "hosting",
        "telemetry",
    ];
    constructor(config) {
        this.config = config;
    }
    async health() {
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
            const response = await fetch(`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(this.config.projectId)}/databases/(default)/documents?pageSize=1`, { method: "GET" });
            return {
                // Reachability alone is insufficient: an unauthorized provider cannot
                // currently perform the capability the router is selecting.
                available: response.ok,
                latencyMs: performance.now() - start,
                quotaState: "unknown",
                message: `HTTP ${response.status}`,
            };
        }
        catch (error) {
            return {
                available: false,
                latencyMs: performance.now() - start,
                quotaState: "unknown",
                message: error instanceof Error ? error.message : String(error),
            };
        }
    }
}
exports.FirebaseRestProvider = FirebaseRestProvider;
