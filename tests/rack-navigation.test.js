import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('rack device navigation is compact, categorized and searchable', async () => {
  const source = await read('src/components/rack/StudioRackNav.tsx');
  for (const family of ['Instruments', 'Samplers & rhythm', 'Sequencing', 'Mix & effects', 'MIDI & hardware', 'Utilities']) {
    assert.match(source, new RegExp(family.replace('&', '\\&')));
  }
  assert.match(source, /Search devices/);
  assert.match(source, /max-h-\[min\(68vh,520px\)\]/);
  assert.doesNotMatch(source, /MPC Studio|SP-404 MKII|SSL Master/);
});

test('rack stack supports direct unit navigation', async () => {
  const source = await read('src/components/rack/RackStackManager.tsx');
  assert.match(source, /Jump to rack unit/);
  assert.match(source, /scrollIntoView/);
  assert.match(source, /rack-module-/);
  assert.match(source, /Studio rack viewport/);
  assert.match(source, /ViewportNavigator/);
  assert.match(source, /onZoomChange/);
  const app = await read('src/App.tsx');
  assert.match(app, /rackZoom/);
  assert.match(app, /onZoomChange=\{setRackZoom\}/);
  assert.match(app, /rackAutoFit/);
  assert.match(app, /onAutoFitChange=\{setRackAutoFit\}/);
});

test('rack and arranger share real vertical, horizontal, and zoom viewport controls', async () => {
  const navigator = await read('src/components/shared/ViewportNavigator.tsx');
  const arranger = await read('src/poietek/react/StudioArrangerView.tsx');
  const style = await read('src/components/shared/ViewportNavigator.css');

  for (const action of ['vertical scrollbar', 'horizontal scrollbar', 'scroll up', 'scroll down', 'scroll left', 'scroll right', 'zoom out', 'zoom in', 'reset zoom to 100%']) {
    assert.match(navigator, new RegExp(action));
  }
  assert.match(navigator, /scrollTo/);
  assert.match(navigator, /scrollBy/);
  assert.match(navigator, /ResizeObserver/);
  assert.match(arranger, /Arrangement timeline viewport/);
  assert.match(arranger, /ViewportNavigator/);
  assert.match(style, /poietek-viewport-vertical/);
  assert.match(style, /poietek-viewport-footer/);
});

test('rack auto fit follows its measured width and manual zoom remains available', async () => {
  const navigator = await read('src/components/shared/ViewportNavigator.tsx');
  const rack = await read('src/components/rack/RackStackManager.tsx');
  const style = await read('src/components/shared/ViewportNavigator.css');
  assert.match(navigator, /availableWidth \/ fitContentWidth/);
  assert.match(navigator, /readableMinimum/);
  assert.match(navigator, /availableWidth <= 620/);
  assert.match(navigator, /Math\.min\(1, maxZoom\)/);
  assert.match(navigator, /ResizeObserver\(fit\)/);
  assert.match(navigator, /auto fit width/);
  assert.match(navigator, /aria-pressed=\{autoFit\}/);
  assert.match(navigator, /if \(autoFit\) onAutoFitChange\?\.\(false\)/);
  assert.match(rack, /fitContentWidth=\{760\}/);
  assert.match(rack, /minZoom=\{0\.25\}/);
  assert.match(rack, /zoomPresets=\{\[0\.25, 0\.5, 0\.75, 1, 1\.25, 1\.5, 1\.6\]\}/);
  assert.match(style, /poietek-viewport-auto-fit--active/);
  assert.match(navigator, /Default 100%/);
  assert.match(style, /poietek-workbench-device/);
  assert.match(style, /min-height: 44px/);
  assert.match(style, /font-size: max\(12px, 0\.75rem\) !important/);
  assert.match(navigator, /zoom preset/);
});

test('rack right library cascades and consolidates quick actions', async () => {
  const source = await read('src/components/rack/RackRightSidebar.tsx');
  const app = await read('src/App.tsx');
  for (const section of ['Quick Options', 'Instruments & Samplers', 'Sequencing & Editors', 'Mix, Effects & Buses', 'Post, Score & Delivery', 'Routing & Hardware']) {
    assert.match(source, new RegExp(section.replace('&', '\\&')));
  }
  for (const action of ['Undo', 'Redo', 'Rear cables', 'Templates', 'AI assist', 'Detach']) {
    assert.match(source, new RegExp(action));
  }
  assert.match(source, /aria-expanded=\{isExpanded\}/);
  assert.match(source, /Find devices, effects, routing/);
  assert.match(app, /RackRightSidebar/);
  assert.doesNotMatch(app, /<FloatingQuickPalette/);
  assert.doesNotMatch(app, /<StudioRackNav/);
});

