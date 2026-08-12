import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  Disc,
  Sparkles,
  Cloud,
  Check,
  Award,
  Music,
  Sliders,
  X,
  Edit3,
  HardDrive,
  Save,
  Radio,
  Key,
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  rackModuleCount: number;
  bpm: number;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  rackModuleCount,
  bpm,
}) => {
  const [producerName, setProducerName] = useState<string>(() => {
    return localStorage.getItem('studio_producer_name') || 'JProphit Producer';
  });
  const [studioBio, setStudioBio] = useState<string>(() => {
    return (
      localStorage.getItem('studio_producer_bio') ||
      'Multi-genre electronic music producer, sound designer & audio engineer.'
    );
  });
  const [isCloudSyncEnabled, setIsCloudSyncEnabled] = useState<boolean>(true);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSaveProfile = () => {
    localStorage.setItem('studio_producer_name', producerName);
    localStorage.setItem('studio_producer_bio', studioBio);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150] flex items-center justify-center p-4 font-mono text-xs select-none animate-in fade-in duration-200">
      <div className="bg-neutral-950 border-2 border-amber-500/60 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-neutral-900 via-amber-950/40 to-neutral-900 border-b border-neutral-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-neutral-950 flex items-center justify-center shadow-lg font-black text-lg">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                PRODUCER PROFILE & STUDIO ID
                <span className="bg-amber-500/20 text-amber-400 text-[10px] px-2 py-0.5 rounded border border-amber-500/40 font-bold">
                  PRO UNLIMITED
                </span>
              </h2>
              <span className="text-[10px] text-neutral-400">
                REASON STUDIO DAW ACCOUNT • CLOUD PRESETS & AUTHENTICATION
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh] scrollbar-thin scrollbar-thumb-neutral-800">
          {/* User Bio Card */}
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-neutral-200 text-xs">VERIFIED STUDIO LICENSE</span>
              </div>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/40 font-bold">
                ACTIVE • REASON V12 SUITE
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">
                  PRODUCER / ARTIST NAME
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={producerName}
                    onChange={(e) => setProducerName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-amber-400 font-bold focus:border-amber-500 focus:outline-none"
                  />
                  <Edit3 className="w-3.5 h-3.5 text-neutral-500 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">
                  STUDIO REGION & CLOUD NODE
                </label>
                <div className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-stone-300 flex items-center justify-between">
                  <span>US-WEST-01 (DSP LOW LATENCY)</span>
                  <Cloud className="w-3.5 h-3.5 text-sky-400" />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">
                ARTIST BIO & PRODUCTION NOTES
              </label>
              <textarea
                value={studioBio}
                onChange={(e) => setStudioBio(e.target.value)}
                rows={2}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-neutral-200 font-sans text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Producer Studio Stats */}
          <div>
            <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-2">
              REAL-TIME SESSION DIAGNOSTICS & TELEMETRY
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-neutral-900/60 border border-neutral-800 p-3 rounded-xl text-center">
                <Music className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                <span className="text-[9px] text-neutral-500 font-bold block">ACTIVE RACK UNITS</span>
                <span className="text-base font-black text-white">{rackModuleCount}</span>
              </div>

              <div className="bg-neutral-900/60 border border-neutral-800 p-3 rounded-xl text-center">
                <Radio className="w-4 h-4 text-sky-400 mx-auto mb-1" />
                <span className="text-[9px] text-neutral-500 font-bold block">TEMPO BPM</span>
                <span className="text-base font-black text-sky-400">{bpm}</span>
              </div>

              <div className="bg-neutral-900/60 border border-neutral-800 p-3 rounded-xl text-center">
                <HardDrive className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <span className="text-[9px] text-neutral-500 font-bold block">AUTOSAVE ENGINE</span>
                <span className="text-base font-black text-emerald-400">ACTIVE</span>
              </div>

              <div className="bg-neutral-900/60 border border-neutral-800 p-3 rounded-xl text-center">
                <Award className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                <span className="text-[9px] text-neutral-500 font-bold block">LICENSE STATUS</span>
                <span className="text-xs font-black text-purple-400 mt-1 block">FULL PRO</span>
              </div>
            </div>
          </div>

          {/* Cloud Sync Settings */}
          <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Cloud className="w-5 h-5 text-sky-400" />
              <div>
                <span className="font-bold text-neutral-200 block text-xs">
                  AUTOMATIC CLOUD PRESET SYNCHRONIZATION
                </span>
                <span className="text-[10px] text-neutral-400">
                  Automatically backs up rack configurations, SSL mixer states, and custom song files.
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsCloudSyncEnabled(!isCloudSyncEnabled)}
              className={`w-12 h-6 rounded-full transition relative p-0.5 border ${
                isCloudSyncEnabled ? 'bg-amber-500 border-amber-400' : 'bg-neutral-800 border-neutral-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-neutral-950 transition-transform ${
                  isCloudSyncEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-neutral-900 border-t border-neutral-800 p-4 flex items-center justify-between">
          <span className="text-[10px] text-neutral-500">
            PRODUCER ID: <strong className="text-stone-300">#STUDIO-PRO-88912</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl font-bold transition"
            >
              CLOSE
            </button>
            <button
              onClick={handleSaveProfile}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl font-black transition flex items-center gap-2 shadow-lg"
            >
              {savedSuccess ? <Check className="w-4 h-4 text-emerald-950" /> : <Save className="w-4 h-4" />}
              <span>{savedSuccess ? 'PROFILE SAVED!' : 'SAVE CHANGES'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
