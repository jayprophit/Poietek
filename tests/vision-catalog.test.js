import assert from 'node:assert/strict';
import test from 'node:test';

import {CORE_ECOSYSTEM_PILLARS, SDS_VISION_CATALOG, searchVisionCatalog, summarizeVisionCatalog} from './.compiled-core/vision/catalog.js';

test('all thirteen SDS ecosystem pillars are explicit and mapped to real architecture areas', () => {
  const expected = ['professional-daw', 'sampler', 'hardware-controller', 'midi-hub', 'video-editor', 'vfx-suite', 'collaboration-platform', 'publishing-platform', 'rights-platform', 'ai-assistant', 'social-network', 'marketplace', 'cloud-platform'];
  assert.deepEqual(CORE_ECOSYSTEM_PILLARS.map((pillar) => pillar.id), expected);
  const domains = new Set(SDS_VISION_CATALOG.map((area) => area.id));
  for (const pillar of CORE_ECOSYSTEM_PILLARS) {
    assert.ok(pillar.domainIds.length > 0);
    assert.ok(pillar.domainIds.every((id) => domains.has(id)));
    assert.ok(pillar.promise.length > 30);
  }
});

test('vision catalogue distinguishes operational code from foundations and planned slices', () => {
  const summary = summarizeVisionCatalog();
  assert.ok(summary.operational >= 1);
  assert.ok(summary.foundation >= 1);
  assert.ok(summary.planned >= 1);
  assert.equal(summary.operational + summary.foundation + summary.planned + summary.blocked_external, SDS_VISION_CATALOG.length);
  assert.equal(SDS_VISION_CATALOG.some((area) => /five.star/i.test(area.purpose)), false);
});

test('vision search crosses evidence, advances and gates', () => {
  assert.ok(searchVisionCatalog('LUFS').some((area) => area.id === 'release-preflight'));
  assert.ok(searchVisionCatalog('Android toolchain').some((area) => area.id === 'deployment-operations'));
  assert.deepEqual(searchVisionCatalog('words-that-do-not-exist'), []);
});
