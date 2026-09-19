import assert from 'node:assert/strict';
import {readdir, readFile} from 'node:fs/promises';
import test from 'node:test';

const volumeDirectory = new URL('../docs/volumes/', import.meta.url);
const read = (file) => readFile(new URL(file, volumeDirectory), 'utf8');

const expectedVolumes = [
  ['01_VISION_WHITE_PAPER.md', 'Vision & White Paper'],
  ['02_SOFTWARE_ARCHITECTURE.md', 'Software Architecture'],
  ['03_AUDIO_PRODUCTION_SYSTEM.md', 'Audio Production System'],
  ['04_SAMPLER_HARDWARE_INTEGRATION.md', 'Sampler & Hardware Integration'],
  ['05_VIDEO_VFX_SYSTEM.md', 'Video & VFX System'],
  ['06_AI_SYSTEM_ARCHITECTURE.md', 'AI System Architecture'],
  ['07_COMMUNITY_COLLABORATION_PLATFORM.md', 'Community & Collaboration Platform'],
  ['08_RIGHTS_LICENSING_PUBLISHING.md', 'Rights, Licensing & Publishing'],
  ['09_CLOUD_SYNCHRONISATION.md', 'Cloud & Synchronisation'],
  ['10_DATABASE_API_SPECIFICATION.md', 'Database & API Specification'],
  ['11_DESKTOP_MOBILE_WEB_UI_UX.md', 'Desktop, Mobile & Web UI/UX'],
  ['12_PLUGIN_SDK_DEVELOPER_DOCUMENTATION.md', 'Plugin SDK & Developer Documentation'],
  ['13_SECURITY_PRIVACY.md', 'Security & Privacy'],
  ['14_ROADMAP_RELEASE_PLAN.md', 'Roadmap & Release Plan'],
];

test('professional series contains exactly fourteen numbered controlled volumes', async () => {
  const files = (await readdir(volumeDirectory))
    .filter((file) => /^\d{2}_.+\.md$/.test(file))
    .sort();
  assert.deepEqual(files, expectedVolumes.map(([file]) => file));

  for (let index = 0; index < expectedVolumes.length; index += 1) {
    const [file, title] = expectedVolumes[index];
    const number = String(index + 1).padStart(2, '0');
    const volume = await read(file);
    assert.match(volume, new RegExp(`^# Volume ${number} .+ ${title.replace(/[&/]/g, '.+')}`, 'm'));
    assert.match(volume, new RegExp('Document ID: `POI-VOL-' + number + '`'));
    assert.match(volume, /Edition: `1\.0\.0`/);
    assert.match(volume, /## Current (?:status|evidence)|## Current baseline/i);
  }
});

test('series index links every volume and preserves one controlling master', async () => {
  const index = await read('README.md');
  for (const [file, title] of expectedVolumes) {
    assert.match(index, new RegExp(`\\[${title.replace(/[&/]/g, '.+')}\\]\\(${file}\\)`));
  }
  assert.match(index, /POIETEK_MASTER_SPECIFICATION\.md/);
  assert.match(index, /must not contradict validated code/i);
});

test('repository entry points expose the professional volume series', async () => {
  const [repositoryReadme, master, architecture] = await Promise.all([
    readFile(new URL('../../README.md', volumeDirectory), 'utf8'),
    readFile(new URL('../POIETEK_MASTER_SPECIFICATION.md', volumeDirectory), 'utf8'),
    readFile(new URL('../ARCHITECTURE.md', volumeDirectory), 'utf8'),
  ]);
  assert.match(repositoryReadme, /docs\/volumes\/README\.md/);
  assert.match(master, /fourteen numbered volumes/);
  assert.match(architecture, /fourteen professional volumes/);
});
