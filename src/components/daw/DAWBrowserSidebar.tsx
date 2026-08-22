import React, { useState } from 'react';
import {
  Folder,
  ChevronRight,
  ChevronDown,
  Search,
  Music,
  Sliders,
  Radio,
  Zap,
  Disc,
  Flame,
  Grid,
  Layers,
  Activity,
  Compass,
  Cpu,
  Scissors,
  Share2,
  HardDrive,
  X,
} from 'lucide-react';
import { WorkspaceType } from '../../types';

interface DAWBrowserSidebarProps {
  activeWorkspace: WorkspaceType;
  setActiveWorkspace: (ws: WorkspaceType) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const DAWBrowserSidebar: React.FC<DAWBrowserSidebarProps> = ({
  activeWorkspace,
  setActiveWorkspace,
  isOpen,
  onToggle,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'instruments' | 'kits' | 'patches' | 'mix_fx'>('all');
  const [openCategory, setOpenCategory] = useState<string>('instruments');

  const categories = [
    {
      id: 'instruments',
      title: 'Instruments & Samplers',
      items: [
        { id: 'mpc', name: 'Canvas Drum Grid', type: 'Sampler Pad', icon: Grid, color: 'text-amber-400', category: 'instruments', tags: ['drum', 'pad', 'sampler', 'hiphop', 'boom bap'] },
        { id: 'sp404', name: 'Grain Deck Sampler', type: 'Texture Sampler', icon: Flame, color: 'text-orange-400', category: 'instruments', tags: ['lofi', 'sampler', 'effects', 'tape'] },
        { id: 'keyboard', name: 'Analog Subtractive Synth', type: 'Poly Synth', icon: Music, color: 'text-purple-400', category: 'instruments', tags: ['synth', 'keyboard', 'analog', 'lead', 'subtractive', 'bass'] },
        { id: 'drum_machines', name: 'Studio Drum Computer', type: 'Step Seq', icon: Zap, color: 'text-rose-400', category: 'instruments', tags: ['808', '909', 'drum computer', 'step', 'sequencer', 'drums'] },
        { id: 'edrum', name: 'E-Drum Mesh Kit', type: 'Mesh Kit', icon: Disc, color: 'text-yellow-400', category: 'instruments', tags: ['edrum', 'mesh', 'acoustic', 'percussion', 'cymbals'] },
        { id: 'chop_lab', name: 'Chop Lab Stem Slicer', type: 'Stem Chopper', icon: Scissors, color: 'text-emerald-400', category: 'instruments', tags: ['chop', 'stem', 'slicer', 'sample', 'vocal'] },
      ],
    },
    {
      id: 'kits',
      title: 'Factory Drum Kits & Sample Packs',
      items: [
        { id: 'mpc', name: 'Deep Circuit Drum Kit', type: 'Kit Patch', icon: Grid, color: 'text-rose-400', category: 'kits', tags: ['sub', 'trap', 'kit', 'drums', 'hihat'] },
        { id: 'mpc', name: '909 Vintage Techno Kit', type: 'Kit Patch', icon: Disc, color: 'text-yellow-400', category: 'kits', tags: ['909', 'techno', 'house', 'kit', 'snare', 'kick'] },
        { id: 'sp404', name: 'Foundry Texture Sample Pack', type: 'Procedural Pack', icon: Flame, color: 'text-orange-400', category: 'kits', tags: ['lofi', 'texture', 'samples', 'chops'] },
        { id: 'edrum', name: 'Acoustic Studio Mesh Drums', type: 'Mesh Preset', icon: Disc, color: 'text-amber-400', category: 'kits', tags: ['acoustic', 'drums', 'mesh', 'studio', 'real'] },
        { id: 'chop_lab', name: 'Golden Era Vocal Chops Pack', type: 'Stem Pack', icon: Scissors, color: 'text-emerald-400', category: 'kits', tags: ['vocal', 'chops', 'stem', 'soul', 'rnb'] },
      ],
    },
    {
      id: 'patches',
      title: 'Synth Patches & Vocal Tuners',
      items: [
        { id: 'keyboard', name: 'Warm Analog Saw Lead Patch', type: 'Synth Preset', icon: Music, color: 'text-purple-400', category: 'patches', tags: ['saw', 'synth', 'lead', 'warm', 'analog'] },
        { id: 'keyboard', name: 'Sub Bass Wobble 808 Patch', type: 'Synth Preset', icon: Music, color: 'text-indigo-400', category: 'patches', tags: ['sub', 'bass', 'wobble', '808', 'patch'] },
        { id: 'melodyne_pitch', name: 'Vocal Contour Guide (C Minor)', type: 'Pitch Edit', icon: Activity, color: 'text-purple-400', category: 'patches', tags: ['vocal', 'pitch', 'scale'] },
        { id: 'circle_fifths', name: 'Circle of Fifths Harmony Wheel', type: 'Harmony AI', icon: Compass, color: 'text-amber-400', category: 'patches', tags: ['chords', 'harmony', 'fifths', 'theory', 'ai'] },
      ],
    },
    {
      id: 'sequencers',
      title: 'Sequencers & Pattern Racks',
      items: [
        { id: 'wave_sequencer', name: 'Horizon Multi-Track Waveforms', type: 'Multi-Track', icon: Layers, color: 'text-blue-400', category: 'mix_fx', tags: ['wave', 'audio', 'timeline', 'multitrack'] },
        { id: 'piano_roll', name: 'Universal Piano Roll Grid', type: 'MIDI Grid', icon: Grid, color: 'text-indigo-400', category: 'mix_fx', tags: ['piano roll', 'midi', 'notes', 'grid'] },
        { id: 'fl_channel_rack', name: 'Pattern Step Channel Rack', type: '16-Step Beat', icon: Zap, color: 'text-orange-400', category: 'mix_fx', tags: ['fl', 'channel rack', 'step', 'pattern'] },
        { id: 'd_groove', name: 'Human Pulse Groove Pool', type: 'Timing Pool', icon: Sliders, color: 'text-amber-400', category: 'mix_fx', tags: ['groove', 'shuffle', 'swing', 'timing'] },
      ],
    },
    {
      id: 'mix_fx',
      title: 'Mixers, Bus Folders & CV Patch Bay',
      items: [
        { id: 'folder_combinator', name: 'Combinator Bus Folder FX', type: 'Group Folder', icon: Folder, color: 'text-amber-400', category: 'mix_fx', tags: ['folder', 'combinator', 'bus', 'group', 'fx'] },
        { id: 'mixer', name: 'Summit Studio Master Console', type: 'Console', icon: Sliders, color: 'text-emerald-400', category: 'mix_fx', tags: ['mixer', 'console', 'eq', 'compressor'] },
        { id: 'patchbay', name: 'Audio & CV Patch Bay', type: 'Hardware CV', icon: Radio, color: 'text-cyan-400', category: 'mix_fx', tags: ['patchbay', 'cv', 'cable', 'routing'] },
        { id: 'dj', name: 'DJ Decks Performance Console', type: 'Performance', icon: Disc, color: 'text-blue-400', category: 'mix_fx', tags: ['dj', 'deck', 'crossfader', 'scratch'] },
      ],
    },
    {
      id: 'hardware_diy',
      title: 'Hardware & Controller Mapping',
      items: [
        { id: 'mapper', name: 'Universal Hardware Mapper', type: 'MIDI Learn', icon: Cpu, color: 'text-stone-300', category: 'mix_fx', tags: ['mapper', 'midi', 'learn', 'hardware'] },
        { id: 'visual_editor', name: 'DIY Controller Builder', type: 'Custom Layout', icon: Layers, color: 'text-amber-500', category: 'mix_fx', tags: ['builder', 'layout', 'diy', 'controller'] },
        { id: 'midi_matrix', name: 'MIDI Signal Routing Matrix', type: 'Signal Flow', icon: Share2, color: 'text-indigo-300', category: 'mix_fx', tags: ['matrix', 'routing', 'midi', 'signal'] },
        { id: 'health_latency', name: 'System Latency & Diagnostics', type: 'Diagnostics', icon: Activity, color: 'text-rose-400', category: 'mix_fx', tags: ['health', 'latency', 'system', 'diag'] },
      ],
    },
  ];

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="poietek-browser-toggle absolute bottom-12 left-0 top-12 z-30 flex w-6 flex-col items-center justify-center border-r border-stone-700 bg-stone-900 text-amber-400 shadow-2xl transition hover:bg-stone-800"
        title="Open DAW Browser (Ctrl+B)"
      >
        <span className="text-[10px] font-mono font-black uppercase tracking-widest transform -rotate-90 whitespace-nowrap">
          DAW BROWSER
        </span>
      </button>
    );
  }

