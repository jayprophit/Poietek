import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const require = createRequire(import.meta.url);
const catalog = require('./.compiled-core/vision/catalog.js');
const library = require('./.compiled-core/vision/developmentLibrary.js');

test('attached development library source is fingerprinted and completely indexed', () => {
  assert.deepEqual(
    {
      lineCount: library.DEVELOPMENT_LIBRARY_SOURCE.lineCount,
      characterCount: library.DEVELOPMENT_LIBRARY_SOURCE.characterCount,
      sha256: library.DEVELOPMENT_LIBRARY_SOURCE.sha256,
    },
    {
      lineCount: 2221,
      characterCount: 30024,
      sha256: '9edcb809bff10246526ff7141185a82eef68dbe05440a5567ee81f0f1986dea2',
    },
  );
  assert.deepEqual(
    library.DEVELOPMENT_LIBRARY_VOLUMES.map((volume) => volume.sourceNumber),
    [...Array.from({length: 20}, (_, index) => String(index + 1).padStart(2, '0')), '51', '52', '53'],
  );
  assert.equal(library.DEVELOPMENT_LIBRARY_PARTS.length, 10);
  assert.equal(library.DEVELOPMENT_LIBRARY_APPENDICES.length, 5);
});

test('every source volume maps to real architecture and professional documentation', () => {
  const domainIds = new Set(catalog.SDS_VISION_CATALOG.map((area) => area.id));
  assert.deepEqual(library.validateDevelopmentLibraryDomainLinks(domainIds), {valid: true, missing: []});

  for (const volume of library.DEVELOPMENT_LIBRARY_VOLUMES) {
    assert.ok(volume.professionalVolumes.length > 0, `${volume.id} lacks a professional-volume link`);
    assert.ok(volume.domainIds.length > 0, `${volume.id} lacks architecture links`);
    assert.ok(volume.capabilities.length >= 8, `${volume.id} is insufficiently specified`);
    assert.ok(volume.currentEvidence.length > 0, `${volume.id} lacks current evidence`);
  }
});

test('search reaches the distinctive Creative OS, ecosystem and intelligence requirements', () => {
  const cases = [
    ['Studio Journal', 'library-53'],
    ['battery saving', 'library-52'],
    ['one save format', 'library-51'],
    ['DDEX', 'library-12'],
    ['MIDI 2', 'library-06'],
    ['screen-reader', 'library-52'],
    ['visual Smart Automation', 'library-53'],
    ['colour-blind', 'library-52'],
    ['commission work', 'library-18'],
  ];
  for (const [query, expected] of cases) {
    assert.ok(
      library.searchDevelopmentLibrary(query).some((volume) => volume.id === expected),
      `${query} did not find ${expected}`,
    );
  }
});

test('development library is a searchable application view with explicit truth boundaries', async () => {
  const screen = await readFile(
    new URL('../src/poietek/react/PoietekEcosystemCenter.tsx', import.meta.url),
    'utf8',
  );
  assert.match(screen, /Development library/);
  assert.match(screen, /searchDevelopmentLibrary/);
  assert.match(screen, /Twenty core volumes plus Creative OS 51–53/);
  assert.match(screen, /A listed idea is not promoted to a working feature/);
  assert.match(screen, /copied commercial content/);
});
