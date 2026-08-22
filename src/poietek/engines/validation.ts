import type {CapabilityReport, ExternalWorkflowStatus} from '../platform';
import {PRODUCTION_ENGINE_SCHEMA_VERSION, type PluginFormat, type ProductionEngineReadiness} from './contracts';

export interface ProductionEngineIssue {code: string; path: string; message: string}
const usable = (capability: CapabilityReport) => capability.state === 'available' || capability.state === 'degraded';
const accepted = (status: ExternalWorkflowStatus) => status.state === 'accepted' && Boolean(status.authorityId && status.externalReference && status.observedAt);

export function validateProductionEngineReadiness(state: ProductionEngineReadiness): ProductionEngineIssue[] {
  const issues: ProductionEngineIssue[] = [];
  const add = (code: string, path: string, message: string) => issues.push({code, path, message});
  if (state.schemaVersion !== PRODUCTION_ENGINE_SCHEMA_VERSION) add('UNSUPPORTED_VERSION', 'schemaVersion', 'Unknown production-engine schema.');
  if (!state.projectId) add('PROJECT_REQUIRED', 'projectId', 'A canonical project id is required.');

  const audio = state.nativeAudio;
  if (audio.callback.state === 'running') {
    if (!usable(audio.realtimeCapability) || audio.realtimeCapability.source !== 'native' || !audio.realtimeCapability.implementationId || !audio.realtimeCapability.observedAt) add('REALTIME_AUDIO_UNPROVEN', 'nativeAudio.realtimeCapability', 'Running audio requires an observed native implementation.');
    if (!audio.callback.implementationId || !audio.callback.startedAt || !audio.callback.lastCallbackAt || audio.callback.measuredCallbackCount <= 0 || audio.callback.telemetrySource !== 'native_callback') add('CALLBACK_EVIDENCE_REQUIRED', 'nativeAudio.callback', 'Running audio requires measured native callback evidence.');
    if (!audio.sampleRate || !audio.bufferFrames || audio.selectedOutputPortIds.length === 0) add('AUDIO_CONFIGURATION_INCOMPLETE', 'nativeAudio', 'Running audio requires sample rate, buffer and output selection.');
  }
  if (audio.callback.xrunCount > 0 && (!audio.callback.lastXrunAt || audio.callback.telemetrySource !== 'native_callback')) add('XRUN_TELEMETRY_UNPROVEN', 'nativeAudio.callback', 'Xrun counts require native telemetry and observation time.');
  if (usable(audio.multiOutputCapability) && audio.routes.filter((route) => route.enabled).length === 0) add('MULTI_OUTPUT_ROUTE_REQUIRED', 'nativeAudio.routes', 'Available multi-output requires an enabled route.');
  if (audio.renderParity.state === 'verified' && (!audio.renderParity.realtimeDigest || !audio.renderParity.offlineDigest || audio.renderParity.toleranceDb === null || !audio.renderParity.testedAt || !audio.renderParity.implementationId)) add('RENDER_PARITY_UNPROVEN', 'nativeAudio.renderParity', 'Verified parity requires both render digests, tolerance, time and implementation.');

  state.editing.commands.forEach((command, index) => {
    if (command.state === 'applied' && (!command.undoable || command.nextRevision !== command.baseRevision + 1 || !command.appliedAt || !command.implementationId)) add('EDIT_COMMAND_UNPROVEN', `editing.commands[${index}]`, 'Applied edits must be undoable, revisioned and implemented.');
    if (command.kind === 'stretch' && !usable(state.editing.stretchCapability)) add('STRETCH_BACKEND_REQUIRED', `editing.commands[${index}]`, 'Stretch cannot apply without a validated backend.');
  });
  state.editing.compSegments.forEach((segment, index) => {
    if (segment.durationTicks <= 0 || segment.startTick < 0 || segment.crossfadeInTicks < 0 || segment.crossfadeOutTicks < 0) add('COMP_SEGMENT_INVALID', `editing.compSegments[${index}]`, 'Comp segments require non-negative timing and positive duration.');
  });

  state.midiScoring.clips.forEach((clip, clipIndex) => {
    if (clip.startTick < 0 || clip.durationTicks <= 0 || clip.loopEndTick <= clip.loopStartTick) add('MIDI_CLIP_TIMING_INVALID', `midiScoring.clips[${clipIndex}]`, 'MIDI clip timing and loop range must be valid.');
    clip.events.forEach((event, eventIndex) => {
      if (event.tick < 0 || event.channel < 0 || event.channel > 15) add('MIDI_EVENT_INVALID', `midiScoring.clips[${clipIndex}].events[${eventIndex}]`, 'MIDI event tick/channel is invalid.');
    });
  });
  if (state.midiScoring.clockOutputs.some((output) => output.sendClock || output.sendMtc || output.sendStartStop) && !usable(state.midiScoring.clockOutputCapability)) add('MIDI_CLOCK_UNPROVEN', 'midiScoring.clockOutputs', 'Enabled MIDI sync output requires an observed adapter.');
  state.midiScoring.scoreDocuments.forEach((score, index) => {if (score.status === 'rendered' && (!usable(state.midiScoring.notationCapability) || !score.rendererImplementationId)) add('SCORE_RENDER_UNPROVEN', `midiScoring.scoreDocuments[${index}]`, 'Rendered notation requires an available renderer.');});

  const formats = Object.keys(state.plugins.formatCapabilities) as PluginFormat[];
  formats.forEach((format) => {
    const capability = state.plugins.formatCapabilities[format];
    if (usable(capability) && (!usable(state.plugins.hostCapability) || capability.source !== 'native' || !capability.implementationId || !capability.observedAt)) add('PLUGIN_FORMAT_UNPROVEN', `plugins.formatCapabilities.${format}`, 'Available plug-in format requires an observed native host.');
  });
  state.plugins.plugins.forEach((plugin, index) => {
    if (plugin.scanState === 'ready' && (!plugin.binaryDigest || !plugin.lastScannedAt || !usable(state.plugins.scanCapability))) add('PLUGIN_SCAN_UNPROVEN', `plugins.plugins[${index}]`, 'Ready plug-ins require isolated scan evidence and a binary digest.');
    if (plugin.format === 'aax' && plugin.scanState === 'ready' && !accepted(plugin.licenseEvidence)) add('AAX_LICENSE_REQUIRED', `plugins.plugins[${index}].licenseEvidence`, 'AAX availability requires authoritative SDK/licence evidence.');
    if (plugin.scanState === 'quarantined' && !plugin.quarantineReason) add('QUARANTINE_REASON_REQUIRED', `plugins.plugins[${index}]`, 'Quarantine requires a reason.');
  });

  state.video.proxies.forEach((proxy, index) => {if (proxy.status === 'ready' && (!usable(state.video.proxyCapability) || !proxy.proxyAssetId || !proxy.implementationId || !proxy.completedAt)) add('VIDEO_PROXY_UNPROVEN', `video.proxies[${index}]`, 'Ready proxies require output and adapter evidence.');});
  state.video.renderJobs.forEach((job, index) => {if (job.status === 'completed' && (!usable(state.video.renderCapability) || !job.outputAssetId || !job.implementationId || !job.completedAt)) add('VIDEO_RENDER_UNPROVEN', `video.renderJobs[${index}]`, 'Completed video render requires output and adapter evidence.');});
  state.video.captions.forEach((caption, index) => {if (caption.validationState === 'valid' && !usable(state.video.captionCapability)) add('CAPTION_VALIDATION_UNPROVEN', `video.captions[${index}]`, 'Valid captions require an available validation implementation.');});

  state.vfx.graphs.forEach((graph, index) => {
    if ((graph.renderState === 'rendering' || graph.renderState === 'completed') && (!usable(state.vfx.graphCapability) || !graph.outputNodeId)) add('VFX_GRAPH_UNPROVEN', `vfx.graphs[${index}]`, 'Executing VFX graphs require an available graph engine and output node.');
    graph.nodes.forEach((node, nodeIndex) => {if (graph.renderState === 'completed' && !node.implementationId) add('VFX_NODE_UNIMPLEMENTED', `vfx.graphs[${index}].nodes[${nodeIndex}]`, 'Completed graphs cannot contain unimplemented nodes.');});
  });
  if (state.vfx.colorManagement.system === 'ocio' && (!usable(state.vfx.colorCapability) || !state.vfx.colorManagement.configAssetId || !state.vfx.colorManagement.implementationId)) add('COLOR_MANAGEMENT_UNPROVEN', 'vfx.colorManagement', 'OCIO requires config, implementation and available colour capability.');

  state.delivery.checks.forEach((check, index) => {
    if (check.state === 'pass' && (!usable(state.delivery.qcCapability) || !check.implementationId || !check.standard || !check.measuredAt || !check.evidenceAssetId)) add('QC_PASS_UNPROVEN', `delivery.checks[${index}]`, 'A passing QC check requires validated implementation, standard, time and evidence.');
    if ((check.kind === 'loudness_bs1770' || check.kind === 'true_peak_oversampled') && check.state === 'pass' && typeof check.value !== 'number') add('QC_VALUE_REQUIRED', `delivery.checks[${index}].value`, 'Measured loudness and true peak require numeric values.');
  });
  state.delivery.profiles.forEach((profile, index) => {if (profile.approval.state === 'accepted' && !accepted(profile.approval)) add('DELIVERY_PROFILE_APPROVAL_UNPROVEN', `delivery.profiles[${index}].approval`, 'Accepted profiles require authority evidence.');});
  return issues;
}
