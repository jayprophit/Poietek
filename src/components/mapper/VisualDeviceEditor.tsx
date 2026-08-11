import React, { useState } from 'react';
import { DeviceControl, DeviceProfile } from '../../types';
import { Layers, Plus, Save, Download, Grid, Sliders } from 'lucide-react';

export const VisualDeviceEditor: React.FC = () => {
  const [profileName, setProfileName] = useState<string>('My Custom DIY Controller');
  const [manufacturer, setManufacturer] = useState<string>('Custom Studio');
  const [placedControls, setPlacedControls] = useState<DeviceControl[]>([
    { id: 'custom_pad_1', name: 'Pad 1', type: 'pad', midiType: 'note', channel: 1, number: 36, x: 10, y: 10, width: 20, height: 20 },
    { id: 'custom_pad_2', name: 'Pad 2', type: 'pad', midiType: 'note', channel: 1, number: 37, x: 35, y: 10, width: 20, height: 20 },
    { id: 'custom_knob_1', name: 'Filter Knob', type: 'knob', midiType: 'cc', channel: 1, number: 16, x: 65, y: 10, width: 15, height: 15 },
    { id: 'custom_fader_1', name: 'Master Fader', type: 'fader', midiType: 'cc', channel: 1, number: 7, x: 85, y: 10, width: 10, height: 40 },
  ]);

  const addControl = (type: DeviceControl['type']) => {
    const newCtrl: DeviceControl = {
      id: `ctrl_${Date.now()}`,
      name: `${type.toUpperCase()} ${placedControls.length + 1}`,
      type,
      midiType: type === 'knob' || type === 'fader' ? 'cc' : 'note',
      channel: 1,
      number: 36 + placedControls.length,
      x: 20,
      y: 50,
      width: 15,
      height: 15,
    };
    setPlacedControls((prev) => [...prev, newCtrl]);
  };

  const exportJSON = () => {
    const profile: DeviceProfile = {
      id: `custom_${Date.now()}`,
      name: profileName,
      manufacturer,
      category: 'custom_diy',
      description: 'Custom graphical device profile built with Visual Device Editor.',
      controls: placedControls,
    };
    const jsonStr = JSON.stringify(profile, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${profileName.toLowerCase().replace(/\s+/g, '_')}_profile.json`;
    a.click();
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            Visual Device Editor & DIY Controller Builder
          </h2>
          <p className="text-xs text-slate-400">
            Graphical representation builder for unsupported, DIY, Arduino, and Raspberry Pi music hardware.
          </p>
        </div>

        <button
          onClick={exportJSON}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-2 shadow-lg shadow-amber-500/20"
        >
          <Download className="w-4 h-4" />
          <span>EXPORT PROFILE JSON</span>
        </button>
      </div>

      {/* Editor Controls & Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Toolbox Panel */}
        <div className="lg:col-span-4 bg-slate-950 border-2 border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase border-b border-slate-800 pb-2">
            Device Metadata
          </h3>

          <div>
            <label className="text-xs font-bold text-slate-400 block mb-1">Profile Name</label>
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded p-2"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 block mb-1">Manufacturer / Builder</label>
            <input
              type="text"
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded p-2"
            />
          </div>

          <h3 className="text-sm font-bold text-white uppercase border-b border-slate-800 pb-2 pt-2">
            Add Visual Components
          </h3>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => addControl('pad')}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-white transition flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-400" />
              <span>+ Pad</span>
            </button>

            <button
              onClick={() => addControl('knob')}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-white transition flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>+ Knob</span>
            </button>

            <button
              onClick={() => addControl('fader')}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-white transition flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>+ Fader</span>
            </button>

            <button
              onClick={() => addControl('jogwheel')}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-white transition flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-pink-400" />
              <span>+ Jog Wheel</span>
            </button>
          </div>
        </div>

        {/* Graphical Controller Shell Canvas */}
        <div className="lg:col-span-8 bg-slate-950 border-2 border-slate-800 rounded-3xl p-6 shadow-2xl relative min-h-[380px] overflow-hidden">
          <span className="text-xs font-mono text-slate-500 uppercase block mb-4">
            VIRTUAL SHELL CANVAS — {placedControls.length} CONTROLS PLACED
          </span>

          <div className="relative w-full h-[300px] bg-slate-900 rounded-2xl border-2 border-slate-800 p-4">
            {placedControls.map((ctrl) => (
              <div
                key={ctrl.id}
                style={{
                  position: 'absolute',
                  left: `${ctrl.x}%`,
                  top: `${ctrl.y}%`,
                }}
                className="bg-indigo-950/90 border-2 border-indigo-500/60 rounded-xl p-2 text-center text-xs font-bold text-white shadow-lg cursor-pointer hover:scale-105 transition"
              >
                <div>{ctrl.name}</div>
                <span className="text-[9px] font-mono text-indigo-300 block">
                  {ctrl.midiType.toUpperCase()} #{ctrl.number}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
