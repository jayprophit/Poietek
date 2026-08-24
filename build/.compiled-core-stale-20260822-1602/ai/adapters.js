"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecureProxyAiAdapter = exports.OllamaAiAdapter = exports.LocalStudioAiAdapter = void 0;
const validation_1 = require("./validation");
const localAssistant_1 = require("./localAssistant");
class LocalStudioAiAdapter {
    configuration;
    constructor(configuration) {
        this.configuration = configuration;
    }
    async health() {
        return { state: 'available', message: 'Independent offline assistant is ready.', checkedAt: new Date().toISOString() };
    }
    async complete(request) {
        return (0, localAssistant_1.runLocalStudioAssistant)(request);
    }
}
exports.LocalStudioAiAdapter = LocalStudioAiAdapter;
class OllamaAiAdapter {
    configuration;
    request;
    constructor(configuration, request = fetch) {
        this.configuration = configuration;
        this.request = request;
        const validation = (0, validation_1.validateAiProviderConfiguration)(configuration);
        if (!validation.valid)
            throw new Error(validation.issues.map((issue) => issue.message).join(' '));
        if (!configuration.endpoint || !(0, validation_1.isLoopbackAiEndpoint)(configuration.endpoint))
            throw new Error('Ollama requires a loopback endpoint.');
    }
    url(path) {
        return `${this.configuration.endpoint.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
    }
    async health() {
        const checkedAt = new Date().toISOString();
        const started = performance.now();
        try {
            const response = await this.request(this.url('tags'), { method: 'GET' });
            return { state: response.ok ? 'available' : 'unavailable', message: response.ok ? 'Ollama is reachable.' : `Ollama returned HTTP ${response.status}.`, checkedAt, latencyMs: performance.now() - started };
        }
        catch (error) {
            return { state: 'unavailable', message: error instanceof Error ? error.message : String(error), checkedAt, latencyMs: performance.now() - started };
        }
    }
    async complete(request) {
        const response = await this.request(this.url('chat'), {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: this.configuration.model, stream: false, messages: [
                    { role: 'system', content: 'You are an optional Poietek studio adviser. Never claim measurements, rights, external acceptance, hardware capabilities, or project changes you cannot prove. Separate requirements, technical guidance, and creative options.' },
                    { role: 'user', content: JSON.stringify({ prompt: request.prompt, mode: request.mode, project: { title: request.context.project.title, sampleRate: request.context.project.settings.sampleRate, trackCount: request.context.project.tracks.length, assetCount: request.context.project.assets.length } }) },
                ] }),
        });
        if (!response.ok)
            throw new Error(`Ollama returned HTTP ${response.status}.`);
        const payload = await response.json();
        const content = payload.message?.content?.trim();
        if (!content)
            throw new Error('Ollama returned no assistant content.');
        return { requestId: request.id, providerId: this.configuration.id, model: this.configuration.model, generatedAt: new Date().toISOString(), summary: content, findings: [], usedRemoteProvider: false, projectChanged: false, unavailableReason: null };
    }
}
exports.OllamaAiAdapter = OllamaAiAdapter;
class SecureProxyAiAdapter {
    configuration;
    request;
    constructor(configuration, request = fetch) {
        this.configuration = configuration;
        this.request = request;
        const validation = (0, validation_1.validateAiProviderConfiguration)(configuration);
        if (!validation.valid)
            throw new Error(validation.issues.map((issue) => issue.message).join(' '));
    }
    proxyRoute(suffix) {
        const base = this.configuration.endpoint?.trim() || '/poietek-api/ai';
        return `${base.replace(/\/$/, '')}/${suffix}`;
    }
    async health() {
        const checkedAt = new Date().toISOString();
        const started = performance.now();
        try {
            const response = await this.request(this.proxyRoute('health'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ configurationId: this.configuration.id, provider: this.configuration.provider, credentialReference: this.configuration.credentialReference }) });
            if (!response.ok)
                return { state: response.status === 404 ? 'configuration_required' : 'unavailable', message: response.status === 404 ? 'Secure AI proxy is not installed in this runtime.' : `Secure proxy returned HTTP ${response.status}.`, checkedAt, latencyMs: performance.now() - started };
            return { state: 'available', message: 'Secure provider adapter is reachable.', checkedAt, latencyMs: performance.now() - started };
        }
        catch (error) {
            return { state: 'unavailable', message: error instanceof Error ? error.message : String(error), checkedAt, latencyMs: performance.now() - started };
        }
    }
    async complete(request) {
        if (!request.remoteConsent)
            throw new Error('Remote AI request consent is required.');
        const response = await this.request(this.proxyRoute('complete'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ configurationId: this.configuration.id, provider: this.configuration.provider, model: this.configuration.model, credentialReference: this.configuration.credentialReference, request }) });
        if (!response.ok)
            throw new Error(`Secure AI proxy returned HTTP ${response.status}.`);
        const payload = await response.json();
        return { ...payload, usedRemoteProvider: true, projectChanged: false };
    }
}
exports.SecureProxyAiAdapter = SecureProxyAiAdapter;