test('rack library drag payload is validated before a real module is added', async () => {
  const sidebar = await read('src/components/rack/RackRightSidebar.tsx');
  const rack = await read('src/components/rack/RackStackManager.tsx');
  const catalog = await read('src/components/rack/rackModuleCatalog.ts');
  assert.match(sidebar, /draggable/);
  assert.match(sidebar, /dataTransfer\.setData\(POIETEK_RACK_DRAG_TYPE, module\.type\)/);
  assert.match(rack, /onDragOver/);
  assert.match(rack, /onDrop/);
  assert.match(rack, /isRackModuleType\(type\)/);
  assert.match(rack, /handleAddModule\(type\)/);
  assert.match(catalog, /application\/x-poietek-rack-module/);
  assert.match(catalog, /createRackModuleItem/);
});

test('compact devices do not begin with desktop Rack overlays expanded', async () => {
  const source = await read('src/App.tsx');
  const shellStyle = await read('src/poietek/react/PoietekAppShell.css');
  assert.match(source, /isBrowserOpen[\s\S]*matchMedia\('\(min-width: 1280px\)'\)/);
  assert.match(source, /isRackLibraryOpen[\s\S]*matchMedia\('\(min-width: 1200px\)'\)/);
  assert.match(source, /isWalkthroughActive[\s\S]*matchMedia\('\(min-width: 900px\)'\)/);
  assert.match(source, /poietek-legacy-rack-main min-h-0 flex flex-1 flex-col overflow-hidden p-4/);
  const browser = await read('src/components/daw/DAWBrowserSidebar.tsx');
  assert.match(browser, /absolute inset-y-0 left-0[\s\S]*xl:relative/);
  assert.match(shellStyle, /\.poietek-rack-host \{ height: 100%; \}/);
  assert.match(shellStyle, /data-device-layout='handheld'[\s\S]*\.poietek-rack-host > div \{ min-width: 0; \}/);
});

test('rack exposes original Player, effects, utilities and honest engine states', async () => {
  const catalog = await read('src/components/rack/rackModuleCatalog.ts');
  const rack = await read('src/components/rack/RackStackManager.tsx');
  const rear = await read('src/components/rack/StudioRearPanel.tsx');
  for (const type of ['note_player', 'effect_eq', 'effect_compressor', 'effect_reverb', 'effect_delay', 'effect_modulator', 'utility_gain_pan', 'utility_split_merge', 'plugin_host']) {
    assert.match(catalog, new RegExp(`type: '${type}'`));
  }
  for (const state of ['operational', 'control_model', 'native_required', 'external_required']) {
    assert.match(catalog, new RegExp(`engineState: '${state}'`));
  }
  assert.match(rack, /Logical Signal Flow/);
  assert.match(rack, /deriveAutomaticRackSignalFlow/);
  assert.match(rack, /renderModuleContent\(subMod\)/);
  assert.doesNotMatch(rack, /renderModuleContent\(mod\.type\)/);
  assert.match(rear, /Logical route preview/);
  assert.doesNotMatch(rear, /physical Audio & CV/);
});

test('production rack adds scoring, monitoring, post, spectral, immersive and mastering foundations', async () => {
  const catalog = await read('src/components/rack/rackModuleCatalog.ts');
  const score = await read('src/components/rack/ScoreWorkbenchDevice.tsx');
  const menu = await read('src/poietek/react/StudioMenuBar.tsx');
  const app = await read('src/App.tsx');
  for (const type of ['control_room', 'midi_transformer', 'score_workbench', 'technique_matrix', 'spectral_workbench', 'offline_process_chain', 'picture_post', 'sequence_assembly', 'immersive_monitor', 'mastering_delivery', 'remote_session']) {
    assert.match(catalog, new RegExp(`type: '${type}'`));
    assert.match(menu, new RegExp(`value: '${type}'`));
  }
  for (const mode of ['Setup', 'Write', 'Engrave', 'Play', 'Print']) assert.match(score, new RegExp(mode));
  assert.match(score, /canonical project extension/);
  const technique = await read('src/components/rack/TechniqueMatrixDevice.tsx');
  assert.match(technique, /direction.*active/i);
  assert.match(technique, /No MIDI or audio was sent/);
  assert.match(app, /isRackModuleType\(command\.value\)/);
  assert.match(app, /isWorkspaceModuleType\(command\.value\)/);
  assert.match(app, /start_score/);
  assert.match(app, /start_control_room/);
});

