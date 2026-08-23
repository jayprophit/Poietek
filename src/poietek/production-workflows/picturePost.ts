import type {Asset, PoietekProject} from '../domain/types';

export const PICTURE_POST_EXTENSION_KEY = 'org.poietek.picture-post' as const;
export const PICTURE_POST_SCHEMA_VERSION = '1.0.0' as const;

export type PictureFrameRate =
  | '23.976'
  | '24'
  | '25'
  | '29.97'
  | '29.97_df'
  | '30'
  | '30_df'
  | '50'
  | '59.94'
  | '60';

export type PictureFollowMode = 'off' | 'locate' | 'scrub';
export type AdrCueKind = 'dialogue' | 'foley' | 'sfx' | 'music' | 'review';
export type AdrCueStatus = 'scripted' | 'rehearsed' | 'record_ready' | 'review' | 'approved';
export type AdrSessionMode = 'idle' | 'rehearse_intent' | 'record_intent' | 'review_intent';

export interface AdrOverlaySettings {
  preRollFrames: number;
  postRollFrames: number;
  startIndicator: 'swipe' | 'counter' | 'swipe_and_counter' | 'none';
  showTimecode: boolean;
  showDialogue: boolean;
  freeRun: boolean;
}

export interface FieldRecorderReference {
  scene: string;
  take: string;
  tape: string | null;
}

export interface AdrCue {
  id: string;
  cueNumber: string;
  kind: AdrCueKind;
  startFrame: number;
  endFrame: number;
  character: string;
  dialogue: string;
  notes: string;
  targetTrackId: string | null;
  status: AdrCueStatus;
  sessionMode: AdrSessionMode;
  fieldReference: FieldRecorderReference | null;
  preferredTakeId: string | null;
}

/** A durable reference to an existing canonical audio asset, never a claim that Poietek recorded it. */
export interface AdrTakeReference {
  id: string;
  cueId: string;
  takeNumber: number;
  audioAssetId: string;
  performer: string;
  rating: 1 | 2 | 3 | 4 | 5 | null;
  notes: string;
}

export interface AppliedReconformRecord {
  id: string;
  fromRevision: number;
  toRevision: number;
  changedCueIds: readonly string[];
}

export interface PicturePostState {
  schemaVersion: typeof PICTURE_POST_SCHEMA_VERSION;
  projectId: string;
  revision: number;
  setup: {
    frameRate: PictureFrameRate;
    startTimecode: string;
    pictureAssetId: string | null;
    pictureFollow: PictureFollowMode;
    proxyIntent: 'original' | 'proxy';
  };
  adr: AdrOverlaySettings;
  cues: readonly AdrCue[];
  takes: readonly AdrTakeReference[];
  lastReconform: AppliedReconformRecord | null;
}

export interface PictureChangeSegment {
  id: string;
  roll: string;
  clipName: string;
  oldStartFrame: number;
  oldEndFrame: number;
  newStartFrame: number;
  newEndFrame: number;
}

export interface CueReconformEntry {
  cueId: string;
  originalStartFrame: number;
  originalEndFrame: number;
  nextStartFrame: number | null;
  nextEndFrame: number | null;
  state: 'unchanged' | 'shift' | 'manual_review';
  message: string;
}

export interface PictureReconformPreview {
  id: string;
  projectId: string;
  baseRevision: number;
  segments: readonly PictureChangeSegment[];
  entries: readonly CueReconformEntry[];
  canApply: boolean;
  claim: string;
}

export interface FieldRecorderMatch {
  assetId: string;
  originalName: string;
  matchedAttributes: readonly ('scene' | 'take' | 'tape')[];
  confidence: 'strong' | 'review';
}

export interface FieldRecorderMatchPlan {
  cueId: string;
  matches: readonly FieldRecorderMatch[];
  claim: string;
}

