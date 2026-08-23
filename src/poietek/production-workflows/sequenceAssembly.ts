import type {PoietekProject} from '../domain/types';

export const SEQUENCE_ASSEMBLY_EXTENSION_KEY = 'org.poietek.sequence-assembly' as const;
export const SEQUENCE_ASSEMBLY_SCHEMA_VERSION = '1.0.0' as const;

export type SequencePurpose = 'song' | 'picture_cue' | 'live_set' | 'scratch';
export type SequenceStatus = 'draft' | 'ready' | 'approved';
export type TempoCurve = 'step' | 'linear';
export type MarkerRole = 'section' | 'rehearsal' | 'hit' | 'streamer' | 'note';
export type ProgramTransition = 'continue' | 'stop' | 'count_in';
export type SharedResourceKind = 'instrument' | 'effect_return' | 'monitor' | 'external_slot';
export type ResourceEngineState = 'control_model' | 'adapter_required' | 'adapter_observed';

export interface SequenceTempoEvent {
  id: string;
  beat: number;
  bpm: number;
  curve: TempoCurve;
}

export interface SequenceMeterEvent {
  id: string;
  beat: number;
  numerator: number;
  denominator: 1 | 2 | 4 | 8 | 16 | 32;
}

export interface SequenceKeyEvent {
  id: string;
  beat: number;
  tonic: number;
  mode: 'major' | 'minor' | 'dorian' | 'mixolydian' | 'chromatic';
}

export interface SequenceMarker {
  id: string;
  beat: number;
  name: string;
  role: MarkerRole;
}

export interface SequenceConductorMap {
  tempo: readonly SequenceTempoEvent[];
  meter: readonly SequenceMeterEvent[];
  key: readonly SequenceKeyEvent[];
  markers: readonly SequenceMarker[];
}

export interface ProjectSequence {
  id: string;
  name: string;
  purpose: SequencePurpose;
  durationBeats: number;
  canonicalTrackIds: readonly string[];
  conductor: SequenceConductorMap;
  status: SequenceStatus;
  notes: string;
}

export interface SharedSequenceResource {
  id: string;
  name: string;
  kind: SharedResourceKind;
  canonicalTrackId: string | null;
  processorReference: string | null;
  requiredCapability: string | null;
  engineState: ResourceEngineState;
}

export interface SequenceResourceLink {
  sequenceId: string;
  resourceId: string;
}

export interface SequenceProgramEntry {
  id: string;
  sequenceId: string;
  repeats: number;
  transition: ProgramTransition;
  countInBeats: number;
}

export interface SequenceProgram {
  id: string;
  name: string;
  entries: readonly SequenceProgramEntry[];
  notes: string;
}

export interface SequenceAssemblyState {
  schemaVersion: typeof SEQUENCE_ASSEMBLY_SCHEMA_VERSION;
  projectId: string;
  revision: number;
  activeSequenceId: string | null;
  activeProgramId: string | null;
  sequences: readonly ProjectSequence[];
  sharedResources: readonly SharedSequenceResource[];
  resourceLinks: readonly SequenceResourceLink[];
  programs: readonly SequenceProgram[];
}

export interface ResolvedProgramPass {
  entryId: string;
  sequenceId: string;
  sequenceName: string;
  pass: number;
  countInStartBeat: number | null;
  sourceStartBeat: number;
  sourceEndBeat: number;
  stopAfter: boolean;
}

export interface ResolvedSequenceProgram {
  programId: string;
  revision: number;
  totalBeats: number;
  passes: readonly ResolvedProgramPass[];
  claim: string;
}

export interface ConductorPosition {
  sequenceId: string;
  beat: number;
  tempo: SequenceTempoEvent;
  meter: SequenceMeterEvent;
  key: SequenceKeyEvent;
  markers: readonly SequenceMarker[];
}

export interface SequenceAssemblyReadiness {
  localPlanReady: boolean;
  activeSequenceReady: boolean;
  sharedResourcesObserved: boolean;
  playbackObserved: boolean;
  renderObserved: boolean;
  missingCapabilities: readonly string[];
  claim: string;
}

