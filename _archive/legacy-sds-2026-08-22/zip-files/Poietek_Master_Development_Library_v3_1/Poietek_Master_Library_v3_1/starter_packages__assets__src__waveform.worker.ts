import { buildPeakPyramid } from "./waveform";

interface WaveformRequest {
  id: string;
  samples: Float32Array;
  blockSizes?: number[];
}

self.onmessage = (event: MessageEvent<WaveformRequest>) => {
  const { id, samples, blockSizes } = event.data;

  try {
    const levels = buildPeakPyramid(samples, blockSizes);
    self.postMessage({ id, ok: true, levels });
  } catch (error) {
    self.postMessage({
      id,
      ok: false,
      error: error instanceof Error ? error.message : "Unknown waveform worker error.",
    });
  }
};
