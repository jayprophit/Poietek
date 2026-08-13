export interface BenchmarkMetric {
  state: "measured" | "unavailable" | "failed";
  value: number | null;
  unit: string;
  detail: string;
}

export interface StudioBenchmarkMetrics {
  [key: string]: BenchmarkMetric;
  dspRealtimeFactor: BenchmarkMetric;
  schedulerJitterMs: BenchmarkMetric;
  offlineRenderFactor: BenchmarkMetric;
  storageMegabytesPerSecond: BenchmarkMetric;
}

export interface StudioBenchmarkCapabilities {
  webAudio: boolean;
  offlineAudio: boolean;
  indexedDb: boolean;
  opfs: boolean;
  audioInputEnumeration: boolean;
  midi: boolean;
  nativePluginHost: false;
}

export interface StudioBenchmarkResult {
  schemaVersion: "1.0.0";
  measuredAt: string;
  durationMs: number;
  score: number;
  stars: 1 | 2 | 3 | 4 | 5;
  interpretation: string;
  metrics: StudioBenchmarkMetrics;
  capabilities: StudioBenchmarkCapabilities;
  notes: string[];
}

function metricScore(metric: BenchmarkMetric, thresholds: readonly [number, number, number, number], higherIsBetter: boolean): number {
  if (metric.state !== "measured" || metric.value == null || !Number.isFinite(metric.value)) return 0;
  const [one, two, three, four] = thresholds;
  const value = higherIsBetter ? metric.value : -metric.value;
  const normalized = higherIsBetter ? [one, two, three, four] : [-one, -two, -three, -four];
  if (value >= normalized[3]) return 100;
  if (value >= normalized[2]) return 80;
  if (value >= normalized[1]) return 60;
  if (value >= normalized[0]) return 40;
  return 20;
}

export function scoreStudioBenchmark(metrics: StudioBenchmarkMetrics): Pick<StudioBenchmarkResult, "score" | "stars" | "interpretation"> {
  const components = [
    metricScore(metrics.dspRealtimeFactor, [2, 5, 10, 20], true),
    metricScore(metrics.schedulerJitterMs, [20, 12, 7, 3], false),
    metricScore(metrics.offlineRenderFactor, [1, 3, 8, 16], true),
    metricScore(metrics.storageMegabytesPerSecond, [1, 5, 15, 40], true),
  ];
  const measured = components.filter((score) => score > 0);
  const score = measured.length === 0 ? 0 : Math.round(measured.reduce((sum, value) => sum + value, 0) / measured.length);
  const stars = Math.max(1, Math.min(5, Math.ceil(score / 20))) as 1 | 2 | 3 | 4 | 5;
  const interpretation = score >= 90
    ? "Excellent headroom in this browser benchmark. Real project performance still depends on devices and plug-ins."
    : score >= 70
      ? "Strong general-purpose performance for recording and medium-to-large sessions."
      : score >= 50
        ? "Suitable for editing and moderate sessions; use larger buffers for dense projects."
        : score > 0
          ? "Conservative settings are recommended; freeze or render complex processing."
          : "No comparable performance metrics were available on this platform.";
  return { score, stars, interpretation };
}

function now(): number {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}

async function runDspBenchmark(): Promise<BenchmarkMetric> {
  const frames = 48000 * 4;
  const started = now();
  let low = 0;
  let band = 0;
  let checksum = 0;
  for (let index = 0; index < frames; index += 1) {
    const input = Math.sin(index * 0.0137) * 0.7 + Math.sin(index * 0.0031) * 0.2;
    low += 0.035 * (input - low);
    band += 0.11 * (input - band);
    const compressed = Math.tanh((low * 0.55 + band * 0.45) * 1.8);
    checksum += compressed * 0.000001;
  }
  const elapsedSeconds = Math.max(0.000001, (now() - started) / 1000);
  const factor = 4 / elapsedSeconds;
  return { state: "measured", value: Number(factor.toFixed(2)), unit: "× real time", detail: `Deterministic filter/dynamics loop; checksum ${checksum.toFixed(4)}.` };
}

async function runSchedulerBenchmark(): Promise<BenchmarkMetric> {
  const intervalMs = 10;
  const samples: number[] = [];
  let previous = now();
  for (let index = 0; index < 12; index += 1) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    const current = now();
    samples.push(Math.abs(current - previous - intervalMs));
    previous = current;
  }
  const average = samples.reduce((sum, value) => sum + value, 0) / samples.length;
  return { state: "measured", value: Number(average.toFixed(2)), unit: "ms average jitter", detail: "UI-thread timer test; not an audio-interface round-trip measurement." };
}

