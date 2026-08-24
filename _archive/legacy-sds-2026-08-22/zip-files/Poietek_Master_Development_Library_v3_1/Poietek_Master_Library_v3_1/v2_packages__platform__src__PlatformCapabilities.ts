export type PoietekPlatform =
  | "web"
  | "windows"
  | "macos"
  | "linux"
  | "ios"
  | "ipados"
  | "android";

export interface PlatformCapabilities {
  platform: PoietekPlatform;
  installedNativeApp: boolean;
  browserRuntime: boolean;
  nativeFilesystem: boolean;
  opfs: boolean;
  webMidi: boolean;
  nativeMidi: boolean;
  pluginFormats: Array<"vst3" | "clap" | "au" | "auv3" | "lv2">;
  multiWindow: boolean;
  touch: boolean;
  camera: boolean;
  microphone: boolean;
}

export function webCapabilities(): PlatformCapabilities {
  return {
    platform: "web",
    installedNativeApp: false,
    browserRuntime: true,
    nativeFilesystem: false,
    opfs: typeof navigator !== "undefined" && !!navigator.storage?.getDirectory,
    webMidi: typeof navigator !== "undefined" && "requestMIDIAccess" in navigator,
    nativeMidi: false,
    pluginFormats: [],
    multiWindow: false,
    touch: typeof navigator !== "undefined" && navigator.maxTouchPoints > 0,
    camera: typeof navigator !== "undefined" && !!navigator.mediaDevices,
    microphone: typeof navigator !== "undefined" && !!navigator.mediaDevices,
  };
}