export function createSequenceAssemblyState(projectId: string): SequenceAssemblyState {
  if (!projectId.trim()) throw new Error('Sequence assembly requires a project id.');
  return {
    schemaVersion: SEQUENCE_ASSEMBLY_SCHEMA_VERSION,
    projectId,
    revision: 0,
    activeSequenceId: null,
    activeProgramId: null,
    sequences: [],
    sharedResources: [],
    resourceLinks: [],
    programs: [],
  };
}

export function createProjectSequence(
  id: string,
  name: string,
  purpose: SequencePurpose,
  durationBeats: number,
  options?: {
    canonicalTrackIds?: readonly string[];
    bpm?: number;
    meter?: readonly [number, SequenceMeterEvent['denominator']];
    tonic?: number;
    mode?: SequenceKeyEvent['mode'];
    status?: SequenceStatus;
    notes?: string;
  },
): ProjectSequence {
  return {
    id,
    name,
    purpose,
    durationBeats,
    canonicalTrackIds: [...(options?.canonicalTrackIds ?? [])],
    conductor: {
      tempo: [{id: `${id}:tempo:0`, beat: 0, bpm: options?.bpm ?? 120, curve: 'step'}],
      meter: [{id: `${id}:meter:0`, beat: 0, numerator: options?.meter?.[0] ?? 4, denominator: options?.meter?.[1] ?? 4}],
      key: [{id: `${id}:key:0`, beat: 0, tonic: options?.tonic ?? 0, mode: options?.mode ?? 'major'}],
      markers: [],
    },
    status: options?.status ?? 'draft',
    notes: options?.notes ?? '',
  };
}

export function upsertProjectSequence(
  state: SequenceAssemblyState,
  sequence: ProjectSequence,
): SequenceAssemblyState {
  validateSequenceShape(sequence);
  const nextSequence = cloneSequence(sequence);
  const sequences = state.sequences.some((candidate) => candidate.id === sequence.id)
    ? state.sequences.map((candidate) => candidate.id === sequence.id ? nextSequence : cloneSequence(candidate))
    : [...state.sequences.map(cloneSequence), nextSequence];
  return validateNext({
    ...state,
    revision: state.revision + 1,
    activeSequenceId: state.activeSequenceId ?? sequence.id,
    sequences,
  });
}

export function updateSequenceConductor(
  state: SequenceAssemblyState,
  sequenceId: string,
  update: Partial<SequenceConductorMap>,
): SequenceAssemblyState {
  const sequence = requireSequence(state, sequenceId);
  const conductor = normalizeConductor({...sequence.conductor, ...update});
  return upsertProjectSequence(state, {...cloneSequence(sequence), conductor});
}

export function setActiveProjectSequence(
  state: SequenceAssemblyState,
  sequenceId: string,
): SequenceAssemblyState {
  requireSequence(state, sequenceId);
  return validateNext({...state, revision: state.revision + 1, activeSequenceId: sequenceId});
}

export function upsertSharedSequenceResource(
  state: SequenceAssemblyState,
  resource: SharedSequenceResource,
): SequenceAssemblyState {
  validateResourceShape(resource);
  const resources = state.sharedResources.some((candidate) => candidate.id === resource.id)
    ? state.sharedResources.map((candidate) => candidate.id === resource.id ? {...resource} : {...candidate})
    : [...state.sharedResources.map((candidate) => ({...candidate})), {...resource}];
  return validateNext({...state, revision: state.revision + 1, sharedResources: resources});
}

export function setSequenceSharedResources(
  state: SequenceAssemblyState,
  sequenceId: string,
  resourceIds: readonly string[],
): SequenceAssemblyState {
  requireSequence(state, sequenceId);
  const knownResources = new Set(state.sharedResources.map((resource) => resource.id));
  const uniqueResourceIds = [...new Set(resourceIds)];
  for (const resourceId of uniqueResourceIds) {
    if (!knownResources.has(resourceId)) throw new Error(`Unknown shared resource: ${resourceId}`);
  }
  const retained = state.resourceLinks.filter((link) => link.sequenceId !== sequenceId).map((link) => ({...link}));
  const resourceLinks = [
    ...retained,
    ...uniqueResourceIds.map((resourceId) => ({sequenceId, resourceId})),
  ];
  return validateNext({...state, revision: state.revision + 1, resourceLinks});
}