test('sequence assembly adds independent conductor maps, shared resources and truthful program plans', async () => {
  const catalog = await read('src/components/rack/rackModuleCatalog.ts');
  const device = await read('src/components/rack/SequenceAssemblyWorkbenchDevice.tsx');
  const model = await read('src/poietek/production-workflows/sequenceAssembly.ts');
  const manager = await read('src/components/rack/RackStackManager.tsx');
  const app = await read('src/App.tsx');
  const menu = await read('src/poietek/react/StudioMenuBar.tsx');
  const templates = await read('src/components/daw/TemplatesModal.tsx');
  const docs = await read('docs/MOTU_DIGITAL_PERFORMER_WORKFLOW_ABSTRACTION.md');
  assert.match(catalog, /type: 'sequence_assembly'/);
  for (const view of ['Sequences', 'Conductor', 'Shared rack', 'Program', 'Readiness']) assert.match(device, new RegExp(view));
  assert.match(device, /does not start transport/);
  assert.match(device, /will not relabel a JSON plan as media interchange/);
  assert.match(model, /org\.poietek\.sequence-assembly/);
  assert.match(model, /does not claim transport playback, plug-in processing, hardware sync or rendered audio/);
  assert.match(manager, /SequenceAssemblyWorkbenchDevice/);
  assert.match(app, /mutateProjectSequenceAssemblyState/);
  assert.match(menu, /Independent Cues & Conductor Maps/);
  assert.match(templates, /Multi-Cue Sequence & Shared Rack Rig/);
  assert.match(docs, /It does not copy Digital Performer/);
});

test('picture post workbench exposes project-owned Nuendo-inspired post workflows without false media claims', async () => {
  const catalog = await read('src/components/rack/rackModuleCatalog.ts');
  const device = await read('src/components/rack/PicturePostWorkbenchDevice.tsx');
  const manager = await read('src/components/rack/RackStackManager.tsx');
  const app = await read('src/App.tsx');
  const menu = await read('src/poietek/react/StudioMenuBar.tsx');
  const templates = await read('src/components/daw/TemplatesModal.tsx');
  const docs = await read('docs/NUENDO_POST_WORKFLOW_ABSTRACTION.md');
  assert.match(catalog, /SMPTE cues, ADR takes, field-audio matches, safe reconform/);
  for (const view of ['ADR cues', 'Takes', 'ReConform', 'Field audio', 'Delivery']) assert.match(device, new RegExp(view));
  assert.match(device, /No live recording state is claimed/);
  assert.match(device, /one undoable project edit/);
  assert.match(device, /Export local ADR cue sheet CSV/);
  assert.match(device, /ADM\/Atmos, loudness and intelligibility measurements/);
  assert.match(manager, /PicturePostWorkbenchDevice/);
  assert.match(app, /mutateProjectPicturePostState/);
  assert.match(menu, /ADR Cues, Takes & Talent Overlay/);
  assert.match(menu, /AAF \/ CMX3600 \/ TTAL Import/);
  assert.match(templates, /Dialog, ADR & Foley Post Rig/);
  assert.match(docs, /org\.poietek\.picture-post/);
  assert.match(docs, /does not copy Steinberg source code/);
});

test('batch delivery workshop exposes safe many-asset planning without false render claims', async () => {
  const catalog = await read('src/components/rack/rackModuleCatalog.ts');
  const device = await read('src/components/rack/BatchDeliveryWorkbenchDevice.tsx');
  const model = await read('src/poietek/production-workflows/batchDelivery.ts');
  const manager = await read('src/components/rack/RackStackManager.tsx');
  const app = await read('src/App.tsx');
  const menu = await read('src/poietek/react/StudioMenuBar.tsx');
  const templates = await read('src/components/daw/TemplatesModal.tsx');
  const docs = await read('docs/BATCHY_WORKFLOW_ABSTRACTION.md');
  assert.match(catalog, /type: 'batch_delivery'/);
  for (const view of ['Sources', 'Recipe', 'Outputs', 'Dry run', 'Pilot']) assert.match(device, new RegExp(view));
  assert.match(device, /browser cannot self-approve/i);
  assert.match(device, /No render report has been observed/);
  assert.match(model, /org\.poietek\.batch-delivery/);
  assert.match(model, /Output paths must be relative/);
  assert.match(model, /no directory or media file was created/i);
  assert.match(manager, /BatchDeliveryWorkbenchDevice/);
  assert.match(app, /mutateProjectBatchDeliveryState/);
  assert.match(menu, /Safe Naming & Dry Run/);
  assert.match(templates, /Safe Batch Delivery Rig/);
  assert.match(docs, /no Batchy\s+source code, binaries, presets, DSP, branding/);
});

