"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebLocalAssetStore = void 0;
const DB_NAME = "poietek-assets-v2";
const DB_VERSION = 1;
const STORE = "blobs";
function requestResult(request) {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed."));
    });
}
async function openFallbackDb() {
    if (typeof indexedDB === "undefined") {
        throw new Error("IndexedDB asset storage is unavailable on this platform.");
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE))
            db.createObjectStore(STORE);
    };
    return requestResult(request);
}
function txComplete(tx) {
    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error ?? new Error("IndexedDB transaction failed."));
        tx.onabort = () => reject(tx.error ?? new Error("IndexedDB transaction aborted."));
    });
}
class WebLocalAssetStore {
    async opfsRoot() {
        if (typeof navigator === "undefined" || !navigator.storage?.getDirectory) {
            return null;
        }
        try {
            return await navigator.storage.getDirectory();
        }
        catch {
            return null;
        }
    }
    async put(assetId, blob) {
        const root = await this.opfsRoot();
        if (root) {
            let directory = null;
            let writable = null;
            try {
                directory = await root.getDirectoryHandle("poietek-assets", { create: true });
                const handle = await directory.getFileHandle(assetId, { create: true });
                writable = await handle.createWritable();
                await writable.write(blob);
                await writable.close();
                return;
            }
            catch {
                await writable?.abort().catch(() => undefined);
                await directory?.removeEntry(assetId).catch(() => undefined);
                // Fall back to IndexedDB when OPFS exists but cannot complete this write.
            }
        }
        const db = await openFallbackDb();
        try {
            const tx = db.transaction(STORE, "readwrite");
            tx.objectStore(STORE).put(blob, assetId);
            await txComplete(tx);
        }
        finally {
            db.close();
        }
    }
    async get(assetId) {
        const root = await this.opfsRoot();
        if (root) {
            try {
                const directory = await root.getDirectoryHandle("poietek-assets");
                const handle = await directory.getFileHandle(assetId);
                return await handle.getFile();
            }
            catch {
                // Fall through in case the asset was created under the IndexedDB fallback.
            }
        }
        const db = await openFallbackDb();
        try {
            const tx = db.transaction(STORE, "readonly");
            const value = await requestResult(tx.objectStore(STORE).get(assetId));
            await txComplete(tx);
            return value ?? null;
        }
        finally {
            db.close();
        }
    }
    async has(assetId) {
        return (await this.get(assetId)) !== null;
    }
    async remove(assetId) {
        const root = await this.opfsRoot();
        if (root) {
            try {
                const directory = await root.getDirectoryHandle("poietek-assets");
                await directory.removeEntry(assetId);
            }
            catch { }
        }
        const db = await openFallbackDb();
        try {
            const tx = db.transaction(STORE, "readwrite");
            tx.objectStore(STORE).delete(assetId);
            await txComplete(tx);
        }
        finally {
            db.close();
        }
    }
}
exports.WebLocalAssetStore = WebLocalAssetStore;
