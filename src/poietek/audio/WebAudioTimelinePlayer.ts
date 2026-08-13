import type { AudioClip, PoietekProject } from "../domain/types";
import type { AssetStore } from "../assets/AssetStore";
import { AssetAudioResolver } from "./AssetAudioResolver";
import { ticksToSeconds } from "../timeline/tempo";

interface ScheduledSource {
  source: AudioBufferSourceNode;
  gain: GainNode;
  pan: StereoPannerNode;
}

interface PlayableClip {
  clip: AudioClip;
  trackGainDb: number;
  trackPan: number;
}

export class WebAudioTimelinePlayer {
  private context: AudioContext | null = null;
  private resolver: AssetAudioResolver | null = null;
  private scheduled: ScheduledSource[] = [];
  private playheadSeconds = 0;
  private startedAtContextSeconds = 0;
  private playing = false;
  private starting = false;
  private generation = 0;

  constructor(private readonly assetStore: AssetStore) {}

  async play(
    project: PoietekProject,
    fromSeconds = this.playheadSeconds,
  ): Promise<void> {
    const generation = ++this.generation;
    this.starting = true;
    this.playing = false;
    this.cancelScheduledSources();

    try {
      const context = await this.ensureContext();
      await context.resume();
      if (generation !== this.generation) return;

      const resolver = this.resolver;
      if (!resolver) throw new Error("Audio asset resolver is unavailable.");

      const playable = this.collectPlayableClips(project, fromSeconds);
      const assetIds = [...new Set(playable.map(({ clip }) => clip.assetId))];
      const decoded = await Promise.all(
        assetIds.map(async (assetId) => [
          assetId,
          await resolver.resolve(assetId),
        ] as const),
      );
      if (generation !== this.generation) return;

      const buffers = new Map(decoded);
      this.playheadSeconds = Math.max(0, fromSeconds);
      this.startedAtContextSeconds = context.currentTime;
      this.starting = false;
      this.playing = true;

      for (const item of playable) {
        const buffer = buffers.get(item.clip.assetId);
        if (!buffer) continue;
        this.scheduleClip(project, item, buffer, generation);
      }

      if (!this.scheduled.length) {
        this.playing = false;
      }
    } catch (error) {
      if (generation === this.generation) {
        this.starting = false;
        this.playing = false;
        this.cancelScheduledSources();
      }
      throw error;
    }
  }

  async pause(): Promise<void> {
    if (this.context && this.playing) {
      this.playheadSeconds +=
        this.context.currentTime - this.startedAtContextSeconds;
    }

    this.generation += 1;
    this.starting = false;
    this.playing = false;
    this.cancelScheduledSources();
  }

  async stop(): Promise<void> {
    this.generation += 1;
    this.starting = false;
    this.playing = false;
    this.playheadSeconds = 0;
    this.cancelScheduledSources();
  }

  async seek(project: PoietekProject, seconds: number): Promise<void> {
    const shouldResume = this.playing || this.starting;

    this.generation += 1;
    this.starting = false;
    this.playing = false;
    this.cancelScheduledSources();
    this.playheadSeconds = Math.max(0, seconds);

    if (shouldResume) {
      await this.play(project, this.playheadSeconds);
    }
  }

  getPlayheadSeconds(): number {
    if (this.context && this.playing) {
      return (
        this.playheadSeconds +
        (this.context.currentTime - this.startedAtContextSeconds)
      );
    }
    return this.playheadSeconds;
  }

  private async ensureContext(): Promise<AudioContext> {
    if (!this.context) {
      if (typeof AudioContext === "undefined") {
        throw new Error("Web Audio playback is unavailable on this platform.");
      }
      this.context = new AudioContext({ latencyHint: "interactive" });
      this.resolver = new AssetAudioResolver(this.assetStore, this.context);
    }
    return this.context;
  }

  private collectPlayableClips(
    project: PoietekProject,
    fromSeconds: number,
  ): PlayableClip[] {
    const anySolo = project.tracks.some((track) => track.mixer.solo);
    const clips: PlayableClip[] = [];

    for (const track of project.tracks) {
      if (track.mixer.mute || (anySolo && !track.mixer.solo)) continue;

      for (const clip of track.clips) {
        if (clip.muted) continue;
        const clipEnd = ticksToSeconds(
          clip.startTick + clip.durationTicks,
          project.tempoMap,
          project.settings.ppq,
        );
        if (clipEnd <= Math.max(0, fromSeconds)) continue;
        clips.push({
          clip,
          trackGainDb: track.mixer.gainDb,
          trackPan: track.mixer.pan,
        });
      }
    }

    return clips;
  }

  private scheduleClip(
    project: PoietekProject,
    item: PlayableClip,
    buffer: AudioBuffer,
    generation: number,
  ): void {
    const context = this.context;
    if (!context || generation !== this.generation) return;

    const { clip, trackGainDb, trackPan } = item;
    const clipStart = ticksToSeconds(
      clip.startTick,
      project.tempoMap,
      project.settings.ppq,
    );
    const clipDuration =
      ticksToSeconds(
        clip.startTick + clip.durationTicks,
        project.tempoMap,
        project.settings.ppq,
      ) - clipStart;

    const elapsedIntoClip = Math.max(0, this.playheadSeconds - clipStart);
    if (elapsedIntoClip >= clipDuration) return;

    const delay = Math.max(0, clipStart - this.playheadSeconds);
    const sourceOffset = clip.sourceOffsetSeconds + elapsedIntoClip;
    const declaredSourceRemaining =
      clip.sourceDurationSeconds == null
        ? Number.POSITIVE_INFINITY
        : clip.sourceDurationSeconds - elapsedIntoClip;
    const duration = Math.min(
      clipDuration - elapsedIntoClip,
      declaredSourceRemaining,
      buffer.duration - sourceOffset,
    );
    if (!Number.isFinite(sourceOffset) || sourceOffset < 0 || duration <= 0) {
      return;
    }

    const source = context.createBufferSource();
    source.buffer = buffer;

    const gain = context.createGain();
    const pan = context.createStereoPanner();
    gain.gain.value = Math.pow(10, (clip.gainDb + trackGainDb) / 20);
    pan.pan.value = Math.max(-1, Math.min(1, clip.pan + trackPan));

    source.connect(gain).connect(pan).connect(context.destination);

    const scheduled: ScheduledSource = { source, gain, pan };
    source.onended = () => {
      this.disconnectScheduledSource(scheduled);
      const index = this.scheduled.indexOf(scheduled);
      if (index >= 0) this.scheduled.splice(index, 1);

      if (
        generation === this.generation &&
        this.playing &&
        this.scheduled.length === 0
      ) {
        this.playheadSeconds +=
          context.currentTime - this.startedAtContextSeconds;
        this.playing = false;
      }
    };

    try {
      source.start(this.startedAtContextSeconds + delay, sourceOffset, duration);
      this.scheduled.push(scheduled);
    } catch (error) {
      source.onended = null;
      this.disconnectScheduledSource(scheduled);
      throw error;
    }
  }

  private cancelScheduledSources(): void {
    for (const item of this.scheduled.splice(0)) {
      item.source.onended = null;
      try {
        item.source.stop();
      } catch {
        // A source that already ended does not need another stop.
      }
      this.disconnectScheduledSource(item);
    }
  }

  private disconnectScheduledSource(item: ScheduledSource): void {
    try {
      item.source.disconnect();
    } catch {}
    try {
      item.gain.disconnect();
    } catch {}
    try {
      item.pan.disconnect();
    } catch {}
  }
}
