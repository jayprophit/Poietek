import type {PoietekProject} from '../domain/types';

export const AI_SETTINGS_SCHEMA_VERSION = '1.0.0' as const;

export type AiProviderKind =
  | 'poietek-local'
  | 'openai'
  | 'anthropic'
  | 'google-gemini'
  | 'xai'
  | 'deepseek'
  | 'moonshot-kimi'
  | 'microsoft-copilot'
  | 'manus'
  | 'hugging-face'
  | 'ollama'
  | 'openai-compatible'
  | 'custom-module';

export type AiExecutionLocation = 'in_app' | 'localhost' | 'native_sidecar' | 'secure_proxy' | 'external_connector';
export type AiProviderState = 'available' | 'configuration_required' | 'unavailable' | 'unsupported' | 'error';
export type AiDataClass = 'project_metadata' | 'audio_features' | 'lyrics' | 'media' | 'rights' | 'personal_data';
export type AiAssistantMode = 'project' | 'arrangement' | 'mix' | 'sampling' | 'release' | 'rights' | 'learning';

export interface AiProviderDefinition {
  id: AiProviderKind;
  name: string;
  family: 'first_party' | 'local_model' | 'model_api' | 'external_product' | 'custom';
  execution: AiExecutionLocation[];
  summary: string;
  credentialRule: 'none' | 'localhost_only' | 'native_secure_store_or_server_secret' | 'external_authorization';
  defaultEndpoint: string | null;
  documentationUrl: string | null;
  supportsDirectBrowserCalls: boolean;
  notes: string[];
}

export interface AiProviderConfiguration {
  id: string;
  provider: AiProviderKind;
  displayName: string;
  endpoint: string | null;
  model: string | null;
  credentialReference: string | null;
  execution: AiExecutionLocation;
  enabled: boolean;
  allowedData: AiDataClass[];
  createdAt: string;
  updatedAt: string;
}

export interface AiSettingsDocument {
  schemaVersion: typeof AI_SETTINGS_SCHEMA_VERSION;
  activeConfigurationId: string;
  remoteProvidersEnabled: boolean;
  requireConsentEveryRemoteRequest: boolean;
  retainRemoteConversationHistory: boolean;
  configurations: AiProviderConfiguration[];
  updatedAt: string;
}

export interface AiProjectContext {
  project: PoietekProject;
  selectedTrackIds: string[];
  selectedClipIds: string[];
  playheadSeconds: number | null;
}

export interface AiAssistantRequest {
  id: string;
  mode: AiAssistantMode;
  prompt: string;
  context: AiProjectContext;
  requestedData: AiDataClass[];
  remoteConsent: boolean;
}

export interface AiAssistantFinding {
  id: string;
  title: string;
  detail: string;
  category: 'observation' | 'technical' | 'creative_option' | 'requirement' | 'safety';
  severity: 'info' | 'attention' | 'blocking';
  evidence: string[];
  proposedAction: string | null;
  requiresPreview: boolean;
  canApply: boolean;
}

export interface AiAssistantResponse {
  requestId: string;
  providerId: string;
  model: string;
  generatedAt: string;
  summary: string;
  findings: AiAssistantFinding[];
  usedRemoteProvider: boolean;
  projectChanged: false;
  unavailableReason: string | null;
}

export interface AiProviderHealth {
  state: AiProviderState;
  message: string;
  checkedAt: string;
  latencyMs?: number;
}

export interface AiProviderAdapter {
  readonly configuration: AiProviderConfiguration;
  health(): Promise<AiProviderHealth>;
  complete(request: AiAssistantRequest): Promise<AiAssistantResponse>;
}

export interface AiValidationIssue {
  path: string;
  message: string;
}

export interface AiValidationResult {
  valid: boolean;
  issues: AiValidationIssue[];
}
