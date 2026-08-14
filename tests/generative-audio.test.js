import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const {
  GENERATIVE_AUDIO_PROVIDERS,
  GENERATIVE_AUDIO_WORKFLOWS,
  createGenerativeAudioDraft,
  createUnavailableGenerativeAudioRoute,
  planGenerativeAudioDraft,
  validateGenerativeAudioCatalog,
  validateGenerativeAudioDraft,
} = await import('../tests/.compiled-core/ai/generativeAudio.js');

test('optional generative-audio catalogue covers requested reference families without enabling any route', () => {
  assert.equal(GENERATIVE_AUDIO_PROVIDERS.length, 13);
  assert.equal(GENERATIVE_AUDIO_WORKFLOWS.length, 9);
  assert.deepEqual(validateGenerativeAudioCatalog(), []);
  assert.ok(GENERATIVE_AUDIO_PROVIDERS.every((provider) => provider.defaultEnabled === false));

  const names = new Set(GENERATIVE_AUDIO_PROVIDERS.map((provider) => provider.name));
  for (const expected of ['Suno', 'Udio', 'Stability Audio API', 'Loudly', 'SOUNDRAW', 'Mubert API', 'ACE-Step', 'HeartMuLa', 'DiffRhythm', 'Stable Audio Open', 'Sound Protocol', 'Bittensor subnet route', 'Custom audio model']) {
    assert.ok(names.has(expected), `${expected} is missing`);
  }
});

test('external products and references cannot masquerade as connected APIs', () => {
  const suno = GENERATIVE_AUDIO_PROVIDERS.find((provider) => provider.id === 'suno-external');
  const udio = GENERATIVE_AUDIO_PROVIDERS.find((provider) => provider.id === 'udio-external');
  const sound = GENERATIVE_AUDIO_PROVIDERS.find((provider) => provider.id === 'sound-protocol-reference');
  assert.equal(suno.integrationState, 'external_product_only');
  assert.equal(udio.integrationState, 'external_product_only');
  assert.equal(sound.integrationState, 'reference_only');
  assert.deepEqual(sound.workflows, []);
  assert.equal(createUnavailableGenerativeAudioRoute(suno.id).state, 'unavailable');
  assert.equal(createUnavailableGenerativeAudioRoute(sound.id).state, 'unavailable');
});

test('default generation draft is project-safe, local-oriented and blocked until configured', () => {
  const draft = createGenerativeAudioDraft('project-1', new Date('2026-08-14T12:00:00.000Z'));
  const plan = planGenerativeAudioDraft(draft);
  assert.equal(draft.providerId, 'stable-audio-open-local');
  assert.equal(draft.workflowId, 'sample_forge');
  assert.equal(plan.state, 'configuration_required');
  assert.equal(plan.safeToQueue, false);
  assert.equal(plan.projectChanged, false);
  assert.equal(plan.sourceAssetsPreserved, true);
  assert.equal(plan.outputDisposition, 'preview_only');
  assert.ok(plan.issues.some((issue) => issue.path === 'prompt'));
  assert.ok(plan.issues.some((issue) => issue.path === 'rights.creativeDirection'));
  assert.ok(plan.issues.some((issue) => issue.path === 'route.state'));
});

test('a reviewed local draft becomes queue-eligible only with a ready evidenced route', () => {
  const draft = createGenerativeAudioDraft('project-1');
  draft.prompt = 'A dry one-bar percussion texture for layering beneath an original drum pattern.';
  draft.rights.creativeDirection = 'reviewed_no_named_imitation';
  const route = {
    ...createUnavailableGenerativeAudioRoute(draft.providerId),
    state: 'ready',
    enabled: true,
    endpoint: 'http://127.0.0.1:7860',
    model: 'user-installed-model',
    termsEvidenceReference: 'local-review-2026-08-14',
    message: 'Local sidecar passed capability negotiation.',
  };
  const plan = planGenerativeAudioDraft(draft, route);
  assert.deepEqual(validateGenerativeAudioDraft(draft, route), []);
  assert.equal(plan.state, 'ready_to_queue');
  assert.equal(plan.safeToQueue, true);
  assert.equal(plan.projectChanged, false);
});

test('source-led and remote workflows require explicit rights and per-request data consent', () => {
  const draft = createGenerativeAudioDraft('project-1');
  draft.providerId = 'stability-audio-api';
  draft.workflowId = 'owned_audio_variation';
  draft.prompt = 'Explore a sparse arrangement around the selected creator-owned phrase.';
  draft.sourceAssetIds = ['asset-1'];
  draft.rights.creativeDirection = 'reviewed_no_named_imitation';
  const route = {
    ...createUnavailableGenerativeAudioRoute(draft.providerId),
    state: 'ready', enabled: true, endpoint: '/poietek-api/generative-audio', model: 'provider-model',
    credentialReference: 'STABILITY_AUDIO_KEY', termsEvidenceReference: 'provider-terms-review-1',
  };
  const blocked = validateGenerativeAudioDraft(draft, route);
  assert.ok(blocked.some((issue) => issue.path === 'rights.sourceAudio'));
  assert.ok(blocked.some((issue) => issue.path === 'remoteConsent'));

  draft.rights.sourceAudio = 'user_attested';
  draft.remoteConsent = true;
  assert.deepEqual(validateGenerativeAudioDraft(draft, route), []);
});

test('Bittensor remains subnet-specific and optional rather than becoming a wallet dependency', () => {
  const provider = GENERATIVE_AUDIO_PROVIDERS.find((item) => item.id === 'bittensor-subnet');
  assert.equal(provider.integrationState, 'decentralized_connector_candidate');
  assert.equal(provider.credentialRule, 'wallet_and_subnet_specific');
  assert.match(provider.summary, /not a universal music API/i);
  assert.ok(provider.notes.some((note) => /never required for the local DAW/i.test(note)));
});

test('AI Studio exposes the lab as an optional preview-first instrument', async () => {
  const component = await readFile(new URL('../src/poietek/react/PoietekAiCenter.tsx', import.meta.url), 'utf8');
  const documentation = await readFile(new URL('../docs/GENERATIVE_AUDIO_ARCHITECTURE.md', import.meta.url), 'utf8');
  assert.match(component, /Optional production instrument · disabled by default/);
  assert.match(component, /The DAW, project and creator decisions remain primary/);
  assert.match(component, />Queue unavailable<\/button>/);
  assert.match(component, /it is not external rights verification/i);
  assert.match(documentation, /production suite with optional AI assistance/i);
  assert.match(documentation, /No provider is enabled by default/i);
});
