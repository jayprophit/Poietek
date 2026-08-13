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
  Layers,
  Sparkles,
  Download,
  Plus,
  Trash2,
  Eye,
  Activity,
  Mic,
  Disc,
  Copy,
  Maximize2,
  RotateCcw,
  X,
  Music,
  Check,
  Split,
  Edit3,
  Move,
  VolumeX,
  RefreshCw,
  FastForward,
} from 'lucide-react';
import { audioEngine } from '../../audio/engine';
import { AudioClipEditor } from './AudioClipEditor';

export interface AudioRegion {
  id: string;
  startBar: number;
  durationBars: number;
  title: string;
  waveSeed: number;
  gainDb: number; // -24 to +12 dB
  pitchOffset: number; // semitones (-12 to +12)
  isReversed?: boolean;
  isMuted?: boolean;
  trimStartPercent: number; // 0 to 50%
  trimEndPercent: number; // 0 to 50%
  type: 'audio' | 'midi';
}

export interface SequencerTrack {
  id: string;
  name: string;
  type: 'audio' | 'instrument';
  color: string;
  isMuted: boolean;
  isSolo: boolean;
  isArmed: boolean;
  volume: number; // 0-100
  pan: number; // -50 to +50
  regions: AudioRegion[];
}

export const CubaseLogicWaveformSequencer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [verticalZoom, setVerticalZoom] = useState<number>(1.0);
  const [playheadPos, setPlayheadPos] = useState<number>(0); // 0 to 100%
  const [selectedTool, setSelectedTool] = useState<'pointer' | 'scissors' | 'trim'>('pointer');
  const [copiedRegion, setCopiedRegion] = useState<AudioRegion | null>(null);

  // Selected Clip for Detailed Inspection & Wave Editing
  const [activeRegion, setActiveRegion] = useState<{
    trackId: string;
    region: AudioRegion;
  } | null>(null);

  const [tracks, setTracks] = useState<SequencerTrack[]>([
    {
      id: 'tr_drums',
      name: '🥁 Drum Kit Master (Kick, Snare, Hats)',
      type: 'audio',
      color: '#f59e0b',
      isMuted: false,
      isSolo: false,
      isArmed: true,
      volume: 95,
      pan: 0,
      regions: [
        {
          id: 'reg_drums_1',
          startBar: 1,
          durationBars: 8,
          title: 'MPC 90s Boom Bap Drumkit.wav',
          waveSeed: 303,
          gainDb: +1,
          pitchOffset: 0,
          trimStartPercent: 0,
          trimEndPercent: 0,
          type: 'audio',
        },
      ],
    },
    {
      id: 'tr_melody',
      name: '🎹 Melody (Polytone Glass Rhodes Chords)',
      type: 'instrument',
      color: '#3b82f6',
      isMuted: false,
      isSolo: false,
      isArmed: false,
      volume: 85,
      pan: -10,
      regions: [
        {
          id: 'reg_melody_1',
          startBar: 1,
          durationBars: 8,
          title: 'Polytone Glass Rhodes Progression.mid',
          waveSeed: 404,
          gainDb: 0,
          pitchOffset: 0,
          trimStartPercent: 0,
          trimEndPercent: 0,
          type: 'midi',
        },
      ],
    },
    {
      id: 'tr_bass',
      name: '🎸 Bass (Subtractor Deep 808 Sub)',
      type: 'instrument',
      color: '#8b5cf6',
      isMuted: false,
      isSolo: false,
      isArmed: false,
      volume: 90,
      pan: 0,
      regions: [
        {
          id: 'reg_bass_1',
          startBar: 1,
          durationBars: 8,
          title: 'Subtractor Deep 808 Bassline.mid',
          waveSeed: 202,
          gainDb: 0,
          pitchOffset: 0,
          trimStartPercent: 0,
          trimEndPercent: 0,
          type: 'midi',
        },
      ],
    },
    {
      id: 'tr_lead',
      name: '⚡ Lead (Thor Polysonic Cyber Saw Lead)',
      type: 'instrument',
      color: '#a855f7',
      isMuted: false,
      isSolo: false,
      isArmed: false,
      volume: 82,
      pan: 15,
      regions: [
        {
          id: 'reg_lead_1',
          startBar: 3,
          durationBars: 6,
          title: 'Thor Polysonic Cyber Lead Riff.mid',
          waveSeed: 505,
          gainDb: +1,
          pitchOffset: 0,
          trimStartPercent: 0,
          trimEndPercent: 0,
          type: 'midi',
        },
      ],
    },
    {
      id: 'tr_vocals',
      name: '🎤 Vocals (Main Vocal Lead Stem & Adlibs)',
      type: 'audio',
      color: '#ec4899',
      isMuted: false,
      isSolo: false,
      isArmed: false,
      volume: 88,
      pan: 0,
      regions: [
        {
          id: 'reg_vox_1',
          startBar: 1,
          durationBars: 4,
          title: 'Chorus Main Vocal Lead.wav',
          waveSeed: 101,
          gainDb: 0,
          pitchOffset: 0,
          trimStartPercent: 0,
          trimEndPercent: 0,
          type: 'audio',
        },
        {
          id: 'reg_vox_2',
          startBar: 5,
          durationBars: 4,
          title: 'Chorus Vocal Harmony Adlib.wav',
          waveSeed: 102,
          gainDb: +2,
          pitchOffset: +2,
          trimStartPercent: 0,
          trimEndPercent: 0,
          type: 'audio',
        },
      ],
    },
    {
      id: 'tr_effects',
      name: '🌌 Effects (Scream 4 & RV7000 Reverb Riser)',
      type: 'audio',
      color: '#10b981',
      isMuted: false,
      isSolo: false,
      isArmed: false,
      volume: 75,
      pan: 25,
      regions: [
        {
          id: 'reg_fx_1',
          startBar: 4,
          durationBars: 2,
          title: 'Scream 4 Distortion Riser FX.wav',
          waveSeed: 606,
          gainDb: -2,
          pitchOffset: 0,
          trimStartPercent: 0,
          trimEndPercent: 0,
          type: 'audio',
        },
      ],
    },
    {
      id: 'tr_other',
      name: '🎚️ Other (SP-404 Lofi Shaker & Percussion)',
      type: 'audio',
      color: '#06b6d4',
      isMuted: false,
      isSolo: false,
      isArmed: false,
      volume: 78,
      pan: -20,
      regions: [
        {
          id: 'reg_other_1',
          startBar: 2,
          durationBars: 6,
          title: 'SP-404 Lofi Shaker & Vinyl Crackle.wav',
          waveSeed: 707,
          gainDb: -1,
          pitchOffset: 0,
          trimStartPercent: 0,
          trimEndPercent: 0,
          type: 'audio',
        },
      ],
    },
  ]);

  // Playhead animation loop
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlayheadPos((prev) => (prev >= 100 ? 0 : prev + 0.4));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const togglePlay = () => {
    audioEngine.initAudio();
    setIsPlaying(!isPlaying);
  };

  const addTrack = (type: 'audio' | 'instrument' = 'audio') => {
    const newTr: SequencerTrack = {
      id: `tr_${Date.now()}`,
      name: type === 'audio' ? `Audio Track ${tracks.length + 1}` : `MIDI Synth Track ${tracks.length + 1}`,
      type,
      color: type === 'audio' ? '#3b82f6' : '#a855f7',
      isMuted: false,
      isSolo: false,
      isArmed: false,
      volume: 80,
      pan: 0,
      regions: [
        {
          id: `reg_${Date.now()}`,
          startBar: 2,
          durationBars: 4,
          title: type === 'audio' ? 'New Recorded Audio Take.wav' : 'New MIDI Pattern.mid',
          waveSeed: Date.now(),
          gainDb: 0,
          pitchOffset: 0,
          trimStartPercent: 0,
          trimEndPercent: 0,
          type: type === 'audio' ? 'audio' : 'midi',
        },
      ],
    };
    setTracks((prev) => [...prev, newTr]);
  };

  // Double-click clip handler to launch detailed waveform inspector
  const handleDoubleClickRegion = (trackId: string, region: AudioRegion) => {
    setActiveRegion({ trackId, region: { ...region } });
  };

  // Update active region values in tracks state
  const handleUpdateActiveRegion = (updated: AudioRegion) => {
    if (!activeRegion) return;
    setTracks((prev) =>
      prev.map((tr) => {
        if (tr.id !== activeRegion.trackId) return tr;
        return {
          ...tr,
          regions: tr.regions.map((r) => (r.id === updated.id ? updated : r)),
        };
      })
    );
    setActiveRegion({ trackId: activeRegion.trackId, region: updated });
  };

  // Split region in two parts
  const handleSplitRegion = (trackId: string, regionId: string) => {
    setTracks((prev) =>
      prev.map((tr) => {
        if (tr.id !== trackId) return tr;
        const target = tr.regions.find((r) => r.id === regionId);
        if (!target || target.durationBars <= 1) return tr;

        const half = Math.floor(target.durationBars / 2) || 1;
        const part1: AudioRegion = { ...target, durationBars: half, title: `${target.title} (Part 1)` };
        const part2: AudioRegion = {
          ...target,
          id: `reg_${Date.now()}`,
          startBar: target.startBar + half,
          durationBars: target.durationBars - half,
          title: `${target.title} (Part 2)`,
        };

        return {
          ...tr,
          regions: [...tr.regions.filter((r) => r.id !== regionId), part1, part2],
        };
      })
    );
    if (activeRegion?.region.id === regionId) {
      setActiveRegion(null);
    }
  };

  // Delete Region
  const handleDeleteRegion = (trackId: string, regionId: string) => {
    setTracks((prev) =>
      prev.map((tr) => {
        if (tr.id !== trackId) return tr;
        return {
          ...tr,
          regions: tr.regions.filter((r) => r.id !== regionId),
        };
      })
    );
    if (activeRegion?.region.id === regionId) {
      setActiveRegion(null);
    }
  };

  // Copy Region
  const handleCopyRegion = (region: AudioRegion) => {
    setCopiedRegion({ ...region });
  };

  // Paste Region to track
  const handlePasteRegion = (trackId: string) => {
    if (!copiedRegion) return;
    const newReg: AudioRegion = {
      ...copiedRegion,
      id: `reg_paste_${Date.now()}`,
      startBar: 1 + Math.floor(Math.random() * 8),
      title: `${copiedRegion.title} (Copy)`,
    };
    setTracks((prev) =>
      prev.map((tr) => (tr.id === trackId ? { ...tr, regions: [...tr.regions, newReg] } : tr))
    );
  };

  // Draw Audio / MIDI Waveform Canvas
  const drawWaveformCanvas = (
    canvas: HTMLCanvasElement | null,
    color: string,
    seed: number,
    isMuted?: boolean,
    isReversed?: boolean,
    isMidi?: boolean
  ) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background block fill
    ctx.fillStyle = isMuted ? '#262626' : color + '22';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = isMuted ? '#525252' : color;
    ctx.lineWidth = 1.5;

    if (isMidi) {
      // Draw MIDI Note Blocks
      ctx.fillStyle = color;
      const numNotes = 12;
      const noteW = w / numNotes;
      for (let i = 0; i < numNotes; i++) {
        const yPos = Math.abs(Math.sin(i * 1.5 + seed)) * (h - 12);
        const noteH = 6;
        ctx.fillRect(i * noteW + 2, yPos, noteW - 4, noteH);
      }
    } else {
      // Draw Audio Waveform Lines
      ctx.beginPath();
      const midY = h / 2;
      const bars = Math.floor(w / 4);
      const barW = w / bars;

      for (let i = 0; i < bars; i++) {
        const idx = isReversed ? bars - 1 - i : i;
        const amp =
          Math.abs(Math.sin(idx * 0.35 + seed) * Math.cos(idx * 0.8 + seed)) * (h / 2 - 4);
        const x = i * barW;
        ctx.moveTo(x, midY - amp);
        ctx.lineTo(x, midY + amp);
      }
      ctx.stroke();
    }
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4 font-mono select-none">
      {/* Top Sequencer Header & Tool Toolbar Bar */}
      <div className="bg-gradient-to-r from-neutral-900 via-stone-900 to-neutral-900 border-2 border-neutral-700 rounded-2xl p-4 shadow-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
              SONG WAVE & MIDI SCORING ARRANGEMENT VIEW
            </h2>
            <p className="text-[11px] text-neutral-400">
              Multi-track timeline • Double-click wave regions to launch Clip Waveform Inspector
            </p>
          </div>
        </div>

        {/* Transport Controls & Tools */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={togglePlay}
            className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition shadow ${
              isPlaying
                ? 'bg-amber-500 text-neutral-950 border border-amber-300'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isPlaying ? 'PAUSE' : 'PLAY SONG'}</span>
          </button>

          <button
            onClick={() => setPlayheadPos(0)}
            className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl border border-neutral-700"
            title="Return Playhead to Start"
          >
            <Square className="w-4 h-4" />
          </button>

          <div className="h-6 w-px bg-neutral-700 mx-1" />

          {/* Edit Tools */}
          <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
            <button
              onClick={() => setSelectedTool('pointer')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                selectedTool === 'pointer'
                  ? 'bg-amber-500 text-neutral-950 font-black'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Pointer
            </button>
            <button
              onClick={() => setSelectedTool('scissors')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                selectedTool === 'scissors'
                  ? 'bg-amber-500 text-neutral-950 font-black'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Split</span>
            </button>
          </div>

          <div className="h-6 w-px bg-neutral-700 mx-1" />

          {/* Zoom Sliders */}
          <div className="flex items-center gap-2 bg-neutral-950 px-3 py-1 rounded-xl border border-neutral-800 text-[10px]">
            <span className="text-neutral-400 font-bold">ZOOM:</span>
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.2))}
              className="p-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="font-mono text-amber-400 font-bold w-10 text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
              className="p-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={() => addTrack('audio')}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs rounded-xl shadow flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            <span>Add Audio Track</span>
          </button>
          <button
            onClick={() => addTrack('instrument')}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl shadow flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            <span>Add MIDI Track</span>
          </button>
        </div>
      </div>

      {/* Main Multi-Track Waveform Song Timeline Container */}
      <div className="bg-neutral-950 border-2 border-neutral-800 rounded-3xl p-2 sm:p-4 shadow-2xl space-y-2 overflow-auto max-w-full max-h-[600px] relative scrollbar-thin scrollbar-thumb-stone-700 touch-pan-x touch-pan-y">
        <div className="min-w-max space-y-2">
          {/* Timeline Ruler Header Bar */}
          <div className="flex items-center sticky top-0 z-20 bg-neutral-950/95 backdrop-blur-md border-b-2 border-neutral-800 pb-2 pt-1">
            {/* Sticky Top-Left Corner Box matching Track Header Column */}
            <div className="w-60 shrink-0 sticky left-0 z-30 bg-neutral-950 px-3 py-1 text-[10px] font-black text-amber-400 uppercase tracking-wider flex items-center justify-between border-r border-neutral-800">
              <span>TRACKS ({tracks.length})</span>
              <span>16 BARS</span>
            </div>

            {/* Timeline Bar Ticks */}
            <div className="flex items-center pl-2">
              {Array.from({ length: 16 }).map((_, i) => (
                <div
                  key={i}
                  style={{ width: `${65 * zoomLevel}px` }}
                  className="text-[10px] font-bold text-neutral-400 border-l border-neutral-800 pl-1.5 shrink-0 flex items-center justify-between"
                >
                  <span className="text-amber-400 font-mono">BAR {i + 1}</span>
                  <span className="text-[8px] text-neutral-600 font-mono">. .</span>
                </div>
              ))}
            </div>

            {/* Animated Scrubber / Playhead Vertical Line */}
            <div
              style={{ left: `calc(15rem + ${playheadPos}%)` }}
              className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-30 shadow-lg shadow-amber-400/50 pointer-events-none"
            >
              <div className="w-3.5 h-3.5 bg-amber-400 rotate-45 -translate-x-1.5 -translate-y-1 shadow-md" />
            </div>
          </div>

          {/* Tracks List */}
          <div className="space-y-3">
            {tracks.map((tr) => (
              <div
                key={tr.id}
                className="flex items-center bg-neutral-900/90 border-2 border-neutral-800 rounded-2xl p-1.5 shadow-lg relative min-w-max"
                style={{ height: `${84 * verticalZoom}px` }}
              >
                {/* Sticky Left Track Control Header Box */}
                <div className="w-60 shrink-0 sticky left-0 z-20 bg-neutral-950 p-2 rounded-xl border border-neutral-800 flex flex-col justify-between h-full shadow-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 truncate">
                      <div
                        className="w-3 h-3 rounded-full shrink-0 shadow"
                        style={{ backgroundColor: tr.color }}
                      />
                      <span className="text-xs font-black text-neutral-100 truncate max-w-[120px]" title={tr.name}>
                        {tr.name}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-neutral-500 uppercase shrink-0">
                      {tr.type}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-1 pt-1">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          setTracks((prev) =>
                            prev.map((t) => (t.id === tr.id ? { ...t, isMuted: !t.isMuted } : t))
                          )
                        }
                        className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                          tr.isMuted
                            ? 'bg-rose-600 text-white border-rose-400'
                            : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-white'
                        }`}
                      >
                        M
                      </button>
                      <button
                        onClick={() =>
                          setTracks((prev) =>
                            prev.map((t) => (t.id === tr.id ? { ...t, isSolo: !t.isSolo } : t))
                          )
                        }
                        className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                          tr.isSolo
                            ? 'bg-amber-500 text-neutral-950 border-amber-300'
                            : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-white'
                        }`}
                      >
                        S
                      </button>
                      <button
                        onClick={() =>
                          setTracks((prev) =>
                            prev.map((t) => (t.id === tr.id ? { ...t, isArmed: !t.isArmed } : t))
                          )
                        }
                        className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                          tr.isArmed
                            ? 'bg-rose-500 text-white animate-pulse border-rose-300'
                            : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-white'
                        }`}
                      >
                        REC
                      </button>
                    </div>

                    {copiedRegion && (
                      <button
                        onClick={() => handlePasteRegion(tr.id)}
                        className="p-1 rounded bg-stone-800 hover:bg-amber-500 hover:text-neutral-950 text-amber-400 text-[9px] font-bold border border-amber-500/30"
                        title="Paste Copied Clip Here"
                      >
                        PASTE
                      </button>
                    )}
                  </div>

                  {/* Track Vol & Pan Sliders */}
                  <div className="flex items-center gap-2 pt-1 text-[9px]">
                    <span className="text-neutral-500 font-bold">VOL</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={tr.volume}
                      onChange={(e) =>
                        setTracks((prev) =>
                          prev.map((t) =>
                            t.id === tr.id ? { ...t, volume: Number(e.target.value) } : t
                          )
                        )
                      }
                      className="w-full accent-amber-500 cursor-pointer h-1.5 bg-neutral-800 rounded"
                    />
                    <span className="font-mono text-neutral-400 font-bold">{tr.volume}</span>
                  </div>
                </div>

                {/* Right Timeline Grid & Waveform Clips */}
                <div className="flex-1 h-full bg-neutral-950 rounded-xl border border-neutral-800/80 relative overflow-hidden flex items-center ml-2 min-w-[1040px]">
                  {/* Background Grid Lines */}
                  <div className="absolute inset-0 flex pointer-events-none">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div
                        key={i}
                        style={{ width: `${65 * zoomLevel}px` }}
                        className="border-r border-neutral-900/80 h-full shrink-0"
                      />
                    ))}
                  </div>

                  {/* Render Audio / MIDI Regions */}
                  {tr.regions.map((reg) => {
                    const isSelected = activeRegion?.region.id === reg.id;
                    return (
                      <div
                        key={reg.id}
                        onClick={() => {
                          if (selectedTool === 'scissors') {
                            handleSplitRegion(tr.id, reg.id);
                          } else {
                            setActiveRegion({ trackId: tr.id, region: { ...reg } });
                          }
                        }}
                        onDoubleClick={() => handleDoubleClickRegion(tr.id, reg)}
                        style={{
                          left: `${(reg.startBar - 1) * 65 * zoomLevel}px`,
                          width: `${reg.durationBars * 65 * zoomLevel}px`,
                          borderColor: isSelected ? '#f59e0b' : tr.color,
                        }}
                        className={`absolute h-14 rounded-xl border-2 bg-neutral-900/90 shadow-xl overflow-hidden flex flex-col justify-between p-1.5 cursor-pointer transition ${
                          isSelected ? 'ring-2 ring-amber-400/80 brightness-125 z-10' : 'hover:brightness-110'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold text-white z-10 px-1">
                          <span className="truncate max-w-[140px] flex items-center gap-1">
                            {reg.isMuted && <VolumeX className="w-3 h-3 text-rose-400 shrink-0" />}
                            {reg.title}
                          </span>
                          <div className="flex items-center gap-1 text-[8px] font-mono text-neutral-400">
                            {reg.gainDb !== 0 && (
                              <span className="px-1 bg-neutral-800 rounded text-amber-300">
                                {reg.gainDb > 0 ? `+${reg.gainDb}` : reg.gainDb}dB
                              </span>
                            )}
                            {reg.pitchOffset !== 0 && (
                              <span className="px-1 bg-neutral-800 rounded text-purple-300">
                                {reg.pitchOffset > 0 ? `+${reg.pitchOffset}` : reg.pitchOffset}st
                              </span>
                            )}
                            <span>{reg.durationBars}B</span>
                          </div>
                        </div>

                        {/* Canvas Waveform Drawing */}
                        <canvas
                          ref={(el) =>
                            drawWaveformCanvas(
                              el,
                              tr.color,
                              reg.waveSeed,
                              reg.isMuted,
                              reg.isReversed,
                              reg.type === 'midi'
                            )
                          }
                          width={reg.durationBars * 65 * zoomLevel}
                          height={32}
                          className="w-full h-8 object-cover rounded"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DETAILED AUDIO WAVEFORM CLIP INSPECTOR MODAL */}
      {activeRegion && (
        <AudioClipEditor
          region={activeRegion.region}
          trackName={tracks.find((t) => t.id === activeRegion.trackId)?.name}
          trackColor={tracks.find((t) => t.id === activeRegion.trackId)?.color}
          onUpdateRegion={handleUpdateActiveRegion}
          onSliceRegion={(regId, pct) => handleSplitRegion(activeRegion.trackId, regId)}
          onDeleteRegion={(regId) => handleDeleteRegion(activeRegion.trackId, regId)}
          onDuplicateRegion={(reg) => handleCopyRegion(reg)}
          onClose={() => setActiveRegion(null)}
        />
      )}
    </div>
  );
};
