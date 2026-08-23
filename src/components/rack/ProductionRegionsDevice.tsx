import React, {useMemo, useState} from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Copy,
  History,
  Layers3,
  Map,
  MoveRight,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import type {PoietekProject} from '../../poietek/domain/types';
import {
  buildProductionRegionActionPlan,
  evaluateProductionRegionReadiness,
  getProjectProductionRegionState,
  type CaptureProductionRegionInput,
  type ProductionRegionAction,
} from '../../poietek/region-workflows';
import type {RackModuleItem} from '../../types';

type RegionView = 'regions' | 'plan' | 'history' | 'readiness';

interface ProductionRegionsDeviceProps {
  module: RackModuleItem;
  onParametersChange(parameters: RackModuleItem['parameters']): void;
  project: PoietekProject | null;
  projectBusy?: boolean;
  onInitializeProductionRegions?(): Promise<void>;
  onCaptureProductionRegion?(input: CaptureProductionRegionInput): Promise<void>;
  onApplyProductionRegionAction?(
    regionId: string,
    action: ProductionRegionAction,
    targetStartTick: number,
    operationId: string,
  ): Promise<void>;
}

const views: readonly {id: RegionView; label: string; icon: React.ComponentType<{className?: string}>}[] = [
  {id: 'regions', label: 'Regions', icon: Layers3},
  {id: 'plan', label: 'Plan', icon: Map},
  {id: 'history', label: 'History', icon: History},
  {id: 'readiness', label: 'Readiness', icon: ShieldCheck},
];

function barLabel(ppq: number, tick: number): string {
  const barLength = ppq * 4;
  return `Bar ${Math.floor(tick / barLength) + 1} · tick ${tick % barLength}`;
}

