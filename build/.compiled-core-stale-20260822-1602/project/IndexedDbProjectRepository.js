"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexedDbProjectRepository = void 0;
const validate_1 = require("../domain/validate");
const DB_NAME = "poietek-projects-v2";
const DB_VERSION = 1;
const STORE = "projects";
function requestResult(request) {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed."));
    });
}
function txComplete(tx) {
    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error ?? new Error("IndexedDB transaction failed."));
        tx.onabort = () => reject(tx.error ?? new Error("IndexedDB transaction aborted."));
    });
}
async function openDb() {
    if (typeof indexedDB === "undefined") {
        throw new Error("IndexedDB project storage is unavailable on this platform.");
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) {
            db.createObjectStore(STORE, { keyPath: "id" });
        }
    };
    return requestResult(request);
}
class IndexedDbProjectRepository {
    async get(id) {
        const db = await openDb();
        try {
            const tx = db.transaction(STORE, "readonly");
            const value = await requestResult(tx.objectStore(STORE).get(id));
            await txComplete(tx);
            if (!value)
                return null;
            const issues = (0, validate_1.validateProject)(value);
            if (issues.length) {
                throw new Error(`Stored project ${id} is invalid: ${issues.join(" | ")}`);
            }
            return structuredClone(value);
        }
        finally {
            db.close();
        }
    }
    async save(project) {
        const issues = (0, validate_1.validateProject)(project);
        if (issues.length) {
            throw new Error(`Project validation failed: ${issues.join(" | ")}`);
        }
        const db = await openDb();
        try {
            const tx = db.transaction(STORE, "readwrite");
            tx.objectStore(STORE).put(structuredClone(project));
            await txComplete(tx);
        }
        finally {
            db.close();
        }
    }
    async list() {
        const db = await openDb();
        try {
            const tx = db.transaction(STORE, "readonly");
            const projects = await requestResult(tx.objectStore(STORE).getAll());
            await txComplete(tx);
            return projects
                .map(({ id, title, updatedAt }) => ({ id, title, updatedAt }))
                .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        }
        finally {
            db.close();
        }
    }
    async delete(id) {
        const db = await openDb();
        try {
            const tx = db.transaction(STORE, "readwrite");
            tx.objectStore(STORE).delete(id);
            await txComplete(tx);
        }
        finally {
            db.close();
        }
    }
}
exports.IndexedDbProjectRepository = IndexedDbProjectRepository;
