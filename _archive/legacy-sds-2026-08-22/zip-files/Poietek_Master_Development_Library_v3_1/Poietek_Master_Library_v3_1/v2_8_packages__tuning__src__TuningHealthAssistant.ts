export interface PitchObservation {
  sourceId: string;
  expectedHz?: number;
  measuredHz: number;
  confidence: number;
  timestampSeconds?: number;
}

export interface TuningHealthFinding {
  sourceId: string;
  centsOffset?: number;
  severity: "info" | "advisory" | "warning";
  message: string;
  action:
    | "none"
    | "retune_instrument"
    | "retune_audio_preview"
    | "change_session_reference"
    | "check_source"
    | "manual_review";
}

/**
 * AI may explain these measurements, but deterministic pitch analysis owns the
 * measured frequency/cents values.
 */
export interface TuningHealthAssistant {
  analyze(input: {
    referenceProfileId: string;
    observations: PitchObservation[];
    sourceType?: string;
  }): Promise<TuningHealthFinding[]>;
}
