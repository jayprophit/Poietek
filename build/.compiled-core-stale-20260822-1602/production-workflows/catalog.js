"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRODUCTION_WORKFLOW_DEFINITIONS = void 0;
exports.isProductionWorkflowKind = isProductionWorkflowKind;
exports.getProductionWorkflowDefinition = getProductionWorkflowDefinition;
exports.deriveProductionReadiness = deriveProductionReadiness;
exports.PRODUCTION_WORKFLOW_DEFINITIONS = [
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
        kind: 'picture_post',
        moduleType: 'picture_post',
        discipline: 'Picture, dialog & ADR',
        summary: 'Timecode, picture-follow, dialog, Foley, cue and reconform control surface.',
        engineState: 'native_required',
        localCapabilities: ['Timecode intent', 'Picture-follow mode', 'Cue and marker plan', 'ADR take policy'],
        requiredCapabilities: ['video_decode', 'frame_accurate_clock', 'video_render'],
        truthNote: 'Picture timing and render claims remain blocked until a codec backend passes frame-accuracy and A/V sync tests.',
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
        kind: 'remote_session',
        moduleType: 'remote_session',
        discipline: 'Remote recording',
        summary: 'Local-first remote performer, consent, cue, take and transfer session model.',
        engineState: 'external_required',
        localCapabilities: ['Session draft', 'Role and consent state', 'Local-record-first policy', 'Take-transfer intent'],
        requiredCapabilities: ['authenticated_remote_session', 'encrypted_media_transfer'],
        truthNote: 'No remote participant, consent, network path or transferred take is claimed without external evidence.',
    },
];
const definitionsByKind = new Map(exports.PRODUCTION_WORKFLOW_DEFINITIONS.map((definition) => [definition.kind, definition]));
function isProductionWorkflowKind(value) {
    return definitionsByKind.has(value);
}
function getProductionWorkflowDefinition(kind) {
    const definition = definitionsByKind.get(kind);
    if (!definition)
        throw new Error(`Unknown production workflow: ${kind}`);
    return definition;
}
function deriveProductionReadiness(kind, observations) {
    const definition = getProductionWorkflowDefinition(kind);
    const available = new Set(observations
        .filter((observation) => observation.state === 'available')
        .map((observation) => observation.capability));
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
