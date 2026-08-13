import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const factory = require('./.compiled-core/domain/projectFactory.js');
const operations = require('./.compiled-core/project/operations.js');
const edits = require('./.compiled-core/project/editOperations.js');
const player = require('./.compiled-core/audio/WebAudioTimelinePlayer.js');

function projectWithClip() {
  const project = operations.addAudioTrack(factory.createBlankProject('Editing'), 'Voice');
  const asset = {
    id: 'ast-edit',
    mediaType: 'audio',
    contentHash: 'sha256:test',
    originalName: 'voice.wav',
    mimeType: 'audio/wav',
    byteLength: 100,
    durationSeconds: 4,
    sampleRate: 48000,
    channels: 1,
    createdAt: new Date(0).toISOString(),
    tags: [],
    metadata: {},
  };
  const withAsset = operations.addAsset(project, asset);
  return operations.addAudioClip({
    project: withAsset,
    trackId: withAsset.tracks[0].id,
    asset,
  });
}

test('arranger edits persist validated track and clip mixer values', () => {
  const project = projectWithClip();
  const track = project.tracks[0];
  const clip = track.clips[0];
  const mixed = edits.updateTrackMixer(project, track.id, {gainDb: -4.5, pan: 0.25});
  const edited = edits.updateAudioClip(mixed, track.id, clip.id, {
    gainDb: 2,
    pan: -0.2,
    fadeInSeconds: 0.4,
    fadeOutSeconds: 0.6,
  });

  assert.equal(edited.tracks[0].mixer.gainDb, -4.5);
  assert.equal(edited.tracks[0].mixer.pan, 0.25);
  assert.equal(edited.tracks[0].clips[0].fadeInSeconds, 0.4);
  assert.throws(
    () => edits.updateTrackMixer(edited, track.id, {pan: 2}),
    /between -1 and 1/,
  );
  assert.throws(
    () => edits.updateAudioClip(edited, track.id, clip.id, {fadeInSeconds: 3.8}),
    /Combined fades/,
  );
});

test('split creates two non-overlapping clips with continuous source offsets', () => {
  const project = projectWithClip();
  const track = project.tracks[0];
  const clip = track.clips[0];
  const split = edits.splitAudioClipAtTick(
    project,
    track.id,
    clip.id,
    clip.startTick + clip.durationTicks / 2,
  );
  const [first, second] = split.tracks[0].clips;

  assert.equal(first.startTick + first.durationTicks, second.startTick);
  assert.equal(second.sourceOffsetSeconds, 2);
  assert.equal(first.sourceDurationSeconds, 2);
  assert.equal(second.sourceDurationSeconds, 2);
});

test('fade envelope is derived from clip time and never exceeds unity', () => {
  assert.equal(player.clipFadeGainAtTime(4, 1, 1, 0), 0);
  assert.equal(player.clipFadeGainAtTime(4, 1, 1, 0.5), 0.5);
  assert.equal(player.clipFadeGainAtTime(4, 1, 1, 2), 1);
  assert.equal(player.clipFadeGainAtTime(4, 1, 1, 3.5), 0.5);
  assert.equal(player.clipFadeGainAtTime(4, 1, 1, 4), 0);
});

