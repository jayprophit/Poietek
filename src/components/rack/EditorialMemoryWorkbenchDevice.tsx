import React, {useMemo, useState} from 'react';
import {
  AlertTriangle,
  BookmarkCheck,
  CheckCircle2,
  FilePenLine,
  Layers3,
  Pin,
  ShieldCheck,
  Undo2,
} from 'lucide-react';
import type {PoietekProject} from '../../poietek/domain/types';
import {
  buildEditorialBatchRenamePlan,
  evaluateEditorialReadiness,
  getProjectEditorialWorkflow,
  type CreateEditorialClipGroupInput,
  type EditorialBatchRenamePlan,
  type EditorialEditPolicy,
  type SaveEditorialMemoryInput,
} from '../../poietek/editorial-workflows';
import type {RackModuleItem} from '../../types';

interface EditorialMemoryWorkbenchDeviceProps {
  module: RackModuleItem;
  onParametersChange(parameters: RackModuleItem['parameters']): void;
  project: PoietekProject | null;
  projectBusy: boolean;
  canUndoProject: boolean;
  onInitializeEditorial?(): Promise<void>;
  onSaveEditorialMemory?(input: SaveEditorialMemoryInput): Promise<void>;
  onRecallEditorialMemory?(memoryId: string, operationId: string): Promise<void>;
  onCreateEditorialClipGroup?(input: CreateEditorialClipGroupInput): Promise<void>;
  onApplyEditorialBatchRename?(plan: EditorialBatchRenamePlan): Promise<void>;
  onSetEditorialEditPolicy?(policy: EditorialEditPolicy, operationId: string): Promise<void>;
  onUndoProject?(): Promise<void>;
}

type EditorialView = 'memories' | 'groups' | 'rename' | 'readiness';

const views: readonly {id: EditorialView; label: string; icon: typeof BookmarkCheck}[] = [
  {id: 'memories', label: 'Edit memory', icon: BookmarkCheck},
  {id: 'groups', label: 'Clip groups', icon: Layers3},
  {id: 'rename', label: 'Batch names', icon: FilePenLine},
  {id: 'readiness', label: 'System map', icon: ShieldCheck},
];

const policies: readonly {id: EditorialEditPolicy; label: string; claim: string}[] = [
  {id: 'free', label: 'Free', claim: 'Saved preference; existing direct clip edits remain unconstrained.'},
  {id: 'grid', label: 'Grid', claim: 'Saved precision intent; native timeline gesture enforcement remains separate.'},
  {id: 'ripple_plan', label: 'Ripple plan', claim: 'Planning only until a collision-tested multi-track timeline command is connected.'},
  {id: 'location_plan', label: 'Locate plan', claim: 'Stores exact location intent without claiming timecode or external machine control.'},
];

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function barLabel(ppq: number, tick: number): string {
  return `Bar ${Math.floor(tick / (ppq * 4)) + 1}`;
}

