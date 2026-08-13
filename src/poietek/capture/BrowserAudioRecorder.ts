import type {
  ImportedAudio,
  ImportAudioService,
} from "../assets/ImportAudioService";

export const DEFAULT_RECORDING_MIME_PREFERENCES = [
  "audio/webm;codecs=opus",
  "audio/ogg;codecs=opus",
  "audio/mp4;codecs=mp4a.40.2",
  "audio/webm",
  "audio/ogg",
] as const;

export type BrowserRecordingUnavailableCode =
  | "INSECURE_CONTEXT"
  | "GET_USER_MEDIA_UNAVAILABLE"
  | "MEDIA_RECORDER_UNAVAILABLE"
  | "INPUT_MONITORING_UNAVAILABLE";

export interface BrowserRecordingCapability {
  state: "available" | "unavailable";
  permissionState: "not_requested";
  supportedMimeTypes: string[];
  usesBrowserDefaultMimeWhenNeeded: boolean;
  inputMonitoringAvailable: boolean;
  unavailableCode: BrowserRecordingUnavailableCode | null;
  reason: string | null;
}

export interface InputMonitor {
  dispose(): Promise<void>;
}

export interface BrowserRecordingDependencies {
  isSecureContext?: boolean;
  getUserMedia?: (constraints: MediaStreamConstraints) => Promise<MediaStream>;
  createMediaRecorder?: (
    stream: MediaStream,
    options?: MediaRecorderOptions,
  ) => MediaRecorder;
  isMimeTypeSupported?: (mimeType: string) => boolean;
  createInputMonitor?: (stream: MediaStream) => Promise<InputMonitor>;
  now?: () => Date;
}

export interface StartBrowserRecordingOptions {
  audioConstraints?: boolean | MediaTrackConstraints;
  monitorInput?: boolean;
  mimeTypePreferences?: readonly string[];
  audioBitsPerSecond?: number;
  timesliceMilliseconds?: number;
  fileName?: string;
}

export interface BrowserRecordingResult {
  importedAudio: ImportedAudio;
  recordedBlob: Blob & { name?: string };
  mimeType: string;
  fileName: string;
  monitoringWasEnabled: boolean;
}

export interface ActiveBrowserRecording {
  readonly mimeType: string | null;
  readonly monitoringIsEnabled: boolean;
  stop(): Promise<BrowserRecordingResult>;
  cancel(): Promise<void>;
}

export class BrowserRecordingError extends Error {
  constructor(
    readonly code: BrowserRecordingUnavailableCode | "CAPTURE_FAILED" | "CANCELLED",
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "BrowserRecordingError";
  }
}

export function negotiateMediaRecorderMimeType(
  isMimeTypeSupported: ((mimeType: string) => boolean) | undefined,
  preferences: readonly string[] = DEFAULT_RECORDING_MIME_PREFERENCES,
): string | null {
  if (!isMimeTypeSupported) return null;

  for (const candidate of preferences) {
    const mimeType = candidate.trim();
    if (!mimeType) continue;
    try {
      if (isMimeTypeSupported(mimeType)) return mimeType;
    } catch {
      // A browser MIME probe that throws is not evidence of support.
    }
  }

  // MediaRecorder may still select a valid browser default. Returning null is
  // intentional: it does not claim support for a format that was not probed.
  return null;
}