test('idea flow adds durable patterns, note tools, mixed lanes, automation and truthful recall controls', async () => {
  const catalog = await read('src/components/rack/rackModuleCatalog.ts');
  const device = await read('src/components/rack/CompositionWorkbenchDevice.tsx');
  const capture = await read('src/poietek/composition-workflows/captureRecall.ts');
  const menu = await read('src/poietek/react/StudioMenuBar.tsx');
  const templates = await read('src/components/daw/TemplatesModal.tsx');
  const app = await read('src/App.tsx');
  assert.match(catalog, /type: 'composition_workbench'/);
  assert.match(catalog, /Idea Flow Workbench/);
  for (const view of ['Pattern', 'Notes', 'Arrange', 'Automate', 'Capture']) assert.match(device, new RegExp(view));
  for (const tool of ['quantize', 'strum', 'chop', 'scale']) assert.match(device, new RegExp(tool));
  assert.match(device, /last 60 seconds/);
  assert.match(capture, /No live capture stream has been observed/);
  assert.match(device, /disabled=\{!recallCheck\.ok\}/);
  assert.match(menu, /Ideas, Patterns & Automation/);
  assert.match(menu, /value: 'composition_workbench'/);
  assert.match(templates, /Idea-to-Arrangement Lab/);
  assert.match(app, /start_idea/);
});

test('session variations expose song maps, timed lyrics, canonical mix recall and track focus', async () => {
  const catalog = await read('src/components/rack/rackModuleCatalog.ts');
  const device = await read('src/components/rack/SessionVariationsDevice.tsx');
  const manager = await read('src/components/rack/RackStackManager.tsx');
  const app = await read('src/App.tsx');
  const menu = await read('src/poietek/react/StudioMenuBar.tsx');
  const templates = await read('src/components/daw/TemplatesModal.tsx');
  assert.match(catalog, /type: 'session_variations'/);
  for (const view of ['Song Map', 'Lyrics', 'Mix Scenes', 'Track Focus']) assert.match(device, new RegExp(view));
  assert.match(device, /Non-destructive section order/);
  assert.match(device, /Private lyric scratchpad/);
  assert.match(device, /Preview only/);
  assert.match(device, /Apply scene to project/);
  assert.match(device, /Undo project edit/);
  assert.match(device, /activeProjectSceneId/);
  assert.match(manager, /onApplyProjectMixScene/);
  assert.match(app, /saveAndApplyProjectMixScene/);
  assert.match(app, /projectRuntime\.getSession\(\)\.undo\(\)/);
  assert.match(app, /projectRuntime\.getSession\(\)\.redo\(\)/);
  assert.match(menu, /Song Development & Mix Recall/);
  assert.match(menu, /value: 'session_variations'/);
  assert.match(templates, /idea_variants/);
});

test('Performance Canvas joins scene launching, rehearsal capture and canonical arrangement commit', async () => {
  const catalog = await read('src/components/rack/rackModuleCatalog.ts');
  const device = await read('src/components/rack/PerformanceCanvasDevice.tsx');
  const manager = await read('src/components/rack/RackStackManager.tsx');
  const app = await read('src/App.tsx');
  const menu = await read('src/poietek/react/StudioMenuBar.tsx');
  const templates = await read('src/components/daw/TemplatesModal.tsx');
  const docs = await read('docs/TRACKTION_WAVEFORM_WORKFLOW_ABSTRACTION.md');
  assert.match(catalog, /type: 'performance_canvas'/);
  for (const view of ['Canvas', 'Capture', 'Arrange', 'Readiness']) assert.match(device, new RegExp(view));
  for (const control of ['Create starter canvas', 'Advance bar', 'Commit captured performance to arrangement']) assert.match(device, new RegExp(control));
  assert.match(device, /Manual planning cursor, not the audio clock/);
  assert.match(device, /Live clock gated/);
  assert.match(manager, /PerformanceCanvasDevice/);
  assert.match(app, /createStarterPerformanceCanvasProject/);
  assert.match(app, /commitProjectPerformanceCapture/);
  assert.match(menu, /Performance Canvas & Scene Capture/);
  assert.match(templates, /Performance Canvas & Arrangement Rig/);
  assert.match(docs, /org\.poietek\.performance-canvas/);
  assert.match(docs, /No\s+Tracktion code, binaries, media, presets, DSP/);
});

