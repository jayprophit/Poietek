import type {CSSProperties} from 'react';
import type {PoietekProject, Track} from '../domain/types';

export interface StudioConsoleViewProps {
  project: PoietekProject;
  busy: boolean;
  onSetTrackMixer(trackId: string, patch: Partial<Track['mixer']>, message: string): void;
}

function Knob({label, value, minimum, maximum, step, unit, disabled, onChange}: {
  label: string;
  value: number;
  minimum: number;
  maximum: number;
  step: number;
  unit: string;
  disabled?: boolean;
  onChange?(value: number): void;
}) {
  return (
    <label className={`poietek-console-knob ${disabled ? 'is-disabled' : ''}`}>
      <span>{label}</span>
      <input
        type="range"
        min={minimum}
        max={maximum}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange?.(Number(event.target.value))}
      />
      <small>{value.toFixed(step < 1 ? 1 : 0)}{unit}</small>
    </label>
  );
}

export function StudioConsoleView({project, busy, onSetTrackMixer}: StudioConsoleViewProps) {
  const tracks = [...project.tracks].sort((a, b) => a.order - b.order);
  return (
    <section className="poietek-console" aria-label="Summit studio console">
      <header className="poietek-console-header">
        <div>
          <p className="poietek-eyebrow">Track-linked console</p>
          <h2>Summit Console</h2>
          <p>Gain, pan, mute, and solo are active in the Web Audio graph. Unavailable processing is visibly bypassed.</p>
        </div>
        <div className="poietek-console-buses">
          <span><i className="is-active" /> Main Out · active</span>
          <span><i /> Space Bus · adapter pending</span>
          <span><i /> Echo Bus · adapter pending</span>
        </div>
      </header>

      <div className="poietek-console-scroll">
        <div className="poietek-console-strips">
          {tracks.map((track, index) => (
            <article className="poietek-channel-strip" key={track.id} style={{'--channel-color': track.color ?? '#62cbbf'} as CSSProperties}>
              <div className="poietek-channel-name">
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{track.name}</strong>
                <small>{track.type} · main out</small>
              </div>
              <section className="poietek-strip-section">
                <h3>Input</h3>
                <button type="button" disabled title="No physical input is assigned">Input not assigned</button>
                <div className="poietek-strip-pair">
                  <Knob label="Pre" value={0} minimum={-12} maximum={24} step={0.5} unit=" dB" disabled />
                  <Knob label="HPF" value={20} minimum={20} maximum={400} step={1} unit=" Hz" disabled />
                </div>
              </section>
              <section className="poietek-strip-section poietek-inserts">
                <h3>Insert chain</h3>
                <button type="button" disabled>1 · Studio EQ — DSP pending</button>
                <button type="button" disabled>2 · Arc Dynamics — DSP pending</button>
                <button type="button" disabled>3 · Empty</button>
              </section>
              <section className="poietek-strip-section poietek-eq-section">
                <h3>Four-band tone</h3>
                <div className="poietek-strip-knob-grid">
                  <Knob label="Low" value={0} minimum={-18} maximum={18} step={0.5} unit="" disabled />
                  <Knob label="Lo Mid" value={0} minimum={-18} maximum={18} step={0.5} unit="" disabled />
                  <Knob label="Hi Mid" value={0} minimum={-18} maximum={18} step={0.5} unit="" disabled />
                  <Knob label="High" value={0} minimum={-18} maximum={18} step={0.5} unit="" disabled />
                </div>
                <small className="poietek-bypass-label">Bypassed · no production EQ adapter</small>
              </section>
              <section className="poietek-strip-section poietek-sends">
                <h3>Sends</h3>
                <div className="poietek-strip-pair">
                  <Knob label="Space" value={0} minimum={0} maximum={100} step={1} unit="%" disabled />
                  <Knob label="Echo" value={0} minimum={0} maximum={100} step={1} unit="%" disabled />
                </div>
              </section>
              <section className="poietek-strip-section poietek-pan-section">
                <Knob
                  label="Pan"
                  value={track.mixer.pan}
                  minimum={-1}
                  maximum={1}
                  step={0.05}
                  unit=""
                  disabled={busy}
                  onChange={(pan) => onSetTrackMixer(track.id, {pan}, 'Track pan updated and saved locally.')}
                />
              </section>
              <div className="poietek-fader-zone">
                <div className="poietek-honest-meter"><span>Signal meter</span><strong>not measured</strong></div>
                <label className="poietek-fader">
                  <input
                    type="range"
                    min="-60"
                    max="12"
                    step="0.5"
                    value={track.mixer.gainDb}
                    onChange={(event) => onSetTrackMixer(track.id, {gainDb: Number(event.target.value)}, 'Track fader updated and saved locally.')}
                    disabled={busy}
                  />
                  <span>{track.mixer.gainDb.toFixed(1)} dB</span>
                </label>
              </div>
              <div className="poietek-channel-buttons">
                <button type="button" disabled title="Record arm requires a configured recording input">R</button>
                <button type="button" className={track.mixer.mute ? 'is-mute' : ''} aria-pressed={track.mixer.mute} onClick={() => onSetTrackMixer(track.id, {mute: !track.mixer.mute}, 'Track mute updated.')} disabled={busy}>M</button>
                <button type="button" className={track.mixer.solo ? 'is-solo' : ''} aria-pressed={track.mixer.solo} onClick={() => onSetTrackMixer(track.id, {solo: !track.mixer.solo}, 'Track solo updated.')} disabled={busy}>S</button>
              </div>
            </article>
          ))}

          <article className="poietek-channel-strip poietek-bus-strip">
            <div className="poietek-channel-name"><span>A</span><strong>Space Bus</strong><small>return · unavailable</small></div>
            <div className="poietek-bus-device"><strong>Space Weave</strong><span>No send/return DSP adapter connected</span></div>
          </article>
          <article className="poietek-channel-strip poietek-bus-strip">
            <div className="poietek-channel-name"><span>B</span><strong>Echo Bus</strong><small>return · unavailable</small></div>
            <div className="poietek-bus-device"><strong>Echo Grid</strong><span>No send/return DSP adapter connected</span></div>
          </article>
          <article className="poietek-channel-strip poietek-master-strip">
            <div className="poietek-channel-name"><span>M</span><strong>Main Out</strong><small>browser destination</small></div>
            <div className="poietek-master-status"><i /><strong>Active route</strong><span>Track nodes connect directly to the current Web Audio destination.</span></div>
            <div className="poietek-honest-meter is-master"><span>LUFS / dBTP</span><strong>not measured</strong></div>
          </article>
        </div>
      </div>
    </section>
  );
}
