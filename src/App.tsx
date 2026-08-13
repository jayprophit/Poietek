import React, { useState, useEffect, useCallback } from 'react';
import {
  WorkspaceType,
  MasterState,
  ConnectedDevice,
  SamplePad,
  TrackChannel,
  PresetItem,
} from './types';
import { audioEngine } from './audio/engine';
import { midiManager } from './midi/manager';
import { Navigation } from './components/Navigation';
import { HardwareInterfaceUnit } from './components/rack/HardwareInterfaceUnit';
import { StudioTransport } from './components/rack/StudioTransport';
import { StudioRearPanel } from './components/rack/StudioRearPanel';
import { StudioRackDevice } from './components/rack/StudioRackDevice';
import { StudioRackNav } from './components/rack/StudioRackNav';
import { RackPresetAndDemoBar } from './components/rack/RackPresetAndDemoBar';

import { MPCWorkspace } from './components/workspaces/MPCWorkspace';
import { SP404Workspace } from './components/workspaces/SP404Workspace';
import { KeyboardWorkspace } from './components/workspaces/KeyboardWorkspace';
import { EDrumWorkspace } from './components/workspaces/EDrumWorkspace';
import { DJWorkspace } from './components/workspaces/DJWorkspace';
import { MixerWorkspace } from './components/workspaces/MixerWorkspace';
import { PatchBayWorkspace } from './components/workspaces/PatchBayWorkspace';
import { BuiltInDrumMachines } from './components/workspaces/BuiltInDrumMachines';
import { UniversalHardwareMapper } from './components/mapper/UniversalHardwareMapper';
import { VisualDeviceEditor } from './components/mapper/VisualDeviceEditor';
import { MIDIRoutingMatrix } from './components/routing/MIDIRoutingMatrix';
import { ChopLab } from './components/sampler/ChopLab';
import { DeviceHealthModal } from './components/system/DeviceHealthModal';
import { GenerativeGrooveModal } from './components/ai/GenerativeGrooveModal';

import { CircleOfFifthsWheel } from './components/daw/CircleOfFifthsWheel';
import { MelodynePitchEditor } from './components/daw/MelodynePitchEditor';
import { DGrooveMixer } from './components/daw/DGrooveMixer';
import { PianoRollSequencer } from './components/daw/PianoRollSequencer';
import { DAWMenuBar } from './components/daw/DAWMenuBar';
import { DAWBrowserSidebar } from './components/daw/DAWBrowserSidebar';
import { DAWRightSidebar } from './components/daw/DAWRightSidebar';
import { CubaseLogicWaveformSequencer } from './components/daw/CubaseLogicWaveformSequencer';
import { FLStudioChannelRack } from './components/daw/FLStudioChannelRack';
import { FloatingWindowManager } from './components/daw/FloatingWindowManager';
import { DirectToDiskRecorder } from './components/daw/DirectToDiskRecorder';

import { RackModuleItem, StudioTemplate, ModuleType } from './types';
import { RackStackManager } from './components/rack/RackStackManager';
import { FloatingQuickPalette } from './components/daw/FloatingQuickPalette';
import { TemplatesModal } from './components/daw/TemplatesModal';
import { GuidedWalkthroughBanner } from './components/daw/GuidedWalkthroughBanner';
import { ReasonSSLConsole } from './components/rack/ReasonSSLConsole';
import { BottomDAWAndReGroovePanel } from './components/daw/BottomDAWAndReGroovePanel';
import { UnitDetachSelectorModal } from './components/daw/UnitDetachSelectorModal';
import { ProjectManagerModal } from './components/system/ProjectManagerModal';
import { VirtualPianoKeyboardModal } from './components/daw/VirtualPianoKeyboardModal';
import { UserProfileModal } from './components/system/UserProfileModal';
import { SettingsModal } from './components/system/SettingsModal';
import { KeyboardShortcutsModal } from './components/system/KeyboardShortcutsModal';
import { UniversalPlatformModal } from './components/system/UniversalPlatformModal';
import { LanguageTranslatorModal } from './components/system/LanguageTranslatorModal';
import { PluginStoreModal, SubscriptionTier } from './components/system/PluginStoreModal';
import { Disc, Check } from 'lucide-react';

