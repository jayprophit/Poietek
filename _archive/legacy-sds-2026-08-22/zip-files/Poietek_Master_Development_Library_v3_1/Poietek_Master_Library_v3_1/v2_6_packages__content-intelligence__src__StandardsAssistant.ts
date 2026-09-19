export type CheckStatus =
  | "pass"
  | "advisory"
  | "warning"
  | "fail"
  | "not_measured"
  | "not_applicable";

export interface StandardsCheck {
  id: string;
  category: string;
  status: CheckStatus;
  measured?: unknown;
  expected?: unknown;
  sourceRef?: string;
  message: string;
}

export interface StyleComparison {
  feature: string;
  projectValue: unknown;
  referenceDistribution: unknown;
  percentile?: number;
  message: string;
  creativeDeviation: boolean;
}

export interface StandardsAssistantInput {
  contentId: string;
  contentClass: string;
  deliveryProfileId?: string;
  styleProfileIds?: string[];
  creativeIntentLocks?: string[];
  measurements: Record<string, unknown>;
}

export interface StandardsAssistantResult {
  technicalChecks: StandardsCheck[];
  styleChecks: StyleComparison[];
  summary: string;
  recommendations: Array<{
    id: string;
    message: string;
    type:
      | "required_fix"
      | "delivery_advice"
      | "style_observation"
      | "creative_option"
      | "needs_more_information";
    proposedCommands?: Record<string, unknown>[];
  }>;
}

export interface StandardsAssistant {
  analyze(input: StandardsAssistantInput): Promise<StandardsAssistantResult>;
}
