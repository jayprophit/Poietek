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
  assert.match(navigator, /zoom preset/);
});

test('rack right library cascades and consolidates quick actions', async () => {
  const source = await read('src/components/rack/RackRightSidebar.tsx');
  const app = await read('src/App.tsx');
  for (const section of ['Quick Options', 'Instruments & Samplers', 'Sequencing & Editors', 'Mix, Effects & Buses', 'Routing & Hardware']) {
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

test('professional menus cascade by production family and keep help separate', async () => {
  const menu = await read('src/poietek/react/StudioMenuBar.tsx');
  const style = await read('src/poietek/react/StudioMenuCascade.css');
  for (const group of ['Instruments & Harmony', 'Samplers & Rhythm', 'Mix, Effects & Routing', 'MIDI & Hardware']) assert.match(menu, new RegExp(group.replace('&', '\\&')));
  for (const help of ['Guides, Lessons & FAQ', 'What is working and missing?', 'Public-release readiness']) assert.match(menu, new RegExp(help.replace('?', '\\?')));
  assert.match(menu, /children\?: MenuItem\[\]/);
  assert.match(style, /poietek-menu-cascade-panel/);
});
