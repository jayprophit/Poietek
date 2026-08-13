import {spawnSync} from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';
import {buildOfflineShell} from './build-offline-shell.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const viteEntry = path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');
const build = spawnSync(process.execPath, [viteEntry, 'build', '--configLoader', 'runner'], {
  cwd: projectRoot,
  stdio: 'inherit',
  windowsHide: true,
});

if (build.error) {
  console.error(`Web build could not start: ${build.error.message}`);
  process.exit(1);
}
if (build.status !== 0) process.exit(build.status ?? 1);

const offline = await buildOfflineShell();
console.log(`Verified offline shell ${offline.version} (${offline.assetCount} application files).`);
