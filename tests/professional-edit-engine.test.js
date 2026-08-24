import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const {moveAudioClips, quantizeMidiClip, rippleTrimAudioClipEnd, scaleMidiVelocity, setAudioClipCrossfade, slipAudioClip, transposeMidiClip} = require('./.compiled-core/engines/editEngine.js');

const project = () => ({
  id:'project-1',schemaVersion:'1.1.0',title:'Edit',ownerId:null,teamId:null,createdAt:'2026-08-21T00:00:00.000Z',updatedAt:'2026-08-21T00:00:00.000Z',tempoMap:[{tick:0,bpm:120}],
  assets:[{id:'asset-1',mediaType:'audio',contentHash:'hash',originalName:'audio.wav',mimeType:'audio/wav',byteLength:100,durationSeconds:12,sampleRate:48000,channels:2,createdAt:'2026-08-21T00:00:00.000Z',tags:[],metadata:{}}],
  tracks:[{id:'track-1',type:'audio',name:'Audio',order:0,color:null,mixer:{gainDb:0,pan:0,mute:false,solo:false},clips:[
    {id:'clip-1',clipType:'audio',assetId:'asset-1',name:'One',startTick:0,durationTicks:960,sourceOffsetSeconds:0,sourceDurationSeconds:2,gainDb:0,pan:0,fadeInSeconds:0,fadeOutSeconds:0,muted:false},
    {id:'clip-2',clipType:'audio',assetId:'asset-1',name:'Two',startTick:960,durationTicks:960,sourceOffsetSeconds:2,sourceDurationSeconds:2,gainDb:0,pan:0,fadeInSeconds:0,fadeOutSeconds:0,muted:false},
  ]}],contributors:[],rights:{},releases:[],settings:{ppq:960,sampleRate:48000,tuning:{referenceNote:'A4',referenceHz:440,temperament:'12-TET',profileId:'a440'}},extensions:{},
});

test('multi-clip move is immutable and refuses negative project time', () => {
  const source = project();
  const moved = moveAudioClips(source, ['clip-1','clip-2'], 240);
  assert.equal(moved.ok, true);
  assert.equal(moved.project.tracks[0].clips[0].startTick, 240);
  assert.equal(source.tracks[0].clips[0].startTick, 0);
  assert.equal(moveAudioClips(source, ['clip-1'], -1).ok, false);
});

test('source slipping respects media boundaries', () => {
  const source = project();
  assert.equal(slipAudioClip(source, 'clip-1', 1).project.tracks[0].clips[0].sourceOffsetSeconds, 1);
  assert.equal(slipAudioClip(source, 'clip-1', -1).ok, false);
  assert.equal(slipAudioClip(source, 'clip-1', 11).ok, false);
});

test('ripple trim moves later clips by the edit delta', () => {
  const edited = rippleTrimAudioClipEnd(project(), 'clip-1', 1200);
  assert.equal(edited.ok, true);
  assert.equal(edited.project.tracks[0].clips[0].durationTicks, 1200);
  assert.equal(edited.project.tracks[0].clips[1].startTick, 1200);
});

test('crossfade writes complementary clip fade controls', () => {
  const edited = setAudioClipCrossfade(project(), 'clip-1', 'clip-2', 0.05);
  assert.equal(edited.ok, true);
  assert.equal(edited.project.tracks[0].clips[0].fadeOutSeconds, 0.05);
  assert.equal(edited.project.tracks[0].clips[1].fadeInSeconds, 0.05);
});

test('MIDI transformations are deterministic and bounded', () => {
  const clip = {id:'midi-1',trackId:'track-1',name:'Notes',startTick:0,durationTicks:960,loopStartTick:0,loopEndTick:960,events:[{tick:119,type:'note',channel:0,note:126,velocity:100,durationTicks:120,releaseVelocity:null,noteId:null}]};
  assert.equal(quantizeMidiClip(clip, 120).events[0].tick, 120);
  assert.equal(transposeMidiClip(clip, 4).events[0].note, 127);
  assert.equal(scaleMidiVelocity(clip, 2).events[0].velocity, 127);
  assert.equal(clip.events[0].tick, 119);
});
