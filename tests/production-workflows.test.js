import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const catalog = require('./.compiled-core/production-workflows/catalog.js');
const controlRoom = require('./.compiled-core/production-workflows/controlRoom.js');
const midi = require('./.compiled-core/production-workflows/midiTransformer.js');
const offline = require('./.compiled-core/production-workflows/offlineProcess.js');
const score = require('./.compiled-core/production-workflows/score.js');
const live = require('./.compiled-core/production-workflows/liveSession.js');
const picture = require('./.compiled-core/production-workflows/picturePost.js');
const assembly = require('./.compiled-core/production-workflows/sequenceAssembly.js');
const batch = require('./.compiled-core/production-workflows/batchDelivery.js');
const {createBlankProject} = require('./.compiled-core/domain/projectFactory.js');
const {ProjectSession} = require('./.compiled-core/project/ProjectSession.js');

function addBatchAudioAsset(project, id, originalName, contentHash = `${id}-hash`) {
  project.assets.push({
    id,
    mediaType: 'audio',
    contentHash,
    originalName,
    mimeType: 'audio/wav',
    byteLength: 1_048_576,
    durationSeconds: 12,
    sampleRate: 48000,
    channels: 2,
    createdAt: new Date().toISOString(),
    tags: [],
    metadata: {},
  });
  return project;
}

test('production workflows fail closed until every required adapter is observed', () => {
  const missing = catalog.deriveProductionReadiness('mastering_delivery', []);
  assert.equal(missing.status, 'adapter_required');
  assert.deepEqual(missing.missingCapabilities, [
    'bs1770_loudness_analysis',
    'oversampled_true_peak',
    'validated_delivery_render',
  ]);

  const observations = missing.missingCapabilities.map((capability, index) => ({
    adapterId: `adapter-${index}`,
    capability,
    state: 'available',
    observedAt: Date.now(),
    evidenceReference: `evidence-${index}`,
  }));
  const observed = catalog.deriveProductionReadiness('mastering_delivery', observations);
  assert.equal(observed.status, 'adapter_observed');
  assert.deepEqual(observed.missingCapabilities, []);
});

test('control room distinguishes saved intent, an observed route and an active stream', () => {
  const saved = controlRoom.createControlRoomState();
  assert.deepEqual(controlRoom.evaluateControlRoom(saved), {
    state: 'not_observed',
    canClaimActiveMonitoring: false,
    message: 'Monitor controls are saved, but no physical output route has been observed.',
  });

  const route = controlRoom.createControlRoomState({
    monitorFormat: '5.1',
    routeObservation: {
      adapterId: 'native-audio',
      outputDeviceId: 'device-1',
      outputChannels: 6,
      observedAt: Date.now(),
    },
  });
  assert.equal(controlRoom.evaluateControlRoom(route).state, 'route_observed');
  assert.equal(controlRoom.evaluateControlRoom(route).canClaimActiveMonitoring, false);

  const active = controlRoom.createControlRoomState({
    ...route,
    routeObservation: {...route.routeObservation, activeStreamId: 'stream-1'},
  });
  assert.equal(controlRoom.evaluateControlRoom(active).canClaimActiveMonitoring, true);
});

test('control room rejects channel layouts unsupported by the observed route', () => {
  assert.throws(() => controlRoom.createControlRoomState({
    monitorFormat: '7.1.4',
    routeObservation: {
      adapterId: 'native-audio',
      outputDeviceId: 'stereo-device',
      outputChannels: 2,
      observedAt: Date.now(),
    },
  }), /requires at least 12 observed output channels/);
});

test('MIDI transformer applies deterministic range, pitch, velocity and channel rules', () => {
  const rule = {
    bypass: false,
    transposeSemitones: 12,
    velocityScale: 1.5,
    lowNote: 48,
    highNote: 84,
    outputChannel: 4,
  };
  assert.deepEqual(midi.transformMidiNoteMessage({
    type: 'note_on', channel: 1, note: 60, velocity: 100,
  }, rule), {
    kind: 'forward',
    message: {type: 'note_on', channel: 4, note: 72, velocity: 127},
  });
  assert.deepEqual(midi.transformMidiNoteMessage({
    type: 'note_on', channel: 1, note: 36, velocity: 100,
  }, rule), {
    kind: 'filtered',
    reason: 'Note is outside the configured input range.',
  });
});

