import type {
  ModuleType,
  RackDeviceRole,
  RackEngineState,
  RackModuleItem,
  RackSignalType,
  WorkspaceType,
} from '../../types';

export const POIETEK_RACK_DRAG_TYPE = 'application/x-poietek-rack-module';

export type RackModuleCategoryId =
  | 'instruments'
  | 'sequencing'
  | 'effects'
  | 'production'
  | 'control';

export interface RackModuleDefinition {
  type: ModuleType;
  label: string;
  description: string;
  tapeLabel: string;
  category: RackModuleCategoryId;
  tags: readonly string[];
  role: RackDeviceRole;
  engineState: RackEngineState;
  inputs: readonly RackSignalType[];
  outputs: readonly RackSignalType[];
  defaultParameters?: Readonly<Record<string, number | boolean | string>>;
}

export const RACK_MODULE_CATALOG: readonly RackModuleDefinition[] = [
  {type: 'mpc', label: 'Canvas Drum Grid', description: 'Pad sampling and bank performance', tapeLabel: 'DRUM SAMPLER', category: 'instruments', tags: ['pads', 'drums', 'sampler'], role: 'instrument', engineState: 'operational', inputs: ['note', 'audio'], outputs: ['audio']},
  {type: 'keyboard', label: 'Prism Poly Synth', description: 'Polyphonic subtractive instrument', tapeLabel: 'POLY SYNTH', category: 'instruments', tags: ['synth', 'keys', 'instrument'], role: 'instrument', engineState: 'operational', inputs: ['note', 'cv', 'gate'], outputs: ['audio']},
  {type: 'edrum', label: 'E-Drum Mesh Kit', description: 'Electronic drum trigger workspace', tapeLabel: 'MESH DRUMS', category: 'instruments', tags: ['drums', 'midi', 'trigger'], role: 'instrument', engineState: 'control_model', inputs: ['note'], outputs: ['audio']},
  {type: 'drum_machines', label: 'Pulse Drum Line', description: 'Step-driven drum computer', tapeLabel: 'STEP DRUMS', category: 'instruments', tags: ['drums', 'pattern', 'sequencer'], role: 'instrument', engineState: 'operational', inputs: ['note'], outputs: ['audio', 'note']},
  {type: 'chop_lab', label: 'Chop Lab', description: 'Sample slicing and pad assignment', tapeLabel: 'STEM CHOPPER', category: 'instruments', tags: ['sample', 'slice', 'chop'], role: 'instrument', engineState: 'operational', inputs: ['audio', 'note'], outputs: ['audio', 'note']},
  {type: 'wave_sequencer', label: 'Horizon Arrangement', description: 'Multitrack waveform and picture-sync lanes', tapeLabel: 'AUDIO TIMELINE', category: 'sequencing', tags: ['audio', 'timeline', 'arrangement'], role: 'player', engineState: 'operational', inputs: [], outputs: ['audio', 'note']},
  {type: 'composition_workbench', label: 'Idea Flow Workbench', description: 'Patterns, expressive notes, mixed arrangement lanes, automation and capture recall', tapeLabel: 'IDEA FLOW', category: 'sequencing', tags: ['patterns', 'piano', 'automation', 'arrangement', 'capture', 'loop'], role: 'player', engineState: 'control_model', inputs: ['note', 'audio'], outputs: ['note', 'audio', 'cv'], defaultParameters: {view: 'pattern', activePattern: 'pattern-a', swing: 0.5, scaleRoot: 0, scaleType: 'major', noteTool: 'original', automationCurve: 'smooth', automationMid: 0.78, captureArmed: false}},
  {type: 'note_forge_midi_lab', label: 'Note Forge MIDI Lab', description: 'Canonical MIDI clips, deterministic rhythm and chord ideas, non-destructive transforms and project undo', tapeLabel: 'NOTE FORGE', category: 'sequencing', tags: ['midi', 'clip', 'transform', 'generator', 'rhythm', 'chords', 'scale', 'humanize', 'quantize', 'undo'], role: 'player', engineState: 'operational', inputs: ['note'], outputs: ['note'], defaultParameters: {view: 'clips', transformKind: 'quantize', generatorKind: 'rhythm_generate', scale: 'minor', seed: 17, amount: 7, rootNote: 48}},
  {type: 'performance_canvas', label: 'Performance Canvas', description: 'Project-owned scene launching, rehearsal capture, follow planning and arrangement commit', tapeLabel: 'PERFORMANCE CANVAS', category: 'sequencing', tags: ['clips', 'scenes', 'launcher', 'performance', 'follow actions', 'capture', 'arrangement', 'controller'], role: 'player', engineState: 'control_model', inputs: ['note', 'audio'], outputs: ['note', 'audio'], defaultParameters: {view: 'canvas'}},
  {type: 'production_regions', label: 'Production Regions', description: 'Project-owned whole-section clip and automation grouping with safe move/copy plans', tapeLabel: 'PRODUCTION REGIONS', category: 'production', tags: ['region', 'arrangement', 'section', 'clip group', 'automation', 'move', 'copy', 'undo'], role: 'controller', engineState: 'control_model', inputs: ['audio', 'note'], outputs: ['audio', 'note'], defaultParameters: {view: 'regions', action: 'copy', targetBar: 7}},
  {type: 'editorial_memory', label: 'Editorial Memory & Clip Groups', description: 'Project-owned edit selections, track focus, exact audio clip cohorts and stale-safe batch display names', tapeLabel: 'EDITORIAL MEMORY', category: 'production', tags: ['edit', 'memory', 'marker', 'selection', 'track pin', 'clip group', 'batch rename', 'session', 'undo'], role: 'controller', engineState: 'operational', inputs: ['audio'], outputs: ['audio'], defaultParameters: {view: 'memories'}},
  {type: 'tracking_console', label: 'Tracking Console & Capture Paths', description: 'Project-owned source, monitor, cue, clean/processed record and recall plans with runtime evidence gates', tapeLabel: 'TRACKING CONSOLE', category: 'production', tags: ['tracking', 'record', 'capture', 'microphone', 'usb', 'cue', 'monitor', 'clean', 'processed', 'recall', 'hardware insert', 'latency'], role: 'controller', engineState: 'control_model', inputs: ['audio'], outputs: ['audio'], defaultParameters: {view: 'paths', snapshotId: 'tracking.snapshot.safe-start'}},
  {type: 'take_comp_studio', label: 'Take Studio & Comp Builder', description: 'Aligned real-audio takes, segment source choices, deterministic preview and atomic non-destructive comp commit', tapeLabel: 'TAKE STUDIO', category: 'production', tags: ['takes', 'take lanes', 'comp', 'comping', 'recording', 'vocal', 'audio editing', 'undo', 'non-destructive'], role: 'controller', engineState: 'operational', inputs: ['audio'], outputs: ['audio'], defaultParameters: {view: 'takes', groupId: ''}},
  {type: 'session_variations', label: 'Session Variations Workbench', description: 'Song-map variants, timed lyrics, mix-scene comparison and track focus', tapeLabel: 'SESSION VARIANTS', category: 'production', tags: ['arranger', 'lyrics', 'mix scenes', 'recall', 'track manager', 'folders'], role: 'utility', engineState: 'control_model', inputs: ['audio', 'note'], outputs: ['audio', 'note'], defaultParameters: {view: 'song_map', songVariant: 'radio', activeScene: 'balanced', trackFilter: ''}},
  {type: 'fl_channel_rack', label: 'Beat Loom', description: 'Pattern channel and step rack', tapeLabel: '16-STEP RACK', category: 'sequencing', tags: ['pattern', 'steps', 'channels'], role: 'player', engineState: 'operational', inputs: ['note'], outputs: ['note']},
  {type: 'piano_roll', label: 'Note Canvas', description: 'Piano-roll MIDI note editor', tapeLabel: 'MIDI GRID', category: 'sequencing', tags: ['midi', 'notes', 'piano roll'], role: 'player', engineState: 'control_model', inputs: ['note'], outputs: ['note']},
  {type: 'note_player', label: 'Motion Note Player', description: 'Arpeggio, chord, scale and note-repeat controls', tapeLabel: 'PLAYER MIDI FX', category: 'sequencing', tags: ['player', 'arpeggio', 'chord', 'scale', 'random', 'note echo'], role: 'player', engineState: 'control_model', inputs: ['note'], outputs: ['note'], defaultParameters: {rate: 0.5, gate: 0.75, octaveRange: 2, probability: 1}},
  {type: 'melodyne_pitch', label: 'Vocal Contour', description: 'Pitch and timing edit workspace', tapeLabel: 'PITCH EDIT', category: 'sequencing', tags: ['pitch', 'vocal', 'timing'], role: 'effect', engineState: 'control_model', inputs: ['audio'], outputs: ['audio']},
  {type: 'circle_fifths', label: 'Harmony Wheel', description: 'Key, chord and harmony guide', tapeLabel: 'HARMONY', category: 'sequencing', tags: ['chords', 'key', 'harmony'], role: 'player', engineState: 'control_model', inputs: ['note'], outputs: ['note']},
  {type: 'd_groove', label: 'Human Pulse Pool', description: 'Groove and timing templates', tapeLabel: 'GROOVE POOL', category: 'sequencing', tags: ['groove', 'swing', 'timing'], role: 'player', engineState: 'control_model', inputs: ['note'], outputs: ['note']},
  {type: 'sp404', label: 'Grain Deck Multi-FX', description: 'Performance sampling and built-in effects', tapeLabel: 'MFX SAMPLER', category: 'effects', tags: ['effects', 'sampler', 'performance'], role: 'effect', engineState: 'operational', inputs: ['audio', 'note'], outputs: ['audio']},
  {type: 'effect_eq', label: 'Contour Four EQ', description: 'Four-band tone shaping and filter control model', tapeLabel: 'CHANNEL EQ', category: 'effects', tags: ['eq', 'filter', 'tone', 'channel'], role: 'effect', engineState: 'control_model', inputs: ['audio'], outputs: ['audio'], defaultParameters: {lowDb: 0, lowMidDb: 0, highMidDb: 0, highDb: 0}},
  {type: 'effect_compressor', label: 'Forge Dynamics', description: 'Compressor, gate and sidechain control model', tapeLabel: 'DYNAMICS', category: 'effects', tags: ['compressor', 'gate', 'sidechain', 'dynamics'], role: 'effect', engineState: 'control_model', inputs: ['audio'], outputs: ['audio', 'cv'], defaultParameters: {thresholdDb: -18, ratio: 4, attackMs: 10, releaseMs: 120}},
  {type: 'effect_reverb', label: 'Nebula Space', description: 'Algorithmic room and experimental-space control model', tapeLabel: 'REVERB STATION', category: 'effects', tags: ['reverb', 'room', 'space', 'send'], role: 'effect', engineState: 'control_model', inputs: ['audio', 'cv'], outputs: ['audio'], defaultParameters: {mix: 0.25, size: 0.6, decaySeconds: 2.4, preDelayMs: 18}},
  {type: 'effect_delay', label: 'Orbit Echo', description: 'Tempo delay, diffusion and feedback control model', tapeLabel: 'SPACE DELAY', category: 'effects', tags: ['delay', 'echo', 'feedback', 'tempo'], role: 'effect', engineState: 'control_model', inputs: ['audio', 'cv'], outputs: ['audio'], defaultParameters: {mix: 0.2, feedback: 0.35, timeBeats: 0.5, diffusion: 0.1}},
  {type: 'effect_modulator', label: 'Flux Motion', description: 'LFO-driven chorus, phaser and filter control model', tapeLabel: 'MODULATION FX', category: 'effects', tags: ['lfo', 'chorus', 'phaser', 'filter', 'modulation'], role: 'effect', engineState: 'control_model', inputs: ['audio', 'cv'], outputs: ['audio', 'cv'], defaultParameters: {rateHz: 0.5, depth: 0.5, mix: 0.4, phase: 0}},
  {type: 'utility_gain_pan', label: 'Axis Gain & Stereo', description: 'Gain, pan, width, polarity and channel utility model', tapeLabel: 'GAIN / STEREO', category: 'effects', tags: ['gain', 'pan', 'stereo', 'width', 'polarity'], role: 'utility', engineState: 'control_model', inputs: ['audio', 'cv'], outputs: ['audio'], defaultParameters: {gainDb: 0, pan: 0, width: 1, polarityInvert: false}},
  {type: 'utility_split_merge', label: 'Branch Audio & CV', description: 'Parallel audio, CV and gate split/merge utility', tapeLabel: 'SPLIT / MERGE', category: 'effects', tags: ['split', 'merge', 'parallel', 'audio', 'cv', 'gate'], role: 'utility', engineState: 'control_model', inputs: ['audio', 'cv', 'gate'], outputs: ['audio', 'cv', 'gate']},
  {type: 'mixer', label: 'Summit Mix Console', description: 'Channels, buses, EQ, dynamics and sends', tapeLabel: 'MASTER CONSOLE', category: 'effects', tags: ['mixer', 'bus', 'effects', 'reverb', 'delay'], role: 'mixer', engineState: 'control_model', inputs: ['audio'], outputs: ['audio']},
  {type: 'folder_combinator', label: 'Macro Bus Container', description: 'Group devices behind shared macro controls', tapeLabel: 'MACRO BUS', category: 'effects', tags: ['folder', 'bus', 'macro', 'group', 'combinator'], role: 'utility', engineState: 'control_model', inputs: ['note', 'audio', 'cv', 'gate'], outputs: ['note', 'audio', 'cv', 'gate']},
  {type: 'plugin_host', label: 'External Plug-in Slot', description: 'Preserves plug-in placement until a licensed native host is available', tapeLabel: 'NATIVE REQUIRED', category: 'effects', tags: ['plugin', 'vst3', 'clap', 'au', 'external'], role: 'effect', engineState: 'native_required', inputs: ['audio', 'note'], outputs: ['audio', 'note']},
  {type: 'dj', label: 'Performance Decks', description: 'Dual-deck performance console', tapeLabel: 'DJ CONSOLE', category: 'effects', tags: ['deck', 'performance', 'mix'], role: 'instrument', engineState: 'operational', inputs: ['audio', 'note'], outputs: ['audio']},
  {type: 'midi_transformer', label: 'Logic Note Transformer', description: 'Filter, transpose, scale velocity and remap MIDI channels', tapeLabel: 'MIDI LOGIC', category: 'production', tags: ['midi', 'logical editor', 'transform', 'filter', 'velocity'], role: 'player', engineState: 'control_model', inputs: ['note'], outputs: ['note'], defaultParameters: {bypass: false, transposeSemitones: 0, velocityScale: 1, lowNote: 0, highNote: 127, outputChannel: 1}},
  {type: 'score_workbench', label: 'Score & Parts Workbench', description: 'Notation, articulation, parts and print/export intent', tapeLabel: 'SCORE WORKBENCH', category: 'production', tags: ['score', 'notation', 'engrave', 'parts', 'articulation', 'musicxml'], role: 'player', engineState: 'control_model', inputs: ['note'], outputs: ['note'], defaultParameters: {scoreMode: 'write', playerCount: 1, articulationPlayback: true, followPicture: false}},
  {type: 'technique_matrix', label: 'Technique Matrix & Score Bridge', description: 'Score techniques, exact sound slots and deterministic MIDI-switch plans', tapeLabel: 'TECHNIQUE MATRIX', category: 'production', tags: ['score', 'articulation', 'expression', 'technique', 'keyswitch', 'midi', 'playback'], role: 'player', engineState: 'control_model', inputs: ['note'], outputs: ['note'], defaultParameters: {view: 'library'}},
  {type: 'spectral_workbench', label: 'Spectrum Layer Lab', description: 'Spectral selection, repair, layer and separation requests', tapeLabel: 'SPECTRAL LAB', category: 'production', tags: ['spectral', 'repair', 'restore', 'layer', 'stem', 'separation'], role: 'effect', engineState: 'external_required', inputs: ['audio'], outputs: ['audio'], defaultParameters: {operation: 'repair', selectionMode: 'brush', previewOnly: true, sensitivity: 0.5}},
  {type: 'offline_process_chain', label: 'Revision Process Chain', description: 'Non-destructive direct offline process and preview plan', tapeLabel: 'OFFLINE CHAIN', category: 'production', tags: ['offline', 'process', 'render in place', 'revision', 'batch'], role: 'effect', engineState: 'control_model', inputs: ['audio'], outputs: ['audio'], defaultParameters: {processMode: 'gain', previewOnly: true, tailSeconds: 0, normalizeTargetDbfs: -1}},
  {type: 'batch_delivery', label: 'Batch Delivery Workshop', description: 'Safe many-asset recipes, multi-output naming, pilot approval and dry-run reports', tapeLabel: 'BATCH DELIVERY', category: 'production', tags: ['batch', 'assets', 'audio', 'delivery', 'naming', 'dry run', 'collision', 'pilot', 'report', 'workflow'], role: 'controller', engineState: 'native_required', inputs: ['audio'], outputs: ['audio'], defaultParameters: {view: 'sources'}},
  {type: 'picture_post', label: 'Picture & Dialog Post', description: 'SMPTE cues, ADR takes, field-audio matches, safe reconform and cue-sheet delivery', tapeLabel: 'PICTURE POST', category: 'production', tags: ['video', 'picture', 'timecode', 'adr', 'foley', 'reconform', 'dialog', 'field recorder', 'cue sheet'], role: 'controller', engineState: 'native_required', inputs: ['audio'], outputs: ['audio'], defaultParameters: {view: 'cues', timecodeRate: '24', followPicture: true, proxyMode: 'off', adrFreeMode: false}},
  {type: 'sequence_assembly', label: 'Sequence Assembly Workbench', description: 'Independent cues, conductor maps, shared resources and deterministic program chains', tapeLabel: 'SEQUENCE ASSEMBLY', category: 'production', tags: ['sequence', 'cue', 'conductor', 'tempo map', 'meter', 'key', 'program', 'shared rack', 'live set', 'film score'], role: 'player', engineState: 'native_required', inputs: ['audio', 'note'], outputs: ['audio', 'note'], defaultParameters: {view: 'sequences'}},
  {type: 'immersive_monitor', label: 'Spatial Route Designer', description: 'Surround, object, bed, Ambisonic and downmix intent', tapeLabel: 'IMMERSIVE ROUTE', category: 'production', tags: ['surround', 'immersive', 'object', 'bed', 'ambisonic', 'binaural'], role: 'utility', engineState: 'native_required', inputs: ['audio'], outputs: ['audio'], defaultParameters: {monitorFormat: 'stereo', bedChannels: 2, objectCount: 0, binauralPreview: false}},
  {type: 'mastering_delivery', label: 'Master Sequence & Delivery', description: 'Album sequence, standards targets, batch and QC plan', tapeLabel: 'MASTER DELIVERY', category: 'production', tags: ['mastering', 'delivery', 'lufs', 'true peak', 'batch', 'album', 'qc'], role: 'mixer', engineState: 'external_required', inputs: ['audio'], outputs: ['audio'], defaultParameters: {deliveryProfile: 'music_streaming', loudnessTargetLufs: -14, truePeakLimitDbtp: -1, standardsMeasured: false}},
  {type: 'control_room', label: 'Monitor, Cue & Talkback', description: 'Control-room source, cue, dim, mono and talkback intent', tapeLabel: 'CONTROL ROOM', category: 'production', tags: ['monitor', 'control room', 'cue', 'talkback', 'reference', 'dim', 'mono'], role: 'mixer', engineState: 'native_required', inputs: ['audio'], outputs: ['audio'], defaultParameters: {source: 'main', monitorFormat: 'stereo', cueBusCount: 2, dimDb: -20, dimEnabled: false, monoEnabled: false, talkbackEnabled: false}},
  {type: 'live_session_hub', label: 'Live Session Hub', description: 'Capture planning, channel-name handoff, soundcheck, remote-role and compatibility evidence', tapeLabel: 'LIVE SESSION', category: 'production', tags: ['live', 'capture', 'record', 'usb', 'mic', 'soundcheck', 'remote', 'cue', 'permissions', 'dawproject'], role: 'controller', engineState: 'external_required', inputs: ['audio', 'note'], outputs: ['audio', 'note'], defaultParameters: {view: 'capture'}},
  {type: 'action_extension_workshop', label: 'Action & Extension Workshop', description: 'Allowlisted project macros, atomic undo, deterministic cycles and package provenance', tapeLabel: 'ACTION FORGE', category: 'production', tags: ['actions', 'macros', 'custom actions', 'cycle', 'undo', 'extensions', 'packages', 'themes', 'language'], role: 'controller', engineState: 'control_model', inputs: [], outputs: [], defaultParameters: {view: 'actions'}},
  {type: 'motion_matrix', label: 'Motion Matrix', description: 'Project-owned modulators, typed parameter routes, deterministic control preview and macro scene recall', tapeLabel: 'MOTION MATRIX', category: 'production', tags: ['modulation', 'matrix', 'lfo', 'steps', 'macro', 'scenes', 'expression', 'control'], role: 'controller', engineState: 'control_model', inputs: ['note', 'audio', 'cv'], outputs: ['cv'], defaultParameters: {view: 'modulators'}},
  {type: 'remote_session', label: 'Remote Performer Session', description: 'Consent-aware local-first remote recording and take transfer', tapeLabel: 'REMOTE SESSION', category: 'production', tags: ['remote', 'recording', 'performer', 'cue', 'consent', 'transfer'], role: 'controller', engineState: 'external_required', inputs: ['audio', 'note'], outputs: ['audio', 'note'], defaultParameters: {sessionRole: 'producer', localRecordFirst: true, participantConsent: false, sessionState: 'offline'}},
  {type: 'patchbay', label: 'Audio & CV Patch Bay', description: 'Signal routing and rear-panel patching', tapeLabel: 'PATCH BAY', category: 'control', tags: ['audio', 'cv', 'routing'], role: 'utility', engineState: 'control_model', inputs: ['audio', 'cv', 'gate'], outputs: ['audio', 'cv', 'gate']},
  {type: 'midi_matrix', label: 'MIDI Signal Matrix', description: 'MIDI input and destination routing', tapeLabel: 'MIDI MATRIX', category: 'control', tags: ['midi', 'routing', 'matrix'], role: 'utility', engineState: 'control_model', inputs: ['note'], outputs: ['note']},
  {type: 'mapper', label: 'Hardware Mapper', description: 'MIDI learn and controller mapping', tapeLabel: 'MIDI MAPPER', category: 'control', tags: ['hardware', 'midi', 'mapping'], role: 'controller', engineState: 'control_model', inputs: ['note'], outputs: ['note']},
  {type: 'visual_editor', label: 'Controller Designer', description: 'Custom control-surface layout editor', tapeLabel: 'DIY BUILDER', category: 'control', tags: ['controller', 'layout', 'hardware'], role: 'controller', engineState: 'control_model', inputs: ['note'], outputs: ['note']},
  {type: 'health_latency', label: 'Device Diagnostics', description: 'Capability and latency evidence', tapeLabel: 'HEALTH DIAG', category: 'control', tags: ['health', 'latency', 'diagnostics'], role: 'controller', engineState: 'operational', inputs: [], outputs: []},
] as const;

