import type { AudioClip, PoietekProject } from "../domain/types";
import type { AssetStore } from "../assets/AssetStore";
import { AssetAudioResolver } from "./AssetAudioResolver";
import { ticksToSeconds } from "../timeline/tempo";

interface ScheduledSource {
  source: AudioBufferSourceNode;
  gain: GainNode;
  pan: StereoPannerNode;
}

export class WebAudioTimelinePlayer {
  private context: AudioContext | null = null;
  private resolver: AssetAudioResolver | null = null;
  private scheduled: ScheduledSource[] = [];
  private playheadSeconds = 0;
  private startedAtContextSeconds = 0;
  private playing = false;

  constructor(private readonly assetStore: AssetStore) {}

  async play(project: PoietekProject, fromSeconds = this.playheadSeconds): Promise<void> {
    await this.stopSources();

    const context = await this.ensureContext();
    await context.resume();

    this.playheadSeconds = Math.max(0, fromSeconds);
    this.startedAtContextSeconds = context.currentTime;
    this.playing = true;

    const anySolo = project.tracks.some((track) => track.mixer.solo);

    for (const track of project.tracks) {
      if (track.mixer.mute) continue;
      if (anySolo && !track.mixer.solo) continue;

      for (const clip of track.clips) {
        if (clip.muted) continue;
        await this.scheduleClip(project, clip, track.mixer.gainDb, track.mixer.pan);
      }
    }
  }

  pause(): Promise<void> {
    if (this.context && this.playing) {
      this.playheadSeconds += this.context.currentTime - this.startedAtContextSeconds;
    }
    this.playing = false;
    return this.stopSources();
  }

  async stop(): Promise<void> {
    this.playing = false;
    this.playheadSeconds = 0;
    await this.stopSources();
  }

  async seek(project: PoietekProject, seconds: number): Promise<void> {
    this.playheadSeconds = Math.max(0, seconds);
    if (this.playing) await this.play(project, this.playheadSeconds);
  }

  getPlayheadSeconds(): number {
    if (this.context && this.playing) {
      return this.playheadSeconds + (this.context.currentTime - this.startedAtContextSeconds);
    }
    return this.playheadSeconds;
  }

  private async ensureContext(): Promise<AudioContext> {
    if (!this.context) {
      this.context = new AudioContext({ latencyHint: "interactive" });
      this.resolver = new AssetAudioResolver(this.assetStore, this.context);
    }
    return this.context;
  }

  private async scheduleClip(
    project: PoietekProject,
    clip: AudioClip,
    trackGainDb: number,
    trackPan: number,
  ): Promise<void> {
    if (!this.context || !this.resolver) return;

    const clipStart = ticksToSeconds(
      clip.startTick,
      project.tempoMap,
      project.settings.ppq,
    );
    const clipDuration = ticksToSeconds(
      clip.startTick + clip.durationTicks,
      project.tempoMap,
      project.settings.ppq,
    ) - clipStart;

    const timelineOffset = this.playheadSeconds - clipStart;
    if (timelineOffset >= clipDuration) return;

    const delay = Math.max(0, clipStart - this.playheadSeconds);
    const sourceOffset = clip.sourceOffsetSeconds + Math.max(0, timelineOffset);
    const availableDuration = Math.max(
      0,
      Math.min(
        clipDuration - Math.max(0, timelineOffset),
        (clip.sourceDurationSeconds ?? Number.POSITIVE_INFINITY) - Math.max(0, timelineOffset),
      ),
    );
    if (availableDuration <= 0) return;

    const buffer = await this.resolver.resolve(clip.assetId);

    const source = this.context.createBufferSource();
    source.buffer = buffer;

    const gain = this.context.createGain();
    const pan = this.context.createStereoPanner();

    gain.gain.value = Math.pow(10, (clip.gainDb + trackGainDb) / 20);
    pan.pan.value = Math.max(-1, Math.min(1, clip.pan + trackPan));

    source.connect(gain).connect(pan).connect(this.context.destination);
    source.start(
      this.context.currentTime + delay,
      sourceOffset,
      Math.min(availableDuration, Math.max(0, buffer.duration - sourceOffset)),
    );

    this.scheduled.push({ source, gain, pan });
  }

  private async stopSources(): Promise<void> {
    for (const item of this.scheduled.splice(0)) {
      try { item.source.stop(); } catch {}
      try { item.source.disconnect(); } catch {}
      try { item.gain.disconnect(); } catch {}
      try { item.pan.disconnect(); } catch {}
    }
  }
}
