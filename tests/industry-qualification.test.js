import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const require = createRequire(import.meta.url);
const benchmark = require('./.compiled-core/diagnostics/IndustryQualification.js');

test('industry qualification covers all thirteen systems and fourteen volumes', () => {
  const summary = benchmark.summarizeIndustryQualification();
  assert.equal(summary.laneCount, 27);
  assert.equal(summary.systemCount, 13);
  assert.equal(summary.volumeCount, 14);
  assert.equal(summary.fiveStarQualified, false);
});

test('every benchmark peer resolves to an official secure source', () => {
  const references = new Map(benchmark.INDUSTRY_REFERENCE_PLATFORMS.map((item) => [item.id, item]));
  assert.ok(references.size >= 18);
  for (const lane of benchmark.INDUSTRY_QUALIFICATION_LANES) {
    assert.ok(lane.peerIds.length > 0, `${lane.id} has no benchmark peer`);
    for (const id of lane.peerIds) {
      const reference = references.get(id);
      assert.ok(reference, `${lane.id} references missing peer ${id}`);
      assert.match(reference.officialUrl, /^https:\/\//);
    }
  }
});

test('five stars requires every mandatory criterion to be verified', () => {
  const incomplete = benchmark.assessQualificationLane({
    id: 'incomplete', kind: 'system', order: 1, name: 'Incomplete', purpose: 'Test', peerIds: ['wcag'],
    criteria: [
      {id: 'a', title: 'A', state: 'verified', mandatory: true, evidence: ['test'], fiveStarExit: 'done'},
      {id: 'b', title: 'B', state: 'working', mandatory: true, evidence: ['test'], fiveStarExit: 'finish'},
    ],
  });
  assert.equal(incomplete.fiveStarQualified, false);
  assert.ok(incomplete.stars < 5);

  const complete = benchmark.assessQualificationLane({
    id: 'complete', kind: 'system', order: 1, name: 'Complete', purpose: 'Test', peerIds: ['wcag'],
    criteria: [
      {id: 'a', title: 'A', state: 'verified', mandatory: true, evidence: ['test'], fiveStarExit: 'maintain'},
      {id: 'b', title: 'B', state: 'verified', mandatory: true, evidence: ['test'], fiveStarExit: 'maintain'},
    ],
  });
  assert.equal(complete.score, 100);
  assert.equal(complete.stars, 5);
  assert.equal(complete.fiveStarQualified, true);
});

test('current catalogue does not convert foundations or external gates into completion', () => {
  const summary = benchmark.summarizeIndustryQualification();
  assert.equal(summary.qualifiedLanes, 0);
  assert.ok(summary.blockedLanes > 0);
  assert.ok(summary.verifiedCriteria < summary.requiredCriteria);
  assert.ok(summary.stars < 5);
});

test('benchmark search crosses systems, volumes, evidence and peers', () => {
  assert.ok(benchmark.searchIndustryQualification('MIDI', 'system').some((item) => item.id === 'system-midi-hub'));
  assert.ok(benchmark.searchIndustryQualification('WCAG', 'volume').some((item) => item.id === 'volume-11'));
  assert.ok(benchmark.searchIndustryQualification('rights', 'all').length > 1);
});

test('ecosystem UI exposes the qualification separately from the machine benchmark', () => {
  const source = readFileSync(
    new URL('../src/poietek/react/PoietekEcosystemCenter.tsx', import.meta.url),
    'utf8',
  );
  assert.match(source, /Industry qualification/);
  assert.match(source, /Thirteen systems plus fourteen controlled volumes/);
  assert.match(source, /Studio Setup → Benchmark separately measures/);
  assert.match(source, /Five-star exit/);
  assert.doesNotMatch(source, /27\/27 lanes five-star qualified/);
});
