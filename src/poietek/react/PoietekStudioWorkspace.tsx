import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type MouseEvent,
} from "react";
import type { Asset, AudioClip, PoietekProject, Track } from "../domain/types";
import { createBlankProject } from "../domain/projectFactory";
import {
  addAsset,
  addAudioClip,
  addAudioTrack,
  addMidiTrack,
} from "../project/operations";
import {
  duplicateAudioClip,
  duplicateTrack,
  removeAudioClip,
  splitAudioClipAtTick,
  updateAudioClip,
  updateTrackMixer,
} from "../project/editOperations";
import type { ProjectSummary } from "../project/ProjectRepository";
import { secondsToTicks, ticksToSeconds } from "../timeline/tempo";
import {BrowserAudioRecorder, type ActiveBrowserRecording} from '../capture/BrowserAudioRecorder';
import {WavTimelineExportService} from '../export/WavTimelineExportService';
import {WebOfflineTimelineRenderer} from '../export/WebOfflineTimelineRenderer';
import { usePoietekRuntime } from "./PoietekRuntimeProvider";
import { decodeBasicAudioHealth } from "./decodeBasicAudioHealth";
import {
  BASIC_HEALTH_METADATA_KEY,
  WAVEFORM_PREVIEW_METADATA_KEY,
  createStoredWaveformPreview,
  formatClock,
  formatDb,
  projectDurationSeconds,
  readBasicAudioHealth,
  readWaveformPreview,
  storeBasicAudioHealth,
  storeUnavailableBasicAudioHealth,
  type StoredWaveformPreview,
} from "./audioWorkspaceModel";
import "./PoietekStudioWorkspace.css";
import {
  StudioArrangerView,
  type ArrangerSelection,
} from './StudioArrangerView';
import {StudioConsoleView} from './StudioConsoleView';
import {
  markStudioCommandAreaReady,
  subscribeStudioCommands,
  type StudioCommandDetail,
} from './studioCommands';
import {getProjectEditorialWorkflow, toggleProjectEditorialTrackPin} from '../editorial-workflows';

type TransportState = "stopped" | "starting" | "playing" | "paused";
type SaveState = "loading" | "saving" | "saved" | "error";
type SampleInputMode = 'mono' | 'stereo' | 'left' | 'right';

export interface PoietekStudioWorkspaceProps {
  className?: string;
}

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function projectDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? "Unknown date"
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

function trackDisplayName(fileName: string): string {
  const withoutExtension = fileName.replace(/\.[^./\\]+$/, "").trim();
  return withoutExtension || "Audio Track";
}

function WaveformPreview({ preview }: { preview: StoredWaveformPreview | null }) {
  const path = useMemo(() => {
    if (!preview) return "";
    const length = preview.min.length;
    if (!length) return "";

    let result = "";
    for (let index = 0; index < length; index += 1) {
      const x = length === 1 ? 500 : (index / (length - 1)) * 1000;
      const top = 50 - preview.max[index] * 44;
      const bottom = 50 - preview.min[index] * 44;
      result += `M${x.toFixed(2)} ${top.toFixed(2)}L${x.toFixed(2)} ${bottom.toFixed(2)}`;
    }
    return result;
  }, [preview]);

  if (!path) {
    return <span className="poietek-waveform-unavailable">Waveform unavailable</span>;
  }

  return (
    <svg
      className="poietek-waveform"
      viewBox="0 0 1000 100"
      preserveAspectRatio="none"
      role="img"
      aria-label="Waveform preview generated from decoded audio peaks"
    >
      <line className="poietek-waveform-axis" x1="0" x2="1000" y1="50" y2="50" />
      <path className="poietek-waveform-peaks" d={path} />
    </svg>
  );
}

