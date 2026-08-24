import type {PoietekProject} from '../domain/types';
import type {ProductionAdapterObservation} from './contracts';

export const LIVE_SESSION_EXTENSION_KEY = 'org.poietek.live-session-hub' as const;
export const LIVE_SESSION_SCHEMA_VERSION = '1.0.0' as const;

export type LiveCaptureSourceKind =
  | 'microphone'
  | 'line'
  | 'instrument'
  | 'usb_left'
  | 'usb_right'
  | 'network'
  | 'other';

export interface LiveCaptureChannelPlan {
  id: string;
  sourceName: string;
  sourceKind: LiveCaptureSourceKind;
  captureIntent: 'safe' | 'armed';
  canonicalTrackId: string | null;
  namingAuthority: 'source' | 'track' | 'manual';
}

export type RemoteSessionRole = 'engineer' | 'performer' | 'observer';
export type RemoteSessionScope =
  | 'full_mix'
  | 'assigned_cue'
  | 'transport'
  | 'capture'
  | 'read_only';

/** A saved access policy, not evidence that a remote participant is connected. */
export interface RemoteAccessRule {
  id: string;
  subjectLabel: string;
  role: RemoteSessionRole;
  scopes: readonly RemoteSessionScope[];
  assignedCueId: string | null;
  consentAcknowledgedAt: string | null;
}

export interface SessionEndpointObservation {
  id: string;
  adapterId: string;
  endpointId: string;
  endpointName: string;
  direction: 'input' | 'output' | 'control_peer';
  state: 'available' | 'unavailable';
  observedAt: number;
  activeStreamId?: string;
  protocolFamily?: string;
  softwareVersion?: string;
  firmwareVersion?: string;
  compatibility: 'unknown' | 'compatible' | 'incompatible';
  evidenceReference?: string;
}

export type SessionInterchangeKind =
  | 'dawproject'
  | 'audioloop'
  | 'musicloop'
  | 'ara_audio_access'
  | 'sound_variation_discovery';

export interface LiveSessionState {
  schemaVersion: typeof LIVE_SESSION_SCHEMA_VERSION;
  projectId: string;
  revision: number;
  channels: readonly LiveCaptureChannelPlan[];
  remoteAccessRules: readonly RemoteAccessRule[];
  endpointObservations: readonly SessionEndpointObservation[];
  soundcheck: {
    assetIds: readonly string[];
    outputEndpointId: string | null;
  };
}

export interface ChannelNameSyncEntry {
  channelId: string;
  sourceName: string;
  canonicalTrackId: string | null;
  canonicalTrackName: string | null;
  proposedName: string;
  status: 'unlinked' | 'already_matched' | 'rename_source' | 'rename_track' | 'manual_review';
}

export interface ChannelNameSyncPlan {
  entries: readonly ChannelNameSyncEntry[];
  conflicts: readonly string[];
  canApplyAutomatically: boolean;
  claim: string;
}

export interface VirtualSoundcheckRequest {
  state:
    | 'recorded_assets_required'
    | 'output_route_required'
    | 'adapter_required'
    | 'ready_for_adapter';
  assetIds: readonly string[];
  outputEndpointId?: string;
  adapterId?: string;
  message: string;
}

export interface SessionInterchangeReadiness {
  kind: SessionInterchangeKind;
  state: 'adapter_required' | 'adapter_observed';
  adapterId?: string;
  message: string;
}

const allowedScopes: Readonly<Record<RemoteSessionRole, readonly RemoteSessionScope[]>> = {
  engineer: ['full_mix', 'transport', 'capture', 'read_only'],
  performer: ['assigned_cue', 'read_only'],
  observer: ['read_only'],
};

const interchangeCapabilities: Readonly<Record<SessionInterchangeKind, string>> = {
  dawproject: 'dawproject_interchange',
  audioloop: 'audioloop_interchange',
  musicloop: 'musicloop_interchange',
  ara_audio_access: 'ara_audio_access',
  sound_variation_discovery: 'sound_variation_discovery',
};

export function createLiveSessionState(projectId: string): LiveSessionState {
  if (!projectId.trim()) throw new Error('Live session hub requires a project id.');
  return {
    schemaVersion: LIVE_SESSION_SCHEMA_VERSION,
    projectId,
    revision: 0,
    channels: [],
    remoteAccessRules: [],
    endpointObservations: [],
    soundcheck: {assetIds: [], outputEndpointId: null},
  };
}

