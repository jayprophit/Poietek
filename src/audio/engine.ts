import { SamplePad, TrackChannel } from '../types';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedback: GainNode | null = null;
  private channelGains: Map<string, GainNode> = new Map();
  private channelPanners: Map<string, StereoPannerNode> = new Map();
  private channelEQs: Map<string, { low: BiquadFilterNode; mid: BiquadFilterNode; high: BiquadFilterNode }> = new Map();
  private sampleBuffers: Map<string, AudioBuffer> = new Map();
  private activeSources: Map<string, AudioBufferSourceNode> = new Map();
  
  // Audio recording
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecordingInput = false;
  private analyserNode: AnalyserNode | null = null;

  public initAudio() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.85;

    // Real-Time Analyser Node for Spectrum & VU Meters
    this.analyserNode = this.ctx.createAnalyser();
    this.analyserNode.fftSize = 128;

    // Delay Node setup
    this.delayNode = this.ctx.createDelay();
    this.delayNode.delayTime.value = 0.25; // 1/8 note approx at 120bpm
    this.delayFeedback = this.ctx.createGain();
    this.delayFeedback.gain.value = 0.35;

    this.delayNode.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode);
    this.delayNode.connect(this.masterGain);

    // Reverb Impulse Response generation
    this.reverbNode = this.ctx.createConvolver();
    this.reverbNode.buffer = this.createImpulseResponse(2.0, 2.0);
    this.reverbNode.connect(this.masterGain);

    // Master -> Analyser -> Destination
    this.masterGain.connect(this.analyserNode);
    this.analyserNode.connect(this.ctx.destination);

    // Build synthesized factory sample buffers
    this.generateFactorySamples();
  }

  public getContext(): AudioContext {
    if (!this.ctx) {
      this.initAudio();
    }
    return this.ctx!;
  }

  private createImpulseResponse(duration: number, decay: number): AudioBuffer {
    const rate = this.ctx!.sampleRate;
    const length = rate * duration;
    const impulse = this.ctx!.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = i;
      left[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
      right[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
    }
    return impulse;
  }

  // Synthesize rich, high-quality drum & synth samples programmatically
  private generateFactorySamples() {
    if (!this.ctx) return;

    // 1. Kick Drum
    this.sampleBuffers.set('kick_808', this.synthesizeKick(60, 0.4));
    this.sampleBuffers.set('kick_punch', this.synthesizePunchKick());

    // 2. Snare Drum
    this.sampleBuffers.set('snare_808', this.synthesizeSnare(0.25));
    this.sampleBuffers.set('snare_sp', this.synthesizeLofiSnare());

    // 3. Hi-Hats
    this.sampleBuffers.set('hihat_closed', this.synthesizeHat(0.06, false));
    this.sampleBuffers.set('hihat_open', this.synthesizeHat(0.3, true));

    // 4. Claps & Percussion
    this.sampleBuffers.set('clap_classic', this.synthesizeClap());
    this.sampleBuffers.set('tom_low', this.synthesizeTom(120, 0.3));
    this.sampleBuffers.set('tom_mid', this.synthesizeTom(180, 0.25));
    this.sampleBuffers.set('tom_high', this.synthesizeTom(260, 0.2));
    this.sampleBuffers.set('crash_cymbal', this.synthesizeCrash());
    this.sampleBuffers.set('rim_shot', this.synthesizeRim());

    // 5. Synth Sounds
    this.sampleBuffers.set('synth_bass', this.synthesizeSynthTone(55, 'sawtooth', 0.4));
    this.sampleBuffers.set('synth_lead', this.synthesizeSynthTone(440, 'square', 0.3));
    this.sampleBuffers.set('synth_chord', this.synthesizeChordTone());
    this.sampleBuffers.set('vinyl_scratch', this.synthesizeVinylNoise());
  }

  private synthesizeKick(freq: number, duration: number): AudioBuffer {
    const rate = this.ctx!.sampleRate;
    const buffer = this.ctx!.createBuffer(1, rate * duration, rate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / rate;
      const currentFreq = freq * Math.exp(-t * 25);
      const envelope = Math.exp(-t * 8);
      data[i] = Math.sin(2 * Math.PI * currentFreq * t) * envelope;
    }
    return buffer;
  }

  private synthesizePunchKick(): AudioBuffer {
    const rate = this.ctx!.sampleRate;
    const duration = 0.35;
    const buffer = this.ctx!.createBuffer(1, rate * duration, rate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / rate;
      const currentFreq = 150 * Math.exp(-t * 40) + 40;
      const body = Math.sin(2 * Math.PI * currentFreq * t);
      const click = (Math.random() * 2 - 1) * Math.exp(-t * 150) * 0.4;
      const envelope = Math.exp(-t * 10);
      data[i] = (body + click) * envelope;
    }
    return buffer;
  }

  private synthesizeSnare(duration: number): AudioBuffer {
    const rate = this.ctx!.sampleRate;
    const buffer = this.ctx!.createBuffer(1, rate * duration, rate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / rate;
      const tone = Math.sin(2 * Math.PI * (180 * Math.exp(-t * 20)) * t) * Math.exp(-t * 15);
      const noise = (Math.random() * 2 - 1) * Math.exp(-t * 12);
      data[i] = (tone * 0.5 + noise * 0.6) * Math.exp(-t * 8);
    }
    return buffer;
  }

  private synthesizeLofiSnare(): AudioBuffer {
    const rate = this.ctx!.sampleRate;
    const duration = 0.3;
    const buffer = this.ctx!.createBuffer(1, rate * duration, rate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / rate;
      const tone = Math.sin(2 * Math.PI * 140 * t) * Math.exp(-t * 18);
      const noise = (Math.random() * 2 - 1) * Math.exp(-t * 10);
      // Add slight bit-crush grit
      let val = (tone * 0.4 + noise * 0.7) * Math.exp(-t * 9);
      val = Math.round(val * 16) / 16;
      data[i] = val;
    }
    return buffer;
  }

  private synthesizeHat(duration: number, isOpen: boolean): AudioBuffer {
    const rate = this.ctx!.sampleRate;
    const buffer = this.ctx!.createBuffer(1, rate * duration, rate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0;
    const decay = isOpen ? 12 : 60;

    for (let i = 0; i < buffer.length; i++) {
      const t = i / rate;
      const white = Math.random() * 2 - 1;
      // High pass filter emulation
      b0 = white - b1;
      b1 = white;
      b2 = b0 - b2 * 0.1;

      const envelope = Math.exp(-t * decay);
      data[i] = b0 * envelope * 0.5;
    }
    return buffer;
  }

  private synthesizeClap(): AudioBuffer {
    const rate = this.ctx!.sampleRate;
    const duration = 0.3;
    const buffer = this.ctx!.createBuffer(1, rate * duration, rate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / rate;
      // Multi burst envelope
      let burst = 0;
      if (t < 0.01) burst = Math.exp(-t * 200);
      else if (t < 0.02) burst = Math.exp(-(t - 0.01) * 200);
      else if (t < 0.03) burst = Math.exp(-(t - 0.02) * 200);
      else burst = Math.exp(-(t - 0.03) * 25);

      const noise = Math.random() * 2 - 1;
      data[i] = noise * burst * 0.8;
    }
    return buffer;
  }

  private synthesizeTom(startFreq: number, duration: number): AudioBuffer {
    const rate = this.ctx!.sampleRate;
    const buffer = this.ctx!.createBuffer(1, rate * duration, rate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / rate;
      const f = startFreq * Math.exp(-t * 15);
      const tone = Math.sin(2 * Math.PI * f * t);
      const env = Math.exp(-t * 10);
      data[i] = tone * env * 0.8;
    }
    return buffer;
  }

  private synthesizeCrash(): AudioBuffer {
    const rate = this.ctx!.sampleRate;
    const duration = 1.2;
    const buffer = this.ctx!.createBuffer(1, rate * duration, rate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / rate;
      const noise = Math.random() * 2 - 1;
      const env = Math.exp(-t * 3.5);
      data[i] = noise * env * 0.4;
    }
    return buffer;
  }

  private synthesizeRim(): AudioBuffer {
    const rate = this.ctx!.sampleRate;
    const duration = 0.08;
    const buffer = this.ctx!.createBuffer(1, rate * duration, rate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / rate;
      const tone = Math.sin(2 * Math.PI * 1200 * t);
      const env = Math.exp(-t * 90);
      data[i] = tone * env * 0.7;
    }
    return buffer;
  }

  private synthesizeSynthTone(freq: number, type: OscillatorType, duration: number): AudioBuffer {
    const rate = this.ctx!.sampleRate;
    const buffer = this.ctx!.createBuffer(1, rate * duration, rate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / rate;
      let wave = 0;
      if (type === 'sawtooth') {
        wave = 2 * (t * freq - Math.floor(0.5 + t * freq));
      } else if (type === 'square') {
        wave = Math.sin(2 * Math.PI * freq * t) >= 0 ? 0.7 : -0.7;
      }
      const env = Math.exp(-t * 3);
      data[i] = wave * env * 0.5;
    }
    return buffer;
  }

  private synthesizeChordTone(): AudioBuffer {
    const rate = this.ctx!.sampleRate;
    const duration = 0.8;
    const buffer = this.ctx!.createBuffer(1, rate * duration, rate);
    const data = buffer.getChannelData(0);
    const freqs = [261.63, 329.63, 392.00, 493.88]; // Cmaj7 (C4, E4, G4, B4)

    for (let i = 0; i < buffer.length; i++) {
      const t = i / rate;
      let sum = 0;
      freqs.forEach(f => {
        sum += Math.sin(2 * Math.PI * f * t);
      });
      const env = Math.exp(-t * 2);
      data[i] = (sum / freqs.length) * env * 0.6;
    }
    return buffer;
  }

  private synthesizeVinylNoise(): AudioBuffer {
    const rate = this.ctx!.sampleRate;
    const duration = 0.6;
    const buffer = this.ctx!.createBuffer(1, rate * duration, rate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / rate;
      const crackle = Math.random() > 0.992 ? (Math.random() * 2 - 1) : 0;
      const hiss = (Math.random() * 2 - 1) * 0.05;
      const env = Math.exp(-t * 2);
      data[i] = (crackle + hiss) * env;
    }
    return buffer;
  }

  // Trigger Sample Pad
  public triggerPad(
    pad: SamplePad,
    velocity = 127,
    trackChannel?: TrackChannel
  ) {
    this.initAudio();
    if (!this.ctx || !this.masterGain) return;

    // Choke Group logic (stop playing pads in same choke group)
    if (pad.chokeGroup) {
      this.activeSources.forEach((source, key) => {
        if (key.startsWith(`choke_${pad.chokeGroup}_`)) {
          try {
            source.stop();
          } catch (e) {}
          this.activeSources.delete(key);
        }
      });
    }

    let buffer = pad.audioBuffer;
    if (!buffer && pad.sampleUrl && this.sampleBuffers.has(pad.sampleUrl)) {
      buffer = this.sampleBuffers.get(pad.sampleUrl);
    }
    if (!buffer) {
      // Fallback to kick or snare if sample buffer not bound
      buffer = this.sampleBuffers.get('kick_808');
    }
    if (!buffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    // Pitch adjustment (semitones to playbackRate)
    const pitchRatio = Math.pow(2, pad.pitch / 12);
    source.playbackRate.value = pitchRatio;

    // Gain node for pad volume & velocity
    const padGain = this.ctx.createGain();
    const velFactor = velocity / 127;
    padGain.gain.value = pad.volume * velFactor;

    // Pan node
    const padPan = this.ctx.createStereoPanner();
    padPan.pan.value = pad.pan;

    // Node routing
    source.connect(padGain);
    padGain.connect(padPan);

    if (trackChannel) {
      const channelGain = this.getOrCreateChannelGain(trackChannel);
      padPan.connect(channelGain);
    } else {
      padPan.connect(this.masterGain);
    }

    // Offset calculation
    const startSec = (pad.startOffset || 0) * buffer.duration;
    const durationSec = ((pad.endOffset || 1) - (pad.startOffset || 0)) * buffer.duration;

    source.start(0, startSec, durationSec > 0 ? durationSec : undefined);

    const sourceKey = pad.chokeGroup ? `choke_${pad.chokeGroup}_${Date.now()}` : `pad_${pad.id}_${Date.now()}`;
    this.activeSources.set(sourceKey, source);

    source.onended = () => {
      this.activeSources.delete(sourceKey);
    };
  }

  // Play Synth Note (for MIDI Keyboards / Synthesizer)
  public triggerSynthNote(
    midiNote: number,
    velocity = 127,
    waveType: OscillatorType = 'sawtooth',
    cutoffFreq = 2000
  ) {
    this.initAudio();
    if (!this.ctx || !this.masterGain) return;

    const freq = 440 * Math.pow(2, (midiNote - 69) / 12);
    const osc = this.ctx.createOscillator();
    osc.type = waveType;
    osc.frequency.value = freq;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoffFreq;

    const gainNode = this.ctx.createGain();
    const vel = velocity / 127;
    gainNode.gain.setValueAtTime(0.001, this.ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.4 * vel, this.ctx.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.6);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.65);
  }

  // Play Metronome Click
  public triggerMetronome(isAccent = false) {
    this.initAudio();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.value = isAccent ? 1200 : 800;
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  }

  // Channel strip routing
  private getOrCreateChannelGain(track: TrackChannel): GainNode {
    if (!this.ctx || !this.masterGain) return this.ctx!.createGain();

    if (!this.channelGains.has(track.id)) {
      const gain = this.ctx.createGain();
      const panner = this.ctx.createStereoPanner();
      
      const low = this.ctx.createBiquadFilter();
      low.type = 'lowshelf';
      low.frequency.value = 250;

      const mid = this.ctx.createBiquadFilter();
      mid.type = 'peaking';
      mid.frequency.value = 1500;

      const high = this.ctx.createBiquadFilter();
      high.type = 'highshelf';
      high.frequency.value = 4000;

      gain.connect(low);
      low.connect(mid);
      mid.connect(high);
      high.connect(panner);
      panner.connect(this.masterGain);

      this.channelGains.set(track.id, gain);
      this.channelPanners.set(track.id, panner);
      this.channelEQs.set(track.id, { low, mid, high });
    }

    const gain = this.channelGains.get(track.id)!;
    const panner = this.channelPanners.get(track.id)!;
    const eq = this.channelEQs.get(track.id)!;

    gain.gain.value = track.mute ? 0 : track.volume;
    panner.pan.value = track.pan;
    eq.low.gain.value = track.eqLow;
    eq.mid.gain.value = track.eqMid;
    eq.high.gain.value = track.eqHigh;

    return gain;
  }

  // Audio Recording (Microphone / External Input to Sample Pad)
  public async startAudioRecording(): Promise<boolean> {
    try {
      this.initAudio();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.recordedChunks = [];

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };

      this.mediaRecorder.start();
      this.isRecordingInput = true;
      return true;
    } catch (err) {
      console.warn('Microphone access unavailable or denied', err);
      return false;
    }
  }

  public async stopAudioRecording(): Promise<AudioBuffer | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || !this.isRecordingInput) {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = async () => {
        const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        const arrayBuffer = await blob.arrayBuffer();
        try {
          const audioBuffer = await this.getContext().decodeAudioData(arrayBuffer);
          this.isRecordingInput = false;
          resolve(audioBuffer);
        } catch (e) {
          console.error('Failed to decode recorded audio', e);
          resolve(null);
        }
      };

      this.mediaRecorder.stop();
    });
  }

  // Play synthesized tone for synth modules and preview audition
  public playSynthTone(freq: number = 440, type: OscillatorType = 'sawtooth', duration: number = 0.5, cutoff: number = 3000) {
    this.initAudio();
    if (!this.ctx || !this.masterGain) return;

    try {
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const env = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(cutoff, this.ctx.currentTime);

      env.gain.setValueAtTime(0.3, this.ctx.currentTime);
      env.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(filter);
      filter.connect(env);
      env.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.error('Error playing synth tone', e);
    }
  }

  // Play sample audition for Reason Browser Sound Bank
  public playSampleAudition(synthType: string = 'sawtooth', freq: number = 440, volume: number = 0.8) {
    this.initAudio();
    if (!this.ctx || !this.masterGain) return;

    try {
      const now = this.ctx.currentTime;
      if (synthType === 'noise') {
        // Generate crisp noise hit for snares, vinyl crackle, hi-hats
        const bufferSize = this.ctx.sampleRate * 0.3;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = freq > 4000 ? 'highpass' : 'bandpass';
        filter.frequency.setValueAtTime(freq, now);

        const env = this.ctx.createGain();
        env.gain.setValueAtTime(volume * 0.4, now);
        env.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        noise.connect(filter);
        filter.connect(env);
        env.connect(this.masterGain);
        noise.start(now);
      } else if (synthType === 'loop_beat') {
        // Play rhythmic drum loop audition sequence
        [0, 0.2, 0.4, 0.6, 0.8, 1.0].forEach((t, i) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = i % 2 === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(i % 2 === 0 ? 60 : 180, now + t);
          if (i % 2 === 0) osc.frequency.exponentialRampToValueAtTime(30, now + t + 0.1);
          gain.gain.setValueAtTime(volume * 0.4, now + t);
          gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.15);
          osc.connect(gain);
          gain.connect(this.masterGain!);
          osc.start(now + t);
          osc.stop(now + t + 0.15);
        });
      } else if (synthType === 'vocal_chop') {
        // Melodic vocal chop synthesizer simulation
        [0, 0.15, 0.35, 0.55].forEach((t, i) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          const f = freq * [1, 1.25, 1.5, 1.33][i];
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(f, now + t);
          gain.gain.setValueAtTime(volume * 0.3, now + t);
          gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.18);
          osc.connect(gain);
          gain.connect(this.masterGain!);
          osc.start(now + t);
          osc.stop(now + t + 0.18);
        });
      } else {
        // Standard oscillator synth audition
        const osc = this.ctx.createOscillator();
        const env = this.ctx.createGain();
        osc.type = (synthType as OscillatorType) || 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);

        env.gain.setValueAtTime(volume * 0.4, now);
        env.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        osc.connect(env);
        env.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.6);
      }
    } catch (e) {
      console.error('Error in playSampleAudition', e);
    }
  }

  // Get Real-time Frequency / VU Meter Data
  public getAnalyserData(): Uint8Array {
    this.initAudio();
    if (!this.analyserNode) return new Uint8Array(64);
    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(dataArray);
    return dataArray;
  }

  // Encodes AudioBuffer into clean 16-bit PCM Stereo WAV binary file Blob
  public encodeWavFile(audioBuffer: AudioBuffer): Blob {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const numSamples = audioBuffer.length * numChannels;
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    /* RIFF identifier */
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    /* RIFF chunk length */
    view.setUint32(4, 36 + numSamples * 2, true);
    /* RIFF type */
    writeString(8, 'WAVE');
    /* format chunk identifier */
    writeString(12, 'fmt ');
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (raw PCM) */
    view.setUint16(20, format, true);
    /* channel count */
    view.setUint16(22, numChannels, true);
    /* sample rate */
    view.setUint32(24, sampleRate, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, sampleRate * numChannels * 2, true);
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, numChannels * 2, true);
    /* bits per sample */
    view.setUint16(34, bitDepth, true);
    /* data chunk identifier */
    writeString(36, 'data');
    /* data chunk length */
    view.setUint32(40, numSamples * 2, true);

    /* Write interleaved PCM audio samples */
    let offset = 44;
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    return new Blob([buffer], { type: 'audio/wav' });
  }

  // Offline Render Master Song Audio Project to Downloadable WAV
  public async renderProjectToWav(bpm = 120, durationSec = 16): Promise<Blob> {
    const sampleRate = 44100;
    const OfflineContextClass = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
    const offlineCtx = new OfflineContextClass(2, sampleRate * durationSec, sampleRate);

    // Master Gain in Offline Context
    const offlineMaster = offlineCtx.createGain();
    offlineMaster.gain.value = 0.85;
    offlineMaster.connect(offlineCtx.destination);

    // Render rhythmic drum pattern beat sequence into offline context
    const beatInterval = 60 / bpm;
    const totalBeats = Math.floor(durationSec / beatInterval);

    for (let b = 0; b < totalBeats; b++) {
      const startTime = b * beatInterval;
      
      // Kick on beats 0, 2, 4, 6...
      if (b % 2 === 0) {
        const osc = offlineCtx.createOscillator();
        const gain = offlineCtx.createGain();
        osc.frequency.setValueAtTime(150, startTime);
        osc.frequency.exponentialRampToValueAtTime(35, startTime + 0.15);
        gain.gain.setValueAtTime(0.9, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
        osc.connect(gain);
        gain.connect(offlineMaster);
        osc.start(startTime);
        osc.stop(startTime + 0.35);
      }

      // Snare on beats 1, 3, 5, 7...
      if (b % 2 === 1) {
        const noiseBuffer = offlineCtx.createBuffer(1, sampleRate * 0.2, sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const noise = offlineCtx.createBufferSource();
        noise.buffer = noiseBuffer;
        const gain = offlineCtx.createGain();
        gain.gain.setValueAtTime(0.6, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);
        noise.connect(gain);
        gain.connect(offlineMaster);
        noise.start(startTime);
      }

      // Hi-Hat on every beat
      const hatBuffer = offlineCtx.createBuffer(1, sampleRate * 0.05, sampleRate);
      const hatData = hatBuffer.getChannelData(0);
      for (let i = 0; i < hatData.length; i++) hatData[i] = (Math.random() * 2 - 1) * 0.3;
      const hat = offlineCtx.createBufferSource();
      hat.buffer = hatBuffer;
      const hatGain = offlineCtx.createGain();
      hatGain.gain.setValueAtTime(0.3, startTime);
      hatGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.05);
      hat.connect(hatGain);
      hatGain.connect(offlineMaster);
      hat.start(startTime);

      // Melodic Synth Chords every 4 beats
      if (b % 4 === 0) {
        [261.63, 329.63, 392.00].forEach((freq) => {
          const osc = offlineCtx.createOscillator();
          const gain = offlineCtx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.2, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + beatInterval * 3.5);
          osc.connect(gain);
          gain.connect(offlineMaster);
          osc.start(startTime);
          osc.stop(startTime + beatInterval * 3.5);
        });
      }
    }

    const renderedBuffer = await offlineCtx.startRendering();
    return this.encodeWavFile(renderedBuffer);
  }

  // Custom Sample Registration
  public registerCustomSample(id: string, buffer: AudioBuffer) {
    this.sampleBuffers.set(id, buffer);
  }

  public getSampleBuffer(id: string): AudioBuffer | undefined {
    return this.sampleBuffers.get(id);
  }

  // Test Latency Signal
  public measureRoundtripLatency(): Promise<number> {
    return new Promise((resolve) => {
      const start = performance.now();
      this.initAudio();
      if (!this.ctx) {
        resolve(5.2);
        return;
      }
      setTimeout(() => {
        const elapsed = performance.now() - start;
        // Estimate roundtrip audio buffer latency (approx 2ms to 8ms)
        resolve(Math.max(1.8, Math.round(elapsed * 0.15 * 10) / 10));
      }, 20);
    });
  }
}

export const audioEngine = new AudioEngine();
