import React, { useState, useEffect, useCallback } from 'react';
import {
  WorkspaceType,
  MasterState,
  ConnectedDevice,
  SamplePad,
  TrackChannel,
} from './types';
import { audioEngine } from './audio/engine';
import { midiManager } from './midi/manager';
import { Navigation } from './components/Navigation';
import { HardwareInterfaceUnit } from './components/rack/HardwareInterfaceUnit';
import { StudioTransport } from './components/rack/StudioTransport';
import { StudioRearPanel } from './components/rack/StudioRearPanel';
import { StudioRackDevice } from './components/rack/StudioRackDevice';
import { StudioRackNav } from './components/rack/StudioRackNav';

import { CanvasDrumGridWorkspace } from './components/workspaces/CanvasDrumGridWorkspace';
import { GrainDeckWorkspace } from './components/workspaces/GrainDeckWorkspace';
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
import { VocalContourEditor } from './components/daw/VocalContourEditor';
import { HumanPulseGroovePool } from './components/daw/HumanPulseGroovePool';
import { PianoRollSequencer } from './components/daw/PianoRollSequencer';
import { DAWMenuBar } from './components/daw/DAWMenuBar';
import { DAWBrowserSidebar } from './components/daw/DAWBrowserSidebar';
import { HorizonWaveformSequencer } from './components/daw/HorizonWaveformSequencer';
import { BeatLoomChannelRack } from './components/daw/BeatLoomChannelRack';
import { FloatingWindowManager } from './components/daw/FloatingWindowManager';

import { RackModuleItem, StudioTemplate, ModuleType } from './types';
import { RackStackManager } from './components/rack/RackStackManager';
import { FloatingQuickPalette } from './components/daw/FloatingQuickPalette';
import { TemplatesModal } from './components/daw/TemplatesModal';
import { GuidedWalkthroughBanner } from './components/daw/GuidedWalkthroughBanner';
import {BrowserStudioSettingsRepository, type StudioPreferences} from './poietek/settings';

const StudioSetupModal = React.lazy(() =>
  import('./poietek/react/StudioSetupModal').then((module) => ({default: module.StudioSetupModal})),
);

