"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WavTimelineExportService = void 0;
const WavPcmEncoder_1 = require("./WavPcmEncoder");
class WavTimelineExportService {
    renderer;
    constructor(renderer) {
        this.renderer = renderer;
    }
    getCapability() {
        return this.renderer.getCapability();
    }
    async export(project, options = {}) {
        const rendered = await this.renderer.render(project, {
            sampleRate: options.sampleRate,
            channelCount: options.channelCount,
            tailSeconds: options.tailSeconds,
            signal: options.signal,
            onProgress: (detail) => options.onProgress?.({ phase: "render", detail }),
        });
        const channels = Array.from({ length: rendered.audioBuffer.numberOfChannels }, (_, channel) => rendered.audioBuffer.getChannelData(channel));
        const encoded = await (0, WavPcmEncoder_1.encodeWavPcm16)({ sampleRate: rendered.audioBuffer.sampleRate, channels }, {
            signal: options.signal,
            onProgress: (detail) => options.onProgress?.({ phase: "encode", detail }),
        });
        return {
            ...encoded,
            fileName: options.fileName ?? safeWavFileName(project.title),
            renderScope: rendered.renderScope,
            renderLimitations: rendered.limitations,
        };
    }
}
exports.WavTimelineExportService = WavTimelineExportService;
function safeWavFileName(projectTitle) {
    const base = projectTitle
        .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
        .replace(/[. ]+$/g, "")
        .trim();
    return `${base || "Poietek Export"}.wav`;
}
