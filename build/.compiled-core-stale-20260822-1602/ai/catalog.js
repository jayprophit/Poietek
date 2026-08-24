"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AI_PROVIDER_CATALOG = void 0;
exports.getAiProviderDefinition = getAiProviderDefinition;
exports.AI_PROVIDER_CATALOG = [
    {
        id: 'poietek-local', name: 'Poietek Studio Brain', family: 'first_party', execution: ['in_app'],
        summary: 'The independent offline assistant. It reads the canonical project snapshot and produces deterministic, evidence-linked guidance without sending data away.',
        credentialRule: 'none', defaultEndpoint: null, documentationUrl: null, supportsDirectBrowserCalls: true,
        notes: ['Works offline', 'No generative model required', 'Never changes the project automatically'],
    },
    {
        id: 'ollama', name: 'Local model through Ollama', family: 'local_model', execution: ['localhost', 'native_sidecar'],
        summary: 'Runs a user-selected local model through an Ollama service on the same device.', credentialRule: 'localhost_only',
        defaultEndpoint: 'http://127.0.0.1:11434/api', documentationUrl: 'https://docs.ollama.com/api/chat', supportsDirectBrowserCalls: true,
        notes: ['Ollama must be installed and running', 'Browser access depends on local CORS policy', 'Model files remain under the user’s control'],
    },
    {
        id: 'openai', name: 'OpenAI API', family: 'model_api', execution: ['secure_proxy', 'native_sidecar'],
        summary: 'Optional OpenAI model access through a server-side or native credential boundary.', credentialRule: 'native_secure_store_or_server_secret',
        defaultEndpoint: 'https://api.openai.com/v1/responses', documentationUrl: 'https://platform.openai.com/docs/quickstart', supportsDirectBrowserCalls: false,
        notes: ['This is an API integration, not a ChatGPT account session', 'Keys are never saved in the web project'],
    },
    {
        id: 'anthropic', name: 'Anthropic Claude API', family: 'model_api', execution: ['secure_proxy', 'native_sidecar'],
        summary: 'Optional Claude model access through a protected provider adapter.', credentialRule: 'native_secure_store_or_server_secret',
        defaultEndpoint: 'https://api.anthropic.com/v1/messages', documentationUrl: 'https://docs.anthropic.com/en/api/messages', supportsDirectBrowserCalls: false,
        notes: ['Requires an Anthropic API credential', 'Consumer Claude sessions are not reused'],
    },
    {
        id: 'google-gemini', name: 'Google Gemini API', family: 'model_api', execution: ['secure_proxy', 'native_sidecar'],
        summary: 'Optional Gemini access with its key held only by a server or native secure store.', credentialRule: 'native_secure_store_or_server_secret',
        defaultEndpoint: 'https://generativelanguage.googleapis.com', documentationUrl: 'https://ai.google.dev/gemini-api/docs/api-key', supportsDirectBrowserCalls: false,
        notes: ['Google explicitly recommends a backend proxy for client-side apps', 'No Vite-exposed Gemini key'],
    },
    {
        id: 'xai', name: 'xAI API', family: 'model_api', execution: ['secure_proxy', 'native_sidecar'],
        summary: 'Optional Grok-family model access through the xAI API.', credentialRule: 'native_secure_store_or_server_secret',
        defaultEndpoint: 'https://api.x.ai/v1', documentationUrl: 'https://docs.x.ai/developers/rest-api-reference/inference', supportsDirectBrowserCalls: false,
        notes: ['Requires an xAI API credential', 'Configured models are discovered by the secure adapter'],
    },
    {
        id: 'deepseek', name: 'DeepSeek API', family: 'model_api', execution: ['secure_proxy', 'native_sidecar'],
        summary: 'Optional DeepSeek chat/reasoning model access through a protected adapter.', credentialRule: 'native_secure_store_or_server_secret',
        defaultEndpoint: 'https://api.deepseek.com', documentationUrl: 'https://api-docs.deepseek.com/api/create-chat-completion/', supportsDirectBrowserCalls: false,
        notes: ['OpenAI-compatible message transport is supported by the provider', 'Tool arguments must still be validated'],
    },
    {
        id: 'moonshot-kimi', name: 'Moonshot Kimi API', family: 'model_api', execution: ['secure_proxy', 'native_sidecar'],
        summary: 'Optional Kimi model access through Moonshot’s API.', credentialRule: 'native_secure_store_or_server_secret',
        defaultEndpoint: 'https://api.moonshot.ai/v1', documentationUrl: 'https://platform.moonshot.ai/docs', supportsDirectBrowserCalls: false,
        notes: ['Availability and model names are verified by the adapter at connection time'],
    },
    {
        id: 'hugging-face', name: 'Hugging Face models', family: 'model_api', execution: ['secure_proxy', 'native_sidecar'],
        summary: 'Routes to a selected hosted or dedicated Hugging Face inference model.', credentialRule: 'native_secure_store_or_server_secret',
        defaultEndpoint: 'https://router.huggingface.co/v1', documentationUrl: 'https://huggingface.co/docs/inference-providers/en/index', supportsDirectBrowserCalls: false,
        notes: ['Supports many model families', 'Provider policy, pricing and data handling must be reviewed per model route'],
    },
    {
        id: 'microsoft-copilot', name: 'Microsoft Copilot connector', family: 'external_product', execution: ['external_connector'],
        summary: 'A future authorized connector—not a reusable consumer Copilot session.', credentialRule: 'external_authorization',
        defaultEndpoint: null, documentationUrl: 'https://learn.microsoft.com/connectors/', supportsDirectBrowserCalls: false,
        notes: ['Requires a supported Microsoft connector/OAuth flow', 'Unavailable until that connector is installed and authorized'],
    },
    {
        id: 'manus', name: 'Manus connector', family: 'external_product', execution: ['external_connector'],
        summary: 'Reserved for an officially supported, user-authorized Manus integration.', credentialRule: 'external_authorization',
        defaultEndpoint: null, documentationUrl: null, supportsDirectBrowserCalls: false,
        notes: ['No generic browser-session scraping', 'Unavailable until a documented connector is configured'],
    },
    {
        id: 'openai-compatible', name: 'OpenAI-compatible endpoint', family: 'custom', execution: ['localhost', 'secure_proxy', 'native_sidecar'],
        summary: 'Connects a user-selected compatible service through an explicit endpoint and model.', credentialRule: 'native_secure_store_or_server_secret',
        defaultEndpoint: null, documentationUrl: null, supportsDirectBrowserCalls: false,
        notes: ['Loopback endpoints may run directly', 'Remote endpoints require the secure proxy'],
    },
    {
        id: 'custom-module', name: 'Custom AI module', family: 'custom', execution: ['in_app', 'localhost', 'native_sidecar', 'secure_proxy'],
        summary: 'A versioned extension point for a user-provided model or specialist module.', credentialRule: 'native_secure_store_or_server_secret',
        defaultEndpoint: null, documentationUrl: null, supportsDirectBrowserCalls: false,
        notes: ['Must declare capabilities and data use', 'Project-changing tools remain preview-and-undo gated'],
    },
];
function getAiProviderDefinition(id) {
    const definition = exports.AI_PROVIDER_CATALOG.find((candidate) => candidate.id === id);
    if (!definition)
        throw new Error(`Unknown AI provider: ${id}`);
    return definition;
}
