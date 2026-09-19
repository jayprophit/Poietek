import type { AssetStore } from "../assets/AssetStore";

export class AssetAudioResolver {
  private cache = new Map<string, AudioBuffer>();

  constructor(
    private readonly assetStore: AssetStore,
    private readonly context: BaseAudioContext,
  ) {}

  async resolve(assetId: string): Promise<AudioBuffer> {
    const cached = this.cache.get(assetId);
    if (cached) return cached;

    const blob = await this.assetStore.get(assetId);
    if (!blob) throw new Error(`Missing audio asset ${assetId}.`);

    const buffer = await this.context.decodeAudioData((await blob.arrayBuffer()).slice(0));
    this.cache.set(assetId, buffer);
    return buffer;
  }

  clear(): void {
    this.cache.clear();
  }
}