const nominalFrameRates: Readonly<Record<PictureFrameRate, number>> = {
  '23.976': 24,
  '24': 24,
  '25': 25,
  '29.97': 30,
  '29.97_df': 30,
  '30': 30,
  '30_df': 30,
  '50': 50,
  '59.94': 60,
  '60': 60,
};

const dropFrameRates = new Set<PictureFrameRate>(['29.97_df', '30_df']);

export function createPicturePostState(
  projectId: string,
  initial?: Partial<Pick<PicturePostState['setup'], 'frameRate' | 'pictureAssetId'>>,
): PicturePostState {
  if (!projectId.trim()) throw new Error('Picture post requires a project id.');
  const frameRate = initial?.frameRate ?? '24';
  return {
    schemaVersion: PICTURE_POST_SCHEMA_VERSION,
    projectId,
    revision: 0,
    setup: {
      frameRate,
      startTimecode: defaultStartTimecode(frameRate),
      pictureAssetId: initial?.pictureAssetId ?? null,
      pictureFollow: 'locate',
      proxyIntent: 'original',
    },
    adr: {
      preRollFrames: nominalFrameRates[frameRate] * 3,
      postRollFrames: nominalFrameRates[frameRate],
      startIndicator: 'swipe_and_counter',
      showTimecode: true,
      showDialogue: true,
      freeRun: false,
    },
    cues: [],
    takes: [],
    lastReconform: null,
  };
}

export function configurePicturePost(
  state: PicturePostState,
  setup: Partial<PicturePostState['setup']>,
  adr?: Partial<AdrOverlaySettings>,
): PicturePostState {
  const next: PicturePostState = {
    ...state,
    revision: state.revision + 1,
    setup: {...state.setup, ...setup},
    adr: {...state.adr, ...adr},
  };
  return validateNext(next);
}

export function upsertAdrCue(state: PicturePostState, cue: AdrCue): PicturePostState {
  validateCueShape(cue);
  const cues = state.cues.some((candidate) => candidate.id === cue.id)
    ? state.cues.map((candidate) => candidate.id === cue.id ? cloneCue(cue) : cloneCue(candidate))
    : [...state.cues.map(cloneCue), cloneCue(cue)];
  return validateNext({...state, revision: state.revision + 1, cues: sortCues(cues)});
}

export function setAdrCueStatus(
  state: PicturePostState,
  cueId: string,
  status: AdrCueStatus,
  sessionMode: AdrSessionMode = 'idle',
): PicturePostState {
  if (!state.cues.some((cue) => cue.id === cueId)) throw new Error(`Unknown ADR cue: ${cueId}`);
  return validateNext({
    ...state,
    revision: state.revision + 1,
    cues: state.cues.map((cue) => cue.id === cueId ? {...cloneCue(cue), status, sessionMode} : cloneCue(cue)),
  });
}

export function logAdrTakeReference(
  state: PicturePostState,
  project: PoietekProject,
  take: AdrTakeReference,
): PicturePostState {
  if (state.projectId !== project.id) throw new Error('Picture post state belongs to another project.');
  if (!state.cues.some((cue) => cue.id === take.cueId)) throw new Error(`ADR take references unknown cue: ${take.cueId}`);
  if (state.takes.some((candidate) => candidate.id === take.id)) throw new Error(`Duplicate ADR take: ${take.id}`);
  const asset = project.assets.find((candidate) => candidate.id === take.audioAssetId);
  if (!asset || asset.mediaType !== 'audio') {
    throw new Error('ADR takes must reference an existing canonical audio asset.');
  }
  validateTakeShape(take);
  return validateNext({...state, revision: state.revision + 1, takes: [...state.takes.map((candidate) => ({...candidate})), {...take}]}, project);
}

