export interface ProjectHandoff {
  handoffId: string;
  projectId: string;
  fromDeviceId: string;
  toDeviceId?: string;
  projectRevision: string;
  workspace?: string;
  selection?: Record<string, unknown>;
  playheadSeconds?: number;
  requiredAssetIds: string[];
  requiredCapabilities: string[];
  createdAt: string;
  expiresAt?: string;
}
