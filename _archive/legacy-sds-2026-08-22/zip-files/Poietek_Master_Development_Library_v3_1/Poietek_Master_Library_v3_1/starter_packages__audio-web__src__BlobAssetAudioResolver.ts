import type { AssetStore } from "../../assets/src/AssetStore";
import type { AssetAudioResolver } from "../../audio-contracts/src/AudioBackend";

export class BlobAssetAudioResolver implements AssetAudioResolver {
  private readonly cache = new Map<string, AudioBuffer>();

  constructor(private readonly assetStore: AssetStore) {}

  async resolveAudioBuffer(assetId: string, context: BaseAudioContext): Promise<AudioBuffer> {
    const cached = this.cache.get(assetId);
    if (cached) return cached;

    const blob = await this.assetStore.get(assetId);
    if (!blob) throw new Error(`ASSET_MISSING:${assetId}`);

    const arrayBuffer = await blob.arrayBuffer();

    if (!(context instanceof AudioContext || context instanceof OfflineAudioContext)) {
      throw new Error("Unsupported audio context.");
    }

    const decoded = await context.decodeAudioData(arrayBuffer.slice(0));
    this.cache.set(assetId, decoded);
    return decoded;
  }

  clear(): void {
    this.cache.clear();
  }
}
