"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notMeasuredHardwareCapability = notMeasuredHardwareCapability;
exports.unavailableHardwareCapability = unavailableHardwareCapability;
exports.createLocalHardwareFoundation = createLocalHardwareFoundation;
exports.createUserProfileSelection = createUserProfileSelection;
exports.markDeviceDisconnected = markDeviceDisconnected;
exports.effectiveDeviceCapability = effectiveDeviceCapability;
exports.measuredRoundTripLatency = measuredRoundTripLatency;
exports.unmeasuredRoundTripLatency = unmeasuredRoundTripLatency;
const contracts_1 = require("./contracts");
function notMeasuredHardwareCapability(capabilityId, message = "This capability has not been measured on the current hardware.") {
    return {
        capabilityId,
        state: "not_measured",
        source: "unknown",
        implementationId: null,
        observedAt: null,
        reasonCode: "NOT_MEASURED",
        message,
        limitations: [],
        evidence: null,
    };
}
function unavailableHardwareCapability(capabilityId, reasonCode, message, observedAt = null) {
    return {
        capabilityId,
        state: "unavailable",
        source: "unknown",
        implementationId: null,
        observedAt,
        reasonCode,
        message,
        limitations: [],
        evidence: null,
    };
}
/** Creates a disconnected, unmeasured foundation without virtual devices. */
function createLocalHardwareFoundation(options) {
    const now = options.now ?? new Date().toISOString();
    return {
        schemaVersion: contracts_1.HARDWARE_FOUNDATION_SCHEMA_VERSION,
        projectId: options.projectId,
        revision: 0,
        createdAt: now,
        updatedAt: now,
        profiles: [],
        devices: [],
        loopbackEvidence: [],
        patchRoutes: [],
        analogueInserts: [],
        digitalConsoleSync: [],
        analogueConsoles: [],
        timing: {
            audioTransport: {
                runState: "stopped",
                requestedPositionSamples: 0,
                observedPositionSamples: null,
                positionObservation: null,
            },
            sampleClock: {
                capability: notMeasuredHardwareCapability("clock.sample"),
                source: "not_selected",
                nominalSampleRateHz: null,
                measuredSampleRateHz: null,
                measuredDriftPpm: null,
                lockState: "not_measured",
                observedAt: null,
            },
            midiClock: {
                capability: notMeasuredHardwareCapability("clock.midi"),
                role: "off",
                port: null,
                requestedTempoBpm: null,
                observedTempoBpm: null,
                observedJitterMilliseconds: null,
                syncState: "not_measured",
                observedAt: null,
            },
            midiControl: {
                capability: notMeasuredHardwareCapability("midi.control"),
                enabled: false,
                selectedInputDeviceIds: [],
                selectedOutputDeviceIds: [],
                mappings: [],
                lastObservedAt: null,
            },
            wordClock: {
                capability: notMeasuredHardwareCapability("clock.word"),
                role: "off",
                input: null,
                outputs: [],
                termination: "not_measured",
                lockState: "not_measured",
                observedAt: null,
            },
            timecode: [],
            metering: {
                capability: notMeasuredHardwareCapability("metering.hardware"),
                observations: [],
            },
        },
        extensions: {},
    };
}
/** Captures an explicit user's choice and snapshots profile verification. */
function createUserProfileSelection(profile, selectedByActorId, selectedAt) {
    return {
        profileId: profile.id,
        selectionMethod: "explicit_user_action",
        selectedByActorId,
        selectedAt,
        verificationAtSelection: profile.provenance.verification,
        profileDigestAtSelection: profile.provenance.verification === "verified"
            ? profile.provenance.digest
            : null,
    };
}
/**
 * Disconnects a device without erasing its selected profile, desired state,
 * last observation, identifiers, or historic capability reports.
 */
function markDeviceDisconnected(device, reason, observedAt) {
    return {
        ...device,
        connection: {
            state: "disconnected",
            adapterId: device.connection.adapterId,
            observedAt,
            reason,
        },
        identifiers: device.identifiers.map((identifier) => ({ ...identifier })),
        desiredState: { ...device.desiredState },
        lastObservedState: device.lastObservedState === null ? null : { ...device.lastObservedState },
        lastObservedCapabilities: device.lastObservedCapabilities.map((report) => ({
            ...report,
            limitations: [...report.limitations],
            evidence: report.evidence === null ? null : { ...report.evidence },
        })),
        metadata: { ...device.metadata },
    };
}
/** Historic capability observations are gated by the current connection. */
function effectiveDeviceCapability(device, capabilityId) {
    if (device.connection.state === "disconnected") {
        return unavailableHardwareCapability(capabilityId, "DEVICE_DISCONNECTED", device.connection.reason, device.connection.observedAt);
    }
    if (device.connection.state === "not_measured") {
        return notMeasuredHardwareCapability(capabilityId, "The device connection has not been measured.");
    }
    return (device.lastObservedCapabilities.find((report) => report.capabilityId === capabilityId) ??
        notMeasuredHardwareCapability(capabilityId, "The connected adapter did not report this capability."));
}
function measuredRoundTripLatency(roundTripSamples, evidence) {
    return {
        state: "measured",
        roundTripSamples,
        roundTripMilliseconds: (roundTripSamples / evidence.sampleRateHz) * 1000,
        sampleRateHz: evidence.sampleRateHz,
        evidenceId: evidence.id,
    };
}
function unmeasuredRoundTripLatency() {
    return {
        state: "not_measured",
        roundTripSamples: null,
        roundTripMilliseconds: null,
        sampleRateHz: null,
        evidenceId: null,
    };
}
