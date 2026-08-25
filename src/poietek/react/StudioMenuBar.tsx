import {useEffect, useRef, useState} from 'react';
import type {StudioSetupTab} from './StudioSetupModal';
import type {StudioArea, StudioCommandDetail, StudioCommandId} from './studioCommands';
import './StudioMenuBar.css';
import './StudioMenuCascade.css';

interface MenuItem {
  label: string;
  shortcut?: string;
  command?: StudioCommandId;
  value?: string;
  area?: StudioArea;
  setupTab?: StudioSetupTab;
  action?: 'fullscreen' | 'shortcuts' | 'about' | 'governance';
  ecosystemView?: 'creator' | 'governance' | 'workflows' | 'progress' | 'release' | 'community';
  children?: MenuItem[];
  disabledReason?: string;
  separator?: boolean;
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

const capabilityBoundaryWarnings = [
  'validated BS.1770 / true-peak implementation is not installed',
  'validated time-preserving DSP backend is not installed',
  'No verified MIDI-clock output adapter is active',
  'Multi-output cue routing needs a verified native audio-device adapter',
];

export interface StudioMenuBarProps {
  activeArea: StudioArea;
  onAreaChange: (area: StudioArea) => void;
  onCommand: (detail: StudioCommandDetail, targetArea?: StudioArea) => void;
  onOpenSetup: (tab: StudioSetupTab) => void;
}

const areaItem = (label: string, area: StudioArea, shortcut?: string): MenuItem => ({
  label,
  area,
  shortcut,
});

function buildMenus(activeArea: StudioArea): MenuGroup[] {
  const transportArea: StudioArea = activeArea === 'rack' ? 'rack' : 'arrange';

  return [
    {
      label: 'File',
      items: [
        {label: 'New Project', shortcut: 'Ctrl+N', command: 'project-new', area: 'arrange'},
        {label: 'Open Local Projects', shortcut: 'Ctrl+O', command: 'project-open', area: 'arrange'},
        {label: 'Save Project', shortcut: 'Ctrl+S', command: 'project-save', area: 'arrange'},
        {label: '', separator: true},
        {label: 'Import Audio…', shortcut: 'Ctrl+I', command: 'audio-import', area: 'arrange'},
        {label: 'Export PCM WAV…', shortcut: 'Ctrl+E', command: 'audio-export-wav', area: 'arrange'},
        {label: 'Project Settings…', setupTab: 'files'},
      ],
    },
    {
      label: 'Edit',
      items: [
        {label: 'Undo', shortcut: 'Ctrl+Z', command: 'edit-undo', area: transportArea},
        {label: 'Redo', shortcut: 'Ctrl+Shift+Z', command: 'edit-redo', area: transportArea},
        {label: 'Select All', shortcut: 'Ctrl+A', command: 'edit-select-all', area: transportArea},
      ],
    },
    {
      label: 'Project',
      items: [
        {label: 'New Project', shortcut: 'Ctrl+N', command: 'project-new', area: 'arrange'},
        {label: 'Open Local Projects', shortcut: 'Ctrl+O', command: 'project-open', area: 'arrange'},
        {label: 'Save Project', shortcut: 'Ctrl+S', command: 'project-save', area: 'arrange'},
        {label: 'Project Settings…', setupTab: 'files'},
      ],
    },
    {
      label: 'Track',
      items: [
        {label: 'Add Audio Track', command: 'track-add-audio', area: 'arrange'},
        {label: 'Add MIDI Track', command: 'track-add-midi', area: 'arrange'},
        {label: 'Duplicate Track', command: 'track-duplicate', area: 'arrange'},
      ],
    },
    {
      label: 'Clip',
      items: [
        {label: 'Split at Playhead', command: 'clip-split', area: 'arrange'},
        {label: 'Duplicate Clip', command: 'clip-duplicate', area: 'arrange'},
        {label: 'Fade In / Fade Out', command: 'clip-fades', area: 'arrange'},
      ],
    },
    {
      label: 'Audio',
      items: [
        {label: 'Import Audio…', shortcut: 'Ctrl+I', command: 'audio-import', area: 'arrange'},
        {label: 'Export PCM WAV…', shortcut: 'Ctrl+E', command: 'audio-export-wav', area: 'arrange'},
        {label: 'Audio Health', command: 'arrange-show-health', area: 'arrange'},
      ],
    },
    {
      label: 'MIDI',
      items: [
        {label: 'MIDI Routing Matrix', command: 'rack-workspace', value: 'midi_matrix', area: 'rack'},
        {label: 'Note Forge MIDI Lab', command: 'rack-workspace', value: 'note_forge_midi_lab', area: 'rack'},
        {label: 'Piano Roll', command: 'rack-workspace', value: 'piano_roll', area: 'rack'},
      ],
    },
    {
      label: 'Devices',
      items: [
        {label: 'Hardware Interface', command: 'rack-workspace', value: 'hardware_interface', area: 'rack'},
        {label: 'Patch Bay', command: 'rack-workspace', value: 'patchbay', area: 'rack'},
        {label: 'Device Setup…', setupTab: 'devices'},
      ],
    },
    {
      label: 'Mixer',
      items: [
        {label: 'Control Room', command: 'rack-workspace', value: 'control_room', area: 'rack'},
        {label: 'Mix Console', command: 'arrange-show-console', area: 'arrange'},
        {label: 'Routing', command: 'rack-workspace', value: 'midi_matrix', area: 'rack'},
      ],
    },
    {
      label: 'Transport',
      items: [
        {label: 'Play / Pause', command: 'transport-play-toggle', area: transportArea},
        {label: 'Record', command: 'transport-record-toggle', area: transportArea},
        {label: 'Stop', command: 'transport-stop', area: transportArea},
        {label: 'Return to Zero', command: 'transport-return-zero', area: transportArea},
        {
          label: 'Metronome Click',
          command: 'transport-metronome-toggle',
          area: 'rack',
          disabledReason:
            activeArea === 'rack'
              ? undefined
              : 'Metronome click is currently implemented in the Rack transport only.',
        },
      ],
    },
    {
      label: 'View',
      items: [
        areaItem('Arrange', 'arrange', 'F7'),
        areaItem('Rack', 'rack', 'F6'),
        {label: 'Community Hub', ecosystemView: 'community'},
        {label: 'AI Studio', area: 'ai'},
        {label: 'Ecosystem', area: 'ecosystem'},
      ],
    },
    {
      label: 'Window',
      items: [
        {label: 'Studio Preferences…', shortcut: 'Ctrl+,', setupTab: 'profiles'},
        {label: 'Appearance & Accessibility…', setupTab: 'appearance'},
        {label: 'Keyboard shortcuts', action: 'shortcuts'},
      ],
    },
    {
      label: 'Workspace',
      items: [
        areaItem('Arrange', 'arrange', 'F7'),
        areaItem('Rack', 'rack', 'F6'),
        {label: 'Community Hub', ecosystemView: 'community'},
        {label: 'AI Studio', area: 'ai'},
        {label: 'Ecosystem', area: 'ecosystem'},
        {label: '', separator: true},
        {label: 'Studio Preferences…', shortcut: 'Ctrl+,', setupTab: 'profiles'},
        {label: 'Appearance & Accessibility…', setupTab: 'appearance'},
      ],
    },
    {
      label: 'Production',
      items: [
        {label: 'Arrange tools', children: [
          {label: 'Timeline & mix view', command: 'arrange-show-timeline', area: 'arrange'},
          {label: 'Console view', command: 'arrange-show-console', area: 'arrange'},
          {label: 'Audio health', command: 'arrange-show-health', area: 'arrange'},
          {label: 'Import audio', command: 'audio-import', area: 'arrange'},
        ]},
        {label: 'Instruments & Harmony', children: [
          {label: 'Prism Poly Synth', command: 'rack-workspace', value: 'keyboard', area: 'rack'},
          {label: 'Note Forge MIDI Lab', command: 'rack-workspace', value: 'note_forge_midi_lab', area: 'rack'},
          {label: 'Idea Flow Workbench', command: 'rack-workspace', value: 'composition_workbench', area: 'rack'},
          {label: 'Motion Matrix', command: 'rack-workspace', value: 'motion_matrix', area: 'rack'},
        ]},
        {label: 'Samplers & Rhythm', children: [
          {label: 'Canvas Drum Grid', command: 'rack-workspace', value: 'mpc', area: 'rack'},
          {label: 'E-Drum Mesh Kit', command: 'rack-workspace', value: 'edrum', area: 'rack'},
          {label: 'Take Studio & Comp Builder', command: 'rack-workspace', value: 'take_comp_studio', area: 'rack'},
          {label: 'Performance Canvas & Scene Capture', command: 'rack-workspace', value: 'performance_canvas', area: 'rack'},
        ]},
        {label: 'Mix, Effects & Routing', children: [
          {label: 'Tracking Console & Capture Paths', command: 'rack-workspace', value: 'tracking_console', area: 'rack'},
          {label: 'Control Room', command: 'rack-workspace', value: 'control_room', area: 'rack'},
          {label: 'Production Regions & Section Editing', command: 'rack-workspace', value: 'production_regions', area: 'rack'},
          {label: 'MIDI & Hardware', command: 'rack-workspace', value: 'midi_matrix', area: 'rack'},
        ]},
        {label: 'MIDI & Hardware', children: [
          {label: 'MIDI routing matrix', command: 'rack-workspace', value: 'midi_matrix', area: 'rack'},
          {label: 'Patch Bay & routing', command: 'rack-workspace', value: 'patchbay', area: 'rack'},
          {label: 'Hardware Interface', command: 'rack-workspace', value: 'hardware_interface', area: 'rack'},
          {label: 'Remote Session', command: 'rack-workspace', value: 'remote_session', area: 'rack'},
        ]},
        {label: 'Delivery & sharing', children: [
          {label: 'Community Hub', ecosystemView: 'community'},
          {label: 'Batch Delivery Workshop', command: 'rack-workspace', value: 'batch_delivery', area: 'rack'},
          {label: 'Export PCM WAV', command: 'audio-export-wav', area: 'arrange'},
          {label: 'Release status', ecosystemView: 'release'},
          {label: 'Safe Naming & Dry Run', command: 'rack-workspace', value: 'batch_delivery', area: 'rack'},
        ]},
        {label: 'Production Foundations', children: [
          {label: 'Score Workbench', command: 'rack-workspace', value: 'score_workbench', area: 'rack'},
          {label: 'Technique Matrix', command: 'rack-workspace', value: 'technique_matrix', area: 'rack'},
          {label: 'Spectral Workbench', command: 'rack-workspace', value: 'spectral_workbench', area: 'rack'},
          {label: 'Offline Process Chain', command: 'rack-workspace', value: 'offline_process_chain', area: 'rack'},
          {label: 'Picture Post', command: 'rack-workspace', value: 'picture_post', area: 'rack'},
          {label: 'ADR Cues, Takes & Talent Overlay', command: 'rack-workspace', value: 'picture_post', area: 'rack'},
          {label: 'AAF / CMX3600 / TTAL Import', command: 'rack-workspace', value: 'picture_post', area: 'rack'},
          {label: 'Sequence Assembly', command: 'rack-workspace', value: 'sequence_assembly', area: 'rack'},
          {label: 'Independent Cues & Conductor Maps', command: 'rack-workspace', value: 'sequence_assembly', area: 'rack'},
          {label: 'Immersive Monitor', command: 'rack-workspace', value: 'immersive_monitor', area: 'rack'},
          {label: 'Mastering Delivery', command: 'rack-workspace', value: 'mastering_delivery', area: 'rack'},
          {label: 'Control Room', command: 'rack-workspace', value: 'control_room', area: 'rack'},
          {label: 'midi_transformer', command: 'rack-workspace', value: 'midi_transformer', area: 'rack'},
        ]},
        {label: 'Session & Recall', children: [
          {label: 'Ideas, Patterns & Automation', command: 'rack-workspace', value: 'composition_workbench', area: 'rack'},
          {label: 'Song Development & Mix Recall', command: 'rack-workspace', value: 'session_variations', area: 'rack'},
          {label: 'Performance Canvas & Scene Capture', command: 'rack-workspace', value: 'performance_canvas', area: 'rack'},
          {label: 'Production Regions & Section Editing', command: 'rack-workspace', value: 'production_regions', area: 'rack'},
          {label: 'Actions, Extensions & Customize', command: 'rack-workspace', value: 'action_extension_workshop', area: 'rack'},
          {label: 'Modulation, Expression & Control', command: 'rack-workspace', value: 'motion_matrix', area: 'rack'},
          {label: 'Editorial Memory & Clip Groups', command: 'rack-workspace', value: 'editorial_memory', area: 'rack'},
        ]},
      ],
    },
    {
      label: 'Help',
      items: [
        {label: 'Keyboard shortcuts', action: 'shortcuts'},
        {label: 'Guides, Lessons & FAQ', ecosystemView: 'governance'},
        {label: 'What is working and missing?', ecosystemView: 'progress'},
        {label: 'Production workflow map', ecosystemView: 'workflows'},
        {label: 'Creator platform overview', ecosystemView: 'creator'},
        {label: 'Product status', ecosystemView: 'progress'},
        {label: 'Public-release readiness', ecosystemView: 'release'},
        {label: 'Privacy & security', setupTab: 'privacy'},
        {label: 'About Poietek Studio', action: 'about'},
      ],
    },
  ];
}
export function StudioMenuBar({activeArea, onAreaChange, onCommand, onOpenSetup}: StudioMenuBarProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [menuPlacement, setMenuPlacement] = useState<Record<string, {left: number; top: number}>>({});
  const [dialog, setDialog] = useState<'shortcuts' | 'about' | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const menus = buildMenus(activeArea);

  const capabilityText = capabilityBoundaryWarnings.join(' • ');

  const updateMenuPlacement = () => {
    const nextPlacement: Record<string, {left: number; top: number}> = {};
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    for (const menu of menus) {
      const node = menuRefs.current.get(menu.label);
      if (!node) continue;
      const rect = node.getBoundingClientRect();
      const safeLeft = Math.min(Math.max(12, rect.left), Math.max(12, viewportWidth - 320));
      const safeTop = Math.min(rect.bottom + 8, Math.max(36, viewportHeight - 260));
      nextPlacement[menu.label] = {left: safeLeft, top: safeTop};
    }

    setMenuPlacement((previous) => ({...previous, ...nextPlacement}));
  };

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpenMenu(null);
    };
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenMenu(null);
        setDialog(null);
      }
    };
    const handleResize = () => updateMenuPlacement();
    window.addEventListener('pointerdown', closeOutside);
    window.addEventListener('keydown', closeWithEscape);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('pointerdown', closeOutside);
      window.removeEventListener('keydown', closeWithEscape);
      window.removeEventListener('resize', handleResize);
    };
  }, [menus]);

  useEffect(() => {
    if (openMenu) updateMenuPlacement();
  }, [openMenu, menus]);

  const runItem = async (item: MenuItem) => {
    if (item.disabledReason) return;
    setOpenMenu(null);
    if (item.ecosystemView) {
      window.sessionStorage.setItem('poietek-ecosystem-view', item.ecosystemView);
      window.dispatchEvent(new CustomEvent('poietek:ecosystem-view', {detail: item.ecosystemView}));
      onAreaChange('ecosystem');
      return;
    }
    if (item.setupTab) {
      onOpenSetup(item.setupTab);
      return;
    }
    if (item.action === 'fullscreen') {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
      return;
    }
    if (item.action === 'shortcuts' || item.action === 'about') {
      setDialog(item.action);
      return;
    }
    if (item.action === 'governance') {
      window.sessionStorage.setItem('poietek-ecosystem-view', 'governance');
      window.dispatchEvent(new CustomEvent('poietek:ecosystem-view', {detail: 'governance'}));
      onAreaChange('ecosystem');
      return;
    }
    if (item.command) {
      onCommand({id: item.command, value: item.value}, item.area);
      return;
    }
    if (item.area) onAreaChange(item.area);
  };

  return (
    <>
      <div className="poietek-menu-bar" ref={rootRef} role="menubar" aria-label="Studio application menu">
        <span className="poietek-menu-app-name">Poietek</span>
        <div className="poietek-menu-scroll">
          {menus.map((menu) => (
            <div
              className="poietek-menu-root"
              key={menu.label}
              ref={(node) => {
                menuRefs.current.set(menu.label, node);
              }}
            >
              <button
                type="button"
                role="menuitem"
                aria-haspopup="menu"
                aria-expanded={openMenu === menu.label}
                onClick={() => setOpenMenu((current) => current === menu.label ? null : menu.label)}
                onPointerEnter={() => openMenu && setOpenMenu(menu.label)}
              >
                {menu.label}
              </button>
              {openMenu === menu.label && (
                <div
                  className="poietek-menu-popover"
                  role="menu"
                  aria-label={`${menu.label} menu`}
                  style={{
                    left: `${menuPlacement[menu.label]?.left ?? 0}px`,
                    top: `${menuPlacement[menu.label]?.top ?? 0}px`,
                  }}
                >
                  {menu.items.map((item, index) => item.separator ? (
                    <hr key={`${menu.label}-${index}`} />
                  ) : item.children ? (
                    <div className="poietek-menu-cascade" key={`${menu.label}-${item.label}`}>
                      <button type="button" role="menuitem" aria-haspopup="menu" className="poietek-menu-cascade-trigger">
                        <span>{item.label}</span><i aria-hidden="true">›</i>
                      </button>
                      <div className="poietek-menu-cascade-panel" role="menu" aria-label={item.label}>
                        {item.children.map((child) => (
                          <button type="button" role="menuitem" key={`${item.label}-${child.label}`} disabled={Boolean(child.disabledReason)} title={child.disabledReason} onClick={() => void runItem(child)}>
                            <span>{child.label}</span>{child.shortcut && <kbd>{child.shortcut}</kbd>}{child.disabledReason && <small>Unavailable</small>}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      role="menuitem"
                      key={`${menu.label}-${item.label}`}
                      disabled={Boolean(item.disabledReason)}
                      title={item.disabledReason}
                      onClick={() => void runItem(item)}
                    >
                      <span>{item.label}</span>
                      {item.shortcut && <kbd>{item.shortcut}</kbd>}
                      {item.disabledReason && <small>Unavailable</small>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <span className="poietek-menu-area">{activeArea}</span>
      </div>

      <div className="poietek-capability-boundaries" aria-live="polite" aria-label="Studio capability boundaries">
        <p>{capabilityText}</p>
      </div>

      {dialog && (
        <div className="poietek-info-dialog-backdrop" role="presentation" onMouseDown={() => setDialog(null)}>
          <section className="poietek-info-dialog" role="dialog" aria-modal="true" aria-labelledby="poietek-info-title" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <div>
                <p>Poietek Studio</p>
                <h2 id="poietek-info-title">{dialog === 'shortcuts' ? 'Keyboard shortcuts' : 'About this build'}</h2>
              </div>
              <button type="button" onClick={() => setDialog(null)} aria-label="Close dialog">×</button>
            </header>
            {dialog === 'shortcuts' ? (
              <dl className="poietek-shortcut-grid">
                <div><dt>F6</dt><dd>Rack</dd></div><div><dt>F7</dt><dd>Arrange</dd></div>
                <div><dt>F8</dt><dd>Ecosystem</dd></div><div><dt>F9</dt><dd>AI Studio</dd></div>
                <div><dt>Space</dt><dd>Play / pause in the active production area</dd></div><div><dt>Tab</dt><dd>Flip the Rack front / rear</dd></div>
                <div><dt>Ctrl+Z</dt><dd>Undo in the active production area</dd></div><div><dt>Ctrl+Shift+Z</dt><dd>Redo</dd></div>
              </dl>
            ) : (
              <div className="poietek-about-copy">
                <strong>Local-first production system</strong>
                <p>Projects and media are stored on the device first. Arrange is the canonical audio workspace; Rack provides instruments, sampling, mixing and patching. Online providers remain optional.</p>
                <p>Unavailable capabilities are labelled honestly. This build does not claim validated LUFS/true-peak metering, time-preserving pitch DSP, unsupported hardware control, or external rights acceptance.</p>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
