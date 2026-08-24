import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const releaseModule = '../tests/.compiled-core/release/PublicReleaseReadiness.js';
const {
  PUBLIC_RELEASE_CATEGORIES,
  PUBLIC_RELEASE_GATES,
  searchPublicReleaseGates,
  summarizePublicReleaseReadiness,
  validatePublicReleaseGates,
} = await import(releaseModule);

test('public release catalogue covers every required category and validates cleanly', () => {
  assert.equal(PUBLIC_RELEASE_CATEGORIES.length, 14);
  assert.equal(PUBLIC_RELEASE_GATES.length, 28);
  assert.deepEqual(validatePublicReleaseGates(), []);
  for (const category of PUBLIC_RELEASE_CATEGORIES) {
    assert.equal(PUBLIC_RELEASE_GATES.filter((gate) => gate.category === category).length, 2);
  }
});

test('release decision fails closed while any blocking evidence is incomplete', () => {
  const summary = summarizePublicReleaseReadiness();
  assert.equal(summary.publicReleaseReady, false);
  assert.equal(summary.decision, 'NO_GO');
  assert.equal(summary.blockingCount, 27);
  assert.equal(summary.verifiedCount, 1);

  const verified = PUBLIC_RELEASE_GATES.map((gate) => ({...gate, state: 'verified'}));
  assert.equal(summarizePublicReleaseReadiness(verified).decision, 'GO');

  const incomplete = verified.map((gate, index) => index === 0 ? {...gate, state: 'working'} : gate);
  assert.equal(summarizePublicReleaseReadiness(incomplete).decision, 'NO_GO');
});

test('honest audio, rights and commerce gates cannot be mistaken for available capability', () => {
  const standards = PUBLIC_RELEASE_GATES.find((gate) => gate.id === 'release-audio-standards');
  const rights = PUBLIC_RELEASE_GATES.find((gate) => gate.id === 'release-rights-acceptance');
  const billing = PUBLIC_RELEASE_GATES.find((gate) => gate.id === 'release-commerce-billing');
  assert.equal(standards.state, 'missing');
  assert.match(standards.currentEvidence.join(' '), /not mislabelled LUFS\/dBTP/i);
  assert.equal(rights.state, 'external_gate');
  assert.match(rights.currentEvidence.join(' '), /reject invented acceptance or ownership/i);
  assert.equal(billing.state, 'external_gate');
  assert.match(billing.currentEvidence.join(' '), /without payment evidence/i);
});

test('release search finds evidence, exit requirements and official authorities', () => {
  assert.ok(searchPublicReleaseGates('screen reader').some((gate) => gate.category === 'accessibility'));
  assert.ok(searchPublicReleaseGates('OWASP').some((gate) => gate.category === 'security'));
  assert.equal(searchPublicReleaseGates('', 'mobile').length, 2);
  assert.ok(searchPublicReleaseGates('', 'all', 'external_gate').length > 0);
});

test('release control is visible in the application and documentation', async () => {
  const [component, documentation] = await Promise.all([
    readFile(new URL('../src/poietek/react/PoietekEcosystemCenter.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../docs/PUBLIC_RELEASE_READINESS.md', import.meta.url), 'utf8'),
  ]);
  assert.match(component, />Release control<\/button>/);
  assert.match(component, /do not publish as a finished product/i);
  assert.match(component, /Fail closed/);
  assert.match(documentation, /Decision: `NO-GO`/);
  assert.match(documentation, /27 of 28 gates/i);
  assert.match(documentation, /not a legal approval/i);
});
