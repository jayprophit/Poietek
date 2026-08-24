import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const automation = require('./.compiled-core/composition-workflows/automation.js');
const capture = require('./.compiled-core/composition-workflows/captureRecall.js');
const loops = require('./.compiled-core/composition-workflows/loopStarter.js');
const patterns = require('./.compiled-core/composition-workflows/patterns.js');
const piano = require('./.compiled-core/composition-workflows/pianoRoll.js');
const songMap = require('./.compiled-core/composition-workflows/songMap.js');
const mixScenes = require('./.compiled-core/composition-workflows/mixScenes.js');
const projectCommands = require('./.compiled-core/composition-workflows/projectCommands.js');
const {createBlankProject} = require('./.compiled-core/domain/projectFactory.js');
const {ProjectSession} = require('./.compiled-core/project/ProjectSession.js');
const {addAudioTrack} = require('./.compiled-core/project/operations.js');

const note = (tick, midi, durationTicks = 240, noteId = null) => ({
  tick,
  type: 'note',
  channel: 0,
  note: midi,
  velocity: 100,
  durationTicks,
  releaseVelocity: null,
  noteId,
});

const clip = (events, durationTicks = 1920) => ({
  id: 'midi-1',
  trackId: 'track-1',
  name: 'Test notes',
  startTick: 0,
  durationTicks,
  loopStartTick: 0,
  loopEndTick: durationTicks,
  events,
});

test('patterns are immutable, channel-scoped and safely cloneable', () => {
  const empty = patterns.createPattern('pattern-a', 'Pattern A');
  const withChannel = patterns.addPatternChannel(empty, {
    id: 'kick',
    name: 'Kick',
    kind: 'sampler',
    color: '#22d3ee',
    targetModuleId: 'sampler-1',
    mixerTargetId: 'mix-1',
    muted: false,
    solo: false,
  });
  const programmed = patterns.setPatternStep(withChannel, 'kick', 0, {
    note: 36,
    velocity: 120,
    probability: 0.9,
    microShiftTicks: -3,
    lengthSteps: 1,
  });
  const cloned = patterns.clonePattern(programmed, 'pattern-b');

  assert.equal(empty.channels.length, 0);
  assert.equal(withChannel.channels[0].steps.length, 0);
  assert.equal(programmed.channels[0].steps[0].velocity, 120);
  assert.equal(cloned.id, 'pattern-b');
  assert.notEqual(cloned.channels, programmed.channels);
  assert.throws(() => patterns.setPatternStep(programmed, 'kick', 16, null), /between 0 and 15/);
});

