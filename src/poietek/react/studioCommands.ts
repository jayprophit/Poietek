export type StudioArea = 'arrange' | 'rack' | 'ecosystem' | 'ai';

export type StudioCommandId =
  | 'project-new'
  | 'project-open'
  | 'project-save'
  | 'audio-import'
  | 'audio-export-wav'
  | 'edit-undo'
  | 'edit-redo'
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

export function dispatchStudioCommand(detail: StudioCommandDetail): void {
  window.dispatchEvent(new CustomEvent<StudioCommandDetail>(STUDIO_COMMAND_EVENT, {detail}));
}

export function subscribeStudioCommands(
  listener: (detail: StudioCommandDetail) => void,
): () => void {
  const handle = (event: Event) => {
    listener((event as CustomEvent<StudioCommandDetail>).detail);
  };
  window.addEventListener(STUDIO_COMMAND_EVENT, handle);
  return () => window.removeEventListener(STUDIO_COMMAND_EVENT, handle);
}
