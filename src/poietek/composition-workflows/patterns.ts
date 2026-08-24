import type {PoietekProject} from '../domain/types';
import {
  COMPOSITION_WORKFLOW_EXTENSION_KEY,
  COMPOSITION_WORKFLOW_SCHEMA_VERSION,
  type ArrangementClip,
  type ArrangementLane,
  type CompositionPattern,
  type CompositionWorkflowState,
  type PatternChannel,
  type PatternStep,
} from './contracts';

const cloneStep = (step: PatternStep): PatternStep => ({...step});
const cloneChannel = (channel: PatternChannel): PatternChannel => ({
  ...channel,
  steps: channel.steps.map(cloneStep),
});

export function createCompositionWorkflowState(projectId: string): CompositionWorkflowState {
  if (!projectId.trim()) throw new Error('Composition workflow requires a project id.');
  return {
    schemaVersion: COMPOSITION_WORKFLOW_SCHEMA_VERSION,
    projectId,
    revision: 0,
    patterns: [],
    lanes: [],
    automationEnvelopes: [],
    retrospectiveCapture: {
      maximumSeconds: 60,
      armedIntent: false,
      observation: null,
      lastRecallAssetId: null,
    },
    loopStarterDrafts: [],
    songSections: [],
    songArrangements: [],
    lyrics: {scratchpad: '', cues: []},
    mixScenes: [],
    activeMixSceneId: null,
  };
}

export function createPattern(
  id: string,
  name: string,
  stepCount = 16,
  stepsPerBeat = 4,
): CompositionPattern {
  if (!id.trim()) throw new Error('Pattern id is required.');
  if (!name.trim()) throw new Error('Pattern name is required.');
  if (!Number.isInteger(stepCount) || stepCount < 1 || stepCount > 256) {
    throw new Error('Pattern step count must be a whole number from 1 to 256.');
  }
  if (!Number.isInteger(stepsPerBeat) || stepsPerBeat < 1 || stepsPerBeat > 16) {
    throw new Error('Pattern steps per beat must be a whole number from 1 to 16.');
  }
  return {id, name, stepCount, stepsPerBeat, swing: 0.5, channels: []};
}

export function addPatternChannel(
  pattern: CompositionPattern,
  channel: Omit<PatternChannel, 'steps'> & {steps?: PatternStep[]},
): CompositionPattern {
  if (!channel.id.trim() || !channel.name.trim()) {
    throw new Error('Pattern channel id and name are required.');
  }
  if (pattern.channels.some((candidate) => candidate.id === channel.id)) {
    throw new Error(`Pattern channel ${channel.id} already exists.`);
  }
  const next = {...channel, steps: (channel.steps ?? []).map(cloneStep)};
  return {...pattern, channels: [...pattern.channels.map(cloneChannel), next]};
}

export function setPatternStep(
  pattern: CompositionPattern,
  channelId: string,
  stepIndex: number,
  step: Omit<PatternStep, 'stepIndex'> | null,
): CompositionPattern {
  if (!Number.isInteger(stepIndex) || stepIndex < 0 || stepIndex >= pattern.stepCount) {
    throw new Error(`Step index must be between 0 and ${pattern.stepCount - 1}.`);
  }
  if (!pattern.channels.some((channel) => channel.id === channelId)) {
    throw new Error(`Pattern channel ${channelId} was not found.`);
  }
  return {
    ...pattern,
    channels: pattern.channels.map((channel) => {
      if (channel.id !== channelId) return cloneChannel(channel);
      const retained = channel.steps.filter((candidate) => candidate.stepIndex !== stepIndex);
      const steps = step ? [...retained, {stepIndex, ...step}] : retained;
      steps.sort((left, right) => left.stepIndex - right.stepIndex);
      return {...channel, steps};
    }),
  };
}

export function clonePattern(
  pattern: CompositionPattern,
  id: string,
  name = `${pattern.name} copy`,
): CompositionPattern {
  if (!id.trim()) throw new Error('Cloned pattern id is required.');
  return {...pattern, id, name, channels: pattern.channels.map(cloneChannel)};
}

