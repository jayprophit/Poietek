import React, {useMemo} from 'react';
import {
  AudioLines,
  Blend,
  Grid3X3,
  ListMusic,
  MousePointer2,
  Radio,
  RotateCcw,
  Scissors,
  Sparkles,
  WandSparkles,
} from 'lucide-react';
import type {RackModuleItem} from '../../types';
import type {MidiClipRecord} from '../../poietek/engines/contracts';
import {quantizeMidiClip} from '../../poietek/engines/editEngine';
import {
  addPatternChannel,
  chopMidiNotes,
  constrainMidiClipToScale,
  createAutomationEnvelope,
  createPattern,
  createRetrospectiveCaptureState,
  detectChords,
  evaluateAutomationEnvelope,
  requestRetrospectiveRecall,
  setRetrospectiveCaptureIntent,
  setPatternStep,
  strumMidiChords,
  type AutomationCurve,
  type PianoRollScale,
} from '../../poietek/composition-workflows';

interface CompositionWorkbenchDeviceProps {
  module: RackModuleItem;
  onParametersChange(parameters: RackModuleItem['parameters']): void;
}

type WorkbenchView = 'pattern' | 'notes' | 'arrange' | 'automate' | 'capture';
type NoteTool = 'original' | 'quantize' | 'strum' | 'chop' | 'scale';

const views: readonly {id: WorkbenchView; label: string; icon: typeof Grid3X3}[] = [
  {id: 'pattern', label: 'Pattern', icon: Grid3X3},
  {id: 'notes', label: 'Notes', icon: ListMusic},
  {id: 'arrange', label: 'Arrange', icon: Blend},
  {id: 'automate', label: 'Automate', icon: MousePointer2},
  {id: 'capture', label: 'Capture', icon: Radio},
] as const;

const channelDefinitions = [
  {id: 'kick', name: 'Kick', note: 36, color: '#22d3ee', parameter: 'kickPattern', fallback: '1000100010001000'},
  {id: 'snare', name: 'Snare', note: 38, color: '#fb7185', parameter: 'snarePattern', fallback: '0000100000001000'},
  {id: 'hat', name: 'Hat', note: 42, color: '#fbbf24', parameter: 'hatPattern', fallback: '1010101010101010'},
  {id: 'bass', name: 'Bass', note: 43, color: '#a78bfa', parameter: 'bassPattern', fallback: '1000001010000010'},
] as const;

const sourceNotes: MidiClipRecord = {
  id: 'idea-flow-note-preview',
  trackId: 'idea-flow-preview',
  name: 'Chord sketch',
  startTick: 0,
  durationTicks: 1920,
  loopStartTick: 0,
  loopEndTick: 1920,
  events: [
    {tick: 8, type: 'note', channel: 0, note: 60, velocity: 105, durationTicks: 440, releaseVelocity: null, noteId: 1},
    {tick: 8, type: 'note', channel: 0, note: 64, velocity: 98, durationTicks: 440, releaseVelocity: null, noteId: 2},
    {tick: 8, type: 'note', channel: 0, note: 67, velocity: 96, durationTicks: 440, releaseVelocity: null, noteId: 3},
    {tick: 492, type: 'note', channel: 0, note: 62, velocity: 101, durationTicks: 428, releaseVelocity: null, noteId: 4},
    {tick: 492, type: 'note', channel: 0, note: 65, velocity: 94, durationTicks: 428, releaseVelocity: null, noteId: 5},
    {tick: 492, type: 'note', channel: 0, note: 69, velocity: 94, durationTicks: 428, releaseVelocity: null, noteId: 6},
    {tick: 978, type: 'note', channel: 0, note: 67, velocity: 103, durationTicks: 900, releaseVelocity: null, noteId: 7},
  ],
};

function patternString(value: unknown, fallback: string): string {
  const next = String(value ?? fallback).replace(/[^01]/g, '').slice(0, 16);
  return next.padEnd(16, '0');
}

