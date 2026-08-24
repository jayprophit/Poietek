import React, { useEffect, useMemo, useState } from 'react';
import { ConnectedDevice } from '../../types';
import { OFFICIAL_DEVICE_PROFILES } from '../../data/deviceProfiles';
import { midiManager } from '../../midi/manager';
import { Activity, Clock, ShieldCheck, Star } from 'lucide-react';

interface DeviceHealthModalProps {
  connectedDevices: ConnectedDevice[];
}

export const DeviceHealthModal: React.FC<DeviceHealthModalProps> = ({ connectedDevices }) => {
  const [midiState, setMIDIState] = useState(() => midiManager.getStateSnapshot());

  useEffect(() => midiManager.subscribeState(setMIDIState), []);

  const displayedDevices = useMemo(() => {
    // Web MIDI and simulator lifecycle belongs to MIDIManager. Preserve any future
    // native/network devices supplied by the parent without retaining stale ports.
    const nonWebDevices = connectedDevices.filter(
      (device) => device.type !== 'web_midi' && device.type !== 'virtual_sim'
    );
    return [...nonWebDevices, ...midiState.connectedDevices];
  }, [connectedDevices, midiState.connectedDevices]);

  const capabilityTone =
    midiState.capability.status === 'available'
      ? 'border-emerald-800/70 bg-emerald-950/30 text-emerald-300'
      : midiState.capability.status === 'error'
        ? 'border-red-800/70 bg-red-950/30 text-red-300'
        : midiState.capability.status === 'denied' ||
            midiState.capability.status === 'unsupported'
          ? 'border-amber-800/70 bg-amber-950/30 text-amber-300'
          : 'border-slate-700 bg-slate-900 text-slate-300';

  const latencyLabel = (device: ConnectedDevice): string => {
    const measurement = device.latencyMeasurement;
    if (
      measurement?.status === 'measured' &&
      typeof measurement.roundTripMs === 'number' &&
      Number.isFinite(measurement.roundTripMs)
    ) {
      return `${measurement.roundTripMs.toFixed(1)} ms`;
    }
    if (measurement?.status === 'unsupported') return 'Not applicable';
    if (measurement?.status === 'error') return 'Measurement error';
    return 'Not measured';
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            Device Discovery, Capability Status & Profile Library
          </h2>
          <p className="text-xs text-slate-400">
            Honest MIDI availability, connected-port state, and bundled mapping profiles. Latency is shown only after a real measurement.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            midiState.simulatedDevicesEnabled
              ? midiManager.disableSimulatedDevices()
              : midiManager.enableSimulatedDevices()
          }
          className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
        >
          {midiState.simulatedDevicesEnabled ? 'Disable Simulators' : 'Enable Simulators'}
        </button>
      </div>

      <div className={`border rounded-2xl p-4 ${capabilityTone}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wide">
            MIDI: {midiState.capability.status.replace('_', ' ')}
          </span>
          <span className="text-[11px] font-mono">
            SysEx: {midiState.capability.sysex.replace('_', ' ')}
          </span>
        </div>
        <p className="text-xs mt-1 opacity-90">{midiState.capability.message}</p>
        {midiState.capability.errorName && (
          <p className="text-[11px] font-mono mt-1 opacity-75">
            Runtime error: {midiState.capability.errorName}
          </p>
        )}
      </div>

      {/* Latency & Health Diagnostic List */}
      <div className="bg-slate-950 border-2 border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Connected Devices Health Status
        </h3>

        <div className="space-y-3">
          {displayedDevices.length === 0 && (
            <div className="bg-slate-900 border border-dashed border-slate-700 rounded-2xl p-6 text-center">
              <p className="text-sm text-slate-300">No MIDI input devices are connected.</p>
              <p className="text-xs text-slate-500 mt-1">
                Simulators remain off until you enable them explicitly.
              </p>
            </div>
          )}

          {displayedDevices.map((dev) => (
            <div
              key={dev.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4"
            >
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  {dev.name}
                  <span
                    className={`w-2 h-2 rounded-full ${dev.connected ? 'bg-emerald-400' : 'bg-slate-500'}`}
                  />
                </h4>
                <p className="text-xs text-slate-400 font-mono">
                  Port:{' '}
                  {dev.portName ||
                    (dev.type === 'virtual_sim' ? 'Opt-in simulator' : 'Unnamed input')}{' '}
                  • Type: {dev.type}
                </p>
                {dev.profileMatch === 'name_hint' && (
                  <p className="text-[11px] text-amber-400/80 mt-1">
                    Suggested profile: {dev.suggestedProfileId || 'unknown'} (port-name hint
                    only; capabilities are not verified).
                  </p>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right font-mono">
                  <span className="text-xs text-slate-400 block">Round-trip Latency</span>
                  <span className="text-sm font-bold text-amber-400">{latencyLabel(dev)}</span>
                </div>

                <button
                  type="button"
                  disabled
                  title="A calibrated physical loopback measurement is not implemented yet."
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-500 text-xs font-bold flex items-center gap-1.5 cursor-not-allowed"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Loopback Required</span>
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
          Bundled Device Profile Starting Points
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {OFFICIAL_DEVICE_PROFILES.map((prof) => (
            <div
              key={prof.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-mono text-indigo-400 uppercase">{prof.manufacturer}</span>
                  <span className="text-[10px] text-slate-500 uppercase">
                    {prof.isBuiltIn ? 'Bundled' : 'Imported'}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">{prof.name}</h4>
                <p className="text-xs text-slate-400 mt-1">{prof.description}</p>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span>{prof.controls.length} Controls</span>
                <span className="text-amber-400 font-semibold">Review before use</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
