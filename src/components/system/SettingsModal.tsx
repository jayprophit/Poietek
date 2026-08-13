import React, { useState } from 'react';
import { useLanguage, SUPPORTED_LANGUAGES } from '../../i18n/LanguageContext';
import {
  Settings,
  Sliders,
  Volume2,
  HardDrive,
  Tv,
  Zap,
  Activity,
  X,
  Check,
  Save,
  Clock,
  Radio,
  Cpu,
  RadioTower,
  SlidersHorizontal,
  Palette,
  HelpCircle,
  Monitor,
  Gauge,
  Folder,
  Layers,
  Music,
  Globe,
  CheckCircle2,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  autoSaveEnabled: boolean;
  setAutoSaveEnabled: (enabled: boolean) => void;
  autoSaveInterval: number; // in seconds
  setAutoSaveInterval: (interval: number) => void;
  onTriggerManualSave: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  autoSaveEnabled,
  setAutoSaveEnabled,
  autoSaveInterval,
  setAutoSaveInterval,
  onTriggerManualSave,
}) => {
  const { language, setLanguage, currentLanguageObj, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'audio' | 'midi' | 'visual' | 'autosave' | 'cables' | 'language' | 'help'>('audio');

  // Audio & DSP Engine
  const [audioDriver, setAudioDriver] = useState<string>('webaudio_pro');
  const [sampleRate, setSampleRate] = useState<string>('48000');
  const [bufferSize, setBufferSize] = useState<string>('128');
  const [multithread, setMultithread] = useState<boolean>(true);
  const [oversampling, setOversampling] = useState<string>('2x');

  // MIDI & Sync Settings
  const [midiSyncSource, setMidiSyncSource] = useState<string>('internal');
  const [midiTranspose, setMidiTranspose] = useState<number>(0);
  const [pickupMode, setPickupMode] = useState<string>('soft_takeover');
  const [velocityCurve, setVelocityCurve] = useState<string>('linear');
  const [selectedMidiDevice, setSelectedMidiDevice] = useState<string>('all_devices');

  // Visual & Themes & Theme Studio Editor
  const [themeStyle, setThemeStyle] = useState<string>('reason_amber');
  const [woodTexture, setWoodTexture] = useState<string>('mahogany');
  const [knobColorStyle, setKnobColorStyle] = useState<string>('vintage_cream');
  const [ledBrightness, setLedBrightness] = useState<number>(85);
  const [ledTint, setLedTint] = useState<string>('emerald');
  const [uiScale, setUiScale] = useState<string>('100');
  const [meterFps, setMeterFps] = useState<string>('60');
  const [cableBounce, setCableBounce] = useState<boolean>(true);
  const [cableOpacity, setCableOpacity] = useState<number>(85);

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSaveSettings = () => {
    localStorage.setItem('studio_settings_driver', audioDriver);
    localStorage.setItem('studio_settings_sample_rate', sampleRate);
    localStorage.setItem('studio_settings_buffer_size', bufferSize);
    localStorage.setItem('studio_settings_multithread', String(multithread));
    localStorage.setItem('studio_settings_oversampling', oversampling);

    localStorage.setItem('studio_settings_midi_sync', midiSyncSource);
    localStorage.setItem('studio_settings_midi_transpose', String(midiTranspose));
    localStorage.setItem('studio_settings_pickup_mode', pickupMode);
    localStorage.setItem('studio_settings_velocity_curve', velocityCurve);

    localStorage.setItem('studio_settings_theme', themeStyle);
    localStorage.setItem('studio_settings_ui_scale', uiScale);
    localStorage.setItem('studio_settings_meter_fps', meterFps);
    localStorage.setItem('studio_settings_cable_bounce', String(cableBounce));
    localStorage.setItem('studio_settings_cable_opacity', String(cableOpacity));

    localStorage.setItem('studio_autosave_enabled', String(autoSaveEnabled));
    localStorage.setItem('studio_autosave_interval', String(autoSaveInterval));

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[200] flex items-center justify-center p-4 font-mono text-xs select-none animate-in fade-in duration-200">
      <div className="bg-neutral-950 border-2 border-neutral-700 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-neutral-900 border-b border-neutral-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 text-amber-400 flex items-center justify-center shadow">
              <Settings className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                STUDIO PREFERENCES & AUDIO / MIDI ENGINE
              </h2>
              <span className="text-[10px] text-neutral-400">
                DSP ENGINE • MIDI CLOCK SYNC • VISUAL THEMES • AUTOSAVE SYSTEM
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation Bar */}
        <div className="bg-neutral-900/80 border-b border-neutral-800 px-4 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('audio')}
            className={`px-3 py-1.5 rounded-xl font-black text-[11px] transition flex items-center gap-1.5 ${
              activeTab === 'audio'
                ? 'bg-amber-500 text-neutral-950 shadow'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>AUDIO & DSP</span>
          </button>

          <button
            onClick={() => setActiveTab('midi')}
            className={`px-3 py-1.5 rounded-xl font-black text-[11px] transition flex items-center gap-1.5 ${
              activeTab === 'midi'
                ? 'bg-sky-500 text-neutral-950 shadow'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            <RadioTower className="w-3.5 h-3.5" />
            <span>MIDI & SYNC</span>
          </button>

          <button
            onClick={() => setActiveTab('visual')}
            className={`px-3 py-1.5 rounded-xl font-black text-[11px] transition flex items-center gap-1.5 ${
              activeTab === 'visual'
                ? 'bg-purple-500 text-white shadow'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>VISUAL & THEMES</span>
          </button>

          <button
            onClick={() => setActiveTab('autosave')}
            className={`px-3 py-1.5 rounded-xl font-black text-[11px] transition flex items-center gap-1.5 ${
              activeTab === 'autosave'
                ? 'bg-emerald-500 text-neutral-950 shadow'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>AUTOSAVE & STORAGE</span>
          </button>

          <button
            onClick={() => setActiveTab('cables')}
            className={`px-3 py-1.5 rounded-xl font-black text-[11px] transition flex items-center gap-1.5 ${
              activeTab === 'cables'
                ? 'bg-indigo-500 text-white shadow'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>CABLE PHYSICS</span>
          </button>

          <button
            onClick={() => setActiveTab('language')}
            className={`px-3 py-1.5 rounded-xl font-black text-[11px] transition flex items-center gap-1.5 ${
              activeTab === 'language'
                ? 'bg-amber-500 text-neutral-950 shadow'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>LANGUAGE & TRANSLATOR</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[65vh] scrollbar-thin scrollbar-thumb-neutral-800">
          {/* TAB 1: AUDIO & DSP */}
          {activeTab === 'audio' && (
            <div className="space-y-4">
              <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <span className="font-bold text-neutral-200 text-xs">AUDIO DRIVER & HARDWARE LATENCY</span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    DSP STATUS: ONLINE
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">
                      AUDIO DRIVER ARCHITECTURE
                    </label>
                    <select
                      value={audioDriver}
                      onChange={(e) => setAudioDriver(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-neutral-200 font-bold focus:border-amber-500 focus:outline-none"
                    >
                      <option value="webaudio_pro">WebAudio API Pro Low-Latency Driver</option>
                      <option value="asio_pro">ASIO Pro Direct Access Driver</option>
                      <option value="coreaudio">CoreAudio Metal Engine (macOS)</option>
                      <option value="directsound">DirectSound WDM High-Buffer</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">
                      SAMPLE RATE (SAMPLING FREQUENCY)
                    </label>
                    <select
                      value={sampleRate}
                      onChange={(e) => setSampleRate(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-neutral-200 font-bold focus:border-amber-500 focus:outline-none"
                    >
                      <option value="44100">44.1 kHz (Compact Disc Quality)</option>
                      <option value="48000">48.0 kHz (Studio Broadcast Quality)</option>
                      <option value="88200">88.2 kHz (High-Resolution Sampled)</option>
                      <option value="96000">96.0 kHz (Audiophile Master Quality)</option>
                      <option value="192000">192.0 kHz (Ultra HD Studio Engine)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">
                      BUFFER SIZE (AUDIO LATENCY)
                    </label>
                    <select
                      value={bufferSize}
                      onChange={(e) => setBufferSize(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-neutral-200 font-bold focus:border-amber-500 focus:outline-none"
                    >
                      <option value="32">32 Samples (~0.7 ms Instant Live Touch)</option>
                      <option value="64">64 Samples (~1.3 ms Ultra Low Latency)</option>
                      <option value="128">128 Samples (~2.6 ms Standard Studio)</option>
                      <option value="256">256 Samples (~5.3 ms Balanced CPU)</option>
                      <option value="512">512 Samples (~10.6 ms High Buffer)</option>
                      <option value="1024">1024 Samples (~21.3 ms Heavy Mixing Buffer)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">
                      OVERSAMPLING & PHASE MODE
                    </label>
                    <select
                      value={oversampling}
                      onChange={(e) => setOversampling(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-neutral-200 font-bold focus:border-amber-500 focus:outline-none"
                    >
                      <option value="off">Off (Standard Precision)</option>
                      <option value="2x">2x Oversampling (Anti-Aliasing HQ)</option>
                      <option value="4x">4x Oversampling (Linear Phase Mastering)</option>
                      <option value="8x">8x Oversampling (Pristine Analog Saturation)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-neutral-200 block text-xs">MULTITHREAD CPU DSP PROCESSING</span>
                    <span className="text-[10px] text-neutral-400">Parallelized multi-core synthesis & FX threading.</span>
                  </div>
                  <button
                    onClick={() => setMultithread(!multithread)}
                    className={`w-12 h-6 rounded-full transition relative p-0.5 border ${
                      multithread ? 'bg-amber-500 border-amber-400' : 'bg-neutral-800 border-neutral-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-neutral-950 transition-transform ${
                        multithread ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MIDI & HARDWARE SYNC */}
          {activeTab === 'midi' && (
            <div className="space-y-4">
              <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <span className="font-bold text-neutral-200 text-xs">ACTIVE MIDI CONTROLLERS & CLOCK SYNC</span>
                  <span className="text-[10px] text-sky-400 font-bold">WEBMIDI API DETECTED</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">
                      SELECTED MIDI INPUT DEVICE
                    </label>
                    <select
                      value={selectedMidiDevice}
                      onChange={(e) => setSelectedMidiDevice(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-neutral-200 font-bold focus:border-sky-500 focus:outline-none"
                    >
                      <option value="all_devices">All Inputs (Omni Mode)</option>
                      <option value="akai_mpk">Akai MPK Mini MK3 USB</option>
                      <option value="novation_launchpad">Novation Launchpad Pro</option>
                      <option value="arturia_keystep">Arturia KeyStep Pro</option>
                      <option value="roland_sp404">Roland SP-404 MKII MIDI</option>
                      <option value="virtual_keyboard">On-Screen Virtual Keyboard</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">
                      MIDI CLOCK SYNC SOURCE
                    </label>
                    <select
                      value={midiSyncSource}
                      onChange={(e) => setMidiSyncSource(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-neutral-200 font-bold focus:border-sky-500 focus:outline-none"
                    >
                      <option value="internal">Internal Master DAW Clock</option>
                      <option value="external_clock">External MIDI Clock Sync In</option>
                      <option value="ableton_link">Ableton Link Network Sync</option>
                      <option value="mtc_timecode">MTC / MIDI Timecode SMPTE</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">
                      KNOB PICKUP & TAKEOVER MODE
                    </label>
                    <select
                      value={pickupMode}
                      onChange={(e) => setPickupMode(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-neutral-200 font-bold focus:border-sky-500 focus:outline-none"
                    >
                      <option value="soft_takeover">Soft Takeover (Wait for Match)</option>
                      <option value="jump">Jump Immediate Value</option>
                      <option value="scaled">Scaled Smooth Catchup</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">
                      VELOCITY SENSITIVITY CURVE
                    </label>
                    <select
                      value={velocityCurve}
                      onChange={(e) => setVelocityCurve(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-neutral-200 font-bold focus:border-sky-500 focus:outline-none"
                    >
                      <option value="linear">Linear Standard Curve</option>
                      <option value="soft_touch">Soft Touch (Higher Dynamics)</option>
                      <option value="hard_touch">Hard Touch (For Heavy Keys)</option>
                      <option value="fixed_127">Fixed Velocity (Always 127 Max)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                      GLOBAL MIDI KEY TRANSPOSE
                    </label>
                    <span className="text-sky-400 font-bold text-xs">{midiTranspose > 0 ? `+${midiTranspose}` : midiTranspose} Semitones</span>
                  </div>
                  <input
                    type="range"
                    min="-24"
                    max="24"
                    value={midiTranspose}
                    onChange={(e) => setMidiTranspose(Number(e.target.value))}
                    className="w-full accent-sky-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: VISUAL & THEMES */}
          {activeTab === 'visual' && (
            <div className="space-y-4">
              <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <span className="font-bold text-neutral-200 text-xs">INTERFACE THEMES & RENDER SCALING</span>
                  <span className="text-[10px] text-purple-400 font-bold">GPU RENDER ENGINE ACTIVE</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">
                      DAW COLOR THEME PRESET
                    </label>
                    <select
                      value={themeStyle}
                      onChange={(e) => setThemeStyle(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-neutral-200 font-bold focus:border-purple-500 focus:outline-none"
                    >
                      <option value="reason_amber">Reason Vintage Amber Studio</option>
                      <option value="ableton_graphite">Ableton Dark Graphite Slate</option>
                      <option value="fl_neon">FL Studio Neon Orange/Green</option>
                      <option value="cubase_blue">Cubase Pro Dark Sapphire</option>
                      <option value="cyberpunk">Cyberpunk High Contrast Neon</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">
                      UI SCALE & HIGH-DPI ZOOM
                    </label>
                    <select
                      value={uiScale}
                      onChange={(e) => setUiScale(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-neutral-200 font-bold focus:border-purple-500 focus:outline-none"
                    >
                      <option value="80">80% Compact Density</option>
                      <option value="90">90% Medium Density</option>
                      <option value="100">100% Standard DPI (Default)</option>
                      <option value="110">110% High DPI Crisp</option>
                      <option value="125">125% Large Display Scale</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">
                      AUDIO METERS REFRESH RATE
                    </label>
                    <select
                      value={meterFps}
                      onChange={(e) => setMeterFps(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-neutral-200 font-bold focus:border-purple-500 focus:outline-none"
                    >
                      <option value="30">30 FPS (Power Saver)</option>
                      <option value="60">60 FPS (Smooth Studio Standard)</option>
                      <option value="120">120 FPS (Ultra-High Precision Peak Engine)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AUTOSAVE & STORAGE */}
          {activeTab === 'autosave' && (
            <div className="space-y-4">
              <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="font-bold text-neutral-200 text-xs block">
                        AUTOMATIC REAL-TIME PROJECT SAVING
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        Automatically serializes all rack modules, mixer routing, channel settings & active songs.
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
                    className={`w-12 h-6 rounded-full transition relative p-0.5 border ${
                      autoSaveEnabled ? 'bg-emerald-500 border-emerald-400' : 'bg-neutral-800 border-neutral-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-neutral-950 transition-transform ${
                        autoSaveEnabled ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {autoSaveEnabled && (
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-2">
                        AUTOSAVE INTERVAL FREQUENCY
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[15, 30, 60, 300].map((sec) => (
                          <button
                            key={sec}
                            onClick={() => setAutoSaveInterval(sec)}
                            className={`p-2.5 rounded-xl border text-center font-bold transition ${
                              autoSaveInterval === sec
                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                            }`}
                          >
                            <span>{sec < 60 ? `${sec} SECONDS` : `${sec / 60} MINUTES`}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
                      <span className="text-[10px] text-neutral-400 font-bold">MANUAL OVERRIDE:</span>
                      <button
                        onClick={onTriggerManualSave}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl transition shadow flex items-center gap-1.5"
                      >
                        <HardDrive className="w-3.5 h-3.5" />
                        <span>TRIGGER IMMEDIATE SAVE NOW</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: CABLE PHYSICS */}
          {activeTab === 'cables' && (
            <div className="space-y-4">
              <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <div>
                    <span className="font-bold text-neutral-200 text-xs block">
                      ELASTIC REASON PATCH CABLE ANIMATION
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      Enables natural gravitational sag & sway when moving rack units.
                    </span>
                  </div>
                  <button
                    onClick={() => setCableBounce(!cableBounce)}
                    className={`w-12 h-6 rounded-full transition relative p-0.5 border ${
                      cableBounce ? 'bg-indigo-500 border-indigo-400' : 'bg-neutral-800 border-neutral-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-neutral-950 transition-transform ${
                        cableBounce ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                      CABLE TRANSLUCENCY / OPACITY
                    </label>
                    <span className="text-indigo-400 font-bold text-xs">{cableOpacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={cableOpacity}
                    onChange={(e) => setCableOpacity(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: LANGUAGE & UNIVERSAL TRANSLATOR */}
          {activeTab === 'language' && (
            <div className="space-y-4">
              <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <div>
                    <span className="font-bold text-neutral-200 text-xs block">
                      UNIVERSAL NATIVE LANGUAGE & UI TRANSLATION
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      Select your preferred language. All menus, buttons, tooltips, and guides adapt instantly.
                    </span>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-amber-400" />
                    <span>{currentLanguageObj.nativeName}</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SUPPORTED_LANGUAGES.map((lang) => {
                    const isSelected = language === lang.code;
                    return (
                      <button
                        key={lang.code}
                        onClick={() => setLanguage(lang.code)}
                        className={`p-3 rounded-xl border text-left transition flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-amber-500 text-neutral-950 border-amber-300 font-black shadow'
                            : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{lang.flag}</span>
                          <div>
                            <span className="text-xs block leading-tight">{lang.name}</span>
                            <span className="text-[9px] opacity-75 block">{lang.nativeName}</span>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 shrink-0 text-neutral-950" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-neutral-900 border-t border-neutral-800 p-4 flex items-center justify-between">
          <span className="text-[10px] text-neutral-500">SYSTEM PREFERENCES ACTIVE</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl font-bold transition"
            >
              CLOSE
            </button>
            <button
              onClick={handleSaveSettings}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl font-black transition flex items-center gap-2 shadow-lg"
            >
              {savedSuccess ? <Check className="w-4 h-4 text-emerald-950" /> : <Save className="w-4 h-4" />}
              <span>{savedSuccess ? 'PREFERENCES SAVED!' : 'APPLY PREFERENCES'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
