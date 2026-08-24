import {
  STUDIO_SETTINGS_SCHEMA_VERSION,
  type SettingsValidationIssue,
  type SettingsValidationResult,
  type StudioPreferences,
  type StudioSettingsDocument,
} from "./contracts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function rangeIssue(
  issues: SettingsValidationIssue[],
  path: string,
  value: unknown,
  minimum: number,
  maximum: number,
): void {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum) {
    issues.push({ path, message: `Must be a finite number from ${minimum} to ${maximum}.` });
  }
}

export function validateStudioPreferences(preferences: unknown): SettingsValidationResult {
  const issues: SettingsValidationIssue[] = [];
  if (!isRecord(preferences)) {
    return { valid: false, issues: [{ path: "preferences", message: "Preferences must be an object." }] };
  }
  for (const section of ["audio", "midi", "recording", "editing", "files", "plugins", "appearance", "privacy"]) {
    if (!isRecord(preferences[section])) {
      issues.push({ path: `preferences.${section}`, message: "Settings section is missing or malformed." });
    }
  }
  if (isRecord(preferences.audio)) {
    rangeIssue(issues, "preferences.audio.lowLatencyLimitMs", preferences.audio.lowLatencyLimitMs, 1, 100);
    if (![44100, 48000, 88200, 96000, 176400, 192000].includes(Number(preferences.audio.requestedSampleRate))) {
      issues.push({ path: "preferences.audio.requestedSampleRate", message: "Unsupported requested sample rate." });
    }
    if (![32, 64, 128, 256, 512, 1024, 2048].includes(Number(preferences.audio.requestedBufferFrames))) {
      issues.push({ path: "preferences.audio.requestedBufferFrames", message: "Unsupported requested buffer size." });
    }
  }
  if (isRecord(preferences.recording)) {
    const pattern = preferences.recording.fileNamePattern;
    if (typeof pattern !== "string" || pattern.trim().length === 0 || pattern.length > 120) {
      issues.push({ path: "preferences.recording.fileNamePattern", message: "File-name pattern must contain 1 to 120 characters." });
    }
  }
  if (isRecord(preferences.editing)) {
    rangeIssue(issues, "preferences.editing.defaultFadeMs", preferences.editing.defaultFadeMs, 0, 5000);
  }
  if (isRecord(preferences.files)) {
    rangeIssue(issues, "preferences.files.autosaveSeconds", preferences.files.autosaveSeconds, 1, 3600);
    rangeIssue(issues, "preferences.files.recoveryCheckpointSeconds", preferences.files.recoveryCheckpointSeconds, 5, 3600);
    rangeIssue(issues, "preferences.files.retainedRecoverySnapshots", preferences.files.retainedRecoverySnapshots, 1, 100);
  }
  if (isRecord(preferences.appearance)) {
    rangeIssue(issues, "preferences.appearance.interfaceScalePercent", preferences.appearance.interfaceScalePercent, 75, 200);
  }
  if (isRecord(preferences.privacy)) {
    if (preferences.privacy.localFirst !== true) {
      issues.push({ path: "preferences.privacy.localFirst", message: "Local-first durability cannot be disabled." });
    }
    if (preferences.privacy.usageAnalytics !== false) {
      issues.push({ path: "preferences.privacy.usageAnalytics", message: "Usage analytics are not implemented and must remain disabled." });
    }
  }
  return { valid: issues.length === 0, issues };
}

export function validateStudioSettingsDocument(value: unknown): SettingsValidationResult {
  if (!isRecord(value)) {
    return { valid: false, issues: [{ path: "settings", message: "Settings document must be an object." }] };
  }
  const issues: SettingsValidationIssue[] = [];
  if (value.schemaVersion !== STUDIO_SETTINGS_SCHEMA_VERSION) {
    issues.push({ path: "schemaVersion", message: "Settings schema version is unsupported." });
  }
  if (typeof value.activeProfileId !== "string" || value.activeProfileId.trim().length === 0) {
    issues.push({ path: "activeProfileId", message: "Active profile id is required." });
  }
  if (!Array.isArray(value.profiles) || value.profiles.length === 0) {
    issues.push({ path: "profiles", message: "At least one settings profile is required." });
  } else {
    const ids = new Set<string>();
    for (const [index, profile] of value.profiles.entries()) {
      if (!isRecord(profile) || typeof profile.id !== "string" || typeof profile.name !== "string") {
        issues.push({ path: `profiles.${index}`, message: "Profile identity is malformed." });
        continue;
      }
      if (ids.has(profile.id)) issues.push({ path: `profiles.${index}.id`, message: "Profile ids must be unique." });
      ids.add(profile.id);
      const result = validateStudioPreferences(profile.preferences);
      for (const issue of result.issues) {
        issues.push({ path: `profiles.${index}.${issue.path}`, message: issue.message });
      }
    }
    if (typeof value.activeProfileId === "string" && !ids.has(value.activeProfileId)) {
      issues.push({ path: "activeProfileId", message: "Active profile does not exist." });
    }
  }
  issues.push(...validateStudioPreferences(value.preferences).issues);
  if (typeof value.updatedAt !== "string" || !Number.isFinite(Date.parse(value.updatedAt))) {
    issues.push({ path: "updatedAt", message: "Updated timestamp must be ISO-compatible." });
  }
  return { valid: issues.length === 0, issues };
}

export function assertValidStudioSettingsDocument(value: unknown): asserts value is StudioSettingsDocument {
  const result = validateStudioSettingsDocument(value);
  if (!result.valid) {
    throw new Error(result.issues.map((issue) => `${issue.path}: ${issue.message}`).join("; "));
  }
}

export function isStudioPreferences(value: unknown): value is StudioPreferences {
  return validateStudioPreferences(value).valid;
}
