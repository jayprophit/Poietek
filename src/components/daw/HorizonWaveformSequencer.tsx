import React, { useState, useRef, useEffect } from 'react';
import {
  Scissors,
  ZoomIn,
  ZoomOut,
  Play,
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
  Disc
} from 'lucide-react';
import { audioEngine } from '../../audio/engine';

interface Track {
  id: string;
  name: string;
  type: 'audio' | 'instrument';
  color: string;
  isMuted: boolean;
  isSolo: boolean;
  isArmed: boolean;
  volume: number;
  pan: number;
  regions: {
    id: string;
    startBar: number;
    durationBars: number;
    title: string;
    waveSeed: number;
  }[];
}

export const HorizonWaveformSequencer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [playheadPos, setPlayheadPos] = useState<number>(0); // 0 to 100%
  const [selectedTool, setSelectedTool] = useState<'pointer' | 'scissors' | 'pencil'>('pointer');

  const [tracks, setTracks] = useState<Track[]>([
    {
      id: 'tr_1',
      name: 'Vocal Lead Stem (Pitch Tuned)',
      type: 'audio',
      color: '#ec4899',
      isMuted: false,
      isSolo: false,
      isArmed: true,
      volume: 85,
      pan: 0,
      regions: [
        { id: 'reg_1', startBar: 1, durationBars: 4, title: 'Chorus Hook Vox.wav', waveSeed: 1 },
        { id: 'reg_2', startBar: 6, durationBars: 4, title: 'Chorus Adlibs.wav', waveSeed: 2 },
      ],
    },
    {
      id: 'tr_2',
      name: 'Analog Subtractive Synth Bass',
      type: 'instrument',
      color: '#8b5cf6',
      isMuted: false,
      isSolo: false,
      isArmed: false,
      volume: 90,
      pan: -10,
      regions: [
        { id: 'reg_3', startBar: 1, durationBars: 8, title: 'Acid Bassline.mid', waveSeed: 3 },
      ],
    },
    {
      id: 'tr_3',
      name: 'Canvas Drum Master Bus',
      type: 'audio',
      color: '#f59e0b',
      isMuted: false,
      isSolo: false,
      isArmed: false,
      volume: 95,
      pan: 0,
      regions: [
        { id: 'reg_4', startBar: 1, durationBars: 8, title: '90s Boom Bap Loop.wav', waveSeed: 4 },
      ],
    },
    {
      id: 'tr_4',
      name: 'Acoustic Guitar Strum',
      type: 'audio',
      color: '#10b981',
      isMuted: false,
      isSolo: false,
      isArmed: false,
      volume: 75,
      pan: 15,
      regions: [
        { id: 'reg_5', startBar: 3, durationBars: 4, title: 'Acoustic Verse.wav', waveSeed: 5 },
      ],
    },
  ]);

  // Playhead animation timer
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlayheadPos((prev) => (prev >= 100 ? 0 : prev + 0.5));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const togglePlay = () => {
    audioEngine.initAudio();
    setIsPlaying(!isPlaying);
  };

  const addTrack = () => {
    const newTr: Track = {
      id: `tr_${Date.now()}`,
      name: `Audio Track ${tracks.length + 1}`,
      type: 'audio',
      color: '#3b82f6',
      isMuted: false,
      isSolo: false,
      isArmed: false,
      volume: 80,
      pan: 0,
      regions: [
        { id: `reg_${Date.now()}`, startBar: 2, durationBars: 4, title: 'Recorded Audio Take', waveSeed: Date.now() },
      ],
    };
    setTracks((prev) => [...prev, newTr]);
  };

  const drawWaveformCanvas = (canvas: HTMLCanvasElement | null, color: string, seed: number) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = color + '22'; // 22 transparency
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    const midY = h / 2;
    const bars = 60;
    const barW = w / bars;

    for (let i = 0; i < bars; i++) {
      const amp = Math.abs(Math.sin(i * 0.3 + seed) * Math.cos(i * 0.7 + seed)) * (h / 2 - 4);
      const x = i * barW;
      ctx.moveTo(x, midY - amp);
      ctx.lineTo(x, midY + amp);
    }
    ctx.stroke();
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4 font-mono select-none">
      {/* Top Sequencer Transport & Tools Bar */}
      <div className="bg-gradient-to-r from-neutral-900 via-stone-900 to-neutral-900 border-2 border-neutral-700 rounded-2xl p-4 shadow-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center text-indigo-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
              MULTI-TRACK WAVEFORM SEQUENCER TIMELINE
            </h2>
            <p className="text-xs text-neutral-400">
              Multi-track audio waveform arrangement, region cutting, zoom & live playhead tracking.
            </p>
          </div>
        </div>

        {/* Toolbar Tools */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedTool('pointer')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
              selectedTool === 'pointer' ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-neutral-800 text-neutral-400 border-neutral-700'
            }`}
          >
            Pointer (Select)
          </button>
          <button
            onClick={() => setSelectedTool('scissors')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1 ${
              selectedTool === 'scissors' ? 'bg-amber-500 text-neutral-950 border-amber-300' : 'bg-neutral-800 text-neutral-400 border-neutral-700'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Scissors (Split)</span>
          </button>

          <div className="h-6 w-px bg-neutral-700 mx-1" />

          <button
            onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.2))}
            className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl border border-neutral-700"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-neutral-400 font-bold">{Math.round(zoomLevel * 100)}%</span>
          <button
            onClick={() => setZoomLevel((z) => Math.min(2.0, z + 0.2))}
            className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl border border-neutral-700"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={addTrack}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            <span>Add Audio Track</span>
          </button>
        </div>
      </div>

      {/* Main Multi-Track Audio Canvas Timeline Layout */}
      <div className="bg-neutral-950 border-2 border-neutral-700 rounded-3xl p-4 shadow-2xl space-y-2 overflow-x-auto relative">
        {/* Timeline Ruler Header Bar */}
        <div className="flex items-center pl-64 border-b border-neutral-800 pb-2 relative h-8">
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              style={{ width: `${60 * zoomLevel}px` }}
              className="text-[11px] font-bold text-neutral-500 border-l border-neutral-800 pl-1 shrink-0"
            >
              BAR {i + 1}
            </div>
          ))}

          {/* Animated Scrubber / Playhead Vertical Line */}
          <div
            style={{ left: `calc(16rem + ${playheadPos}%)` }}
            className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-30 shadow-lg shadow-amber-400/50 pointer-events-none"
          >
            <div className="w-3 h-3 bg-amber-400 rotate-45 -translate-x-1.2 -translate-y-1" />
          </div>
        </div>

        {/* Tracks List */}
        <div className="space-y-3">
          {tracks.map((tr) => (
            <div key={tr.id} className="flex items-center gap-3 bg-neutral-900 border-2 border-neutral-800 rounded-2xl p-2 h-24 shadow-lg">
        {/* Left track control strip */}
              <div className="w-60 shrink-0 bg-neutral-950 p-3 rounded-xl border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white truncate max-w-[120px]">{tr.name}</span>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tr.color }} />
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() =>
                      setTracks((prev) =>
                        prev.map((t) => (t.id === tr.id ? { ...t, isMuted: !t.isMuted } : t))
                      )
                    }
                    className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                      tr.isMuted ? 'bg-rose-600 text-white border-rose-400' : 'bg-neutral-800 text-neutral-400 border-neutral-700'
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
                      tr.isSolo ? 'bg-amber-500 text-neutral-950 border-amber-300' : 'bg-neutral-800 text-neutral-400 border-neutral-700'
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
                      tr.isArmed ? 'bg-rose-500 text-white animate-pulse border-rose-300' : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                    }`}
                  >
                    REC
                  </button>
                </div>

                {/* Volume Slider */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={tr.volume}
                  onChange={(e) =>
                    setTracks((prev) =>
                      prev.map((t) => (t.id === tr.id ? { ...t, volume: Number(e.target.value) } : t))
                    )
                  }
                  className="w-full accent-indigo-500 cursor-pointer h-1.5"
                />
              </div>

              {/* Right Waveform Regions Timeline Area */}
              <div className="flex-1 h-full bg-neutral-950 rounded-xl border border-neutral-800/80 relative overflow-hidden flex items-center">
                {/* Background Grid Lines */}
                <div className="absolute inset-0 flex pointer-events-none">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div
                      key={i}
                      style={{ width: `${60 * zoomLevel}px` }}
                      className="border-r border-neutral-900/80 h-full shrink-0"
                    />
                  ))}
                </div>

                {/* Render Audio Regions */}
                {tr.regions.map((reg) => (
                  <div
                    key={reg.id}
                    style={{
                      left: `${(reg.startBar - 1) * 60 * zoomLevel}px`,
                      width: `${reg.durationBars * 60 * zoomLevel}px`,
                      borderColor: tr.color,
                    }}
                    className="absolute h-16 rounded-xl border-2 bg-neutral-900/90 shadow-xl overflow-hidden flex flex-col justify-between p-1.5 cursor-pointer hover:brightness-125 transition"
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold text-white z-10 px-1">
                      <span className="truncate">{reg.title}</span>
                      <span className="text-[8px] opacity-70">{reg.durationBars} BARS</span>
                    </div>

                    {/* Canvas Waveform Drawing */}
                    <canvas
                      ref={(el) => drawWaveformCanvas(el, tr.color, reg.waveSeed)}
                      width={reg.durationBars * 60 * zoomLevel}
                      height={40}
                      className="w-full h-10 object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