export function upsertLiveCaptureChannel(
  state: LiveSessionState,
  channel: LiveCaptureChannelPlan,
): LiveSessionState {
  if (!channel.id.trim() || !channel.sourceName.trim()) {
    throw new Error('Capture channels require an id and source name.');
  }
  const channels = state.channels.some((candidate) => candidate.id === channel.id)
    ? state.channels.map((candidate) => candidate.id === channel.id ? {...channel} : {...candidate})
    : [...state.channels.map((candidate) => ({...candidate})), {...channel}];
  return validateNext({...state, revision: state.revision + 1, channels});
}

export function upsertRemoteAccessRule(
  state: LiveSessionState,
  rule: RemoteAccessRule,
  issuerRole: 'owner' | 'engineer',
): LiveSessionState {
  if (!rule.id.trim() || !rule.subjectLabel.trim()) {
    throw new Error('Remote access rules require an id and subject label.');
  }
  if (issuerRole === 'engineer' && rule.role === 'engineer') {
    throw new Error('Only the project owner may create or change an engineer access rule.');
  }
  const allowed = new Set(allowedScopes[rule.role]);
  if (!rule.scopes.length || rule.scopes.some((scope) => !allowed.has(scope))) {
    throw new Error(`${rule.role} access contains a scope that the role cannot receive.`);
  }
  if (rule.scopes.includes('assigned_cue') !== Boolean(rule.assignedCueId?.trim())) {
    throw new Error('Assigned-cue access requires exactly one named cue.');
  }
  if (rule.role !== 'observer' && !rule.consentAcknowledgedAt) {
    throw new Error('Engineer and performer access policies require an explicit local consent acknowledgement.');
  }
  if (rule.consentAcknowledgedAt && Number.isNaN(Date.parse(rule.consentAcknowledgedAt))) {
    throw new Error('Remote access consent acknowledgement must be an ISO date.');
  }
  const remoteAccessRules = state.remoteAccessRules.some((candidate) => candidate.id === rule.id)
    ? state.remoteAccessRules.map((candidate) => candidate.id === rule.id
      ? {...rule, scopes: [...rule.scopes]}
      : {...candidate, scopes: [...candidate.scopes]})
    : [...state.remoteAccessRules.map((candidate) => ({...candidate, scopes: [...candidate.scopes]})), {...rule, scopes: [...rule.scopes]}];
  return validateNext({...state, revision: state.revision + 1, remoteAccessRules});
}

export function recordSessionEndpointObservation(
  state: LiveSessionState,
  observation: SessionEndpointObservation,
): LiveSessionState {
  if (!observation.id.trim() || !observation.adapterId.trim() || !observation.endpointId.trim()) {
    throw new Error('Endpoint observations require observation, adapter and endpoint ids.');
  }
  if (!Number.isFinite(observation.observedAt) || observation.observedAt <= 0) {
    throw new Error('Endpoint observations require a real observation time.');
  }
  if (observation.activeStreamId && observation.state !== 'available') {
    throw new Error('An unavailable endpoint cannot retain an active stream observation.');
  }
  const endpointObservations = state.endpointObservations.some((candidate) => candidate.id === observation.id)
    ? state.endpointObservations.map((candidate) => candidate.id === observation.id ? {...observation} : {...candidate})
    : [...state.endpointObservations.map((candidate) => ({...candidate})), {...observation}];
  return validateNext({...state, revision: state.revision + 1, endpointObservations});
}

export function setVirtualSoundcheckSelection(
  state: LiveSessionState,
  assetIds: readonly string[],
  outputEndpointId: string | null,
): LiveSessionState {
  const uniqueAssetIds = [...new Set(assetIds)];
  if (uniqueAssetIds.some((assetId) => !assetId.trim())) {
    throw new Error('Virtual soundcheck asset ids cannot be blank.');
  }
  return validateNext({
    ...state,
    revision: state.revision + 1,
    soundcheck: {assetIds: uniqueAssetIds, outputEndpointId},
  });
}

