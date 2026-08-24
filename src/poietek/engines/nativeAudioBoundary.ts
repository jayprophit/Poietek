export type NativeAudioAdapterPlatform = 'windows' | 'macos' | 'linux' | 'android' | 'ios';

export type NativeAudioAdapterBackendId =
  | 'wasapi'
  | 'asio'
  | 'coreaudio'
  | 'alsa'
  | 'jack'
  | 'pipewire'
  | 'aaudio'
  | 'audiounit';

export type NativeAudioAdapterCapabilityState =
  | 'unavailable'
  | 'permission_required'
  | 'configuration_required'
  | 'available';

export interface NativeAudioAdapterPortDescriptor {
  id: string;
  name: string;
  direction: 'input' | 'output';
  channelCount: number;
  isDefault: boolean;
  supportedSampleRates: readonly number[];
  supportedBufferSizes: readonly number[];
}

export interface NativeAudioAdapterProbeEvidence {
  adapterId: string;
  backend: NativeAudioAdapterBackendId;
  platform: NativeAudioAdapterPlatform;
  state: NativeAudioAdapterCapabilityState;
  observedAt: string;
  implementation: string;
  ports: readonly NativeAudioAdapterPortDescriptor[];
  message?: string;
}

export interface NativeAudioAdapterOpenRequest {
  inputPortIds: readonly string[];
  outputPortIds: readonly string[];
  sampleRate: number;
  bufferSizeFrames: number;
  inputChannels: number;
  outputChannels: number;
}

export interface NativeAudioAdapterTelemetry {
  callbackCount: number;
  xruns: number;
  droppedFrames: number;
  lastCallbackAt?: string;
}

export interface NativeAudioAdapterStream {
  readonly id: string;
  readonly adapterId: string;
  readonly backend: NativeAudioAdapterBackendId;
  readonly request: NativeAudioAdapterOpenRequest;
  getTelemetry(): NativeAudioAdapterTelemetry;
  close(): Promise<void>;
}

export interface NativeAudioAdapter {
  readonly id: string;
  readonly platform: NativeAudioAdapterPlatform;
  readonly backend: NativeAudioAdapterBackendId;
  probe(): Promise<NativeAudioAdapterProbeEvidence>;
  open(request: NativeAudioAdapterOpenRequest): Promise<NativeAudioAdapterStream>;
}

export class NativeAudioBoundaryError extends Error {
  constructor(
    readonly code:
      | 'duplicate_adapter'
      | 'adapter_not_found'
      | 'adapter_unavailable'
      | 'invalid_configuration'
      | 'unsupported_configuration',
    message: string,
  ) {
    super(message);
    this.name = 'NativeAudioBoundaryError';
  }
}

const isPositiveInteger = (value: number): boolean => Number.isInteger(value) && value > 0;

export function validateNativeAudioOpenRequest(request: NativeAudioAdapterOpenRequest): readonly string[] {
  const errors: string[] = [];
  if (!Number.isFinite(request.sampleRate) || request.sampleRate < 8_000 || request.sampleRate > 768_000) {
    errors.push('sampleRate must be between 8000 and 768000 Hz');
  }
  if (!isPositiveInteger(request.bufferSizeFrames) || request.bufferSizeFrames > 65_536) {
    errors.push('bufferSizeFrames must be an integer between 1 and 65536');
  }
  if (!Number.isInteger(request.inputChannels) || request.inputChannels < 0) {
    errors.push('inputChannels must be a non-negative integer');
  }
  if (!isPositiveInteger(request.outputChannels)) {
    errors.push('outputChannels must be a positive integer');
  }
  if (request.inputChannels > 0 && request.inputPortIds.length === 0) {
    errors.push('an input port is required when inputChannels is greater than zero');
  }
  if (request.outputPortIds.length === 0) {
    errors.push('at least one output port is required');
  }
  if (new Set(request.inputPortIds).size !== request.inputPortIds.length) {
    errors.push('inputPortIds must not contain duplicates');
  }
  if (new Set(request.outputPortIds).size !== request.outputPortIds.length) {
    errors.push('outputPortIds must not contain duplicates');
  }
  return errors;
}

