export const ACTION_WORKFLOW_EXTENSION_KEY = 'org.poietek.action-extension-workshop' as const;
export const ACTION_WORKFLOW_SCHEMA_VERSION = '1.0.0' as const;

export type ActionCommandKind =
  | 'project.set_tempo'
  | 'track.set_gain'
  | 'track.set_pan'
  | 'track.set_mute'
  | 'track.set_solo'
  | 'track.rename';

export type ActionTarget =
  | {kind: 'project'}
  | {kind: 'track'; trackId: string}
  | {kind: 'all_tracks'};

export interface ActionStep {
  id: string;
  command: ActionCommandKind;
  target: ActionTarget;
  parameters: Readonly<Record<string, number | boolean | string>>;
}

export interface ActionRecipe {
  id: string;
  name: string;
  description: string;
  origin: 'poietek' | 'user';
  steps: readonly ActionStep[];
}

export interface CycleAction {
  id: string;
  name: string;
  recipeIds: readonly string[];
  cursor: number;
}

export interface ActionPlanStep {
  stepId: string;
  command: ActionCommandKind;
  targetCount: number;
  status: 'ready' | 'blocked';
  summary: string;
  reason?: string;
}

export interface ActionExecutionPlan {
  projectId: string;
  recipeId: string;
  status: 'ready' | 'blocked';
  steps: readonly ActionPlanStep[];
  summary: string;
}

export type WorkflowPackageKind =
  | 'action_pack'
  | 'theme'
  | 'language_pack'
  | 'script'
  | 'dsp'
  | 'native_extension';

export type WorkflowPackageCapability =
  | 'project_read'
  | 'project_write'
  | 'theme_tokens'
  | 'translation_strings'
  | 'audio_process'
  | 'midi_process'
  | 'native_host'
  | 'network'
  | 'file_system';

export type WorkflowPackagePlatform =
  | 'web'
  | 'windows'
  | 'macos'
  | 'linux'
  | 'android'
  | 'ios';

export interface WorkflowPackageSource {
  kind: 'built_in' | 'local_file' | 'repository';
  reference: string;
}

export interface WorkflowPackageDigest {
  algorithm: 'sha256';
  value: string;
}

export interface WorkflowPackageReviewEvidence {
  reviewerId: string;
  reviewedAt: string;
  digestSha256: string;
  evidenceReference: string;
}

export interface WorkflowPackageManifest {
  id: string;
  name: string;
  version: string;
  kind: WorkflowPackageKind;
  publisher: string;
  source: WorkflowPackageSource;
  digest: WorkflowPackageDigest | null;
  licenseSpdx: string | null;
  requestedCapabilities: readonly WorkflowPackageCapability[];
  platforms: readonly WorkflowPackagePlatform[];
  minimumProjectSchema: '1.1.0';
  locale?: string;
  translationCoveragePercent?: number;
  accessibilityReviewReference?: string;
  trust: 'declared' | 'verified' | 'quarantined';
  reviewEvidence: WorkflowPackageReviewEvidence | null;
  quarantineReason: string | null;
}

export type DeclaredWorkflowPackage = Omit<
  WorkflowPackageManifest,
  'trust' | 'reviewEvidence' | 'quarantineReason'
>;

export interface WorkflowPackageVerificationObservation {
  packageId: string;
  digestSha256: string;
  reviewerId: string;
  reviewedAt: string;
  evidenceReference: string;
  projectSchema: '1.1.0';
}

export interface WorkflowPackageReadiness {
  state:
    | 'verification_required'
    | 'metadata_ready'
    | 'host_adapter_required'
    | 'quarantined';
  canLoadMetadata: boolean;
  canExecute: false;
  message: string;
}

export interface ActionExecutionRecord {
  recipeId: string;
  cycleId: string | null;
  executedAt: string;
  stepCount: number;
  description: string;
}

export interface ActionWorkflowState {
  schemaVersion: typeof ACTION_WORKFLOW_SCHEMA_VERSION;
  projectId: string;
  revision: number;
  recipes: readonly ActionRecipe[];
  cycles: readonly CycleAction[];
  packages: readonly WorkflowPackageManifest[];
  lastExecution: ActionExecutionRecord | null;
}
