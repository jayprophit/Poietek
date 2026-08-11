import { ConnectedDevice, ControlMapping, DeviceControl, MIDILogEvent, MIDIProcessorConfig } from '../types';

type MIDICallback = (device: ConnectedDevice, type: 'note_on' | 'note_off' | 'cc' | 'pitchbend' | 'aftertouch', channel: number, number: number, value: number) => void;

class MIDIManager {
  private midiAccess: MIDIAccess | null = null;
  private connectedDevices: Map<string, ConnectedDevice> = new Map();
  private listeners: Set<MIDICallback> = new Set();
  private eventLogs: MIDILogEvent[] = [];
  
  // Mapping & Learn State
  private activeMappings: ControlMapping[] = [];
  private isLearning = false;
  private learningCallback: ((control: DeviceControl) => void) | null = null;

  // Virtual Simulator Device
  private virtualDevicesCreated = false;

  public async initMIDI(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.requestMIDIAccess) {
      try {
        this.midiAccess = await navigator.requestMIDIAccess({ sysex: true });
        this.midiAccess.onstatechange = (e) => this.handleStateChange(e);
        this.scanHardwarePorts();
      } catch (err) {
        console.warn('Web MIDI API restricted or declined', err);
      }
    }

    // Always instantiate virtual devices so user can test and play hardware seamlessly
    if (!this.virtualDevicesCreated) {
      this.setupVirtualDevices();
      this.virtualDevicesCreated = true;
    }

