import type {
  ProductionAdapterObservation,
  ProductionReadinessReport,
  ProductionWorkflowDefinition,
  ProductionWorkflowKind,
} from './contracts';

export const PRODUCTION_WORKFLOW_DEFINITIONS: readonly ProductionWorkflowDefinition[] = [
  {
    kind: 'control_room',
    moduleType: 'control_room',
    discipline: 'Monitoring & cue',
    summary: 'Source, reference, dim, mono, cue and talkback intent in one monitor controller.',
    engineState: 'native_required',
    localCapabilities: ['Source selection', 'Cue-bus intent', 'Dim and mono controls', 'Talkback intent'],
    requiredCapabilities: ['native_audio_output_route', 'native_monitor_stream'],
    truthNote: 'A saved monitor layout is not a physical output route. Active monitoring needs an observed native stream.',
  },
  {
    kind: 'midi_transformer',
    moduleType: 'midi_transformer',
    discipline: 'MIDI logic',
    summary: 'Deterministic filtering, transposition, velocity scaling and channel remapping.',
    engineState: 'control_model',
    localCapabilities: ['Note-range filter', 'Transpose', 'Velocity scale', 'Output-channel map'],
    requiredCapabilities: [],
    truthNote: 'The transform is deterministic and tested; live MIDI I/O still depends on the selected MIDI adapter.',
  },
  {
    kind: 'score_workbench',
    moduleType: 'score_workbench',
    discipline: 'Score & articulation',
    summary: 'Setup, write, engrave, playback and print/export intent for score-led projects.',
    engineState: 'control_model',
    localCapabilities: ['Score mode', 'Player and part intent', 'Articulation map', 'Picture-follow intent'],
    requiredCapabilities: ['notation_layout_engine', 'musicxml_interchange'],
    truthNote: 'Poietek preserves score and articulation intent; professional engraving and MusicXML need validated engines.',
  },
  {
    kind: 'technique_matrix',
    moduleType: 'technique_matrix',
    discipline: 'Performance techniques & playback intent',
    summary: 'Versioned score bindings, direction inheritance, one-note attributes and exact MIDI-switch plans.',
    engineState: 'control_model',
    localCapabilities: ['Technique library', 'Mutual-exclusion rules', 'Score-articulation bindings', 'Exact sound slots', 'Deterministic switch plans'],
    requiredCapabilities: ['live_midi_dispatch', 'instrument_plugin_host'],
    truthNote: 'Poietek validates and records switching intent locally. No MIDI bytes, plug-in response or audible playback are claimed without observed adapters.',
  },
  {
    kind: 'spectral_workbench',
    moduleType: 'spectral_workbench',
    discipline: 'Spectral edit & repair',
    summary: 'Non-destructive spectral selection, layer, repair and separation request model.',
    engineState: 'external_required',
    localCapabilities: ['Selection recipe', 'Layer intent', 'Repair request', 'Preview-before-commit policy'],
    requiredCapabilities: ['spectral_analysis', 'spectral_process_render'],
    truthNote: 'No spectral result or stem is invented. Rendering remains unavailable until a reviewed local or external adapter responds.',
  },
  {
    kind: 'offline_process_chain',
    moduleType: 'offline_process_chain',
    discipline: 'Direct offline processing',
    summary: 'Revisioned, non-destructive audio-process chain with bypass and preview intent.',
    engineState: 'control_model',
    localCapabilities: ['Ordered process chain', 'Per-step bypass', 'Revision tracking', 'Preview-only default'],
    requiredCapabilities: ['offline_audio_render'],
    truthNote: 'The process chain is durable project intent; it is not committed to audio until a renderer accepts the request.',
  },
  {
    kind: 'batch_delivery',
    moduleType: 'batch_delivery',
    discipline: 'Batch processing & deliverables',
    summary: 'Many-asset recipe, multi-output naming, dry-run collision, pilot approval and evidence report workflow.',
    engineState: 'native_required',
    localCapabilities: ['Canonical source sets', 'Provider-neutral recipe graph', 'Safe portable naming tokens', 'Multi-output dry run', 'Collision policies', 'One-file pilot gate', 'Aggregate run evidence'],
    requiredCapabilities: ['batch_preview_render', 'batch_audio_render', 'batch_filesystem_delivery'],
    truthNote: 'Recipes, paths and dry runs are local project data. No media is changed or written until an evidenced adapter runs an approved plan and returns a report.',
  },
  {
    kind: 'picture_post',
    moduleType: 'picture_post',
    discipline: 'Picture, dialog & ADR',
    summary: 'Project-owned SMPTE cue, take, field-audio and preview-before-apply reconform workflow.',
    engineState: 'native_required',
    localCapabilities: ['SMPTE cue plan', 'ADR take references', 'Field-recorder metadata proposals', 'ReConform preview and apply', 'CSV cue sheet'],
    requiredCapabilities: ['video_decode', 'frame_accurate_clock', 'adr_audio_capture', 'video_render'],
    truthNote: 'Cue planning and deterministic reconform are local project features. Playback, live ADR capture and render claims require observed native adapters.',
  },
  {
    kind: 'sequence_assembly',
    moduleType: 'sequence_assembly',
    discipline: 'Sequences, conductor & shared resources',
    summary: 'Independent song, picture, live and scratch sequences assembled into reusable programs.',
    engineState: 'native_required',
    localCapabilities: ['Independent sequence documents', 'Per-sequence conductor maps', 'Deterministic program chains', 'Shared resource assignments', 'Planning manifest'],
    requiredCapabilities: ['sequence_transport', 'shared_processor_host', 'sequence_audio_render'],
    truthNote: 'Sequence, conductor, program and resource-assignment data is canonical. Playback, plug-in processing, hardware sync and audio rendering require observed adapters.',
  },
  {
    kind: 'immersive_monitor',
    moduleType: 'immersive_monitor',
    discipline: 'Immersive routing',
    summary: 'Bed/object, surround, Ambisonic and binaural monitoring intent with explicit renderer gates.',
    engineState: 'native_required',
    localCapabilities: ['Speaker-layout intent', 'Bed/object plan', 'Binaural-preview request', 'Downmix policy'],
    requiredCapabilities: ['multichannel_audio_route', 'immersive_renderer'],
    truthNote: 'A channel-layout choice is not renderer support. Delivery stays blocked without an observed compatible route and renderer.',
  },
  {
    kind: 'mastering_delivery',
    moduleType: 'mastering_delivery',
    discipline: 'Mastering & delivery',
    summary: 'Sequence, target, batch, sample-peak and standards-analysis delivery plan.',
    engineState: 'external_required',
    localCapabilities: ['Delivery profile', 'Target intent', 'Batch-job plan', 'Standards gates'],
    requiredCapabilities: ['bs1770_loudness_analysis', 'oversampled_true_peak', 'validated_delivery_render'],
    truthNote: 'Targets may be saved, but LUFS and dBTP remain not measured until the validated analyzers run.',
  },
  {
    kind: 'live_session_hub',
    moduleType: 'live_session_hub',
    discipline: 'Live capture & session control',
    summary: 'Capture-plan, channel-name handoff, soundcheck, remote-role and compatibility control surface.',
    engineState: 'external_required',
    localCapabilities: ['Capture plan', 'Channel-name handoff', 'Remote access policy', 'Soundcheck request', 'Compatibility evidence'],
    requiredCapabilities: ['live_input_capture', 'virtual_soundcheck_playback', 'authenticated_remote_control'],
    truthNote: 'Saved plans are local project data. No device, stream, participant, permission or playback is claimed without adapter evidence.',
  },
  {
    kind: 'remote_session',
    moduleType: 'remote_session',
    discipline: 'Remote recording',
    summary: 'Local-first remote performer, consent, cue, take and transfer session model.',
    engineState: 'external_required',
    localCapabilities: ['Session draft', 'Role and consent state', 'Local-record-first policy', 'Take-transfer intent'],
    requiredCapabilities: ['authenticated_remote_session', 'encrypted_media_transfer'],
    truthNote: 'No remote participant, consent, network path or transferred take is claimed without external evidence.',
  },
] as const;

