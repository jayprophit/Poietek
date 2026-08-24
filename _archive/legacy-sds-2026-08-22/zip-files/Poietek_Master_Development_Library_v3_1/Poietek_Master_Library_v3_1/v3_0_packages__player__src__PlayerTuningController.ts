import { playbackTuningTransform } from "./PlaybackTuning";

export type PlayerTuningMode =
  | "creator_original"
  | "community_default"
  | "listener_preference"
  | "a432"
  | "a440"
  | "a442"
  | "custom_reference"
  | "disabled";

export interface PlayerTuningSelection {
  mode: PlayerTuningMode;
  targetReferenceHz?: number;
}

export interface PlayerTuningContext {
  sourceReferenceHz?: number;
  creatorRecommendedReferenceHz?: number;
  communityDefaultReferenceHz?: number;
  listenerPreferredReferenceHz?: number;
  allowListenerRetune: boolean;
}

export interface ResolvedPlayerTuning {
  applied: boolean;
  sourceReferenceHz?: number;
  targetReferenceHz?: number;
  pitchShiftCents: number;
  label: string;
  warning?: string;
}

export function resolvePlayerTuning(
  selection: PlayerTuningSelection,
  context: PlayerTuningContext,
): ResolvedPlayerTuning {
  const source = context.sourceReferenceHz;

  if (!source || selection.mode === "creator_original" || selection.mode === "disabled") {
    return {
      applied: false,
      sourceReferenceHz: source,
      targetReferenceHz: source,
      pitchShiftCents: 0,
      label: "Original tuning",
    };
  }

  if (!context.allowListenerRetune && selection.mode === "listener_preference") {
    return {
      applied: false,
      sourceReferenceHz: source,
      targetReferenceHz: source,
      pitchShiftCents: 0,
      label: "Original tuning",
      warning: "Creator disabled listener retuning for this release.",
    };
  }

  const target =
    selection.mode === "a432" ? 432 :
    selection.mode === "a440" ? 440 :
    selection.mode === "a442" ? 442 :
    selection.mode === "community_default" ? context.communityDefaultReferenceHz :
    selection.mode === "listener_preference" ? context.listenerPreferredReferenceHz :
    selection.mode === "custom_reference" ? selection.targetReferenceHz :
    context.creatorRecommendedReferenceHz;

  if (!target) {
    return {
      applied: false,
      sourceReferenceHz: source,
      targetReferenceHz: source,
      pitchShiftCents: 0,
      label: "Original tuning",
      warning: "No target tuning is available; original playback is used.",
    };
  }

  const transform = playbackTuningTransform({
    sourceReferenceHz: source,
    targetReferenceHz: target,
    preserveTempo: true,
    preserveDuration: true,
  });

  return {
    applied: Math.abs(transform.cents) >= 0.01,
    sourceReferenceHz: source,
    targetReferenceHz: target,
    pitchShiftCents: transform.cents,
    label: `${target} Hz playback`,
  };
}
