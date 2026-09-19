export interface WaveformLevel {
  blockSize: number;
  min: Float32Array;
  max: Float32Array;
}

export function buildWaveformLevel(
  channels: Float32Array[],
  blockSize: number,
): WaveformLevel {
  if (!channels.length) throw new Error("At least one channel is required.");
  if (blockSize <= 0) throw new Error("blockSize must be positive.");

  const length = Math.max(...channels.map((channel) => channel.length));
  const blocks = Math.ceil(length / blockSize);
  const min = new Float32Array(blocks);
  const max = new Float32Array(blocks);

  for (let block = 0; block < blocks; block += 1) {
    let blockMin = 1;
    let blockMax = -1;
    const start = block * blockSize;
    const end = Math.min(length, start + blockSize);

    for (let i = start; i < end; i += 1) {
      let mixed = 0;
      let contributing = 0;
      for (const channel of channels) {
        if (i < channel.length) {
          mixed += channel[i];
          contributing += 1;
        }
      }
      const sample = contributing ? mixed / contributing : 0;
      if (sample < blockMin) blockMin = sample;
      if (sample > blockMax) blockMax = sample;
    }

    min[block] = blockMin;
    max[block] = blockMax;
  }

  return { blockSize, min, max };
}

export function buildWaveformPyramid(
  channels: Float32Array[],
  blockSizes = [64, 256, 1024, 4096, 16384],
): WaveformLevel[] {
  return blockSizes.map((blockSize) => buildWaveformLevel(channels, blockSize));
}
