import React, { useState } from 'react';
import {
  Grid,
  Play,
  RotateCcw,
  Sliders,
  Volume2,
  Plus,
  Music,
  Zap,
  Sparkles,
  Flame,
  Radio
} from 'lucide-react';
import { audioEngine } from '../../audio/engine';

interface Channel {
  id: string;
  name: string;
  color: string;
  pan: number;
  vol: number;
  steps: boolean[];
}

export const BeatLoomChannelRack: React.FC = () => {
  const [selectedPattern, setSelectedPattern] = useState<string>('Pattern 1');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [swing, setSwing] = useState<number>(55); // %
  const [currentStep, setCurrentStep] = useState<number>(0);

  const [channels, setChannels] = useState<Channel[]>([
    {
      id: 'ch_kick',
      name: '808 Kick Drum',
      color: '#f59e0b',
      pan: 0,
      vol: 90,
      steps: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
    },
    {
      id: 'ch_snare',
      name: 'Studio Snare 1',
      color: '#ec4899',
      pan: 0,
      vol: 85,
      steps: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    },
    {
      id: 'ch_hhc',
      name: 'HiHat Closed (16th)',
      color: '#3b82f6',
      pan: -15,
      vol: 80,
      steps: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
    },
    {
      id: 'ch_hho',
      name: 'HiHat Open (Offbeat)',
      color: '#10b981',
      pan: 15,
      vol: 75,
      steps: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
    },
    {
      id: 'ch_clap',
      name: '808 Trap Clap',
      color: '#8b5cf6',
      pan: 5,
      vol: 85,
      steps: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    },
    {
      id: 'ch_bass',
      name: 'Subtractive 808 Synth',
      color: '#ef4444',
      pan: 0,
      vol: 95,
      steps: [true, false, false, true, false, false, true, false, false, true, false, false, true, false, false, false],
    },
  ]);

  const toggleStep = (chId: string, stepIdx: number) => {
    audioEngine.initAudio();
    audioEngine.triggerMetronome(stepIdx % 4 === 0);
    setChannels((prev) =>
      prev.map((c) =>
        c.id === chId
          ? {
              ...c,
              steps: c.steps.map((val, idx) => (idx === stepIdx ? !val : val)),
            }
          : c
      )
    );
  };

  const togglePlay = () => {
    audioEngine.initAudio();
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6 font-mono select-none">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-neutral-900 via-stone-900 to-neutral-900 border-2 border-neutral-700 rounded-2xl p-5 shadow-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
            <Grid className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
              PATTERN STEP CHANNEL RACK SEQUENCER
            </h2>
            <p className="text-xs text-neutral-400">
              Classic 16-step beat grid, swing shuffle & channel sample matrix.
            </p>
          </div>
        </div>

        {/* Pattern & Playback Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-neutral-950 p-2 rounded-xl border border-neutral-800">
            <span className="text-xs text-neutral-400 font-bold">SWING:</span>
            <input
              type="range"
              min="50"
              max="75"
              value={swing}
              onChange={(e) => setSwing(Number(e.target.value))}
              className="w-20 accent-amber-500 cursor-pointer"
            />
            <span className="text-xs text-amber-400 font-bold">{swing}%</span>
          </div>

          <div className="flex gap-1">
            {['Pattern 1', 'Pattern 2', 'Pattern 3'].map((pat) => (
              <button
                key={pat}
                onClick={() => setSelectedPattern(pat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                  selectedPattern === pat
                    ? 'bg-amber-500 text-neutral-950 border-amber-300 font-black shadow'
                    : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                }`}
              >
                {pat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Channel Rack Body */}
      <div className="bg-neutral-950 border-2 border-neutral-700 rounded-3xl p-6 shadow-2xl space-y-3">
        {/* Step Numbers Top Bar */}
        <div className="flex items-center pl-64 pr-2">
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 text-center text-[10px] font-black ${
                i % 4 === 0 ? 'text-amber-400 border-l border-amber-500/40' : 'text-neutral-600'
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Channel Rows */}
        <div className="space-y-2">
          {channels.map((ch) => (
            <div key={ch.id} className="flex items-center gap-2 bg-neutral-900 border-2 border-neutral-800 rounded-2xl p-2 shadow-lg">
            {/* Left channel controls */}
              <div className="w-60 shrink-0 bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ch.color }} />
                  <span className="text-xs font-black text-white truncate max-w-[110px]">{ch.name}</span>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-400">
                  <span>VOL: {ch.vol}</span>
                </div>
              </div>

            {/* 16 step buttons grouped into four blocks */}
              <div className="flex-1 flex gap-1 h-10">
                {ch.steps.map((active, stepIdx) => {
                  const isBeatGroup = Math.floor(stepIdx / 4) % 2 === 0;

                  return (
                    <button
                      key={stepIdx}
                      onClick={() => toggleStep(ch.id, stepIdx)}
                      className={`flex-1 rounded-lg border transition-all ${
                        active
                          ? 'bg-amber-500 border-amber-200 shadow-lg shadow-amber-500/40 scale-95 font-black text-neutral-950'
                          : isBeatGroup
                          ? 'bg-neutral-800 border-neutral-700 hover:border-amber-500'
                          : 'bg-neutral-900 border-neutral-800 hover:border-amber-500'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