test('offline process chains are immutable, revisioned and renderer-gated', () => {
  const empty = offline.createOfflineProcessChain('asset-1');
  const withGain = offline.appendOfflineProcessStep(empty, {
    id: 'gain-1',
    kind: 'gain',
    enabled: true,
    parameters: {gainDb: -2},
  });
  const bypassed = offline.setOfflineProcessStepEnabled(withGain, 'gain-1', false);
  assert.equal(empty.revision, 0);
  assert.equal(empty.steps.length, 0);
  assert.equal(withGain.revision, 1);
  assert.equal(bypassed.revision, 2);
  assert.equal(bypassed.steps[0].enabled, false);
  assert.equal(offline.createOfflineRenderRequest(withGain, []).state, 'adapter_required');
  const ready = offline.createOfflineRenderRequest(withGain, [{
    adapterId: 'offline-renderer',
    capability: 'offline_audio_render',
    state: 'available',
    observedAt: Date.now(),
  }]);
  assert.equal(ready.state, 'ready_for_adapter');
  assert.equal(ready.adapterId, 'offline-renderer');
});

test('score model stores written notes, derives parts and round-trips through canonical project extensions', () => {
  let document = score.createScoreDocument('score-1', 'Picture Cue');
  document = score.addScorePlayer(document, {
    id: 'player-violin',
    name: 'Violin 1',
    instrumentName: 'Violin',
    transpositionSemitones: 0,
    staffCount: 1,
  });
  document = score.addScorePlayer(document, {
    id: 'player-horn',
    name: 'Horn 1',
    instrumentName: 'Horn in F',
    transpositionSemitones: -7,
    staffCount: 1,
  });
  document = score.insertScoreNote(document, 'score-1:flow:1', 1, {
    id: 'note-1',
    playerId: 'player-violin',
    voice: 1,
    startBeat: 0,
    durationBeats: 1,
    writtenPitch: {step: 'G', octave: 4, alteration: 1},
    articulations: ['staccato'],
    dynamic: 'mf',
  });
  assert.deepEqual(score.validateScoreDocument(document), []);
  const violinPart = score.deriveScorePart(document, 'player-violin');
  const hornPart = score.deriveScorePart(document, 'player-horn');
  assert.equal(violinPart.flows[0].measures[0].notes.length, 1);
  assert.equal(hornPart.flows[0].measures[0].notes.length, 0);

  const project = score.withProjectScoreDocument(createBlankProject('Cue'), document);
  assert.deepEqual(score.getProjectScoreDocument(project), document);
  assert.doesNotThrow(() => JSON.stringify(project));
});

test('MusicXML remains unavailable without interchange evidence', () => {
  const document = score.createScoreDocument('score-2', 'Interchange');
  assert.equal(score.createMusicXmlExportRequest(document, []).state, 'adapter_required');
  const ready = score.createMusicXmlExportRequest(document, [{
    adapterId: 'musicxml-adapter',
    capability: 'musicxml_interchange',
    state: 'available',
    observedAt: Date.now(),
    evidenceReference: 'fixture:musicxml-basic-1',
  }]);
  assert.equal(ready.state, 'ready_for_adapter');
});

function createLiveProject() {
  const project = createBlankProject('Live room');
  project.tracks = [
    {id: 'track-vocal', type: 'audio', name: 'Lead Vocal', order: 0, color: null, clips: [], mixer: {gainDb: 0, pan: 0, mute: false, solo: false}},
    {id: 'track-guitar', type: 'audio', name: 'Guitar', order: 1, color: null, clips: [], mixer: {gainDb: 0, pan: 0, mute: false, solo: false}},
  ];
  project.assets = [{
    id: 'asset-take-1',
    mediaType: 'audio',
    contentHash: 'sha256:take-1',
    originalName: 'take-1.wav',
    mimeType: 'audio/wav',
    byteLength: 4096,
    durationSeconds: 12,
    sampleRate: 48000,
    channels: 2,
    createdAt: '2026-08-22T00:00:00.000Z',
    tags: ['recorded'],
    metadata: {},
  }];
  return project;
}

test('live session capture plans round-trip through the canonical project extension', () => {
  const project = createLiveProject();
  let state = live.createLiveSessionState(project.id);
  state = live.upsertLiveCaptureChannel(state, {
    id: 'mic-1',
    sourceName: 'Lead Vocal',
    sourceKind: 'microphone',
    captureIntent: 'armed',
    canonicalTrackId: 'track-vocal',
    namingAuthority: 'source',
  });
  state = live.upsertLiveCaptureChannel(state, {
    id: 'usb-left',
    sourceName: 'USB Left',
    sourceKind: 'usb_left',
    captureIntent: 'safe',
    canonicalTrackId: 'track-guitar',
    namingAuthority: 'track',
  });
  const stored = live.withProjectLiveSessionState(project, state);
  assert.deepEqual(live.getProjectLiveSessionState(stored), state);
  assert.doesNotThrow(() => JSON.stringify(stored));

  const sync = live.deriveChannelNameSyncPlan(state, project);
  assert.equal(sync.conflicts.length, 0);
  assert.equal(sync.canApplyAutomatically, true);
  assert.equal(sync.entries[0].status, 'already_matched');
  assert.equal(sync.entries[1].status, 'rename_source');
});

