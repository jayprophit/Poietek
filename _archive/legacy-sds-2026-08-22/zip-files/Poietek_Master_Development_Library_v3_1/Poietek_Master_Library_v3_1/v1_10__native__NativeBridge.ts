export type PlatformKind =
  | "web"
  | "windows"
  | "macos"
  | "linux"
  | "android"
  | "ios"
  | "ipados";

export interface NativeCapabilities {
  installedApp: boolean;
  platform: PlatformKind;
  filesystem: boolean;
  nativeAudio: boolean;
  nativeMidi: boolean;
  desktopPluginHost: boolean;
  mobileAudioUnits: boolean;
  backgroundMediaJobs: boolean;
  multipleWindows: boolean;
}

export interface NativeBridge {
  capabilities(): Promise<NativeCapabilities>;
  chooseProjectFolder?(): Promise<string | null>;
  revealFile?(path: string): Promise<void>;
  keepScreenAwake?(enabled: boolean): Promise<void>;
}
