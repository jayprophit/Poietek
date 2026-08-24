"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTrackMixer = updateTrackMixer;
exports.updateAudioClip = updateAudioClip;
exports.removeAudioClip = removeAudioClip;
exports.splitAudioClipAtTick = splitAudioClipAtTick;
const ids_1 = require("../domain/ids");
const tempo_1 = require("../timeline/tempo");
function finiteInRange(value, minimum, maximum, label) {
    if (!Number.isFinite(value) || value < minimum || value > maximum) {
        throw new Error(`${label} must be between ${minimum} and ${maximum}.`);
    }
}
function findAudioClip(project, trackId, clipId) {
    const track = project.tracks.find((candidate) => candidate.id === trackId);
    if (!track)
        throw new Error(`Track ${trackId} was not found.`);
    if (track.type !== 'audio')
        throw new Error(`Track ${trackId} is not an audio track.`);
    const clip = track.clips.find((candidate) => candidate.id === clipId);
    if (!clip)
        throw new Error(`Clip ${clipId} was not found on track ${trackId}.`);
    return { track, clip };
}
function updateTrackMixer(project, trackId, patch) {
    const track = project.tracks.find((candidate) => candidate.id === trackId);
    if (!track)
        throw new Error(`Track ${trackId} was not found.`);
    const mixer = { ...track.mixer, ...patch };
    finiteInRange(mixer.gainDb, -60, 12, 'Track gain');
    finiteInRange(mixer.pan, -1, 1, 'Track pan');
    return {
        ...project,
        tracks: project.tracks.map((candidate) => candidate.id === trackId ? { ...candidate, mixer } : candidate),
    };
}
function updateAudioClip(project, trackId, clipId, patch) {
    const { clip } = findAudioClip(project, trackId, clipId);
    const next = { ...clip, ...patch };
    if (!next.name.trim())
        throw new Error('Clip name cannot be empty.');
    if (!Number.isInteger(next.startTick) || next.startTick < 0) {
        throw new Error('Clip start must be a non-negative whole tick.');
    }
    if (!Number.isInteger(next.durationTicks) || next.durationTicks < 1) {
        throw new Error('Clip duration must be at least one tick.');
    }
    if (!Number.isFinite(next.sourceOffsetSeconds) || next.sourceOffsetSeconds < 0) {
        throw new Error('Source offset must be a non-negative finite number.');
    }
    if (next.sourceDurationSeconds != null &&
        (!Number.isFinite(next.sourceDurationSeconds) || next.sourceDurationSeconds <= 0)) {
        throw new Error('Source duration must be positive when present.');
    }
    finiteInRange(next.gainDb, -60, 24, 'Clip gain');
    finiteInRange(next.pan, -1, 1, 'Clip pan');
    finiteInRange(next.fadeInSeconds, 0, 60 * 60, 'Fade in');
    finiteInRange(next.fadeOutSeconds, 0, 60 * 60, 'Fade out');
    const clipDurationSeconds = (0, tempo_1.ticksToSeconds)(next.startTick + next.durationTicks, project.tempoMap, project.settings.ppq) -
        (0, tempo_1.ticksToSeconds)(next.startTick, project.tempoMap, project.settings.ppq);
    if (next.fadeInSeconds + next.fadeOutSeconds > clipDurationSeconds + 1e-6) {
        throw new Error('Combined fades cannot be longer than the clip.');
    }
    return {
        ...project,
        tracks: project.tracks.map((track) => track.id === trackId
            ? {
                ...track,
                clips: track.clips.map((candidate) => candidate.id === clipId ? next : candidate),
            }
            : track),
    };
}
function removeAudioClip(project, trackId, clipId) {
    findAudioClip(project, trackId, clipId);
    return {
        ...project,
        tracks: project.tracks.map((track) => track.id === trackId
            ? { ...track, clips: track.clips.filter((clip) => clip.id !== clipId) }
            : track),
    };
}
function splitAudioClipAtTick(project, trackId, clipId, splitTick) {
    const { clip } = findAudioClip(project, trackId, clipId);
    const clipEndTick = clip.startTick + clip.durationTicks;
    if (!Number.isInteger(splitTick) || splitTick <= clip.startTick || splitTick >= clipEndTick) {
        throw new Error('Split point must be a whole tick inside the clip.');
    }
    const clipStartSeconds = (0, tempo_1.ticksToSeconds)(clip.startTick, project.tempoMap, project.settings.ppq);
    const splitSeconds = (0, tempo_1.ticksToSeconds)(splitTick, project.tempoMap, project.settings.ppq);
    const offsetDelta = splitSeconds - clipStartSeconds;
    const firstDurationTicks = splitTick - clip.startTick;
    const secondDurationTicks = clipEndTick - splitTick;
    const first = {
        ...clip,
        durationTicks: firstDurationTicks,
        sourceDurationSeconds: clip.sourceDurationSeconds == null
            ? offsetDelta
            : Math.min(clip.sourceDurationSeconds, offsetDelta),
        fadeOutSeconds: 0,
    };
    const second = {
        ...clip,
        id: (0, ids_1.newId)('clp'),
        name: `${clip.name} B`,
        startTick: splitTick,
        durationTicks: secondDurationTicks,
        sourceOffsetSeconds: clip.sourceOffsetSeconds + offsetDelta,
        sourceDurationSeconds: clip.sourceDurationSeconds == null
            ? null
            : Math.max(0.000001, clip.sourceDurationSeconds - offsetDelta),
        fadeInSeconds: 0,
    };
    return {
        ...project,
        tracks: project.tracks.map((track) => track.id === trackId
            ? {
                ...track,
                clips: track.clips.flatMap((candidate) => candidate.id === clipId ? [first, second] : [candidate]),
            }
            : track),
    };
}
