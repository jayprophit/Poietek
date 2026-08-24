import React, { useState, useEffect } from 'react';
import { ConnectedDevice, ControlMapping, DeviceControl, MIDILogEvent } from '../../types';
import { midiManager } from '../../midi/manager';
import { Cpu, Zap, CheckCircle2, AlertTriangle, Play, HelpCircle, Activity } from 'lucide-react';

interface UniversalHardwareMapperProps {
  connectedDevices: ConnectedDevice[];
  onSimulateMIDI: (type: 'note_on' | 'note_off' | 'cc', channel: number, number: number, value: number) => void;
}

export const UniversalHardwareMapper: React.FC<UniversalHardwareMapperProps> = ({
  connectedDevices,
  onSimulateMIDI,
}) => {
  const [activeTab, setActiveTab] = useState<'click_move' | 'learning_wizard' | 'mappings_list' | 'tester'>('click_move');
  const [learningStep, setLearningStep] = useState<number>(0);
  const [learnedControls, setLearnedControls] = useState<DeviceControl[]>([]);
  const [isLearningActive, setIsLearningActive] = useState<boolean>(false);
  const [eventLogs, setEventLogs] = useState<MIDILogEvent[]>([]);
  const [testLogMessage, setTestLogMessage] = useState<string>('Operate any connected controller to test incoming signals...');

  // Mappings list state
  const [mappings, setMappings] = useState<ControlMapping[]>([
    { id: 'map_1', sourceDeviceId: 'virt_mpc_01', sourceControlId: 'Pad A01', targetLogicalId: 'MPC Pad A01 (Kick)' },
    { id: 'map_2', sourceDeviceId: 'virt_mpc_01', sourceControlId: 'Q-Link 1', targetLogicalId: 'Synth Filter Cutoff' },
    { id: 'map_3', sourceDeviceId: 'virt_keys_01', sourceControlId: 'Key C4 (#60)', targetLogicalId: 'Logical Piano Key C4' },
    { id: 'map_4', sourceDeviceId: 'virt_sp_01', sourceControlId: 'Pad 01', targetLogicalId: 'SP-404 Sample 01' },
  ]);

  useEffect(() => {
    const unsub = midiManager.subscribe((device, type, channel, number, value) => {
      setTestLogMessage(`[${device.name}] ${type.toUpperCase()} | Ch: ${channel} | Num: ${number} | Val: ${value}`);
      setEventLogs(midiManager.getEventLogs());
    });
    return () => unsub();
  }, []);

  const wizardSteps = [
    'Press Pad 1 on your controller',
    'Press Pad 2 on your controller',
    'Turn Knob 1 on your controller',
    'Move Fader 1 on your controller',
    'Press Play / Transport button',
  ];

  const handleStartLearnStep = () => {
    setIsLearningActive(true);
    midiManager.startLearning((control) => {
      setLearnedControls((prev) => [...prev, control]);
      setIsLearningActive(false);
      setLearningStep((prev) => prev + 1);
    });
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            Universal Hardware Mapper Engine
          </h2>
          <p className="text-xs text-slate-400">
            Instant Click → Move → Done MIDI mapping, Smart Auto-Mapper, Conflict Resolver, and Device Learner.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          {[
            { id: 'click_move', label: 'Click → Move → Done' },
            { id: 'learning_wizard', label: 'Device Learn Wizard' },
            { id: 'mappings_list', label: 'Active Mappings' },
            { id: 'tester', label: 'Mapping Tester' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Click -> Move -> Done Console */}
      {activeTab === 'click_move' && (
        <div className="bg-slate-950 border-2 border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
          <div className="bg-indigo-950/60 border border-indigo-500/30 rounded-2xl p-4 flex items-center gap-3">
            <Zap className="w-6 h-6 text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Click → Move → Done Mapping Protocol</h3>
              <p className="text-xs text-indigo-200">
                1. Select software parameter below → 2. Turn or hit physical hardware control → 3. Mapping is saved automatically!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { target: 'Filter Cutoff Knob', current: 'Q-Link 1 (CC #16)' },
              { target: 'Master Volume Fader', current: 'Fader 1 (CC #7)' },
              { target: 'MPC Pad A01 Trigger', current: 'MIDI Note #36 (Pad 1)' },
              { target: 'SP-404 Sample Pad 01', current: 'MIDI Note #48 (Pad 1)' },
              { target: 'Transport Play Button', current: 'CC #118' },
              { target: 'E-Drum Snare Trigger', current: 'MIDI Note #38' },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3"
              >
                <div>
                  <span className="text-[10px] font-mono text-indigo-400 block uppercase">TARGET PARAMETER</span>
                  <h4 className="text-sm font-bold text-white">{item.target}</h4>
                </div>

                <div className="bg-slate-950 p-2 rounded-xl border border-slate-850 flex items-center justify-between">
                  <span className="text-xs font-mono text-emerald-400">{item.current}</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>

                <button
                  onClick={() => {
                    onSimulateMIDI('cc', 1, 16 + i, 127);
                    alert(`Mapped ${item.target} to incoming hardware event!`);
                  }}
                  className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition active:scale-95"
                >
                  MAP CONTROL
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Device Learn Wizard */}
      {activeTab === 'learning_wizard' && (
        <div className="bg-slate-950 border-2 border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 text-center">
          <h3 className="text-lg font-bold text-white">Device Learning Mode for Unknown Hardware</h3>
          <p className="text-xs text-slate-400 max-w-lg mx-auto">
            The software progressive builder will guide you through pressing controls on unmapped hardware to construct a custom reusable profile.
          </p>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md mx-auto space-y-4">
            <span className="text-xs font-mono text-indigo-400 block uppercase">
              STEP {Math.min(learningStep + 1, wizardSteps.length)} OF {wizardSteps.length}
            </span>
            <h4 className="text-base font-bold text-amber-300">
              {wizardSteps[learningStep] || 'All Controls Learned Successfully!'}
            </h4>

            {learningStep < wizardSteps.length ? (
              <button
                onClick={handleStartLearnStep}
                disabled={isLearningActive}
                className={`w-full py-3 rounded-xl font-bold text-xs transition ${
                  isLearningActive
                    ? 'bg-amber-500 text-slate-950 animate-pulse'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                {isLearningActive ? 'WAITING FOR HARDWARE INPUT...' : 'AWAIT INPUT FOR THIS STEP'}
              </button>
            ) : (
              <div className="text-emerald-400 font-bold text-xs flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>Custom Device Profile Created! Saved as "My Custom Hardware".</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Active Mappings List */}
      {activeTab === 'mappings_list' && (
        <div className="bg-slate-950 border-2 border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase">Saved Mapping Registry</h3>
          <div className="space-y-2">
            {mappings.map((m) => (
              <div
                key={m.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-indigo-300">{m.sourceControlId}</span>
                  <p className="text-xs text-slate-400 font-mono">Device: {m.sourceDeviceId}</p>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-400">→ {m.targetLogicalId}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Tester */}
      {activeTab === 'tester' && (
        <div className="bg-slate-950 border-2 border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Hardware Mapping & Event Signal Tester
          </h3>

          <div className="bg-emerald-950/80 border border-emerald-500/40 rounded-xl p-4 font-mono text-emerald-300 text-sm">
            {testLogMessage}
          </div>

          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 max-h-60 overflow-y-auto font-mono text-xs text-slate-300 space-y-1">
            {eventLogs.map((log) => (
              <div key={log.id} className="flex justify-between border-b border-slate-800/50 py-1">
                <span className="text-slate-500">[{log.timestamp}]</span>
                <span className="text-indigo-400 font-bold">{log.deviceName}</span>
                <span className="text-amber-400">{log.type}</span>
                <span>Ch: {log.channel}</span>
                <span>Num: #{log.number}</span>
                <span className="text-emerald-400">Val: {log.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
