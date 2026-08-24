/**
 * Serializable hardware, routing and clock-domain contracts.
 *
 * These records deliberately separate desired configuration from observations.
 * A saved profile or routing choice is not evidence that a device is connected,
 * that a clock is locked, or that a latency value has been measured.
 */

export const HARDWARE_FOUNDATION_SCHEMA_VERSION = "1.0.0" as const;
export const HARDWARE_FOUNDATION_EXTENSION_KEY =
  "org.poietek.hardware-foundation" as const;

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export type HardwareCapabilityState =
  | "available"
  | "degraded"
  | "unavailable"
  | "not_measured";

export type HardwareCapabilityEvidence =
  | {
      kind: "adapter_negotiation";
      adapterId: string;
      probeId: string;
    }
  | {
      kind: "physical_loopback";
      evidenceId: string;
    };

/** A runtime observation, never a capability inferred from a product name. */
export interface HardwareCapabilityReport {
  capabilityId: string;
  state: HardwareCapabilityState;
  source: "adapter" | "physical_measurement" | "unknown";
  implementationId: string | null;
  observedAt: string | null;
  reasonCode: string | null;
  message: string | null;
  limitations: string[];
  evidence: HardwareCapabilityEvidence | null;
}

export type HardwarePortMedium =
  | "analogue_audio"
  | "digital_audio"
  | "midi"
  | "control"
  | "word_clock"
  | "ltc";

export interface DeviceProfilePort {
  id: string;
  label: string;
  direction: "input" | "output" | "bidirectional";
  medium: HardwarePortMedium;
  channelCount: number;
  connector: string | null;
  declaredNominalLevel: string | null;
}

export type DeviceProfileProvenance =
  | {
      verification: "verified";
      source: "manufacturer" | "curated_registry";
      sourceReference: string;
      digestAlgorithm: "SHA-256";
      digest: string;
      verifiedAt: string;
    }
  | {
      verification: "unverified";
      source: "user_defined" | "imported";
      sourceReference: string | null;
      digestAlgorithm: null;
      digest: null;
      verifiedAt: null;
    };

/**
 * A profile describes intended topology. Declared capabilities still require a
 * live adapter observation before they can be treated as available.
 */
export interface DeviceProfile {
  id: string;
  version: string;
  kind:
    | "audio_interface"
    | "midi_controller"
    | "digital_console"
    | "analogue_console"
    | "clock_generator"
    | "timecode_device"
    | "meter"
    | "other";
  manufacturer: string | null;
  model: string;
  declaredCapabilityIds: string[];
  ports: DeviceProfilePort[];
  provenance: DeviceProfileProvenance;
  metadata: JsonObject;
}

export interface ProfileSelection {
  profileId: string;
  selectionMethod: "explicit_user_action";
  selectedByActorId: string;
  selectedAt: string;
  verificationAtSelection: "verified" | "unverified";
  profileDigestAtSelection: string | null;
}

export type DeviceConnectionObservation =
  | {
      state: "connected" | "degraded";
      adapterId: string;
      observedAt: string;
      reason: string | null;
    }
  | {
      state: "disconnected";
      adapterId: string | null;
      observedAt: string | null;
      reason: string;
    }
  | {
      state: "not_measured";
      adapterId: null;
      observedAt: null;
      reason: string | null;
    };

/**
 * Desired and last-observed state remain durable when a device disconnects.
 * Consumers must also check `connection` before using a historic capability.
 */
export interface HardwareDeviceInstance {
  id: string;
  label: string;
  selectedProfile: ProfileSelection | null;
  connection: DeviceConnectionObservation;
  identifiers: Array<{
    scheme: "web_midi" | "web_audio" | "native" | "usb" | "network" | "custom";
    value: string;
  }>;
  desiredState: JsonObject;
  lastObservedState: JsonObject | null;
  lastObservedCapabilities: HardwareCapabilityReport[];
  metadata: JsonObject;
}

export interface HardwareAdapterDescriptor {
  adapterId: string;
  implementationId: string;
  version: string;
  /** Capabilities the adapter knows how to probe, not availability claims. */
  probeableCapabilityIds: string[];
}

