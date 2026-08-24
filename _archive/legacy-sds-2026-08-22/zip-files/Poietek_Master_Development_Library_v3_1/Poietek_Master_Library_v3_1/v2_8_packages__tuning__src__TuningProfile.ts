export type TemperamentKind =
  | "12_tet"
  | "just_intonation"
  | "pythagorean"
  | "quarter_comma_meantone"
  | "werckmeister"
  | "vallotti"
  | "equal_division"
  | "scala"
  | "adaptive_just"
  | "custom";

export interface TuningProfile {
  profileId: string;
  version: number;
  label: string;
  referencePitch: {
    note: string;
    frequencyHz: number;
  };
  temperament: {
    kind: TemperamentKind;
    edo?: number;
    ratios?: string[];
    scalaSclAssetId?: string;
    scalaKbmAssetId?: string;
  };
  authorityType:
    | "formal_standard"
    | "historical_practice"
    | "ensemble_requirement"
    | "creative_choice"
    | "research"
    | "user_custom";
}

export interface TuningEngine {
  setProfile(profile: TuningProfile): Promise<void>;
  frequencyForNote(input: {
    midiNote: number;
    chordContext?: number[];
  }): Promise<number>;
  getPerNoteCentsOffsets(input: {
    midiNotes: number[];
    chordContext?: number[];
  }): Promise<number[]>;
}