test('Production Regions move or copy exact clip and automation membership through one project transaction', async () => {
  const catalog = await read('src/components/rack/rackModuleCatalog.ts');
  const device = await read('src/components/rack/ProductionRegionsDevice.tsx');
  const manager = await read('src/components/rack/RackStackManager.tsx');
  const app = await read('src/App.tsx');
  const menu = await read('src/poietek/react/StudioMenuBar.tsx');
  const templates = await read('src/components/daw/TemplatesModal.tsx');
  const library = await read('src/poietek/library/catalog.ts');
  const docs = await read('docs/ACOUSTICA_MIXCRAFT_WORKFLOW_ABSTRACTION.md');
  assert.match(catalog, /type: 'production_regions'/);
  for (const view of ['Regions', 'Plan', 'History', 'Readiness']) assert.match(device, new RegExp(view));
  for (const control of ['Create starter regions', 'Capture range']) assert.match(device, new RegExp(control));
  assert.match(device, /Apply \{action\} as one project change/);
  assert.match(device, /boundaries split canonical material|boundary cuts through material/);
  assert.match(device, /No Acoustica code, branding, interface artwork, presets, media, DSP or project formats/);
  assert.match(manager, /ProductionRegionsDevice/);
  assert.match(app, /createStarterProductionRegionsProject/);
  assert.match(app, /captureProjectProductionRegion/);
  assert.match(app, /applyProjectProductionRegionAction/);
  assert.match(menu, /Production Regions & Section Editing/);
  assert.match(templates, /Production Regions Arrangement Rig/);
  assert.match(library, /id: "production-regions"/);
  assert.match(docs, /org\.poietek\.production-regions/);
  assert.match(docs, /does not copy Acoustica or Mixcraft source code/);
});

test('action workshop exposes safe macros, package provenance and canonical project transactions', async () => {
  const catalog = await read('src/components/rack/rackModuleCatalog.ts');
  const device = await read('src/components/rack/ActionExtensionWorkshopDevice.tsx');
  const manager = await read('src/components/rack/RackStackManager.tsx');
  const app = await read('src/App.tsx');
  const menu = await read('src/poietek/react/StudioMenuBar.tsx');
  const templates = await read('src/components/daw/TemplatesModal.tsx');
  assert.match(catalog, /type: 'action_extension_workshop'/);
  for (const view of ['Actions', 'Macros', 'Packages', 'Customize']) assert.match(device, new RegExp(view));
  assert.match(device, /Dry-run plan/);
  assert.match(device, /External code disabled/);
  assert.match(device, /Declare metadata only/);
  assert.match(manager, /ActionExtensionWorkshopDevice/);
  assert.match(app, /mutateProjectActionWorkflowState/);
  assert.match(app, /runProjectActionRecipe/);
  assert.match(app, /runProjectCycleAction/);
  assert.match(menu, /Actions, Extensions & Customize/);
  assert.match(menu, /value: 'action_extension_workshop'/);
  assert.match(templates, /Editing Actions & Recall Rig/);
});

