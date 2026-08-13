import React, { useState } from 'react';
import {
  Laptop,
  Smartphone,
  Tablet,
  Tv,
  MousePointer,
  Hand,
  PenTool,
  Radio,
  Keyboard,
  ShieldCheck,
  CheckCircle2,
  X,
  Zap,
  Globe,
  Sliders,
  Cpu,
  Eye,
  Watch,
  Sparkles,
} from 'lucide-react';

interface UniversalPlatformModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProfile: 'desktop' | 'tablet' | 'mobile';
  onSelectProfile: (profile: 'desktop' | 'tablet' | 'mobile') => void;
}

export const UniversalPlatformModal: React.FC<UniversalPlatformModalProps> = ({
  isOpen,
  onClose,
  activeProfile,
  onSelectProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'devices' | 'inputs' | 'license'>('inputs');

  if (!isOpen) return null;

  const INPUT_MODALITIES = [
    {
      id: 'keyboard',
      title: 'Physical Keyboard & MIDI Controllers',
      icon: <Keyboard className="w-5 h-5 text-amber-400" />,
      desc: 'QWERTY live piano play, global DAW speed hotkeys, velocity sensitivity & hardware MIDI keyboard mapping.',
      status: 'Active & Standard',
      badgeBg: 'bg-emerald-950/80 border-emerald-700 text-emerald-400',
    },
    {
      id: 'mouse',
      title: 'Mouse & Trackpad Precision',
      icon: <MousePointer className="w-5 h-5 text-cyan-400" />,
      desc: 'Sub-pixel rotary knob drag, right-click context menus, smooth horizontal wheel timeline scrolling & cable patching.',
      status: 'Active & Standard',
      badgeBg: 'bg-emerald-950/80 border-emerald-700 text-emerald-400',
    },
    {
      id: 'touch',
      title: 'Touchscreen Multi-Finger Gestures',
      icon: <Hand className="w-5 h-5 text-amber-400" />,
      desc: 'Multi-touch simultaneous pad hits, 2-finger pinch-to-zoom timeline navigation, swipe side-drawers & touch sliders.',
      status: 'Active & Standard',
      badgeBg: 'bg-emerald-950/80 border-emerald-700 text-emerald-400',
    },
    {
      id: 'pen',
      title: 'Digital Stylus & Pen (Apple Pencil, Surface Pen, Wacom)',
      icon: <PenTool className="w-5 h-5 text-purple-400" />,
      desc: 'Pressure-sensitive automation vector drawing, pitch bending tilt support, high-precision piano roll note placement.',
      status: 'Active & Standard',
      badgeBg: 'bg-emerald-950/80 border-emerald-700 text-emerald-400',
    },
    {
      id: 'wearable',
      title: 'Smart Gloves, Spatial AR/VR & Smartwatch Remotes',
      icon: <Watch className="w-5 h-5 text-rose-400" />,
      desc: 'Touchless air-pinch cable routing, wrist transport tap controls, accelerometer tempo tap & spatial audio monitoring.',
      status: 'Active & Universal Ready',
      badgeBg: 'bg-amber-950/80 border-amber-700 text-amber-300',
    },
  ];

  const TARGET_DEVICES = [
    {
      id: 'desktop',
      title: 'Desktop Workstation',
      subtitle: 'macOS • Windows • Linux • Web',
      icon: <Tv className="w-6 h-6 text-amber-400" />,
      features: ['Dual-Sidebar Docking', 'Full Modular Cable View', 'Multi-Display Detach'],
    },
    {
      id: 'tablet',
      title: 'Touch Tablet Studio',
      subtitle: 'iPadOS • Android Tablet • Surface',
      icon: <Tablet className="w-6 h-6 text-amber-400" />,
      features: ['Multi-Touch MPC Pads', 'Pinch-Zoom Sequencer', 'Slide-over Drawer Dock'],
    },
    {
      id: 'mobile',
      title: 'Mobile Pocket Studio',
      subtitle: 'iOS • Android • PWA Offline App',
      icon: <Smartphone className="w-6 h-6 text-amber-400" />,
      features: ['Responsive Compact Layout', 'Drawer Navigation', 'Instant Cloud Sync'],
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[150] flex items-center justify-center p-3 sm:p-4 font-mono text-xs select-none animate-in fade-in duration-200">
      <div className="bg-neutral-950 border-2 border-neutral-700 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-neutral-900 border-b border-neutral-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                UNIVERSAL CROSS-PLATFORM & MULTI-INPUT SYSTEM
              </h2>
              <span className="text-[10px] text-amber-400 font-bold">
                ONE ENGINE • ALL DEVICES • KEYBOARD, MOUSE, TOUCH, PEN, GLOVES & WEARABLES
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="bg-neutral-950 border-b border-neutral-800 px-4 py-2 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('inputs')}
            className={`px-4 py-2 rounded-xl font-black text-xs transition flex items-center gap-2 border ${
              activeTab === 'inputs'
                ? 'bg-amber-500 text-neutral-950 border-amber-300 shadow'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
            }`}
          >
            <Hand className="w-4 h-4" />
            <span>MULTI-INPUT MODALITIES</span>
          </button>
          <button
            onClick={() => setActiveTab('devices')}
            className={`px-4 py-2 rounded-xl font-black text-xs transition flex items-center gap-2 border ${
              activeTab === 'devices'
                ? 'bg-amber-500 text-neutral-950 border-amber-300 shadow'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>PLATFORM VIEWPORTS</span>
          </button>
          <button
            onClick={() => setActiveTab('license')}
            className={`px-4 py-2 rounded-xl font-black text-xs transition flex items-center gap-2 border ${
              activeTab === 'license'
                ? 'bg-amber-500 text-neutral-950 border-amber-300 shadow'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>SINGLE LICENSE POLICY</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[60vh] scrollbar-thin scrollbar-thumb-neutral-800">
          {activeTab === 'inputs' && (
            <div className="space-y-3">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-[11px] text-amber-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>True Multi-Modal Input:</strong> Every knob, fader, key, pad, and cable socket automatically supports Mouse, Touch, Stylus/Pen, and Smart Glove/Gesture events concurrently with 100% zero configuration required.
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {INPUT_MODALITIES.map((mod) => (
                  <div
                    key={mod.id}
                    className="p-3.5 bg-neutral-900/80 border border-neutral-800 rounded-2xl flex items-start justify-between gap-3 shadow-inner hover:border-neutral-700 transition"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 shrink-0">
                        {mod.icon}
                      </div>
                      <div>
                        <h4 className="font-black text-white text-xs uppercase tracking-wide">
                          {mod.title}
                        </h4>
                        <p className="text-[10px] text-neutral-400 mt-1 leading-relaxed">
                          {mod.desc}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border shrink-0 ${mod.badgeBg}`}
                    >
                      {mod.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'devices' && (
            <div className="space-y-4">
              <div className="p-3 bg-cyan-950/40 border border-cyan-800/60 rounded-2xl text-[11px] text-cyan-300 flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>
                  <strong>One Codebase, 100% Feature Parity:</strong> Switch viewports at any time to test or produce on Desktop, Tablet, or Mobile layout organizations without missing a single instrument or synthesizer feature.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {TARGET_DEVICES.map((dev) => {
                  const isCurrent = activeProfile === dev.id;
                  return (
                    <div
                      key={dev.id}
                      onClick={() => onSelectProfile(dev.id as any)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between space-y-3 ${
                        isCurrent
                          ? 'bg-amber-500/10 border-amber-400 ring-2 ring-amber-400/40'
                          : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          {dev.icon}
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500 text-neutral-950 text-[9px] font-black uppercase">
                              CURRENT ACTIVE
                            </span>
                          )}
                        </div>
                        <h4 className="font-black text-white text-xs uppercase tracking-wide">
                          {dev.title}
                        </h4>
                        <span className="text-[9px] text-neutral-400 font-mono block mt-0.5">
                          {dev.subtitle}
                        </span>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-neutral-800/80">
                        {dev.features.map((ft, fIdx) => (
                          <div key={fIdx} className="flex items-center gap-1.5 text-[10px] text-neutral-300">
                            <CheckCircle2 className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>{ft}</span>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectProfile(dev.id as any);
                        }}
                        className={`w-full py-1.5 rounded-xl font-black text-[10px] uppercase transition ${
                          isCurrent
                            ? 'bg-amber-500 text-neutral-950'
                            : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white'
                        }`}
                      >
                        {isCurrent ? 'ACTIVE VIEW' : 'SWITCH TO VIEW'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'license' && (
            <div className="p-5 bg-neutral-900/80 border border-neutral-800 rounded-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-950 border border-emerald-700 rounded-2xl text-emerald-400 shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-white text-sm uppercase tracking-wide">
                    UNIVERSAL SINGLE LICENSE GUARANTEE
                  </h3>
                  <span className="text-[10px] text-amber-400 font-bold block mt-0.5">
                    PAY ONCE • USE ANYWHERE • ZERO DEGREDATION OR FEATURE STRIPPING
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-[11px] text-neutral-300 leading-relaxed border-t border-neutral-800 pt-3">
                <p>
                  ⚡ <strong>100% Feature Parity:</strong> Every synth module, SSL channel strip, audio sample editor, AI groove generator, and cable routing bay is included in full across every platform.
                </p>
                <p>
                  🔄 <strong>Real-Time PWA & Cloud Sync:</strong> Projects automatically sync instantly between your Desktop studio setup, touch tablet on stage, and mobile phone on the go.
                </p>
                <p>
                  🌐 <strong>Universal Input Protocol:</strong> Supports hardware MIDI keyboards, touch, Apple Pencil / Surface Pen stylus gestures, mouse, trackpad, and smart glove/spatial controllers out-of-the-box.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-neutral-900 border-t border-neutral-800 p-4 flex items-center justify-between">
          <span className="text-[10px] text-neutral-500 uppercase">
            STUDIO UNIVERSAL ENGINE v4.8 • ALL MODALITIES READY
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl font-black transition shadow"
          >
            DONE
          </button>
        </div>
      </div>
    </div>
  );
};