test('canonical Pattern Rack actions initialize, edit, vary and arrange without transient truth', async () => {
  const initial = createBlankProject('Pattern Rack commands');
  const saves = [];
  const session = new ProjectSession(initial, {save: async (snapshot) => { saves.push(snapshot); }});

  const initialized = await session.mutate((current) => projectCommands.applyProjectPatternRackAction(current, {
    type: 'initialize_starter',
  }));
  const starterState = patterns.getProjectCompositionWorkflow(initialized);
  assert.equal(starterState.patterns.length, 1);
  assert.equal(starterState.patterns[0].channels.length, 4);
  assert.equal(starterState.lanes[0].binding, 'instrument');
  assert.equal(starterState.patterns[0].swing, 0.55);

  const starterPattern = starterState.patterns[0];
  const edited = await session.mutate((current) => projectCommands.applyProjectPatternRackAction(current, {
    type: 'toggle_step',
    patternId: starterPattern.id,
    channelId: 'kick',
    stepIndex: 1,
    note: 36,
  }));
  assert.equal(
    patterns.getProjectCompositionWorkflow(edited).patterns[0].channels[0].steps.some((step) => step.stepIndex === 1),
    true,
  );

  const swung = await session.mutate((current) => projectCommands.applyProjectPatternRackAction(current, {
    type: 'set_swing', patternId: starterPattern.id, swing: 0.6,
  }));
  assert.equal(patterns.getProjectCompositionWorkflow(swung).patterns[0].swing, 0.6);

  const varied = await session.mutate((current) => projectCommands.applyProjectPatternRackAction(current, {
    type: 'clone_pattern', patternId: starterPattern.id,
  }));
  const variedState = patterns.getProjectCompositionWorkflow(varied);
  assert.equal(variedState.patterns.length, 2);
  assert.notEqual(variedState.patterns[0].channels, variedState.patterns[1].channels);

  const arranged = await session.mutate((current) => projectCommands.applyProjectPatternRackAction(current, {
    type: 'place_next', patternId: starterPattern.id,
  }));
  const arrangedTwice = await session.mutate((current) => projectCommands.applyProjectPatternRackAction(current, {
    type: 'place_next', patternId: starterPattern.id,
  }));
  const clips = patterns.getProjectCompositionWorkflow(arrangedTwice).lanes[0].clips;
  assert.deepEqual(clips.map((clip) => clip.startTick), [0, 1920]);
  assert.equal(clips[0].sourceId, starterPattern.id);
  assert.doesNotThrow(() => JSON.stringify(arrangedTwice));

  const undone = await session.undo();
  assert.equal(patterns.getProjectCompositionWorkflow(undone).lanes[0].clips.length, 1);
  const redone = await session.redo();
  assert.equal(patterns.getProjectCompositionWorkflow(redone).lanes[0].clips.length, 2);
  assert.equal(saves.length, 8);
});

test('Pattern Rack commands reject unknown targets and invalid musical values', () => {
  const project = projectCommands.createStarterPatternRackProject(createBlankProject('Pattern Rack validation'));
  assert.throws(
    () => projectCommands.toggleProjectPatternStep(project, 'missing', 'kick', 0, 36),
    /was not found/,
  );
  assert.throws(
    () => projectCommands.toggleProjectPatternStep(project, projectCommands.PATTERN_RACK_STARTER_PATTERN_ID, 'kick', 0, 200),
    /MIDI note/,
  );
  assert.throws(
    () => projectCommands.setProjectPatternSwing(project, projectCommands.PATTERN_RACK_STARTER_PATTERN_ID, 1.5),
    /between 0 and 1/,
  );
});

test('mixed arrangement lanes and automation round-trip through the canonical project extension', () => {
  const project = createBlankProject('Composition');
  project.assets.push({
    id: 'audio-1', mediaType: 'audio', contentHash: 'sha256:test', originalName: 'take.wav',
    mimeType: 'audio/wav', byteLength: 128, durationSeconds: 1, sampleRate: 48000,
    channels: 2, createdAt: new Date(0).toISOString(), tags: [], metadata: {},
  });
  let state = patterns.createCompositionWorkflowState(project.id);
  const pattern = patterns.addPatternChannel(patterns.createPattern('pattern-a', 'Pattern A'), {
    id: 'synth', name: 'Synth', kind: 'instrument', color: '#a78bfa', targetModuleId: 'synth-1',
    mixerTargetId: 'mix-1', muted: false, solo: false,
  });
  state = patterns.addPatternToWorkflow(state, pattern);
  const envelope = automation.createAutomationEnvelope('auto-1', 'synth-1', 'filter.cutoff', [
    {tick: 0, value: 0, curve: 'linear', tension: 0},
    {tick: 960, value: 1, curve: 'smooth', tension: 1},
  ]);
  state = automation.addAutomationEnvelope(state, envelope);
  state = patterns.addArrangementLane(state, {id: 'lane-pattern', name: 'Patterns', binding: 'instrument'});
  state = patterns.addArrangementLane(state, {id: 'lane-audio', name: 'Audio', binding: 'audio'});
  state = patterns.addArrangementLane(state, {id: 'lane-auto', name: 'Automation', binding: 'automation'});
  state = patterns.placeArrangementClip(state, 'lane-pattern', {id: 'clip-pattern', sourceKind: 'pattern', sourceId: 'pattern-a', startTick: 0, durationTicks: 960, loopEnabled: true});
  state = patterns.placeArrangementClip(state, 'lane-audio', {id: 'clip-audio', sourceKind: 'audio', sourceId: 'audio-1', startTick: 960, durationTicks: 960, loopEnabled: false});
  state = patterns.placeArrangementClip(state, 'lane-auto', {id: 'clip-auto', sourceKind: 'automation', sourceId: 'auto-1', startTick: 0, durationTicks: 1920, loopEnabled: false});

  assert.deepEqual(patterns.validateCompositionWorkflow(state, new Set(['audio-1'])), []);
  const saved = patterns.withProjectCompositionWorkflow(project, state);
  assert.deepEqual(patterns.getProjectCompositionWorkflow(saved), state);
  assert.doesNotThrow(() => JSON.stringify(saved));
  assert.throws(() => patterns.placeArrangementClip(state, 'lane-pattern', {id: 'bad-audio', sourceKind: 'audio', sourceId: 'audio-1', startTick: 0, durationTicks: 1, loopEnabled: false}), /incompatible|does not/);
});

