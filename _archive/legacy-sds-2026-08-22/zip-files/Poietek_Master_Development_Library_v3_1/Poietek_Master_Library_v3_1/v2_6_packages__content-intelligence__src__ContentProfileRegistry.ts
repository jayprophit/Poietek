export type ProfileAuthorityType =
  | "formal_standard"
  | "platform_specification"
  | "broadcaster_specification"
  | "festival_cinema_specification"
  | "client_specification"
  | "poietek_engineering"
  | "user_custom";

export interface DeliveryProfile {
  profileId: string;
  version: number;
  label: string;
  authorityType: ProfileAuthorityType;
  contentClass: string[];
  requirements: Record<string, unknown>;
  checkedAt: string;
  sourceRefs: string[];
}

export interface StyleReferenceProfile {
  profileId: string;
  version: number;
  label: string;
  contentClass: string;
  taxonomy: {
    genreIds?: string[];
    genreNames?: string[];
    subgenres?: string[];
    moods?: string[];
    eras?: string[];
    regions?: string[];
    userTags?: string[];
  };
  features: Record<string, unknown>;
  confidence: number;
  generatedAt: string;
}

export interface ContentProfileRegistry {
  listDeliveryProfiles(contentClass?: string): Promise<DeliveryProfile[]>;
  getDeliveryProfile(profileId: string): Promise<DeliveryProfile | null>;
  listStyleProfiles(contentClass?: string): Promise<StyleReferenceProfile[]>;
  getStyleProfile(profileId: string): Promise<StyleReferenceProfile | null>;
}
