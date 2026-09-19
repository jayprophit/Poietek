import type { AssetStore, StoredAsset } from "./AssetStore";
import { sha256Blob } from "./sha256";

const FALLBACK_DB = "poietek-assets-v1";
const FALLBACK_STORE = "asset-blobs";

interface FallbackRecord {
  id: string;
  blob: Blob;
  originalName: string;
  contentHash: string;
}

function hasOpfs(): boolean {
  return typeof navigator !== "undefined" &&
    "storage" in navigator &&
    typeof navigator.storage.getDirectory === "function";
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed."));
  });
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB transaction failed."));
    tx.onabort = () => reject(tx.error ?? new Error("IndexedDB transaction aborted."));
  });
}

async function openFallbackDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(FALLBACK_DB, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(FALLBACK_STORE)) {
        db.createObjectStore(FALLBACK_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open asset DB."));
  });
}

function safeFilename(assetId: string): string {
  return `${assetId}.bin`;
}

export class WebLocalAssetStore implements AssetStore {
  async put(assetId: string, file: Blob, originalName: string): Promise<StoredAsset> {
    const contentHash = await sha256Blob(file);

    if (hasOpfs()) {
      const root = await navigator.storage.getDirectory();
      const assetsDir = await root.getDirectoryHandle("assets", { create: true });
      const handle = await assetsDir.getFileHandle(safeFilename(assetId), { create: true });
      const writable = await handle.createWritable();
      try {
        await writable.write(file);
      } finally {
        await writable.close();
      }
    } else {
      const db = await openFallbackDb();
      try {
        const tx = db.transaction(FALLBACK_STORE, "readwrite");
        tx.objectStore(FALLBACK_STORE).put({
          id: assetId,
          blob: file,
          originalName,
          contentHash,
        } satisfies FallbackRecord);
        await transactionDone(tx);
      } finally {
        db.close();
      }
    }

    return {
      assetId,
      contentHash,
      originalName,
      mimeType: file.type || "application/octet-stream",
      byteLength: file.size,
    };
  }

  async get(assetId: string): Promise<Blob | null> {
    if (hasOpfs()) {
      try {
        const root = await navigator.storage.getDirectory();
        const assetsDir = await root.getDirectoryHandle("assets");
        const handle = await assetsDir.getFileHandle(safeFilename(assetId));
        return await handle.getFile();
      } catch (error) {
        if (error instanceof DOMException && error.name === "NotFoundError") return null;
        throw error;
      }
    }

    const db = await openFallbackDb();
    try {
      const tx = db.transaction(FALLBACK_STORE, "readonly");
      const record = await requestToPromise(
        tx.objectStore(FALLBACK_STORE).get(assetId) as IDBRequest<FallbackRecord | undefined>,
      );
      await transactionDone(tx);
      return record?.blob ?? null;
    } finally {
      db.close();
    }
  }

  async remove(assetId: string): Promise<void> {
    if (hasOpfs()) {
      try {
        const root = await navigator.storage.getDirectory();
        const assetsDir = await root.getDirectoryHandle("assets");
        await assetsDir.removeEntry(safeFilename(assetId));
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "NotFoundError")) throw error;
      }
      return;
    }

    const db = await openFallbackDb();
    try {
      const tx = db.transaction(FALLBACK_STORE, "readwrite");
      tx.objectStore(FALLBACK_STORE).delete(assetId);
      await transactionDone(tx);
    } finally {
      db.close();
    }
  }

  async has(assetId: string): Promise<boolean> {
    return (await this.get(assetId)) !== null;
  }
}
