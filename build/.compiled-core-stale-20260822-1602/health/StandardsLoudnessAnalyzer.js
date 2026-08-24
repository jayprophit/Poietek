"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnavailableStandardsLoudnessAnalyzer = void 0;
/**
 * Deliberately "unavailable" until a validated BS.1770 implementation is wired.
 * Never rename RMS as LUFS or sample peak as dBTP.
 */
class UnavailableStandardsLoudnessAnalyzer {
    implementationId = "unavailable";
    async analyze() {
        return {
            integratedLufs: null,
            momentaryLufsMax: null,
            shortTermLufsMax: null,
            loudnessRangeLu: null,
            truePeakDbtp: null,
        };
    }
}
exports.UnavailableStandardsLoudnessAnalyzer = UnavailableStandardsLoudnessAnalyzer;