export function setPreferredAdrTake(
  state: PicturePostState,
  cueId: string,
  takeId: string | null,
): PicturePostState {
  if (!state.cues.some((cue) => cue.id === cueId)) throw new Error(`Unknown ADR cue: ${cueId}`);
  if (takeId && !state.takes.some((take) => take.id === takeId && take.cueId === cueId)) {
    throw new Error('Preferred ADR take must belong to the selected cue.');
  }
  return validateNext({
    ...state,
    revision: state.revision + 1,
    cues: state.cues.map((cue) => cue.id === cueId ? {...cloneCue(cue), preferredTakeId: takeId} : cloneCue(cue)),
  });
}

export function createReconformPreview(
  state: PicturePostState,
  id: string,
  segments: readonly PictureChangeSegment[],
): PictureReconformPreview {
  if (!id.trim()) throw new Error('ReConform preview requires an id.');
  const normalizedSegments = [...segments].map((segment) => ({...segment})).sort((left, right) => (
    left.oldStartFrame - right.oldStartFrame || left.id.localeCompare(right.id)
  ));
  const segmentIssues = validateChangeSegments(normalizedSegments);
  if (segmentIssues.length) throw new Error(segmentIssues.join(' '));

  const entries = state.cues.map<CueReconformEntry>((cue) => {
    const containing = normalizedSegments.filter((segment) => (
      cue.startFrame >= segment.oldStartFrame && cue.endFrame <= segment.oldEndFrame
    ));
    if (containing.length !== 1) {
      return {
        cueId: cue.id,
        originalStartFrame: cue.startFrame,
        originalEndFrame: cue.endFrame,
        nextStartFrame: null,
        nextEndFrame: null,
        state: 'manual_review',
        message: containing.length ? 'Cue maps to more than one picture segment.' : 'Cue crosses a cut or has no validated picture segment.',
      };
    }
    const segment = containing[0];
    const oldDuration = segment.oldEndFrame - segment.oldStartFrame;
    const newDuration = segment.newEndFrame - segment.newStartFrame;
    if (oldDuration !== newDuration) {
      return {
        cueId: cue.id,
        originalStartFrame: cue.startFrame,
        originalEndFrame: cue.endFrame,
        nextStartFrame: null,
        nextEndFrame: null,
        state: 'manual_review',
        message: 'The containing picture segment changed duration and needs an editorial decision.',
      };
    }
    const offset = segment.newStartFrame - segment.oldStartFrame;
    return {
      cueId: cue.id,
      originalStartFrame: cue.startFrame,
      originalEndFrame: cue.endFrame,
      nextStartFrame: cue.startFrame + offset,
      nextEndFrame: cue.endFrame + offset,
      state: offset === 0 ? 'unchanged' : 'shift',
      message: offset === 0 ? 'Cue remains on the same picture frames.' : `Cue shifts ${offset > 0 ? '+' : ''}${offset} frames.`,
    };
  });
  const canApply = entries.length > 0 && entries.every((entry) => entry.state !== 'manual_review');
  return {
    id,
    projectId: state.projectId,
    baseRevision: state.revision,
    segments: normalizedSegments,
    entries,
    canApply,
    claim: canApply
      ? 'The preview is deterministic and can be applied as one project mutation. No audio or video media has been rendered.'
      : 'The preview is blocked until every cue crossing, gap or duration change receives an editorial decision.',
  };
}

export function createOffsetReconformPreview(
  state: PicturePostState,
  id: string,
  offsetFrames: number,
): PictureReconformPreview {
  if (!Number.isInteger(offsetFrames)) throw new Error('Picture offset must be a whole number of frames.');
  const first = state.cues[0]?.startFrame ?? 0;
  const last = state.cues.length ? Math.max(...state.cues.map((cue) => cue.endFrame)) : 1;
  if (first + offsetFrames < 0) throw new Error('Picture offset would move the cue plan before frame zero.');
  return createReconformPreview(state, id, [{
    id: `${id}:segment`,
    roll: 'manual-offset',
    clipName: 'Validated constant picture offset',
    oldStartFrame: first,
    oldEndFrame: Math.max(first + 1, last),
    newStartFrame: first + offsetFrames,
    newEndFrame: Math.max(first + 1, last) + offsetFrames,
  }]);
}

