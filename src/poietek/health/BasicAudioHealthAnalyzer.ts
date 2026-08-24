export interface ChannelHealth {
  samplePeakDbfs: number;
  rmsDbfs: number;
  dcOffset: number;
  clippedSampleCount: number;
  nearClipEventCount: number;
  crestFactorDb: number;
}

export interface AudioHealthResult {
  channels: ChannelHealth[];
  combinedSamplePeakDbfs: number;
  stereoCorrelation: number | null;
  status: "good" | "advisory" | "warning" | "critical";
  recommendations: string[];
}

function db(value: number): number {
  return value <= 0 ? -Infinity : 20 * Math.log10(value);
}

function analyzeChannel(samples: Float32Array): ChannelHealth {
  let peak = 0;
  let squares = 0;
  let mean = 0;
  let clipped = 0;
  let nearClipEventCount = 0;
  let near = false;
  const nearClip = Math.pow(10, -1 / 20);

  for (const sample of samples) {
    const absolute = Math.abs(sample);
    peak = Math.max(peak, absolute);
    squares += sample * sample;
    mean += sample;

    if (absolute >= 1) clipped += 1;
    if (absolute >= nearClip && !near) nearClipEventCount += 1;
    near = absolute >= nearClip;
  }

  const rms = samples.length ? Math.sqrt(squares / samples.length) : 0;
  const peakDb = db(peak);
  const rmsDb = db(rms);

  return {
    samplePeakDbfs: peakDb,
    rmsDbfs: rmsDb,
    dcOffset: samples.length ? mean / samples.length : 0,
    clippedSampleCount: clipped,
    nearClipEventCount,
    crestFactorDb:
      Number.isFinite(peakDb) && Number.isFinite(rmsDb) ? peakDb - rmsDb : 0,
  };
}

function correlation(left: Float32Array, right: Float32Array): number | null {
  const length = Math.min(left.length, right.length);
  if (!length) return null;

  let meanL = 0;
  let meanR = 0;
  for (let i = 0; i < length; i += 1) {
    meanL += left[i];
    meanR += right[i];
  }
  meanL /= length;
  meanR /= length;

  let covariance = 0;
  let varianceL = 0;
  let varianceR = 0;

  for (let i = 0; i < length; i += 1) {
    const l = left[i] - meanL;
    const r = right[i] - meanR;
    covariance += l * r;
    varianceL += l * l;
    varianceR += r * r;
  }

  const denominator = Math.sqrt(varianceL * varianceR);
  return denominator ? Math.max(-1, Math.min(1, covariance / denominator)) : null;
}

export function analyzeBasicAudioHealth(
  channels: Float32Array[],
): AudioHealthResult {
  if (!channels.length) throw new Error("At least one channel is required.");

  const results = channels.map(analyzeChannel);
  const peak = Math.max(...results.map((result) => result.samplePeakDbfs));
  const clipped = results.reduce((sum, result) => sum + result.clippedSampleCount, 0);
  const maxDc = Math.max(...results.map((result) => Math.abs(result.dcOffset)));
  const stereoCorrelation =
    channels.length >= 2 ? correlation(channels[0], channels[1]) : null;

  const recommendations: string[] = [];
  let status: AudioHealthResult["status"] = "good";

  if (clipped > 0) {
    status = "critical";
    recommendations.push(
      "Full-scale samples were detected and may indicate digital clipping. Inspect the waveform and lower the analogue/input gain before another take; lowering a later digital fader cannot restore clipped peaks.",
    );
  } else if (peak >= -1) {
    status = "warning";
    recommendations.push(
      "Peak headroom is very small. Lower the input/preamp slightly and retest the loudest expected passage.",
    );
  } else if (peak >= -6) {
    status = "advisory";
    recommendations.push(
      "The recording is healthy but has limited peak headroom. Consider a slightly lower input level for unpredictable sources.",
    );
  }

  if (maxDc > 0.01) {
    status = status === "critical" ? status : "warning";
    recommendations.push("Noticeable DC offset was measured; inspect the input path or preview a non-destructive repair.");
  }

  if (stereoCorrelation !== null && stereoCorrelation < -0.25) {
    status = status === "critical" ? status : "warning";
    recommendations.push("Stereo channels show substantial negative correlation. Check polarity and mono compatibility.");
  }

  if (!recommendations.length) {
    recommendations.push("Basic peak, clipping, DC and stereo-correlation checks look healthy.");
  }

  return {
    channels: results,
    combinedSamplePeakDbfs: peak,
    stereoCorrelation,
    status,
    recommendations,
  };
}