export interface AdapterCapabilityObservation {
  capabilityId: string;
  state: HardwareCapabilityState;
  probeId: string;
  observedAt: string;
  reasonCode: string | null;
  message: string | null;
  limitations: string[];
}

/** Runtime adapters are intentionally outside the serializable project model. */
export interface HardwareAdapter {
  readonly descriptor: HardwareAdapterDescriptor;
  probe(capabilityIds: readonly string[]): Promise<AdapterCapabilityObservation[]>;
}

export interface HardwareEndpointRef {
  deviceId: string;
  portId: string;
  /** One-based channel number, or null when the whole port is addressed. */
  channel: number | null;
}

export type PatchVerification =
  | {
      state: "not_verified";
      verifiedByActorId: null;
      verifiedAt: null;
      evidenceId: null;
    }
  | {
      state: "user_verified";
      verifiedByActorId: string;
      verifiedAt: string;
      evidenceId: null;
    }
  | {
      state: "physical_loopback_verified";
      verifiedByActorId: string;
      verifiedAt: string;
      evidenceId: string;
    };

export interface HardwarePatchRoute {
  id: string;
  label: string;
  source: HardwareEndpointRef;
  destination: HardwareEndpointRef;
  enabled: boolean;
  verification: PatchVerification;
  notes: string | null;
}

/** Physical measurement evidence retained independently from derived values. */
export interface PhysicalLoopbackEvidence {
  id: string;
  kind: "physical_loopback";
  measurementKinds: Array<"round_trip_latency" | "analogue_level">;
  source: HardwareEndpointRef;
  return: HardwareEndpointRef;
  sampleRateHz: number;
  repetitions: number;
  procedureId: string;
  performedByActorId: string;
  performedAt: string;
  rawObservationAssetId: string | null;
  notes: string | null;
}

export type RoundTripLatencyMeasurement =
  | {
      state: "not_measured";
      roundTripSamples: null;
      roundTripMilliseconds: null;
      sampleRateHz: null;
      evidenceId: null;
    }
  | {
      state: "measured";
      roundTripSamples: number;
      roundTripMilliseconds: number;
      sampleRateHz: number;
      evidenceId: string;
    };

export type AnalogueLevelCalibration =
  | {
      state: "not_measured";
      sentLevelDbfs: null;
      measuredReturnLevelDbfs: null;
      referenceLevelDbu: null;
      correctionDb: null;
      evidenceId: null;
    }
  | {
      state: "measured";
      sentLevelDbfs: number;
      measuredReturnLevelDbfs: number;
      referenceLevelDbu: number;
      correctionDb: number;
      evidenceId: string;
    };

export interface AnalogueInsert {
  id: string;
  label: string;
  send: HardwareEndpointRef;
  return: HardwareEndpointRef;
  bypassed: boolean;
  roundTripLatency: RoundTripLatencyMeasurement;
  levelCalibration: AnalogueLevelCalibration;
  desiredSettings: JsonObject;
  lastUserConfirmedSettings: JsonObject | null;
  lastConfirmedByActorId: string | null;
  lastConfirmedAt: string | null;
}

export interface AudioTransportState {
  runState: "stopped" | "playing" | "paused" | "recording";
  requestedPositionSamples: number;
  observedPositionSamples: number | null;
  positionObservation:
    | {
        precision: "estimated" | "audio_callback_observed";
        observedAt: string;
        adapterId: string | null;
      }
    | null;
}

export interface SampleClockState {
  capability: HardwareCapabilityReport;
  source: "internal_audio_device" | "external_word_clock" | "other" | "not_selected";
  nominalSampleRateHz: number | null;
  measuredSampleRateHz: number | null;
  measuredDriftPpm: number | null;
  lockState: "locked" | "unlocked" | "holdover" | "not_measured";
  observedAt: string | null;
}

