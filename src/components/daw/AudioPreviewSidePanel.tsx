import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  Play,
  Square,
  Volume2,
  Sliders,
  Music,
  Check,
  RotateCcw,
  FileAudio,
  Activity,
  Scissors,
  X,
  Plus,
} from 'lucide-react';
import { SamplePad } from '../../types';

interface AudioPreviewSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onCommitSample?: (sampleData: {
    name: string;
    audioBuffer: AudioBuffer | null;
    gainDb: number;
    pitchSemi: number;
    trimStart: number;
    trimEnd: number;
  }) => void;
  pads?: SamplePad[];
  setPads?: React.Dispatch<React.SetStateAction<SamplePad[]>>;
}

export const AudioPreviewSidePanel: React.FC<AudioPreviewSidePanelProps> = ({
  isOpen,
  onClose,
  onCommitSample,
  pads,
  setPads,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('No File Selected');
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(true);

  // Audio adjustments
  const [gainDb, setGainDb] = useState<number>(0); // -24 dB to +12 dB
  const [pitchSemi, setPitchSemi] = useState<number>(0); // -12 to +12 semitones
  const [speedRate, setSpeedRate] = useState<number>(1.0); // 0.5x to 2.0x
  const [trimStartPercent, setTrimStartPercent] = useState<number>(0); // 0 to 50%
  const [trimEndPercent, setTrimEndPercent] = useState<number>(100); // 50 to 100%
  const [targetPadBank, setTargetPadBank] = useState<string>('A');
  const [targetPadIndex, setTargetPadIndex] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Initialize Web Audio Context
  useEffect(() => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtxRef.current = new AudioContextClass();
      }
    }
    return () => {
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  // Handle file selection or drop
  const processAudioFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setFileName(selectedFile.name);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      if (!audioCtxRef.current) return;
      const decodedBuffer = await audioCtxRef.current.decodeAudioData(arrayBuffer);
      setAudioBuffer(decodedBuffer);
    } catch (err) {
      console.warn('Fallback synthetic buffer generated for audio file:', err);
      // Fallback synthetic buffer for demo if audio decoding fails
      if (audioCtxRef.current) {
        const sr = audioCtxRef.current.sampleRate;
        const buf = audioCtxRef.current.createBuffer(2, sr * 2, sr);
        const chan0 = buf.getChannelData(0);
        const chan1 = buf.getChannelData(1);
        for (let i = 0; i < buf.length; i++) {
          const t = i / sr;
          chan0[i] = Math.sin(2 * Math.PI * 440 * t) * Math.exp(-3 * t);
          chan1[i] = Math.sin(2 * Math.PI * 554.37 * t) * Math.exp(-3 * t);
        }
        setAudioBuffer(buf);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processAudioFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processAudioFile(e.dataTransfer.files[0]);
    }
  };

  // Draw Waveform on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#0a0a0a');
    bgGrad.addColorStop(1, '#171717');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Center grid line
    ctx.strokeStyle = '#262626';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    if (!audioBuffer) {
      ctx.fillStyle = '#737373';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('DROP AUDIO FILE OR CLICK TO LOAD SAMPLE', canvas.width / 2, canvas.height / 2 + 3);
      return;
    }

    const rawData = audioBuffer.getChannelData(0);
    const step = Math.ceil(rawData.length / canvas.width);
    const amp = canvas.height / 2;

    const startX = (trimStartPercent / 100) * canvas.width;
    const endX = (trimEndPercent / 100) * canvas.width;

    // Draw active trim highlight
    ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
    ctx.fillRect(startX, 0, endX - startX, canvas.height);

    // Draw waveform bars
    ctx.beginPath();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;

    for (let i = 0; i < canvas.width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = rawData[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }

      // Apply gain multiplier visually
      const gainMult = Math.pow(10, gainDb / 20);
      min = Math.max(-1, Math.min(1, min * gainMult));
      max = Math.max(-1, Math.min(1, max * gainMult));

      const isInsideTrim = i >= startX && i <= endX;
      ctx.strokeStyle = isInsideTrim ? '#f59e0b' : '#525252';

      ctx.beginPath();
      ctx.moveTo(i, (1 + min) * amp);
      ctx.lineTo(i, (1 + max) * amp);
      ctx.stroke();
    }

    // Draw Trim handles
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(startX - 2, 0, 4, canvas.height);
    ctx.fillRect(endX - 2, 0, 4, canvas.height);
  }, [audioBuffer, gainDb, trimStartPercent, trimEndPercent]);

  // Audio Playback
  const handleTogglePlay = () => {
    if (!audioCtxRef.current || !audioBuffer) return;

    if (isPlaying) {
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.stop();
        } catch (e) {}
      }
      setIsPlaying(false);
      return;
    }

    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    const source = audioCtxRef.current.createBufferSource();
    source.buffer = audioBuffer;

    // Pitch shift via playbackRate calculation (2^(semitones/12))
    const pitchRatio = Math.pow(2, pitchSemi / 12) * speedRate;
    source.playbackRate.value = pitchRatio;
    source.loop = isLooping;

    // Apply Gain
    const gainNode = audioCtxRef.current.createGain();
    const gainVal = Math.pow(10, gainDb / 20);
    gainNode.gain.value = gainVal;

    source.connect(gainNode);
    gainNode.connect(audioCtxRef.current.destination);

    const duration = audioBuffer.duration;
    const startSec = (trimStartPercent / 100) * duration;
    const endSec = (trimEndPercent / 100) * duration;

    source.start(0, startSec, Math.max(0.1, endSec - startSec));

    source.onended = () => {
      setIsPlaying(false);
    };

    sourceNodeRef.current = source;
    gainNodeRef.current = gainNode;
    setIsPlaying(true);
  };

  const handleCommitToPad = () => {
    if (!audioBuffer) return;

    if (setPads) {
      setPads((prev) => {
        const updated = [...prev];
        const targetPad = updated.find(
          (p) => p.bank === targetPadBank && p.id.includes(`pad_${targetPadIndex}`)
        ) || updated[targetPadIndex];

        if (targetPad) {
          targetPad.name = fileName.replace(/\.[^/.]+$/, '');
          targetPad.audioBuffer = audioBuffer;
          targetPad.pitch = pitchSemi;
          targetPad.volume = Math.pow(10, gainDb / 20);
          targetPad.startOffset = trimStartPercent / 100;
          targetPad.endOffset = trimEndPercent / 100;
        }
        return updated;
      });
    }

    if (onCommitSample) {
      onCommitSample({
        name: fileName,
        audioBuffer,
        gainDb,
        pitchSemi,
        trimStart: trimStartPercent,
        trimEnd: trimEndPercent,
      });
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 sm:w-96 bg-neutral-950 border-l-2 border-amber-500/80 shadow-2xl z-50 flex flex-col font-mono text-xs select-none animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-3 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-amber-400 font-black">
          <Activity className="w-4 h-4" />
          <span className="uppercase tracking-wider">AUDIO SAMPLE PREVIEW</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Drop Zone / Browse Button */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-neutral-700 hover:border-amber-500/80 rounded-2xl p-4 text-center bg-neutral-900/50 transition cursor-pointer relative group"
        >
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileInput}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
          />
          <UploadCloud className="w-8 h-8 text-amber-400 mx-auto mb-2 group-hover:scale-110 transition" />
          <span className="text-xs font-bold text-amber-300 block truncate">{fileName}</span>
          <span className="text-[10px] text-neutral-500 block mt-1">
            Drag & Drop WAV / MP3 / OGG or click to browse
          </span>
        </div>

        {/* Interactive Waveform Canvas */}
        <div className="bg-neutral-900 p-2 rounded-xl border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400 uppercase">
            <span>WAVEFORM VISUALIZER</span>
            {audioBuffer && (
              <span className="text-amber-400">
                {audioBuffer.duration.toFixed(2)}s • {audioBuffer.sampleRate} Hz
              </span>
            )}
          </div>
          <canvas
            ref={canvasRef}
            width={320}
            height={90}
            className="w-full h-24 bg-black rounded-lg border border-neutral-800"
          />
        </div>

        {/* Transport Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleTogglePlay}
            disabled={!audioBuffer}
            className={`flex-1 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition border ${
              !audioBuffer
                ? 'bg-neutral-900 text-neutral-600 border-neutral-800 cursor-not-allowed'
                : isPlaying
                ? 'bg-rose-600 text-white border-rose-400 animate-pulse'
                : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 border-amber-300 shadow-lg'
            }`}
          >
            {isPlaying ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isPlaying ? 'STOP AUDITION' : 'PREVIEW PLAYBACK'}</span>
          </button>

          <button
            onClick={() => setIsLooping(!isLooping)}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold transition border ${
              isLooping
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-neutral-900 text-neutral-500 border-neutral-800'
            }`}
            title="Toggle Audition Loop Playback"
          >
            LOOP
          </button>
        </div>

        {/* DSP Controls: Gain, Pitch, Speed, Trim */}
        <div className="bg-neutral-900 p-3 rounded-xl border border-neutral-800 space-y-3">
          <div className="flex items-center gap-1 text-[10px] font-bold text-amber-400 uppercase border-b border-neutral-800 pb-1">
            <Sliders className="w-3 h-3" />
            <span>REAL-TIME PRE-COMMIT DSP</span>
          </div>

          {/* Gain Trim Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-neutral-400">
              <span>Gain Trim:</span>
              <strong className="text-amber-400">{gainDb > 0 ? `+${gainDb}` : gainDb} dB</strong>
            </div>
            <input
              type="range"
              min="-24"
              max="12"
              step="0.5"
              value={gainDb}
              onChange={(e) => setGainDb(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-neutral-950 rounded"
            />
          </div>

          {/* Pitch Shift Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-neutral-400">
              <span>Pitch Shift:</span>
              <strong className="text-amber-400">{pitchSemi > 0 ? `+${pitchSemi}` : pitchSemi} semi</strong>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              step="1"
              value={pitchSemi}
              onChange={(e) => setPitchSemi(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-neutral-950 rounded"
            />
          </div>

          {/* Speed / Time Stretch Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-neutral-400">
              <span>Playback Speed:</span>
              <strong className="text-amber-400">{speedRate.toFixed(2)}x</strong>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={speedRate}
              onChange={(e) => setSpeedRate(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-neutral-950 rounded"
            />
          </div>

          {/* Start Trim handle */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-neutral-400">
              <span>Start Trim:</span>
              <strong className="text-amber-400">{trimStartPercent}%</strong>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={trimStartPercent}
              onChange={(e) => setTrimStartPercent(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-neutral-950 rounded"
            />
          </div>

          {/* End Trim handle */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-neutral-400">
              <span>End Trim:</span>
              <strong className="text-amber-400">{trimEndPercent}%</strong>
            </div>
            <input
              type="range"
              min="50"
              max="100"
              value={trimEndPercent}
              onChange={(e) => setTrimEndPercent(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-neutral-950 rounded"
            />
          </div>
        </div>

        {/* Target Destination Assignment */}
        <div className="bg-neutral-900 p-3 rounded-xl border border-neutral-800 space-y-2">
          <span className="text-[10px] font-bold text-amber-400 uppercase block">
            ASSIGN SAMPLE TO SAMPLER PAD
          </span>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[9px] text-neutral-500 block mb-0.5">BANK:</span>
              <select
                value={targetPadBank}
                onChange={(e) => setTargetPadBank(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded p-1 text-amber-300 font-bold"
              >
                {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((b) => (
                  <option key={b} value={b}>
                    BANK {b}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className="text-[9px] text-neutral-500 block mb-0.5">PAD SLOT:</span>
              <select
                value={targetPadIndex}
                onChange={(e) => setTargetPadIndex(Number(e.target.value))}
                className="w-full bg-neutral-950 border border-neutral-800 rounded p-1 text-amber-300 font-bold"
              >
                {Array.from({ length: 16 }).map((_, idx) => (
                  <option key={idx} value={idx}>
                    PAD {idx + 1}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Commit Button */}
      <div className="p-3 bg-neutral-900 border-t border-neutral-800">
        <button
          onClick={handleCommitToPad}
          disabled={!audioBuffer}
          className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition border ${
            audioBuffer
              ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950 border-amber-300 shadow-xl cursor-pointer'
              : 'bg-neutral-800 text-neutral-600 border-neutral-700 cursor-not-allowed'
          }`}
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>COMMIT SAMPLE TO PROJECT</span>
        </button>
      </div>
    </div>
  );
};
