import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const {createLocalUnifiedProductionSuite} = require('./.compiled-core/unified/defaults.js');
const {withUnifiedProductionSuite, readUnifiedProductionSuite} = require('./.compiled-core/unified/extension.js');
const {validateUnifiedProductionSuite} = require('./.compiled-core/unified/validation.js');
const {COMPLIANCE_BASELINE_CATALOG, GOVERNANCE_POLICY_CATALOG, MARKETPLACE_CATEGORIES, UNIFIED_CREATOR_STAGES} = require('./.compiled-core/unified/catalog.js');

const make = () => createLocalUnifiedProductionSuite({projectId: 'project-1', localActorId: 'creator-1', now: '2026-08-14T10:00:00.000Z'});

test('unified production starts local, private and creator-owned', () => {
  const suite = make();
  assert.equal(suite.ownership.poietekOwnership, 'software_brand_and_service_ip_only');
  assert.equal(suite.ownership.noAutomaticTransfer, true);
  assert.equal(suite.ownership.serviceLicence.status, 'draft_not_accepted');
  assert.equal(suite.community.topology, 'local_private');
  assert.equal(suite.marketplace.commissionPolicy.rateBasisPoints, null);
  assert.deepEqual(validateUnifiedProductionSuite(suite), []);
  assert.doesNotThrow(() => JSON.stringify(suite));
});

test('unified extension round-trips through a canonical project', () => {
  const project = {id: 'project-1', extensions: {}};
  const attached = withUnifiedProductionSuite(project, make());
  assert.equal(readUnifiedProductionSuite(attached).state, 'ready');
});

test('accepted service licence requires a durable receipt', () => {
  const suite = make(); suite.ownership.serviceLicence.status = 'accepted';
  assert.ok(validateUnifiedProductionSuite(suite).some((issue) => issue.code === 'LICENCE_ACCEPTANCE_UNPROVEN'));
});

test('platform ownership claims over user works are rejected', () => {
  const suite = make();
  suite.ownership.works.push({id:'work-1',title:'Work',kind:'film',ownerContributorIds:['creator-1'],rightsStatus:'creator_asserted',rightsAgreementIds:[],poietekOwnershipClaim:true,createdAt:suite.createdAt,updatedAt:suite.updatedAt});
  assert.ok(validateUnifiedProductionSuite(suite).some((issue) => issue.code === 'PLATFORM_OWNERSHIP_FORBIDDEN'));
});

test('live, audience and commerce claims fail closed', () => {
  const suite = make();
  suite.television.sessions.push({id:'live-1',channelId:'local-channel',title:'Show',sourceProjectId:'project-1',programmeMasterAssetId:null,status:'live',visibility:'public',scheduledAt:null,startedAt:null,endedAt:null,externalSessionReference:null,interactions:{comments:true,reactions:true,sharing:true,donations:true,shop:true},musicRightsDeclarationId:null,moderationPolicyVersion:null,viewerCount:{value:42,observedAt:null,source:'not_measured'}});
  const codes = validateUnifiedProductionSuite(suite).map((issue) => issue.code);
  for (const code of ['LIVE_CAPABILITY_UNPROVEN','LIVE_SESSION_EVIDENCE_REQUIRED','LIVE_MODERATION_REQUIRED','DONATION_CAPABILITY_UNPROVEN','LIVE_COMMERCE_UNPROVEN','VIEWER_COUNT_UNPROVEN']) assert.ok(codes.includes(code));
});

test('commission and public listing require approval and authority evidence', () => {
  const suite = make(); suite.marketplace.commissionPolicy.status = 'approved'; suite.marketplace.commissionPolicy.rateBasisPoints = 500;
  assert.ok(validateUnifiedProductionSuite(suite).some((issue) => issue.code === 'COMMISSION_APPROVAL_UNPROVEN'));
});

test('effective governance policy requires a reviewed durable document', () => {
  const suite = make(); suite.governance.policies[0].status = 'effective';
  assert.ok(validateUnifiedProductionSuite(suite).some((issue) => issue.code === 'EFFECTIVE_POLICY_UNPROVEN'));
});

test('catalog covers the creator pipeline, store, governance and official baselines', () => {
  assert.equal(UNIFIED_CREATOR_STAGES.length, 6);
  assert.ok(MARKETPLACE_CATEGORIES.length >= 12);
  assert.equal(GOVERNANCE_POLICY_CATALOG.length, 19);
  assert.ok(COMPLIANCE_BASELINE_CATALOG.every((item) => item.url.startsWith('https://')));
});
