import {useEffect, useMemo, useState, type CSSProperties, type MouseEvent} from 'react';
import {Pin} from 'lucide-react';
import type {AudioClip, PoietekProject, Track} from '../domain/types';
import {secondsToTicks, ticksToSeconds} from '../timeline/tempo';
import {formatClock, readWaveformPreview, type StoredWaveformPreview} from './audioWorkspaceModel';
import {ViewportNavigator} from '../../components/shared/ViewportNavigator';
import {getProjectEditorialWorkflow} from '../editorial-workflows';

export interface ArrangerSelection {
  trackId: string;
  clipId: string;
}

export interface StudioArrangerViewProps {
  project: PoietekProject;
  timelineSpan: number;
  playheadSeconds: number;
  busy: boolean;
  onSeek(seconds: number): void;
  onSetTrackMixer(trackId: string, patch: Partial<Track['mixer']>, message: string): void;
  onSetClip(trackId: string, clipId: string, patch: Partial<AudioClip>, message: string): void;
  onSplitClip(trackId: string, clipId: string, splitTick: number): void;
  onRemoveClip(trackId: string, clipId: string): void;
  onToggleTrackPin(trackId: string): void;
}

function Waveform({preview}: {preview: StoredWaveformPreview | null}) {
  const path = useMemo(() => {
    if (!preview?.min.length) return '';
    return preview.min
      .map((minimum, index) => {
        const x = preview.min.length === 1 ? 500 : (index / (preview.min.length - 1)) * 1000;
        const top = 50 - preview.max[index] * 43;
        const bottom = 50 - minimum * 43;
        return `M${x.toFixed(2)} ${top.toFixed(2)}L${x.toFixed(2)} ${bottom.toFixed(2)}`;
      })
      .join('');
  }, [preview]);

  if (!path) return <span className="poietek-waveform-unavailable">Waveform unavailable</span>;
  return (
    <svg className="poietek-waveform" viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true">
      <line className="poietek-waveform-axis" x1="0" x2="1000" y1="50" y2="50" />
      <path className="poietek-waveform-peaks" d={path} />
    </svg>
  );
}

