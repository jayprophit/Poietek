"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiSettingsRepository = void 0;
const defaults_1 = require("./defaults");
const validation_1 = require("./validation");
const DATABASE = 'poietek-ai-settings';
const STORE = 'documents';
const KEY = 'active';
class AiSettingsRepository {
    open() {
        if (typeof indexedDB === 'undefined')
            return Promise.reject(new Error('IndexedDB is unavailable.'));
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DATABASE, 1);
            request.onupgradeneeded = () => request.result.createObjectStore(STORE);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error ?? new Error('AI settings database could not be opened.'));
        });
    }
    async load() {
        try {
            const database = await this.open();
            const stored = await new Promise((resolve, reject) => {
                const request = database.transaction(STORE, 'readonly').objectStore(STORE).get(KEY);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
            database.close();
            if (stored && (0, validation_1.validateAiSettings)(stored).valid)
                return stored;
        }
        catch {
            // The independent assistant remains usable with private defaults.
        }
        return (0, defaults_1.createDefaultAiSettings)();
    }
    async save(document) {
        const validation = (0, validation_1.validateAiSettings)(document);
        if (!validation.valid)
            throw new Error(validation.issues.map((issue) => `${issue.path}: ${issue.message}`).join('\n'));
        const database = await this.open();
        await new Promise((resolve, reject) => {
            const transaction = database.transaction(STORE, 'readwrite');
            transaction.objectStore(STORE).put(document, KEY);
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
            transaction.onabort = () => reject(transaction.error);
        });
        database.close();
    }
}
exports.AiSettingsRepository = AiSettingsRepository;
