import type { AssetStore } from "../assets/AssetStore";
import type { AudioClip, PoietekProject } from "../domain/types";
import { validateProject } from "../domain/validate";
import { ticksToSeconds } from "../timeline/tempo";

export type OfflineTimelineRenderUnavailableCode =
  | "OFFLINE_AUDIO_CONTEXT_UNAVAILABLE"
  | "EMPTY_TIMELINE"
  | "RENDER_CANCELLED";

export interface OfflineTimelineRenderCapability {
  state: "available" | "unavailable";
  unavailableCode: "OFFLINE_AUDIO_CONTEXT_UNAVAILABLE" | null;
  reason: string | null;
  cancellation: {
    beforeNativeRender: true;
    duringNativeRender: false;
    note: string;
  };
  renderScope: "canonical_audio_clips_and_track_mixer_only";
}

export interface OfflineTimelineRenderProgress {
  phase: "preparing" | "decoding" | "rendering" | "complete";
  completedItems: number | null;
  totalItems: number | null;
  ratio: number | null;
}

export interface OfflineTimelineRenderOptions {
  sampleRate?: number;
  channelCount?: 1 | 2;
  tailSeconds?: number;
  signal?: AbortSignal;
  onProgress?: (progress: OfflineTimelineRenderProgress) => void;
}

export interface OfflineTimelineRenderResult {
  audioBuffer: AudioBuffer;
  sampleRate: number;
  channelCount: number;
  frameCount: number;
  durationSeconds: number;
  renderScope: "canonical_audio_clips_and_track_mixer_only";
  limitations: string[];
}

export class OfflineTimelineRenderError extends Error {
  constructor(
    readonly code: OfflineTimelineRenderUnavailableCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "OfflineTimelineRenderError";
  }
}

export type OfflineAudioContextFactory = (
  channelCount: number,
  frameCount: number,
  sampleRate: number,
) => OfflineAudioContext;

interface PlayableClip {
  clip: AudioClip;
  clipStartSeconds: number;
  timelineDurationSeconds: number;
  combinedGainDb: number;
  combinedPan: number;
}

export class WebOfflineTimelineRenderer {
  constructor(
    private readonly assetStore: AssetStore,
    private readonly contextFactory: OfflineAudioContextFactory | null =
      defaultOfflineAudioContextFactory(),
  ) {}

  getCapability(): OfflineTimelineRenderCapability {
    if (!this.contextFactory) {
      return {
        state: "unavailable",
        unavailableCode: "OFFLINE_AUDIO_CONTEXT_UNAVAILABLE",
        reason: "OfflineAudioContext is unavailable on this platform.",
        cancellation: cancellationCapability(),
        renderScope: "canonical_audio_clips_and_track_mixer_only",
      };
    }
    return {
      state: "available",
      unavailableCode: null,
      reason: null,
      cancellation: cancellationCapability(),
      renderScope: "canonical_audio_clips_and_track_mixer_only",
    };
  }

  async render(
    project: PoietekProject,
    options: OfflineTimelineRenderOptions = {},
  ): Promise<OfflineTimelineRenderResult> {
    const capability = this.getCapability();
    if (capability.state === "unavailable") {
      throw new OfflineTimelineRenderError(
        capability.unavailableCode!,
        capability.reason!,
      );
    }

    const validationIssues = validateProject(project);
    if (validationIssues.length) {
      throw new Error(
        `Cannot render an invalid project: ${validationIssues.join(" | ")}`,
      );
    }

    const sampleRate = options.sampleRate ?? project.settings.sampleRate;
    const channelCount = options.channelCount ?? 2;
    const tailSeconds = options.tailSeconds ?? 0;
    if (!Number.isInteger(sampleRate) || sampleRate < 8_000 || sampleRate > 192_000) {
      throw new RangeError("Offline render sampleRate must be an integer from 8000 to 192000 Hz.");
    }
    if (channelCount !== 1 && channelCount !== 2) {
      throw new RangeError("Offline render channelCount must be 1 or 2.");
    }
    if (!Number.isFinite(tailSeconds) || tailSeconds < 0 || tailSeconds > 60) {
      throw new RangeError("Offline render tailSeconds must be between 0 and 60.");
    }

    throwIfRenderCancelled(options.signal);
    options.onProgress?.({
      phase: "preparing",
      completedItems: 0,
      totalItems: null,
      ratio: null,
    });

    const playable = collectPlayableClips(project);
    if (!playable.length) {
      throw new OfflineTimelineRenderError(
        "EMPTY_TIMELINE",
        "The project contains no audible audio clips to render.",
      );
    }

    const timelineEndSeconds = Math.max(
      ...playable.map((item) => item.clipStartSeconds + item.timelineDurationSeconds),
    );
    const renderDurationSeconds = timelineEndSeconds + tailSeconds;
    const frameCount = Math.max(1, Math.ceil(renderDurationSeconds * sampleRate));
    if (!Number.isSafeInteger(frameCount)) {
      throw new RangeError("The requested offline render is too long.");
    }

    let context: OfflineAudioContext;
    try {
      context = this.contextFactory!(channelCount, frameCount, sampleRate);
    } catch (cause) {
      throw new OfflineTimelineRenderError(
        "OFFLINE_AUDIO_CONTEXT_UNAVAILABLE",
        "The platform rejected the requested offline audio context.",
        { cause },
      );
    }

    const assetIds = [...new Set(playable.map((item) => item.clip.assetId))];
    const decoded = new Map<string, AudioBuffer>();
    for (let index = 0; index < assetIds.length; index += 1) {
      throwIfRenderCancelled(options.signal);
      const assetId = assetIds[index];
      const blob = await this.assetStore.get(assetId);
      if (!blob) throw new Error(`Missing audio asset ${assetId}.`);
      const buffer = await context.decodeAudioData((await blob.arrayBuffer()).slice(0));
      decoded.set(assetId, buffer);
      options.onProgress?.({
        phase: "decoding",
        completedItems: index + 1,
        totalItems: assetIds.length,
        ratio: (index + 1) / assetIds.length,
      });
    }

    throwIfRenderCancelled(options.signal);
    for (const item of playable) {
      const buffer = decoded.get(item.clip.assetId);
      if (!buffer) continue;
      if (!scheduleClip(context, item, buffer)) {
        throw new Error(
          `Clip ${item.clip.id} has no decodable source range to render.`,
        );
      }
    }

    options.onProgress?.({
      phase: "rendering",
      completedItems: null,
      totalItems: null,
      // OfflineAudioContext exposes completion, not reliable incremental progress.
      ratio: null,
    });

    let audioBuffer: AudioBuffer;
    try {
      audioBuffer = await context.startRendering();
    } catch (cause) {
      throw new Error("Offline Web Audio rendering failed.", { cause });
    }

    // The browser API has no portable way to cancel startRendering once it has
    // begun. If cancellation arrived during that call, discard the output now.
    throwIfRenderCancelled(options.signal);
    options.onProgress?.({
      phase: "complete",
      completedItems: 1,
      totalItems: 1,
      ratio: 1,
    });

    return {
      audioBuffer,
      sampleRate: audioBuffer.sampleRate,
      channelCount: audioBuffer.numberOfChannels,
      frameCount: audioBuffer.length,
      durationSeconds: audioBuffer.duration,
      renderScope: "canonical_audio_clips_and_track_mixer_only",
      limitations: [
        "This renderer includes canonical audio clips, clip gain/pan/fades, track gain/pan, mute, and solo.",
        "Plugin, instrument, bus, automation, and external-hardware processing are not rendered because the current canonical project model does not define those executable graphs.",
        "Decoded assets may be resampled by Web Audio to the requested OfflineAudioContext sample rate.",
      ],
    };
  }
}