test('live session remote policies enforce consent, issuer authority and least privilege', () => {
  const state = live.createLiveSessionState('project-1');
  assert.throws(() => live.upsertRemoteAccessRule(state, {
    id: 'performer', subjectLabel: 'Performer', role: 'performer',
    scopes: ['full_mix'], assignedCueId: null, consentAcknowledgedAt: '2026-08-22T00:00:00.000Z',
  }, 'owner'), /scope that the role cannot receive/);
  assert.throws(() => live.upsertRemoteAccessRule(state, {
    id: 'engineer', subjectLabel: 'Engineer', role: 'engineer',
    scopes: ['read_only'], assignedCueId: null, consentAcknowledgedAt: '2026-08-22T00:00:00.000Z',
  }, 'engineer'), /Only the project owner/);
  assert.throws(() => live.upsertRemoteAccessRule(state, {
    id: 'performer', subjectLabel: 'Performer', role: 'performer',
    scopes: ['assigned_cue', 'read_only'], assignedCueId: 'cue-a', consentAcknowledgedAt: null,
  }, 'owner'), /explicit local consent acknowledgement/);

  const next = live.upsertRemoteAccessRule(state, {
    id: 'performer', subjectLabel: 'Performer', role: 'performer',
    scopes: ['assigned_cue', 'read_only'], assignedCueId: 'cue-a',
    consentAcknowledgedAt: '2026-08-22T00:00:00.000Z',
  }, 'owner');
  assert.equal(next.remoteAccessRules.length, 1);
  assert.deepEqual(next.remoteAccessRules[0].scopes, ['assigned_cue', 'read_only']);
});

test('virtual soundcheck remains fail-closed through asset, route and adapter gates', () => {
  const project = createLiveProject();
  let state = live.createLiveSessionState(project.id);
  assert.equal(live.createVirtualSoundcheckRequest(state, project, []).state, 'recorded_assets_required');

  state = live.setVirtualSoundcheckSelection(state, ['asset-take-1'], 'main-output');
  assert.equal(live.createVirtualSoundcheckRequest(state, project, []).state, 'output_route_required');
  state = live.recordSessionEndpointObservation(state, {
    id: 'output-observation',
    adapterId: 'native-audio',
    endpointId: 'main-output',
    endpointName: 'Main Output',
    direction: 'output',
    state: 'available',
    observedAt: Date.now(),
    compatibility: 'compatible',
    firmwareVersion: '1.2.3',
    evidenceReference: 'fixture:route-1',
  });
  assert.equal(live.createVirtualSoundcheckRequest(state, project, []).state, 'adapter_required');

  const ready = live.createVirtualSoundcheckRequest(state, project, [{
    adapterId: 'soundcheck-adapter',
    capability: 'virtual_soundcheck_playback',
    state: 'available',
    observedAt: Date.now(),
    evidenceReference: 'fixture:soundcheck-1',
  }]);
  assert.equal(ready.state, 'ready_for_adapter');
  assert.equal(ready.adapterId, 'soundcheck-adapter');
  assert.match(ready.message, /Playback is not active/);
});

test('live session endpoint and interchange evidence cannot be inferred', () => {
  const state = live.createLiveSessionState('project-1');
  assert.throws(() => live.recordSessionEndpointObservation(state, {
    id: 'impossible', adapterId: 'native-audio', endpointId: 'out-1', endpointName: 'Output',
    direction: 'output', state: 'unavailable', observedAt: Date.now(), activeStreamId: 'stream-1',
    compatibility: 'unknown',
  }), /cannot retain an active stream/);

  assert.equal(live.deriveSessionInterchangeReadiness('dawproject', []).state, 'adapter_required');
  assert.equal(live.deriveSessionInterchangeReadiness('ara_audio_access', [{
    adapterId: 'ara-adapter', capability: 'ara_audio_access', state: 'available', observedAt: Date.now(),
  }]).state, 'adapter_observed');
});

test('live session extension rejects cross-project and missing-track references', () => {
  const project = createLiveProject();
  assert.throws(() => live.withProjectLiveSessionState(project, live.createLiveSessionState('another-project')), /does not match/);
  const invalid = live.upsertLiveCaptureChannel(live.createLiveSessionState(project.id), {
    id: 'mic-1', sourceName: 'Mic 1', sourceKind: 'microphone', captureIntent: 'safe',
    canonicalTrackId: 'missing-track', namingAuthority: 'track',
  });
  assert.throws(() => live.withProjectLiveSessionState(project, invalid), /references missing track/);
});

