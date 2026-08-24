"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetAudioResolver = void 0;
class AssetAudioResolver {
    assetStore;
    context;
    cache = new Map();
    constructor(assetStore, context) {
        this.assetStore = assetStore;
        this.context = context;
    }
    async resolve(assetId) {
        const cached = this.cache.get(assetId);
        if (cached)
            return cached;
        const blob = await this.assetStore.get(assetId);
        if (!blob)
            throw new Error(`Missing audio asset ${assetId}.`);
        const buffer = await this.context.decodeAudioData((await blob.arrayBuffer()).slice(0));
        this.cache.set(assetId, buffer);
        return buffer;
    }
    clear() {
        this.cache.clear();
    }
}
exports.AssetAudioResolver = AssetAudioResolver;
