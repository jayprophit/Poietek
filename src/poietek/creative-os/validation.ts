import {
  CREATIVE_OS_SCHEMA_VERSION,
  type CreativeOsFoundation,
  type CreativeOsValidationIssue,
} from './contracts';

function issue(code: string, path: string, message: string): CreativeOsValidationIssue {
  return {code, path, message};
}

export function validateCreativeOsFoundation(value: CreativeOsFoundation): CreativeOsValidationIssue[] {
  const issues: CreativeOsValidationIssue[] = [];
  if (value.schemaVersion !== CREATIVE_OS_SCHEMA_VERSION) {
    issues.push(issue('UNSUPPORTED_VERSION', 'schemaVersion', 'The Creative OS schema version is unsupported.'));
  }
  if (!value.projectId) issues.push(issue('PROJECT_REQUIRED', 'projectId', 'A project id is required.'));
  if (!value.localActorId) issues.push(issue('ACTOR_REQUIRED', 'localActorId', 'A local actor id is required.'));
  if (!Number.isInteger(value.revision) || value.revision < 0) {
    issues.push(issue('REVISION_INVALID', 'revision', 'Revision must be a non-negative integer.'));
  }

  const ids = new Set<string>();
  const unique = (id: string, path: string) => {
    if (!id) issues.push(issue('ID_REQUIRED', path, 'An id is required.'));
    else if (ids.has(id)) issues.push(issue('DUPLICATE_ID', path, `Duplicate id ${id}.`));
    else ids.add(id);
  };
  value.creatorIdentities.forEach((creator, index) => {
    unique(creator.id, `creatorIdentities.${index}.id`);
    if (!creator.displayName.trim()) issues.push(issue('NAME_REQUIRED', `creatorIdentities.${index}.displayName`, 'A display name is required.'));
    if (['verified', 'rejected', 'expired'].includes(creator.verification.state)) {
      if (!creator.verification.authorityId || !creator.verification.reference || !creator.verification.observedAt) {
        issues.push(issue('VERIFICATION_EVIDENCE_REQUIRED', `creatorIdentities.${index}.verification`, 'External identity status requires authority, reference and observation time.'));
      }
    }
  });

  const assetIds = new Set<string>();
  value.assets.forEach((asset, assetIndex) => {
    unique(asset.id, `assets.${assetIndex}.id`);
    assetIds.add(asset.id);
    if (asset.projectId !== value.projectId) issues.push(issue('ASSET_PROJECT_MISMATCH', `assets.${assetIndex}.projectId`, 'The asset belongs to another project.'));
    if (!asset.contentHash.trim()) issues.push(issue('HASH_REQUIRED', `assets.${assetIndex}.contentHash`, 'Content identity requires a hash.'));
    if (asset.byteLength !== null && (!Number.isInteger(asset.byteLength) || asset.byteLength < 0)) {
      issues.push(issue('BYTE_LENGTH_INVALID', `assets.${assetIndex}.byteLength`, 'Byte length must be a non-negative integer or null.'));
    }
    asset.replicas.forEach((replica, replicaIndex) => {
      unique(replica.id, `assets.${assetIndex}.replicas.${replicaIndex}.id`);
      if (replica.contentHash !== asset.contentHash) issues.push(issue('REPLICA_HASH_MISMATCH', `assets.${assetIndex}.replicas.${replicaIndex}.contentHash`, 'Replica identity must match the asset hash.'));
      if ((replica.storageClass === 'provider' || replica.storageClass === 'peer') && replica.observation.state === 'stored') {
        if (!replica.providerId || !replica.observation.externalReference || !replica.observation.observedAt) {
          issues.push(issue('REMOTE_STORAGE_EVIDENCE_REQUIRED', `assets.${assetIndex}.replicas.${replicaIndex}`, 'Remote storage cannot be reported without provider and observation evidence.'));
        }
        if (value.storagePolicy.encryptionRequiredForRemote && replica.encrypted !== true) {
          issues.push(issue('REMOTE_ENCRYPTION_REQUIRED', `assets.${assetIndex}.replicas.${replicaIndex}.encrypted`, 'The active storage policy requires encrypted remote replicas.'));
        }
      }
    });
  });

  const nodeIds = new Set<string>();
  value.graph.nodes.forEach((node, index) => {
    unique(node.id, `graph.nodes.${index}.id`);
    nodeIds.add(node.id);
  });
  value.graph.edges.forEach((edge, index) => {
    unique(edge.id, `graph.edges.${index}.id`);
    if (!nodeIds.has(edge.fromNodeId) || !nodeIds.has(edge.toNodeId)) {
      issues.push(issue('GRAPH_REFERENCE_MISSING', `graph.edges.${index}`, 'Graph edges must connect existing nodes.'));
    }
  });
  value.annotations.forEach((annotation, index) => {
    unique(annotation.id, `annotations.${index}.id`);
    if (!nodeIds.has(annotation.targetNodeId)) issues.push(issue('ANNOTATION_TARGET_MISSING', `annotations.${index}.targetNodeId`, 'Annotation target is missing from the graph.'));
    if (!annotation.body.trim()) issues.push(issue('ANNOTATION_BODY_REQUIRED', `annotations.${index}.body`, 'Annotation body is required.'));
    if (annotation.startSeconds !== null && annotation.startSeconds < 0) issues.push(issue('ANNOTATION_TIME_INVALID', `annotations.${index}.startSeconds`, 'Annotation time cannot be negative.'));
    if (annotation.endSeconds !== null && (annotation.startSeconds === null || annotation.endSeconds < annotation.startSeconds)) issues.push(issue('ANNOTATION_RANGE_INVALID', `annotations.${index}.endSeconds`, 'Annotation end must follow its start.'));
    if (annotation.visibility === 'public' && annotation.externalPublication.state === 'stored' && !annotation.externalPublication.externalReference) {
      issues.push(issue('PUBLICATION_EVIDENCE_REQUIRED', `annotations.${index}.externalPublication`, 'Public annotation state requires an external reference.'));
    }
  });
  value.journal.forEach((entry, index) => {
    unique(entry.id, `journal.${index}.id`);
    for (const nodeId of entry.linkedNodeIds) if (!nodeIds.has(nodeId)) issues.push(issue('JOURNAL_NODE_MISSING', `journal.${index}.linkedNodeIds`, `Journal node ${nodeId} is missing.`));
  });
  value.intent.rules.forEach((rule, index) => {
    unique(rule.id, `intent.rules.${index}.id`);
    if (!rule.trait.trim() || !rule.reason.trim()) issues.push(issue('INTENT_DETAIL_REQUIRED', `intent.rules.${index}`, 'Intent rules require a trait and creator reason.'));
  });

  const summary = value.preflight.summary;
  const calculated = {
    requiredFailures: value.preflight.findings.filter((finding) => finding.classification === 'required_by_target' && finding.state === 'fail').length,
    technicalWarnings: value.preflight.findings.filter((finding) => finding.classification === 'technical_best_practice' && ['warning', 'fail'].includes(finding.state)).length,
    creativeSuggestions: value.preflight.findings.filter((finding) => finding.classification === 'creative_option' && ['warning', 'fail'].includes(finding.state)).length,
    unmeasuredRequiredChecks: value.preflight.findings.filter((finding) => finding.classification === 'required_by_target' && finding.state === 'not_measured').length,
  };
  if (JSON.stringify(summary) !== JSON.stringify(calculated)) issues.push(issue('PREFLIGHT_SUMMARY_MISMATCH', 'preflight.summary', 'Preflight summary must be derived from its findings.'));
  value.preflight.findings.forEach((finding, index) => {
    unique(finding.id, `preflight.findings.${index}.id`);
    if (finding.classification === 'required_by_target' && (!finding.targetProfileId || !finding.requirementId)) {
      issues.push(issue('TARGET_REQUIREMENT_EVIDENCE_REQUIRED', `preflight.findings.${index}`, 'Target requirements require a target profile and requirement id.'));
    }
    if (finding.state === 'pass' && finding.evidenceRefs.length === 0) issues.push(issue('PASS_EVIDENCE_REQUIRED', `preflight.findings.${index}.evidenceRefs`, 'A passed check requires evidence.'));
  });

  if (value.storagePolicy.minimumLocalReplicas < 1) issues.push(issue('LOCAL_REPLICA_REQUIRED', 'storagePolicy.minimumLocalReplicas', 'At least one local replica is required.'));
  if (!value.storagePolicy.allowProviderStorage && value.storagePolicy.minimumRemoteReplicas > 0) issues.push(issue('REMOTE_POLICY_CONFLICT', 'storagePolicy.minimumRemoteReplicas', 'Remote replicas cannot be required while provider storage is disabled.'));
  value.handoffs.forEach((handoff, index) => {
    unique(handoff.id, `handoffs.${index}.id`);
    if (handoff.projectId !== value.projectId) issues.push(issue('HANDOFF_PROJECT_MISMATCH', `handoffs.${index}.projectId`, 'Handoff belongs to another project.'));
    if (!Number.isInteger(handoff.projectRevision) || handoff.projectRevision < 0 || handoff.playheadSamples < 0) issues.push(issue('HANDOFF_POSITION_INVALID', `handoffs.${index}`, 'Handoff revision and position must be non-negative.'));
    handoff.pluginRequirements.forEach((plugin, pluginIndex) => {
      if (plugin.state === 'unsupported' && !plugin.statePreserved) issues.push(issue('PLUGIN_STATE_MUST_BE_PRESERVED', `handoffs.${index}.pluginRequirements.${pluginIndex}`, 'Unsupported plugin state must remain preserved.'));
      if (plugin.state === 'unsupported' && !plugin.fallbackAssetId) issues.push(issue('PLUGIN_FALLBACK_REQUIRED', `handoffs.${index}.pluginRequirements.${pluginIndex}`, 'Unsupported plugins require a freeze/render fallback asset.'));
    });
  });
  return issues;
}
