import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const read = (file) => readFile(new URL(`../${file}`, import.meta.url), 'utf8');

test('the application shell owns one professional menu system', async () => {
  const [shell, menu, rack] = await Promise.all([
    read('src/poietek/react/PoietekAppShell.tsx'),
    read('src/poietek/react/StudioMenuBar.tsx'),
    read('src/App.tsx'),
  ]);

  assert.match(shell, /<StudioMenuBar/);
  assert.match(shell, /key === 'n'/);
  assert.match(shell, /key === 's'/);
  assert.match(shell, /event\.code === 'Space'/);
  assert.doesNotMatch(rack, /DAWMenuBar|<Navigation/);

  for (const heading of [
    'File', 'Edit', 'Project', 'Track', 'Clip', 'Audio', 'MIDI',
    'Devices', 'Mixer', 'Transport', 'View', 'Window', 'Help',
  ]) {
    assert.match(menu, new RegExp(`label: '${heading}'`));
  }
});

test('rack transport is de-duplicated and canonical recording performs real ingestion', async () => {
  const [rackTransport, workspace] = await Promise.all([
    read('src/components/rack/StudioTransport.tsx'),
    read('src/poietek/react/PoietekStudioWorkspace.tsx'),
  ]);

  assert.doesNotMatch(rackTransport, /onTriggerRecord|>REC</);
  assert.match(workspace, /new BrowserAudioRecorder\(runtime\.importAudio\)/);
  assert.match(workspace, /const result = await active\.stop\(\)/);
  assert.match(workspace, /result\.importedAudio\.asset/);
  assert.match(workspace, /addAudioClip/);
  assert.match(workspace, /captureMethod: 'browser_media_recorder'/);
});

test('menu capability boundaries remain explicit', async () => {
  const menu = await read('src/poietek/react/StudioMenuBar.tsx');
  assert.match(menu, /validated BS\.1770 \/ true-peak implementation is not installed/);
  assert.match(menu, /validated time-preserving DSP backend is not installed/);
  assert.match(menu, /No verified MIDI-clock output adapter is active/);
  assert.match(menu, /Multi-output cue routing needs a verified native audio-device adapter/);
});
