import React, {useEffect, useMemo, useState} from 'react';
import {
  Activity,
  AlertTriangle,
  Cable,
  CheckCircle2,
  Gauge,
  Grid3X3,
  Radio,
  RefreshCw,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Waves,
} from 'lucide-react';
import type {PoietekProject} from '../../poietek/domain/types';
import {
  createStarterMotionMatrix,
  evaluateModulationControlFrame,
  getProjectModulationWorkflowState,
  recallMotionScene,
  setMacroSourceValue,
  setModulationRouteEnabled,
  type ModulationSource,
  type ModulationWorkflowMutation,
  type ModulationWorkflowState,
} from '../../poietek/modulation-workflows';
import type {RackModuleItem} from '../../types';

type MotionView = 'modulators' | 'matrix' | 'scenes' | 'inspector';

interface MotionMatrixDeviceProps {
  module: RackModuleItem;
  onParametersChange(parameters: RackModuleItem['parameters']): void;
  project: PoietekProject | null;
  projectBusy?: boolean;
  onMutateModulationWorkflow?(mutation: ModulationWorkflowMutation): Promise<void>;
}

const tabs: readonly {id: MotionView; label: string; icon: React.ComponentType<{className?: string}>}[] = [
  {id: 'modulators', label: 'Modulators', icon: Waves},
  {id: 'matrix', label: 'Matrix', icon: Grid3X3},
  {id: 'scenes', label: 'Scenes', icon: Gauge},
  {id: 'inspector', label: 'Inspector', icon: ShieldCheck},
];

const percent = (value: number) => `${Math.round(value * 100)}%`;

function sourceDetail(source: ModulationSource): string {
  if (source.kind === 'macro') return `Value ${percent(source.value)}`;
  if (source.kind === 'lfo') return `${source.shape} · ${source.cyclesPerBar} cycle${source.cyclesPerBar === 1 ? '' : 's'}/bar`;
  if (source.kind === 'step') return `${source.values.length} project-owned steps`;
  if (source.kind === 'random') return `${source.stepsPerBar} seeded steps/bar`;
  return `Observed ${source.kind.replaceAll('_', ' ')} · ${source.requiredCapability}`;
}

function previewWithDraftMacros(
  state: ModulationWorkflowState,
  draftMacroValues: Readonly<Record<string, number>>,
): ModulationWorkflowState {
  return {
    ...state,
    sources: state.sources.map((source) => source.kind === 'macro' && draftMacroValues[source.id] !== undefined
      ? {...source, value: draftMacroValues[source.id]}
      : source),
  };
}