export default function App() {
  // Master Global App State
  const [masterState, setMasterState] = useState<MasterState>({
    bpm: 94,
    isPlaying: false,
    isRecording: false,
    currentStep: 0,
    metronome: false,
    masterVolume: 0.85,
    activeWorkspace: 'mpc',
    learningModeActive: false,
  });

  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>([]);
  const [isAIGrooveOpen, setIsAIGrooveOpen] = useState<boolean>(false);
  const [isRecorderOpen, setIsRecorderOpen] = useState<boolean>(false);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isBrowserOpen, setIsBrowserOpen] = useState<boolean>(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('studio_right_sidebar_open');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });
  const [isQuickPaletteDocked, setIsQuickPaletteDocked] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('studio_quick_palette_docked');
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    localStorage.setItem('studio_right_sidebar_open', JSON.stringify(isRightSidebarOpen));
  }, [isRightSidebarOpen]);

  useEffect(() => {
    localStorage.setItem('studio_quick_palette_docked', JSON.stringify(isQuickPaletteDocked));
  }, [isQuickPaletteDocked]);
  const [detachedWorkspaces, setDetachedWorkspaces] = useState<WorkspaceType[]>([]);
  const [isUnitDetachModalOpen, setIsUnitDetachModalOpen] = useState<boolean>(false);
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState<boolean>(false);
  const [isVirtualKeyboardOpen, setIsVirtualKeyboardOpen] = useState<boolean>(false);

  const [isTemplatesOpen, setIsTemplatesOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isUniversalModalOpen, setIsUniversalModalOpen] = useState<boolean>(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState<boolean>(false);
  const [isStoreOpen, setIsStoreOpen] = useState<boolean>(false);
  const [userTier, setUserTier] = useState<SubscriptionTier>('producer_pass');

  const [deviceProfile, setDeviceProfile] = useState<'desktop' | 'tablet' | 'mobile'>(() => {
    try {
      const saved = localStorage.getItem('studio_device_profile');
      return (saved as any) || 'desktop';
    } catch {
      return 'desktop';
    }
  });

  const [isWalkthroughActive, setIsWalkthroughActive] = useState<boolean>(true);
  const [autoHideBars, setAutoHideBars] = useState<boolean>(false);
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<string>('');

  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(() => {
    return localStorage.getItem('studio_autosave_enabled') !== 'false';
  });

  const [autoSaveInterval, setAutoSaveInterval] = useState<number>(() => {
    const saved = localStorage.getItem('studio_autosave_interval');
    return saved ? parseInt(saved, 10) : 30; // 30 seconds default
  });

  // Infinite Rack Modules State with Undo/Redo History Stack
  const [rackHistory, setRackHistory] = useState<RackModuleItem[][]>(() => {
    try {
      const saved = localStorage.getItem('studio_auto_saved_rack_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [
      [
        { id: 'start_mpc', type: 'mpc', title: 'MPC Studio Drum Pad', tapeLabel: 'BOOM BAP KIT', colorTag: 'amber' },
        {
          id: 'start_bus',
          type: 'folder_combinator',
          title: 'Drums & FX Bus Folder',
          tapeLabel: 'COMBINATOR BUS',
          colorTag: 'gold',
          subModuleIds: ['start_sp404'],
        },
        { id: 'start_sp404', type: 'sp404', title: 'SP-404 MKII Sampler', tapeLabel: 'LO-FI MFX', groupId: 'start_bus', colorTag: 'rose' },
        { id: 'start_subtractor', type: 'subtractor_synth', title: 'Subtractor Polyphonic Synth', tapeLabel: 'DEEP 808 BASS', colorTag: 'violet' },
        { id: 'start_thor', type: 'thor_synth', title: 'Thor Polysonic Synthesizer', tapeLabel: 'CYBER SAW LEAD', colorTag: 'emerald' },
      ],
    ];
  });

  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const rackModules = rackHistory[historyIndex] || [];

  const setRackModules = useCallback(
    (action: React.SetStateAction<RackModuleItem[]>) => {
      setRackHistory((prevHistory) => {
        const currentRack = prevHistory[historyIndex] || [];
        const nextRack = typeof action === 'function' ? action(currentRack) : action;

        if (JSON.stringify(currentRack) === JSON.stringify(nextRack)) {
          return prevHistory;
        }

        const sliced = prevHistory.slice(0, historyIndex + 1);
        const newHistory = [...sliced, nextRack];
        setHistoryIndex(newHistory.length - 1);
        return newHistory;
      });
    },
    [historyIndex]
  );

  // MANUAL & AUTOSAVE TRIGGER FUNCTION
  const handleTriggerManualSave = useCallback(() => {
    try {
      localStorage.setItem('studio_auto_saved_rack_history', JSON.stringify(rackHistory));
      localStorage.setItem('studio_auto_saved_bpm', String(masterState.bpm));
      setLastAutoSaveTime(new Date().toLocaleTimeString());
    } catch (e) {
      console.error('Manual save failed:', e);
    }
  }, [rackHistory, masterState.bpm]);

  // AUTOMATIC REAL-TIME PROJECT SAVE SYSTEM
  useEffect(() => {
    if (!autoSaveEnabled) return;

    const autoSaveTimer = setInterval(() => {
      handleTriggerManualSave();
    }, autoSaveInterval * 1000);

    return () => clearInterval(autoSaveTimer);
  }, [autoSaveEnabled, autoSaveInterval, handleTriggerManualSave]);

  const handleResetProject = useCallback(() => {
    if (window.confirm('Reset current project to factory initial state?')) {
      localStorage.removeItem('studio_auto_saved_rack_history');
      window.location.reload();
    }
  }, []);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex((prev) => prev - 1);
    }
  }, [historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < rackHistory.length - 1) {
      setHistoryIndex((prev) => prev + 1);
    }
  }, [historyIndex, rackHistory.length]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < rackHistory.length - 1;

  // Keyboard Shortcuts Listener for Undo (Ctrl+Z / Cmd+Z) and Redo (Ctrl+Y / Cmd+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement &&
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)
      ) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  const handleAddModuleToRack = (type: ModuleType) => {
    const newId = `mod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    let title = 'Studio Rack Unit';
    let tapeLabel = 'RACK UNIT';
    if (type === 'folder_combinator') {
      title = 'Combinator Bus Folder';
      tapeLabel = 'BUS FOLDER';
    } else {
      title = getRackTitle(type as WorkspaceType);
      tapeLabel = getTapeLabel(type as WorkspaceType);
    }
    const newMod: RackModuleItem = {
      id: newId,
      type,
      title,
      tapeLabel,
      colorTag: 'amber',
    };
    setRackModules((prev) => [...prev, newMod]);
  };

  const handleLoadTemplate = (template: StudioTemplate) => {
    setRackModules(template.modules);
    setMasterState((prev) => ({ ...prev, bpm: template.bpm }));
    if (template.hasWalkthrough) {
      setIsWalkthroughActive(true);
    } else {
      setIsWalkthroughActive(false);
    }
  };

  const handleLoadPreset = (preset: PresetItem) => {
    setRackModules(preset.modules);
    setMasterState((prev) => ({ ...prev, bpm: preset.bpm }));
  };

  const handleLoadRackPreset = useCallback(
    (modules: RackModuleItem[], bpm?: number) => {
      setRackModules(modules);
      if (bpm) {
        setMasterState((prev) => ({ ...prev, bpm }));
      }
    },
    [setRackModules, setMasterState]
  );

  const handleDetachWorkspace = (ws: WorkspaceType) => {
    if (!detachedWorkspaces.includes(ws)) {
      setDetachedWorkspaces((prev) => [...prev, ws]);
    }
  };

  const handleDockWorkspace = (ws: WorkspaceType) => {
    setDetachedWorkspaces((prev) => prev.filter((w) => w !== ws));
  };

  // Keyboard shortcut: TAB key toggles Flip Rack (Rear patch cables panel)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
          return;
        }
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Initialize 128 Pads across Banks A to H (16 per bank)
  const [pads, setPads] = useState<SamplePad[]>(() => {
    const bankLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const sampleIds = [
      'kick_808', 'snare_808', 'hihat_closed', 'hihat_open',
      'clap_classic', 'tom_low', 'tom_mid', 'tom_high',
      'crash_cymbal', 'rim_shot', 'kick_punch', 'snare_sp',
      'synth_bass', 'synth_lead', 'synth_chord', 'vinyl_scratch'
    ];
    const padNames = [
      'Kick 808', 'Snare 808', 'Closed Hat', 'Open Hat',
      'Analog Clap', 'Low Tom', 'Mid Tom', 'High Tom',
      'Crash Cymbal', 'Rimshot', 'Punch Kick', 'Lo-Fi Snare',
      'Synth Bass', 'Synth Lead', 'Maj7 Chord', 'Vinyl Scratch'
    ];

    const allPads: SamplePad[] = [];
    bankLetters.forEach((bank) => {
      for (let i = 0; i < 16; i++) {
        allPads.push({
          id: `pad_${bank}_${i}`,
          name: `${padNames[i]} (${bank})`,
          sampleUrl: sampleIds[i],
          pitch: 0,
          volume: 0.85,
          pan: 0,
          startOffset: 0,
          endOffset: 1,
          loop: false,
          color: bank === 'A' ? '#6366f1' : bank === 'B' ? '#f97316' : '#10b981',
          bank,
          rootNote: 36 + i,
        });
      }
    });
    return allPads;
  });

  // Initialize 8 Studio Track Mixer Channels
  const [channels, setChannels] = useState<TrackChannel[]>([
    { id: 'ch_1', name: 'MPC Bank A', color: '#6366f1', volume: 0.85, pan: 0, mute: false, solo: false, eqLow: 0, eqMid: 0, eqHigh: 0, sendReverb: 0.2, sendDelay: 0.1, assignedPadIds: [], instrumentType: 'sampler' },
    { id: 'ch_2', name: 'SP-404 Sampler', color: '#f97316', volume: 0.9, pan: 0, mute: false, solo: false, eqLow: 2, eqMid: -1, eqHigh: 1, sendReverb: 0.3, sendDelay: 0.2, assignedPadIds: [], instrumentType: 'sampler' },
    { id: 'ch_3', name: 'MIDI Synth Lead', color: '#a855f7', volume: 0.8, pan: -0.2, mute: false, solo: false, eqLow: 0, eqMid: 2, eqHigh: 2, sendReverb: 0.4, sendDelay: 0.3, assignedPadIds: [], instrumentType: 'synth' },
    { id: 'ch_4', name: 'E-Drum Kit', color: '#eab308', volume: 0.9, pan: 0, mute: false, solo: false, eqLow: 3, eqMid: 0, eqHigh: 1, sendReverb: 0.1, sendDelay: 0, assignedPadIds: [], instrumentType: 'e_drum' },
    { id: 'ch_5', name: 'DJ Deck A', color: '#3b82f6', volume: 0.85, pan: -0.5, mute: false, solo: false, eqLow: 0, eqMid: 0, eqHigh: 0, sendReverb: 0, sendDelay: 0, assignedPadIds: [], instrumentType: 'dj_deck' },
    { id: 'ch_6', name: 'DJ Deck B', color: '#ec4899', volume: 0.85, pan: 0.5, mute: false, solo: false, eqLow: 0, eqMid: 0, eqHigh: 0, sendReverb: 0, sendDelay: 0, assignedPadIds: [], instrumentType: 'dj_deck' },
    { id: 'ch_7', name: 'Vocal / Input 1', color: '#10b981', volume: 0.8, pan: 0, mute: false, solo: false, eqLow: -1, eqMid: 1, eqHigh: 2, sendReverb: 0.5, sendDelay: 0.2, assignedPadIds: [], instrumentType: 'sampler' },
    { id: 'ch_8', name: 'Master FX Bus', color: '#64748b', volume: 0.95, pan: 0, mute: false, solo: false, eqLow: 0, eqMid: 0, eqHigh: 0, sendReverb: 0, sendDelay: 0, assignedPadIds: [], instrumentType: 'sampler' },
  ]);

  // Init Web MIDI and scan devices
  useEffect(() => {
    midiManager.initMIDI().then(() => {
      setConnectedDevices(midiManager.getConnectedDevices());
    });

    const unsubscribe = midiManager.subscribe((device, type, channel, number, value) => {
      setConnectedDevices(midiManager.getConnectedDevices());
    });

    return () => unsubscribe();
  }, []);

  // Metronome click loop when playing
  useEffect(() => {
    if (!masterState.isPlaying || !masterState.metronome) return;
    const intervalMs = 60000 / masterState.bpm;
    let step = 0;
    const timer = setInterval(() => {
      audioEngine.triggerMetronome(step % 4 === 0);
      step++;
    }, intervalMs);
    return () => clearInterval(timer);
  }, [masterState.isPlaying, masterState.metronome, masterState.bpm]);

  // Handle Play/Stop
  const handleTogglePlayStop = useCallback(() => {
    audioEngine.initAudio();
    setMasterState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  // Handle Record
  const handleToggleRecord = useCallback(() => {
    audioEngine.initAudio();
    setMasterState((prev) => ({ ...prev, isRecording: !prev.isRecording }));
  }, []);

  // Tap Tempo calculation
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const handleTapTempo = useCallback(() => {
    const now = Date.now();
    setTapTimes((prev) => {
      const recent = [...prev.filter((t) => now - t < 3000), now];
      if (recent.length >= 2) {
        const intervals = [];
        for (let i = 1; i < recent.length; i++) {
          intervals.push(recent[i] - recent[i - 1]);
        }
        const avgMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const calculatedBpm = Math.round(60000 / avgMs);
        if (calculatedBpm >= 40 && calculatedBpm <= 240) {
          setMasterState((st) => ({ ...st, bpm: calculatedBpm }));
        }
      }
      return recent;
    });
  }, []);

  // Simulate MIDI event manually
  const handleSimulateMIDI = useCallback(
    (type: 'note_on' | 'note_off' | 'cc', channel: number, number: number, value: number) => {
      const firstDev = connectedDevices[0]?.id || 'virt_mpc_01';
      midiManager.simulateInput(firstDev, type, channel, number, value);
    },
    [connectedDevices]
  );

  // Apply AI Generated Groove
  const handleApplyAIGroove = (style: string, newBpm: number) => {
    setMasterState((prev) => ({ ...prev, bpm: newBpm }));
  };

  const getRackTitle = (ws: WorkspaceType) => {
    switch (ws) {
      case 'mpc': return 'KONG / MPC SAMPLER STUDIO';
      case 'sp404': return 'SP-404 MKII MULTI-EFFECTS SAMPLER';
      case 'keyboard': return 'SUBTRACTOR ANALOG SYNTHESIZER';
      case 'drum_machines': return 'REDRUM & MATRIX PATTERN SEQUENCER';
      case 'edrum': return 'E-DRUM MESH TRIGGER MODULE';
      case 'dj': return 'DJ PERFORMANCE DECKS CONSOLE';
      case 'mixer': return 'SSL 9000 MASTER STUDIO MIXER';
      case 'patchbay': return 'AUDIO & CV HARDWARE PATCH BAY';
      case 'mapper': return 'UNIVERSAL MIDI HARDWARE MAPPER';
      case 'visual_editor': return 'DIY VISUAL CONTROLLER BUILDER';
      case 'midi_matrix': return 'REALTIME MIDI SIGNAL PROCESSOR';
      case 'circle_fifths': return 'CIRCLE OF FIFTHS HARMONY WHEEL & CHORD GENERATOR';
      case 'melodyne_pitch': return 'MELODYNE & FL PITCHER VOCAL TUNER';
      case 'd_groove': return 'D-GROOVE & REGROOVE SHUFFLE POOL';
      case 'piano_roll': return 'PIANO ROLL & PATTERN SEQUENCER';
      case 'wave_sequencer': return 'CUBASE & LOGIC MULTI-TRACK WAVEFORM SEQUENCER';
      case 'fl_channel_rack': return 'FL STUDIO PATTERN STEP CHANNEL RACK';
      case 'chop_lab': return 'CHOP LAB STEM SAMPLING UNIT';
      case 'health_latency': return 'SYSTEM LATENCY & DIAGNOSTICS';
      default: return 'VIRTUAL STUDIO RACK MODULE';
    }
  };

  const getTapeLabel = (ws: WorkspaceType) => {
    switch (ws) {
      case 'mpc': return 'KONG DRUM PAD 1';
      case 'sp404': return 'SP-404 MFX';
      case 'keyboard': return 'SUBTRACTOR 1';
      case 'drum_machines': return 'REDRUM 1';
      case 'edrum': return 'E-KIT 1';
      case 'dj': return 'DJ CONSOLE';
      case 'mixer': return 'SSL MIXER 1';
      case 'patchbay': return 'PATCH BAY 1';
      case 'mapper': return 'MIDI MAPPER';
      case 'visual_editor': return 'DIY BUILDER';
      case 'midi_matrix': return 'MIDI MATRIX';
      case 'circle_fifths': return 'CIRCLE 5THS';
      case 'melodyne_pitch': return 'MELODYNE 1';
      case 'd_groove': return 'D-GROOVE 1';
      case 'piano_roll': return 'PIANO ROLL 1';
      case 'wave_sequencer': return 'CUBASE AUDIO';
      case 'fl_channel_rack': return 'FL RACK 1';
      case 'chop_lab': return 'CHOP LAB 1';
      case 'health_latency': return 'HEALTH DIAG';
      default: return 'RACK UNIT';
    }
  };

  return (
    <div className="h-screen w-screen bg-stone-950 text-neutral-100 flex flex-col font-mono selection:bg-amber-500 selection:text-neutral-950 antialiased overflow-hidden select-none relative">
      {/* Auto-Hiding Top Navigation & Menu Container */}
      <div
        className={`transition-all duration-300 z-50 ${
          autoHideBars
            ? 'h-2 hover:h-auto overflow-hidden opacity-30 hover:opacity-100 bg-amber-500/30'
            : ''
        }`}
      >
        {/* Top DAW Desktop Unified Menu Bar (Studio DAW Suite) */}
        <DAWMenuBar
          activeWorkspace={masterState.activeWorkspace}
          setActiveWorkspace={(ws) => {
            setMasterState((prev) => ({ ...prev, activeWorkspace: ws }));
            handleAddModuleToRack(ws);
          }}
          isFlipped={isFlipped}
          onToggleFlip={() => setIsFlipped((prev) => !prev)}
          openAIGrooveModal={() => setIsAIGrooveOpen(true)}
          openTemplatesModal={() => setIsTemplatesOpen(true)}
          openProjectManagerModal={() => setIsProjectManagerOpen(true)}
          openVirtualKeyboard={() => setIsVirtualKeyboardOpen(true)}
          openSettingsModal={() => setIsSettingsOpen(true)}
          openProfileModal={() => setIsProfileOpen(true)}
          openShortcutsModal={() => setIsShortcutsOpen(true)}
          openStoreModal={() => setIsStoreOpen(true)}
          openUniversalModal={() => setIsUniversalModalOpen(true)}
          openLanguageModal={() => setIsLanguageModalOpen(true)}
          bpm={masterState.bpm}
          detachedWorkspaces={detachedWorkspaces}
          onDetachWorkspace={handleDetachWorkspace}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          autoSaveEnabled={autoSaveEnabled}
          lastAutoSaveTime={lastAutoSaveTime}
          onTriggerManualSave={handleTriggerManualSave}
          onFoldAllModules={() => setRackModules((prev) => prev.map((m) => ({ ...m, isFolded: true })))}
          onUnfoldAllModules={() => setRackModules((prev) => prev.map((m) => ({ ...m, isFolded: false })))}
          onResetProject={handleResetProject}
        />

        {/* Top Header / Studio Hardware Bar */}
        <Navigation
          masterState={masterState}
          setMasterState={setMasterState}
          connectedDevices={connectedDevices}
          onTriggerPlayStop={handleTogglePlayStop}
          onTriggerRecord={handleToggleRecord}
          onTapTempo={handleTapTempo}
          openAIGrooveModal={() => setIsAIGrooveOpen(true)}
        />
      </div>

      {/* Direct To Disk Recorder Modal / Floating Bar */}
      {isRecorderOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <DirectToDiskRecorder
              bpm={masterState.bpm}
              onClose={() => setIsRecorderOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Starter Song Interactive Walkthrough Banner */}
      {isWalkthroughActive && (
        <GuidedWalkthroughBanner
          onDismiss={() => setIsWalkthroughActive(false)}
          openLanguageModal={() => setIsLanguageModalOpen(true)}
          onJumpToModule={(ws) => {
            setMasterState((prev) => ({ ...prev, activeWorkspace: ws as WorkspaceType }));
            handleAddModuleToRack(ws as ModuleType);
          }}
        />
      )}

      {/* Main Full-Screen DAW Workspace (Browser Left + Mahogany Wood Hardware Rack Center) */}
      <div className="flex-1 flex min-h-0 min-w-0 overflow-hidden bg-stone-950 relative">
        {/* Left Studio DAW Browser Sidebar */}
        <DAWBrowserSidebar
          activeWorkspace={masterState.activeWorkspace}
          setActiveWorkspace={(ws) => {
            setMasterState((prev) => ({ ...prev, activeWorkspace: ws }));
            handleAddModuleToRack(ws);
          }}
          isOpen={isBrowserOpen}
          onToggle={() => setIsBrowserOpen((prev) => !prev)}
          onAddModuleToRack={handleAddModuleToRack}
          rackModules={rackModules}
          currentBpm={masterState.bpm}
          onLoadPreset={handleLoadPreset}
        />

        {/* Center Studio Workstation Container */}
        <div className="flex-1 flex flex-col h-full min-h-0 min-w-0 overflow-hidden bg-stone-900 border-x-[14px] border-[#381e0e] shadow-[inset_0_0_50px_rgba(0,0,0,0.9)]">
          {/* 1U Studio Hardware Audio & MIDI Interface (Top Rack Unit) */}
          <div className="p-2 bg-stone-950 border-b-2 border-stone-800 flex items-center justify-between shrink-0">
            <HardwareInterfaceUnit
              connectedDevices={connectedDevices}
              bpm={masterState.bpm}
              isFlipped={isFlipped}
              onToggleFlip={() => setIsFlipped((prev) => !prev)}
            />

            <div className="flex items-center gap-2 pr-2">
              <button
                onClick={() => setIsUnitDetachModalOpen(true)}
                className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono font-black text-xs flex items-center gap-1.5 shadow-md transition"
                title="Open Detachable Units Manager"
              >
                <span>DETACH UNITS</span>
              </button>

              <button
                onClick={() => setIsRecorderOpen(!isRecorderOpen)}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono font-black text-xs flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition"
                title="Open Direct-To-Disk Stereo Master Recorder"
              >
                <Disc className="w-3.5 h-3.5 animate-pulse" />
                <span>DIRECT-TO-DISK RECORDER</span>
              </button>

              {lastAutoSaveTime && (
                <div className="hidden lg:flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-neutral-950 px-2 py-1 rounded-lg border border-neutral-800">
                  <Check className="w-3 h-3" />
                  <span>AUTO-SAVED {lastAutoSaveTime}</span>
                </div>
              )}
            </div>
          </div>

          {/* Preset & Demo Track Selector Bar */}
          <div className="shrink-0">
            <RackPresetAndDemoBar onLoadRackPreset={handleLoadRackPreset} />
          </div>

          {/* Studio Rack Device Browser Palette */}
          <div className="shrink-0">
            <StudioRackNav
              activeWorkspace={masterState.activeWorkspace}
              setActiveWorkspace={(ws) => {
                setMasterState((prev) => ({ ...prev, activeWorkspace: ws }));
                handleAddModuleToRack(ws);
              }}
            />
          </div>

          {/* PINNED TOP: SSL 9000 MASTER MIXING CONSOLE */}
          <div className="p-2 bg-stone-950/80 border-b border-stone-800 shrink-0">
            <ReasonSSLConsole
              channels={channels}
              setChannels={setChannels}
              isDetached={detachedWorkspaces.includes('mixer')}
              onDetach={() => handleDetachWorkspace('mixer')}
              onDock={() => handleDockWorkspace('mixer')}
            />
          </div>

          {/* SCROLLABLE MIDDLE: MAIN REASON RACK STACK */}
          <main className="p-3 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-stone-700">
            {isFlipped ? (
              /* REAR PANEL VIEW WITH CABLES */
              <StudioRearPanel
                masterState={masterState}
                rackModules={rackModules}
                onToggleFlip={() => setIsFlipped(false)}
              />
            ) : (
              /* INFINITE REASON-STYLE STACKED RACK MODULES */
              <RackStackManager
                rackModules={rackModules}
                setRackModules={setRackModules}
                masterState={masterState}
                setMasterState={setMasterState}
                pads={pads}
                setPads={setPads}
                channels={channels}
                setChannels={setChannels}
                connectedDevices={connectedDevices}
                handleSimulateMIDI={handleSimulateMIDI}
                onDetachWorkspace={handleDetachWorkspace}
                onToggleFlip={() => setIsFlipped((prev) => !prev)}
                onUndo={handleUndo}
                onRedo={handleRedo}
                canUndo={canUndo}
                canRedo={canRedo}
              />
            )}
          </main>

          {/* PINNED BOTTOM: AUDIO DAW SEQUENCER, REGROOVE & KEYBOARD PANEL */}
          <div className="shrink-0 border-t border-stone-800">
            <BottomDAWAndReGroovePanel
              isDAWDetached={detachedWorkspaces.includes('wave_sequencer')}
              isReGrooveDetached={detachedWorkspaces.includes('d_groove')}
              isKeyboardDetached={detachedWorkspaces.includes('keyboard')}
              onDetachDAW={() => handleDetachWorkspace('wave_sequencer')}
              onDockDAW={() => handleDockWorkspace('wave_sequencer')}
              onDetachReGroove={() => handleDetachWorkspace('d_groove')}
              onDockReGroove={() => handleDockWorkspace('d_groove')}
              onDetachKeyboard={() => handleDetachWorkspace('keyboard')}
              onDockKeyboard={() => handleDockWorkspace('keyboard')}
              onSimulateMIDI={handleSimulateMIDI}
            />
          </div>
        </div>

        {/* Right Studio Dock & Widgets Sidebar */}
        <DAWRightSidebar
          isOpen={isRightSidebarOpen}
          onToggle={() => setIsRightSidebarOpen((prev) => !prev)}
          channels={channels}
          setChannels={setChannels}
          isQuickPaletteDocked={isQuickPaletteDocked}
          setIsQuickPaletteDocked={setIsQuickPaletteDocked}
          quickPaletteComponent={
            <FloatingQuickPalette
              onAddModule={handleAddModuleToRack}
              onToggleFlip={() => setIsFlipped((prev) => !prev)}
              isFlipped={isFlipped}
              openAIGrooveModal={() => setIsAIGrooveOpen(true)}
              openTemplatesModal={() => setIsTemplatesOpen(true)}
              onDetachWorkspace={() => handleDetachWorkspace(masterState.activeWorkspace)}
              autoHideBars={autoHideBars}
              setAutoHideBars={setAutoHideBars}
              activeWorkspace={masterState.activeWorkspace}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={canUndo}
              canRedo={canRedo}
            />
          }
          onAddModuleToRack={handleAddModuleToRack}
          onDetachWorkspace={handleDetachWorkspace}
          detachedWorkspaces={detachedWorkspaces}
          bpm={masterState.bpm}
        />
      </div>

      {/* Fixed Bottom Studio Transport Console */}
      <div
        className={`transition-all duration-300 z-40 ${
          autoHideBars
            ? 'h-2 hover:h-auto overflow-hidden opacity-30 hover:opacity-100 bg-amber-500/30'
            : ''
        }`}
      >
        <StudioTransport
          masterState={masterState}
          setMasterState={setMasterState}
          connectedDevices={connectedDevices}
          onTriggerPlayStop={handleTogglePlayStop}
          onTriggerRecord={handleToggleRecord}
          onTapTempo={handleTapTempo}
          isFlipped={isFlipped}
          onToggleFlip={() => setIsFlipped((prev) => !prev)}
          openAIGrooveModal={() => setIsAIGrooveOpen(true)}
          onOpenKeyboard={() => setIsVirtualKeyboardOpen(true)}
        />
      </div>

      {/* Floating Quick Options Tool Palette (when undocked) */}
      {!isQuickPaletteDocked && (
        <FloatingQuickPalette
          onAddModule={handleAddModuleToRack}
          onToggleFlip={() => setIsFlipped((prev) => !prev)}
          isFlipped={isFlipped}
          openAIGrooveModal={() => setIsAIGrooveOpen(true)}
          openTemplatesModal={() => setIsTemplatesOpen(true)}
          onDetachWorkspace={() => handleDetachWorkspace(masterState.activeWorkspace)}
          autoHideBars={autoHideBars}
          setAutoHideBars={setAutoHideBars}
          activeWorkspace={masterState.activeWorkspace}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
        />
      )}

      {/* Starter Songs & Custom Templates Modal */}
      <TemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onLoadTemplate={handleLoadTemplate}
        currentRackModules={rackModules}
        bpm={masterState.bpm}
      />

      {/* Gemini AI Groove Generator Assistant Modal */}
      <GenerativeGrooveModal
        isOpen={isAIGrooveOpen}
        onClose={() => setIsAIGrooveOpen(false)}
        onApplyGroove={handleApplyAIGroove}
      />

      {/* Detachable Windows & Units Manager Modal */}
      <UnitDetachSelectorModal
        isOpen={isUnitDetachModalOpen}
        onClose={() => setIsUnitDetachModalOpen(false)}
        detachedWorkspaces={detachedWorkspaces}
        onDetachWorkspace={handleDetachWorkspace}
        onDockWorkspace={handleDockWorkspace}
      />

      {/* Detachable Multi-Window Floating System */}
      <FloatingWindowManager
        detachedWorkspaces={detachedWorkspaces}
        onDockWorkspace={handleDockWorkspace}
        masterState={masterState}
        setMasterState={setMasterState}
        connectedDevices={connectedDevices}
        openAIGrooveModal={() => setIsAIGrooveOpen(true)}
        channels={channels}
        setChannels={setChannels}
      />

      {/* Onscreen Touch & QWERTY Virtual Piano Keyboard Modal */}
      <VirtualPianoKeyboardModal
        isOpen={isVirtualKeyboardOpen}
        onClose={() => setIsVirtualKeyboardOpen(false)}
        targetInstrumentName="Subtractor Polyphonic Synth"
      />

      {/* Project Manager Modal (New, Open, Save) */}
      <ProjectManagerModal
        isOpen={isProjectManagerOpen}
        onClose={() => setIsProjectManagerOpen(false)}
        onNewProject={(templateId) => {
          if (templateId === 'blank') {
            setRackModules([]);
          } else {
            handleResetProject();
          }
        }}
        onSaveCurrentProject={handleTriggerManualSave}
        onLoadProject={(id) => {
          handleTriggerManualSave();
        }}
      />

      {/* User Producer Profile & License Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        rackModuleCount={rackModules.length}
        bpm={masterState.bpm}
      />

      {/* Preferences & Audio Engine Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        autoSaveEnabled={autoSaveEnabled}
        setAutoSaveEnabled={setAutoSaveEnabled}
        autoSaveInterval={autoSaveInterval}
        setAutoSaveInterval={setAutoSaveInterval}
        onTriggerManualSave={handleTriggerManualSave}
      />

      {/* Keyboard Shortcuts Reference Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Universal Multi-Input & Cross-Platform Modal */}
      <UniversalPlatformModal
        isOpen={isUniversalModalOpen}
        onClose={() => setIsUniversalModalOpen(false)}
        activeProfile={deviceProfile}
        onSelectProfile={setDeviceProfile}
      />

      {/* Universal Studio Language & AI Translator Modal */}
      <LanguageTranslatorModal
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
      />

      {/* Reason Plugin Store & Extension Marketplace Modal */}
      <PluginStoreModal
        isOpen={isStoreOpen}
        onClose={() => setIsStoreOpen(false)}
        userTier={userTier}
        setUserTier={setUserTier}
        onInstallModule={(type) => handleAddModuleToRack(type as ModuleType)}
      />
    </div>
  );
}
