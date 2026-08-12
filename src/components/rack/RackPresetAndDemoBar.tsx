import React, { useState, useEffect, useRef } from 'react';
import { RackModuleItem, WorkspaceType } from '../../types';
import {
  FolderOpen,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Disc,
  Sparkles,
  Music,
  RotateCcw,
  Sliders,
  Check,
  ChevronDown,
  ChevronUp,
  Layers,
  Radio,
} from 'lucide-react';
import { audioEngine } from '../../audio/engine';

interface RackPresetAndDemoBarProps {
  onLoadRackPreset: (modules: RackModuleItem[], bpm?: number, title?: string) => void;
}

export const RackPresetAndDemoBar: React.FC<RackPresetAndDemoBarProps> = ({
  onLoadRackPreset,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('default');
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [isPlayingDemo, setIsPlayingDemo] = useState<boolean>(false);
  const [isDemoBarExpanded, setIsDemoBarExpanded] = useState<boolean>(false);

  // Stems faders for demo tracks (0 to 1)
  const [vocalLevel, setVocalLevel] = useState<number>(0.9);
  const [synthLevel, setSynthLevel] = useState<number>(0.85);
  const [drumLevel, setDrumLevel] = useState<number>(0.9);
  const [bassLevel, setBassLevel] = useState<number>(0.85);
  const [playbackProgress, setPlaybackProgress] = useState<number>(0);

  const demoIntervalRef = useRef<any>(null);

  // Preset templates definitions
  const presets: {
    id: string;
    name: string;
    genre: string;
    bpm: number;
    description: string;
    modules: { type: WorkspaceType; title: string; tapeLabel: string }[];
  }[] = [
    {
      id: 'default',
      name: 'Default Studio Stack',
      genre: 'General Studio',
      bpm: 120,
      description: 'Standard foundational studio rack with Subtractor synth, Reverb, Echo, & Master SSL Mixer.',
      modules: [
        { type: 'subtractor_synth', title: 'Subtractor Polyphonic Synth', tapeLabel: 'SUBTRACTIVE SYNTH' },
        { type: 'rv7000_reverb', title: 'RV7000 MkII Advanced Reverb', tapeLabel: 'CONVOLUTION REVERB' },
        { type: 'the_echo_delay', title: 'The Echo Digital Tape Delay', tapeLabel: 'TAPE DELAY' },
        { type: 'mixer', title: 'SSL Master Studio Mixer', tapeLabel: 'SSL MASTER MIXER' },
      ],
    },
    {
      id: 'empty',
      name: 'Empty Rack',
      genre: 'Blank Canvas',
      bpm: 120,
      description: 'Clear all devices from the rack to build custom setups from scratch.',
      modules: [],
    },
    {
      id: 'hippopotamus',
      name: 'Hippopotamus (Heavy Bass/Electronic)',
      genre: 'Dubstep & Electro',
      bpm: 140,
      description: 'Heavy electronic setup with Thor Synth, Subtractor Bass, Scream 4 Distortion, & Sidechain Ducker.',
      modules: [
        { type: 'thor_synth', title: 'Thor Polysonic Synthesizer', tapeLabel: 'THOR SYNTH' },
        { type: 'subtractor_synth', title: 'Subtractor Sub Bass', tapeLabel: 'SUB BASS' },
        { type: 'scream4_distortion', title: 'Scream 4 Distortion Unit', tapeLabel: 'DISTORTION' },
        { type: 'pulverizer_comp', title: 'Pulverizer Demolition Unit', tapeLabel: 'PULVERIZER' },
        { type: 'sidechain_ducker', title: 'Dynamic Sidechain Ducker', tapeLabel: 'SIDECHAIN PUMP' },
      ],
    },
    {
      id: 'r_n_b',
      name: 'R&B / Soul Smooth Stack',
      genre: 'R&B & Hip-Hop',
      bpm: 95,
      description: 'Warm soul tones with Polytone dual synth, Mimic Sampler, SP-404, & Smooth Echo Tape Delay.',
      modules: [
        { type: 'polytone_synth', title: 'Polytone Dual Synth', tapeLabel: 'POLYTONE SYNTH' },
        { type: 'mimic_sampler', title: 'Mimic Creative Sampler', tapeLabel: 'MIMIC SAMPLER' },
        { type: 'sp404', title: 'SP-404 MKII Sampler', tapeLabel: 'SP-404 BEATS' },
        { type: 'rv7000_reverb', title: 'RV7000 Plate Reverb', tapeLabel: 'PLATE REVERB' },
        { type: 'the_echo_delay', title: 'The Echo Tape Delay', tapeLabel: 'ANALOG DELAY' },
      ],
    },
    {
      id: 'drum_n_bass',
      name: 'Drum \'N\' Bass Cyber 174 BPM',
      genre: 'Drum & Bass',
      bpm: 174,
      description: 'High-speed 174 BPM setup with MPC drum pad, Subtractor wobble bass, & Pulverizer compressor.',
      modules: [
        { type: 'mpc', title: 'MPC Studio Drum Pad', tapeLabel: 'MPC DRUMS' },
        { type: 'subtractor_synth', title: 'Subtractor Wobble Bass', tapeLabel: 'WOBBLE BASS' },
        { type: 'pulverizer_comp', title: 'Pulverizer Demolition Unit', tapeLabel: 'COMPRESSOR' },
        { type: 'sidechain_ducker', title: 'Dynamic Sidechain Ducker', tapeLabel: 'SIDECHAIN' },
      ],
    },
    {
      id: 'classical',
      name: 'Classical & Cinematic Orchestral',
      genre: 'Classical / Film Score',
      bpm: 100,
      description: 'Rich harmonic orchestral setup with Scales & Chords player, Polytone strings, & RV7000 Hall reverb.',
      modules: [
        { type: 'scales_chords', title: 'Scales & Chords Player', tapeLabel: 'HARMONIC PLAYER' },
        { type: 'polytone_synth', title: 'Polytone Orchestral Strings', tapeLabel: 'STRINGS SYNTH' },
        { type: 'rv7000_reverb', title: 'RV7000 Cathedral Reverb', tapeLabel: 'CATHEDRAL REVERB' },
      ],
    },
    {
      id: 'jazz_blues',
      name: 'Jazz & Blues Vintage Lounge',
      genre: 'Jazz & Blues',
      bpm: 88,
      description: 'Warm vintage lounge setup with Mimic Rhodes sampler, Audiomatic tube transformer, & SP-404 beats.',
      modules: [
        { type: 'mimic_sampler', title: 'Mimic Electric Piano Sampler', tapeLabel: 'RHODES PIANO' },
        { type: 'audiomatic_retro', title: 'Audiomatic Tube Transformer', tapeLabel: 'TUBE WARMTH' },
        { type: 'the_echo_delay', title: 'The Echo Tape Delay', tapeLabel: 'PING-PONG DELAY' },
        { type: 'sp404', title: 'SP-404 Lo-Fi Beats', tapeLabel: 'LO-FI BEATS' },
      ],
    },
    {
      id: 'rock',
      name: 'Rock & Metal Amp Stack',
      genre: 'Rock / Alternative',
      bpm: 128,
      description: 'Gritty rock stack with E-Drum kit, Scream 4 overdrive tube drive, & Pulverizer compressor.',
      modules: [
        { type: 'edrum', title: 'E-Drum Mesh Kit', tapeLabel: 'E-DRUM KIT' },
        { type: 'subtractor_synth', title: 'Subtractor Rock Bass', tapeLabel: 'ROCK BASS' },
        { type: 'scream4_distortion', title: 'Scream 4 Tube Amp Overdrive', tapeLabel: 'TUBE AMP' },
        { type: 'pulverizer_comp', title: 'Pulverizer Demolition Unit', tapeLabel: 'PULVERIZER' },
      ],
    },
    {
      id: 'reason_benchmark',
      name: 'Reason Studio Master Stack (Full Stems)',
      genre: 'Pop / R&B / Electronic',
      bpm: 96,
      description: 'Complete multi-instrument studio setup with MPC Drumkit, Subtractor Bass, Polytone Chords, Thor Lead, Mimic Vocal Sampler, Scream 4, & RV7000 Reverb.',
      modules: [
        { type: 'mpc', title: 'MPC Studio Master Drumkit', tapeLabel: 'DRUMKIT STACK' },
        { type: 'polytone_synth', title: 'Polytone Glass Rhodes Chords', tapeLabel: 'MELODY CHORDS' },
        { type: 'subtractor_synth', title: 'Subtractor Deep 808 Bassline', tapeLabel: 'SUB BASS' },
        { type: 'thor_synth', title: 'Thor Polysonic Cyber Saw Lead', tapeLabel: 'LEAD SYNTH' },
        { type: 'mimic_sampler', title: 'Mimic Vocal Hook & Stem Sampler', tapeLabel: 'VOCAL STEMS' },
        { type: 'scream4_distortion', title: 'Scream 4 Distortion Unit', tapeLabel: 'EFFECTS DISTORTION' },
        { type: 'rv7000_reverb', title: 'RV7000 Advanced Reverb', tapeLabel: 'EFFECTS REVERB' },
        { type: 'sp404', title: 'SP-404 Lofi Percussion & FX', tapeLabel: 'PERC & OTHER' },
        { type: 'mixer', title: 'SSL 9000 Master Console', tapeLabel: 'SSL MASTER MIXER' },
      ],
    },
    {
      id: 'reggae',
      name: 'Reggae & Dub Echo Chamber',
      genre: 'Reggae & Dub',
      bpm: 78,
      description: 'Heavy dub sub bass, infinite ping-pong tape delay, Audiomatic phonograph, & SP-404 one-shots.',
      modules: [
        { type: 'subtractor_synth', title: 'Subtractor Heavy Dub Bass', tapeLabel: 'DUB BASS' },
        { type: 'the_echo_delay', title: 'The Echo Tape Delay (110% FB)', tapeLabel: 'DUB ECHO' },
        { type: 'audiomatic_retro', title: 'Audiomatic Phonograph', tapeLabel: 'PHONOGRAPH' },
        { type: 'sp404', title: 'SP-404 Dub One-Shots', tapeLabel: 'ONE-SHOTS' },
      ],
    },
  ];

  // Demo Tracks Data
  const demoTracks = [
    {
      id: 'demo_full_reason_benchmark',
      title: 'Reason Studio Master Song (Drumkit, Melody, Bass, Lead, Vocals & FX)',
      type: 'Full Song (Drumkit, Melody, Bass, Lead, Vocals, FX)',
      bpm: 96,
      presetId: 'reason_benchmark',
      description: 'Full multi-track song featuring Drum Kit, Rhodes Glass Melody, Sub Bass, Thor Lead, Vocal Hook Stems, Scream 4 Distortion & Reverb Risers.',
    },
    {
      id: 'demo_vocals',
      title: 'Neon Nights (R&B Pop - Full Track with Vocals)',
      type: 'Entire Track (With Vocals)',
      bpm: 110,
      presetId: 'r_n_b',
      description: 'Full song complete with female vocal stems, sub bass, Rhodes chords, and 808 drum beat.',
    },
    {
      id: 'demo_instrumental',
      title: 'Velvet Soul (Jazz R&B - Instrumental Track)',
      type: 'Entire Track (No Vocals)',
      bpm: 92,
      presetId: 'jazz_blues',
      description: 'Rich instrumental song featuring electric piano, brass stabs, smooth sub bass, & crisp drums.',
    },
    {
      id: 'demo_loop',
      title: 'Cyber Break (174 BPM Drum \'N\' Bass Loop)',
      type: 'Section Beat Loop',
      bpm: 174,
      presetId: 'drum_n_bass',
      description: 'High-energy 174 BPM drum breakbeat loop with wobble synth bass & tape delay wobble.',
    },
  ];

  // Handle preset change
  const handleApplyPreset = (presetId: string) => {
    const p = presets.find((item) => item.id === presetId);
    if (!p) return;
    setSelectedPreset(presetId);

    const rackItems: RackModuleItem[] = p.modules.map((m, idx) => ({
      id: `${m.type}_preset_${Date.now()}_${idx}`,
      type: m.type,
      title: m.title,
      tapeLabel: m.tapeLabel,
    }));

    onLoadRackPreset(rackItems, p.bpm, p.name);
  };

  // Demo playback loop simulator
  const togglePlayDemo = (demoId: string) => {
    if (activeDemo === demoId && isPlayingDemo) {
      setIsPlayingDemo(false);
      if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
    } else {
      setActiveDemo(demoId);
      setIsPlayingDemo(true);
      setPlaybackProgress(0);

      // Trigger Web Audio tone sequence
      const demoObj = demoTracks.find((d) => d.id === demoId);
      if (demoObj) {
        audioEngine.playSynthTone(220, 'sawtooth', 0.5, 2000);
      }

      if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = setInterval(() => {
        setPlaybackProgress((prev) => {
          if (prev >= 100) return 0;
          return prev + 2;
        });
      }, 300);
    }
  };

  useEffect(() => {
    return () => {
      if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
    };
  }, []);

  const activeDemoObj = demoTracks.find((d) => d.id === activeDemo) || demoTracks[0];

  return (
    <div className="bg-neutral-950 border-b border-neutral-800 p-3 select-none font-mono text-xs text-neutral-200">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Preset Selector Dropdown */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1 shrink-0">
            <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
            DEFAULT RACK SETTINGS / PRESETS:
          </span>

          <select
            value={selectedPreset}
            onChange={(e) => handleApplyPreset(e.target.value)}
            className="bg-neutral-900 text-amber-300 font-bold px-3 py-1.5 rounded-lg border border-amber-500/40 focus:outline-none focus:border-amber-400 cursor-pointer text-xs"
          >
            {presets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.genre} - {p.bpm} BPM)
              </option>
            ))}
          </select>

          <button
            onClick={() => handleApplyPreset(selectedPreset)}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs transition shadow-md shadow-amber-500/20 shrink-0"
          >
            LOAD TEMPLATE
          </button>
        </div>

        {/* Demo Tracks Player Trigger Bar */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1 shrink-0">
            <Music className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            DEMO TRACKS & STEMS:
          </span>

          <button
            onClick={() => setIsDemoBarExpanded(!isDemoBarExpanded)}
            className={`px-3 py-1.5 rounded-lg font-black text-xs transition flex items-center gap-1.5 border ${
              isDemoBarExpanded
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30'
                : 'bg-neutral-900 hover:bg-neutral-800 text-indigo-300 border-neutral-700'
            }`}
          >
            <Disc className={`w-3.5 h-3.5 ${isPlayingDemo ? 'animate-spin' : ''}`} />
            <span>{isDemoBarExpanded ? 'HIDE DEMO PLAYER' : 'PLAY DEMO TRACKS'}</span>
            {isDemoBarExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Demo Tracks Player Box */}
      {isDemoBarExpanded && (
        <div className="mt-3 bg-neutral-900/90 border-2 border-indigo-500/60 rounded-xl p-4 shadow-2xl space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <span className="text-xs font-black text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <Radio className="w-4 h-4 text-indigo-400" />
              INTERACTIVE DEMO TRACKS & STEM PLAYER
            </span>
            <span className="text-[10px] text-neutral-400">
              Listen to full tracks, solos, & load template sounds directly into the studio rack!
            </span>
          </div>

          {/* Demo Selector Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {demoTracks.map((d) => {
              const isThisActive = activeDemo === d.id;
              return (
                <div
                  key={d.id}
                  className={`p-3 rounded-xl border-2 transition flex flex-col justify-between space-y-2 ${
                    isThisActive
                      ? 'bg-neutral-950 border-indigo-400 ring-2 ring-indigo-500/40 shadow-lg'
                      : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-amber-400 uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {d.type}
                    </span>
                    <span className="text-[10px] font-bold text-neutral-400">{d.bpm} BPM</span>
                  </div>

                  <div className="text-xs font-black text-neutral-100">{d.title}</div>
                  <p className="text-[10px] text-neutral-400 leading-tight">{d.description}</p>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => togglePlayDemo(d.id)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 transition ${
                        isThisActive && isPlayingDemo
                          ? 'bg-rose-600 text-white animate-pulse'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      }`}
                    >
                      {isThisActive && isPlayingDemo ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      <span>{isThisActive && isPlayingDemo ? 'PAUSE' : 'PLAY'}</span>
                    </button>

                    <button
                      onClick={() => handleApplyPreset(d.presetId)}
                      className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[10px] font-bold border border-neutral-600 transition"
                    >
                      LOAD RACK
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Demo Track Stem Faders & Realtime Waveform Display */}
          {activeDemo && (
            <div className="bg-black/60 p-3.5 rounded-xl border border-indigo-800/60 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-300">
                <span>NOW PLAYING: {activeDemoObj.title}</span>
                <span className="text-amber-400">{playbackProgress}% COMPLETED</span>
              </div>

              {/* Animated Waveform Display */}
              <div className="h-12 bg-neutral-950 rounded-lg border border-indigo-900/80 p-2 relative overflow-hidden flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 100 24">
                  <path
                    d="M 0,12 Q 10,2 20,12 T 40,22 T 60,4 T 80,18 T 100,12"
                    fill="none"
                    stroke="#818cf8"
                    strokeWidth="2"
                  />
                  {/* Playhead Marker */}
                  <line
                    x1={playbackProgress}
                    y1={0}
                    x2={playbackProgress}
                    y2={24}
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                  />
                </svg>
              </div>

              {/* Stem Faders (Vocals, Synths, Drums, Bass) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-[10px]">
                {/* Vocal Stem */}
                <div className="bg-neutral-900 p-2 rounded-lg border border-neutral-800 space-y-1">
                  <div className="flex justify-between font-bold text-amber-400">
                    <span>VOCAL STEM</span>
                    <span>{Math.round(vocalLevel * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={vocalLevel}
                    onChange={(e) => setVocalLevel(Number(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>

                {/* Synth Stem */}
                <div className="bg-neutral-900 p-2 rounded-lg border border-neutral-800 space-y-1">
                  <div className="flex justify-between font-bold text-purple-400">
                    <span>SYNTH STEM</span>
                    <span>{Math.round(synthLevel * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={synthLevel}
                    onChange={(e) => setSynthLevel(Number(e.target.value))}
                    className="w-full accent-purple-400 cursor-pointer"
                  />
                </div>

                {/* Drum Stem */}
                <div className="bg-neutral-900 p-2 rounded-lg border border-neutral-800 space-y-1">
                  <div className="flex justify-between font-bold text-rose-400">
                    <span>DRUM STEM</span>
                    <span>{Math.round(drumLevel * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={drumLevel}
                    onChange={(e) => setDrumLevel(Number(e.target.value))}
                    className="w-full accent-rose-400 cursor-pointer"
                  />
                </div>

                {/* Bass Stem */}
                <div className="bg-neutral-900 p-2 rounded-lg border border-neutral-800 space-y-1">
                  <div className="flex justify-between font-bold text-emerald-400">
                    <span>BASS STEM</span>
                    <span>{Math.round(bassLevel * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={bassLevel}
                    onChange={(e) => setBassLevel(Number(e.target.value))}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
