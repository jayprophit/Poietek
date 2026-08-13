import {useEffect, useMemo, useState} from 'react';
import {
  AI_PROVIDER_CATALOG,
  AiSettingsRepository,
  LocalStudioAiAdapter,
  OllamaAiAdapter,
  SecureProxyAiAdapter,
  createDefaultAiSettings,
  getAiProviderDefinition,
  validateAiProviderConfiguration,
  type AiAssistantMode,
  type AiAssistantResponse,
  type AiExecutionLocation,
  type AiProviderConfiguration,
  type AiProviderHealth,
  type AiProviderKind,
  type AiSettingsDocument,
} from '../ai';
import {usePoietekRuntime} from './PoietekRuntimeProvider';
import './PoietekAiCenter.css';

const MODES: Array<{id: AiAssistantMode; label: string; detail: string}> = [
  {id: 'project', label: 'Project', detail: 'state · next actions'},
  {id: 'arrangement', label: 'Arrange', detail: 'structure · transitions'},
  {id: 'mix', label: 'Mix', detail: 'balance · measured health'},
  {id: 'sampling', label: 'Sample', detail: 'slices · mappings'},
  {id: 'release', label: 'Release', detail: 'preflight · delivery'},
  {id: 'rights', label: 'Rights', detail: 'credits · evidence'},
  {id: 'learning', label: 'Learn', detail: 'guided production'},
];

