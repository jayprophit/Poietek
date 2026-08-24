import React, {useMemo, useState} from 'react';
import {
  AlertTriangle,
  AudioLines,
  CheckCircle2,
  Layers3,
  ListChecks,
  Redo2,
  Scissors,
  ShieldCheck,
  Undo2,
} from 'lucide-react';
import type {PoietekProject} from '../../poietek/domain/types';
import {
  findAlignedTakeCandidates,
  listProjectTakeComps,
  planProjectTakeComp,
  type TakeCompSummary,
} from '../../poietek/engines/comping';
import type {RackModuleItem} from '../../types';

interface TakeCompStudioDeviceProps {
  module: RackModuleItem;
  onParametersChange(parameters: RackModuleItem['parameters']): void;
  project: PoietekProject | null;
  projectBusy: boolean;
  canUndoProject: boolean;
  canRedoProject: boolean;
  onCreateTakeComp?(sourceClipIds: readonly string[], groupId: string, name: string): Promise<void>;
  onSelectTakeForSegment?(groupId: string, segmentId: string, takeLaneId: string): Promise<void>;
  onCommitTakeComp?(groupId: string): Promise<void>;
  onUndoProject?(): Promise<void>;
  onRedoProject?(): Promise<void>;
}

type TakeCompView = 'takes' | 'swipe' | 'commit' | 'readiness';

const views: readonly {id: TakeCompView; label: string; icon: typeof Layers3}[] = [
  {id: 'takes', label: 'Take stack', icon: Layers3},
  {id: 'swipe', label: 'Comp lanes', icon: Scissors},
  {id: 'commit', label: 'Preview & commit', icon: ListChecks},
  {id: 'readiness', label: 'Readiness', icon: ShieldCheck},
] as const;

function tickRange(startTick: number, durationTicks: number): string {
  return `${startTick}–${startTick + durationTicks}`;
}

