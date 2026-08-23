import React, {useMemo, useState} from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleStop,
  FastForward,
  Grid3X3,
  ListMusic,
  MousePointerClick,
  Play,
  Radio,
  Save,
  ShieldCheck,
  Square,
} from 'lucide-react';
import type {PoietekProject} from '../../poietek/domain/types';
import {
  buildArrangementCapturePlan,
  evaluatePerformanceReadiness,
  getProjectPerformanceCanvasState,
  launchPerformanceScene,
  launchPerformanceSlot,
  planPerformanceFollow,
  setPerformanceCursor,
  startPerformanceCapture,
  stopPerformanceCapture,
  stopPerformanceLane,
  type PerformanceCanvasMutation,
  type PerformanceCanvasState,
} from '../../poietek/performance-workflows';
import type {RackModuleItem} from '../../types';

type PerformanceView = 'canvas' | 'capture' | 'arrange' | 'readiness';

interface PerformanceCanvasDeviceProps {
  module: RackModuleItem;
  onParametersChange(parameters: RackModuleItem['parameters']): void;
  project: PoietekProject | null;
  projectBusy?: boolean;
  onInitializePerformanceCanvas?(): Promise<void>;
  onMutatePerformanceCanvas?(mutation: PerformanceCanvasMutation): Promise<void>;
  onCommitPerformanceCapture?(commitId: string, insertionTick: number): Promise<void>;
}

const tabs: readonly {id: PerformanceView; label: string; icon: React.ComponentType<{className?: string}>}[] = [
  {id: 'canvas', label: 'Canvas', icon: Grid3X3},
  {id: 'capture', label: 'Capture', icon: Radio},
  {id: 'arrange', label: 'Arrange', icon: ListMusic},
  {id: 'readiness', label: 'Readiness', icon: ShieldCheck},
];

function formatTick(state: PerformanceCanvasState, tick: number): string {
  const bar = Math.floor(tick / state.barLengthTicks) + 1;
  const withinBar = tick % state.barLengthTicks;
  return 'Bar ' + bar + ' · tick ' + withinBar;
}

