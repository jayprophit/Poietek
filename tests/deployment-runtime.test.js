import assert from 'node:assert/strict';
import test from 'node:test';

import {deriveDeploymentSnapshot} from './.compiled-core/deployment/derive.js';
import {deriveDeviceRuntimeProfile} from './.compiled-core/deployment/deviceProfile.js';

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

function device(overrides = {}) {
  return {
    viewportWidth: 1440,
    viewportHeight: 900,
    pixelRatio: 1,
    coarsePointer: false,
    finePointer: true,
    hover: true,
    maxTouchPoints: 0,
    mobileHint: false,
    nativeBridge: false,
    standalone: false,
    ...overrides,
  };
}

test('desktop receives the expanded pointer-and-keyboard workspace', () => {
  const profile = deriveDeviceRuntimeProfile(device());
  assert.equal(profile.deviceClass, 'desktop');
  assert.equal(profile.layout, 'expanded');
  assert.equal(profile.primaryNavigation, 'top');
  assert.equal(profile.inputMode, 'mouse-keyboard');
  assert.equal(profile.showKeyboardShortcuts, true);
  assert.equal(profile.touchTargetPx, 32);
});

test('phone receives the handheld touch workspace in portrait and landscape', () => {
  const portrait = deriveDeviceRuntimeProfile(device({
    viewportWidth: 390,
    viewportHeight: 844,
    pixelRatio: 3,
    coarsePointer: true,
    finePointer: false,
    hover: false,
    maxTouchPoints: 5,
    mobileHint: true,
  }));
  const landscape = deriveDeviceRuntimeProfile(device({
    viewportWidth: 844,
    viewportHeight: 390,
    pixelRatio: 3,
    coarsePointer: true,
    finePointer: false,
    hover: false,
    maxTouchPoints: 5,
    mobileHint: true,
  }));
  for (const profile of [portrait, landscape]) {
    assert.equal(profile.deviceClass, 'mobile');
    assert.equal(profile.layout, 'handheld');
    assert.equal(profile.primaryNavigation, 'bottom');
    assert.equal(profile.rackPresentation, 'horizontal-scroll');
    assert.equal(profile.touchTargetPx, 44);
  }
  assert.equal(portrait.orientation, 'portrait');
  assert.equal(landscape.orientation, 'landscape');
});

test('tablet and hybrid inputs receive compact touch-safe controls', () => {
  const profile = deriveDeviceRuntimeProfile(device({
    viewportWidth: 1024,
    viewportHeight: 768,
    pixelRatio: 2,
    coarsePointer: true,
    finePointer: true,
    maxTouchPoints: 10,
  }));
  assert.equal(profile.deviceClass, 'tablet');
  assert.equal(profile.layout, 'compact');
  assert.equal(profile.primaryNavigation, 'compact');
  assert.equal(profile.inputMode, 'hybrid');
  assert.equal(profile.touchTargetPx, 44);
  assert.equal(profile.showKeyboardShortcuts, true);
});

test('a narrow desktop window uses compact layout without inventing tablet hardware', () => {
  const profile = deriveDeviceRuntimeProfile(device({viewportWidth: 1024, viewportHeight: 768}));
  assert.equal(profile.deviceClass, 'desktop');
  assert.equal(profile.layout, 'compact');
  assert.equal(profile.primaryNavigation, 'compact');
  assert.equal(profile.inputMode, 'mouse-keyboard');
});

test('a phone-width desktop window uses handheld layout without claiming mobile hardware', () => {
  const profile = deriveDeviceRuntimeProfile(device({viewportWidth: 390, viewportHeight: 844}));
  assert.equal(profile.deviceClass, 'desktop');
  assert.equal(profile.layout, 'handheld');
  assert.equal(profile.inputMode, 'mouse-keyboard');
});

test('unidentified access points remain other instead of inventing a device', () => {
  const profile = deriveDeviceRuntimeProfile(device({
    viewportWidth: 0,
    viewportHeight: 0,
    finePointer: false,
    hover: false,
  }));
  assert.equal(profile.deviceClass, 'other');
  assert.equal(profile.layout, 'compact');
  assert.equal(profile.orientation, 'unknown');
});
