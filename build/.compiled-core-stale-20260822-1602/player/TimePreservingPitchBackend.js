"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnavailableTimePreservingPitchBackend = void 0;
exports.referenceShiftCents = referenceShiftCents;
/**
 * Correct fallback: play the creator original.
 * Do NOT use playbackRate because it changes speed/duration and would desync video.
 */
class UnavailableTimePreservingPitchBackend {
    id = "unavailable";
    async isAvailable() {
        return false;
    }
    async open() {
        throw new Error("TIME_PRESERVING_PITCH_UNAVAILABLE: play the creator original or use a pre-rendered compatible rendition.");
    }
    async close() { }
}
exports.UnavailableTimePreservingPitchBackend = UnavailableTimePreservingPitchBackend;
function referenceShiftCents(sourceHz, targetHz) {
    if (sourceHz <= 0 || targetHz <= 0) {
        throw new Error("Reference frequencies must be positive.");
    }
    return 1200 * Math.log2(targetHz / sourceHz);
}
