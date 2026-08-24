"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebAudioTimelinePlayer = void 0;
exports.clipFadeGainAtTime = clipFadeGainAtTime;
const AssetAudioResolver_1 = require("./AssetAudioResolver");
const tempo_1 = require("../timeline/tempo");
function clipFadeGainAtTime(clipDurationSeconds, fadeInSeconds, fadeOutSeconds, elapsedSeconds) {
    if (!Number.isFinite(clipDurationSeconds) || clipDurationSeconds <= 0)
        return 0;
    const elapsed = Math.max(0, Math.min(clipDurationSeconds, elapsedSeconds));
    const fadeIn = Math.max(0, Math.min(clipDurationSeconds, fadeInSeconds));
    const fadeOut = Math.max(0, Math.min(clipDurationSeconds, fadeOutSeconds));
    const fadeInGain = fadeIn > 0 ? Math.min(1, elapsed / fadeIn) : 1;
    const fadeOutGain = fadeOut > 0 ? Math.min(1, (clipDurationSeconds - elapsed) / fadeOut) : 1;
    return Math.max(0, Math.min(1, fadeInGain, fadeOutGain));
}
class WebAudioTimelinePlayer {
    assetStore;
    context = null;
    resolver = null;
    scheduled = [];
    playheadSeconds = 0;
    startedAtContextSeconds = 0;
    playing = false;
    starting = false;
    generation = 0;
    constructor(assetStore) {
        this.assetStore = assetStore;
    }
    async play(project, fromSeconds = this.playheadSeconds) {
        const generation = ++this.generation;
        this.starting = true;
        this.playing = false;
        this.cancelScheduledSources();
        try {
            const context = await this.ensureContext();
            await context.resume();
            if (generation !== this.generation)
                return;
            const resolver = this.resolver;
            if (!resolver)
                throw new Error("Audio asset resolver is unavailable.");
            const playable = this.collectPlayableClips(project, fromSeconds);
            const assetIds = [...new Set(playable.map(({ clip }) => clip.assetId))];
            const decoded = await Promise.all(assetIds.map(async (assetId) => [
                assetId,
                await resolver.resolve(assetId),
            ]));
            if (generation !== this.generation)
                return;
            const buffers = new Map(decoded);
            this.playheadSeconds = Math.max(0, fromSeconds);
            this.startedAtContextSeconds = context.currentTime;
            this.starting = false;
            this.playing = true;
            for (const item of playable) {
                const buffer = buffers.get(item.clip.assetId);
                if (!buffer)
                    continue;
                this.scheduleClip(project, item, buffer, generation);
            }
            if (!this.scheduled.length) {
                this.playing = false;
            }
        }
        catch (error) {
            if (generation === this.generation) {
                this.starting = false;
                this.playing = false;
                this.cancelScheduledSources();
            }
            throw error;
        }
    }
    async pause() {
        if (this.context && this.playing) {
            this.playheadSeconds +=
                this.context.currentTime - this.startedAtContextSeconds;
        }
        this.generation += 1;
        this.starting = false;
        this.playing = false;
        this.cancelScheduledSources();
    }
    async stop() {
        this.generation += 1;
        this.starting = false;
        this.playing = false;
        this.playheadSeconds = 0;
        this.cancelScheduledSources();
    }
    async seek(project, seconds) {
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
    getPlayheadSeconds() {
        if (this.context && this.playing) {
            return (this.playheadSeconds +
                (this.context.currentTime - this.startedAtContextSeconds));
        }
        return this.playheadSeconds;
    }
    async ensureContext() {
        if (!this.context) {
            if (typeof AudioContext === "undefined") {
                throw new Error("Web Audio playback is unavailable on this platform.");
            }
            this.context = new AudioContext({ latencyHint: "interactive" });
            this.resolver = new AssetAudioResolver_1.AssetAudioResolver(this.assetStore, this.context);
        }
        return this.context;
    }
    collectPlayableClips(project, fromSeconds) {
        const anySolo = project.tracks.some((track) => track.mixer.solo);
        const clips = [];
        for (const track of project.tracks) {
            if (track.mixer.mute || (anySolo && !track.mixer.solo))
                continue;
            for (const clip of track.clips) {
                if (clip.muted)
                    continue;
                const clipEnd = (0, tempo_1.ticksToSeconds)(clip.startTick + clip.durationTicks, project.tempoMap, project.settings.ppq);
                if (clipEnd <= Math.max(0, fromSeconds))
                    continue;
                clips.push({
                    clip,
                    trackGainDb: track.mixer.gainDb,
                    trackPan: track.mixer.pan,
                });
            }
        }
        return clips;
    }
    scheduleClip(project, item, buffer, generation) {
        const context = this.context;
        if (!context || generation !== this.generation)
            return;
        const { clip, trackGainDb, trackPan } = item;
        const clipStart = (0, tempo_1.ticksToSeconds)(clip.startTick, project.tempoMap, project.settings.ppq);
        const clipDuration = (0, tempo_1.ticksToSeconds)(clip.startTick + clip.durationTicks, project.tempoMap, project.settings.ppq) - clipStart;
        const elapsedIntoClip = Math.max(0, this.playheadSeconds - clipStart);
        if (elapsedIntoClip >= clipDuration)
            return;
        const delay = Math.max(0, clipStart - this.playheadSeconds);
        const sourceOffset = clip.sourceOffsetSeconds + elapsedIntoClip;
        const declaredSourceRemaining = clip.sourceDurationSeconds == null
            ? Number.POSITIVE_INFINITY
            : clip.sourceDurationSeconds - elapsedIntoClip;
        const duration = Math.min(clipDuration - elapsedIntoClip, declaredSourceRemaining, buffer.duration - sourceOffset);
        if (!Number.isFinite(sourceOffset) || sourceOffset < 0 || duration <= 0) {
            return;
        }
        const source = context.createBufferSource();
        source.buffer = buffer;
        const gain = context.createGain();
        const pan = context.createStereoPanner();
        const baseGain = Math.pow(10, (clip.gainDb + trackGainDb) / 20);
        pan.pan.value = Math.max(-1, Math.min(1, clip.pan + trackPan));
        const startAt = this.startedAtContextSeconds + delay;
        const endElapsed = elapsedIntoClip + duration;
        gain.gain.setValueAtTime(baseGain *
            clipFadeGainAtTime(clipDuration, clip.fadeInSeconds, clip.fadeOutSeconds, elapsedIntoClip), startAt);
        const fadeInBoundary = clip.fadeInSeconds;
        if (fadeInBoundary > elapsedIntoClip && fadeInBoundary < endElapsed) {
            gain.gain.linearRampToValueAtTime(baseGain *
                clipFadeGainAtTime(clipDuration, clip.fadeInSeconds, clip.fadeOutSeconds, fadeInBoundary), startAt + fadeInBoundary - elapsedIntoClip);
        }
        const fadeOutBoundary = clipDuration - clip.fadeOutSeconds;
        if (fadeOutBoundary > elapsedIntoClip && fadeOutBoundary < endElapsed) {
            gain.gain.setValueAtTime(baseGain *
                clipFadeGainAtTime(clipDuration, clip.fadeInSeconds, clip.fadeOutSeconds, fadeOutBoundary), startAt + fadeOutBoundary - elapsedIntoClip);
        }
        gain.gain.linearRampToValueAtTime(baseGain *
            clipFadeGainAtTime(clipDuration, clip.fadeInSeconds, clip.fadeOutSeconds, endElapsed), startAt + duration);
        source.connect(gain).connect(pan).connect(context.destination);
        const scheduled = { source, gain, pan };
        source.onended = () => {
            this.disconnectScheduledSource(scheduled);
            const index = this.scheduled.indexOf(scheduled);
            if (index >= 0)
                this.scheduled.splice(index, 1);
            if (generation === this.generation &&
                this.playing &&
                this.scheduled.length === 0) {
                this.playheadSeconds +=
                    context.currentTime - this.startedAtContextSeconds;
                this.playing = false;
            }
        };
        try {
            source.start(startAt, sourceOffset, duration);
            this.scheduled.push(scheduled);
        }
        catch (error) {
            source.onended = null;
            this.disconnectScheduledSource(scheduled);
            throw error;
        }
    }
    cancelScheduledSources() {
        for (const item of this.scheduled.splice(0)) {
            item.source.onended = null;
            try {
                item.source.stop();
            }
            catch {
                // A source that already ended does not need another stop.
            }
            this.disconnectScheduledSource(item);
        }
    }
    disconnectScheduledSource(item) {
        try {
            item.source.disconnect();
        }
        catch { }
        try {
            item.gain.disconnect();
        }
        catch { }
        try {
            item.pan.disconnect();
        }
        catch { }
    }
}
exports.WebAudioTimelinePlayer = WebAudioTimelinePlayer;
