import React, { useState, useRef, useEffect } from 'react';
import {
  Scissors,
  Trash2,
  X,
  Volume2,
  Music,
  RotateCcw,
  Copy,
  Download,
  Play,
  Pause,
  Sparkles,
  Sliders,
  Check,
  Split,
  Layers,
  Activity,
  Zap,
} from 'lucide-react';
import { AudioRegion } from '../../types';
import { audioEngine } from '../../audio/engine';

interface AudioClipEditorProps {
  region: AudioRegion;
  trackName?: string;
  trackColor?: string;
  onUpdateRegion: (updatedRegion: AudioRegion) => void;
  onSliceRegion?: (regionId: string, slicePercent: number) => void;
  onDeleteRegion?: (regionId: string) => void;
  onDuplicateRegion?: (region: AudioRegion) => void;
  onClose: () => void;
}

export const AudioClipEditor: React.FC<AudioClipEditorProps> = ({
  region,
  trackName = 'Audio Track',
  trackColor = '#3b82f6',
  onUpdateRegion,
  onSliceRegion,
  onDeleteRegion,
  onDuplicateRegion,
  onClose,
}) => {
  const [title, setTitle] = useState<string>(region.title);
  const [gainDb, setGainDb] = useState<number>(region.gainDb || 0);
  const [pitchOffset, setPitchOffset] = useState<number>(region.pitchOffset || 0);
  const [isReversed, setIsReversed] = useState<boolean>(!!region.isReversed);
  const [isMuted, setIsMuted] = useState<boolean>(!!region.isMuted);
  const [trimStart, setTrimStart] = useState<number>(region.trimStartPercent || 0);
  const [trimEnd, setTrimEnd] = useState<number>(region.trimEndPercent || 0);
  const [slicePositionPercent, setSlicePositionPercent] = useState<number>(50);
  const [isPlayingAudition, setIsPlayingAudition] = useState<boolean>(false);
  const [normalized, setNormalized] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Sync internal state when region prop updates
  useEffect(() => {
    setTitle(region.title);
    setGainDb(region.gainDb || 0);
    setPitchOffset(region.pitchOffset || 0);
    setIsReversed(!!region.isReversed);
    setIsMuted(!!region.isMuted);
    setTrimStart(region.trimStartPercent || 0);
    setTrimEnd(region.trimEndPercent || 0);
  }, [region]);

  // Render high-res waveform with start/end markers and slice line
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Dark canvas background grid
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = '#262626';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    // Center axis
    ctx.strokeStyle = '#404040';
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Waveform rendering from waveSeed
    const numBars = 120;
    const barWidth = width / numBars;
    const seed = region.waveSeed || 42;
    const gainFactor = Math.pow(10, gainDb / 20) * (normalized ? 1.4 : 1.0);

    ctx.fillStyle = isMuted ? '#525252' : trackColor;

    for (let i = 0; i < numBars; i++) {
      const idxPercent = (i / numBars) * 100;

      // Check if within trim bounds
      const isTrimmedOut = idxPercent < trimStart || idxPercent > (100 - trimEnd);

      let rawHeight = Math.abs(
        Math.sin(i * 0.2 + seed) * 0.4 +
          Math.cos(i * 0.5 + seed * 2) * 0.35 +
          Math.sin(i * 0.9 + seed * 3) * 0.25
      );
      if (isReversed) {
        rawHeight = Math.abs(
          Math.sin((numBars - i) * 0.2 + seed) * 0.4 +
            Math.cos((numBars - i) * 0.5 + seed * 2) * 0.35 +
            Math.sin((numBars - i) * 0.9 + seed * 3) * 0.25
        );
      }

      const barH = Math.min(height - 10, Math.max(4, rawHeight * (height * 0.85) * gainFactor));
      const xPos = i * barWidth;
      const yPos = (height - barH) / 2;

      ctx.fillStyle = isTrimmedOut
        ? '#262626'
        : isMuted
        ? '#737373'
        : trackColor;
      ctx.fillRect(xPos, yPos, barWidth - 1, barH);
    }

    // Draw Trim Start Marker Handle
    const trimStartX = (trimStart / 100) * width;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(trimStartX, 0);
    ctx.lineTo(trimStartX, height);
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(trimStartX - 6, 0, 12, 18);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('S', trimStartX - 3, 13);

    // Draw Trim End Marker Handle
    const trimEndX = ((100 - trimEnd) / 100) * width;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(trimEndX, 0);
    ctx.lineTo(trimEndX, height);
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(trimEndX - 6, height - 18, 12, 18);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('E', trimEndX - 3, height - 5);

    // Draw Slice Marker Handle Line
    const sliceX = (slicePositionPercent / 100) * width;
    ctx.strokeStyle = '#f43f5e';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sliceX, 0);
    ctx.lineTo(sliceX, height);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(sliceX - 8, height / 2 - 10, 16, 20);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('✂', sliceX - 4, height / 2 + 4);
  }, [
    region,
    gainDb,
    isReversed,
    isMuted,
    trimStart,
    trimEnd,
    slicePositionPercent,
    normalized,
    trackColor,
  ]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSlicePositionPercent(Math.round(percent));
  };

  const handleApplyChanges = () => {
    const updated: AudioRegion = {
      ...region,
      title: title.trim() || region.title,
      gainDb,
      pitchOffset,
      isReversed,
      isMuted,
      trimStartPercent: trimStart,
      trimEndPercent: trimEnd,
    };
    onUpdateRegion(updated);
  };

  const handleAudition = () => {
    audioEngine.initAudio();
    setIsPlayingAudition(true);
    setTimeout(() => setIsPlayingAudition(false), 2000);
  };

  const handleNormalize = () => {
    setNormalized(!normalized);
    if (!normalized) {
      setGainDb(4);
    } else {
      setGainDb(0);
    }
  };

  const handleExportWav = () => {
    const element = document.createElement('a');
    const file = new Blob([`RIFF WAV Audio Sample Chunk: ${title}`], { type: 'audio/wav' });
    element.href = URL.createObjectURL(file);
    element.download = `${title.replace(/\s+/g, '_')}_edited.wav`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleExecuteSlice = () => {
    if (onSliceRegion) {
      onSliceRegion(region.id, slicePositionPercent);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-neutral-900 border-2 border-amber-500/80 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col space-y-4 p-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full border border-white/20 shadow"
              style={{ backgroundColor: trackColor }}
            />
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-neutral-950 text-amber-400 font-black text-sm px-2 py-0.5 rounded border border-neutral-800 focus:border-amber-500 outline-none"
                />
                <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-400">
                  {region.type.toUpperCase()} CLIP
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 pt-0.5">
                TRACK: {trackName} • DURATION: {region.durationBars} BARS • START BAR: {region.startBar}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAudition}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                isPlayingAudition
                  ? 'bg-amber-500 text-neutral-950 animate-pulse'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-amber-400'
              }`}
            >
              {isPlayingAudition ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlayingAudition ? 'AUDITIONING...' : 'AUDITION SAMPLE'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Waveform Visualizer Canvas & Marker Handles */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] text-neutral-400 font-bold">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>INTERACTIVE SAMPLE WAVEFORM & TRIM MARKERS</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-amber-400 font-bold">
              <span>START MARKER: {trimStart}%</span>
              <span>END MARKER: {100 - trimEnd}%</span>
              <span className="text-rose-400">SLICE POINT: {slicePositionPercent}%</span>
            </div>
          </div>

          <div className="relative border-2 border-neutral-800 rounded-2xl overflow-hidden bg-neutral-950 shadow-inner">
            <canvas
              ref={canvasRef}
              width={800}
              height={140}
              onClick={handleCanvasClick}
              className="w-full h-36 cursor-crosshair block"
              title="Click anywhere to set Slice Cut position"
            />

            {/* Overlay hint */}
            <div className="absolute top-2 left-2 text-[9px] bg-neutral-950/80 px-2 py-0.5 rounded text-neutral-400 border border-neutral-800">
              CLICK CANVAS TO SET SLICE CUT POINT
            </div>
          </div>
        </div>

        {/* Start / End Trim & Slice Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-neutral-950 p-3 rounded-2xl border border-neutral-800">
          {/* Trim Start & End Sliders */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-stone-300">
              <span>START TRIM HANDLE</span>
              <span className="text-amber-400">{trimStart}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="45"
              value={trimStart}
              onChange={(e) => setTrimStart(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />

            <div className="flex items-center justify-between text-xs font-bold text-stone-300 pt-1">
              <span>END TRIM HANDLE</span>
              <span className="text-amber-400">{100 - trimEnd}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="45"
              value={trimEnd}
              onChange={(e) => setTrimEnd(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Slice Cut Point Slider */}
          <div className="space-y-2.5 bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between text-xs font-bold text-rose-400">
              <span className="flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5" />
                SLICE / SPLIT CUT POINT
              </span>
              <span>{slicePositionPercent}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="95"
              value={slicePositionPercent}
              onChange={(e) => setSlicePositionPercent(Number(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer"
            />
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={handleExecuteSlice}
                className="w-full py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>SLICE SAMPLE AT {slicePositionPercent}%</span>
              </button>
            </div>
          </div>
        </div>

        {/* Audio Processing Adjustments */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Gain Db */}
          <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-stone-300">
              <span>GAIN (dB)</span>
              <span className="text-amber-400">{gainDb > 0 ? `+${gainDb}` : gainDb} dB</span>
            </div>
            <input
              type="range"
              min="-24"
              max="12"
              value={gainDb}
              onChange={(e) => setGainDb(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Pitch Shift */}
          <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-stone-300">
              <span>PITCH SHIFT</span>
              <span className="text-amber-400">{pitchOffset > 0 ? `+${pitchOffset}` : pitchOffset} ST</span>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              value={pitchOffset}
              onChange={(e) => setPitchOffset(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Reverse Toggle */}
          <button
            onClick={() => setIsReversed(!isReversed)}
            className={`p-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-2 transition ${
              isReversed
                ? 'bg-amber-500 text-neutral-950 border-amber-400'
                : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:bg-neutral-800'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isReversed ? 'REVERSED ON' : 'REVERSE AUDIO'}</span>
          </button>

          {/* Normalize Toggle */}
          <button
            onClick={handleNormalize}
            className={`p-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-2 transition ${
              normalized
                ? 'bg-indigo-600 text-white border-indigo-400'
                : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:bg-neutral-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>{normalized ? '0dB NORMALIZED' : 'NORMALIZE PEAK'}</span>
          </button>
        </div>

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-between border-t border-neutral-800 pt-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {onDeleteRegion && (
              <button
                onClick={() => {
                  onDeleteRegion(region.id);
                  onClose();
                }}
                className="px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-black flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>DELETE CLIP</span>
              </button>
            )}

            {onDuplicateRegion && (
              <button
                onClick={() => {
                  onDuplicateRegion(region);
                  onClose();
                }}
                className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-stone-200 border border-neutral-700 text-xs font-black flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>DUPLICATE</span>
              </button>
            )}

            <button
              onClick={handleExportWav}
              className="px-3 py-2 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 text-xs font-black flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORT WAV</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-neutral-800 text-stone-400 hover:text-white text-xs font-bold"
            >
              CANCEL
            </button>
            <button
              onClick={() => {
                handleApplyChanges();
                onClose();
              }}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs flex items-center gap-1.5 shadow"
            >
              <Check className="w-4 h-4" />
              <span>SAVE & APPLY TO TIMELINE</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