export function addPatternToWorkflow(
  state: CompositionWorkflowState,
  pattern: CompositionPattern,
): CompositionWorkflowState {
  if (state.patterns.some((candidate) => candidate.id === pattern.id)) {
    throw new Error(`Pattern ${pattern.id} already exists in the workflow.`);
  }
  return {...state, revision: state.revision + 1, patterns: [...state.patterns, pattern]};
}

export function replacePatternInWorkflow(
  state: CompositionWorkflowState,
  pattern: CompositionPattern,
): CompositionWorkflowState {
  if (!state.patterns.some((candidate) => candidate.id === pattern.id)) {
    throw new Error(`Pattern ${pattern.id} was not found in the workflow.`);
  }
  return {
    ...state,
    revision: state.revision + 1,
    patterns: state.patterns.map((candidate) => (
      candidate.id === pattern.id
        ? {...pattern, channels: pattern.channels.map(cloneChannel)}
        : {...candidate, channels: candidate.channels.map(cloneChannel)}
    )),
  };
}

export function addArrangementLane(
  state: CompositionWorkflowState,
  lane: Omit<ArrangementLane, 'clips'> & {clips?: ArrangementClip[]},
): CompositionWorkflowState {
  if (!lane.id.trim() || !lane.name.trim()) throw new Error('Arrangement lane id and name are required.');
  if (state.lanes.some((candidate) => candidate.id === lane.id)) {
    throw new Error(`Arrangement lane ${lane.id} already exists.`);
  }
  return {
    ...state,
    revision: state.revision + 1,
    lanes: [...state.lanes, {...lane, clips: (lane.clips ?? []).map((clip) => ({...clip}))}],
  };
}

export function placeArrangementClip(
  state: CompositionWorkflowState,
  laneId: string,
  clip: ArrangementClip,
): CompositionWorkflowState {
  const lane = state.lanes.find((candidate) => candidate.id === laneId);
  if (!lane) throw new Error(`Arrangement lane ${laneId} was not found.`);
  const requiredSource = lane.binding === 'instrument' ? 'pattern' : lane.binding;
  if (requiredSource !== 'free' && requiredSource !== clip.sourceKind) {
    throw new Error(`${clip.sourceKind} clips are incompatible with ${lane.binding} lane ${laneId}.`);
  }
  if (state.lanes.some((candidate) => candidate.clips.some((item) => item.id === clip.id))) {
    throw new Error(`Arrangement clip ${clip.id} already exists.`);
  }
  if (clip.sourceKind === 'pattern' && !state.patterns.some((pattern) => pattern.id === clip.sourceId)) {
    throw new Error(`Pattern source ${clip.sourceId} was not found.`);
  }
  if (!Number.isInteger(clip.startTick) || clip.startTick < 0) {
    throw new Error('Arrangement clip start must be a non-negative whole tick.');
  }
  if (!Number.isInteger(clip.durationTicks) || clip.durationTicks < 1) {
    throw new Error('Arrangement clip duration must be a positive whole tick value.');
  }
  return {
    ...state,
    revision: state.revision + 1,
    lanes: state.lanes.map((candidate) => candidate.id === laneId
      ? {...candidate, clips: [...candidate.clips.map((item) => ({...item})), {...clip}]}
      : {...candidate, clips: candidate.clips.map((item) => ({...item}))}),
  };
}