const definitionsByKind = new Map<ProductionWorkflowKind, ProductionWorkflowDefinition>(
  PRODUCTION_WORKFLOW_DEFINITIONS.map((definition) => [definition.kind, definition]),
);

export function isProductionWorkflowKind(value: string): value is ProductionWorkflowKind {
  return definitionsByKind.has(value as ProductionWorkflowKind);
}

export function getProductionWorkflowDefinition(
  kind: ProductionWorkflowKind,
): ProductionWorkflowDefinition {
  const definition = definitionsByKind.get(kind);
  if (!definition) throw new Error(`Unknown production workflow: ${kind}`);
  return definition;
}

export function deriveProductionReadiness(
  kind: ProductionWorkflowKind,
  observations: readonly ProductionAdapterObservation[],
): ProductionReadinessReport {
  const definition = getProductionWorkflowDefinition(kind);
  const available = new Set(
    observations
      .filter((observation) => observation.state === 'available')
      .map((observation) => observation.capability),
  );
  const observedCapabilities = definition.requiredCapabilities
    .filter((capability) => available.has(capability));
  const missingCapabilities = definition.requiredCapabilities
    .filter((capability) => !available.has(capability));

  if (definition.requiredCapabilities.length === 0) {
    return {
      kind,
      status: 'control_model',
      observedCapabilities,
      missingCapabilities,
      claim: 'The local control model is available. Live I/O still follows the active platform adapter.',
    };
  }

  if (missingCapabilities.length > 0) {
    return {
      kind,
      status: 'adapter_required',
      observedCapabilities,
      missingCapabilities,
      claim: `Adapter evidence is missing for: ${missingCapabilities.join(', ')}.`,
    };
  }

  return {
    kind,
    status: 'adapter_observed',
    observedCapabilities,
    missingCapabilities,
    claim: 'Required adapter capabilities were observed. End-to-end activation still requires the owning workflow to retain its evidence.',
  };
}
