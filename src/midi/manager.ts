import type {
  ConnectedDevice,
  ControlMapping,
  DeviceControl,
  MIDICapabilityState,
  MIDILogEvent,
  MIDIManagerStateSnapshot,
  MIDIProcessorConfig,
} from '../types';

export type MIDIEventType = 'note_on' | 'note_off' | 'cc' | 'pitchbend' | 'aftertouch';

type MIDICallback = (
  device: ConnectedDevice,
  type: MIDIEventType,
  channel: number,
  number: number,
  value: number
) => void;

type MIDIStateCallback = (state: MIDIManagerStateSnapshot) => void;

export interface MIDIInitOptions {
  /** SysEx access has a larger permission surface and is never requested implicitly. */
  requestSysEx?: boolean;
  /** Simulator devices are for testing only and must be explicitly enabled. */
  enableSimulatedDevices?: boolean;
}

export interface ParsedMIDIMessage {
  type: MIDIEventType;
  channel: number;
  number: number;
  value: number;
}

const VIRTUAL_DEVICE_IDS = new Set([
  'virt_mpc_01',
  'virt_sp_01',
  'virt_edrum_01',
  'virt_keys_01',
]);

/** Parse supported MIDI 1.0 channel voice messages without inventing defaults. */
export const parseMIDIMessage = (data: ArrayLike<number>): ParsedMIDIMessage | null => {
  if (data.length < 1) return null;

  const status = data[0];
  if (status < 0x80 || status >= 0xf0) return null;

  const command = status & 0xf0;
  const channel = (status & 0x0f) + 1;

  if (command === 0xd0) {
    if (data.length < 2) return null;
    return { type: 'aftertouch', channel, number: 0, value: data[1] & 0x7f };
  }

  if (data.length < 3) return null;
  const data1 = data[1] & 0x7f;
  const data2 = data[2] & 0x7f;

  switch (command) {
    case 0x80:
      return { type: 'note_off', channel, number: data1, value: data2 };
    case 0x90:
      return {
        type: data2 === 0 ? 'note_off' : 'note_on',
        channel,
        number: data1,
        value: data2,
      };
    case 0xa0:
      return { type: 'aftertouch', channel, number: data1, value: data2 };
    case 0xb0:
      return { type: 'cc', channel, number: data1, value: data2 };
    case 0xe0: {
      // Pitch bend is a 14-bit little-endian value, centred at 8192.
      const signedValue = ((data2 << 7) | data1) - 8192;
      return { type: 'pitchbend', channel, number: 0, value: signedValue };
    }
    default:
      return null;
  }
};

class MIDIManager {
  private midiAccess: MIDIAccess | null = null;
  private connectedDevices: Map<string, ConnectedDevice> = new Map();
  private inputPorts: Map<string, MIDIInput> = new Map();
  private listeners: Set<MIDICallback> = new Set();
  private stateListeners: Set<MIDIStateCallback> = new Set();
  private eventLogs: MIDILogEvent[] = [];
  private capabilityState: MIDICapabilityState = {
    status: 'uninitialized',
    sysex: 'not_requested',
    message: 'MIDI access has not been requested.',
    updatedAt: Date.now(),
  };

  // Mapping & Learn State
  private activeMappings: ControlMapping[] = [];
  private isLearning = false;
  private learningCallback: ((control: DeviceControl) => void) | null = null;

  // Virtual Simulator Device
  private virtualDevicesCreated = false;