function createPostProject() {
  const project = createBlankProject('Dialog post');
  project.settings.sampleRate = 48000;
  project.tracks = [
    {id: 'track-dialog', type: 'audio', name: 'DX Record', order: 0, color: null, clips: [], mixer: {gainDb: 0, pan: 0, mute: false, solo: false}},
  ];
  project.assets = [
    {
      id: 'picture-1', mediaType: 'video', contentHash: 'sha256:picture', originalName: 'picture-reference.mov',
      mimeType: 'video/quicktime', byteLength: 8192, durationSeconds: 120, sampleRate: null, channels: null,
      createdAt: '2026-08-22T00:00:00.000Z', tags: ['picture'], metadata: {constantFrameRate: true},
    },
    {
      id: 'take-1', mediaType: 'audio', contentHash: 'sha256:take-1', originalName: 'S12_T03_Boom.wav',
      mimeType: 'audio/wav', byteLength: 4096, durationSeconds: 5, sampleRate: 48000, channels: 1,
      createdAt: '2026-08-22T00:00:00.000Z', tags: ['field-recorder'], metadata: {scene: '12', take: '3', tape: 'A'},
    },
    {
      id: 'not-a-take', mediaType: 'image', contentHash: 'sha256:image', originalName: 'slate.png',
      mimeType: 'image/png', byteLength: 2048, durationSeconds: null, sampleRate: null, channels: null,
      createdAt: '2026-08-22T00:00:00.000Z', tags: [], metadata: {},
    },
  ];
  return project;
}

function addPostCue(state, overrides = {}) {
  return picture.upsertAdrCue(state, {
    id: 'cue-001', cueNumber: '001', kind: 'dialogue', startFrame: 240, endFrame: 300,
    character: 'Guide', dialogue: 'The signal is clear.', notes: '', targetTrackId: 'track-dialog',
    status: 'scripted', sessionMode: 'idle', fieldReference: {scene: '12', take: '3', tape: 'A'},
    preferredTakeId: null, ...overrides,
  });
}

test('picture post timecode supports film, high-frame-rate and drop-frame counts', () => {
  assert.equal(picture.timecodeToFrames('01:00:00:00', '24'), 86400);
  assert.equal(picture.framesToTimecode(86400, '24'), '01:00:00:00');
  assert.equal(picture.timecodeToFrames('00:01:00;02', '29.97_df'), 1800);
  assert.equal(picture.framesToTimecode(1800, '29.97_df'), '00:01:00;02');
  assert.equal(picture.framesToTimecode(6000, '60'), '00:01:40:00');
  assert.throws(() => picture.timecodeToFrames('00:01:00;00', '29.97_df'), /skipped frame number/);
  assert.throws(() => picture.timecodeToFrames('00:00:00;00', '24'), /must use a colon/);
});

test('picture post cues and take references round-trip through the canonical project', () => {
  const project = createPostProject();
  let state = picture.createPicturePostState(project.id, {frameRate: '24', pictureAssetId: 'picture-1'});
  state = addPostCue(state);
  state = picture.logAdrTakeReference(state, project, {
    id: 'cue-001:take:1', cueId: 'cue-001', takeNumber: 1, audioAssetId: 'take-1',
    performer: 'Guide', rating: 4, notes: 'Clean boom channel.',
  });
  state = picture.setPreferredAdrTake(state, 'cue-001', 'cue-001:take:1');
  const stored = picture.withProjectPicturePostState(project, state);
  assert.deepEqual(picture.getProjectPicturePostState(stored), state);
  assert.doesNotThrow(() => JSON.stringify(stored));
  assert.equal(picture.formatProjectTimecode(state, 240), '01:00:10:00');
});

test('picture post refuses invented or cross-cue ADR takes', () => {
  const project = createPostProject();
  let state = addPostCue(picture.createPicturePostState(project.id));
  assert.throws(() => picture.logAdrTakeReference(state, project, {
    id: 'take-image', cueId: 'cue-001', takeNumber: 1, audioAssetId: 'not-a-take',
    performer: 'Guide', rating: null, notes: '',
  }), /existing canonical audio asset/);
  state = picture.logAdrTakeReference(state, project, {
    id: 'take-audio', cueId: 'cue-001', takeNumber: 1, audioAssetId: 'take-1',
    performer: 'Guide', rating: null, notes: '',
  });
  state = addPostCue(state, {id: 'cue-002', cueNumber: '002', startFrame: 400, endFrame: 460, fieldReference: null});
  assert.throws(() => picture.setPreferredAdrTake(state, 'cue-002', 'take-audio'), /must belong/);
});

test('ADR status is saved as transport intent and never claims active recording', () => {
  let state = addPostCue(picture.createPicturePostState('project-post'));
  state = picture.setAdrCueStatus(state, 'cue-001', 'rehearsed', 'rehearse_intent');
  assert.equal(state.cues[0].sessionMode, 'rehearse_intent');
  state = picture.setAdrCueStatus(state, 'cue-001', 'record_ready', 'record_intent');
  assert.equal(state.cues[0].status, 'record_ready');
  assert.equal(state.cues[0].sessionMode, 'record_intent');
  assert.doesNotMatch(JSON.stringify(state), /activeStreamId|recording_active/);
});