    return true;
  }

  private scanHardwarePorts() {
    if (!this.midiAccess) return;

    const inputs = this.midiAccess.inputs.values();
    for (const input of inputs) {
      this.registerPortInput(input);
    }
  }

  private handleStateChange(e: MIDIConnectionEvent) {
    if (e.port && e.port.type === 'input') {
      if (e.port.state === 'connected') {
        this.registerPortInput(e.port as MIDIInput);
      } else {
        this.connectedDevices.delete(e.port.id);
      }
    }
  }

  private registerPortInput(input: MIDIInput) {
    const dev: ConnectedDevice = {
      id: input.id,
      name: input.name || 'External MIDI Device',
      profileId: 'generic_sampler',
      type: 'web_midi',
      connected: true,
      portName: input.name || undefined,
      latencyMs: 3.2,
      eventsCount: 0,
    };

    // Auto profile detection based on name keyword
    const lowerName = (input.name || '').toLowerCase();
    if (lowerName.includes('mpc')) dev.profileId = 'akai_mpc_live';
    else if (lowerName.includes('sp-404') || lowerName.includes('sp404')) dev.profileId = 'roland_sp404mk2';
    else if (lowerName.includes('drum') || lowerName.includes('nitro') || lowerName.includes('td-')) dev.profileId = 'alesis_edrum_nitro';
    else if (lowerName.includes('dj') || lowerName.includes('ddj')) dev.profileId = 'pioneer_ddj_400';
    else if (lowerName.includes('keys') || lowerName.includes('mpk') || lowerName.includes('launchkey')) dev.profileId = 'akai_mpk_mini';

    this.connectedDevices.set(input.id, dev);

    input.onmidimessage = (msg) => this.handleMIDIMessage(dev, msg);
  }

  private setupVirtualDevices() {
    const virtualMpc: ConnectedDevice = {
      id: 'virt_mpc_01',
      name: 'Virtual Akai MPC Controller',
      profileId: 'akai_mpc_live',
      type: 'virtual_sim',
      connected: true,
      latencyMs: 1.2,
      eventsCount: 0,
    };

    const virtualSp: ConnectedDevice = {
      id: 'virt_sp_01',
      name: 'Virtual Roland SP-404MKII',
      profileId: 'roland_sp404mk2',
      type: 'virtual_sim',
      connected: true,
      latencyMs: 1.5,
      eventsCount: 0,
    };

    const virtualEdrum: ConnectedDevice = {
      id: 'virt_edrum_01',
      name: 'Virtual Electronic Drum Kit',
      profileId: 'alesis_edrum_nitro',
      type: 'virtual_sim',
      connected: true,
      latencyMs: 2.1,
      eventsCount: 0,
    };

    const virtualKeys: ConnectedDevice = {
      id: 'virt_keys_01',
      name: 'Virtual 49-Key MIDI Keyboard',
      profileId: 'akai_mpk_mini',
      type: 'virtual_sim',
      connected: true,
      latencyMs: 1.0,
      eventsCount: 0,
    };

    this.connectedDevices.set(virtualMpc.id, virtualMpc);
    this.connectedDevices.set(virtualSp.id, virtualSp);
    this.connectedDevices.set(virtualEdrum.id, virtualEdrum);
    this.connectedDevices.set(virtualKeys.id, virtualKeys);
  }

  private handleMIDIMessage(device: ConnectedDevice, event: MIDIMessageEvent) {
    if (!event.data) return;
    const [status, data1, data2] = event.data;

    const command = status >> 4;
    const channel = (status & 0x0f) + 1;
    let type: 'note_on' | 'note_off' | 'cc' | 'pitchbend' | 'aftertouch' = 'note_on';

    if (command === 0x9) {
      type = data2 > 0 ? 'note_on' : 'note_off';
    } else if (command === 0x8) {
      type = 'note_off';
    } else if (command === 0x0b) {
      type = 'cc';
    } else if (command === 0x0e) {
      type = 'pitchbend';
    } else if (command === 0x0a || command === 0x0d) {
      type = 'aftertouch';
    }

    device.lastEventTimestamp = Date.now();
    device.eventsCount = (device.eventsCount || 0) + 1;

    // Log Event
    const logItem: MIDILogEvent = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      deviceName: device.name,
      type: type.toUpperCase(),
      channel,
      number: data1,
      value: data2,
    };
    this.eventLogs.unshift(logItem);
    if (this.eventLogs.length > 50) this.eventLogs.pop();

    // Trigger Learning Callback if active
    if (this.isLearning && this.learningCallback) {
      const learnedControl: DeviceControl = {
        id: `learned_${data1}`,
        name: type === 'cc' ? `CC #${data1}` : `Note #${data1}`,
        type: type === 'cc' ? 'knob' : 'pad',
        midiType: type === 'cc' ? 'cc' : 'note',
        channel,
        number: data1,
      };
      this.learningCallback(learnedControl);
      this.isLearning = false;
      this.learningCallback = null;
    }

    // Broadcast to listeners
    this.listeners.forEach((cb) => cb(device, type, channel, data1, data2));
  }

  // Simulate Virtual Hardware Event (from UI buttons / keyboard)
  public simulateInput(
    deviceId: string,
    type: 'note_on' | 'note_off' | 'cc' | 'pitchbend' | 'aftertouch',
    channel: number,
    number: number,
    value: number
  ) {
    let dev = this.connectedDevices.get(deviceId);
    if (!dev) {
      dev = Array.from(this.connectedDevices.values())[0];
    }
    if (!dev) return;

    dev.lastEventTimestamp = Date.now();
    dev.eventsCount = (dev.eventsCount || 0) + 1;

    const logItem: MIDILogEvent = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      deviceName: dev.name,
      type: type.toUpperCase(),
      channel,
      number,
      value,
    };
    this.eventLogs.unshift(logItem);
    if (this.eventLogs.length > 50) this.eventLogs.pop();

    this.listeners.forEach((cb) => cb(dev!, type, channel, number, value));
  }

  // Subscriptions
  public subscribe(cb: MIDICallback) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  public getConnectedDevices(): ConnectedDevice[] {
    return Array.from(this.connectedDevices.values());
  }

  public getEventLogs(): MIDILogEvent[] {
    return this.eventLogs;
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
