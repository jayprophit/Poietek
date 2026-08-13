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
  Plus,
  Bookmark,
  Save,
  Trash2,
  Download,
  Upload,
  Check,
  Sparkles,
  Move,
  GripVertical,
  Play,
  Pause,
  Volume2,
  Repeat,
  Package,
} from 'lucide-react';
import { WorkspaceType, ModuleType, PresetItem, RackModuleItem } from '../../types';
import { FACTORY_PRESETS } from '../../data/presetsData';
import { REASON_SOUND_BANK, SoundSampleItem } from '../../data/soundBankData';
import { audioEngine } from '../../audio/engine';

interface DAWBrowserSidebarProps {
  activeWorkspace: WorkspaceType;
  setActiveWorkspace: (ws: WorkspaceType) => void;
  isOpen: boolean;
  onToggle: () => void;
  onAddModuleToRack?: (type: ModuleType) => void;
  rackModules?: RackModuleItem[];
  currentBpm?: number;
  onLoadPreset?: (preset: PresetItem) => void;
  onOpenAudioPreview?: () => void;
}

export const DAWBrowserSidebar: React.FC<DAWBrowserSidebarProps> = ({
  activeWorkspace,
  setActiveWorkspace,
  isOpen,
  onToggle,
  onAddModuleToRack,
  rackModules = [],
  currentBpm = 92,
  onLoadPreset,
  onOpenAudioPreview,
}) => {
  const [activeTab, setActiveTab] = useState<'modules' | 'soundbank' | 'presets'>('soundbank');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [soundFilter, setSoundFilter] = useState<'all' | 'patch' | 'sample' | 'loop'>('all');
  const [openCategory, setOpenCategory] = useState<string>('instruments');

  // Audition Deck Player State
  const [selectedSample, setSelectedSample] = useState<SoundSampleItem | null>(REASON_SOUND_BANK[0]);
  const [isPlayingAudition, setIsPlayingAudition] = useState<boolean>(false);
  const [auditionVolume, setAuditionVolume] = useState<number>(0.8);
  const [isLoopAudition, setIsLoopAudition] = useState<boolean>(true);
  const [autoAuditionOnSelect, setAutoAuditionOnSelect] = useState<boolean>(true);

  // Custom User Saved Presets
  const [userPresets, setUserPresets] = useState<PresetItem[]>(() => {
    try {
      const saved = localStorage.getItem('studio_user_presets');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [newPresetName, setNewPresetName] = useState<string>('');
  const [newPresetDesc, setNewPresetDesc] = useState<string>('');
  const [isSavingPreset, setIsSavingPreset] = useState<boolean>(false);
  const [presetSavedSuccess, setPresetSavedSuccess] = useState<boolean>(false);

  const handleAuditionSound = (item: SoundSampleItem) => {
    setSelectedSample(item);
    setIsPlayingAudition(true);
    audioEngine.playSampleAudition(item.synthType, item.freq || 440, auditionVolume);
  };

  const handleSaveCurrentPreset = () => {
    if (!newPresetName.trim()) return;
    const newPreset: PresetItem = {
      id: `preset_user_${Date.now()}`,
      name: newPresetName.trim(),
      description: newPresetDesc.trim() || 'Custom User Rack Snapshot',
      category: 'user',
      bpm: currentBpm,
      createdAt: new Date().toISOString().split('T')[0],
      modules: JSON.parse(JSON.stringify(rackModules)),
      color: '#f59e0b',
    };

    const updated = [newPreset, ...userPresets];
    setUserPresets(updated);
    try {
      localStorage.setItem('studio_user_presets', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    setNewPresetName('');
    setNewPresetDesc('');
    setIsSavingPreset(false);
    setPresetSavedSuccess(true);
    setTimeout(() => setPresetSavedSuccess(false), 2000);
  };

  const handleDeleteUserPreset = (id: string) => {
    const updated = userPresets.filter((p) => p.id !== id);
    setUserPresets(updated);
    try {
      localStorage.setItem('studio_user_presets', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const categories = [
    {
      id: 'instruments',
      title: 'Instruments & Synthesizers',
      items: [
        { id: 'subtractor_synth', name: 'Subtractor Polyphonic Synth', type: 'Poly Synth', icon: Music, color: 'text-teal-400', category: 'instruments', tags: ['subtractor', 'synth', 'analog', 'subtractive', 'reason'] },
        { id: 'mpc', name: 'MPC Studio Drum Pad', type: 'Sampler Pad', icon: Grid, color: 'text-amber-400', category: 'instruments', tags: ['mpc', 'drum', 'pad', 'sampler', 'hiphop', 'boom bap'] },
        { id: 'sp404', name: 'SP-404 MKII Sampler', type: 'MFX Sampler', icon: Flame, color: 'text-orange-400', category: 'instruments', tags: ['sp404', 'lofi', 'sampler', 'mfx', 'effects', 'tape'] },
        { id: 'keyboard', name: 'Analog Subtractive Synth', type: 'Poly Synth', icon: Music, color: 'text-purple-400', category: 'instruments', tags: ['synth', 'keyboard', 'analog', 'lead', 'subtractive', 'bass'] },
        { id: 'drum_machines', name: 'Studio Drum Computer', type: 'Step Seq', icon: Zap, color: 'text-rose-400', category: 'instruments', tags: ['808', '909', 'drum computer', 'step', 'sequencer', 'drums'] },
        { id: 'edrum', name: 'E-Drum Mesh Kit', type: 'Mesh Kit', icon: Disc, color: 'text-yellow-400', category: 'instruments', tags: ['edrum', 'mesh', 'acoustic', 'percussion', 'cymbals'] },
        { id: 'chop_lab', name: 'Chop Lab Stem Slicer', type: 'Stem Chopper', icon: Scissors, color: 'text-emerald-400', category: 'instruments', tags: ['chop', 'stem', 'slicer', 'sample', 'vocal'] },
      ],
    },
    {
      id: 'effects',
      title: 'Plugins & Audio Effects (FX)',
      items: [
        { id: 'rv7000_reverb', name: 'RV7000 MkII Reverb FX', type: 'Reverb', icon: Sparkles, color: 'text-cyan-400', category: 'effects', tags: ['rv7000', 'reverb', 'hall', 'plate', 'convolution'] },
        { id: 'the_echo_delay', name: 'The Echo Tape Delay FX', type: 'Tape Delay', icon: Radio, color: 'text-amber-400', category: 'effects', tags: ['echo', 'delay', 'tape', 'wobble', 'pingpong'] },
        { id: 'scream4_distortion', name: 'Scream 4 Destruction FX', type: 'Distortion', icon: Flame, color: 'text-rose-400', category: 'effects', tags: ['scream', 'distortion', 'fuzz', 'overdrive', 'tube'] },
        { id: 'sidechain_ducker', name: 'Dynamic Sidechain Ducker', type: 'Ducker', icon: Activity, color: 'text-indigo-400', category: 'effects', tags: ['sidechain', 'ducker', 'pump', 'compressor'] },
      ],
    },
    {
      id: 'players',
      title: 'Reason Players & MIDI Effects',
      items: [
        { id: 'scales_chords', name: 'Scales & Chords Player', type: 'Harmonizer', icon: Sparkles, color: 'text-blue-400', category: 'players', tags: ['scales', 'chords', 'player', 'harmony', 'midi'] },
      ],
    },
    {
      id: 'mix_fx',
      title: 'Mixers, Combinator & Routing',
      items: [
        { id: 'folder_combinator', name: 'Combinator Bus Folder FX', type: 'Group Folder', icon: Folder, color: 'text-amber-400', category: 'mix_fx', tags: ['folder', 'combinator', 'bus', 'group', 'fx'] },
        { id: 'mixer', name: 'SSL 9000 Studio Master Console', type: 'Console', icon: Sliders, color: 'text-emerald-400', category: 'mix_fx', tags: ['mixer', 'ssl', 'console', 'eq', 'compressor'] },
        { id: 'patchbay', name: 'Audio & CV Patch Bay', type: 'Hardware CV', icon: Radio, color: 'text-cyan-400', category: 'mix_fx', tags: ['patchbay', 'cv', 'cable', 'routing'] },
        { id: 'dj', name: 'DJ Decks Performance Console', type: 'Performance', icon: Disc, color: 'text-blue-400', category: 'mix_fx', tags: ['dj', 'deck', 'crossfader', 'scratch'] },
      ],
    },
    {
      id: 'sequencers',
      title: 'Sequencers & Pattern Racks',
      items: [
        { id: 'wave_sequencer', name: 'Multi-Track Audio Waveforms', type: 'Multi-Track', icon: Layers, color: 'text-blue-400', category: 'mix_fx', tags: ['wave', 'audio', 'timeline', 'multitrack', 'logic'] },
        { id: 'piano_roll', name: 'Universal Piano Roll Grid', type: 'MIDI Grid', icon: Grid, color: 'text-indigo-400', category: 'mix_fx', tags: ['piano roll', 'midi', 'notes', 'grid'] },
        { id: 'fl_channel_rack', name: 'Pattern Step Channel Rack', type: '16-Step Beat', icon: Zap, color: 'text-orange-400', category: 'mix_fx', tags: ['fl', 'channel rack', 'step', 'pattern'] },
        { id: 'd_groove', name: 'D-Groove Shuffle Pool', type: 'ReGroove', icon: Sliders, color: 'text-amber-400', category: 'mix_fx', tags: ['groove', 'shuffle', 'swing', 'timing'] },
      ],
    },
  ];

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed left-0 top-12 bottom-12 w-6 bg-stone-900 border-r border-stone-700 hover:bg-stone-800 flex flex-col items-center justify-center text-amber-400 z-30 transition shadow-2xl"
        title="Open DAW Browser (Ctrl+B)"
      >
        <span className="text-[10px] font-mono font-black uppercase tracking-widest transform -rotate-90 whitespace-nowrap">
          DAW BROWSER
        </span>
      </button>
    );
  }

  return (
    <>
      {/* Mobile/Tablet Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
        onClick={onToggle}
      />

      <aside className="fixed inset-y-0 left-0 z-50 lg:static lg:z-20 w-80 sm:w-80 lg:w-72 shrink-0 bg-stone-950 border-r-2 border-stone-800 flex flex-col h-full font-mono select-none shadow-2xl transition-transform duration-300">
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

      {/* Primary Tab Switcher */}
      <div className="grid grid-cols-3 bg-stone-900 border-b border-stone-800 p-1 gap-1 text-[9px] font-black">
        <button
          onClick={() => setActiveTab('soundbank')}
          className={`py-1.5 rounded flex items-center justify-center gap-1 transition ${
            activeTab === 'soundbank'
              ? 'bg-amber-500 text-neutral-950 shadow'
              : 'text-stone-400 hover:bg-stone-800'
          }`}
        >
          <Package className="w-3 h-3" />
          <span>SOUND BANK</span>
        </button>

        <button
          onClick={() => setActiveTab('modules')}
          className={`py-1.5 rounded flex items-center justify-center gap-1 transition ${
            activeTab === 'modules'
              ? 'bg-amber-500 text-neutral-950 shadow'
              : 'text-stone-400 hover:bg-stone-800'
          }`}
        >
          <Layers className="w-3 h-3" />
          <span>RACK UNITS</span>
        </button>

        <button
          onClick={() => setActiveTab('presets')}
          className={`py-1.5 rounded flex items-center justify-center gap-1 transition ${
            activeTab === 'presets'
              ? 'bg-amber-500 text-neutral-950 shadow'
              : 'text-stone-400 hover:bg-stone-800'
          }`}
        >
          <Bookmark className="w-3 h-3" />
          <span>PRESETS</span>
        </button>
      </div>

      {/* SEARCH BAR (Used across all tabs) */}
      <div className="p-2 bg-stone-900/80 border-b border-stone-800 space-y-1.5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-500" />
          <input
            type="text"
            placeholder={
              activeTab === 'soundbank'
                ? 'Search samples, loops, patches...'
                : activeTab === 'modules'
                ? 'Search rack units, synths...'
                : 'Search presets...'
            }
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
      </div>

      {/* TAB 1: REASON SOUND BANK & SAMPLES / LOOPS */}
      {activeTab === 'soundbank' && (
        <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-stone-800">
          {/* External Audio Sample Preview Launcher Button */}
          {onOpenAudioPreview && (
            <button
              onClick={onOpenAudioPreview}
              className="w-full py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500 hover:text-neutral-950 text-amber-300 font-black text-xs transition border border-amber-500/40 flex items-center justify-center gap-2 shadow"
            >
              <Activity className="w-4 h-4" />
              <span>OPEN AUDIO SAMPLE PREVIEW PANEL</span>
            </button>
          )}

          {/* Sub-Category Filter Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[9px] font-black">
            {(['all', 'patch', 'sample', 'loop'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setSoundFilter(filter)}
                className={`px-2 py-1 rounded uppercase tracking-wider whitespace-nowrap transition ${
                  soundFilter === filter
                    ? 'bg-amber-500 text-black font-black'
                    : 'bg-stone-900 text-stone-400 hover:bg-stone-800'
                }`}
              >
                {filter === 'all'
                  ? 'All Sounds'
                  : filter === 'patch'
                  ? 'Patches'
                  : filter === 'sample'
                  ? 'Samples'
                  : 'Loops'}
              </button>
            ))}
          </div>

          {/* Sound Bank Items List */}
          <div className="space-y-1">
            {REASON_SOUND_BANK.filter((item) => {
              if (soundFilter !== 'all' && item.category !== soundFilter) return false;
              if (searchTerm.trim()) {
                const t = searchTerm.toLowerCase();
                return (
                  item.name.toLowerCase().includes(t) ||
                  item.subCategory.toLowerCase().includes(t) ||
                  (item.refillName && item.refillName.toLowerCase().includes(t)) ||
                  item.tags.some((tag) => tag.toLowerCase().includes(t))
                );
              }
              return true;
            }).map((item) => {
              const isSelected = selectedSample?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedSample(item);
                    if (autoAuditionOnSelect) {
                      handleAuditionSound(item);
                    }
                  }}
                  className={`p-2 rounded-lg border text-left transition cursor-pointer flex flex-col gap-1 ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/60 text-amber-300 font-bold'
                      : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:border-amber-500/40 hover:bg-stone-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-amber-400/90 truncate">
                      {item.refillName || 'Reason Bank'}
                    </span>
                    <span className="text-[9px] bg-stone-950 px-1.5 py-0.5 rounded border border-stone-800 text-stone-400">
                      {item.type || item.category}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold truncate text-white">{item.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAuditionSound(item);
                      }}
                      className="p-1 rounded bg-amber-500 hover:bg-amber-400 text-neutral-950 shrink-0 shadow"
                      title="Audition Sound"
                    >
                      <Play className="w-3 h-3 fill-current" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-stone-500 pt-0.5">
                    <span>{item.subCategory}</span>
                    {item.bpm && <span className="text-amber-400 font-bold">{item.bpm} BPM</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: RACK UNITS & MODULES */}
      {activeTab === 'modules' && (
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin scrollbar-thumb-stone-800">
          {categories.map((cat) => {
            const isCatOpen = openCategory === cat.id || searchTerm.length > 0;
            const filteredItems = cat.items.filter((item) => {
              const term = searchTerm.toLowerCase().trim();
              if (!term) return true;
              return (
                item.name.toLowerCase().includes(term) ||
                item.type.toLowerCase().includes(term)
              );
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
                  </div>
                  {isCatOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
                  )}
                </button>

                {isCatOpen && (
                  <div className="p-1 space-y-1 bg-stone-950/80">
                    {filteredItems.map((item, idx) => {
                      const Icon = item.icon;
                      const isActive = activeWorkspace === item.id;
                      return (
                        <div
                          key={`${item.id}_${idx}`}
                          draggable={true}
                          onDragStart={(e) => {
                            e.dataTransfer.setData('moduleType', item.id);
                            e.dataTransfer.setData('text/plain', item.id);
                            e.dataTransfer.effectAllowed = 'copy';
                          }}
                          className={`p-1.5 rounded flex items-center justify-between text-left transition border cursor-grab active:cursor-grabbing hover:scale-[1.01] ${
                            isActive
                              ? 'bg-amber-500/10 border-amber-500/50 text-amber-300 font-black'
                              : 'bg-stone-900/40 border-stone-800 text-stone-300 hover:border-amber-500/50 hover:bg-stone-900'
                          }`}
                          title="Drag into Rack Stack or click ADD"
                        >
                          <div
                            onClick={() => setActiveWorkspace(item.id as WorkspaceType)}
                            className="flex items-center gap-2 truncate cursor-pointer flex-1"
                          >
                            <GripVertical className="w-3 h-3 text-stone-600 hover:text-amber-400 shrink-0" />
                            <Icon className={`w-3.5 h-3.5 shrink-0 ${item.color}`} />
                            <span className="text-xs truncate font-bold">{item.name}</span>
                          </div>

                          {onAddModuleToRack && (
                            <button
                              onClick={() => onAddModuleToRack(item.id as ModuleType)}
                              className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-[10px] flex items-center gap-0.5 shrink-0 shadow"
                              title="Add device into active Rack Stack"
                            >
                              <Plus className="w-3 h-3" />
                              <span>ADD</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: PRESETS & SNAPSHOTS */}
      {activeTab === 'presets' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin scrollbar-thumb-stone-800">
          {/* Save Current Rack as Snapshot */}
          <div className="bg-stone-900 p-3 rounded-2xl border border-amber-500/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Save className="w-3.5 h-3.5" />
                SAVE RACK SNAPSHOT
              </span>
              {presetSavedSuccess && (
                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" /> SAVED!
                </span>
              )}
            </div>

            {isSavingPreset ? (
              <div className="space-y-2 pt-1">
                <input
                  type="text"
                  placeholder="Preset Name (e.g. My Boom Bap Stack)"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  className="w-full bg-stone-950 border border-amber-500 text-amber-400 font-bold text-xs p-1.5 rounded-lg outline-none"
                  autoFocus
                />
                <input
                  type="text"
                  placeholder="Description / Notes..."
                  value={newPresetDesc}
                  onChange={(e) => setNewPresetDesc(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 text-stone-300 text-xs p-1.5 rounded-lg outline-none"
                />
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleSaveCurrentPreset}
                    className="flex-1 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs"
                  >
                    SAVE PRESET
                  </button>
                  <button
                    onClick={() => setIsSavingPreset(false)}
                    className="px-3 py-1.5 rounded-lg bg-stone-800 text-stone-400 hover:text-white text-xs font-bold"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsSavingPreset(true)}
                className="w-full py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500 hover:text-neutral-950 text-amber-400 font-black text-xs border border-amber-500/50 flex items-center justify-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                <span>SAVE CURRENT RACK STATE</span>
              </button>
            )}
          </div>

          {/* User Saved Presets */}
          {userPresets.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider block">
                MY USER PRESETS ({userPresets.length})
              </span>
              <div className="space-y-1.5">
                {userPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="p-2.5 rounded-xl bg-stone-900 border border-amber-500/30 flex flex-col justify-between space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-400">{preset.name}</span>
                      <span className="text-[9px] font-mono text-stone-500">{preset.bpm} BPM</span>
                    </div>
                    <p className="text-[10px] text-stone-400 line-clamp-2">{preset.description}</p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[9px] text-stone-500">{preset.modules.length} Modules</span>
                      <div className="flex items-center gap-1">
                        {onLoadPreset && (
                          <button
                            onClick={() => onLoadPreset(preset)}
                            className="px-2.5 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-[10px]"
                          >
                            LOAD
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUserPreset(preset.id)}
                          className="p-1 rounded bg-stone-800 hover:bg-rose-900 text-stone-400 hover:text-rose-300"
                          title="Delete User Preset"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Factory Presets List */}
          <div className="space-y-2">
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider block">
              FACTORY STUDIO PRESETS ({FACTORY_PRESETS.length})
            </span>
            <div className="space-y-2">
              {FACTORY_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 hover:border-amber-500/50 space-y-1.5 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-stone-200">{preset.name}</span>
                    <span className="text-[9px] font-mono text-amber-400 font-bold">{preset.bpm} BPM</span>
                  </div>
                  <p className="text-[10px] text-stone-400 leading-tight">{preset.description}</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[9px] font-mono text-stone-500">{preset.modules.length} Rack Units</span>
                    {onLoadPreset && (
                      <button
                        onClick={() => onLoadPreset(preset)}
                        className="px-2.5 py-1 rounded bg-stone-800 hover:bg-amber-500 hover:text-neutral-950 text-amber-400 font-black text-[10px] border border-amber-500/30 transition"
                      >
                        LOAD PRESET
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* REASON BROWSER AUDITION PLAYER DECK */}
      {selectedSample && (
        <div className="p-2.5 bg-neutral-950 border-t-2 border-amber-500/60 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1">
              <Volume2 className="w-3 h-3 text-amber-400" />
              AUDITION PLAYER DECK
            </span>
            <label className="flex items-center gap-1 text-[9px] text-stone-400 cursor-pointer">
              <input
                type="checkbox"
                checked={autoAuditionOnSelect}
                onChange={(e) => setAutoAuditionOnSelect(e.target.checked)}
                className="accent-amber-500"
              />
              <span>Auto-Play</span>
            </label>
          </div>

          <div className="bg-stone-900 p-2 rounded-lg border border-stone-800 space-y-1.5">
            <div className="text-[11px] font-bold text-white truncate">{selectedSample.name}</div>

            {/* Play controls and Waveform line */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAuditionSound(selectedSample)}
                className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black shadow shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
              </button>

              <div className="flex-1 h-6 bg-black rounded border border-stone-800 relative overflow-hidden flex items-center px-1">
                <div className="w-full h-1 bg-amber-500/40 rounded relative">
                  {isPlayingAudition && (
                    <div className="absolute left-0 top-0 bottom-0 bg-amber-400 animate-pulse w-full rounded" />
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={auditionVolume}
                  onChange={(e) => setAuditionVolume(Number(e.target.value))}
                  className="w-12 accent-amber-400 cursor-pointer"
                  title="Audition Volume"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="p-2 bg-stone-950 border-t border-stone-800 text-[10px] text-stone-500 text-center">
        STUDIO FACTORY SOUNDS • EXPANSIONS ACTIVE
      </div>
    </aside>
    </>
  );
};