test('automation envelopes support hold, linear and tensioned smooth evaluation', () => {
  const linear = automation.createAutomationEnvelope('linear', 'target', 'gain', [
    {tick: 0, value: 0, curve: 'linear', tension: 0},
    {tick: 100, value: 1, curve: 'linear', tension: 0},
  ]);
  const hold = automation.createAutomationEnvelope('hold', 'target', 'gain', [
    {tick: 0, value: 0.2, curve: 'hold', tension: 0},
    {tick: 100, value: 0.8, curve: 'linear', tension: 0},
  ]);
  const smooth = automation.createAutomationEnvelope('smooth', 'target', 'gain', [
    {tick: 0, value: 0, curve: 'smooth', tension: 1},
    {tick: 100, value: 1, curve: 'linear', tension: 0},
  ]);
  assert.equal(automation.evaluateAutomationEnvelope(linear, 50), 0.5);
  assert.equal(automation.evaluateAutomationEnvelope(hold, 99), 0.2);
  assert.ok(automation.evaluateAutomationEnvelope(smooth, 25) < 0.25);
  assert.equal(automation.evaluateAutomationEnvelope(smooth, 100), 1);
});

test('piano-roll tools detect chords and return transformed copies', () => {
  const source = clip([
    note(0, 60, 480, 1), note(0, 64, 480, 2), note(0, 67, 480, 3),
    note(480, 62, 480, 4), note(480, 65, 480, 5), note(480, 69, 480, 6),
  ]);
  assert.deepEqual(piano.detectChords(source).map((chord) => chord.name), ['C', 'Dm']);
  const strummed = piano.strumMidiChords(source, 12);
  assert.deepEqual(strummed.events.slice(0, 3).map((event) => event.tick), [0, 12, 24]);
  assert.equal(source.events[1].tick, 0);

  const chopped = piano.chopMidiNotes(clip([note(0, 60, 360)], 480), 120);
  assert.deepEqual(chopped.events.map((event) => event.durationTicks), [120, 120, 120]);
  const glued = piano.glueMidiNotes(chopped);
  assert.equal(glued.events.length, 1);
  assert.equal(glued.events[0].durationTicks, 360);

  const constrained = piano.constrainMidiClipToScale(clip([note(0, 66)]), 0, 'major');
  assert.equal(constrained.events[0].note, 65);
});

