import React, { useState } from 'react';
import { audioEngine } from '../../audio/engine';
import { Radio, Mic, Activity, ArrowRight, CheckCircle, Disc } from 'lucide-react';

export const PatchBayWorkspace: React.FC = () => {
  const [recordingStatus, setRecordingStatus] = useState<string>('Idle');
  const [isRecording, setIsRecording] = useState<boolean>(false);

  const inputs = [
    { id: 'in_1', name: 'Input 1 (Mic XLR / Instrument)', type: 'mic', active: true, gain: 0.8, targetTrack: 'Vocal Track' },
    { id: 'in_2', name: 'Input 2 (Guitar Hi-Z Line)', type: 'instrument', active: true, gain: 0.7, targetTrack: 'Bass Synth Track' },
    { id: 'in_3', name: 'Input 3/4 (Grain Deck Stereo Line)', type: 'line', active: true, gain: 0.9, targetTrack: 'Sampler Track' },
    { id: 'in_4', name: 'Input 5/6 (E-Drum Kit L/R)', type: 'line', active: false, gain: 0.5, targetTrack: 'Drum Track' },
  ];

  const handleToggleRecordMicrophone = async () => {
    if (!isRecording) {
      const ok = await audioEngine.startAudioRecording();
      if (ok) {
        setIsRecording(true);
        setRecordingStatus('Recording Live Input...');
      } else {
        setRecordingStatus('Microphone permission required or restricted in frame.');
      }
    } else {
      setRecordingStatus('Processing recorded sample...');
      const buffer = await audioEngine.stopAudioRecording();
      setIsRecording(false);
      if (buffer) {
        audioEngine.registerCustomSample('user_rec_sample', buffer);
    setRecordingStatus('Live sample captured. Sent to Chop Lab and Canvas Pad A01.');
      } else {
        setRecordingStatus('Recording completed.');
      }
    }
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      {/* Patch Bay Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-indigo-400" />
            Audio Interface Patch Bay & Live Capture
          </h2>
          <p className="text-xs text-slate-400">
            Visual matrix routing external inputs (XLR Mic, Synths, Vinyl, Line) to software tracks.
          </p>
        </div>

        {/* Live Capture Button */}
        <button
          onClick={handleToggleRecordMicrophone}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg ${
            isRecording
              ? 'bg-rose-600 text-white animate-pulse shadow-rose-600/40'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
          }`}
        >
          <Mic className="w-4 h-4" />
          <span>{isRecording ? 'STOP CAPTURE' : 'CAPTURE LIVE SAMPLE'}</span>
        </button>
      </div>

      {recordingStatus !== 'Idle' && (
        <div className="bg-indigo-950/80 border border-indigo-500/30 rounded-xl p-3 text-xs font-mono text-indigo-300 flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-400 animate-spin" />
          <span>{recordingStatus}</span>
        </div>
      )}

      {/* Visual Patch Bay Flow Nodes */}
      <div className="bg-slate-950 border-2 border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4">
          Hardware Inputs Routing Matrix
        </h3>

        <div className="space-y-3">
          {inputs.map((inp) => (
            <div
              key={inp.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{inp.name}</h4>
                  <span className="text-[10px] text-slate-500 font-mono">Type: {inp.type.toUpperCase()}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <ArrowRight className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                  Routed to {inp.targetTrack}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">Gain:</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  defaultValue={inp.gain}
                  className="w-24 accent-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
