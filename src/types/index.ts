export type RackFoundationModuleType =
  | 'note_player'
  | 'utility_gain_pan'
  | 'utility_split_merge'
  | 'effect_eq'
  | 'effect_compressor'
  | 'effect_reverb'
  | 'effect_delay'
  | 'effect_modulator'
  | 'plugin_host'
  | 'control_room'
  | 'midi_transformer'
  | 'composition_workbench'
  | 'note_forge_midi_lab'
  | 'performance_canvas'
  | 'production_regions'
  | 'editorial_memory'
  | 'tracking_console'
  | 'take_comp_studio'
  | 'session_variations'
  | 'score_workbench'
  | 'technique_matrix'
  | 'spectral_workbench'
  | 'offline_process_chain'
  | 'batch_delivery'
  | 'picture_post'
  | 'sequence_assembly'
  | 'immersive_monitor'
  | 'mastering_delivery'
  | 'live_session_hub'
  | 'action_extension_workshop'
  | 'motion_matrix'
  | 'remote_session';

export type ModuleType = WorkspaceType | RackFoundationModuleType | 'folder_combinator';

export type RackDeviceRole =
  | 'player'
  | 'instrument'
  | 'effect'
  | 'mixer'
  | 'utility'
  | 'controller';

export type RackEngineState =
  | 'operational'
  | 'control_model'
  | 'native_required'
  | 'external_required';

export type RackSignalType = 'note' | 'audio' | 'cv' | 'gate';

export interface RackModuleItem {
  id: string;
  type: ModuleType;
  title: string;
  tapeLabel: string;
  isFolded?: boolean;
  groupId?: string; // Optional parent Combinator folder ID
  subModuleIds?: string[]; // If type === 'folder_combinator'
  color?: string;
  parameters?: Record<string, number | boolean | string>;
  macroParams?: {
    filterCutoff: number;
    drive: number;
    reverbDepth: number;
    delayLevel: number;
    masterVol: number;
  };
}

export interface StudioTemplate {
  id: string;
  name: string;
  description: string;
  category: 'starter' | 'blank' | 'genre' | 'custom';
  modules: RackModuleItem[];
  bpm: number;
  hasWalkthrough?: boolean;
  isUserSaved?: boolean;
}

export type WorkspaceType =
  | 'mpc'
  | 'sp404'
  | 'keyboard'
  | 'edrum'
  | 'dj'
  | 'mixer'
  | 'patchbay'
  | 'drum_machines'
  | 'mapper'
  | 'visual_editor'
  | 'midi_matrix'
  | 'chop_lab'
  | 'health_latency'
  | 'circle_fifths'
  | 'melodyne_pitch'
  | 'd_groove'
  | 'piano_roll'
  | 'wave_sequencer'
  | 'fl_channel_rack';

export type DeviceCategory =
  | 'mpc'
  | 'sp_sampler'
  | 'generic_sampler'
  | 'keyboard'
  | 'edrum'
  | 'dj_controller'
  | 'mixer'
  | 'audio_interface'
  | 'pad_controller'
  | 'synth_hardware'
  | 'custom_diy';

export interface DeviceControl {
  id: string;
  name: string;
  type: 'pad' | 'knob' | 'fader' | 'button' | 'wheel' | 'jogwheel' | 'key' | 'pedal' | 'xypad';
  midiType: 'note' | 'cc' | 'pitchbend' | 'aftertouch';
  channel?: number; // 1-16 or 0 for any
  number?: number; // Note number (0-127) or CC number (0-127)
  x?: number; // Visual position % (0-100)
  y?: number; // Visual position % (0-100)
  width?: number;
  height?: number;
  label?: string;
  bank?: string;
}

export interface DeviceProfile {
  id: string;
  name: string;
  manufacturer: string;
  category: DeviceCategory;
  description: string;
  controls: DeviceControl[];
  defaultBankNames?: string[];
  isBuiltIn?: boolean;
  author?: string;
  rating?: number;
}

export type MIDIAccessStatus =
  | 'uninitialized'
  | 'requesting'
  | 'available'
  | 'unsupported'
  | 'denied'
  | 'error';

export type MIDISysExStatus = 'not_requested' | 'available' | 'denied' | 'unavailable';

export interface MIDICapabilityState {
  status: MIDIAccessStatus;
  sysex: MIDISysExStatus;
  message: string;
  errorName?: string;
  updatedAt: number;
}

export type DeviceLatencyStatus = 'not_measured' | 'measured' | 'unsupported' | 'error';