test('retrospective recall fails closed until a real armed stream buffer is observed', () => {
  const empty = capture.createRetrospectiveCaptureState(60);
  assert.equal(capture.requestRetrospectiveRecall(empty, 30).code, 'NOT_ARMED');
  const armed = capture.setRetrospectiveCaptureIntent(empty, true);
  assert.equal(capture.requestRetrospectiveRecall(armed, 30).code, 'NO_OBSERVED_STREAM');
  const observed = capture.observeRetrospectiveStream(armed, {
    adapterId: 'native-capture', streamId: 'input-1', observedAt: Date.now(),
    bufferedSeconds: 42, sampleRate: 48000, channels: 2,
  });
  assert.deepEqual(capture.requestRetrospectiveRecall(observed, 30), {
    ok: true, adapterId: 'native-capture', streamId: 'input-1', requestedSeconds: 30,
  });
  assert.equal(capture.requestRetrospectiveRecall(observed, 50).code, 'INSUFFICIENT_BUFFER');
  assert.equal(capture.completeRetrospectiveRecall(observed, 'asset-recall-1').lastRecallAssetId, 'asset-recall-1');
});

test('loop starter is deterministic, rights-aware and never claims a render', () => {
  const sources = [
    {assetId: 'drum-a', role: 'drums', bpm: 100, key: null, durationSeconds: 4, rights: 'original', rightsEvidenceReference: 'project:rights:drum-a'},
    {assetId: 'drum-b', role: 'drums', bpm: 104, key: null, durationSeconds: 4, rights: 'licensed', rightsEvidenceReference: 'project:rights:drum-b'},
    {assetId: 'bass-a', role: 'bass', bpm: 104, key: 'A minor', durationSeconds: 4, rights: 'original', rightsEvidenceReference: 'project:rights:bass-a'},
    {assetId: 'unsafe-harmony', role: 'harmony', bpm: 104, key: 'C major', durationSeconds: 4, rights: 'licensed', rightsEvidenceReference: ''},
  ];
  const first = loops.createLoopStarterDraft('draft-1', 'same-seed', 104, 'A minor', sources, ['drums', 'bass', 'harmony']);
  const second = loops.createLoopStarterDraft('draft-2', 'same-seed', 104, 'A minor', sources, ['drums', 'bass', 'harmony']);
  assert.deepEqual(first.selections, second.selections);
  assert.deepEqual(first.missingRoles, ['harmony']);
  assert.equal(first.status, 'incomplete');
  assert.equal(first.renderState, 'not_requested');
  assert.equal(first.selections.find((selection) => selection.role === 'bass').requiresPitchShift, false);
  assert.match(loops.validateLoopSources(sources).join(' '), /rights evidence/);
});

test('song maps reuse source sections and resolve alternate orders without moving source material', () => {
  let state = patterns.createCompositionWorkflowState('project-song-map');
  state = songMap.addSongSection(state, {id: 'verse', name: 'Verse', kind: 'verse', sourceStartTick: 0, durationTicks: 3840, color: '#a78bfa'});
  state = songMap.addSongSection(state, {id: 'chorus', name: 'Chorus', kind: 'chorus', sourceStartTick: 3840, durationTicks: 3840, color: '#fb7185'});
  state = songMap.addSongArrangement(state, {id: 'radio', name: 'Radio', sectionIds: ['verse', 'chorus', 'verse', 'chorus']});
  const radio = songMap.resolveSongArrangement(state.songSections, state.songArrangements[0]);
  assert.deepEqual(radio.map((section) => section.arrangementStartTick), [0, 3840, 7680, 11520]);
  assert.equal(state.songSections[0].sourceStartTick, 0);

  const alternate = songMap.reorderSongArrangement(state, 'radio', ['chorus', 'verse', 'chorus']);
  assert.deepEqual(state.songArrangements[0].sectionIds, ['verse', 'chorus', 'verse', 'chorus']);
  assert.deepEqual(alternate.songArrangements[0].sectionIds, ['chorus', 'verse', 'chorus']);
  assert.throws(() => songMap.reorderSongArrangement(state, 'radio', ['missing']), /missing section/);
});

