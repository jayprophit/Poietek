"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateProject = validateProject;
function validateProject(project) {
    const issues = [];
    if (project.schemaVersion !== "1.1.0")
        issues.push("Unsupported schemaVersion.");
    if (!project.id)
        issues.push("Project id is required.");
    if (!project.title.trim())
        issues.push("Project title is required.");
    if (!project.tempoMap.length || project.tempoMap[0].tick !== 0) {
        issues.push("Tempo map must begin at tick 0.");
    }
    let previousTempoTick = -1;
    for (const event of project.tempoMap) {
        if (!Number.isInteger(event.tick) || event.tick < 0) {
            issues.push("Tempo ticks must be non-negative integers.");
        }
        if (event.tick <= previousTempoTick) {
            issues.push("Tempo events must be ordered at unique, increasing ticks.");
        }
        if (!Number.isFinite(event.bpm) || event.bpm <= 0) {
            issues.push(`Tempo at tick ${event.tick} must have a positive finite BPM.`);
        }
        previousTempoTick = event.tick;
    }
    if (!Number.isInteger(project.settings.ppq) || project.settings.ppq <= 0) {
        issues.push("PPQ must be a positive integer.");
    }
    if (!Number.isFinite(project.settings.tuning.referenceHz) ||
        project.settings.tuning.referenceHz <= 0) {
        issues.push("Tuning reference frequency must be positive.");
    }
    const assetIds = new Set();
    for (const asset of project.assets) {
        if (!asset.id)
            issues.push("Asset id is required.");
        if (assetIds.has(asset.id))
            issues.push(`Duplicate asset id ${asset.id}.`);
        assetIds.add(asset.id);
        if (!asset.contentHash)
            issues.push(`Asset ${asset.id} requires a content hash.`);
        if (!Number.isInteger(asset.byteLength) || asset.byteLength < 0) {
            issues.push(`Asset ${asset.id} has an invalid byte length.`);
        }
        if (asset.durationSeconds !== null &&
            (!Number.isFinite(asset.durationSeconds) || asset.durationSeconds < 0)) {
            issues.push(`Asset ${asset.id} has an invalid duration.`);
        }
    }
    const trackIds = new Set();
    const clipIds = new Set();
    for (const track of project.tracks) {
        if (trackIds.has(track.id))
            issues.push(`Duplicate track id ${track.id}.`);
        trackIds.add(track.id);
        if (!Number.isFinite(track.mixer.gainDb)) {
            issues.push(`Track ${track.id} has an invalid gain.`);
        }
        if (!Number.isFinite(track.mixer.pan) || track.mixer.pan < -1 || track.mixer.pan > 1) {
            issues.push(`Track ${track.id} pan must be between -1 and 1.`);
        }
        for (const clip of track.clips) {
            if (clipIds.has(clip.id))
                issues.push(`Duplicate clip id ${clip.id}.`);
            clipIds.add(clip.id);
            if (!assetIds.has(clip.assetId)) {
                issues.push(`Clip ${clip.id} references missing asset ${clip.assetId}.`);
            }
            if (!Number.isInteger(clip.startTick) || clip.startTick < 0) {
                issues.push(`Clip ${clip.id} must start at a non-negative integer tick.`);
            }
            if (!Number.isInteger(clip.durationTicks) || clip.durationTicks <= 0) {
                issues.push(`Clip ${clip.id} must have positive duration.`);
            }
            if (!Number.isFinite(clip.sourceOffsetSeconds) || clip.sourceOffsetSeconds < 0) {
                issues.push(`Clip ${clip.id} has an invalid source offset.`);
            }
            if (clip.sourceDurationSeconds !== null &&
                (!Number.isFinite(clip.sourceDurationSeconds) || clip.sourceDurationSeconds <= 0)) {
                issues.push(`Clip ${clip.id} has an invalid source duration.`);
            }
            if (!Number.isFinite(clip.gainDb)) {
                issues.push(`Clip ${clip.id} has an invalid gain.`);
            }
            if (!Number.isFinite(clip.pan) || clip.pan < -1 || clip.pan > 1) {
                issues.push(`Clip ${clip.id} pan must be between -1 and 1.`);
            }
            if (!Number.isFinite(clip.fadeInSeconds) ||
                clip.fadeInSeconds < 0 ||
                !Number.isFinite(clip.fadeOutSeconds) ||
                clip.fadeOutSeconds < 0) {
                issues.push(`Clip ${clip.id} has invalid fade timing.`);
            }
        }
    }
    return issues;
}
