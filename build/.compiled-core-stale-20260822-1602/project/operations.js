"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addAudioTrack = addAudioTrack;
exports.addAsset = addAsset;
exports.addAudioClip = addAudioClip;
exports.setProjectTuning = setProjectTuning;
const ids_1 = require("../domain/ids");
const tempo_1 = require("../timeline/tempo");
function addAudioTrack(project, name = "Audio Track") {
    const track = {
        id: (0, ids_1.newId)("trk"),
        type: "audio",
        name,
        order: project.tracks.length,
        color: null,
        clips: [],
        mixer: { gainDb: 0, pan: 0, mute: false, solo: false },
    };
    return { ...project, tracks: [...project.tracks, track] };
}
function addAsset(project, asset) {
    if (project.assets.some((existing) => existing.id === asset.id))
        return project;
    return { ...project, assets: [...project.assets, asset] };
}
function addAudioClip(input) {
    const { project, trackId, asset } = input;
    const track = project.tracks.find((candidate) => candidate.id === trackId);
    if (!track)
        throw new Error(`Track ${trackId} was not found.`);
    if (track.type !== "audio") {
        throw new Error(`Track ${trackId} is not an audio track.`);
    }
    if (!project.assets.some((candidate) => candidate.id === asset.id)) {
        throw new Error(`Asset ${asset.id} must be added to the project first.`);
    }
    if (asset.durationSeconds == null || asset.durationSeconds <= 0) {
        throw new Error(`Audio asset ${asset.id} does not have a usable duration.`);
    }
    const startTick = input.startTick ?? 0;
    if (!Number.isInteger(startTick) || startTick < 0) {
        throw new Error("Clip startTick must be a non-negative integer.");
    }
    const startSeconds = (0, tempo_1.ticksToSeconds)(startTick, project.tempoMap, project.settings.ppq);
    const endTick = (0, tempo_1.secondsToTicks)(startSeconds + asset.durationSeconds, project.tempoMap, project.settings.ppq);
    const durationTicks = Math.max(1, endTick - startTick);
    const clip = {
        id: (0, ids_1.newId)("clp"),
        clipType: "audio",
        assetId: asset.id,
        name: asset.originalName,
        startTick,
        durationTicks,
        sourceOffsetSeconds: 0,
        sourceDurationSeconds: asset.durationSeconds,
        gainDb: 0,
        pan: 0,
        fadeInSeconds: 0,
        fadeOutSeconds: 0,
        muted: false,
    };
    return {
        ...project,
        tracks: project.tracks.map((track) => track.id === trackId
            ? { ...track, clips: [...track.clips, clip] }
            : track),
    };
}
function setProjectTuning(project, referenceHz, profileId, temperament = "12_tet") {
    return {
        ...project,
        settings: {
            ...project.settings,
            tuning: {
                ...project.settings.tuning,
                referenceHz,
                profileId,
                temperament,
            },
        },
    };
}
