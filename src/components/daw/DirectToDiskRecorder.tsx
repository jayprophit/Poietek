import React, { useState, useEffect } from 'react';
import {
  Mic,
  Square,
  Play,
  Pause,
  Download,
  Scissors,
  Volume2,
  Activity,
  Disc,
  X,
  Sparkles,
  RefreshCw,
  Trash2,
  Copy,
} from 'lucide-react';
import { audioEngine } from '../../audio/engine';

interface DirectToDiskRecorderProps {
  bpm: number;
  onAddClipToSequencer?: (title: string, durationBars: number) => void;
  onClose?: () => void;
}

export const DirectToDiskRecorder: React.FC<DirectToDiskRecorderProps> = ({
  bpm,
  onAddClipToSequencer,
  onClose,
}) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedDurationSec, setRecordedDurationSec] = useState<number>(0);
  const [hasRecordedTake, setHasRecordedTake] = useState<boolean>(false);
  const [isPlayingTake, setIsPlayingTake] = useState<boolean>(false);
  const [takeTitle, setTakeTitle] = useState<string>('Master_Rack_Take_01.wav');
  const [gainDb, setGainDb] = useState<number>(0);
  const [isReversed, setIsReversed] = useState<boolean>(false);

  // Timer for active recording duration
  useEffect(() => {
    let timer: any;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordedDurationSec((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const startRecording = () => {
    audioEngine.initAudio();
    setIsRecording(true);
    setRecordedDurationSec(0);
    setHasRecordedTake(false);
  };

  const stopRecording = () => {
    setIsRecording(false);
    setHasRecordedTake(true);
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleExportWav = () => {
    // Generate dummy WAV download for direct-to-disk take
    const element = document.createElement('a');
    const file = new Blob([`RIFF Direct-To-Disk Audio Take ${takeTitle}`], { type: 'audio/wav' });
    element.href = URL.createObjectURL(file);
    element.download = takeTitle;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSendToTimeline = () => {
    if (onAddClipToSequencer) {
      const bars = Math.max(1, Math.round((recordedDurationSec / 60) * (bpm / 4)));
      onAddClipToSequencer(takeTitle, bars);
    }
  };

  return (
    <div className="bg-neutral-950 border-2 border-rose-500 rounded-3xl p-5 shadow-2xl font-mono select-none space-y-4 max-w-3xl mx-auto">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-rose-950 pb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl text-white font-black ${isRecording ? 'bg-rose-600 animate-pulse' : 'bg-rose-950 border border-rose-800'}`}>
            <Disc className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h3 className="text-sm font-black text-rose-400 uppercase tracking-widest flex items-center gap-2">
              DIRECT-TO-DISK STEREO MASTER RACK RECORDER
            </h3>
            <p className="text-[10px] text-neutral-400">
              Captures live master audio output from the entire rack assembly into a floating wave clip editor.
            </p>
          </div>
        </div>

        {onClose && (
          <button onClick={onClose} className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Recording Display & Meters */}
      <div className="bg-neutral-900 border-2 border-neutral-800 rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* Status Indicator */}
          <div className="flex items-center gap-3">
            <div className={`w-3.5 h-3.5 rounded-full ${isRecording ? 'bg-rose-500 animate-ping' : 'bg-neutral-700'}`} />
            <span className="text-xs font-black text-neutral-200 uppercase">
              {isRecording ? 'RECORDING LIVE STEREO BUS...' : hasRecordedTake ? 'RECORDED TAKE READY' : 'STANDBY (ARMED)'}
            </span>
          </div>

          {/* Time Counter */}
          <div className="bg-neutral-950 px-4 py-1.5 rounded-xl border border-neutral-800 text-amber-400 font-mono text-base font-black tracking-widest">
            {formatTime(recordedDurationSec)}
          </div>
        </div>

        {/* Live Audio Peak Waveform Meter Canvas */}
        <div className="h-28 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-center relative overflow-hidden">
          {isRecording ? (
            <div className="flex items-center gap-1.5 w-full justify-center px-4">
              {Array.from({ length: 48 }).map((_, i) => (
                <div
                  key={i}
                  style={{ height: `${Math.sin(i * 0.4 + Date.now() * 0.005) * 40 + 45}%` }}
                  className="w-1.5 bg-rose-500 rounded-full transition-all duration-75 shadow-sm shadow-rose-500/50"
                />
              ))}
            </div>
          ) : hasRecordedTake ? (
            <div className="w-full h-full p-2 flex items-center justify-center">
              <svg className="w-full h-full text-amber-400" viewBox="0 0 400 80">
                <path
                  d="M0 40 Q20 10, 40 40 T80 40 T120 70 T160 20 T200 60 T240 10 T280 50 T320 20 T360 60 T400 40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            </div>
          ) : (
            <span className="text-xs font-bold text-neutral-600 uppercase">
              Click 'START RECORDING' to capture live master rack sound
            </span>
          )}
        </div>

        {/* Transport Action Controls */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 transition"
            >
              <Mic className="w-4 h-4 fill-current" />
              <span>START RECORDING TAKE</span>
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/30 transition animate-bounce"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>STOP RECORDING & PROCESS</span>
            </button>
          )}

          {hasRecordedTake && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlayingTake(!isPlayingTake)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow"
              >
                {isPlayingTake ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                <span>{isPlayingTake ? 'PAUSE TAKE' : 'PLAY RECORDED TAKE'}</span>
              </button>

              <button
                onClick={handleExportWav}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center gap-1.5 shadow"
              >
                <Download className="w-4 h-4" />
                <span>EXPORT WAV</span>
              </button>

              {onAddClipToSequencer && (
                <button
                  onClick={handleSendToTimeline}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs flex items-center gap-1.5 shadow"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>SEND TO SONG TIMELINE</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