export function deriveChannelNameSyncPlan(
  state: LiveSessionState,
  project: PoietekProject,
): ChannelNameSyncPlan {
  if (state.projectId !== project.id) throw new Error('Live session state belongs to another project.');
  const conflicts: string[] = [];
  const linkedTrackIds = new Set<string>();
  const proposedNames = new Set<string>();
  const entries = state.channels.map<ChannelNameSyncEntry>((channel) => {
    const track = channel.canonicalTrackId
      ? project.tracks.find((candidate) => candidate.id === channel.canonicalTrackId) ?? null
      : null;
    if (channel.canonicalTrackId && !track) conflicts.push(`Channel ${channel.id} references a missing project track.`);
    if (track && linkedTrackIds.has(track.id)) conflicts.push(`More than one capture channel targets track ${track.id}.`);
    if (track) linkedTrackIds.add(track.id);
    const proposedName = channel.namingAuthority === 'track' && track ? track.name : channel.sourceName;
    const normalized = proposedName.trim().toLocaleLowerCase();
    if (proposedNames.has(normalized)) conflicts.push(`More than one capture channel proposes the name ${proposedName}.`);
    proposedNames.add(normalized);
    const status: ChannelNameSyncEntry['status'] = !track
      ? 'unlinked'
      : channel.namingAuthority === 'manual'
        ? 'manual_review'
        : track.name === channel.sourceName
          ? 'already_matched'
          : channel.namingAuthority === 'source' ? 'rename_track' : 'rename_source';
    return {
      channelId: channel.id,
      sourceName: channel.sourceName,
      canonicalTrackId: channel.canonicalTrackId,
      canonicalTrackName: track?.name ?? null,
      proposedName,
      status,
    };
  });
  return {
    entries,
    conflicts,
    canApplyAutomatically: entries.length > 0
      && conflicts.length === 0
      && entries.every((entry) => entry.status !== 'unlinked' && entry.status !== 'manual_review'),
    claim: conflicts.length
      ? 'Naming handoff is blocked until every conflict is resolved.'
      : 'This is a deterministic rename plan; no hardware channel or canonical track has been renamed yet.',
  };
}

export function createVirtualSoundcheckRequest(
  state: LiveSessionState,
  project: PoietekProject,
  adapterObservations: readonly ProductionAdapterObservation[],
): VirtualSoundcheckRequest {
  if (state.projectId !== project.id) throw new Error('Live session state belongs to another project.');
  const knownAudioAssetIds = new Set(project.assets
    .filter((asset) => asset.mediaType === 'audio')
    .map((asset) => asset.id));
  const usableAssetIds = state.soundcheck.assetIds.filter((assetId) => knownAudioAssetIds.has(assetId));
  if (!usableAssetIds.length) {
    return {
      state: 'recorded_assets_required',
      assetIds: [],
      message: 'Virtual soundcheck needs at least one real audio asset stored in the canonical project.',
    };
  }
  const output = state.endpointObservations.find((observation) => (
    observation.endpointId === state.soundcheck.outputEndpointId
    && observation.direction === 'output'
    && observation.state === 'available'
    && observation.compatibility !== 'incompatible'
  ));
  if (!output) {
    return {
      state: 'output_route_required',
      assetIds: usableAssetIds,
      message: 'Recorded audio is selected, but a compatible physical output route has not been observed.',
    };
  }
  const adapter = adapterObservations.find((observation) => (
    observation.capability === 'virtual_soundcheck_playback' && observation.state === 'available'
  ));
  if (!adapter) {
    return {
      state: 'adapter_required',
      assetIds: usableAssetIds,
      outputEndpointId: output.endpointId,
      message: 'The recording and output route are known, but no virtual-soundcheck playback adapter is available.',
    };
  }
  return {
    state: 'ready_for_adapter',
    assetIds: usableAssetIds,
    outputEndpointId: output.endpointId,
    adapterId: adapter.adapterId,
    message: 'The request is ready for the observed adapter. Playback is not active until the adapter returns stream evidence.',
  };
}

export function deriveSessionInterchangeReadiness(
  kind: SessionInterchangeKind,
  observations: readonly ProductionAdapterObservation[],
): SessionInterchangeReadiness {
  const capability = interchangeCapabilities[kind];
  const adapter = observations.find((observation) => (
    observation.capability === capability && observation.state === 'available'
  ));
  return adapter
    ? {
        kind,
        state: 'adapter_observed',
        adapterId: adapter.adapterId,
        message: `An adapter declared ${capability}; its returned payload still requires format validation.`,
      }
    : {
        kind,
        state: 'adapter_required',
        message: `${capability} is unavailable until a reviewed adapter supplies evidence.`,
      };
}