  public async initMIDI(options: MIDIInitOptions = {}): Promise<boolean> {
    if (options.enableSimulatedDevices === true) this.enableSimulatedDevices();

    if (this.midiAccess) {
      this.scanHardwarePorts();
      return true;
    }

    const requestSysEx = options.requestSysEx === true;
    if (typeof navigator === 'undefined' || typeof navigator.requestMIDIAccess !== 'function') {
      this.setCapabilityState({
        status: 'unsupported',
        sysex: requestSysEx ? 'unavailable' : 'not_requested',
        message: 'Web MIDI is not supported in this runtime.',
      });
      return false;
    }

    this.setCapabilityState({
      status: 'requesting',
      sysex: requestSysEx ? 'unavailable' : 'not_requested',
      message: requestSysEx
        ? 'Requesting MIDI access with explicit SysEx permission.'
        : 'Requesting standard MIDI access without SysEx.',
    });

    try {
      this.midiAccess = requestSysEx
        ? await navigator.requestMIDIAccess({ sysex: true })
        : await navigator.requestMIDIAccess();
      this.midiAccess.onstatechange = (event) => this.handleStateChange(event);
      this.setCapabilityState({
        status: 'available',
        sysex: requestSysEx
          ? this.midiAccess.sysexEnabled
            ? 'available'
            : 'denied'
          : 'not_requested',
        message: requestSysEx
          ? this.midiAccess.sysexEnabled
            ? 'MIDI and SysEx access are available.'
            : 'Standard MIDI is available; SysEx was not granted.'
          : 'Standard MIDI is available. SysEx was not requested.',
      });
      this.scanHardwarePorts();
      return true;
    } catch (error) {
      this.midiAccess = null;
      const errorName =
        typeof error === 'object' &&
        error !== null &&
        'name' in error &&
        typeof error.name === 'string'
          ? error.name
          : 'UnknownError';
      const denied = errorName === 'NotAllowedError' || errorName === 'SecurityError';
      this.setCapabilityState({
        status: denied ? 'denied' : 'error',
        sysex: requestSysEx ? (denied ? 'denied' : 'unavailable') : 'not_requested',
        message: denied
          ? 'MIDI access was denied or restricted by the runtime.'
          : 'MIDI access failed. No hardware capability is being assumed.',
        errorName,
      });
      console.warn('Web MIDI access unavailable', error);
      return false;
    }
  }

  private scanHardwarePorts() {
    if (!this.midiAccess) return;

    const activeInputIds = new Set<string>();
    for (const input of this.midiAccess.inputs.values()) {
      activeInputIds.add(input.id);
      this.registerPortInput(input);
    }

    for (const [id, device] of this.connectedDevices) {
      if (device.type === 'web_midi' && !activeInputIds.has(id)) {
        const input = this.inputPorts.get(id);
        if (input) input.onmidimessage = null;
        this.inputPorts.delete(id);
        this.connectedDevices.delete(id);
      }
    }
    this.notifyStateListeners();
  }

  private handleStateChange(e: MIDIConnectionEvent) {
    if (e.port && e.port.type === 'input') {
      if (e.port.state === 'connected') {
        this.registerPortInput(e.port as MIDIInput);
      } else {
        const input = this.inputPorts.get(e.port.id);
        if (input) input.onmidimessage = null;
        this.inputPorts.delete(e.port.id);
        this.connectedDevices.delete(e.port.id);
        this.notifyStateListeners();
      }
    }
  }

  private registerPortInput(input: MIDIInput) {
    let suggestedProfileId: string | undefined;
    let profileMatch: ConnectedDevice['profileMatch'] = 'generic';

    // This is only a name hint, not a negotiated statement of device capability.
    const lowerName = (input.name || '').toLowerCase();
    if (lowerName.includes('mpc')) suggestedProfileId = 'akai_mpc_live';
    else if (lowerName.includes('sp-404') || lowerName.includes('sp404')) suggestedProfileId = 'roland_sp404mk2';
    else if (lowerName.includes('drum') || lowerName.includes('nitro') || lowerName.includes('td-')) suggestedProfileId = 'alesis_edrum_nitro';
    else if (lowerName.includes('dj') || lowerName.includes('ddj')) suggestedProfileId = 'pioneer_ddj_400';
    else if (lowerName.includes('keys') || lowerName.includes('mpk') || lowerName.includes('launchkey')) suggestedProfileId = 'akai_mpk_mini';
    if (suggestedProfileId) profileMatch = 'name_hint';

    const existing = this.connectedDevices.get(input.id);
    const dev: ConnectedDevice = {
      id: input.id,
      name: input.name || 'External MIDI Device',
      profileId:
        existing?.profileMatch === 'user_selected' ? existing.profileId : 'generic_sampler',
      profileMatch:
        existing?.profileMatch === 'user_selected' ? 'user_selected' : profileMatch,
      suggestedProfileId,
      type: 'web_midi',
      connected: true,
      portName: input.name || undefined,
      latencyMeasurement: {
        status: 'not_measured',
        message: 'Web MIDI does not report round-trip hardware latency.',
      },
      assignedLogicalTargetId: existing?.assignedLogicalTargetId,
      activeScene: existing?.activeScene,
      lastEventTimestamp: existing?.lastEventTimestamp,
      eventsCount: existing?.eventsCount ?? 0,
    };

    this.connectedDevices.set(input.id, dev);
    this.inputPorts.set(input.id, input);
    input.onmidimessage = (msg) => this.handleMIDIMessage(dev, msg);
    this.notifyStateListeners();
  }