export function StudioArrangerView({
  project,
  timelineSpan,
  playheadSeconds,
  busy,
  onSeek,
  onSetTrackMixer,
  onSetClip,
  onSplitClip,
  onRemoveClip,
  onToggleTrackPin,
}: StudioArrangerViewProps) {
  const [selection, setSelection] = useState<ArrangerSelection | null>(null);
  const [zoom, setZoom] = useState(1);
  const playheadPercent = (playheadSeconds / timelineSpan) * 100;
  const editorial = useMemo(() => {
    try {
      return getProjectEditorialWorkflow(project);
    } catch {
      return null;
    }
  }, [project]);
  const pinnedTrackIds = useMemo(() => new Set(editorial?.pinnedTrackIds ?? []), [editorial?.pinnedTrackIds]);
  const orderedTracks = useMemo(
    () => [...project.tracks].sort((a, b) => Number(pinnedTrackIds.has(b.id)) - Number(pinnedTrackIds.has(a.id)) || a.order - b.order),
    [pinnedTrackIds, project.tracks],
  );
  const selectedTrack = selection
    ? project.tracks.find((track) => track.id === selection.trackId)
    : null;
  const selectedClip = selectedTrack?.clips.find((clip) => clip.id === selection?.clipId) ?? null;

  useEffect(() => {
    if (selection && !selectedClip) setSelection(null);
  }, [selectedClip, selection]);

  const seekFromLane = (event: MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('.poietek-audio-clip')) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width) onSeek(((event.clientX - bounds.left) / bounds.width) * timelineSpan);
  };

  const editSeconds = (clip: AudioClip, patch: {startSeconds?: number; durationSeconds?: number}) => {
    const startSeconds =
      patch.startSeconds ??
      ticksToSeconds(clip.startTick, project.tempoMap, project.settings.ppq);
    const durationSeconds =
      patch.durationSeconds ??
      ticksToSeconds(
        clip.startTick + clip.durationTicks,
        project.tempoMap,
        project.settings.ppq,
      ) - startSeconds;
    const startTick = secondsToTicks(startSeconds, project.tempoMap, project.settings.ppq);
    const endTick = secondsToTicks(
      startSeconds + Math.max(0.001, durationSeconds),
      project.tempoMap,
      project.settings.ppq,
    );
    onSetClip(
      selection!.trackId,
      clip.id,
      {startTick, durationTicks: Math.max(1, endTick - startTick)},
      'Clip position updated and saved locally.',
    );
  };

  return (
    <section className="poietek-arranger" aria-label="Horizon multitrack arranger">
      <div className="poietek-arranger-toolbar">
        <div className="poietek-tool-group" aria-label="Editing tools">
          <button type="button" className="is-active">Pointer</button>
          <button type="button" title="Range editing is staged; pointer selection is active" disabled>Range</button>
          <button type="button" title="Draw automation is not connected yet" disabled>Draw</button>
          <button type="button" title="Audition uses the main transport">Audition</button>
        </div>
        <div className="poietek-arranger-readout">
          <span>Grid <strong>1/16</strong></span>
          <span>Snap <strong>Adaptive</strong></span>
          <span>Tempo <strong>{project.tempoMap[0].bpm} BPM</strong></span>
          <span>Edit memory <strong>{editorial?.activeEditPolicy.replaceAll('_', ' ') ?? 'not initialized'}</strong></span>
        </div>
      </div>

      <ViewportNavigator
        ariaLabel="Arrangement timeline viewport"
        zoom={zoom}
        onZoomChange={setZoom}
        minZoom={0.65}
        maxZoom={2.5}
        zoomStep={0.25}
        variant="arranger"
        viewportClassName="poietek-arranger-scroll"
        contentClassName="poietek-arranger-canvas"
      >
          <div className="poietek-ruler-row poietek-arranger-ruler-row">
            <div className="poietek-ruler-label">Tracks</div>
            <div className="poietek-ruler">
              {Array.from({length: 9}, (_, index) => index / 8).map((ratio) => (
                <span key={ratio} style={{left: `${ratio * 100}%`}}>
                  {formatClock(timelineSpan * ratio)}
                </span>
              ))}
              <i style={{left: `${playheadPercent}%`}} aria-hidden="true" />
            </div>
          </div>

          {orderedTracks.length === 0 ? (
            <div className="poietek-empty-timeline">
              <strong>No tracks yet</strong>
              <p>Import audio to create a durable track, clip, waveform, and locally stored media asset.</p>
            </div>
          ) : (
            <div className="poietek-track-list">
              {orderedTracks.map((track) => (
                <div className={`poietek-track-row ${selectedTrack?.id === track.id ? 'is-selected' : ''} ${pinnedTrackIds.has(track.id) ? 'is-pinned' : ''}`} key={track.id}>
                  <div className="poietek-track-header" style={{'--track-color': track.color ?? '#62cbbf'} as CSSProperties}>
                    <div className="poietek-track-title-row">
                      <span className="poietek-track-number">{String(track.order + 1).padStart(2, '0')}</span>
                      <strong>{track.name}</strong>
                      <button
                        type="button"
                        className="poietek-track-pin"
                        aria-label={`${pinnedTrackIds.has(track.id) ? 'Unpin' : 'Pin'} ${track.name}`}
                        aria-pressed={pinnedTrackIds.has(track.id)}
                        title={pinnedTrackIds.has(track.id) ? 'Unpin track from focused order' : 'Pin track above unpinned tracks'}
                        disabled={busy}
                        onClick={() => onToggleTrackPin(track.id)}
                      ><Pin aria-hidden="true" /></button>
                    </div>
                    <div className="poietek-track-controls">
                      <button
                        type="button"
                        className={track.mixer.mute ? 'is-engaged' : ''}
                        onClick={() => onSetTrackMixer(track.id, {mute: !track.mixer.mute}, 'Track mute updated.')}
                        disabled={busy}
                        aria-pressed={track.mixer.mute}
                      >M</button>
                      <button
                        type="button"
                        className={track.mixer.solo ? 'is-solo' : ''}
                        onClick={() => onSetTrackMixer(track.id, {solo: !track.mixer.solo}, 'Track solo updated.')}
                        disabled={busy}
                        aria-pressed={track.mixer.solo}
                      >S</button>
                      <button type="button" disabled title="Record arming needs an input adapter">R</button>
                      <small>{track.mixer.gainDb.toFixed(1)} dB</small>
                    </div>
                  </div>
                  <div className="poietek-track-lane" onClick={seekFromLane}>
                    <div className="poietek-lane-grid" aria-hidden="true" />
                    {track.clips.map((clip) => {
                      const asset = project.assets.find((candidate) => candidate.id === clip.assetId);
                      const clipStart = ticksToSeconds(clip.startTick, project.tempoMap, project.settings.ppq);
                      const clipEnd = ticksToSeconds(clip.startTick + clip.durationTicks, project.tempoMap, project.settings.ppq);
                      const selected = selection?.clipId === clip.id;
                      const style: CSSProperties = {
                        left: `${(clipStart / timelineSpan) * 100}%`,
                        width: `${Math.max(0.7, ((clipEnd - clipStart) / timelineSpan) * 100)}%`,
                      };
                      return (
                        <button
                          className={`poietek-audio-clip ${selected ? 'is-selected' : ''} ${clip.muted ? 'is-muted' : ''}`}
                          key={clip.id}
                          style={style}
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelection({trackId: track.id, clipId: clip.id});
                          }}
                          title={`${clip.name} · ${formatClock(clipStart)} to ${formatClock(clipEnd)}`}
                        >
                          <Waveform preview={asset ? readWaveformPreview(asset) : null} />
                          <span>{clip.name}</span>
                          {clip.fadeInSeconds > 0 ? <i className="poietek-fade-in" aria-hidden="true" /> : null}
                          {clip.fadeOutSeconds > 0 ? <i className="poietek-fade-out" aria-hidden="true" /> : null}
                        </button>
                      );
                    })}
                    <i className="poietek-track-playhead" style={{left: `${playheadPercent}%`}} aria-hidden="true" />
                  </div>
                </div>
              ))}
            </div>
          )}
      </ViewportNavigator>

      <div className="poietek-clip-inspector" aria-live="polite">
        {selectedClip && selectedTrack ? (
          <>
            <div className="poietek-inspector-title">
              <span>Clip inspector</span>
              <strong>{selectedClip.name}</strong>
              <small>All active edits commit through project undo/redo.</small>
            </div>
            <label>
              Start
              <input
                type="number"
                min="0"
                step="0.01"
                value={ticksToSeconds(selectedClip.startTick, project.tempoMap, project.settings.ppq).toFixed(2)}
                onChange={(event) => editSeconds(selectedClip, {startSeconds: Number(event.target.value)})}
                disabled={busy}
              />
            </label>
            <label>
              Duration
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={(ticksToSeconds(selectedClip.startTick + selectedClip.durationTicks, project.tempoMap, project.settings.ppq) - ticksToSeconds(selectedClip.startTick, project.tempoMap, project.settings.ppq)).toFixed(2)}
                onChange={(event) => editSeconds(selectedClip, {durationSeconds: Number(event.target.value)})}
                disabled={busy}
              />
            </label>
            <label>
              Gain
              <input type="number" min="-60" max="24" step="0.5" value={selectedClip.gainDb} onChange={(event) => onSetClip(selectedTrack.id, selectedClip.id, {gainDb: Number(event.target.value)}, 'Clip gain updated.')} disabled={busy} />
            </label>
            <label>
              Pan
              <input type="number" min="-1" max="1" step="0.05" value={selectedClip.pan} onChange={(event) => onSetClip(selectedTrack.id, selectedClip.id, {pan: Number(event.target.value)}, 'Clip pan updated.')} disabled={busy} />
            </label>
            <label>
              Fade in
              <input type="number" min="0" step="0.05" value={selectedClip.fadeInSeconds} onChange={(event) => onSetClip(selectedTrack.id, selectedClip.id, {fadeInSeconds: Number(event.target.value)}, 'Clip fade-in updated.')} disabled={busy} />
            </label>
            <label>
              Fade out
              <input type="number" min="0" step="0.05" value={selectedClip.fadeOutSeconds} onChange={(event) => onSetClip(selectedTrack.id, selectedClip.id, {fadeOutSeconds: Number(event.target.value)}, 'Clip fade-out updated.')} disabled={busy} />
            </label>
            <div className="poietek-inspector-actions">
              <button type="button" onClick={() => onSplitClip(selectedTrack.id, selectedClip.id, secondsToTicks(playheadSeconds, project.tempoMap, project.settings.ppq))} disabled={busy}>Split at playhead</button>
              <button type="button" onClick={() => onSetClip(selectedTrack.id, selectedClip.id, {muted: !selectedClip.muted}, 'Clip mute updated.')} disabled={busy}>{selectedClip.muted ? 'Unmute clip' : 'Mute clip'}</button>
              <button type="button" className="is-danger" onClick={() => onRemoveClip(selectedTrack.id, selectedClip.id)} disabled={busy}>Remove</button>
            </div>
          </>
        ) : (
          <div className="poietek-inspector-empty">
            <strong>Select a waveform clip</strong>
            <span>Position, trim duration, gain, pan, fades, mute, split, and removal are available here.</span>
          </div>
        )}
      </div>
    </section>
  );
}
