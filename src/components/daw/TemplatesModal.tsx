import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  Sparkles,
  Plus,
  Trash2,
  Check,
  Music,
  Grid,
  Flame,
  Zap,
  Sliders,
  FolderPlus,
  Play,
  RotateCcw,
  Save,
  Compass,
} from 'lucide-react';
import { StudioTemplate, RackModuleItem, ModuleType } from '../../types';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadTemplate: (template: StudioTemplate) => void;
  currentRackModules: RackModuleItem[];
  bpm: number;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onLoadTemplate,
  currentRackModules,
  bpm,
}) => {
  const [customTemplates, setCustomTemplates] = useState<StudioTemplate[]>([]);
  const [newTemplateName, setNewTemplateName] = useState<string>('');
  const [newTemplateDesc, setNewTemplateDesc] = useState<string>('');
  const [isSavingCustom, setIsSavingCustom] = useState<boolean>(false);

  // Load custom templates from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('studio_custom_templates');
      if (saved) {
        setCustomTemplates(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Error loading custom templates:', e);
    }
  }, []);

  const handleSaveCustomTemplate = () => {
    if (!newTemplateName.trim()) return;

    const newTmpl: StudioTemplate = {
      id: `custom_tmpl_${Date.now()}`,
      name: newTemplateName.trim(),
      description: newTemplateDesc.trim() || 'Custom Studio Rack Arrangement',
      category: 'custom',
      modules: currentRackModules,
      bpm: bpm,
      isUserSaved: true,
    };

    const updated = [newTmpl, ...customTemplates];
    setCustomTemplates(updated);
    try {
      localStorage.setItem('studio_custom_templates', JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving template:', e);
    }

    setNewTemplateName('');
    setNewTemplateDesc('');
    setIsSavingCustom(false);
  };

  const handleDeleteCustomTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customTemplates.filter((t) => t.id !== id);
    setCustomTemplates(updated);
    try {
      localStorage.setItem('studio_custom_templates', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  // Default Built-in Templates
  const builtinTemplates: StudioTemplate[] = [
    {
      id: 'guided_starter',
      name: 'Guided Walkthrough Starter Song',
      description: 'Default interactive starter project with pre-arranged drum pads, synth lead, vocal pitch editor & Combinator FX folder. Includes step-by-step walkthrough!',
      category: 'starter',
      bpm: 90,
      hasWalkthrough: true,
      modules: [
        { id: 'start_mpc', type: 'mpc', title: 'Canvas Drum Grid', tapeLabel: 'FOUNDRY KIT' },
        { id: 'start_synth', type: 'keyboard', title: 'Analog Subtractive Synth', tapeLabel: 'LEAD SYNTH' },
        {
          id: 'start_bus',
          type: 'folder_combinator',
          title: 'Drums & FX Bus Folder',
          tapeLabel: 'COMBINATOR BUS',
          subModuleIds: ['start_sp404'],
        },
        { id: 'start_sp404', type: 'sp404', title: 'Grain Deck Sampler', tapeLabel: 'TEXTURE FX', groupId: 'start_bus' },
        { id: 'start_pitch', type: 'melodyne_pitch', title: 'Pro Vocal Pitch Editor', tapeLabel: 'AUTO TUNER' },
        { id: 'start_mixer', type: 'mixer', title: 'Summit Master Console', tapeLabel: 'MASTER CONSOLE' },
      ],
    },
    {
      id: 'blank_slate',
      name: 'Blank Clean Slate',
      description: 'Start with an empty rack canvas and 1U hardware interface. Add infinite modules manually via drag & drop or the quick options palette.',
      category: 'blank',
      bpm: 120,
      modules: [],
    },
    {
      id: 'hiphop_lofi',
      name: 'Hip-Hop & Lo-Fi Beatmaker Rig',
      description: 'Pre-stacked with Canvas Drum Grid, Grain Deck Sampler, Chop Lab Stem Slicer, and tape-style compression controls.',
      category: 'genre',
      bpm: 86,
      modules: [
        { id: 'hip_mpc', type: 'mpc', title: 'Canvas Drum Grid', tapeLabel: 'LO-FI CHOP' },
        { id: 'hip_chop', type: 'chop_lab', title: 'Chop Lab Stem Slicer', tapeLabel: 'SAMPLE SLICER' },
        { id: 'hip_sp404', type: 'sp404', title: 'Grain Deck Sampler', tapeLabel: 'TEXTURE WARMTH' },
        { id: 'hip_mixer', type: 'mixer', title: 'Summit Master Console', tapeLabel: 'SATURATION' },
      ],
    },
    {
      id: 'synthwave_rig',
      name: 'Synthwave & Cyberpunk Stack',
      description: 'Pre-stacked with Prism Poly Synth, Beat Loom Step Rack, Universal Piano Roll, and Summit Master Console.',
      category: 'genre',
      bpm: 118,
      modules: [
        { id: 'sw_synth', type: 'keyboard', title: 'Analog Subtractive Synth', tapeLabel: 'RETRO BASS' },
        { id: 'sw_rack', type: 'fl_channel_rack', title: 'Pattern Step Channel Rack', tapeLabel: 'BEAT MATRIX' },
        { id: 'sw_piano', type: 'piano_roll', title: 'Universal Piano Roll', tapeLabel: 'MIDI GRID' },
        { id: 'sw_mixer', type: 'mixer', title: 'Summit Master Console', tapeLabel: 'RETRO DRIVE' },
      ],
    },
    {
      id: 'vocal_suite',
      name: 'Vocal Production Suite',
      description: 'Pre-stacked with Vocal Contour Editor, Horizon Waveform Sequencer, Space Weave and Echo Grid bus, and Summit Master Console.',
      category: 'genre',
      bpm: 100,
      modules: [
        { id: 'voc_pitch', type: 'melodyne_pitch', title: 'Vocal Contour Editor', tapeLabel: 'SCALE GUIDE' },
        { id: 'voc_seq', type: 'wave_sequencer', title: 'Multi-Track Audio Sequencer', tapeLabel: 'LEAD VOCALS' },
        { id: 'voc_mixer', type: 'mixer', title: 'Summit Master Console', tapeLabel: 'VOCAL BUS' },
      ],
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 font-mono select-none animate-in fade-in duration-200">
      <div className="bg-neutral-950 border-2 border-amber-500/80 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-stone-900 via-neutral-900 to-stone-900 p-4 border-b border-amber-500/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-400 font-black tracking-widest text-sm uppercase">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <span>STUDIO STARTER SONGS & CUSTOM TEMPLATES</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-stone-700">
          {/* Save Current Build Section */}
          <div className="bg-neutral-900/80 border border-amber-500/40 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Save className="w-4 h-4" />
                SAVE CURRENT RACK AS CUSTOM TEMPLATE
              </span>
              <span className="text-[10px] text-neutral-400 font-bold">
                ({currentRackModules.length} Modules Currently Active)
              </span>
            </div>

            {isSavingCustom ? (
              <div className="space-y-2 pt-1">
                <input
                  type="text"
                  placeholder="Template Name (e.g., My Dream Synth Rig)"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  className="w-full bg-neutral-950 border border-amber-500 text-amber-300 px-3 py-2 rounded-xl text-xs outline-none font-bold"
                />
                <input
                  type="text"
                  placeholder="Description (Optional)"
                  value={newTemplateDesc}
                  onChange={(e) => setNewTemplateDesc(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 text-neutral-300 px-3 py-2 rounded-xl text-xs outline-none"
                />
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleSaveCustomTemplate}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-neutral-950 font-black text-xs hover:bg-amber-400 transition flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>SAVE TEMPLATE</span>
                  </button>
                  <button
                    onClick={() => setIsSavingCustom(false)}
                    className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-400 text-xs hover:bg-neutral-700 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsSavingCustom(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500 hover:text-neutral-950 text-amber-300 font-black text-xs border border-amber-500/40 transition flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>SAVE CURRENT RACK CONFIGURATION</span>
              </button>
            )}
          </div>

          {/* Built-in Starter Templates */}
          <div className="space-y-3">
            <span className="text-xs font-black text-neutral-400 uppercase tracking-widest block">
              1. BUILT-IN STARTER SONGS & RIG TEMPLATES
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {builtinTemplates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => {
                    onLoadTemplate(tmpl);
                    onClose();
                  }}
                  className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between group ${
                    tmpl.hasWalkthrough
                      ? 'bg-amber-950/20 border-amber-500/80 hover:bg-amber-500 hover:text-neutral-950 hover:border-amber-400 shadow-lg'
                      : 'bg-neutral-900 border-neutral-800 hover:border-amber-500/60 hover:bg-neutral-850'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 group-hover:text-neutral-950 flex items-center gap-1.5">
                        {tmpl.hasWalkthrough && <Sparkles className="w-4 h-4 text-amber-400 group-hover:text-neutral-950 animate-pulse" />}
                        <span>{tmpl.name}</span>
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-950 group-hover:bg-neutral-900 text-amber-400 border border-amber-500/30">
                        {tmpl.bpm} BPM
                      </span>
                    </div>

                    <p className="text-[11px] text-neutral-400 group-hover:text-neutral-900 leading-relaxed font-sans">
                      {tmpl.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-neutral-800 group-hover:border-neutral-900/30 flex items-center justify-between mt-2">
                    <span className="text-[10px] text-neutral-500 group-hover:text-neutral-900 font-bold uppercase">
                      {tmpl.modules.length} Rack Units
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 group-hover:text-neutral-950 flex items-center gap-1">
                      <span>LOAD STARTER</span>
                      <Play className="w-3 h-3 fill-current" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Saved User Custom Templates */}
          {customTemplates.length > 0 && (
            <div className="space-y-3 pt-2">
              <span className="text-xs font-black text-amber-400 uppercase tracking-widest block">
                2. YOUR SAVED CUSTOM TEMPLATES ({customTemplates.length})
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {customTemplates.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    onClick={() => {
                      onLoadTemplate(tmpl);
                      onClose();
                    }}
                    className="p-4 rounded-2xl bg-neutral-900 border-2 border-indigo-500/50 hover:border-indigo-400 hover:bg-neutral-850 transition cursor-pointer flex flex-col justify-between group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-wider text-indigo-300 group-hover:text-white">
                          {tmpl.name}
                        </h4>
                        <button
                          onClick={(e) => handleDeleteCustomTemplate(tmpl.id, e)}
                          className="p-1 rounded hover:bg-rose-900 text-neutral-500 hover:text-rose-300 transition"
                          title="Delete Custom Template"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
                        {tmpl.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-neutral-800 flex items-center justify-between mt-2">
                      <span className="text-[10px] text-indigo-400 font-bold uppercase">
                        {tmpl.modules.length} Modules • Custom
                      </span>
                      <span className="text-[10px] font-black uppercase text-indigo-300 flex items-center gap-1">
                        <span>LOAD TEMPLATE</span>
                        <Play className="w-3 h-3 fill-current" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
