import {existsSync, readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const toolchains = JSON.parse(
  readFileSync(path.join(root, 'deployment', 'toolchains.json'), 'utf8'),
);
const cli = path.join(root, 'node_modules', '@tauri-apps', 'cli', 'tauri.js');
if (!existsSync(cli)) {
  console.error('The Tauri CLI is not installed in this repository.');
  console.error(`Run: npm run native:bootstrap (Tauri ${toolchains.tauri.cliVersion})`);
  console.error('Then run npm run native:doctor before building a package.');
  process.exit(1);
}

const result = spawnSync(process.execPath, [cli, ...process.argv.slice(2)], {
  cwd: root,
  stdio: 'inherit',
  windowsHide: true,
});
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
