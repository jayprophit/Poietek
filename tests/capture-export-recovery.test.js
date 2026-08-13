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
const capture = require("./.compiled-core/capture/BrowserAudioRecorder.js");
const wav = require("./.compiled-core/export/WavPcmEncoder.js");
const offline = require("./.compiled-core/export/WebOfflineTimelineRenderer.js");
const recovery = require("./.compiled-core/recovery/CrashRecovery.js");
const factory = require("./.compiled-core/domain/projectFactory.js");

test("recording capability is honest and MIME negotiation falls back without a false claim", () => {
  const unavailable = capture.detectBrowserRecordingCapability({
    isSecureContext: true,
  });
  assert.equal(unavailable.state, "unavailable");
  assert.equal(unavailable.unavailableCode, "GET_USER_MEDIA_UNAVAILABLE");
  assert.equal(unavailable.permissionState, "not_requested");

  const selected = capture.negotiateMediaRecorderMimeType(
    (mimeType) => mimeType === "audio/ogg;codecs=opus",
    ["audio/webm;codecs=opus", "audio/ogg;codecs=opus"],
  );
  assert.equal(selected, "audio/ogg;codecs=opus");
  assert.equal(capture.negotiateMediaRecorderMimeType(undefined), null);
  assert.equal(capture.negotiateMediaRecorderMimeType(() => false), null);
});

test("browser recording imports its Blob and cleans every track and monitor", async () => {
  const stoppedTracks = [];
  const stream = {
    getTracks() {
      return [
        { stop: () => stoppedTracks.push("microphone") },
        { stop: () => stoppedTracks.push("auxiliary") },
      ];
    },
  };
  let monitorDisposed = false;
  let importedBlob = null;
  let recorderOptions = null;

  class FakeMediaRecorder {
    state = "inactive";
    mimeType = "audio/ogg;codecs=opus";
    ondataavailable = null;
    onstop = null;
    onerror = null;

    start() {
      this.state = "recording";
    }

    stop() {
      this.state = "inactive";
      this.ondataavailable?.({
        data: new Blob([new Uint8Array([1, 2, 3])], {
          type: "audio/ogg;codecs=opus",
        }),
      });
      this.onstop?.({ type: "stop" });
    }
  }

  const importAudioService = {
    async import(blob) {
      importedBlob = blob;
      return {
        asset: { id: "asset-recording", originalName: blob.name },
        waveform: [],
      };
    },
  };
  const recorder = new capture.BrowserAudioRecorder(importAudioService, {
    isSecureContext: true,
    getUserMedia: async () => stream,
    createMediaRecorder: (_stream, options) => {
      recorderOptions = options;
      return new FakeMediaRecorder();
    },
    isMimeTypeSupported: (mimeType) => mimeType === "audio/ogg;codecs=opus",
    createInputMonitor: async () => ({
      async dispose() {
        monitorDisposed = true;
      },
    }),
    now: () => new Date("2026-08-12T12:34:56.000Z"),
  });

  const session = await recorder.start({
    monitorInput: true,
    mimeTypePreferences: ["audio/webm", "audio/ogg;codecs=opus"],
  });
  const result = await session.stop();

  assert.deepEqual(recorderOptions, { mimeType: "audio/ogg;codecs=opus" });
  assert.deepEqual(stoppedTracks, ["microphone", "auxiliary"]);
  assert.equal(monitorDisposed, true);
  assert.equal(importedBlob.size, 3);
  assert.equal(importedBlob.type, "audio/ogg;codecs=opus");
  assert.match(importedBlob.name, /Poietek Recording .*\.ogg$/);
  assert.equal(result.importedAudio.asset.id, "asset-recording");
  assert.equal(result.monitoringWasEnabled, true);
});

test("cancelling a browser recording cleans resources and never imports", async () => {
  let stopped = false;
  let importCount = 0;
  const stream = { getTracks: () => [{ stop: () => (stopped = true) }] };

  class FakeMediaRecorder {
    state = "inactive";
    mimeType = "audio/webm";
    start() {
      this.state = "recording";
    }
    stop() {
      this.state = "inactive";
      this.onstop?.({ type: "stop" });
    }
  }

  const recorder = new capture.BrowserAudioRecorder(
    { async import() { importCount += 1; } },
    {
      isSecureContext: true,
      getUserMedia: async () => stream,
      createMediaRecorder: () => new FakeMediaRecorder(),
      isMimeTypeSupported: () => true,
    },
  );
  const session = await recorder.start();
  await session.cancel();

  assert.equal(stopped, true);
  assert.equal(importCount, 0);
  await assert.rejects(session.stop(), (error) => error.code === "CANCELLED");
});

test("recording setup failure still releases the acquired microphone stream", async () => {
  let stopped = false;
  let monitorDisposed = false;
  const recorder = new capture.BrowserAudioRecorder(
    { async import() { throw new Error("must not import"); } },
    {
      isSecureContext: true,
      getUserMedia: async () => ({
        getTracks: () => [{ stop: () => (stopped = true) }],
      }),
      createInputMonitor: async () => ({
        async dispose() {
          monitorDisposed = true;
        },
      }),
      createMediaRecorder: () => {
        throw new Error("recorder construction failed");
      },
      isMimeTypeSupported: () => true,
    },
  );

  await assert.rejects(
    recorder.start({ monitorInput: true }),
    (error) => error.code === "CAPTURE_FAILED",
  );
  assert.equal(stopped, true);
  assert.equal(monitorDisposed, true);
});

