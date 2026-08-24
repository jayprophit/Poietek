import type { PoietekProject } from "../domain/types";
import {
  type OfflineTimelineRenderCapability,
  type OfflineTimelineRenderProgress,
  WebOfflineTimelineRenderer,
} from "./WebOfflineTimelineRenderer";
import {
  encodeWavPcm16,
  type WavEncodingProgress,
  type WavPcm16Result,
} from "./WavPcmEncoder";

export interface WavTimelineExportProgress {
  phase: "render" | "encode";
  detail: OfflineTimelineRenderProgress | WavEncodingProgress;
}

export interface WavTimelineExportOptions {
  sampleRate?: number;
  channelCount?: 1 | 2;
  tailSeconds?: number;
  signal?: AbortSignal;
  fileName?: string;
  onProgress?: (progress: WavTimelineExportProgress) => void;
}

export interface WavTimelineExportResult extends WavPcm16Result {
  fileName: string;
  renderScope: "canonical_audio_clips_and_track_mixer_only";
  renderLimitations: string[];
}

export class WavTimelineExportService {
  constructor(private readonly renderer: WebOfflineTimelineRenderer) {}

  getCapability(): OfflineTimelineRenderCapability {
    return this.renderer.getCapability();
  }

  async export(
    project: PoietekProject,
    options: WavTimelineExportOptions = {},
  ): Promise<WavTimelineExportResult> {
    const rendered = await this.renderer.render(project, {
      sampleRate: options.sampleRate,
      channelCount: options.channelCount,
      tailSeconds: options.tailSeconds,
      signal: options.signal,
      onProgress: (detail) => options.onProgress?.({ phase: "render", detail }),
    });

    const channels = Array.from(
      { length: rendered.audioBuffer.numberOfChannels },
      (_, channel) => rendered.audioBuffer.getChannelData(channel),
    );
    const encoded = await encodeWavPcm16(
      { sampleRate: rendered.audioBuffer.sampleRate, channels },
      {
        signal: options.signal,
        onProgress: (detail) => options.onProgress?.({ phase: "encode", detail }),
      },
    );

    return {
      ...encoded,
      fileName: options.fileName ?? safeWavFileName(project.title),
      renderScope: rendered.renderScope,
      renderLimitations: rendered.limitations,
    };
  }
}

function safeWavFileName(projectTitle: string): string {
  const base = projectTitle
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .replace(/[. ]+$/g, "")
    .trim();
  return `${base || "Poietek Export"}.wav`;
}
