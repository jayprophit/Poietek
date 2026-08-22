import type {ModuleType, RackModuleItem} from '../../types';

export const POIETEK_RACK_DRAG_TYPE = 'application/x-poietek-rack-module';

export type RackModuleCategoryId =
  | 'instruments'
  | 'sequencing'
  | 'effects'
  | 'control';

export interface RackModuleDefinition {
  type: ModuleType;
  label: string;
  description: string;
  tapeLabel: string;
  category: RackModuleCategoryId;
  tags: readonly string[];
}

export const RACK_MODULE_CATALOG: readonly RackModuleDefinition[] = [
  {type: 'mpc', label: 'Canvas Drum Grid', description: 'Pad sampling and bank performance', tapeLabel: 'DRUM SAMPLER', category: 'instruments', tags: ['pads', 'drums', 'sampler']},
  {type: 'keyboard', label: 'Prism Poly Synth', description: 'Polyphonic subtractive instrument', tapeLabel: 'POLY SYNTH', category: 'instruments', tags: ['synth', 'keys', 'instrument']},
  {type: 'edrum', label: 'E-Drum Mesh Kit', description: 'Electronic drum trigger workspace', tapeLabel: 'MESH DRUMS', category: 'instruments', tags: ['drums', 'midi', 'trigger']},
  {type: 'drum_machines', label: 'Pulse Drum Line', description: 'Step-driven drum computer', tapeLabel: 'STEP DRUMS', category: 'instruments', tags: ['drums', 'pattern', 'sequencer']},
  {type: 'chop_lab', label: 'Chop Lab', description: 'Sample slicing and pad assignment', tapeLabel: 'STEM CHOPPER', category: 'instruments', tags: ['sample', 'slice', 'chop']},
  {type: 'wave_sequencer', label: 'Horizon Arrangement', description: 'Multitrack waveform and picture-sync lanes', tapeLabel: 'AUDIO TIMELINE', category: 'sequencing', tags: ['audio', 'timeline', 'arrangement']},
  {type: 'fl_channel_rack', label: 'Beat Loom', description: 'Pattern channel and step rack', tapeLabel: '16-STEP RACK', category: 'sequencing', tags: ['pattern', 'steps', 'channels']},
  {type: 'piano_roll', label: 'Note Canvas', description: 'Piano-roll MIDI note editor', tapeLabel: 'MIDI GRID', category: 'sequencing', tags: ['midi', 'notes', 'piano roll']},
  {type: 'melodyne_pitch', label: 'Vocal Contour', description: 'Pitch and timing edit workspace', tapeLabel: 'PITCH EDIT', category: 'sequencing', tags: ['pitch', 'vocal', 'timing']},
  {type: 'circle_fifths', label: 'Harmony Wheel', description: 'Key, chord and harmony guide', tapeLabel: 'HARMONY', category: 'sequencing', tags: ['chords', 'key', 'harmony']},
  {type: 'd_groove', label: 'Human Pulse Pool', description: 'Groove and timing templates', tapeLabel: 'GROOVE POOL', category: 'sequencing', tags: ['groove', 'swing', 'timing']},
  {type: 'sp404', label: 'Grain Deck Multi-FX', description: 'Performance sampling and built-in effects', tapeLabel: 'MFX SAMPLER', category: 'effects', tags: ['effects', 'sampler', 'performance']},
  {type: 'mixer', label: 'Summit Mix Console', description: 'Channels, buses, EQ, dynamics and sends', tapeLabel: 'MASTER CONSOLE', category: 'effects', tags: ['mixer', 'bus', 'effects', 'reverb', 'delay']},
  {type: 'folder_combinator', label: 'Combinator Bus Folder', description: 'Group devices behind shared macro controls', tapeLabel: 'BUS FOLDER', category: 'effects', tags: ['folder', 'bus', 'macro', 'group']},
  {type: 'dj', label: 'Performance Decks', description: 'Dual-deck performance console', tapeLabel: 'DJ CONSOLE', category: 'effects', tags: ['deck', 'performance', 'mix']},
  {type: 'patchbay', label: 'Audio & CV Patch Bay', description: 'Signal routing and rear-panel patching', tapeLabel: 'PATCH BAY', category: 'control', tags: ['audio', 'cv', 'routing']},
  {type: 'midi_matrix', label: 'MIDI Signal Matrix', description: 'MIDI input and destination routing', tapeLabel: 'MIDI MATRIX', category: 'control', tags: ['midi', 'routing', 'matrix']},
  {type: 'mapper', label: 'Hardware Mapper', description: 'MIDI learn and controller mapping', tapeLabel: 'MIDI MAPPER', category: 'control', tags: ['hardware', 'midi', 'mapping']},
  {type: 'visual_editor', label: 'Controller Designer', description: 'Custom control-surface layout editor', tapeLabel: 'DIY BUILDER', category: 'control', tags: ['controller', 'layout', 'hardware']},
  {type: 'health_latency', label: 'Device Diagnostics', description: 'Capability and latency evidence', tapeLabel: 'HEALTH DIAG', category: 'control', tags: ['health', 'latency', 'diagnostics']},
] as const;

const catalogByType = new Map<ModuleType, RackModuleDefinition>(
  RACK_MODULE_CATALOG.map((definition) => [definition.type, definition]),
);

export function isRackModuleType(value: string): value is ModuleType {
  return catalogByType.has(value as ModuleType);
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
  };
}