test('timed lyrics keep scratch ideas separate and return transport-active cues', () => {
  let state = patterns.createCompositionWorkflowState('project-lyrics');
  state = songMap.updateLyricScratchpad(state, 'Try a shorter final line.');
  state = songMap.upsertLyricCue(state, {id: 'line-1', text: 'Hold the light', startTick: 0, durationTicks: 960, kind: 'lead'});
  state = songMap.upsertLyricCue(state, {id: 'line-2', text: 'Keep moving', startTick: 960, durationTicks: 960, kind: 'backing'});
  assert.equal(songMap.lyricsAtTick(state, 480)[0].text, 'Hold the light');
  assert.equal(songMap.lyricsAtTick(state, 960)[0].text, 'Keep moving');
  assert.equal(state.lyrics.scratchpad, 'Try a shorter final line.');
});

test('mix scenes compare target state and recall only as a preview plan', () => {
  const baseTargets = [
    {targetId: 'vocals', kind: 'bus', gainDb: -2, pan: 0, mute: false, solo: false, processorStateReferences: {strip: 'vocal-a'}},
    {targetId: 'music', kind: 'bus', gainDb: -3, pan: 0, mute: false, solo: false, processorStateReferences: {strip: 'music-a'}},
  ];
  const balanced = mixScenes.createMixScene('balanced', 'Balanced', baseTargets, '2026-01-01T00:00:00.000Z');
  const vocalForward = mixScenes.createMixScene('vocal-forward', 'Vocal Forward', [
    {...baseTargets[0], gainDb: 0, processorStateReferences: {strip: 'vocal-intimate'}},
    baseTargets[1],
  ], '2026-01-01T00:01:00.000Z');
  assert.deepEqual(mixScenes.compareMixScenes(balanced, vocalForward), [{targetId: 'vocals', changedFields: ['gainDb', 'processors']}]);
  assert.equal(mixScenes.createMixSceneRecallPlan(vocalForward).status, 'preview');
  let state = patterns.createCompositionWorkflowState('project-scenes');
  state = mixScenes.addMixScene(state, balanced);
  assert.equal(state.mixScenes.length, 1);
  assert.equal(state.revision, 1);
});

test('legacy composition extensions migrate to the current song and scene shape', () => {
  const project = createBlankProject('Legacy composition');
  const legacy = patterns.createCompositionWorkflowState(project.id);
  legacy.schemaVersion = '1.0.0';
  delete legacy.songSections;
  delete legacy.songArrangements;
  delete legacy.lyrics;
  delete legacy.mixScenes;
  delete legacy.activeMixSceneId;
  project.extensions['org.poietek.composition-workflows'] = legacy;
  const migrated = patterns.getProjectCompositionWorkflow(project);
  assert.equal(migrated.schemaVersion, '1.1.0');
  assert.deepEqual(migrated.songSections, []);
  assert.deepEqual(migrated.lyrics, {scratchpad: '', cues: []});
  assert.equal(migrated.activeMixSceneId, null);
});

test('canonical composition commands save, apply, undo and redo track mix scenes', async () => {
  let project = addAudioTrack(createBlankProject('Command session'), 'Lead Vocal');
  const trackId = project.tracks[0].id;
  const saves = [];
  const session = new ProjectSession(project, {save: async (snapshot) => { saves.push(snapshot); }});

  await session.mutate((current) => projectCommands.addProjectSongSection(current, {
    id: 'verse', name: 'Verse', kind: 'verse', sourceStartTick: 0, durationTicks: 3840, color: '#a78bfa',
  }));
  await session.mutate((current) => projectCommands.upsertProjectLyricCue(current, {
    id: 'line-1', text: 'Hold the light', startTick: 0, durationTicks: 960, kind: 'lead',
  }));
  const scene = mixScenes.createMixScene('vocal-up', 'Vocal Up', [{
    targetId: trackId, kind: 'track', gainDb: 2, pan: -0.1, mute: false, solo: false,
    processorStateReferences: {},
  }], '2026-01-01T00:00:00.000Z');
  await session.mutate((current) => projectCommands.addProjectMixScene(current, scene));
  const applied = await session.mutate((current) => projectCommands.applyProjectMixScene(current, 'vocal-up'));
  assert.equal(applied.tracks[0].mixer.gainDb, 2);
  assert.equal(patterns.getProjectCompositionWorkflow(applied).activeMixSceneId, 'vocal-up');

  const undone = await session.undo();
  assert.equal(undone.tracks[0].mixer.gainDb, 0);
  assert.equal(patterns.getProjectCompositionWorkflow(undone).activeMixSceneId, null);
  const redone = await session.redo();
  assert.equal(redone.tracks[0].mixer.gainDb, 2);
  assert.equal(saves.length, 6);
});

