import {spawn, spawnSync} from 'node:child_process';
import {createReadStream, existsSync, statSync} from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distributionRoot = path.join(projectRoot, 'dist');
const host = process.argv.find((value) => value.startsWith('--host='))?.slice(7) || '127.0.0.1';
const requestedPort = Number(process.argv.find((value) => value.startsWith('--port='))?.slice(7) || 4173);
const shouldOpen = !process.argv.includes('--no-open');

async function findAvailablePort(startPort, maxAttempts = 20) {
  for (let port = startPort; port < startPort + maxAttempts; port += 1) {
    const isTaken = await new Promise((resolve) => {
      const probe = net.createServer();
      probe.once('error', () => resolve(true));
      probe.once('listening', () => {
        probe.close(() => resolve(false));
      });
      probe.listen(port, host === '0.0.0.0' ? '0.0.0.0' : host);
    });

    if (!isTaken) return port;
  }

  return startPort;
}

if (!existsSync(path.join(distributionRoot, 'index.html'))) {
  console.log('Preparing Poietek Studio for its first local launch…');
  const build = spawnSync(process.execPath, [path.join(projectRoot, 'scripts', 'build-web.mjs')], {
    cwd: projectRoot,
    stdio: 'inherit',
    windowsHide: true,
  });
  if (build.status !== 0) process.exit(build.status ?? 1);
}

const mime = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml; charset=utf-8'],
  ['.wasm', 'application/wasm'],
  ['.webmanifest', 'application/manifest+json; charset=utf-8'],
  ['.woff2', 'font/woff2'],
]);

function headersFor(file) {
  const name = path.basename(file);
  const immutable = file.includes(`${path.sep}assets${path.sep}`) && /-[a-zA-Z0-9_-]{8,}\./.test(name);
  return {
    'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Permissions-Policy': 'camera=(self), microphone=(self), geolocation=()',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
  };
}

const server = http.createServer((request, response) => {
  if (!request.url || !['GET', 'HEAD'].includes(request.method || '')) {
    response.writeHead(405, {'Content-Type': 'text/plain; charset=utf-8'}).end('Method not allowed');
    return;
  }

  const pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host || 'localhost'}`).pathname);
  let file = path.resolve(distributionRoot, `.${pathname}`);
  if (!file.startsWith(distributionRoot + path.sep) && file !== distributionRoot) {
    response.writeHead(403, {'Content-Type': 'text/plain; charset=utf-8'}).end('Forbidden');
    return;
  }
  if (existsSync(file) && statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!existsSync(file) || !statSync(file).isFile()) file = path.join(distributionRoot, 'index.html');

  const size = statSync(file).size;
  const range = request.headers.range?.match(/^bytes=(\d*)-(\d*)$/);
  const common = {'Content-Type': mime.get(path.extname(file).toLowerCase()) || 'application/octet-stream', ...headersFor(file)};
  if (range) {
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || end >= size) {
      response.writeHead(416, {...common, 'Content-Range': `bytes */${size}`}).end();
      return;
    }
    response.writeHead(206, {...common, 'Accept-Ranges': 'bytes', 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': end - start + 1});
    if (request.method === 'HEAD') response.end();
    else createReadStream(file, {start, end}).pipe(response);
    return;
  }

  response.writeHead(200, {...common, 'Content-Length': size});
  if (request.method === 'HEAD') response.end();
  else createReadStream(file).pipe(response);
});

const port = await findAvailablePort(requestedPort);

server.on('error', (error) => {
  console.error(`Poietek Studio could not open its local port ${host}:${port}: ${error.message}`);
  process.exitCode = 1;
});

server.listen(port, host, () => {
  const url = `http://${host === '0.0.0.0' ? '127.0.0.1' : host}:${port}`;
  console.log(`Poietek Studio is running locally at ${url}`);
  console.log('Close this window to stop the local portal. Projects remain on this device.');
  if (!shouldOpen) return;
  const command = process.platform === 'win32' ? 'cmd.exe' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  const args = process.platform === 'win32' ? ['/d', '/s', '/c', 'start', '', url] : [url];
  const child = spawn(command, args, {detached: true, stdio: 'ignore', windowsHide: true});
  child.unref();
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
