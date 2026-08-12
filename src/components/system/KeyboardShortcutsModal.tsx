import React from 'react';
import { HelpCircle, Keyboard, X, Zap, Command, Layers } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const SHORTCUT_GROUPS = [
    {
      title: 'Global DAW Controls',
      items: [
        { key: 'Spacebar', desc: 'Start / Stop Master Transport Playback' },
        { key: 'Tab', desc: 'Flip Studio Rack to Rear Cable Patch Bay' },
        { key: 'F5 / F6 / F7 / F8', desc: 'Switch Active Workspaces (Rack, DAW, Mixer, Sampler)' },
        { key: 'Ctrl + Z / Cmd + Z', desc: 'Undo Rack Module Operation' },
        { key: 'Ctrl + Y / Cmd + Y', desc: 'Redo Rack Module Operation' },
      ],
    },
    {
      title: 'Studio Rack & Modules',
      items: [
        { key: 'Double Click Tape', desc: 'Fold / Unfold Module into Compact 1U Bar' },
        { key: 'Right Click Unit', desc: 'Open Unit Context Menu & Color Tag Picker' },
        { key: 'Drag Cables', desc: 'Connect Audio or CV Signals between rear sockets' },
      ],
    },
    {
      title: 'Sequencer & Piano Roll',
      items: [
        { key: 'Shift + Click', desc: 'Draw Notes or Multi-Select Audio Clips' },
        { key: 'Delete / Backspace', desc: 'Remove Selected Pattern Note / Clip' },
        { key: 'Mouse Scroll Wheel', desc: 'Zoom Timeline In / Out Horizontally' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150] flex items-center justify-center p-4 font-mono text-xs select-none animate-in fade-in duration-200">
      <div className="bg-neutral-950 border-2 border-neutral-700 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-neutral-900 border-b border-neutral-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                KEYBOARD SHORTCUTS & DAW COMMANDS
              </h2>
              <span className="text-[10px] text-neutral-400">
                PRODUCER SPEED-DIAL HOTKEYS • HARDWARE & WORKSTATION NAVIGATION
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

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[65vh] scrollbar-thin scrollbar-thumb-neutral-800">
          {SHORTCUT_GROUPS.map((group, idx) => (
            <div key={idx} className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4">
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block mb-3">
                {group.title}
              </span>
              <div className="space-y-2">
                {group.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    className="flex items-center justify-between bg-neutral-950 p-2 rounded-xl border border-neutral-800/80"
                  >
                    <span className="text-neutral-300 font-bold">{item.desc}</span>
                    <kbd className="px-2.5 py-1 bg-stone-800 border border-stone-700 text-amber-300 font-black rounded-lg text-[10px] shadow">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="bg-neutral-900 border-t border-neutral-800 p-4 flex items-center justify-between">
          <span className="text-[10px] text-neutral-500">PRESS ESC TO CLOSE</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl font-black transition shadow"
          >
            GOT IT
          </button>
        </div>
      </div>
    </div>
  );
};
