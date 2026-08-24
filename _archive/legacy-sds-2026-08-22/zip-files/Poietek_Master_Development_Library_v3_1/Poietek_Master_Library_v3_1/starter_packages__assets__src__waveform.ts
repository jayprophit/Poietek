export interface WaveformPeakLevel {
  blockSize: number;
  mins: Float32Array;
  maxs: Float32Array;
}

export function buildPeakLevel(samples: Float32Array, blockSize: number): WaveformPeakLevel {
  if (blockSize <= 0 || !Number.isInteger(blockSize)) {
    throw new Error("blockSize must be a positive integer.");
  }

  const blocks = Math.ceil(samples.length / blockSize);
  const mins = new Float32Array(blocks);
  const maxs = new Float32Array(blocks);

  for (let block = 0; block < blocks; block += 1) {
    const start = block * blockSize;
    const end = Math.min(samples.length, start + blockSize);

    let min = 1;
    let max = -1;

    for (let i = start; i < end; i += 1) {
      const value = samples[i];
      if (value < min) min = value;
      if (value > max) max = value;
    }

    mins[block] = min;
    maxs[block] = max;
  }

  return { blockSize, mins, maxs };
}

export function buildPeakPyramid(
  samples: Float32Array,
  blockSizes = [64, 256, 1024, 4096, 16384],
): WaveformPeakLevel[] {
  return blockSizes.map((blockSize) => buildPeakLevel(samples, blockSize));
}