export function validateCompositionWorkflow(
  state: CompositionWorkflowState,
  validAudioAssetIds?: ReadonlySet<string>,
): string[] {
  const issues: string[] = [];
  if (state.schemaVersion !== COMPOSITION_WORKFLOW_SCHEMA_VERSION) issues.push('Unsupported composition workflow schema version.');
  if (!state.projectId.trim()) issues.push('Composition workflow project id is required.');
  if (!Number.isInteger(state.revision) || state.revision < 0) issues.push('Composition workflow revision must be a non-negative whole number.');

  const patternIds = new Set<string>();
  for (const pattern of state.patterns) {
    if (!pattern.id.trim()) issues.push('Pattern id is required.');
    if (patternIds.has(pattern.id)) issues.push(`Duplicate pattern id ${pattern.id}.`);
    patternIds.add(pattern.id);
    if (!pattern.name.trim()) issues.push(`Pattern ${pattern.id} requires a name.`);
    if (!Number.isInteger(pattern.stepCount) || pattern.stepCount < 1 || pattern.stepCount > 256) issues.push(`Pattern ${pattern.id} has an invalid step count.`);
    if (!Number.isInteger(pattern.stepsPerBeat) || pattern.stepsPerBeat < 1 || pattern.stepsPerBeat > 16) issues.push(`Pattern ${pattern.id} has an invalid beat resolution.`);
    if (!Number.isFinite(pattern.swing) || pattern.swing < 0 || pattern.swing > 1) issues.push(`Pattern ${pattern.id} swing must be between 0 and 1.`);
    const channelIds = new Set<string>();
    for (const channel of pattern.channels) {
      if (channelIds.has(channel.id)) issues.push(`Pattern ${pattern.id} has duplicate channel ${channel.id}.`);
      channelIds.add(channel.id);
      if (!channel.id.trim() || !channel.name.trim()) issues.push(`Pattern ${pattern.id} has an unnamed channel.`);
      const stepIndexes = new Set<number>();
      for (const step of channel.steps) {
        if (stepIndexes.has(step.stepIndex)) issues.push(`Channel ${channel.id} has duplicate step ${step.stepIndex}.`);
        stepIndexes.add(step.stepIndex);
        if (!Number.isInteger(step.stepIndex) || step.stepIndex < 0 || step.stepIndex >= pattern.stepCount) issues.push(`Channel ${channel.id} has an out-of-range step.`);
        if (!Number.isInteger(step.note) || step.note < 0 || step.note > 127) issues.push(`Channel ${channel.id} has an invalid MIDI note.`);
        if (!Number.isInteger(step.velocity) || step.velocity < 1 || step.velocity > 127) issues.push(`Channel ${channel.id} has an invalid velocity.`);
        if (!Number.isFinite(step.probability) || step.probability < 0 || step.probability > 1) issues.push(`Channel ${channel.id} has an invalid probability.`);
        if (!Number.isFinite(step.microShiftTicks)) issues.push(`Channel ${channel.id} has an invalid micro shift.`);
        if (!Number.isFinite(step.lengthSteps) || step.lengthSteps <= 0) issues.push(`Channel ${channel.id} has an invalid step length.`);
      }
    }
  }

  const laneIds = new Set<string>();
  const clipIds = new Set<string>();
  const automationIds = new Set<string>();
  for (const envelope of state.automationEnvelopes) {
    if (automationIds.has(envelope.id)) issues.push(`Duplicate automation envelope id ${envelope.id}.`);
    automationIds.add(envelope.id);
    if (!envelope.id.trim() || !envelope.targetId.trim() || !envelope.parameterId.trim()) issues.push('Automation envelope id, target and parameter are required.');
    const pointTicks = new Set<number>();
    for (const point of envelope.points) {
      if (pointTicks.has(point.tick)) issues.push(`Automation envelope ${envelope.id} has duplicate point tick ${point.tick}.`);
      pointTicks.add(point.tick);
      if (!Number.isInteger(point.tick) || point.tick < 0) issues.push(`Automation envelope ${envelope.id} has an invalid point tick.`);
      if (!Number.isFinite(point.value) || point.value < 0 || point.value > 1) issues.push(`Automation envelope ${envelope.id} has an invalid point value.`);
      if (!Number.isFinite(point.tension) || point.tension < -1 || point.tension > 1) issues.push(`Automation envelope ${envelope.id} has an invalid point tension.`);
    }
  }
  for (const lane of state.lanes) {
    if (laneIds.has(lane.id)) issues.push(`Duplicate arrangement lane id ${lane.id}.`);
    laneIds.add(lane.id);
    if (!lane.id.trim() || !lane.name.trim()) issues.push('Arrangement lane id and name are required.');
    for (const clip of lane.clips) {
      if (clipIds.has(clip.id)) issues.push(`Duplicate arrangement clip id ${clip.id}.`);
      clipIds.add(clip.id);
      if (!Number.isInteger(clip.startTick) || clip.startTick < 0) issues.push(`Arrangement clip ${clip.id} has an invalid start.`);
      if (!Number.isInteger(clip.durationTicks) || clip.durationTicks < 1) issues.push(`Arrangement clip ${clip.id} has an invalid duration.`);
      if (clip.sourceKind === 'pattern' && !patternIds.has(clip.sourceId)) issues.push(`Arrangement clip ${clip.id} references missing pattern ${clip.sourceId}.`);
      if (clip.sourceKind === 'automation' && !automationIds.has(clip.sourceId)) issues.push(`Arrangement clip ${clip.id} references missing automation ${clip.sourceId}.`);
      if (clip.sourceKind === 'audio' && validAudioAssetIds && !validAudioAssetIds.has(clip.sourceId)) issues.push(`Arrangement clip ${clip.id} references missing audio asset ${clip.sourceId}.`);
      const requiredSource = lane.binding === 'instrument' ? 'pattern' : lane.binding;
      if (requiredSource !== 'free' && requiredSource !== clip.sourceKind) issues.push(`Arrangement clip ${clip.id} is incompatible with ${lane.binding} lane ${lane.id}.`);
    }
  }

  const capture = state.retrospectiveCapture;
  if (!Number.isFinite(capture.maximumSeconds) || capture.maximumSeconds <= 0 || capture.maximumSeconds > 600) issues.push('Retrospective capture maximum is invalid.');
  if (capture.observation) {
    if (!capture.armedIntent) issues.push('Retrospective capture cannot retain an observation while disarmed.');
    if (!capture.observation.adapterId.trim() || !capture.observation.streamId.trim()) issues.push('Retrospective capture observation requires adapter and stream ids.');
    if (!Number.isFinite(capture.observation.bufferedSeconds) || capture.observation.bufferedSeconds < 0 || capture.observation.bufferedSeconds > capture.maximumSeconds) issues.push('Retrospective capture observed duration is invalid.');
  }
  if (capture.lastRecallAssetId && validAudioAssetIds && !validAudioAssetIds.has(capture.lastRecallAssetId)) issues.push(`Retrospective capture references missing asset ${capture.lastRecallAssetId}.`);

  const draftIds = new Set<string>();
  for (const draft of state.loopStarterDrafts) {
    if (draftIds.has(draft.id)) issues.push(`Duplicate loop starter draft id ${draft.id}.`);
    draftIds.add(draft.id);
    if (!draft.id.trim() || !draft.seed.trim()) issues.push('Loop starter draft id and seed are required.');
    if (!Number.isFinite(draft.targetBpm) || draft.targetBpm < 20 || draft.targetBpm > 400) issues.push(`Loop starter draft ${draft.id} has an invalid target BPM.`);
    if (draft.renderState !== 'not_requested') issues.push(`Loop starter draft ${draft.id} has an unsupported render state.`);
    const roles = new Set<string>();
    for (const selection of draft.selections) {
      if (roles.has(selection.role)) issues.push(`Loop starter draft ${draft.id} has duplicate role ${selection.role}.`);
      roles.add(selection.role);
      if (validAudioAssetIds && !validAudioAssetIds.has(selection.assetId)) issues.push(`Loop starter draft ${draft.id} references missing asset ${selection.assetId}.`);
    }
    if ((draft.missingRoles.length === 0) !== (draft.status === 'ready_for_preview')) issues.push(`Loop starter draft ${draft.id} readiness does not match its missing roles.`);
  }

  const sectionIds = new Set<string>();
  for (const section of state.songSections) {
    if (sectionIds.has(section.id)) issues.push(`Duplicate song section id ${section.id}.`);
    sectionIds.add(section.id);
    if (!section.id.trim() || !section.name.trim()) issues.push('Song section id and name are required.');
    if (!Number.isInteger(section.sourceStartTick) || section.sourceStartTick < 0) issues.push(`Song section ${section.id} has an invalid source start.`);
    if (!Number.isInteger(section.durationTicks) || section.durationTicks < 1) issues.push(`Song section ${section.id} has an invalid duration.`);
  }
  const arrangementIds = new Set<string>();
  for (const arrangement of state.songArrangements) {
    if (arrangementIds.has(arrangement.id)) issues.push(`Duplicate song arrangement id ${arrangement.id}.`);
    arrangementIds.add(arrangement.id);
    if (!arrangement.id.trim() || !arrangement.name.trim()) issues.push('Song arrangement id and name are required.');
    for (const sectionId of arrangement.sectionIds) if (!sectionIds.has(sectionId)) issues.push(`Song arrangement ${arrangement.id} references missing section ${sectionId}.`);
  }
  const lyricIds = new Set<string>();
  for (const cue of state.lyrics.cues) {
    if (lyricIds.has(cue.id)) issues.push(`Duplicate lyric cue id ${cue.id}.`);
    lyricIds.add(cue.id);
    if (!cue.id.trim() || !cue.text.trim()) issues.push('Lyric cue id and text are required.');
    if (!Number.isInteger(cue.startTick) || cue.startTick < 0 || !Number.isInteger(cue.durationTicks) || cue.durationTicks < 1) issues.push(`Lyric cue ${cue.id} has an invalid time range.`);
  }
  const sceneIds = new Set<string>();
  for (const scene of state.mixScenes) {
    if (sceneIds.has(scene.id)) issues.push(`Duplicate mix scene id ${scene.id}.`);
    sceneIds.add(scene.id);
    if (!scene.id.trim() || !scene.name.trim() || Number.isNaN(Date.parse(scene.createdAt))) issues.push(`Mix scene ${scene.id} has invalid identity metadata.`);
    const targets = new Set<string>();
    for (const target of scene.targets) {
      if (targets.has(target.targetId)) issues.push(`Mix scene ${scene.id} has duplicate target ${target.targetId}.`);
      targets.add(target.targetId);
      if (!target.targetId.trim() || !Number.isFinite(target.gainDb) || !Number.isFinite(target.pan) || target.pan < -1 || target.pan > 1) issues.push(`Mix scene ${scene.id} has invalid target state.`);
    }
  }
  if (state.activeMixSceneId !== null && !sceneIds.has(state.activeMixSceneId)) issues.push(`Active mix scene ${state.activeMixSceneId} was not found.`);
  return issues;
}

