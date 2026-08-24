"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildWaveformLevel = buildWaveformLevel;
exports.buildWaveformPyramid = buildWaveformPyramid;
function buildWaveformLevel(channels, blockSize) {
    if (!channels.length)
        throw new Error("At least one channel is required.");
    if (blockSize <= 0)
        throw new Error("blockSize must be positive.");
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
            for (const channel of channels) {
                if (i >= channel.length)
                    continue;
                const sample = channel[i];
                if (sample < blockMin)
                    blockMin = sample;
                if (sample > blockMax)
                    blockMax = sample;
            }
        }
        min[block] = blockMin;
        max[block] = blockMax;
    }
    return { blockSize, min, max };
}
function buildWaveformPyramid(channels, blockSizes = [64, 256, 1024, 4096, 16384]) {
    return blockSizes.map((blockSize) => buildWaveformLevel(channels, blockSize));
}