test('field-recorder matching requires canonical scene and take metadata', () => {
  const project = createPostProject();
  const state = addPostCue(picture.createPicturePostState(project.id));
  const match = picture.deriveFieldRecorderMatchPlan(state, project, 'cue-001');
  assert.equal(match.matches.length, 1);
  assert.deepEqual(match.matches[0].matchedAttributes, ['scene', 'take', 'tape']);
  assert.equal(match.matches[0].confidence, 'strong');

  const noReference = addPostCue(picture.createPicturePostState(project.id), {fieldReference: null});
  assert.equal(picture.deriveFieldRecorderMatchPlan(noReference, project, 'cue-001').matches.length, 0);
});

test('ReConform preview shifts contained cues but blocks cuts and duration changes', () => {
  let state = addPostCue(picture.createPicturePostState('project-post'));
  state = addPostCue(state, {id: 'cue-002', cueNumber: '002', startFrame: 360, endFrame: 420, fieldReference: null});
  const preview = picture.createReconformPreview(state, 'change-edl-1', [{
    id: 'segment-1', roll: 'A001', clipName: 'Shot 1',
    oldStartFrame: 200, oldEndFrame: 500, newStartFrame: 224, newEndFrame: 524,
  }]);
  assert.equal(preview.canApply, true);
  assert.deepEqual(preview.entries.map((entry) => entry.nextStartFrame), [264, 384]);
  const applied = picture.applyReconformPreview(state, preview);
  assert.deepEqual(applied.cues.map((cue) => cue.startFrame), [264, 384]);
  assert.deepEqual(applied.lastReconform.changedCueIds, ['cue-001', 'cue-002']);
  assert.throws(() => picture.applyReconformPreview(applied, preview), /stale/);

  const blocked = picture.createReconformPreview(state, 'change-edl-2', [{
    id: 'segment-2', roll: 'A001', clipName: 'Retimed shot',
    oldStartFrame: 200, oldEndFrame: 500, newStartFrame: 200, newEndFrame: 510,
  }]);
  assert.equal(blocked.canApply, false);
  assert.equal(blocked.entries[0].state, 'manual_review');
  assert.throws(() => picture.applyReconformPreview(state, blocked), /unresolved editorial decisions/);
});

test('picture post cue-sheet CSV is chronological and safely escaped', () => {
  let state = picture.createPicturePostState('project-post');
  state = addPostCue(state, {id: 'cue-b', cueNumber: 'B', startFrame: 480, endFrame: 540, dialogue: 'Later'});
  state = addPostCue(state, {id: 'cue-a', cueNumber: 'A', startFrame: 120, endFrame: 180, dialogue: 'Say "hello", please'});
  const csv = picture.createAdrCueSheetCsv(state);
  assert.ok(csv.indexOf('"A"') < csv.indexOf('"B"'));
  assert.match(csv, /"Say ""hello"", please"/);
  assert.match(csv, /"01:00:05:00"/);
});

test('a ReConform apply is one atomic ProjectSession undo point', async () => {
  const project = createPostProject();
  let state = addPostCue(picture.createPicturePostState(project.id, {pictureAssetId: 'picture-1'}));
  const withPost = picture.withProjectPicturePostState(project, state);
  const session = new ProjectSession(withPost, {save: async () => undefined});
  const preview = picture.createOffsetReconformPreview(state, 'revision-offset', 24);
  const applied = await session.mutate((current) => picture.mutateProjectPicturePostState(
    current,
    (currentState) => picture.applyReconformPreview(currentState, preview),
  ));
  assert.equal(picture.getProjectPicturePostState(applied).cues[0].startFrame, 264);
  const undone = await session.undo();
  assert.equal(picture.getProjectPicturePostState(undone).cues[0].startFrame, 240);
  const redone = await session.redo();
  assert.equal(picture.getProjectPicturePostState(redone).cues[0].startFrame, 264);
});

test('picture post extension rejects cross-project and missing canonical references', () => {
  const project = createPostProject();
  assert.throws(() => picture.withProjectPicturePostState(project, picture.createPicturePostState('other-project')), /does not match/);
  const missingTrack = addPostCue(picture.createPicturePostState(project.id), {targetTrackId: 'missing-track'});
  assert.throws(() => picture.withProjectPicturePostState(project, missingTrack), /references missing track/);
  const missingPicture = picture.createPicturePostState(project.id, {pictureAssetId: 'missing-video'});
  assert.throws(() => picture.withProjectPicturePostState(project, missingPicture), /missing video asset/);
});

function createAssemblyProject() {
  const project = createBlankProject('Sequence Assembly Test');
  project.tracks = [{
    id: 'track-sequence', type: 'instrument', name: 'Shared Instrument', order: 0,
    color: null, clips: [], mixer: {gainDb: 0, pan: 0, mute: false, solo: false},
  }];
  return project;
}