const catalogByType = new Map<ModuleType, RackModuleDefinition>(
  RACK_MODULE_CATALOG.map((definition) => [definition.type, definition]),
);

export function isRackModuleType(value: string): value is ModuleType {
  return catalogByType.has(value as ModuleType);
}

const workspaceModuleTypes = new Set<WorkspaceType>([
  'mpc', 'sp404', 'keyboard', 'edrum', 'dj', 'mixer', 'patchbay', 'drum_machines',
  'mapper', 'visual_editor', 'midi_matrix', 'chop_lab', 'health_latency',
  'circle_fifths', 'melodyne_pitch', 'd_groove', 'piano_roll', 'wave_sequencer',
  'fl_channel_rack',
]);

export function isWorkspaceModuleType(value: ModuleType): value is WorkspaceType {
  return workspaceModuleTypes.has(value as WorkspaceType);
}

export function getRackModuleDefinition(type: ModuleType): RackModuleDefinition {
  const definition = catalogByType.get(type);
  if (!definition) throw new Error(`Unknown rack module type: ${type}`);
  return definition;
}

export function createRackModuleItem(type: ModuleType, groupId?: string): RackModuleItem {
  const definition = getRackModuleDefinition(type);
  return {
    id: `mod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    type,
    title: definition.label,
    tapeLabel: definition.tapeLabel,
    groupId,
    isFolded: false,
    parameters: definition.defaultParameters ? {...definition.defaultParameters} : undefined,
  };
}