export function detectBrowserRecordingCapability(
  dependencies: BrowserRecordingDependencies = createBrowserRecordingDependencies(),
  mimeTypePreferences: readonly string[] = DEFAULT_RECORDING_MIME_PREFERENCES,
): BrowserRecordingCapability {
  const supportedMimeTypes = dependencies.isMimeTypeSupported
    ? mimeTypePreferences.filter((mimeType) => {
        try {
          return Boolean(mimeType.trim()) && dependencies.isMimeTypeSupported!(mimeType);
        } catch {
          return false;
        }
      })
    : [];

  if (dependencies.isSecureContext === false) {
    return unavailableCapability(
      "INSECURE_CONTEXT",
      "Microphone capture requires a secure browser context.",
      supportedMimeTypes,
      Boolean(dependencies.createInputMonitor),
    );
  }
  if (!dependencies.getUserMedia) {
    return unavailableCapability(
      "GET_USER_MEDIA_UNAVAILABLE",
      "Browser microphone capture is unavailable on this platform.",
      supportedMimeTypes,
      Boolean(dependencies.createInputMonitor),
    );
  }
  if (!dependencies.createMediaRecorder) {
    return unavailableCapability(
      "MEDIA_RECORDER_UNAVAILABLE",
      "The browser MediaRecorder API is unavailable on this platform.",
      supportedMimeTypes,
      Boolean(dependencies.createInputMonitor),
    );
  }

  return {
    state: "available",
    permissionState: "not_requested",
    supportedMimeTypes,
    usesBrowserDefaultMimeWhenNeeded: true,
    inputMonitoringAvailable: Boolean(dependencies.createInputMonitor),
    unavailableCode: null,
    reason: null,
  };
}

export class BrowserAudioRecorder {
  constructor(
    private readonly importAudioService: ImportAudioService,
    private readonly dependencies: BrowserRecordingDependencies =
      createBrowserRecordingDependencies(),
  ) {}

  getCapability(
    mimeTypePreferences: readonly string[] = DEFAULT_RECORDING_MIME_PREFERENCES,
  ): BrowserRecordingCapability {
    return detectBrowserRecordingCapability(this.dependencies, mimeTypePreferences);
  }

  async start(
    options: StartBrowserRecordingOptions = {},
  ): Promise<ActiveBrowserRecording> {
    const capability = this.getCapability(options.mimeTypePreferences);
    if (capability.state === "unavailable") {
      throw new BrowserRecordingError(
        capability.unavailableCode!,
        capability.reason!,
      );
    }
    if (options.monitorInput && !this.dependencies.createInputMonitor) {
      throw new BrowserRecordingError(
        "INPUT_MONITORING_UNAVAILABLE",
        "Input monitoring was requested, but Web Audio monitoring is unavailable.",
      );
    }
    if (
      options.audioBitsPerSecond !== undefined &&
      (!Number.isInteger(options.audioBitsPerSecond) || options.audioBitsPerSecond <= 0)
    ) {
      throw new RangeError("audioBitsPerSecond must be a positive integer.");
    }
    if (
      options.timesliceMilliseconds !== undefined &&
      (!Number.isInteger(options.timesliceMilliseconds) ||
        options.timesliceMilliseconds <= 0)
    ) {
      throw new RangeError("timesliceMilliseconds must be a positive integer.");
    }

    const getUserMedia = this.dependencies.getUserMedia!;
    let stream: MediaStream;
    try {
      stream = await getUserMedia({
        audio: options.audioConstraints ?? true,
        video: false,
      });
    } catch (cause) {
      throw new BrowserRecordingError(
        "CAPTURE_FAILED",
        "Microphone permission was denied or the requested input device could not be opened.",
        { cause },
      );
    }

    let monitor: InputMonitor | null = null;
    let recorder: MediaRecorder | null = null;
    let cleanupPromise: Promise<void> | null = null;
    const cleanup = (): Promise<void> => {
      if (cleanupPromise) return cleanupPromise;
      cleanupPromise = (async () => {
        for (const track of stream.getTracks()) {
          try {
            track.stop();
          } catch {
            // Track cleanup is best-effort per track; continue through all tracks.
          }
        }
        await monitor?.dispose().catch(() => undefined);
      })();
      return cleanupPromise;
    };

    try {
      if (options.monitorInput) {
        monitor = await this.dependencies.createInputMonitor!(stream);
      }

      const selectedMimeType = negotiateMediaRecorderMimeType(
        this.dependencies.isMimeTypeSupported,
        options.mimeTypePreferences,
      );
      const recorderOptions: MediaRecorderOptions = {};
      if (selectedMimeType) recorderOptions.mimeType = selectedMimeType;
      if (options.audioBitsPerSecond !== undefined) {
        recorderOptions.audioBitsPerSecond = options.audioBitsPerSecond;
      }

      recorder = this.dependencies.createMediaRecorder!(
        stream,
        Object.keys(recorderOptions).length ? recorderOptions : undefined,
      );

      const active = new BrowserRecordingSession({
        recorder,
        streamCleanup: cleanup,
        importAudioService: this.importAudioService,
        fileName:
          options.fileName ??
          defaultRecordingFileName(
            recorder.mimeType || selectedMimeType,
            (this.dependencies.now ?? (() => new Date()))(),
          ),
        selectedMimeType,
        monitoringWasEnabled: Boolean(options.monitorInput),
      });
      active.begin(options.timesliceMilliseconds);
      return active;
    } catch (cause) {
      await cleanup();
      if (cause instanceof BrowserRecordingError || cause instanceof RangeError) {
        throw cause;
      }
      throw new BrowserRecordingError(
        "CAPTURE_FAILED",
        "The browser could not start the audio recorder.",
        { cause },
      );
    }
  }
}

