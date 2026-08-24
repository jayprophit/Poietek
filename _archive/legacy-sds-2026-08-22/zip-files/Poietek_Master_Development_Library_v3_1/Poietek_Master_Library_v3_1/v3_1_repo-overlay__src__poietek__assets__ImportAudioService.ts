import type { Asset } from "../domain/types";
import { newId } from "../domain/ids";
import type { AssetStore } from "./AssetStore";
import { sha256Blob } from "./sha256";
import { buildWaveformPyramid, type WaveformLevel } from "./waveform";

export interface ImportedAudio {
  asset: Asset;
  waveform: WaveformLevel[];
}

export class ImportAudioService {
  constructor(
    private readonly assetStore: AssetStore,
    private readonly audioContextFactory: () => AudioContext = () => new AudioContext(),
  ) {}

  async import(file: Blob & { name?: string; type: string }): Promise<ImportedAudio> {
    const contentHash = await sha256Blob(file);
    const assetId = newId("ast");
    const context = this.audioContextFactory();

    try {
      const decoded = await context.decodeAudioData((await file.arrayBuffer()).slice(0));
      const channels = Array.from(
        { length: decoded.numberOfChannels },
        (_, index) => decoded.getChannelData(index).slice(),
      );

      await this.assetStore.put(assetId, file);

      const asset: Asset = {
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
        metadata: {},
      };

      return {
        asset,
        waveform: buildWaveformPyramid(channels),
      };
    } finally {
      await context.close().catch(() => undefined);
    }
  }
}
