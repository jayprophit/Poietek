import type {PoietekProject, Track} from '../domain/types';
import {
  addScorePlayer,
  createScoreDocument,
  getProjectScoreDocument,
  insertScoreNote,
  validateScoreDocument,
  withProjectScoreDocument,
  type ScoreDocument,
  type ScoreNoteEvent,
} from '../production-workflows/score';
import {
  TECHNIQUE_MATRIX_EXTENSION_KEY,
  TECHNIQUE_MATRIX_SCHEMA_VERSION,
  type PerformanceTechnique,
  type PlannedTechniqueAction,
  type TechniqueAssignment,
  type TechniqueMap,
  type TechniqueMatrixReadinessItem,
  type TechniqueMatrixState,
  type TechniquePlaybackPlan,
  type TechniquePlaybackPlanEvent,
  type TechniqueSoundSlot,
  type TechniqueTriggerAction,
} from './contracts';

function clone<T>(value: T): T {
  return structuredClone(value);
}

function nonBlank(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function inMidiRange(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 127;
}

function validChannel(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 16;
}

function validateTriggerAction(action: TechniqueTriggerAction, slotId: string): string[] {
  const issues: string[] = [];
  if (!['keyswitch', 'cc', 'program_change'].includes(action.kind)) {
    issues.push(`Sound slot ${slotId} has an unsupported trigger kind.`);
  }
  if (!validChannel(action.channel)) issues.push(`Sound slot ${slotId} requires a MIDI channel from 1 to 16.`);
  if (action.kind === 'keyswitch') {
    if (!inMidiRange(action.note)) issues.push(`Sound slot ${slotId} has an invalid keyswitch note.`);
    if (!inMidiRange(action.velocity)) issues.push(`Sound slot ${slotId} has an invalid keyswitch velocity.`);
    if (!Number.isInteger(action.durationTicks) || Number(action.durationTicks) < 1) {
      issues.push(`Sound slot ${slotId} requires a positive keyswitch duration.`);
    }
  }
  if (action.kind === 'cc') {
    if (!inMidiRange(action.controller)) issues.push(`Sound slot ${slotId} has an invalid controller number.`);
    if (!inMidiRange(action.value)) issues.push(`Sound slot ${slotId} has an invalid controller value.`);
  }
  if (action.kind === 'program_change' && !inMidiRange(action.program)) {
    issues.push(`Sound slot ${slotId} has an invalid program number.`);
  }
  return issues;
}

function validateTechniqueMap(map: TechniqueMap): string[] {
  const issues: string[] = [];
  if (!nonBlank(map.id) || !nonBlank(map.name) || !nonBlank(map.instrumentFamily)) {
    issues.push('Technique maps require id, name and instrument family.');
  }
  const techniqueIds = new Set<string>();
  map.techniques.forEach((technique) => {
    if (!nonBlank(technique.id) || !nonBlank(technique.name)) issues.push('Techniques require id and name.');
    if (techniqueIds.has(technique.id)) issues.push(`Duplicate technique ${technique.id}.`);
    techniqueIds.add(technique.id);
    if (!['direction', 'attribute'].includes(technique.kind)) issues.push(`Technique ${technique.id} has an invalid kind.`);
  });
  const groupIds = new Set<string>();
  map.mutualExclusionGroups.forEach((group) => {
    if (!nonBlank(group.id) || !nonBlank(group.name)) issues.push('Mutual-exclusion groups require id and name.');
    if (groupIds.has(group.id)) issues.push(`Duplicate mutual-exclusion group ${group.id}.`);
    groupIds.add(group.id);
    group.techniqueIds.forEach((id) => {
      if (!techniqueIds.has(id)) issues.push(`Mutual-exclusion group ${group.id} references missing technique ${id}.`);
    });
  });
  map.techniques.forEach((technique) => {
    if (technique.mutualExclusionGroupId && !groupIds.has(technique.mutualExclusionGroupId)) {
      issues.push(`Technique ${technique.id} references missing mutual-exclusion group ${technique.mutualExclusionGroupId}.`);
    }
  });
  const bindingNames = new Set<string>();
  map.scoreBindings.forEach((binding) => {
    const normalized = binding.scoreArticulation.trim().toLowerCase();
    if (!normalized) issues.push('Score bindings require an articulation name.');
    if (bindingNames.has(normalized)) issues.push(`Duplicate score binding ${binding.scoreArticulation}.`);
    bindingNames.add(normalized);
    if (!techniqueIds.has(binding.techniqueId)) issues.push(`Score binding ${binding.scoreArticulation} references missing technique ${binding.techniqueId}.`);
  });
  const slotIds = new Set<string>();
  map.soundSlots.forEach((slot) => {
    if (!nonBlank(slot.id) || !nonBlank(slot.name)) issues.push('Sound slots require id and name.');
    if (slotIds.has(slot.id)) issues.push(`Duplicate sound slot ${slot.id}.`);
    slotIds.add(slot.id);
    if (!Number.isInteger(slot.attackCompensationTicks) || slot.attackCompensationTicks < 0) {
      issues.push(`Sound slot ${slot.id} has invalid attack compensation.`);
    }
    slot.techniqueIds.forEach((id) => {
      if (!techniqueIds.has(id)) issues.push(`Sound slot ${slot.id} references missing technique ${id}.`);
    });
    slot.actions.forEach((action) => issues.push(...validateTriggerAction(action, slot.id)));
  });
  map.defaultDirectionTechniqueIds.forEach((id) => {
    const technique = map.techniques.find((candidate) => candidate.id === id);
    if (!technique || technique.kind !== 'direction') issues.push(`Default direction ${id} is missing or is not a direction.`);
  });
  return issues;
}

export function validateTechniqueMatrixState(state: TechniqueMatrixState, project: PoietekProject): string[] {
  const issues: string[] = [];
  if (state.schemaVersion !== TECHNIQUE_MATRIX_SCHEMA_VERSION) issues.push('Unsupported technique-matrix schema.');
  if (state.projectId !== project.id) issues.push('Technique matrix belongs to another project.');
  if (!Number.isInteger(state.revision) || state.revision < 0) issues.push('Technique-matrix revision must be a non-negative integer.');
  const mapIds = new Set<string>();
  state.maps.forEach((map) => {
    if (mapIds.has(map.id)) issues.push(`Duplicate technique map ${map.id}.`);
    mapIds.add(map.id);
    issues.push(...validateTechniqueMap(map));
  });
  const assignmentIds = new Set<string>();
  const score = getProjectScoreDocument(project);
  state.assignments.forEach((assignment) => {
    if (!nonBlank(assignment.id)) issues.push('Technique assignments require an id.');
    if (assignmentIds.has(assignment.id)) issues.push(`Duplicate technique assignment ${assignment.id}.`);
    assignmentIds.add(assignment.id);
    if (!mapIds.has(assignment.mapId)) issues.push(`Assignment ${assignment.id} references missing map ${assignment.mapId}.`);
    if (!project.tracks.some((track) => track.id === assignment.trackId && ['midi', 'instrument'].includes(track.type))) {
      issues.push(`Assignment ${assignment.id} requires an existing MIDI or instrument track.`);
    }
    if (!score || score.id !== assignment.scoreId) issues.push(`Assignment ${assignment.id} references a missing score.`);
    if (!score?.players.some((player) => player.id === assignment.playerId)) issues.push(`Assignment ${assignment.id} references a missing score player.`);
  });
  const operationIds = new Set<string>();
  state.appliedPlans.forEach((record) => {
    if (operationIds.has(record.operationId)) issues.push(`Duplicate committed operation ${record.operationId}.`);
    operationIds.add(record.operationId);
    if (record.state !== 'planned_for_adapter') issues.push(`Committed operation ${record.operationId} has an invalid execution claim.`);
  });
  return issues;
}

export function getProjectTechniqueMatrixState(project: PoietekProject): TechniqueMatrixState | null {
  const value = project.extensions[TECHNIQUE_MATRIX_EXTENSION_KEY];
  if (!value || typeof value !== 'object') return null;
  const state = value as TechniqueMatrixState;
  return state.schemaVersion === TECHNIQUE_MATRIX_SCHEMA_VERSION ? clone(state) : null;
}

export function withProjectTechniqueMatrixState(
  project: PoietekProject,
  state: TechniqueMatrixState,
): PoietekProject {
  const issues = validateTechniqueMatrixState(state, project);
  if (issues.length) throw new Error(issues.join(' '));
  return {
    ...project,
    updatedAt: state.updatedAt,
    extensions: {...project.extensions, [TECHNIQUE_MATRIX_EXTENSION_KEY]: clone(state)},
  };
}

function starterTechniques(): readonly PerformanceTechnique[] {
  return [
    {id: 'tech-natural', name: 'Natural / arco', kind: 'direction', mutualExclusionGroupId: 'sustain-style'},
    {id: 'tech-connected', name: 'Connected / legato', kind: 'direction', mutualExclusionGroupId: 'sustain-style'},
    {id: 'tech-plucked', name: 'Plucked / pizzicato', kind: 'direction', mutualExclusionGroupId: 'sustain-style'},
    {id: 'tech-staccato', name: 'Staccato', kind: 'attribute', mutualExclusionGroupId: null},
    {id: 'tech-accent', name: 'Accent', kind: 'attribute', mutualExclusionGroupId: null},
  ];
}

function keyswitch(note: number): TechniqueTriggerAction {
  return {kind: 'keyswitch', channel: 1, note, velocity: 96, durationTicks: 60};
}

function starterSlots(): readonly TechniqueSoundSlot[] {
  return [
    {id: 'slot-natural', name: 'Natural sustain', techniqueIds: ['tech-natural'], actions: [keyswitch(24)], attackCompensationTicks: 0},
    {id: 'slot-natural-staccato', name: 'Natural staccato', techniqueIds: ['tech-natural', 'tech-staccato'], actions: [keyswitch(25)], attackCompensationTicks: 12},
    {id: 'slot-natural-accent', name: 'Natural accent', techniqueIds: ['tech-natural', 'tech-accent'], actions: [keyswitch(26)], attackCompensationTicks: 8},
    {id: 'slot-connected', name: 'Connected sustain', techniqueIds: ['tech-connected'], actions: [keyswitch(27)], attackCompensationTicks: 18},
    {id: 'slot-connected-staccato', name: 'Connected staccato', techniqueIds: ['tech-connected', 'tech-staccato'], actions: [keyswitch(28)], attackCompensationTicks: 18},
    {id: 'slot-connected-accent', name: 'Connected accent', techniqueIds: ['tech-connected', 'tech-accent'], actions: [keyswitch(29)], attackCompensationTicks: 18},
    {id: 'slot-plucked', name: 'Plucked', techniqueIds: ['tech-plucked'], actions: [keyswitch(30)], attackCompensationTicks: 0},
    {id: 'slot-plucked-staccato', name: 'Plucked staccato', techniqueIds: ['tech-plucked', 'tech-staccato'], actions: [keyswitch(31)], attackCompensationTicks: 0},
    {id: 'slot-plucked-accent', name: 'Plucked accent', techniqueIds: ['tech-plucked', 'tech-accent'], actions: [keyswitch(32)], attackCompensationTicks: 0},
  ];
}

function createStarterMap(instrumentFamily: string): TechniqueMap {
  return {
    id: 'technique-map-starter',
    name: 'Poietek Composer Technique Map',
    instrumentFamily,
    techniques: starterTechniques(),
    mutualExclusionGroups: [{
      id: 'sustain-style',
      name: 'Sustain style',
      techniqueIds: ['tech-natural', 'tech-connected', 'tech-plucked'],
    }],
    scoreBindings: [
      {scoreArticulation: 'natural', techniqueId: 'tech-natural'},
      {scoreArticulation: 'arco', techniqueId: 'tech-natural'},
      {scoreArticulation: 'legato', techniqueId: 'tech-connected'},
      {scoreArticulation: 'connected', techniqueId: 'tech-connected'},
      {scoreArticulation: 'pizzicato', techniqueId: 'tech-plucked'},
      {scoreArticulation: 'pizz.', techniqueId: 'tech-plucked'},
      {scoreArticulation: 'staccato', techniqueId: 'tech-staccato'},
      {scoreArticulation: 'accent', techniqueId: 'tech-accent'},
    ],
    soundSlots: starterSlots(),
    defaultDirectionTechniqueIds: ['tech-natural'],
  };
}

function starterNote(id: string, playerId: string, startBeat: number, pitchOffset: number, articulations: readonly string[]): ScoreNoteEvent {
  const steps = ['C', 'D', 'E', 'F'] as const;
  return {
    id,
    playerId,
    voice: 1,
    startBeat,
    durationBeats: 1,
    writtenPitch: {step: steps[pitchOffset], octave: 4, alteration: 0},
    articulations,
    dynamic: pitchOffset < 2 ? 'mf' : 'f',
  };
}

function ensureStarterScore(project: PoietekProject): {project: PoietekProject; score: ScoreDocument; playerId: string} {
  let score = getProjectScoreDocument(project);
  if (!score) {
    score = createScoreDocument(`${project.id}:score`, `${project.title} Score`);
    score = addScorePlayer(score, {
      id: 'score-player-1',
      name: 'Composer Voice',
      instrumentName: 'General instrument',
      transpositionSemitones: 0,
      staffCount: 1,
    });
    score = insertScoreNote(score, score.flows[0].id, 1, starterNote('score-note-1', 'score-player-1', 0, 0, ['arco']));
    score = insertScoreNote(score, score.flows[0].id, 1, starterNote('score-note-2', 'score-player-1', 1, 1, ['staccato']));
    score = insertScoreNote(score, score.flows[0].id, 1, starterNote('score-note-3', 'score-player-1', 2, 2, ['pizzicato']));
    score = insertScoreNote(score, score.flows[0].id, 1, starterNote('score-note-4', 'score-player-1', 3, 3, ['accent']));
    return {project: withProjectScoreDocument(project, score), score, playerId: 'score-player-1'};
  }
  const scoreIssues = validateScoreDocument(score);
  if (scoreIssues.length) throw new Error(`Existing score is invalid: ${scoreIssues.join(' ')}`);
  if (score.players.length) return {project, score, playerId: score.players[0].id};
  score = addScorePlayer(score, {
    id: 'score-player-1',
    name: 'Composer Voice',
    instrumentName: 'General instrument',
    transpositionSemitones: 0,
    staffCount: 1,
  });
  return {project: withProjectScoreDocument(project, score), score, playerId: 'score-player-1'};
}

function ensureTechniqueTrack(project: PoietekProject): {project: PoietekProject; track: Track} {
  const existing = project.tracks.find((track) => track.type === 'instrument' || track.type === 'midi');
  if (existing) return {project, track: existing};
  const track: Track = {
    id: 'technique-instrument-track',
    type: 'instrument',
    name: 'Technique Instrument',
    order: project.tracks.length,
    color: '#8b5cf6',
    clips: [],
    mixer: {gainDb: 0, pan: 0, mute: false, solo: false},
  };
  return {project: {...project, tracks: [...project.tracks, track]}, track};
}

export function createStarterTechniqueMatrixProject(
  sourceProject: PoietekProject,
  observedAt = new Date().toISOString(),
): PoietekProject {
  const scored = ensureStarterScore(sourceProject);
  const tracked = ensureTechniqueTrack(scored.project);
  const player = scored.score.players.find((candidate) => candidate.id === scored.playerId)!;
  const map = createStarterMap(player.instrumentName || 'General instrument');
  const assignment: TechniqueAssignment = {
    id: 'technique-assignment-starter',
    mapId: map.id,
    trackId: tracked.track.id,
    scoreId: scored.score.id,
    playerId: scored.playerId,
  };
  const state: TechniqueMatrixState = {
    schemaVersion: TECHNIQUE_MATRIX_SCHEMA_VERSION,
    projectId: tracked.project.id,
    revision: 1,
    maps: [map],
    assignments: [assignment],
    appliedPlans: [],
    updatedAt: observedAt,
  };
  return withProjectTechniqueMatrixState({...tracked.project, updatedAt: observedAt}, state);
}

function techniqueSetKey(ids: readonly string[]): string {
  return [...new Set(ids)].sort().join('|');
}

function sourceSignature(score: ScoreDocument, map: TechniqueMap, assignment: TechniqueAssignment, project: PoietekProject): string {
  const source = JSON.stringify({
    score,
    map,
    assignment,
    ppq: project.settings.ppq,
    track: project.tracks.find((candidate) => candidate.id === assignment.trackId) ?? null,
  });
  let hash = 0x811c9dc5;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function mutualExclusionIssues(ids: readonly string[], map: TechniqueMap, noteId: string): string[] {
  const active = new Set(ids);
  return map.mutualExclusionGroups.flatMap((group) => {
    const matches = group.techniqueIds.filter((id) => active.has(id));
    return matches.length > 1
      ? [`Score note ${noteId} activates conflicting techniques in ${group.name}: ${matches.join(', ')}.`]
      : [];
  });
}

function planActions(slot: TechniqueSoundSlot, noteStartTick: number): readonly PlannedTechniqueAction[] {
  const dispatchTick = Math.max(0, noteStartTick - slot.attackCompensationTicks);
  return slot.actions.map((action) => ({...action, dispatchTick}));
}

export function planProjectTechniquePlayback(
  project: PoietekProject,
  mapId: string,
  assignmentId: string,
  operationId: string,
): TechniquePlaybackPlan {
  if (!nonBlank(operationId)) throw new Error('Technique-plan operation id is required.');
  const state = getProjectTechniqueMatrixState(project);
  const issues: string[] = [];
  if (!state) issues.push('Technique Matrix is not initialized for this project.');
  const map = state?.maps.find((candidate) => candidate.id === mapId);
  const assignment = state?.assignments.find((candidate) => candidate.id === assignmentId);
  const score = getProjectScoreDocument(project);
  if (!map) issues.push(`Technique map ${mapId} is unavailable.`);
  if (!assignment) issues.push(`Technique assignment ${assignmentId} is unavailable.`);
  if (!score) issues.push('A canonical score is required before technique playback can be planned.');
  if (state) issues.push(...validateTechniqueMatrixState(state, project));
  if (score) issues.push(...validateScoreDocument(score));

  const emptySignature = 'fnv1a32:00000000';
  if (!map || !assignment || !score) {
    return {
      schemaVersion: TECHNIQUE_MATRIX_SCHEMA_VERSION,
      operationId,
      mapId,
      assignmentId,
      sourceSignature: emptySignature,
      ready: false,
      issues: [...new Set(issues)],
      events: [],
      executionClaim: 'control_plan_only',
    };
  }

  const bindings = new Map(map.scoreBindings.map((binding) => [binding.scoreArticulation.trim().toLowerCase(), binding.techniqueId]));
  const techniqueById = new Map(map.techniques.map((technique) => [technique.id, technique]));
  const slotByKey = new Map(map.soundSlots.map((slot) => [techniqueSetKey(slot.techniqueIds), slot]));
  const activeDirections = new Set(map.defaultDirectionTechniqueIds);
  const events: TechniquePlaybackPlanEvent[] = [];
  let flowOffsetTicks = 0;

  score.flows.forEach((flow) => {
    const beatsPerMeasure = flow.timeSignature.numerator * (4 / flow.timeSignature.denominator);
    const measureTicks = Math.round(beatsPerMeasure * project.settings.ppq);
    flow.measures.forEach((measure, measureIndex) => {
      const notes = [...measure.notes]
        .filter((note) => note.playerId === assignment.playerId)
        .sort((left, right) => left.startBeat - right.startBeat || left.id.localeCompare(right.id));
      notes.forEach((note) => {
        const boundIds: string[] = [];
        note.articulations.forEach((articulation) => {
          const techniqueId = bindings.get(articulation.trim().toLowerCase());
          if (!techniqueId) {
            issues.push(`Score note ${note.id} uses unbound articulation “${articulation}”.`);
            return;
          }
          boundIds.push(techniqueId);
        });
        issues.push(...mutualExclusionIssues(boundIds, map, note.id));
        const attributes: string[] = [];
        boundIds.forEach((techniqueId) => {
          const technique = techniqueById.get(techniqueId);
          if (!technique) return;
          if (technique.kind === 'attribute') {
            attributes.push(techniqueId);
            return;
          }
          if (technique.mutualExclusionGroupId) {
            map.mutualExclusionGroups
              .find((group) => group.id === technique.mutualExclusionGroupId)
              ?.techniqueIds.forEach((id) => activeDirections.delete(id));
          }
          activeDirections.add(techniqueId);
        });
        const techniqueIds = [...activeDirections, ...attributes];
        issues.push(...mutualExclusionIssues(techniqueIds, map, note.id));
        const slot = slotByKey.get(techniqueSetKey(techniqueIds));
        if (!slot) {
          issues.push(`Score note ${note.id} has no exact sound slot for ${techniqueIds.join(' + ') || 'no technique'}.`);
          return;
        }
        const noteStartTick = flowOffsetTicks + (measureIndex * measureTicks) + Math.round(note.startBeat * project.settings.ppq);
        events.push({
          scoreNoteId: note.id,
          playerId: note.playerId,
          noteStartTick,
          noteDurationTicks: Math.round(note.durationBeats * project.settings.ppq),
          soundSlotId: slot.id,
          techniqueIds: [...new Set(techniqueIds)].sort(),
          actions: planActions(slot, noteStartTick),
        });
      });
    });
    flowOffsetTicks += flow.measures.length * measureTicks;
  });

  return {
    schemaVersion: TECHNIQUE_MATRIX_SCHEMA_VERSION,
    operationId,
    mapId,
    assignmentId,
    sourceSignature: sourceSignature(score, map, assignment, project),
    ready: issues.length === 0 && events.length > 0,
    issues: [...new Set(issues.length || events.length ? issues : ['The assigned score player has no notes to plan.'])],
    events,
    executionClaim: 'control_plan_only',
  };
}

export function commitProjectTechniquePlan(
  project: PoietekProject,
  plan: TechniquePlaybackPlan,
  committedAt = new Date().toISOString(),
): PoietekProject {
  if (!plan.ready || plan.issues.length) throw new Error(`Technique plan is not ready: ${plan.issues.join(' ')}`);
  if (plan.executionClaim !== 'control_plan_only') throw new Error('Technique plan has an invalid execution claim.');
  const state = getProjectTechniqueMatrixState(project);
  if (!state) throw new Error('Technique Matrix is not initialized for this project.');
  if (state.appliedPlans.some((record) => record.operationId === plan.operationId)) {
    throw new Error(`Technique plan operation ${plan.operationId} was already committed.`);
  }
  const current = planProjectTechniquePlayback(project, plan.mapId, plan.assignmentId, plan.operationId);
  if (!current.ready
    || current.sourceSignature !== plan.sourceSignature
    || JSON.stringify(current.events) !== JSON.stringify(plan.events)) {
    throw new Error('Technique plan is stale; review a new plan before committing it.');
  }
  const next: TechniqueMatrixState = {
    ...state,
    revision: state.revision + 1,
    appliedPlans: [...state.appliedPlans, {
      operationId: plan.operationId,
      mapId: plan.mapId,
      assignmentId: plan.assignmentId,
      sourceSignature: plan.sourceSignature,
      eventCount: plan.events.length,
      state: 'planned_for_adapter',
      committedAt,
    }],
    updatedAt: committedAt,
  };
  return withProjectTechniqueMatrixState(project, next);
}

export function getTechniqueMatrixReadiness(project: PoietekProject): readonly TechniqueMatrixReadinessItem[] {
  const state = getProjectTechniqueMatrixState(project);
  const score = getProjectScoreDocument(project);
  const localValid = Boolean(state && validateTechniqueMatrixState(state, project).length === 0);
  return [
    {id: 'canonical_score', label: 'Canonical score document', state: score ? 'ready' : 'adapter_required', message: score ? 'Score data is present in the project.' : 'Initialize or add a score document.'},
    {id: 'technique_model', label: 'Versioned technique model', state: localValid ? 'ready' : 'adapter_required', message: localValid ? 'Maps, bindings, slots and assignments validate locally.' : 'Initialize or repair the Technique Matrix.'},
    {id: 'deterministic_plan', label: 'Deterministic switch plan', state: localValid && Boolean(state?.assignments.length) ? 'ready' : 'adapter_required', message: 'Plans use exact score ticks, direction inheritance and one-note attributes.'},
    {id: 'undoable_commit', label: 'Undoable plan record', state: localValid ? 'ready' : 'adapter_required', message: 'Committing records adapter intent through the canonical project session.'},
    {id: 'midi_output', label: 'Live MIDI dispatch', state: 'adapter_required', message: 'No MIDI bytes are sent until a validated output adapter is connected.'},
    {id: 'plugin_host', label: 'Instrument plug-in host', state: 'adapter_required', message: 'VST/AU/AAX hosting remains a native-adapter capability.'},
    {id: 'audible_playback', label: 'Audible articulation playback', state: 'adapter_required', message: 'The plan does not claim rendered or monitored sound.'},
    {id: 'third_party_import', label: 'Third-party map import', state: 'adapter_required', message: 'No proprietary expression-map files are imported or copied.'},
  ];
}