test('motion matrix exposes deterministic modulators, typed routes, scenes and honest delivery gates', async () => {
  const catalog = await read('src/components/rack/rackModuleCatalog.ts');
  const device = await read('src/components/rack/MotionMatrixDevice.tsx');
  const manager = await read('src/components/rack/RackStackManager.tsx');
  const app = await read('src/App.tsx');
  const menu = await read('src/poietek/react/StudioMenuBar.tsx');
  const templates = await read('src/components/daw/TemplatesModal.tsx');
  const docs = await read('docs/BITWIG_WORKFLOW_ABSTRACTION.md');
  assert.match(catalog, /type: 'motion_matrix'/);
  for (const view of ['Modulators', 'Matrix', 'Scenes', 'Inspector']) assert.match(device, new RegExp(view));
  assert.match(device, /deterministic/i);
  assert.match(device, /DSP delivery gated/);
  assert.match(device, /Save macro controls as one project change/);
  assert.match(manager, /MotionMatrixDevice/);
  assert.match(app, /mutateProjectModulationWorkflowState/);
  assert.match(app, /start_motion/);
  assert.match(menu, /Modulation, Expression & Control/);
  assert.match(menu, /value: 'motion_matrix'/);
  assert.match(templates, /Modular Motion & Performance Rig/);
  assert.match(docs, /org\.poietek\.motion-matrix/);
  assert.match(docs, /does not claim audio-rate DSP/);
});

test('Tracking Console is wired through rack discovery, navigation, templates, project mutations and honest evidence UI', async () => {
  const types = await read('src/types/index.ts');
  const catalog = await read('src/components/rack/rackModuleCatalog.ts');
  const stack = await read('src/components/rack/RackStackManager.tsx');
  const app = await read('src/App.tsx');
  const menu = await read('src/poietek/react/StudioMenuBar.tsx');
  const templates = await read('src/components/daw/TemplatesModal.tsx');
  const device = await read('src/components/rack/TrackingConsoleDevice.tsx');
  const library = await read('src/poietek/library/catalog.ts');
  const docs = await read('docs/UNIVERSAL_AUDIO_LUNA_WORKFLOW_ABSTRACTION.md');
  assert.match(types, /'tracking_console'/);
  assert.match(catalog, /type: 'tracking_console'/);
  assert.match(stack, /case 'tracking_console'/);
  assert.match(stack, /TrackingConsoleDevice/);
  assert.match(app, /createStarterTrackingConsoleProject/);
  assert.match(app, /mutateProjectTrackingConsoleState/);
  assert.match(menu, /Tracking Console & Capture Paths/);
  assert.match(templates, /Capture Paths & Cue Recall Rig/);
  assert.match(device, /Source → monitor → cue → clean or processed record intent/);
  assert.match(device, /No active capture evidence/);
  assert.match(device, /Runtime observations were intentionally excluded/);
  assert.match(library, /id: "tracking-console"/);
  assert.match(docs, /org\.poietek\.tracking-console/);
  assert.match(docs, /does not include Universal Audio or LUNA source code/);
});

test('Take Studio connects aligned real audio, segment selection and atomic comp commit without false render claims', async () => {
  const types = await read('src/types/index.ts');
  const catalog = await read('src/components/rack/rackModuleCatalog.ts');
  const stack = await read('src/components/rack/RackStackManager.tsx');
  const app = await read('src/App.tsx');
  const menu = await read('src/poietek/react/StudioMenuBar.tsx');
  const templates = await read('src/components/daw/TemplatesModal.tsx');
  const device = await read('src/components/rack/TakeCompStudioDevice.tsx');
  const library = await read('src/poietek/library/catalog.ts');
  const docs = await read('docs/APPLE_LOGIC_CREATOR_STUDIO_WORKFLOW_ABSTRACTION.md');
  assert.match(types, /'take_comp_studio'/);
  assert.match(catalog, /type: 'take_comp_studio'/);
  assert.match(stack, /case 'take_comp_studio'/);
  assert.match(stack, /TakeCompStudioDevice/);
  assert.match(app, /createProjectTakeComp/);
  assert.match(app, /selectProjectTakeCompSegment/);
  assert.match(app, /commitProjectTakeComp/);
  assert.match(menu, /Take Studio & Comp Builder/);
  assert.match(templates, /Vocal Takes & Comping Rig/);
  for (const view of ['Take stack', 'Comp lanes', 'Preview & commit', 'Readiness']) assert.match(device, new RegExp(view));
  assert.match(device, /No source media was copied, deleted, rendered, or processed/);
  assert.match(device, /Flatten-and-merge/);
  assert.match(library, /id: "take-comp-studio"/);
  assert.match(docs, /poietek\.core\.take-comp\.v1|Take Studio & Comp Builder/);
  assert.match(docs, /does not include or reproduce Apple source code/);
});