export function upsertSequenceProgram(
  state: SequenceAssemblyState,
  program: SequenceProgram,
): SequenceAssemblyState {
  validateProgramShape(program, new Set(state.sequences.map((sequence) => sequence.id)));
  const nextProgram = cloneProgram(program);
  const programs = state.programs.some((candidate) => candidate.id === program.id)
    ? state.programs.map((candidate) => candidate.id === program.id ? nextProgram : cloneProgram(candidate))
    : [...state.programs.map(cloneProgram), nextProgram];
  return validateNext({
    ...state,
    revision: state.revision + 1,
    activeProgramId: state.activeProgramId ?? program.id,
    programs,
  });
}

export function setActiveSequenceProgram(
  state: SequenceAssemblyState,
  programId: string,
): SequenceAssemblyState {
  if (!state.programs.some((program) => program.id === programId)) throw new Error(`Unknown sequence program: ${programId}`);
  return validateNext({...state, revision: state.revision + 1, activeProgramId: programId});
}

export function resolveSequenceProgram(
  state: SequenceAssemblyState,
  programId: string,
): ResolvedSequenceProgram {
  const program = state.programs.find((candidate) => candidate.id === programId);
  if (!program) throw new Error(`Unknown sequence program: ${programId}`);
  const sequences = new Map(state.sequences.map((sequence) => [sequence.id, sequence]));
  const passes: ResolvedProgramPass[] = [];
  let cursor = 0;
  for (const entry of program.entries) {
    const sequence = sequences.get(entry.sequenceId);
    if (!sequence) throw new Error(`Program ${program.id} references missing sequence ${entry.sequenceId}.`);
    for (let pass = 1; pass <= entry.repeats; pass += 1) {
      const countIn = entry.transition === 'count_in' ? entry.countInBeats : 0;
      const countInStartBeat = countIn > 0 ? cursor : null;
      const sourceStartBeat = cursor + countIn;
      const sourceEndBeat = sourceStartBeat + sequence.durationBeats;
      passes.push({
        entryId: entry.id,
        sequenceId: sequence.id,
        sequenceName: sequence.name,
        pass,
        countInStartBeat,
        sourceStartBeat,
        sourceEndBeat,
        stopAfter: entry.transition === 'stop',
      });
      cursor = sourceEndBeat;
    }
  }
  return {
    programId,
    revision: state.revision,
    totalBeats: cursor,
    passes,
    claim: 'This is a deterministic assembly plan. It does not claim transport playback, plug-in processing, hardware sync or rendered audio.',
  };
}

export function getSequenceConductorPosition(
  state: SequenceAssemblyState,
  sequenceId: string,
  beat: number,
): ConductorPosition {
  const sequence = requireSequence(state, sequenceId);
  if (!Number.isFinite(beat) || beat < 0 || beat > sequence.durationBeats) throw new Error('Conductor position must be within the sequence range.');
  return {
    sequenceId,
    beat,
    tempo: latestAtOrBefore(sequence.conductor.tempo, beat),
    meter: latestAtOrBefore(sequence.conductor.meter, beat),
    key: latestAtOrBefore(sequence.conductor.key, beat),
    markers: sequence.conductor.markers.filter((marker) => marker.beat === beat).map((marker) => ({...marker})),
  };
}

