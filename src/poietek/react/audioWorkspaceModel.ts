import type { WaveformLevel } from "../assets/waveform";
import type { AudioHealthResult } from "../health/BasicAudioHealthAnalyzer";
import type { Asset, PoietekProject } from "../domain/types";
import { ticksToSeconds } from "../timeline/tempo";

export const WAVEFORM_PREVIEW_METADATA_KEY = "poietekWaveformPreview";
export const BASIC_HEALTH_METADATA_KEY = "poietekBasicAudioHealth";

export interface StoredWaveformPreview {
  kind: "poietek.waveform-preview.v1";
  sourceBlockSize: number;
  min: number[];
  max: number[];
}

export interface StoredChannelHealth {
  samplePeakDbfs: number | null;
  rmsDbfs: number | null;
  dcOffset: number;
  clippedSampleCount: number;
  nearClipEventCount: number;
  crestFactorDb: number;
}

export type StoredBasicAudioHealth =
  | {
      kind: "poietek.basic-audio-health.v1";
      availability: "available";
      basis: "decoded-pcm-exact-samples";
      analyzedAt: string;
      status: AudioHealthResult["status"];
      combinedSamplePeakDbfs: number | null;
      stereoCorrelation: number | null;
      channels: StoredChannelHealth[];
      recommendations: string[];
      standards: {
        lufs: "not_measured";
        truePeakDbtp: "not_measured";
      };
    }
  | {
      kind: "poietek.basic-audio-health.v1";
      availability: "unavailable";
      analyzedAt: string;
      reason: string;
      standards: {
        lufs: "not_measured";
        truePeakDbtp: "not_measured";
      };
    };

function boundedSample(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(-1, Math.min(1, value));
}

function finiteMetric(value: number): number | null {
  return Number.isFinite(value) ? value : null;
}

/**
 * Produces a small JSON-safe display cache from real decoded waveform peaks.
 * The preview is deliberately not used for measurement or audio processing.
 */
export function createStoredWaveformPreview(
  levels: WaveformLevel[],
  maxPoints = 1200,
): StoredWaveformPreview | null {
  if (!Number.isInteger(maxPoints) || maxPoints <= 0) {
    throw new Error("maxPoints must be a positive integer.");
  }

  const usable = levels
    .filter(
      (level) =>
        Number.isFinite(level.blockSize) &&
        level.blockSize > 0 &&
        level.min.length > 0 &&
        level.min.length === level.max.length,
    )
    .sort((a, b) => a.blockSize - b.blockSize);

  if (!usable.length) return null;

  const selected =
    usable.find((level) => level.min.length <= maxPoints) ??
    usable[usable.length - 1];

  if (selected.min.length <= maxPoints) {
    return {
      kind: "poietek.waveform-preview.v1",
      sourceBlockSize: selected.blockSize,
      min: Array.from(selected.min, boundedSample),
      max: Array.from(selected.max, boundedSample),
    };
  }

  const reducedMin: number[] = [];
  const reducedMax: number[] = [];
  const samplesPerPoint = selected.min.length / maxPoints;

  for (let point = 0; point < maxPoints; point += 1) {
    const start = Math.floor(point * samplesPerPoint);
    const end = Math.max(start + 1, Math.ceil((point + 1) * samplesPerPoint));
    let minimum = 1;
    let maximum = -1;

    for (let index = start; index < Math.min(end, selected.min.length); index += 1) {
      minimum = Math.min(minimum, boundedSample(selected.min[index]));
      maximum = Math.max(maximum, boundedSample(selected.max[index]));
    }

    reducedMin.push(minimum);
    reducedMax.push(maximum);
  }

  return {
    kind: "poietek.waveform-preview.v1",
    sourceBlockSize: selected.blockSize,
    min: reducedMin,
    max: reducedMax,
  };
}

export function storeBasicAudioHealth(
  result: AudioHealthResult,
  analyzedAt = new Date().toISOString(),
): StoredBasicAudioHealth {
  return {
    kind: "poietek.basic-audio-health.v1",
    availability: "available",
    basis: "decoded-pcm-exact-samples",
    analyzedAt,
    status: result.status,
    combinedSamplePeakDbfs: finiteMetric(result.combinedSamplePeakDbfs),
    stereoCorrelation: result.stereoCorrelation,
    channels: result.channels.map((channel) => ({
      samplePeakDbfs: finiteMetric(channel.samplePeakDbfs),
      rmsDbfs: finiteMetric(channel.rmsDbfs),
      dcOffset: channel.dcOffset,
      clippedSampleCount: channel.clippedSampleCount,
      nearClipEventCount: channel.nearClipEventCount,
      crestFactorDb: channel.crestFactorDb,
    })),
    recommendations: [...result.recommendations],
    standards: { lufs: "not_measured", truePeakDbtp: "not_measured" },
  };
}

export function storeUnavailableBasicAudioHealth(
  reason: string,
  analyzedAt = new Date().toISOString(),
): StoredBasicAudioHealth {
  return {
    kind: "poietek.basic-audio-health.v1",
    availability: "unavailable",
    analyzedAt,
    reason,
    standards: { lufs: "not_measured", truePeakDbtp: "not_measured" },
  };
}

export function readWaveformPreview(asset: Asset): StoredWaveformPreview | null {
  const value = asset.metadata[WAVEFORM_PREVIEW_METADATA_KEY];
  if (!value || typeof value !== "object") return null;

  const candidate = value as Partial<StoredWaveformPreview>;
  if (
    candidate.kind !== "poietek.waveform-preview.v1" ||
    !Number.isFinite(candidate.sourceBlockSize) ||
    !Array.isArray(candidate.min) ||
    !Array.isArray(candidate.max) ||
    candidate.min.length === 0 ||
    candidate.min.length !== candidate.max.length ||
    !candidate.min.every(Number.isFinite) ||
    !candidate.max.every(Number.isFinite)
  ) {
    return null;
  }

  return candidate as StoredWaveformPreview;
}

export function readBasicAudioHealth(asset: Asset): StoredBasicAudioHealth | null {
  const value = asset.metadata[BASIC_HEALTH_METADATA_KEY];
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<StoredBasicAudioHealth>;
  if (candidate.kind !== "poietek.basic-audio-health.v1") return null;
  if (candidate.availability === "unavailable" && typeof candidate.reason === "string") {
    return candidate as StoredBasicAudioHealth;
  }
  if (
    candidate.availability === "available" &&
    typeof candidate.status === "string" &&
    Array.isArray(candidate.channels) &&
    Array.isArray(candidate.recommendations)
  ) {
    return candidate as StoredBasicAudioHealth;
  }
  return null;
}

export function projectDurationSeconds(project: PoietekProject): number {
  let duration = 0;
  for (const track of project.tracks) {
    for (const clip of track.clips) {
      duration = Math.max(
        duration,
        ticksToSeconds(
          clip.startTick + clip.durationTicks,
          project.tempoMap,
          project.settings.ppq,
        ),
      );
    }
  }
  return duration;
}

export function formatClock(seconds: number): string {
  const safe = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const wholeMinutes = Math.floor(safe / 60);
  const remainingSeconds = safe - wholeMinutes * 60;
  return `${wholeMinutes}:${remainingSeconds.toFixed(2).padStart(5, "0")}`;
}

export function formatDb(value: number | null): string {
  if (value === null) return "−∞ dBFS";
  return `${value.toFixed(1)} dBFS`;
}
