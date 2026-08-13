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
const contracts = require("./.compiled-core/hardware/contracts.js");
const defaults = require("./.compiled-core/hardware/defaults.js");
const extension = require("./.compiled-core/hardware/extension.js");
const negotiation = require("./.compiled-core/hardware/negotiation.js");
const validation = require("./.compiled-core/hardware/validation.js");

const now = "2026-08-12T12:00:00.000Z";

function verifiedInterfaceProfile() {
  return {
    id: "profile-interface-1",
    version: "1.0.0",
    kind: "audio_interface",
    manufacturer: "Example",
    model: "Measured Interface",
    declaredCapabilityIds: ["audio.io", "clock.sample"],
    ports: [
      {
        id: "output-1",
        label: "Output 1",
        direction: "output",
        medium: "analogue_audio",
        channelCount: 1,
        connector: "TRS",
        declaredNominalLevel: null,
      },
      {
        id: "input-1",
        label: "Input 1",
        direction: "input",
        medium: "analogue_audio",
        channelCount: 1,
        connector: "TRS",
        declaredNominalLevel: null,
      },
    ],
    provenance: {
      verification: "verified",
      source: "manufacturer",
      sourceReference: "manufacturer:example:measured-interface:1.0.0",
      digestAlgorithm: "SHA-256",
      digest: "0123456789abcdef",
      verifiedAt: now,
    },
    metadata: {},
  };
}

function addDisconnectedInterface(foundation) {
  const profile = verifiedInterfaceProfile();
  foundation.profiles.push(profile);
  const device = {
    id: "device-interface-1",
    label: "Interface",
    selectedProfile: defaults.createUserProfileSelection(profile, "actor-1", now),
    connection: {
      state: "disconnected",
      adapterId: null,
      observedAt: null,
      reason: "Not probed in this session.",
    },
    identifiers: [],
    desiredState: { sampleRateHz: 48000 },
    lastObservedState: null,
    lastObservedCapabilities: [],
    metadata: {},
  };
  foundation.devices.push(device);
  return device;
}

test("local hardware defaults are disconnected, separate and not measured", () => {
  const foundation = defaults.createLocalHardwareFoundation({
    projectId: "project-1",
    now,
  });

  assert.equal(
    foundation.schemaVersion,
    contracts.HARDWARE_FOUNDATION_SCHEMA_VERSION,
  );
  assert.equal(foundation.devices.length, 0);
  assert.equal(foundation.timing.audioTransport.runState, "stopped");
  assert.equal(foundation.timing.sampleClock.lockState, "not_measured");
  assert.equal(foundation.timing.midiClock.syncState, "not_measured");
  assert.equal(foundation.timing.wordClock.lockState, "not_measured");
  assert.equal(foundation.timing.metering.observations.length, 0);
  assert.deepEqual(validation.validateHardwareFoundation(foundation), []);
  assert.deepEqual(JSON.parse(JSON.stringify(foundation)), foundation);
});

test("canonical extension rejects mismatched and unknown hardware records", () => {
  const project = { id: "project-1", extensions: {} };
  const foundation = defaults.createLocalHardwareFoundation({
    projectId: "project-1",
    now,
  });
  const attached = extension.withHardwareFoundation(project, foundation);

  assert.equal(extension.readHardwareFoundation(attached).state, "ready");
  assert.equal(
    project.extensions[contracts.HARDWARE_FOUNDATION_EXTENSION_KEY],
    undefined,
  );
  assert.deepEqual(
    extension.readHardwareFoundation({
      id: "project-1",
      extensions: {
        [contracts.HARDWARE_FOUNDATION_EXTENSION_KEY]: {
          ...foundation,
          schemaVersion: "99.0.0",
        },
      },
    }),
    { state: "unsupported_version", schemaVersion: "99.0.0" },
  );
  assert.throws(
    () =>
      extension.withHardwareFoundation(
        { id: "another-project", extensions: {} },
        foundation,
      ),
    /does not match/,
  );
});

test("adapter declarations without probe observations never become available", () => {
  const descriptor = {
    adapterId: "native-audio-1",
    implementationId: "poietek.native-audio.v1",
    version: "1.0.0",
    probeableCapabilityIds: ["audio.io", "clock.sample"],
  };
  const reports = negotiation.negotiateAdapterCapabilities(
    descriptor,
    [
      {
        capabilityId: "audio.io",
        state: "available",
        probeId: "probe-1",
        observedAt: now,
        reasonCode: null,
        message: null,
        limitations: ["exclusive mode not negotiated"],
      },
    ],
    ["audio.io", "clock.sample", "clock.word"],
  );

  assert.equal(reports[0].state, "available");
  assert.deepEqual(reports[0].evidence, {
    kind: "adapter_negotiation",
    adapterId: "native-audio-1",
    probeId: "probe-1",
  });
  assert.equal(reports[1].state, "not_measured");
  assert.equal(reports[2].state, "unavailable");
});

