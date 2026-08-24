import type {AiAssistantFinding, AiAssistantRequest, AiAssistantResponse} from './contracts';

function finding(id: string, title: string, detail: string, category: AiAssistantFinding['category'], evidence: string[], proposedAction: string | null = null, severity: AiAssistantFinding['severity'] = 'info'): AiAssistantFinding {
  return {id, title, detail, category, severity, evidence, proposedAction, requiresPreview: proposedAction !== null, canApply: false};
}

export function runLocalStudioAssistant(request: AiAssistantRequest, now = new Date()): AiAssistantResponse {
  const project = request.context.project;
  const audioTracks = project.tracks.filter((track) => track.type === 'audio');
  const midiTracks = project.tracks.filter((track) => track.type === 'midi' || track.type === 'instrument');
  const clipCount = project.tracks.reduce((total, track) => total + track.clips.length, 0);
  const missingAssets = project.tracks.flatMap((track) => track.clips).filter((clip) => !project.assets.some((asset) => asset.id === clip.assetId));
  const findings: AiAssistantFinding[] = [];

  findings.push(finding('project-shape', 'Project snapshot', `${project.title} has ${project.tracks.length} tracks, ${clipCount} clips and ${project.assets.length} durable assets.`, 'observation', [
    `${audioTracks.length} audio tracks`, `${midiTracks.length} MIDI/instrument tracks`, `${project.settings.sampleRate} Hz project rate`,
  ]));

  if (missingAssets.length > 0) {
    findings.push(finding('missing-assets', 'Repair missing media before creative work', `${missingAssets.length} clips reference media that is not present in the canonical asset list.`, 'safety', missingAssets.slice(0, 5).map((clip) => clip.name), 'Open the project recovery/media repair flow.', 'blocking'));
  }
  if (clipCount === 0) {
    findings.push(finding('empty-arrangement', 'Start with source material', 'The timeline is empty, so mix or mastering advice would be invented.', 'technical', ['No canonical clips are present'], 'Import or record audio, or create an instrument pattern.', 'attention'));
  }
  if (request.mode === 'arrangement' || /arrang|song|structure/i.test(request.prompt)) {
    findings.push(finding('arrangement-option', 'Mark a simple song form', 'Create arrangement markers before destructive editing so verses, hooks and transitions stay readable.', 'creative_option', [`Current tempo ${project.tempoMap[0]?.bpm ?? 'not set'} BPM`], 'Preview markers for intro, body, contrast and ending.'));
  }
  if (request.mode === 'mix' || /mix|level|balance|pan|loud/i.test(request.prompt)) {
    findings.push(finding('gain-staging', 'Measure before changing the mix', 'Use the real audio-health and meter readings for each imported asset. RMS and sample peak must not be presented as LUFS or True Peak.', 'technical', ['Standards loudness remains unavailable until a validated analyzer runs'], 'Open Inspect and review measured clipping, RMS, peak, DC offset and correlation.', 'attention'));
  }
  if (request.mode === 'release' || /release|export|master|publish/i.test(request.prompt)) {
    findings.push(finding('release-preflight', 'Choose the destination before approving delivery', 'Readiness depends on the target profile, identifiers, rights evidence and validated loudness measurements.', 'requirement', [`${project.releases.length} release records`, `${project.contributors.length} contributor records`], 'Run the release-readiness profile for the intended destination.', 'attention'));
  }
  if (request.mode === 'rights' || /right|split|credit|copyright|royalt/i.test(request.prompt)) {
    findings.push(finding('rights-evidence', 'Rights are evidence, not inference', 'The assistant will not invent ownership, contributor approval, splits or registration acceptance.', 'safety', [`${project.contributors.length} contributor records`, 'External acceptance requires authority, reference and timestamp'], 'Open contributor passports and complete missing evidence.', 'attention'));
  }
  if (request.mode === 'sampling' || /sampl|chop|drum|sound/i.test(request.prompt)) {
    findings.push(finding('sampling-option', 'Preserve the source while experimenting', 'Create slices and mappings as non-destructive references to the content-hashed asset.', 'creative_option', [`${project.assets.filter((asset) => asset.mediaType === 'audio').length} audio assets available`], 'Preview transient-aligned slices in a new sampler mapping.'));
  }
  if (request.mode === 'learning' || /how|learn|explain|help/i.test(request.prompt)) {
    findings.push(finding('learning-path', 'Work through one audible loop', 'A reliable learning path is import or record, arrange, balance, inspect, export, then reopen the saved project offline.', 'creative_option', ['Every step maps to an existing local workflow'], null));
  }
  if (findings.length === 1) {
    findings.push(finding('next-step', 'Ask about a specific production decision', 'Try arrangement, mix, sampling, release, rights or learning mode. The local brain answers from the project snapshot and labels creative options separately from technical requirements.', 'creative_option', ['No remote provider used'], null));
  }

  return {
    requestId: request.id, providerId: 'poietek-local-default', model: 'poietek-rules-1', generatedAt: now.toISOString(),
    summary: `Local analysis completed for “${request.prompt.trim() || request.mode}”. ${findings.length} evidence-linked findings are ready.`,
    findings, usedRemoteProvider: false, projectChanged: false, unavailableReason: null,
  };
}
