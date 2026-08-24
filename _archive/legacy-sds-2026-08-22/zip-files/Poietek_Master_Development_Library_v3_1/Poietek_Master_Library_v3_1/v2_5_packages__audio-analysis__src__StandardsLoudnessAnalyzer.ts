export interface LoudnessMeasurements {
  integratedLufs: number | null;
  momentaryLufsMax: number | null;
  shortTermLufsMax: number | null;
  loudnessRangeLu: number | null;
  truePeakDbtp: number | null;
}

export interface StandardsLoudnessAnalyzer {
  readonly implementationId: string;

  /**
   * Production implementations must document conformance/evaluation against
   * the relevant ITU-R BS.1770 / EBU test material.
   */
  analyze(input: {
    channels: Float32Array[];
    sampleRate: number;
  }): Promise<LoudnessMeasurements>;
}

/**
 * Deliberately returns "not measured".
 * Poietek must never substitute sample peak or RMS and label it LUFS/true peak.
 */
export class UnavailableStandardsLoudnessAnalyzer
  implements StandardsLoudnessAnalyzer
{
  readonly implementationId = "unavailable";

  async analyze(): Promise<LoudnessMeasurements> {
    return {
      integratedLufs: null,
      momentaryLufsMax: null,
      shortTermLufsMax: null,
      loudnessRangeLu: null,
      truePeakDbtp: null,
    };
  }
}
