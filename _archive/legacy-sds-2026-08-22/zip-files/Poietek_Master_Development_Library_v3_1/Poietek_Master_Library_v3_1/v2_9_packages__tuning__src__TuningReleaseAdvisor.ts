export interface DestinationTuningRequirement {
  targetId: string;
  explicitReferenceNote?: string;
  explicitReferenceHz?: number;
  sourceRef?: string;
  requirementType:
    | "none"
    | "advisory"
    | "explicit_required";
}

export interface TuningReleaseAdvice {
  status: "pass" | "advisory" | "fail";
  selectedReferenceHz: number;
  destinationReferenceHz?: number;
  message: string;
  actions: Array<
    | "keep_original"
    | "create_compatibility_master"
    | "retune_project_copy"
    | "embed_tuning_metadata"
    | "export_tuning_notes"
  >;
}

export function adviseTuningForRelease(input: {
  projectReferenceHz: number;
  destination: DestinationTuningRequirement;
}): TuningReleaseAdvice {
  const { projectReferenceHz, destination } = input;

  if (
    destination.requirementType === "none" ||
    destination.explicitReferenceHz == null
  ) {
    return {
      status: "pass",
      selectedReferenceHz: projectReferenceHz,
      message:
        "No explicit destination tuning requirement is configured. Preserve the project's creative tuning and embed/export the tuning metadata.",
      actions: ["keep_original", "embed_tuning_metadata", "export_tuning_notes"],
    };
  }

  const differenceHz = Math.abs(
    projectReferenceHz - destination.explicitReferenceHz,
  );

  if (differenceHz < 0.01) {
    return {
      status: "pass",
      selectedReferenceHz: projectReferenceHz,
      destinationReferenceHz: destination.explicitReferenceHz,
      message: "Project tuning matches the selected destination requirement.",
      actions: ["keep_original", "embed_tuning_metadata"],
    };
  }

  if (destination.requirementType === "advisory") {
    return {
      status: "advisory",
      selectedReferenceHz: projectReferenceHz,
      destinationReferenceHz: destination.explicitReferenceHz,
      message:
        "The project uses an alternative tuning reference. The destination does not require retuning, but a separate compatibility master can be created for collaborators or systems expecting the advisory reference.",
      actions: [
        "keep_original",
        "create_compatibility_master",
        "embed_tuning_metadata",
        "export_tuning_notes",
      ],
    };
  }

  return {
    status: "fail",
    selectedReferenceHz: projectReferenceHz,
    destinationReferenceHz: destination.explicitReferenceHz,
    message:
      "The selected destination explicitly requires another tuning reference. Preserve the original project and create a separate compatibility render/copy.",
    actions: [
      "create_compatibility_master",
      "retune_project_copy",
      "export_tuning_notes",
    ],
  };
}
