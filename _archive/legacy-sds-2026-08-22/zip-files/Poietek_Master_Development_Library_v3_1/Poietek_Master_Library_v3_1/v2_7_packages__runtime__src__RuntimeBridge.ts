export type RuntimeLanguage =
  | "typescript" | "javascript" | "rust" | "cpp" | "c"
  | "python" | "swift" | "kotlin" | "wasm" | "other";

export interface RuntimeDescriptor {
  runtimeId: string;
  language: RuntimeLanguage;
  abi?: "c" | "wasm_component" | "native_plugin" | "process_rpc" | "none";
  version: string;
  platform: string;
  capabilities: string[];
}

export interface RuntimeBridge {
  readonly local: RuntimeDescriptor;
  readonly remote: RuntimeDescriptor;
  invoke<TRequest, TResponse>(method: string, request: TRequest): Promise<TResponse>;
}

/**
 * Never couple TypeScript to raw Rust/C++ object layouts.
 * Use stable ABI/RPC/schema contracts at language boundaries.
 */
