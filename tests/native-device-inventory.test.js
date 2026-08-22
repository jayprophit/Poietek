import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const read = (file) => readFile(path.join(root, file), 'utf8');
const require = createRequire(import.meta.url);
const {validateNativeStudioDeviceInventory} = require(
  './.compiled-core/native/validation.js',
);

function validInventory() {
  return {
    schemaVersion: 1,
    platform: 'windows',
    supported: true,
    scannedAtEpochMs: 1_800_000_000_000,
    audioHosts: ['wasapi'],
    audioInputs: [
      {
        id: 'wasapi:input:interface-1',
        name: 'Studio Interface',
        host: 'wasapi',
        direction: 'input',
        isDefault: true,
        capabilityStatus: 'detected',
        capabilityMessage: null,
        supportedConfigs: [
          {
            channels: 2,
            minSampleRate: 44_100,
            maxSampleRate: 96_000,
            minBufferFrames: 32,
            maxBufferFrames: 2048,
            sampleFormat: 'F32',
          },
        ],
        preferredConfig: {
          channels: 2,
          sampleRate: 48_000,
          minBufferFrames: 32,
          maxBufferFrames: 2048,
          sampleFormat: 'F32',
        },
        selectableByNativeEngine: false,
        latencyStatus: 'not_measured',
        latencyMs: null,
      },
    ],
    audioOutputs: [],
    midiInputs: [
      {
        id: 'midi-in-1',
        name: 'Keyboard',
        direction: 'input',
        capabilityStatus: 'detected',
        capabilityMessage: null,
        selectableByNativeEngine: false,
      },
    ],
    midiOutputs: [],
    engine: {
      status: 'inventory_only',
      message: 'No streams or MIDI connections are opened.',
    },
    warnings: [],
  };
}

test('native device inventory accepts evidence without inventing engine readiness', () => {
  const inventory = validInventory();
  assert.equal(validateNativeStudioDeviceInventory(inventory), true);
  assert.equal(inventory.audioInputs[0].selectableByNativeEngine, false);
  assert.equal(inventory.audioInputs[0].latencyStatus, 'not_measured');
  assert.equal(inventory.audioInputs[0].latencyMs, null);
});

test('native device inventory rejects direction and capability inflation', () => {
  const wrongDirection = validInventory();
  wrongDirection.audioInputs[0].direction = 'output';
  assert.equal(validateNativeStudioDeviceInventory(wrongDirection), false);

  const fakeSelection = validInventory();
  fakeSelection.midiInputs[0].selectableByNativeEngine = true;
  assert.equal(validateNativeStudioDeviceInventory(fakeSelection), false);

  const fakeLatency = validInventory();
  fakeLatency.audioInputs[0].latencyMs = 2.4;
  assert.equal(validateNativeStudioDeviceInventory(fakeLatency), false);
});

test('Rust inventory command enumerates ports without opening realtime resources', async () => {
  const source = await read('src-tauri/src/commands.rs');
  assert.match(source, /cpal::available_hosts\(\)/);
  assert.match(source, /host\.input_devices\(\)/);
  assert.match(source, /MidiInput::new/);
  assert.match(source, /midi_input\.ports\(\)/);
  assert.match(source, /selectable_by_native_engine: false/g);
  assert.match(source, /latency_status: "not_measured"/);
  assert.doesNotMatch(source, /build_(?:input|output)_stream/);
  assert.doesNotMatch(source, /\.connect\s*\(/);
  assert.doesNotMatch(source, /MidiOutputConnection|send\s*\(/);
});

test('Tauri grants only the read-only inventory command to the main window', async () => {
  const [capabilityText, permission, rust, configText] = await Promise.all([
    read('src-tauri/capabilities/main-minimal.json'),
    read('src-tauri/permissions/studio-device-inventory.toml'),
    read('src-tauri/src/lib.rs'),
    read('src-tauri/tauri.conf.json'),
  ]);
  const capability = JSON.parse(capabilityText);
  const config = JSON.parse(configText);
  assert.deepEqual(capability.permissions, ['studio-device-inventory']);
  assert.match(permission, /commands\.allow = \["list_native_studio_devices"\]/);
  assert.doesNotMatch(permission, /commands\.deny|scope|filesystem|shell/);
  assert.match(rust, /commands::list_native_studio_devices/);
  assert.equal(config.app.withGlobalTauri, true);
});