test("PCM WAV encoding writes an explicit RIFF header and reports clamped/non-finite samples", async () => {
  const progress = [];
  const result = await wav.encodeWavPcm16(
    {
      sampleRate: 48_000,
      channels: [new Float32Array([-1, 0, 1, 2, Number.NaN])],
    },
    {
      framesPerChunk: 2,
      yieldControl: async () => undefined,
      onProgress: (item) => progress.push(item),
    },
  );

  const bytes = new Uint8Array(await result.blob.arrayBuffer());
  const view = new DataView(bytes.buffer);
  const ascii = (offset, length) =>
    String.fromCharCode(...bytes.slice(offset, offset + length));

  assert.equal(ascii(0, 4), "RIFF");
  assert.equal(ascii(8, 4), "WAVE");
  assert.equal(ascii(12, 4), "fmt ");
  assert.equal(ascii(36, 4), "data");
  assert.equal(view.getUint16(20, true), 1);
  assert.equal(view.getUint16(22, true), 1);
  assert.equal(view.getUint32(24, true), 48_000);
  assert.equal(view.getUint16(34, true), 16);
  assert.equal(view.getInt16(44, true), -32_768);
  assert.equal(view.getInt16(46, true), 0);
  assert.equal(view.getInt16(48, true), 32_767);
  assert.equal(view.getInt16(50, true), 32_767);
  assert.equal(view.getInt16(52, true), 0);
  assert.equal(result.clippedSampleCount, 1);
  assert.equal(result.replacedNonFiniteSampleCount, 1);
  assert.equal(result.format.normalization, "none");
  assert.equal(result.format.dither, "none");
  assert.equal(progress.at(-1).phase, "complete");
  assert.equal(progress.at(-1).ratio, 1);
});

test("PCM WAV encoding honors cancellation before allocating output", async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    wav.encodeWavPcm16(
      { sampleRate: 48_000, channels: [new Float32Array(10)] },
      { signal: controller.signal },
    ),
    (error) => error.code === "WAV_ENCODING_CANCELLED",
  );
});

test("offline render reports an honest unavailable state without Web Audio", async () => {
  const renderer = new offline.WebOfflineTimelineRenderer(
    { async get() { return null; } },
    null,
  );
  const capability = renderer.getCapability();

  assert.equal(capability.state, "unavailable");
  assert.equal(capability.unavailableCode, "OFFLINE_AUDIO_CONTEXT_UNAVAILABLE");
  assert.equal(capability.cancellation.duringNativeRender, false);
  await assert.rejects(
    renderer.render(factory.createBlankProject("No Web Audio")),
    (error) => error.code === "OFFLINE_AUDIO_CONTEXT_UNAVAILABLE",
  );
});

test("crash recovery implements Recover, Skip, Discard, and recovered-unsaved labeling", async () => {
  const repository = new recovery.InMemoryCrashRecoverySnapshotRepository();
  const timestamps = [
    "2026-08-12T10:00:00.000Z",
    "2026-08-12T10:01:00.000Z",
    "2026-08-12T10:02:00.000Z",
    "2026-08-12T10:03:00.000Z",
    "2026-08-12T10:04:00.000Z",
  ];
  let id = 0;
  const coordinator = new recovery.CrashRecoveryCoordinator(repository, {
    now: () => new Date(timestamps.shift()),
    idFactory: () => `recovery-${++id}`,
    retainCheckpointCount: 2,
  });
  const project = factory.createBlankProject("Recover Me");

  const first = await coordinator.checkpoint(project, project.updatedAt);
  project.title = "Unsaved second state";
  const second = await coordinator.checkpoint(project, project.updatedAt);
  project.title = "Unsaved third state";
  const third = await coordinator.checkpoint(project, project.updatedAt);

  assert.equal(await repository.get(first.id), null);
  assert.deepEqual(
    (await repository.listForProject(project.id)).map((item) => item.id),
    [third.id, second.id],
  );

  const skipped = await coordinator.resolve(second.id, "skip");
  assert.equal(skipped.action, "skip");
  assert.notEqual(await repository.get(second.id), null);

  const recovered = await coordinator.resolve(third.id, "recover");
  assert.equal(recovered.label, recovery.RECOVERED_UNSAVED_LABEL);
  assert.equal(recovered.isUnsaved, true);
  assert.equal(recovered.project.title, "Unsaved third state");
  assert.deepEqual(
    recovery.readRecoveredUnsavedState(recovered.project),
    recovered.project.extensions.poietekRecovery,
  );
  assert.notEqual(await repository.get(third.id), null);

  await coordinator.markDurablySaved(third.id);
  assert.equal(await repository.get(third.id), null);

  const discarded = await coordinator.resolve(second.id, "discard");
  assert.equal(discarded.action, "discard");
  assert.equal(await repository.get(second.id), null);
});
