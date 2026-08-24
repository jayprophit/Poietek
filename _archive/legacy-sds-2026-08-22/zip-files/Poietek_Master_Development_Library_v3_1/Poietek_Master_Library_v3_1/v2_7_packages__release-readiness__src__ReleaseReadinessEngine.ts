export type ReadinessStatus =
  | "pass"
  | "advisory"
  | "warning"
  | "fail"
  | "not_measured"
  | "not_applicable";

export interface ReadinessCheck {
  id: string;
  category:
    | "tuning"
    | "audio_format"
    | "audio_level"
    | "video"
    | "colour"
    | "caption"
    | "metadata"
    | "rights"
    | "provenance"
    | "packaging"
    | "accessibility";
  status: ReadinessStatus;
  measured?: unknown;
  required?: unknown;
  authority?: string;
  sourceRef?: string;
  message: string;
}

export interface ReleaseReadinessResult {
  targetProfileId: string;
  checks: ReadinessCheck[];
  blockingFailures: string[];
  advisories: string[];
  ready: boolean;
}

export interface ReleaseReadinessEngine {
  analyze(input: {
    projectId: string;
    assetId: string;
    targetProfileId: string;
    measurements: Record<string, unknown>;
    metadata: Record<string, unknown>;
  }): Promise<ReleaseReadinessResult>;
}
