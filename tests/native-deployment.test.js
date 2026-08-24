import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const read = (file) => readFile(path.join(root, file), 'utf8');

test('native toolchains cover desktop, mobile, stores, and web fallbacks honestly', async () => {
  const manifest = JSON.parse(await read('deployment/toolchains.json'));
  assert.equal(manifest.node.version, '24.18.0');
  assert.equal(manifest.rust.version, '1.97.1');
  assert.equal(manifest.tauri.cliVersion, '2.11.4');
  assert.deepEqual(manifest.desktop.windows.bundles, ['nsis', 'msi']);
  assert.deepEqual(manifest.desktop.macos.bundles, ['app', 'dmg']);
  assert.deepEqual(manifest.desktop.linux.bundles, ['appimage', 'deb', 'rpm']);
  assert.ok(manifest.desktop.windows.targets.includes('aarch64-pc-windows-msvc'));
  assert.ok(manifest.desktop.linux.targets.includes('aarch64-unknown-linux-gnu'));
  assert.equal(manifest.mobile.android.signedArtifact, 'AAB');
  assert.equal(manifest.mobile.ios.signedArtifact, 'IPA');
  assert.equal(manifest.mobile.ios.hostRequirement, 'macOS with full Xcode');
  assert.equal(manifest.releasePolicy.automaticStoreUpload, false);
  assert.equal(manifest.releasePolicy.webPortalRemainsAvailable, true);
  assert.equal(manifest.releasePolicy.pwaRemainsAvailable, true);
});

test('desktop workflow emits every configured installer family without publishing', async () => {
  const workflow = await read('.github/workflows/package-desktop.yml');
  for (const expected of [
    'x86_64-pc-windows-msvc',
    'aarch64-pc-windows-msvc',
    'aarch64-apple-darwin',
    'x86_64-apple-darwin',
    'x86_64-unknown-linux-gnu',
    'aarch64-unknown-linux-gnu',
    'nsis,msi',
    'app,dmg',
    'appimage,deb,rpm',
    '--no-sign',
  ]) {
    assert.match(workflow, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.doesNotMatch(workflow, /releaseDraft|Microsoft Store|App Store|Google Play/);
  assert.match(workflow, /continue-on-error: \$\{\{ matrix\.preview \}\}/);
});

test('mobile workflow separates validation packages from protected signed packages', async () => {
  const workflow = await read('.github/workflows/package-mobile.yml');
  assert.match(workflow, /Android installable validation APK/);
  assert.match(workflow, /iOS simulator validation app/);
  assert.match(workflow, /environment: native-signing/g);
  assert.match(workflow, /ANDROID_KEYSTORE_BASE64/);
  assert.match(workflow, /APPLE_CERTIFICATE_BASE64/);
  assert.match(workflow, /APPLE_PROVISIONING_PROFILE_BASE64/);
  assert.match(workflow, /if-no-files-found: error/g);
  assert.doesNotMatch(workflow, /play\.google\.com|appstoreconnect\.apple\.com/);
});

test('signing material is ignored and store upload remains an owner action', async () => {
  const [ignore, androidSigning, appleSigning] = await Promise.all([
    read('.gitignore'),
    read('scripts/configure-android-signing.mjs'),
    read('scripts/materialize-apple-signing.mjs'),
  ]);
  for (const secretFile of ['*.jks', '*.p12', '*.mobileprovision']) {
    assert.match(ignore, new RegExp(secretFile.replace('.', '\\.').replace('*', '.*')));
  }
  assert.match(androidSigning, /mode: 0o600/);
  assert.match(androidSigning, /keystore\.properties/);
  assert.match(appleSigning, /mode: 0o600/g);
  assert.doesNotMatch(`${androidSigning}\n${appleSigning}`, /console\.log\([^)]*PASSWORD/);
});

test('mobile development host follows the address supplied by Tauri', async () => {
  const vite = await read('vite.config.ts');
  assert.match(vite, /process\.env\.TAURI_DEV_HOST/);
  assert.match(vite, /host: mobileDevHost \|\| '127\.0\.0\.1'/);
  assert.match(vite, /port: 3001/);
});
