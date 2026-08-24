"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProductionEngineReadiness = createProductionEngineReadiness;
const platform_1 = require("../platform");
const contracts_1 = require("./contracts");
const unavailable = (id, message) => (0, platform_1.unavailableCapability)(id, 'NOT_IMPLEMENTED', message);
const configure = (id, message) => (0, platform_1.requiresConfigurationCapability)(id, message);
function createProductionEngineReadiness(projectId, platform, now = new Date().toISOString()) {
    const pluginFormats = ['vst3', 'au', 'auv3', 'clap', 'aax'];
    return {
        schemaVersion: contracts_1.PRODUCTION_ENGINE_SCHEMA_VERSION,
        projectId,
        revision: 0,
        updatedAt: now,
        nativeAudio: {
            platform,
            enumerationCapability: configure('engine.audio.enumeration', 'A native device adapter must enumerate this device at runtime.'),
            realtimeCapability: unavailable('engine.audio.realtime', 'No verified native real-time audio callback is running.'),
            hotSwapCapability: unavailable('engine.audio.hot_swap', 'Device hot-swap recovery is not implemented.'),
            multiOutputCapability: unavailable('engine.audio.multi_output', 'No verified native multi-output route is active.'),
            ports: [], selectedInputPortIds: [], selectedOutputPortIds: [], sampleRate: null, bufferFrames: null,
            callback: { state: 'stopped', implementationId: null, startedAt: null, lastCallbackAt: null, measuredCallbackCount: 0, dropoutCount: 0, xrunCount: 0, lastXrunAt: null, telemetrySource: 'not_measured' },
            routes: [],
            renderParity: { state: 'not_tested', realtimeDigest: null, offlineDigest: null, toleranceDb: null, testedAt: null, implementationId: null },
        },
        editing: {
            commandCapability: configure('engine.edit.commands', 'Canonical professional edit commands require integration with the project session.'),
            stretchCapability: unavailable('engine.edit.stretch', 'No validated time-preserving stretch backend is installed.'),
            compingCapability: unavailable('engine.edit.comping', 'Take-lane comping is not implemented.'),
            automationCapability: unavailable('engine.edit.automation', 'Production automation playback and writing are not implemented.'),
            interchangeCapability: unavailable('engine.edit.interchange', 'No reviewed AAF/OMF/EDL interchange adapter is installed.'),
            selectedObjectIds: [], clipGroupIds: {}, trackFolders: [], takeLanes: [], compSegments: [], automationLanes: [], commands: [], interchange: [],
        },
        midiScoring: {
            clipEditingCapability: unavailable('engine.midi.clip_editing', 'Canonical MIDI clip editing is not implemented.'),
            mpeCapability: unavailable('engine.midi.mpe', 'MPE input, editing and playback are not verified.'),
            clockOutputCapability: unavailable('engine.midi.clock_output', 'No verified MIDI clock/transport output is active.'),
            notationCapability: unavailable('engine.score.notation', 'No production notation and engraving engine is installed.'),
            musicXmlCapability: unavailable('engine.score.musicxml', 'No reviewed MusicXML adapter is installed.'),
            pictureScoringCapability: configure('engine.score.picture', 'Picture-cue contracts require a real frame playback engine.'),
            clips: [], transformations: [], clockOutputs: [], articulationMaps: [], scoreDocuments: [], pictureCues: [],
        },
        plugins: {
            hostCapability: unavailable('engine.plugin.host', 'No native third-party plug-in host is running.'),
            scanCapability: unavailable('engine.plugin.scan', 'No isolated native plug-in scanner is installed.'),
            sandboxCapability: unavailable('engine.plugin.sandbox', 'No plug-in process sandbox is installed.'),
            delayCompensationCapability: unavailable('engine.plugin.pdc', 'Plug-in delay compensation is not implemented.'),
            formatCapabilities: Object.fromEntries(pluginFormats.map((format) => [format, unavailable(`engine.plugin.${format}`, `${format.toUpperCase()} hosting is unavailable on this runtime.`)])),
            plugins: [], instances: [], scanRuns: [],
        },
        video: {
            decodeCapability: unavailable('engine.video.decode', 'No native codec adapter is installed.'),
            proxyCapability: unavailable('engine.video.proxy', 'Proxy generation is not implemented.'),
            framePlaybackCapability: unavailable('engine.video.frame_playback', 'Frame-accurate playback is not implemented.'),
            editCapability: unavailable('engine.video.edit', 'Professional video edit operations are not implemented.'),
            captionCapability: configure('engine.video.caption', 'Caption model exists but playback/export validation is not connected.'),
            multicamCapability: unavailable('engine.video.multicam', 'Multicam synchronization and switching are not implemented.'),
            renderCapability: unavailable('engine.video.render', 'No native video render queue is running.'),
            codecImplementationId: null, proxies: [], renderJobs: [], captions: [], multicamGroups: [],
        },
        vfx: {
            graphCapability: configure('engine.vfx.graph', 'Serializable graph model requires a node execution engine.'),
            gpuCapability: unavailable('engine.vfx.gpu', 'No verified GPU compute/render adapter is running.'),
            trackingCapability: unavailable('engine.vfx.tracking', 'Tracking is not implemented.'),
            rotoKeyCapability: unavailable('engine.vfx.roto_key', 'Rotoscoping and keying are not implemented.'),
            particleCapability: unavailable('engine.vfx.particles', 'Particle simulation is not implemented.'),
            colorCapability: unavailable('engine.vfx.color', 'Managed colour and grading are not implemented.'),
            animationCapability: unavailable('engine.vfx.animation', 'Production animation tools are not implemented.'),
            graphs: [], colorManagement: { system: 'unmanaged', configAssetId: null, workingSpace: null, displayTransform: null, implementationId: null },
        },
        delivery: {
            qcCapability: unavailable('engine.delivery.qc', 'No validated programme-QC engine is installed.'),
            profiles: [], checks: [],
        },
    };
}
