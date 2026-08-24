import React, {useMemo, useState} from 'react';
import {
  Activity,
  ChevronDown,
  Compass,
  Cpu,
  Disc,
  Grid,
  Layers,
  Music,
  Share2,
  Plus,
  Search,
  Scissors,
  Sliders,
  Sparkles,
  X,
} from 'lucide-react';
import {WorkspaceType} from '../../types';

interface StudioRackNavProps {
  activeWorkspace: WorkspaceType;
  setActiveWorkspace: (workspace: WorkspaceType) => void;
}

type RackCategory = 'Instruments' | 'Samplers & rhythm' | 'Sequencing' | 'Mix & effects' | 'MIDI & hardware' | 'Utilities';

interface RackDeviceChoice {
  id: WorkspaceType;
  label: string;
  description: string;
  category: RackCategory;
  icon: React.FC<{className?: string}>;
}

const RACK_CATEGORIES: Array<{id: RackCategory; icon: React.FC<{className?: string}>}> = [
  {id: 'Instruments', icon: Music},
  {id: 'Samplers & rhythm', icon: Disc},
  {id: 'Sequencing', icon: Grid},
  {id: 'Mix & effects', icon: Sliders},
  {id: 'MIDI & hardware', icon: Share2},
  {id: 'Utilities', icon: Activity},
];

const RACK_DEVICES: RackDeviceChoice[] = [
  {id: 'keyboard', label: 'Harmonic Synth', description: 'Subtractive instrument and performance keyboard', category: 'Instruments', icon: Music},
  {id: 'circle_fifths', label: 'Harmony Compass', description: 'Keys, chords and harmonic relationships', category: 'Instruments', icon: Compass},
  {id: 'melodyne_pitch', label: 'Pitch Detail Editor', description: 'Vocal and note-pitch editing workspace', category: 'Instruments', icon: Music},
  {id: 'mpc', label: 'Pulse Pad Sampler', description: 'Velocity-pad sampling and beat performance', category: 'Samplers & rhythm', icon: Grid},
  {id: 'sp404', label: 'Pocket FX Sampler', description: 'Performance sampling and resampling effects', category: 'Samplers & rhythm', icon: Sparkles},
  {id: 'drum_machines', label: 'Rhythm Forge', description: 'Pattern drum instruments and sequencing', category: 'Samplers & rhythm', icon: Disc},
  {id: 'edrum', label: 'Drum Trigger Hub', description: 'Electronic drum performance mapping', category: 'Samplers & rhythm', icon: Activity},
  {id: 'chop_lab', label: 'Slice Workshop', description: 'Transient slicing and sample preparation', category: 'Samplers & rhythm', icon: Scissors},
  {id: 'piano_roll', label: 'Note Grid', description: 'MIDI notes, velocity and controller lanes', category: 'Sequencing', icon: Grid},
  {id: 'wave_sequencer', label: 'Audio Arrangement', description: 'Multitrack waveform and picture-sync lane', category: 'Sequencing', icon: Activity},
  {id: 'fl_channel_rack', label: 'Pattern Channels', description: 'Step patterns and instrument channels', category: 'Sequencing', icon: Cpu},
  {id: 'd_groove', label: 'Timing Pool', description: 'Groove, swing and timing templates', category: 'Sequencing', icon: Activity},
  {id: 'mixer', label: 'Production Console', description: 'Tracks, buses, sends, inserts and master', category: 'Mix & effects', icon: Sliders},
  {id: 'dj', label: 'Performance Decks', description: 'Two-deck playback and performance controls', category: 'Mix & effects', icon: Music},
  {id: 'patchbay', label: 'Signal Patch Bay', description: 'Audio, control and sidechain routing', category: 'Mix & effects', icon: Share2},
  {id: 'midi_matrix', label: 'MIDI Routing Matrix', description: 'Visible MIDI input, filtering and destinations', category: 'MIDI & hardware', icon: Share2},
  {id: 'mapper', label: 'Controller Mapper', description: 'Hardware controls and parameter mapping', category: 'MIDI & hardware', icon: Cpu},
  {id: 'visual_editor', label: 'Control Surface Builder', description: 'Custom controller layout editor', category: 'MIDI & hardware', icon: Layers},
  {id: 'health_latency', label: 'Device Health', description: 'Capability, connection and measured-state inspector', category: 'Utilities', icon: Activity},
];

