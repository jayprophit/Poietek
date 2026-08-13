import {
  CREATIVE_OS_SCHEMA_VERSION,
  type CreativeOsFoundation,
  type CreativeGraphNode,
  type UniversalAssetRecord,
} from './contracts';

export interface CreateCreativeOsOptions {
  projectId: string;
  localActorId: string;
  creatorDisplayName?: string;
  now?: string;
}

export function createLocalCreativeOsFoundation(options: CreateCreativeOsOptions): CreativeOsFoundation {
  const now = options.now ?? new Date().toISOString();
  return {
    schemaVersion: CREATIVE_OS_SCHEMA_VERSION,
    projectId: options.projectId,
    revision: 0,
    createdAt: now,
    updatedAt: now,
    localActorId: options.localActorId,
    creatorIdentities: [{
      id: options.localActorId,
      displayName: options.creatorDisplayName ?? 'Local creator',
      identityType: 'person',
      verification: {state: 'self_asserted', authorityId: null, reference: null, observedAt: null},
      localPrivateProfile: true,
      publicProfileCapability: 'disabled',
      createdAt: now,
      updatedAt: now,
    }],
    assets: [],
    graph: {
      nodes: [{
        id: `project:${options.projectId}`,
        kind: 'project',
        label: 'Current project',
        externalEntityId: options.projectId,
        tags: ['local-first'],
        createdAt: now,
        metadata: {},
      }],
      edges: [],
    },
    annotations: [],
    journal: [],
    intent: {enabled: true, rules: [], updatedAt: now},
    preflight: {
      targetProfileId: null,
      evaluatedAt: null,
      findings: [],
      summary: {requiredFailures: 0, technicalWarnings: 0, creativeSuggestions: 0, unmeasuredRequiredChecks: 0},
    },
    storagePolicy: {
      preferredOrder: ['opfs', 'indexeddb', 'native_file', 'provider', 'peer', 'archive'],
      minimumLocalReplicas: 1,
      minimumRemoteReplicas: 0,
      verifyHashesOnRead: true,
      allowProviderStorage: false,
      allowPeerStorage: false,
      encryptionRequiredForRemote: true,
    },
    handoffs: [],
  };
}

export function indexCanonicalAsset(
  foundation: CreativeOsFoundation,
  asset: UniversalAssetRecord,
  now = new Date().toISOString(),
): CreativeOsFoundation {
  const existingNode = foundation.graph.nodes.find((node) => node.externalEntityId === asset.id);
  const node: CreativeGraphNode = existingNode ?? {
    id: `asset:${asset.id}`,
    kind: 'asset',
    label: asset.title,
    externalEntityId: asset.id,
    tags: [...asset.tags],
    createdAt: asset.createdAt,
    metadata: {kind: asset.kind},
  };
  const containsId = `contains:${foundation.projectId}:${asset.id}`;
  return {
    ...foundation,
    revision: foundation.revision + 1,
    updatedAt: now,
    assets: [...foundation.assets.filter((item) => item.id !== asset.id), asset],
    graph: {
      nodes: [...foundation.graph.nodes.filter((item) => item.id !== node.id), node],
      edges: foundation.graph.edges.some((edge) => edge.id === containsId)
        ? foundation.graph.edges
        : [...foundation.graph.edges, {
            id: containsId,
            fromNodeId: `project:${foundation.projectId}`,
            toNodeId: node.id,
            relation: 'contains',
            createdByActorId: foundation.localActorId,
            createdAt: now,
            evidenceRefs: [asset.contentHash],
            metadata: {},
          }],
    },
  };
}
