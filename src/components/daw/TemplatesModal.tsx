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
        { id: 'start_idea', type: 'composition_workbench', title: 'Idea Flow Workbench', tapeLabel: 'IDEA FLOW', parameters: {view: 'pattern', activePattern: 'pattern-a', swing: 0.5, scaleRoot: 0, scaleType: 'major', noteTool: 'original', automationCurve: 'smooth', automationMid: 0.78, captureArmed: false} },
        { id: 'start_motion', type: 'motion_matrix', title: 'Motion Matrix', tapeLabel: 'MOTION MATRIX', parameters: {view: 'modulators'} },
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
        { id: 'start_score', type: 'score_workbench', title: 'Score & Parts Workbench', tapeLabel: 'SCORE WORKBENCH', parameters: {scoreMode: 'write', playerCount: 1, articulationPlayback: true, followPicture: false} },
        { id: 'start_pitch', type: 'melodyne_pitch', title: 'Pro Vocal Pitch Editor', tapeLabel: 'AUTO TUNER' },
        { id: 'start_mixer', type: 'mixer', title: 'Summit Master Console', tapeLabel: 'MASTER CONSOLE' },
        { id: 'start_control_room', type: 'control_room', title: 'Monitor, Cue & Talkback', tapeLabel: 'CONTROL ROOM', parameters: {source: 'main', monitorFormat: 'stereo', cueBusCount: 2, dimDb: -20, dimEnabled: false, monoEnabled: false, talkbackEnabled: false} },
      ],
    },
    {
      id: 'live_capture_soundcheck',
      name: 'Live Capture & Soundcheck Rig',
      description: 'Original local-first capture plan with mic/USB source intent, channel naming handoff, cue monitoring, scoped remote policy and evidence-gated soundcheck.',
      category: 'starter',
      bpm: 120,
      modules: [
        { id: 'live_tracking', type: 'tracking_console', title: 'Tracking Console & Capture Paths', tapeLabel: 'TRACKING CONSOLE', parameters: {view: 'paths', snapshotId: 'tracking.snapshot.safe-start'} },
        { id: 'live_hub', type: 'live_session_hub', title: 'Live Session Hub', tapeLabel: 'LIVE SESSION', parameters: {view: 'capture'} },
        { id: 'live_arrange', type: 'wave_sequencer', title: 'Horizon Arrangement', tapeLabel: 'CAPTURE TIMELINE' },
        { id: 'live_mixer', type: 'mixer', title: 'Summit Master Console', tapeLabel: 'LIVE MIX' },
        { id: 'live_control', type: 'control_room', title: 'Monitor, Cue & Talkback', tapeLabel: 'CONTROL ROOM', parameters: {source: 'main', monitorFormat: 'stereo', cueBusCount: 2, dimDb: -20, dimEnabled: false, monoEnabled: false, talkbackEnabled: false} },
      ],
    },
    {
      id: 'capture_paths_recall_rig',
      name: 'Capture Paths & Cue Recall Rig',
      description: 'Original project-owned tracking foundation for mic, instrument and USB sources with separate audition and print paths, two performer cues, safe recall, and honest device evidence gates.',
      category: 'starter',
      bpm: 96,
      hasWalkthrough: true,
      modules: [
        { id: 'capture_tracking', type: 'tracking_console', title: 'Tracking Console & Capture Paths', tapeLabel: 'TRACKING CONSOLE', parameters: {view: 'paths', snapshotId: 'tracking.snapshot.safe-start'} },
        { id: 'capture_arrange', type: 'wave_sequencer', title: 'Horizon Arrangement', tapeLabel: 'CAPTURE TIMELINE' },
        { id: 'capture_live', type: 'live_session_hub', title: 'Live Session Hub', tapeLabel: 'SESSION HANDOFF', parameters: {view: 'capture'} },
        { id: 'capture_mixer', type: 'mixer', title: 'Summit Master Console', tapeLabel: 'TRACKING MIX' },
        { id: 'capture_control', type: 'control_room', title: 'Monitor, Cue & Talkback', tapeLabel: 'CONTROL ROOM', parameters: {source: 'main', monitorFormat: 'stereo', cueBusCount: 2, dimDb: -20, dimEnabled: false, monoEnabled: false, talkbackEnabled: false} },
      ],
    },
    {
      id: 'performance_canvas_rig',
      name: 'Performance Canvas & Arrangement Rig',
      description: 'Original scene-based rehearsal rig with project-owned patterns, quantized launch intent, follow planning, performance capture and one-step arrangement commit.',
      category: 'starter',
      bpm: 112,
      hasWalkthrough: true,
      modules: [
        { id: 'performance_canvas', type: 'performance_canvas', title: 'Performance Canvas', tapeLabel: 'PERFORMANCE CANVAS', parameters: {view: 'canvas'} },
        { id: 'performance_ideas', type: 'composition_workbench', title: 'Idea Flow Workbench', tapeLabel: 'SOURCE PATTERNS', parameters: {view: 'pattern', activePattern: 'pattern-a', swing: 0.5, scaleRoot: 0, scaleType: 'minor', noteTool: 'original', automationCurve: 'smooth', automationMid: 0.78, captureArmed: false} },
        { id: 'performance_motion', type: 'motion_matrix', title: 'Motion Matrix', tapeLabel: 'SCENE MOTION', parameters: {view: 'scenes'} },
        { id: 'performance_synth', type: 'keyboard', title: 'Prism Poly Synth', tapeLabel: 'PERFORMANCE VOICE' },
        { id: 'performance_mixer', type: 'mixer', title: 'Summit Master Console', tapeLabel: 'PERFORMANCE MIX' },
        { id: 'performance_control', type: 'control_room', title: 'Monitor, Cue & Talkback', tapeLabel: 'CONTROL ROOM', parameters: {source: 'main', monitorFormat: 'stereo', cueBusCount: 2, dimDb: -20, dimEnabled: false, monoEnabled: false, talkbackEnabled: false} },
      ],
    },
    {
      id: 'vocal_takes_comping_rig',
      name: 'Vocal Takes & Comping Rig',
      description: 'Original record-to-comp workspace with evidence-gated capture paths, real aligned take discovery, segment source selection, canonical non-destructive commit, pitch-edit planning, mixing and cue monitoring.',
      category: 'starter',
      bpm: 96,
      hasWalkthrough: true,
      modules: [
        { id: 'takes_tracking', type: 'tracking_console', title: 'Tracking Console & Capture Paths', tapeLabel: 'TRACKING CONSOLE', parameters: {view: 'paths', snapshotId: 'tracking.snapshot.safe-start'} },
        { id: 'takes_comp', type: 'take_comp_studio', title: 'Take Studio & Comp Builder', tapeLabel: 'TAKE STUDIO', parameters: {view: 'takes', groupId: ''} },
        { id: 'takes_arrange', type: 'wave_sequencer', title: 'Horizon Arrangement', tapeLabel: 'COMP TIMELINE' },
        { id: 'takes_pitch', type: 'melodyne_pitch', title: 'Vocal Contour', tapeLabel: 'PITCH PLAN' },
        { id: 'takes_mixer', type: 'mixer', title: 'Summit Master Console', tapeLabel: 'VOCAL MIX' },
        { id: 'takes_control', type: 'control_room', title: 'Monitor, Cue & Talkback', tapeLabel: 'CONTROL ROOM', parameters: {source: 'main', monitorFormat: 'stereo', cueBusCount: 2, dimDb: -20, dimEnabled: false, monoEnabled: false, talkbackEnabled: false} },
      ],
    },
    {
      id: 'production_regions_arrangement_rig',
      name: 'Production Regions Arrangement Rig',
      description: 'Original whole-section arrangement rig with exact clip and automation membership, deterministic move/copy previews, atomic project changes and session variants.',
      category: 'starter',
      bpm: 108,
      hasWalkthrough: true,
      modules: [
        { id: 'regions_ideas', type: 'composition_workbench', title: 'Idea Flow Workbench', tapeLabel: 'SOURCE ARRANGEMENT', parameters: {view: 'arrange', activePattern: 'pattern-a', swing: 0.5, scaleRoot: 0, scaleType: 'minor', noteTool: 'original', automationCurve: 'smooth', automationMid: 0.78, captureArmed: false} },
        { id: 'regions_map', type: 'production_regions', title: 'Production Regions', tapeLabel: 'PRODUCTION REGIONS', parameters: {view: 'regions', action: 'copy', targetBar: 7} },
        { id: 'regions_variants', type: 'session_variations', title: 'Session Variations Workbench', tapeLabel: 'SESSION VARIANTS', parameters: {view: 'song_map', songVariant: 'radio', activeScene: 'balanced', trackFilter: ''} },
        { id: 'regions_mixer', type: 'mixer', title: 'Summit Master Console', tapeLabel: 'SECTION MIX' },
        { id: 'regions_control', type: 'control_room', title: 'Monitor, Cue & Talkback', tapeLabel: 'CONTROL ROOM', parameters: {source: 'main', monitorFormat: 'stereo', cueBusCount: 2, dimDb: -20, dimEnabled: false, monoEnabled: false, talkbackEnabled: false} },
      ],
    },
    {
      id: 'precision_editorial_session_rig',
      name: 'Precision Editorial & Session Recall Rig',
      description: 'Original precision-editing layout with durable edit memories, track focus, exact clip cohorts, comping, arrangement, safe action macros and monitored review.',
      category: 'starter',
      bpm: 96,
      hasWalkthrough: true,
      modules: [
        { id: 'editorial_memory', type: 'editorial_memory', title: 'Editorial Memory & Clip Groups', tapeLabel: 'EDITORIAL MEMORY', parameters: {view: 'memories'} },
        { id: 'editorial_arrange', type: 'wave_sequencer', title: 'Horizon Arrangement', tapeLabel: 'EDIT TIMELINE' },
        { id: 'editorial_takes', type: 'take_comp_studio', title: 'Take Studio & Comp Builder', tapeLabel: 'PLAYLIST COMPS', parameters: {view: 'takes', groupId: ''} },
        { id: 'editorial_actions', type: 'action_extension_workshop', title: 'Action & Extension Workshop', tapeLabel: 'EDIT ACTIONS', parameters: {view: 'actions'} },
        { id: 'editorial_mixer', type: 'mixer', title: 'Summit Master Console', tapeLabel: 'SESSION MIX' },
        { id: 'editorial_control', type: 'control_room', title: 'Monitor, Cue & Talkback', tapeLabel: 'CONTROL ROOM', parameters: {source: 'main', monitorFormat: 'stereo', cueBusCount: 2, dimDb: -20, dimEnabled: false, monoEnabled: false, talkbackEnabled: false} },
      ],
    },
    {
      id: 'multi_sequence_program',
      name: 'Multi-Cue Sequence & Shared Rack Rig',
      description: 'Original multi-timeline project with independent song, picture and live sequences, per-sequence conductor maps, reusable resource assignments and an evidence-gated program chain.',
      category: 'starter',
      bpm: 100,
      modules: [
        { id: 'sequence_assembly', type: 'sequence_assembly', title: 'Sequence Assembly Workbench', tapeLabel: 'SEQUENCE ASSEMBLY', parameters: {view: 'sequences'} },
        { id: 'sequence_score', type: 'score_workbench', title: 'Score & Parts Workbench', tapeLabel: 'SCORE & PARTS', parameters: {scoreMode: 'write', playerCount: 4, articulationPlayback: true, followPicture: true} },
        { id: 'sequence_picture', type: 'picture_post', title: 'Picture & Dialog Post', tapeLabel: 'PICTURE CUES', parameters: {view: 'cues', timecodeRate: '24', followPicture: true, proxyMode: 'off', adrFreeMode: false} },
        { id: 'sequence_synth', type: 'keyboard', title: 'Prism Poly Synth', tapeLabel: 'SHARED VOICE' },
        { id: 'sequence_space', type: 'effect_reverb', title: 'Nebula Space', tapeLabel: 'SHARED RETURN', parameters: {mix: 0.25, size: 0.6, decaySeconds: 2.4, preDelayMs: 18} },
        { id: 'sequence_mixer', type: 'mixer', title: 'Summit Master Console', tapeLabel: 'PROGRAM MIX' },
        { id: 'sequence_control', type: 'control_room', title: 'Monitor, Cue & Talkback', tapeLabel: 'CONTROL ROOM', parameters: {source: 'main', monitorFormat: 'stereo', cueBusCount: 2, dimDb: -20, dimEnabled: false, monoEnabled: false, talkbackEnabled: false} },
        { id: 'sequence_delivery', type: 'mastering_delivery', title: 'Master Sequence & Delivery', tapeLabel: 'PROGRAM DELIVERY', parameters: {deliveryProfile: 'music_streaming', loudnessTargetLufs: -14, truePeakLimitDbtp: -1, standardsMeasured: false} },
      ],
    },
    {
      id: 'dialog_adr_foley_post',
      name: 'Dialog, ADR & Foley Post Rig',
      description: 'Original 48 kHz-ready post layout with project-owned SMPTE cues, talent overlay, stored take references, metadata match proposals, safe ReConform, restoration intent, monitored mix and evidence-gated delivery.',
      category: 'starter',
      bpm: 96,
      modules: [
        { id: 'post_picture', type: 'picture_post', title: 'Picture & Dialog Post', tapeLabel: 'ADR & RECONFORM', parameters: {view: 'cues', timecodeRate: '24', followPicture: true, proxyMode: 'off', adrFreeMode: false} },
        { id: 'post_arrange', type: 'wave_sequencer', title: 'Horizon Arrangement', tapeLabel: 'PICTURE TIMELINE' },
        { id: 'post_spectral', type: 'spectral_workbench', title: 'Spectrum Layer Lab', tapeLabel: 'DIALOG REPAIR', parameters: {operation: 'repair', selectionMode: 'brush', previewOnly: true, sensitivity: 0.5} },
        { id: 'post_process', type: 'offline_process_chain', title: 'Revision Process Chain', tapeLabel: 'REVISION FX', parameters: {processMode: 'gain', previewOnly: true, tailSeconds: 0, normalizeTargetDbfs: -1} },
        { id: 'post_mixer', type: 'mixer', title: 'Summit Master Console', tapeLabel: 'POST MIX' },
        { id: 'post_control', type: 'control_room', title: 'Monitor, Cue & Talkback', tapeLabel: 'CONTROL ROOM', parameters: {source: 'main', monitorFormat: 'stereo', cueBusCount: 2, dimDb: -20, dimEnabled: false, monoEnabled: false, talkbackEnabled: false} },
        { id: 'post_delivery', type: 'mastering_delivery', title: 'Master Sequence & Delivery', tapeLabel: 'POST DELIVERY', parameters: {deliveryProfile: 'broadcast', loudnessTargetLufs: -23, truePeakLimitDbtp: -1, standardsMeasured: false} },
      ],
    },
    {
      id: 'safe_batch_delivery_rig',
      name: 'Safe Batch Delivery Rig',
      description: 'Original many-asset preparation rig with reusable recipe intent, protected multi-output naming, a complete dry run, one-file pilot approval and evidence-gated delivery.',
      category: 'starter',
      bpm: 94,
      modules: [
        { id: 'batch_workshop', type: 'batch_delivery', title: 'Batch Delivery Workshop', tapeLabel: 'BATCH DELIVERY', parameters: {view: 'sources'} },
        { id: 'batch_process', type: 'offline_process_chain', title: 'Revision Process Chain', tapeLabel: 'PILOT PROCESS', parameters: {processMode: 'gain', previewOnly: true, tailSeconds: 0, normalizeTargetDbfs: -1} },
        { id: 'batch_monitor', type: 'control_room', title: 'Monitor, Cue & Talkback', tapeLabel: 'PILOT MONITOR', parameters: {source: 'reference', monitorFormat: 'stereo', cueBusCount: 1, dimDb: -20, dimEnabled: false, monoEnabled: false, talkbackEnabled: false} },
        { id: 'batch_master', type: 'mastering_delivery', title: 'Master Sequence & Delivery', tapeLabel: 'STANDARDS GATE', parameters: {deliveryProfile: 'music_streaming', loudnessTargetLufs: -14, truePeakLimitDbtp: -1, standardsMeasured: false} },
      ],
    },
    {
      id: 'editing_action_rig',
      name: 'Editing Actions & Recall Rig',
      description: 'Original action workshop with allowlisted macros, A/B cycles, dry-run planning, canonical undo and package provenance beside the arranger and mix path.',
      category: 'starter',
      bpm: 94,
      modules: [
        { id: 'actions_workshop', type: 'action_extension_workshop', title: 'Action & Extension Workshop', tapeLabel: 'ACTION FORGE', parameters: {view: 'macros'} },
        { id: 'actions_arrange', type: 'wave_sequencer', title: 'Horizon Arrangement', tapeLabel: 'EDIT TIMELINE' },
        { id: 'actions_mixer', type: 'mixer', title: 'Summit Master Console', tapeLabel: 'PROJECT MIX' },
        { id: 'actions_control', type: 'control_room', title: 'Monitor, Cue & Talkback', tapeLabel: 'CONTROL ROOM', parameters: {source: 'main', monitorFormat: 'stereo', cueBusCount: 2, dimDb: -20, dimEnabled: false, monoEnabled: false, talkbackEnabled: false} },
      ],
    },
    {
      id: 'modular_motion_rig',
      name: 'Modular Motion & Performance Rig',
      description: 'Original project-owned modulation matrix with reusable macros, LFO and step motion, deterministic seeded variation, typed routes, scene recall, synthesis and a monitored mix path.',
      category: 'starter',
      bpm: 112,
      modules: [
        { id: 'motion_ideas', type: 'composition_workbench', title: 'Idea Flow Workbench', tapeLabel: 'CLIPS & AUTOMATION', parameters: {view: 'automation', activePattern: 'pattern-a', swing: 0.5, scaleRoot: 0, scaleType: 'minor', noteTool: 'original', automationCurve: 'smooth', automationMid: 0.78, captureArmed: false} },
        { id: 'motion_matrix', type: 'motion_matrix', title: 'Motion Matrix', tapeLabel: 'MOTION MATRIX', parameters: {view: 'modulators'} },
        { id: 'motion_synth', type: 'keyboard', title: 'Prism Poly Synth', tapeLabel: 'MOTION VOICE' },
        { id: 'motion_fx', type: 'effect_modulator', title: 'Flux Motion', tapeLabel: 'MOTION FX', parameters: {rateHz: 0.5, depth: 0.5, mix: 0.4, phase: 0} },
        { id: 'motion_mixer', type: 'mixer', title: 'Summit Master Console', tapeLabel: 'MOTION MIX' },
        { id: 'motion_control', type: 'control_room', title: 'Monitor, Cue & Talkback', tapeLabel: 'CONTROL ROOM', parameters: {source: 'main', monitorFormat: 'stereo', cueBusCount: 2, dimDb: -20, dimEnabled: false, monoEnabled: false, talkbackEnabled: false} },
      ],
    },
    {
      id: 'composer_technique_rig',
      name: 'Composer Technique & Playback Intent Rig',
      description: 'Original scoring path with canonical notation, direction and attribute techniques, exact switch-plan review, MIDI development, instrument sketching and monitored mixing.',
      category: 'starter',
      bpm: 96,
      hasWalkthrough: true,
      modules: [
        { id: 'technique_score', type: 'score_workbench', title: 'Score & Parts Workbench', tapeLabel: 'SCORE & PARTS', parameters: {scoreMode: 'write', playerCount: 1, articulationPlayback: true, followPicture: false} },
        { id: 'technique_bridge', type: 'technique_matrix', title: 'Technique Matrix & Score Bridge', tapeLabel: 'TECHNIQUE MATRIX', parameters: {view: 'library'} },
        { id: 'technique_midi', type: 'note_forge_midi_lab', title: 'Note Forge MIDI Lab', tapeLabel: 'MIDI DEVELOPMENT', parameters: {view: 'clips', transformKind: 'quantize', generatorKind: 'chord_generate', scale: 'minor', seed: 31, amount: 7, rootNote: 48} },
        { id: 'technique_synth', type: 'keyboard', title: 'Prism Poly Synth', tapeLabel: 'SCORE SKETCH' },
        { id: 'technique_mixer', type: 'mixer', title: 'Summit Master Console', tapeLabel: 'COMPOSER MIX' },
        { id: 'technique_control', type: 'control_room', title: 'Monitor, Cue & Talkback', tapeLabel: 'CONTROL ROOM', parameters: {source: 'main', monitorFormat: 'stereo', cueBusCount: 2, dimDb: -20, dimEnabled: false, monoEnabled: false, talkbackEnabled: false} },
      ],
    },
    {
      id: 'scoring_post',
      name: 'Score to Picture & Delivery Rig',
      description: 'Original scoring, articulation, picture/timecode, immersive route, control-room and mastering foundations with honest engine gates.',
      category: 'genre',
      bpm: 96,
      modules: [
        { id: 'score_midi_logic', type: 'midi_transformer', title: 'Logic Note Transformer', tapeLabel: 'MIDI LOGIC', parameters: {bypass: false, transposeSemitones: 0, velocityScale: 1, lowNote: 0, highNote: 127, outputChannel: 1} },
        { id: 'score_main', type: 'score_workbench', title: 'Score & Parts Workbench', tapeLabel: 'SCORE WORKBENCH', parameters: {scoreMode: 'write', playerCount: 4, articulationPlayback: true, followPicture: true} },
        { id: 'score_techniques', type: 'technique_matrix', title: 'Technique Matrix & Score Bridge', tapeLabel: 'TECHNIQUE MATRIX', parameters: {view: 'score'} },
        { id: 'score_synth', type: 'keyboard', title: 'Prism Poly Synth', tapeLabel: 'SCORE SKETCH' },
        { id: 'score_picture', type: 'picture_post', title: 'Picture & Dialog Post', tapeLabel: 'PICTURE POST', parameters: {view: 'cues', timecodeRate: '24', followPicture: true, proxyMode: 'off', adrFreeMode: false} },
        { id: 'score_immersive', type: 'immersive_monitor', title: 'Spatial Route Designer', tapeLabel: 'IMMERSIVE ROUTE', parameters: {monitorFormat: 'stereo', bedChannels: 2, objectCount: 0, binauralPreview: false} },
        { id: 'score_mixer', type: 'mixer', title: 'Summit Master Console', tapeLabel: 'SCORE MIX' },
        { id: 'score_control', type: 'control_room', title: 'Monitor, Cue & Talkback', tapeLabel: 'CONTROL ROOM', parameters: {source: 'main', monitorFormat: 'stereo', cueBusCount: 2, dimDb: -20, dimEnabled: false, monoEnabled: false, talkbackEnabled: false} },
        { id: 'score_delivery', type: 'mastering_delivery', title: 'Master Sequence & Delivery', tapeLabel: 'MASTER DELIVERY', parameters: {deliveryProfile: 'broadcast', loudnessTargetLufs: -23, truePeakLimitDbtp: -1, standardsMeasured: false} },
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
      id: 'portable_midi_sketch_rig',
      name: 'Portable MIDI Sketch & Performance Rig',
      description: 'A focused idea path for canonical MIDI clips, constrained variations, scene capture, arrangement development, original instruments and a monitored mix.',
      category: 'starter',
      bpm: 108,
      hasWalkthrough: true,
      modules: [
        { id: 'portable_note_forge', type: 'note_forge_midi_lab', title: 'Note Forge MIDI Lab', tapeLabel: 'NOTE FORGE', parameters: {view: 'clips', transformKind: 'quantize', generatorKind: 'rhythm_generate', scale: 'minor', seed: 17, amount: 7, rootNote: 48} },
        { id: 'portable_performance', type: 'performance_canvas', title: 'Performance Canvas', tapeLabel: 'SCENE CAPTURE', parameters: {view: 'canvas'} },
        { id: 'portable_flow', type: 'composition_workbench', title: 'Idea Flow Workbench', tapeLabel: 'IDEA FLOW', parameters: {view: 'arrange', activePattern: 'pattern-a', swing: 0.5, scaleRoot: 0, scaleType: 'minor', noteTool: 'original', automationCurve: 'smooth', automationMid: 0.78, captureArmed: false} },
        { id: 'portable_drums', type: 'mpc', title: 'Canvas Drum Grid', tapeLabel: 'RHYTHM SOURCE' },
        { id: 'portable_synth', type: 'keyboard', title: 'Prism Poly Synth', tapeLabel: 'MELODY SOURCE' },
        { id: 'portable_motion', type: 'motion_matrix', title: 'Motion Matrix', tapeLabel: 'MOTION SCENES', parameters: {view: 'scenes'} },
        { id: 'portable_mixer', type: 'mixer', title: 'Summit Master Console', tapeLabel: 'SKETCH MIX' },
        { id: 'portable_control', type: 'control_room', title: 'Monitor, Cue & Talkback', tapeLabel: 'CONTROL ROOM', parameters: {source: 'main', monitorFormat: 'stereo', cueBusCount: 1, dimDb: -20, dimEnabled: false, monoEnabled: false, talkbackEnabled: false} },
      ],
    },
    {
      id: 'idea_arrangement_lab',
      name: 'Idea-to-Arrangement Lab',
      description: 'Pattern sketching, expressive MIDI tools, mixed clip lanes, automation intent, sampling, synthesis and a monitored mix path.',
      category: 'starter',
      bpm: 104,
      hasWalkthrough: true,
      modules: [
        { id: 'idea_note_forge', type: 'note_forge_midi_lab', title: 'Note Forge MIDI Lab', tapeLabel: 'MIDI IDEAS', parameters: {view: 'clips', transformKind: 'humanize', generatorKind: 'chord_generate', scale: 'minor', seed: 23, amount: 7, rootNote: 48} },
        { id: 'idea_flow', type: 'composition_workbench', title: 'Idea Flow Workbench', tapeLabel: 'IDEA FLOW', parameters: {view: 'pattern', activePattern: 'pattern-a', swing: 0.5, scaleRoot: 0, scaleType: 'minor', noteTool: 'original', automationCurve: 'smooth', automationMid: 0.78, captureArmed: false} },
        { id: 'idea_motion', type: 'motion_matrix', title: 'Motion Matrix', tapeLabel: 'MOTION MATRIX', parameters: {view: 'scenes'} },
        { id: 'idea_variants', type: 'session_variations', title: 'Session Variations Workbench', tapeLabel: 'SESSION VARIANTS', parameters: {view: 'song_map', songVariant: 'radio', activeScene: 'balanced', trackFilter: ''} },
        { id: 'idea_sampler', type: 'mpc', title: 'Canvas Drum Grid', tapeLabel: 'RHYTHM SOURCE' },
        { id: 'idea_synth', type: 'keyboard', title: 'Prism Poly Synth', tapeLabel: 'MELODY SOURCE' },
        { id: 'idea_reverb', type: 'effect_reverb', title: 'Nebula Space', tapeLabel: 'SEND SPACE', parameters: {mix: 0.25, size: 0.6, decaySeconds: 2.4, preDelayMs: 18} },
        { id: 'idea_mixer', type: 'mixer', title: 'Summit Master Console', tapeLabel: 'IDEA MIX' },
        { id: 'idea_control', type: 'control_room', title: 'Monitor, Cue & Talkback', tapeLabel: 'CONTROL ROOM', parameters: {source: 'main', monitorFormat: 'stereo', cueBusCount: 2, dimDb: -20, dimEnabled: false, monoEnabled: false, talkbackEnabled: false} },
      ],
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
