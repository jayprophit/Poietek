import {readFile} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => readFile(path.join(root, file), 'utf8');
const [manifestText, packageText, tauriText, cargoText, rustText, nodeText] =
  await Promise.all([
    read('deployment/toolchains.json'),
    read('package.json'),
    read('src-tauri/tauri.conf.json'),
    read('src-tauri/Cargo.toml'),
    read('rust-toolchain.toml'),
    read('.node-version'),
  ]);

const manifest = JSON.parse(manifestText);
const packageJson = JSON.parse(packageText);
const tauri = JSON.parse(tauriText);
const errors = [];
const expect = (condition, message) => {
  if (!condition) errors.push(message);
};

expect(manifest.schemaVersion === 1, 'unknown toolchain manifest version');
expect(nodeText.trim() === manifest.node.version, 'Node version pin does not match');
expect(
  rustText.includes(`channel = "${manifest.rust.version}"`),
  'Rust version pin does not match',
);
expect(
  cargoText.includes(`tauri = { version = "=${manifest.tauri.crateVersion}"`),
  'Tauri Rust crate is not pinned',
);
expect(
  cargoText.includes(
    `tauri-build = { version = "=${manifest.tauri.buildCrateVersion}"`,
  ),
  'Tauri build crate is not pinned',
);
expect(tauri.bundle.active === true, 'native bundling must be active');
expect(tauri.bundle.targets === 'all', 'base bundle targets must remain portable');
expect(
  tauri.bundle.android.minSdkVersion === manifest.mobile.android.minSdkVersion,
  'Android minimum SDK does not match the manifest',
);
expect(
  tauri.bundle.iOS.minimumSystemVersion ===
    manifest.mobile.ios.minimumSystemVersion,
  'iOS minimum version does not match the manifest',
);
expect(
  tauri.bundle.macOS.minimumSystemVersion ===
    manifest.desktop.macos.minimumSystemVersion,
  'macOS minimum version does not match the manifest',
);
expect(
  packageJson.scripts['native:bootstrap'] ===
    'node ./scripts/bootstrap-native.mjs',
  'native bootstrap command is missing',
);
expect(
  packageJson.scripts['mobile:android:build:aab']?.includes('--aab'),
  'Android AAB command is missing',
);
expect(
  packageJson.scripts['mobile:ios:build:app-store']?.includes(
    'app-store-connect',
  ),
  'iOS App Store build command is missing',
);
expect(
  manifest.releasePolicy.automaticStoreUpload === false,
  'store publishing must remain an explicit action',
);

for (const workflow of [
  '.github/workflows/quality.yml',
  '.github/workflows/package-desktop.yml',
  '.github/workflows/package-mobile.yml',
]) {
  const source = await read(workflow);
  expect(source.includes(manifest.node.version), `${workflow} has the wrong Node version`);
  expect(source.includes('npm ci'), `${workflow} must install from package-lock.json`);
}

const desktopWorkflow = await read('.github/workflows/package-desktop.yml');
for (const platform of Object.values(manifest.desktop)) {
  for (const target of platform.targets) {
    expect(desktopWorkflow.includes(target), `desktop target ${target} is missing`);
  }
  for (const bundle of platform.bundles) {
    expect(desktopWorkflow.includes(bundle), `desktop bundle ${bundle} is missing`);
  }
}

const mobileWorkflow = await read('.github/workflows/package-mobile.yml');
for (const target of [
  ...manifest.mobile.android.rustTargets,
  ...manifest.mobile.ios.rustTargets,
]) {
  expect(mobileWorkflow.includes(target), `mobile target ${target} is missing`);
}
expect(
  mobileWorkflow.includes('environment: native-signing'),
  'signed jobs must use the protected native-signing environment',
);
expect(
  !mobileWorkflow.includes('play.google.com') &&
    !mobileWorkflow.includes('appstoreconnect.apple.com'),
  'packaging workflow must not publish to stores',
);

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log('Native deployment configuration is internally consistent.');
}
