import type { CommunityDestinationProfile } from "./contracts";

/** Local review profile: no remote service or derivative is required. */
export const LOCAL_PRIVATE_LIBRARY_PROFILE: CommunityDestinationProfile = {
  id: "poietek.local.private-library.v1",
  label: "Local private library",
  releaseProfile: {
    id: "poietek.local.private-library.audio.v1",
    label: "Local private library audio",
    tuningRequirement: { kind: "none" },
    audio: {},
  },
  allowedVisibility: ["private", "unlisted", "circle"],
  moderation: "not_required",
  federation: "not_required",
  commerce: "disabled",
  derivativePolicy: { kind: "preserve_original_only" },
};

/**
 * Product-level community baseline, not a claim about any external platform's
 * delivery rules. A concrete adapter may provide a separately versioned profile.
 */
export const POIETEK_PUBLIC_COMMUNITY_PROFILE: CommunityDestinationProfile = {
  id: "poietek.community.public-original.v1",
  label: "Poietek public community (creator original)",
  releaseProfile: {
    id: "poietek.community.public-original.audio.v1",
    label: "Poietek public community audio",
    tuningRequirement: { kind: "none" },
    audio: { sampleRates: [44_100, 48_000, 88_200, 96_000] },
  },
  allowedVisibility: ["public", "unlisted"],
  moderation: "required_before_remote_publish",
  federation: "optional",
  commerce: "optional",
  derivativePolicy: { kind: "preserve_original_only" },
};

/**
 * Community compatibility profile. It requires a separate A432 render from a
 * real time-preserving backend and never retunes the canonical project/original.
 */
export const POIETEK_PUBLIC_A432_DERIVATIVE_PROFILE: CommunityDestinationProfile = {
  id: "poietek.community.public-a432-derivative.v1",
  label: "Poietek public community (A432 compatibility rendition)",
  releaseProfile: {
    id: "poietek.community.public-a432-derivative.audio.v1",
    label: "Poietek A432 compatibility delivery",
    tuningRequirement: { kind: "none" },
    audio: { sampleRates: [44_100, 48_000, 88_200, 96_000] },
  },
  allowedVisibility: ["public", "unlisted"],
  moderation: "required_before_remote_publish",
  federation: "optional",
  commerce: "optional",
  derivativePolicy: {
    kind: "required_time_preserving_derivative",
    targetReferenceHz: 432,
  },
};

export const BUILT_IN_COMMUNITY_DESTINATIONS: readonly CommunityDestinationProfile[] = [
  LOCAL_PRIVATE_LIBRARY_PROFILE,
  POIETEK_PUBLIC_COMMUNITY_PROFILE,
  POIETEK_PUBLIC_A432_DERIVATIVE_PROFILE,
];
