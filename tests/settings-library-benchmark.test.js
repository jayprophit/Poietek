import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import test from "node:test";

const compiledCoreDirectory = new URL("./.compiled-core/", import.meta.url);
mkdirSync(compiledCoreDirectory, { recursive: true });
writeFileSync(
  new URL("package.json", compiledCoreDirectory),
  `${JSON.stringify({ private: true, type: "commonjs" }, null, 2)}\n`,
  "utf8",
);

const require = createRequire(import.meta.url);
const settingsDefaults = require("./.compiled-core/settings/defaults.js");
const settingsValidation = require("./.compiled-core/settings/validation.js");
const settingsRepository = require("./.compiled-core/settings/BrowserStudioSettingsRepository.js");
const library = require("./.compiled-core/library/index.js");
const diagnostics = require("./.compiled-core/diagnostics/StudioBenchmark.js");

class MemoryStorage {
  values = new Map();
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, value); }
}

test("default studio settings are valid, local-first, and conservative", () => {
  const document = settingsDefaults.createDefaultStudioSettingsDocument(new Date("2026-08-13T10:00:00.000Z"));
  assert.equal(settingsValidation.validateStudioSettingsDocument(document).valid, true);
  assert.equal(document.preferences.privacy.localFirst, true);
  assert.equal(document.preferences.privacy.usageAnalytics, false);
  assert.equal(document.preferences.midi.requestSystemExclusive, false);
  assert.equal(document.preferences.audio.requestedBufferFrames, 256);
});

test("settings validation rejects invented network telemetry and unsafe ranges", () => {
  const document = settingsDefaults.createDefaultStudioSettingsDocument();
  document.preferences.privacy.usageAnalytics = true;
  document.preferences.audio.lowLatencyLimitMs = -1;
  const result = settingsValidation.validateStudioSettingsDocument(document);
  assert.equal(result.valid, false);
  assert.ok(result.issues.some((issue) => issue.path.includes("usageAnalytics")));
  assert.ok(result.issues.some((issue) => issue.path.includes("lowLatencyLimitMs")));
});

test("settings repository applies built-in profiles and round-trips custom profiles", () => {
  const storage = new MemoryStorage();
  const repository = new settingsRepository.BrowserStudioSettingsRepository(storage);
  const initial = repository.load(new Date("2026-08-13T10:00:00.000Z"));
  const tracking = repository.applyProfile(initial, "responsive-tracking", new Date("2026-08-13T10:01:00.000Z"));
  assert.equal(tracking.preferences.audio.requestedBufferFrames, 64);
  assert.equal(tracking.preferences.audio.lowLatencyMode, true);
  const custom = repository.saveCustomProfile(tracking, "My Room", new Date("2026-08-13T10:02:00.000Z"));
  assert.equal(custom.profiles.at(-1).name, "My Room");
  assert.deepEqual(repository.load(), custom);
});

test("original library distinguishes production, prototype, planned, and native-only items", () => {
  const summary = library.summarizeStudioLibrary();
  assert.ok(summary.production >= 4);
  assert.ok(summary.prototype >= 1);
  assert.ok(summary.planned >= 1);
  const bridge = library.STUDIO_LIBRARY_CATALOG.find((item) => item.id === "third-party-native");
  assert.equal(bridge.web, "requires-native-host");
  assert.equal(bridge.native, "unavailable");
  const limiter = library.STUDIO_LIBRARY_CATALOG.find((item) => item.id === "peak-limiter");
  assert.match(limiter.limitation, /No limiter or oversampled true-peak/);
});

test("procedural original kit is deterministic and remains within digital full scale", () => {
  const first = library.renderFoundryOneShotKit(12000);
  const second = library.renderFoundryOneShotKit(12000);
  assert.equal(first.length, 5);
  assert.deepEqual(Array.from(first[0].channels[0].slice(0, 128)), Array.from(second[0].channels[0].slice(0, 128)));
  for (const sample of first) {
    const peak = sample.channels[0].reduce((maximum, value) => Math.max(maximum, Math.abs(value)), 0);
    assert.ok(peak <= 1, `${sample.id} peak ${peak} exceeded full scale`);
    assert.equal(sample.license, "Poietek original");
  }
});

test("benchmark rating is derived from metrics instead of a fixed five-star claim", () => {
  const excellent = diagnostics.scoreStudioBenchmark({
    dspRealtimeFactor: { state: "measured", value: 25, unit: "x", detail: "" },
    schedulerJitterMs: { state: "measured", value: 2, unit: "ms", detail: "" },
    offlineRenderFactor: { state: "measured", value: 20, unit: "x", detail: "" },
    storageMegabytesPerSecond: { state: "measured", value: 50, unit: "MB/s", detail: "" },
  });
  assert.equal(excellent.score, 100);
  assert.equal(excellent.stars, 5);
  const unavailable = diagnostics.scoreStudioBenchmark({
    dspRealtimeFactor: { state: "unavailable", value: null, unit: "x", detail: "" },
    schedulerJitterMs: { state: "unavailable", value: null, unit: "ms", detail: "" },
    offlineRenderFactor: { state: "unavailable", value: null, unit: "x", detail: "" },
    storageMegabytesPerSecond: { state: "unavailable", value: null, unit: "MB/s", detail: "" },
  });
  assert.equal(unavailable.score, 0);
  assert.equal(unavailable.stars, 1);
});
