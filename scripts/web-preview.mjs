import {spawn, spawnSync} from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const viteEntry = path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');
const hostArgument = process.argv.find((argument) => argument.startsWith('--host='));
const host = hostArgument?.slice('--host='.length) || '0.0.0.0';
const portArgument = process.argv.find((argument) => argument.startsWith('--port='));
const requestedPort = Number.parseInt(portArgument?.slice('--port='.length) || '3000', 10);

async function findAvailablePort(startPort, maxAttempts = 20) {
  for (let port = startPort; port < startPort + maxAttempts; port += 1) {
    const isTaken = await new Promise((resolve) => {
      const probe = net.createServer();
      probe.once('error', () => resolve(true));
      probe.once('listening', () => {
        probe.close(() => resolve(false));
      });
      probe.listen(port, host);
    });

    if (!isTaken) return port;
  }

  return startPort;
}

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

const port = await findAvailablePort(Number.isFinite(requestedPort) ? requestedPort : 3000);
console.log(`Launching Poietek preview at http://${host === '0.0.0.0' ? '127.0.0.1' : host}:${port}/`);

const preview = spawn(process.execPath, [
  viteEntry,
  'preview',
  '--configLoader',
  'runner',
  '--host',
  host,
  '--port',
  String(port),
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