export const ProductionRegionsDevice: React.FC<ProductionRegionsDeviceProps> = ({
  module,
  onParametersChange,
  project,
  projectBusy = false,
  onInitializeProductionRegions,
  onCaptureProductionRegion,
  onApplyProductionRegionAction,
}) => {
  const view = (module.parameters?.view as RegionView | undefined) ?? 'regions';
  const action = (module.parameters?.action as ProductionRegionAction | undefined) ?? 'copy';
  const [message, setMessage] = useState<string | null>(null);
  const [captureName, setCaptureName] = useState('New section');
  const [captureStartBar, setCaptureStartBar] = useState(1);
  const [captureDurationBars, setCaptureDurationBars] = useState(2);

  const workflow = useMemo(() => {
    if (!project) return {state: null, error: 'The canonical project is still starting.'};
    try {
      return {state: getProjectProductionRegionState(project), error: null};
    } catch (error) {
      return {state: null, error: error instanceof Error ? error.message : 'Production Regions state is malformed.'};
    }
  }, [project]);
  const state = workflow.state;
  const selectedRegionId = (module.parameters?.selectedRegionId as string | undefined) ?? state?.regions[0]?.id ?? null;
  const selectedRegion = state?.regions.find((region) => region.id === selectedRegionId) ?? state?.regions[0] ?? null;
  const barLength = project ? project.settings.ppq * 4 : 3840;
  const arrangementEndBar = state?.regions.length
    ? Math.ceil(Math.max(...state.regions.map((region) => region.startTick + region.durationTicks)) / barLength) + 1
    : 1;
  const targetBar = Number(module.parameters?.targetBar ?? arrangementEndBar);
  const targetStartTick = Math.max(0, Math.round(targetBar - 1) * barLength);

  const preview = useMemo(() => {
    if (!project || !state || !selectedRegion) return {plan: null, error: null};
    try {
      return {
        plan: buildProductionRegionActionPlan(
          project,
          state,
          selectedRegion.id,
          action,
          targetStartTick,
          `preview.${state.revision + 1}`,
        ),
        error: null,
      };
    } catch (error) {
      return {plan: null, error: error instanceof Error ? error.message : 'The region action cannot be planned.'};
    }
  }, [action, project, selectedRegion, state, targetStartTick]);
  const readiness = evaluateProductionRegionReadiness();

  const patchParameters = (patch: Record<string, number | boolean | string>) => {
    onParametersChange({...module.parameters, ...patch});
  };
  const run = async (operation: () => Promise<void>, success: string) => {
    setMessage(null);
    try {
      await operation();
      setMessage(success);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The Production Regions change could not be completed.');
    }
  };
  const captureCurrentRange = () => {
    if (!onCaptureProductionRegion || !state) return;
    const ordinal = state.revision + 1;
    void run(() => onCaptureProductionRegion({
      id: `production-region.custom.${ordinal}`,
      name: captureName,
      color: '#34d399',
      startTick: Math.max(0, Math.round(captureStartBar - 1) * barLength),
      durationTicks: Math.max(1, Math.round(captureDurationBars) * barLength),
      includeAudioTracks: true,
      includeArrangementLanes: true,
      includeAutomation: true,
    }), 'The selected clips and automation were captured as a project-owned production region.');
  };
  const applyPlan = () => {
    if (!onApplyProductionRegionAction || !state || !selectedRegion || !preview.plan) return;
    const operationId = `region.${state.revision + 1}`;
    void run(() => onApplyProductionRegionAction(
      selectedRegion.id,
      action,
      targetStartTick,
      operationId,
    ), `${selectedRegion.name} was ${action === 'copy' ? 'copied' : 'moved'} as one undoable project change.`);
  };

  return (
    <div data-poietek-production-regions className="overflow-hidden rounded-xl border border-emerald-400/25 bg-slate-950 text-slate-100 shadow-[inset_0_0_48px_rgba(52,211,153,0.06)]">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-400/20 bg-gradient-to-r from-emerald-950/60 via-slate-950 to-cyan-950/40 px-3 py-3">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200"><Layers3 className="h-4 w-4" />Production Regions</div>
          <p className="mt-1 text-[8px] text-slate-400">Whole-section clip groups · included automation · safe preview · atomic move and copy</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-[8px]">
          <span className="rounded border border-emerald-400/30 bg-emerald-400/5 px-2 py-1 text-emerald-200">Canonical project model</span>
          <span className="rounded border border-cyan-400/30 bg-cyan-400/5 px-2 py-1 text-cyan-100">Local and undoable</span>
        </div>
      </header>

      <nav className="grid grid-cols-4 border-b border-slate-800" aria-label="Production Regions sections">
        {views.map((item) => {
          const Icon = item.icon;
          return <button key={item.id} type="button" onClick={() => patchParameters({view: item.id})} className={'min-h-11 border-r border-slate-800 px-1 py-2 text-[7px] font-black uppercase transition last:border-r-0 sm:px-2 sm:text-[8px] ' + (view === item.id ? 'bg-emerald-400/10 text-emerald-200' : 'text-slate-500 hover:bg-slate-900 hover:text-slate-200')}><Icon className="mx-auto mb-1 h-3.5 w-3.5" />{item.label}</button>;
        })}
      </nav>

      {workflow.error ? <div className="m-3 flex items-start gap-2 rounded border border-amber-400/30 bg-amber-400/5 p-3 text-[9px] text-amber-100"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{workflow.error}</div> : null}

      {!state && project ? <section className="p-3">
        <div className="rounded-xl border border-dashed border-emerald-400/35 bg-emerald-400/5 p-5 text-center">
          <Layers3 className="mx-auto h-6 w-6 text-emerald-300" />
          <strong className="mt-2 block text-[10px] text-emerald-100">Create an original production-region map</strong>
          <p className="mx-auto mt-1 max-w-xl text-[8px] leading-relaxed text-slate-500">Adds three sections, six original pattern clips, two arrangement lanes and a six-point energy envelope to the canonical local project.</p>
          <button type="button" disabled={projectBusy || !onInitializeProductionRegions} onClick={() => void run(() => onInitializeProductionRegions!(), 'The starter region map was saved as one undoable project change.')} className="mt-3 min-h-11 rounded-lg border border-emerald-300/40 bg-emerald-400/10 px-4 text-[8px] font-black uppercase text-emerald-100 disabled:opacity-40"><Plus className="mr-1 inline h-3.5 w-3.5" />Create starter regions</button>
        </div>
      </section> : null}

      {state ? <>
        <section className="grid gap-2 border-b border-slate-800 bg-slate-900/50 p-3 sm:grid-cols-[minmax(0,1fr)_8rem_8rem]">
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-2"><span className="text-[7px] font-black uppercase text-slate-500">Selected section</span><strong className="mt-1 block text-[9px] text-emerald-100">{selectedRegion?.name ?? 'Choose a region'}</strong><span className="text-[7px] text-slate-600">{selectedRegion ? `${barLabel(project!.settings.ppq, selectedRegion.startTick)} · ${selectedRegion.members.length} members` : 'No region selected'}</span></div>
          <label className="rounded-lg border border-slate-800 bg-slate-950 p-2 text-[7px] font-black uppercase text-slate-500">Action<select aria-label="Production region action" value={action} onChange={(event) => patchParameters({action: event.target.value})} className="mt-1 min-h-8 w-full bg-slate-950 text-[9px] text-cyan-100 outline-none"><option value="copy">Copy</option><option value="move">Move</option></select></label>
          <label className="rounded-lg border border-slate-800 bg-slate-950 p-2 text-[7px] font-black uppercase text-slate-500">Target bar<input aria-label="Production region target bar" type="number" min="1" step="1" value={targetBar} onChange={(event) => patchParameters({targetBar: Math.max(1, Math.round(Number(event.target.value) || 1))})} className="mt-1 min-h-8 w-full bg-slate-950 text-[9px] text-cyan-100 outline-none" /></label>
        </section>

        {view === 'regions' ? <section className="space-y-3 p-3">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{state.regions.map((region) => {
            const active = region.id === selectedRegion?.id;
            const audioCount = region.members.filter((member) => member.kind === 'audio_clip').length;
            const arrangementCount = region.members.filter((member) => member.kind === 'arrangement_clip').length;
            const automationCount = region.members.filter((member) => member.kind === 'automation_point').length;
            return <button key={region.id} type="button" aria-pressed={active} onClick={() => patchParameters({selectedRegionId: region.id})} className={'min-h-24 rounded-xl border p-3 text-left transition ' + (active ? 'border-emerald-300 bg-emerald-400/10' : 'border-slate-800 bg-slate-900/70 hover:border-emerald-500/50')}><span className="block h-1 rounded-full" style={{backgroundColor: region.color}} /><strong className="mt-2 block text-[10px] text-slate-100">{region.name}</strong><span className="mt-1 block text-[8px] text-cyan-200">{barLabel(project!.settings.ppq, region.startTick)} · {region.durationTicks / barLength} bars</span><span className="mt-2 block text-[7px] text-slate-500">{audioCount} audio · {arrangementCount} arranged · {automationCount} automation</span></button>;
          })}</div>
          <div className="grid gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-3 sm:grid-cols-[1fr_7rem_7rem_auto]">
            <label className="text-[7px] font-black uppercase text-slate-500">Name<input aria-label="New production region name" value={captureName} onChange={(event) => setCaptureName(event.target.value)} className="mt-1 min-h-9 w-full rounded border border-slate-700 bg-slate-950 px-2 text-[9px] normal-case text-slate-100" /></label>
            <label className="text-[7px] font-black uppercase text-slate-500">Start bar<input aria-label="New production region start bar" type="number" min="1" step="1" value={captureStartBar} onChange={(event) => setCaptureStartBar(Math.max(1, Number(event.target.value) || 1))} className="mt-1 min-h-9 w-full rounded border border-slate-700 bg-slate-950 px-2 text-[9px] text-slate-100" /></label>
            <label className="text-[7px] font-black uppercase text-slate-500">Bars<input aria-label="New production region duration bars" type="number" min="1" step="1" value={captureDurationBars} onChange={(event) => setCaptureDurationBars(Math.max(1, Number(event.target.value) || 1))} className="mt-1 min-h-9 w-full rounded border border-slate-700 bg-slate-950 px-2 text-[9px] text-slate-100" /></label>
            <button type="button" disabled={projectBusy || !onCaptureProductionRegion || !captureName.trim()} onClick={captureCurrentRange} className="min-h-11 self-end rounded-lg border border-cyan-400/30 bg-cyan-400/5 px-3 text-[7px] font-black uppercase text-cyan-100 disabled:opacity-40"><Plus className="mr-1 inline h-3.5 w-3.5" />Capture range</button>
          </div>
          <p className="text-[7px] leading-relaxed text-slate-600">A region accepts only clips fully inside its boundary. If a boundary cuts through material, capture stops and identifies the conflicting clip.</p>
        </section> : null}

        {view === 'plan' ? <section className="space-y-3 p-3">
          <div className="grid gap-2 sm:grid-cols-3"><Metric label="Action" value={action} /><Metric label="Destination" value={`Bar ${targetBar}`} /><Metric label="Members" value={String(preview.plan?.entries.length ?? 0)} /></div>
          {preview.plan ? <div className="space-y-1">{preview.plan.entries.map((entry, index) => <article key={`${entry.kind}:${entry.containerId}:${entry.sourceItemId ?? entry.sourceTick}:${index}`} className="grid items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/70 p-2 text-[8px] sm:grid-cols-[8rem_1fr_auto_1fr]"><span className="font-black uppercase text-emerald-300">{entry.kind.replaceAll('_', ' ')}</span><span className="truncate text-slate-400">{entry.sourceItemId ?? `${entry.containerId}:${entry.sourceTick}`}</span><ArrowRight className="hidden h-4 w-4 text-cyan-500 sm:block" /><span className="font-mono text-cyan-100">tick {entry.sourceTick} → {entry.targetTick}</span></article>)}</div> : <div className="flex items-start gap-2 rounded-lg border border-amber-400/25 bg-amber-400/5 p-3 text-[8px] text-amber-100"><AlertTriangle className="h-4 w-4 shrink-0" />{preview.error ?? 'Select a region and destination to build a plan.'}</div>}
          <button type="button" disabled={projectBusy || !onApplyProductionRegionAction || !preview.plan} onClick={applyPlan} className="min-h-11 w-full rounded-lg border border-emerald-400/35 bg-emerald-400/10 text-[8px] font-black uppercase text-emerald-100 disabled:opacity-40">{action === 'copy' ? <Copy className="mr-1 inline h-3.5 w-3.5" /> : <MoveRight className="mr-1 inline h-3.5 w-3.5" />}Apply {action} as one project change</button>
          <p className="text-[7px] leading-relaxed text-slate-600">The preview is pure. Apply updates canonical clip positions or creates new clip identities, carries selected automation, saves locally and contributes one project undo point.</p>
        </section> : null}

        {view === 'history' ? <section className="space-y-2 p-3">
          {state.operationHistory.length ? [...state.operationHistory].reverse().map((operation) => <article key={operation.id} className="grid gap-2 rounded-lg border border-slate-800 bg-slate-900/70 p-3 text-[8px] sm:grid-cols-[7rem_1fr_8rem]"><span className="font-black uppercase text-emerald-300">{operation.action}</span><span className="text-slate-300">{operation.regionId} → {operation.resultRegionId}<small className="mt-1 block text-slate-600">{operation.memberCount} members · delta {operation.deltaTicks} ticks</small></span><span className="font-mono text-cyan-100">tick {operation.targetStartTick}</span></article>) : <div className="rounded-xl border border-dashed border-slate-800 p-5 text-center text-[8px] text-slate-600">No region move or copy has been applied yet.</div>}
        </section> : null}

        {view === 'readiness' ? <section className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3">
          <ReadinessCard title="Local model" state={readiness.localModel} detail="Versioned project regions contain exact clip and automation references." />
          <ReadinessCard title="Range capture" state={readiness.capture} detail="Boundaries are validated and refuse to split canonical material." />
          <ReadinessCard title="Move and copy" state={readiness.moveAndCopy} detail="Plans are deterministic and automation collisions fail closed." />
          <ReadinessCard title="Atomic commit" state={readiness.atomicProjectCommit} detail="One region action becomes one local project undo point." />
          <ReadinessCard title="Audible playback" state={readiness.audiblePlayback} detail="Transport playback remains the responsibility of observed audio and pattern schedulers." />
          <ReadinessCard title="Native drag gesture" state={readiness.nativeDragGesture} detail="This workbench uses explicit plan and apply controls; native timeline dragging remains adapter work." />
        </section> : null}
      </> : null}

      {message ? <div role="status" className={'mx-3 mb-3 flex items-start gap-2 rounded border p-2 text-[8px] ' + (/could not|requires|invalid|missing|split|collision|already/i.test(message) ? 'border-amber-400/30 bg-amber-400/5 text-amber-100' : 'border-emerald-400/30 bg-emerald-400/5 text-emerald-100')}><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />{message}</div> : null}
      <footer className="flex items-start gap-2 border-t border-emerald-400/15 bg-emerald-400/5 px-3 py-2 text-[8px] leading-relaxed text-emerald-100/80"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />Original Poietek workflow. No Acoustica code, branding, interface artwork, presets, media, DSP or project formats are included.</footer>
    </div>
  );
};

const Metric: React.FC<{label: string; value: string}> = ({label, value}) => <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3"><span className="text-[7px] font-black uppercase text-slate-600">{label}</span><strong className="mt-1 block text-[9px] capitalize text-emerald-100">{value.replaceAll('_', ' ')}</strong></div>;

const ReadinessCard: React.FC<{title: string; state: string; detail: string}> = ({title, state, detail}) => <article className="rounded-lg border border-slate-800 bg-slate-900/70 p-3"><div className="flex items-start justify-between gap-2"><strong className="text-[9px] uppercase text-emerald-100">{title}</strong><span className={'rounded border px-1.5 py-0.5 text-[7px] uppercase ' + (state === 'ready' ? 'border-emerald-400/30 text-emerald-300' : 'border-amber-400/30 text-amber-200')}>{state.replaceAll('_', ' ')}</span></div><p className="mt-2 text-[8px] leading-relaxed text-slate-500">{detail}</p></article>;