  return (
    <aside className="poietek-browser-sidebar absolute inset-y-0 left-0 z-50 flex h-full w-64 shrink-0 flex-col border-r-2 border-stone-800 bg-stone-950 font-mono shadow-2xl select-none xl:relative xl:inset-auto xl:z-20">
      {/* Browser Header Bar */}
      <div className="p-3 bg-stone-900 border-b border-stone-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
            STUDIO BROWSER
          </span>
        </div>
        <button
          onClick={onToggle}
          className="px-2 py-0.5 bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white rounded text-[10px] border border-stone-700"
        >
          CLOSE
        </button>
      </div>

      {/* Quick Search & Filter Bar */}
      <div className="p-2 bg-stone-900/80 border-b border-stone-800 space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-500" />
          <input
            type="text"
            placeholder="Search modules, kits, patches..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-stone-950 border border-stone-800 rounded-lg pl-8 pr-7 py-1.5 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-2 text-stone-500 hover:text-stone-300 p-0.5 rounded"
              title="Clear Search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Real-time Category Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none text-[9px] font-bold">
          {[
            { id: 'all', label: 'ALL' },
            { id: 'instruments', label: 'SYNTHS' },
            { id: 'kits', label: 'DRUM KITS' },
            { id: 'patches', label: 'PATCHES' },
            { id: 'mix_fx', label: 'BUS & FX' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFilter(f.id as any)}
              className={`px-2 py-0.5 rounded-full transition whitespace-nowrap ${
                selectedFilter === f.id
                  ? 'bg-amber-500 text-neutral-950 font-black'
                  : 'bg-stone-900 text-stone-400 hover:bg-stone-800 hover:text-stone-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tree Category Explorer */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-stone-800">
        {categories.map((cat) => {
          const isCatOpen = openCategory === cat.id || searchTerm.length > 0;
          const filteredItems = cat.items.filter((item) => {
            const matchesFilter =
              selectedFilter === 'all' || item.category === selectedFilter;
            const term = searchTerm.toLowerCase().trim();
            if (!term) return matchesFilter;

            const matchesName = item.name.toLowerCase().includes(term);
            const matchesType = item.type.toLowerCase().includes(term);
            const matchesTags = item.tags ? item.tags.some((t) => t.toLowerCase().includes(term)) : false;

            return matchesFilter && (matchesName || matchesType || matchesTags);
          });

          if (searchTerm && filteredItems.length === 0) return null;

          return (
            <div key={cat.id} className="border border-stone-800/80 rounded-xl bg-stone-900/40 overflow-hidden">
              <button
                onClick={() => setOpenCategory(isCatOpen ? '' : cat.id)}
                className="w-full px-2.5 py-1.5 bg-stone-900 hover:bg-stone-800 flex items-center justify-between text-xs font-bold text-stone-300 text-left transition"
              >
                <div className="flex items-center gap-2">
                  <Folder className="w-3.5 h-3.5 text-amber-500" />
                  <span>{cat.title}</span>
                  {searchTerm && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                      {filteredItems.length}
                    </span>
                  )}
                </div>
                {isCatOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
                )}
              </button>

              {isCatOpen && (
                <div className="p-1 space-y-0.5 bg-stone-950/80">
                  {filteredItems.length === 0 ? (
                    <div className="p-2 text-[10px] text-stone-600 text-center italic">
                      No matching items
                    </div>
                  ) : (
                    filteredItems.map((item, idx) => {
                      const Icon = item.icon;
                      const isActive = activeWorkspace === item.id;
                      return (
                        <button
                          key={`${item.id}_${idx}`}
                          onClick={() => setActiveWorkspace(item.id as WorkspaceType)}
                          className={`w-full px-2 py-1.5 rounded flex items-center justify-between text-left transition border ${
                            isActive
                              ? 'bg-amber-500/10 border-amber-500/50 text-amber-300 font-black'
                              : 'bg-transparent border-transparent text-stone-400 hover:bg-stone-900 hover:text-stone-200'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate pr-1">
                            <Icon className={`w-3.5 h-3.5 shrink-0 ${item.color}`} />
                            <span className="text-xs truncate">{item.name}</span>
                          </div>
                          <span className="text-[9px] font-mono text-stone-600 uppercase shrink-0">
                            {item.type}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-2 bg-stone-950 border-t border-stone-800 text-[10px] text-stone-500 text-center">
        STUDIO FACTORY SOUNDS • EXPANSIONS ACTIVE
      </div>
    </aside>
  );
};