export const PerformanceCanvasDevice: React.FC<PerformanceCanvasDeviceProps> = ({
  module,
  onParametersChange,
  project,
  projectBusy = false,
  onInitializePerformanceCanvas,
  onMutatePerformanceCanvas,
  onCommitPerformanceCapture,
}) => {
  const view = (module.parameters?.view as PerformanceView | undefined) ?? 'canvas';
  const [message, setMessage] = useState<string | null>(null);

  const workflowResult = useMemo(() => {
    if (!project) return {state: null, error: 'The canonical project is still starting.'};
    try {
      return {state: getProjectPerformanceCanvasState(project), error: null};
    } catch (error) {
      return {state: null, error: error instanceof Error ? error.message : 'Performance Canvas state is malformed.'};
    }
  }, [project]);
  const state = workflowResult.state;
  const readiness = useMemo(() => state ? evaluatePerformanceReadiness(state) : null, [state]);
  const commitId = state?.capture.takeId ? 'arrangement.' + state.capture.takeId : null;
  const arrangementPlan = useMemo(() => {
    if (!state || !commitId || (state.capture.status !== 'stopped' && state.capture.status !== 'committed')) return null;
    try {
      return buildArrangementCapturePlan(state, commitId, 0);
    } catch {
      return null;
    }
  }, [commitId, state]);

  const setView = (next: PerformanceView) => onParametersChange({...module.parameters, view: next});
  const run = async (operation: () => Promise<void>, success: string) => {
    setMessage(null);
    try {
      await operation();
      setMessage(success);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The Performance Canvas change could not be completed.');
    }
  };
  const mutate = (mutation: PerformanceCanvasMutation, success: string) => {
    if (!onMutatePerformanceCanvas) return;
    void run(() => onMutatePerformanceCanvas(mutation), success);
  };

  return (
    <div data-poietek-performance-canvas className="overflow-hidden rounded-xl border border-cyan-400/25 bg-slate-950 text-slate-100 shadow-[inset_0_0_48px_rgba(34,211,238,0.07)]">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-400/20 bg-gradient-to-r from-cyan-950/70 via-slate-950 to-orange-950/50 px-3 py-3">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200"><MousePointerClick className="h-4 w-4" />Performance Canvas</div>
          <p className="mt-1 text-[8px] text-slate-400">Project-owned scenes · quantized launch plans · rehearsal capture · arrangement commit</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-[8px]">
          <span className="rounded border border-emerald-400/30 bg-emerald-400/5 px-2 py-1 text-emerald-200">Canonical control model</span>
          <span className="rounded border border-amber-400/30 bg-amber-400/5 px-2 py-1 text-amber-100">Live clock gated</span>
        </div>
      </header>

      <nav className="grid grid-cols-4 border-b border-slate-800" aria-label="Performance Canvas sections">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return <button key={tab.id} type="button" onClick={() => setView(tab.id)} className={'min-h-11 border-r border-slate-800 px-1 py-2 text-[7px] font-black uppercase transition last:border-r-0 sm:px-2 sm:text-[8px] ' + (view === tab.id ? 'bg-cyan-400/10 text-cyan-200' : 'text-slate-500 hover:bg-slate-900 hover:text-slate-200')}><Icon className="mx-auto mb-1 h-3.5 w-3.5" />{tab.label}</button>;
        })}
      </nav>

      {workflowResult.error ? <div className="m-3 flex items-start gap-2 rounded border border-amber-400/30 bg-amber-400/5 p-3 text-[9px] text-amber-100"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{workflowResult.error}</div> : null}

      {!state && project ? <section className="p-3">
        <div className="rounded-xl border border-dashed border-cyan-400/35 bg-cyan-400/5 p-5 text-center">
          <Grid3X3 className="mx-auto h-6 w-6 text-cyan-300" />
          <strong className="mt-2 block text-[10px] text-cyan-100">Create an original performance canvas</strong>
          <p className="mx-auto mt-1 max-w-xl text-[8px] leading-relaxed text-slate-500">Adds four scenes, three musical lanes, twelve original note patterns, follow rules and matching arrangement lanes to the canonical local project.</p>
          <button type="button" disabled={projectBusy || !onInitializePerformanceCanvas} onClick={() => void run(() => onInitializePerformanceCanvas!(), 'The starter Performance Canvas and its source patterns were saved as one undoable project change.')} className="mt-3 min-h-11 rounded-lg border border-cyan-300/40 bg-cyan-400/10 px-4 text-[8px] font-black uppercase text-cyan-100 disabled:opacity-40"><Grid3X3 className="mr-1 inline h-3.5 w-3.5" />Create starter canvas</button>
        </div>
      </section> : null}

      {state ? <>
        <section className="grid gap-2 border-b border-slate-800 bg-slate-900/50 p-3 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-2"><span className="text-[7px] font-black uppercase text-slate-500">Rehearsal cursor</span><strong className="mt-1 block text-[9px] text-cyan-100">{formatTick(state, state.capture.cursorTick)}</strong><span className="text-[7px] text-slate-600">Manual planning cursor, not the audio clock</span></div>
          <button type="button" disabled={projectBusy || !onMutatePerformanceCanvas || state.capture.status === 'recording'} onClick={() => mutate((current) => startPerformanceCapture(current, 'take.' + String(current.revision + 1).padStart(3, '0')), 'Performance rehearsal capture started at the project cursor.')} className="min-h-11 rounded-lg border border-rose-400/35 bg-rose-400/10 px-3 text-[7px] font-black uppercase text-rose-100 disabled:opacity-40"><Radio className="mr-1 inline h-3.5 w-3.5" />Capture</button>
          <button type="button" disabled={projectBusy || !onMutatePerformanceCanvas || state.capture.status !== 'recording'} onClick={() => mutate((current) => stopPerformanceCapture(current), 'Performance take stopped on a safe quantized boundary.')} className="min-h-11 rounded-lg border border-amber-400/35 bg-amber-400/10 px-3 text-[7px] font-black uppercase text-amber-100 disabled:opacity-40"><Square className="mr-1 inline h-3.5 w-3.5" />Stop take</button>
          <button type="button" disabled={projectBusy || !onMutatePerformanceCanvas} onClick={() => mutate((current) => setPerformanceCursor(current, current.capture.cursorTick + current.barLengthTicks), 'Rehearsal cursor advanced by one bar.')} className="min-h-11 rounded-lg border border-cyan-400/30 bg-cyan-400/5 px-3 text-[7px] font-black uppercase text-cyan-100 disabled:opacity-40"><FastForward className="mr-1 inline h-3.5 w-3.5" />Advance bar</button>
        </section>

        {view === 'canvas' ? <section className="overflow-x-auto p-3">
          <div className="min-w-[42rem]" style={{display: 'grid', gridTemplateColumns: '8rem repeat(' + state.lanes.length + ', minmax(9rem, 1fr))'}}>
            <div className="border-b border-r border-slate-800 p-2 text-[7px] font-black uppercase text-slate-600">Scene / lane</div>
            {state.lanes.map((lane) => <div key={lane.id} className="border-b border-r border-slate-800 p-2 last:border-r-0"><strong className="block text-[9px]" style={{color: lane.color}}>{lane.name}</strong><button type="button" disabled={projectBusy || !onMutatePerformanceCanvas} onClick={() => mutate((current) => stopPerformanceLane(current, lane.id), lane.name + ' stop was added to the quantized launch plan.')} className="mt-1 min-h-8 rounded border border-slate-700 px-2 text-[7px] uppercase text-slate-400 disabled:opacity-40"><CircleStop className="mr-1 inline h-3 w-3" />Stop lane</button></div>)}
            {state.scenes.flatMap((scene) => {
              const follow = planPerformanceFollow(state, scene.id, state.capture.cursorTick);
              return [
                <div key={scene.id + ':head'} className="border-b border-r border-slate-800 p-2"><button type="button" disabled={projectBusy || !onMutatePerformanceCanvas} onClick={() => mutate((current) => launchPerformanceScene(current, scene.id), scene.name + ' scene queued at the quantized boundary.')} className="min-h-11 w-full rounded-lg border px-2 text-left disabled:opacity-40" style={{borderColor: scene.color + '88', backgroundColor: scene.color + '16'}}><strong className="block text-[9px]" style={{color: scene.color}}><Play className="mr-1 inline h-3 w-3" />{scene.name}</strong><span className="mt-1 block text-[7px] text-slate-500">{follow.action === 'none' ? 'Holds' : follow.action + ' after ' + scene.followAfterBars + ' bars'}</span></button></div>,
                ...state.lanes.map((lane) => {
                  const slot = state.slots.find((candidate) => candidate.laneId === lane.id && candidate.sceneId === scene.id);
                  const active = slot && state.activeSlotIdsByLane[lane.id] === slot.id;
                  return <div key={scene.id + ':' + lane.id} className="border-b border-r border-slate-800 p-2 last:border-r-0">{slot ? <button type="button" aria-pressed={Boolean(active)} disabled={projectBusy || !onMutatePerformanceCanvas} onClick={() => mutate((current) => launchPerformanceSlot(current, slot.id), slot.name + ' queued at the quantized boundary.')} className={'min-h-20 w-full rounded-xl border p-2 text-left transition disabled:opacity-40 ' + (active ? 'border-emerald-300 bg-emerald-400/15 shadow-[0_0_18px_rgba(52,211,153,0.12)]' : 'border-slate-700 bg-slate-900/70 hover:border-cyan-400/50')}><span className="text-[7px] font-black uppercase text-slate-500">{slot.launchMode} · {slot.legato ? 'legato' : 'restart'}</span><strong className="mt-1 block text-[9px] text-slate-100">{slot.name}</strong><span className="mt-2 block text-[7px] text-cyan-200">{slot.lengthTicks / state.barLengthTicks} bar source · {slot.loopEnabled ? 'loop' : 'one shot'}</span></button> : <div className="min-h-20 rounded-xl border border-dashed border-slate-800 p-2 text-[7px] text-slate-700">Empty slot</div>}</div>;
                }),
              ];
            })}
          </div>
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-cyan-400/20 bg-cyan-400/5 p-3 text-[8px] leading-relaxed text-cyan-100"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />Buttons write deterministic launch intent and capture events. Gate, repeat, legato, follow scheduling and audible playback require a sample-accurate runtime adapter.</div>
        </section> : null}

        {view === 'capture' ? <section className="space-y-3 p-3">
          <div className="grid gap-2 sm:grid-cols-3"><Metric label="Take" value={state.capture.takeId ?? 'No take'} /><Metric label="Status" value={state.capture.status} /><Metric label="Events" value={String(state.capture.events.length)} /></div>
          {state.capture.events.length ? <div className="space-y-1">{state.capture.events.map((event) => <article key={event.id} className="grid gap-2 rounded-lg border border-slate-800 bg-slate-900/70 p-2 text-[8px] sm:grid-cols-[6rem_1fr_8rem]"><span className={event.kind === 'launch' ? 'font-black uppercase text-emerald-300' : 'font-black uppercase text-amber-300'}>{event.kind}</span><span className="text-slate-300">{event.slotId ?? event.laneId}</span><span className="font-mono text-cyan-200">{formatTick(state, event.scheduledTick)}</span></article>)}</div> : <div className="rounded-xl border border-dashed border-slate-800 p-5 text-center text-[8px] text-slate-600">Start capture, launch scenes or slots, then advance the rehearsal cursor. Events remain local project data.</div>}
          <div className="flex items-start gap-2 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-[8px] leading-relaxed text-amber-100"><Radio className="mt-0.5 h-4 w-4 shrink-0" />This is a deterministic rehearsal capture, not microphone recording and not a sample-accurate performance clock. Poietek's real audio recorder remains available in Arrange.</div>
        </section> : null}

        {view === 'arrange' ? <section className="space-y-3 p-3">
          <div className="grid gap-2 sm:grid-cols-3"><Metric label="Plan" value={arrangementPlan ? 'Ready' : 'Capture required'} /><Metric label="Clips" value={String(arrangementPlan?.entries.length ?? 0)} /><Metric label="Insertion" value="Project start" /></div>
          {arrangementPlan ? <div className="space-y-1">{arrangementPlan.entries.map((entry) => <article key={entry.clipId} className="grid items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/70 p-2 text-[8px] sm:grid-cols-[1fr_auto_1fr]"><span><strong className="block text-cyan-100">{entry.slotId}</strong><small className="text-slate-600">{entry.sourceKind} · {entry.sourceId}</small></span><ArrowRight className="hidden h-4 w-4 text-cyan-500 sm:block" /><span className="font-mono text-slate-300">tick {entry.startTick} · {entry.durationTicks} ticks</span></article>)}</div> : <div className="rounded-xl border border-dashed border-slate-800 p-5 text-center text-[8px] text-slate-600">A stopped take with launch events is required before arrangement clips can be planned.</div>}
          <button type="button" disabled={projectBusy || !onCommitPerformanceCapture || !arrangementPlan || state.capture.status !== 'stopped' || !commitId} onClick={() => void run(() => onCommitPerformanceCapture!(commitId!, 0), 'The performance take was committed to matching canonical arrangement lanes as one undoable project change.')} className="min-h-11 w-full rounded-lg border border-emerald-400/35 bg-emerald-400/10 text-[8px] font-black uppercase text-emerald-100 disabled:opacity-40"><Save className="mr-1 inline h-3.5 w-3.5" />Commit captured performance to arrangement</button>
          <p className="text-[7px] leading-relaxed text-slate-600">Commit creates normal pattern arrangement clips. It does not render audio, execute plug-ins or overwrite source patterns. Project undo removes the complete commit atomically.</p>
        </section> : null}

        {view === 'readiness' && readiness ? <section className="space-y-3 p-3">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3"><ReadinessCard title="Control model" state={readiness.controlModel} detail="Scenes, slots, quantization, launch modes, events and follow plans are validated project data." /><ReadinessCard title="Arrangement bridge" state={readiness.arrangementCommit} detail="A stopped take can become ordinary canonical arrangement clips with one undo point." /><ReadinessCard title="Live playback" state={readiness.livePlayback} detail="Needs a sample-accurate clock plus pattern and audio schedulers for the sources in use." /><ReadinessCard title="Controller input" state={readiness.controllerInput} detail="Mapped pad/controller input requires a separately observed MIDI or native control adapter." /><ReadinessCard title="Follow scheduler" state={readiness.followScheduling} detail="Follow plans are real; automatic timed dispatch remains adapter-gated." /><ReadinessCard title="Missing evidence" state={readiness.missingCapabilities.length ? 'adapter_required' : 'ready'} detail={readiness.missingCapabilities.length ? readiness.missingCapabilities.join(' · ') : 'All declared capabilities were observed.'} /></div>
          <div className="flex items-start gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/5 p-3 text-[8px] leading-relaxed text-emerald-100"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />Local save, validation, rehearsal capture, arrangement planning, atomic commit, undo and redo are available without the internet.</div>
        </section> : null}
      </> : null}

      {message ? <div role="status" className={'mx-3 mb-3 flex items-start gap-2 rounded border p-2 text-[8px] ' + (/could not|requires|malformed|not found|missing|already/i.test(message) ? 'border-amber-400/30 bg-amber-400/5 text-amber-100' : 'border-emerald-400/30 bg-emerald-400/5 text-emerald-100')}><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />{message}</div> : null}
      <footer className="flex items-start gap-2 border-t border-cyan-400/15 bg-cyan-400/5 px-3 py-2 text-[8px] leading-relaxed text-cyan-100/80"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />Original Poietek workflow. No Tracktion code, names, media, presets, DSP or project formats are included.</footer>
    </div>
  );
};

const Metric: React.FC<{label: string; value: string}> = ({label, value}) => <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3"><span className="text-[7px] font-black uppercase text-slate-600">{label}</span><strong className="mt-1 block text-[9px] capitalize text-cyan-100">{value.replaceAll('_', ' ')}</strong></div>;

const ReadinessCard: React.FC<{title: string; state: string; detail: string}> = ({title, state, detail}) => <article className="rounded-lg border border-slate-800 bg-slate-900/70 p-3"><div className="flex items-start justify-between gap-2"><strong className="text-[9px] uppercase text-cyan-100">{title}</strong><span className={'rounded border px-1.5 py-0.5 text-[7px] uppercase ' + (state === 'ready' ? 'border-emerald-400/30 text-emerald-300' : 'border-amber-400/30 text-amber-200')}>{state.replaceAll('_', ' ')}</span></div><p className="mt-2 break-words text-[8px] leading-relaxed text-slate-500">{detail}</p></article>;
