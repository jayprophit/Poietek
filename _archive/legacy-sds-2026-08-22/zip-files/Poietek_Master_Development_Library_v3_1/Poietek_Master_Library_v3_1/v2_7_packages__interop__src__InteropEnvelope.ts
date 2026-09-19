export type InteropEncoding =
  | "json"
  | "json_canonical"
  | "protobuf"
  | "cbor"
  | "binary_ref"
  | "wit_component"
  | "custom";

export interface InteropEndpoint {
  appId: string;
  runtimeId: string;
  deviceId?: string;
  nodeId?: string;
  platform?: string;
}

export interface InteropEnvelope<TPayload extends Record<string, unknown> = Record<string, unknown>> {
  envelopeId: string;
  schemaVersion: "1.0.0";
  kind:
    | "command"
    | "event"
    | "project_fragment"
    | "asset_reference"
    | "device_state"
    | "console_state"
    | "timeline_selection"
    | "creative_intent"
    | "proof_record"
    | "rights_manifest_reference"
    | "compute_job"
    | "handoff"
    | "presence"
    | "diagnostic";
  source: InteropEndpoint;
  target?: InteropEndpoint;
  createdAt: string;
  correlationId?: string;
  contentHash?: string;
  encoding: InteropEncoding;
  payload: TPayload;
}

export interface InteropTransport {
  readonly id: string;
  isAvailable(): Promise<boolean>;
  send<TPayload extends Record<string, unknown>>(envelope: InteropEnvelope<TPayload>): Promise<void>;
  subscribe(handler: (envelope: InteropEnvelope) => void): () => void;
}
