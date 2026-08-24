"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLocalAiConfiguration = createLocalAiConfiguration;
exports.createDefaultAiSettings = createDefaultAiSettings;
const contracts_1 = require("./contracts");
function createLocalAiConfiguration(now = new Date()) {
    const timestamp = now.toISOString();
    return {
        id: 'poietek-local-default', provider: 'poietek-local', displayName: 'Poietek Studio Brain', endpoint: null,
        model: 'poietek-rules-1', credentialReference: null, execution: 'in_app', enabled: true,
        allowedData: ['project_metadata', 'audio_features', 'rights'], createdAt: timestamp, updatedAt: timestamp,
    };
}
function createDefaultAiSettings(now = new Date()) {
    const local = createLocalAiConfiguration(now);
    return {
        schemaVersion: contracts_1.AI_SETTINGS_SCHEMA_VERSION,
        activeConfigurationId: local.id,
        remoteProvidersEnabled: false,
        requireConsentEveryRemoteRequest: true,
        retainRemoteConversationHistory: false,
        configurations: [local],
        updatedAt: now.toISOString(),
    };
}