interface BrowserRecordingSessionInput {
  recorder: MediaRecorder;
  streamCleanup: () => Promise<void>;
  importAudioService: ImportAudioService;
  fileName: string;
  selectedMimeType: string | null;
  monitoringWasEnabled: boolean;
}

class BrowserRecordingSession implements ActiveBrowserRecording {
  private readonly chunks: Blob[] = [];
  private readonly completion: Promise<Blob>;
  private resolveCompletion!: (blob: Blob) => void;
  private rejectCompletion!: (error: unknown) => void;
  private stopPromise: Promise<BrowserRecordingResult> | null = null;
  private cancelled = false;
  private settled = false;

  readonly mimeType: string | null;
  readonly monitoringIsEnabled: boolean;

  constructor(private readonly input: BrowserRecordingSessionInput) {
    this.mimeType = input.recorder.mimeType || input.selectedMimeType;
    this.monitoringIsEnabled = input.monitoringWasEnabled;
    this.completion = new Promise<Blob>((resolve, reject) => {
      this.resolveCompletion = resolve;
      this.rejectCompletion = reject;
    });

    input.recorder.ondataavailable = (event: BlobEvent) => {
      if (event.data.size > 0) this.chunks.push(event.data);
    };
    input.recorder.onstop = () => {
      void this.finishCapture();
    };
    input.recorder.onerror = (event: Event) => {
      const recorderError = (event as Event & { error?: DOMException }).error;
      void this.failCapture(
        new BrowserRecordingError(
          "CAPTURE_FAILED",
          recorderError?.message || "The browser audio recorder failed.",
          recorderError ? { cause: recorderError } : undefined,
        ),
      );
    };
  }

  begin(timesliceMilliseconds?: number): void {
    try {
      this.input.recorder.start(timesliceMilliseconds);
    } catch (error) {
      // start() failures are handled by BrowserAudioRecorder.start(), which
      // owns cleanup until this session has been returned to the caller.
      throw error;
    }
  }

  stop(): Promise<BrowserRecordingResult> {
    if (this.cancelled) {
      return Promise.reject(
        new BrowserRecordingError("CANCELLED", "The recording was discarded."),
      );
    }
    if (this.stopPromise) return this.stopPromise;

    this.requestRecorderStop();
    this.stopPromise = this.completion.then(async (blob) => {
      if (this.cancelled) {
        throw new BrowserRecordingError("CANCELLED", "The recording was discarded.");
      }
      const namedBlob = nameBlob(blob, this.input.fileName);
      const importedAudio = await this.input.importAudioService.import(namedBlob);
      return {
        importedAudio,
        recordedBlob: namedBlob,
        mimeType: namedBlob.type,
        fileName: this.input.fileName,
        monitoringWasEnabled: this.input.monitoringWasEnabled,
      };
    });
    return this.stopPromise;
  }

