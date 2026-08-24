"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deriveAutomaticRackSignalFlow = deriveAutomaticRackSignalFlow;
exports.insertRackModuleByRole = insertRackModuleByRole;
const automaticSignals = ['note', 'audio'];
const roleOrder = {
    player: 0,
    instrument: 1,
    effect: 2,
    utility: 3,
    mixer: 4,
    controller: 5,
};
function hasSignal(signals, signal) {
    return signals.includes(signal);
}
function deriveAutomaticRackSignalFlow(modules) {
    const topLevelModules = modules.filter((module) => !module.groupId);
    const connections = [];
    let unconnectedOutputCount = 0;
    topLevelModules.forEach((source, sourceIndex) => {
        automaticSignals.forEach((signal) => {
            if (!hasSignal(source.outputs, signal))
                return;
            const destination = topLevelModules
                .slice(sourceIndex + 1)
                .find((candidate) => hasSignal(candidate.inputs, signal));
            if (!destination) {
                unconnectedOutputCount += 1;
                return;
            }
            connections.push({
                id: `auto:${source.id}:${signal}:${destination.id}`,
                sourceModuleId: source.id,
                sourceTitle: source.title,
                destinationModuleId: destination.id,
                destinationTitle: destination.title,
                signal,
                mode: 'automatic_logical',
            });
        });
    });
    return {
        modules: topLevelModules,
        connections,
        unconnectedOutputCount,
        note: 'Logical routing preview only. Native DSP activation requires an observed audio-engine route.',
    };
}
function insertRackModuleByRole(modules, module) {
    if (module.groupId)
        return [...modules, module];
    const next = [...modules];
    const moduleRank = roleOrder[module.role];
    const insertionIndex = next.findIndex((candidate) => {
        if (candidate.groupId)
            return false;
        return roleOrder[candidate.role] > moduleRank;
    });
    if (insertionIndex < 0)
        next.push(module);
    else
        next.splice(insertionIndex, 0, module);
    return next;
}