export function validateLiveSessionState(
  state: LiveSessionState,
  project?: PoietekProject,
): string[] {
  const issues: string[] = [];
  if (state.schemaVersion !== LIVE_SESSION_SCHEMA_VERSION) issues.push('Unsupported live session schema version.');
  if (!state.projectId.trim()) issues.push('Live session project id is required.');
  if (!Number.isInteger(state.revision) || state.revision < 0) issues.push('Live session revision must be a non-negative whole number.');
  if (project && state.projectId !== project.id) issues.push('Live session project id does not match the canonical project.');
  const channelIds = new Set<string>();
  const knownTrackIds = project ? new Set(project.tracks.map((track) => track.id)) : null;
  for (const channel of state.channels) {
    if (!channel.id.trim() || !channel.sourceName.trim()) issues.push('Capture channel ids and names are required.');
    if (channelIds.has(channel.id)) issues.push(`Duplicate capture channel ${channel.id}.`);
    channelIds.add(channel.id);
    if (channel.canonicalTrackId && knownTrackIds && !knownTrackIds.has(channel.canonicalTrackId)) {
      issues.push(`Capture channel ${channel.id} references missing track ${channel.canonicalTrackId}.`);
    }
  }
  const ruleIds = new Set<string>();
  for (const rule of state.remoteAccessRules) {
    if (ruleIds.has(rule.id)) issues.push(`Duplicate remote access rule ${rule.id}.`);
    ruleIds.add(rule.id);
    if (!rule.id.trim() || !rule.subjectLabel.trim()) issues.push('Remote access rule ids and labels are required.');
    const allowed = new Set(allowedScopes[rule.role]);
    if (!rule.scopes.length || rule.scopes.some((scope) => !allowed.has(scope))) issues.push(`Remote access rule ${rule.id} exceeds its role.`);
    if (rule.scopes.includes('assigned_cue') !== Boolean(rule.assignedCueId?.trim())) issues.push(`Remote access rule ${rule.id} has an invalid cue assignment.`);
    if (rule.role !== 'observer' && !rule.consentAcknowledgedAt) issues.push(`Remote access rule ${rule.id} lacks consent acknowledgement.`);
  }
  const observationIds = new Set<string>();
  for (const observation of state.endpointObservations) {
    if (observationIds.has(observation.id)) issues.push(`Duplicate endpoint observation ${observation.id}.`);
    observationIds.add(observation.id);
    if (!observation.adapterId.trim() || !observation.endpointId.trim()) issues.push(`Endpoint observation ${observation.id} lacks adapter evidence.`);
    if (!Number.isFinite(observation.observedAt) || observation.observedAt <= 0) issues.push(`Endpoint observation ${observation.id} has an invalid time.`);
    if (observation.activeStreamId && observation.state !== 'available') issues.push(`Endpoint observation ${observation.id} has an impossible active stream.`);
  }
  const knownAudioAssetIds = project ? new Set(project.assets.filter((asset) => asset.mediaType === 'audio').map((asset) => asset.id)) : null;
  for (const assetId of state.soundcheck.assetIds) {
    if (!assetId.trim()) issues.push('Virtual soundcheck asset ids cannot be blank.');
    if (knownAudioAssetIds && !knownAudioAssetIds.has(assetId)) issues.push(`Virtual soundcheck references missing audio asset ${assetId}.`);
  }
  return issues;
}

export function withProjectLiveSessionState(
  project: PoietekProject,
  state: LiveSessionState,
): PoietekProject {
  const issues = validateLiveSessionState(state, project);
  if (issues.length) throw new Error(issues.join(' '));
  return {
    ...project,
    updatedAt: new Date().toISOString(),
    extensions: {...project.extensions, [LIVE_SESSION_EXTENSION_KEY]: state},
  };
}

export function getProjectLiveSessionState(project: PoietekProject): LiveSessionState | null {
  const value = project.extensions[LIVE_SESSION_EXTENSION_KEY];
  if (value === undefined) return null;
  if (!value || typeof value !== 'object') throw new Error('Live session extension is malformed.');
  const state = value as LiveSessionState;
  const issues = validateLiveSessionState(state, project);
  if (issues.length) throw new Error(issues.join(' '));
  return state;
}

export type LiveSessionMutation = (state: LiveSessionState) => LiveSessionState;

export function mutateProjectLiveSessionState(
  project: PoietekProject,
  mutation: LiveSessionMutation,
): PoietekProject {
  const current = getProjectLiveSessionState(project) ?? createLiveSessionState(project.id);
  return withProjectLiveSessionState(project, mutation(current));
}

function validateNext(state: LiveSessionState): LiveSessionState {
  const issues = validateLiveSessionState(state);
  if (issues.length) throw new Error(issues.join(' '));
  return state;
}
