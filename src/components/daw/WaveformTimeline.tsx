import React, { useState, useRef, useEffect } from 'react';
import {
  Scissors,
  ZoomIn,
  ZoomOut,
  Play,
  Pause,
  Square,
  Volume2,
  Sliders,
  Plus,
  Trash2,
  Copy,
  Maximize2,
  X,
  Music,
  Check,
  Split,
  Edit3,
  Move,
  VolumeX,
  Layers,
  Activity,
  Mic,
  Disc,
  ExternalLink,
  RotateCcw,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { AudioRegion, SequencerTrack } from '../../types';
import { audioEngine } from '../../audio/engine';
import { AudioClipEditor } from './AudioClipEditor';

interface WaveformTimelineProps {
  bpm?: number;
  tracks?: SequencerTrack[];
  onUpdateTracks?: (tracks: SequencerTrack[]) => void;
  onSelectClipForEdit?: (region: AudioRegion, trackId: string) => void;
  onDetach?: () => void;
}

export const WaveformTimeline: React.FC<WaveformTimelineProps> = ({
  bpm = 94,
  tracks: externalTracks,
  onUpdateTracks,
  onDetach,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0); // Horizontal zoom
  const [verticalZoom, setVerticalZoom] = useState<number>(1.0); // Vertical zoom
  const [playheadPosPercent, setPlayheadPosPercent] = useState<number>(0);
  const [selectedTool, setSelectedTool] = useState<'pointer' | 'scissors' | 'trim'>('pointer');
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>('reg_1');

  // Bottom Split Inspector Tab State
  const [activeBottomTab, setActiveBottomTab] = useState<'sample' | 'flex_pitch' | 'process'>('sample');
  const [isInspectorExpanded, setIsInspectorExpanded] = useState<boolean>(true);

  // Modal State for Double-Clicked Audio Clip
  const [editingRegion, setEditingRegion] = useState<{
    region: AudioRegion;
    trackId: string;
    trackName: string;
    trackColor: string;
  } | null>(null);

  // Default initial tracks if external tracks not supplied
  const [internalTracks, setInternalTracks] = useState<SequencerTrack[]>([
    {
      id: 'tr_1',
      name: 'Vocal Lead Hook (Studio Stem)',
      type: 'audio',
      color: '#ec4899',
      isMuted: false,
      isSolo: false,
      isArmed: true,
      volume: 85,
      pan: 0,
      regions: [
        {
          id: 'reg_1',
          startBar: 1,
          durationBars: 4,
          title: 'Vocal_Chorus_Lead.wav',
          waveSeed: 101,
          gainDb: 0,
          pitchOffset: 0,
          trimStartPercent: 0,
          trimEndPercent: 0,
          type: 'audio',
        },
        {
          id: 'reg_2',
          startBar: 9,
          durationBars: 4,
          title: 'Vocal_Outro_Adlib.wav',
          waveSeed: 102,
          gainDb: 2,
          pitchOffset: 0,
          trimStartPercent: 0,
          trimEndPercent: 0,
          type: 'audio',
        },
      ],
    },
    {
      id: 'tr_2',
      name: 'Subtractive BassSynth Lead',
      type: 'instrument',
      color: '#a855f7',
      isMuted: false,
      isSolo: false,
      isArmed: false,
      volume: 90,
      pan: -10,
      regions: [
        {
          id: 'reg_3',
          startBar: 1,
          durationBars: 8,
          title: 'SubSynth_BassLine_Pattern.midi',
          waveSeed: 303,
          gainDb: 0,
          pitchOffset: -12,
          trimStartPercent: 0,
          trimEndPercent: 0,
          type: 'midi',
        },
      ],
    },
    {
      id: 'tr_3',
      name: 'MPC Boom Bap Drum Kit',
      type: 'audio',
      color: '#f59e0b',
      isMuted: false,
      isSolo: false,
      isArmed: false,
      volume: 95,
      pan: 0,
      regions: [
        {
          id: 'reg_4',
          startBar: 1,
          durationBars: 12,
          title: 'MPC_BoomBap_Beat_Loop.wav',
          waveSeed: 808,
          gainDb: 1,
          pitchOffset: 0,
          trimStartPercent: 0,
          trimEndPercent: 0,
          type: 'audio',
        },
      ],
    },
  ]);

  const activeTracks = externalTracks || internalTracks;

  const updateTracksState = (newTracks: SequencerTrack[]) => {
    if (onUpdateTracks) {
      onUpdateTracks(newTracks);
    } else {
      setInternalTracks(newTracks);
    }
  };

  // Playhead transport animation interval
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlayheadPosPercent((prev) => (prev >= 100 ? 0 : prev + 0.25));
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleTogglePlay = () => {
    audioEngine.initAudio();
    setIsPlaying(!isPlaying);
  };

  const handleAddTrack = (type: 'audio' | 'instrument' = 'audio') => {
    const newTr: SequencerTrack = {
      id: `tr_${Date.now()}`,
      name: type === 'audio' ? `Audio Track ${activeTracks.length + 1}` : `MIDI Synth Track ${activeTracks.length + 1}`,
      type,
      color: type === 'audio' ? '#06b6d4' : '#10b981',
      isMuted: false,
      isSolo: false,
      isArmed: false,
      volume: 80,
      pan: 0,
      regions: [
        {
          id: `reg_${Date.now()}`,
          startBar: 1,
          durationBars: 4,
          title: type === 'audio' ? 'Recorded_Audio_Clip.wav' : 'Synthesizer_MIDI_Pattern.midi',
          waveSeed: Math.floor(Math.random() * 900) + 100,
          gainDb: 0,
          pitchOffset: 0,
          trimStartPercent: 0,
          trimEndPercent: 0,
          type: type === 'audio' ? 'audio' : 'midi',
        },
      ],
    };
    updateTracksState([...activeTracks, newTr]);
  };

  const handleRegionDoubleClick = (reg: AudioRegion, track: SequencerTrack) => {
    setEditingRegion({
      region: reg,
      trackId: track.id,
      trackName: track.name,
      trackColor: track.color,
    });
  };

  const handleUpdateRegion = (updatedReg: AudioRegion) => {
    if (!editingRegion) return;
    const updatedTracks = activeTracks.map((tr) => {
      if (tr.id !== editingRegion.trackId) return tr;
      return {
        ...tr,
        regions: tr.regions.map((r) => (r.id === updatedReg.id ? updatedReg : r)),
      };
    });
    updateTracksState(updatedTracks);
  };

  const handleSliceRegion = (regionId: string, slicePercent: number) => {
    const updatedTracks = activeTracks.map((tr) => {
      const regIdx = tr.regions.findIndex((r) => r.id === regionId);
      if (regIdx === -1) return tr;

      const targetReg = tr.regions[regIdx];
      const sliceFraction = slicePercent / 100;
      const firstDuration = Math.max(0.5, Math.round(targetReg.durationBars * sliceFraction * 10) / 10);
      const secondDuration = Math.max(0.5, Math.round((targetReg.durationBars - firstDuration) * 10) / 10);

      const part1: AudioRegion = {
        ...targetReg,
        durationBars: firstDuration,
        title: `${targetReg.title.replace(/\.(wav|midi)/, '')}_Pt1.${targetReg.type === 'audio' ? 'wav' : 'midi'}`,
      };

      const part2: AudioRegion = {
        ...targetReg,
        id: `reg_${Date.now()}_slice`,
        startBar: targetReg.startBar + firstDuration,
        durationBars: secondDuration,
        title: `${targetReg.title.replace(/\.(wav|midi)/, '')}_Pt2.${targetReg.type === 'audio' ? 'wav' : 'midi'}`,
      };

      const newRegions = [...tr.regions];
      newRegions.splice(regIdx, 1, part1, part2);

      return {
        ...tr,
        regions: newRegions,
      };
    });

    updateTracksState(updatedTracks);
  };

  const handleDeleteRegion = (regionId: string) => {
    const updatedTracks = activeTracks.map((tr) => ({
      ...tr,
      regions: tr.regions.filter((r) => r.id !== regionId),
    }));
    updateTracksState(updatedTracks);
    if (selectedRegionId === regionId) setSelectedRegionId(null);
  };

  const handleDuplicateRegion = (region: AudioRegion) => {
    const updatedTracks = activeTracks.map((tr) => {
      if (!tr.regions.some((r) => r.id === region.id)) return tr;
      const copyReg: AudioRegion = {
        ...region,
        id: `reg_${Date.now()}_dup`,
        startBar: region.startBar + region.durationBars,
        title: `${region.title.replace(/\.(wav|midi)/, '')}_Copy.${region.type === 'audio' ? 'wav' : 'midi'}`,
      };
      return {
        ...tr,
        regions: [...tr.regions, copyReg],
      };
    });
    updateTracksState(updatedTracks);
  };

  // Slice active clip at playhead
  const handleSliceAtPlayhead = () => {
    if (!selectedRegionId) return;
    const playheadBar = Math.floor((playheadPosPercent / 100) * 16) + 1;
    activeTracks.forEach((tr) => {
      const reg = tr.regions.find((r) => r.id === selectedRegionId);
      if (reg && playheadBar > reg.startBar && playheadBar < reg.startBar + reg.durationBars) {
        const slicePct = ((playheadBar - reg.startBar) / reg.durationBars) * 100;
        handleSliceRegion(reg.id, slicePct);
      }
    });
  };

  const totalBars = 16;
  const pixelsPerBar = 70 * zoomLevel;

  return (
    <div className="bg-neutral-950 border-2 border-stone-800 rounded-3xl p-4 shadow-2xl font-mono select-none space-y-3">
      {/* Waveform Timeline Header & Transport Toolbar */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500 rounded-xl text-neutral-950 font-black shadow">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
              MULTI-TRACK WAVEFORM TIMELINE & CLIP EDITOR
            </h3>
            <p className="text-[10px] text-neutral-400">
              Logic/Cubase horizontal track view • Double-click any wave clip to open precision AudioClipEditor.
            </p>
          </div>
        </div>

        {/* Editing Tools & Transport Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Tool Selector */}
          <div className="flex items-center bg-neutral-900 rounded-xl p-1 border border-neutral-800">
            <button
              onClick={() => setSelectedTool('pointer')}
              className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                selectedTool === 'pointer'
                  ? 'bg-amber-500 text-neutral-950 shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Pointer Tool (Select & Drag)"
            >
              <Move className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setSelectedTool('scissors')}
              className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                selectedTool === 'scissors'
                  ? 'bg-rose-500 text-white shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Scissors Tool (Slice Clip)"
            >
              <Scissors className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleSliceAtPlayhead}
            disabled={!selectedRegionId}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 border transition ${
              selectedRegionId
                ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400 shadow'
                : 'bg-neutral-900 text-neutral-600 border-neutral-800 cursor-not-allowed'
            }`}
            title="Slice selected clip at current Playhead position"
          >
            <Split className="w-3.5 h-3.5" />
            <span>SLICE AT PLAYHEAD</span>
          </button>

          {/* Zoom Sliders */}
          <div className="flex items-center gap-1 bg-neutral-900 px-2 py-1 rounded-xl border border-neutral-800 text-[10px] text-neutral-400">
            <ZoomOut className="w-3 h-3" />
            <input
              type="range"
              min="0.6"
              max="2.5"
              step="0.1"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(Number(e.target.value))}
              className="w-16 accent-amber-500 cursor-pointer"
            />
            <ZoomIn className="w-3 h-3" />
            <span className="text-amber-400 font-bold">{Math.round(zoomLevel * 100)}%</span>
          </div>

          {/* Transport Play */}
          <button
            onClick={handleTogglePlay}
            className={`px-4 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 shadow transition ${
              isPlaying
                ? 'bg-amber-500 text-neutral-950 animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlaying ? 'PAUSE' : 'PLAY TIMELINE'}</span>
          </button>

          <button
            onClick={() => handleAddTrack('audio')}
            className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-amber-500/30 text-xs font-black flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ADD TRACK</span>
          </button>

          {/* DETACH WINDOW BUTTON */}
          {onDetach && (
            <button
              onClick={onDetach}
              className="px-3 py-1.5 rounded-xl bg-amber-500 text-neutral-950 hover:bg-amber-400 transition font-black text-xs flex items-center gap-1.5 shadow border border-amber-300"
              title="Detach Waveform Section into Floating Window"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>DETACH SECTION</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Track Headers + Horizontal Wave Timeline Viewport */}
      <div className="flex border-2 border-stone-800 rounded-2xl overflow-hidden bg-neutral-900 shadow-inner">
        {/* Track Headers Column */}
        <div className="w-56 shrink-0 bg-neutral-950 border-r-2 border-stone-800 space-y-1 p-2">
          <div className="h-7 border-b border-neutral-800 flex items-center justify-between px-2 text-[10px] font-bold text-neutral-500 uppercase">
            <span>TRACK CONTROLS</span>
            <span>VOL / PAN</span>
          </div>

          {activeTracks.map((tr) => (
            <div
              key={tr.id}
              style={{ height: `${64 * verticalZoom}px` }}
              className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: tr.color }}
                  />
                  <span className="text-xs font-black text-stone-200 truncate">{tr.name}</span>
                </div>
                <span className="text-[9px] font-mono text-neutral-500 uppercase">{tr.type}</span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1 text-[9px] font-bold">
                  <button
                    onClick={() => {
                      const updated = activeTracks.map((t) =>
                        t.id === tr.id ? { ...t, isMuted: !t.isMuted } : t
                      );
                      updateTracksState(updated);
                    }}
                    className={`px-1.5 py-0.5 rounded border ${
                      tr.isMuted
                        ? 'bg-rose-950 text-rose-400 border-rose-800'
                        : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                    }`}
                  >
                    M
                  </button>
                  <button
                    onClick={() => {
                      const updated = activeTracks.map((t) =>
                        t.id === tr.id ? { ...t, isSolo: !t.isSolo } : t
                      );
                      updateTracksState(updated);
                    }}
                    className={`px-1.5 py-0.5 rounded border ${
                      tr.isSolo
                        ? 'bg-amber-500 text-neutral-950 font-black border-amber-400'
                        : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                    }`}
                  >
                    S
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <Volume2 className="w-3 h-3 text-neutral-500" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={tr.volume}
                    onChange={(e) => {
                      const updated = activeTracks.map((t) =>
                        t.id === tr.id ? { ...t, volume: Number(e.target.value) } : t
                      );
                      updateTracksState(updated);
                    }}
                    className="w-14 accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Horizontal Scrolling Timeline Area */}
        <div className="flex-1 overflow-x-auto relative scrollbar-thin scrollbar-thumb-stone-800">
          {/* Timeline Bar Ruler */}
          <div className="h-7 bg-neutral-950 border-b border-stone-800 flex items-center relative text-[10px] font-bold text-neutral-500">
            {Array.from({ length: totalBars }).map((_, i) => (
              <div
                key={i}
                style={{ width: `${pixelsPerBar}px` }}
                className="shrink-0 border-r border-neutral-800 px-1 flex items-center justify-between"
              >
                <span className="text-amber-400">{i + 1}</span>
                <span className="text-neutral-700 text-[8px]">. . .</span>
              </div>
            ))}

            {/* Scrubbing Playhead Handle Line */}
            <div
              style={{ left: `${playheadPosPercent}%` }}
              className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-30 pointer-events-none shadow-lg shadow-rose-500/80"
            >
              <div className="w-3 h-3 bg-rose-500 rounded-b transform -translate-x-1.2 flex items-center justify-center text-[7px] font-black text-white">
                ▼
              </div>
            </div>
          </div>

          {/* Tracks Horizontal Clips Grid */}
          <div className="space-y-1 p-0 relative min-w-max">
            {activeTracks.map((tr) => (
              <div
                key={tr.id}
                style={{
                  height: `${64 * verticalZoom}px`,
                  width: `${totalBars * pixelsPerBar}px`,
                }}
                className="bg-neutral-900/40 border-b border-neutral-800/80 relative flex items-center"
              >
                {/* Background Grid Lines */}
                {Array.from({ length: totalBars }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      left: `${i * pixelsPerBar}px`,
                      width: `${pixelsPerBar}px`,
                    }}
                    className="absolute top-0 bottom-0 border-r border-neutral-800/40 pointer-events-none"
                  />
                ))}

                {/* Audio / MIDI Region Clips */}
                {tr.regions.map((reg) => {
                  const leftPx = (reg.startBar - 1) * pixelsPerBar;
                  const widthPx = reg.durationBars * pixelsPerBar;
                  const isSelected = selectedRegionId === reg.id;

                  return (
                    <div
                      key={reg.id}
                      onClick={() => setSelectedRegionId(reg.id)}
                      onDoubleClick={() => handleRegionDoubleClick(reg, tr)}
                      style={{
                        left: `${leftPx}px`,
                        width: `${widthPx}px`,
                        height: '82%',
                        backgroundColor: `${tr.color}25`,
                        borderColor: isSelected ? '#f59e0b' : tr.color,
                      }}
                      className={`absolute top-1 rounded-xl border-2 p-1.5 flex flex-col justify-between cursor-pointer transition shadow hover:brightness-125 select-none overflow-hidden ${
                        isSelected ? 'ring-2 ring-amber-400 shadow-amber-500/30 z-20' : 'z-10'
                      }`}
                      title="Double-click to open AudioClipEditor waveform modal"
                    >
                      <div className="flex items-center justify-between text-[10px] font-black truncate">
                        <span className="truncate text-white drop-shadow">{reg.title}</span>
                        <span className="text-[8px] font-mono opacity-80 uppercase px-1 rounded bg-black/40">
                          {reg.durationBars}B
                        </span>
                      </div>

                      {/* Mini Waveform Visualization */}
                      <div className="h-5 flex items-center gap-0.5 overflow-hidden opacity-90">
                        {Array.from({ length: 24 }).map((_, idx) => (
                          <div
                            key={idx}
                            style={{
                              height: `${
                                Math.abs(Math.sin(idx * 0.4 + reg.waveSeed)) * 80 + 20
                              }%`,
                              backgroundColor: tr.color,
                            }}
                            className="w-1 rounded-full shrink-0"
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DETACHABLE SPLIT BOTTOM SECTION: SONG & TRACK SAMPLE/FLEX PITCH EDITOR */}
      <div className="border-2 border-stone-800 rounded-2xl bg-neutral-900 overflow-hidden shadow-2xl">
        {/* Inspector Header & Tab Selector */}
        <div className="bg-neutral-950 px-4 py-2 border-b border-stone-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              SONG & TRACK EDITOR INSPECTOR
            </span>

            <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800 text-xs">
              <button
                onClick={() => setActiveBottomTab('sample')}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  activeBottomTab === 'sample'
                    ? 'bg-amber-500 text-neutral-950 shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Sample Waveform
              </button>
              <button
                onClick={() => setActiveBottomTab('flex_pitch')}
                className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                  activeBottomTab === 'flex_pitch'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-purple-300" />
                <span>Flex Pitch & Tuning</span>
              </button>
              <button
                onClick={() => setActiveBottomTab('process')}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  activeBottomTab === 'process'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Audio Process & Bounce
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-neutral-500 font-mono hidden sm:inline">
              Format: <strong className="text-emerald-400">44.100 kHz • 24-Bit PCM</strong>
            </span>
            <button
              onClick={() => setIsInspectorExpanded(!isInspectorExpanded)}
              className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] font-bold px-2"
            >
              {isInspectorExpanded ? 'Collapse ▲' : 'Expand ▼'}
            </button>
          </div>
        </div>

        {/* Inspector Content Body */}
        {isInspectorExpanded && (
          <div className="p-4 bg-neutral-950/90 text-xs font-mono space-y-3">
            {activeBottomTab === 'sample' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
                {/* Waveform Canvas View */}
                <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-[10px] text-neutral-400 font-bold">
                    <span>SELECTED CLIP WAVEFORM VIEW</span>
                    <span className="text-amber-400">
                      {selectedRegionId ? `Clip: ${selectedRegionId}` : 'No clip selected'}
                    </span>
                  </div>
                  <div className="h-24 bg-neutral-950 border border-neutral-800 rounded-lg p-2 flex items-center justify-center relative overflow-hidden">
                    {/* Simulated High Res Waveform Display */}
                    <div className="w-full h-full flex items-center justify-between gap-0.5">
                      {Array.from({ length: 64 }).map((_, idx) => (
                        <div
                          key={idx}
                          style={{
                            height: `${Math.abs(Math.sin(idx * 0.25)) * 85 + 10}%`,
                          }}
                          className="w-1 bg-amber-400/90 rounded-full"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Clip Controls & Info */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 space-y-3">
                  <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest border-b border-neutral-800 pb-1">
                    Clip Parameters & Handles
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Gain (dB):</span>
                      <input
                        type="range"
                        min="-12"
                        max="12"
                        defaultValue="0"
                        className="w-28 accent-amber-500 cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Pitch Transpose:</span>
                      <input
                        type="range"
                        min="-12"
                        max="12"
                        defaultValue="0"
                        className="w-28 accent-purple-500 cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-neutral-800 text-[10px]">
                      <span className="text-neutral-400">Event Start / End:</span>
                      <span className="text-emerald-400 font-bold">1.1.1.00 / 5.1.1.00</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeBottomTab === 'flex_pitch' && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <span className="text-xs font-black text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-purple-400" />
                    Logic/Cubase Flex Pitch Note Contour & Correction
                  </span>
                  <span className="text-[10px] text-neutral-400">Scale: C Minor Auto-Tune</span>
                </div>

                {/* Pitch Grid Visualizer */}
                <div className="h-28 bg-neutral-950 border border-neutral-800 rounded-lg p-2 flex items-center relative overflow-hidden">
                  <div className="w-12 bg-neutral-900 border-r border-neutral-800 h-full flex flex-col justify-between text-[8px] font-bold text-neutral-500 pr-1 text-right">
                    <span>C4</span>
                    <span>A3</span>
                    <span>F3</span>
                    <span>D3</span>
                    <span>C3</span>
                  </div>
                  <div className="flex-1 h-full relative p-2 flex items-center justify-around">
                    {[
                      { note: 'C3', width: '20%', top: '70%', col: '#a855f7' },
                      { note: 'D3', width: '15%', top: '55%', col: '#a855f7' },
                      { note: 'F3', width: '25%', top: '35%', col: '#c084fc' },
                      { note: 'G3', width: '20%', top: '20%', col: '#a855f7' },
                    ].map((p, i) => (
                      <div
                        key={i}
                        style={{ width: p.width, top: p.top, backgroundColor: p.col }}
                        className="absolute h-5 rounded-md shadow-lg border border-purple-300 flex items-center justify-center text-[9px] font-black text-white"
                      >
                        {p.note}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeBottomTab === 'process' && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 space-y-2">
                <div className="text-xs font-bold text-amber-400 mb-1">
                  Audio Processing & Stem Bouncing Actions
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg border border-neutral-700 font-bold">
                    Normalize Audio (-0.1 dB)
                  </button>
                  <button className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg border border-neutral-700 font-bold">
                    Reverse Sample Wave
                  </button>
                  <button className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-lg font-black shadow">
                    Slice to MPC Drum Pads
                  </button>
                  <button className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-black shadow">
                    Bounce Track Stem WAV
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating AudioClipEditor Modal */}
      {editingRegion && (
        <AudioClipEditor
          region={editingRegion.region}
          trackName={editingRegion.trackName}
          trackColor={editingRegion.trackColor}
          onUpdateRegion={handleUpdateRegion}
          onSliceRegion={handleSliceRegion}
          onDeleteRegion={handleDeleteRegion}
          onDuplicateRegion={handleDuplicateRegion}
          onClose={() => setEditingRegion(null)}
        />
      )}
    </div>
  );
};