function collectPlayableClips(project: PoietekProject): PlayableClip[] {
  const anySolo = project.tracks.some((track) => track.mixer.solo);
  const playable: PlayableClip[] = [];

  for (const track of project.tracks) {
    if (track.type !== "audio") continue;
    if (track.mixer.mute || (anySolo && !track.mixer.solo)) continue;

    for (const clip of track.clips) {
      if (clip.muted) continue;
      const clipStartSeconds = ticksToSeconds(
        clip.startTick,
        project.tempoMap,
        project.settings.ppq,
      );
      const clipEndSeconds = ticksToSeconds(
        clip.startTick + clip.durationTicks,
        project.tempoMap,
        project.settings.ppq,
      );
      const timelineDurationSeconds = clipEndSeconds - clipStartSeconds;
      if (timelineDurationSeconds <= 0) continue;
      playable.push({
        clip,
        clipStartSeconds,
        timelineDurationSeconds,
        combinedGainDb: clip.gainDb + track.mixer.gainDb,
        combinedPan: Math.max(-1, Math.min(1, clip.pan + track.mixer.pan)),
      });
    }
  }

  return playable;
}

function scheduleClip(
  context: OfflineAudioContext,
  item: PlayableClip,
  buffer: AudioBuffer,
): boolean {
  const sourceOffsetSeconds = item.clip.sourceOffsetSeconds;
  const declaredRemaining =
    item.clip.sourceDurationSeconds === null
      ? Number.POSITIVE_INFINITY
      : item.clip.sourceDurationSeconds;
  const durationSeconds = Math.min(
    item.timelineDurationSeconds,
    declaredRemaining,
    buffer.duration - sourceOffsetSeconds,
  );
  if (
    !Number.isFinite(sourceOffsetSeconds) ||
    sourceOffsetSeconds < 0 ||
    !Number.isFinite(durationSeconds) ||
    durationSeconds <= 0
  ) {
    return false;
  }

  const source = context.createBufferSource();
  const gain = context.createGain();
  const pan = context.createStereoPanner();
  source.buffer = buffer;
  pan.pan.value = item.combinedPan;

  const linearGain = Math.pow(10, item.combinedGainDb / 20);
  const start = item.clipStartSeconds;
  const end = start + durationSeconds;
  const fadeIn = Math.min(item.clip.fadeInSeconds, durationSeconds);
  const fadeOut = Math.min(item.clip.fadeOutSeconds, durationSeconds - fadeIn);

  if (fadeIn > 0) {
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(linearGain, start + fadeIn);
  } else {
    gain.gain.setValueAtTime(linearGain, start);
  }
  if (fadeOut > 0) {
    gain.gain.setValueAtTime(linearGain, end - fadeOut);
    gain.gain.linearRampToValueAtTime(0, end);
  }

  source.connect(gain).connect(pan).connect(context.destination);
  source.start(start, sourceOffsetSeconds, durationSeconds);
  return true;
}

function cancellationCapability(): OfflineTimelineRenderCapability["cancellation"] {
  return {
    beforeNativeRender: true,
    duringNativeRender: false,
    note: "Cancellation is checked before decoding, between asset decodes, and after native rendering. The browser cannot portably interrupt OfflineAudioContext.startRendering().",
  };
}

function throwIfRenderCancelled(signal: AbortSignal | undefined): void {
  if (signal?.aborted) {
    throw new OfflineTimelineRenderError(
      "RENDER_CANCELLED",
      "Offline timeline rendering was cancelled.",
    );
  }
}

function defaultOfflineAudioContextFactory(): OfflineAudioContextFactory | null {
  if (typeof OfflineAudioContext === "undefined") return null;
  return (channelCount, frameCount, sampleRate) =>
    new OfflineAudioContext(channelCount, frameCount, sampleRate);
}
