import React, { useState } from 'react';
import {
  Compass,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  Grid,
  Music,
  Sliders,
  FolderPlus,
  Activity,
  Plus,
} from 'lucide-react';

interface GuidedWalkthroughBannerProps {
  onDismiss: () => void;
  onJumpToModule: (type: string) => void;
}

export const GuidedWalkthroughBanner: React.FC<GuidedWalkthroughBannerProps> = ({
  onDismiss,
  onJumpToModule,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);

  const steps = [
    {
      title: 'Step 1: Audition Beat & Drum Sampler',
      desc: 'Start by auditioning the MPC Studio Drum Pad & SP-404 Sampler. Click pads or press keys 1-8 to trigger samples.',
      moduleType: 'mpc',
      buttonText: 'View MPC Sampler',
    },
    {
      title: 'Step 2: Play Analog Synth Lead',
      desc: 'Next, play melodic notes on the Analog Subtractive Synth module. Experiment with filter cutoff & resonance.',
      moduleType: 'keyboard',
      buttonText: 'View Synth Lead',
    },
    {
      title: 'Step 3: Test Combinator Bus Grouping',
      desc: 'Notice how modules are grouped inside the Combinator Bus Folder! Tweak Cutoff & Drive macro knobs to hear group FX.',
      moduleType: 'folder_combinator',
      buttonText: 'View Bus Folder',
    },
    {
      title: 'Step 4: Auto-Tune & Vocal Pitch Correction',
      desc: 'Audition the Pro Vocal Pitch Editor to lock notes to scale or shift formants in real-time.',
      moduleType: 'melodyne_pitch',
      buttonText: 'View Pitch Editor',
    },
    {
      title: 'Step 5: Infinite Rack Stacking',
      desc: 'You can stack an infinite number of modules! Drag modules to re-order, or click "+ Add Module" to build your custom rig.',
      moduleType: 'mpc',
      buttonText: 'Finish Walkthrough',
    },
  ];

  const activeStepObj = steps[currentStep];

  return (
    <div className="bg-gradient-to-r from-amber-950 via-neutral-900 to-stone-900 border-b-2 border-amber-500/80 p-3 text-xs font-mono text-neutral-200 select-none shadow-2xl relative z-40">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left Step Title & Description */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500 text-neutral-950 font-black shadow-lg shadow-amber-500/30 flex items-center justify-center">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black px-2 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                STARTER SONG WALKTHROUGH ({currentStep + 1}/{steps.length})
              </span>
              <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">
                {activeStepObj.title}
              </h4>
            </div>
            <p className="text-[11px] text-neutral-300 mt-0.5 max-w-2xl font-sans">
              {activeStepObj.desc}
            </p>
          </div>
        </div>

        {/* Right Navigation Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onJumpToModule(activeStepObj.moduleType)}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs transition shadow-md flex items-center gap-1.5"
          >
            <span>{activeStepObj.buttonText}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
            <button
              onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
              disabled={currentStep === 0}
              className="p-1 rounded hover:bg-neutral-800 disabled:opacity-30 text-neutral-300"
              title="Previous Step"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-bold text-amber-400 px-1">
              {currentStep + 1}/{steps.length}
            </span>
            <button
              onClick={() => setCurrentStep((s) => Math.min(steps.length - 1, s + 1))}
              disabled={currentStep === steps.length - 1}
              className="p-1 rounded hover:bg-neutral-800 disabled:opacity-30 text-neutral-300"
              title="Next Step"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onDismiss}
            className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition"
            title="Dismiss Walkthrough Banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
