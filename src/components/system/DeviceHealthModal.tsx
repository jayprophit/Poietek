import React, { useState } from 'react';
import { ConnectedDevice } from '../../types';
import { audioEngine } from '../../audio/engine';
import { OFFICIAL_DEVICE_PROFILES } from '../../data/deviceProfiles';
import { Activity, Clock, ShieldCheck, Download, Star, RefreshCw } from 'lucide-react';

interface DeviceHealthModalProps {
  connectedDevices: ConnectedDevice[];
}

export const DeviceHealthModal: React.FC<DeviceHealthModalProps> = ({ connectedDevices }) => {
  const [testResults, setTestResults] = useState<Record<string, number>>({});

  const measureLatency = async (devId: string) => {
    const lat = await audioEngine.measureRoundtripLatency();
    setTestResults((prev) => ({ ...prev, [devId]: lat }));
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            Device Health Diagnostics, Latency Map & Profile Library
          </h2>
          <p className="text-xs text-slate-400">
            Per-device latency offset compensation, real-time buffer health monitoring, and verified profile repository.
          </p>
        </div>
      </div>

      {/* Latency & Health Diagnostic List */}
      <div className="bg-slate-950 border-2 border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Connected Devices Health Status
        </h3>

        <div className="space-y-3">
          {connectedDevices.map((dev) => (
            <div
              key={dev.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4"
            >
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  {dev.name}
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </h4>
                <p className="text-xs text-slate-400 font-mono">
                  Port: {dev.portName || 'Virtual USB Simulator'} • Type: {dev.type}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right font-mono">
                  <span className="text-xs text-slate-400 block">Measured Latency</span>
                  <span className="text-sm font-bold text-amber-400">
                    +{testResults[dev.id] || dev.latencyMs} ms
                  </span>
                </div>

                <button
                  onClick={() => measureLatency(dev.id)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Test Buffer</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Community & Official Profiles Repository */}
      <div className="bg-slate-950 border-2 border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-400 fill-current" />
          Verified Official & Community Device Profiles
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {OFFICIAL_DEVICE_PROFILES.map((prof) => (
            <div
              key={prof.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-indigo-400 uppercase">{prof.manufacturer}</span>
                  <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                    <Star className="w-3 h-3 fill-current" />
                    <span>{prof.rating}</span>
                  </div>
                </div>
                <h4 className="text-sm font-bold text-white">{prof.name}</h4>
                <p className="text-xs text-slate-400 mt-1">{prof.description}</p>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span>{prof.controls.length} Controls</span>
                <span className="text-emerald-400 font-semibold">Verified Default</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