export function deriveSequenceAssemblyReadiness(
  state: SequenceAssemblyState,
  observedCapabilities: readonly string[],
): SequenceAssemblyReadiness {
  const observed = new Set(observedCapabilities);
  const requiredResourceCapabilities = [...new Set(state.sharedResources
    .map((resource) => resource.requiredCapability)
    .filter((capability): capability is string => Boolean(capability)))];
  const required = [...requiredResourceCapabilities, 'sequence_transport', 'sequence_audio_render'];
  const missingCapabilities = required.filter((capability) => !observed.has(capability));
  const activeSequenceReady = Boolean(state.activeSequenceId && state.sequences.some((sequence) => sequence.id === state.activeSequenceId));
  const localPlanReady = activeSequenceReady && state.programs.some((program) => program.entries.length > 0);
  const sharedResourcesObserved = requiredResourceCapabilities.every((capability) => observed.has(capability));
  const playbackObserved = observed.has('sequence_transport');
  const renderObserved = observed.has('sequence_audio_render');
  return {
    localPlanReady,
    activeSequenceReady,
    sharedResourcesObserved,
    playbackObserved,
    renderObserved,
    missingCapabilities,
    claim: missingCapabilities.length
      ? `Local sequence and conductor data is available; adapter evidence is missing for: ${missingCapabilities.join(', ')}.`
      : 'All declared assembly capabilities were observed. The owning adapter must retain evidence for each playback or render operation.',
  };
}

export function createSequenceProgramManifest(
  state: SequenceAssemblyState,
  programId: string,
): string {
  const plan = resolveSequenceProgram(state, programId);
  const program = state.programs.find((candidate) => candidate.id === programId)!;
  return JSON.stringify({
    schema: 'org.poietek.sequence-program-manifest/1.0.0',
    projectId: state.projectId,
    sourceRevision: state.revision,
    program: {id: program.id, name: program.name, notes: program.notes},
    plan,
    sharedResources: state.sharedResources.map((resource) => ({...resource})),
    resourceLinks: state.resourceLinks.map((link) => ({...link})),
    truth: 'Planning metadata only. No audio, plug-in, device, synchronization or delivery result is embedded or claimed.',
  }, null, 2);
}

export function validateSequenceAssemblyState(
  state: SequenceAssemblyState,
  project?: PoietekProject,
): string[] {
  const issues: string[] = [];
  if (state.schemaVersion !== SEQUENCE_ASSEMBLY_SCHEMA_VERSION) issues.push('Unsupported sequence assembly schema version.');
  if (!state.projectId.trim()) issues.push('Sequence assembly project id is required.');
  if (!Number.isInteger(state.revision) || state.revision < 0) issues.push('Sequence assembly revision must be a non-negative whole number.');
  if (project && state.projectId !== project.id) issues.push('Sequence assembly project id does not match the canonical project.');
  const knownTrackIds = project ? new Set(project.tracks.map((track) => track.id)) : null;
  const sequenceIds = new Set<string>();
  for (const sequence of state.sequences) {
    if (sequenceIds.has(sequence.id)) issues.push(`Duplicate project sequence ${sequence.id}.`);
    sequenceIds.add(sequence.id);
    try { validateSequenceShape(sequence); } catch (reason) { issues.push(errorText(reason)); }
    if (knownTrackIds) {
      for (const trackId of sequence.canonicalTrackIds) {
        if (!knownTrackIds.has(trackId)) issues.push(`Sequence ${sequence.id} references missing track ${trackId}.`);
      }
    }
  }
  if (state.activeSequenceId && !sequenceIds.has(state.activeSequenceId)) issues.push('Active sequence id is not present in the project sequence list.');
  const resourceIds = new Set<string>();
  for (const resource of state.sharedResources) {
    if (resourceIds.has(resource.id)) issues.push(`Duplicate shared sequence resource ${resource.id}.`);
    resourceIds.add(resource.id);
    try { validateResourceShape(resource); } catch (reason) { issues.push(errorText(reason)); }
    if (resource.canonicalTrackId && knownTrackIds && !knownTrackIds.has(resource.canonicalTrackId)) {
      issues.push(`Shared resource ${resource.id} references missing track ${resource.canonicalTrackId}.`);
    }
  }
  const linkKeys = new Set<string>();
  for (const link of state.resourceLinks) {
    const key = `${link.sequenceId}:${link.resourceId}`;
    if (linkKeys.has(key)) issues.push(`Duplicate sequence resource link ${key}.`);
    linkKeys.add(key);
    if (!sequenceIds.has(link.sequenceId)) issues.push(`Shared resource link references missing sequence ${link.sequenceId}.`);
    if (!resourceIds.has(link.resourceId)) issues.push(`Shared resource link references missing resource ${link.resourceId}.`);
  }
  const programIds = new Set<string>();
  for (const program of state.programs) {
    if (programIds.has(program.id)) issues.push(`Duplicate sequence program ${program.id}.`);
    programIds.add(program.id);
    try { validateProgramShape(program, sequenceIds); } catch (reason) { issues.push(errorText(reason)); }
  }
  if (state.activeProgramId && !programIds.has(state.activeProgramId)) issues.push('Active program id is not present in the sequence program list.');
  return issues;
}

