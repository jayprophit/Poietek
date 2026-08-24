import {mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';

const compiledCoreDirectory = path.resolve('tests', '.compiled-core');
await mkdir(compiledCoreDirectory, {recursive: true});
await writeFile(
  path.join(compiledCoreDirectory, 'package.json'),
  `${JSON.stringify({private: true, type: 'commonjs'}, null, 2)}\n`,
  'utf8',
);
