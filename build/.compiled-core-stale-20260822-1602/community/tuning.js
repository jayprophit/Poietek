"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.A432_REFERENCE_TUNING = exports.STANDARD_A440_TUNING = void 0;
exports.validateTuningIdentity = validateTuningIdentity;
exports.createDerivativePlaybackRequest = createDerivativePlaybackRequest;
exports.openDerivativePlaybackSession = openDerivativePlaybackSession;
exports.selectCommunityPlaybackRendition = selectCommunityPlaybackRendition;
const TimePreservingPitchBackend_1 = require("../player/TimePreservingPitchBackend");
exports.STANDARD_A440_TUNING = {
    referenceNote: "A4",
    referenceHz: 440,
    temperament: "12-tone equal temperament",
    profileId: "poietek.tuning.a440-12tet",
};
exports.A432_REFERENCE_TUNING = {
    referenceNote: "A4",
    referenceHz: 432,
    temperament: "12-tone equal temperament",
    profileId: "poietek.tuning.a432-12tet",
};
function validateTuningIdentity(tuning) {
    const errors = [];
    if (!tuning.referenceNote.trim())
        errors.push("Reference note is required.");
    if (!Number.isFinite(tuning.referenceHz) || tuning.referenceHz <= 0) {
        errors.push("Reference frequency must be a positive finite number.");
    }
    if (!tuning.temperament.trim())
        errors.push("Temperament is required.");
    if (!tuning.profileId.trim())
        errors.push("Tuning profile id is required.");
    return errors;
}
function createDerivativePlaybackRequest(options) {
    const originalTuningErrors = validateTuningIdentity(options.original.tuning);
    const targetTuningErrors = validateTuningIdentity(options.targetTuning);
    if (originalTuningErrors.length || targetTuningErrors.length) {
        throw new Error([...originalTuningErrors, ...targetTuningErrors].join(" "));
    }
    if (!options.original.id.trim() || !options.original.assetId.trim()) {
        throw new Error("An original rendition and source asset are required.");
    }
    const request = {
        sourceAssetId: options.original.assetId,
        sourceReferenceHz: options.original.tuning.referenceHz,
        targetReferenceHz: options.targetTuning.referenceHz,
        mediaType: options.original.mediaType,
        preserveTempo: true,
        preserveDuration: true,
    };
    return {
        id: options.id,
        originalRenditionId: options.original.id,
        request,
        state: "draft",
        backendCapability: options.backendCapability,
        backendId: null,
        sessionId: null,
        outputRenditionId: null,
        createdAt: options.createdAt,
        updatedAt: options.createdAt,
        errorCode: null,
        message: null,
    };
}
/**
 * Opens a real DSP session. If the backend is unavailable the creator original
 * remains the only playable rendition; this never substitutes playbackRate.
 */
async function openDerivativePlaybackSession(options) {
    if (!(await options.backend.isAvailable())) {
        return {
            ...options.request,
            state: "backend_unavailable",
            backendId: options.backend.id,
            sessionId: null,
            updatedAt: options.now,
            errorCode: "TIME_PRESERVING_PITCH_UNAVAILABLE",
            message: "No time-preserving DSP backend is available; play the unchanged creator original.",
        };
    }
    try {
        const session = await options.backend.open(options.request.request);
        const expectedCents = (0, TimePreservingPitchBackend_1.referenceShiftCents)(options.request.request.sourceReferenceHz, options.request.request.targetReferenceHz);
        if (Math.abs(session.pitchShiftCents - expectedCents) > 0.01) {
            await options.backend.close(session.id);
            return {
                ...options.request,
                state: "failed",
                backendId: options.backend.id,
                sessionId: null,
                updatedAt: options.now,
                errorCode: "DSP_SHIFT_MISMATCH",
                message: "The DSP backend reported an unexpected pitch shift.",
            };
        }
        return {
            ...options.request,
            state: "session_open",
            backendId: options.backend.id,
            sessionId: session.id,
            updatedAt: options.now,
            errorCode: null,
            message: null,
        };
    }
    catch (error) {
        return {
            ...options.request,
            state: "failed",
            backendId: options.backend.id,
            sessionId: null,
            updatedAt: options.now,
            errorCode: "TIME_PRESERVING_PITCH_OPEN_FAILED",
            message: error instanceof Error ? error.message : "DSP backend failed.",
        };
    }
}
function selectCommunityPlaybackRendition(options) {
    const original = options.catalogItem.renditions.find((rendition) => rendition.id === options.catalogItem.originalRenditionId);
    if (!original || original.kind !== "creator_original") {
        throw new Error("The catalog item has no valid creator-original rendition.");
    }
    if (options.targetReferenceHz == null)
        return original;
    const compatible = options.catalogItem.renditions.find((rendition) => rendition.kind === "time_preserving_derivative" &&
        rendition.derivedFromRenditionId === original.id &&
        Math.abs(rendition.tuning.referenceHz - options.targetReferenceHz) < 0.01 &&
        Math.abs(rendition.durationSeconds - original.durationSeconds) < 0.001);
    // The safe fallback is always the unchanged creator original.
    return compatible ?? original;
}
