import {readFile, writeFile} from 'node:fs/promises';

const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
const lockfile = JSON.parse(await readFile('package-lock.json', 'utf8'));
const rootNames = new Set([
  ...Object.keys(packageJson.dependencies ?? {}),
  ...Object.keys(packageJson.devDependencies ?? {}),
]);
const reachable = new Set();
const queue = [...rootNames];

while (queue.length) {
  const name = queue.shift();
  if (reachable.has(name)) continue;
  const metadata = lockfile.packages[`node_modules/${name}`];
  if (!metadata) throw new Error(`package-lock.json has no entry for ${name}.`);
  reachable.add(name);

  for (const field of ['dependencies', 'optionalDependencies']) {
    for (const child of Object.keys(metadata[field] ?? {})) {
      if (lockfile.packages[`node_modules/${child}`] && !reachable.has(child)) {
        queue.push(child);
      }
    }
  }

  for (const peer of Object.keys(metadata.peerDependencies ?? {})) {
    const optional = metadata.peerDependenciesMeta?.[peer]?.optional;
    if (!optional && lockfile.packages[`node_modules/${peer}`] && !reachable.has(peer)) {
      queue.push(peer);
    }
  }
}

const packages = {
  '': {
    ...lockfile.packages[''],
    name: packageJson.name,
    version: packageJson.version,
    dependencies: packageJson.dependencies,
    devDependencies: packageJson.devDependencies,
  },
};

for (const name of [...reachable].sort()) {
  packages[`node_modules/${name}`] = lockfile.packages[`node_modules/${name}`];
}

await writeFile(
  'package-lock.json',
  `${JSON.stringify(
    {
      name: packageJson.name,
      version: packageJson.version,
      lockfileVersion: lockfile.lockfileVersion,
      requires: true,
      packages,
    },
    null,
    2,
  )}\n`,
  'utf8',
);

console.log(`Lockfile reconciled to ${Object.keys(packages).length - 1} packages.`);