export interface DeviceLatencyMeasurement {
  status: DeviceLatencyStatus;
  /** Present only after a real loopback or trusted driver measurement. */
  roundTripMs?: number;
  method?: 'physical_loopback' | 'trusted_driver_report';
  measuredAt?: number;
  message?: string;
}

export interface ConnectedDevice {
  id: string;
  name: string;
  profileId: string;
  type: 'web_midi' | 'virtual_sim' | 'network' | 'usb';
  connected: boolean;
  portName?: string;
  /**
   * Legacy display field. It is intentionally absent until latency has actually
   * been measured; consumers should prefer latencyMeasurement.
   */
  latencyMs?: number;
  latencyMeasurement?: DeviceLatencyMeasurement;
  profileMatch?: 'generic' | 'name_hint' | 'user_selected' | 'simulator_definition';
  /** A non-binding suggestion inferred from a port name; never a capability claim. */
  suggestedProfileId?: string;
  assignedLogicalTargetId?: string;
  activeScene?: string;
  lastEventTimestamp?: number;
  eventsCount?: number;
}

export interface MIDIManagerStateSnapshot {
  capability: MIDICapabilityState;
  connectedDevices: ConnectedDevice[];
  simulatedDevicesEnabled: boolean;
}

export interface ControlMapping {
  id: string;
  sourceDeviceId: string;
  sourceControlId: string;
  targetLogicalId: string; // e.g. 'pad_0', 'macro_filter', 'fader_ch1', 'transport_play'
  minInput?: number;
  maxInput?: number;
  minOutput?: number;
  maxOutput?: number;
  curve?: 'linear' | 'exponential' | 'logarithmic' | 'toggle';
}

export interface SamplePad {
  id: string;
  name: string;
  sampleUrl?: string;
  audioBuffer?: AudioBuffer;
  pitch: number; // semitones (-24 to +24)
  volume: number; // 0 to 1
  pan: number; // -1 to 1
  startOffset: number; // 0 to 1
  endOffset: number; // 0 to 1
  loop: boolean;
  chokeGroup?: number;
  color: string;
  bank: string; // 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'
  rootNote: number; // default MIDI note
}

export type MachineType = 'classic_808' | 'step_sequencer' | 'mpc_style' | 'x0x_style' | 'acoustic_kit' | 'percussion' | 'generative';

export interface DrumStep {
  padId: string;
  active: boolean;
  velocity: number; // 0-127
  pitchOffset?: number;
  probability?: number; // 0-100%
}

export interface SequencePattern {
  id: string;
  name: string;
  lengthSteps: number; // e.g. 16, 32
  steps: Record<string, DrumStep[]>; // padId -> array of steps
}

export interface MIDIProcessorConfig {
  id: string;
  type: 'transpose' | 'scale' | 'chord' | 'arpeggiator' | 'velocity' | 'humanize' | 'random' | 'cc_mapper';
  enabled: boolean;
  settings: Record<string, any>;
}

export interface TrackChannel {
  id: string;
  name: string;
  color: string;
  volume: number; // 0 to 1
  pan: number; // -1 to 1
  mute: boolean;
  solo: boolean;
  eqLow: number; // dB (-12 to +12)
  eqMid: number; // dB
  eqHigh: number; // dB
  sendReverb: number; // 0 to 1
  sendDelay: number; // 0 to 1
  assignedPadIds: string[];
  instrumentType: 'sampler' | 'synth' | 'e_drum' | 'dj_deck';
}

export interface AudioInputPatch {
  id: string;
  name: string;
  type: 'mic' | 'line' | 'instrument' | 'spdif' | 'virtual';
  active: boolean;
  gain: number;
  targetTrackId: string;
}

export interface HardwareInsert {
  id: string;
  name: string;
  sendOutputChannel: number;
  returnInputChannel: number;
  latencyCompensationMs: number;
  active: boolean;
}

export interface MasterState {
  bpm: number;
  isPlaying: boolean;
  isRecording: boolean;
  currentStep: number;
  metronome: boolean;
  masterVolume: number;
  reverbLevel: number;
  delayLevel: number;
  activeWorkspace: WorkspaceType;
  selectedDeviceForEdit?: string;
  learningModeActive: boolean;
  learningTarget?: string;
}

export interface MIDILogEvent {
  id: string;
  timestamp: string;
  deviceName: string;
  type: string;
  channel: number;
  number: number;
  value: number;
}