test('project mix-scene capture upserts and applies one atomic canonical edit', async () => {
  let project = addAudioTrack(createBlankProject('Atomic scene session'), 'Lead Vocal');
  project = addAudioTrack(project, 'Music Bed');
  const [vocal, music] = project.tracks;
  const scene = projectCommands.createProjectTrackMixScene(project, 'focus-track', 'Focus Lead Vocal', {
    [vocal.id]: {gainDb: 2},
    [music.id]: {gainDb: -2},
  }, '2026-01-01T00:00:00.000Z');
  const applied = projectCommands.saveAndApplyProjectMixScene(project, scene);
  assert.equal(applied.tracks[0].mixer.gainDb, 2);
  assert.equal(applied.tracks[1].mixer.gainDb, -2);
  assert.equal(patterns.getProjectCompositionWorkflow(applied).mixScenes.length, 1);
  assert.equal(patterns.getProjectCompositionWorkflow(applied).activeMixSceneId, 'focus-track');

  const replacement = projectCommands.createProjectTrackMixScene(applied, 'focus-track', 'Focus Music Bed', {
    [vocal.id]: {gainDb: -3},
    [music.id]: {gainDb: 1.5},
  }, '2026-01-01T00:01:00.000Z');
  const replaced = projectCommands.saveAndApplyProjectMixScene(applied, replacement);
  assert.equal(patterns.getProjectCompositionWorkflow(replaced).mixScenes.length, 1);
  assert.equal(patterns.getProjectCompositionWorkflow(replaced).mixScenes[0].name, 'Focus Music Bed');
  assert.equal(replaced.tracks[1].mixer.gainDb, 1.5);
});

test('project mix-scene capture rejects empty projects and unknown patch targets', () => {
  const empty = createBlankProject('No tracks');
  assert.throws(() => projectCommands.createProjectTrackMixScene(empty, 'empty', 'Empty'), /at least one canonical track/);
  const project = addAudioTrack(empty, 'Track');
  assert.throws(() => projectCommands.createProjectTrackMixScene(project, 'bad', 'Bad', {'missing-track': {gainDb: 2}}), /was not found/);
});

test('mix-scene project commands reject unsupported buses and processor state', () => {
  let project = addAudioTrack(createBlankProject('Fail closed scenes'), 'Track');
  const trackId = project.tracks[0].id;
  const processorScene = mixScenes.createMixScene('processor', 'Processor', [{
    targetId: trackId, kind: 'track', gainDb: 0, pan: 0, mute: false, solo: false,
    processorStateReferences: {strip: 'unobserved-state'},
  }], '2026-01-01T00:00:00.000Z');
  project = projectCommands.addProjectMixScene(project, processorScene);
  assert.throws(() => projectCommands.applyProjectMixScene(project, 'processor'), /processor-state adapter/);

  const busScene = mixScenes.createMixScene('bus', 'Bus', [{
    targetId: 'bus-1', kind: 'bus', gainDb: 0, pan: 0, mute: false, solo: false,
    processorStateReferences: {},
  }], '2026-01-01T00:00:00.000Z');
  project = projectCommands.addProjectMixScene(project, busScene);
  assert.throws(() => projectCommands.applyProjectMixScene(project, 'bus'), /unsupported bus recall/);
});
