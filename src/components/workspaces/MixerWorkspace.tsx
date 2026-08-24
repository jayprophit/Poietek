import React from 'react';
import { TrackChannel } from '../../types';
import { Sliders, Volume2, Mic, Music2, Disc } from 'lucide-react';

interface MixerWorkspaceProps {
  channels: TrackChannel[];
  setChannels: React.Dispatch<React.SetStateAction<TrackChannel[]>>;
}

export const MixerWorkspace: React.FC<MixerWorkspaceProps> = ({ channels, setChannels }) => {
  const updateChannel = (id: string, key: keyof TrackChannel, value: any) => {
    setChannels((prev) =>
      prev.map((ch) => (ch.id === id ? { ...ch, [key]: value } : ch))
    );
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      {/* Mixer Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            Studio Mixing Console & Surface Control
          </h2>
          <p className="text-xs text-slate-400">
            8 Track DAW Mixer Console with 3-band parametric EQ, sends, mute, solo, and physical surface binding.
          </p>
        </div>
      </div>

      {/* Mixer Channel Strips Rack */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 bg-slate-950 p-4 rounded-3xl border-2 border-slate-800 shadow-2xl">
        {channels.map((ch, idx) => (
          <div
            key={ch.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between items-center space-y-3"
          >
            {/* Channel Name Header */}
            <div className="w-full text-center border-b border-slate-800 pb-2">
              <span className="text-[10px] font-mono text-slate-500 block uppercase">CH 0{idx + 1}</span>
              <h3 className="text-xs font-bold text-white truncate mt-0.5">{ch.name}</h3>
            </div>

            {/* EQ Controls */}
            <div className="w-full space-y-2 bg-slate-950 p-2 rounded-xl border border-slate-850">
              <div>
                <label className="text-[9px] font-mono text-slate-400 block text-center">HI ({ch.eqHigh}dB)</label>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="1"
                  value={ch.eqHigh}
                  onChange={(e) => updateChannel(ch.id, 'eqHigh', Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer h-1"
                />
              </div>

              <div>
                <label className="text-[9px] font-mono text-slate-400 block text-center">MID ({ch.eqMid}dB)</label>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="1"
                  value={ch.eqMid}
                  onChange={(e) => updateChannel(ch.id, 'eqMid', Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer h-1"
                />
              </div>

              <div>
                <label className="text-[9px] font-mono text-slate-400 block text-center">LOW ({ch.eqLow}dB)</label>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="1"
                  value={ch.eqLow}
                  onChange={(e) => updateChannel(ch.id, 'eqLow', Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer h-1"
                />
              </div>
            </div>

            {/* Mute & Solo Buttons */}
            <div className="grid grid-cols-2 gap-1 w-full">
              <button
                onClick={() => updateChannel(ch.id, 'mute', !ch.mute)}
                className={`py-1 text-[10px] font-bold rounded-lg transition ${
                  ch.mute
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                MUTE
              </button>
              <button
                onClick={() => updateChannel(ch.id, 'solo', !ch.solo)}
                className={`py-1 text-[10px] font-bold rounded-lg transition ${
                  ch.solo
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                SOLO
              </button>
            </div>

            {/* Volume Fader */}
            <div className="flex flex-col items-center gap-1 my-2">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={ch.volume}
                onChange={(e) => updateChannel(ch.id, 'volume', Number(e.target.value))}
                className="h-32 accent-indigo-500 cursor-pointer [writing-mode:vertical-lr] [direction:rtl]"
              />
              <span className="text-[10px] font-mono font-bold text-indigo-300 mt-1">
                {Math.round(ch.volume * 100)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
