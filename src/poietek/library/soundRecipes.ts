export type OriginalSoundFamily =
  | 'drums'
  | 'bass'
  | 'keys'
  | 'synth'
  | 'orchestral'
  | 'guitar'
  | 'vocal'
  | 'texture'
  | 'cinematic';

export interface OriginalSoundRecipe {
  id: string;
  name: string;
  family: OriginalSoundFamily;
  engine: 'procedural-one-shot' | 'subtractive' | 'fm' | 'granular' | 'multisample-required';
  character: string[];
  availability: 'renderable-now' | 'preset-design' | 'recording-required';
  provenance: 'Poietek original recipe';
  limitation: string | null;
}

/**
 * Original sound-design briefs covering familiar production categories without
 * copying another workstation's recordings, patches, preset data, or names.
 */
export const ORIGINAL_SOUND_RECIPES: readonly OriginalSoundRecipe[] = [
  {id: 'foundry-kick', name: 'Foundry Kick', family: 'drums', engine: 'procedural-one-shot', character: ['deep', 'tight', 'electronic'], availability: 'renderable-now', provenance: 'Poietek original recipe', limitation: null},
  {id: 'foundry-snare', name: 'Foundry Snare', family: 'drums', engine: 'procedural-one-shot', character: ['crisp', 'layered', 'modern'], availability: 'renderable-now', provenance: 'Poietek original recipe', limitation: null},
  {id: 'foundry-hat', name: 'Foundry Hat', family: 'drums', engine: 'procedural-one-shot', character: ['bright', 'short', 'synthetic'], availability: 'renderable-now', provenance: 'Poietek original recipe', limitation: null},
  {id: 'foundry-clap', name: 'Foundry Clap', family: 'drums', engine: 'procedural-one-shot', character: ['wide', 'layered', 'snappy'], availability: 'renderable-now', provenance: 'Poietek original recipe', limitation: null},
  {id: 'subway-pressure', name: 'Subway Pressure', family: 'bass', engine: 'subtractive', character: ['sub', 'mono', 'clean'], availability: 'preset-design', provenance: 'Poietek original recipe', limitation: 'Preset state is not canonical yet.'},
  {id: 'brasswire-bass', name: 'Brasswire Bass', family: 'bass', engine: 'fm', character: ['metallic', 'plucked', 'percussive'], availability: 'preset-design', provenance: 'Poietek original recipe', limitation: 'FM production engine is staged.'},
  {id: 'night-rail', name: 'Night Rail', family: 'bass', engine: 'subtractive', character: ['distorted', 'moving', 'mid-bass'], availability: 'preset-design', provenance: 'Poietek original recipe', limitation: 'Drive and modulation adapters are staged.'},
  {id: 'glass-harbour', name: 'Glass Harbour', family: 'keys', engine: 'fm', character: ['electric', 'bell', 'soft'], availability: 'preset-design', provenance: 'Poietek original recipe', limitation: 'FM production engine is staged.'},
  {id: 'felt-room', name: 'Felt Room', family: 'keys', engine: 'multisample-required', character: ['intimate', 'dark', 'mechanical'], availability: 'recording-required', provenance: 'Poietek original recipe', limitation: 'Needs newly recorded and licensed multisamples.'},
  {id: 'copper-stage', name: 'Copper Stage', family: 'keys', engine: 'subtractive', character: ['organ', 'warm', 'ensemble'], availability: 'preset-design', provenance: 'Poietek original recipe', limitation: 'Dedicated tonewheel modelling is staged.'},
  {id: 'polar-chime', name: 'Polar Chime', family: 'synth', engine: 'fm', character: ['bell', 'wide', 'glassy'], availability: 'preset-design', provenance: 'Poietek original recipe', limitation: 'FM production engine is staged.'},
  {id: 'prism-vista', name: 'Prism Vista', family: 'synth', engine: 'subtractive', character: ['pad', 'slow', 'luminous'], availability: 'preset-design', provenance: 'Poietek original recipe', limitation: 'Preset and modulation state are not canonical yet.'},
  {id: 'signal-flare', name: 'Signal Flare', family: 'synth', engine: 'subtractive', character: ['lead', 'bright', 'expressive'], availability: 'preset-design', provenance: 'Poietek original recipe', limitation: 'Preset and modulation state are not canonical yet.'},
  {id: 'paper-sequence', name: 'Paper Sequence', family: 'synth', engine: 'subtractive', character: ['pluck', 'rhythmic', 'dry'], availability: 'preset-design', provenance: 'Poietek original recipe', limitation: 'Arpeggiator application is staged.'},
  {id: 'granite-cloud', name: 'Granite Cloud', family: 'texture', engine: 'granular', character: ['granular', 'evolving', 'rough'], availability: 'preset-design', provenance: 'Poietek original recipe', limitation: 'Granular production engine is staged.'},
  {id: 'tape-garden', name: 'Tape Garden', family: 'texture', engine: 'granular', character: ['warped', 'organic', 'ambient'], availability: 'recording-required', provenance: 'Poietek original recipe', limitation: 'Needs newly recorded source material and granular DSP.'},
  {id: 'choir-distance', name: 'Choir Distance', family: 'vocal', engine: 'multisample-required', character: ['choir', 'soft', 'cinematic'], availability: 'recording-required', provenance: 'Poietek original recipe', limitation: 'Needs consented performers and newly recorded samples.'},
  {id: 'spoken-grain', name: 'Spoken Grain', family: 'vocal', engine: 'granular', character: ['vocal', 'rhythmic', 'abstract'], availability: 'recording-required', provenance: 'Poietek original recipe', limitation: 'Needs consented original vocal material.'},
  {id: 'chamber-lines', name: 'Chamber Lines', family: 'orchestral', engine: 'multisample-required', character: ['strings', 'ensemble', 'close'], availability: 'recording-required', provenance: 'Poietek original recipe', limitation: 'Needs newly recorded and licensed articulations.'},
  {id: 'bronze-horizon', name: 'Bronze Horizon', family: 'orchestral', engine: 'multisample-required', character: ['brass', 'cinematic', 'broad'], availability: 'recording-required', provenance: 'Poietek original recipe', limitation: 'Needs newly recorded and licensed articulations.'},
  {id: 'northwood', name: 'Northwood', family: 'orchestral', engine: 'multisample-required', character: ['woodwind', 'airy', 'solo'], availability: 'recording-required', provenance: 'Poietek original recipe', limitation: 'Needs newly recorded and licensed articulations.'},
  {id: 'clean-arc', name: 'Clean Arc', family: 'guitar', engine: 'multisample-required', character: ['clean', 'muted', 'stereo'], availability: 'recording-required', provenance: 'Poietek original recipe', limitation: 'Needs newly recorded and licensed multisamples.'},
  {id: 'ember-wall', name: 'Ember Wall', family: 'guitar', engine: 'multisample-required', character: ['driven', 'wide', 'sustained'], availability: 'recording-required', provenance: 'Poietek original recipe', limitation: 'Needs newly recorded DI samples and an amplifier model.'},
  {id: 'opening-frame', name: 'Opening Frame', family: 'cinematic', engine: 'granular', character: ['riser', 'impact', 'transition'], availability: 'recording-required', provenance: 'Poietek original recipe', limitation: 'Needs original field recordings and render recipes.'},
];

export function summarizeOriginalSoundRecipes(
  recipes: readonly OriginalSoundRecipe[] = ORIGINAL_SOUND_RECIPES,
) {
  return {
    total: recipes.length,
    renderableNow: recipes.filter((recipe) => recipe.availability === 'renderable-now').length,
    presetDesigns: recipes.filter((recipe) => recipe.availability === 'preset-design').length,
    recordingsRequired: recipes.filter((recipe) => recipe.availability === 'recording-required').length,
    families: [...new Set(recipes.map((recipe) => recipe.family))],
  };
}

