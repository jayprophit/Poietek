import type { AudioBackend, AssetAudioResolver, TransportSnapshot } from "../../audio-contracts/src/AudioBackend";
import type { AudioClip, PoietekProject } from "../../domain/src/types";
import { getAudioTimeline } from "../../timeline/src/TimelineReadModel";

function dbToGain(db: number): number {
  if (db <= -120) return 0;
  return Math.pow(10, db / 20);
}

export class WebAudioBackend implements AudioBackend {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private activeSources = new Set<AudioBufferSourceNode>();

  private state: TransportSnapshot["state"] = "stopped";
  private positionSeconds = 0;
  private playStartedAtContextTime = 0;
  private playStartedAtTimelineSeconds = 0;

  constructor(private readonly resolver: AssetAudioResolver) {}

  async initialize(): Promise<void> {
    if (this.context) return;

    this.context = new AudioContext();
    this.master = this.context.createGain();
    this.master.connect(this.context.destination);
  }

  private requireContext(): AudioContext {
    if (!this.context) throw new Error("Audio backend is not initialized.");
    return this.context;
  }

  private stopSources(): void {
    for (const source of this.activeSources) {
      try {
        source.stop();
      } catch {
        // Already stopped.
      }
    }
    this.activeSources.clear();
  }

  async play(project: PoietekProject, fromSeconds = this.positionSeconds): Promise<void> {
    await this.initialize();
    const context = this.requireContext();
    if (context.state === "suspended") await context.resume();

    this.stopSources();

    const audibleTracks = new Set(
      project.tracks
        .filter((track) => {
          const anySolo = project.tracks.some((item) => item.mixer.solo);
          if (anySolo) return track.mixer.solo && !track.mixer.mute;
          return !track.mixer.mute;
        })
        .map((track) => track.id),
    );

    const timeline = getAudioTimeline(project)
      .filter((item) => audibleTracks.has(item.trackId))
      .filter((item) => item.endSeconds > fromSeconds);

    const baseContextTime = context.currentTime + 0.03;

    for (const item of timeline) {
      const clip = item.clip;
      if (clip.muted) continue;

      const buffer = await this.resolver.resolveAudioBuffer(clip.assetId, context);

      const source = context.createBufferSource();
      source.buffer = buffer;

      const clipGain = context.createGain();
      clipGain.gain.value = dbToGain(clip.gainDb);

      const panner = context.createStereoPanner();
      panner.pan.value = Math.max(-1, Math.min(1, clip.pan));

      source.connect(clipGain);
      clipGain.connect(panner);
      panner.connect(this.master!);

      const startTimeline = Math.max(item.startSeconds, fromSeconds);
      const delay = Math.max(0, startTimeline - fromSeconds);

      const clipElapsed = Math.max(0, fromSeconds - item.startSeconds);
      const sourceOffset = clip.sourceOffsetSeconds + clipElapsed;

      const timelineRemaining = item.endSeconds - startTimeline;
      const sourceRemaining = Math.max(0, buffer.duration - sourceOffset);
      const duration = Math.min(timelineRemaining, sourceRemaining);

      if (duration <= 0) continue;

      const startAt = baseContextTime + delay;

      if (clip.fadeInSeconds > 0) {
        const fadeStart = startAt;
        clipGain.gain.setValueAtTime(0, fadeStart);
        clipGain.gain.linearRampToValueAtTime(
          dbToGain(clip.gainDb),
          fadeStart + Math.min(clip.fadeInSeconds, duration),
        );
      }

      if (clip.fadeOutSeconds > 0) {
        const fadeDuration = Math.min(clip.fadeOutSeconds, duration);
        clipGain.gain.setValueAtTime(
          dbToGain(clip.gainDb),
          startAt + Math.max(0, duration - fadeDuration),
        );
        clipGain.gain.linearRampToValueAtTime(0, startAt + duration);
      }

      source.onended = () => this.activeSources.delete(source);
      this.activeSources.add(source);
      source.start(startAt, sourceOffset, duration);
    }

    this.state = "playing";
    this.playStartedAtContextTime = context.currentTime;
    this.playStartedAtTimelineSeconds = fromSeconds;
    this.positionSeconds = fromSeconds;
  }

  async pause(): Promise<void> {
    if (!this.context || this.state !== "playing") return;

    this.positionSeconds =
      this.playStartedAtTimelineSeconds +
      (this.context.currentTime - this.playStartedAtContextTime);

    this.stopSources();
    this.state = "paused";
  }

  async stop(): Promise<void> {
    this.stopSources();
    this.positionSeconds = 0;
    this.state = "stopped";
  }

  async seek(seconds: number): Promise<void> {
    this.positionSeconds = Math.max(0, seconds);
    this.stopSources();
    if (this.state === "playing") {
      this.state = "paused";
    }
  }

  getTransport(): TransportSnapshot {
    if (this.context && this.state === "playing") {
      return {
        state: this.state,
        positionSeconds:
          this.playStartedAtTimelineSeconds +
          (this.context.currentTime - this.playStartedAtContextTime),
      };
    }

    return {
      state: this.state,
      positionSeconds: this.positionSeconds,
    };
  }

  setMasterGain(db: number): void {
    if (!this.master) return;
    this.master.gain.value = dbToGain(db);
  }

  async dispose(): Promise<void> {
    this.stopSources();
    if (this.context) {
      await this.context.close();
      this.context = null;
      this.master = null;
    }
    this.state = "stopped";
    this.positionSeconds = 0;
  }
}