  private setupVirtualDevices() {
    const virtualMpc: ConnectedDevice = {
      id: 'virt_mpc_01',
      name: 'Simulated Akai MPC Controller',
      profileId: 'akai_mpc_live',
      profileMatch: 'simulator_definition',
      type: 'virtual_sim',
      connected: true,
      latencyMeasurement: {
        status: 'unsupported',
        message: 'A simulator has no measurable physical round trip.',
      },
      eventsCount: 0,
    };

    const virtualSp: ConnectedDevice = {
      id: 'virt_sp_01',
      name: 'Simulated Roland SP-404MKII',
      profileId: 'roland_sp404mk2',
      profileMatch: 'simulator_definition',
      type: 'virtual_sim',
      connected: true,
      latencyMeasurement: {
        status: 'unsupported',
        message: 'A simulator has no measurable physical round trip.',
      },
      eventsCount: 0,
    };

    const virtualEdrum: ConnectedDevice = {
      id: 'virt_edrum_01',
      name: 'Simulated Electronic Drum Kit',
      profileId: 'alesis_edrum_nitro',
      profileMatch: 'simulator_definition',
      type: 'virtual_sim',
      connected: true,
      latencyMeasurement: {
        status: 'unsupported',
        message: 'A simulator has no measurable physical round trip.',
      },
      eventsCount: 0,
    };

    const virtualKeys: ConnectedDevice = {
      id: 'virt_keys_01',
      name: 'Simulated 49-Key MIDI Keyboard',
      profileId: 'akai_mpk_mini',
      profileMatch: 'simulator_definition',
      type: 'virtual_sim',
      connected: true,
      latencyMeasurement: {
        status: 'unsupported',
        message: 'A simulator has no measurable physical round trip.',
      },
      eventsCount: 0,
    };

    this.connectedDevices.set(virtualMpc.id, virtualMpc);
    this.connectedDevices.set(virtualSp.id, virtualSp);
    this.connectedDevices.set(virtualEdrum.id, virtualEdrum);
    this.connectedDevices.set(virtualKeys.id, virtualKeys);
  }

  public enableSimulatedDevices(): void {
    if (this.virtualDevicesCreated) return;
    this.setupVirtualDevices();
    this.virtualDevicesCreated = true;
    this.notifyStateListeners();
  }

  public disableSimulatedDevices(): void {
    if (!this.virtualDevicesCreated) return;
    VIRTUAL_DEVICE_IDS.forEach((id) => this.connectedDevices.delete(id));
    this.virtualDevicesCreated = false;
    this.notifyStateListeners();
  }

  private handleMIDIMessage(device: ConnectedDevice, event: MIDIMessageEvent) {
    if (!event.data) return;
    const parsed = parseMIDIMessage(event.data);
    if (!parsed) return;
    const { type, channel, number, value } = parsed;

    device.lastEventTimestamp = Date.now();
    device.eventsCount = (device.eventsCount || 0) + 1;

    // Log Event
    const logItem: MIDILogEvent = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      deviceName: device.name,
      type: type.toUpperCase(),
      channel,
      number,
      value,
    };
    this.eventLogs.unshift(logItem);
    if (this.eventLogs.length > 50) this.eventLogs.pop();

    // Trigger Learning Callback if active
    if (this.isLearning && this.learningCallback) {
      const learnedControl: DeviceControl = {
        id: `learned_${type}_${number}`,
        name:
          type === 'cc'
            ? `CC #${number}`
            : type === 'pitchbend'
              ? 'Pitch Bend'
              : type === 'aftertouch'
                ? 'Aftertouch'
                : `Note #${number}`,
        type: type === 'cc' ? 'knob' : type === 'pitchbend' ? 'wheel' : 'pad',
        midiType:
          type === 'cc'
            ? 'cc'
            : type === 'pitchbend'
              ? 'pitchbend'
              : type === 'aftertouch'
                ? 'aftertouch'
                : 'note',
        channel,
        number: type === 'pitchbend' ? undefined : number,
      };
      this.learningCallback(learnedControl);
      this.isLearning = false;
      this.learningCallback = null;
    }