function supportsRequest(evidence: NativeAudioAdapterProbeEvidence, request: NativeAudioAdapterOpenRequest): readonly string[] {
  const errors: string[] = [];
  const ports = new Map(evidence.ports.map((port) => [port.id, port]));
  const selected = [...request.inputPortIds, ...request.outputPortIds];

  for (const id of selected) {
    if (!ports.has(id)) errors.push(`port ${id} was not observed during probe`);
  }
  for (const id of request.inputPortIds) {
    if (ports.get(id)?.direction !== 'input') errors.push(`port ${id} is not an input`);
  }
  for (const id of request.outputPortIds) {
    if (ports.get(id)?.direction !== 'output') errors.push(`port ${id} is not an output`);
  }

  for (const id of selected) {
    const port = ports.get(id);
    if (!port) continue;
    if (port.supportedSampleRates.length > 0 && !port.supportedSampleRates.includes(request.sampleRate)) {
      errors.push(`port ${id} does not report support for ${request.sampleRate} Hz`);
    }
    if (port.supportedBufferSizes.length > 0 && !port.supportedBufferSizes.includes(request.bufferSizeFrames)) {
      errors.push(`port ${id} does not report support for a ${request.bufferSizeFrames}-frame buffer`);
    }
  }
  return errors;
}

/**
 * Registry and negotiation boundary for future Rust/C++ audio adapters. It never
 * treats browser WebAudio, a timer or a simulated device as native evidence.
 */
export class NativeAudioAdapterRegistry {
  private readonly adapters = new Map<string, NativeAudioAdapter>();
  private readonly evidence = new Map<string, NativeAudioAdapterProbeEvidence>();

  register(adapter: NativeAudioAdapter): () => void {
    if (this.adapters.has(adapter.id)) {
      throw new NativeAudioBoundaryError('duplicate_adapter', `Native audio adapter ${adapter.id} is already registered`);
    }
    this.adapters.set(adapter.id, adapter);
    return () => {
      this.adapters.delete(adapter.id);
      this.evidence.delete(adapter.id);
    };
  }

  list(platform?: NativeAudioAdapterPlatform): readonly NativeAudioAdapter[] {
    return [...this.adapters.values()].filter((adapter) => !platform || adapter.platform === platform);
  }

  getEvidence(adapterId: string): NativeAudioAdapterProbeEvidence | undefined {
    return this.evidence.get(adapterId);
  }

  async probe(adapterId: string): Promise<NativeAudioAdapterProbeEvidence> {
    const adapter = this.adapters.get(adapterId);
    if (!adapter) {
      throw new NativeAudioBoundaryError('adapter_not_found', `Native audio adapter ${adapterId} is not registered`);
    }
    const evidence = await adapter.probe();
    if (
      evidence.adapterId !== adapter.id
      || evidence.backend !== adapter.backend
      || evidence.platform !== adapter.platform
      || !evidence.observedAt
      || !evidence.implementation
    ) {
      throw new NativeAudioBoundaryError('adapter_unavailable', `Native audio adapter ${adapterId} returned invalid probe evidence`);
    }
    this.evidence.set(adapterId, evidence);
    return evidence;
  }

  async open(adapterId: string, request: NativeAudioAdapterOpenRequest): Promise<NativeAudioAdapterStream> {
    const requestErrors = validateNativeAudioOpenRequest(request);
    if (requestErrors.length > 0) {
      throw new NativeAudioBoundaryError('invalid_configuration', requestErrors.join('; '));
    }
    const adapter = this.adapters.get(adapterId);
    if (!adapter) {
      throw new NativeAudioBoundaryError('adapter_not_found', `Native audio adapter ${adapterId} is not registered`);
    }
    const evidence = await this.probe(adapterId);
    if (evidence.state !== 'available') {
      throw new NativeAudioBoundaryError(
        'adapter_unavailable',
        evidence.message || `Native audio adapter ${adapterId} is ${evidence.state}`,
      );
    }
    const supportErrors = supportsRequest(evidence, request);
    if (supportErrors.length > 0) {
      throw new NativeAudioBoundaryError('unsupported_configuration', supportErrors.join('; '));
    }
    const stream = await adapter.open(request);
    if (stream.adapterId !== adapter.id || stream.backend !== adapter.backend) {
      await stream.close();
      throw new NativeAudioBoundaryError('adapter_unavailable', 'The opened stream did not match its adapter evidence');
    }
    return stream;
  }
}
