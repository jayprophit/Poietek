import {existsSync, readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(
  readFileSync(path.join(root, 'deployment', 'toolchains.json'), 'utf8'),
);
const expectedVersion = manifest.tauri.cliVersion;
const packageFile = path.join(
  root,
  'node_modules',
  '@tauri-apps',
  'cli',
  'package.json',
);

if (existsSync(packageFile)) {
  const installed = JSON.parse(readFileSync(packageFile, 'utf8')).version;
  if (installed === expectedVersion) {
    console.log(`Tauri CLI ${installed} is ready.`);
    process.exit(0);
  }
  console.error(`Tauri CLI ${installed} is installed; ${expectedVersion} is required.`);
}

const npmCli = process.env.npm_execpath;
if (!npmCli || !existsSync(npmCli)) {
  console.error('Run this command through npm so the trusted npm CLI can be located.');
  console.error('Expected usage: npm run native:bootstrap');
  process.exit(1);
}

console.log(`Installing repository-local Tauri CLI ${expectedVersion}...`);
const result = spawnSync(
  process.execPath,
  [
    npmCli,
    'install',
    '--no-save',
    '--package-lock=false',
    '--no-audit',
    '--no-fund',
    `@tauri-apps/cli@${expectedVersion}`,
  ],
  {cwd: root, stdio: 'inherit', windowsHide: true},
);

if (result.error) console.error(result.error.message);
if (result.status !== 0) {
  console.error('The pinned Tauri CLI could not be installed.');
  console.error('Check registry access, then rerun npm run native:bootstrap.');
}
process.exit(result.status ?? 1);
