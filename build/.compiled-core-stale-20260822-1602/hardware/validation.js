"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateHardwareFoundation = validateHardwareFoundation;
const contracts_1 = require("./contracts");
function issue(code, path, message) {
    return { code, path, message };
}
function hasText(value) {
    return typeof value === "string" && value.trim().length > 0;
}
function isTimestamp(value) {
    return hasText(value) && !Number.isNaN(Date.parse(value));
}
function isPositiveFinite(value) {
    return Number.isFinite(value) && value > 0;
}
function capabilityIsUsable(report) {
    return report.state === "available" || report.state === "degraded";
}
function validateCapability(report, path, issues) {
    if (!hasText(report.capabilityId)) {
        issues.push(issue("CAPABILITY_ID_REQUIRED", `${path}.capabilityId`, "A capability report requires an id."));
    }
    if (capabilityIsUsable(report)) {
        if (!hasText(report.implementationId) || !isTimestamp(report.observedAt)) {
            issues.push(issue("CAPABILITY_OBSERVATION_REQUIRED", path, "Available or degraded hardware capabilities require an implementation and observation timestamp."));
        }
        if (report.evidence === null || report.source === "unknown") {
            issues.push(issue("CAPABILITY_EVIDENCE_REQUIRED", path, "Available or degraded hardware capabilities require adapter or physical measurement evidence."));
        }
    }
    if (report.source === "adapter" && report.evidence?.kind !== "adapter_negotiation") {
        issues.push(issue("ADAPTER_EVIDENCE_REQUIRED", `${path}.evidence`, "An adapter-sourced capability requires adapter negotiation evidence."));
    }
    if (report.source === "physical_measurement" &&
        report.evidence?.kind !== "physical_loopback") {
        issues.push(issue("PHYSICAL_EVIDENCE_REQUIRED", `${path}.evidence`, "A physically measured capability requires physical loopback evidence."));
    }
    if (report.state === "not_measured" &&
        (report.observedAt !== null || report.evidence !== null)) {
        issues.push(issue("NOT_MEASURED_HAS_EVIDENCE", path, "A not-measured state cannot contain measurement evidence or an observation time."));
    }
}
function findProfile(foundation, profileId) {
    return foundation.profiles.find((profile) => profile.id === profileId);
}
function endpointProblem(foundation, endpoint) {
    const device = foundation.devices.find((candidate) => candidate.id === endpoint.deviceId);
    if (!device)
        return "device";
    if (!device.selectedProfile)
        return "profile";
    const profile = findProfile(foundation, device.selectedProfile.profileId);
    if (!profile)
        return "profile";
    const port = profile.ports.find((candidate) => candidate.id === endpoint.portId);
    if (!port)
        return "port";
    if (endpoint.channel !== null &&
        (!Number.isInteger(endpoint.channel) ||
            endpoint.channel < 1 ||
            endpoint.channel > port.channelCount)) {
        return "channel";
    }
    return null;
}
function validateEndpoint(foundation, endpoint, path, issues) {
    const problem = endpointProblem(foundation, endpoint);
    if (problem) {
        issues.push(issue("HARDWARE_ENDPOINT_INVALID", `${path}.${problem}`, "The endpoint must reference a selected device profile, declared port, and valid one-based channel."));
    }
}
function findLoopbackEvidence(foundation, evidenceId) {
    return foundation.loopbackEvidence.find((evidence) => evidence.id === evidenceId);
}
function validateUniqueIds(values, path, issues) {
    const seen = new Set();
    values.forEach((value, index) => {
        if (!hasText(value.id) || seen.has(value.id)) {
            issues.push(issue("HARDWARE_ID_INVALID", `${path}[${index}].id`, "Hardware record ids must be non-empty and unique within their collection."));
        }
        seen.add(value.id);
    });
}
function validateHardwareFoundation(foundation) {
    const issues = [];
    if (foundation.schemaVersion !== contracts_1.HARDWARE_FOUNDATION_SCHEMA_VERSION) {
        issues.push(issue("HARDWARE_SCHEMA_UNSUPPORTED", "schemaVersion", `Expected hardware schema ${contracts_1.HARDWARE_FOUNDATION_SCHEMA_VERSION}.`));
    }
    if (!hasText(foundation.projectId)) {
        issues.push(issue("PROJECT_ID_REQUIRED", "projectId", "Hardware state requires a project id."));
    }
    if (!Number.isInteger(foundation.revision) || foundation.revision < 0) {
        issues.push(issue("HARDWARE_REVISION_INVALID", "revision", "Hardware revision must be a non-negative integer."));
    }
    if (!isTimestamp(foundation.createdAt) || !isTimestamp(foundation.updatedAt)) {
        issues.push(issue("HARDWARE_TIMESTAMP_INVALID", "createdAt", "Hardware creation and update times must be valid timestamps."));
    }
    validateUniqueIds(foundation.profiles, "profiles", issues);
    validateUniqueIds(foundation.devices, "devices", issues);
    validateUniqueIds(foundation.loopbackEvidence, "loopbackEvidence", issues);
    validateUniqueIds(foundation.patchRoutes, "patchRoutes", issues);
    validateUniqueIds(foundation.analogueInserts, "analogueInserts", issues);
    validateUniqueIds(foundation.digitalConsoleSync, "digitalConsoleSync", issues);
    validateUniqueIds(foundation.analogueConsoles, "analogueConsoles", issues);
    validateUniqueIds(foundation.timing.timecode, "timing.timecode", issues);
    validateUniqueIds(foundation.timing.metering.observations, "timing.metering.observations", issues);
    foundation.profiles.forEach((profile, profileIndex) => {
        const path = `profiles[${profileIndex}]`;
        validateUniqueIds(profile.ports, `${path}.ports`, issues);
        profile.ports.forEach((port, portIndex) => {
            if (!Number.isInteger(port.channelCount) || port.channelCount < 1) {
                issues.push(issue("PORT_CHANNEL_COUNT_INVALID", `${path}.ports[${portIndex}].channelCount`, "Hardware ports require a positive integer channel count."));
            }
        });
        if (profile.provenance.verification === "verified" &&
            (!hasText(profile.provenance.sourceReference) ||
                !hasText(profile.provenance.digest) ||
                !isTimestamp(profile.provenance.verifiedAt))) {
            issues.push(issue("PROFILE_VERIFICATION_EVIDENCE_REQUIRED", `${path}.provenance`, "A verified profile requires a source, SHA-256 digest and verification time."));
        }
    });
    foundation.devices.forEach((device, deviceIndex) => {
        const path = `devices[${deviceIndex}]`;
        if (device.selectedProfile) {
            const selected = device.selectedProfile;
            const profile = findProfile(foundation, selected.profileId);
            if (!profile) {
                issues.push(issue("SELECTED_PROFILE_MISSING", `${path}.selectedProfile.profileId`, "The selected device profile is not present in this foundation."));
            }
            else {
                const expectedDigest = profile.provenance.verification === "verified"
                    ? profile.provenance.digest
                    : null;
                if (selected.verificationAtSelection !== profile.provenance.verification ||
                    selected.profileDigestAtSelection !== expectedDigest) {
                    issues.push(issue("PROFILE_SELECTION_PROVENANCE_MISMATCH", `${path}.selectedProfile`, "The selection must snapshot the selected profile's verification and digest."));
                }
            }
            if (!isTimestamp(selected.selectedAt) || !hasText(selected.selectedByActorId)) {
                issues.push(issue("PROFILE_SELECTION_USER_EVIDENCE_REQUIRED", `${path}.selectedProfile`, "Profiles must be selected by an identified user action at a valid time."));
            }
        }
        if ((device.connection.state === "connected" || device.connection.state === "degraded") &&
            (!hasText(device.connection.adapterId) || !isTimestamp(device.connection.observedAt))) {
            issues.push(issue("DEVICE_CONNECTION_OBSERVATION_REQUIRED", `${path}.connection`, "A connected device requires an adapter and observation time."));
        }
        device.lastObservedCapabilities.forEach((report, reportIndex) => validateCapability(report, `${path}.lastObservedCapabilities[${reportIndex}]`, issues));
    });
    foundation.loopbackEvidence.forEach((evidence, evidenceIndex) => {
        const path = `loopbackEvidence[${evidenceIndex}]`;
        validateEndpoint(foundation, evidence.source, `${path}.source`, issues);
        validateEndpoint(foundation, evidence.return, `${path}.return`, issues);
        if (!isPositiveFinite(evidence.sampleRateHz) ||
            !Number.isInteger(evidence.repetitions) ||
            evidence.repetitions < 1 ||
            !hasText(evidence.procedureId) ||
            !hasText(evidence.performedByActorId) ||
            !isTimestamp(evidence.performedAt)) {
            issues.push(issue("LOOPBACK_EVIDENCE_INCOMPLETE", path, "Loopback evidence requires endpoints, sample rate, repetitions, procedure, actor and time."));
        }
    });
    foundation.patchRoutes.forEach((route, routeIndex) => {
        const path = `patchRoutes[${routeIndex}]`;
        validateEndpoint(foundation, route.source, `${path}.source`, issues);
        validateEndpoint(foundation, route.destination, `${path}.destination`, issues);
        if (route.verification.state === "physical_loopback_verified" &&
            !findLoopbackEvidence(foundation, route.verification.evidenceId)) {
            issues.push(issue("PATCH_LOOPBACK_EVIDENCE_MISSING", `${path}.verification`, "A physically verified patch must reference retained loopback evidence."));
        }
    });
    foundation.analogueInserts.forEach((insert, insertIndex) => {
        const path = `analogueInserts[${insertIndex}]`;
        validateEndpoint(foundation, insert.send, `${path}.send`, issues);
        validateEndpoint(foundation, insert.return, `${path}.return`, issues);
        if (insert.roundTripLatency.state === "measured") {
            const latency = insert.roundTripLatency;
            const evidence = findLoopbackEvidence(foundation, latency.evidenceId);
            const expectedMilliseconds = (latency.roundTripSamples / latency.sampleRateHz) * 1000;
            if (!evidence ||
                !evidence.measurementKinds.includes("round_trip_latency") ||
                evidence.sampleRateHz !== latency.sampleRateHz ||
                !Number.isInteger(latency.roundTripSamples) ||
                latency.roundTripSamples < 0 ||
                !Number.isFinite(latency.roundTripMilliseconds) ||
                Math.abs(latency.roundTripMilliseconds - expectedMilliseconds) > 1e-6) {
                issues.push(issue("LATENCY_PHYSICAL_EVIDENCE_REQUIRED", `${path}.roundTripLatency`, "Measured insert latency requires matching loopback evidence and sample-derived timing."));
            }
        }
        if (insert.levelCalibration.state === "measured") {
            const calibration = insert.levelCalibration;
            const evidence = findLoopbackEvidence(foundation, calibration.evidenceId);
            if (!evidence ||
                !evidence.measurementKinds.includes("analogue_level") ||
                !Number.isFinite(calibration.sentLevelDbfs) ||
                !Number.isFinite(calibration.measuredReturnLevelDbfs) ||
                !Number.isFinite(calibration.referenceLevelDbu) ||
                !Number.isFinite(calibration.correctionDb)) {
                issues.push(issue("ANALOGUE_CALIBRATION_EVIDENCE_REQUIRED", `${path}.levelCalibration`, "Measured analogue calibration requires retained physical level evidence."));
            }
        }
    });
    const timing = foundation.timing;
    validateCapability(timing.sampleClock.capability, "timing.sampleClock.capability", issues);
    validateCapability(timing.midiClock.capability, "timing.midiClock.capability", issues);
    validateCapability(timing.midiControl.capability, "timing.midiControl.capability", issues);
    validateCapability(timing.wordClock.capability, "timing.wordClock.capability", issues);
    validateCapability(timing.metering.capability, "timing.metering.capability", issues);
    if (timing.audioTransport.positionObservation?.precision === "audio_callback_observed" &&
        !hasText(timing.audioTransport.positionObservation.adapterId)) {
        issues.push(issue("AUDIO_CALLBACK_ADAPTER_REQUIRED", "timing.audioTransport.positionObservation", "Audio-callback position observations require the producing adapter id."));
    }
    if (timing.sampleClock.lockState !== "not_measured" &&
        (!capabilityIsUsable(timing.sampleClock.capability) ||
            !isTimestamp(timing.sampleClock.observedAt))) {
        issues.push(issue("SAMPLE_CLOCK_LOCK_EVIDENCE_REQUIRED", "timing.sampleClock", "A sample-clock lock claim requires a negotiated capability and observation time."));
    }
    if ((timing.sampleClock.measuredSampleRateHz !== null ||
        timing.sampleClock.measuredDriftPpm !== null) &&
        (!capabilityIsUsable(timing.sampleClock.capability) ||
            !isTimestamp(timing.sampleClock.observedAt))) {
        issues.push(issue("SAMPLE_CLOCK_MEASUREMENT_EVIDENCE_REQUIRED", "timing.sampleClock", "Measured sample rate or drift requires an observed clock capability."));
    }
    if (!["not_measured", "inactive"].includes(timing.midiClock.syncState) &&
        (!capabilityIsUsable(timing.midiClock.capability) ||
            !isTimestamp(timing.midiClock.observedAt))) {
        issues.push(issue("MIDI_CLOCK_SYNC_EVIDENCE_REQUIRED", "timing.midiClock", "MIDI clock synchronization requires a negotiated capability and observation time."));
    }
    if (timing.wordClock.lockState !== "not_measured" &&
        (!capabilityIsUsable(timing.wordClock.capability) ||
            !isTimestamp(timing.wordClock.observedAt))) {
        issues.push(issue("WORD_CLOCK_LOCK_EVIDENCE_REQUIRED", "timing.wordClock", "Word-clock lock requires a negotiated capability and observation time."));
    }
    timing.timecode.forEach((timecode, timecodeIndex) => {
        const path = `timing.timecode[${timecodeIndex}]`;
        validateCapability(timecode.capability, `${path}.capability`, issues);
        if (timecode.lockState === "locked" &&
            (!capabilityIsUsable(timecode.capability) ||
                !timecode.frameRate ||
                !hasText(timecode.observedAddress) ||
                !isTimestamp(timecode.observedAt))) {
            issues.push(issue("TIMECODE_LOCK_EVIDENCE_REQUIRED", path, "Locked LTC or MTC requires capability evidence, frame rate, address and time."));
        }
    });
    if (timing.metering.observations.length > 0 && !capabilityIsUsable(timing.metering.capability)) {
        issues.push(issue("METERING_CAPABILITY_REQUIRED", "timing.metering.observations", "Meter observations require a negotiated or physically measured metering capability."));
    }
    foundation.digitalConsoleSync.forEach((sync, syncIndex) => {
        const path = `digitalConsoleSync[${syncIndex}]`;
        validateCapability(sync.capability, `${path}.capability`, issues);
        if (sync.connection.state === "connected" && !capabilityIsUsable(sync.capability)) {
            issues.push(issue("CONSOLE_SYNC_CAPABILITY_REQUIRED", path, "Connected digital-console control sync requires a negotiated capability."));
        }
    });
    foundation.analogueConsoles.forEach((consoleRecord, consoleIndex) => {
        const path = `analogueConsoles[${consoleIndex}]`;
        validateCapability(consoleRecord.physicalAutomationCapability, `${path}.physicalAutomationCapability`, issues);
        if (consoleRecord.lastRecall.state === "user_confirmed" &&
            (!hasText(consoleRecord.lastRecall.confirmedByActorId) ||
                !isTimestamp(consoleRecord.lastRecall.confirmedAt))) {
            issues.push(issue("ANALOGUE_RECALL_CONFIRMATION_REQUIRED", `${path}.lastRecall`, "Analogue recall is only confirmed by an identified user at a valid time."));
        }
        consoleRecord.insertIds.forEach((insertId, insertIndex) => {
            if (!foundation.analogueInserts.some((insert) => insert.id === insertId)) {
                issues.push(issue("ANALOGUE_INSERT_MISSING", `${path}.insertIds[${insertIndex}]`, "The analogue console references an insert that is not retained."));
            }
        });
    });
    return issues;
}
