import assert from 'node:assert/strict';
import test from 'node:test';

import {AI_PROVIDER_CATALOG} from './.compiled-core/ai/catalog.js';
import {createDefaultAiSettings} from './.compiled-core/ai/defaults.js';
import {runLocalStudioAssistant} from './.compiled-core/ai/localAssistant.js';
import {validateAiProviderConfiguration, validateAiSettings} from './.compiled-core/ai/validation.js';
import {createBlankProject} from './.compiled-core/domain/projectFactory.js';

test('independent studio brain is the private offline default', () => {
  const settings = createDefaultAiSettings(new Date('2026-08-13T00:00:00.000Z'));
  assert.equal(settings.remoteProvidersEnabled, false);
  assert.equal(settings.requireConsentEveryRemoteRequest, true);
  assert.equal(settings.retainRemoteConversationHistory, false);
  assert.equal(settings.configurations[0].provider, 'poietek-local');
  assert.equal(settings.configurations[0].execution, 'in_app');
  assert.equal(validateAiSettings(settings).valid, true);
});

test('catalogue includes every requested provider family plus local and custom routes', () => {
  const ids = new Set(AI_PROVIDER_CATALOG.map((provider) => provider.id));
  for (const expected of ['poietek-local', 'openai', 'anthropic', 'google-gemini', 'xai', 'deepseek', 'moonshot-kimi', 'microsoft-copilot', 'manus', 'hugging-face', 'ollama', 'openai-compatible', 'custom-module']) {
    assert.equal(ids.has(expected), true, `missing ${expected}`);
  }
  assert.equal(AI_PROVIDER_CATALOG.find((provider) => provider.id === 'openai').supportsDirectBrowserCalls, false);
  assert.equal(AI_PROVIDER_CATALOG.find((provider) => provider.id === 'google-gemini').supportsDirectBrowserCalls, false);
});

test('local assistant uses the canonical project and never pretends to change it', () => {
  const project = createBlankProject('Evidence Session');
  const response = runLocalStudioAssistant({
    id: 'request-1', mode: 'mix', prompt: 'How should I mix and release this?',
    context: {project, selectedTrackIds: [], selectedClipIds: [], playheadSeconds: null},
    requestedData: ['project_metadata'], remoteConsent: false,
  }, new Date('2026-08-13T01:00:00.000Z'));
  assert.equal(response.usedRemoteProvider, false);
  assert.equal(response.projectChanged, false);
  assert.ok(response.findings.some((finding) => finding.id === 'empty-arrangement'));
  assert.ok(response.findings.some((finding) => finding.id === 'gain-staging'));
  assert.ok(response.findings.some((finding) => /LUFS or True Peak/.test(finding.detail)));
});

test('provider validation rejects raw secrets and non-loopback local endpoints', () => {
  const base = {
    id: 'ollama-test', provider: 'ollama', displayName: 'Local test', endpoint: 'https://remote.example/api', model: 'model', credentialReference: null,
    execution: 'localhost', enabled: true, allowedData: ['project_metadata'], createdAt: '2026-08-13T00:00:00.000Z', updatedAt: '2026-08-13T00:00:00.000Z',
  };
  assert.equal(validateAiProviderConfiguration(base).valid, false);
  const rawCredentialValue = ['sk', 'this-is-a-raw-secret-value'].join('-');
  const remote = {...base, id: 'remote-test', provider: 'openai', endpoint: '/poietek-api/ai', execution: 'secure_proxy', credentialReference: rawCredentialValue};
  const validation = validateAiProviderConfiguration(remote);
  assert.equal(validation.valid, false);
  assert.ok(validation.issues.some((issue) => /never the credential value/i.test(issue.message)));
});

test('remote configurations cannot be enabled while global remote AI is disabled', () => {
  const settings = createDefaultAiSettings(new Date('2026-08-13T00:00:00.000Z'));
  const remote = {
    id: 'openai-secure', provider: 'openai', displayName: 'OpenAI secure route', endpoint: '/poietek-api/ai', model: 'chosen-by-user', credentialReference: 'OPENAI_API_KEY',
    execution: 'secure_proxy', enabled: true, allowedData: ['project_metadata'], createdAt: settings.updatedAt, updatedAt: settings.updatedAt,
  };
  const invalid = {...settings, activeConfigurationId: remote.id, configurations: [...settings.configurations, remote]};
  assert.equal(validateAiSettings(invalid).valid, false);
  assert.ok(validateAiSettings(invalid).issues.some((issue) => /Remote AI is disabled/.test(issue.message)));
});