export const TakeCompStudioDevice: React.FC<TakeCompStudioDeviceProps> = ({
  module,
  onParametersChange,
  project,
  projectBusy,
  canUndoProject,
  canRedoProject,
  onCreateTakeComp,
  onSelectTakeForSegment,
  onCommitTakeComp,
  onUndoProject,
  onRedoProject,
}) => {
  const parameters = module.parameters ?? {};
  const view = String(parameters.view ?? 'takes') as TakeCompView;
  const [notice, setNotice] = useState<{tone: 'ok' | 'warn'; text: string} | null>(null);
  const [localBusy, setLocalBusy] = useState(false);

  const model = useMemo(() => {
    if (!project) return {candidates: [], summaries: [], error: null as string | null};
    try {
      return {
        candidates: findAlignedTakeCandidates(project),
        summaries: listProjectTakeComps(project),
        error: null as string | null,
      };
    } catch (error) {
      return {
        candidates: [],
        summaries: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }, [project]);
  const selectedGroupId = String(parameters.groupId ?? model.summaries[0]?.groupId ?? '');
  const summary = model.summaries.find((candidate) => candidate.groupId === selectedGroupId)
    ?? model.summaries[0]
    ?? null;
  const plan = useMemo(() => {
    if (!project || !summary) return null;
    try {
      return planProjectTakeComp(project, summary.groupId);
    } catch (error) {
      return {
        groupId: summary.groupId,
        destinationTrackId: summary.destinationTrackId,
        ready: false,
        issues: [error instanceof Error ? error.message : String(error)],
        outputClips: [],
        sourceClipIds: [],
        rangeStartTick: summary.startTick,
        rangeDurationTicks: summary.durationTicks,
        claim: 'The comp preview could not be resolved; no project clips were changed.',
      };
    }
  }, [project, summary]);
  const busy = projectBusy || localBusy;

  const updateParameters = (patch: Record<string, number | boolean | string>) => {
    onParametersChange({...parameters, ...patch});
  };

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

  const createFirstCandidate = () => {
    const candidate = model.candidates[0];
    if (!candidate || !onCreateTakeComp) return;
    const groupId = `take.comp.${Date.now()}`;
    updateParameters({groupId, view: 'swipe'});
    void run(
      () => onCreateTakeComp(candidate.clipIds, groupId, 'Performance Take'),
      'Aligned source clips were organized into a project-owned take stack. No source media was copied, deleted, rendered, or processed.',
    );
  };

  return (
    <div className="poietek-workbench-device overflow-hidden rounded-xl border border-fuchsia-300/35 bg-[#130914] text-slate-100 shadow-inner">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-fuchsia-300/20 bg-gradient-to-r from-fuchsia-950 via-slate-950 to-violet-950 px-3 py-2">
        <div className="flex items-center gap-2">
          <AudioLines className="h-4 w-4 text-fuchsia-200" />
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.15em] text-fuchsia-100">Take Studio & Comp Builder</div>
            <div className="text-[9px] text-slate-400">Aligned takes → segment choices → validated canonical comp</div>
          </div>
        </div>
        <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2 py-1 text-[8px] font-black uppercase text-emerald-200">Local · non-destructive · undoable</span>
      </header>

      <nav className="grid grid-cols-4 border-b border-slate-700/80" aria-label="Take Studio views">
        {views.map((item) => {
          const Icon = item.icon;
          return <button key={item.id} type="button" aria-pressed={view === item.id} onClick={() => updateParameters({view: item.id})} className={`flex min-h-11 items-center justify-center gap-1 border-r border-slate-700/60 px-1 py-2 text-[8px] font-black uppercase last:border-r-0 ${view === item.id ? 'bg-fuchsia-300 text-slate-950' : 'bg-slate-950/70 text-slate-400 hover:bg-slate-800'}`}><Icon className="h-3 w-3" />{item.label}</button>;
        })}
      </nav>

      {!project && <section className="p-3"><Notice tone="warn">The canonical local project is still starting. Take edits cannot be saved yet.</Notice></section>}
      {model.error && <section className="p-3"><Notice tone="warn">{model.error}</Notice></section>}

      {project && !model.error && view === 'takes' && (
        <section className="space-y-3 p-3" aria-label="Take stack sources">
          <div className="grid grid-cols-3 gap-2">
            <Metric label="Aligned groups" value={String(model.candidates.length)} />
            <Metric label="Saved comps" value={String(model.summaries.length)} />
            <Metric label="Project audio" value={`${project.tracks.flatMap((track) => track.clips).length} clips`} />
          </div>

          {model.summaries.length > 0 && <label className="block text-[8px] font-black uppercase text-slate-400">Active take comp
            <select value={summary?.groupId ?? ''} onChange={(event) => updateParameters({groupId: event.target.value})} className="mt-1 min-h-11 w-full rounded border border-slate-600 bg-slate-950 px-2 text-[9px] normal-case text-slate-100">
              {model.summaries.map((item) => <option key={item.groupId} value={item.groupId}>{item.name} · {item.commandState}</option>)}
            </select>
          </label>}

          {summary ? <TakeLaneList project={project} summary={summary} /> : <div className="rounded-lg border border-fuchsia-300/25 bg-fuchsia-300/5 p-3">
            <strong className="text-[10px] uppercase text-fuchsia-100">Start from real aligned recordings</strong>
            <p className="mt-2 text-[9px] leading-relaxed text-slate-400">Import or record at least two audio clips with the same project start and duration. Poietek will preserve the originals as take sources and create a separate comp destination.</p>
            {model.candidates[0] && <p className="mt-2 rounded border border-slate-700 bg-slate-950/70 p-2 text-[8px] text-slate-300">Ready: {model.candidates[0].label}</p>}
            <button type="button" disabled={!model.candidates.length || !onCreateTakeComp || busy} onClick={createFirstCandidate} className="mt-3 min-h-11 w-full rounded border border-fuchsia-300/45 bg-fuchsia-300/10 px-3 text-[8px] font-black uppercase text-fuchsia-100 disabled:cursor-not-allowed disabled:opacity-40">{busy ? 'Saving take stack…' : 'Create take stack from aligned clips'}</button>
          </div>}
          {!model.candidates.length && !summary && <Notice tone="warn">No aligned audio takes are available yet. Empty tracks, MIDI clips, synthetic placeholders and unobserved recordings are never presented as takes.</Notice>}
        </section>
      )}

      {project && !model.error && view === 'swipe' && (
        <section className="space-y-3 p-3" aria-label="Take segment selection">
          {!summary && <Notice tone="warn">Create a take stack from two or more aligned real audio clips before selecting comp segments.</Notice>}
          {summary && <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div><strong className="block text-[10px] uppercase text-fuchsia-100">{summary.name}</strong><span className="text-[8px] text-slate-500">Project ticks {tickRange(summary.startTick, summary.durationTicks)} · {summary.segments.length} segment choices</span></div>
              <span className="rounded-full border border-slate-700 px-2 py-1 text-[7px] uppercase text-slate-400">{summary.commandState}</span>
            </div>
            <div className="space-y-2">
              {summary.segments.map((segment, segmentIndex) => <article key={segment.id} className="rounded-lg border border-slate-700 bg-slate-950/75 p-3">
                <div className="flex items-center justify-between gap-2"><strong className="text-[9px] text-fuchsia-100">Segment {segmentIndex + 1}</strong><span className="text-[8px] text-slate-500">{tickRange(segment.startTick, segment.durationTicks)}</span></div>
                <div className="mt-2 grid gap-1 sm:grid-cols-2">
                  {summary.takeLanes.map((lane, laneIndex) => <button key={lane.id} type="button" aria-pressed={segment.takeLaneId === lane.id} disabled={!onSelectTakeForSegment || busy} onClick={() => void run(() => onSelectTakeForSegment!(summary.groupId, segment.id, lane.id), `Segment ${segmentIndex + 1} now references Take ${laneIndex + 1}. The comp remains a preview until committed.`)} className={`min-h-11 rounded border px-2 text-left text-[8px] font-bold disabled:opacity-40 ${segment.takeLaneId === lane.id ? 'border-fuchsia-300 bg-fuchsia-300/15 text-fuchsia-100' : 'border-slate-700 bg-slate-900 text-slate-400'}`}><span className="block">Take {laneIndex + 1}</span><span className="block truncate font-normal opacity-70">{lane.name}</span></button>)}
                </div>
              </article>)}
            </div>
            <Notice tone="ok">Selecting a lane changes only the project-owned comp plan. It does not erase a take, consolidate media, run time correction, or claim audible solo playback.</Notice>
          </>}
        </section>
      )}

      {project && !model.error && view === 'commit' && (
        <section className="space-y-3 p-3" aria-label="Take comp preview and commit">
          {!summary || !plan ? <Notice tone="warn">No take comp is ready to preview.</Notice> : <>
            <div className="grid grid-cols-3 gap-2">
              <Metric label="Output clips" value={String(plan.outputClips.length)} />
              <Metric label="Source takes" value={String(plan.sourceClipIds.length)} />
              <Metric label="Validation" value={plan.ready ? 'Ready' : `${plan.issues.length} blocked`} ready={plan.ready} />
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-950/75 p-3">
              <strong className="text-[9px] uppercase text-fuchsia-100">Deterministic edit preview</strong>
              <p className="mt-2 text-[8px] leading-relaxed text-slate-400">{plan.claim}</p>
              <div className="mt-2 space-y-1">
                {plan.outputClips.map((clip) => <div key={clip.id} className="grid grid-cols-[1fr_auto] gap-2 rounded border border-slate-800 bg-slate-900/70 p-2 text-[8px]"><span className="truncate text-slate-300">{clip.name}</span><span className="text-slate-500">{tickRange(clip.startTick, clip.durationTicks)}</span></div>)}
                {plan.issues.map((issue) => <div key={issue} className="flex gap-2 rounded border border-amber-400/25 bg-amber-400/5 p-2 text-[8px] text-amber-100"><AlertTriangle className="h-3 w-3 shrink-0" />{issue}</div>)}
              </div>
            </div>
            <button type="button" disabled={!plan.ready || !onCommitTakeComp || busy} onClick={() => void run(() => onCommitTakeComp!(summary.groupId), 'The comp was committed as canonical audio clip references and the source take clips were muted in one undoable project edit.')} className="min-h-11 w-full rounded border border-fuchsia-300/45 bg-fuchsia-300/10 px-3 text-[8px] font-black uppercase text-fuchsia-100 disabled:cursor-not-allowed disabled:opacity-40">{busy ? 'Committing project edit…' : summary.commandState === 'applied' ? 'Recommit updated comp' : 'Commit comp as one project edit'}</button>
            <div className="grid grid-cols-2 gap-2"><button type="button" disabled={!canUndoProject || !onUndoProject || busy} onClick={() => void run(() => onUndoProject!(), 'The complete last project edit was undone.')} className="min-h-10 rounded border border-slate-600 bg-slate-900 px-2 text-[8px] font-bold text-slate-300 disabled:opacity-40"><Undo2 className="mr-1 inline h-3 w-3" />Undo project edit</button><button type="button" disabled={!canRedoProject || !onRedoProject || busy} onClick={() => void run(() => onRedoProject!(), 'The complete project edit was restored.')} className="min-h-10 rounded border border-slate-600 bg-slate-900 px-2 text-[8px] font-bold text-slate-300 disabled:opacity-40"><Redo2 className="mr-1 inline h-3 w-3" />Redo project edit</button></div>
            <Notice tone="warn">Commit creates ordinary canonical clip references for the existing arranger and mutes the source take clips. Flatten-and-merge, destructive source cleanup, pitch correction and new rendered media remain separate, unimplemented actions.</Notice>
          </>}
        </section>
      )}

      {project && !model.error && view === 'readiness' && (
        <section className="space-y-3 p-3" aria-label="Take comp capability readiness">
          <div className="grid gap-2 sm:grid-cols-2">
            <ReadinessCard label="Aligned take discovery" value="Operational" ready detail="Uses only real canonical audio clips and media references." />
            <ReadinessCard label="Segment source selection" value="Operational" ready detail="Validated project-owned take lanes and comp segments." />
            <ReadinessCard label="Atomic comp commit" value="Operational" ready detail="Canonical clip references, source mute and ProjectSession undo." />
            <ReadinessCard label="Audible take audition" value="Adapter/UI integration required" detail="This rack panel does not claim solo playback switching." />
            <ReadinessCard label="Automatic loop recording" value="Native capture required" detail="No take is invented without an observed recording or imported asset." />
            <ReadinessCard label="Flatten / merge render" value="Offline renderer required" detail="No new consolidated media asset is fabricated." />
          </div>
          <Notice tone="ok">This closes the canonical take-lane and non-destructive comp-edit gap. Time-stretch, pitch correction, live recording and destructive flattening remain separately gated.</Notice>
        </section>
      )}

      {notice && <div className={`mx-3 mb-3 flex items-start gap-2 rounded border p-2 text-[8px] ${notice.tone === 'ok' ? 'border-emerald-400/25 bg-emerald-400/5 text-emerald-100' : 'border-amber-400/25 bg-amber-400/5 text-amber-100'}`} role="status">{notice.tone === 'ok' ? <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" /> : <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />}{notice.text}</div>}
      <footer className="flex items-center gap-2 border-t border-fuchsia-300/20 bg-fuchsia-300/5 px-3 py-2 text-[8px] text-fuchsia-100/80"><ShieldCheck className="h-3 w-3 shrink-0" />Original Poietek workflow. No Apple code, interface artwork, loops, presets, session files, models, instruments or branding are included.</footer>
    </div>
  );
};

const TakeLaneList: React.FC<{project: PoietekProject; summary: TakeCompSummary}> = ({project, summary}) => <div className="space-y-2">{summary.takeLanes.map((lane, index) => {
  const clips = project.tracks.flatMap((track) => track.clips).filter((clip) => lane.clipIds.includes(clip.id));
  return <article key={lane.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/75 p-3"><span className="flex h-8 w-8 items-center justify-center rounded-full border border-fuchsia-300/35 bg-fuchsia-300/10 text-[9px] font-black text-fuchsia-100">{index + 1}</span><div className="min-w-0"><strong className="block truncate text-[9px] text-slate-200">{lane.name}</strong><span className="block truncate text-[8px] text-slate-500">{clips.map((clip) => clip.name).join(', ') || 'Missing source clip'}</span></div><span className="text-[7px] uppercase text-slate-500">{lane.muted ? 'lane muted' : 'available'}</span></article>;
})}</div>;

const Metric: React.FC<{label: string; value: string; ready?: boolean}> = ({label, value, ready = false}) => <div className="rounded-lg border border-slate-700 bg-slate-950 p-2"><span className="block text-[7px] font-black uppercase text-slate-500">{label}</span><strong className={`mt-1 block truncate text-[9px] ${ready ? 'text-emerald-300' : 'text-fuchsia-200'}`}>{value}</strong></div>;

const Notice: React.FC<{tone: 'ok' | 'warn'; children: React.ReactNode}> = ({tone, children}) => <div className={`flex gap-2 rounded border p-2 text-[8px] leading-relaxed ${tone === 'ok' ? 'border-emerald-400/25 bg-emerald-400/5 text-emerald-100' : 'border-amber-400/25 bg-amber-400/5 text-amber-100'}`}>{tone === 'ok' ? <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" /> : <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />}{children}</div>;

const ReadinessCard: React.FC<{label: string; value: string; detail: string; ready?: boolean}> = ({label, value, detail, ready = false}) => <article className="rounded-lg border border-slate-700 bg-slate-950/75 p-3"><span className="block text-[7px] font-black uppercase text-slate-500">{label}</span><strong className={`mt-1 block text-[9px] ${ready ? 'text-emerald-300' : 'text-amber-200'}`}>{value}</strong><p className="mt-2 text-[8px] leading-relaxed text-slate-500">{detail}</p></article>;
