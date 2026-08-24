"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.negotiateAdapterCapabilities = negotiateAdapterCapabilities;
const defaults_1 = require("./defaults");
function hasText(value) {
    return value.trim().length > 0;
}
/**
 * Reconciles an adapter's declared probe surface with real probe observations.
 * Missing observations stay `not_measured`; declarations alone never become
 * runtime availability claims.
 */
function negotiateAdapterCapabilities(descriptor, observations, requestedCapabilityIds) {
    const probeable = new Set(descriptor.probeableCapabilityIds);
    const observationsByCapability = new Map(observations.map((observation) => [observation.capabilityId, observation]));
    return [...new Set(requestedCapabilityIds)].map((capabilityId) => {
        if (!probeable.has(capabilityId)) {
            return (0, defaults_1.unavailableHardwareCapability)(capabilityId, "ADAPTER_CANNOT_PROBE_CAPABILITY", `Adapter ${descriptor.adapterId} does not declare a probe for ${capabilityId}.`);
        }
        const observation = observationsByCapability.get(capabilityId);
        if (!observation) {
            return (0, defaults_1.notMeasuredHardwareCapability)(capabilityId, `Adapter ${descriptor.adapterId} returned no runtime observation.`);
        }
        if (!hasText(observation.probeId) ||
            !hasText(observation.observedAt) ||
            Number.isNaN(Date.parse(observation.observedAt))) {
            return (0, defaults_1.notMeasuredHardwareCapability)(capabilityId, `Adapter ${descriptor.adapterId} returned an observation without valid probe evidence.`);
        }
        if (observation.state === "not_measured") {
            return {
                ...(0, defaults_1.notMeasuredHardwareCapability)(capabilityId, observation.message ?? "The adapter could not measure this capability."),
                reasonCode: observation.reasonCode ?? "NOT_MEASURED",
                limitations: [...observation.limitations],
            };
        }
        if (observation.state === "unavailable") {
            return {
                capabilityId,
                state: "unavailable",
                source: "adapter",
                implementationId: descriptor.implementationId,
                observedAt: observation.observedAt,
                reasonCode: observation.reasonCode ?? "ADAPTER_REPORTED_UNAVAILABLE",
                message: observation.message,
                limitations: [...observation.limitations],
                evidence: {
                    kind: "adapter_negotiation",
                    adapterId: descriptor.adapterId,
                    probeId: observation.probeId,
                },
            };
        }
        return {
            capabilityId,
            state: observation.state,
            source: "adapter",
            implementationId: descriptor.implementationId,
            observedAt: observation.observedAt,
            reasonCode: observation.reasonCode,
            message: observation.message,
            limitations: [...observation.limitations],
            evidence: {
                kind: "adapter_negotiation",
                adapterId: descriptor.adapterId,
                probeId: observation.probeId,
            },
        };
    });
}
