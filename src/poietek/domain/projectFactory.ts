import type { PoietekProject } from "./types";
import { newId } from "./ids";

export function createBlankProject(
  title = "Untitled Project",
  sampleRate: PoietekProject["settings"]["sampleRate"] = 48000,
): PoietekProject {
  const now = new Date().toISOString();

  return {
    id: newId("prj"),
    schemaVersion: "1.1.0",
    title,
    ownerId: null,
    teamId: null,
    createdAt: now,
    updatedAt: now,
    tempoMap: [{ tick: 0, bpm: 120 }],
    tracks: [],
    assets: [],
    contributors: [],
    rights: { state: "draft" },
    releases: [],
    settings: {
      ppq: 960,
      sampleRate,
      tuning: {
        referenceNote: "A4",
        referenceHz: 440,
        temperament: "12_tet",
        profileId: "iso-a440-12tet",
      },
    },
    extensions: {},
  };
}

