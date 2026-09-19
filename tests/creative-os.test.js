import assert from 'node:assert/strict';
import test from 'node:test';

import {createLocalCreativeOsFoundation, indexCanonicalAsset} from './.compiled-core/creative-os/defaults.js';
import {classifyAdviceWithIntent, summarizePreflight} from './.compiled-core/creative-os/intelligence.js';
import {searchCreativeOs} from './.compiled-core/creative-os/search.js';
import {validateCreativeOsFoundation} from './.compiled-core/creative-os/validation.js';
import {readCreativeOsFoundation, withCreativeOsFoundation} from './.compiled-core/creative-os/extension.js';

const now = '2026-08-13T20:00:00.000Z';

test('Creative OS defaults are local, private, serializable and valid', () => {
  const foundation = createLocalCreativeOsFoundation({projectId: 'project-1', localActorId: 'creator-1', now});
  assert.equal(foundation.storagePolicy.allowProviderStorage, false);
  assert.equal(foundation.storagePolicy.minimumLocalReplicas, 1);
  assert.equal(foundation.creatorIdentities[0].localPrivateProfile, true);
  assert.deepEqual(validateCreativeOsFoundation(foundation), []);
  assert.doesNotThrow(() => JSON.stringify(foundation));
});

test('Creative Intent Lock protects style but never hides a target requirement', () => {
  const intent = {
    enabled: true,
    updatedAt: now,
    rules: [{id: 'intent-1', modality: 'audio', trait: 'heavy sub bass', instruction: 'do_not_treat_as_error', reason: 'This is the creator sound.', createdByActorId: 'creator-1', createdAt: now, active: true}],
  };
  const base = {id: 'finding-1', modality: 'audio', subject: 'Heavy sub bass', state: 'warning', message: 'Above the selected reference range.', targetProfileId: null, requirementId: null, evidenceRefs: ['analysis-1'], measuredAt: now};
  const creative = classifyAdviceWithIntent({...base, proposedClassification: 'reference_norm'}, intent);
  assert.equal(creative.classification, 'creative_option');
  assert.match(creative.message, /intentional/);
  const required = classifyAdviceWithIntent({...base, id: 'finding-2', proposedClassification: 'required_by_target', targetProfileId: 'broadcast', requirementId: 'low-frequency-rule'}, intent);
  assert.equal(required.classification, 'required_by_target');
});

test('asset indexing creates a searchable content-hashed graph', () => {
  const foundation = createLocalCreativeOsFoundation({projectId: 'project-1', localActorId: 'creator-1', now});
  const indexed = indexCanonicalAsset(foundation, {
    id: 'asset-1', projectId: 'project-1', kind: 'audio', title: 'Warm vocal print', contentHash: 'sha256:123', mimeType: 'audio/wav', byteLength: 1024, tags: ['vocal', 'warm'], tuningProfileId: null, rightsRecordIds: [], provenanceEvidenceIds: [], replicas: [{id: 'replica-1', storageClass: 'opfs', providerId: null, deviceId: 'device-1', observation: {state: 'stored', externalReference: 'opfs:asset-1', observedAt: now}, encrypted: null, contentHash: 'sha256:123'}], createdAt: now, updatedAt: now, metadata: {},
  }, now);
  assert.deepEqual(validateCreativeOsFoundation(indexed), []);
  assert.equal(searchCreativeOs(indexed, 'warm vocal')[0].sourceId, 'asset:asset-1');
});

test('remote storage and unsupported plugins require evidence and preserved fallbacks', () => {
  const foundation = createLocalCreativeOsFoundation({projectId: 'project-1', localActorId: 'creator-1', now});
  foundation.storagePolicy.allowProviderStorage = true;
  foundation.assets.push({id: 'asset-1', projectId: 'project-1', kind: 'audio', title: 'Audio', contentHash: 'hash', mimeType: null, byteLength: null, tags: [], tuningProfileId: null, rightsRecordIds: [], provenanceEvidenceIds: [], replicas: [{id: 'replica-1', storageClass: 'provider', providerId: null, deviceId: null, observation: {state: 'stored', externalReference: 'remote-1', observedAt: now}, encrypted: false, contentHash: 'hash'}], createdAt: now, updatedAt: now, metadata: {}});
  foundation.handoffs.push({id: 'handoff-1', projectId: 'project-1', createdAt: now, sourceDeviceId: 'desktop', destinationDeviceId: 'tablet', projectRevision: 1, activeArea: 'arrange', playheadSamples: 0, selectedTrackId: null, selectedClipId: null, assetRequirements: [], pluginRequirements: [{pluginId: 'plugin-1', state: 'unsupported', statePreserved: false, fallbackAssetId: null}], remoteDelivery: {state: 'not_requested', externalReference: null, observedAt: null}});
  const issues = validateCreativeOsFoundation(foundation);
  assert.ok(issues.some((item) => item.code === 'REMOTE_STORAGE_EVIDENCE_REQUIRED'));
  assert.ok(issues.some((item) => item.code === 'REMOTE_ENCRYPTION_REQUIRED'));
  assert.ok(issues.some((item) => item.code === 'PLUGIN_STATE_MUST_BE_PRESERVED'));
  assert.ok(issues.some((item) => item.code === 'PLUGIN_FALLBACK_REQUIRED'));
});

test('preflight summary keeps required, technical and creative findings separate', () => {
  const findings = [
    {id: 'required', modality: 'audio', subject: 'Loudness', classification: 'required_by_target', state: 'not_measured', message: 'Not measured', targetProfileId: 'broadcast', requirementId: 'loudness', evidenceRefs: [], affectedIntentRuleIds: [], measuredAt: null},
    {id: 'technical', modality: 'audio', subject: 'Headroom', classification: 'technical_best_practice', state: 'warning', message: 'Review', targetProfileId: null, requirementId: null, evidenceRefs: [], affectedIntentRuleIds: [], measuredAt: now},
    {id: 'creative', modality: 'music', subject: 'Dynamics', classification: 'creative_option', state: 'warning', message: 'Optional', targetProfileId: null, requirementId: null, evidenceRefs: [], affectedIntentRuleIds: [], measuredAt: now},
  ];
  const preflight = summarizePreflight(findings, 'broadcast', now);
  assert.deepEqual(preflight.summary, {requiredFailures: 0, technicalWarnings: 1, creativeSuggestions: 1, unmeasuredRequiredChecks: 1});
});

test('Creative OS extension is versioned and project-bound', () => {
  const foundation = createLocalCreativeOsFoundation({projectId: 'project-1', localActorId: 'creator-1', now});
  const project = withCreativeOsFoundation({id: 'project-1', extensions: {}}, foundation);
  assert.equal(readCreativeOsFoundation(project).state, 'ready');
  assert.equal(readCreativeOsFoundation({...project, id: 'another-project'}).state, 'invalid');
  const raw = {...foundation, schemaVersion: '99'};
  assert.equal(readCreativeOsFoundation({id: 'project-1', extensions: {'org.poietek.creative-os': raw}}).state, 'unsupported_version');
});
