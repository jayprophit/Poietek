import {
  STUDIO_SETTINGS_SCHEMA_VERSION,
  type StudioPreferences,
  type StudioSettingsDocument,
  type StudioSettingsProfile,
} from "./contracts";

const DEFAULT_TIMESTAMP = "2026-01-01T00:00:00.000Z";

export function cloneStudioPreferences(preferences: StudioPreferences): StudioPreferences {
  return JSON.parse(JSON.stringify(preferences)) as StudioPreferences;
}

export function createBalancedStudioPreferences(): StudioPreferences {
  return {
    audio: {
      inputDeviceId: null,
      outputDeviceId: null,
      requestedSampleRate: 48000,
      requestedBufferFrames: 256,
      recordingChannels: "stereo",
      monitoringMode: "off",
      latencyCompensation: "all-paths",
      lowLatencyMode: false,
      lowLatencyLimitMs: 12,
      autoSuspendWhenIdle: true,
      resetEngineAfterDeviceChange: true,
    },
    midi: {
      defaultInputId: null,
      defaultOutputId: null,
      requestSystemExclusive: false,
      midiThru: false,
      noteChase: true,
      controllerTakeover: "pickup",
      clockMode: "off",
      clockInputId: null,
      clockOutputId: null,
      timecodeMode: "off",
      timecodeFrameRate: 25,
      sendStartStop: true,
    },
    recording: {
      countInBars: 1,
      preRollBars: 1,
      createTakeLanes: true,
      autoInputMonitoring: false,
      keepIncompleteTakes: true,
      fileNamePattern: "{project}_{track}_{take}",
      browserMimePreference: "auto",
      exportBitDepth: 24,
      ditherOnIntegerExport: true,
    },
    editing: {
      snapEnabled: true,
      snapResolution: "adaptive",
      snapToEvents: true,
      rippleEditing: "off",
      autoCrossfade: true,
      defaultFadeMs: 8,
      followPlayhead: true,
      returnToStartOnStop: false,
      auditionWhileScrubbing: false,
    },
    files: {
      autosaveSeconds: 3,
      recoveryCheckpointSeconds: 30,
      retainedRecoverySnapshots: 10,
      copyImportedMediaIntoProject: true,
      verifyMediaHashes: true,
      warnOnMissingMedia: true,
      preferredProjectFolderLabel: "Browser local project storage",
      preferredExportFolderLabel: "Ask on export",
    },
    plugins: {
      nativePluginFormats: ["VST3", "CLAP", "Audio Unit"],
      scanOnNativeStartup: false,
      verifyNewPlugins: true,
      quarantineCrashingPlugins: true,
      sandboxThirdPartyPlugins: true,
      suspendSilentPlugins: true,
      windowMode: "remember-last",
      customSearchFolders: [],
    },
    appearance: {
      theme: "midnight",
      density: "comfortable",
      interfaceScalePercent: 100,
      meterScale: "digital",
      reduceMotion: false,
      showTooltips: true,
      showLearningHints: true,
      autoHideTransportBars: false,
    },
    privacy: {
      localFirst: true,
      crashReports: "ask",
      usageAnalytics: false,
      allowRemoteProviders: false,
      allowCommunityDiscovery: false,
      redactPathsInDiagnostics: true,
      updateChannel: "manual",
    },
  };
}

function builtInProfile(
  id: string,
  name: string,
  description: string,
  configure: (preferences: StudioPreferences) => void,
): StudioSettingsProfile {
  const preferences = createBalancedStudioPreferences();
  configure(preferences);
  return {
    id,
    name,
    description,
    builtIn: true,
    createdAt: DEFAULT_TIMESTAMP,
    updatedAt: DEFAULT_TIMESTAMP,
    preferences,
  };
}

export function createBuiltInStudioProfiles(): StudioSettingsProfile[] {
  return [
    builtInProfile("balanced-studio", "Balanced Studio", "Reliable editing, recording, and mixing defaults for most systems.", () => undefined),
    builtInProfile("responsive-tracking", "Responsive Tracking", "Requests a smaller buffer and reduces latency-heavy monitoring paths.", (preferences) => {
      preferences.audio.requestedBufferFrames = 64;
      preferences.audio.lowLatencyMode = true;
      preferences.audio.lowLatencyLimitMs = 6;
      preferences.audio.monitoringMode = "software";
    }),
    builtInProfile("large-mix", "Large Mix", "Requests more processing headroom for dense arrangements and effect chains.", (preferences) => {
      preferences.audio.requestedBufferFrames = 1024;
      preferences.audio.lowLatencyMode = false;
      preferences.audio.monitoringMode = "off";
      preferences.files.retainedRecoverySnapshots = 20;
    }),
    builtInProfile("portable-sketch", "Portable Sketch", "Touch-friendly, conservative defaults for laptops and mobile browsers.", (preferences) => {
      preferences.audio.requestedSampleRate = 44100;
      preferences.audio.requestedBufferFrames = 512;
      preferences.appearance.density = "touch";
      preferences.appearance.interfaceScalePercent = 110;
      preferences.files.retainedRecoverySnapshots = 6;
    }),
  ];
}

export function createDefaultStudioSettingsDocument(now = new Date()): StudioSettingsDocument {
  const profiles = createBuiltInStudioProfiles();
  return {
    schemaVersion: STUDIO_SETTINGS_SCHEMA_VERSION,
    activeProfileId: profiles[0].id,
    profiles,
    preferences: cloneStudioPreferences(profiles[0].preferences),
    updatedAt: now.toISOString(),
  };
}
