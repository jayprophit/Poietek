import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const androidRoot = path.join(root, 'src-tauri', 'gen', 'android');
const gradleFile = path.join(androidRoot, 'app', 'build.gradle.kts');
const required = [
  'ANDROID_KEYSTORE_BASE64',
  'ANDROID_KEY_ALIAS',
  'ANDROID_KEY_PASSWORD',
  'ANDROID_STORE_PASSWORD',
];
const missing = required.filter((name) => !process.env[name]);

if (missing.length) {
  console.error(`Missing Android signing secrets: ${missing.join(', ')}`);
  process.exit(1);
}

const keystorePath = path.join(
  process.env.RUNNER_TEMP || androidRoot,
  'poietek-upload.jks',
);
await writeFile(
  keystorePath,
  Buffer.from(process.env.ANDROID_KEYSTORE_BASE64, 'base64'),
  {mode: 0o600},
);

const properties = [
  `storeFile=${keystorePath.replaceAll('\\', '\\\\')}`,
  `storePassword=${process.env.ANDROID_STORE_PASSWORD}`,
  `keyAlias=${process.env.ANDROID_KEY_ALIAS}`,
  `keyPassword=${process.env.ANDROID_KEY_PASSWORD}`,
  '',
].join('\n');
await writeFile(path.join(androidRoot, 'keystore.properties'), properties, {
  mode: 0o600,
});

let gradle = await readFile(gradleFile, 'utf8');
const marker = '// Poietek release signing';
if (!gradle.includes(marker)) {
  gradle = `import java.io.FileInputStream\nimport java.util.Properties\n${gradle}`;
  const androidBlock = /android\s*\{/;
  if (!androidBlock.test(gradle)) {
    throw new Error('Android Gradle file has no android block');
  }
  gradle = gradle.replace(
    androidBlock,
    `android {\n    ${marker}\n    signingConfigs {\n        create("release") {\n            val signing = Properties()\n            signing.load(FileInputStream(rootProject.file("keystore.properties")))\n            storeFile = file(signing["storeFile"] as String)\n            storePassword = signing["storePassword"] as String\n            keyAlias = signing["keyAlias"] as String\n            keyPassword = signing["keyPassword"] as String\n        }\n    }`,
  );

  const releaseBlock = /getByName\("release"\)\s*\{/;
  if (!releaseBlock.test(gradle)) {
    throw new Error('Android Gradle file has no release build type');
  }
  gradle = gradle.replace(
    releaseBlock,
    'getByName("release") {\n            signingConfig = signingConfigs.getByName("release")',
  );
  await writeFile(gradleFile, gradle, 'utf8');
}

console.log('Android release signing is configured without exposing key material.');
