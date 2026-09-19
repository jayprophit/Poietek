export interface StoredAsset {
  assetId: string;
  contentHash: string;
  originalName: string;
  mimeType: string;
  byteLength: number;
}

export interface AssetStore {
  put(assetId: string, file: Blob, originalName: string): Promise<StoredAsset>;
  get(assetId: string): Promise<Blob | null>;
  remove(assetId: string): Promise<void>;
  has(assetId: string): Promise<boolean>;
}
