import { createUlid } from "./ids";
import type { PoietekProject, Track, TrackType } from "./types";

export function createBlankProject(title = "Untitled Project"): PoietekProject {
  const now = new Date().toISOString();

  return {
    id: createUlid(),
    schemaVersion: "1.0.0",
    title,
    ownerId: null,
    teamId: null,
    createdAt: now,
    updatedAt: now,
    tempoMap: [{ tick: 0, bpm: 120 }],
    timeSignatureMap: [{ tick: 0, numerator: 4, denominator: 4 }],
    keyMap: [],
    tracks: [],
    buses: [],
    assets: [],
    deviceAssignments: [],
    mappings: [],
    contributors: [],
    rights: {},
    releases: [],
    snapshots: [],
    settings: {
      ppq: 960,
      sampleRate: 48000,
      storagePolicy: {},
      defaultRender: {},
    },
    extensions: {},
  };
}

export function createTrack(
  type: TrackType,
  name = type === "audio" ? "Audio Track" : "Track",
): Track {
  return {
    id: createUlid(),
    type,
    name,
    order: 0,
    color: null,
    clips: [],
    mixer: {
      gainDb: 0,
      pan: 0,
      mute: false,
      solo: false,
      sends: [],
    },
    routing: {},
    plugins: [],
    automation: [],
    contributorAssignmentIds: [],
  };
}