async function runOfflineAudioBenchmark(): Promise<BenchmarkMetric> {
  if (typeof OfflineAudioContext === "undefined") {
    return { state: "unavailable", value: null, unit: "× real time", detail: "OfflineAudioContext is unavailable." };
  }
  try {
    const seconds = 2;
    const context = new OfflineAudioContext(2, 48000 * seconds, 48000);
    const oscillator = context.createOscillator();
    const filter = context.createBiquadFilter();
    const compressor = context.createDynamicsCompressor();
    oscillator.frequency.value = 220;
    filter.type = "lowpass";
    filter.frequency.value = 2400;
    oscillator.connect(filter).connect(compressor).connect(context.destination);
    oscillator.start();
    const started = now();
    await context.startRendering();
    const elapsedSeconds = Math.max(0.000001, (now() - started) / 1000);
    return { state: "measured", value: Number((seconds / elapsedSeconds).toFixed(2)), unit: "× real time", detail: "Two-channel oscillator, filter, and dynamics render." };
  } catch (error) {
    return { state: "failed", value: null, unit: "× real time", detail: error instanceof Error ? error.message : String(error) };
  }
}

async function runIndexedDbBenchmark(): Promise<BenchmarkMetric> {
  if (typeof indexedDB === "undefined") {
    return { state: "unavailable", value: null, unit: "MB/s", detail: "IndexedDB is unavailable." };
  }
  const databaseName = `poietek-benchmark-${Date.now().toString(36)}`;
  try {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(databaseName, 1);
      request.onupgradeneeded = () => request.result.createObjectStore("payloads");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("Benchmark database could not open."));
    });
    const megabytes = 2;
    const payload = new Uint8Array(megabytes * 1024 * 1024);
    for (let index = 0; index < payload.length; index += 4096) payload[index] = index % 251;
    const started = now();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction("payloads", "readwrite");
      transaction.objectStore("payloads").put(payload, "test");
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Benchmark write failed."));
    });
    await new Promise<void>((resolve, reject) => {
      const request = database.transaction("payloads", "readonly").objectStore("payloads").get("test");
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error("Benchmark read failed."));
    });
    const elapsedSeconds = Math.max(0.000001, (now() - started) / 1000);
    database.close();
    indexedDB.deleteDatabase(databaseName);
    return { state: "measured", value: Number(((megabytes * 2) / elapsedSeconds).toFixed(2)), unit: "MB/s", detail: "Temporary 2 MB IndexedDB write and read; test database removed afterwards." };
  } catch (error) {
    indexedDB.deleteDatabase(databaseName);
    return { state: "failed", value: null, unit: "MB/s", detail: error instanceof Error ? error.message : String(error) };
  }
}

export async function runStudioBenchmark(): Promise<StudioBenchmarkResult> {
  const started = now();
  const [dspRealtimeFactor, schedulerJitterMs, offlineRenderFactor, storageMegabytesPerSecond] = await Promise.all([
    runDspBenchmark(),
    runSchedulerBenchmark(),
    runOfflineAudioBenchmark(),
    runIndexedDbBenchmark(),
  ]);
  const metrics = { dspRealtimeFactor, schedulerJitterMs, offlineRenderFactor, storageMegabytesPerSecond };
  const rating = scoreStudioBenchmark(metrics);
  const navigatorValue = typeof navigator === "undefined" ? null : navigator;
  return {
    schemaVersion: "1.0.0",
    measuredAt: new Date().toISOString(),
    durationMs: Math.round(now() - started),
    ...rating,
    metrics,
    capabilities: {
      webAudio: typeof AudioContext !== "undefined",
      offlineAudio: typeof OfflineAudioContext !== "undefined",
      indexedDb: typeof indexedDB !== "undefined",
      opfs: Boolean(navigatorValue?.storage?.getDirectory),
      audioInputEnumeration: Boolean(navigatorValue?.mediaDevices?.enumerateDevices),
      midi: Boolean(navigatorValue && "requestMIDIAccess" in navigatorValue),
      nativePluginHost: false,
    },
    notes: [
      "Scores compare browser execution paths, not other commercial applications.",
      "No microphone loopback, driver latency, clock lock, LUFS, or true-peak claim is made.",
      "Repeat the benchmark after changing power mode, buffer policy, or browser tabs.",
    ],
  };
}
