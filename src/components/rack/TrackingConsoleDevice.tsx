import React, {useMemo, useState} from 'react';
import {
  AlertTriangle,
  Cable,
  CheckCircle2,
  CircleDot,
  Gauge,
  Guitar,
  Headphones,
  Mic2,
  RadioTower,
  RotateCcw,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Usb,
} from 'lucide-react';
import type {RackModuleItem} from '../../types';
import type {PoietekProject} from '../../poietek/domain/types';
import {
  buildTrackingRoutePlan,
  captureTrackingSnapshot,
  diffTrackingSnapshot,
  evaluateTrackingRouteReadiness,
  getProjectTrackingConsoleState,
  getTrackingConsoleReadiness,
  recallTrackingSnapshot,
  setTrackingStageEnabled,
  updateTrackingRoute,
  updateTrackingSourceControls,
  type TrackingConsoleMutation,
  type TrackingRoute,
  type TrackingSourceKind,
} from '../../poietek/tracking-workflows';

interface TrackingConsoleDeviceProps {
  module: RackModuleItem;
  onParametersChange(parameters: RackModuleItem['parameters']): void;
  project?: PoietekProject | null;
  projectBusy?: boolean;
  onInitializeTrackingConsole?(): Promise<void>;
  onMutateTrackingConsole?(mutation: TrackingConsoleMutation): Promise<void>;
}

type TrackingView = 'paths' | 'stages' | 'recall' | 'evidence';

const views = [
  {id: 'paths', label: 'Paths', icon: Cable},
  {id: 'stages', label: 'Stages', icon: SlidersHorizontal},
  {id: 'recall', label: 'Recall', icon: Save},
  {id: 'evidence', label: 'Evidence', icon: ShieldCheck},
] as const;

const sourceIcons: Readonly<Partial<Record<TrackingSourceKind, React.FC<{className?: string}>>>> = {
  microphone: Mic2,
  instrument: Guitar,
  usb_left: Usb,
  usb_right: Usb,
};

const stateLabel = (value: string) => value.replaceAll('_', ' ');