export function PoietekStudioWorkspace({
  className = "",
}: PoietekStudioWorkspaceProps) {
  const {
    runtime,
    project: providerProject,
    status: runtimeStatus,
    error: runtimeError,
  } = usePoietekRuntime();
  const adoptedProviderProject = useRef(false);
  const newProjectInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const projectRackRef = useRef<HTMLElement>(null);
  const activeRecordingRef = useRef<ActiveBrowserRecording | null>(null);
  const recordingStartTickRef = useRef(0);
  const commandHandlerRef = useRef<(detail: StudioCommandDetail) => void>(() => undefined);
  const [project, setProject] = useState<PoietekProject | null>(null);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [newProjectTitle, setNewProjectTitle] = useState("New Session");
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("loading");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transport, setTransport] = useState<TransportState>("stopped");
  const [playheadSeconds, setPlayheadSeconds] = useState(0);
  const [activeDesk, setActiveDesk] =
    useState<'arrange' | 'console' | 'health'>('arrange');

  const [arrangerSelection, setArrangerSelection] =
    useState<ArrangerSelection | null>(null);

  const [focusFadesRequest, setFocusFadesRequest] = useState(0);

  const [isRecording, setIsRecording] = useState(false);
  const [sampleRecorderOpen, setSampleRecorderOpen] = useState(false);
  const [sampleInputDevices, setSampleInputDevices] =
    useState<MediaDeviceInfo[]>([]);
  const [sampleInputDeviceId, setSampleInputDeviceId] = useState('');
  const [sampleInputMode, setSampleInputMode] =
    useState<SampleInputMode>('stereo');
  const [sampleMonitoring, setSampleMonitoring] = useState(false);
  const [lastRecordedTake, setLastRecordedTake] =
    useState<{fileName: string; startTick: number} | null>(null);
  const recorder = useMemo(() => new BrowserAudioRecorder(runtime.importAudio), [runtime]);

  const refreshSampleInputs = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      setError('Audio-input enumeration is unavailable in this browser.');
      return;
    }
    try {
      const devices = (await navigator.mediaDevices.enumerateDevices()).filter((device) => device.kind === 'audioinput');
      setSampleInputDevices(devices);
      if (!sampleInputDeviceId && devices[0]?.deviceId) setSampleInputDeviceId(devices[0].deviceId);
      setNotice(devices.length ? `Found ${devices.length} browser audio input${devices.length === 1 ? '' : 's'}.` : 'No browser audio inputs were reported. Permission may be required before labels appear.');
    } catch (reason) {
      setError(messageFrom(reason));
    }
  }, [sampleInputDeviceId]);

  const refreshProjectList = useCallback(async () => {
    const summaries = await runtime.projects.list();
    setProjects(summaries);
    return summaries;
  }, [runtime]);

  useEffect(() => {
    if (!providerProject || adoptedProviderProject.current) return;
    adoptedProviderProject.current = true;
    setProject(providerProject);
    setSavedAt(providerProject.updatedAt);
    setSaveState("saved");
    void refreshProjectList().catch((reason) => setError(messageFrom(reason)));
  }, [providerProject, refreshProjectList]);

  const projectDuration = useMemo(
    () => (project ? projectDurationSeconds(project) : 0),
    [project],
  );
  const timelineSpan = Math.max(10, Math.ceil(projectDuration));
  const hasClips = Boolean(project?.tracks.some((track) => track.clips.length));
  const canUndo = project ? runtime.getSession().canUndo() : false;
  const canRedo = project ? runtime.getSession().canRedo() : false;

  useEffect(() => {
    if (transport !== "playing") return;
    let frame = 0;

    const update = () => {
      const current = runtime.player.getPlayheadSeconds();
      if (projectDuration > 0 && current >= projectDuration - 0.005) {
        setPlayheadSeconds(projectDuration);
        setTransport("stopped");
        return;
      }
      setPlayheadSeconds(current);
      frame = requestAnimationFrame(update);
    };

    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [projectDuration, runtime, transport]);

  const markSaved = useCallback(
    async (next: PoietekProject, statusMessage: string) => {
      setProject(next);
      setSavedAt(next.updatedAt);
      setSaveState("saved");
      setNotice(statusMessage);
      await refreshProjectList();
    },
    [refreshProjectList],
  );

  const beginAction = (label: string) => {
    setBusyAction(label);
    setError(null);
    setNotice(null);
  };

  const failAction = (reason: unknown) => {
    setSaveState("error");
    setError(messageFrom(reason));
  };

  const pauseForEdit = useCallback(async () => {
    if (transport === "playing" || transport === "starting") {
      await runtime.player.pause();
      setPlayheadSeconds(runtime.player.getPlayheadSeconds());
      setTransport("paused");
    }
  }, [runtime, transport]);

  const openProject = async (id: string) => {
    if (id === project?.id || busyAction) return;
    beginAction("Opening project");
    try {
      await runtime.player.stop();
      setTransport("stopped");
      setPlayheadSeconds(0);
      const opened = await runtime.openProject(id);
      await markSaved(opened, `Reopened “${opened.title}” from local storage.`);
    } catch (reason) {
      failAction(reason);
    } finally {
      setBusyAction(null);
    }
  };

  const createProject = async () => {
    if (busyAction) return;
    const title = newProjectTitle.trim();
    if (!title) {
      setError("Enter a project name before creating it.");
      return;
    }

    beginAction("Creating project");
    setSaveState("saving");
    try {
      await runtime.player.stop();
      setTransport("stopped");
      setPlayheadSeconds(0);
      const created = createBlankProject(title);
      await runtime.projects.save(created);
      const opened = await runtime.openProject(created.id);
      setNewProjectTitle("New Session");
      await markSaved(opened, `Created “${opened.title}” and saved it locally.`);
    } catch (reason) {
      failAction(reason);
    } finally {
      setBusyAction(null);
    }
  };

  const deleteProject = async (summary: ProjectSummary) => {
    if (busyAction) return;
    const confirmed =
      typeof window === "undefined" ||
      window.confirm(
        `Delete the local project record “${summary.title}”? Imported audio blobs are retained for safety.`,
      );
    if (!confirmed) return;

    beginAction("Deleting project");
    setSaveState("saving");
    try {
      const deletingCurrent = project?.id === summary.id;
      if (deletingCurrent) {
        await runtime.player.stop();
        setTransport("stopped");
        setPlayheadSeconds(0);
      }

      await runtime.projects.delete(summary.id);
      const remaining = await runtime.projects.list();

      if (deletingCurrent) {
        let next: PoietekProject;
        if (remaining[0]) {
          next = await runtime.openProject(remaining[0].id);
        } else {
          const replacement = createBlankProject("Untitled Project");
          await runtime.projects.save(replacement);
          next = await runtime.openProject(replacement.id);
        }
        await markSaved(
          next,
          `Deleted “${summary.title}”. Media blobs were retained for safe recovery.`,
        );
      } else {
        setProjects(remaining);
        setSaveState("saved");
        setNotice(
          `Deleted “${summary.title}”. Media blobs were retained for safe recovery.`,
        );
      }
    } catch (reason) {
      failAction(reason);
    } finally {
      setBusyAction(null);
    }
  };

  const importAudio = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file || !project || busyAction) return;

    beginAction("Decoding and importing audio");
    setSaveState("saving");
    let importedAssetId: string | null = null;

    try {
      await pauseForEdit();
      const imported = await runtime.importAudio.import(file);
      importedAssetId = imported.asset.id;
      const waveformPreview = createStoredWaveformPreview(imported.waveform);

      let health;
      try {
        health = storeBasicAudioHealth(await decodeBasicAudioHealth(file));
      } catch (healthError) {
        health = storeUnavailableBasicAudioHealth(messageFrom(healthError));
      }

      const durableAsset: Asset = {
        ...imported.asset,
        metadata: {
          ...imported.asset.metadata,
          ...(waveformPreview
            ? { [WAVEFORM_PREVIEW_METADATA_KEY]: waveformPreview }
            : {}),
          [BASIC_HEALTH_METADATA_KEY]: health,
        },
      };

      const startTick = secondsToTicks(
        playheadSeconds,
        project.tempoMap,
        project.settings.ppq,
      );
      const next = await runtime.getSession().mutate((current) => {
        let changed = addAsset(current, durableAsset);
        changed = addAudioTrack(changed, trackDisplayName(file.name));
        const targetTrack = [...changed.tracks]
          .reverse()
          .find((track) => track.type === "audio");
        if (!targetTrack) throw new Error("Could not create an audio track.");
        return addAudioClip({
          project: changed,
          trackId: targetTrack.id,
          asset: durableAsset,
          startTick,
        });
      });

      importedAssetId = null;
      const healthNote =
        health.availability === "available"
          ? `Basic health: ${health.status}.`
          : "Basic health could not be measured on this platform.";
      await markSaved(
        next,
        `Imported “${file.name}” at ${formatClock(playheadSeconds)}. ${healthNote}`,
      );
    } catch (reason) {
      if (importedAssetId) {
        await runtime.assets.remove(importedAssetId).catch(() => undefined);
      }
      failAction(reason);
    } finally {
      setBusyAction(null);
    }
  };

  const toggleRecording = async () => {
    if (!project || busyAction) return;
    const active = activeRecordingRef.current;
    if (!active) {
      beginAction('Opening audio input');
      try {
        await pauseForEdit();
        if (sampleInputMode === 'left' || sampleInputMode === 'right') {
          throw new Error('USB-L and USB-R isolation requires the native channel-routing adapter. Choose USB stereo or mono in the web app.');
        }
        const audioConstraints: MediaTrackConstraints = {
          channelCount: {ideal: sampleInputMode === 'mono' ? 1 : 2},
          ...(sampleInputDeviceId ? {deviceId: {exact: sampleInputDeviceId}} : {}),
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        };
        const started = await recorder.start({monitorInput: sampleMonitoring, audioConstraints});
        activeRecordingRef.current = started;
        recordingStartTickRef.current = secondsToTicks(
          playheadSeconds,
          project.tempoMap,
          project.settings.ppq,
        );
        setIsRecording(true);
        setNotice(`Recording from the selected browser/system input as ${started.mimeType || 'the browser default format'}.`);
      } catch (reason) {
        setError(messageFrom(reason));
      } finally {
        setBusyAction(null);
      }
      return;
    }

    activeRecordingRef.current = null;
    setIsRecording(false);
    beginAction('Finishing and importing recording');
    setSaveState('saving');
    let importedAssetId: string | null = null;
    try {
      const result = await active.stop();
      importedAssetId = result.importedAudio.asset.id;
      const waveformPreview = createStoredWaveformPreview(result.importedAudio.waveform);
      let health;
      try {
        health = storeBasicAudioHealth(await decodeBasicAudioHealth(result.recordedBlob));
      } catch (healthError) {
        health = storeUnavailableBasicAudioHealth(messageFrom(healthError));
      }
      const durableAsset: Asset = {
        ...result.importedAudio.asset,
        metadata: {
          ...result.importedAudio.asset.metadata,
          ...(waveformPreview ? {[WAVEFORM_PREVIEW_METADATA_KEY]: waveformPreview} : {}),
          [BASIC_HEALTH_METADATA_KEY]: health,
          captureMethod: 'browser_media_recorder',
          monitoringWasEnabled: result.monitoringWasEnabled,
        },
      };
      const next = await runtime.getSession().mutate((current) => {
        let changed = addAsset(current, durableAsset);
        changed = addAudioTrack(changed, trackDisplayName(result.fileName));
        const targetTrack = [...changed.tracks].reverse().find((track) => track.type === 'audio');
        if (!targetTrack) throw new Error('Could not create a track for the recording.');
        return addAudioClip({
          project: changed,
          trackId: targetTrack.id,
          asset: durableAsset,
          startTick: recordingStartTickRef.current,
        });
      });
      importedAssetId = null;
      setLastRecordedTake({fileName: result.fileName, startTick: recordingStartTickRef.current});
      await markSaved(next, `Recorded “${result.fileName}”, created an audio track, and saved the take locally.`);
    } catch (reason) {
      if (importedAssetId) await runtime.assets.remove(importedAssetId).catch(() => undefined);
      failAction(reason);
    } finally {
      setBusyAction(null);
    }
  };

  const analyzeAsset = async (asset: Asset) => {
    if (!project || busyAction) return;
    beginAction("Analyzing audio health");
    setSaveState("saving");
    try {
      await pauseForEdit();
      const blob = await runtime.assets.get(asset.id);
      let health;
      if (!blob) {
        health = storeUnavailableBasicAudioHealth(
          "The local audio blob is missing, so decoded-sample analysis cannot run.",
        );
      } else {
        try {
          health = storeBasicAudioHealth(await decodeBasicAudioHealth(blob));
        } catch (reason) {
          health = storeUnavailableBasicAudioHealth(messageFrom(reason));
        }
      }

      const next = await runtime.getSession().mutate((current) => ({
        ...current,
        assets: current.assets.map((candidate) =>
          candidate.id === asset.id
            ? {
                ...candidate,
                metadata: {
                  ...candidate.metadata,
                  [BASIC_HEALTH_METADATA_KEY]: health,
                },
              }
            : candidate,
        ),
      }));
      await markSaved(
        next,
        health.availability === "available"
          ? `Basic audio-health analysis completed: ${health.status}.`
          : `Audio-health analysis is unavailable: ${health.reason}`,
      );
    } catch (reason) {
      failAction(reason);
    } finally {
      setBusyAction(null);
    }
  };

  const undo = async () => {
    if (!project || busyAction || !runtime.getSession().canUndo()) return;
    beginAction("Undoing change");
    setSaveState("saving");
    try {
      await pauseForEdit();
      await markSaved(await runtime.getSession().undo(), "Change undone and saved locally.");
    } catch (reason) {
      failAction(reason);
    } finally {
      setBusyAction(null);
    }
  };

  const redo = async () => {
    if (!project || busyAction || !runtime.getSession().canRedo()) return;
    beginAction("Redoing change");
    setSaveState("saving");
    try {
      await pauseForEdit();
      await markSaved(await runtime.getSession().redo(), "Change redone and saved locally.");
    } catch (reason) {
      failAction(reason);
    } finally {
      setBusyAction(null);
    }
  };

  const commitProjectEdit = async (
    edit: (current: PoietekProject) => PoietekProject,
    statusMessage: string,
  ) => {
    if (!project || busyAction) return;
    beginAction('Applying edit');
    setSaveState('saving');
    try {
      await pauseForEdit();
      await markSaved(await runtime.getSession().mutate(edit), statusMessage);
    } catch (reason) {
      failAction(reason);
    } finally {
      setBusyAction(null);
    }
  };

  const setTrackMixer = (
    trackId: string,
    patch: Partial<Track['mixer']>,
    statusMessage: string,
  ) => {
    void commitProjectEdit(
      (current) => updateTrackMixer(current, trackId, patch),
      statusMessage,
    );
  };

  const setClip = (
    trackId: string,
    clipId: string,
    patch: Partial<AudioClip>,
    statusMessage: string,
  ) => {
    void commitProjectEdit(
      (current) => updateAudioClip(current, trackId, clipId, patch),
      statusMessage,
    );
  };

  const splitClip = (trackId: string, clipId: string, splitTick: number) => {
    void commitProjectEdit(
      (current) => splitAudioClipAtTick(current, trackId, clipId, splitTick),
      'Clip split at the playhead and saved locally.',
    );
  };

  const removeClip = (trackId: string, clipId: string) => {
    void commitProjectEdit(
      (current) => removeAudioClip(current, trackId, clipId),
      'Clip removed from the arrangement. Its source asset was retained.',
    );
  };

  const toggleTrackPin = (trackId: string) => {
    void commitProjectEdit(
      (current) => {
        const revision = getProjectEditorialWorkflow(current)?.revision ?? 0;
        return toggleProjectEditorialTrackPin(
          current,
          trackId,
          `editorial.arrange.pin.${revision + 1}`,
        );
      },
      'Track focus pin updated and saved locally.',
    );
  };

  const play = async () => {
    if (!project || busyAction) return;
    const anySolo = project.tracks.some((track) => track.mixer.solo);
    const hasPlayableClip = project.tracks.some(
      (track) =>
        !track.mixer.mute &&
        (!anySolo || track.mixer.solo) &&
        track.clips.some((clip) => !clip.muted),
    );
    if (!hasPlayableClip) {
      setError("There are no unmuted audio clips available to play.");
      return;
    }

    setError(null);
    setTransport("starting");
    try {
      const from =
        projectDuration > 0 && playheadSeconds >= projectDuration - 0.005
          ? 0
          : playheadSeconds;
      await runtime.player.play(project, from);
      setPlayheadSeconds(from);
      setTransport("playing");
      setNotice("Playing from the local audio store.");
    } catch (reason) {
      setTransport("paused");
      setError(messageFrom(reason));
    }
  };

  const pause = async () => {
    try {
      await runtime.player.pause();
      setPlayheadSeconds(runtime.player.getPlayheadSeconds());
      setTransport("paused");
      setNotice("Playback paused.");
    } catch (reason) {
      setError(messageFrom(reason));
    }
  };

  const stop = async () => {
    try {
      await runtime.player.stop();
      setPlayheadSeconds(0);
      setTransport("stopped");
      setNotice("Playback stopped.");
    } catch (reason) {
      setError(messageFrom(reason));
    }
  };

  const saveProject = async () => {
    if (!project || busyAction) return;
    beginAction('Saving project');
    setSaveState('saving');
    try {
      await runtime.projects.save(project);
      await refreshProjectList();
      const now = new Date().toISOString();
      setSavedAt(now);
      setSaveState('saved');
      setNotice('Project is saved in the local project store.');
    } catch (reason) {
      failAction(reason);
    } finally {
      setBusyAction(null);
    }
  };

  const exportWav = async () => {
    if (!project || busyAction) return;
    if (!hasClips) {
      setError('Import or record audio before exporting a WAV file.');
      return;
    }
    beginAction('Rendering PCM WAV');
    try {
      await pauseForEdit();
      const service = new WavTimelineExportService(new WebOfflineTimelineRenderer(runtime.assets));
      const capability = service.getCapability();
      if (capability.state === 'unavailable') throw new Error(capability.reason || 'Offline WAV rendering is unavailable.');
      const result = await service.export(project, {
        sampleRate: project.settings.sampleRate,
        channelCount: 2,
        onProgress: (progress) => {
          setBusyAction(progress.phase === 'render' ? 'Rendering audio timeline' : 'Encoding PCM16 WAV');
        },
      });
      const url = URL.createObjectURL(result.blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = result.fileName;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
      setNotice(`Exported “${result.fileName}” as verified PCM16 WAV. ${result.renderLimitations.join(' ')}`);
    } catch (reason) {
      setError(messageFrom(reason));
    } finally {
      setBusyAction(null);
    }
  };

  const seek = async (seconds: number) => {
    if (!project) return;
    const target = Math.max(0, Math.min(timelineSpan, seconds));
    setPlayheadSeconds(target);
    try {
      await runtime.player.seek(project, target);
    } catch (reason) {
      setTransport("paused");
      setError(messageFrom(reason));
    }
  };

  const recallLastRecordedTake = async () => {
    if (!project || !lastRecordedTake || busyAction) return;
    const seconds = ticksToSeconds(lastRecordedTake.startTick, project.tempoMap, project.settings.ppq);
    await seek(seconds);
    setNotice(`Recalled “${lastRecordedTake.fileName}” at ${formatClock(seconds)}. Press Play to monitor it through the project mix.`);
  };

  const seekFromLane = (event: MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (!bounds.width) return;
    void seek(((event.clientX - bounds.left) / bounds.width) * timelineSpan);
  };

  commandHandlerRef.current = (command) => {
    switch (command.id) {
      case 'project-new':
        newProjectInputRef.current?.focus();
        newProjectInputRef.current?.select();
        break;
      case 'project-open':
        projectRackRef.current?.scrollIntoView({block: 'nearest'});
        projectRackRef.current?.querySelector<HTMLButtonElement>('.poietek-project-open:not(:disabled)')?.focus();
        break;
      case 'project-save':
        void saveProject();
        break;
      case 'audio-import':
        importInputRef.current?.click();
        break;
      case 'audio-export-wav':
        void exportWav();
        break;

      case 'edit-undo':
        void undo();
        break;

      case 'edit-redo':
        void redo();
        break;

      case 'track-add-audio':
        setActiveDesk('arrange');
        void commitProjectEdit(
          (current) => addAudioTrack(current),
          'Audio track added and saved locally.',
        );
        break;

      case 'track-add-midi':
        setActiveDesk('arrange');
        void commitProjectEdit(
          (current) => addMidiTrack(current),
          'MIDI track added and saved locally.',
        );
        break;
        
      case 'track-duplicate': {
        setActiveDesk('arrange');

        if (!arrangerSelection) {
          setError('Select a clip on the track you want to duplicate.');
          break;
        }

        void commitProjectEdit(
          (current) =>
            duplicateTrack(
              current,
              arrangerSelection.trackId,
            ),
          'Track duplicated and saved locally.',
        );
        break;
      }

      case 'clip-split': {
        setActiveDesk('arrange');

        if (!project) break;

        if (!arrangerSelection) {
          setError('Select a clip before using Split Clip.');
          break;
        }

        const splitTick = secondsToTicks(
          playheadSeconds,
          project.tempoMap,
          project.settings.ppq,
        );

        splitClip(
          arrangerSelection.trackId,
          arrangerSelection.clipId,
          splitTick,
        );
        break;
      }

      case 'clip-duplicate': {
        setActiveDesk('arrange');

        if (!arrangerSelection) {
          setError('Select a clip before using Duplicate Clip.');
          break;
        }

        void commitProjectEdit(
          (current) =>
            duplicateAudioClip(
              current,
              arrangerSelection.trackId,
              arrangerSelection.clipId,
            ),
          'Clip duplicated and saved locally.',
        );
        break;
      }

      case 'clip-fades': {
        setActiveDesk('arrange');

        if (!arrangerSelection) {
          setError('Select a clip before editing its fades.');
          break;
        }

        setFocusFadesRequest((current) => current + 1);
        break;
      }

      case 'transport-play-toggle':
        void (transport === 'playing' ? pause() : play());
        break;
      case 'transport-stop':
        void stop();
        break;
      case 'transport-return-zero':
        void seek(0);
        break;
      case 'transport-record-toggle':
        void toggleRecording();
        break;
      case 'arrange-show-timeline':
        setActiveDesk('arrange');
        break;
      case 'arrange-show-console':
        setActiveDesk('console');
        break;
      case 'arrange-show-health':
        setActiveDesk('health');
        break;
    }
  };

  useEffect(
    () =>
      subscribeStudioCommands((command) =>
        commandHandlerRef.current(command),
      ),
    [],
  );

  useEffect(() => {
    if (runtimeStatus !== 'ready' || !project) {
      markStudioCommandAreaReady('arrange', false);
      return;
    }

    markStudioCommandAreaReady('arrange', true);

    return () => {
      markStudioCommandAreaReady('arrange', false);
    };
  }, [runtimeStatus, project?.id]);

  useEffect(() => () => {
    const active = activeRecordingRef.current;
    activeRecordingRef.current = null;
    if (active) void active.cancel().catch(() => undefined);
  }, []);

  const storageLabel =
    typeof indexedDB === "undefined"
      ? "Local storage unavailable"
      : typeof navigator !== "undefined" && navigator.storage?.getDirectory
        ? "Local media store · OPFS eligible"
        : "Local media store · IndexedDB fallback";

  if (runtimeStatus !== "ready" || !project) {
    return (
      <section className={`poietek-workspace ${className}`} aria-label="Poietek studio">
        <div className="poietek-workspace-boot" role="status" aria-live="polite">
          <span className="poietek-boot-light" aria-hidden="true" />
          <div>
            <strong>
              {runtimeStatus === "error"
                ? "Local studio could not start"
                : "Starting the local studio"}
            </strong>
            <p>
              {runtimeStatus === "error"
                ? runtimeError
                : "Opening the durable project and media stores…"}
            </p>
          </div>
        </div>
      </section>
    );
  }

  const playheadPercent = (playheadSeconds / timelineSpan) * 100;

  return (
    <section className={`poietek-workspace ${className}`} aria-label="Poietek studio">
      <header className="poietek-workspace-header">
        <div className="poietek-brand-block">
          <span className="poietek-brand-mark" aria-hidden="true">P</span>
          <div>
            <p className="poietek-eyebrow">SDS production runtime</p>
            <h1>Poietek Studio</h1>
          </div>
        </div>
        <div className="poietek-runtime-badges" aria-label="Local runtime status">
          <span className="poietek-runtime-badge poietek-runtime-badge-online">
            <i aria-hidden="true" /> Project store ready
          </span>
          <span className="poietek-runtime-badge" title="OPFS is attempted first when the browser permits it; IndexedDB is the fallback.">
            {storageLabel}
          </span>
        </div>
      </header>

      <div className="poietek-workspace-grid">
        <aside className="poietek-project-rack" aria-label="Local projects" ref={projectRackRef}>
          <div className="poietek-panel-heading">
            <div>
              <p className="poietek-eyebrow">Local-first</p>
              <h2>Project rack</h2>
            </div>
            <span>{projects.length}</span>
          </div>

          <form
            className="poietek-new-project"
            onSubmit={(event) => {
              event.preventDefault();
              void createProject();
            }}
          >
            <label htmlFor="poietek-new-project-name">New project name</label>
            <div>
              <input
                id="poietek-new-project-name"
                ref={newProjectInputRef}
                value={newProjectTitle}
                onChange={(event) => setNewProjectTitle(event.target.value)}
                disabled={Boolean(busyAction)}
                maxLength={120}
              />
              <button type="submit" disabled={Boolean(busyAction)} title="Create local project">
                +
              </button>
            </div>
          </form>

          <div className="poietek-project-list">
            {projects.map((summary) => (
              <article
                className={`poietek-project-card ${summary.id === project.id ? "is-current" : ""}`}
                key={summary.id}
              >
                <button
                  className="poietek-project-open"
                  type="button"
                  onClick={() => void openProject(summary.id)}
                  disabled={Boolean(busyAction) || summary.id === project.id}
                >
                  <span>{summary.title}</span>
                  <small>{summary.id === project.id ? "Open now" : projectDate(summary.updatedAt)}</small>
                </button>
                <button
                  className="poietek-project-delete"
                  type="button"
                  onClick={() => void deleteProject(summary)}
                  disabled={Boolean(busyAction)}
                  aria-label={`Delete ${summary.title}`}
                  title="Delete project record; media is retained"
                >
                  ×
                </button>
              </article>
            ))}
          </div>

          <div className="poietek-rack-note">
            <strong>Offline is a normal mode.</strong>
            <p>Project edits commit locally first. Cloud providers are not required for this workspace.</p>
          </div>
        </aside>

        <main className="poietek-studio-main">
          <div className="poietek-session-strip">
            <div>
              <p className="poietek-eyebrow">Current session</p>
              <h2>{project.title}</h2>
              <p>
                {project.settings.sampleRate.toLocaleString()} Hz · {project.settings.tuning.referenceHz} Hz reference · {project.tempoMap[0].bpm} BPM
              </p>
            </div>
            <div className="poietek-session-actions">
              <button type="button" onClick={() => void undo()} disabled={!canUndo || Boolean(busyAction)}>
                ↶ Undo
              </button>
              <button type="button" onClick={() => void redo()} disabled={!canRedo || Boolean(busyAction)}>
                ↷ Redo
              </button>
              <label className={`poietek-import-button ${busyAction ? "is-disabled" : ""}`}>
                <span>Import audio</span>
                <input
                  type="file"
                  ref={importInputRef}
                  accept="audio/*,.wav,.wave,.aif,.aiff,.flac,.mp3,.m4a,.ogg,.opus"
                  onChange={(event) => void importAudio(event)}
                  disabled={Boolean(busyAction)}
                />
              </label>
            </div>
          </div>

          <div className={`poietek-persist-bar is-${saveState}`} aria-live="polite">
            <span className="poietek-persist-light" aria-hidden="true" />
            <strong>
              {busyAction ??
                (saveState === "saved"
                  ? "Saved locally"
                  : saveState === "error"
                    ? "Local save needs attention"
                    : "Opening local project")}
            </strong>
            <span>
              {savedAt && saveState === "saved" ? `Last commit ${projectDate(savedAt)}` : ""}
            </span>
          </div>

          {(error || notice) && (
            <div className={`poietek-message ${error ? "is-error" : "is-notice"}`} role={error ? "alert" : "status"}>
              <span aria-hidden="true">{error ? "!" : "✓"}</span>
              <p>{error ?? notice}</p>
              <button type="button" onClick={() => { setError(null); setNotice(null); }} aria-label="Dismiss message">×</button>
            </div>
          )}

          <section className="poietek-transport-rack" aria-label="Timeline transport">
            <div className="poietek-transport-controls">
              <button
                className="poietek-transport-primary"
                type="button"
                onClick={() => void (transport === "playing" ? pause() : play())}
                disabled={Boolean(busyAction) || !hasClips || transport === "starting"}
                aria-label={transport === "playing" ? "Pause" : "Play"}
              >
                {transport === "playing" ? "Ⅱ" : transport === "starting" ? "…" : "▶"}
              </button>
              <button type="button" onClick={() => void stop()} disabled={Boolean(busyAction) || transport === "stopped"} aria-label="Stop">
                ■
              </button>
              <button
                type="button"
                className={`poietek-record-button ${isRecording ? 'is-recording' : ''}`}
                onClick={() => void toggleRecording()}
                disabled={(Boolean(busyAction) && !isRecording) || recorder.getCapability().state === 'unavailable'}
                aria-label={isRecording ? 'Stop recording' : 'Record audio input'}
                title={recorder.getCapability().state === 'available' ? 'Record the selected browser/system audio input' : recorder.getCapability().reason || 'Recording unavailable'}
              >
                ●
              </button>
              <div className="poietek-time-display" aria-label={`Playhead ${formatClock(playheadSeconds)}`}>
                <span>{formatClock(playheadSeconds)}</span>
                <small>UI position · Web Audio transport</small>
              </div>
            </div>
            <input
              className="poietek-seek"
              type="range"
              min="0"
              max={timelineSpan}
              step="0.01"
              value={Math.min(playheadSeconds, timelineSpan)}
              onChange={(event) => void seek(Number(event.target.value))}
              disabled={Boolean(busyAction) || !hasClips}
              aria-label="Timeline playhead"
            />
            <div className="poietek-sample-recorder-actions" aria-label="Sample record and recall">
              <button type="button" onClick={() => setSampleRecorderOpen((open) => !open)} aria-expanded={sampleRecorderOpen}>
                SAMPLE
              </button>
              <button
                type="button"
                className={isRecording ? 'is-recording' : ''}
                onClick={() => void toggleRecording()}
                disabled={(Boolean(busyAction) && !isRecording) || recorder.getCapability().state === 'unavailable'}
              >
                {isRecording ? 'STOP' : 'REC'}
              </button>
              <button type="button" onClick={() => void recallLastRecordedTake()} disabled={!lastRecordedTake || Boolean(busyAction)}>
                RECALL
              </button>
              <span>{lastRecordedTake ? lastRecordedTake.fileName : 'No captured take yet'}</span>
            </div>
            {sampleRecorderOpen ? (
              <section className="poietek-sample-recorder" aria-label="Sample recording setup">
                <div>
                  <p className="poietek-eyebrow">Live sample input</p>
                  <h3>Record &amp; Recall</h3>
                  <p>Capture the selected real browser input, save it locally as a project take, then recall its timeline position.</p>
                </div>
                <label>
                  Input device
                  <select value={sampleInputDeviceId} onChange={(event) => setSampleInputDeviceId(event.target.value)} disabled={isRecording}>
                    <option value="">System default / microphone</option>
                    {sampleInputDevices.map((device, index) => (
                      <option value={device.deviceId} key={device.deviceId || `input-${index}`}>
                        {device.label || `Audio input ${index + 1} · permission required for label`}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="button" onClick={() => void refreshSampleInputs()} disabled={isRecording}>SCAN INPUTS</button>
                <fieldset disabled={isRecording}>
                  <legend>Record source</legend>
                  {(['mono', 'stereo', 'left', 'right'] as const).map((mode) => (
                    <label key={mode} title={mode === 'left' || mode === 'right' ? 'Requires the native per-channel routing adapter' : undefined}>
                      <input type="radio" name="sample-input-mode" value={mode} checked={sampleInputMode === mode} onChange={() => setSampleInputMode(mode)} />
                      {mode === 'mono' ? 'MIC / MONO' : mode === 'stereo' ? 'USB STEREO' : mode === 'left' ? 'USB-L · NATIVE' : 'USB-R · NATIVE'}
                    </label>
                  ))}
                </fieldset>
                <label className="poietek-sample-monitor-toggle">
                  <input type="checkbox" checked={sampleMonitoring} onChange={(event) => setSampleMonitoring(event.target.checked)} disabled={isRecording || !recorder.getCapability().inputMonitoringAvailable} />
                  Monitor live input
                </label>
                <p className="poietek-sample-recorder-warning">Use headphones when monitoring to avoid acoustic feedback. Browser labels and channels are reported capabilities, not assumed USB hardware.</p>
              </section>
            ) : null}
          </section>

          <nav className="poietek-desk-tabs" aria-label="Production workspace views">
            <button type="button" className={activeDesk === 'arrange' ? 'is-active' : ''} onClick={() => setActiveDesk('arrange')}>
              <span>01</span> Arrange
              <small>clips · waves · edits</small>
            </button>
            <button type="button" className={activeDesk === 'console' ? 'is-active' : ''} onClick={() => setActiveDesk('console')}>
              <span>02</span> Console
              <small>tracks · buses · routing</small>
            </button>
            <button type="button" className={activeDesk === 'health' ? 'is-active' : ''} onClick={() => setActiveDesk('health')}>
              <span>03</span> Inspect
              <small>audio health · standards</small>
            </button>
          </nav>

          {activeDesk === 'arrange' ? (
            <StudioArrangerView
              project={project}
              timelineSpan={timelineSpan}
              playheadSeconds={playheadSeconds}
              busy={Boolean(busyAction)}
              focusFadesRequest={focusFadesRequest}
              initialSelection={arrangerSelection}
              onSelectionChange={setArrangerSelection}
              onSeek={(seconds) => void seek(seconds)}
              onSetTrackMixer={setTrackMixer}
              onSetClip={setClip}
              onSplitClip={splitClip}
              onRemoveClip={removeClip}
              onToggleTrackPin={toggleTrackPin}
            />
          ) : null}

          {activeDesk === 'console' ? (
            <StudioConsoleView
              project={project}
              busy={Boolean(busyAction)}
              onSetTrackMixer={setTrackMixer}
            />
          ) : null}

          <section className="poietek-timeline-panel" aria-labelledby="poietek-timeline-title" hidden>
            <div className="poietek-panel-heading poietek-timeline-heading">
              <div>
                <p className="poietek-eyebrow">Arrangement</p>
                <h2 id="poietek-timeline-title">Audio timeline</h2>
              </div>
              <span>{project.tracks.length} {project.tracks.length === 1 ? "track" : "tracks"}</span>
            </div>

            <div className="poietek-ruler-row">
              <div className="poietek-ruler-label">Time</div>
              <div className="poietek-ruler">
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
                  <span key={ratio} style={{ left: `${ratio * 100}%` }}>
                    {formatClock(timelineSpan * ratio)}
                  </span>
                ))}
                <i style={{ left: `${playheadPercent}%` }} aria-hidden="true" />
              </div>
            </div>

            {project.tracks.length === 0 ? (
              <div className="poietek-empty-timeline">
                <strong>No tracks yet</strong>
                <p>Import an audio file to create a real audio track, durable asset, clip, and decoded waveform.</p>
              </div>
            ) : (
              <div className="poietek-track-list">
                {[...project.tracks]
                  .sort((a, b) => a.order - b.order)
                  .map((track) => (
                    <div className="poietek-track-row" key={track.id}>
                      <div className="poietek-track-header">
                        <span className="poietek-track-type">{track.type}</span>
                        <strong>{track.name}</strong>
                        <small>
                          {track.mixer.mute ? "Muted" : track.mixer.solo ? "Solo" : `${track.mixer.gainDb.toFixed(1)} dB`}
                        </small>
                      </div>
                      <div
                        className="poietek-track-lane"
                        onClick={seekFromLane}
                        role="presentation"
                      >
                        <div className="poietek-lane-grid" aria-hidden="true" />
                        {track.clips.map((clip) => {
                          const asset = project.assets.find((candidate) => candidate.id === clip.assetId);
                          const clipStart = ticksToSeconds(clip.startTick, project.tempoMap, project.settings.ppq);
                          const clipEnd = ticksToSeconds(
                            clip.startTick + clip.durationTicks,
                            project.tempoMap,
                            project.settings.ppq,
                          );
                          const style: CSSProperties = {
                            left: `${(clipStart / timelineSpan) * 100}%`,
                            width: `${Math.max(0.7, ((clipEnd - clipStart) / timelineSpan) * 100)}%`,
                          };
                          return (
                            <div className="poietek-audio-clip" key={clip.id} style={style} title={`${clip.name} · ${formatClock(clipStart)} to ${formatClock(clipEnd)}`}>
                              <WaveformPreview preview={asset ? readWaveformPreview(asset) : null} />
                              <span>{clip.name}</span>
                            </div>
                          );
                        })}
                        <i className="poietek-track-playhead" style={{ left: `${playheadPercent}%` }} aria-hidden="true" />
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </section>

          <section className="poietek-health-panel" aria-labelledby="poietek-health-title" hidden={activeDesk !== 'health'}>
            <div className="poietek-panel-heading">
              <div>
                <p className="poietek-eyebrow">Measured from decoded PCM</p>
                <h2 id="poietek-health-title">Audio health</h2>
              </div>
              <span>Basic checks</span>
            </div>
            <div className="poietek-standards-note">
              <strong>LUFS and true peak are not measured here.</strong>
              <p>These cards report sample peak, RMS, clipping, DC offset, and stereo correlation only. A validated BS.1770 analyzer is required before showing LUFS or dBTP.</p>
            </div>

            {project.assets.filter((asset) => asset.mediaType === "audio").length === 0 ? (
              <div className="poietek-health-empty">Import audio to run exact decoded-sample checks.</div>
            ) : (
              <div className="poietek-health-grid">
                {project.assets
                  .filter((asset) => asset.mediaType === "audio")
                  .map((asset) => {
                    const health = readBasicAudioHealth(asset);
                    return (
                      <article className={`poietek-health-card ${health?.availability === "available" ? `is-${health.status}` : "is-unavailable"}`} key={asset.id}>
                        <div className="poietek-health-card-title">
                          <div>
                            <strong>{asset.originalName}</strong>
                            <small>
                              {asset.durationSeconds == null ? "Duration unavailable" : formatClock(asset.durationSeconds)} · {asset.channels ?? "?"} ch · {asset.sampleRate?.toLocaleString() ?? "?"} Hz decoded
                            </small>
                          </div>
                          <span>{health?.availability === "available" ? health.status : "unavailable"}</span>
                        </div>

                        {health?.availability === "available" ? (
                          <>
                            <dl className="poietek-health-metrics">
                              <div>
                                <dt>Sample peak</dt>
                                <dd>{formatDb(health.combinedSamplePeakDbfs)}</dd>
                              </div>
                              <div>
                                <dt>Channel RMS</dt>
                                <dd>{health.channels.map((channel) => formatDb(channel.rmsDbfs)).join(" / ")}</dd>
                              </div>
                              <div>
                                <dt>Clipped samples</dt>
                                <dd>{health.channels.reduce((sum, channel) => sum + channel.clippedSampleCount, 0).toLocaleString()}</dd>
                              </div>
                              <div>
                                <dt>Stereo correlation</dt>
                                <dd>{health.stereoCorrelation == null ? "Not applicable" : health.stereoCorrelation.toFixed(3)}</dd>
                              </div>
                            </dl>
                            <ul>
                              {health.recommendations.map((recommendation) => (
                                <li key={recommendation}>{recommendation}</li>
                              ))}
                            </ul>
                          </>
                        ) : (
                          <p className="poietek-health-unavailable">
                            {health?.reason ?? "This asset has not been analyzed in the local workspace yet."}
                          </p>
                        )}

                        <button type="button" onClick={() => void analyzeAsset(asset)} disabled={Boolean(busyAction)}>
                          {health ? "Run basic checks again" : "Run basic checks"}
                        </button>
                      </article>
                    );
                  })}
              </div>
            )}
          </section>
        </main>
      </div>
    </section>
  );
}