  async cancel(): Promise<void> {
    this.cancelled = true;
    this.requestRecorderStop();
    await this.completion.then(() => undefined);
  }

  private requestRecorderStop(): void {
    if (this.input.recorder.state === "inactive") return;
    try {
      this.input.recorder.stop();
    } catch (error) {
      void this.failCapture(error);
    }
  }

  private async finishCapture(): Promise<void> {
    if (this.settled) return;
    this.settled = true;
    try {
      await this.input.streamCleanup();
      const mimeType =
        this.input.recorder.mimeType ||
        this.input.selectedMimeType ||
        this.chunks.find((chunk) => chunk.type)?.type ||
        "application/octet-stream";
      this.resolveCompletion(new Blob(this.chunks, { type: mimeType }));
    } catch (error) {
      this.rejectCompletion(error);
    }
  }

  private async failCapture(error: unknown): Promise<void> {
    if (this.settled) return;
    this.settled = true;
    await this.input.streamCleanup();
    this.rejectCompletion(error);
  }
}

function unavailableCapability(
  unavailableCode: BrowserRecordingUnavailableCode,
  reason: string,
  supportedMimeTypes: string[],
  inputMonitoringAvailable: boolean,
): BrowserRecordingCapability {
  return {
    state: "unavailable",
    permissionState: "not_requested",
    supportedMimeTypes,
    usesBrowserDefaultMimeWhenNeeded: true,
    inputMonitoringAvailable,
    unavailableCode,
    reason,
  };
}

function defaultRecordingFileName(mimeType: string | null, now: Date): string {
  const extension = mimeType?.includes("ogg")
    ? "ogg"
    : mimeType?.includes("mp4")
      ? "m4a"
      : mimeType?.includes("webm")
        ? "webm"
        : "audio";
  return `Poietek Recording ${now.toISOString().replace(/[:.]/g, "-")}.${extension}`;
}

function nameBlob(blob: Blob, fileName: string): Blob & { name?: string } {
  if (typeof File !== "undefined") {
    return new File([blob], fileName, { type: blob.type }) as Blob & {
      name?: string;
    };
  }
  const namedBlob = blob as Blob & { name?: string };
  Object.defineProperty(namedBlob, "name", {
    configurable: true,
    enumerable: true,
    value: fileName,
  });
  return namedBlob;
}

function createBrowserRecordingDependencies(): BrowserRecordingDependencies {
  const mediaDevices =
    typeof navigator !== "undefined" ? navigator.mediaDevices : undefined;
  const RecorderConstructor =
    typeof MediaRecorder !== "undefined" ? MediaRecorder : undefined;
  const AudioContextConstructor =
    typeof AudioContext !== "undefined" ? AudioContext : undefined;

  return {
    isSecureContext:
      typeof globalThis.isSecureContext === "boolean"
        ? globalThis.isSecureContext
        : undefined,
    getUserMedia: mediaDevices?.getUserMedia
      ? (constraints) => mediaDevices.getUserMedia(constraints)
      : undefined,
    createMediaRecorder: RecorderConstructor
      ? (stream, options) => new RecorderConstructor(stream, options)
      : undefined,
    isMimeTypeSupported: RecorderConstructor?.isTypeSupported
      ? (mimeType) => RecorderConstructor.isTypeSupported(mimeType)
      : undefined,
    createInputMonitor: AudioContextConstructor
      ? async (stream) => {
          const context = new AudioContextConstructor({ latencyHint: "interactive" });
          const source = context.createMediaStreamSource(stream);
          source.connect(context.destination);
          if (context.state === "suspended") await context.resume();
          return {
            async dispose() {
              try {
                source.disconnect();
              } catch {}
              await context.close().catch(() => undefined);
            },
          };
        }
      : undefined,
    now: () => new Date(),
  };
}
