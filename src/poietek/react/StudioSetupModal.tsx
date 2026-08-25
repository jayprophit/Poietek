import React, {useEffect, useMemo, useState} from 'react';
import {
  Activity,
  Download,
  Gauge,
  HardDrive,
  Library,
  Music,
  Palette,
  Plug,
  RefreshCw,
  Save,
  Shield,
  Sliders,
  Upload,
  UserRoundCog,
  X,
} from 'lucide-react';
import {midiManager} from '../../midi/manager';
import type {MIDIManagerStateSnapshot} from '../../types';
import {runStudioBenchmark, type StudioBenchmarkResult} from '../diagnostics';
import {STUDIO_LIBRARY_CATALOG, summarizeStudioLibrary} from '../library';
import {
  nativeStudioDeviceInventory,
  type NativeAudioDevice,
  type NativeDeviceInventorySnapshot,
  type NativeMidiPort,
} from '../native';
import {
  BrowserStudioSettingsRepository,
  createDefaultStudioSettingsDocument,
  type StudioPreferences,
  type StudioSettingsDocument,
  validateStudioSettingsDocument,
} from '../settings';

export type StudioSetupTab = 'profiles' | 'audio' | 'midi' | 'recording' | 'editing' | 'files' | 'plugins' | 'library' | 'appearance' | 'privacy' | 'diagnostics';

export interface StudioSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplied?: (preferences: StudioPreferences) => void;
  initialTab?: StudioSetupTab;
}

const tabs: Array<{
  id: StudioSetupTab;
  label: string;
  icon: React.ComponentType<{className?: string}>;
}> = [
  {id: 'profiles', label: 'Profiles', icon: UserRoundCog},
  {id: 'devices', label: 'Devices', icon: Plug},
  {id: 'audio', label: 'Audio', icon: Sliders},
  {id: 'midi', label: 'MIDI & Sync', icon: Music},
  {id: 'recording', label: 'Recording', icon: Activity},
  {id: 'editing', label: 'Editing', icon: Plug},
  {id: 'files', label: 'Files & Recovery', icon: HardDrive},
  {id: 'plugins', label: 'Plug-ins', icon: Plug},
  {id: 'library', label: 'Modules & Content', icon: Library},
  {id: 'appearance', label: 'Appearance', icon: Palette},
  {id: 'privacy', label: 'Privacy', icon: Shield},
  {id: 'diagnostics', label: 'Benchmark', icon: Gauge},
];

function Field({label, hint, children}: {label: string; hint?: string; children: React.ReactNode}) {
  return <label className="grid gap-1 rounded-lg border border-stone-700 bg-stone-900/70 p-3 text-xs">
    <span className="font-bold text-stone-100">{label}</span>
    {hint && <span className="text-[10px] leading-4 text-stone-400">{hint}</span>}
    <span className="mt-1">{children}</span>
  </label>;
}

function Toggle({label, hint, checked, onChange, disabled = false}: {label: string; hint?: string; checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean}) {
  return <label className={`flex items-start justify-between gap-4 rounded-lg border p-3 ${disabled ? 'border-stone-800 bg-stone-950/50 text-stone-500' : 'border-stone-700 bg-stone-900/70 text-stone-100'}`}>
    <span>
      <strong className="block text-xs">{label}</strong>
      {hint && <small className="mt-1 block max-w-xl text-[10px] leading-4 text-stone-400">{hint}</small>}
    </span>
    <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} className="mt-1 h-4 w-4 accent-amber-500" />
  </label>;
}

function Select({value, onChange, children, disabled = false}: {value: string | number; onChange: (value: string) => void; children: React.ReactNode; disabled?: boolean}) {
  return <select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="w-full rounded-md border border-stone-600 bg-stone-950 px-2 py-2 text-xs text-stone-100 disabled:text-stone-500">
    {children}
  </select>;
}

function Notice({title, children, tone = 'amber'}: {title: string; children: React.ReactNode; tone?: 'amber' | 'green' | 'red'}) {
  const tones = tone === 'green' ? 'border-emerald-700 bg-emerald-950/30 text-emerald-100' : tone === 'red' ? 'border-red-800 bg-red-950/30 text-red-100' : 'border-amber-700 bg-amber-950/30 text-amber-100';
  return <div className={`rounded-lg border p-3 text-xs ${tones}`}><strong>{title}</strong><div className="mt-1 text-[11px] leading-5 opacity-85">{children}</div></div>;
}

function NativeInventoryPanel({
  kind,
  snapshot,
  onScan,
}: {
  kind: 'audio' | 'midi';
  snapshot: NativeDeviceInventorySnapshot;
  onScan: () => void;
}) {
  if (snapshot.runtime !== 'native') return null;
  const inventory = snapshot.inventory;
  const devices = inventory
    ? kind === 'audio'
      ? [...inventory.audioInputs, ...inventory.audioOutputs]
      : [...inventory.midiInputs, ...inventory.midiOutputs]
    : [];
  const isAudioDevice = (
    device: NativeAudioDevice | NativeMidiPort,
  ): device is NativeAudioDevice => 'latencyStatus' in device;

  return <div className="rounded-xl border border-blue-700/70 bg-blue-950/20 p-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-300">Native desktop inventory</p>
        <strong className="text-sm text-white">{snapshot.message}</strong>
        {snapshot.lastError && <p className="mt-1 text-[10px] text-red-300">{snapshot.lastError}</p>}
      </div>
      <button type="button" disabled={snapshot.status === 'scanning'} onClick={onScan} className="flex items-center gap-2 rounded border border-blue-500 px-3 py-2 text-[10px] font-bold text-blue-200 disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${snapshot.status === 'scanning' ? 'animate-spin' : ''}`} />Scan desktop devices</button>
    </div>
    {devices.length > 0 && <div className="mt-3 grid gap-2 md:grid-cols-2">
      {devices.map((device) => <article key={`${device.direction}:${device.id}`} className="rounded-lg border border-blue-900/80 bg-stone-950/70 p-3">
        <div className="flex items-start justify-between gap-2"><div><strong className="block text-xs text-stone-100">{device.name}</strong><span className="text-[9px] uppercase tracking-wide text-blue-300">{device.direction}{'host' in device ? ` · ${device.host}` : ''}</span></div>{'isDefault' in device && device.isDefault && <span className="rounded bg-blue-900 px-2 py-1 text-[8px] uppercase text-blue-200">OS default</span>}</div>
        {isAudioDevice(device) && device.preferredConfig && <p className="mt-2 text-[10px] text-stone-400">Preferred report: {device.preferredConfig.channels} ch · {device.preferredConfig.sampleRate.toLocaleString()} Hz · {device.preferredConfig.sampleFormat}</p>}
        <p className="mt-2 text-[9px] leading-4 text-amber-200/80">Detected only · current native engine selection unavailable{'latencyStatus' in device ? ' · latency not measured' : ''}</p>
        {device.capabilityMessage && <p className="mt-1 text-[9px] text-red-300">{device.capabilityMessage}</p>}
      </article>)}
    </div>}
    {inventory && devices.length === 0 && <p className="mt-3 rounded bg-stone-950/70 p-3 text-[10px] text-stone-400">No {kind} endpoints were returned by the operating system during this scan.</p>}
    {inventory?.warnings.map((warning) => <p key={warning} className="mt-2 text-[9px] leading-4 text-amber-200/80">{warning}</p>)}
    {inventory && <p className="mt-3 text-[9px] text-stone-500">Scanned {new Date(inventory.scannedAtEpochMs).toLocaleTimeString()} · read-only inventory · no streams or MIDI connections opened</p>}
  </div>;
}

