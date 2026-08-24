"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WavEncodingCancelledError = void 0;
exports.encodeWavPcm16 = encodeWavPcm16;
class WavEncodingCancelledError extends Error {
    code = "WAV_ENCODING_CANCELLED";
    constructor() {
        super("WAV encoding was cancelled.");
        this.name = "WavEncodingCancelledError";
    }
}
exports.WavEncodingCancelledError = WavEncodingCancelledError;
/**
 * Encode already-rendered floating-point PCM as 16-bit little-endian RIFF/WAVE.
 * This function never resamples, normalizes, dithers, limits, or changes the
 * channel layout. Those behaviors must happen explicitly before encoding.
 */
async function encodeWavPcm16(source, options = {}) {
    assertPcmSource(source);
    const frameCount = source.channels[0].length;
    const channelCount = source.channels.length;
    const bytesPerSample = 2;
    const dataBytes = frameCount * channelCount * bytesPerSample;
    const riffPayloadBytes = 36 + dataBytes;
    if (!Number.isSafeInteger(dataBytes) || riffPayloadBytes > 0xffff_ffff) {
        throw new RangeError("The rendered audio is too large for the 32-bit RIFF/WAVE container.");
    }
    const framesPerChunk = options.framesPerChunk ?? 16_384;
    if (!Number.isInteger(framesPerChunk) || framesPerChunk <= 0) {
        throw new RangeError("framesPerChunk must be a positive integer.");
    }
    throwIfCancelled(options.signal);
    const output = new ArrayBuffer(44 + dataBytes);
    const view = new DataView(output);
    writeWavHeader(view, source.sampleRate, channelCount, frameCount);
    let byteOffset = 44;
    let clippedSampleCount = 0;
    let replacedNonFiniteSampleCount = 0;
    const yieldControl = options.yieldControl ?? defaultYieldControl;
    for (let firstFrame = 0; firstFrame < frameCount; firstFrame += framesPerChunk) {
        throwIfCancelled(options.signal);
        const lastFrame = Math.min(frameCount, firstFrame + framesPerChunk);
        for (let frame = firstFrame; frame < lastFrame; frame += 1) {
            for (let channel = 0; channel < channelCount; channel += 1) {
                let sample = source.channels[channel][frame];
                if (!Number.isFinite(sample)) {
                    sample = 0;
                    replacedNonFiniteSampleCount += 1;
                }
                else if (sample > 1 || sample < -1) {
                    sample = Math.max(-1, Math.min(1, sample));
                    clippedSampleCount += 1;
                }
                const signedSample = sample < 0 ? Math.round(sample * 32_768) : Math.round(sample * 32_767);
                view.setInt16(byteOffset, signedSample, true);
                byteOffset += bytesPerSample;
            }
        }
        options.onProgress?.({
            phase: lastFrame === frameCount ? "complete" : "encoding",
            completedFrames: lastFrame,
            totalFrames: frameCount,
            ratio: frameCount === 0 ? 1 : lastFrame / frameCount,
        });
        if (lastFrame < frameCount)
            await yieldControl();
    }
    if (frameCount === 0) {
        options.onProgress?.({
            phase: "complete",
            completedFrames: 0,
            totalFrames: 0,
            ratio: 1,
        });
    }
    throwIfCancelled(options.signal);
    const format = {
        container: "wav",
        codec: "linear_pcm",
        bitDepth: 16,
        endianness: "little",
        sampleRate: source.sampleRate,
        channelCount,
        interleaved: true,
        normalization: "none",
        dither: "none",
        sampleConversion: "clamp_to_unit_range",
        nonFiniteSampleHandling: "replace_with_silence",
    };
    return {
        blob: new Blob([output], { type: "audio/wav" }),
        format,
        frameCount,
        durationSeconds: frameCount / source.sampleRate,
        clippedSampleCount,
        replacedNonFiniteSampleCount,
    };
}
function assertPcmSource(source) {
    if (!Number.isInteger(source.sampleRate) || source.sampleRate < 8_000 || source.sampleRate > 384_000) {
        throw new RangeError("PCM sampleRate must be an integer from 8000 to 384000 Hz.");
    }
    if (source.channels.length !== 1 && source.channels.length !== 2) {
        throw new RangeError("PCM WAV export currently supports explicit mono or stereo sources only.");
    }
    const frameCount = source.channels[0].length;
    for (const channel of source.channels) {
        if (!(channel instanceof Float32Array)) {
            throw new TypeError("Every PCM channel must be a Float32Array.");
        }
        if (channel.length !== frameCount) {
            throw new RangeError("Every PCM channel must contain the same frame count.");
        }
    }
}
function writeWavHeader(view, sampleRate, channelCount, frameCount) {
    const bytesPerSample = 2;
    const blockAlign = channelCount * bytesPerSample;
    const dataBytes = frameCount * blockAlign;
    writeAscii(view, 0, "RIFF");
    view.setUint32(4, 36 + dataBytes, true);
    writeAscii(view, 8, "WAVE");
    writeAscii(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channelCount, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true);
    writeAscii(view, 36, "data");
    view.setUint32(40, dataBytes, true);
}
function writeAscii(view, offset, value) {
    for (let index = 0; index < value.length; index += 1) {
        view.setUint8(offset + index, value.charCodeAt(index));
    }
}
function throwIfCancelled(signal) {
    if (signal?.aborted)
        throw new WavEncodingCancelledError();
}
function defaultYieldControl() {
    return new Promise((resolve) => setTimeout(resolve, 0));
}