export const EditorialMemoryWorkbenchDevice: React.FC<EditorialMemoryWorkbenchDeviceProps> = ({
  module,
  onParametersChange,
  project,
  projectBusy,
  canUndoProject,
  onInitializeEditorial,
  onSaveEditorialMemory,
  onRecallEditorialMemory,
  onCreateEditorialClipGroup,
  onApplyEditorialBatchRename,
  onSetEditorialEditPolicy,
  onUndoProject,
}) => {
  const parameters = module.parameters ?? {};
  const parameterView = String(parameters.view ?? 'memories');
  const [view, setView] = useState<EditorialView>(
    views.some((item) => item.id === parameterView) ? parameterView as EditorialView : 'memories',
  );
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{tone: 'ok' | 'warn'; text: string} | null>(null);
  const [memoryName, setMemoryName] = useState('Review Range');
  const [memoryKind, setMemoryKind] = useState<'point' | 'range' | 'view'>('range');
  const [memoryStartBar, setMemoryStartBar] = useState(1);
  const [memoryBars, setMemoryBars] = useState(4);
  const [groupName, setGroupName] = useState('Editorial Clip Set');
  const [groupStartBar, setGroupStartBar] = useState(1);
  const [groupBars, setGroupBars] = useState(4);
  const [renamePrefix, setRenamePrefix] = useState('Scene_01_Edit');
  const [renameStart, setRenameStart] = useState(1);
  const [renameDigits, setRenameDigits] = useState(3);

  const model = useMemo(() => {
    if (!project) return {state: null, error: null as string | null};
    try {
      return {state: getProjectEditorialWorkflow(project), error: null as string | null};
    } catch (error) {
      return {state: null, error: messageFrom(error)};
    }
  }, [project]);
  const state = model.state;
  const selectedMemoryId = String(parameters.selectedMemoryId ?? state?.lastRecalledMemoryId ?? state?.memoryLocations[0]?.id ?? '');
  const selectedMemory = state?.memoryLocations.find((memory) => memory.id === selectedMemoryId) ?? state?.memoryLocations[0] ?? null;
  const selectedGroupId = String(parameters.selectedGroupId ?? state?.clipGroups[0]?.id ?? '');
  const selectedGroup = state?.clipGroups.find((group) => group.id === selectedGroupId) ?? state?.clipGroups[0] ?? null;
  const ppq = project?.settings.ppq ?? 960;
  const revision = state?.revision ?? 0;
  const operationSuffix = `${revision + 1}`;
  const renamePreview = useMemo(() => {
    if (!project || !state || !selectedGroup) return {plan: null, error: null as string | null};
    try {
      return {
        plan: buildEditorialBatchRenamePlan(
          project,
          state,
          selectedGroup.id,
          renamePrefix,
          renameStart,
          renameDigits,
          `editorial.rename.${operationSuffix}`,
        ),
        error: null as string | null,
      };
    } catch (error) {
      return {plan: null, error: messageFrom(error)};
    }
  }, [operationSuffix, project, renameDigits, renamePrefix, renameStart, selectedGroup, state]);
  const working = projectBusy || busy;

  const patchParameters = (patch: Record<string, number | boolean | string>) => onParametersChange({...parameters, ...patch});
  const run = async (action: () => Promise<void>, success: string) => {
    setBusy(true);
    setNotice(null);
    try {
      await action();
      setNotice({tone: 'ok', text: success});
    } catch (error) {
      setNotice({tone: 'warn', text: messageFrom(error)});
    } finally {
      setBusy(false);
    }
  };

  const saveMemory = () => {
    if (!onSaveEditorialMemory || !project) return;
    const id = `editorial.memory.custom.${operationSuffix}`;
    const bar = project.settings.ppq * 4;
    void run(() => onSaveEditorialMemory({
      id,
      name: memoryName,
      color: '#38bdf8',
      kind: memoryKind,
      startTick: (memoryStartBar - 1) * bar,
      durationTicks: memoryKind === 'point' ? 0 : memoryBars * bar,
      trackIds: project.tracks.map((track) => track.id),
      preRollTicks: memoryKind === 'point' ? 0 : bar,
      postRollTicks: memoryKind === 'point' ? 0 : bar,
      notes: 'Creator-saved edit selection and track focus.',
      operationId: `editorial.save-memory.${operationSuffix}`,
    }), 'The edit memory was saved in the canonical local project as one undoable change.');
  };

  const createGroup = () => {
    if (!onCreateEditorialClipGroup || !project) return;
    const bar = project.settings.ppq * 4;
    const id = `editorial.group.custom.${operationSuffix}`;
    void run(() => onCreateEditorialClipGroup({
      id,
      name: groupName,
      color: '#f59e0b',
      startTick: (groupStartBar - 1) * bar,
      durationTicks: groupBars * bar,
      operationId: `editorial.create-group.${operationSuffix}`,
    }), 'The group now owns exact references to every fully-contained canonical audio clip. No media was copied or rendered.');
  };

  return <div className="poietek-workbench-device overflow-hidden rounded-xl border border-sky-300/35 bg-[#07131c] text-slate-100 shadow-inner">
    <header className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-300/20 bg-gradient-to-r from-sky-950 via-slate-950 to-indigo-950 px-3 py-2">
      <div className="flex items-center gap-2"><BookmarkCheck className="h-4 w-4 text-sky-200" /><div><div className="text-[10px] font-black uppercase tracking-[0.15em] text-sky-100">Editorial Memory & Clip Groups</div><div className="text-[9px] text-slate-400">Saved selections → focused tracks → exact clip cohorts → safe names</div></div></div>
      <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2 py-1 text-[8px] font-black uppercase text-emerald-200">Canonical · local · undoable</span>
    </header>

    <nav className="grid grid-cols-4 border-b border-slate-700/80" aria-label="Editorial Memory views">{views.map((item) => {const Icon = item.icon; return <button key={item.id} type="button" aria-pressed={view === item.id} onClick={() => {setView(item.id); patchParameters({view: item.id});}} className={`flex min-h-11 items-center justify-center gap-1 border-r border-slate-700/60 px-1 py-2 text-[8px] font-black uppercase last:border-r-0 ${view === item.id ? 'bg-sky-300 text-slate-950' : 'bg-slate-950/70 text-slate-400 hover:bg-slate-800'}`}><Icon className="h-3 w-3" />{item.label}</button>;})}</nav>

    {!project ? <section className="p-3"><Notice tone="warn">The canonical project is still starting. Editorial state cannot be saved yet.</Notice></section> : null}
    {model.error ? <section className="p-3"><Notice tone="warn">{model.error}</Notice></section> : null}
    {project && !model.error && (!state || !state.memoryLocations.length) ? <section className="space-y-3 p-3"><Notice tone="warn">This project has no starter edit memories yet. Initialization saves three original memories and pins up to three existing tracks without creating or changing media.</Notice><button type="button" disabled={!onInitializeEditorial || working} onClick={() => onInitializeEditorial && void run(onInitializeEditorial, 'Editorial Memory was initialized with point, range and track-focus records.')} className="min-h-11 w-full rounded border border-sky-300/45 bg-sky-300/10 text-[8px] font-black uppercase text-sky-100 disabled:opacity-40">Initialize editorial memory</button></section> : null}

    {project && state && view === 'memories' ? <section className="space-y-3 p-3" aria-label="Saved edit memories">
      <div className="grid grid-cols-3 gap-2"><Metric label="Memories" value={String(state.memoryLocations.length)} /><Metric label="Pinned tracks" value={String(state.pinnedTrackIds.length)} /><Metric label="Saved policy" value={state.activeEditPolicy.replaceAll('_', ' ')} /></div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Editorial policy">{policies.map((policy) => <button key={policy.id} type="button" aria-pressed={state.activeEditPolicy === policy.id} title={policy.claim} disabled={!onSetEditorialEditPolicy || working || state.activeEditPolicy === policy.id} onClick={() => onSetEditorialEditPolicy && void run(() => onSetEditorialEditPolicy(policy.id, `editorial.policy.${policy.id}.${operationSuffix}`), `${policy.label} is now the saved editorial policy. ${policy.claim}`)} className={`min-h-11 rounded border px-2 text-[8px] font-black uppercase disabled:opacity-50 ${state.activeEditPolicy === policy.id ? 'border-sky-300 bg-sky-300 text-slate-950' : 'border-slate-700 bg-slate-950 text-slate-300'}`}>{policy.label}</button>)}</div>
      <div className="space-y-2">{state.memoryLocations.map((memory) => <button key={memory.id} type="button" aria-pressed={selectedMemory?.id === memory.id} onClick={() => patchParameters({selectedMemoryId: memory.id})} className={`grid min-h-14 w-full grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border p-3 text-left ${selectedMemory?.id === memory.id ? 'border-sky-300 bg-sky-300/10' : 'border-slate-700 bg-slate-950/75'}`}><span className="h-7 w-1 rounded" style={{backgroundColor: memory.color}} /><span className="min-w-0"><strong className="block truncate text-[9px] text-sky-100">{memory.name}</strong><span className="block text-[8px] text-slate-500">{memory.kind} · {barLabel(ppq, memory.startTick)} · {memory.durationTicks} ticks · {memory.trackIds.length} tracks</span></span>{state.lastRecalledMemoryId === memory.id ? <span className="text-[7px] font-black uppercase text-emerald-300">recalled</span> : null}</button>)}</div>
      <button type="button" disabled={!selectedMemory || !onRecallEditorialMemory || working} onClick={() => selectedMemory && onRecallEditorialMemory && void run(() => onRecallEditorialMemory(selectedMemory.id, `editorial.recall.${operationSuffix}`), `${selectedMemory.name} is now the canonical edit selection. Playback and window geometry were not fabricated.`)} className="min-h-11 w-full rounded border border-emerald-400/40 bg-emerald-400/10 text-[8px] font-black uppercase text-emerald-100 disabled:opacity-40">Recall selected memory</button>
      <div className="grid gap-2 rounded-xl border border-slate-700 bg-slate-950/70 p-3 sm:grid-cols-[1fr_7rem_6rem_6rem_auto]">
        <label className="text-[7px] font-black uppercase text-slate-500">Name<input aria-label="New editorial memory name" value={memoryName} onChange={(event) => setMemoryName(event.target.value)} className="mt-1 min-h-10 w-full rounded border border-slate-700 bg-slate-950 px-2 text-[9px] normal-case text-slate-100" /></label>
        <label className="text-[7px] font-black uppercase text-slate-500">Kind<select aria-label="New editorial memory kind" value={memoryKind} onChange={(event) => setMemoryKind(event.target.value as typeof memoryKind)} className="mt-1 min-h-10 w-full rounded border border-slate-700 bg-slate-950 px-2 text-[9px] normal-case text-slate-100"><option value="point">Point</option><option value="range">Range</option><option value="view">Track view</option></select></label>
        <NumberField label="Start bar" value={memoryStartBar} min={1} max={9999} onChange={setMemoryStartBar} />
        <NumberField label="Bars" value={memoryBars} min={1} max={9999} onChange={setMemoryBars} disabled={memoryKind === 'point'} />
        <button type="button" disabled={!onSaveEditorialMemory || working || !memoryName.trim()} onClick={saveMemory} className="min-h-11 self-end rounded border border-sky-300/40 bg-sky-300/10 px-3 text-[8px] font-black uppercase text-sky-100 disabled:opacity-40">Save memory</button>
      </div>
      <p className="text-[7px] leading-relaxed text-slate-600">Pre/post-roll values and track focus are durable project records. Recalling a memory does not claim that transport moved, audio played or a hardware surface changed banks.</p>
    </section> : null}

    {project && state && view === 'groups' ? <section className="space-y-3 p-3" aria-label="Exact canonical clip groups">
      <div className="grid grid-cols-3 gap-2"><Metric label="Audio tracks" value={String(project.tracks.filter((track) => track.type === 'audio').length)} /><Metric label="Audio clips" value={String(project.tracks.filter((track) => track.type === 'audio').reduce((total, track) => total + track.clips.length, 0))} /><Metric label="Clip groups" value={String(state.clipGroups.length)} /></div>
      {state.clipGroups.length ? <div className="space-y-2">{state.clipGroups.map((group) => <button key={group.id} type="button" aria-pressed={selectedGroup?.id === group.id} onClick={() => patchParameters({selectedGroupId: group.id})} className={`grid min-h-14 w-full grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border p-3 text-left ${selectedGroup?.id === group.id ? 'border-amber-300 bg-amber-300/10' : 'border-slate-700 bg-slate-950/75'}`}><Layers3 className="h-4 w-4 text-amber-200" /><span><strong className="block text-[9px] text-amber-100">{group.name}</strong><span className="block text-[8px] text-slate-500">{group.clipReferences.length} clips · ticks {group.startTick}–{group.endTick}</span></span><span className="text-[7px] uppercase text-slate-600">exact refs</span></button>)}</div> : <Notice tone="warn">No clip groups exist. Import or record real audio first, then capture a range that fully contains the clips. Boundaries that cut through a clip fail closed.</Notice>}
      <div className="grid gap-2 rounded-xl border border-slate-700 bg-slate-950/70 p-3 sm:grid-cols-[1fr_7rem_6rem_auto]">
        <label className="text-[7px] font-black uppercase text-slate-500">Group name<input aria-label="New editorial clip group name" value={groupName} onChange={(event) => setGroupName(event.target.value)} className="mt-1 min-h-10 w-full rounded border border-slate-700 bg-slate-950 px-2 text-[9px] normal-case text-slate-100" /></label>
        <NumberField label="Start bar" value={groupStartBar} min={1} max={9999} onChange={setGroupStartBar} />
        <NumberField label="Bars" value={groupBars} min={1} max={9999} onChange={setGroupBars} />
        <button type="button" disabled={!onCreateEditorialClipGroup || working || !groupName.trim()} onClick={createGroup} className="min-h-11 self-end rounded border border-amber-300/40 bg-amber-300/10 px-3 text-[8px] font-black uppercase text-amber-100 disabled:opacity-40">Capture exact clips</button>
      </div>
      <Notice tone="ok">A clip group owns references—not duplicate audio. It neither consolidates media nor copies, stretches, renders or deletes source files.</Notice>
    </section> : null}

    {project && state && view === 'rename' ? <section className="space-y-3 p-3" aria-label="Batch clip display-name preview">
      <label className="block text-[8px] font-black uppercase text-slate-400">Clip group<select value={selectedGroup?.id ?? ''} disabled={!state.clipGroups.length} onChange={(event) => patchParameters({selectedGroupId: event.target.value})} className="mt-1 min-h-11 w-full rounded border border-slate-600 bg-slate-950 px-2 text-[9px] normal-case text-slate-100">{state.clipGroups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label>
      <div className="grid gap-2 sm:grid-cols-[1fr_7rem_7rem]">
        <label className="text-[8px] font-black uppercase text-slate-400">Prefix<input aria-label="Batch clip rename prefix" value={renamePrefix} onChange={(event) => setRenamePrefix(event.target.value)} className="mt-1 min-h-11 w-full rounded border border-slate-600 bg-slate-950 px-2 text-[9px] normal-case text-slate-100" /></label>
        <NumberField label="Start" value={renameStart} min={0} max={999999} onChange={setRenameStart} />
        <NumberField label="Digits" value={renameDigits} min={1} max={6} onChange={setRenameDigits} />
      </div>
      <div className="rounded-xl border border-slate-700 bg-slate-950/75 p-3"><div className="flex items-center justify-between gap-2"><strong className="text-[9px] uppercase text-sky-100">Pure rename preview</strong><span className={`text-[7px] font-black uppercase ${renamePreview.plan ? 'text-emerald-300' : 'text-amber-200'}`}>{renamePreview.plan ? `${renamePreview.plan.entries.length} ready` : 'blocked'}</span></div>{renamePreview.plan ? <div className="mt-3 space-y-1">{renamePreview.plan.entries.map((entry) => <div key={entry.clipId} className="grid gap-1 rounded border border-slate-800 bg-slate-900/80 p-2 text-[8px] sm:grid-cols-[1fr_auto_1fr]"><span className="truncate text-slate-500">{entry.sourceName}</span><span className="hidden text-sky-400 sm:block">→</span><strong className="truncate text-sky-100">{entry.outputName}</strong></div>)}<p className="pt-2 text-[8px] leading-relaxed text-slate-500">{renamePreview.plan.claim}</p></div> : <Notice tone="warn">{renamePreview.error ?? 'Create and select a clip group first.'}</Notice>}</div>
      <button type="button" disabled={!renamePreview.plan || !onApplyEditorialBatchRename || working} onClick={() => renamePreview.plan && onApplyEditorialBatchRename && void run(() => onApplyEditorialBatchRename(renamePreview.plan!), 'Canonical clip display names were changed in one project edit. Asset and disk filenames remain untouched.')} className="min-h-11 w-full rounded border border-sky-300/45 bg-sky-300/10 text-[8px] font-black uppercase text-sky-100 disabled:opacity-40">Apply display names as one project change</button>
      <Notice tone="warn">Asset names and files remain unchanged. Native disk-file mutation needs containment checks, relinking, collision policy, recovery evidence and explicit creator intent.</Notice>
    </section> : null}

    {project && state && view === 'readiness' ? <section className="space-y-3 p-3" aria-label="Editorial and Avid ecosystem capability map">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(evaluateEditorialReadiness()).map(([key, value]) => <ReadinessCard key={key} label={key.replaceAll(/([A-Z])/g, ' $1')} value={value.replaceAll('_', ' ')} ready={value === 'ready'} />)}</div>
      <Notice tone="ok">Session interchange, transcription, control surfaces, plug-in execution and immersive delivery remain separate adapters. Metadata in this workbench is never presented as decoded AAF/OMF, an AAX host, EUCON control, HDX DSP, speech analysis or a licensed renderer.</Notice>
    </section> : null}

    {notice ? <div className={`mx-3 mb-3 flex items-start gap-2 rounded border p-2 text-[8px] ${notice.tone === 'ok' ? 'border-emerald-400/25 bg-emerald-400/5 text-emerald-100' : 'border-amber-400/25 bg-amber-400/5 text-amber-100'}`} role="status">{notice.tone === 'ok' ? <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" /> : <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />}{notice.text}</div> : null}
    <div className="grid grid-cols-[1fr_auto] gap-2 border-t border-slate-800 bg-slate-950/60 px-3 py-2"><div className="flex items-start gap-2 text-[8px] leading-relaxed text-sky-100/75"><Pin className="mt-0.5 h-3 w-3 shrink-0" />Pinned tracks are ordered first in Poietek Arrange. Pin controls also appear on each canonical track header.</div><button type="button" disabled={!canUndoProject || !onUndoProject || working} title="Undo last canonical project edit" onClick={() => onUndoProject && void run(onUndoProject, 'The complete last canonical project edit was undone.')} className="min-h-11 min-w-11 rounded border border-slate-600 bg-slate-900 text-slate-300 disabled:opacity-40"><Undo2 className="mx-auto h-4 w-4" /></button></div>
    <footer className="flex items-center gap-2 border-t border-sky-300/20 bg-sky-300/5 px-3 py-2 text-[8px] text-sky-100/80"><ShieldCheck className="h-3 w-3 shrink-0" />Original Poietek workflow. No Avid code, interface artwork, session formats, audio, plug-ins, algorithms, product assets or branding are included.</footer>
  </div>;
};

const Metric: React.FC<{label: string; value: string}> = ({label, value}) => <div className="rounded-lg border border-slate-700 bg-slate-950 p-2"><span className="block text-[7px] font-black uppercase text-slate-500">{label}</span><strong className="mt-1 block truncate text-[9px] capitalize text-sky-200">{value}</strong></div>;
const Notice: React.FC<{tone: 'ok' | 'warn'; children: React.ReactNode}> = ({tone, children}) => <div className={`flex gap-2 rounded border p-2 text-[8px] leading-relaxed ${tone === 'ok' ? 'border-emerald-400/25 bg-emerald-400/5 text-emerald-100' : 'border-amber-400/25 bg-amber-400/5 text-amber-100'}`}>{tone === 'ok' ? <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" /> : <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />}{children}</div>;
const NumberField: React.FC<{label: string; value: number; min: number; max: number; disabled?: boolean; onChange(value: number): void}> = ({label, value, min, max, disabled = false, onChange}) => <label className="text-[7px] font-black uppercase text-slate-500">{label}<input type="number" value={value} min={min} max={max} disabled={disabled} onChange={(event) => onChange(Math.max(min, Math.min(max, Math.round(Number(event.target.value) || min))))} className="mt-1 min-h-10 w-full rounded border border-slate-700 bg-slate-950 px-2 text-[9px] text-slate-100 disabled:opacity-40" /></label>;
const ReadinessCard: React.FC<{label: string; value: string; ready: boolean}> = ({label, value, ready}) => <article className="rounded-lg border border-slate-700 bg-slate-950/75 p-3"><span className="block text-[7px] font-black uppercase text-slate-500">{label}</span><strong className={`mt-1 block text-[9px] capitalize ${ready ? 'text-emerald-300' : 'text-amber-200'}`}>{value}</strong></article>;