export const StudioRackNav: React.FC<StudioRackNavProps> = ({activeWorkspace, setActiveWorkspace}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<RackCategory>('Instruments');
  const [query, setQuery] = useState('');
  const activeDevice = RACK_DEVICES.find((device) => device.id === activeWorkspace) ?? RACK_DEVICES[0];
  const choices = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return RACK_DEVICES.filter((device) => normalized
      ? `${device.label} ${device.description} ${device.category}`.toLowerCase().includes(normalized)
      : device.category === category);
  }, [category, query]);

  const choose = (workspace: WorkspaceType) => {
    setActiveWorkspace(workspace);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="relative z-30 border-b border-slate-800/80 bg-slate-950/95 px-2 py-1.5 font-mono shadow-sm backdrop-blur-xl sm:px-3">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Compass className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
          <span className="hidden text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500 sm:inline">Rack focus</span>
          <strong className="truncate rounded-md border border-cyan-400/20 bg-slate-900 px-2 py-1 text-[10px] text-cyan-100">{activeDevice.label}</strong>
        </div>
        <button type="button" aria-expanded={isOpen} aria-controls="poietek-rack-library" onClick={() => setIsOpen((current) => !current)} className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-black transition ${isOpen ? 'border-cyan-300 bg-cyan-400 text-slate-950' : 'border-slate-700 bg-slate-900 text-cyan-200 hover:border-cyan-400/60 hover:bg-slate-800'}`}>
          <Plus className="h-3.5 w-3.5" /><span>Add device</span><ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <section id="poietek-rack-library" aria-label="Rack device library" className="absolute left-2 right-2 top-[calc(100%+6px)] z-50 mx-auto max-w-[1100px] overflow-hidden rounded-xl border border-slate-700 bg-slate-950/98 shadow-2xl shadow-black/60 backdrop-blur-xl">
          <header className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
            <div><p className="m-0 text-[9px] font-black uppercase tracking-[0.18em] text-cyan-400">Device library</p><span className="text-[10px] text-slate-400">Choose a family, then add one focused unit.</span></div>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Close device library" className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-4 w-4" /></button>
          </header>
          <div className="grid max-h-[min(68vh,520px)] grid-cols-1 overflow-hidden md:grid-cols-[190px_minmax(0,1fr)]">
            <nav aria-label="Device categories" className="flex gap-1 overflow-x-auto border-b border-slate-800 bg-slate-900/60 p-2 md:flex-col md:border-b-0 md:border-r">
              {RACK_CATEGORIES.map((item) => {
                const Icon = item.icon;
                return <button key={item.id} type="button" onClick={() => {setCategory(item.id); setQuery('');}} className={`flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[10px] font-bold transition md:w-full ${category === item.id && !query ? 'bg-cyan-400 text-slate-950' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}><Icon className="h-3.5 w-3.5" /><span>{item.id}</span></button>;
              })}
            </nav>
            <div className="min-h-0 p-2.5">
              <label className="mb-2 flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5"><Search className="h-3.5 w-3.5 text-slate-500" /><span className="sr-only">Search devices</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search instruments, effects, routing…" className="min-w-0 flex-1 bg-transparent text-xs text-slate-100 outline-none placeholder:text-slate-600" /></label>
              <div className="grid max-h-[390px] grid-cols-1 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
                {choices.map((device) => {
                  const Icon = device.icon;
                  const active = device.id === activeWorkspace;
                  return <button key={device.id} type="button" onClick={() => choose(device.id)} className={`group flex min-h-[68px] items-start gap-2 rounded-lg border p-2.5 text-left transition ${active ? 'border-cyan-400/70 bg-cyan-400/10' : 'border-slate-800 bg-slate-900/70 hover:border-cyan-400/40 hover:bg-slate-800'}`}><Icon className={`mt-0.5 h-4 w-4 shrink-0 ${active ? 'text-cyan-300' : 'text-slate-500 group-hover:text-cyan-300'}`} /><span className="min-w-0"><strong className="block truncate text-[11px] text-slate-100">{device.label}</strong><small className="mt-1 block text-[9px] leading-4 text-slate-500">{device.description}</small></span></button>;
                })}
                {!choices.length && <div className="col-span-full rounded-lg border border-dashed border-slate-700 p-6 text-center text-xs text-slate-500">No matching rack device.</div>}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
