import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const tuning = require("./.compiled-core/player/TimePreservingPitchBackend.js");
const tempo = require("./.compiled-core/timeline/tempo.js");
const health = require("./.compiled-core/health/BasicAudioHealthAnalyzer.js");
const standards = require("./.compiled-core/health/StandardsLoudnessAnalyzer.js");
const release = require("./.compiled-core/release/ReleaseReadinessEngine.js");
const factory = require("./.compiled-core/domain/projectFactory.js");
const validation = require("./.compiled-core/domain/validate.js");
const projectSession = require("./.compiled-core/project/ProjectSession.js");
const providers = require("./.compiled-core/providers/CapabilityRouter.js");

test("A440 to A432 shift is about -31.76665 cents", () => {
  const cents = tuning.referenceShiftCents(440, 432);
  assert.ok(Math.abs(cents + 31.7666536334) < 1e-6);
});

test("time-preserving pitch fallback reports unavailable and never changes playback rate", async () => {
  const backend = new tuning.UnavailableTimePreservingPitchBackend();

  assert.equal(await backend.isAvailable(), false);
  await assert.rejects(
    backend.open({
      sourceAssetId: "asset-1",
      sourceReferenceHz: 440,
      targetReferenceHz: 432,
      mediaType: "video",
      preserveTempo: true,
      preserveDuration: true,
    }),
    /TIME_PRESERVING_PITCH_UNAVAILABLE/,
  );
});

test("tempo conversion handles a piecewise tempo map", () => {
  const tempoMap = [
    { tick: 0, bpm: 120 },
    { tick: 1920, bpm: 60 },
  ];

  assert.equal(tempo.ticksToSeconds(960, tempoMap, 960), 0.5);
  assert.equal(tempo.ticksToSeconds(2880, tempoMap, 960), 2);
  assert.equal(tempo.secondsToTicks(2, tempoMap, 960), 2880);
});

test("basic health detects digital clipping without claiming LUFS or true peak", () => {
  const samples = new Float32Array([0, 0.2, 1, -1, 0.5]);
  const result = health.analyzeBasicAudioHealth([samples]);

  assert.equal(result.status, "critical");
  assert.equal(result.channels[0].clippedSampleCount, 2);
  assert.equal("integratedLufs" in result, false);
  assert.equal("truePeakDbtp" in result, false);
});

test("standards loudness fallback returns explicit unmeasured values", async () => {
  const analyzer = new standards.UnavailableStandardsLoudnessAnalyzer();
  const result = await analyzer.analyze({
    channels: [new Float32Array([0, 0.1, -0.1])],
    sampleRate: 48000,
  });

  assert.equal(analyzer.implementationId, "unavailable");
  assert.deepEqual(result, {
    integratedLufs: null,
    momentaryLufsMax: null,
    shortTermLufsMax: null,
    loudnessRangeLu: null,
    truePeakDbtp: null,
  });
});

test("release readiness preserves A432 when a destination has no tuning requirement", () => {
  const project = factory.createBlankProject("A432");
  project.settings.tuning.referenceHz = 432;

  const result = release.checkReleaseReadiness({
    project,
    profile: {
      id: "destination-no-tuning-rule",
      label: "Destination with no tuning rule",
      tuningRequirement: { kind: "none" },
      audio: { sampleRates: [48000] },
    },
    measurements: {},
  });

  assert.equal(result.ready, true);
  assert.equal(
    result.checks.find((check) => check.id === "tuning").status,
    "pass",
  );
  assert.equal(project.settings.tuning.referenceHz, 432);
});

test("release readiness keeps required LUFS and true-peak checks unmeasured", () => {
  const result = release.checkReleaseReadiness({
    project: factory.createBlankProject(),
    profile: {
      id: "measured-delivery",
      label: "Measured delivery",
      tuningRequirement: { kind: "none" },
      audio: { integratedLufs: -14, truePeakMaxDbtp: -1 },
    },
    measurements: {},
  });

  assert.equal(
    result.checks.find((check) => check.id === "integrated-loudness").status,
    "not_measured",
  );
  assert.equal(
    result.checks.find((check) => check.id === "true-peak").status,
    "not_measured",
  );
});

test("project validation catches a clip whose asset is missing", () => {
  const project = factory.createBlankProject();
  project.tracks.push({
    id: "track-1",
    type: "audio",
    name: "Audio",
    order: 0,
    color: null,
    clips: [
      {
        id: "clip-1",
        clipType: "audio",
        assetId: "missing-asset",
        name: "Missing",
        startTick: 0,
        durationTicks: 960,
        sourceOffsetSeconds: 0,
        sourceDurationSeconds: 0.5,
        gainDb: 0,
        pan: 0,
        fadeInSeconds: 0,
        fadeOutSeconds: 0,
        muted: false,
      },
    ],
    mixer: { gainDb: 0, pan: 0, mute: false, solo: false },
  });

  assert.deepEqual(validation.validateProject(project), [
    "Clip clip-1 references missing asset missing-asset.",
  ]);
});

test("project session snapshots are isolated and saves remain serialized", async () => {
  const savedTitles = [];
  const repository = {
    async save(project) {
      // Yield once so this test detects implementations that do not serialize.
      await Promise.resolve();
      savedTitles.push(project.title);
    },
  };
  const session = new projectSession.ProjectSession(
    factory.createBlankProject("Initial"),
    repository,
  );

  const firstSave = session.mutate((project) => ({ ...project, title: "First" }));
  const secondSave = session.mutate((project) => ({ ...project, title: "Second" }));
  await Promise.all([firstSave, secondSave]);

  assert.deepEqual(savedTitles, ["First", "Second"]);

  const externalSnapshot = session.getSnapshot();
  externalSnapshot.title = "External mutation";
  assert.equal(session.getSnapshot().title, "Second");

  assert.equal((await session.undo()).title, "First");
  assert.equal((await session.redo()).title, "Second");
});

test("capability router skips unavailable providers and selects the next healthy one", async () => {
  const router = new providers.CapabilityRouter();
  router.register({
    id: "offline-high-priority",
    priority: 1000,
    capabilities: ["storage"],
    async health() {
      throw new Error("offline");
    },
  });
  router.register({
    id: "healthy-fallback",
    priority: 500,
    capabilities: ["storage"],
    async health() {
      return { available: true, quotaState: "unknown" };
    },
  });

  const selection = await router.select("storage");
  assert.equal(selection.selected?.id, "healthy-fallback");
  assert.deepEqual(
    selection.candidates.map(({ provider, available }) => [provider.id, available]),
    [
      ["offline-high-priority", false],
      ["healthy-fallback", true],
    ],
  );
});