export function applyReconformPreview(
  state: PicturePostState,
  preview: PictureReconformPreview,
): PicturePostState {
  if (preview.projectId !== state.projectId) throw new Error('ReConform preview belongs to another project.');
  if (preview.baseRevision !== state.revision) throw new Error('ReConform preview is stale; build a new preview from the current cue plan.');
  if (!preview.canApply || preview.entries.some((entry) => entry.state === 'manual_review')) {
    throw new Error('ReConform preview contains unresolved editorial decisions.');
  }
  const entryByCue = new Map(preview.entries.map((entry) => [entry.cueId, entry]));
  if (entryByCue.size !== state.cues.length || state.cues.some((cue) => !entryByCue.has(cue.id))) {
    throw new Error('ReConform preview does not cover the current cue plan exactly once.');
  }
  const changedCueIds: string[] = [];
  const cues = state.cues.map((cue) => {
    const entry = entryByCue.get(cue.id)!;
    if (entry.nextStartFrame === null || entry.nextEndFrame === null) throw new Error('ReConform preview has an unresolved cue position.');
    if (entry.nextStartFrame !== cue.startFrame || entry.nextEndFrame !== cue.endFrame) changedCueIds.push(cue.id);
    return {...cloneCue(cue), startFrame: entry.nextStartFrame, endFrame: entry.nextEndFrame};
  });
  const nextRevision = state.revision + 1;
  return validateNext({
    ...state,
    revision: nextRevision,
    cues: sortCues(cues),
    lastReconform: {
      id: preview.id,
      fromRevision: state.revision,
      toRevision: nextRevision,
      changedCueIds,
    },
  });
}

export function deriveFieldRecorderMatchPlan(
  state: PicturePostState,
  project: PoietekProject,
  cueId: string,
): FieldRecorderMatchPlan {
  if (state.projectId !== project.id) throw new Error('Picture post state belongs to another project.');
  const cue = state.cues.find((candidate) => candidate.id === cueId);
  if (!cue) throw new Error(`Unknown ADR cue: ${cueId}`);
  if (!cue.fieldReference) {
    return {cueId, matches: [], claim: 'This cue has no scene/take metadata, so Poietek will not infer a field-recorder match.'};
  }
  const reference = cue.fieldReference;
  const matches = project.assets
    .filter((asset) => asset.mediaType === 'audio')
    .map((asset) => matchFieldAsset(asset, reference))
    .filter((match): match is FieldRecorderMatch => match !== null)
    .sort((left, right) => (
      right.matchedAttributes.length - left.matchedAttributes.length || left.assetId.localeCompare(right.assetId)
    ));
  return {
    cueId,
    matches,
    claim: matches.length
      ? 'Matches are metadata proposals only. Auditioning and import remain deliberate user actions.'
      : 'No canonical audio asset supplied enough matching scene/take metadata.',
  };
}

