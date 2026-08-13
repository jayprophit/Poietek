import {AI_SETTINGS_SCHEMA_VERSION, type AiProviderConfiguration, type AiSettingsDocument} from './contracts';

export function createLocalAiConfiguration(now = new Date()): AiProviderConfiguration {
  const timestamp = now.toISOString();
  return {
    id: 'poietek-local-default', provider: 'poietek-local', displayName: 'Poietek Studio Brain', endpoint: null,
    model: 'poietek-rules-1', credentialReference: null, execution: 'in_app', enabled: true,
    allowedData: ['project_metadata', 'audio_features', 'rights'], createdAt: timestamp, updatedAt: timestamp,
  };
}

export function createDefaultAiSettings(now = new Date()): AiSettingsDocument {
  const local = createLocalAiConfiguration(now);
  return {
    schemaVersion: AI_SETTINGS_SCHEMA_VERSION,
    activeConfigurationId: local.id,
    remoteProvidersEnabled: false,
    requireConsentEveryRemoteRequest: true,
    retainRemoteConversationHistory: false,
    configurations: [local],
    updatedAt: now.toISOString(),
  };
}