function addAssemblySequences(state) {
  const song = assembly.createProjectSequence('song-a', 'Song A', 'song', 32, {
    canonicalTrackIds: ['track-sequence'], bpm: 100, tonic: 9, mode: 'minor',
  });
  const cue = assembly.createProjectSequence('cue-b', 'Cue B', 'picture_cue', 16, {
    canonicalTrackIds: ['track-sequence'], bpm: 84, meter: [3, 4], tonic: 2, mode: 'dorian',
  });
  return assembly.upsertProjectSequence(assembly.upsertProjectSequence(state, song), cue);
}

test('sequence assembly stores independent conductor maps and sorts updates', () => {
  let state = addAssemblySequences(assembly.createSequenceAssemblyState('project-assembly'));
  state = assembly.updateSequenceConductor(state, 'song-a', {
    tempo: [
      {id: 'tempo-late', beat: 24, bpm: 108, curve: 'linear'},
      {id: 'tempo-zero', beat: 0, bpm: 100, curve: 'step'},
      {id: 'tempo-middle', beat: 16, bpm: 104, curve: 'linear'},
    ],
    markers: [{id: 'marker-hit', beat: 24, name: 'Hit', role: 'hit'}],
  });
  assert.deepEqual(state.sequences.find((sequence) => sequence.id === 'song-a').conductor.tempo.map((event) => event.beat), [0, 16, 24]);
  assert.equal(state.sequences.find((sequence) => sequence.id === 'cue-b').conductor.tempo[0].bpm, 84);
  const position = assembly.getSequenceConductorPosition(state, 'song-a', 24);
  assert.equal(position.tempo.bpm, 108);
  assert.equal(position.markers[0].name, 'Hit');
});

test('sequence programs resolve count-ins, repeats and boundaries deterministically', () => {
  let state = addAssemblySequences(assembly.createSequenceAssemblyState('project-assembly'));
  state = assembly.upsertSequenceProgram(state, {
    id: 'program-a', name: 'Program A', notes: '', entries: [
      {id: 'entry-song', sequenceId: 'song-a', repeats: 1, transition: 'continue', countInBeats: 0},
      {id: 'entry-cue', sequenceId: 'cue-b', repeats: 2, transition: 'count_in', countInBeats: 4},
    ],
  });
  const plan = assembly.resolveSequenceProgram(state, 'program-a');
  assert.equal(plan.totalBeats, 72);
  assert.deepEqual(plan.passes.map((pass) => [pass.sequenceId, pass.countInStartBeat, pass.sourceStartBeat, pass.sourceEndBeat]), [
    ['song-a', null, 0, 32],
    ['cue-b', 32, 36, 52],
    ['cue-b', 52, 56, 72],
  ]);
  assert.match(plan.claim, /does not claim transport playback/);
});

test('shared sequence resources remain references until capabilities are observed', () => {
  let state = addAssemblySequences(assembly.createSequenceAssemblyState('project-assembly'));
  state = assembly.upsertSharedSequenceResource(state, {
    id: 'shared-instrument', name: 'Shared Instrument', kind: 'instrument',
    canonicalTrackId: 'track-sequence', processorReference: 'Original synth',
    requiredCapability: 'shared_processor_host', engineState: 'adapter_required',
  });
  state = assembly.setSequenceSharedResources(state, 'song-a', ['shared-instrument']);
  state = assembly.upsertSequenceProgram(state, {
    id: 'program-a', name: 'Program A', notes: '', entries: [
      {id: 'entry-song', sequenceId: 'song-a', repeats: 1, transition: 'stop', countInBeats: 0},
    ],
  });
  const missing = assembly.deriveSequenceAssemblyReadiness(state, []);
  assert.equal(missing.localPlanReady, true);
  assert.equal(missing.sharedResourcesObserved, false);
  assert.deepEqual(missing.missingCapabilities, ['shared_processor_host', 'sequence_transport', 'sequence_audio_render']);
  const observed = assembly.deriveSequenceAssemblyReadiness(state, missing.missingCapabilities);
  assert.equal(observed.sharedResourcesObserved, true);
  assert.equal(observed.playbackObserved, true);
  assert.equal(observed.renderObserved, true);
});

test('sequence assembly round-trips through the canonical project and rejects missing tracks', () => {
  const project = createAssemblyProject();
  const state = addAssemblySequences(assembly.createSequenceAssemblyState(project.id));
  const stored = assembly.withProjectSequenceAssemblyState(project, state);
  assert.deepEqual(assembly.getProjectSequenceAssemblyState(stored), state);
  const invalidProject = {...project, tracks: []};
  assert.throws(() => assembly.withProjectSequenceAssemblyState(invalidProject, state), /references missing track/);
  assert.throws(() => assembly.withProjectSequenceAssemblyState(project, assembly.createSequenceAssemblyState('other-project')), /does not match/);
});

