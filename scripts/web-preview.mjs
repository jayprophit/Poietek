import {spawn, spawnSync} from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const viteEntry = path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');
const portArgument = process.argv.find((argument) => argument.startsWith('--port='));
const port = portArgument?.slice('--port='.length) || '3000';

console.log('Preparing the verified Poietek web preview…');
const build = spawnSync(process.execPath, [path.join(projectRoot, 'scripts', 'build-web.mjs')], {
  cwd: projectRoot,
  stdio: 'inherit',
  windowsHide: true,
});

if (build.error) {
  console.error(`Preview build could not start: ${build.error.message}`);
  process.exit(1);
}
if (build.status !== 0) process.exit(build.status ?? 1);

const preview = spawn(process.execPath, [
  viteEntry,
  'preview',
  '--configLoader',
  'runner',
  '--host',
  '0.0.0.0',
  '--port',
  port,
  '--strictPort',
], {
  cwd: projectRoot,
  stdio: 'inherit',
  windowsHide: true,
});

const stop = (signal) => {
  if (!preview.killed) preview.kill(signal);
};
process.on('SIGINT', () => stop('SIGINT'));
process.on('SIGTERM', () => stop('SIGTERM'));
preview.on('error', (error) => {
  console.error(`Preview server could not start: ${error.message}`);
  process.exitCode = 1;
});
preview.on('exit', (code) => {
  process.exitCode = code ?? 0;
});
