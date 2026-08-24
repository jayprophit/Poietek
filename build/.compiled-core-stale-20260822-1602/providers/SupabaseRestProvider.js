"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseRestProvider = void 0;
class SupabaseRestProvider {
    config;
    id = "supabase";
    priority = 600;
    capabilities = [
        "auth",
        "project_directory",
        "realtime",
        "comments",
        "storage",
    ];
    constructor(config) {
        this.config = config;
    }
    async health() {
        const start = performance.now();
        if (!this.config.url.trim() || !this.config.anonKey.trim()) {
            return {
                available: false,
                latencyMs: 0,
                quotaState: "unknown",
                message: "Supabase URL and anon key are not configured.",
            };
        }
        try {
            const response = await fetch(`${this.config.url.replace(/\/$/, "")}/rest/v1/`, {
                method: "HEAD",
                headers: {
                    apikey: this.config.anonKey,
                },
            });
            return {
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
exports.SupabaseRestProvider = SupabaseRestProvider;
