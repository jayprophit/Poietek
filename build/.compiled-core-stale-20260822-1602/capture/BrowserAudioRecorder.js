"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserAudioRecorder = exports.BrowserRecordingError = exports.DEFAULT_RECORDING_MIME_PREFERENCES = void 0;
exports.negotiateMediaRecorderMimeType = negotiateMediaRecorderMimeType;
exports.detectBrowserRecordingCapability = detectBrowserRecordingCapability;
exports.DEFAULT_RECORDING_MIME_PREFERENCES = [
    "audio/webm;codecs=opus",
    "audio/ogg;codecs=opus",
    "audio/mp4;codecs=mp4a.40.2",
    "audio/webm",
    "audio/ogg",
];
class BrowserRecordingError extends Error {
    code;
    constructor(code, message, options) {
        super(message, options);
        this.code = code;
        this.name = "BrowserRecordingError";
    }
}
exports.BrowserRecordingError = BrowserRecordingError;
function negotiateMediaRecorderMimeType(isMimeTypeSupported, preferences = exports.DEFAULT_RECORDING_MIME_PREFERENCES) {
    if (!isMimeTypeSupported)
        return null;
    for (const candidate of preferences) {
        const mimeType = candidate.trim();
        if (!mimeType)
            continue;
        try {
            if (isMimeTypeSupported(mimeType))
                return mimeType;
        }
        catch {
            // A browser MIME probe that throws is not evidence of support.
        }
    }
    // MediaRecorder may still select a valid browser default. Returning null is
    // intentional: it does not claim support for a format that was not probed.
    return null;
}
function detectBrowserRecordingCapability(dependencies = createBrowserRecordingDependencies(), mimeTypePreferences = exports.DEFAULT_RECORDING_MIME_PREFERENCES) {
    const supportedMimeTypes = dependencies.isMimeTypeSupported
        ? mimeTypePreferences.filter((mimeType) => {
            try {
                return Boolean(mimeType.trim()) && dependencies.isMimeTypeSupported(mimeType);
            }
            catch {
                return false;
            }
        })
        : [];
    if (dependencies.isSecureContext === false) {
        return unavailableCapability("INSECURE_CONTEXT", "Microphone capture requires a secure browser context.", supportedMimeTypes, Boolean(dependencies.createInputMonitor));
    }
    if (!dependencies.getUserMedia) {
        return unavailableCapability("GET_USER_MEDIA_UNAVAILABLE", "Browser microphone capture is unavailable on this platform.", supportedMimeTypes, Boolean(dependencies.createInputMonitor));
    }
    if (!dependencies.createMediaRecorder) {
        return unavailableCapability("MEDIA_RECORDER_UNAVAILABLE", "The browser MediaRecorder API is unavailable on this platform.", supportedMimeTypes, Boolean(dependencies.createInputMonitor));
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
class BrowserAudioRecorder {
    importAudioService;
    dependencies;
    constructor(importAudioService, dependencies = createBrowserRecordingDependencies()) {
        this.importAudioService = importAudioService;
        this.dependencies = dependencies;
    }
    getCapability(mimeTypePreferences = exports.DEFAULT_RECORDING_MIME_PREFERENCES) {
        return detectBrowserRecordingCapability(this.dependencies, mimeTypePreferences);
    }
    async start(options = {}) {
        const capability = this.getCapability(options.mimeTypePreferences);
        if (capability.state === "unavailable") {
            throw new BrowserRecordingError(capability.unavailableCode, capability.reason);
        }
        if (options.monitorInput && !this.dependencies.createInputMonitor) {
            throw new BrowserRecordingError("INPUT_MONITORING_UNAVAILABLE", "Input monitoring was requested, but Web Audio monitoring is unavailable.");
        }
        if (options.audioBitsPerSecond !== undefined &&
            (!Number.isInteger(options.audioBitsPerSecond) || options.audioBitsPerSecond <= 0)) {
            throw new RangeError("audioBitsPerSecond must be a positive integer.");
        }
        if (options.timesliceMilliseconds !== undefined &&
            (!Number.isInteger(options.timesliceMilliseconds) ||
                options.timesliceMilliseconds <= 0)) {
            throw new RangeError("timesliceMilliseconds must be a positive integer.");
        }
        const getUserMedia = this.dependencies.getUserMedia;
        let stream;
        try {
            stream = await getUserMedia({
                audio: options.audioConstraints ?? true,
                video: false,
            });
        }
        catch (cause) {
            throw new BrowserRecordingError("CAPTURE_FAILED", "Microphone permission was denied or the requested input device could not be opened.", { cause });
        }
        let monitor = null;
        let recorder = null;
        let cleanupPromise = null;
        const cleanup = () => {
            if (cleanupPromise)
                return cleanupPromise;
            cleanupPromise = (async () => {
                for (const track of stream.getTracks()) {
                    try {
                        track.stop();
                    }
                    catch {
                        // Track cleanup is best-effort per track; continue through all tracks.
                    }
                }
                await monitor?.dispose().catch(() => undefined);
            })();
            return cleanupPromise;
        };
        try {
            if (options.monitorInput) {
                monitor = await this.dependencies.createInputMonitor(stream);
            }
            const selectedMimeType = negotiateMediaRecorderMimeType(this.dependencies.isMimeTypeSupported, options.mimeTypePreferences);
            const recorderOptions = {};
            if (selectedMimeType)
                recorderOptions.mimeType = selectedMimeType;
            if (options.audioBitsPerSecond !== undefined) {
                recorderOptions.audioBitsPerSecond = options.audioBitsPerSecond;
            }
            recorder = this.dependencies.createMediaRecorder(stream, Object.keys(recorderOptions).length ? recorderOptions : undefined);
            const active = new BrowserRecordingSession({
                recorder,
                streamCleanup: cleanup,
                importAudioService: this.importAudioService,
                fileName: options.fileName ??
                    defaultRecordingFileName(recorder.mimeType || selectedMimeType, (this.dependencies.now ?? (() => new Date()))()),
                selectedMimeType,
                monitoringWasEnabled: Boolean(options.monitorInput),
            });
            active.begin(options.timesliceMilliseconds);
            return active;
        }
        catch (cause) {
            await cleanup();
            if (cause instanceof BrowserRecordingError || cause instanceof RangeError) {
                throw cause;
            }
            throw new BrowserRecordingError("CAPTURE_FAILED", "The browser could not start the audio recorder.", { cause });
        }
    }
}
exports.BrowserAudioRecorder = BrowserAudioRecorder;
class BrowserRecordingSession {
    input;
    chunks = [];
    completion;
    resolveCompletion;
    rejectCompletion;
    stopPromise = null;
    cancelled = false;
    settled = false;
    mimeType;
    monitoringIsEnabled;
    constructor(input) {
        this.input = input;
        this.mimeType = input.recorder.mimeType || input.selectedMimeType;
        this.monitoringIsEnabled = input.monitoringWasEnabled;
        this.completion = new Promise((resolve, reject) => {
            this.resolveCompletion = resolve;
            this.rejectCompletion = reject;
        });
        input.recorder.ondataavailable = (event) => {
            if (event.data.size > 0)
                this.chunks.push(event.data);
        };
        input.recorder.onstop = () => {
            void this.finishCapture();
        };
        input.recorder.onerror = (event) => {
            const recorderError = event.error;
            void this.failCapture(new BrowserRecordingError("CAPTURE_FAILED", recorderError?.message || "The browser audio recorder failed.", recorderError ? { cause: recorderError } : undefined));
        };
    }
    begin(timesliceMilliseconds) {
        try {
            this.input.recorder.start(timesliceMilliseconds);
        }
        catch (error) {
            // start() failures are handled by BrowserAudioRecorder.start(), which
            // owns cleanup until this session has been returned to the caller.
            throw error;
        }
    }
    stop() {
        if (this.cancelled) {
            return Promise.reject(new BrowserRecordingError("CANCELLED", "The recording was discarded."));
        }
        if (this.stopPromise)
            return this.stopPromise;
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
    async cancel() {
        this.cancelled = true;
        this.requestRecorderStop();
        await this.completion.then(() => undefined);
    }
    requestRecorderStop() {
        if (this.input.recorder.state === "inactive")
            return;
        try {
            this.input.recorder.stop();
        }
        catch (error) {
            void this.failCapture(error);
        }
    }
    async finishCapture() {
        if (this.settled)
            return;
        this.settled = true;
        try {
            await this.input.streamCleanup();
            const mimeType = this.input.recorder.mimeType ||
                this.input.selectedMimeType ||
                this.chunks.find((chunk) => chunk.type)?.type ||
                "application/octet-stream";
            this.resolveCompletion(new Blob(this.chunks, { type: mimeType }));
        }
        catch (error) {
            this.rejectCompletion(error);
        }
    }
    async failCapture(error) {
        if (this.settled)
            return;
        this.settled = true;
        await this.input.streamCleanup();
        this.rejectCompletion(error);
    }
}
function unavailableCapability(unavailableCode, reason, supportedMimeTypes, inputMonitoringAvailable) {
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
function defaultRecordingFileName(mimeType, now) {
    const extension = mimeType?.includes("ogg")
        ? "ogg"
        : mimeType?.includes("mp4")
            ? "m4a"
            : mimeType?.includes("webm")
                ? "webm"
                : "audio";
    return `Poietek Recording ${now.toISOString().replace(/[:.]/g, "-")}.${extension}`;
}
function nameBlob(blob, fileName) {
    if (typeof File !== "undefined") {
        return new File([blob], fileName, { type: blob.type });
    }
    const namedBlob = blob;
    Object.defineProperty(namedBlob, "name", {
        configurable: true,
        enumerable: true,
        value: fileName,
    });
    return namedBlob;
}
function createBrowserRecordingDependencies() {
    const mediaDevices = typeof navigator !== "undefined" ? navigator.mediaDevices : undefined;
    const RecorderConstructor = typeof MediaRecorder !== "undefined" ? MediaRecorder : undefined;
    const AudioContextConstructor = typeof AudioContext !== "undefined" ? AudioContext : undefined;
    return {
        isSecureContext: typeof globalThis.isSecureContext === "boolean"
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
                if (context.state === "suspended")
                    await context.resume();
                return {
                    async dispose() {
                        try {
                            source.disconnect();
                        }
                        catch { }
                        await context.close().catch(() => undefined);
                    },
                };
            }
            : undefined,
        now: () => new Date(),
    };
}
