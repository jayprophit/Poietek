import {existsSync, readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(
  readFileSync(path.join(root, 'deployment', 'toolchains.json'), 'utf8'),
);
const requested =
  process.argv.find((argument) => argument.startsWith('--target='))?.split('=')[1] ||
  'desktop';
const validTargets = new Set([
  'desktop',
  'windows',
  'macos',
  'linux',
  'android',
  'ios',
  'all',
]);
if (!validTargets.has(requested)) {
  console.error(`Unknown native target: ${requested}`);
  console.error(`Choose one of: ${[...validTargets].join(', ')}`);
  process.exit(2);
}

function commandVersion(command, args = ['--version']) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true,
  });
  return result.status === 0 ? (result.stdout || result.stderr).trim() : null;
}

function commandReady(command, args) {
  return spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true,
  }).status === 0;
}

function visualStudioFiles(pattern) {
  const vswhere = 'C:\\Program Files (x86)\\Microsoft Visual Studio\\Installer\\vswhere.exe';
  if (!existsSync(vswhere)) return [];
  const result = spawnSync(
    vswhere,
    ['-latest', '-products', '*', '-requires', 'Microsoft.VisualStudio.Component.VC.Tools.x86.x64', '-find', pattern],
    {cwd: root, encoding: 'utf8', windowsHide: true},
  );
  if (result.status !== 0) return [];
  return result.stdout
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter((entry) => entry && existsSync(entry));
}

const checks = [];
const add = (name, required, ready, detail) =>
  checks.push({name, required, ready, detail});
const wants = (target) => requested === target || requested === 'all';
const hostDesktop =
  process.platform === 'win32'
    ? 'windows'
    : process.platform === 'darwin'
      ? 'macos'
      : 'linux';
const wantsDesktop = requested === 'desktop' || wants(hostDesktop);

add(
  'Web production bundle',
  true,
  existsSync(path.join(root, 'dist', 'index.html')),
  'Run npm run build.',
);
const cliPackage = path.join(
  root,
  'node_modules',
  '@tauri-apps',
  'cli',
  'package.json',
);
const cliReady =
  existsSync(cliPackage) &&
  JSON.parse(readFileSync(cliPackage, 'utf8')).version === manifest.tauri.cliVersion;
add(
  `Tauri JavaScript CLI ${manifest.tauri.cliVersion}`,
  true,
  cliReady,
  'Run npm run native:bootstrap.',
);
add('Rust Cargo', true, Boolean(commandVersion('cargo')), 'Install Rust through rustup.');
add(
  `Rust compiler ${manifest.rust.version}`,
  true,
  commandVersion('rustc')?.includes(manifest.rust.version),
  `Install the pinned ${manifest.rust.version} toolchain from rust-toolchain.toml.`,
);

if (wantsDesktop && process.platform === 'win32') {
  add(
    'Windows WebView2',
    true,
    existsSync('C:\\Program Files (x86)\\Microsoft\\EdgeWebView\\Application') ||
      existsSync('C:\\Program Files\\Microsoft\\EdgeWebView\\Application'),
    'Install the WebView2 runtime.',
  );
  add(
    'Microsoft C++ build tools',
    true,
    visualStudioFiles('VC\\Tools\\MSVC\\**\\bin\\Hostx64\\x64\\cl.exe').length > 0,
    'Install Visual Studio Build Tools with Desktop development with C++.',
  );
}

if (wantsDesktop && process.platform === 'darwin') {
  add(
    'Xcode command line tools',
    true,
    Boolean(commandVersion('xcodebuild', ['-version'])),
    'Install Xcode or its command line tools.',
  );
}

if (wantsDesktop && process.platform === 'linux') {
  add(
    'WebKitGTK 4.1 development package',
    true,
    commandReady('pkg-config', ['--exists', 'webkit2gtk-4.1']),
    'Install the Tauri Linux dependencies listed in docs/NATIVE_DISTRIBUTION.md.',
  );
  add(
    'ALSA audio development package',
    true,
    commandReady('pkg-config', ['--exists', 'alsa']),
    'Install libasound2-dev for the native audio and MIDI inventory adapters.',
  );
}

if (wants('android')) {
  const androidHome =
    process.env.ANDROID_HOME ||
    (process.env.LOCALAPPDATA &&
      path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk'));
  const ndkHome = process.env.NDK_HOME;
  add('Android Java', true, Boolean(commandVersion('java')), 'Install Android Studio JBR or Java 17.');
  add('Android SDK', true, Boolean(androidHome && existsSync(androidHome)), 'Set ANDROID_HOME.');
  add('Android NDK', true, Boolean(ndkHome && existsSync(ndkHome)), 'Set NDK_HOME.');
  add('Android device tools', true, Boolean(commandVersion('adb')), 'Install Android platform-tools.');
}

if (wants('ios')) {
  add('macOS build host', true, process.platform === 'darwin', 'iOS can only be built on macOS.');
  add(
    'Full Xcode',
    true,
    process.platform === 'darwin' && Boolean(commandVersion('xcodebuild', ['-version'])),
    'Install and launch the full Xcode application.',
  );
  add(
    'CocoaPods',
    true,
    process.platform === 'darwin' && Boolean(commandVersion('pod')),
    'Install CocoaPods on the macOS build host.',
  );
}

console.log(`Poietek native deployment doctor (${requested})`);
console.log('='.repeat(39 + requested.length));
for (const check of checks) {
  console.log(`${check.ready ? '[ready]' : check.required ? '[blocked]' : '[optional]'} ${check.name}`);
  if (!check.ready) console.log(`          ${check.detail}`);
}

const blocked = checks.filter((check) => check.required && !check.ready);
console.log(
  blocked.length
    ? `\n${requested} package build is blocked by ${blocked.length} required item(s).`
    : `\n${requested} package prerequisites are ready.`,
);
process.exitCode = blocked.length ? 1 : 0;
