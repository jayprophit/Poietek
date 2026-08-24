export interface AssetStore {
  put(assetId: string, blob: Blob): Promise<void>;
  get(assetId: string): Promise<Blob | null>;
  has(assetId: string): Promise<boolean>;
  remove(assetId: string): Promise<void>;
}