export const CompositionWorkbenchDevice: React.FC<CompositionWorkbenchDeviceProps> = ({
  module,
  onParametersChange,
}) => {
  const parameters = module.parameters ?? {};
  const activeView = String(parameters.view ?? 'pattern') as WorkbenchView;
  const scaleRoot = Number(parameters.scaleRoot ?? 0);
  const scaleType = String(parameters.scaleType ?? 'major') as PianoRollScale;
  const noteTool = String(parameters.noteTool ?? 'original') as NoteTool;
  const automationCurve = String(parameters.automationCurve ?? 'smooth') as AutomationCurve;
  const automationMid = Number(parameters.automationMid ?? 0.78);
  const captureArmed = Boolean(parameters.captureArmed ?? false);
  const update = (name: string, value: number | boolean | string) => {
    onParametersChange({...parameters, [name]: value});
  };

  const pattern = useMemo(() => {
    let next = createPattern('pattern-a', 'Pattern A');
    for (const channel of channelDefinitions) {
      next = addPatternChannel(next, {
        id: channel.id,
        name: channel.name,
        kind: channel.id === 'bass' ? 'instrument' : 'sampler',
        color: channel.color,
        targetModuleId: null,
        mixerTargetId: null,
        muted: false,
        solo: false,
      });
      const steps = patternString(parameters[channel.parameter], channel.fallback);
      for (let index = 0; index < steps.length; index += 1) {
        if (steps[index] !== '1') continue;
        next = setPatternStep(next, channel.id, index, {
          note: channel.note,
          velocity: index % 4 === 0 ? 118 : 96,
          probability: 1,
          microShiftTicks: 0,
          lengthSteps: 1,
        });
      }
    }
    return next;
  }, [parameters.bassPattern, parameters.hatPattern, parameters.kickPattern, parameters.snarePattern]);

  const notes = useMemo(() => {
    if (noteTool === 'quantize') return quantizeMidiClip(sourceNotes, 120);
    if (noteTool === 'strum') return strumMidiChords(sourceNotes, 18);
    if (noteTool === 'chop') return chopMidiNotes(sourceNotes, 120);
    if (noteTool === 'scale') return constrainMidiClipToScale(sourceNotes, scaleRoot, scaleType);
    return sourceNotes;
  }, [noteTool, scaleRoot, scaleType]);
  const chords = useMemo(() => detectChords(sourceNotes), []);
  const automation = useMemo(() => createAutomationEnvelope('filter-motion', 'idea-synth', 'filter.cutoff', [
    {tick: 0, value: 0.15, curve: automationCurve, tension: 0.8},
    {tick: 960, value: automationMid, curve: automationCurve, tension: 0.5},
    {tick: 1920, value: 0.32, curve: 'linear', tension: 0},
  ]), [automationCurve, automationMid]);
  const recallCheck = requestRetrospectiveRecall(
    setRetrospectiveCaptureIntent(createRetrospectiveCaptureState(60), captureArmed),
    30,
  );

  const toggleStep = (parameter: string, fallback: string, stepIndex: number) => {
    const current = patternString(parameters[parameter], fallback).split('');
    current[stepIndex] = current[stepIndex] === '1' ? '0' : '1';
    update(parameter, current.join(''));
  };

  return (
    <div className="poietek-workbench-device overflow-hidden rounded-xl border border-cyan-400/35 bg-[#07121b] text-slate-100 shadow-inner">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-300/20 bg-gradient-to-r from-cyan-950 via-slate-950 to-violet-950 px-3 py-2">
        <div className="flex items-center gap-2">
          <WandSparkles className="h-4 w-4 text-cyan-200" />
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.15em] text-cyan-100">Idea Flow Workbench</div>
            <div className="text-[9px] text-slate-400">Patterns · expressive notes · mixed arrangement · curves · live-recall intent</div>
          </div>
        </div>
        <span className="rounded-full border border-amber-400/45 bg-amber-400/10 px-2 py-1 text-[8px] font-black uppercase tracking-wider text-amber-200">Serializable control model</span>
      </header>

      <nav className="grid grid-cols-5 border-b border-slate-700/80" aria-label="Idea Flow workbench views">
        {views.map((view) => {
          const Icon = view.icon;
          return (
            <button
              key={view.id}
              type="button"
              aria-pressed={activeView === view.id}
              onClick={() => update('view', view.id)}
              className={`flex items-center justify-center gap-1 border-r border-slate-700/60 px-1 py-2 text-[8px] font-black uppercase tracking-wider transition last:border-r-0 ${activeView === view.id ? 'bg-cyan-300 text-slate-950' : 'bg-slate-950/70 text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <Icon className="h-3 w-3" />{view.label}
            </button>
          );
        })}
      </nav>

      {activeView === 'pattern' && (
        <section className="space-y-2 p-3" aria-label="Durable pattern controls">
          <div className="flex items-center justify-between text-[9px]">
            <span className="font-black uppercase tracking-wider text-cyan-200">Pattern A · 16 steps · four channels</span>
            <span className="text-slate-500">step values persist with this rack unit</span>
          </div>
          {pattern.channels.map((channel) => {
            const definition = channelDefinitions.find((candidate) => candidate.id === channel.id)!;
            const activeSteps = new Set(channel.steps.map((step) => step.stepIndex));
            return (
              <div key={channel.id} className="grid grid-cols-[4rem_minmax(0,1fr)] items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/70 p-2">
                <span className="truncate text-[9px] font-black" style={{color: channel.color}}>{channel.name}</span>
                <div className="grid grid-cols-[repeat(16,minmax(0,1fr))] gap-1">
                  {Array.from({length: pattern.stepCount}, (_, index) => (
                    <button
                      key={index}
                      type="button"
                      aria-label={`${channel.name} step ${index + 1}`}
                      aria-pressed={activeSteps.has(index)}
                      onClick={() => toggleStep(definition.parameter, definition.fallback, index)}
                      className={`aspect-square min-w-0 rounded-sm border transition ${activeSteps.has(index) ? 'border-white/60 shadow-[0_0_8px_currentColor]' : index % 4 === 0 ? 'border-slate-500 bg-slate-700/60' : 'border-slate-700 bg-slate-900'}`}
                      style={activeSteps.has(index) ? {backgroundColor: channel.color, color: channel.color} : undefined}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {activeView === 'notes' && (
        <section className="space-y-3 p-3" aria-label="Piano roll transformations">
          <div className="flex flex-wrap gap-1">
            {([
              ['original', RotateCcw],
              ['quantize', Grid3X3],
              ['strum', Sparkles],
              ['chop', Scissors],
              ['scale', ListMusic],
            ] as const).map(([tool, Icon]) => (
              <button key={tool} type="button" onClick={() => update('noteTool', tool)} className={`flex items-center gap-1 rounded border px-2 py-1 text-[8px] font-black uppercase ${noteTool === tool ? 'border-violet-300 bg-violet-400 text-slate-950' : 'border-slate-700 bg-slate-900 text-slate-300'}`}>
                <Icon className="h-3 w-3" />{tool}
              </button>
            ))}
            <select aria-label="Scale root" value={scaleRoot} onChange={(event) => update('scaleRoot', Number(event.target.value))} className="rounded border border-slate-700 bg-slate-900 px-2 text-[8px] font-bold">
              {['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'].map((name, index) => <option key={name} value={index}>{name}</option>)}
            </select>
            <select aria-label="Scale type" value={scaleType} onChange={(event) => update('scaleType', event.target.value)} className="rounded border border-slate-700 bg-slate-900 px-2 text-[8px] font-bold">
              {['major', 'minor', 'dorian', 'mixolydian', 'pentatonic'].map((name) => <option key={name}>{name}</option>)}
            </select>
          </div>
          <div className="relative h-36 overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
            {Array.from({length: 12}, (_, index) => <span key={index} className="absolute left-0 right-0 border-t border-slate-800" style={{top: `${index * 8.333}%`}} />)}
            {[25, 50, 75].map((left) => <span key={left} className="absolute bottom-0 top-0 border-l border-slate-800" style={{left: `${left}%`}} />)}
            {notes.events.filter((event) => event.type === 'note').map((event, index) => event.type === 'note' && (
              <span
                key={`${event.tick}-${event.note}-${index}`}
                className="absolute h-[7%] min-w-1 rounded-sm border border-violet-200/70 bg-violet-400/80"
                style={{left: `${event.tick / notes.durationTicks * 100}%`, width: `${Math.max(1, event.durationTicks / notes.durationTicks * 100)}%`, top: `${(72 - event.note) * 7.3}%`}}
              />
            ))}
          </div>
          <p className="text-[9px] text-slate-400">Detected at original note starts: <strong className="text-violet-200">{chords.map((chord) => chord.name).join(' · ') || 'No complete chord'}</strong>. Tools return new MIDI clip records and leave the source unchanged.</p>
        </section>
      )}

      {activeView === 'arrange' && (
        <section className="grid gap-3 p-3 md:grid-cols-[minmax(0,1fr)_13rem]" aria-label="Mixed arrangement lanes">
          <div className="space-y-2">
            {[
              {name: 'Patterns', binding: 'instrument', clips: [{left: 2, width: 28, label: 'Pattern A'}, {left: 34, width: 28, label: 'Pattern B'}, {left: 66, width: 30, label: 'Pattern C'}], color: 'bg-cyan-400/75'},
              {name: 'Audio', binding: 'free', clips: [{left: 17, width: 43, label: 'Local vocal take'}], color: 'bg-emerald-400/75'},
              {name: 'Automation', binding: 'automation', clips: [{left: 2, width: 94, label: 'Filter motion'}], color: 'bg-violet-400/75'},
            ].map((lane) => (
              <div key={lane.name} className="grid grid-cols-[5rem_minmax(0,1fr)] rounded-lg border border-slate-800 bg-slate-950/70">
                <div className="border-r border-slate-800 p-2"><strong className="block text-[9px]">{lane.name}</strong><span className="text-[7px] uppercase text-slate-500">{lane.binding}</span></div>
                <div className="relative h-10 overflow-hidden bg-[linear-gradient(90deg,transparent_24%,rgba(71,85,105,.35)_25%,transparent_26%,transparent_49%,rgba(71,85,105,.35)_50%,transparent_51%,transparent_74%,rgba(71,85,105,.35)_75%,transparent_76%)]">
                  {lane.clips.map((clip) => <span key={clip.label} className={`absolute top-1.5 h-7 truncate rounded border border-white/25 px-2 py-1 text-[8px] font-bold text-slate-950 ${lane.color}`} style={{left: `${clip.left}%`, width: `${clip.width}%`}}>{clip.label}</span>)}
                </div>
              </div>
            ))}
          </div>
          <aside className="rounded-lg border border-amber-400/25 bg-amber-400/5 p-3">
            <div className="flex items-center gap-1 text-[9px] font-black uppercase text-amber-200"><Sparkles className="h-3 w-3" />Local loop starter</div>
            <p className="mt-2 text-[8px] leading-relaxed text-slate-400">Builds a deterministic draft from project assets only after role, BPM, key and rights evidence are indexed.</p>
            <button type="button" disabled className="mt-3 w-full cursor-not-allowed rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-[8px] font-black uppercase text-slate-600">No cleared sources indexed</button>
          </aside>
        </section>
      )}

      {activeView === 'automate' && (
        <section className="grid gap-3 p-3 md:grid-cols-[10rem_minmax(0,1fr)]" aria-label="Automation curve editor">
          <aside className="space-y-2 rounded-lg border border-slate-700 bg-slate-950/70 p-2">
            <label className="block text-[8px] font-black uppercase text-slate-400">Segment curve
              <select value={automationCurve} onChange={(event) => update('automationCurve', event.target.value)} className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 p-1.5 text-[9px] text-slate-100">
                <option value="hold">Hold</option><option value="linear">Linear</option><option value="smooth">Smooth</option>
              </select>
            </label>
            <label className="block text-[8px] font-black uppercase text-slate-400">Middle value · {Math.round(automationMid * 100)}%
              <input type="range" min="0" max="1" step="0.01" value={automationMid} onChange={(event) => update('automationMid', Number(event.target.value))} className="mt-2 w-full accent-violet-400" />
            </label>
          </aside>
          <div className="rounded-lg border border-slate-700 bg-slate-950 p-2">
            <svg viewBox="0 0 400 120" className="h-32 w-full" role="img" aria-label="Serializable automation envelope preview">
              {[0, 40, 80, 120].map((y) => <line key={y} x1="0" x2="400" y1={y} y2={y} stroke="#1e293b" />)}
              <polyline fill="none" stroke="#a78bfa" strokeWidth="4" points={Array.from({length: 41}, (_, index) => `${index * 10},${112 - evaluateAutomationEnvelope(automation, index * 48) * 104}`).join(' ')} />
              {automation.points.map((point) => <circle key={point.tick} cx={point.tick / 1920 * 400} cy={112 - point.value * 104} r="6" fill="#22d3ee" stroke="#cffafe" strokeWidth="2" />)}
            </svg>
            <div className="flex justify-between text-[8px] text-slate-500"><span>0 ticks</span><span>Target: idea-synth / filter.cutoff</span><span>1,920 ticks</span></div>
          </div>
        </section>
      )}

      {activeView === 'capture' && (
        <section className="grid gap-3 p-3 md:grid-cols-[minmax(0,1fr)_14rem]" aria-label="Retrospective capture recall">
          <div className="rounded-lg border border-slate-700 bg-slate-950/70 p-3">
            <div className="flex items-center justify-between gap-3">
              <div><strong className="block text-[10px] text-cyan-100">Remember up to the last 60 seconds</strong><span className="text-[8px] text-slate-500">Requires a real capture adapter continuously observing the selected stream.</span></div>
              <button type="button" onClick={() => update('captureArmed', !captureArmed)} className={`rounded border px-3 py-2 text-[8px] font-black uppercase ${captureArmed ? 'border-rose-300 bg-rose-500 text-white' : 'border-slate-600 bg-slate-900 text-slate-300'}`}>{captureArmed ? 'Intent armed' : 'Arm intent'}</button>
            </div>
            <div className="mt-3 flex h-12 items-center gap-1 overflow-hidden rounded border border-slate-800 bg-[#040a10] px-2" aria-hidden="true">
              {Array.from({length: 48}, (_, index) => <span key={index} className={`w-1 rounded-full ${captureArmed ? 'bg-cyan-400/45' : 'bg-slate-700'}`} style={{height: `${18 + (index * 17 % 72)}%`}} />)}
            </div>
          </div>
          <aside className="rounded-lg border border-amber-400/25 bg-amber-400/5 p-3">
            <div className="flex items-center gap-1 text-[9px] font-black uppercase text-amber-200"><AudioLines className="h-3 w-3" />Recall 30 seconds</div>
            <p className="mt-2 text-[8px] leading-relaxed text-slate-400">{recallCheck.ok ? 'Adapter request is ready.' : 'message' in recallCheck ? recallCheck.message : 'Capture adapter is unavailable.'}</p>
            <button type="button" disabled={!recallCheck.ok} className="mt-3 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-[8px] font-black uppercase text-slate-600 disabled:cursor-not-allowed">Recall to new asset</button>
          </aside>
        </section>
      )}

      <footer className="border-t border-cyan-400/20 bg-cyan-400/5 px-3 py-2 text-[8px] leading-relaxed text-cyan-100/80">
        Composition data has a versioned canonical-project extension. This device exposes deterministic controls and previews; audio capture, stretching, pitch shifting and plugin execution remain explicit adapter-gated operations.
      </footer>
    </div>
  );
};