test('sequence program manifest is planning metadata and never masquerades as rendered media', () => {
  let state = addAssemblySequences(assembly.createSequenceAssemblyState('project-assembly'));
  state = assembly.upsertSequenceProgram(state, {
    id: 'program-a', name: 'Program A', notes: 'Approval pending', entries: [
      {id: 'entry-song', sequenceId: 'song-a', repeats: 1, transition: 'stop', countInBeats: 0},
    ],
  });
  const manifest = JSON.parse(assembly.createSequenceProgramManifest(state, 'program-a'));
  assert.equal(manifest.schema, 'org.poietek.sequence-program-manifest/1.0.0');
  assert.match(manifest.truth, /No audio, plug-in, device/);
  assert.equal(manifest.plan.passes[0].sequenceName, 'Song A');
  assert.equal('renderedAudio' in manifest, false);
});

test('sequence assembly fails closed on invalid conductors, programs and links', () => {
  let state = addAssemblySequences(assembly.createSequenceAssemblyState('project-assembly'));
  const song = state.sequences.find((sequence) => sequence.id === 'song-a');
  assert.throws(() => assembly.upsertProjectSequence(state, {
    ...song, conductor: {...song.conductor, tempo: [{id: 'late', beat: 4, bpm: 100, curve: 'step'}]},
  }), /tempo event at beat zero/);
  assert.throws(() => assembly.upsertSequenceProgram(state, {
    id: 'bad', name: 'Bad', notes: '', entries: [
      {id: 'entry', sequenceId: 'missing', repeats: 1, transition: 'stop', countInBeats: 0},
    ],
  }), /missing sequence/);
  assert.throws(() => assembly.setSequenceSharedResources(state, 'song-a', ['missing-resource']), /Unknown shared resource/);
});

test('sequence assembly edits are atomic ProjectSession undo points', async () => {
  const project = createAssemblyProject();
  const session = new ProjectSession(project, {save: async () => undefined});
  const edited = await session.mutate((current) => assembly.mutateProjectSequenceAssemblyState(
    current,
    (state) => assembly.upsertProjectSequence(state, assembly.createProjectSequence('song-a', 'Song A', 'song', 32, {canonicalTrackIds: ['track-sequence']})),
  ));
  assert.equal(assembly.getProjectSequenceAssemblyState(edited).sequences.length, 1);
  const undone = await session.undo();
  assert.equal(assembly.getProjectSequenceAssemblyState(undone), null);
  const redone = await session.redo();
  assert.equal(assembly.getProjectSequenceAssemblyState(redone).activeSequenceId, 'song-a');
});

