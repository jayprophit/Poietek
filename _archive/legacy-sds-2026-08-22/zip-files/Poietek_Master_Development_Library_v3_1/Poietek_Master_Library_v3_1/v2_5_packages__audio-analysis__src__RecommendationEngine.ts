import type {
  BasicAudioHealthMeasurements,
  HealthRecommendation,
} from "./types";

export function basicHealthRecommendations(
  measurements: BasicAudioHealthMeasurements,
): HealthRecommendation[] {
  const recommendations: HealthRecommendation[] = [];

  const dc = Math.max(...measurements.channels.map((c) => Math.abs(c.dcOffset)));
  if (dc > 0.01) {
    recommendations.push({
      id: "dc-offset",
      category: "dc_offset",
      message:
        "A noticeable DC offset was measured. Check the input/interface or preview a non-destructive DC-removal/high-pass repair.",
      confidence: Math.min(1, dc * 20),
      actionMode: "previewable_command",
      proposedCommands: [{ type: "PreviewDcOffsetRemoval" }],
    });
  }

  const correlation = measurements.stereo.correlation;
  if (correlation !== null && correlation < -0.25) {
    recommendations.push({
      id: "negative-stereo-correlation",
      category: "phase",
      message:
        "The stereo channels show substantial negative correlation. Check polarity, stereo processing and mono compatibility before finalizing.",
      confidence: Math.min(0.98, Math.abs(correlation)),
      actionMode: "advice_only",
    });
  }

  const crest = Math.max(...measurements.channels.map((c) => c.crestFactorDb));
  if (crest < 3 && measurements.combinedSamplePeakDbfs > -6) {
    recommendations.push({
      id: "very-low-crest",
      category: "dynamics",
      message:
        "This signal is very dense and close to its peaks. If that is not intentional, inspect limiting/compression rather than simply increasing level.",
      confidence: 0.75,
      actionMode: "advice_only",
    });
  }

  return recommendations;
}
