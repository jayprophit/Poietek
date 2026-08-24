export interface DeliveryTargetProfile {
  id: string;
  explicitTuningReferenceHz?: number;
  tuningRequirement: "none" | "advisory" | "required";
  technicalRequirements: Record<string, unknown>;
}

export interface ExternalDeliveryDecision {
  preserveCreatorTuning: boolean;
  createTuningCompatibilityRender: boolean;
  targetReferenceHz?: number;
  reason: string;
}

export function resolveExternalDeliveryTuning(input: {
  sourceReferenceHz: number;
  target: DeliveryTargetProfile;
}): ExternalDeliveryDecision {
  if (
    input.target.tuningRequirement === "none" ||
    input.target.explicitTuningReferenceHz == null
  ) {
    return {
      preserveCreatorTuning: true,
      createTuningCompatibilityRender: false,
      reason:
        "The destination profile has no explicit tuning-reference requirement. Preserve creator tuning and conform only the target's technical delivery requirements.",
    };
  }

  if (input.target.tuningRequirement === "advisory") {
    return {
      preserveCreatorTuning: true,
      createTuningCompatibilityRender: true,
      targetReferenceHz: input.target.explicitTuningReferenceHz,
      reason:
        "Preserve the original and optionally create a separate compatibility rendition.",
    };
  }

  return {
    preserveCreatorTuning: true,
    createTuningCompatibilityRender: true,
    targetReferenceHz: input.target.explicitTuningReferenceHz,
    reason:
      "The selected target explicitly requires another tuning reference. Keep the original and create a separate delivery rendition.",
  };
}
