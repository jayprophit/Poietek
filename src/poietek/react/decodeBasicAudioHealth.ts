import {
  analyzeBasicAudioHealth,
  type AudioHealthResult,
} from "../health/BasicAudioHealthAnalyzer";

/**
 * Runs the basic, non-standards health pass over the exact decoded PCM samples.
 * This intentionally makes no LUFS or dBTP claim.
 */
export async function decodeBasicAudioHealth(blob: Blob): Promise<AudioHealthResult> {
  if (typeof AudioContext === "undefined") {
    throw new Error("Web Audio decoding is unavailable on this platform.");
  }

  const context = new AudioContext();
  try {
    const decoded = await context.decodeAudioData((await blob.arrayBuffer()).slice(0));
    const channels = Array.from(
      { length: decoded.numberOfChannels },
      (_, index) => decoded.getChannelData(index),
    );
    return analyzeBasicAudioHealth(channels);
  } finally {
    await context.close().catch(() => undefined);
  }
}
