export interface CommunityTuningProfile {
  profileId: string;
  creatorPartyId: string;
  label: string;
  referenceNote: string;
  referencePitchHz: number;
  temperament: Record<string, unknown>;
  tags: string[];
  visibility: "private" | "team" | "unlisted" | "public";
  license: string;
  healthClaimClass: "none" | "creative_only" | "research_reference";
  forkedFromProfileId?: string;
}

export interface TuningCommunityService {
  publish(profile: CommunityTuningProfile): Promise<void>;
  fork(profileId: string): Promise<CommunityTuningProfile>;
  search(query: string): Promise<CommunityTuningProfile[]>;
  feature(profileId: string): Promise<void>;
  report(profileId: string, reason: string): Promise<void>;
}
