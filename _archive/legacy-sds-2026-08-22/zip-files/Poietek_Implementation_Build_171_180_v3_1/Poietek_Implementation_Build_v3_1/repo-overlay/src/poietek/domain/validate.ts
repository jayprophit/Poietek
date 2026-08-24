import type { PoietekProject } from "./types";

export function validateProject(project: PoietekProject): string[] {
  const issues: string[] = [];

  if (project.schemaVersion !== "1.1.0") issues.push("Unsupported schemaVersion.");
  if (!project.id) issues.push("Project id is required.");
  if (!project.title.trim()) issues.push("Project title is required.");
  if (!project.tempoMap.length || project.tempoMap[0].tick !== 0) {
    issues.push("Tempo map must begin at tick 0.");
  }
  if (project.settings.ppq <= 0) issues.push("PPQ must be positive.");
  if (project.settings.tuning.referenceHz <= 0) {
    issues.push("Tuning reference frequency must be positive.");
  }

  const assetIds = new Set(project.assets.map((asset) => asset.id));
  const clipIds = new Set<string>();

  for (const track of project.tracks) {
    for (const clip of track.clips) {
      if (clipIds.has(clip.id)) issues.push(`Duplicate clip id ${clip.id}.`);
      clipIds.add(clip.id);

      if (!assetIds.has(clip.assetId)) {
        issues.push(`Clip ${clip.id} references missing asset ${clip.assetId}.`);
      }
      if (clip.durationTicks <= 0) {
        issues.push(`Clip ${clip.id} must have positive duration.`);
      }
    }
  }

  return issues;
}
