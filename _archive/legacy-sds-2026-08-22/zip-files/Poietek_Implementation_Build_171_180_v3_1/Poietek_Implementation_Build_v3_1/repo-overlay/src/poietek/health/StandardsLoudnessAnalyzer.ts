export interface StandardsLoudnessResult {
  integratedLufs: number | null;
  momentaryLufsMax: number | null;
  shortTermLufsMax: number | null;
  loudnessRangeLu: number | null;
  truePeakDbtp: number | null;
}

export interface StandardsLoudnessAnalyzer {
  readonly implementationId: string;
  analyze(input: {
    channels: Float32Array[];
    sampleRate: number;
  }): Promise<StandardsLoudnessResult>;
}

/**
 * Deliberately "unavailable" until a validated BS.1770 implementation is wired.
 * Never rename RMS as LUFS or sample peak as dBTP.
 */
export class UnavailableStandardsLoudnessAnalyzer
implements StandardsLoudnessAnalyzer {
  readonly implementationId = "unavailable";

  async analyze(): Promise<StandardsLoudnessResult> {
    return {
      integratedLufs: null,
      momentaryLufsMax: null,
      shortTermLufsMax: null,
      loudnessRangeLu: null,
      truePeakDbtp: null,
    };
  }
}
