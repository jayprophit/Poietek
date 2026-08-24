export interface ComputeNodeCapabilities {
  nodeId: string;
  platform: string;
  operations: string[];
  mediaTypes: string[];
  networkClass: "local_process" | "same_device" | "lan" | "wan" | "provider" | "decentralized";
  trustClass: "local_trusted" | "team_trusted" | "provider_trusted" | "sandboxed_untrusted";
  costClass: "free_local" | "free_tier" | "metered" | "unknown";
}

export interface ComputeJob {
  jobId: string;
  operation: string;
  inputAssetIds: string[];
  privacyClass: "public" | "team" | "private" | "sensitive";
  requiredCapabilities: string[];
  maxCostMinor?: number;
}

export interface ComputeNode {
  getCapabilities(): Promise<ComputeNodeCapabilities>;
  run(job: ComputeJob): Promise<{ outputAssetIds: string[]; evidence?: Record<string, unknown> }>;
  cancel(jobId: string): Promise<void>;
}
