import type { HealthRecommendation } from "./types";

export interface DeterministicHealthReport {
  measurements: Record<string, unknown>;
  findings: Record<string, unknown>[];
  targetProfile?: Record<string, unknown>;
  context: {
    sourceType?: string;
    stage?: "recording" | "editing" | "mixing" | "mastering" | "live" | "delivery";
    genreHint?: string;
    targetPlatform?: string;
  };
}

export interface AudioHealthAiProvider {
  readonly id: string;

  explain(input: DeterministicHealthReport): Promise<{
    summary: string;
    recommendations: HealthRecommendation[];
    questions?: string[];
  }>;
}

/**
 * AI receives measurements/findings; it does not invent meter values.
 * Any proposed project mutation must be expressed as previewable commands.
 */
export interface AudioHealthAssistant {
  analyzeAndExplain(
    report: DeterministicHealthReport,
  ): Promise<{
    summary: string;
    recommendations: HealthRecommendation[];
  }>;
}