export const MotionMatrixDevice: React.FC<MotionMatrixDeviceProps> = ({
  module,
  onParametersChange,
  project,
  projectBusy = false,
  onMutateModulationWorkflow,
}) => {
  const view = (module.parameters?.view as MotionView | undefined) ?? 'modulators';
  const [phase, setPhase] = useState(0.125);
  const [message, setMessage] = useState<string | null>(null);
  const [draftMacroValues, setDraftMacroValues] = useState<Record<string, number>>({});

  const workflowResult = useMemo(() => {
    if (!project) return {state: null, error: 'The canonical project is still starting.'};
    try {
      return {state: getProjectModulationWorkflowState(project), error: null};
    } catch (error) {
      return {state: null, error: error instanceof Error ? error.message : 'Motion Matrix state is malformed.'};
    }
  }, [project]);
  const state = workflowResult.state;

  useEffect(() => {
    if (!state) {
      setDraftMacroValues({});
      return;
    }
    setDraftMacroValues(Object.fromEntries(
      state.sources.filter((source) => source.kind === 'macro').map((source) => [source.id, source.value]),
    ));
  }, [state]);

  const previewState = useMemo(
    () => state ? previewWithDraftMacros(state, draftMacroValues) : null,
    [draftMacroValues, state],
  );
  const frame = useMemo(
    () => previewState ? evaluateModulationControlFrame(previewState, phase, [], project ?? undefined) : null,
    [phase, previewState, project],
  );

  const setView = (next: MotionView) => onParametersChange({...module.parameters, view: next});
  const run = async (operation: () => Promise<void>, success: string) => {
    setMessage(null);
    try {
      await operation();
      setMessage(success);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The Motion Matrix change could not be completed.');
    }
  };

  const installStarter = () => {
    if (!project || !onMutateModulationWorkflow) return;
    void run(
      () => onMutateModulationWorkflow((current) => createStarterMotionMatrix(current.projectId)),
      'The original starter Motion Matrix was saved in the canonical project.',
    );
  };

  const saveMacros = () => {
    if (!onMutateModulationWorkflow) return;
    void run(
      () => onMutateModulationWorkflow((current) => Object.keys(draftMacroValues).reduce(
        (next, sourceId) => setMacroSourceValue(next, sourceId, draftMacroValues[sourceId]),
        current,
      )),
      'Macro controls were saved as one undoable project change.',
    );
  };

  const toggleRoute = (routeId: string, enabled: boolean) => {
    if (!onMutateModulationWorkflow) return;
    void run(
      () => onMutateModulationWorkflow((current) => setModulationRouteEnabled(current, routeId, enabled)),
      `Route ${enabled ? 'enabled' : 'disabled'} in the canonical project.`,
    );
  };

  const recallScene = (sceneId: string, sceneName: string) => {
    if (!onMutateModulationWorkflow) return;
    void run(
      () => onMutateModulationWorkflow((current) => recallMotionScene(current, sceneId)),
      `${sceneName} recalled as one undoable macro change.`,
    );
  };

  return (
    <div data-poietek-motion-matrix className="overflow-hidden rounded-xl border border-fuchsia-400/25 bg-slate-950 text-slate-100 shadow-[inset_0_0_42px_rgba(217,70,239,0.08)]">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-fuchsia-400/20 bg-gradient-to-r from-fuchsia-950/60 via-slate-950 to-cyan-950/60 px-3 py-3">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-fuchsia-200"><Activity className="h-4 w-4" />Motion Matrix</div>
          <p className="mt-1 text-[8px] text-slate-400">Typed modulation · deterministic frames · project-owned macro scenes</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-[8px]">
          <span className="rounded border border-emerald-400/30 bg-emerald-400/5 px-2 py-1 text-emerald-200">Local control model</span>
          <span className="rounded border border-amber-400/30 bg-amber-400/5 px-2 py-1 text-amber-100">DSP delivery gated</span>
        </div>
      </header>

      <nav className="grid grid-cols-4 border-b border-slate-800" aria-label="Motion Matrix sections">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return <button key={tab.id} type="button" onClick={() => setView(tab.id)} className={`min-h-11 border-r border-slate-800 px-1 py-2 text-[7px] font-black uppercase transition last:border-r-0 sm:px-2 sm:text-[8px] ${view === tab.id ? 'bg-fuchsia-400/10 text-fuchsia-200' : 'text-slate-500 hover:bg-slate-900 hover:text-slate-200'}`}><Icon className="mx-auto mb-1 h-3.5 w-3.5" />{tab.label}</button>;
        })}
      </nav>

      {workflowResult.error ? <div className="m-3 flex items-start gap-2 rounded border border-amber-400/30 bg-amber-400/5 p-3 text-[9px] text-amber-100"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{workflowResult.error}</div> : null}

      {!state && project ? <section className="p-3">
        <div className="rounded-xl border border-dashed border-fuchsia-400/35 bg-fuchsia-400/5 p-5 text-center">
          <Waves className="mx-auto h-6 w-6 text-fuchsia-300" />
          <strong className="mt-2 block text-[10px] text-fuchsia-100">Start with an original motion patch</strong>
          <p className="mx-auto mt-1 max-w-lg text-[8px] leading-relaxed text-slate-500">Adds a macro, LFO, step lane, seeded motion, evidence-gated expression source, typed routes and three recall scenes. It produces control previews only.</p>
          <button type="button" disabled={projectBusy || !onMutateModulationWorkflow} onClick={installStarter} className="mt-3 min-h-11 rounded-lg border border-fuchsia-300/40 bg-fuchsia-400/10 px-4 text-[8px] font-black uppercase text-fuchsia-100 disabled:opacity-40"><RefreshCw className="mr-1 inline h-3.5 w-3.5" />Create starter matrix</button>
        </div>
      </section> : null}

      {state ? <>
        <section className="grid gap-2 border-b border-slate-800 bg-slate-900/50 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(11rem,0.45fr)]">
          <label className="block rounded-lg border border-slate-800 bg-slate-950 p-2 text-[8px] text-slate-400">
            <span className="flex justify-between"><b className="uppercase text-slate-300">Preview phase</b><span className="font-mono text-fuchsia-200">{percent(phase)}</span></span>
            <input type="range" aria-label="Motion preview phase" min="0" max="1" step="0.001" value={phase} onChange={(event) => setPhase(Number(event.target.value))} className="mt-2 w-full accent-fuchsia-400" />
          </label>
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-2"><span className="text-[7px] font-black uppercase text-slate-500">Control frame</span><strong className="mt-1 block text-[9px] text-cyan-200">{frame?.targets.length ?? 0} targets · {frame?.sources.filter((source) => source.status === 'ready').length ?? 0} ready sources</strong><span className="mt-1 block text-[7px] text-slate-600">Bar-relative, deterministic preview</span></div>
        </section>

        {view === 'modulators' ? <section className="space-y-3 p-3">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {state.sources.map((source) => {
              const evaluated = frame?.sources.find((candidate) => candidate.sourceId === source.id);
              return <article key={source.id} className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                <div className="flex items-start justify-between gap-2"><div><strong className="block text-[9px] text-fuchsia-100">{source.name}</strong><span className="mt-0.5 block text-[7px] uppercase text-slate-500">{source.kind.replaceAll('_', ' ')} · {source.range}</span></div><span className={`rounded border px-1.5 py-0.5 text-[7px] uppercase ${evaluated?.status === 'ready' ? 'border-emerald-400/30 text-emerald-300' : 'border-amber-400/30 text-amber-200'}`}>{evaluated?.status.replaceAll('_', ' ') ?? 'waiting'}</span></div>
                <p className="mt-2 text-[8px] text-slate-400">{sourceDetail(source)}</p>
                {source.kind === 'macro' ? <label className="mt-3 block text-[7px] uppercase text-slate-500"><span className="flex justify-between"><span>Draft value</span><b className="text-fuchsia-200">{percent(draftMacroValues[source.id] ?? source.value)}</b></span><input type="range" aria-label={`${source.name} macro value`} min="0" max="1" step="0.01" value={draftMacroValues[source.id] ?? source.value} onChange={(event) => setDraftMacroValues((current) => ({...current, [source.id]: Number(event.target.value)}))} className="mt-2 w-full accent-fuchsia-400" /></label> : null}
                {source.kind === 'step' ? <div className="mt-3 grid grid-cols-8 gap-1" aria-label={`${source.name} values`}>{source.values.map((value, index) => <span key={`${source.id}:${index}`} title={`${index + 1}: ${percent(value)}`} className="rounded-sm bg-cyan-400/20" style={{height: `${Math.max(4, value * 28)}px`, alignSelf: 'end'}} />)}</div> : null}
                <p className="mt-2 text-[7px] leading-relaxed text-slate-600">{evaluated?.note}</p>
              </article>;
            })}
          </div>
          <button type="button" disabled={projectBusy || !onMutateModulationWorkflow || !Object.keys(draftMacroValues).length} onClick={saveMacros} className="min-h-11 w-full rounded-lg border border-fuchsia-300/40 bg-fuchsia-400/10 text-[8px] font-black uppercase text-fuchsia-100 disabled:opacity-40"><Save className="mr-1 inline h-3.5 w-3.5" />Save macro controls as one project change</button>
        </section> : null}

        {view === 'matrix' ? <section className="space-y-2 p-3">
          {state.routes.map((route) => {
            const source = state.sources.find((candidate) => candidate.id === route.sourceId);
            const target = state.targets.find((candidate) => candidate.id === route.targetId);
            return <article key={route.id} className="grid items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/70 p-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto]">
              <div><span className="text-[7px] uppercase text-slate-600">Source</span><strong className="block text-[9px] text-fuchsia-100">{source?.name}</strong></div>
              <Cable className="hidden h-4 w-4 text-cyan-400 sm:block" />
              <div><span className="text-[7px] uppercase text-slate-600">Target</span><strong className="block text-[9px] text-cyan-100">{target?.name}</strong><span className="text-[7px] text-slate-500">{route.amount >= 0 ? '+' : ''}{route.amount.toFixed(2)} · {route.inputMode} · {route.curve.replaceAll('_', ' ')}</span></div>
              <button type="button" aria-pressed={route.enabled} disabled={projectBusy || !onMutateModulationWorkflow} onClick={() => toggleRoute(route.id, !route.enabled)} className={`min-h-11 min-w-20 rounded border px-2 text-[7px] font-black uppercase disabled:opacity-40 ${route.enabled ? 'border-emerald-400/35 bg-emerald-400/10 text-emerald-200' : 'border-slate-700 text-slate-500'}`}>{route.enabled ? 'Enabled' : 'Disabled'}</button>
            </article>;
          })}
          <div className="flex items-start gap-2 rounded-lg border border-cyan-400/20 bg-cyan-400/5 p-2 text-[8px] leading-relaxed text-cyan-100"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />Routes only connect declared source and target IDs. Values are range-clamped, seeded motion is repeatable, and no route can invoke code, files, or the network.</div>
        </section> : null}

        {view === 'scenes' ? <section className="space-y-3 p-3">
          <div className="grid gap-2 sm:grid-cols-3">
            {state.scenes.map((scene) => <button key={scene.id} type="button" disabled={projectBusy || !onMutateModulationWorkflow} onClick={() => recallScene(scene.id, scene.name)} className={`min-h-20 rounded-xl border p-3 text-left disabled:opacity-40 ${state.activeSceneId === scene.id ? 'border-fuchsia-300 bg-fuchsia-400/15' : 'border-slate-800 bg-slate-900/70 hover:border-fuchsia-400/40'}`}><strong className="block text-[10px] text-fuchsia-100">{scene.name}</strong><span className="mt-1 block text-[8px] text-slate-500">{Object.values(scene.macroValues).map(percent).join(' · ')}</span><span className="mt-2 block text-[7px] uppercase text-slate-600">Recall macro values only</span></button>)}
          </div>
          <div className="flex items-start gap-2 rounded-lg border border-fuchsia-400/20 bg-fuchsia-400/5 p-3 text-[8px] leading-relaxed text-fuchsia-100"><Gauge className="mt-0.5 h-4 w-4 shrink-0" />A scene is a portable snapshot of project-owned macro values. It never silently captures plug-in state, hardware state, DSP buffers, or external files.</div>
        </section> : null}

        {view === 'inspector' ? <section className="space-y-3 p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            {state.targets.map((target) => {
              const evaluated = frame?.targets.find((candidate) => candidate.targetId === target.id);
              return <article key={target.id} className="rounded-lg border border-slate-800 bg-slate-900/70 p-3"><div className="flex items-start justify-between gap-2"><div><strong className="block text-[9px] text-cyan-100">{target.name}</strong><span className="text-[7px] uppercase text-slate-500">{target.kind.replaceAll('_', ' ')}</span></div><span className={`rounded border px-1.5 py-0.5 text-[7px] uppercase ${evaluated?.deliveryState === 'local_preview' ? 'border-emerald-400/30 text-emerald-300' : 'border-amber-400/30 text-amber-200'}`}>{evaluated?.deliveryState.replaceAll('_', ' ')}</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-950"><div className="h-full bg-gradient-to-r from-fuchsia-500 to-cyan-400" style={{width: `${((evaluated?.value ?? target.baseValue) - target.minimum) / (target.maximum - target.minimum) * 100}%`}} /></div><p className="mt-2 text-[8px] text-slate-400">Value {evaluated?.value.toFixed(3)} {target.unit} · {evaluated?.activeRouteCount ?? 0} active routes</p>{target.requiredCapability ? <p className="mt-1 break-all text-[7px] text-amber-200/70">Requires {target.requiredCapability}</p> : null}</article>;
            })}
          </div>
          <div className="grid gap-2 sm:grid-cols-3"><BoundaryCard icon={SlidersHorizontal} title="Control layer" detail="Macros, LFOs, steps, seeded motion, routes and scenes are deterministic project data." /><BoundaryCard icon={Radio} title="Observed inputs" detail="Per-note expression, followers and controllers remain unavailable until an adapter supplies matching evidence." /><BoundaryCard icon={Cable} title="Delivery layer" detail="Rack, plug-in, track and hardware targets require a separately observed control-frame adapter." /></div>
        </section> : null}
      </> : null}

      {message ? <div role="status" className={`mx-3 mb-3 flex items-start gap-2 rounded border p-2 text-[8px] ${/could not|requires|malformed|not found|missing/i.test(message) ? 'border-amber-400/30 bg-amber-400/5 text-amber-100' : 'border-emerald-400/30 bg-emerald-400/5 text-emerald-100'}`}><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />{message}</div> : null}
      <footer className="flex items-start gap-2 border-t border-fuchsia-400/15 bg-fuchsia-400/5 px-3 py-2 text-[8px] leading-relaxed text-fuchsia-100/80"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />Control preview is real and deterministic. Audio-rate modulation, timeline playback, plug-in parameters, rack parameters and hardware output remain capability-gated.</footer>
    </div>
  );
};

const BoundaryCard: React.FC<{icon: React.ComponentType<{className?: string}>; title: string; detail: string}> = ({icon: Icon, title, detail}) => <article className="rounded-lg border border-slate-800 bg-slate-900/70 p-3"><Icon className="h-4 w-4 text-fuchsia-300" /><strong className="mt-2 block text-[9px] uppercase text-fuchsia-100">{title}</strong><p className="mt-1 text-[8px] leading-relaxed text-slate-500">{detail}</p></article>;
