import {useEffect, useRef, useState} from 'react';
import type {StudioSetupTab} from './StudioSetupModal';
import type {StudioArea, StudioCommandDetail, StudioCommandId} from './studioCommands';
import './StudioMenuBar.css';

interface MenuItem {
  label: string;
  shortcut?: string;
  command?: StudioCommandId;
  value?: string;
  area?: StudioArea;
  setupTab?: StudioSetupTab;
  action?: 'fullscreen' | 'shortcuts' | 'about';
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
        {label: 'Project Bundle / Stems…', disabledReason: 'Project bundles and stem export are staged; the verified export is PCM16 WAV.'},
      ],
    },
    {
      label: 'Edit',
      items: [
        {label: 'Undo', shortcut: 'Ctrl+Z', command: 'edit-undo', area: activeArea === 'rack' ? 'rack' : 'arrange'},
        {label: 'Redo', shortcut: 'Ctrl+Shift+Z', command: 'edit-redo', area: activeArea === 'rack' ? 'rack' : 'arrange'},
        {label: '', separator: true},
        {label: 'Studio Preferences…', shortcut: 'Ctrl+,', setupTab: 'profiles'},
        {label: 'Editing Preferences…', setupTab: 'editing'},
        {label: 'Appearance & Accessibility…', setupTab: 'appearance'},
      ],
    },
    {
      label: 'Project',
      items: [
        {label: 'Project Rack', command: 'project-open', area: 'arrange'},
        {label: 'Starter Songs & Templates…', command: 'rack-templates', area: 'rack'},
        {label: 'Files, Autosave & Recovery…', setupTab: 'files'},
        {label: 'Tempo Map & Signature…', disabledReason: 'Tempo-map editing is not exposed yet; the canonical model remains authoritative.'},
      ],
    },
    {
      label: 'Track',
      items: [
        {label: 'Add Audio Track by Import…', command: 'audio-import', area: 'arrange'},
        {label: 'Show Arrangement', command: 'arrange-show-timeline', area: 'arrange'},
        {label: 'Show Mix Console', command: 'arrange-show-console', area: 'arrange'},
        {label: 'Add MIDI / Instrument Track', disabledReason: 'Canonical MIDI and instrument-track editing is staged.'},
        {label: 'Track Versions & Comping', disabledReason: 'Take lanes and comping are staged.'},
      ],
    },
    {
      label: 'Clip',
      items: [
        {label: 'Split at Playhead', disabledReason: 'Select a waveform clip and use its Split control; global clip selection is staged.'},
        {label: 'Move, Trim, Gain & Fades', command: 'arrange-show-timeline', area: 'arrange'},
        {label: 'Time Stretch / Warp', disabledReason: 'A validated time-preserving DSP backend is not installed.'},
        {label: 'Pitch Correction', disabledReason: 'Pitch-edit UI is a Rack prototype; production DSP is unavailable.'},
      ],
    },
    {
      label: 'Audio',
      items: [
        {label: 'Audio Setup…', setupTab: 'audio'},
        {label: 'Recording Setup…', setupTab: 'recording'},
        {label: 'Audio Health Inspector', command: 'arrange-show-health', area: 'arrange'},
        {label: 'Export PCM WAV…', command: 'audio-export-wav', area: 'arrange'},
        {label: 'LUFS / True Peak Analysis', disabledReason: 'A validated BS.1770 / true-peak implementation is not installed.'},
      ],
    },
    {
      label: 'MIDI',
      items: [
        {label: 'MIDI & Sync Setup…', setupTab: 'midi'},
        {label: 'MIDI Routing Matrix', command: 'rack-workspace', value: 'midi_matrix', area: 'rack'},
        {label: 'Piano Roll', command: 'rack-workspace', value: 'piano_roll', area: 'rack'},
        {label: 'MIDI Learn / Hardware Mapper', command: 'rack-workspace', value: 'mapper', area: 'rack'},
        {label: 'MIDI Clock Output', disabledReason: 'No verified MIDI-clock output adapter is active.'},
      ],
    },
    {
      label: 'Devices',
      items: [
        areaItem('Studio Rack', 'rack', 'F6'),
        {label: 'Flip Rack / Rear Patching', shortcut: 'Tab', command: 'rack-flip', area: 'rack'},
        {label: 'Audio & CV Patch Bay', command: 'rack-workspace', value: 'patchbay', area: 'rack'},
        {label: 'Plug-in Manager…', setupTab: 'plugins'},
        {label: 'Modules & Content…', setupTab: 'library'},
      ],
    },
    {
      label: 'Mixer',
      items: [
        {label: 'Production Console', command: 'arrange-show-console', area: 'arrange'},
        {label: 'Rack Mixing Desk', command: 'rack-workspace', value: 'mixer', area: 'rack'},
        {label: 'Routing & Patch Bay', command: 'rack-workspace', value: 'patchbay', area: 'rack'},
        {label: 'Control Room / Cue Mixes', disabledReason: 'Multi-output cue routing needs a verified native audio-device adapter.'},
      ],
    },
    {
      label: 'Transport',
      items: [
        {label: 'Play / Pause', shortcut: 'Space', command: 'transport-play-toggle', area: transportArea},
        {label: 'Stop', command: 'transport-stop', area: transportArea},
        {label: 'Return to Zero', command: 'transport-return-zero', area: transportArea},
        {label: 'Record Audio Input', shortcut: 'R', command: 'transport-record-toggle', area: 'arrange'},
        {label: 'Metronome / Click', command: 'transport-metronome-toggle', area: 'rack'},
      ],
    },
    {
      label: 'View',
      items: [
        areaItem('Arrange', 'arrange', 'F7'),
        areaItem('Rack', 'rack', 'F6'),
        areaItem('Ecosystem', 'ecosystem', 'F8'),
        areaItem('AI Studio', 'ai', 'F9'),
        {label: '', separator: true},
        {label: 'Mix Console', command: 'arrange-show-console', area: 'arrange'},
        {label: 'Audio Inspector', command: 'arrange-show-health', area: 'arrange'},
      ],
    },
    {
      label: 'Window',
      items: [
        {label: 'Toggle Full Screen', shortcut: 'F11', action: 'fullscreen'},
        {label: 'Detached Rack Windows', area: 'rack'},
        {label: 'Multi-monitor Layouts', disabledReason: 'Native multi-window persistence is staged.'},
      ],
    },
    {
      label: 'Help',
      items: [
        {label: 'Keyboard Shortcuts', action: 'shortcuts'},
        {label: 'System Benchmark…', setupTab: 'diagnostics'},
        {label: 'Privacy & Security…', setupTab: 'privacy'},
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
