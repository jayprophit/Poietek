import type {PoietekProject, Track} from '../domain/types';
import {
  TRACKING_CONSOLE_EXTENSION_KEY,
  type TrackingConsoleState,
} from './contracts';
import {
  createStarterTrackingConsoleState,
  createTrackingConsoleState,
  validateTrackingConsoleState,
} from './trackingConsole';

function createStarterTrack(
  project: PoietekProject,
  id: string,
  name: string,
  color: string,
): Track {
  if (project.tracks.some((track) => track.id === id)) throw new Error(`Starter tracking track ${id} already exists.`);
  return {
    id,
    type: 'audio',
    name,
    order: project.tracks.length,
    color,
    clips: [],
    mixer: {gainDb: 0, pan: 0, mute: false, solo: false},
  };
}

export function withProjectTrackingConsoleState(
  project: PoietekProject,
  state: TrackingConsoleState,
): PoietekProject {
  const issues = validateTrackingConsoleState(state, project);
  if (issues.length) throw new Error(issues.join(' '));
  return {
    ...project,
    updatedAt: new Date().toISOString(),
    extensions: {
      ...project.extensions,
      [TRACKING_CONSOLE_EXTENSION_KEY]: structuredClone(state),
    },
  };
}

export function getProjectTrackingConsoleState(project: PoietekProject): TrackingConsoleState | null {
  const value = project.extensions[TRACKING_CONSOLE_EXTENSION_KEY];
  if (value === undefined) return null;
  if (!value || typeof value !== 'object') throw new Error('Tracking Console extension is malformed.');
  const state = value as TrackingConsoleState;
  const issues = validateTrackingConsoleState(state, project);
  if (issues.length) throw new Error(issues.join(' '));
  return structuredClone(state);
}

export type TrackingConsoleMutation = (state: TrackingConsoleState) => TrackingConsoleState;

export function mutateProjectTrackingConsoleState(
  project: PoietekProject,
  mutation: TrackingConsoleMutation,
): PoietekProject {
  const current = getProjectTrackingConsoleState(project) ?? createTrackingConsoleState(project.id);
  const next = mutation(current);
  if (next.projectId !== project.id) throw new Error('Tracking Console mutation returned state for another project.');
  return withProjectTrackingConsoleState(project, next);
}

export function createStarterTrackingConsoleProject(
  project: PoietekProject,
  capturedAt = new Date().toISOString(),
): PoietekProject {
  if (getProjectTrackingConsoleState(project)) throw new Error('This project already contains a Tracking Console.');
  let next = {...project, tracks: project.tracks.map((track) => ({...track, clips: track.clips.map((clip) => ({...clip})), mixer: {...track.mixer}}))};
  const audioTracks = next.tracks.filter((track) => track.type === 'audio');
  if (!audioTracks[0]) {
    const track = createStarterTrack(next, 'tracking.track.vocal', 'Lead Vocal Capture', '#fb7185');
    next = {...next, tracks: [...next.tracks, track]};
    audioTracks.push(track);
  }
  if (!audioTracks[1]) {
    const track = createStarterTrack(next, 'tracking.track.instrument', 'Instrument Capture', '#38bdf8');
    next = {...next, tracks: [...next.tracks, track]};
    audioTracks.push(track);
  }
  const state = createStarterTrackingConsoleState(next.id, audioTracks[0].id, audioTracks[1].id, capturedAt);
  return withProjectTrackingConsoleState(next, state);
}
