import React, { useState, useEffect } from 'react';
import { audioEngine } from '../../audio/engine';
import {
  Sliders,
  Volume2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Activity,
  Zap,
  Check,
  Disc,
  Radio,
  Sparkles,
  Layers,
  VolumeX,
} from 'lucide-react';
import { TrackChannel } from '../../types';

interface ReasonSSLConsoleProps {
  channels: TrackChannel[];
  setChannels: React.Dispatch<React.SetStateAction<TrackChannel[]>>;
  isDetached: boolean;
  onDetach: () => void;
  onDock: () => void;
}

export const ReasonSSLConsole: React.FC<ReasonSSLConsoleProps> = ({
  channels,
  setChannels,
  isDetached,
  onDetach,
  onDock,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('studio_ssl_console_collapsed');
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  React.useEffect(() => {
    localStorage.setItem('studio_ssl_console_collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);
  const [selectedSection, setSelectedSection] = useState<'all' | 'eq' | 'dyn' | 'sends'>('all');
  const [masterBusCompThreshold, setMasterBusCompThreshold] = useState<number>(-8);
  const [masterBusCompRatio, setMasterBusCompRatio] = useState<number>(4);
  const [masterVolume, setMasterVolume] = useState<number>(0.9);
  const [isMasterMono, setIsMasterMono] = useState<boolean>(false);
  const [isMasterDim, setIsMasterDim] = useState<boolean>(false);
  const [spectrumData, setSpectrumData] = useState<number[]>(Array(16).fill(0));

  useEffect(() => {
    let animId: number;
    const updateSpectrum = () => {
      const data = audioEngine.getAnalyserData();
      if (data && data.length > 0) {
        const sliced: number[] = [];
        const step = Math.floor(data.length / 16) || 1;
        for (let i = 0; i < 16; i++) {
          sliced.push(data[i * step] || 0);
        }
        setSpectrumData(sliced);
      }
      animId = requestAnimationFrame(updateSpectrum);
    };
    updateSpectrum();
    return () => cancelAnimationFrame(animId);
  }, []);

  const updateChannel = (id: string, key: keyof TrackChannel, value: any) => {
    setChannels((prev) =>
      prev.map((ch) => (ch.id === id ? { ...ch, [key]: value } : ch))
    );
  };

  if (isDetached) {
    return (
      <div className="bg-stone-950 border-2 border-dashed border-amber-500/50 rounded-xl p-3 flex items-center justify-between font-mono text-xs text-stone-300 shadow-xl">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="font-black text-amber-400 uppercase tracking-widest">
            SSL 9000 MASTER MIXING CONSOLE (DETACHED TO FLOATING WINDOW)
          </span>
        </div>
        <button
          onClick={onDock}
          className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black rounded-lg text-[10px] flex items-center gap-1 shadow transition"
        >
          <span>DOCK MIXER BACK TO RACK</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-stone-900 via-neutral-950 to-stone-950 border-2 border-stone-800 rounded-xl shadow-2xl font-mono text-xs select-none overflow-hidden">
      {/* Console Top Header Bar */}
      <div className="bg-stone-950 border-b border-stone-800 px-3 py-2 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black bg-emerald-500 text-black px-2 py-0.5 rounded tracking-widest shadow-sm">
            SSL 9000k
          </span>
          <span className="font-black text-stone-200 text-xs tracking-wider">
            ANALOG MASTER MIXING DESK
          </span>
          <span className="hidden lg:inline text-[10px] text-stone-500">
            • 4-BAND EQ • DYNAMICS • AUX SENDS • BUS COMPRESSION
          </span>
        </div>

        {/* Console View Filter Toggles */}
        <div className="flex items-center gap-1 bg-stone-900 p-0.5 rounded-lg border border-stone-800 text-[9px] font-bold">
          <button
            onClick={() => setSelectedSection('all')}
            className={`px-2 py-0.5 rounded transition ${
              selectedSection === 'all'
                ? 'bg-amber-500 text-black font-black'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            FULL STRIP
          </button>
          <button
            onClick={() => setSelectedSection('eq')}
            className={`px-2 py-0.5 rounded transition ${
              selectedSection === 'eq'
                ? 'bg-indigo-600 text-white font-black'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            EQ FOCUS
          </button>
          <button
            onClick={() => setSelectedSection('dyn')}
            className={`px-2 py-0.5 rounded transition ${
              selectedSection === 'dyn'
                ? 'bg-rose-600 text-white font-black'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            DYNAMICS
          </button>
          <button
            onClick={() => setSelectedSection('sends')}
            className={`px-2 py-0.5 rounded transition ${
              selectedSection === 'sends'
                ? 'bg-emerald-600 text-white font-black'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            AUX SENDS
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* SSL G-Master Bus Compressor Meter Preview */}
          <div className="hidden md:flex items-center gap-2 bg-stone-900 px-2.5 py-1 rounded-lg border border-stone-800 text-[10px]">
            <span className="text-stone-400 font-bold">BUS COMP:</span>
            <div className="w-14 h-2.5 bg-stone-950 rounded overflow-hidden p-0.5 border border-stone-800 flex items-center">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 rounded-xs transition-all duration-300"
                style={{ width: `${Math.min(100, Math.abs(masterBusCompThreshold) * 4)}%` }}
              />
            </div>
            <span className="text-amber-400 font-bold">{masterBusCompThreshold}dB</span>
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded text-[10px] font-bold flex items-center gap-1 border border-stone-700 transition"
            title={isCollapsed ? 'Expand SSL Channel Strips' : 'Collapse Mixer to Meter Bridge'}
          >
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            <span>{isCollapsed ? 'EXPAND DESK' : 'FOLD DESK'}</span>
          </button>

          <button
            onClick={onDetach}
            className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500 hover:text-black text-amber-400 rounded text-[10px] font-black flex items-center gap-1 border border-amber-500/40 transition"
            title="Detach SSL Mixer into a floating window"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>DETACH MIXER</span>
          </button>
        </div>
      </div>

      {/* Folded / Collapsed Meter Bridge View */}
      {isCollapsed ? (
        <div className="p-2 bg-stone-950 flex items-center justify-between gap-2 overflow-x-auto text-[10px]">
          {channels.map((ch, idx) => (
            <div
              key={ch.id}
              className="flex-1 min-w-[100px] bg-stone-900 p-2 rounded-lg border border-stone-800 flex items-center justify-between gap-2"
            >
              <div className="truncate">
                <span className="text-[8px] text-stone-500 block font-bold">CH 0{idx + 1}</span>
                <span className="font-bold text-stone-200 truncate block">{ch.name}</span>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] font-black text-amber-400 block">
                  {Math.round(ch.volume * 100)}%
                </span>
                <div className="w-8 h-1.5 bg-stone-950 rounded overflow-hidden mt-0.5">
                  <div
                    className="h-full bg-emerald-400"
                    style={{ width: `${Math.round(ch.volume * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Full SSL Console Channel Strips & Master Section */
        <div className="p-3 bg-stone-950/90 overflow-x-auto scrollbar-thin scrollbar-thumb-stone-800">
          <div className="flex gap-3 min-w-max items-stretch">
            {channels.map((ch, idx) => {
              const gainTrim = ch.gainTrim ?? 0;
              const hpfFreq = ch.hpfFreq ?? 80;
              const hpfEnabled = ch.hpfEnabled ?? true;
              const compThreshold = ch.compThreshold ?? -12;
              const compRatio = ch.compRatio ?? 4;
              const compFastAttack = ch.compFastAttack ?? false;
              const eqIn = ch.eqIn ?? true;
              const phaseInvert = ch.phaseInvert ?? false;
              const sendAux3 = ch.sendAux3 ?? 0.2;
              const busRouting = ch.busRouting ?? 'master';
              const insertBypass = ch.insertBypass ?? false;

              return (
                <div
                  key={ch.id}
                  className="w-36 bg-stone-900/90 border border-stone-800 rounded-xl p-2.5 flex flex-col justify-between items-center gap-2 text-[10px] shadow-lg relative"
                >
                  {/* Channel Header Tape Strip */}
                  <div className="w-full text-center border-b border-stone-800 pb-1.5">
                    <div className="flex items-center justify-between text-[8px] text-stone-400 mb-0.5">
                      <span className="font-bold">CH 0{idx + 1}</span>
                      <button
                        onClick={() => updateChannel(ch.id, 'phaseInvert', !phaseInvert)}
                        className={`px-1 rounded text-[8px] font-black ${
                          phaseInvert ? 'bg-amber-500 text-black' : 'bg-stone-800 text-stone-400'
                        }`}
                        title="Phase Invert (Ø)"
                      >
                        Ø
                      </button>
                    </div>
                    <div
                      className="h-1.5 w-full rounded mt-0.5 mb-1"
                      style={{ backgroundColor: ch.color || '#f59e0b' }}
                    />
                    <h4 className="font-bold text-stone-100 truncate text-[11px]">{ch.name}</h4>
                  </div>

                  {/* 1. PREAMP & HIGH-PASS FILTER SECTION */}
                  {(selectedSection === 'all' || selectedSection === 'dyn') && (
                    <div className="w-full bg-stone-950 p-1.5 rounded-lg border border-stone-850 space-y-1">
                      <div className="flex justify-between items-center text-[8px]">
                        <span className="text-amber-500 font-black uppercase">PREAMP / GAIN</span>
                        <span className="text-stone-400 font-bold">{gainTrim > 0 ? `+${gainTrim}` : gainTrim}dB</span>
                      </div>
                      <input
                        type="range"
                        min="-20"
                        max="20"
                        value={gainTrim}
                        onChange={(e) => updateChannel(ch.id, 'gainTrim', Number(e.target.value))}
                        className="w-full accent-amber-500 h-1 cursor-pointer"
                      />

                      <div className="flex justify-between items-center text-[8px] pt-1">
                        <button
                          onClick={() => updateChannel(ch.id, 'hpfEnabled', !hpfEnabled)}
                          className={`px-1 py-0.5 rounded text-[7px] font-black ${
                            hpfEnabled ? 'bg-emerald-600 text-white' : 'bg-stone-800 text-stone-500'
                          }`}
                        >
                          HPF
                        </button>
                        <span className="text-stone-400 text-[8px]">{hpfFreq}Hz</span>
                      </div>
                      <input
                        type="range"
                        min="18"
                        max="350"
                        value={hpfFreq}
                        onChange={(e) => updateChannel(ch.id, 'hpfFreq', Number(e.target.value))}
                        className="w-full accent-emerald-500 h-1 cursor-pointer"
                        disabled={!hpfEnabled}
                      />
                    </div>
                  )}

                  {/* 2. SSL DYNAMICS SECTION (COMPRESSOR) */}
                  {(selectedSection === 'all' || selectedSection === 'dyn') && (
                    <div className="w-full bg-stone-950 p-1.5 rounded-lg border border-stone-850 space-y-1">
                      <div className="flex justify-between items-center text-[8px]">
                        <span className="text-rose-400 font-black uppercase">DYNAMICS COMP</span>
                        <button
                          onClick={() => updateChannel(ch.id, 'compFastAttack', !compFastAttack)}
                          className={`px-1 py-0.5 rounded text-[7px] font-bold ${
                            compFastAttack ? 'bg-rose-500 text-white' : 'bg-stone-800 text-stone-500'
                          }`}
                        >
                          FAST
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-1 text-[8px] text-stone-400">
                        <div>
                          <span>THRESH:</span>
                          <span className="text-stone-200 block font-bold">{compThreshold}dB</span>
                          <input
                            type="range"
                            min="-30"
                            max="10"
                            value={compThreshold}
                            onChange={(e) => updateChannel(ch.id, 'compThreshold', Number(e.target.value))}
                            className="w-full accent-rose-500 h-1 cursor-pointer"
                          />
                        </div>
                        <div>
                          <span>RATIO:</span>
                          <span className="text-stone-200 block font-bold">{compRatio}:1</span>
                          <input
                            type="range"
                            min="1"
                            max="20"
                            value={compRatio}
                            onChange={(e) => updateChannel(ch.id, 'compRatio', Number(e.target.value))}
                            className="w-full accent-rose-500 h-1 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Gain Reduction Meter */}
                      <div className="w-full bg-stone-900 h-1.5 rounded overflow-hidden flex items-center">
                        <div
                          className="h-full bg-rose-500"
                          style={{ width: `${Math.min(100, Math.abs(compThreshold) * 2.5)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* 3. 4-BAND PARAMETRIC EQ SECTION */}
                  {(selectedSection === 'all' || selectedSection === 'eq') && (
                    <div className="w-full space-y-1 bg-stone-950 p-1.5 rounded-lg border border-stone-850">
                      <div className="flex justify-between items-center text-[8px]">
                        <span className="text-indigo-400 font-black uppercase tracking-wider">
                          4-BAND SSL EQ
                        </span>
                        <button
                          onClick={() => updateChannel(ch.id, 'eqIn', !eqIn)}
                          className={`px-1 py-0.5 rounded text-[7px] font-black ${
                            eqIn ? 'bg-indigo-600 text-white' : 'bg-stone-800 text-stone-500'
                          }`}
                        >
                          {eqIn ? 'IN' : 'BYPASS'}
                        </button>
                      </div>

                      <div className="space-y-1 text-[8px] opacity-100">
                        {/* High EQ */}
                        <div>
                          <div className="flex justify-between text-stone-400">
                            <span>HF 12kHz</span>
                            <span className="text-indigo-300 font-bold">{ch.eqHigh}dB</span>
                          </div>
                          <input
                            type="range"
                            min="-12"
                            max="12"
                            value={ch.eqHigh}
                            onChange={(e) => updateChannel(ch.id, 'eqHigh', Number(e.target.value))}
                            className="w-full accent-indigo-400 h-1 cursor-pointer"
                            disabled={!eqIn}
                          />
                        </div>

                        {/* Mid EQ */}
                        <div>
                          <div className="flex justify-between text-stone-400">
                            <span>HMF 2.5kHz</span>
                            <span className="text-indigo-300 font-bold">{ch.eqMid}dB</span>
                          </div>
                          <input
                            type="range"
                            min="-12"
                            max="12"
                            value={ch.eqMid}
                            onChange={(e) => updateChannel(ch.id, 'eqMid', Number(e.target.value))}
                            className="w-full accent-indigo-500 h-1 cursor-pointer"
                            disabled={!eqIn}
                          />
                        </div>

                        {/* Low EQ */}
                        <div>
                          <div className="flex justify-between text-stone-400">
                            <span>LF 80Hz</span>
                            <span className="text-indigo-300 font-bold">{ch.eqLow}dB</span>
                          </div>
                          <input
                            type="range"
                            min="-12"
                            max="12"
                            value={ch.eqLow}
                            onChange={(e) => updateChannel(ch.id, 'eqLow', Number(e.target.value))}
                            className="w-full accent-indigo-600 h-1 cursor-pointer"
                            disabled={!eqIn}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 4. AUX SENDS & INSERT EFFECTS */}
                  {(selectedSection === 'all' || selectedSection === 'sends') && (
                    <div className="w-full space-y-1 bg-stone-950 p-1.5 rounded-lg border border-stone-850">
                      <div className="flex justify-between items-center text-[8px]">
                        <span className="text-emerald-400 font-black uppercase">AUX SENDS</span>
                        <button
                          onClick={() => updateChannel(ch.id, 'insertBypass', !insertBypass)}
                          className={`px-1 py-0.5 rounded text-[7px] font-bold ${
                            !insertBypass ? 'bg-amber-500 text-black' : 'bg-stone-800 text-stone-500'
                          }`}
                        >
                          INS
                        </button>
                      </div>

                      {/* Aux 1 Reverb */}
                      <div>
                        <div className="flex justify-between text-[8px] text-stone-400">
                          <span>AUX 1 (REVERB)</span>
                          <span className="text-emerald-400 font-bold">{Math.round((ch.sendReverb ?? 0.3) * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={ch.sendReverb ?? 0.3}
                          onChange={(e) => updateChannel(ch.id, 'sendReverb', Number(e.target.value))}
                          className="w-full accent-emerald-500 h-1 cursor-pointer"
                        />
                      </div>

                      {/* Aux 2 Delay */}
                      <div>
                        <div className="flex justify-between text-[8px] text-stone-400">
                          <span>AUX 2 (DELAY)</span>
                          <span className="text-emerald-400 font-bold">{Math.round((ch.sendDelay ?? 0.2) * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={ch.sendDelay ?? 0.2}
                          onChange={(e) => updateChannel(ch.id, 'sendDelay', Number(e.target.value))}
                          className="w-full accent-emerald-500 h-1 cursor-pointer"
                        />
                      </div>
                    </div>
                  )}

                  {/* 5. BUS ROUTING & PAN KNOB */}
                  <div className="w-full bg-stone-950 p-1.5 rounded-lg border border-stone-850 space-y-1">
                    <div className="flex justify-between items-center text-[8px]">
                      <span className="text-stone-400 font-bold">BUS ROUTE</span>
                      <div className="flex gap-0.5">
                        <button
                          onClick={() => updateChannel(ch.id, 'busRouting', 'master')}
                          className={`px-1 py-0.5 rounded text-[7px] font-black ${
                            busRouting === 'master' ? 'bg-amber-500 text-black' : 'bg-stone-800 text-stone-500'
                          }`}
                        >
                          MST
                        </button>
                        <button
                          onClick={() => updateChannel(ch.id, 'busRouting', 'bus12')}
                          className={`px-1 py-0.5 rounded text-[7px] font-black ${
                            busRouting === 'bus12' ? 'bg-amber-500 text-black' : 'bg-stone-800 text-stone-500'
                          }`}
                        >
                          1-2
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[8px] text-stone-400 pt-0.5">
                      <span>PAN</span>
                      <span className="text-stone-200 font-bold">
                        {ch.pan === 0 ? 'C' : ch.pan < 0 ? `L${Math.abs(Math.round(ch.pan * 50))}` : `R${Math.round(ch.pan * 50)}`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-1"
                      max="1"
                      step="0.05"
                      value={ch.pan}
                      onChange={(e) => updateChannel(ch.id, 'pan', Number(e.target.value))}
                      className="w-full accent-amber-400 h-1 cursor-pointer"
                    />
                  </div>

                  {/* Mute & Solo Buttons */}
                  <div className="grid grid-cols-2 gap-1 w-full">
                    <button
                      onClick={() => updateChannel(ch.id, 'mute', !ch.mute)}
                      className={`py-1 rounded text-[9px] font-black transition ${
                        ch.mute
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                          : 'bg-stone-800 text-stone-400 hover:text-white'
                      }`}
                    >
                      MUTE
                    </button>
                    <button
                      onClick={() => updateChannel(ch.id, 'solo', !ch.solo)}
                      className={`py-1 rounded text-[9px] font-black transition ${
                        ch.solo
                          ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                          : 'bg-stone-800 text-stone-400 hover:text-white'
                      }`}
                    >
                      SOLO
                    </button>
                  </div>

                  {/* Vertical Volume Fader + LED Level Meter Ladder */}
                  <div className="flex items-center gap-2 h-28 my-1 bg-stone-950 p-1.5 rounded-lg border border-stone-850 w-full justify-center">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={ch.volume}
                      onChange={(e) => updateChannel(ch.id, 'volume', Number(e.target.value))}
                      className="h-24 accent-amber-500 cursor-pointer [writing-mode:vertical-lr] [direction:rtl]"
                    />
                    {/* Dual Stereo LED Meter Bar */}
                    <div className="w-2.5 h-24 bg-stone-900 rounded border border-stone-800 flex flex-col justify-end p-0.5 overflow-hidden">
                      <div
                        className="w-full bg-gradient-to-t from-emerald-500 via-amber-400 to-rose-500 rounded-xs transition-all duration-75"
                        style={{ height: `${Math.min(100, Math.round(ch.volume * 100))}%` }}
                      />
                    </div>
                  </div>

                  <span className="text-[10px] font-black text-amber-400">
                    {Math.round(ch.volume * 100)}%
                  </span>
                </div>
              );
            })}

            {/* SSL MASTER BUS SECTION (FAR RIGHT) */}
            <div className="w-40 bg-stone-950 border-2 border-emerald-500/40 rounded-xl p-2.5 flex flex-col justify-between items-center gap-2 text-[10px] shadow-2xl">
              <div className="w-full text-center border-b border-stone-800 pb-1">
                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest block">
                  SSL MASTER SECTION
                </span>
                <h4 className="font-black text-white text-xs mt-0.5">STEREO BUS</h4>
              </div>

              {/* Real-time FFT Audio Spectrum Analyzer */}
              <div className="w-full bg-stone-900/90 border border-stone-800 rounded-lg p-1.5 space-y-1">
                <div className="flex justify-between items-center text-[8px] font-black text-emerald-400 uppercase">
                  <span>SPECTRUM FFT</span>
                  <span>-14 LUFS</span>
                </div>
                <div className="h-10 bg-black rounded p-0.5 flex items-end justify-between gap-0.5 border border-stone-850 overflow-hidden">
                  {spectrumData.map((val, idx) => (
                    <div
                      key={idx}
                      className="flex-1 bg-gradient-to-t from-emerald-500 via-amber-400 to-rose-500 rounded-xs transition-all duration-75"
                      style={{ height: `${Math.max(8, Math.min(100, Math.round((val / 255) * 100)))}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* SSL G-Master Bus Compressor Controls */}
              <div className="w-full bg-stone-900 p-2 rounded-lg border border-stone-800 space-y-1.5">
                <span className="text-[8px] font-black text-amber-400 block text-center uppercase tracking-wider">
                  BUS COMPRESSOR
                </span>

                <div>
                  <div className="flex justify-between text-[8px] text-stone-400">
                    <span>THRESHOLD</span>
                    <span className="text-amber-400 font-bold">{masterBusCompThreshold}dB</span>
                  </div>
                  <input
                    type="range"
                    min="-20"
                    max="10"
                    value={masterBusCompThreshold}
                    onChange={(e) => setMasterBusCompThreshold(Number(e.target.value))}
                    className="w-full accent-amber-500 h-1 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[8px] text-stone-400">
                    <span>RATIO</span>
                    <span className="text-amber-400 font-bold">{masterBusCompRatio}:1</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="10"
                    step="2"
                    value={masterBusCompRatio}
                    onChange={(e) => setMasterBusCompRatio(Number(e.target.value))}
                    className="w-full accent-amber-500 h-1 cursor-pointer"
                  />
                </div>
              </div>

              {/* Master Control Switches */}
              <div className="grid grid-cols-2 gap-1 w-full">
                <button
                  onClick={() => setIsMasterMono(!isMasterMono)}
                  className={`py-1 rounded text-[8px] font-black transition ${
                    isMasterMono ? 'bg-amber-500 text-black' : 'bg-stone-900 text-stone-400 hover:text-white'
                  }`}
                >
                  MONO
                </button>
                <button
                  onClick={() => setIsMasterDim(!isMasterDim)}
                  className={`py-1 rounded text-[8px] font-black transition ${
                    isMasterDim ? 'bg-rose-600 text-white' : 'bg-stone-900 text-stone-400 hover:text-white'
                  }`}
                >
                  DIM
                </button>
              </div>

              {/* Master Volume Fader & L/R Meter */}
              <div className="flex items-center gap-2 h-28 my-1 bg-stone-900 p-1.5 rounded-lg border border-stone-800 w-full justify-center">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={masterVolume}
                  onChange={(e) => setMasterVolume(Number(e.target.value))}
                  className="h-24 accent-emerald-500 cursor-pointer [writing-mode:vertical-lr] [direction:rtl]"
                />
                <div className="flex gap-0.5 h-24 bg-stone-950 p-0.5 rounded border border-stone-800">
                  <div className="w-1.5 h-full bg-stone-900 rounded-xs overflow-hidden flex flex-col justify-end">
                    <div
                      className="w-full bg-gradient-to-t from-emerald-500 via-amber-400 to-rose-500"
                      style={{ height: `${Math.min(100, Math.round(masterVolume * 100))}%` }}
                    />
                  </div>
                  <div className="w-1.5 h-full bg-stone-900 rounded-xs overflow-hidden flex flex-col justify-end">
                    <div
                      className="w-full bg-gradient-to-t from-emerald-500 via-amber-400 to-rose-500"
                      style={{ height: `${Math.min(100, Math.round(masterVolume * 98))}%` }}
                    />
                  </div>
                </div>
              </div>

              <span className="text-[10px] font-black text-emerald-400">
                MASTER {Math.round(masterVolume * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
