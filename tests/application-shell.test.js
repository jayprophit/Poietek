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
  assert.match(shell, /isStudioCommandAreaReady/);
  assert.match(shell, /subscribeStudioCommandAreaReady/);
  assert.match(shell, /dispatchStudioCommand\(pendingCommand\.detail\)/);
  assert.match(rack, /markStudioCommandAreaReady\('rack', true\)/);
  assert.doesNotMatch(rack, /DAWMenuBar|<Navigation/);

  for (const heading of [
    'File', 'Edit', 'Project', 'Track', 'Clip', 'Audio', 'MIDI',
    'Devices', 'Mixer', 'Transport', 'View', 'Window', 'Help',
  ]) {
    assert.match(menu, new RegExp(`label: '${heading}'`));
  }
});

test('Edit Select All reaches real arranger multi-selection', async () => {
  const [workspace, arranger, commands, menu] = await Promise.all([
    read('src/poietek/react/PoietekStudioWorkspace.tsx'),
    read('src/poietek/react/StudioArrangerView.tsx'),
    read('src/poietek/react/studioCommands.ts'),
    read('src/poietek/react/StudioMenuBar.tsx'),
  ]);

  assert.match(commands, /'edit-select-all'/);
	assert.match(menu, /command: 'edit-select-all'/);

assert.match(
  menu,
  /label: 'Select All'[\s\S]*command: 'edit-select-all'[\s\S]*area: 'arrange'/,
);

assert.match(
  menu,
  /Select All is currently implemented in the Arrange workspace only\./,
);

assert.match(
  menu,
  /activeArea === 'arrange'/,
);

assert.match(
  workspace,
  /case 'edit-select-all':\s*setActiveDesk\('arrange'\);\s*setSelectAllRequest\(\(current\) => current \+ 1\);\s*break;/,
);

assert.match(
  workspace,
  /selectAllRequest=\{selectAllRequest\}/,
);

  assert.match(arranger, /selectAllRequest\?: number/);
  assert.match(arranger, /lastSelectAllRequestRef/);
  assert.match(arranger, /orderedTracks\.flatMap/);
  assert.match(arranger, /track\.clips\.map/);
  assert.match(arranger, /items: validItems/);
  assert.match(arranger, /selectedItemKeys\.has/);
  assert.match(
    arranger,
    /Inspector edits the primary clip\./,
  );
});

test('Arrange track selection supports empty tracks while clip commands remain guarded', async () => {
  const [workspace, arranger] = await Promise.all([
    read('src/poietek/react/PoietekStudioWorkspace.tsx'),
    read('src/poietek/react/StudioArrangerView.tsx'),
  ]);

  assert.match(
    arranger,
    /export interface ArrangerSelection \{\s*trackId: string;\s*clipId\?: string;/,
  );

  assert.match(
    arranger,
    /onClick=\{\(\) => setSelection\(\{trackId: track\.id\}\)\}/,
  );

  assert.match(
    arranger,
    /if \(!selection\.clipId && !selection\.items\?\.length\) \{\s*onSelectionChange\?\.\(selection\);\s*return;/,
  );

  assert.match(
    workspace,
    /case 'track-duplicate':[\s\S]*if \(!arrangerSelection\) \{[\s\S]*Select the track you want to duplicate\./,
  );

  assert.match(
    workspace,
    /duplicateTrack\([\s\S]*arrangerSelection\.trackId/,
  );

  assert.match(
    workspace,
    /case 'clip-split':[\s\S]*if \(!arrangerSelection\?\.clipId\)/,
  );

  assert.match(
    workspace,
    /case 'clip-duplicate':[\s\S]*if \(!arrangerSelection\?\.clipId\)/,
  );

  assert.match(
    workspace,
    /case 'clip-fades':[\s\S]*if \(!arrangerSelection\?\.clipId\)/,
  );
});

test('Transport metronome menu reaches the real Rack click engine', async () => {
  const [menu, rack, engine, commands] = await Promise.all([
    read('src/poietek/react/StudioMenuBar.tsx'),
    read('src/App.tsx'),
    read('src/audio/engine.ts'),
    read('src/poietek/react/studioCommands.ts'),
  ]);

  assert.match(commands, /'transport-metronome-toggle'/);

  assert.match(menu, /label: 'Metronome Click'/);
  assert.match(menu, /command: 'transport-metronome-toggle'/);
  assert.match(menu, /area: 'rack'/);
  assert.match(menu, /activeArea === 'rack'/);
  assert.match(
    menu,
    /Metronome click is currently implemented in the Rack transport only\./,
  );

  assert.match(
    rack,
    /case 'transport-metronome-toggle':\s*setMasterState\(\(current\) => \(\{\.\.\.current, metronome: !current\.metronome\}\)\);\s*break;/,
  );

  assert.match(
    rack,
    /if \(!masterState\.isPlaying \|\| !masterState\.metronome\) return;/,
  );

  assert.match(
    rack,
    /audioEngine\.triggerMetronome\(step % 4 === 0\)/,
  );

  assert.match(
    engine,
    /public triggerMetronome\(isAccent = false\)/,
  );
});

test('Transport Return to Zero reaches both active production areas', async () => {
  const [menu, workspace, rack, commands] = await Promise.all([
    read('src/poietek/react/StudioMenuBar.tsx'),
    read('src/poietek/react/PoietekStudioWorkspace.tsx'),
    read('src/App.tsx'),
    read('src/poietek/react/studioCommands.ts'),
  ]);

  assert.match(commands, /'transport-return-zero'/);

  assert.match(
    menu,
    /label: 'Return to Zero', command: 'transport-return-zero', area: transportArea/,
  );

  assert.match(
    menu,
    /const transportArea: StudioArea = activeArea === 'rack' \? 'rack' : 'arrange';/,
  );

  assert.match(
    workspace,
    /case 'transport-return-zero':\s*void seek\(0\);\s*break;/,
  );

  assert.match(
    rack,
    /case 'transport-return-zero':\s*setMasterState\(\(current\) => \(\{\.\.\.current, currentStep: 0\}\)\);\s*break;/,
  );
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
