"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportAudioService = void 0;
const ids_1 = require("../domain/ids");
const sha256_1 = require("./sha256");
const waveform_1 = require("./waveform");
class ImportAudioService {
    assetStore;
    audioContextFactory;
    constructor(assetStore, audioContextFactory = () => new AudioContext()) {
        this.assetStore = assetStore;
        this.audioContextFactory = audioContextFactory;
    }
    async import(file) {
        const contentHash = await (0, sha256_1.sha256Blob)(file);
        const assetId = (0, ids_1.newId)("ast");
        let context = null;
        try {
            context = this.audioContextFactory();
            const decoded = await context.decodeAudioData((await file.arrayBuffer()).slice(0));
            const channels = Array.from({ length: decoded.numberOfChannels }, (_, index) => decoded.getChannelData(index).slice());
            await this.assetStore.put(assetId, file);
            const asset = {
                id: assetId,
                mediaType: "audio",
                contentHash,
                originalName: file.name ?? "Imported Audio",
                mimeType: file.type || null,
                byteLength: file.size,
                durationSeconds: decoded.duration,
                sampleRate: decoded.sampleRate,
                channels: decoded.numberOfChannels,
                createdAt: new Date().toISOString(),
                tags: [],
                metadata: {
                    // decodeAudioData reports the decoded AudioBuffer rate, which may be
                    // resampled by the browser and is not guaranteed to be source-file metadata.
                    sampleRateBasis: "decoded_audio_buffer",
                },
            };
            return {
                asset,
                waveform: (0, waveform_1.buildWaveformPyramid)(channels),
            };
        }
        finally {
            await context?.close().catch(() => undefined);
        }
    }
}
exports.ImportAudioService = ImportAudioService;
