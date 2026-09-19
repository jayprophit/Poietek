import type {
  BasicAudioHealthMeasurements,
  ChannelAnalysis,
} from "./types";

function linearToDb(value: number): number {
  if (value <= 0) return -Infinity;
  return 20 * Math.log10(value);
}

function analyzeChannel(samples: Float32Array): ChannelAnalysis {
  if (samples.length === 0) {
    return {
      samplePeakLinear: 0,
      samplePeakDbfs: -Infinity,
      rmsLinear: 0,
      rmsDbfs: -Infinity,
      dcOffset: 0,
      clippedSampleCount: 0,
      nearClipEventCount: 0,
      crestFactorDb: 0,
      silenceRatio: 1,
    };
  }

  let peak = 0;
  let sumSquares = 0;
  let sum = 0;
  let clipped = 0;
  let nearClipEvents = 0;
  let nearClipActive = false;
  let silent = 0;

  // Basic diagnostic thresholds.
  // Standards-compliant true peak/LUFS are implemented by dedicated analyzers.
  const nearClip = Math.pow(10, -1 / 20);
  const silence = Math.pow(10, -72 / 20);

  for (const sample of samples) {
    const abs = Math.abs(sample);
    if (abs > peak) peak = abs;
    sumSquares += sample * sample;
    sum += sample;

    if (abs >= 1) clipped += 1;

    if (abs >= nearClip) {
      if (!nearClipActive) nearClipEvents += 1;
      nearClipActive = true;
    } else {
      nearClipActive = false;
    }

    if (abs < silence) silent += 1;
  }

  const rms = Math.sqrt(sumSquares / samples.length);
  const peakDb = linearToDb(peak);
  const rmsDb = linearToDb(rms);

  return {
    samplePeakLinear: peak,
    samplePeakDbfs: peakDb,
    rmsLinear: rms,
    rmsDbfs: rmsDb,
    dcOffset: sum / samples.length,
    clippedSampleCount: clipped,
    nearClipEventCount: nearClipEvents,
    crestFactorDb:
      Number.isFinite(peakDb) && Number.isFinite(rmsDb) ? peakDb - rmsDb : 0,
    silenceRatio: silent / samples.length,
  };
}

function stereoCorrelation(
  left: Float32Array,
  right: Float32Array,
): number | null {
  const length = Math.min(left.length, right.length);
  if (length === 0) return null;

  let sumL = 0;
  let sumR = 0;

  for (let i = 0; i < length; i += 1) {
    sumL += left[i];
    sumR += right[i];
  }

  const meanL = sumL / length;
  const meanR = sumR / length;

  let covariance = 0;
  let varianceL = 0;
  let varianceR = 0;

  for (let i = 0; i < length; i += 1) {
    const dl = left[i] - meanL;
    const dr = right[i] - meanR;
    covariance += dl * dr;
    varianceL += dl * dl;
    varianceR += dr * dr;
  }

  const denominator = Math.sqrt(varianceL * varianceR);
  if (denominator === 0) return null;

  return Math.max(-1, Math.min(1, covariance / denominator));
}

export function analyzeBasicAudioHealth(
  channels: Float32Array[],
): BasicAudioHealthMeasurements {
  if (channels.length === 0) {
    throw new Error("At least one audio channel is required.");
  }

  const channelAnalyses = channels.map(analyzeChannel);

  const combinedSamplePeakDbfs = Math.max(
    ...channelAnalyses.map((channel) => channel.samplePeakDbfs),
  );

  const meanSquareAcrossChannels =
    channelAnalyses.reduce(
      (sum, channel) => sum + channel.rmsLinear * channel.rmsLinear,
      0,
    ) / channelAnalyses.length;

  const combinedRmsDbfs = linearToDb(Math.sqrt(meanSquareAcrossChannels));

  return {
    channels: channelAnalyses,
    combinedSamplePeakDbfs,
    combinedRmsDbfs,
    stereo: {
      correlation:
        channels.length >= 2 ? stereoCorrelation(channels[0], channels[1]) : null,
    },
  };
}
