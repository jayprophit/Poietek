import type { AssetStore } from "./AssetStore";

const DB_NAME = "poietek-assets-v2";
const DB_VERSION = 1;
const STORE = "blobs";

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed."));
  });
}

async function openFallbackDb(): Promise<IDBDatabase> {
  const request = indexedDB.open(DB_NAME, DB_VERSION);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
  };
  return requestResult(request);
}

function txComplete(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB transaction failed."));
    tx.onabort = () => reject(tx.error ?? new Error("IndexedDB transaction aborted."));
  });
}

export class WebLocalAssetStore implements AssetStore {
  private async opfsRoot(): Promise<FileSystemDirectoryHandle | null> {
    if (!navigator.storage?.getDirectory) return null;
    try {
      return await navigator.storage.getDirectory();
    } catch {
      return null;
    }
  }

  async put(assetId: string, blob: Blob): Promise<void> {
    const root = await this.opfsRoot();
    if (root) {
      const directory = await root.getDirectoryHandle("poietek-assets", { create: true });
      const handle = await directory.getFileHandle(assetId, { create: true });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    }

    const db = await openFallbackDb();
    try {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(blob, assetId);
      await txComplete(tx);
    } finally {
      db.close();
    }
  }

  async get(assetId: string): Promise<Blob | null> {
    const root = await this.opfsRoot();
    if (root) {
      try {
        const directory = await root.getDirectoryHandle("poietek-assets");
        const handle = await directory.getFileHandle(assetId);
        return await handle.getFile();
      } catch {
        // Fall through in case the asset was created under the IndexedDB fallback.
      }
    }

    const db = await openFallbackDb();
    try {
      const tx = db.transaction(STORE, "readonly");
      const value = await requestResult(
        tx.objectStore(STORE).get(assetId) as IDBRequest<Blob | undefined>,
      );
      await txComplete(tx);
      return value ?? null;
    } finally {
      db.close();
    }
  }

  async has(assetId: string): Promise<boolean> {
    return (await this.get(assetId)) !== null;
  }

  async remove(assetId: string): Promise<void> {
    const root = await this.opfsRoot();
    if (root) {
      try {
        const directory = await root.getDirectoryHandle("poietek-assets");
        await directory.removeEntry(assetId);
      } catch {}
    }

    const db = await openFallbackDb();
    try {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(assetId);
      await txComplete(tx);
    } finally {
      db.close();
    }
  }
}
