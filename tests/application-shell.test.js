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

test('one application adapts to only the active runtime device profile', async () => {
  const [shell, hook, styles, orientationControl, rack, globalStyles] = await Promise.all([
    read('src/poietek/react/PoietekAppShell.tsx'),
    read('src/poietek/react/useDeviceRuntimeProfile.ts'),
    read('src/poietek/react/PoietekAppShell.css'),
    read('src/poietek/react/DeviceOrientationControl.tsx'),
    read('src/App.tsx'),
    read('src/index.css'),
  ]);
  assert.match(shell, /useDeviceRuntimeProfile/);
  assert.match(shell, /data-device-class=/);
  assert.match(shell, /data-device-layout=/);
  assert.match(shell, /deviceProfile\.showKeyboardShortcuts/);
  assert.match(hook, /orientationchange/);
  assert.match(hook, /\(orientation: portrait\)/);
  assert.match(hook, /visualViewport/);
  assert.match(hook, /poietekDeviceLayout/);
  assert.match(styles, /data-device-layout='compact'/);
  assert.match(styles, /data-device-layout='handheld'/);
  assert.match(styles, /position: fixed;[\s\S]*bottom: 0;/);
  assert.match(styles, /data-device-class='mobile'\]\[data-orientation='landscape'/);
  assert.match(orientationControl, /screen\.orientation/);
  assert.match(orientationControl, /Rotation lock was blocked/);
  assert.match(orientationControl, /does not allow Poietek to lock orientation/);
  assert.doesNotMatch(orientationControl, /transform:\s*rotate/);
  assert.match(rack, /poietek-rack-center/);
  assert.match(rack, /poietek-rack-transport/);
  assert.match(globalStyles, /data-poietek-device-layout='handheld'/);
  assert.match(globalStyles, /data-poietek-device-layout='compact'\]\[data-poietek-orientation='landscape'/);
  assert.match(globalStyles, /poietek-rack-transport-body/);
  assert.match(globalStyles, /flex-wrap: nowrap/);
  assert.match(globalStyles, /safe-area-inset-bottom/);
});
