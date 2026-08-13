export type LibraryItemKind =
  | "instrument"
  | "audio-effect"
  | "midi-tool"
  | "sample-pack"
  | "demo-project"
  | "utility"
  | "add-on";

export type LibraryImplementationState = "production" | "prototype" | "planned" | "external";
export type LibraryTargetAvailability = "available" | "requires-native-host" | "unavailable";

export interface StudioLibraryItem {
  id: string;
  name: string;
  kind: LibraryItemKind;
  category: string;
  description: string;
  implementation: LibraryImplementationState;
  web: LibraryTargetAvailability;
  native: LibraryTargetAvailability;
  license: "Poietek original" | "User supplied" | "Third-party licence required";
  capabilities: string[];
  limitation: string | null;
}

export interface StudioLibrarySummary {
  total: number;
  production: number;
  prototype: number;
  planned: number;
  external: number;
  webAvailable: number;
  nativeHostRequired: number;
}
