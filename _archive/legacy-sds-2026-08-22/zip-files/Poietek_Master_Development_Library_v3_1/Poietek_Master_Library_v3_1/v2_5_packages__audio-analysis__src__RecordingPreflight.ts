import type { BasicAudioHealthMeasurements, HealthRecommendation } from "./types";

export interface RecordingPreflightProfile {
  preferredPeakMaxDbfs: number;
  advisoryPeakDbfs: number;
  criticalPeakDbfs: number;
  minimumObservationSeconds: number;
}

export const CONSERVATIVE_24_BIT_CAPTURE: RecordingPreflightProfile = {
  // Poietek engineering defaults, not a universal standard.
  preferredPeakMaxDbfs: -12,
  advisoryPeakDbfs: -6,
  criticalPeakDbfs: -1,
  minimumObservationSeconds: 10,
};

export function recommendRecordingInput(
  measurements: BasicAudioHealthMeasurements,
  observedSeconds: number,
  profile = CONSERVATIVE_24_BIT_CAPTURE,
): HealthRecommendation[] {
  const recommendations: HealthRecommendation[] = [];
  const peak = measurements.combinedSamplePeakDbfs;

  if (observedSeconds < profile.minimumObservationSeconds) {
    recommendations.push({
      id: "observe-longer",
      category: "input_gain",
      message:
        "Keep playing/singing at the loudest expected level so Poietek can measure a representative peak before recommending gain.",
      confidence: 0.95,
      actionMode: "requires_more_measurement",
    });
    return recommendations;
  }

  const clipped = measurements.channels.some(
    (channel) => channel.clippedSampleCount > 0,
  );

  if (clipped) {
    recommendations.push({
      id: "input-clipping",
      category: "clipping",
      message:
        "Clipped samples were detected. Lower the analogue preamp/input gain before recording another take; reducing a digital fader after clipping will not restore the lost peaks.",
      confidence: 0.99,
      actionMode: "manual_hardware_action",
    });
    return recommendations;
  }

  if (peak >= profile.criticalPeakDbfs) {
    recommendations.push({
      id: "input-critical-headroom",
      category: "input_gain",
      message:
        "Input is extremely close to full scale. Lower the preamp/input gain and retest the loudest passage.",
      confidence: 0.98,
      actionMode: "manual_hardware_action",
    });
  } else if (peak >= profile.advisoryPeakDbfs) {
    recommendations.push({
      id: "input-low-headroom",
      category: "input_gain",
      message:
        "The source is healthy but has limited headroom for unexpected peaks. Consider lowering the analogue input gain slightly for a safer recording.",
      confidence: 0.9,
      actionMode: "manual_hardware_action",
    });
  } else if (peak <= -30) {
    recommendations.push({
      id: "input-very-low",
      category: "input_gain",
      message:
        "The captured level is quite low. Check microphone distance, pad settings and preamp gain, then compare the source level with the measured noise floor before increasing gain.",
      confidence: 0.75,
      actionMode: "manual_hardware_action",
    });
  } else {
    recommendations.push({
      id: "input-headroom-good",
      category: "input_gain",
      message:
        "The observed peaks leave useful digital headroom. Keep the performer at the expected loudness and check the noise floor before committing to the take.",
      confidence: 0.85,
      actionMode: "advice_only",
    });
  }

  return recommendations;
}
