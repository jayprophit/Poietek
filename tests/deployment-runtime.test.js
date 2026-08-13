import assert from 'node:assert/strict';
import test from 'node:test';

import {deriveDeploymentSnapshot} from './.compiled-core/deployment/derive.js';

function probe(overrides = {}) {
  return {
    nativeBridge: false,
    nativeMobile: false,
    standalone: false,
    deviceClass: 'desktop',
    online: true,
    secureContext: true,
    indexedDb: true,
    opfs: true,
    audioContext: true,
    offlineAudioContext: true,
    mediaRecorder: true,
    mediaDevices: true,
    midi: true,
    graphics: 'webgl2',
    workers: true,
    wasm: true,
    serviceWorker: true,
    ...overrides,
  };
}

test('web portal reports permission gates and never invents native audio', () => {
  const snapshot = deriveDeploymentSnapshot(probe());
  assert.equal(snapshot.mode, 'web-portal');
  assert.equal(snapshot.installableSurface, true);
  assert.equal(snapshot.engines.find((engine) => engine.id === 'audio-recording').state, 'permission-required');
  assert.equal(snapshot.engines.find((engine) => engine.id === 'midi').state, 'permission-required');
  assert.equal(snapshot.engines.find((engine) => engine.id === 'native-audio').state, 'unsupported');
});

test('installed and native modes are derived from evidence', () => {
  assert.equal(deriveDeploymentSnapshot(probe({standalone: true})).mode, 'installed-pwa');
  assert.equal(deriveDeploymentSnapshot(probe({nativeBridge: true})).mode, 'native-desktop');
  assert.equal(deriveDeploymentSnapshot(probe({nativeBridge: true, nativeMobile: true})).mode, 'native-mobile');
});

test('asset persistence degrades honestly to IndexedDB', () => {
  const snapshot = deriveDeploymentSnapshot(probe({opfs: false}));
  const media = snapshot.engines.find((engine) => engine.id === 'asset-store');
  assert.equal(media.state, 'fallback');
  assert.match(media.detail, /IndexedDB fallback/);
});

test('offline mode preserves local engines and reports network state separately', () => {
  const snapshot = deriveDeploymentSnapshot(probe({online: false}));
  assert.equal(snapshot.online, false);
  assert.equal(snapshot.engines.find((engine) => engine.id === 'project-store').state, 'available');
  assert.equal(snapshot.engines.find((engine) => engine.id === 'network').state, 'not-initialized');
});
