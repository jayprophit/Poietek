export type StudioArea = 'arrange' | 'rack' | 'ecosystem' | 'ai';

export type StudioCommandId =
  | 'project-new'
  | 'project-open'
  | 'project-save'
  | 'audio-import'
  | 'audio-export-wav'
  | 'edit-undo'
  | 'edit-redo'
  | 'edit-select-all'
  | 'track-add-audio'
  | 'track-add-midi'
  | 'track-duplicate'
  | 'clip-split'
  | 'clip-duplicate'
  | 'clip-fades'
  | 'transport-play-toggle'
  | 'transport-stop'
  | 'transport-record-toggle'
  | 'transport-return-zero'
  | 'transport-metronome-toggle'
  | 'arrange-show-timeline'
  | 'arrange-show-console'
  | 'arrange-show-health'
  | 'rack-flip'
  | 'rack-templates'
  | 'rack-workspace';

export interface StudioCommandDetail {
  id: StudioCommandId;
  value?: string;
}

const STUDIO_COMMAND_EVENT = 'poietek:studio-command';
const STUDIO_COMMAND_AREA_READY_EVENT = 'poietek:studio-command-area-ready';

const readyAreas = new Set<StudioArea>();

export function dispatchStudioCommand(detail: StudioCommandDetail): void {
  window.dispatchEvent(
    new CustomEvent<StudioCommandDetail>(STUDIO_COMMAND_EVENT, {
      detail,
    }),
  );
}

export function subscribeStudioCommands(
  listener: (detail: StudioCommandDetail) => void,
): () => void {
  const handle = (event: Event) => {
    listener((event as CustomEvent<StudioCommandDetail>).detail);
  };

  window.addEventListener(STUDIO_COMMAND_EVENT, handle);

  return () => {
    window.removeEventListener(STUDIO_COMMAND_EVENT, handle);
  };
}

export function markStudioCommandAreaReady(area: StudioArea, ready: boolean): void {
  if (ready) {
    readyAreas.add(area);

    window.dispatchEvent(
      new CustomEvent<StudioArea>(STUDIO_COMMAND_AREA_READY_EVENT, {
        detail: area,
      }),
    );
  } else {
    readyAreas.delete(area);
  }
}

export function isStudioCommandAreaReady(area: StudioArea): boolean {
  return readyAreas.has(area);
}

export function subscribeStudioCommandAreaReady(
  listener: (area: StudioArea) => void,
): () => void {
  const handle = (event: Event) => {
    listener((event as CustomEvent<StudioArea>).detail);
  };

  window.addEventListener(STUDIO_COMMAND_AREA_READY_EVENT, handle);

  return () => {
    window.removeEventListener(STUDIO_COMMAND_AREA_READY_EVENT, handle);
  };
}