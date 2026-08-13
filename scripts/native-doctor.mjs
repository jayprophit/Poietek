import {existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function commandVersion(command, args = ['--version']) {
  const result = spawnSync(command, args, {cwd: root, encoding: 'utf8', windowsHide: true});
  return result.status === 0 ? (result.stdout || result.stderr).trim() : null;
}

const checks = [
  {name: 'Web production bundle', required: true, ready: existsSync(path.join(root, 'dist', 'index.html')), detail: 'Run npm run build.'},
  {name: 'Tauri JavaScript CLI', required: true, ready: existsSync(path.join(root, 'node_modules', '@tauri-apps', 'cli', 'tauri.js')), detail: 'Run npm install --save-dev @tauri-apps/cli@2.11.4 when registry access is available.'},
  {name: 'Rust Cargo', required: true, ready: Boolean(commandVersion('cargo')), detail: 'Install the stable Rust MSVC toolchain.'},
  {name: 'Rust compiler', required: true, ready: Boolean(commandVersion('rustc')), detail: 'Install Rust through rustup.'},
];

if (process.platform === 'win32') {
  checks.push({
    name: 'Windows WebView2',
    required: true,
    ready: existsSync('C:\\Program Files (x86)\\Microsoft\\EdgeWebView\\Application') || existsSync('C:\\Program Files\\Microsoft\\EdgeWebView\\Application'),
    detail: 'Install WebView2 and the Microsoft C++ desktop build tools.',
  });
}

const androidHome = process.env.ANDROID_HOME || process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk');
const android = [
  {name: 'Android Java', required: false, ready: Boolean(commandVersion('java')), detail: 'Android builds require Android Studio JBR.'},
  {name: 'Android SDK', required: false, ready: Boolean(androidHome && existsSync(androidHome)), detail: 'Set ANDROID_HOME after Android Studio installs the SDK/NDK.'},
  {name: 'Android device tools', required: false, ready: Boolean(commandVersion('adb')), detail: 'Install Android platform-tools.'},
];

console.log('Poietek native deployment doctor');
console.log('=================================');
for (const check of [...checks, ...android]) {
  console.log(`${check.ready ? '[ready]' : check.required ? '[blocked]' : '[optional]'} ${check.name}`);
  if (!check.ready) console.log(`          ${check.detail}`);
}
if (process.platform !== 'darwin') console.log('[platform] iOS packages can only be built and signed on macOS with Xcode.');

const blocked = checks.filter((check) => check.required && !check.ready);
console.log(blocked.length ? `\nNative package build is blocked by ${blocked.length} required item(s).` : '\nDesktop native package prerequisites are ready.');
process.exitCode = blocked.length ? 1 : 0;