    // Broadcast to listeners
    this.notifyStateListeners();
    this.listeners.forEach((cb) => cb(device, type, channel, number, value));
  }

  // Simulate Virtual Hardware Event (from UI buttons / keyboard)
  public simulateInput(
    deviceId: string,
    type: 'note_on' | 'note_off' | 'cc' | 'pitchbend' | 'aftertouch',
    channel: number,
    number: number,
    value: number
  ): boolean {
    // Invoking the simulation API is itself an explicit opt-in. Never attach a
    // synthetic event to a real port merely because it happens to be first.
    this.enableSimulatedDevices();
    let dev = this.connectedDevices.get(deviceId);
    if (!dev || dev.type !== 'virtual_sim') dev = this.connectedDevices.get('virt_mpc_01');
    if (!dev) return false;

    const eventNumber = type === 'pitchbend' ? 0 : Math.min(127, Math.max(0, number));
    const eventValue =
      type === 'pitchbend'
        ? Math.min(8191, Math.max(-8192, value))
        : Math.min(127, Math.max(0, value));

    dev.lastEventTimestamp = Date.now();
    dev.eventsCount = (dev.eventsCount || 0) + 1;

    const logItem: MIDILogEvent = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      deviceName: dev.name,
      type: type.toUpperCase(),
      channel,
      number: eventNumber,
      value: eventValue,
    };
    this.eventLogs.unshift(logItem);
    if (this.eventLogs.length > 50) this.eventLogs.pop();

    this.notifyStateListeners();
    this.listeners.forEach((cb) => cb(dev!, type, channel, eventNumber, eventValue));
    return true;
  }

  // Subscriptions
  public subscribe(cb: MIDICallback): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  public subscribeState(cb: MIDIStateCallback, emitCurrent = true): () => void {
    this.stateListeners.add(cb);
    if (emitCurrent) cb(this.getStateSnapshot());
    return () => {
      this.stateListeners.delete(cb);
    };
  }

  public getCapabilityState(): MIDICapabilityState {
    return { ...this.capabilityState };
  }

  public getStateSnapshot(): MIDIManagerStateSnapshot {
    return {
      capability: this.getCapabilityState(),
      connectedDevices: this.getConnectedDevices(),
      simulatedDevicesEnabled: this.virtualDevicesCreated,
    };
  }

  private setCapabilityState(state: Omit<MIDICapabilityState, 'updatedAt'>): void {
    this.capabilityState = { ...state, updatedAt: Date.now() };
    this.notifyStateListeners();
  }

  private notifyStateListeners(): void {
    if (this.stateListeners.size === 0) return;
    const snapshot = this.getStateSnapshot();
    this.stateListeners.forEach((cb) => cb(snapshot));
  }

  public getConnectedDevices(): ConnectedDevice[] {
    return Array.from(this.connectedDevices.values(), (device) => ({
      ...device,
      latencyMeasurement: device.latencyMeasurement
        ? { ...device.latencyMeasurement }
        : undefined,
    }));
  }

  public getEventLogs(): MIDILogEvent[] {
    return [...this.eventLogs];
  }

  // MIDI Learn Mode
  public startLearning(callback: (control: DeviceControl) => void) {
    this.isLearning = true;
    this.learningCallback = callback;
  }

  public cancelLearning() {
    this.isLearning = false;
    this.learningCallback = null;
  }

  // MIDI Processor logic (Chord generator, Scale quantizer, Arp)
  public processMIDIProcessors(
    note: number,
    velocity: number,
    processors: MIDIProcessorConfig[]
  ): { notes: number[]; velocity: number } {
    let resultNotes = [note];
    let resultVel = velocity;

    processors.forEach((proc) => {
      if (!proc.enabled) return;

      if (proc.type === 'transpose') {
        const semitones = proc.settings.semitones || 0;
        resultNotes = resultNotes.map((n) => n + semitones);
      } else if (proc.type === 'chord') {
        const chordType = proc.settings.chordType || 'major';
        const chordNotes: number[] = [];
        resultNotes.forEach((baseNote) => {
          chordNotes.push(baseNote);
          if (chordType === 'major') chordNotes.push(baseNote + 4, baseNote + 7);
          else if (chordType === 'minor') chordNotes.push(baseNote + 3, baseNote + 7);
          else if (chordType === 'maj7') chordNotes.push(baseNote + 4, baseNote + 7, baseNote + 11);
          else if (chordType === 'min7') chordNotes.push(baseNote + 3, baseNote + 7, baseNote + 10);
        });
        resultNotes = chordNotes;
      } else if (proc.type === 'humanize') {
        const amount = proc.settings.amount || 10;
        resultVel = Math.min(127, Math.max(1, resultVel + Math.floor((Math.random() - 0.5) * amount)));
      }
    });

    return { notes: resultNotes, velocity: resultVel };
  }
}

export const midiManager = new MIDIManager();