export const TrackingConsoleDevice: React.FC<TrackingConsoleDeviceProps> = ({
  module,
  onParametersChange,
  project = null,
  projectBusy = false,
  onInitializeTrackingConsole,
  onMutateTrackingConsole,
}) => {
  const parameters = module.parameters ?? {};
  const view = String(parameters.view ?? 'paths') as TrackingView;
  const selectedSnapshotId = String(parameters.snapshotId ?? 'tracking.snapshot.safe-start');
  const [actionState, setActionState] = useState<'idle' | 'saving'>('idle');
  const [notice, setNotice] = useState<{tone: 'ok' | 'warning'; text: string} | null>(null);
  const state = useMemo(() => project ? getProjectTrackingConsoleState(project) : null, [project]);
  const readiness = useMemo(() => getTrackingConsoleReadiness(), []);
  const busy = projectBusy || actionState !== 'idle';

  const updateView = (next: TrackingView) => onParametersChange({...parameters, view: next});
  const selectSnapshot = (snapshotId: string) => onParametersChange({...parameters, snapshotId});

  const run = async (action: () => Promise<void>, success: string) => {
    if (busy) return;
    setActionState('saving');
    setNotice(null);
    try {
      await action();
      setNotice({tone: 'ok', text: success});
    } catch (reason) {
      setNotice({tone: 'warning', text: reason instanceof Error ? reason.message : String(reason)});
    } finally {
      setActionState('idle');
    }
  };

  const mutate = (
    mutation: TrackingConsoleMutation,
    success: string,
  ) => run(async () => {
    if (!onMutateTrackingConsole) throw new Error('The canonical project session is unavailable.');
    await onMutateTrackingConsole(mutation);
  }, success);

  const initialize = () => run(async () => {
    if (!onInitializeTrackingConsole) throw new Error('The canonical project session is unavailable.');
    await onInitializeTrackingConsole();
  }, 'Tracking paths, two audio tracks, cue buses, and a safe-start snapshot were saved as one project change. No input was opened.');

  const selectedSnapshot = state?.snapshots.find((snapshot) => snapshot.id === selectedSnapshotId)
    ?? state?.snapshots[0]
    ?? null;
  const snapshotDiff = state && selectedSnapshot
    ? diffTrackingSnapshot(state, selectedSnapshot.id)
    : null;

  return (
    <div className="poietek-workbench-device overflow-hidden rounded-xl border border-orange-300/35 bg-[#160d08] text-stone-100 shadow-inner">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-orange-300/20 bg-gradient-to-r from-[#351608] via-[#15100d] to-[#24130f] px-3 py-2">
        <div className="flex items-center gap-2">
          <RadioTower className="h-4 w-4 text-orange-200" />
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.15em] text-orange-100">Tracking Console & Capture Paths</div>
            <div className="text-[9px] text-stone-400">Source → monitor → cue → clean or processed record intent</div>
          </div>
        </div>
        <span className="rounded-full border border-amber-400/45 bg-amber-400/10 px-2 py-1 text-[8px] font-black uppercase text-amber-200">Project-owned · evidence gated</span>
      </header>

      <nav className="grid grid-cols-4 border-b border-stone-700/80" aria-label="Tracking Console views">
        {views.map((item) => {
          const Icon = item.icon;
          return <button key={item.id} type="button" aria-pressed={view === item.id} onClick={() => updateView(item.id)} className={`flex min-h-11 items-center justify-center gap-1 border-r border-stone-700/60 px-1 py-2 text-[8px] font-black uppercase last:border-r-0 ${view === item.id ? 'bg-orange-300 text-stone-950' : 'bg-stone-950/70 text-stone-400 hover:bg-stone-800'}`}><Icon className="h-3 w-3" />{item.label}</button>;
        })}
      </nav>

      {!project && <section className="p-3"><div className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-[9px] text-amber-100">The canonical local project is still starting. Tracking paths cannot be saved yet.</div></section>}

      {project && !state && <section className="space-y-3 p-3" aria-label="Create Tracking Console">
        <div className="rounded-lg border border-orange-300/25 bg-orange-300/5 p-3">
          <strong className="text-[10px] uppercase text-orange-100">Build a safe tracking foundation</strong>
          <p className="mt-2 text-[9px] leading-relaxed text-stone-400">Creates Mic, Instrument, USB-L and USB-R sources; two canonical audio tracks; artist and producer cues; separate audition and print stages; and a recallable safe-start snapshot.</p>
        </div>
        <button type="button" disabled={!onInitializeTrackingConsole || busy} onClick={() => void initialize()} className="min-h-11 w-full rounded border border-orange-300/45 bg-orange-300/10 px-3 py-2 text-[8px] font-black uppercase text-orange-100 disabled:cursor-not-allowed disabled:opacity-40">{actionState === 'saving' ? 'Saving project foundation…' : 'Create Tracking Console'}</button>
        <p className="text-[8px] text-stone-500">This creates control intent only. It does not open a microphone, change interface controls, start monitoring, record audio, or run a processor.</p>
      </section>}

      {project && state && view === 'paths' && <section className="space-y-3 p-3" aria-label="Tracking signal paths">
        <div className="grid gap-2 sm:grid-cols-3">
          <StatusCard label="Project revision" value={`r${state.revision}`} tone="orange" />
          <StatusCard label="Capture streams" value={`${state.runtimeObservations.reduce((count, item) => count + item.activeCaptureRouteIds.length, 0)} observed`} tone="amber" />
          <StatusCard label="Round-trip latency" value={state.runtimeObservations.some((item) => item.measuredRoundTripMs !== null) ? 'Measured by adapter' : 'Not measured'} tone="amber" />
        </div>
        <div className="space-y-2">
          {state.routes.map((route) => <RouteCard key={route.id} route={route} project={project} state={state} busy={busy} mutate={mutate} />)}
        </div>
        <p className="rounded border border-stone-700 bg-stone-950/70 p-2 text-[8px] leading-relaxed text-stone-500">“Arm” is a saved request, not a red recording light. “Processed” means the record-stage IDs are included in the route plan; it does not assert that audio was processed.</p>
      </section>}

      {project && state && view === 'stages' && <section className="space-y-3 p-3" aria-label="Tracking sources and processing stages">
        <div className="grid gap-2 sm:grid-cols-2">
          {state.sources.map((source) => {
            const Icon = sourceIcons[source.kind] ?? CircleDot;
            return <article key={source.id} className="rounded-lg border border-stone-700 bg-stone-950/75 p-3">
              <div className="flex items-start justify-between gap-2"><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-orange-200" /><div><strong className="block text-[9px] text-orange-100">{source.name}</strong><span className="text-[8px] text-stone-500">{stateLabel(source.kind)} · channel {source.inputChannel ?? 'unassigned'}</span></div></div><span className="text-[7px] uppercase text-amber-200">{source.endpointId ? 'endpoint saved' : 'endpoint needed'}</span></div>
              <div className="mt-2 grid grid-cols-2 gap-1 text-[8px]">
                <IntentPill label="48 V" value={source.inputControls.phantomPower} />
                <IntentPill label="Polarity" value={source.inputControls.polarity} />
                <IntentPill label="High-pass" value={source.inputControls.highPass} />
                <IntentPill label="Impedance" value={source.inputControls.impedance} />
              </div>
              {source.kind === 'microphone' && <button type="button" disabled={!onMutateTrackingConsole || busy} onClick={() => void mutate((current) => updateTrackingSourceControls(current, source.id, {phantomPower: source.inputControls.phantomPower === 'on' ? 'off' : 'on'}), 'Phantom-power request updated in project history. Hardware has not been changed.')} className="mt-2 min-h-9 w-full rounded border border-stone-600 bg-stone-900 px-2 text-[8px] font-bold text-stone-300 disabled:opacity-40">Request 48 V {source.inputControls.phantomPower === 'on' ? 'off' : 'on'}</button>}
            </article>;
          })}
        </div>
        <div className="overflow-hidden rounded-lg border border-stone-700">
          {state.stages.map((stage) => <div key={stage.id} className="grid min-h-12 grid-cols-[1fr_auto_auto] items-center gap-2 border-b border-stone-800 bg-stone-950/70 px-3 py-2 text-[8px] last:border-b-0"><div><strong className="block text-orange-100">{stage.name}</strong><span className="text-stone-500">{stage.placement} · {stateLabel(stage.kind)} · {stateLabel(stage.execution)}</span></div><span className={stage.enabled ? 'text-emerald-300' : 'text-stone-600'}>{stage.enabled ? 'Planned' : 'Bypassed'}</span><button type="button" disabled={!onMutateTrackingConsole || busy} onClick={() => void mutate((current) => setTrackingStageEnabled(current, stage.id, !stage.enabled), `${stage.name} ${stage.enabled ? 'bypassed' : 'included'} in the routing plan. Processor execution remains unclaimed.`)} className="min-h-9 rounded border border-stone-600 bg-stone-900 px-2 font-bold text-stone-300 disabled:opacity-40">{stage.enabled ? 'Bypass' : 'Include'}</button></div>)}
        </div>
        <div className="flex gap-2 rounded border border-amber-400/25 bg-amber-400/5 p-2 text-[8px] text-amber-100"><AlertTriangle className="h-3 w-3 shrink-0" />Input switches are requests only. A reviewed device adapter must confirm controllability and returned state before Poietek says they were applied.</div>
      </section>}

      {project && state && view === 'recall' && <section className="space-y-3 p-3" aria-label="Tracking setup recall">
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <label className="text-[8px] font-black uppercase text-stone-400">Saved setup
            <select value={selectedSnapshot?.id ?? ''} onChange={(event) => selectSnapshot(event.target.value)} className="mt-1 min-h-11 w-full rounded border border-stone-600 bg-stone-950 px-2 text-[9px] normal-case text-stone-100">
              {state.snapshots.map((snapshot) => <option key={snapshot.id} value={snapshot.id}>{snapshot.name}</option>)}
            </select>
          </label>
          <button type="button" disabled={!onMutateTrackingConsole || busy} onClick={() => void mutate((current) => captureTrackingSnapshot(current, `tracking.snapshot.${Date.now()}`, `Capture setup ${current.snapshots.length + 1}`), 'Current routing intent saved as a new project snapshot. Runtime observations were intentionally excluded.')} className="min-h-11 self-end rounded border border-orange-300/45 bg-orange-300/10 px-3 text-[8px] font-black uppercase text-orange-100 disabled:opacity-40"><Save className="mr-1 inline h-3 w-3" />Capture setup</button>
        </div>
        {selectedSnapshot && snapshotDiff && <div className="rounded-lg border border-stone-700 bg-stone-950/75 p-3">
          <div className="flex items-center justify-between gap-2"><strong className="text-[9px] uppercase text-orange-100">Recall preview</strong><span className={snapshotDiff.hasChanges ? 'text-amber-200' : 'text-emerald-300'}>{snapshotDiff.hasChanges ? 'Changes found' : 'Already matched'}</span></div>
          <div className="mt-2 grid grid-cols-4 gap-1 text-center text-[8px]"><Count label="Sources" value={snapshotDiff.changedSourceIds.length} /><Count label="Stages" value={snapshotDiff.changedStageIds.length} /><Count label="Cues" value={snapshotDiff.changedCueBusIds.length} /><Count label="Routes" value={snapshotDiff.changedRouteIds.length} /></div>
          <p className="mt-2 text-[8px] text-stone-500">{snapshotDiff.claim}</p>
        </div>}
        <button type="button" disabled={!selectedSnapshot || !snapshotDiff?.hasChanges || !onMutateTrackingConsole || busy} onClick={() => selectedSnapshot && void mutate((current) => recallTrackingSnapshot(current, selectedSnapshot.id), 'Saved routing intent recalled as one undoable project change. Adapter observations were preserved, not replayed.')} className="min-h-11 w-full rounded border border-orange-300/45 bg-orange-300/10 px-3 text-[8px] font-black uppercase text-orange-100 disabled:cursor-not-allowed disabled:opacity-40"><RotateCcw className="mr-1 inline h-3 w-3" />Recall selected setup</button>
        <p className="text-[8px] text-stone-500">Snapshots store sources, stages, cue buses, and routes. Active streams, measured latency, and hardware observations are explicitly excluded.</p>
      </section>}

      {project && state && view === 'evidence' && <section className="space-y-3 p-3" aria-label="Tracking runtime evidence">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <EvidenceCard label="Project model" value={readiness.projectModel} ready />
          <EvidenceCard label="Clean / processed plans" value={readiness.processedRecordPlanning} ready />
          <EvidenceCard label="Setup recall" value={readiness.snapshotRecall} ready />
          <EvidenceCard label="Active capture" value={readiness.activeCapture} />
          <EvidenceCard label="Processor execution" value={readiness.processorExecution} />
          <EvidenceCard label="Latency measurement" value={readiness.latencyMeasurement} />
        </div>
        <div className="overflow-hidden rounded-lg border border-stone-700">
          {state.routes.map((route) => {
            const report = evaluateTrackingRouteReadiness(state, route.id);
            const plan = buildTrackingRoutePlan(state, route.id);
            return <div key={route.id} className="border-b border-stone-800 bg-stone-950/75 p-3 last:border-b-0"><div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-[9px] text-orange-100">{route.name}</strong><span className={report.canClaimActiveCapture ? 'text-emerald-300' : 'text-amber-200'}>{report.canClaimActiveCapture ? 'Capture observed' : 'No active capture evidence'}</span></div><div className="mt-2 grid gap-1 text-[8px] sm:grid-cols-5"><EvidenceDatum label="Capture" value={report.capture} /><EvidenceDatum label="Monitor" value={report.monitoring} /><EvidenceDatum label="Print DSP" value={report.recordProcessing} /><EvidenceDatum label="Input control" value={report.inputControl} /><EvidenceDatum label="Latency" value={report.measuredRoundTripMs === null ? report.latency : `${report.measuredRoundTripMs} ms`} /></div><p className="mt-2 text-[8px] text-stone-500">{report.message} {plan.requirements.length} unresolved evidence requirement{plan.requirements.length === 1 ? '' : 's'}.</p></div>;
          })}
        </div>
        <p className="flex gap-2 rounded border border-stone-700 bg-stone-950 p-2 text-[8px] text-stone-500"><Gauge className="h-3 w-3 shrink-0 text-orange-200" />Poietek never derives device latency from a buffer setting or product name. Only an adapter’s measured round-trip value appears here.</p>
      </section>}

      {notice && <div className={`mx-3 mb-3 flex items-start gap-2 rounded border p-2 text-[8px] ${notice.tone === 'ok' ? 'border-emerald-400/25 bg-emerald-400/5 text-emerald-100' : 'border-amber-400/25 bg-amber-400/5 text-amber-100'}`} role="status">{notice.tone === 'ok' ? <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" /> : <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />}{notice.text}</div>}
      <footer className="flex items-center gap-2 border-t border-orange-300/20 bg-orange-300/5 px-3 py-2 text-[8px] text-orange-100/80"><ShieldCheck className="h-3 w-3 shrink-0" />Original Poietek workflow. No third-party DSP, preset, model, session format, artwork, or device-control code is included.</footer>
    </div>
  );
};

const RouteCard: React.FC<{
  route: TrackingRoute;
  project: PoietekProject;
  state: NonNullable<ReturnType<typeof getProjectTrackingConsoleState>>;
  busy: boolean;
  mutate(mutation: TrackingConsoleMutation, success: string): Promise<void>;
}> = ({route, project, state, busy, mutate}) => {
  const source = state.sources.find((candidate) => candidate.id === route.sourceId)!;
  const target = project.tracks.find((candidate) => candidate.id === route.targetTrackId);
  const plan = buildTrackingRoutePlan(state, route.id);
  const Icon = sourceIcons[source.kind] ?? CircleDot;
  return <article className="rounded-lg border border-stone-700 bg-stone-950/75 p-3">
    <div className="flex flex-wrap items-start justify-between gap-2"><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-orange-200" /><div><strong className="block text-[9px] text-orange-100">{route.name}</strong><span className="text-[8px] text-stone-500">{source.name} → {target?.name ?? 'Missing track'}</span></div></div><span className={`rounded-full border px-2 py-1 text-[7px] font-black uppercase ${route.captureIntent === 'armed' ? 'border-rose-400/40 bg-rose-400/10 text-rose-200' : 'border-stone-600 text-stone-500'}`}>{route.captureIntent === 'armed' ? 'Arm request' : 'Safe'}</span></div>
    <div className="mt-3 grid gap-1 text-[8px] sm:grid-cols-[1fr_auto_1fr] sm:items-stretch"><PathBlock title="Monitor path" lines={[route.monitorIntent ? 'Input monitoring requested' : 'Monitoring off', `${plan.monitorStageIds.length} audition stage${plan.monitorStageIds.length === 1 ? '' : 's'}`, `${route.cueSends.length} cue send${route.cueSends.length === 1 ? '' : 's'}`]} active={route.monitorIntent} /><div className="flex items-center justify-center text-stone-700">→</div><PathBlock title="Record path" lines={[route.recordMode === 'clean' ? 'Clean source requested' : 'Processed source requested', `${plan.recordStageIds.length} print stage${plan.recordStageIds.length === 1 ? '' : 's'}`, `Target: ${target?.name ?? 'missing'}`]} active={route.recordMode === 'processed'} /></div>
    <p className="mt-2 text-[8px] text-stone-500">{plan.claim}</p>
    <div className="mt-3 grid grid-cols-3 gap-1"><button type="button" disabled={busy} onClick={() => void mutate((current) => updateTrackingRoute(current, route.id, {captureIntent: route.captureIntent === 'armed' ? 'safe' : 'armed'}), `Capture ${route.captureIntent === 'armed' ? 'returned to safe' : 'arm requested'} for ${route.name}. No stream was started.`)} className="min-h-10 rounded border border-stone-600 bg-stone-900 px-1 text-[8px] font-bold text-stone-300 disabled:opacity-40">{route.captureIntent === 'armed' ? 'Make safe' : 'Request arm'}</button><button type="button" disabled={busy} onClick={() => void mutate((current) => updateTrackingRoute(current, route.id, {monitorIntent: !route.monitorIntent}), `Monitor intent ${route.monitorIntent ? 'disabled' : 'enabled'} for ${route.name}.`)} className="min-h-10 rounded border border-stone-600 bg-stone-900 px-1 text-[8px] font-bold text-stone-300 disabled:opacity-40">Monitor {route.monitorIntent ? 'off' : 'on'}</button><button type="button" disabled={busy} onClick={() => void mutate((current) => updateTrackingRoute(current, route.id, {recordMode: route.recordMode === 'clean' ? 'processed' : 'clean'}), `${route.name} now requests a ${route.recordMode === 'clean' ? 'processed' : 'clean'} record path.`)} className="min-h-10 rounded border border-stone-600 bg-stone-900 px-1 text-[8px] font-bold text-stone-300 disabled:opacity-40">Record {route.recordMode === 'clean' ? 'processed' : 'clean'}</button></div>
  </article>;
};

const PathBlock: React.FC<{title: string; lines: string[]; active: boolean}> = ({title, lines, active}) => <div className={`rounded border p-2 ${active ? 'border-orange-300/30 bg-orange-300/5' : 'border-stone-800 bg-stone-900/70'}`}><strong className={active ? 'text-orange-100' : 'text-stone-400'}>{title}</strong>{lines.map((line) => <span key={line} className="mt-1 block text-stone-500">{line}</span>)}</div>;
const StatusCard: React.FC<{label: string; value: string; tone: 'orange' | 'amber'}> = ({label, value, tone}) => <div className="rounded-lg border border-stone-700 bg-stone-950 p-2"><span className="block text-[7px] font-black uppercase text-stone-500">{label}</span><strong className={`mt-1 block truncate text-[9px] ${tone === 'orange' ? 'text-orange-200' : 'text-amber-200'}`}>{value}</strong></div>;
const IntentPill: React.FC<{label: string; value: string}> = ({label, value}) => <span className="rounded border border-stone-800 bg-stone-900 px-2 py-1 text-stone-500"><strong className="text-stone-300">{label}</strong> · {value}</span>;
const Count: React.FC<{label: string; value: number}> = ({label, value}) => <span className="rounded border border-stone-800 bg-stone-900 p-2 text-stone-500"><strong className="block text-orange-100">{value}</strong>{label}</span>;
const EvidenceCard: React.FC<{label: string; value: string; ready?: boolean}> = ({label, value, ready = false}) => <div className="rounded-lg border border-stone-700 bg-stone-950 p-2"><span className="block text-[7px] font-black uppercase text-stone-500">{label}</span><strong className={`mt-1 block text-[9px] ${ready ? 'text-emerald-300' : 'text-amber-200'}`}>{stateLabel(value)}</strong></div>;
const EvidenceDatum: React.FC<{label: string; value: string}> = ({label, value}) => <span className="rounded border border-stone-800 bg-stone-900 p-2 text-stone-500"><strong className="block text-stone-300">{label}</strong>{stateLabel(value)}</span>;
