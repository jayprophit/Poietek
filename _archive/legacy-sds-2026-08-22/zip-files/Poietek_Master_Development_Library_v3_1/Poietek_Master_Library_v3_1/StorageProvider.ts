export type StorageProviderKind =
  | "local"
  | "cloud_drive"
  | "object_storage"
  | "git_forge"
  | "webdav"
  | "model_hub"
  | "custom";

export interface StorageProviderCapabilities {
  folders: boolean;
  resumableUpload: boolean;
  multipartUpload: boolean;
  rangeRead: boolean;
  streaming: boolean;
  shareLinks: boolean;
  teamAcl: boolean;
  changeFeed: boolean;
  objectVersioning: boolean;
  gitSemantics: boolean;
  modelRegistry: boolean;
  maxSingleObjectBytes?: number;
}

export interface StorageObjectRef {
  providerId: string;
  locator: string;
  etag?: string;
  contentHash?: string;
  byteLength?: number;
}

export interface UploadRequest {
  sourceAssetId: string;
  sourceLocalPathOrHandle?: unknown;
  destinationFolder?: string;
  objectName: string;
  byteLength: number;
  contentHash: string;
  mimeType?: string;
}

export interface UploadProgress {
  bytesTransferred: number;
  byteLength: number;
  state: "queued" | "uploading" | "verifying" | "completed" | "failed" | "cancelled";
}

export interface StorageProvider {
  readonly id: string;
  readonly kind: StorageProviderKind;
  readonly displayName: string;

  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): Promise<boolean>;
  getCapabilities(): Promise<StorageProviderCapabilities>;
  getQuota(): Promise<{ usedBytes?: number; totalBytes?: number }>;

  stat(ref: StorageObjectRef): Promise<StorageObjectRef>;
  list(folder?: string): Promise<StorageObjectRef[]>;
  upload(request: UploadRequest, onProgress?: (p: UploadProgress) => void): Promise<StorageObjectRef>;
  download(ref: StorageObjectRef): Promise<ReadableStream<Uint8Array>>;
  downloadRange?(ref: StorageObjectRef, start: number, endExclusive: number): Promise<Uint8Array>;
  remove(ref: StorageObjectRef): Promise<void>;
  move?(ref: StorageObjectRef, destination: string): Promise<StorageObjectRef>;
  copy?(ref: StorageObjectRef, destination: string): Promise<StorageObjectRef>;
  createShareReference?(ref: StorageObjectRef): Promise<string>;
  revokeShareReference?(shareRef: string): Promise<void>;
}
