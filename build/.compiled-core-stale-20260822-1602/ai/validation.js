"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAiProviderConfiguration = validateAiProviderConfiguration;
exports.validateAiSettings = validateAiSettings;
exports.isLoopbackAiEndpoint = isLoopbackAiEndpoint;
const contracts_1 = require("./contracts");
const catalog_1 = require("./catalog");
function loopbackEndpoint(value) {
    try {
        const url = new URL(value);
        return (url.protocol === 'http:' || url.protocol === 'https:') && ['localhost', '127.0.0.1', '[::1]', '::1'].includes(url.hostname);
    }
    catch {
        return false;
    }
}
function validateAiProviderConfiguration(configuration) {
    const issues = [];
    if (!configuration.id.trim())
        issues.push({ path: 'id', message: 'Configuration id is required.' });
    if (!configuration.displayName.trim())
        issues.push({ path: 'displayName', message: 'Display name is required.' });
    const definition = (0, catalog_1.getAiProviderDefinition)(configuration.provider);
    if (!definition.execution.includes(configuration.execution)) {
        issues.push({ path: 'execution', message: `${definition.name} does not support ${configuration.execution}.` });
    }
    if (configuration.execution === 'localhost' && (!configuration.endpoint || !loopbackEndpoint(configuration.endpoint))) {
        issues.push({ path: 'endpoint', message: 'Direct local model access must use a loopback URL.' });
    }
    if (configuration.execution === 'secure_proxy' && configuration.endpoint && /^https?:\/\/(?!localhost|127\.0\.0\.1|\[::1\])/i.test(configuration.endpoint)) {
        issues.push({ path: 'endpoint', message: 'Secure-proxy configurations store the local proxy route, not the remote provider URL.' });
    }
    if (configuration.provider === 'poietek-local' && (configuration.endpoint || configuration.credentialReference)) {
        issues.push({ path: 'provider', message: 'The independent local assistant does not accept endpoints or credentials.' });
    }
    if (configuration.credentialReference && /(?:sk-|key|token)[A-Za-z0-9_\-]{12,}/i.test(configuration.credentialReference)) {
        issues.push({ path: 'credentialReference', message: 'Store only a secure-store reference name here, never the credential value.' });
    }
    if (configuration.execution !== 'in_app' && !configuration.model?.trim() && configuration.provider !== 'microsoft-copilot' && configuration.provider !== 'manus') {
        issues.push({ path: 'model', message: 'A model name is required for this adapter.' });
    }
    return { valid: issues.length === 0, issues };
}
function validateAiSettings(document) {
    const issues = [];
    if (document.schemaVersion !== contracts_1.AI_SETTINGS_SCHEMA_VERSION)
        issues.push({ path: 'schemaVersion', message: 'Unsupported AI settings schema.' });
    if (!document.configurations.some((configuration) => configuration.id === document.activeConfigurationId)) {
        issues.push({ path: 'activeConfigurationId', message: 'Active AI configuration does not exist.' });
    }
    const ids = new Set();
    document.configurations.forEach((configuration, index) => {
        if (ids.has(configuration.id))
            issues.push({ path: `configurations.${index}.id`, message: 'Configuration ids must be unique.' });
        ids.add(configuration.id);
        for (const issue of validateAiProviderConfiguration(configuration).issues) {
            issues.push({ path: `configurations.${index}.${issue.path}`, message: issue.message });
        }
        if (!document.remoteProvidersEnabled && configuration.enabled && configuration.execution !== 'in_app' && configuration.execution !== 'localhost') {
            issues.push({ path: `configurations.${index}.enabled`, message: 'Remote AI is disabled by the document privacy policy.' });
        }
    });
    return { valid: issues.length === 0, issues };
}
function isLoopbackAiEndpoint(value) {
    return loopbackEndpoint(value);
}
