import React, {useMemo, useState} from 'react';
import {AlertTriangle, CheckCircle2, GitBranch, Library, ShieldCheck, SlidersHorizontal, Undo2} from 'lucide-react';
import type {PoietekProject} from '../../poietek/domain/types';
import {getProjectScoreDocument} from '../../poietek/production-workflows/score';
import {
  getProjectTechniqueMatrixState,
  getTechniqueMatrixReadiness,
  planProjectTechniquePlayback,
  type TechniquePlaybackPlan,
} from '../../poietek/technique-workflows';
import type {RackModuleItem} from '../../types';

interface TechniqueMatrixDeviceProps {
  module: RackModuleItem;
  onParametersChange(parameters: RackModuleItem['parameters']): void;
  project: PoietekProject | null;
  projectBusy: boolean;
  canUndoProject: boolean;
  onInitializeTechniqueMatrix?(): Promise<void>;
  onCommitTechniquePlan?(plan: TechniquePlaybackPlan): Promise<void>;
  onUndoProject?(): Promise<void>;
}

type TechniqueView = 'library' | 'switches' | 'score' | 'readiness';

const views: readonly {id: TechniqueView; label: string; icon: typeof Library}[] = [
  {id: 'library', label: 'Library', icon: Library},
  {id: 'switches', label: 'Switches', icon: SlidersHorizontal},
  {id: 'score', label: 'Score bridge', icon: GitBranch},
  {id: 'readiness', label: 'Readiness', icon: ShieldCheck},
];