test('professional menus cascade by production family and keep help separate', async () => {
  const menu = await read('src/poietek/react/StudioMenuBar.tsx');
  const style = await read('src/poietek/react/StudioMenuCascade.css');
  for (const group of ['Instruments & Harmony', 'Samplers & Rhythm', 'Mix, Effects & Routing', 'MIDI & Hardware']) assert.match(menu, new RegExp(group.replace('&', '\\&')));
  for (const help of ['Guides, Lessons & FAQ', 'What is working and missing?', 'Public-release readiness']) assert.match(menu, new RegExp(help.replace('?', '\\?')));
  assert.match(menu, /children\?: MenuItem\[\]/);
  assert.match(style, /poietek-menu-cascade-panel/);
});

test('Note Forge connects canonical MIDI ideas, deterministic previews and project undo without realtime claims', async () => {
  const types = await read('src/types/index.ts');
  const catalog = await read('src/components/rack/rackModuleCatalog.ts');
  const stack = await read('src/components/rack/RackStackManager.tsx');
  const app = await read('src/App.tsx');
  const menu = await read('src/poietek/react/StudioMenuBar.tsx');
  const templates = await read('src/components/daw/TemplatesModal.tsx');
  const device = await read('src/components/rack/NoteForgeMidiLabDevice.tsx');
  const library = await read('src/poietek/library/catalog.ts');
  const docs = await read('docs/ABLETON_WORKFLOW_ABSTRACTION.md');
  assert.match(types, /'note_forge_midi_lab'/);
  assert.match(catalog, /type: 'note_forge_midi_lab'/);
  assert.match(stack, /case 'note_forge_midi_lab'/);
  assert.match(stack, /NoteForgeMidiLabDevice/);
  assert.match(app, /createStarterMidiClip/);
  assert.match(app, /commitProjectMidiOperation/);
  assert.match(menu, /Note Forge MIDI Lab/);
  assert.match(templates, /Portable MIDI Sketch & Performance Rig/);
  for (const view of ['Clip ideas', 'Variations', 'Generators', 'Readiness']) assert.match(device, new RegExp(view));
  assert.match(device, /Local · deterministic · undoable/);
  assert.match(device, /does not claim that a preview was heard/);
  assert.match(device, /No Ableton code/);
  assert.match(library, /id: "note-forge-midi-lab"/);
  assert.match(docs, /poietek\.core\.note-forge\.v1/);
  assert.match(docs, /does not claim Link integration/);
});

test('Editorial Memory connects durable selections, exact clip groups, arranger pins and stale-safe naming', async () => {
  const types = await read('src/types/index.ts');
  const catalog = await read('src/components/rack/rackModuleCatalog.ts');
  const stack = await read('src/components/rack/RackStackManager.tsx');
  const app = await read('src/App.tsx');
  const menu = await read('src/poietek/react/StudioMenuBar.tsx');
  const templates = await read('src/components/daw/TemplatesModal.tsx');
  const device = await read('src/components/rack/EditorialMemoryWorkbenchDevice.tsx');
  const arranger = await read('src/poietek/react/StudioArrangerView.tsx');
  const library = await read('src/poietek/library/catalog.ts');
  const docs = await read('docs/AVID_PRO_TOOLS_WORKFLOW_ABSTRACTION.md');
  assert.match(types, /'editorial_memory'/);
  assert.match(catalog, /type: 'editorial_memory'/);
  assert.match(stack, /case 'editorial_memory'/);
  assert.match(stack, /EditorialMemoryWorkbenchDevice/);
  assert.match(app, /createStarterEditorialProject/);
  assert.match(app, /applyProjectEditorialBatchRename/);
  assert.match(menu, /Editorial Memory & Clip Groups/);
  assert.match(templates, /Precision Editorial & Session Recall Rig/);
  for (const view of ['Edit memory', 'Clip groups', 'Batch names', 'System map']) assert.match(device, new RegExp(view));
  assert.match(device, /const \[view, setView\] = useState<EditorialView>/);
  assert.match(device, /setView\(item\.id\); patchParameters\(\{view: item\.id\}\)/);
  assert.match(device, /asset names and files remain unchanged/i);
  assert.match(device, /No Avid code/);
  assert.match(arranger, /onToggleTrackPin/);
  assert.match(arranger, /is-pinned/);
  assert.match(library, /id: "editorial-memory"/);
  assert.match(docs, /org\.poietek\.editorial-memory/);
  assert.match(docs, /does not provide AAF\/OMF|does not claim AAF\/OMF/i);
});
