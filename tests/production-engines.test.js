import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const {createProductionEngineReadiness} = require('./.compiled-core/engines/defaults.js');
const {readProductionEngineReadiness, withProductionEngineReadiness} = require('./.compiled-core/engines/extension.js');
const {validateProductionEngineReadiness} = require('./.compiled-core/engines/validation.js');

const now = '2026-08-21T12:00:00.000Z';
const make = () => createProductionEngineReadiness('project-1', 'windows', now);

test('production engines default to serializable, honest unavailable states', () => {
  const state = make();
  assert.equal(state.nativeAudio.callback.state, 'stopped');
  assert.equal(state.nativeAudio.realtimeCapability.state, 'unavailable');
  assert.equal(state.plugins.formatCapabilities.vst3.state, 'unavailable');
  assert.equal(state.video.decodeCapability.state, 'unavailable');
  assert.equal(state.vfx.gpuCapability.state, 'unavailable');
  assert.deepEqual(validateProductionEngineReadiness(state), []);
  assert.doesNotThrow(() => JSON.stringify(state));
});

test('canonical project extension round-trips and rejects mismatched projects', () => {
  const attached = withProductionEngineReadiness({id: 'project-1', extensions: {}}, make());
  assert.equal(readProductionEngineReadiness(attached).state, 'ready');
  const wrong = {...attached, id: 'project-2'};
  assert.equal(readProductionEngineReadiness(wrong).state, 'invalid');
});

test('native audio cannot claim a running callback without observed evidence', () => {
  const state = make();
  state.nativeAudio.callback.state = 'running';
  const codes = validateProductionEngineReadiness(state).map((issue) => issue.code);
  assert.ok(codes.includes('REALTIME_AUDIO_UNPROVEN'));
  assert.ok(codes.includes('CALLBACK_EVIDENCE_REQUIRED'));
  assert.ok(codes.includes('AUDIO_CONFIGURATION_INCOMPLETE'));
});

test('xrun and render parity claims require native measurements', () => {
  const state = make();
  state.nativeAudio.callback.xrunCount = 2;
  state.nativeAudio.renderParity.state = 'verified';
  const codes = validateProductionEngineReadiness(state).map((issue) => issue.code);
  assert.ok(codes.includes('XRUN_TELEMETRY_UNPROVEN'));
  assert.ok(codes.includes('RENDER_PARITY_UNPROVEN'));
});

test('applied professional edits are revisioned, undoable and implemented', () => {
  const state = make();
  state.editing.commands.push({id:'edit-1',projectId:'project-1',kind:'stretch',targetIds:['clip-1'],baseRevision:1,nextRevision:4,parameters:{ratio:1.2},state:'applied',undoable:false,createdAt:now,appliedAt:null,implementationId:null});
  const codes = validateProductionEngineReadiness(state).map((issue) => issue.code);
  assert.ok(codes.includes('EDIT_COMMAND_UNPROVEN'));
  assert.ok(codes.includes('STRETCH_BACKEND_REQUIRED'));
});

test('MIDI clips and clock output fail closed', () => {
  const state = make();
  state.midiScoring.clips.push({id:'midi-1',trackId:'track-1',name:'Cue',startTick:-1,durationTicks:0,loopStartTick:1,loopEndTick:1,events:[{tick:-1,type:'note',channel:16,note:60,velocity:100,durationTicks:120,releaseVelocity:null,noteId:null}]});
  state.midiScoring.clockOutputs.push({portId:'port-1',sendClock:true,sendStartStop:true,sendMtc:false,offsetMilliseconds:0,observedAt:null});
  const codes = validateProductionEngineReadiness(state).map((issue) => issue.code);
  assert.ok(codes.includes('MIDI_CLIP_TIMING_INVALID'));
  assert.ok(codes.includes('MIDI_EVENT_INVALID'));
  assert.ok(codes.includes('MIDI_CLOCK_UNPROVEN'));
});

test('plug-ins cannot become ready without scan and licence evidence', () => {
  const state = make();
  state.plugins.plugins.push({id:'plugin-1',format:'aax',pathReference:'private:path',vendor:'Vendor',name:'Processor',version:'1',scanState:'ready',quarantineReason:null,lastScannedAt:null,binaryDigest:null,licenseEvidence:{state:'not_submitted',authorityId:null,externalReference:null,submittedAt:null,observedAt:null,message:null,rawStatus:null}});
  const codes = validateProductionEngineReadiness(state).map((issue) => issue.code);
  assert.ok(codes.includes('PLUGIN_SCAN_UNPROVEN'));
  assert.ok(codes.includes('AAX_LICENSE_REQUIRED'));
});

test('video, VFX and colour completion require real adapters', () => {
  const state = make();
  state.video.proxies.push({id:'proxy-1',sourceAssetId:'video-1',proxyAssetId:'proxy-asset',status:'ready',width:1280,height:720,frameRate:25,codec:'proxy',implementationId:null,completedAt:null});
  state.video.renderJobs.push({id:'render-1',projectId:'project-1',status:'completed',sourceRevision:1,profileId:'web',outputAssetId:'out',progress:1,implementationId:null,providerReference:null,startedAt:now,completedAt:null,errorCode:null});
  state.vfx.graphs.push({id:'graph-1',name:'Shot',width:1920,height:1080,frameRate:25,nodes:[{id:'output',type:'output',name:'Output',parameters:{},inputs:[],keyframes:[],implementationId:null}],outputNodeId:'output',renderState:'completed'});
  state.vfx.colorManagement = {system:'ocio',configAssetId:null,workingSpace:'scene-linear',displayTransform:'display',implementationId:null};
  const codes = validateProductionEngineReadiness(state).map((issue) => issue.code);
  for (const code of ['VIDEO_PROXY_UNPROVEN','VIDEO_RENDER_UNPROVEN','VFX_GRAPH_UNPROVEN','VFX_NODE_UNIMPLEMENTED','COLOR_MANAGEMENT_UNPROVEN']) assert.ok(codes.includes(code));
});

test('BS.1770 and true-peak passes require validated measured evidence', () => {
  const state = make();
  state.delivery.checks.push({id:'loudness',kind:'loudness_bs1770',state:'pass',implementationId:null,standard:'ITU-R BS.1770',measuredAt:null,evidenceAssetId:null,value:'not measured',message:'claimed'});
  const codes = validateProductionEngineReadiness(state).map((issue) => issue.code);
  assert.ok(codes.includes('QC_PASS_UNPROVEN'));
  assert.ok(codes.includes('QC_VALUE_REQUIRED'));
});
