import type { StudioSettingsDocument, StudioSettingsProfile } from "./contracts";
import {
  cloneStudioPreferences,
  createBuiltInStudioProfiles,
  createDefaultStudioSettingsDocument,
} from "./defaults";
import { assertValidStudioSettingsDocument } from "./validation";

export const STUDIO_SETTINGS_STORAGE_KEY = "poietek.studio-settings.v1";

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export class BrowserStudioSettingsRepository {
  constructor(private readonly storage: KeyValueStorage | null = typeof localStorage === "undefined" ? null : localStorage) {}

  load(now = new Date()): StudioSettingsDocument {
    if (!this.storage) return createDefaultStudioSettingsDocument(now);
    const serialized = this.storage.getItem(STUDIO_SETTINGS_STORAGE_KEY);
    if (!serialized) return createDefaultStudioSettingsDocument(now);
    try {
      const candidate: unknown = JSON.parse(serialized);
      assertValidStudioSettingsDocument(candidate);
      return candidate;
    } catch {
      return createDefaultStudioSettingsDocument(now);
    }
  }

  save(document: StudioSettingsDocument, now = new Date()): StudioSettingsDocument {
    const next = { ...document, updatedAt: now.toISOString() };
    assertValidStudioSettingsDocument(next);
    this.storage?.setItem(STUDIO_SETTINGS_STORAGE_KEY, JSON.stringify(next));
    return next;
  }

  applyProfile(document: StudioSettingsDocument, profileId: string, now = new Date()): StudioSettingsDocument {
    const profile = document.profiles.find((candidate) => candidate.id === profileId);
    if (!profile) throw new Error(`Settings profile ${profileId} does not exist.`);
    return this.save({ ...document, activeProfileId: profile.id, preferences: cloneStudioPreferences(profile.preferences) }, now);
  }

  saveCustomProfile(document: StudioSettingsDocument, name: string, now = new Date()): StudioSettingsDocument {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 80) throw new Error("Profile name must contain 1 to 80 characters.");
    const id = `custom-${now.getTime().toString(36)}`;
    const profile: StudioSettingsProfile = {
      id,
      name: trimmed,
      description: "User-created local studio profile.",
      builtIn: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      preferences: cloneStudioPreferences(document.preferences),
    };
    return this.save({ ...document, activeProfileId: id, profiles: [...document.profiles, profile] }, now);
  }

  removeCustomProfile(document: StudioSettingsDocument, profileId: string, now = new Date()): StudioSettingsDocument {
    const profile = document.profiles.find((candidate) => candidate.id === profileId);
    if (!profile) return document;
    if (profile.builtIn) throw new Error("Built-in profiles cannot be removed.");
    const profiles = document.profiles.filter((candidate) => candidate.id !== profileId);
    const fallback = profiles[0] ?? createBuiltInStudioProfiles()[0];
    return this.save({
      ...document,
      profiles,
      activeProfileId: document.activeProfileId === profileId ? fallback.id : document.activeProfileId,
      preferences: document.activeProfileId === profileId ? cloneStudioPreferences(fallback.preferences) : document.preferences,
    }, now);
  }
}