export function withProjectCompositionWorkflow(
  project: PoietekProject,
  state: CompositionWorkflowState,
): PoietekProject {
  if (state.projectId !== project.id) throw new Error('Composition workflow project id does not match the canonical project.');
  const issues = validateCompositionWorkflow(state, new Set(project.assets.map((asset) => asset.id)));
  if (issues.length) throw new Error(issues.join(' '));
  return {
    ...project,
    updatedAt: new Date().toISOString(),
    extensions: {...project.extensions, [COMPOSITION_WORKFLOW_EXTENSION_KEY]: state},
  };
}

export function getProjectCompositionWorkflow(project: PoietekProject): CompositionWorkflowState | null {
  const value = project.extensions[COMPOSITION_WORKFLOW_EXTENSION_KEY];
  if (value === undefined) return null;
  const raw = value as Partial<Omit<CompositionWorkflowState, 'schemaVersion'>> & {schemaVersion?: string};
  if (!raw || typeof raw !== 'object') throw new Error('Composition workflow extension is malformed.');
  const state = raw.schemaVersion === '1.0.0'
    ? {
        ...raw,
        schemaVersion: COMPOSITION_WORKFLOW_SCHEMA_VERSION,
        songSections: raw.songSections ?? [],
        songArrangements: raw.songArrangements ?? [],
        lyrics: raw.lyrics ?? {scratchpad: '', cues: []},
        mixScenes: raw.mixScenes ?? [],
        activeMixSceneId: raw.activeMixSceneId ?? null,
      } as CompositionWorkflowState
    : raw as CompositionWorkflowState;
  if (state.projectId !== project.id) throw new Error('Composition workflow extension belongs to another project.');
  const issues = validateCompositionWorkflow(state, new Set(project.assets.map((asset) => asset.id)));
  if (issues.length) throw new Error(issues.join(' '));
  return state;
}
