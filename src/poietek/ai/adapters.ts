import type {AiAssistantRequest, AiAssistantResponse, AiProviderAdapter, AiProviderConfiguration, AiProviderHealth} from './contracts';
import {isLoopbackAiEndpoint, validateAiProviderConfiguration} from './validation';
import {runLocalStudioAssistant} from './localAssistant';

export class LocalStudioAiAdapter implements AiProviderAdapter {
  constructor(readonly configuration: AiProviderConfiguration) {}
  async health(): Promise<AiProviderHealth> {
    return {state: 'available', message: 'Independent offline assistant is ready.', checkedAt: new Date().toISOString()};
  }
  async complete(request: AiAssistantRequest): Promise<AiAssistantResponse> {
    return runLocalStudioAssistant(request);
  }
}

export class OllamaAiAdapter implements AiProviderAdapter {
  constructor(readonly configuration: AiProviderConfiguration, private readonly request: typeof fetch = fetch) {
    const validation = validateAiProviderConfiguration(configuration);
    if (!validation.valid) throw new Error(validation.issues.map((issue) => issue.message).join(' '));
    if (!configuration.endpoint || !isLoopbackAiEndpoint(configuration.endpoint)) throw new Error('Ollama requires a loopback endpoint.');
  }
  private url(path: string): string {
    return `${this.configuration.endpoint!.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  }
  async health(): Promise<AiProviderHealth> {
    const checkedAt = new Date().toISOString();
    const started = performance.now();
    try {
      const response = await this.request(this.url('tags'), {method: 'GET'});
      return {state: response.ok ? 'available' : 'unavailable', message: response.ok ? 'Ollama is reachable.' : `Ollama returned HTTP ${response.status}.`, checkedAt, latencyMs: performance.now() - started};
    } catch (error) {
      return {state: 'unavailable', message: error instanceof Error ? error.message : String(error), checkedAt, latencyMs: performance.now() - started};
    }
  }
  async complete(request: AiAssistantRequest): Promise<AiAssistantResponse> {
    const response = await this.request(this.url('chat'), {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({model: this.configuration.model, stream: false, messages: [
        {role: 'system', content: 'You are an optional Poietek studio adviser. Never claim measurements, rights, external acceptance, hardware capabilities, or project changes you cannot prove. Separate requirements, technical guidance, and creative options.'},
        {role: 'user', content: JSON.stringify({prompt: request.prompt, mode: request.mode, project: {title: request.context.project.title, sampleRate: request.context.project.settings.sampleRate, trackCount: request.context.project.tracks.length, assetCount: request.context.project.assets.length}})},
      ]}),
    });
    if (!response.ok) throw new Error(`Ollama returned HTTP ${response.status}.`);
    const payload = await response.json() as {message?: {content?: string}};
    const content = payload.message?.content?.trim();
    if (!content) throw new Error('Ollama returned no assistant content.');
    return {requestId: request.id, providerId: this.configuration.id, model: this.configuration.model!, generatedAt: new Date().toISOString(), summary: content, findings: [], usedRemoteProvider: false, projectChanged: false, unavailableReason: null};
  }
}

export class SecureProxyAiAdapter implements AiProviderAdapter {
  constructor(readonly configuration: AiProviderConfiguration, private readonly request: typeof fetch = fetch) {
    const validation = validateAiProviderConfiguration(configuration);
    if (!validation.valid) throw new Error(validation.issues.map((issue) => issue.message).join(' '));
  }
  private proxyRoute(suffix: string): string {
    const base = this.configuration.endpoint?.trim() || '/poietek-api/ai';
    return `${base.replace(/\/$/, '')}/${suffix}`;
  }
  async health(): Promise<AiProviderHealth> {
    const checkedAt = new Date().toISOString();
    const started = performance.now();
    try {
      const response = await this.request(this.proxyRoute('health'), {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({configurationId: this.configuration.id, provider: this.configuration.provider, credentialReference: this.configuration.credentialReference})});
      if (!response.ok) return {state: response.status === 404 ? 'configuration_required' : 'unavailable', message: response.status === 404 ? 'Secure AI proxy is not installed in this runtime.' : `Secure proxy returned HTTP ${response.status}.`, checkedAt, latencyMs: performance.now() - started};
      return {state: 'available', message: 'Secure provider adapter is reachable.', checkedAt, latencyMs: performance.now() - started};
    } catch (error) {
      return {state: 'unavailable', message: error instanceof Error ? error.message : String(error), checkedAt, latencyMs: performance.now() - started};
    }
  }
  async complete(request: AiAssistantRequest): Promise<AiAssistantResponse> {
    if (!request.remoteConsent) throw new Error('Remote AI request consent is required.');
    const response = await this.request(this.proxyRoute('complete'), {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({configurationId: this.configuration.id, provider: this.configuration.provider, model: this.configuration.model, credentialReference: this.configuration.credentialReference, request})});
    if (!response.ok) throw new Error(`Secure AI proxy returned HTTP ${response.status}.`);
    const payload = await response.json() as AiAssistantResponse;
    return {...payload, usedRemoteProvider: true, projectChanged: false};
  }
}
