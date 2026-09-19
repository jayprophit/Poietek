import type { PoietekProject } from "./types";

export interface ValidationIssue {
  path: string;
  message: string;
}

export function validateProjectShallow(project: PoietekProject): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (project.schemaVersion !== "1.0.0") {
    issues.push({ path: "schemaVersion", message: "Unsupported project schema." });
  }

  if (!project.id) {
    issues.push({ path: "id", message: "Project ID is required." });
  }

  if (!project.title.trim()) {
    issues.push({ path: "title", message: "Project title is required." });
  }

  if (project.tempoMap.length === 0 || project.tempoMap.some((x) => x.bpm <= 0)) {
    issues.push({ path: "tempoMap", message: "At least one positive tempo event is required." });
  }

  const assetIds = new Set(project.assets.map((asset) => asset.id));

  for (const [trackIndex, track] of project.tracks.entries()) {
    for (const [clipIndex, clip] of track.clips.entries()) {
      if (clip.durationTicks <= 0) {
        issues.push({
          path: `tracks[${trackIndex}].clips[${clipIndex}].durationTicks`,
          message: "Clip duration must be positive.",
        });
      }

      if ((clip.clipType === "audio" || clip.clipType === "video") && !assetIds.has(clip.assetId)) {
        issues.push({
          path: `tracks[${trackIndex}].clips[${clipIndex}].assetId`,
          message: `Referenced asset ${clip.assetId} is missing from project metadata.`,
        });
      }
    }
  }

  return issues;
}
