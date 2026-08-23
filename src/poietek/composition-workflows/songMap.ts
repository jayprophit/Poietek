import type {
  CompositionWorkflowState,
  LyricCue,
  ResolvedSongSection,
  SongArrangementVariant,
  SongSection,
} from './contracts';

function validateSection(section: SongSection): void {
  if (!section.id.trim() || !section.name.trim()) throw new Error('Song section id and name are required.');
  if (!Number.isInteger(section.sourceStartTick) || section.sourceStartTick < 0) throw new Error('Song section source start must be a non-negative whole tick.');
  if (!Number.isInteger(section.durationTicks) || section.durationTicks < 1) throw new Error('Song section duration must be a positive whole tick value.');
}

export function addSongSection(state: CompositionWorkflowState, section: SongSection): CompositionWorkflowState {
  validateSection(section);
  if (state.songSections.some((candidate) => candidate.id === section.id)) throw new Error(`Song section ${section.id} already exists.`);
  return {...state, revision: state.revision + 1, songSections: [...state.songSections.map((candidate) => ({...candidate})), {...section}]};
}

export function addSongArrangement(
  state: CompositionWorkflowState,
  arrangement: SongArrangementVariant,
): CompositionWorkflowState {
  if (!arrangement.id.trim() || !arrangement.name.trim()) throw new Error('Song arrangement id and name are required.');
  if (state.songArrangements.some((candidate) => candidate.id === arrangement.id)) throw new Error(`Song arrangement ${arrangement.id} already exists.`);
  const known = new Set(state.songSections.map((section) => section.id));
  const missing = arrangement.sectionIds.find((sectionId) => !known.has(sectionId));
  if (missing) throw new Error(`Song arrangement references missing section ${missing}.`);
  return {...state, revision: state.revision + 1, songArrangements: [...state.songArrangements.map((candidate) => ({...candidate, sectionIds: [...candidate.sectionIds]})), {...arrangement, sectionIds: [...arrangement.sectionIds]}]};
}

export function reorderSongArrangement(
  state: CompositionWorkflowState,
  arrangementId: string,
  sectionIds: string[],
): CompositionWorkflowState {
  if (!state.songArrangements.some((candidate) => candidate.id === arrangementId)) throw new Error(`Song arrangement ${arrangementId} was not found.`);
  const known = new Set(state.songSections.map((section) => section.id));
  const missing = sectionIds.find((sectionId) => !known.has(sectionId));
  if (missing) throw new Error(`Song arrangement references missing section ${missing}.`);
  return {
    ...state,
    revision: state.revision + 1,
    songArrangements: state.songArrangements.map((candidate) => candidate.id === arrangementId
      ? {...candidate, sectionIds: [...sectionIds]}
      : {...candidate, sectionIds: [...candidate.sectionIds]}),
  };
}

export function resolveSongArrangement(
  sections: readonly SongSection[],
  arrangement: SongArrangementVariant,
): ResolvedSongSection[] {
  const byId = new Map(sections.map((section) => [section.id, section]));
  let cursor = 0;
  return arrangement.sectionIds.map((sectionId, occurrenceIndex) => {
    const section = byId.get(sectionId);
    if (!section) throw new Error(`Song arrangement references missing section ${sectionId}.`);
    const resolved = {sectionId, occurrenceIndex, arrangementStartTick: cursor, durationTicks: section.durationTicks};
    cursor += section.durationTicks;
    return resolved;
  });
}

export function updateLyricScratchpad(state: CompositionWorkflowState, scratchpad: string): CompositionWorkflowState {
  return {...state, revision: state.revision + 1, lyrics: {...state.lyrics, scratchpad, cues: state.lyrics.cues.map((cue) => ({...cue}))}};
}

export function upsertLyricCue(state: CompositionWorkflowState, cue: LyricCue): CompositionWorkflowState {
  if (!cue.id.trim() || !cue.text.trim()) throw new Error('Lyric cue id and text are required.');
  if (!Number.isInteger(cue.startTick) || cue.startTick < 0 || !Number.isInteger(cue.durationTicks) || cue.durationTicks < 1) throw new Error('Lyric cue requires a valid positive time range.');
  const retained = state.lyrics.cues.filter((candidate) => candidate.id !== cue.id).map((candidate) => ({...candidate}));
  return {...state, revision: state.revision + 1, lyrics: {...state.lyrics, cues: [...retained, {...cue}].sort((left, right) => left.startTick - right.startTick)}};
}

export function lyricsAtTick(state: CompositionWorkflowState, tick: number): LyricCue[] {
  if (!Number.isFinite(tick)) throw new Error('Lyric lookup tick must be finite.');
  return state.lyrics.cues.filter((cue) => tick >= cue.startTick && tick < cue.startTick + cue.durationTicks).map((cue) => ({...cue}));
}