export default function App() {
  // Master Global App State
  const [masterState, setMasterState] = useState<MasterState>({
    bpm: 94,
    isPlaying: false,
    isRecording: false,
    currentStep: 0,
    metronome: false,
    masterVolume: 0.85,
    reverbLevel: 0.25,
    delayLevel: 0.15,
    activeWorkspace: 'mpc',
    learningModeActive: false,
  });

  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>([]);
  const [isAIGrooveOpen, setIsAIGrooveOpen] = useState<boolean>(false);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isBrowserOpen, setIsBrowserOpen] = useState<boolean>(true);
  const [detachedWorkspaces, setDetachedWorkspaces] = useState<WorkspaceType[]>([]);

  const [isTemplatesOpen, setIsTemplatesOpen] = useState<boolean>(false);
  const [isStudioSetupOpen, setIsStudioSetupOpen] = useState<boolean>(false);
  const [isWalkthroughActive, setIsWalkthroughActive] = useState<boolean>(true);
  const [autoHideBars, setAutoHideBars] = useState<boolean>(false);

  // Infinite Rack Modules State with Undo/Redo History Stack
  const [rackHistory, setRackHistory] = useState<RackModuleItem[][]>([
    [
      { id: 'start_mpc', type: 'mpc', title: 'Canvas Drum Grid', tapeLabel: 'FOUNDRY KIT' },
      { id: 'start_synth', type: 'keyboard', title: 'Analog Subtractive Synth', tapeLabel: 'LEAD SYNTH' },
      {
        id: 'start_bus',
        type: 'folder_combinator',
        title: 'Drums & FX Bus Folder',
        tapeLabel: 'COMBINATOR BUS',
        subModuleIds: ['start_sp404'],
      },
      { id: 'start_sp404', type: 'sp404', title: 'Grain Deck Sampler', tapeLabel: 'TEXTURE FX', groupId: 'start_bus' },
      { id: 'start_pitch', type: 'melodyne_pitch', title: 'Vocal Contour Editor', tapeLabel: 'PITCH MAP' },
      { id: 'start_mixer', type: 'mixer', title: 'Summit Master Console', tapeLabel: 'MASTER CONSOLE' },
    ],
  ]);
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
    { id: 'ch_1', name: 'Canvas Grid Bank A', color: '#6366f1', volume: 0.85, pan: 0, mute: false, solo: false, eqLow: 0, eqMid: 0, eqHigh: 0, sendReverb: 0.2, sendDelay: 0.1, assignedPadIds: [], instrumentType: 'sampler' },
    { id: 'ch_2', name: 'Grain Deck Sampler', color: '#f97316', volume: 0.9, pan: 0, mute: false, solo: false, eqLow: 2, eqMid: -1, eqHigh: 1, sendReverb: 0.3, sendDelay: 0.2, assignedPadIds: [], instrumentType: 'sampler' },
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

  const handleApplyStudioPreferences = useCallback((preferences: StudioPreferences) => {
    setAutoHideBars(preferences.appearance.autoHideTransportBars);
    document.documentElement.dataset.poietekTheme = preferences.appearance.theme;
    document.documentElement.dataset.poietekDensity = preferences.appearance.density;
    document.documentElement.dataset.poietekReduceMotion = String(preferences.appearance.reduceMotion);
    document.documentElement.style.setProperty('--poietek-ui-scale', String(preferences.appearance.interfaceScalePercent / 100));
  }, []);

  useEffect(() => {
    handleApplyStudioPreferences(new BrowserStudioSettingsRepository().load().preferences);
  }, [handleApplyStudioPreferences]);

  const getRackTitle = (ws: WorkspaceType) => {
    switch (ws) {
      case 'mpc': return 'CANVAS DRUM GRID SAMPLER';
      case 'sp404': return 'GRAIN DECK MULTI-EFFECTS SAMPLER';
      case 'keyboard': return 'PRISM POLY SYNTHESIZER';
      case 'drum_machines': return 'PULSE DRUM LINE & PATTERN SEQUENCER';
      case 'edrum': return 'E-DRUM MESH TRIGGER MODULE';
      case 'dj': return 'DJ PERFORMANCE DECKS CONSOLE';
      case 'mixer': return 'SUMMIT MASTER STUDIO CONSOLE';
      case 'patchbay': return 'AUDIO & CV HARDWARE PATCH BAY';
      case 'mapper': return 'UNIVERSAL MIDI HARDWARE MAPPER';
      case 'visual_editor': return 'DIY VISUAL CONTROLLER BUILDER';
      case 'midi_matrix': return 'REALTIME MIDI SIGNAL PROCESSOR';
      case 'circle_fifths': return 'CIRCLE OF FIFTHS HARMONY WHEEL & CHORD GENERATOR';
      case 'melodyne_pitch': return 'VOCAL CONTOUR PITCH EDITOR';
      case 'd_groove': return 'HUMAN PULSE GROOVE POOL';
      case 'piano_roll': return 'PIANO ROLL & PATTERN SEQUENCER';
      case 'wave_sequencer': return 'HORIZON MULTI-TRACK WAVEFORM SEQUENCER';
      case 'fl_channel_rack': return 'BEAT LOOM PATTERN STEP RACK';
      case 'chop_lab': return 'CHOP LAB STEM SAMPLING UNIT';
      case 'health_latency': return 'SYSTEM LATENCY & DIAGNOSTICS';
      default: return 'VIRTUAL STUDIO RACK MODULE';
    }
  };

  const getTapeLabel = (ws: WorkspaceType) => {
    switch (ws) {
      case 'mpc': return 'CANVAS GRID 1';
      case 'sp404': return 'GRAIN DECK 1';
      case 'keyboard': return 'PRISM POLY 1';
      case 'drum_machines': return 'PULSE LINE 1';
      case 'edrum': return 'E-KIT 1';
      case 'dj': return 'DJ CONSOLE';
      case 'mixer': return 'SUMMIT MIXER 1';
      case 'patchbay': return 'PATCH BAY 1';
      case 'mapper': return 'MIDI MAPPER';
      case 'visual_editor': return 'DIY BUILDER';
      case 'midi_matrix': return 'MIDI MATRIX';
      case 'circle_fifths': return 'CIRCLE 5THS';
      case 'melodyne_pitch': return 'VOCAL CONTOUR 1';
      case 'd_groove': return 'HUMAN PULSE 1';
      case 'piano_roll': return 'PIANO ROLL 1';
      case 'wave_sequencer': return 'HORIZON AUDIO';
      case 'fl_channel_rack': return 'BEAT LOOM 1';
      case 'chop_lab': return 'CHOP LAB 1';
      case 'health_latency': return 'HEALTH DIAG';
      default: return 'RACK UNIT';
    }
  };

  return (
    <div className="h-screen w-screen bg-stone-950 text-neutral-100 flex flex-col font-mono selection:bg-amber-500 selection:text-neutral-950 antialiased overflow-hidden select-none relative">
      {/* Auto-Hiding Top Navigation & Menu Container */}
      <div
        className={`transition-all duration-300 z-[200] ${
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
          openStudioSetup={() => setIsStudioSetupOpen(true)}
          bpm={masterState.bpm}
          detachedWorkspaces={detachedWorkspaces}
          onDetachWorkspace={handleDetachWorkspace}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
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

      {/* Starter Song Interactive Walkthrough Banner */}
      {isWalkthroughActive && (
        <GuidedWalkthroughBanner
          onDismiss={() => setIsWalkthroughActive(false)}
          onJumpToModule={(ws) => {
            setMasterState((prev) => ({ ...prev, activeWorkspace: ws as WorkspaceType }));
            handleAddModuleToRack(ws as ModuleType);
          }}
        />
      )}

      {/* Main Full-Screen DAW Workspace (Browser Left + Mahogany Wood Hardware Rack Center) */}
      <div className="flex-1 flex overflow-hidden bg-stone-950 relative">
        {/* Left Studio DAW Browser Sidebar */}
        <DAWBrowserSidebar
          activeWorkspace={masterState.activeWorkspace}
          setActiveWorkspace={(ws) => {
            setMasterState((prev) => ({ ...prev, activeWorkspace: ws }));
            handleAddModuleToRack(ws);
          }}
          isOpen={isBrowserOpen}
          onToggle={() => setIsBrowserOpen((prev) => !prev)}
        />

        {/* Center Studio Workstation Container */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-stone-900 border-x-[14px] border-[#381e0e] shadow-[inset_0_0_50px_rgba(0,0,0,0.9)] scrollbar-thin scrollbar-thumb-stone-700">
          {/* 1U Studio Hardware Audio & MIDI Interface (Top Rack Unit) */}
          <div className="p-2 bg-stone-950 border-b-2 border-stone-800">
            <HardwareInterfaceUnit
              connectedDevices={connectedDevices}
              bpm={masterState.bpm}
              isFlipped={isFlipped}
              onToggleFlip={() => setIsFlipped((prev) => !prev)}
            />
          </div>

          {/* Studio Rack Device Browser Palette */}
          <StudioRackNav
            activeWorkspace={masterState.activeWorkspace}
            setActiveWorkspace={(ws) => {
              setMasterState((prev) => ({ ...prev, activeWorkspace: ws }));
              handleAddModuleToRack(ws);
            }}
          />

          {/* Main Virtual Studio Infinite Stacked Rack Display */}
          <main className="p-4 flex-1">
            {isFlipped ? (
              /* REAR PANEL VIEW WITH CABLES */
              <StudioRearPanel
                masterState={masterState}
                onToggleFlip={() => setIsFlipped(false)}
              />
            ) : (
              /* Infinite hardware-inspired stacked rack modules */
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
        </div>
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
        />
      </div>

      {/* Floating Quick Options Tool Palette */}
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

      {/* Starter Songs & Custom Templates Modal */}
      <TemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onLoadTemplate={handleLoadTemplate}
        currentRackModules={rackModules}
        bpm={masterState.bpm}
      />

      {isStudioSetupOpen && (
        <React.Suspense fallback={<div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 text-amber-300">Opening Studio Setup…</div>}>
          <StudioSetupModal
            isOpen
            onClose={() => setIsStudioSetupOpen(false)}
            onApplied={handleApplyStudioPreferences}
          />
        </React.Suspense>
      )}

      {/* Previewable local groove-assistant concept */}
      <GenerativeGrooveModal
        isOpen={isAIGrooveOpen}
        onClose={() => setIsAIGrooveOpen(false)}
        onApplyGroove={handleApplyAIGroove}
      />

      {/* Detachable Multi-Window Floating System */}
      <FloatingWindowManager
        detachedWorkspaces={detachedWorkspaces}
        onDockWorkspace={handleDockWorkspace}
        masterState={masterState}
        setMasterState={setMasterState}
        connectedDevices={connectedDevices}
        openAIGrooveModal={() => setIsAIGrooveOpen(true)}
      />
    </div>
  );
}
