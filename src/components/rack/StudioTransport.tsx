import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  Play,
  Square,
  Circle,
  SkipBack,
  SkipForward,
  RotateCcw,
  Volume2,
  Radio,
  Sliders,
  Cpu,
  Clock,
  Activity,
  Wand2,
} from 'lucide-react';
import { MasterState, ConnectedDevice } from '../../types';

interface StudioTransportProps {
  masterState: MasterState;
  setMasterState: React.Dispatch<React.SetStateAction<MasterState>>;
  connectedDevices: ConnectedDevice[];
  onTriggerPlayStop: () => void;
  onTriggerRecord: () => void;
  onTapTempo: () => void;
  isFlipped: boolean;
  onToggleFlip: () => void;
  openAIGrooveModal: () => void;
  onOpenKeyboard?: () => void;
}

export const StudioTransport: React.FC<StudioTransportProps> = ({
  masterState,
  setMasterState,
  connectedDevices,
  onTriggerPlayStop,
  onTriggerRecord,
  onTapTempo,
  isFlipped,
  onToggleFlip,
  openAIGrooveModal,
  onOpenKeyboard,
}) => {
  const { t } = useLanguage();
  const activeCount = connectedDevices.filter((d) => d.connected).length;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-neutral-950 via-neutral-900 to-neutral-900 border-t-2 border-neutral-700 shadow-[0_-10px_30px_rgba(0,0,0,0.8)] select-none">
      {/* Wooden/Metallic Edge Strip */}
      <div className="h-1 bg-gradient-to-r from-amber-900 via-amber-700 to-amber-900 border-b border-neutral-950 opacity-80" />

      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-1.5 sm:py-2 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        {/* Left Section: TAB Flip Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onToggleFlip}
            className={`px-3 py-2 sm:py-1.5 rounded-lg text-xs font-mono font-black uppercase transition-all flex items-center gap-1.5 shadow-lg border min-h-[40px] ${
              isFlipped
                ? 'bg-amber-500 text-neutral-950 border-amber-300 shadow-amber-500/40 ring-2 ring-amber-400 scale-105'
                : 'bg-gradient-to-b from-neutral-700 to-neutral-800 text-neutral-200 hover:from-neutral-600 hover:to-neutral-700 border-neutral-600'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{isFlipped ? 'REAR' : 'FLIP (TAB)'}</span>
          </button>

          <div className="hidden lg:flex items-center gap-2 border-l border-neutral-800 pl-3">
            <span className="text-[11px] font-mono font-black tracking-widest text-amber-500 uppercase">
              UNIVERSAL STUDIO VIRTUAL RACK
            </span>
          </div>
        </div>

        {/* Center Section: Iconic LCD Screen & Metallic Transport Buttons */}
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-center">
          {/* Digital Green LCD Screen */}
          <div className="bg-emerald-950/90 border-2 border-emerald-800/80 rounded-lg px-2 sm:px-3 py-1 flex items-center gap-2 sm:gap-4 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)] font-mono">
            {/* Song Position Bar.Beat.Tick */}
            <div className="text-center">
              <span className="text-[8px] text-emerald-600 block font-bold">POS</span>
              <span className="text-[10px] sm:text-xs font-black text-emerald-400 tracking-wider">
                0001.01.01
              </span>
            </div>

            {/* BPM Counter */}
            <div className="text-center border-x border-emerald-900/80 px-2 sm:px-3">
              <span className="text-[8px] text-emerald-600 block font-bold">BPM</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="40"
                  max="240"
                  value={masterState.bpm}
                  onChange={(e) =>
                    setMasterState((prev) => ({
                      ...prev,
                      bpm: Math.max(40, Math.min(240, Number(e.target.value))),
                    }))
                  }
                  className="w-10 sm:w-12 text-center text-xs font-bold bg-transparent text-emerald-300 focus:outline-none"
                />
                <button
                  onClick={onTapTempo}
                  className="px-1.5 py-1 text-[9px] bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 rounded font-bold min-h-[28px]"
                >
                  TAP
                </button>
              </div>
            </div>

            {/* Time Signature */}
            <div className="text-center pr-1 hidden sm:block">
              <span className="text-[8px] text-emerald-600 block font-bold">METER</span>
              <span className="text-xs font-bold text-emerald-400">4 / 4</span>
            </div>
          </div>

          {/* Big Metallic Transport Buttons */}
          <div className="flex items-center gap-1 sm:gap-1.5 bg-neutral-950 p-1 sm:p-1.5 rounded-xl border border-neutral-800 shadow-inner">
            <button
              onClick={() => setMasterState((prev) => ({ ...prev, currentStep: 0 }))}
              className="p-2 rounded-lg bg-gradient-to-b from-neutral-700 to-neutral-800 hover:from-neutral-600 hover:to-neutral-700 text-neutral-300 border border-neutral-600 shadow active:scale-95 transition min-h-[40px] min-w-[40px] flex items-center justify-center"
              title="Return to Zero"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onTriggerPlayStop}
              className={`px-3 py-2 rounded-lg font-black text-xs transition-all flex items-center gap-1.5 border shadow-lg min-h-[40px] ${
                masterState.isPlaying
                  ? 'bg-gradient-to-b from-emerald-500 to-emerald-700 text-white border-emerald-400 shadow-emerald-500/40'
                  : 'bg-gradient-to-b from-neutral-700 to-neutral-800 text-neutral-200 hover:from-neutral-600 hover:to-neutral-700 border-neutral-600'
              }`}
            >
              {masterState.isPlaying ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>{t('transport.stop', 'STOP')}</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{t('transport.play', 'PLAY')}</span>
                </>
              )}
            </button>

            <button
              onClick={onTriggerRecord}
              className={`px-3 py-2 rounded-lg font-black text-xs transition-all flex items-center gap-1.5 border shadow-lg min-h-[40px] ${
                masterState.isRecording
                  ? 'bg-gradient-to-b from-rose-600 to-rose-800 text-white border-rose-400 shadow-rose-600/50 animate-pulse'
                  : 'bg-gradient-to-b from-neutral-700 to-neutral-800 text-neutral-300 hover:from-neutral-600 hover:to-neutral-700 border-neutral-600'
              }`}
            >
              <Circle className="w-3.5 h-3.5 fill-current" />
              <span>{t('transport.record', 'REC')}</span>
            </button>

            <button
              onClick={() =>
                setMasterState((prev) => ({ ...prev, metronome: !prev.metronome }))
              }
              className={`px-2.5 py-2 rounded-lg text-xs font-mono font-bold border transition min-h-[40px] ${
                masterState.metronome
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-neutral-800 text-neutral-500 border-neutral-700 hover:text-neutral-300'
              }`}
            >
              CLICK
            </button>

            {onOpenKeyboard && (
              <button
                onClick={onOpenKeyboard}
                className="px-2.5 py-2 rounded-lg text-xs font-mono font-black border transition min-h-[40px] bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500 hover:text-neutral-950 flex items-center gap-1 shadow"
                title="Open Onscreen Touch & QWERTY Piano Controller"
              >
                <span>🎹 KEYBOARD</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Section: Master Volume & AI Button */}
        <div className="flex items-center gap-4">
          {/* Master Output Level */}
          <div className="flex items-center gap-2 bg-neutral-950/80 px-3 py-1.5 rounded-xl border border-neutral-800">
            <Volume2 className="w-3.5 h-3.5 text-neutral-400" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={masterState.masterVolume}
              onChange={(e) =>
                setMasterState((prev) => ({
                  ...prev,
                  masterVolume: Number(e.target.value),
                }))
              }
              className="w-20 accent-amber-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
            />
          </div>

          <button
            onClick={openAIGrooveModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/30 active:scale-95 transition"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI GROOVE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