test("disconnect preserves profile, desired state and historic observations", () => {
  const foundation = defaults.createLocalHardwareFoundation({
    projectId: "project-1",
    now,
  });
  const profile = verifiedInterfaceProfile();
  foundation.profiles.push(profile);
  const device = {
    id: "device-interface-1",
    label: "Interface",
    selectedProfile: defaults.createUserProfileSelection(profile, "actor-1", now),
    connection: {
      state: "connected",
      adapterId: "native-audio-1",
      observedAt: now,
      reason: null,
    },
    identifiers: [{ scheme: "native", value: "device-guid" }],
    desiredState: { sampleRateHz: 48000 },
    lastObservedState: { sampleRateHz: 48000 },
    lastObservedCapabilities: [
      {
        capabilityId: "audio.io",
        state: "available",
        source: "adapter",
        implementationId: "poietek.native-audio.v1",
        observedAt: now,
        reasonCode: null,
        message: null,
        limitations: [],
        evidence: {
          kind: "adapter_negotiation",
          adapterId: "native-audio-1",
          probeId: "probe-1",
        },
      },
    ],
    metadata: {},
  };

  const disconnected = defaults.markDeviceDisconnected(
    device,
    "USB device removed.",
    "2026-08-12T12:01:00.000Z",
  );

  assert.equal(disconnected.connection.state, "disconnected");
  assert.equal(disconnected.selectedProfile.profileId, profile.id);
  assert.deepEqual(disconnected.desiredState, { sampleRateHz: 48000 });
  assert.deepEqual(disconnected.lastObservedState, { sampleRateHz: 48000 });
  assert.equal(disconnected.lastObservedCapabilities[0].state, "available");
  assert.equal(
    defaults.effectiveDeviceCapability(disconnected, "audio.io").state,
    "unavailable",
  );
});

test("round-trip latency is derived only from physical loopback evidence", () => {
  const foundation = defaults.createLocalHardwareFoundation({
    projectId: "project-1",
    now,
  });
  addDisconnectedInterface(foundation);
  const endpoint = (portId) => ({
    deviceId: "device-interface-1",
    portId,
    channel: 1,
  });
  const evidence = {
    id: "loopback-1",
    kind: "physical_loopback",
    measurementKinds: ["round_trip_latency", "analogue_level"],
    source: endpoint("output-1"),
    return: endpoint("input-1"),
    sampleRateHz: 48000,
    repetitions: 5,
    procedureId: "poietek.physical-loopback.impulse.v1",
    performedByActorId: "actor-1",
    performedAt: now,
    rawObservationAssetId: "asset-loopback-raw",
    notes: null,
  };
  foundation.loopbackEvidence.push(evidence);
  foundation.analogueInserts.push({
    id: "insert-1",
    label: "Hardware compressor",
    send: endpoint("output-1"),
    return: endpoint("input-1"),
    bypassed: false,
    roundTripLatency: defaults.measuredRoundTripLatency(480, evidence),
    levelCalibration: {
      state: "measured",
      sentLevelDbfs: -18,
      measuredReturnLevelDbfs: -18.2,
      referenceLevelDbu: 4,
      correctionDb: 0.2,
      evidenceId: evidence.id,
    },
    desiredSettings: { threshold: "-10" },
    lastUserConfirmedSettings: null,
    lastConfirmedByActorId: null,
    lastConfirmedAt: null,
  });

  assert.equal(
    foundation.analogueInserts[0].roundTripLatency.roundTripMilliseconds,
    10,
  );
  assert.deepEqual(validation.validateHardwareFoundation(foundation), []);

  foundation.analogueInserts[0].roundTripLatency.evidenceId = "invented";
  assert.ok(
    validation
      .validateHardwareFoundation(foundation)
      .some((item) => item.code === "LATENCY_PHYSICAL_EVIDENCE_REQUIRED"),
  );
});

test("validators reject fabricated lock, console and metering claims", () => {
  const foundation = defaults.createLocalHardwareFoundation({
    projectId: "project-1",
    now,
  });
  foundation.timing.sampleClock.lockState = "locked";
  foundation.timing.sampleClock.nominalSampleRateHz = 48000;
  foundation.timing.metering.observations.push({
    id: "meter-observation-1",
    meterId: "meter-1",
    metric: "sample_peak",
    value: -1,
    unit: "dbfs",
    channel: 1,
    observedAt: now,
    source: "hardware_adapter",
  });
  foundation.digitalConsoleSync.push({
    id: "console-sync-1",
    consoleDeviceId: "console-1",
    scope: "control_state_only",
    protocol: "midi",
    connection: {
      state: "connected",
      adapterId: "midi-1",
      observedAt: now,
      reason: null,
    },
    capability: defaults.notMeasuredHardwareCapability("console.control"),
    direction: "bidirectional",
    desiredParameters: {},
    lastObservedParameters: null,
    pendingParameterKeys: [],
    conflictPolicy: "ask_user",
    lastSyncAt: null,
  });

  const codes = validation
    .validateHardwareFoundation(foundation)
    .map((item) => item.code);
  assert.ok(codes.includes("SAMPLE_CLOCK_LOCK_EVIDENCE_REQUIRED"));
  assert.ok(codes.includes("METERING_CAPABILITY_REQUIRED"));
  assert.ok(codes.includes("CONSOLE_SYNC_CAPABILITY_REQUIRED"));
});

test("MIDI clock, word clock and LTC remain separate capability domains", () => {
  const foundation = defaults.createLocalHardwareFoundation({
    projectId: "project-1",
    now,
  });
  foundation.timing.timecode.push({
    id: "ltc-1",
    kind: "ltc",
    capability: defaults.notMeasuredHardwareCapability("timecode.ltc"),
    endpoint: null,
    frameRate: "25",
    direction: "chase",
    lockState: "locked",
    observedAddress: "01:00:00:00",
    observedAt: now,
  });

  assert.notStrictEqual(
    foundation.timing.midiClock.capability,
    foundation.timing.wordClock.capability,
  );
  assert.notStrictEqual(
    foundation.timing.sampleClock.capability,
    foundation.timing.timecode[0].capability,
  );
  assert.ok(
    validation
      .validateHardwareFoundation(foundation)
      .some((item) => item.code === "TIMECODE_LOCK_EVIDENCE_REQUIRED"),
  );
});