export interface MidiClockState {
  capability: HardwareCapabilityReport;
  role: "off" | "send" | "receive";
  port: HardwareEndpointRef | null;
  requestedTempoBpm: number | null;
  observedTempoBpm: number | null;
  observedJitterMilliseconds: number | null;
  syncState: "inactive" | "seeking" | "locked" | "degraded" | "not_measured";
  observedAt: string | null;
}

export interface MidiControlState {
  capability: HardwareCapabilityReport;
  enabled: boolean;
  selectedInputDeviceIds: string[];
  selectedOutputDeviceIds: string[];
  mappings: Array<{
    id: string;
    source: string;
    targetCommand: string;
    enabled: boolean;
  }>;
  lastObservedAt: string | null;
}

export interface WordClockState {
  capability: HardwareCapabilityReport;
  role: "off" | "internal_master" | "external_follower" | "distribution_output";
  input: HardwareEndpointRef | null;
  outputs: HardwareEndpointRef[];
  termination: "on" | "off" | "not_measured";
  lockState: "locked" | "unlocked" | "holdover" | "not_measured";
  observedAt: string | null;
}

export interface TimecodeSourceState {
  id: string;
  kind: "ltc" | "mtc";
  capability: HardwareCapabilityReport;
  endpoint: HardwareEndpointRef | null;
  frameRate: "23.976" | "24" | "25" | "29.97" | "29.97_drop" | "30" | null;
  direction: "off" | "generate" | "chase";
  lockState: "locked" | "unlocked" | "holdover" | "not_measured";
  observedAddress: string | null;
  observedAt: string | null;
}

export interface MeterObservation {
  id: string;
  meterId: string;
  metric: "sample_peak" | "rms" | "hardware_level" | "clip_indicator";
  value: number;
  unit: "dbfs" | "dbu" | "boolean";
  channel: number | null;
  observedAt: string;
  source: "audio_callback" | "hardware_adapter" | "physical_measurement";
}

export interface MeteringState {
  capability: HardwareCapabilityReport;
  observations: MeterObservation[];
}

export interface HardwareTimingState {
  audioTransport: AudioTransportState;
  sampleClock: SampleClockState;
  midiClock: MidiClockState;
  midiControl: MidiControlState;
  wordClock: WordClockState;
  timecode: TimecodeSourceState[];
  metering: MeteringState;
}

/** Control-state synchronization; it makes no sample-clock accuracy claim. */
export interface DigitalConsoleSync {
  id: string;
  consoleDeviceId: string;
  scope: "control_state_only";
  protocol: "midi" | "osc" | "vendor_api" | "other";
  connection: DeviceConnectionObservation;
  capability: HardwareCapabilityReport;
  direction: "push" | "pull" | "bidirectional";
  desiredParameters: JsonObject;
  lastObservedParameters: JsonObject | null;
  pendingParameterKeys: string[];
  conflictPolicy: "ask_user" | "prefer_device" | "prefer_project";
  lastSyncAt: string | null;
}

export type AnalogueRecallSnapshot =
  | {
      state: "not_confirmed";
      settings: JsonObject;
      confirmedByActorId: null;
      confirmedAt: null;
    }
  | {
      state: "user_confirmed";
      settings: JsonObject;
      confirmedByActorId: string;
      confirmedAt: string;
    };

export interface AnalogueConsoleRecord {
  id: string;
  consoleDeviceId: string;
  physicalAutomationCapability: HardwareCapabilityReport;
  desiredRecall: JsonObject;
  lastRecall: AnalogueRecallSnapshot;
  insertIds: string[];
}

export interface HardwareFoundation {
  schemaVersion: typeof HARDWARE_FOUNDATION_SCHEMA_VERSION;
  projectId: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
  profiles: DeviceProfile[];
  devices: HardwareDeviceInstance[];
  loopbackEvidence: PhysicalLoopbackEvidence[];
  patchRoutes: HardwarePatchRoute[];
  analogueInserts: AnalogueInsert[];
  digitalConsoleSync: DigitalConsoleSync[];
  analogueConsoles: AnalogueConsoleRecord[];
  timing: HardwareTimingState;
  extensions: Record<string, JsonValue>;
}