export function withProjectSequenceAssemblyState(
  project: PoietekProject,
  state: SequenceAssemblyState,
): PoietekProject {
  const issues = validateSequenceAssemblyState(state, project);
  if (issues.length) throw new Error(issues.join(' '));
  return {
    ...project,
    updatedAt: new Date().toISOString(),
    extensions: {...project.extensions, [SEQUENCE_ASSEMBLY_EXTENSION_KEY]: state},
  };
}

export function getProjectSequenceAssemblyState(project: PoietekProject): SequenceAssemblyState | null {
  const value = project.extensions[SEQUENCE_ASSEMBLY_EXTENSION_KEY];
  if (value === undefined) return null;
  if (!value || typeof value !== 'object') throw new Error('Sequence assembly extension is malformed.');
  const state = value as SequenceAssemblyState;
  const issues = validateSequenceAssemblyState(state, project);
  if (issues.length) throw new Error(issues.join(' '));
  return state;
}

export type SequenceAssemblyMutation = (state: SequenceAssemblyState) => SequenceAssemblyState;

export function mutateProjectSequenceAssemblyState(
  project: PoietekProject,
  mutation: SequenceAssemblyMutation,
): PoietekProject {
  const current = getProjectSequenceAssemblyState(project) ?? createSequenceAssemblyState(project.id);
  return withProjectSequenceAssemblyState(project, mutation(current));
}

function validateNext(state: SequenceAssemblyState, project?: PoietekProject): SequenceAssemblyState {
  const issues = validateSequenceAssemblyState(state, project);
  if (issues.length) throw new Error(issues.join(' '));
  return state;
}

function requireSequence(state: SequenceAssemblyState, sequenceId: string): ProjectSequence {
  const sequence = state.sequences.find((candidate) => candidate.id === sequenceId);
  if (!sequence) throw new Error(`Unknown project sequence: ${sequenceId}`);
  return sequence;
}

function validateSequenceShape(sequence: ProjectSequence): void {
  if (!sequence.id.trim() || !sequence.name.trim()) throw new Error('Project sequences require an id and name.');
  if (!Number.isFinite(sequence.durationBeats) || sequence.durationBeats <= 0) throw new Error(`Sequence ${sequence.id} needs a positive duration in beats.`);
  if (new Set(sequence.canonicalTrackIds).size !== sequence.canonicalTrackIds.length) throw new Error(`Sequence ${sequence.id} repeats a canonical track id.`);
  validateConductor(sequence.id, sequence.conductor, sequence.durationBeats);
}

