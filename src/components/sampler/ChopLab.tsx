import React, { useState } from 'react';
import { SamplePad } from '../../types';
import { audioEngine } from '../../audio/engine';
import { Scissors, Play, Grid, RefreshCw, Volume2, Music } from 'lucide-react';

interface ChopLabProps {
  pads: SamplePad[];
  setPads: React.Dispatch<React.SetStateAction<SamplePad[]>>;
}

export const ChopLab: React.FC<ChopLabProps> = ({ pads, setPads }) => {
  const [sliceCount, setSliceCount] = useState<number>(16);
  const [pitch, setPitch] = useState<number>(0);
  const [reverse, setReverse] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Sample loaded. Choose slice count and assign to Canvas Grid pads.');

  const handleApplyChopToPads = () => {
    setPads((prev) =>
      prev.map((pad, idx) => {
        if (idx < sliceCount) {
          const sliceOffsetStart = idx / sliceCount;
          const sliceOffsetEnd = (idx + 1) / sliceCount;
          return {
            ...pad,
            startOffset: sliceOffsetStart,
            endOffset: sliceOffsetEnd,
            pitch,
          };
        }
        return pad;
      })
    );
    setStatusMessage(`Successfully chopped sample into ${sliceCount} slices and mapped across Bank A Pads!`);
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Scissors className="w-5 h-5 text-indigo-400" />
            Chop Lab & Sample Stem Slicer
          </h2>
          <p className="text-xs text-slate-400">
          Automated transient and equal-region sample chopping directly onto Canvas Grid and Grain Deck pads.
          </p>
        </div>

        <button
          onClick={handleApplyChopToPads}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-indigo-600/30"
        >
          CHOP & MAP TO PADS
        </button>
      </div>

      <div className="bg-slate-950 border-2 border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
        {/* Waveform Visualization Box */}
        <div className="bg-slate-900 border-2 border-indigo-500/40 rounded-2xl p-6 relative h-40 flex items-center justify-center overflow-hidden">
          <div className="w-full flex items-center justify-between gap-1 opacity-80">
            {Array.from({ length: 64 }).map((_, i) => (
              <div
                key={i}
                style={{ height: `${Math.sin(i * 0.3) * 40 + 50}%` }}
                className={`w-1.5 rounded-full ${
                  i % (64 / sliceCount) === 0 ? 'bg-amber-400' : 'bg-indigo-500'
                }`}
              />
            ))}
          </div>
          <span className="absolute bottom-2 right-3 text-[10px] font-mono text-amber-300 font-bold">
            {sliceCount} SLICE MARKERS ACTIVE
          </span>
        </div>

        {/* Chop Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Equal Slice Regions</label>
            <div className="flex gap-2">
              {[4, 8, 16, 32].map((cnt) => (
                <button
                  key={cnt}
                  onClick={() => setSliceCount(cnt)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    sliceCount === cnt
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {cnt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Global Sample Pitch ({pitch} st)</label>
            <input
              type="range"
              min="-12"
              max="12"
              value={pitch}
              onChange={(e) => setPitch(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <span className="text-xs font-bold text-slate-300">Reverse Sample</span>
            <button
              onClick={() => setReverse(!reverse)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                reverse ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {reverse ? 'REVERSE ON' : 'NORMAL'}
            </button>
          </div>
        </div>

        <p className="text-xs font-mono text-emerald-400 bg-emerald-950/60 p-3 rounded-xl border border-emerald-500/30">
          {statusMessage}
        </p>
      </div>
    </div>
  );
};
