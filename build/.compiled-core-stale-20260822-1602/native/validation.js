"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateNativeStudioDeviceInventory = validateNativeStudioDeviceInventory;
const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const isNullableNumber = (value) => value === null || (typeof value === 'number' && Number.isFinite(value));
function isAudioConfig(value) {
    if (!isObject(value))
        return false;
    return (typeof value.channels === 'number' &&
        Number.isInteger(value.channels) &&
        value.channels > 0 &&
        typeof value.minSampleRate === 'number' &&
        typeof value.maxSampleRate === 'number' &&
        value.minSampleRate > 0 &&
        value.maxSampleRate >= value.minSampleRate &&
        isNullableNumber(value.minBufferFrames) &&
        isNullableNumber(value.maxBufferFrames) &&
        typeof value.sampleFormat === 'string');
}
function isPreferredAudioConfig(value) {
    if (!isObject(value))
        return false;
    return (typeof value.channels === 'number' &&
        Number.isInteger(value.channels) &&
        value.channels > 0 &&
        typeof value.sampleRate === 'number' &&
        value.sampleRate > 0 &&
        isNullableNumber(value.minBufferFrames) &&
        isNullableNumber(value.maxBufferFrames) &&
        typeof value.sampleFormat === 'string');
}
function isAudioDevice(value) {
    if (!isObject(value))
        return false;
    return (typeof value.id === 'string' &&
        value.id.length > 0 &&
        typeof value.name === 'string' &&
        typeof value.host === 'string' &&
        (value.direction === 'input' || value.direction === 'output') &&
        typeof value.isDefault === 'boolean' &&
        (value.capabilityStatus === 'detected' ||
            value.capabilityStatus === 'probe_error') &&
        (value.capabilityMessage === null ||
            typeof value.capabilityMessage === 'string') &&
        Array.isArray(value.supportedConfigs) &&
        value.supportedConfigs.every(isAudioConfig) &&
        (value.preferredConfig === null ||
            isPreferredAudioConfig(value.preferredConfig)) &&
        value.selectableByNativeEngine === false &&
        value.latencyStatus === 'not_measured' &&
        value.latencyMs === null);
}
function isMidiPort(value) {
    if (!isObject(value))
        return false;
    return (typeof value.id === 'string' &&
        value.id.length > 0 &&
        typeof value.name === 'string' &&
        (value.direction === 'input' || value.direction === 'output') &&
        (value.capabilityStatus === 'detected' ||
            value.capabilityStatus === 'probe_error') &&
        (value.capabilityMessage === null ||
            typeof value.capabilityMessage === 'string') &&
        value.selectableByNativeEngine === false);
}
function validateNativeStudioDeviceInventory(value) {
    if (!isObject(value) || value.schemaVersion !== 1)
        return false;
    if (typeof value.platform !== 'string' ||
        typeof value.supported !== 'boolean' ||
        typeof value.scannedAtEpochMs !== 'number' ||
        !Number.isFinite(value.scannedAtEpochMs) ||
        !Array.isArray(value.audioHosts) ||
        !value.audioHosts.every((host) => typeof host === 'string') ||
        !Array.isArray(value.audioInputs) ||
        !value.audioInputs.every(isAudioDevice) ||
        !Array.isArray(value.audioOutputs) ||
        !value.audioOutputs.every(isAudioDevice) ||
        !Array.isArray(value.midiInputs) ||
        !value.midiInputs.every(isMidiPort) ||
        !Array.isArray(value.midiOutputs) ||
        !value.midiOutputs.every(isMidiPort) ||
        !Array.isArray(value.warnings) ||
        !value.warnings.every((warning) => typeof warning === 'string') ||
        !isObject(value.engine) ||
        value.engine.status !== 'inventory_only' ||
        typeof value.engine.message !== 'string') {
        return false;
    }
    return (value.audioInputs.every((device) => device.direction === 'input') &&
        value.audioOutputs.every((device) => device.direction === 'output') &&
        value.midiInputs.every((device) => device.direction === 'input') &&
        value.midiOutputs.every((device) => device.direction === 'output'));
}
