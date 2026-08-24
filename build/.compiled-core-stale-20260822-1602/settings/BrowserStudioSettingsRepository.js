"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserStudioSettingsRepository = exports.STUDIO_SETTINGS_STORAGE_KEY = void 0;
const defaults_1 = require("./defaults");
const validation_1 = require("./validation");
exports.STUDIO_SETTINGS_STORAGE_KEY = "poietek.studio-settings.v1";
class BrowserStudioSettingsRepository {
    storage;
    constructor(storage = typeof localStorage === "undefined" ? null : localStorage) {
        this.storage = storage;
    }
    load(now = new Date()) {
        if (!this.storage)
            return (0, defaults_1.createDefaultStudioSettingsDocument)(now);
        const serialized = this.storage.getItem(exports.STUDIO_SETTINGS_STORAGE_KEY);
        if (!serialized)
            return (0, defaults_1.createDefaultStudioSettingsDocument)(now);
        try {
            const candidate = JSON.parse(serialized);
            (0, validation_1.assertValidStudioSettingsDocument)(candidate);
            return candidate;
        }
        catch {
            return (0, defaults_1.createDefaultStudioSettingsDocument)(now);
        }
    }
    save(document, now = new Date()) {
        const next = { ...document, updatedAt: now.toISOString() };
        (0, validation_1.assertValidStudioSettingsDocument)(next);
        this.storage?.setItem(exports.STUDIO_SETTINGS_STORAGE_KEY, JSON.stringify(next));
        return next;
    }
    applyProfile(document, profileId, now = new Date()) {
        const profile = document.profiles.find((candidate) => candidate.id === profileId);
        if (!profile)
            throw new Error(`Settings profile ${profileId} does not exist.`);
        return this.save({ ...document, activeProfileId: profile.id, preferences: (0, defaults_1.cloneStudioPreferences)(profile.preferences) }, now);
    }
    saveCustomProfile(document, name, now = new Date()) {
        const trimmed = name.trim();
        if (!trimmed || trimmed.length > 80)
            throw new Error("Profile name must contain 1 to 80 characters.");
        const id = `custom-${now.getTime().toString(36)}`;
        const profile = {
            id,
            name: trimmed,
            description: "User-created local studio profile.",
            builtIn: false,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            preferences: (0, defaults_1.cloneStudioPreferences)(document.preferences),
        };
        return this.save({ ...document, activeProfileId: id, profiles: [...document.profiles, profile] }, now);
    }
    removeCustomProfile(document, profileId, now = new Date()) {
        const profile = document.profiles.find((candidate) => candidate.id === profileId);
        if (!profile)
            return document;
        if (profile.builtIn)
            throw new Error("Built-in profiles cannot be removed.");
        const profiles = document.profiles.filter((candidate) => candidate.id !== profileId);
        const fallback = profiles[0] ?? (0, defaults_1.createBuiltInStudioProfiles)()[0];
        return this.save({
            ...document,
            profiles,
            activeProfileId: document.activeProfileId === profileId ? fallback.id : document.activeProfileId,
            preferences: document.activeProfileId === profileId ? (0, defaults_1.cloneStudioPreferences)(fallback.preferences) : document.preferences,
        }, now);
    }
}
exports.BrowserStudioSettingsRepository = BrowserStudioSettingsRepository;
