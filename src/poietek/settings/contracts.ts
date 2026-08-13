export const STUDIO_SETTINGS_SCHEMA_VERSION = "1.0.0" as const;

export type StudioTheme = "midnight" | "graphite" | "high-contrast";
export type StudioDensity = "comfortable" | "compact" | "touch";
export type StudioMeterScale = "digital" | "broadcast" | "extended";
export type LatencyCompensationMode = "off" | "recording-paths" | "all-paths";
export type MonitoringMode = "off" | "software" | "hardware-external";
export type MidiClockMode = "off" | "send" | "receive";
export type MidiTimecodeMode = "off" | "quarter-frame" | "full-frame";
export type PluginWindowMode = "docked" | "floating" | "remember-last";

export interface AudioPreferences {
  inputDeviceId: string | null;
  outputDeviceId: string | null;
  requestedSampleRate: 44100 | 48000 | 88200 | 96000 | 176400 | 192000;
  requestedBufferFrames: 32 | 64 | 128 | 256 | 512 | 1024 | 2048;
  recordingChannels: "mono" | "stereo";
  monitoringMode: MonitoringMode;
  latencyCompensation: LatencyCompensationMode;
  lowLatencyMode: boolean;
  lowLatencyLimitMs: number;
  autoSuspendWhenIdle: boolean;
  resetEngineAfterDeviceChange: boolean;
}

export interface MidiPreferences {
  defaultInputId: string | null;
  defaultOutputId: string | null;
  requestSystemExclusive: boolean;
  midiThru: boolean;
  noteChase: boolean;
  controllerTakeover: "jump" | "pickup" | "relative";
  clockMode: MidiClockMode;
  clockInputId: string | null;
  clockOutputId: string | null;
  timecodeMode: MidiTimecodeMode;
  timecodeFrameRate: 24 | 25 | 29.97 | 30;
  sendStartStop: boolean;
}

export interface RecordingPreferences {
  countInBars: 0 | 1 | 2 | 4;
  preRollBars: 0 | 1 | 2 | 4 | 8;
  createTakeLanes: boolean;
  autoInputMonitoring: boolean;
  keepIncompleteTakes: boolean;
  fileNamePattern: string;
  browserMimePreference: "auto" | "opus" | "webm";
  exportBitDepth: 16 | 24 | 32;
  ditherOnIntegerExport: boolean;
}

export interface EditingPreferences {
  snapEnabled: boolean;
  snapResolution: "adaptive" | "bar" | "beat" | "1/8" | "1/16" | "1/32";
  snapToEvents: boolean;
  rippleEditing: "off" | "track" | "all";
  autoCrossfade: boolean;
  defaultFadeMs: number;
  followPlayhead: boolean;
  returnToStartOnStop: boolean;
  auditionWhileScrubbing: boolean;
}

export interface FilePreferences {
  autosaveSeconds: number;
  recoveryCheckpointSeconds: number;
  retainedRecoverySnapshots: number;
  copyImportedMediaIntoProject: boolean;
  verifyMediaHashes: boolean;
  warnOnMissingMedia: boolean;
  preferredProjectFolderLabel: string;
  preferredExportFolderLabel: string;
}

export interface PluginPreferences {
  nativePluginFormats: Array<"VST3" | "CLAP" | "Audio Unit">;
  scanOnNativeStartup: boolean;
  verifyNewPlugins: boolean;
  quarantineCrashingPlugins: boolean;
  sandboxThirdPartyPlugins: boolean;
  suspendSilentPlugins: boolean;
  windowMode: PluginWindowMode;
  customSearchFolders: string[];
}

export interface AppearancePreferences {
  theme: StudioTheme;
  density: StudioDensity;
  interfaceScalePercent: number;
  meterScale: StudioMeterScale;
  reduceMotion: boolean;
  showTooltips: boolean;
  showLearningHints: boolean;
  autoHideTransportBars: boolean;
}

export interface PrivacyPreferences {
  localFirst: true;
  crashReports: "ask" | "never";
  usageAnalytics: false;
  allowRemoteProviders: boolean;
  allowCommunityDiscovery: boolean;
  redactPathsInDiagnostics: boolean;
  updateChannel: "stable" | "manual";
}

export interface StudioPreferences {
  audio: AudioPreferences;
  midi: MidiPreferences;
  recording: RecordingPreferences;
  editing: EditingPreferences;
  files: FilePreferences;
  plugins: PluginPreferences;
  appearance: AppearancePreferences;
  privacy: PrivacyPreferences;
}

export interface StudioSettingsProfile {
  id: string;
  name: string;
  description: string;
  builtIn: boolean;
  createdAt: string;
  updatedAt: string;
  preferences: StudioPreferences;
}

export interface StudioSettingsDocument {
  schemaVersion: typeof STUDIO_SETTINGS_SCHEMA_VERSION;
  activeProfileId: string;
  profiles: StudioSettingsProfile[];
  preferences: StudioPreferences;
  updatedAt: string;
}

export interface SettingsValidationIssue {
  path: string;
  message: string;
}

export interface SettingsValidationResult {
  valid: boolean;
  issues: SettingsValidationIssue[];
}