export const TechniqueMatrixDevice: React.FC<TechniqueMatrixDeviceProps> = ({
  module,
  onParametersChange,
  project,
  projectBusy,
  canUndoProject,
  onInitializeTechniqueMatrix,
  onCommitTechniquePlan,
  onUndoProject,
}) => {
  const parameters = module.parameters ?? {};
  const [view, setView] = useState<TechniqueView>(() => String(parameters.view ?? 'library') as TechniqueView);
  const [localBusy, setLocalBusy] = useState(false);
  const [notice, setNotice] = useState<{tone: 'ok' | 'warn'; text: string} | null>(null);
  const model = useMemo(() => {
    if (!project) return {state: null, score: null, map: null, assignment: null, plan: null, readiness: [], error: null as string | null};
    try {
      const state = getProjectTechniqueMatrixState(project);
      const score = getProjectScoreDocument(project);
      const map = state?.maps[0] ?? null;
      const assignment = state?.assignments[0] ?? null;
      const operationId = state ? `technique-plan.${state.revision}.${state.appliedPlans.length + 1}` : '';
      const plan = map && assignment ? planProjectTechniquePlayback(project, map.id, assignment.id, operationId) : null;
      return {state, score, map, assignment, plan, readiness: getTechniqueMatrixReadiness(project), error: null as string | null};
    } catch (error) {
      return {state: null, score: null, map: null, assignment: null, plan: null, readiness: [], error: error instanceof Error ? error.message : String(error)};
    }
  }, [project]);
  const busy = projectBusy || localBusy;
  const run = async (operation: () => Promise<void>, success: string) => {
    setLocalBusy(true);
    setNotice(null);
    try {
      await operation();
      setNotice({tone: 'ok', text: success});
    } catch (error) {
      setNotice({tone: 'warn', text: error instanceof Error ? error.message : String(error)});
    } finally {
      setLocalBusy(false);
    }
  };
  const chooseView = (next: TechniqueView) => {
    setView(next);
    onParametersChange({...parameters, view: next});
  };
  const initialize = () => onInitializeTechniqueMatrix && void run(
    onInitializeTechniqueMatrix,
    'The score bridge, starter technique map and instrument assignment were saved as one undoable project edit.',
  );
  const commit = () => model.plan && onCommitTechniquePlan && void run(
    () => onCommitTechniquePlan(model.plan!),
    'The reviewed switch plan was recorded for a future adapter. No MIDI or audio was sent.',
  );
  const undo = () => onUndoProject && void run(onUndoProject, 'The complete last project edit was undone.');

  return <div className="overflow-hidden rounded-xl border border-violet-300/35 bg-[#120b1d] text-slate-100 shadow-inner">
    <header className="flex flex-wrap items-center justify-between gap-2 border-b border-violet-300/20 bg-gradient-to-r from-violet-950 via-slate-950 to-fuchsia-950 px-3 py-2">
      <div className="flex items-center gap-2"><GitBranch className="h-4 w-4 text-violet-200" /><div><div className="text-[10px] font-black uppercase tracking-[0.15em] text-violet-100">Technique Matrix & Score Bridge</div><div className="text-[9px] text-slate-400">Score markings → performance intent → exact switch plan</div></div></div>
      <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2 py-1 text-[8px] font-black uppercase text-emerald-200">Versioned · deterministic · undoable</span>
    </header>

    <nav className="grid grid-cols-4 border-b border-slate-700/80" aria-label="Technique Matrix views">{views.map((item) => {const Icon = item.icon; return <button key={item.id} type="button" aria-pressed={view === item.id} onClick={() => chooseView(item.id)} className={`flex min-h-11 items-center justify-center gap-1 border-r border-slate-700/60 px-1 py-2 text-[8px] font-black uppercase last:border-r-0 ${view === item.id ? 'bg-violet-300 text-slate-950' : 'bg-slate-950/70 text-slate-400 hover:bg-slate-800'}`}><Icon className="h-3 w-3" />{item.label}</button>;})}</nav>

    {!project && <section className="p-3"><Notice tone="warn">The canonical local project is still starting. The Technique Matrix cannot save yet.</Notice></section>}
    {model.error && <section className="p-3"><Notice tone="warn">{model.error}</Notice></section>}

    {project && !model.error && !model.state && <section className="space-y-3 p-3" aria-label="Initialize Technique Matrix">
      <div className="grid gap-2 sm:grid-cols-3"><Metric label="Score bridge" value="Not initialized" /><Metric label="Playback claim" value="Control plan only" /><Metric label="Project assets" value={`${project.assets.length} preserved`} /></div>
      <Notice tone="warn">Initialize an original generic technique library, score binding and instrument-track assignment. Existing tracks, assets and score data are preserved.</Notice>
      <button type="button" disabled={!onInitializeTechniqueMatrix || busy} onClick={initialize} className="min-h-11 w-full rounded border border-violet-300/45 bg-violet-300/10 px-3 text-[8px] font-black uppercase text-violet-100 disabled:opacity-40">{busy ? 'Saving Technique Matrix…' : 'Initialize score playback bridge'}</button>
    </section>}

    {project && !model.error && model.state && view === 'library' && <section className="space-y-3 p-3" aria-label="Performance technique library">
      <div className="grid grid-cols-3 gap-2"><Metric label="Techniques" value={String(model.map?.techniques.length ?? 0)} /><Metric label="Exclusion groups" value={String(model.map?.mutualExclusionGroups.length ?? 0)} /><Metric label="Revision" value={String(model.state.revision)} /></div>
      <div className="grid gap-2 sm:grid-cols-2">{model.map?.techniques.map((technique) => <article key={technique.id} className="rounded-lg border border-slate-700 bg-slate-950/75 p-3"><div className="flex items-center justify-between gap-2"><strong className="text-[9px] text-violet-100">{technique.name}</strong><span className={`rounded px-1.5 py-0.5 text-[7px] font-black uppercase ${technique.kind === 'direction' ? 'bg-fuchsia-400/15 text-fuchsia-200' : 'bg-cyan-400/15 text-cyan-200'}`}>{technique.kind}</span></div><p className="mt-2 text-[8px] text-slate-500">{technique.mutualExclusionGroupId ? `Group: ${technique.mutualExclusionGroupId}` : 'Applies to one note only'}</p></article>)}</div>
      <Notice tone="ok">Directions remain active until another direction in their group replaces them. Attributes apply to one score note only.</Notice>
    </section>}

    {project && !model.error && model.state && view === 'switches' && <section className="space-y-3 p-3" aria-label="Technique sound slots">
      <div className="grid grid-cols-3 gap-2"><Metric label="Sound slots" value={String(model.map?.soundSlots.length ?? 0)} /><Metric label="Score bindings" value={String(model.map?.scoreBindings.length ?? 0)} /><Metric label="Track" value={project.tracks.find((track) => track.id === model.assignment?.trackId)?.name ?? 'Missing'} /></div>
      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">{model.map?.soundSlots.map((slot) => <article key={slot.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-lg border border-slate-700 bg-slate-950/75 p-3"><div className="min-w-0"><strong className="block truncate text-[9px] text-violet-100">{slot.name}</strong><span className="mt-1 block text-[8px] text-slate-500">{slot.techniqueIds.join(' + ')}</span></div><div className="text-right text-[8px] text-fuchsia-200">{slot.actions.map((action) => action.kind === 'keyswitch' ? `Key ${action.note}` : action.kind === 'cc' ? `CC ${action.controller}:${action.value}` : `Program ${action.program}`).join(', ')}<span className="block text-[7px] text-slate-500">attack −{slot.attackCompensationTicks} ticks</span></div></article>)}</div>
      <Notice tone="warn">These are explicit adapter instructions, not proof of a connected instrument. Conflicting or unmatched technique sets fail closed.</Notice>
    </section>}

    {project && !model.error && model.state && view === 'score' && <section className="space-y-3 p-3" aria-label="Score technique playback plan">
      <div className="grid grid-cols-3 gap-2"><Metric label="Score notes" value={String(model.score?.flows.reduce((sum, flow) => sum + flow.measures.reduce((measureSum, measure) => measureSum + measure.notes.length, 0), 0) ?? 0)} /><Metric label="Planned events" value={String(model.plan?.events.length ?? 0)} /><Metric label="Committed plans" value={String(model.state.appliedPlans.length)} /></div>
      <PlanPreview plan={model.plan} />
      <div className="grid grid-cols-[1fr_auto] gap-2"><button type="button" disabled={!model.plan?.ready || !onCommitTechniquePlan || busy} onClick={commit} className="min-h-11 rounded border border-violet-300/45 bg-violet-300/10 px-3 text-[8px] font-black uppercase text-violet-100 disabled:opacity-40">{busy ? 'Recording reviewed plan…' : 'Commit reviewed switch plan'}</button><button type="button" disabled={!canUndoProject || !onUndoProject || busy} onClick={undo} title="Undo last canonical project edit" className="min-h-11 min-w-11 rounded border border-slate-600 bg-slate-900 text-slate-300 disabled:opacity-40"><Undo2 className="mx-auto h-4 w-4" /></button></div>
    </section>}

    {project && !model.error && model.state && view === 'readiness' && <section className="space-y-3 p-3" aria-label="Technique Matrix capability readiness">
      <div className="grid gap-2 sm:grid-cols-2">{model.readiness.map((item) => <article key={item.id} className="rounded-lg border border-slate-700 bg-slate-950/75 p-3"><span className="block text-[7px] font-black uppercase text-slate-500">{item.label}</span><strong className={`mt-1 block text-[9px] ${item.state === 'ready' ? 'text-emerald-300' : 'text-amber-200'}`}>{item.state === 'ready' ? 'Ready locally' : 'Adapter required'}</strong><p className="mt-2 text-[8px] leading-relaxed text-slate-500">{item.message}</p></article>)}</div>
    </section>}

    {notice && <div role="status" className={`mx-3 mb-3 flex items-start gap-2 rounded border p-2 text-[8px] ${notice.tone === 'ok' ? 'border-emerald-400/25 bg-emerald-400/5 text-emerald-100' : 'border-amber-400/25 bg-amber-400/5 text-amber-100'}`}>{notice.tone === 'ok' ? <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" /> : <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />}{notice.text}</div>}
    <footer className="flex items-center gap-2 border-t border-violet-300/20 bg-violet-300/5 px-3 py-2 text-[8px] text-violet-100/80"><ShieldCheck className="h-3 w-3 shrink-0" />Original Poietek design. No Steinberg code, maps, instruments, samples, presets, interface artwork or branding are included.</footer>
  </div>;
};

const PlanPreview: React.FC<{plan: TechniquePlaybackPlan | null}> = ({plan}) => <div className="rounded-lg border border-slate-700 bg-slate-950/75 p-3"><div className="flex items-center justify-between gap-2"><strong className="text-[9px] uppercase text-violet-100">Deterministic score plan</strong><span className={`text-[7px] font-black uppercase ${plan?.ready ? 'text-emerald-300' : 'text-amber-200'}`}>{plan?.ready ? 'ready' : 'blocked'}</span></div>{plan?.events.length ? <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">{plan.events.map((event) => <article key={event.scoreNoteId} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded border border-slate-800 bg-slate-900/70 p-2"><span className="rounded bg-violet-400/15 px-2 py-1 text-[7px] font-black text-violet-200">{event.noteStartTick}</span><span className="min-w-0"><strong className="block truncate text-[8px] text-slate-200">{event.soundSlotId}</strong><span className="block truncate text-[7px] text-slate-500">{event.techniqueIds.join(' + ')}</span></span><span className="text-[7px] text-fuchsia-200">{event.actions.map((action) => action.kind === 'keyswitch' ? `K${action.note}@${action.dispatchTick}` : action.kind === 'cc' ? `CC${action.controller}@${action.dispatchTick}` : `P${action.program}@${action.dispatchTick}`).join(' · ')}</span></article>)}</div> : null}{plan?.issues.length ? <div className="mt-3 space-y-1">{plan.issues.map((issue) => <div key={issue} className="flex gap-2 text-[8px] text-amber-100"><AlertTriangle className="h-3 w-3 shrink-0" />{issue}</div>)}</div> : <p className="mt-2 text-[8px] leading-relaxed text-slate-500">Exact ticks and trigger values are reviewable. Commit records intent only; it does not send MIDI or claim audible playback.</p>}</div>;
const Metric: React.FC<{label: string; value: string}> = ({label, value}) => <div className="min-w-0 rounded-lg border border-slate-700 bg-slate-950 p-2"><span className="block text-[7px] font-black uppercase text-slate-500">{label}</span><strong className="mt-1 block truncate text-[9px] text-violet-200">{value}</strong></div>;
const Notice: React.FC<{tone: 'ok' | 'warn'; children: React.ReactNode}> = ({tone, children}) => <div className={`flex gap-2 rounded border p-2 text-[8px] leading-relaxed ${tone === 'ok' ? 'border-emerald-400/25 bg-emerald-400/5 text-emerald-100' : 'border-amber-400/25 bg-amber-400/5 text-amber-100'}`}>{tone === 'ok' ? <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" /> : <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />}{children}</div>;
