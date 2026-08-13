import {existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cli = path.join(root, 'node_modules', '@tauri-apps', 'cli', 'tauri.js');
if (!existsSync(cli)) {
  console.error('The Tauri CLI is not installed in this repository.');
  console.error('Run: npm install --save-dev @tauri-apps/cli@2.11.4');
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
