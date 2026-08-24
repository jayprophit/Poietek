import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const read = (file) => readFile(new URL(`../${file}`, import.meta.url), 'utf8');

test('master specification covers every controlled product domain', async () => {
  const master = await read('docs/POIETEK_MASTER_SPECIFICATION.md');

  for (let id = 1; id <= 13; id += 1) {
    assert.match(master, new RegExp(`CAP-${String(id).padStart(2, '0')}`));
  }

  for (const domain of [
    'VISION', 'FEATURE', 'MENU', 'SETTINGS', 'CONTROL', 'SCREEN', 'WORKFLOW',
    'AI', 'HARDWARE', 'DATA', 'API', 'SECURITY', 'CLOUD', 'COMMUNITY',
    'RIGHTS', 'PUBLISHING', 'PLUGIN', 'SDK', 'DEVELOPER', 'ACCESSIBILITY',
    'LEARNING', 'USERS', 'PERMISSIONS', 'ROADMAP',
  ]) {
    assert.match(master, new RegExp(`DOM-${domain}`), `missing DOM-${domain}`);
  }

  assert.match(master, /PHI-001/);
  assert.match(master, /PHI-012/);

  for (const status of [
    'operational', 'foundation', 'prototype', 'planned', 'external-gate',
    'unavailable', 'retired',
  ]) {
    assert.match(master, new RegExp(`\`${status}\``, 'i'));
  }
});

test('UI catalog inventories menus, settings, screens, workflows and access needs', async () => {
  const catalog = await read('docs/UI_SCREEN_WORKFLOW_CATALOG.md');

  for (const heading of [
    'File', 'Edit', 'Project', 'Track', 'Clip', 'Audio', 'MIDI', 'Devices',
    'Mixer', 'Transport', 'View', 'Window', 'Help',
  ]) {
    assert.match(catalog, new RegExp(`### ${heading} \\(`), `missing ${heading} menu`);
  }
  for (let id = 1; id <= 11; id += 1) {
    assert.match(catalog, new RegExp(`SET-${String(id).padStart(3, '0')}`));
  }
  for (let id = 1; id <= 45; id += 1) {
    assert.match(catalog, new RegExp(`SCR-${String(id).padStart(3, '0')}`));
  }
  assert.match(catalog, /keyboard/i);
  assert.match(catalog, /screen.reader/i);
  assert.match(catalog, /touch/i);
  assert.match(catalog, /EDU-013/);
});

test('platform blueprint controls data, APIs, AI, SDK, cloud and security', async () => {
  const blueprint = await read('docs/PLATFORM_DATA_API_SECURITY_BLUEPRINT.md');

  for (const section of [
    'local database design', 'remote relational schema', 'internal command',
    'remote service API', 'native bridge', 'AI architecture', 'cloud', 'plugin',
    'SDK',
  ]) {
    assert.match(blueprint, new RegExp(section, 'i'), `missing ${section}`);
  }
  for (let id = 1; id <= 14; id += 1) {
    assert.match(blueprint, new RegExp(`SEC-${String(id).padStart(3, '0')}`));
  }
  assert.match(blueprint, /Supabase/);
  assert.match(blueprint, /Firebase/);
  assert.match(blueprint, /provider-neutral/i);
});

test('delivery plan derives every requested software artifact and phase gate', async () => {
  const delivery = await read('docs/DELIVERY_TEST_DOCUMENTATION_PLAN.md');

  for (const output of [
    'Software architecture', 'UI designs', 'Database schema', 'API documentation',
    'AI architecture', 'Backend', 'Frontend', 'Mobile apps', 'Desktop apps',
    'Web application', 'Cloud services', 'Deployment', 'Testing', 'Documentation',
  ]) {
    assert.match(delivery, new RegExp(`\\| ${output} \\|`, 'i'), `missing ${output}`);
  }
  for (let id = 0; id <= 10; id += 1) {
    assert.match(delivery, new RegExp(`P${id}(?: \\u2014|\\[)`), `missing P${id}`);
  }
  assert.match(delivery, /A disabled\s+button or serializable contract is not completion/);
  assert.match(delivery, /No artifact is published or pushed without explicit\s+authorization/);
});

test('repository index links the controlled specification set', async () => {
  const readme = await read('README.md');
  for (const file of [
    'POIETEK_MASTER_SPECIFICATION.md',
    'UI_SCREEN_WORKFLOW_CATALOG.md',
    'PLATFORM_DATA_API_SECURITY_BLUEPRINT.md',
    'DELIVERY_TEST_DOCUMENTATION_PLAN.md',
    'SDS_VISION_COVERAGE.md',
  ]) {
    assert.match(readme, new RegExp(file.replaceAll('.', '\\.')));
  }
});
