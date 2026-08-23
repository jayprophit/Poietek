import {readdir, readFile} from 'node:fs/promises';
import path from 'node:path';

const roots = [
  '.github',
  'deployment',
  'docs',
  'native-core',
  'public',
  'scripts',
  'src',
  'src-tauri',
  'tests',
];
const textExtensions = new Set([
  '.css',
  '.cpp',
  '.h',
  '.html',
  '.js',
  '.json',
  '.md',
  '.mjs',
  '.rs',
  '.toml',
  '.ts',
  '.tsx',
  '.yaml',
  '.yml',
]);
const ignoredDirectories = new Set(['.compiled-core', 'build', 'target']);
const problems = [];

async function inspectDirectory(directory) {
  for (const entry of await readdir(directory, {withFileTypes: true})) {
    if (
      entry.isDirectory() &&
      (ignoredDirectories.has(entry.name) || entry.name.startsWith('build-'))
    ) continue;
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await inspectDirectory(filePath);
      continue;
    }
    if (!textExtensions.has(path.extname(entry.name))) continue;

    const text = await readFile(filePath, 'utf8');
    const relative = path.relative(process.cwd(), filePath);
    if (text.includes('\u0000')) problems.push(`${relative}: contains a NUL byte`);
    if (/^(<{7}|={7}|>{7})(?: |$)/m.test(text)) {
      problems.push(`${relative}: contains an unresolved merge marker`);
    }
    if (!text.endsWith('\n')) problems.push(`${relative}: no final newline`);
    text.split(/\r?\n/).forEach((line, index) => {
      if (/[ \t]+$/.test(line)) {
        problems.push(`${relative}:${index + 1}: trailing whitespace`);
      }
    });
  }
}

for (const root of roots) {
  await inspectDirectory(path.resolve(root));
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Formatting hygiene check passed.');
}
