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
        {label: 'Rack modules', children: [
          {label: 'Note Forge MIDI Lab', command: 'rack-workspace', value: 'note_forge_midi_lab', area: 'rack'},
          {label: 'Idea Flow Workbench', command: 'rack-workspace', value: 'composition_workbench', area: 'rack'},
          {label: 'Take Studio & Comp Builder', command: 'rack-workspace', value: 'take_comp_studio', area: 'rack'},
          {label: 'Motion Matrix', command: 'rack-workspace', value: 'motion_matrix', area: 'rack'},
          {label: 'Patch Bay & routing', command: 'rack-workspace', value: 'patchbay', area: 'rack'},
        ]},
        {label: 'Mix & routing', children: [
          {label: 'Tracking Console', command: 'rack-workspace', value: 'tracking_console', area: 'rack'},
          {label: 'Production Console', command: 'arrange-show-console', area: 'arrange'},
          {label: 'Control Room', command: 'rack-workspace', value: 'control_room', area: 'rack'},
          {label: 'MIDI routing matrix', command: 'rack-workspace', value: 'midi_matrix', area: 'rack'},
        ]},
        {label: 'Delivery & sharing', children: [
          {label: 'Community Hub', ecosystemView: 'community'},
          {label: 'Batch Delivery Workshop', command: 'rack-workspace', value: 'batch_delivery', area: 'rack'},
          {label: 'Export PCM WAV', command: 'audio-export-wav', area: 'arrange'},
          {label: 'Release status', ecosystemView: 'release'},
        ]},
      ],
    },
    {
      label: 'Help',
      items: [
        {label: 'Keyboard shortcuts', action: 'shortcuts'},
        {label: 'Guides, lessons & FAQ', ecosystemView: 'governance'},
        {label: 'Production workflow map', ecosystemView: 'workflows'},
        {label: 'Creator platform overview', ecosystemView: 'creator'},
        {label: 'Product status', ecosystemView: 'progress'},
        {label: 'Public release readiness', ecosystemView: 'release'},
        {label: 'Privacy & security', setupTab: 'privacy'},
        {label: 'About Poietek Studio', action: 'about'},
      ],
    },
  ];
}
export function StudioMenuBar({activeArea, onAreaChange, onCommand, onOpenSetup}: StudioMenuBarProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [dialog, setDialog] = useState<'shortcuts' | 'about' | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const menus = buildMenus(activeArea);

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
    window.addEventListener('pointerdown', closeOutside);
    window.addEventListener('keydown', closeWithEscape);
    return () => {
      window.removeEventListener('pointerdown', closeOutside);
      window.removeEventListener('keydown', closeWithEscape);
    };
  }, []);

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
            <div className="poietek-menu-root" key={menu.label}>
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
                <div className="poietek-menu-popover" role="menu" aria-label={`${menu.label} menu`}>
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