function validateConductor(sequenceId: string, conductor: SequenceConductorMap, durationBeats: number): void {
  if (!conductor.tempo.length || conductor.tempo[0]?.beat !== 0) throw new Error(`Sequence ${sequenceId} conductor needs a tempo event at beat zero.`);
  if (!conductor.meter.length || conductor.meter[0]?.beat !== 0) throw new Error(`Sequence ${sequenceId} conductor needs a meter event at beat zero.`);
  if (!conductor.key.length || conductor.key[0]?.beat !== 0) throw new Error(`Sequence ${sequenceId} conductor needs a key event at beat zero.`);
  const allEvents = [...conductor.tempo, ...conductor.meter, ...conductor.key, ...conductor.markers];
  const ids = new Set<string>();
  for (const event of allEvents) {
    if (!event.id.trim()) throw new Error(`Sequence ${sequenceId} conductor events require ids.`);
    if (ids.has(event.id)) throw new Error(`Sequence ${sequenceId} has duplicate conductor event ${event.id}.`);
    ids.add(event.id);
    if (!Number.isFinite(event.beat) || event.beat < 0 || event.beat > durationBeats) throw new Error(`Sequence ${sequenceId} conductor event ${event.id} is outside its duration.`);
  }
  for (const event of conductor.tempo) if (!Number.isFinite(event.bpm) || event.bpm < 20 || event.bpm > 400) throw new Error(`Sequence ${sequenceId} tempo must be between 20 and 400 BPM.`);
  for (const event of conductor.meter) if (!Number.isInteger(event.numerator) || event.numerator < 1 || event.numerator > 64) throw new Error(`Sequence ${sequenceId} meter numerator must be from 1 to 64.`);
  for (const event of conductor.key) if (!Number.isInteger(event.tonic) || event.tonic < 0 || event.tonic > 11) throw new Error(`Sequence ${sequenceId} key tonic must be from 0 to 11.`);
  for (const marker of conductor.markers) if (!marker.name.trim()) throw new Error(`Sequence ${sequenceId} markers require names.`);
}

function validateResourceShape(resource: SharedSequenceResource): void {
  if (!resource.id.trim() || !resource.name.trim()) throw new Error('Shared sequence resources require an id and name.');
  if (resource.engineState === 'adapter_observed' && !resource.requiredCapability) throw new Error(`Observed resource ${resource.id} must name its evidenced capability.`);
}

function validateProgramShape(program: SequenceProgram, sequenceIds: ReadonlySet<string>): void {
  if (!program.id.trim() || !program.name.trim()) throw new Error('Sequence programs require an id and name.');
  const entryIds = new Set<string>();
  for (const entry of program.entries) {
    if (!entry.id.trim()) throw new Error(`Program ${program.id} entries require ids.`);
    if (entryIds.has(entry.id)) throw new Error(`Program ${program.id} has duplicate entry ${entry.id}.`);
    entryIds.add(entry.id);
    if (!sequenceIds.has(entry.sequenceId)) throw new Error(`Program ${program.id} references missing sequence ${entry.sequenceId}.`);
    if (!Number.isInteger(entry.repeats) || entry.repeats < 1 || entry.repeats > 64) throw new Error(`Program entry ${entry.id} repeats must be from 1 to 64.`);
    if (!Number.isFinite(entry.countInBeats) || entry.countInBeats < 0 || (entry.transition !== 'count_in' && entry.countInBeats !== 0)) {
      throw new Error(`Program entry ${entry.id} has an invalid count-in.`);
    }
  }
}

function normalizeConductor(conductor: SequenceConductorMap): SequenceConductorMap {
  return {
    tempo: [...conductor.tempo].map((event) => ({...event})).sort(eventOrder),
    meter: [...conductor.meter].map((event) => ({...event})).sort(eventOrder),
    key: [...conductor.key].map((event) => ({...event})).sort(eventOrder),
    markers: [...conductor.markers].map((event) => ({...event})).sort(eventOrder),
  };
}

function cloneSequence(sequence: ProjectSequence): ProjectSequence {
  return {...sequence, canonicalTrackIds: [...sequence.canonicalTrackIds], conductor: normalizeConductor(sequence.conductor)};
}

function cloneProgram(program: SequenceProgram): SequenceProgram {
  return {...program, entries: program.entries.map((entry) => ({...entry}))};
}

function eventOrder(left: {beat: number; id: string}, right: {beat: number; id: string}): number {
  return left.beat - right.beat || left.id.localeCompare(right.id);
}

function latestAtOrBefore<T extends {beat: number}>(events: readonly T[], beat: number): T {
  return events.reduce((latest, event) => event.beat <= beat ? event : latest, events[0]!);
}

function errorText(reason: unknown): string {
  return reason instanceof Error ? reason.message : String(reason);
}