function createId(prefix: string): string {
  return `${prefix}-${typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
}

function createConfiguration(provider: AiProviderKind): AiProviderConfiguration {
  const definition = getAiProviderDefinition(provider);
  const timestamp = new Date().toISOString();
  const execution = definition.execution[0];
  return {
    id: createId(provider), provider, displayName: definition.name,
    endpoint: provider === 'ollama' ? definition.defaultEndpoint : execution === 'secure_proxy' ? '/poietek-api/ai' : definition.defaultEndpoint,
    model: provider === 'ollama' ? 'gemma3' : provider === 'poietek-local' ? 'poietek-rules-1' : '',
    credentialReference: definition.credentialRule === 'none' || definition.credentialRule === 'localhost_only' ? null : `${provider.toUpperCase().replaceAll('-', '_')}_API_KEY`,
    execution, enabled: execution === 'in_app' || execution === 'localhost', allowedData: ['project_metadata'], createdAt: timestamp, updatedAt: timestamp,
  };
}

function stateLabel(configuration: AiProviderConfiguration | undefined, remoteEnabled: boolean): string {
  if (!configuration) return 'Not configured';
  if (!configuration.enabled) return 'Disabled';
  if (configuration.execution === 'in_app') return 'Offline ready';
  if (configuration.execution === 'localhost') return 'Local service';
  return remoteEnabled ? 'Secure adapter configured' : 'Remote AI disabled';
}

export function PoietekAiCenter() {
  const {project, status: runtimeStatus} = usePoietekRuntime();
  const repository = useMemo(() => new AiSettingsRepository(), []);
  const [settings, setSettings] = useState<AiSettingsDocument>(() => createDefaultAiSettings());
  const [selectedProvider, setSelectedProvider] = useState<AiProviderKind>('poietek-local');
  const [mode, setMode] = useState<AiAssistantMode>('project');
  const [prompt, setPrompt] = useState('What should I work on next in this project?');
  const [response, setResponse] = useState<AiAssistantResponse | null>(null);
  const [health, setHealth] = useState<AiProviderHealth | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Private defaults loaded.');
  const [remoteConsent, setRemoteConsent] = useState(false);

  useEffect(() => {
    let active = true;
    repository.load().then((loaded) => {
      if (!active) return;
      setSettings(loaded);
      const selected = loaded.configurations.find((configuration) => configuration.id === loaded.activeConfigurationId);
      if (selected) setSelectedProvider(selected.provider);
      setMessage('AI choices loaded from private local storage.');
    });
    return () => { active = false; };
  }, [repository]);

  const activeConfiguration = settings.configurations.find((configuration) => configuration.id === settings.activeConfigurationId);
  const selectedConfiguration = settings.configurations.find((configuration) => configuration.provider === selectedProvider);
  const selectedDefinition = getAiProviderDefinition(selectedProvider);
  const validation = selectedConfiguration ? validateAiProviderConfiguration(selectedConfiguration) : null;

  const updateConfiguration = (changes: Partial<AiProviderConfiguration>) => {
    if (!selectedConfiguration) return;
    setSettings((current) => ({...current, configurations: current.configurations.map((configuration) => configuration.id === selectedConfiguration.id ? {...configuration, ...changes, updatedAt: new Date().toISOString()} : configuration), updatedAt: new Date().toISOString()}));
  };

  const configureSelected = () => {
    if (selectedConfiguration) {
      if (!selectedConfiguration.enabled) {
        setMessage('Enable this route before making it active.');
        return;
      }
      setSettings((current) => ({...current, activeConfigurationId: selectedConfiguration.id}));
      return;
    }
    const configuration = createConfiguration(selectedProvider);
    setSettings((current) => ({...current, configurations: [...current.configurations, configuration], updatedAt: new Date().toISOString()}));
    setMessage(`${configuration.displayName} settings created. Enable the route after completing its safe configuration.`);
  };

  const saveSettings = async () => {
    setBusy(true);
    try {
      await repository.save(settings);
      setMessage('AI choices saved locally. No credential values were stored.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally { setBusy(false); }
  };

  const makeAdapter = () => {
    if (!activeConfiguration) throw new Error('Choose an AI configuration first.');
    if (!activeConfiguration.enabled) throw new Error('This AI route is disabled. Enable and save it before use.');
    if (!settings.remoteProvidersEnabled && !['in_app', 'localhost'].includes(activeConfiguration.execution)) throw new Error('Remote AI is disabled in the privacy controls.');
    if (activeConfiguration.provider === 'poietek-local') return new LocalStudioAiAdapter(activeConfiguration);
    if (activeConfiguration.provider === 'ollama') return new OllamaAiAdapter(activeConfiguration);
    return new SecureProxyAiAdapter(activeConfiguration);
  };

  const checkConnection = async () => {
    setBusy(true); setHealth(null);
    try { setHealth(await makeAdapter().health()); }
    catch (error) { setHealth({state: 'error', message: error instanceof Error ? error.message : String(error), checkedAt: new Date().toISOString()}); }
    finally { setBusy(false); }
  };

  const askAssistant = async () => {
    if (!project) return;
    setBusy(true); setResponse(null);
    try {
      const result = await makeAdapter().complete({id: createId('assistant-request'), mode, prompt, context: {project, selectedTrackIds: [], selectedClipIds: [], playheadSeconds: null}, requestedData: activeConfiguration?.allowedData ?? ['project_metadata'], remoteConsent});
      setResponse(result);
      setMessage(result.usedRemoteProvider ? 'Remote response returned through the secure adapter.' : 'Local project analysis complete.');
    } catch (error) { setMessage(error instanceof Error ? error.message : String(error)); }
    finally { setBusy(false); }
  };

  return (
    <main className="poietek-ai" aria-label="Poietek independent AI studio">
      <section className="poietek-ai-hero"><div><p>Independent intelligence · optional providers</p><h1>Your studio brain stays yours.</h1><span>Poietek works offline by itself. External models are optional, user-selected and capability-gated.</span></div><dl><div><dt>Independent core</dt><dd>Ready offline</dd></div><div><dt>Active route</dt><dd>{activeConfiguration?.displayName ?? 'None'}</dd></div><div><dt>Project access</dt><dd>{project ? `${project.tracks.length} tracks · ${project.assets.length} assets` : runtimeStatus}</dd></div></dl></section>
      <div className="poietek-ai-grid">
        <section className="poietek-ai-assistant" aria-labelledby="assistant-heading">
          <header><div><p>Studio assistant</p><h2 id="assistant-heading">Ask the current project</h2></div><span className={activeConfiguration?.execution === 'in_app' ? 'is-local' : ''}>{activeConfiguration?.execution.replaceAll('_', ' ') ?? 'not selected'}</span></header>
          <div className="poietek-ai-modes" role="group" aria-label="Assistant mode">{MODES.map((candidate) => <button key={candidate.id} type="button" className={mode === candidate.id ? 'is-active' : ''} onClick={() => setMode(candidate.id)}><strong>{candidate.label}</strong><small>{candidate.detail}</small></button>)}</div>
          <label className="poietek-ai-prompt">Question or production goal<textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={4} /></label>
          {activeConfiguration && !['in_app', 'localhost'].includes(activeConfiguration.execution) ? <label className="poietek-ai-consent"><input type="checkbox" checked={remoteConsent} onChange={(event) => setRemoteConsent(event.target.checked)} />Send the allowed project fields to this provider for this request.</label> : null}
          <div className="poietek-ai-actions"><button type="button" disabled={busy || !project || !prompt.trim()} onClick={askAssistant}>Analyze project</button><button type="button" className="is-secondary" disabled={busy} onClick={checkConnection}>Check route</button></div>
          <p className="poietek-ai-message" role="status">{message}</p>
          {health ? <div className={`poietek-ai-health is-${health.state}`}><strong>{health.state.replaceAll('_', ' ')}</strong><span>{health.message}</span></div> : null}
          {response ? <div className="poietek-ai-response"><header><strong>{response.summary}</strong><small>{response.usedRemoteProvider ? 'External provider' : 'Poietek local brain'} · project unchanged</small></header>{response.findings.map((item) => <article key={item.id} className={`is-${item.severity}`}><div><span>{item.category.replaceAll('_', ' ')}</span><strong>{item.title}</strong></div><p>{item.detail}</p><ul>{item.evidence.map((evidence) => <li key={evidence}>{evidence}</li>)}</ul>{item.proposedAction ? <footer>Preview path: {item.proposedAction}</footer> : null}</article>)}</div> : null}
        </section>
        <aside className="poietek-ai-providers" aria-labelledby="providers-heading">
          <header><div><p>Model router</p><h2 id="providers-heading">Choose the intelligence</h2></div><button type="button" onClick={saveSettings} disabled={busy}>Save locally</button></header>
          <label className="poietek-ai-remote-toggle"><input type="checkbox" checked={settings.remoteProvidersEnabled} onChange={(event) => setSettings((current) => ({...current, remoteProvidersEnabled: event.target.checked, configurations: current.configurations.map((configuration) => ['in_app', 'localhost'].includes(configuration.execution) ? configuration : {...configuration, enabled: event.target.checked && configuration.enabled}), updatedAt: new Date().toISOString()}))} />Allow configured remote AI providers</label>
          <div className="poietek-ai-provider-list">{AI_PROVIDER_CATALOG.map((provider) => { const configuration = settings.configurations.find((candidate) => candidate.provider === provider.id); return <button key={provider.id} type="button" className={selectedProvider === provider.id ? 'is-active' : ''} onClick={() => setSelectedProvider(provider.id)}><span><strong>{provider.name}</strong><small>{provider.summary}</small></span><em>{stateLabel(configuration, settings.remoteProvidersEnabled)}</em></button>; })}</div>
          <section className="poietek-ai-provider-editor"><header><div><p>{selectedDefinition.family.replaceAll('_', ' ')}</p><h3>{selectedDefinition.name}</h3></div><button type="button" onClick={configureSelected}>{selectedConfiguration ? selectedConfiguration.id === settings.activeConfigurationId ? 'Active' : 'Use route' : 'Configure'}</button></header><p>{selectedDefinition.summary}</p>
            {selectedConfiguration && selectedConfiguration.provider !== 'poietek-local' ? <div className="poietek-ai-fields"><label>Display name<input value={selectedConfiguration.displayName} onChange={(event) => updateConfiguration({displayName: event.target.value})} /></label><label>Execution<select value={selectedConfiguration.execution} onChange={(event) => updateConfiguration({execution: event.target.value as AiExecutionLocation})}>{selectedDefinition.execution.map((execution) => <option key={execution} value={execution}>{execution.replaceAll('_', ' ')}</option>)}</select></label><label>Endpoint or local proxy route<input value={selectedConfiguration.endpoint ?? ''} onChange={(event) => updateConfiguration({endpoint: event.target.value || null})} placeholder={selectedDefinition.defaultEndpoint ?? '/poietek-api/ai'} /></label><label>Model<input value={selectedConfiguration.model ?? ''} onChange={(event) => updateConfiguration({model: event.target.value || null})} placeholder="Provider model id" /></label>{selectedDefinition.credentialRule !== 'localhost_only' ? <label>Secure credential reference<input value={selectedConfiguration.credentialReference ?? ''} onChange={(event) => updateConfiguration({credentialReference: event.target.value || null})} placeholder="NAME_IN_SECURE_STORE" /><small>Reference name only. Never paste an API key here.</small></label> : null}<label className="is-checkbox"><input type="checkbox" checked={selectedConfiguration.enabled} onChange={(event) => updateConfiguration({enabled: event.target.checked})} />Enable this route</label></div> : null}
            {validation && !validation.valid ? <ul className="poietek-ai-validation">{validation.issues.map((issue) => <li key={`${issue.path}-${issue.message}`}>{issue.message}</li>)}</ul> : null}<ul className="poietek-ai-notes">{selectedDefinition.notes.map((note) => <li key={note}>{note}</li>)}</ul>{selectedDefinition.documentationUrl ? <a href={selectedDefinition.documentationUrl} target="_blank" rel="noreferrer">Provider documentation</a> : null}</section>
        </aside>
      </div>
    </main>
  );
}
