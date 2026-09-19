export interface PlaybackTuningRequest {
  sourceReferenceHz: number;
  targetReferenceHz: number;
  preserveTempo: true;
  preserveDuration: true;
}

export interface PlaybackTuningTransform {
  ratio: number;
  cents: number;
}

/**
 * Example:
 * A432 -> A440:
 * ratio = 440/432
 * cents ~= +31.76665
 *
 * A440 -> A432:
 * cents ~= -31.76665
 */
export function playbackTuningTransform(
  request: PlaybackTuningRequest,
): PlaybackTuningTransform {
  if (
    request.sourceReferenceHz <= 0 ||
    request.targetReferenceHz <= 0
  ) {
    throw new Error("Reference frequencies must be positive.");
  }

  const ratio = request.targetReferenceHz / request.sourceReferenceHz;
  const cents = 1200 * Math.log2(ratio);

  return { ratio, cents };
}
