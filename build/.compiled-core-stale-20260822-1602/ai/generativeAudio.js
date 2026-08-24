"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GENERATIVE_AUDIO_PROVIDERS = exports.GENERATIVE_AUDIO_WORKFLOWS = exports.GENERATIVE_AUDIO_SCHEMA_VERSION = void 0;
exports.getGenerativeAudioProvider = getGenerativeAudioProvider;
exports.getGenerativeAudioWorkflow = getGenerativeAudioWorkflow;
exports.createGenerativeAudioDraft = createGenerativeAudioDraft;
exports.createUnavailableGenerativeAudioRoute = createUnavailableGenerativeAudioRoute;
exports.validateGenerativeAudioDraft = validateGenerativeAudioDraft;
exports.planGenerativeAudioDraft = planGenerativeAudioDraft;
exports.validateGenerativeAudioCatalog = validateGenerativeAudioCatalog;
exports.GENERATIVE_AUDIO_SCHEMA_VERSION = '1.0.0';
exports.GENERATIVE_AUDIO_WORKFLOWS = [
    { id: 'idea_variations', name: 'Idea Variations', purpose: 'Create several audition-only musical directions from a production brief.', requiresSourceAudio: false, supportsSourceAudio: false, preservesSourceAudio: true, outputRule: 'Alternatives enter the audition tray; none replaces the arrangement.' },
    { id: 'sample_forge', name: 'Sample Forge', purpose: 'Draft short one-shots, textures, foley, ambience and instrument phrases.', requiresSourceAudio: false, supportsSourceAudio: true, preservesSourceAudio: true, outputRule: 'Every accepted result becomes a new hashed asset with provenance.' },
    { id: 'section_extend', name: 'Section Continue', purpose: 'Draft audio before or after an owned selection.', requiresSourceAudio: true, supportsSourceAudio: true, preservesSourceAudio: true, outputRule: 'The source clip remains untouched; continuation is a separate take.' },
    { id: 'region_recompose', name: 'Region Recompose', purpose: 'Draft a replacement for an explicitly selected time range.', requiresSourceAudio: true, supportsSourceAudio: true, preservesSourceAudio: true, outputRule: 'Replacement remains a preview until the user accepts an undoable edit.' },
    { id: 'owned_audio_variation', name: 'Owned-Audio Variation', purpose: 'Explore controlled differences from creator-owned source audio.', requiresSourceAudio: true, supportsSourceAudio: true, preservesSourceAudio: true, outputRule: 'Variance never changes the creator original and cannot imply cleared rights.' },
    { id: 'adaptive_score', name: 'Adaptive Score Draft', purpose: 'Create duration, structure and energy-shaped cues for picture, games or podcasts.', requiresSourceAudio: false, supportsSourceAudio: true, preservesSourceAudio: true, outputRule: 'Drafts follow a cue brief and return to the DAW for final editing and mixing.' },
    { id: 'lyrics_to_demo', name: 'Lyrics-to-Demo', purpose: 'Audition creator-supplied lyrics as a labelled vocal demo.', requiresSourceAudio: false, supportsSourceAudio: true, preservesSourceAudio: true, outputRule: 'Synthetic vocals remain labelled; voice identity consent is mandatory when a reference is used.' },
    { id: 'stem_assist', name: 'Stem Drafts', purpose: 'Request genuinely supported separated or generated production layers.', requiresSourceAudio: true, supportsSourceAudio: true, preservesSourceAudio: true, outputRule: 'Only provider-returned stems are labelled stems; source-separation support is never assumed.' },
    { id: 'accompaniment_assist', name: 'Accompaniment Draft', purpose: 'Draft backing material around an owned vocal, melody or rhythm guide.', requiresSourceAudio: true, supportsSourceAudio: true, preservesSourceAudio: true, outputRule: 'The guide and every generated layer remain separate, traceable assets.' },
];
exports.GENERATIVE_AUDIO_PROVIDERS = [
    { id: 'suno-external', name: 'Suno', family: 'external_product', integrationState: 'external_product_only', execution: ['external_product'], workflows: ['idea_variations', 'section_extend', 'owned_audio_variation', 'lyrics_to_demo'], officialUrl: 'https://help.suno.com/en/articles/6141569', summary: 'External product reference for upload-led song ideation and continuation.', credentialRule: 'external_account', defaultEnabled: false, notes: ['No undocumented session automation or account scraping', 'Use only through an official integration if one becomes available', 'Uploaded material requires the user’s rights attestation'] },
    { id: 'udio-external', name: 'Udio', family: 'external_product', integrationState: 'external_product_only', execution: ['external_product'], workflows: ['idea_variations', 'section_extend', 'region_recompose', 'owned_audio_variation', 'lyrics_to_demo'], officialUrl: 'https://help.udio.com/en/articles/10754328-create-music-with-your-own-audio', summary: 'External product reference for waveform-centred extend, inpaint, remix and style workflows.', credentialRule: 'external_account', defaultEnabled: false, notes: ['No public API is assumed', 'Creator-owned input only', 'External exports and terms must be rechecked at use time'] },
    { id: 'stability-audio-api', name: 'Stability Audio API', family: 'commercial_api', integrationState: 'official_api_candidate', execution: ['secure_proxy', 'native_sidecar'], workflows: ['idea_variations', 'sample_forge', 'region_recompose', 'owned_audio_variation', 'adaptive_score'], officialUrl: 'https://platform.stability.ai/docs/api-reference', summary: 'Official API candidate for text-to-audio, audio-to-audio and inpaint requests.', credentialRule: 'secure_store_or_server', defaultEnabled: false, notes: ['API key must stay outside the browser bundle', 'Model limits and prices are discovered at connection time', 'Generated output remains preview-only until ingested'] },
    { id: 'loudly-api', name: 'Loudly', family: 'commercial_api', integrationState: 'official_api_candidate', execution: ['secure_proxy', 'native_sidecar'], workflows: ['idea_variations', 'adaptive_score', 'owned_audio_variation'], officialUrl: 'https://www.loudly.com/developers', summary: 'API candidate for prompt- and parameter-led cue generation.', credentialRule: 'secure_store_or_server', defaultEnabled: false, notes: ['Contract, licence and output terms require review', 'Genre, structure and instrument controls are capability-negotiated'] },
    { id: 'soundraw-reference', name: 'SOUNDRAW', family: 'external_product', integrationState: 'external_product_only', execution: ['external_product'], workflows: ['idea_variations', 'adaptive_score', 'stem_assist'], officialUrl: 'https://soundraw.io/', summary: 'External-product reference for energy, section, length and instrument-led cue shaping with DAW stem handoff.', credentialRule: 'external_account', defaultEnabled: false, notes: ['No undocumented API is assumed', 'Licence claims are external and must be evidenced per output'] },
    { id: 'mubert-api', name: 'Mubert API', family: 'commercial_api', integrationState: 'official_api_candidate', execution: ['secure_proxy', 'native_sidecar'], workflows: ['idea_variations', 'adaptive_score'], officialUrl: 'https://mubert.com/api/docs', summary: 'Official API candidate for generated tracks, streams and duration-shaped background music.', credentialRule: 'secure_store_or_server', defaultEnabled: false, notes: ['Generation must be enabled by the provider contract', 'Customer and licence tokens remain server/native secrets', 'Track licence evidence is retained with each result'] },
    { id: 'ace-step-local', name: 'ACE-Step', family: 'local_open_model', integrationState: 'local_sidecar_candidate', execution: ['localhost_sidecar', 'native_sidecar'], workflows: ['idea_variations', 'section_extend', 'region_recompose', 'owned_audio_variation', 'lyrics_to_demo', 'stem_assist', 'accompaniment_assist'], officialUrl: 'https://github.com/ace-step/ACE-Step', summary: 'Local-model candidate for controllable music, lyric and audio-conditioned workflows.', credentialRule: 'none', defaultEnabled: false, notes: ['Not bundled', 'Requires a separately installed compatible runtime and weights', 'Hardware, code and model licences are checked before enablement'] },
    { id: 'heartmula-local', name: 'HeartMuLa', family: 'local_open_model', integrationState: 'local_sidecar_candidate', execution: ['localhost_sidecar', 'native_sidecar'], workflows: ['idea_variations', 'lyrics_to_demo'], officialUrl: 'https://github.com/HeartMuLa/heartlib', summary: 'Local-model candidate for lyrics- and tag-conditioned multilingual song demos.', credentialRule: 'none', defaultEnabled: false, notes: ['Not bundled', 'Reference-audio support is not claimed until the installed model reports it', 'Runtime and weights require separate installation and licence review'] },
    { id: 'diffrhythm-local', name: 'DiffRhythm', family: 'local_open_model', integrationState: 'local_sidecar_candidate', execution: ['localhost_sidecar', 'native_sidecar'], workflows: ['idea_variations', 'lyrics_to_demo'], officialUrl: 'https://github.com/ASLP-lab/DiffRhythm', summary: 'Local-model candidate for full-length lyrics- and style-conditioned drafts.', credentialRule: 'none', defaultEnabled: false, notes: ['Not bundled', 'GPU and phonemizer requirements are probed rather than assumed', 'Model output requires originality and quality review'] },
    { id: 'stable-audio-open-local', name: 'Stable Audio Open', family: 'local_open_model', integrationState: 'local_sidecar_candidate', execution: ['localhost_sidecar', 'native_sidecar'], workflows: ['sample_forge', 'owned_audio_variation'], officialUrl: 'https://stability.ai/news-updates/introducing-stable-audio-open', summary: 'Local-model candidate focused on short samples, production elements and sound design.', credentialRule: 'none', defaultEnabled: false, notes: ['Not bundled', 'Best treated as a sampler/sound-design source, not a replacement song engine', 'Weights, training data terms and hardware support require review'] },
    { id: 'sound-protocol-reference', name: 'Sound Protocol', family: 'community_protocol', integrationState: 'reference_only', execution: ['external_product'], workflows: [], officialUrl: 'https://docs.sound.xyz/', summary: 'Community/provenance reference for creator releases, collectable evidence and protocol-indexed metadata—not an audio generator.', credentialRule: 'external_account', defaultEnabled: false, notes: ['The former Sound.xyz application is offline', 'Collectables do not imply copyright or ownership of the song', 'Blockchain evidence remains optional and separate from generation'] },
    { id: 'bittensor-subnet', name: 'Bittensor subnet route', family: 'decentralized_network', integrationState: 'decentralized_connector_candidate', execution: ['decentralized_gateway'], workflows: ['idea_variations', 'sample_forge', 'adaptive_score'], officialUrl: 'https://github.com/opentensor/bittensor', summary: 'Optional subnet-specific route for competitively supplied inference; Bittensor itself is not a universal music API.', credentialRule: 'wallet_and_subnet_specific', defaultEnabled: false, notes: ['A named subnet and its protocol must be reviewed first', 'Wallets and TAO transactions are never required for the local DAW', 'No wallet, token or quality claim is created by default'] },
    { id: 'custom-audio-model', name: 'Custom audio model', family: 'custom', integrationState: 'custom_adapter', execution: ['localhost_sidecar', 'native_sidecar', 'secure_proxy'], workflows: exports.GENERATIVE_AUDIO_WORKFLOWS.map((item) => item.id), officialUrl: 'https://github.com/jayprophit/Studio-Daw-Station-SDS-', summary: 'Versioned adapter point for a user-selected local, hosted or specialist audio model.', credentialRule: 'adapter_defined', defaultEnabled: false, notes: ['Must declare exact inputs, outputs, licence, data use and hardware limits', 'No project mutation without preview and user acceptance'] },
];
function getGenerativeAudioProvider(id) {
    const provider = exports.GENERATIVE_AUDIO_PROVIDERS.find((item) => item.id === id);
    if (!provider)
        throw new Error(`Unknown generative audio provider: ${id}`);
    return provider;
}
function getGenerativeAudioWorkflow(id) {
    const workflow = exports.GENERATIVE_AUDIO_WORKFLOWS.find((item) => item.id === id);
    if (!workflow)
        throw new Error(`Unknown generative audio workflow: ${id}`);
    return workflow;
}
function createGenerativeAudioDraft(projectId, now = new Date()) {
    return {
        schemaVersion: exports.GENERATIVE_AUDIO_SCHEMA_VERSION,
        id: `gen-draft-${now.getTime()}`,
        projectId,
        providerId: 'stable-audio-open-local',
        workflowId: 'sample_forge',
        prompt: '',
        lyrics: null,
        durationSeconds: 12,
        variationCount: 2,
        seed: null,
        instrumental: true,
        sourceAssetIds: [],
        sectionStartSeconds: null,
        sectionEndSeconds: null,
        variance: 0.5,
        remoteConsent: false,
        rights: { sourceAudio: 'not_used', voiceIdentity: 'not_used', creativeDirection: 'not_reviewed', acknowledgement: null },
        createdAt: now.toISOString(),
    };
}
function createUnavailableGenerativeAudioRoute(providerId) {
    const provider = getGenerativeAudioProvider(providerId);
    return {
        providerId,
        state: provider.integrationState === 'reference_only' || provider.integrationState === 'external_product_only'
            ? 'unavailable'
            : 'configuration_required',
        enabled: false,
        endpoint: null,
        model: null,
        credentialReference: null,
        termsEvidenceReference: null,
        checkedAt: null,
        message: provider.integrationState === 'external_product_only'
            ? 'External product only. Poietek has no official connected adapter.'
            : provider.integrationState === 'reference_only'
                ? 'Inspiration/reference only; this is not a generation route.'
                : 'Install or configure a reviewed adapter before generation can run.',
    };
}
function validateGenerativeAudioDraft(draft, route = createUnavailableGenerativeAudioRoute(draft.providerId)) {
    const issues = [];
    const provider = getGenerativeAudioProvider(draft.providerId);
    const workflow = getGenerativeAudioWorkflow(draft.workflowId);
    if (draft.schemaVersion !== exports.GENERATIVE_AUDIO_SCHEMA_VERSION)
        issues.push({ path: 'schemaVersion', severity: 'blocking', message: 'Unsupported generative-audio draft schema.' });
    if (!draft.projectId.trim())
        issues.push({ path: 'projectId', severity: 'blocking', message: 'A canonical project is required.' });
    if (!draft.prompt.trim())
        issues.push({ path: 'prompt', severity: 'blocking', message: 'Describe the production purpose and musical direction.' });
    if (draft.prompt.length > 4000)
        issues.push({ path: 'prompt', severity: 'blocking', message: 'Prompt must be 4,000 characters or fewer.' });
    if (!Number.isFinite(draft.durationSeconds) || draft.durationSeconds < 1 || draft.durationSeconds > 600)
        issues.push({ path: 'durationSeconds', severity: 'blocking', message: 'Duration must be between 1 and 600 seconds.' });
    if (!Number.isInteger(draft.variationCount) || draft.variationCount < 1 || draft.variationCount > 8)
        issues.push({ path: 'variationCount', severity: 'blocking', message: 'Variation count must be an integer from 1 to 8.' });
    if (!Number.isFinite(draft.variance) || draft.variance < 0 || draft.variance > 1)
        issues.push({ path: 'variance', severity: 'blocking', message: 'Variance must be between 0 and 1.' });
    if (!provider.workflows.includes(draft.workflowId))
        issues.push({ path: 'workflowId', severity: 'blocking', message: `${provider.name} does not declare support for ${workflow.name}.` });
    if (workflow.requiresSourceAudio && draft.sourceAssetIds.length === 0)
        issues.push({ path: 'sourceAssetIds', severity: 'blocking', message: `${workflow.name} requires an explicitly selected source asset.` });
    if (draft.sourceAssetIds.length > 0 && draft.rights.sourceAudio !== 'user_attested')
        issues.push({ path: 'rights.sourceAudio', severity: 'blocking', message: 'The user must attest that they may send and transform every selected source asset.' });
    if (draft.sourceAssetIds.length === 0 && draft.rights.sourceAudio !== 'not_used')
        issues.push({ path: 'rights.sourceAudio', severity: 'attention', message: 'No source audio is selected; source-audio attestation is unnecessary.' });
    if (draft.workflowId === 'lyrics_to_demo' && !draft.lyrics?.trim())
        issues.push({ path: 'lyrics', severity: 'blocking', message: 'Lyrics-to-Demo requires creator-supplied lyrics.' });
    if (draft.rights.creativeDirection !== 'reviewed_no_named_imitation')
        issues.push({ path: 'rights.creativeDirection', severity: 'blocking', message: 'Review the direction and remove requests to imitate a named living artist or protected recording.' });
    if (draft.rights.voiceIdentity === 'not_attested')
        issues.push({ path: 'rights.voiceIdentity', severity: 'blocking', message: 'A voice reference requires explicit identity consent evidence.' });
    if (provider.execution.some((item) => item === 'secure_proxy' || item === 'external_product' || item === 'decentralized_gateway') && !draft.remoteConsent)
        issues.push({ path: 'remoteConsent', severity: 'blocking', message: 'This route can send data off-device and requires consent for this request.' });
    if (route.providerId !== draft.providerId)
        issues.push({ path: 'route.providerId', severity: 'blocking', message: 'The selected runtime route does not match the draft provider.' });
    if (route.state !== 'ready' || !route.enabled)
        issues.push({ path: 'route.state', severity: 'blocking', message: route.message });
    if (route.state === 'ready' && !route.termsEvidenceReference)
        issues.push({ path: 'route.termsEvidenceReference', severity: 'blocking', message: 'A reviewed provider/model terms evidence reference is required before queueing.' });
    return issues;
}
function planGenerativeAudioDraft(draft, route = createUnavailableGenerativeAudioRoute(draft.providerId)) {
    const issues = validateGenerativeAudioDraft(draft, route);
    const blocking = issues.some((item) => item.severity === 'blocking');
    const configurationRequired = route.state === 'configuration_required' || route.state === 'unavailable';
    return {
        draftId: draft.id,
        providerId: draft.providerId,
        state: blocking ? (configurationRequired ? 'configuration_required' : 'blocked') : 'ready_to_queue',
        safeToQueue: !blocking,
        issues,
        projectChanged: false,
        sourceAssetsPreserved: true,
        outputDisposition: 'preview_only',
        message: blocking
            ? 'Draft saved only. Resolve every blocking safety, rights and route requirement before generation.'
            : 'Draft is eligible to enter a configured provider queue; output still requires audition and acceptance.',
    };
}
function validateGenerativeAudioCatalog() {
    const issues = [];
    const ids = new Set();
    for (const provider of exports.GENERATIVE_AUDIO_PROVIDERS) {
        if (ids.has(provider.id))
            issues.push(`Duplicate provider id: ${provider.id}`);
        ids.add(provider.id);
        if (provider.defaultEnabled !== false)
            issues.push(`${provider.id} must be disabled by default`);
        if (!provider.officialUrl.startsWith('https://'))
            issues.push(`${provider.id} lacks a secure official reference`);
        if (provider.integrationState === 'reference_only' && provider.workflows.length > 0)
            issues.push(`${provider.id} is reference-only but declares generation workflows`);
    }
    return issues;
}
