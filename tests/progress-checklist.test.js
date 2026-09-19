import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const require = createRequire(import.meta.url);
const progress = require(
  path.join(root, 'tests', '.compiled-core', 'progress', 'checklist.js'),
);

test('master tracker covers all thirteen systems and fourteen professional volumes', () => {
  const lanes = progress.MASTER_BUILD_CHECKLIST;
  assert.equal(lanes.length, 27);
  assert.equal(lanes.filter((lane) => lane.kind === 'system').length, 13);
  assert.equal(lanes.filter((lane) => lane.kind === 'volume').length, 14);
  assert.equal(lanes.flatMap((lane) => lane.items).length, 108);
  assert.ok(lanes.every((lane) => lane.requiredItems === 4));
  assert.ok(
    lanes
      .flatMap((lane) => lane.items)
      .every(
        (item) =>
          item.mandatory &&
          item.evidence.length > 0 &&
          item.professionalExit.length > 20,
      ),
  );
});

test('current percentages separate progress from verified completion', () => {
  const summary = progress.summarizeMasterBuildProgress();
  assert.equal(summary.overallProgressPercent, 53);
  assert.equal(summary.strictCompletionPercent, 31);
  assert.equal(summary.productProgressPercent, 37);
  assert.equal(summary.productStrictCompletionPercent, 10);
  assert.equal(summary.architectureProgressPercent, 67);
  assert.equal(summary.architectureStrictCompletionPercent, 50);
  assert.deepEqual(summary.counts, {
    complete: 33,
    partly_done: 36,
    missing: 27,
    blocked_external: 12,
    working: 11,
    foundation: 25,
    specified: 27,
    total: 108,
  });
  assert.equal(summary.fiveStarQualified, false);
  assert.equal(summary.qualifiedLanes, 0);
});

test('SDS progress source is fingerprinted and stable', () => {
  assert.equal(progress.SDS_PROGRESS_SOURCE.lineCount, 5504);
  assert.equal(progress.SDS_PROGRESS_SOURCE.characterCount, 152303);
  assert.equal(
    progress.SDS_PROGRESS_SOURCE.sha256,
    '83b1cf2b4d103ef22f36d1a31442efc095469b330c84821b4cac3ab509163fff',
  );
});

test('search filters by lane and honest completion status', () => {
  const missingSystems = progress.searchMasterBuildChecklist(
    '',
    'system',
    'missing',
  );
  assert.ok(missingSystems.length > 0);
  assert.ok(missingSystems.every((lane) => lane.kind === 'system'));
  assert.ok(
    missingSystems.every((lane) =>
      lane.items.every((item) => item.status === 'missing'),
    ),
  );
  const loudness = progress.searchMasterBuildChecklist('LUFS true peak');
  assert.ok(loudness.length > 0);
  assert.ok(
    loudness.some((lane) =>
      lane.items.some((item) => /LUFS|true.?peak/i.test(item.professionalExit)),
    ),
  );
});

test('published Markdown checklist is generated from the machine-readable tracker', async () => {
  const document = (
    await readFile(path.join(root, 'docs', 'MASTER_BUILD_CHECKLIST.md'), 'utf8')
  ).replaceAll('\r\n', '\n');
  assert.equal(document, progress.renderMasterBuildChecklistMarkdown());
  assert.match(document, /All 108 mandatory criteria/);
  assert.match(document, /Complete and verified: \*\*33\/108 \(30\.6%\)\*\*/);
  assert.match(document, /Product implementation: 13 systems/);
  assert.match(document, /Architecture and delivery: 14 volumes/);
});

test('Ecosystem UI exposes the checklist and both percentage meanings', async () => {
  const source = await readFile(
    path.join(root, 'src', 'poietek', 'react', 'PoietekEcosystemCenter.tsx'),
    'utf8',
  );
  assert.match(source, />Build checklist<\/button>/);
  assert.match(source, /strictly verified complete/);
  assert.match(source, /weighted delivery progress/);
  assert.match(source, /Product implementation/);
  assert.match(source, /Architecture & delivery/);
  assert.match(source, /Required for professional completion/);
});
