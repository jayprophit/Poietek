const assert = require("node:assert/strict");
const test = require("node:test");

const tuning = require("../dist-test/player/TimePreservingPitchBackend.js");
const tempo = require("../dist-test/timeline/tempo.js");
const health = require("../dist-test/health/BasicAudioHealthAnalyzer.js");
const release = require("../dist-test/release/ReleaseReadinessEngine.js");
const factory = require("../dist-test/domain/projectFactory.js");

test("A440 to A432 shift is about -31.76665 cents", () => {
  const cents = tuning.referenceShiftCents(440, 432);
  assert.ok(Math.abs(cents + 31.7666536334) < 1e-6);
});

test("tempo conversion at 120 BPM and 960 PPQ", () => {
  assert.equal(tempo.ticksToSeconds(960, [{ tick: 0, bpm: 120 }], 960), 0.5);
  assert.equal(tempo.secondsToTicks(1, [{ tick: 0, bpm: 120 }], 960), 1920);
});

test("health detects clipping", () => {
  const samples = new Float32Array([0, 0.2, 1, -1, 0.5]);
  const result = health.analyzeBasicAudioHealth([samples]);
  assert.equal(result.status, "critical");
  assert.equal(result.channels[0].clippedSampleCount, 2);
});

test("YouTube-like profile with no tuning requirement preserves A432", () => {
  const project = factory.createBlankProject("A432");
  project.settings.tuning.referenceHz = 432;

  const result = release.checkReleaseReadiness({
    project,
    profile: {
      id: "youtube-current",
      label: "YouTube current upload",
      tuningRequirement: { kind: "none" },
      audio: { sampleRates: [48000] },
    },
    measurements: {},
  });

  assert.equal(result.ready, true);
  assert.equal(result.checks.find((check) => check.id === "tuning").status, "pass");
});
