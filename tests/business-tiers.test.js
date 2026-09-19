import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import path from 'node:path';
import test from 'node:test';
import {readFile} from 'node:fs/promises';

const root = process.cwd();
const require = createRequire(import.meta.url);
const business = require(path.join(root, 'tests', '.compiled-core', 'business', 'index.js'));

test('reference catalogue has seven ordered and uniquely identified tiers', () => {
  assert.deepEqual(business.BUSINESS_TIER_CATALOG.map((tier) => tier.id), [
    'free', 'creator_perpetual', 'basic', 'pro', 'premium', 'teams', 'enterprise',
  ]);
  assert.equal(new Set(business.BUSINESS_TIER_CATALOG.map((tier) => tier.order)).size, 7);
  assert.equal(business.validateBusinessTierCatalog().length, 0);
});

test('reference pricing cannot activate checkout or entitlement enforcement', () => {
  const governance = business.BUSINESS_TIER_GOVERNANCE;
  assert.equal(governance.commercialStatus, 'reference_template');
  assert.equal(governance.checkoutEnabled, false);
  assert.equal(governance.pricingApproved, false);
  assert.equal(governance.entitlementEnforcementAvailable, false);
  assert.equal(governance.localProjectAccessDuringProviderFailure, 'preserve_local_creation');
});

test('imported prices remain planning references instead of sale claims', () => {
  const prices = Object.fromEntries(business.BUSINESS_TIER_CATALOG.map((tier) => [tier.id, business.formatReferencePrice(tier.referencePrice)]));
  assert.equal(prices.free, 'Reference £0');
  assert.equal(prices.creator_perpetual, 'Reference £199–£599 one-time');
  assert.equal(prices.basic, 'Reference £12/month');
  assert.equal(prices.pro, 'Reference £22/month');
  assert.equal(prices.premium, 'Reference £32/month');
  assert.equal(prices.teams, 'Reference £32/month per user');
  assert.equal(prices.enterprise, 'Reference from £500/month');
  assert.ok(business.BUSINESS_TIER_CATALOG.every((tier) => tier.referencePrice.approval === 'historical_reference_not_approved'));
});

test('tier inheritance is explicit and child entitlements override parents', () => {
  const premium = business.resolveTierEntitlements('premium');
  const teams = business.resolveTierEntitlements('teams');
  const enterprise = business.resolveTierEntitlements('enterprise');
  assert.equal(premium.find((item) => item.id === 'collaboration').limit.kind, 'subject_to_fair_use');
  assert.ok(teams.some((item) => item.id === 'team_admin'));
  assert.ok(enterprise.some((item) => item.id === 'dedicated_deployment'));
  assert.equal(business.BUSINESS_TIER_CATALOG.find((tier) => tier.id === 'basic').inheritsFrom, null);
});

test('every tier preserves a local core and external services retain gates', () => {
  for (const tier of business.BUSINESS_TIER_CATALOG) {
    const resolved = business.resolveTierEntitlements(tier.id);
    assert.equal(resolved.find((item) => item.id === 'local_core')?.state, 'included');
    assert.ok(tier.externalGates.length > 0);
    assert.ok(resolved.filter((item) => item.state === 'requires_provider').every((item) => item.externalGates.length > 0));
  }
});

test('unbounded service promises are rejected without a real boundary', () => {
  const invalid = structuredClone(business.BUSINESS_TIER_CATALOG);
  invalid[0].entitlements.push({id: 'bad', label: 'Unlimited remote compute', state: 'included', limit: null, notes: 'Always available.', externalGates: []});
  assert.ok(business.validateBusinessTierCatalog(invalid).some((item) => item.code === 'UNBOUNDED_PROMISE_REJECTED'));
});

test('reference fingerprint, documentation and visible business view stay controlled', async () => {
  assert.equal(business.BUSINESS_TIER_GOVERNANCE.source.lineCount, 191);
  assert.equal(business.BUSINESS_TIER_GOVERNANCE.source.characterCount, 11454);
  assert.equal(business.BUSINESS_TIER_GOVERNANCE.source.sha256, '80e5a16154b05ea09271a1ce817d251225c0487e7d5cb5a2c7586545f58f45ef');
  const document = await readFile(path.join(root, 'docs', 'BUSINESS_TIER_ARCHITECTURE.md'), 'utf8');
  const ui = await readFile(path.join(root, 'src', 'poietek', 'react', 'PoietekEcosystemCenter.tsx'), 'utf8');
  assert.match(document, /current build completes \*\*B0 only\*\*/i);
  assert.match(ui, />Business tiers<\/button>/);
  assert.match(ui, /Prices are planning references—not live offers/);
});
