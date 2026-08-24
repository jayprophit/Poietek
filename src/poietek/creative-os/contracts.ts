export const CREATIVE_OS_SCHEMA_VERSION = '1.0.0' as const;
export const CREATIVE_OS_EXTENSION_KEY = 'org.poietek.creative-os' as const;

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | {[key: string]: JsonValue};
export type JsonObject = {[key: string]: JsonValue};

export type CreativeModality =
  | 'audio'
  | 'music'
  | 'midi'
  | 'video'
  | 'image'
  | 'caption'
  | 'rights'
  | 'metadata'
  | 'project';

export type EvidenceState =
  | {state: 'unverified' | 'self_asserted'; authorityId: null; reference: null; observedAt: null}
  | {state: 'verified' | 'rejected' | 'expired'; authorityId: string; reference: string; observedAt: string};

export interface CreatorIdentity {
  id: string;
  displayName: string;
  identityType: 'person' | 'group' | 'organisation' | 'pseudonym';
  verification: EvidenceState;
  localPrivateProfile: boolean;
  publicProfileCapability: 'disabled' | 'requires_consent' | 'configured';
  createdAt: string;
  updatedAt: string;
}

export type UniversalAssetKind =
  | 'audio'
  | 'midi'
  | 'video'
  | 'image'
  | 'document'
  | 'caption'
  | 'plugin_state'
  | 'template'
  | 'rights_record'
  | 'model'
  | 'other';

export type StorageObservation =
  | {state: 'requested' | 'not_requested' | 'failed' | 'unknown'; externalReference: null; observedAt: string | null}
  | {state: 'stored' | 'deleted'; externalReference: string; observedAt: string};

export interface AssetReplica {
  id: string;
  storageClass: 'opfs' | 'indexeddb' | 'native_file' | 'provider' | 'peer' | 'archive';
  providerId: string | null;
  deviceId: string | null;
  observation: StorageObservation;
  encrypted: boolean | null;
  contentHash: string;
}

export interface UniversalAssetRecord {
  id: string;
  projectId: string;
  kind: UniversalAssetKind;
  title: string;
  contentHash: string;
  mimeType: string | null;
  byteLength: number | null;
  tags: string[];
  tuningProfileId: string | null;
  rightsRecordIds: string[];
  provenanceEvidenceIds: string[];
  replicas: AssetReplica[];
  createdAt: string;
  updatedAt: string;
  metadata: JsonObject;
}

export type CreativeGraphNodeKind =
  | 'project'
  | 'asset'
  | 'creator'
  | 'idea'
  | 'session'
  | 'annotation'
  | 'release'
  | 'rights_record'
  | 'device'
  | 'learning_item';

export interface CreativeGraphNode {
  id: string;
  kind: CreativeGraphNodeKind;
  label: string;
  externalEntityId: string | null;
  tags: string[];
  createdAt: string;
  metadata: JsonObject;
}

export interface CreativeGraphEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  relation:
    | 'contains'
    | 'created_by'
    | 'derived_from'
    | 'references'
    | 'annotates'
    | 'contributes_to'
    | 'requires'
    | 'supersedes'
    | 'renders'
    | 'uses_device'
    | 'custom';
  createdByActorId: string;
  createdAt: string;
  evidenceRefs: string[];
  metadata: JsonObject;
}

export interface UniversalAnnotation {
  id: string;
  targetNodeId: string;
  modality: CreativeModality;
  authorId: string;
  body: string;
  visibility: 'local_private' | 'team' | 'public';
  status: 'active' | 'resolved' | 'superseded';
  startSeconds: number | null;
  endSeconds: number | null;
  createdAt: string;
  resolvedAt: string | null;
  externalPublication: StorageObservation;
}

export interface StudioJournalEntry {
  id: string;
  entryType: 'note' | 'decision' | 'inspiration' | 'checkpoint' | 'question';
  title: string;
  body: string;
  authorId: string;
  linkedNodeIds: string[];
  createdAt: string;
  updatedAt: string;
  visibility: 'local_private' | 'team';
}

export interface CreativeIntentRule {
  id: string;
  modality: CreativeModality;
  trait: string;
  instruction: 'preserve' | 'avoid' | 'prefer' | 'do_not_treat_as_error';
  reason: string;
  createdByActorId: string;
  createdAt: string;
  active: boolean;
}

export interface CreativeIntentLock {
  enabled: boolean;
  rules: CreativeIntentRule[];
  updatedAt: string;
}

export type AdviceClass =
  | 'required_by_target'
  | 'technical_best_practice'
  | 'reference_norm'
  | 'creative_option';

export interface CrossModalFinding {
  id: string;
  modality: CreativeModality;
  subject: string;
  classification: AdviceClass;
  state: 'pass' | 'fail' | 'warning' | 'not_measured' | 'not_applicable';
  message: string;
  targetProfileId: string | null;
  requirementId: string | null;
  evidenceRefs: string[];
  affectedIntentRuleIds: string[];
  measuredAt: string | null;
}

export interface UniversalPreflight {
  targetProfileId: string | null;
  evaluatedAt: string | null;
  findings: CrossModalFinding[];
  summary: {
    requiredFailures: number;
    technicalWarnings: number;
    creativeSuggestions: number;
    unmeasuredRequiredChecks: number;
  };
}

export interface StoragePolicy {
  preferredOrder: Array<'opfs' | 'indexeddb' | 'native_file' | 'provider' | 'peer' | 'archive'>;
  minimumLocalReplicas: number;
  minimumRemoteReplicas: number;
  verifyHashesOnRead: boolean;
  allowProviderStorage: boolean;
  allowPeerStorage: boolean;
  encryptionRequiredForRemote: boolean;
}

export interface CrossDeviceHandoff {
  id: string;
  projectId: string;
  createdAt: string;
  sourceDeviceId: string;
  destinationDeviceId: string | null;
  projectRevision: number;
  activeArea: 'arrange' | 'rack' | 'console' | 'inspect' | 'community' | 'vision';
  playheadSamples: number;
  selectedTrackId: string | null;
  selectedClipId: string | null;
  assetRequirements: Array<{
    assetId: string;
    state: 'available' | 'transfer_required' | 'unavailable';
    fallback: 'none' | 'proxy' | 'freeze_render' | 'original_only';
  }>;
  pluginRequirements: Array<{
    pluginId: string;
    state: 'available' | 'unsupported' | 'not_evaluated';
    statePreserved: boolean;
    fallbackAssetId: string | null;
  }>;
  remoteDelivery: StorageObservation;
}

export interface CreativeOsFoundation {
  schemaVersion: typeof CREATIVE_OS_SCHEMA_VERSION;
  projectId: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
  localActorId: string;
  creatorIdentities: CreatorIdentity[];
  assets: UniversalAssetRecord[];
  graph: {nodes: CreativeGraphNode[]; edges: CreativeGraphEdge[]};
  annotations: UniversalAnnotation[];
  journal: StudioJournalEntry[];
  intent: CreativeIntentLock;
  preflight: UniversalPreflight;
  storagePolicy: StoragePolicy;
  handoffs: CrossDeviceHandoff[];
}

export interface CreativeOsValidationIssue {
  code: string;
  path: string;
  message: string;
}
