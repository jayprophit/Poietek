import {mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {homedir, tmpdir} from 'node:os';

const required = [
  'APPLE_CERTIFICATE_BASE64',
  'APPLE_CERTIFICATE_PASSWORD',
  'APPLE_DEVELOPMENT_TEAM',
  'APPLE_PROVISIONING_PROFILE_BASE64',
];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  console.error(`Missing Apple signing secrets: ${missing.join(', ')}`);
  process.exit(1);
}

const temporary = process.env.RUNNER_TEMP || tmpdir();
const certificatePath = path.join(temporary, 'poietek-signing.p12');
const profileDirectory = path.join(
  homedir(),
  'Library',
  'MobileDevice',
  'Provisioning Profiles',
);
const profilePath = path.join(profileDirectory, 'Poietek.mobileprovision');
await mkdir(profileDirectory, {recursive: true});
await writeFile(
  certificatePath,
  Buffer.from(process.env.APPLE_CERTIFICATE_BASE64, 'base64'),
  {mode: 0o600},
);
await writeFile(
  profilePath,
  Buffer.from(process.env.APPLE_PROVISIONING_PROFILE_BASE64, 'base64'),
  {mode: 0o600},
);

console.log(`certificate=${certificatePath}`);
console.log(`profile=${profilePath}`);