function downloadJson(filename: string, value: unknown): void {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], {type: 'application/json'}));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export const StudioSetupModal: React.FC<StudioSetupModalProps> = ({isOpen, onClose, onApplied, initialTab = 'profiles'}) => {
  const repository = useMemo(() => new BrowserStudioSettingsRepository(), []);
  const [activeTab, setActiveTab] = useState<StudioSetupTab>(initialTab);
  const [settings, setSettings] = useState<StudioSettingsDocument>(() => repository.load());
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioReport, setAudioReport] = useState('Not inspected in this session.');
  const [midiState, setMidiState] = useState<MIDIManagerStateSnapshot>(() => midiManager.getStateSnapshot());
  const [nativeDevices, setNativeDevices] = useState<NativeDeviceInventorySnapshot>(() => nativeStudioDeviceInventory.getSnapshot());
  const [profileName, setProfileName] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [benchmark, setBenchmark] = useState<StudioBenchmarkResult | null>(null);
  const [benchmarkRunning, setBenchmarkRunning] = useState(false);
  const [warmRunning, setWarmRunning] = useState(false);
  const [warmResult, setWarmResult] = useState<any | null>(null);
  const [ringRunning, setRingRunning] = useState(false);
  const [ringResult, setRingResult] = useState<boolean | null>(null);
  const [libraryQuery, setLibraryQuery] = useState('');
  const summary = summarizeStudioLibrary();

  useEffect(() => midiManager.subscribeState(setMidiState), []);
  useEffect(() => nativeStudioDeviceInventory.subscribe(setNativeDevices), []);
  useEffect(() => {
    if (!isOpen) return;
    setActiveTab(initialTab);
    setSettings(repository.load());
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [initialTab, isOpen, onClose, repository]);

  if (!isOpen) return null;

  const patchSection = <K extends keyof StudioPreferences>(section: K, patch: Partial<StudioPreferences[K]>) => {
    setSettings((current) => ({
      ...current,
      preferences: {...current.preferences, [section]: {...current.preferences[section], ...patch}},
    }));
  };

  const scanAudioDevices = async (requestPermission = false) => {
    setError(null);
    try {
      if (!navigator.mediaDevices?.enumerateDevices) throw new Error('This browser cannot enumerate media devices.');
      if (requestPermission) {
        const stream = await navigator.mediaDevices.getUserMedia({audio: true});
        stream.getTracks().forEach((track) => track.stop());
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      setAudioDevices(devices);
      const inputs = devices.filter((device) => device.kind === 'audioinput').length;
      const outputs = devices.filter((device) => device.kind === 'audiooutput').length;
      setAudioReport(`${inputs} input endpoint(s), ${outputs} output endpoint(s). Labels depend on browser permission.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    }
  };

  const inspectAudioEngine = async () => {
    setError(null);
    try {
      const context = new AudioContext({sampleRate: settings.preferences.audio.requestedSampleRate});
      await context.resume();
      const baseLatency = typeof context.baseLatency === 'number' ? `${(context.baseLatency * 1000).toFixed(2)} ms reported base latency` : 'base latency not reported';
      const outputLatency = 'outputLatency' in context && typeof context.outputLatency === 'number' ? `${(context.outputLatency * 1000).toFixed(2)} ms reported output latency` : 'output latency not reported';
      setAudioReport(`${context.sampleRate.toLocaleString()} Hz active browser context; ${baseLatency}; ${outputLatency}. This is not a physical loopback measurement.`);
      await context.close();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    }
  };

  const initializeMidi = async () => {
    setError(null);
    try {
      await midiManager.initMIDI({requestSysEx: settings.preferences.midi.requestSystemExclusive});
      setMidiState(midiManager.getStateSnapshot());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    }
  };

  const applySettings = () => {
    try {
      const saved = repository.save(settings);
      setSettings(saved);
      onApplied?.(saved.preferences);
      setNotice('Studio settings saved locally. Device-level requests take effect only where the active platform supports them.');
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    }
  };

  const importSettings = async (file: File | null) => {
    if (!file) return;
    try {
      const candidate: unknown = JSON.parse(await file.text());
      const validation = validateStudioSettingsDocument(candidate);
      if (!validation.valid) throw new Error(validation.issues.map((issue) => `${issue.path}: ${issue.message}`).join('; '));
      const saved = repository.save(candidate as StudioSettingsDocument);
      setSettings(saved);
      setNotice('Validated settings profile imported and saved locally.');
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    }
  };

  const runBenchmark = async () => {
    setBenchmarkRunning(true);
    setError(null);
    try {
      setBenchmark(await runStudioBenchmark());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setBenchmarkRunning(false);
    }
  };

  const runWarmNativeEngine = async () => {
    setWarmRunning(true);
    setError(null);
    try {
      // @ts-ignore
      if (typeof (window as any).__TAURI__ === 'undefined') throw new Error('Native engine warm only available in native shell');
      // @ts-ignore
      const result = await (window as any).__TAURI__.invoke('warm_native_engine', {});
      setWarmResult(result);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setWarmRunning(false);
    }
  };

  const runRingFfiTest = async () => {
    setRingRunning(true);
    setError(null);
    try {
      // @ts-ignore
      if (typeof (window as any).__TAURI__ === 'undefined') throw new Error('Ring FFI test only available in native shell');
      // @ts-ignore
      const res = await (window as any).__TAURI__.invoke('run_ring_ffi_test');
      // the command returns a boolean on success
      setRingResult(Boolean(res));
      if (!res) {
        setError('Ring FFI test reported failure');
      }
    } catch (reason) {
      setRingResult(null);
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setRingRunning(false);
    }
  };

  const filteredLibrary = STUDIO_LIBRARY_CATALOG.filter((item) => `${item.name} ${item.kind} ${item.category} ${item.description}`.toLowerCase().includes(libraryQuery.trim().toLowerCase()));

  return <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="studio-setup-title">
    <div className="flex h-[min(900px,96vh)] w-[min(1280px,98vw)] flex-col overflow-hidden rounded-2xl border border-amber-500/40 bg-stone-950 shadow-2xl">
      <header className="flex items-center justify-between border-b border-stone-800 bg-stone-900 px-4 py-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-400">Professional configuration</p>
          <h2 id="studio-setup-title" className="text-lg font-black text-white">Poietek Studio Setup</h2>
          <p className="text-[10px] text-stone-400">Global preferences · device evidence · profiles · modules · diagnostics</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg border border-stone-700 bg-stone-950 p-2 text-stone-300 hover:border-amber-500 hover:text-amber-400" aria-label="Close studio setup"><X className="h-5 w-5" /></button>
      </header>

      <div className="flex min-h-0 flex-1">
        <nav className="w-48 shrink-0 overflow-y-auto border-r border-stone-800 bg-stone-950 p-2" aria-label="Studio setup categories">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[11px] font-bold ${activeTab === tab.id ? 'bg-amber-500 text-stone-950' : 'text-stone-300 hover:bg-stone-800 hover:text-white'}`}><Icon className="h-4 w-4" />{tab.label}</button>;
          })}
        </nav>

        <main className="min-w-0 flex-1 overflow-y-auto p-4 text-stone-200">
          {(error || notice) && <div className={`mb-4 flex items-start justify-between rounded-lg border p-3 text-xs ${error ? 'border-red-700 bg-red-950/30 text-red-100' : 'border-emerald-700 bg-emerald-950/30 text-emerald-100'}`}><span>{error ?? notice}</span><button type="button" onClick={() => {setError(null); setNotice(null);}}>×</button></div>}

          {activeTab === 'profiles' && <section className="space-y-4">
            <div><h3 className="text-base font-black text-white">Studio profiles</h3><p className="text-xs text-stone-400">Profiles are local, portable preference bundles. Hardware capabilities are re-detected on each machine.</p></div>
            <div className="grid gap-3 lg:grid-cols-2">{settings.profiles.map((profile) => <article key={profile.id} className={`rounded-xl border p-4 ${settings.activeProfileId === profile.id ? 'border-amber-500 bg-amber-950/20' : 'border-stone-700 bg-stone-900/70'}`}><div className="flex items-start justify-between gap-3"><div><strong className="text-sm text-white">{profile.name}</strong><p className="mt-1 text-[11px] leading-5 text-stone-400">{profile.description}</p></div><span className="rounded bg-stone-800 px-2 py-1 text-[9px] uppercase text-stone-300">{profile.builtIn ? 'Built in' : 'Local'}</span></div><div className="mt-3 flex gap-2"><button type="button" onClick={() => setSettings(repository.applyProfile(settings, profile.id))} className="rounded bg-amber-500 px-3 py-1.5 text-[10px] font-black text-stone-950">Apply profile</button>{!profile.builtIn && <button type="button" onClick={() => setSettings(repository.removeCustomProfile(settings, profile.id))} className="rounded border border-red-800 px-3 py-1.5 text-[10px] text-red-300">Remove</button>}</div></article>)}</div>
            <div className="rounded-xl border border-stone-700 bg-stone-900/70 p-4"><strong className="text-sm text-white">Save the current settings as a profile</strong><div className="mt-3 flex gap-2"><input value={profileName} onChange={(event) => setProfileName(event.target.value)} placeholder="Profile name" className="min-w-0 flex-1 rounded border border-stone-600 bg-stone-950 px-3 py-2 text-xs" /><button type="button" onClick={() => {try {setSettings(repository.saveCustomProfile(settings, profileName)); setProfileName('');} catch (reason) {setError(reason instanceof Error ? reason.message : String(reason));}}} className="rounded bg-stone-100 px-3 py-2 text-xs font-bold text-stone-950">Save profile</button></div></div>
            <div className="flex flex-wrap gap-2"><button type="button" onClick={() => downloadJson('poietek-studio-settings.json', settings)} className="flex items-center gap-2 rounded border border-stone-600 px-3 py-2 text-xs hover:border-amber-500"><Download className="h-4 w-4" />Export settings</button><label className="flex cursor-pointer items-center gap-2 rounded border border-stone-600 px-3 py-2 text-xs hover:border-amber-500"><Upload className="h-4 w-4" />Import settings<input type="file" accept="application/json,.json" className="hidden" onChange={(event) => void importSettings(event.target.files?.[0] ?? null)} /></label><button type="button" onClick={() => setSettings(createDefaultStudioSettingsDocument())} className="rounded border border-red-900 px-3 py-2 text-xs text-red-300">Reset unsaved defaults</button></div>
          </section>}

          {activeTab === 'devices' && (
  <section className="space-y-4">
    <div>
      <h3 className="text-base font-black text-white">
        Device setup
      </h3>

      <p className="text-xs text-stone-400">
        Inspect the audio and MIDI hardware available to Poietek.
        Browser-accessible devices and native desktop devices are
        reported separately because the current native engine does
        not yet open production audio streams or MIDI connections.
      </p>
    </div>

    <Notice title="Current device-engine status">
      Poietek can currently discover native desktop audio and MIDI
      endpoints. Native device selection, production audio streams,
      MIDI connections, hardware buffer control, and measured
      round-trip latency will become available as the native realtime
      engine is implemented.
    </Notice>

    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => void nativeStudioDeviceInventory.scan()}
        disabled={nativeDevices.status === 'scanning'}
        className="flex items-center gap-2 rounded bg-amber-500 px-3 py-2 text-xs font-black text-stone-950 disabled:opacity-50"
      >
        <RefreshCw
          className={`h-4 w-4 ${
            nativeDevices.status === 'scanning' ? 'animate-spin' : ''
          }`}
        />

        {nativeDevices.status === 'scanning'
          ? 'Scanning native devices…'
          : 'Scan native devices'}
      </button>

      <button
        type="button"
        onClick={() => void scanAudioDevices(false)}
        className="flex items-center gap-2 rounded border border-stone-600 px-3 py-2 text-xs"
      >
        <RefreshCw className="h-4 w-4" />
        Scan browser audio
      </button>

      <button
        type="button"
        onClick={() => void scanAudioDevices(true)}
        className="rounded border border-amber-600 px-3 py-2 text-xs text-amber-300"
      >
        Request microphone access
      </button>

      <button
        type="button"
        onClick={() => void initializeMidi()}
        className="rounded border border-stone-600 px-3 py-2 text-xs"
      >
        Initialize Web MIDI
      </button>
    </div>

    <NativeInventoryPanel
      kind="audio"
      snapshot={nativeDevices}
      onScan={() => void nativeStudioDeviceInventory.scan()}
    />

    <NativeInventoryPanel
      kind="midi"
      snapshot={nativeDevices}
      onScan={() => void nativeStudioDeviceInventory.scan()}
    />

    <div className="grid gap-3 md:grid-cols-2">
      <article className="rounded-xl border border-stone-700 bg-stone-900/70 p-4">
        <strong className="text-sm text-white">
          Browser audio devices
        </strong>

        <p className="mt-2 text-[11px] leading-5 text-stone-400">
          {
            audioDevices.filter(
              (device) => device.kind === 'audioinput',
            ).length
          }{' '}
          input endpoint(s)
        </p>

        <p className="text-[11px] leading-5 text-stone-400">
          {
            audioDevices.filter(
              (device) => device.kind === 'audiooutput',
            ).length
          }{' '}
          output endpoint(s)
        </p>

        <p className="mt-2 text-[10px] leading-4 text-stone-500">
          {audioReport}
        </p>
      </article>

      <article className="rounded-xl border border-stone-700 bg-stone-900/70 p-4">
        <strong className="text-sm text-white">
          Web MIDI
        </strong>

        <p className="mt-2 text-[11px] leading-5 text-stone-400">
          Status: {midiState.capability.status}
        </p>

        <p className="text-[11px] leading-5 text-stone-400">
          Connected devices:{' '}
          {
            midiState.connectedDevices.filter(
              (device) => device.connected,
            ).length
          }
        </p>

        <p className="mt-2 text-[10px] leading-4 text-stone-500">
          {midiState.capability.message ||
            'Web MIDI has not been initialized in this session.'}
        </p>
      </article>
    </div>

    <Notice title="Why these devices are separated" tone="green">
      The web version can use browser-approved devices while the
      desktop version is being progressively connected to Poietek's
      native C++ realtime engine. This keeps the existing application
      usable while the native foundation is built underneath it.
    </Notice>
  </section>
)}

          {activeTab === 'audio' && <section className="space-y-4">
            <div><h3 className="text-base font-black text-white">Audio engine and devices</h3><p className="text-xs text-stone-400">Browser controls are requested policies. Native desktop endpoints are inventoried separately from devices the current Web Audio engine can select.</p></div>
            <Notice title="Capability boundary">The installed desktop shell can now read operating-system audio endpoints and advertised formats. It still cannot open a native production stream, select ASIO/Core Audio/JACK, force a hardware buffer, or prove round-trip latency until the dedicated realtime engine is implemented and tested.</Notice>
            <NativeInventoryPanel kind="audio" snapshot={nativeDevices} onScan={() => void nativeStudioDeviceInventory.scan()} />
            <div className="grid gap-3 md:grid-cols-2"><Field label="Audio input"><Select value={settings.preferences.audio.inputDeviceId ?? ''} onChange={(value) => patchSection('audio', {inputDeviceId: value || null})}><option value="">System/browser default</option>{audioDevices.filter((device) => device.kind === 'audioinput').map((device, index) => <option key={device.deviceId} value={device.deviceId}>{device.label || `Input ${index + 1} (permission required for name)`}</option>)}</Select></Field><Field label="Audio output"><Select value={settings.preferences.audio.outputDeviceId ?? ''} onChange={(value) => patchSection('audio', {outputDeviceId: value || null})}><option value="">System/browser default</option>{audioDevices.filter((device) => device.kind === 'audiooutput').map((device, index) => <option key={device.deviceId} value={device.deviceId}>{device.label || `Output ${index + 1}`}</option>)}</Select></Field><Field label="Requested sample rate" hint="The browser or native driver may choose another supported rate."><Select value={settings.preferences.audio.requestedSampleRate} onChange={(value) => patchSection('audio', {requestedSampleRate: Number(value) as StudioPreferences['audio']['requestedSampleRate']})}>{[44100,48000,88200,96000,176400,192000].map((rate) => <option key={rate} value={rate}>{rate.toLocaleString()} Hz</option>)}</Select></Field><Field label="Requested buffer" hint="A policy value until a native driver adapter confirms it."><Select value={settings.preferences.audio.requestedBufferFrames} onChange={(value) => patchSection('audio', {requestedBufferFrames: Number(value) as StudioPreferences['audio']['requestedBufferFrames']})}>{[32,64,128,256,512,1024,2048].map((size) => <option key={size} value={size}>{size} frames</option>)}</Select></Field><Field label="Recording channels"><Select value={settings.preferences.audio.recordingChannels} onChange={(value) => patchSection('audio', {recordingChannels: value as 'mono' | 'stereo'})}><option value="mono">Mono</option><option value="stereo">Stereo</option></Select></Field><Field label="Input monitoring"><Select value={settings.preferences.audio.monitoringMode} onChange={(value) => patchSection('audio', {monitoringMode: value as StudioPreferences['audio']['monitoringMode']})}><option value="off">Off</option><option value="software">Software monitoring</option><option value="hardware-external">External hardware monitoring</option></Select></Field><Field label="Plug-in latency compensation"><Select value={settings.preferences.audio.latencyCompensation} onChange={(value) => patchSection('audio', {latencyCompensation: value as StudioPreferences['audio']['latencyCompensation']})}><option value="off">Off</option><option value="recording-paths">Recording paths</option><option value="all-paths">All paths</option></Select></Field><Field label="Low-latency ceiling"><input type="number" min={1} max={100} value={settings.preferences.audio.lowLatencyLimitMs} onChange={(event) => patchSection('audio', {lowLatencyLimitMs: Number(event.target.value)})} className="w-full rounded border border-stone-600 bg-stone-950 px-2 py-2" /></Field></div>
            <Toggle label="Low-latency monitoring policy" hint="Future production mixer graphs may bypass latency-heavy processors on armed paths. It does not silently alter an exported mix." checked={settings.preferences.audio.lowLatencyMode} onChange={(checked) => patchSection('audio', {lowLatencyMode: checked})} />
            <Toggle label="Suspend audio when idle" checked={settings.preferences.audio.autoSuspendWhenIdle} onChange={(checked) => patchSection('audio', {autoSuspendWhenIdle: checked})} />
            <div className="flex flex-wrap gap-2"><button type="button" onClick={() => void scanAudioDevices(false)} className="flex items-center gap-2 rounded border border-stone-600 px-3 py-2 text-xs"><RefreshCw className="h-4 w-4" />Rescan devices</button><button type="button" onClick={() => void scanAudioDevices(true)} className="rounded border border-amber-600 px-3 py-2 text-xs text-amber-300">Request microphone access</button><button type="button" onClick={() => void inspectAudioEngine()} className="rounded bg-amber-500 px-3 py-2 text-xs font-black text-stone-950">Inspect browser engine</button></div><p className="rounded bg-stone-900 p-3 text-[11px] text-stone-300">{audioReport}</p>
          </section>}

          {activeTab === 'midi' && <section className="space-y-4"><div><h3 className="text-base font-black text-white">MIDI, control, and synchronization</h3><p className="text-xs text-stone-400">Standard browser MIDI access is requested without SysEx unless you explicitly enable it. The desktop inventory is independent and read-only.</p></div><NativeInventoryPanel kind="midi" snapshot={nativeDevices} onScan={() => void nativeStudioDeviceInventory.scan()} /><Notice title={`Web MIDI state: ${midiState.capability.status}`}>{midiState.capability.message || 'No browser MIDI request has been made in this session.'} SysEx: {midiState.capability.sysex}.</Notice><div className="grid gap-3 md:grid-cols-2"><Field label="Default MIDI input"><Select value={settings.preferences.midi.defaultInputId ?? ''} onChange={(value) => patchSection('midi', {defaultInputId: value || null})}><option value="">None / choose per track</option>{midiState.connectedDevices.filter((device) => device.connected && (device.type === 'web_midi' || device.type === 'virtual_sim')).map((device) => <option key={device.id} value={device.id}>{device.name}</option>)}</Select></Field><Field label="Default MIDI output"><Select value={settings.preferences.midi.defaultOutputId ?? ''} onChange={(value) => patchSection('midi', {defaultOutputId: value || null})}><option value="">None / choose per track</option></Select></Field><Field label="Controller takeover"><Select value={settings.preferences.midi.controllerTakeover} onChange={(value) => patchSection('midi', {controllerTakeover: value as StudioPreferences['midi']['controllerTakeover']})}><option value="pickup">Pickup</option><option value="jump">Jump</option><option value="relative">Relative</option></Select></Field><Field label="MIDI clock"><Select value={settings.preferences.midi.clockMode} onChange={(value) => patchSection('midi', {clockMode: value as StudioPreferences['midi']['clockMode']})}><option value="off">Off</option><option value="send">Send</option><option value="receive">Receive</option></Select></Field><Field label="Timecode"><Select value={settings.preferences.midi.timecodeMode} onChange={(value) => patchSection('midi', {timecodeMode: value as StudioPreferences['midi']['timecodeMode']})}><option value="off">Off</option><option value="quarter-frame">Quarter frame</option><option value="full-frame">Full frame</option></Select></Field><Field label="Timecode frame rate"><Select value={settings.preferences.midi.timecodeFrameRate} onChange={(value) => patchSection('midi', {timecodeFrameRate: Number(value) as StudioPreferences['midi']['timecodeFrameRate']})}>{[24,25,29.97,30].map((rate) => <option key={rate} value={rate}>{rate} fps</option>)}</Select></Field></div><Toggle label="Request System Exclusive access" hint="Off by default. Enable only for a device workflow that genuinely requires manufacturer-specific messages." checked={settings.preferences.midi.requestSystemExclusive} onChange={(checked) => patchSection('midi', {requestSystemExclusive: checked})} /><Toggle label="MIDI thru" checked={settings.preferences.midi.midiThru} onChange={(checked) => patchSection('midi', {midiThru: checked})} /><Toggle label="Chase held notes after seek" checked={settings.preferences.midi.noteChase} onChange={(checked) => patchSection('midi', {noteChase: checked})} /><Toggle label="Send transport start/stop with clock" checked={settings.preferences.midi.sendStartStop} onChange={(checked) => patchSection('midi', {sendStartStop: checked})} /><button type="button" onClick={() => void initializeMidi()} className="rounded bg-amber-500 px-3 py-2 text-xs font-black text-stone-950">Initialize / rescan Web MIDI</button><Notice title="Connection and clocking honesty">Native MIDI ports are now detected but not opened. Web MIDI ports can receive through the existing manager when the webview supports them. Native input connections, MIDI output, clock, and timecode remain unavailable until their realtime scheduler and lifecycle tests pass.</Notice></section>}

          {activeTab === 'recording' && <section className="space-y-4"><div><h3 className="text-base font-black text-white">Recording and export defaults</h3><p className="text-xs text-stone-400">Browser recording negotiates a supported MediaRecorder format. PCM WAV is produced by the offline export service.</p></div><div className="grid gap-3 md:grid-cols-2"><Field label="Count-in bars"><Select value={settings.preferences.recording.countInBars} onChange={(value) => patchSection('recording', {countInBars: Number(value) as StudioPreferences['recording']['countInBars']})}>{[0,1,2,4].map((value) => <option key={value} value={value}>{value}</option>)}</Select></Field><Field label="Pre-roll bars"><Select value={settings.preferences.recording.preRollBars} onChange={(value) => patchSection('recording', {preRollBars: Number(value) as StudioPreferences['recording']['preRollBars']})}>{[0,1,2,4,8].map((value) => <option key={value} value={value}>{value}</option>)}</Select></Field><Field label="Browser recording preference"><Select value={settings.preferences.recording.browserMimePreference} onChange={(value) => patchSection('recording', {browserMimePreference: value as StudioPreferences['recording']['browserMimePreference']})}><option value="auto">Best supported</option><option value="opus">Prefer Opus</option><option value="webm">Prefer WebM</option></Select></Field><Field label="PCM export bit depth"><Select value={settings.preferences.recording.exportBitDepth} onChange={(value) => patchSection('recording', {exportBitDepth: Number(value) as 16 | 24 | 32})}><option value={16}>16-bit PCM</option><option value={24}>24-bit PCM (planned encoder)</option><option value={32}>32-bit float (planned encoder)</option></Select></Field><Field label="Recording file-name pattern"><input value={settings.preferences.recording.fileNamePattern} onChange={(event) => patchSection('recording', {fileNamePattern: event.target.value})} className="w-full rounded border border-stone-600 bg-stone-950 px-2 py-2" /></Field></div><Toggle label="Create take lanes" checked={settings.preferences.recording.createTakeLanes} onChange={(checked) => patchSection('recording', {createTakeLanes: checked})} /><Toggle label="Automatic input monitoring" checked={settings.preferences.recording.autoInputMonitoring} onChange={(checked) => patchSection('recording', {autoInputMonitoring: checked})} /><Toggle label="Keep incomplete takes after interruption" checked={settings.preferences.recording.keepIncompleteTakes} onChange={(checked) => patchSection('recording', {keepIncompleteTakes: checked})} /><Toggle label="Dither integer exports" checked={settings.preferences.recording.ditherOnIntegerExport} onChange={(checked) => patchSection('recording', {ditherOnIntegerExport: checked})} /><Notice title="Encoder availability">The current verified encoder writes PCM16 WAV. Selecting 24-bit or 32-bit records the desired policy but does not falsely claim that encoder exists.</Notice></section>}

          {activeTab === 'editing' && <section className="space-y-3"><div><h3 className="text-base font-black text-white">Editing and transport</h3><p className="text-xs text-stone-400">Professional defaults for the staged non-destructive editor.</p></div><div className="grid gap-3 md:grid-cols-2"><Field label="Snap resolution"><Select value={settings.preferences.editing.snapResolution} onChange={(value) => patchSection('editing', {snapResolution: value as StudioPreferences['editing']['snapResolution']})}>{['adaptive','bar','beat','1/8','1/16','1/32'].map((value) => <option key={value} value={value}>{value}</option>)}</Select></Field><Field label="Ripple editing"><Select value={settings.preferences.editing.rippleEditing} onChange={(value) => patchSection('editing', {rippleEditing: value as StudioPreferences['editing']['rippleEditing']})}><option value="off">Off</option><option value="track">Current track</option><option value="all">All tracks</option></Select></Field><Field label="Default fade"><input type="number" min={0} max={5000} value={settings.preferences.editing.defaultFadeMs} onChange={(event) => patchSection('editing', {defaultFadeMs: Number(event.target.value)})} className="w-full rounded border border-stone-600 bg-stone-950 px-2 py-2" /></Field></div><Toggle label="Enable snap" checked={settings.preferences.editing.snapEnabled} onChange={(checked) => patchSection('editing', {snapEnabled: checked})} /><Toggle label="Snap to clips, markers, and transients" checked={settings.preferences.editing.snapToEvents} onChange={(checked) => patchSection('editing', {snapToEvents: checked})} /><Toggle label="Automatic crossfades" checked={settings.preferences.editing.autoCrossfade} onChange={(checked) => patchSection('editing', {autoCrossfade: checked})} /><Toggle label="Follow playhead" checked={settings.preferences.editing.followPlayhead} onChange={(checked) => patchSection('editing', {followPlayhead: checked})} /><Toggle label="Return to start when stopped" checked={settings.preferences.editing.returnToStartOnStop} onChange={(checked) => patchSection('editing', {returnToStartOnStop: checked})} /><Toggle label="Audition while scrubbing" checked={settings.preferences.editing.auditionWhileScrubbing} onChange={(checked) => patchSection('editing', {auditionWhileScrubbing: checked})} /><Notice title="Editor wiring">Snap, fades, ripple editing, take lanes, and comping are saved preferences for the next production editor slice; the current real-audio timeline does not yet apply them.</Notice></section>}

          {activeTab === 'files' && <section className="space-y-3"><div><h3 className="text-base font-black text-white">Files, autosave, and recovery</h3><p className="text-xs text-stone-400">Local durable save remains the primary success condition.</p></div><div className="grid gap-3 md:grid-cols-2"><Field label="Autosave interval (seconds)"><input type="number" min={1} max={3600} value={settings.preferences.files.autosaveSeconds} onChange={(event) => patchSection('files', {autosaveSeconds: Number(event.target.value)})} className="w-full rounded border border-stone-600 bg-stone-950 px-2 py-2" /></Field><Field label="Recovery checkpoint interval (seconds)"><input type="number" min={5} max={3600} value={settings.preferences.files.recoveryCheckpointSeconds} onChange={(event) => patchSection('files', {recoveryCheckpointSeconds: Number(event.target.value)})} className="w-full rounded border border-stone-600 bg-stone-950 px-2 py-2" /></Field><Field label="Recovery snapshots retained"><input type="number" min={1} max={100} value={settings.preferences.files.retainedRecoverySnapshots} onChange={(event) => patchSection('files', {retainedRecoverySnapshots: Number(event.target.value)})} className="w-full rounded border border-stone-600 bg-stone-950 px-2 py-2" /></Field><Field label="Project storage"><input readOnly value={settings.preferences.files.preferredProjectFolderLabel} className="w-full rounded border border-stone-700 bg-stone-950 px-2 py-2 text-stone-400" /></Field><Field label="Export destination"><input value={settings.preferences.files.preferredExportFolderLabel} onChange={(event) => patchSection('files', {preferredExportFolderLabel: event.target.value})} className="w-full rounded border border-stone-600 bg-stone-950 px-2 py-2" /></Field></div><Toggle label="Copy imported media into project storage" checked={settings.preferences.files.copyImportedMediaIntoProject} onChange={(checked) => patchSection('files', {copyImportedMediaIntoProject: checked})} /><Toggle label="Verify media hashes" checked={settings.preferences.files.verifyMediaHashes} onChange={(checked) => patchSection('files', {verifyMediaHashes: checked})} /><Toggle label="Warn when referenced media is missing" checked={settings.preferences.files.warnOnMissingMedia} onChange={(checked) => patchSection('files', {warnOnMissingMedia: checked})} /><Notice title="Browser storage">OPFS is attempted first and IndexedDB is the fallback. Native folder selection remains unavailable until a least-privilege Tauri file-dialog adapter is implemented.</Notice></section>}

          {activeTab === 'plugins' && <section className="space-y-4"><div><h3 className="text-base font-black text-white">Plug-in management</h3><p className="text-xs text-stone-400">Safety and scan policies for a future native host. Web builds cannot load desktop plug-in binaries.</p></div><Notice title="Native host unavailable">VST3, CLAP, Audio Unit, and other desktop formats require a native plug-in scanner, process sandbox, validation database, latency reporting, crash quarantine, and licensing supplied by each third party. None is claimed in this web build.</Notice><div className="grid gap-3 md:grid-cols-2"><Field label="Preferred native formats"><div className="flex flex-wrap gap-2">{settings.preferences.plugins.nativePluginFormats.map((format) => <span key={format} className="rounded bg-stone-800 px-2 py-1 text-[10px]">{format}</span>)}</div></Field><Field label="Plug-in window mode"><Select value={settings.preferences.plugins.windowMode} onChange={(value) => patchSection('plugins', {windowMode: value as StudioPreferences['plugins']['windowMode']})}><option value="docked">Docked</option><option value="floating">Floating</option><option value="remember-last">Remember last</option></Select></Field></div><Toggle label="Scan on native startup" checked={settings.preferences.plugins.scanOnNativeStartup} onChange={(checked) => patchSection('plugins', {scanOnNativeStartup: checked})} /><Toggle label="Verify new plug-ins" checked={settings.preferences.plugins.verifyNewPlugins} onChange={(checked) => patchSection('plugins', {verifyNewPlugins: checked})} /><Toggle label="Sandbox third-party plug-ins" checked={settings.preferences.plugins.sandboxThirdPartyPlugins} onChange={(checked) => patchSection('plugins', {sandboxThirdPartyPlugins: checked})} /><Toggle label="Quarantine plug-ins after a crash" checked={settings.preferences.plugins.quarantineCrashingPlugins} onChange={(checked) => patchSection('plugins', {quarantineCrashingPlugins: checked})} /><Toggle label="Suspend silent plug-ins" checked={settings.preferences.plugins.suspendSilentPlugins} onChange={(checked) => patchSection('plugins', {suspendSilentPlugins: checked})} /></section>}

          {activeTab === 'library' && <section className="space-y-4"><div><h3 className="text-base font-black text-white">Original modules, effects, content, and add-ons</h3><p className="text-xs text-stone-400">{summary.total} registered items · {summary.production} production · {summary.prototype} prototype · {summary.planned} planned · {summary.external} external</p></div><input value={libraryQuery} onChange={(event) => setLibraryQuery(event.target.value)} placeholder="Search instruments, effects, tools, samples, demos…" className="w-full rounded-lg border border-stone-600 bg-stone-900 px-3 py-2 text-xs" /><div className="grid gap-3 xl:grid-cols-2">{filteredLibrary.map((item) => <article key={item.id} className="rounded-xl border border-stone-700 bg-stone-900/70 p-4"><div className="flex items-start justify-between gap-3"><div><strong className="text-sm text-white">{item.name}</strong><p className="text-[10px] uppercase tracking-wider text-amber-400">{item.kind} · {item.category}</p></div><span className={`rounded px-2 py-1 text-[9px] uppercase ${item.implementation === 'production' ? 'bg-emerald-900 text-emerald-200' : item.implementation === 'prototype' ? 'bg-blue-900 text-blue-200' : 'bg-stone-800 text-stone-300'}`}>{item.implementation}</span></div><p className="mt-2 text-[11px] leading-5 text-stone-300">{item.description}</p><div className="mt-2 flex flex-wrap gap-1">{item.capabilities.map((capability) => <span key={capability} className="rounded bg-stone-950 px-2 py-1 text-[9px] text-stone-400">{capability}</span>)}</div><p className="mt-3 text-[10px] text-stone-500">Web: {item.web} · Native: {item.native} · {item.license}</p>{item.limitation && <p className="mt-2 border-t border-stone-800 pt-2 text-[10px] leading-4 text-amber-200/75">{item.limitation}</p>}</article>)}</div></section>}

          {activeTab === 'appearance' && <section className="space-y-3"><div><h3 className="text-base font-black text-white">Appearance and accessibility</h3></div><div className="grid gap-3 md:grid-cols-2"><Field label="Theme"><Select value={settings.preferences.appearance.theme} onChange={(value) => patchSection('appearance', {theme: value as StudioPreferences['appearance']['theme']})}><option value="midnight">Midnight</option><option value="graphite">Graphite</option><option value="high-contrast">High contrast</option></Select></Field><Field label="Control density"><Select value={settings.preferences.appearance.density} onChange={(value) => patchSection('appearance', {density: value as StudioPreferences['appearance']['density']})}><option value="comfortable">Comfortable</option><option value="compact">Compact</option><option value="touch">Touch</option></Select></Field><Field label="Interface scale (%)"><input type="number" min={75} max={200} value={settings.preferences.appearance.interfaceScalePercent} onChange={(event) => patchSection('appearance', {interfaceScalePercent: Number(event.target.value)})} className="w-full rounded border border-stone-600 bg-stone-950 px-2 py-2" /></Field><Field label="Meter scale"><Select value={settings.preferences.appearance.meterScale} onChange={(value) => patchSection('appearance', {meterScale: value as StudioPreferences['appearance']['meterScale']})}><option value="digital">Digital</option><option value="broadcast">Broadcast</option><option value="extended">Extended range</option></Select></Field></div><Toggle label="Reduce motion" checked={settings.preferences.appearance.reduceMotion} onChange={(checked) => patchSection('appearance', {reduceMotion: checked})} /><Toggle label="Show tooltips" checked={settings.preferences.appearance.showTooltips} onChange={(checked) => patchSection('appearance', {showTooltips: checked})} /><Toggle label="Show learning hints" checked={settings.preferences.appearance.showLearningHints} onChange={(checked) => patchSection('appearance', {showLearningHints: checked})} /><Toggle label="Auto-hide transport bars" checked={settings.preferences.appearance.autoHideTransportBars} onChange={(checked) => patchSection('appearance', {autoHideTransportBars: checked})} /></section>}

          {activeTab === 'privacy' && <section className="space-y-3"><div><h3 className="text-base font-black text-white">Privacy, providers, and updates</h3></div><Toggle label="Local-first durability" hint="Required: a local project commit is the primary success condition." checked={true} onChange={() => undefined} disabled /><Toggle label="Usage analytics" hint="Unavailable and disabled. No usage analytics collector is implemented." checked={false} onChange={() => undefined} disabled /><Toggle label="Allow configured remote providers" checked={settings.preferences.privacy.allowRemoteProviders} onChange={(checked) => patchSection('privacy', {allowRemoteProviders: checked})} /><Toggle label="Allow community discovery" checked={settings.preferences.privacy.allowCommunityDiscovery} onChange={(checked) => patchSection('privacy', {allowCommunityDiscovery: checked})} /><Toggle label="Redact local paths in diagnostic exports" checked={settings.preferences.privacy.redactPathsInDiagnostics} onChange={(checked) => patchSection('privacy', {redactPathsInDiagnostics: checked})} /><Field label="Crash reports"><Select value={settings.preferences.privacy.crashReports} onChange={(value) => patchSection('privacy', {crashReports: value as 'ask' | 'never'})}><option value="ask">Ask before any future submission</option><option value="never">Never submit</option></Select></Field><Field label="Updates"><Select value={settings.preferences.privacy.updateChannel} onChange={(value) => patchSection('privacy', {updateChannel: value as 'stable' | 'manual'})}><option value="manual">Manual checks</option><option value="stable">Stable channel when implemented</option></Select></Field><Notice title="No silent network activity" tone="green">Cloud sync, community discovery, crash reporting, AI providers, registrations, payments, and provenance services require separate configuration and consent. Saving this preference does not contact them.</Notice></section>}

          {activeTab === 'diagnostics' && <section className="space-y-4"><div><h3 className="text-base font-black text-white">Studio benchmark</h3><p className="text-xs text-stone-400">A repeatable local browser test for DSP throughput, scheduler jitter, offline rendering, and temporary local storage.</p></div><Notice title="What the stars mean">The rating reflects this run on this browser and computer. It is not a fabricated competitive score and does not measure audio-interface loopback latency, third-party plug-ins, or full production sessions.</Notice><div className="flex items-center gap-2">
              <button type="button" disabled={benchmarkRunning} onClick={() => void runBenchmark()} className="flex items-center gap-2 rounded bg-amber-500 px-4 py-2 text-xs font-black text-stone-950 disabled:opacity-50"><Gauge className="h-4 w-4" />{benchmarkRunning ? 'Running benchmark…' : 'Run benchmark'}</button>
              {nativeDevices.runtime === 'native' && <div className="flex items-center gap-2">
                <button type="button" disabled={warmRunning} onClick={() => void runWarmNativeEngine()} className="flex items-center gap-2 rounded border border-stone-600 px-4 py-2 text-xs font-black text-stone-200 disabled:opacity-50"><RefreshCw className="h-4 w-4" />{warmRunning ? 'Warming…' : 'Warm native engine'}</button>
                <button type="button" disabled={ringRunning} onClick={() => void runRingFfiTest()} className="flex items-center gap-2 rounded border border-stone-600 px-4 py-2 text-xs font-black text-stone-200 disabled:opacity-50">{ringRunning ? 'Running…' : 'Run ring FFI test'}</button>
              </div>}
            </div>{benchmark && <div className="space-y-4"><div className="rounded-xl border border-amber-600 bg-amber-950/20 p-5"><div className="flex items-end justify-between"><div><p className="text-3xl tracking-widest text-amber-400">{'★'.repeat(benchmark.stars)}{'☆'.repeat(5 - benchmark.stars)}</p><strong className="text-xl text-white">{benchmark.score}/100</strong></div><span className="text-xs text-stone-400">{benchmark.durationMs.toLocaleString()} ms</span></div><p className="mt-3 text-xs leading-5 text-stone-300">{benchmark.interpretation}</p></div><div className="grid gap-3 md:grid-cols-2">{Object.entries(benchmark.metrics).map(([id, metric]) => <article key={id} className="rounded-lg border border-stone-700 bg-stone-900 p-3"><p className="text-[10px] uppercase tracking-wider text-stone-500">{id.replace(/([A-Z])/g, ' $1')}</p><strong className="text-lg text-white">{metric.value == null ? metric.state : `${metric.value} ${metric.unit}`}</strong><p className="mt-1 text-[10px] leading-4 text-stone-400">{metric.detail}</p></article>)}</div><div className="flex flex-wrap gap-2">{Object.entries(benchmark.capabilities).map(([capability, available]) => <span key={capability} className={`rounded px-2 py-1 text-[10px] ${available ? 'bg-emerald-900 text-emerald-200' : 'bg-stone-800 text-stone-400'}`}>{capability}: {available ? 'available' : 'unavailable'}</span>)}</div><div className="flex gap-2">{warmResult && <button type="button" onClick={() => downloadJson('poietek-warm-result.json', warmResult)} className="flex items-center gap-2 rounded border border-stone-600 px-3 py-2 text-xs"><Download className="h-4 w-4" />Export warm result</button>}
                {ringResult !== null && <div className={`mt-2 text-sm ${ringResult ? 'text-emerald-300' : 'text-red-400'}`}>Ring FFI test: {ringResult ? 'Passed' : 'Failed'}</div>}
              </div><button type="button" onClick={() => downloadJson('poietek-benchmark.json', benchmark)} className="flex items-center gap-2 rounded border border-stone-600 px-3 py-2 text-xs"><Download className="h-4 w-4" />Export benchmark</button></div>}</section>}
        </main>
      </div>

      <footer className="flex items-center justify-between border-t border-stone-800 bg-stone-900 px-4 py-3"><p className="text-[10px] text-stone-500">Settings schema {settings.schemaVersion} · last saved {new Date(settings.updatedAt).toLocaleString()}</p><div className="flex gap-2"><button type="button" onClick={onClose} className="rounded border border-stone-600 px-4 py-2 text-xs text-stone-300">Cancel</button><button type="button" onClick={applySettings} className="flex items-center gap-2 rounded bg-amber-500 px-4 py-2 text-xs font-black text-stone-950"><Save className="h-4 w-4" />Save settings</button></div></footer>
    </div>
  </div>;
};