export function createAdrCueSheetCsv(state: PicturePostState): string {
  const header = ['Cue', 'Kind', 'Timecode In', 'Timecode Out', 'Character', 'Dialogue', 'Status', 'Preferred Take'];
  const rows = state.cues.map((cue) => [
    cue.cueNumber,
    cue.kind,
    formatProjectTimecode(state, cue.startFrame),
    formatProjectTimecode(state, cue.endFrame),
    cue.character,
    cue.dialogue,
    cue.status,
    cue.preferredTakeId ?? '',
  ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

export function timecodeToFrames(timecode: string, frameRate: PictureFrameRate): number {
  const match = /^(\d{2}):(\d{2}):(\d{2})([:;])(\d{2})$/.exec(timecode.trim());
  if (!match) throw new Error('Timecode must use HH:MM:SS:FF or HH:MM:SS;FF.');
  const [, hoursText, minutesText, secondsText, separator, framesText] = match;
  const hours = Number(hoursText);
  const minutes = Number(minutesText);
  const seconds = Number(secondsText);
  const frames = Number(framesText);
  const nominal = nominalFrameRates[frameRate];
  const drop = dropFrameRates.has(frameRate);
  if (hours > 23 || minutes > 59 || seconds > 59 || frames >= nominal) throw new Error('Timecode value is outside the selected frame-rate range.');
  if (drop !== (separator === ';')) throw new Error(drop ? 'Drop-frame timecode must use a semicolon.' : 'Non-drop timecode must use a colon.');
  if (drop && seconds === 0 && minutes % 10 !== 0 && frames < 2) {
    throw new Error('Drop-frame timecode uses a skipped frame number at this minute.');
  }
  const counted = (((hours * 60 + minutes) * 60 + seconds) * nominal) + frames;
  if (!drop) return counted;
  const totalMinutes = hours * 60 + minutes;
  return counted - 2 * (totalMinutes - Math.floor(totalMinutes / 10));
}

export function framesToTimecode(frame: number, frameRate: PictureFrameRate): string {
  if (!Number.isInteger(frame) || frame < 0) throw new Error('Timeline frame must be a non-negative whole number.');
  const nominal = nominalFrameRates[frameRate];
  const drop = dropFrameRates.has(frameRate);
  let labeledFrame = frame;
  if (drop) {
    const framesPer10Minutes = 17_982;
    const framesPerDropMinute = 1_798;
    const framesPer24Hours = 2_589_408;
    const wrapped = frame % framesPer24Hours;
    const tenMinuteBlocks = Math.floor(wrapped / framesPer10Minutes);
    const remainder = wrapped % framesPer10Minutes;
    labeledFrame = wrapped + (18 * tenMinuteBlocks);
    if (remainder >= 2) labeledFrame += 2 * Math.floor((remainder - 2) / framesPerDropMinute);
  }
  const frames = labeledFrame % nominal;
  const totalSeconds = Math.floor(labeledFrame / nominal);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60) % 24;
  const separator = drop ? ';' : ':';
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}${separator}${pad2(frames)}`;
}

export function formatProjectTimecode(state: PicturePostState, relativeFrame: number): string {
  const startFrame = timecodeToFrames(state.setup.startTimecode, state.setup.frameRate);
  return framesToTimecode(startFrame + relativeFrame, state.setup.frameRate);
}

export function validatePicturePostState(state: PicturePostState, project?: PoietekProject): string[] {
  const issues: string[] = [];
  if (state.schemaVersion !== PICTURE_POST_SCHEMA_VERSION) issues.push('Unsupported picture post schema version.');
  if (!state.projectId.trim()) issues.push('Picture post project id is required.');
  if (!Number.isInteger(state.revision) || state.revision < 0) issues.push('Picture post revision must be a non-negative whole number.');
  if (project && state.projectId !== project.id) issues.push('Picture post project id does not match the canonical project.');
  try { timecodeToFrames(state.setup.startTimecode, state.setup.frameRate); } catch (reason) {
    issues.push(reason instanceof Error ? reason.message : String(reason));
  }
  if (!Number.isInteger(state.adr.preRollFrames) || state.adr.preRollFrames < 0) issues.push('ADR pre-roll must be a non-negative whole frame count.');
  if (!Number.isInteger(state.adr.postRollFrames) || state.adr.postRollFrames < 0) issues.push('ADR post-roll must be a non-negative whole frame count.');
  const knownAssetIds = project ? new Set(project.assets.map((asset) => asset.id)) : null;
  const knownVideoAssetIds = project ? new Set(project.assets.filter((asset) => asset.mediaType === 'video').map((asset) => asset.id)) : null;
  const knownAudioAssetIds = project ? new Set(project.assets.filter((asset) => asset.mediaType === 'audio').map((asset) => asset.id)) : null;
  const knownTrackIds = project ? new Set(project.tracks.map((track) => track.id)) : null;
  if (state.setup.pictureAssetId && knownVideoAssetIds && !knownVideoAssetIds.has(state.setup.pictureAssetId)) {
    issues.push(`Picture post references missing video asset ${state.setup.pictureAssetId}.`);
  }
  if (state.setup.pictureAssetId && knownAssetIds && !knownAssetIds.has(state.setup.pictureAssetId)) {
    issues.push(`Picture post references missing asset ${state.setup.pictureAssetId}.`);
  }
  const cueIds = new Set<string>();
  for (const cue of state.cues) {
    if (cueIds.has(cue.id)) issues.push(`Duplicate ADR cue ${cue.id}.`);
    cueIds.add(cue.id);
    try { validateCueShape(cue); } catch (reason) { issues.push(reason instanceof Error ? reason.message : String(reason)); }
    if (cue.targetTrackId && knownTrackIds && !knownTrackIds.has(cue.targetTrackId)) issues.push(`ADR cue ${cue.id} references missing track ${cue.targetTrackId}.`);
  }
  const takeIds = new Set<string>();
  for (const take of state.takes) {
    if (takeIds.has(take.id)) issues.push(`Duplicate ADR take ${take.id}.`);
    takeIds.add(take.id);
    try { validateTakeShape(take); } catch (reason) { issues.push(reason instanceof Error ? reason.message : String(reason)); }
    if (!cueIds.has(take.cueId)) issues.push(`ADR take ${take.id} references missing cue ${take.cueId}.`);
    if (knownAudioAssetIds && !knownAudioAssetIds.has(take.audioAssetId)) issues.push(`ADR take ${take.id} references missing audio asset ${take.audioAssetId}.`);
  }
  for (const cue of state.cues) {
    if (cue.preferredTakeId && !state.takes.some((take) => take.id === cue.preferredTakeId && take.cueId === cue.id)) {
      issues.push(`ADR cue ${cue.id} references an invalid preferred take.`);
    }
  }
  return issues;
}

export function withProjectPicturePostState(project: PoietekProject, state: PicturePostState): PoietekProject {
  const issues = validatePicturePostState(state, project);
  if (issues.length) throw new Error(issues.join(' '));
  return {
    ...project,
    updatedAt: new Date().toISOString(),
    extensions: {...project.extensions, [PICTURE_POST_EXTENSION_KEY]: state},
  };
}

export function getProjectPicturePostState(project: PoietekProject): PicturePostState | null {
  const value = project.extensions[PICTURE_POST_EXTENSION_KEY];
  if (value === undefined) return null;
  if (!value || typeof value !== 'object') throw new Error('Picture post extension is malformed.');
  const state = value as PicturePostState;
  const issues = validatePicturePostState(state, project);
  if (issues.length) throw new Error(issues.join(' '));
  return state;
}

export type PicturePostMutation = (state: PicturePostState) => PicturePostState;

export function mutateProjectPicturePostState(
  project: PoietekProject,
  mutation: PicturePostMutation,
): PoietekProject {
  const firstVideoAssetId = project.assets.find((asset) => asset.mediaType === 'video')?.id ?? null;
  const current = getProjectPicturePostState(project) ?? createPicturePostState(project.id, {pictureAssetId: firstVideoAssetId});
  return withProjectPicturePostState(project, mutation(current));
}

function validateNext(state: PicturePostState, project?: PoietekProject): PicturePostState {
  const issues = validatePicturePostState(state, project);
  if (issues.length) throw new Error(issues.join(' '));
  return state;
}

function validateCueShape(cue: AdrCue): void {
  if (!cue.id.trim() || !cue.cueNumber.trim()) throw new Error('ADR cues require an id and cue number.');
  if (!Number.isInteger(cue.startFrame) || cue.startFrame < 0 || !Number.isInteger(cue.endFrame) || cue.endFrame <= cue.startFrame) {
    throw new Error(`ADR cue ${cue.id || '(unknown)'} must use a positive whole-frame range.`);
  }
  if (cue.fieldReference) {
    if (!cue.fieldReference.scene.trim() || !cue.fieldReference.take.trim()) throw new Error(`ADR cue ${cue.id} field reference requires scene and take metadata.`);
  }
}

function validateTakeShape(take: AdrTakeReference): void {
  if (!take.id.trim() || !take.cueId.trim() || !take.audioAssetId.trim()) throw new Error('ADR takes require take, cue and audio asset ids.');
  if (!Number.isInteger(take.takeNumber) || take.takeNumber < 1) throw new Error(`ADR take ${take.id} needs a positive whole take number.`);
  if (take.rating !== null && (![1, 2, 3, 4, 5].includes(take.rating))) throw new Error(`ADR take ${take.id} rating must be from 1 to 5.`);
}

function validateChangeSegments(segments: readonly PictureChangeSegment[]): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  segments.forEach((segment, index) => {
    if (!segment.id.trim()) issues.push('Picture change segments require ids.');
    if (ids.has(segment.id)) issues.push(`Duplicate picture change segment ${segment.id}.`);
    ids.add(segment.id);
    if (![segment.oldStartFrame, segment.oldEndFrame, segment.newStartFrame, segment.newEndFrame].every(Number.isInteger)
      || segment.oldStartFrame < 0 || segment.newStartFrame < 0
      || segment.oldEndFrame <= segment.oldStartFrame || segment.newEndFrame <= segment.newStartFrame) {
      issues.push(`Picture change segment ${segment.id || '(unknown)'} has an invalid frame range.`);
    }
    const previous = segments[index - 1];
    if (previous && segment.oldStartFrame < previous.oldEndFrame) issues.push(`Picture change segment ${segment.id} overlaps an old-picture segment.`);
  });
  return issues;
}

function matchFieldAsset(asset: Asset, reference: FieldRecorderReference): FieldRecorderMatch | null {
  const scene = metadataText(asset, 'scene');
  const take = metadataText(asset, 'take');
  const tape = metadataText(asset, 'tape') ?? metadataText(asset, 'reel');
  const matchedAttributes: ('scene' | 'take' | 'tape')[] = [];
  if (sameMetadata(scene, reference.scene)) matchedAttributes.push('scene');
  if (sameMetadata(take, reference.take)) matchedAttributes.push('take');
  if (reference.tape && sameMetadata(tape, reference.tape)) matchedAttributes.push('tape');
  if (!matchedAttributes.includes('scene') || !matchedAttributes.includes('take')) return null;
  return {
    assetId: asset.id,
    originalName: asset.originalName,
    matchedAttributes,
    confidence: reference.tape && !matchedAttributes.includes('tape') ? 'review' : 'strong',
  };
}

function metadataText(asset: Asset, key: string): string | null {
  const value = asset.metadata[key];
  return typeof value === 'string' || typeof value === 'number' ? String(value) : null;
}

function sameMetadata(left: string | null, right: string): boolean {
  return Boolean(left && left.trim().toLocaleLowerCase() === right.trim().toLocaleLowerCase());
}

function sortCues(cues: readonly AdrCue[]): AdrCue[] {
  return [...cues].sort((left, right) => left.startFrame - right.startFrame || left.cueNumber.localeCompare(right.cueNumber));
}

function cloneCue(cue: AdrCue): AdrCue {
  return {...cue, fieldReference: cue.fieldReference ? {...cue.fieldReference} : null};
}

function csvCell(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function defaultStartTimecode(frameRate: PictureFrameRate): string {
  return dropFrameRates.has(frameRate) ? '01:00:00;00' : '01:00:00:00';
}
