"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createControlRoomState = createControlRoomState;
exports.validateControlRoomState = validateControlRoomState;
exports.evaluateControlRoom = evaluateControlRoom;
const minimumOutputChannels = {
    mono: 1,
    stereo: 2,
    '5.1': 6,
    '7.1.4': 12,
    ambisonic_1oa: 4,
};
function createControlRoomState(overrides = {}) {
    const state = {
        schemaVersion: '1.0.0',
        source: 'main',
        monitorFormat: 'stereo',
        cueBusCount: 2,
        dimDb: -20,
        dimEnabled: false,
        monoEnabled: false,
        talkbackEnabled: false,
        ...overrides,
    };
    validateControlRoomState(state);
    return state;
}
function validateControlRoomState(state) {
    if (state.schemaVersion !== '1.0.0')
        throw new Error('Unsupported control-room schema.');
    if (!Number.isInteger(state.cueBusCount) || state.cueBusCount < 0 || state.cueBusCount > 4) {
        throw new Error('Cue-bus count must be an integer from 0 to 4.');
    }
    if (!Number.isFinite(state.dimDb) || state.dimDb < -60 || state.dimDb > 0) {
        throw new Error('Dim level must be from -60 dB to 0 dB.');
    }
    if (!state.routeObservation)
        return;
    if (!state.routeObservation.adapterId.trim() || !state.routeObservation.outputDeviceId.trim()) {
        throw new Error('Observed routes require adapter and output-device identifiers.');
    }
    if (!Number.isFinite(state.routeObservation.observedAt) || state.routeObservation.observedAt <= 0) {
        throw new Error('Observed routes require a valid observation time.');
    }
    if (state.routeObservation.outputChannels < minimumOutputChannels[state.monitorFormat]) {
        throw new Error(`${state.monitorFormat} monitoring requires at least ${minimumOutputChannels[state.monitorFormat]} observed output channels.`);
    }
}
function evaluateControlRoom(state) {
    validateControlRoomState(state);
    if (!state.routeObservation) {
        return {
            state: 'not_observed',
            canClaimActiveMonitoring: false,
            message: 'Monitor controls are saved, but no physical output route has been observed.',
        };
    }
    if (!state.routeObservation.activeStreamId?.trim()) {
        return {
            state: 'route_observed',
            canClaimActiveMonitoring: false,
            message: 'A compatible output route was observed; no active monitor stream has been confirmed.',
        };
    }
    return {
        state: 'active_stream_observed',
        canClaimActiveMonitoring: true,
        message: 'The native adapter reported an active monitor stream for the selected route.',
    };
}