test('batch delivery resolves every selected canonical asset into portable multi-output paths', () => {
  const project = addBatchAudioAsset(
    addBatchAudioAsset(createBlankProject('Night Drive: Mix'), 'asset-a', 'Kick CON?.wav', '0123456789abcdef'),
    'asset-b',
    'Vocal Take 01.wav',
    'fedcba9876543210',
  );
  const state = batch.createBatchDeliveryStarter(project);
  const plan = batch.createBatchDryRunPlan(state, project);

  assert.equal(state.sourceAssetIds.length, 2);
  assert.equal(state.outputs.length, 3);
  assert.equal(plan.entries.length, 6);
  assert.equal(plan.readyCount, 6);
  assert.equal(plan.blockedCount, 0);
  assert.equal(plan.canQueue, true);
  for (const entry of plan.entries) {
    assert.equal(entry.relativePath.startsWith('/'), false);
    assert.equal(entry.relativePath.includes('\\'), false);
    assert.equal(entry.relativePath.split('/').includes('..'), false);
    assert.match(entry.relativePath, /Night Drive- Mix\//);
  }
  assert.match(plan.entries[0].relativePath, /001_Kick CON_v1\.wav$/);
  assert.match(batch.createBatchDeliveryManifest(state, project), /Planning metadata only/);
});

test('batch naming rejects path escape, rooted paths, unknown tokens and unsafe literals', () => {
  assert.match(batch.validateBatchNamingTemplate('../outside/{asset}.{ext}').join(' '), /parent-directory/);
  assert.match(batch.validateBatchNamingTemplate('C:\\outside\\{asset}.{ext}').join(' '), /relative|forward slashes/);
  assert.match(batch.validateBatchNamingTemplate('{project}/{secret}/{asset}.{ext}').join(' '), /Unknown output naming token/);
  assert.match(batch.validateBatchNamingTemplate('{project}/bad:name/{asset}.{ext}').join(' '), /unsafe/);
  assert.match(batch.validateBatchNamingTemplate('{project}/{counter:12}_{asset}.{ext}').join(' '), /1 to 6/);
});

test('batch dry run preserves existing files, versions conflicts and blocks ambiguous planned duplicates', () => {
  const project = addBatchAudioAsset(createBlankProject('Collision Lab'), 'asset-a', 'Tone.wav');
  const starter = batch.createBatchDeliveryStarter(project);
  const first = {...starter.outputs[0], namingTemplate: 'delivery/fixed.{ext}', conflictPolicy: 'skip'};
  const versioned = {...starter.outputs[1], format: 'wav', namingTemplate: 'delivery/fixed.{ext}', conflictPolicy: 'version'};
  const versionState = {...starter, revision: starter.revision + 1, outputs: [first, versioned]};
  const plan = batch.createBatchDryRunPlan(versionState, project, {existingRelativePaths: ['delivery/fixed.wav']});

  assert.equal(plan.entries[0].state, 'skipped');
  assert.equal(plan.entries[1].state, 'ready');
  assert.equal(plan.entries[1].relativePath, 'delivery/fixed-v2.wav');
  assert.deepEqual(plan.collisionPaths, ['delivery/fixed.wav']);
  assert.equal(plan.canQueue, true);

  const duplicateState = {...versionState, revision: versionState.revision + 1, outputs: [first, {...versioned, conflictPolicy: 'skip'}]};
  const duplicatePlan = batch.createBatchDryRunPlan(duplicateState, project);
  assert.equal(duplicatePlan.entries[0].state, 'ready');
  assert.equal(duplicatePlan.entries[1].state, 'blocked');
  assert.equal(duplicatePlan.canQueue, false);
});

test('batch delivery requires an evidenced pilot and every declared adapter before render handoff', () => {
  const project = addBatchAudioAsset(createBlankProject('Pilot Lab'), 'asset-a', 'Pilot.wav');
  const starter = batch.createBatchDeliveryStarter(project);
  const initialPlan = batch.createBatchDryRunPlan(starter, project);
  const initial = batch.deriveBatchDeliveryReadiness(starter, initialPlan, []);
  assert.equal(initial.localPlanReady, true);
  assert.equal(initial.pilotApproved, false);
  assert.equal(initial.canRequestRender, false);
  assert.ok(initial.missingCapabilities.includes('batch_audio_render'));
  assert.ok(initial.missingCapabilities.includes('bs1770_loudness_analysis'));

  const observed = batch.observeBatchPilotPreview(starter, {
    adapterId: 'native-batch-host',
    capability: 'batch_preview_render',
    planKey: batch.createBatchPlanKey(starter),
    evidenceReference: 'pilot-render-001',
    observedAt: 100,
  });
  const approved = batch.approveBatchPilot(observed, 101);
  const approvedPlan = batch.createBatchDryRunPlan(approved, project);
  const missing = batch.deriveBatchDeliveryReadiness(approved, approvedPlan, []);
  const observations = missing.missingCapabilities.map((capability, index) => ({
    adapterId: 'native-batch-host',
    capability,
    state: 'available',
    observedAt: 102 + index,
    evidenceReference: `capability-${index}`,
  }));
  const ready = batch.deriveBatchDeliveryReadiness(approved, approvedPlan, observations);
  assert.equal(ready.pilotApproved, true);
  assert.equal(ready.adaptersObserved, true);
  assert.equal(ready.canRequestRender, true);
  assert.throws(() => batch.deriveBatchDeliveryReadiness(approved, initialPlan, observations), /stale/);
  assert.equal(batch.setBatchSourceAssetIds(approved, project, approved.sourceAssetIds).pilot.status, 'preview_required');
  assert.throws(() => batch.observeBatchPilotPreview(starter, {
    adapterId: 'native-batch-host', capability: 'batch_preview_render', planKey: 'batch-plan-stale', evidenceReference: 'wrong-plan', observedAt: 103,
  }), /another batch plan/);
});

test('batch delivery round-trips through the canonical extension and edits undo atomically', async () => {
  const project = addBatchAudioAsset(createBlankProject('Batch History'), 'asset-a', 'Source.wav');
  const session = new ProjectSession(project, {save: async () => undefined});
  const starter = batch.createBatchDeliveryStarter(project);
  await session.mutate((current) => batch.withProjectBatchDeliveryState(current, starter));
  assert.equal(batch.getProjectBatchDeliveryState(session.getSnapshot()).outputs.length, 3);

  await session.mutate((current) => batch.mutateProjectBatchDeliveryState(current, (state) => (
    batch.upsertBatchRecipeNode(state, {...state.recipe.nodes[0], enabled: false})
  )));
  assert.equal(batch.getProjectBatchDeliveryState(session.getSnapshot()).recipe.nodes[0].enabled, false);
  assert.equal(batch.getProjectBatchDeliveryState(session.getSnapshot()).pilot.status, 'preview_required');
  await session.undo();
  assert.equal(batch.getProjectBatchDeliveryState(session.getSnapshot()).recipe.nodes[0].enabled, true);
  assert.equal(catalog.getProductionWorkflowDefinition('batch_delivery').engineState, 'native_required');
});
