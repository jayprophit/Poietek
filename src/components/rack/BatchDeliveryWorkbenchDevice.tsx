import React, {useMemo, useState} from 'react';
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Download,
  FileAudio,
  FileOutput,
  FlaskConical,
  FolderTree,
  GitBranch,
  ListChecks,
  RadioTower,
  ShieldCheck,
} from 'lucide-react';
import type {RackModuleItem} from '../../types';
import type {PoietekProject} from '../../poietek/domain/types';
import {
  createBatchDeliveryManifest,
  createBatchDeliveryStarter,
  createBatchDeliveryState,
  createBatchDryRunPlan,
  deriveBatchDeliveryReadiness,
  getProjectBatchDeliveryState,
  selectBatchPilot,
  setBatchSourceAssetIds,
  upsertBatchOutputVariant,
  upsertBatchRecipeNode,
  type BatchConflictPolicy,
  type BatchDeliveryMutation,
  type BatchDeliveryState,
  type BatchOutputVariant,
} from '../../poietek/production-workflows';

interface BatchDeliveryWorkbenchDeviceProps {
  module: RackModuleItem;
  onParametersChange(parameters: RackModuleItem['parameters']): void;
  project?: PoietekProject | null;
  projectBusy?: boolean;
  onMutateBatchDelivery?(mutation: BatchDeliveryMutation): Promise<void>;
}

type BatchView = 'sources' | 'recipe' | 'outputs' | 'dry_run' | 'pilot';

const views = [
  {id: 'sources', label: 'Sources', icon: FileAudio},
  {id: 'recipe', label: 'Recipe', icon: GitBranch},
  {id: 'outputs', label: 'Outputs', icon: FileOutput},
  {id: 'dry_run', label: 'Dry run', icon: ListChecks},
  {id: 'pilot', label: 'Pilot', icon: FlaskConical},
] as const;

const conflictLabels: Readonly<Record<BatchConflictPolicy, string>> = {
  skip: 'Preserve & skip',
  version: 'Create new version',
  replace_intent: 'Replace intent',
};

export const BatchDeliveryWorkbenchDevice: React.FC<BatchDeliveryWorkbenchDeviceProps> = ({
  module,
  onParametersChange,
  project = null,
  projectBusy = false,
  onMutateBatchDelivery,
}) => {
  const parameters = module.parameters ?? {};
  const candidateView = String(parameters.view ?? 'sources');
  const view = views.some((candidate) => candidate.id === candidateView) ? candidateView as BatchView : 'sources';
  const [actionState, setActionState] = useState<'idle' | 'saving'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const loaded = useMemo(() => {
    if (!project) return {state: null, error: null};
    try { return {state: getProjectBatchDeliveryState(project) ?? createBatchDeliveryState(project.id), error: null}; }
    catch (reason) { return {state: null, error: reason instanceof Error ? reason.message : String(reason)}; }
  }, [project]);
  const state = loaded.state;
  const audioAssets = project?.assets.filter((asset) => asset.mediaType === 'audio') ?? [];
  const plan = useMemo(() => {
    if (!state || !project) return null;
    try { return createBatchDryRunPlan(state, project); } catch { return null; }
  }, [project, state]);
  const readiness = useMemo(() => state && plan ? deriveBatchDeliveryReadiness(state, plan, []) : null, [plan, state]);
  const busy = projectBusy || actionState !== 'idle';

  const updateView = (next: BatchView) => onParametersChange({...parameters, view: next});
  const runMutation = async (mutation: BatchDeliveryMutation, success: string) => {
    if (!onMutateBatchDelivery || busy) return;
    setActionState('saving');
    setMessage(null);
    try { await onMutateBatchDelivery(mutation); setMessage(success); }
    catch (reason) { setMessage(reason instanceof Error ? reason.message : String(reason)); }
    finally { setActionState('idle'); }
  };

  const createStarter = () => {
    if (!project) return;
    void runMutation(() => createBatchDeliveryStarter(project), 'Batch Delivery starter saved in canonical project history. Nothing was rendered or written.');
  };

  const toggleSource = (assetId: string) => {
    if (!state || !project) return;
    const next = state.sourceAssetIds.includes(assetId)
      ? state.sourceAssetIds.filter((candidate) => candidate !== assetId)
      : [...state.sourceAssetIds, assetId];
    void runMutation((current) => setBatchSourceAssetIds(current, project, next), 'Canonical batch source set updated. Pilot evidence was reset because the batch scope changed.');
  };

  const updateOutput = (output: BatchOutputVariant) => {
    void runMutation((current) => upsertBatchOutputVariant(current, output), `${output.name} updated. Its pilot approval was reset because the delivery plan changed.`);
  };

  const downloadManifest = () => {
    if (!state || !project) return;
    try {
      const blob = new Blob([createBatchDeliveryManifest(state, project)], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${safeFilename(project.title)}-batch-delivery-plan.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage('Planning manifest exported locally. It contains no audio, plug-ins, analyzed measurements or render claim.');
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : String(reason));
    }
  };

  return (
    <div className="poietek-workbench-device overflow-hidden rounded-xl border border-violet-400/35 bg-[#100b19] text-slate-100 shadow-inner">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-violet-300/20 bg-gradient-to-r from-violet-950 via-slate-950 to-fuchsia-950 px-3 py-2">
        <div className="flex items-center gap-2">
          <Boxes className="h-4 w-4 text-violet-200" />
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.15em] text-violet-100">Batch Delivery Workshop</div>
            <div className="text-[9px] text-slate-400">many assets · reusable recipes · protected paths · one-file pilot · evidence reports</div>
          </div>
        </div>
        <span className="rounded-full border border-emerald-400/35 bg-emerald-400/10 px-2 py-1 text-[8px] font-black uppercase text-emerald-200">Preview-first project data</span>
      </header>

      <nav className="grid grid-cols-5 border-b border-slate-700/80" aria-label="Batch delivery views">
        {views.map((item) => {
          const Icon = item.icon;
          return <button key={item.id} type="button" aria-pressed={view === item.id} onClick={() => updateView(item.id)} className={`flex min-h-11 items-center justify-center gap-1 border-r border-slate-700/60 px-1 py-2 text-[7px] font-black uppercase last:border-r-0 ${view === item.id ? 'bg-violet-300 text-slate-950' : 'bg-slate-950/70 text-slate-400 hover:bg-slate-800'}`}><Icon className="h-3 w-3" />{item.label}</button>;
        })}
      </nav>

      {!project && <section className="p-3"><Notice tone="amber">The canonical local project is still starting. Batch plans cannot be saved yet.</Notice></section>}
      {loaded.error && <section className="p-3"><Notice tone="rose">{loaded.error}</Notice></section>}

      {project && state && !state.outputs.length && <section className="space-y-3 p-3">
        <div className="rounded-lg border border-violet-400/25 bg-gradient-to-br from-slate-950 to-violet-950/40 p-4">
          <h3 className="text-sm font-black text-white">Prepare a complete library without risking the originals</h3>
          <p className="mt-2 text-[9px] leading-relaxed text-slate-400">Build an original provider-neutral recipe, three reusable deliverables and portable naming rules. Every canonical audio asset can be selected, previewed as a one-file pilot and expanded only after approval.</p>
          <button type="button" disabled={!onMutateBatchDelivery || busy} onClick={createStarter} className="mt-3 min-h-11 w-full rounded border border-violet-400/40 bg-violet-400/10 px-3 text-[8px] font-black uppercase text-violet-100 disabled:opacity-40">Create safe batch starter</button>
        </div>
        <Notice tone={audioAssets.length ? 'cyan' : 'amber'}>{audioAssets.length ? `${audioAssets.length} canonical audio ${audioAssets.length === 1 ? 'asset is' : 'assets are'} available for the starter source set.` : 'Import or record canonical audio assets first. The recipe and output rules can still be created now.'}</Notice>
      </section>}

      {project && state && state.outputs.length > 0 && view === 'sources' && <section className="space-y-3 p-3" aria-label="Canonical batch sources">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatusCard label="Project audio" value={String(audioAssets.length)} />
          <StatusCard label="Selected" value={String(state.sourceAssetIds.length)} />
          <StatusCard label="Deliverables" value={String(state.outputs.length)} />
          <StatusCard label="Revision" value={`r${state.revision}`} />
        </div>
        <div className="space-y-2">
          {audioAssets.map((asset) => {
            const selected = state.sourceAssetIds.includes(asset.id);
            return <button key={asset.id} type="button" disabled={!onMutateBatchDelivery || busy} onClick={() => toggleSource(asset.id)} className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-lg border p-3 text-left ${selected ? 'border-violet-300 bg-violet-300/10' : 'border-slate-700 bg-slate-950 hover:border-slate-500'}`}>
              <span className="min-w-0"><span className="block truncate text-[9px] font-black text-white">{asset.originalName}</span><span className="mt-1 block text-[7px] text-slate-500">{formatAssetDetails(asset.sampleRate, asset.channels, asset.byteLength)}</span></span>
              <span className={`shrink-0 rounded-full px-2 py-1 text-[7px] font-black uppercase ${selected ? 'bg-violet-300 text-slate-950' : 'bg-slate-800 text-slate-500'}`}>{selected ? 'Included' : 'Excluded'}</span>
            </button>;
          })}
          {!audioAssets.length && <Notice tone="amber">No audio asset is currently registered in the canonical project. This workshop does not scan arbitrary device folders or invent media references.</Notice>}
        </div>
        <Notice tone="cyan">Sources are durable references to canonical assets. The originals stay immutable; output paths are planned separately.</Notice>
      </section>}

      {project && state && state.outputs.length > 0 && view === 'recipe' && <section className="space-y-3 p-3" aria-label="Provider-neutral batch recipe">
        <div className="rounded-lg border border-slate-700 bg-slate-950 p-3">
          <p className="text-[8px] font-black uppercase text-violet-200">{state.recipe.name}</p>
          <p className="mt-1 text-[8px] leading-relaxed text-slate-400">{state.recipe.description}</p>
        </div>
        <div className="grid gap-2 lg:grid-cols-3">
          {state.recipe.nodes.map((node, index) => <article key={node.id} className="rounded-lg border border-slate-700 bg-slate-950 p-3">
            <div className="flex items-center justify-between gap-2"><span className="text-[7px] font-black uppercase text-slate-500">Step {index + 1} · {node.kind.replaceAll('_', ' ')}</span><button type="button" disabled={!onMutateBatchDelivery || busy} onClick={() => void runMutation((current) => upsertBatchRecipeNode(current, {...node, enabled: !node.enabled}), `${node.name} ${node.enabled ? 'bypassed' : 'enabled'}; the pilot must be previewed again.`)} className={`min-h-8 rounded px-2 text-[7px] font-black uppercase ${node.enabled ? 'bg-violet-300 text-slate-950' : 'bg-slate-800 text-slate-500'}`}>{node.enabled ? 'Enabled' : 'Bypassed'}</button></div>
            <h3 className="mt-2 text-[10px] font-black text-white">{node.name}</h3>
            <p className="mt-2 text-[8px] leading-relaxed text-slate-400">{Object.entries(node.parameters).map(([key, value]) => `${key}: ${String(value)}`).join(' · ') || 'No parameters'}</p>
            <p className="mt-2 text-[7px] uppercase text-amber-200">{node.engineState.replace('_', ' ')}{node.requiredCapability ? ` · ${node.requiredCapability}` : ''}</p>
          </article>)}
        </div>
        <Notice tone="amber">This graph stores ordered processing intent. It does not host a plug-in, run DSP, analyze a level or alter an asset in the browser.</Notice>
      </section>}

      {project && state && state.outputs.length > 0 && view === 'outputs' && <section className="space-y-3 p-3" aria-label="Batch output variants">
        <Notice tone="cyan">Portable tokens: {'{project} {asset} {variant} {version} {counter:3} {sample_rate} {channels} {hash8} {ext}'}</Notice>
        <div className="grid gap-3 lg:grid-cols-3">
          {state.outputs.map((output) => <OutputCard key={`${output.id}:${state.revision}`} output={output} disabled={!onMutateBatchDelivery || busy} onUpdate={updateOutput} />)}
        </div>
        <Notice tone="amber">“Replace intent” never overwrites by itself. The desktop filesystem adapter must re-check containment, confirm replacement and use a recoverable temporary-file swap.</Notice>
      </section>}

      {project && state && state.outputs.length > 0 && view === 'dry_run' && <section className="space-y-3 p-3" aria-label="Batch dry-run plan">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Gate label="Path containment" ready={Boolean(plan)} />
          <Gate label={`${plan?.readyCount ?? 0} ready`} ready={Boolean(plan?.canQueue)} />
          <Gate label={`${plan?.skippedCount ?? 0} skipped`} ready={(plan?.blockedCount ?? 0) === 0} />
          <Gate label={`${plan?.blockedCount ?? 0} blocked`} ready={(plan?.blockedCount ?? 0) === 0} />
        </div>
        <div className="max-h-64 overflow-auto rounded-lg border border-slate-700 bg-slate-950">
          <table className="w-full min-w-[640px] text-left text-[8px]"><thead className="sticky top-0 bg-slate-900 uppercase text-slate-500"><tr><th className="px-3 py-2">Source</th><th className="px-3 py-2">Deliverable</th><th className="px-3 py-2">Relative output path</th><th className="px-3 py-2">State</th></tr></thead><tbody>{plan?.entries.map((entry) => <tr key={`${entry.sourceAssetId}:${entry.outputVariantId}`} className="border-t border-slate-800 text-slate-300"><td className="max-w-40 truncate px-3 py-2 font-bold text-white">{entry.sourceName}</td><td className="px-3 py-2">{entry.outputVariantName}</td><td className="px-3 py-2 font-mono text-violet-200">{entry.relativePath || entry.issues.join(' ')}</td><td className={`px-3 py-2 font-black uppercase ${entry.state === 'ready' ? 'text-emerald-300' : entry.state === 'skipped' ? 'text-amber-300' : 'text-rose-300'}`}>{entry.state}</td></tr>)}{!plan?.entries.length && <tr><td colSpan={4} className="px-3 py-6 text-center text-slate-500">Select at least one canonical source to resolve the dry run.</td></tr>}</tbody></table>
        </div>
        <Notice tone={plan?.canQueue ? 'cyan' : 'amber'}>{plan?.claim ?? 'The current plan could not be resolved.'}</Notice>
      </section>}

      {project && state && state.outputs.length > 0 && view === 'pilot' && <section className="space-y-3 p-3" aria-label="Batch pilot and delivery readiness">
        <div className="grid gap-3 lg:grid-cols-[1fr_1.25fr]">
          <article className="rounded-lg border border-violet-400/25 bg-gradient-to-br from-slate-950 to-violet-950/40 p-3">
            <div className="flex items-center gap-2"><FlaskConical className="h-4 w-4 text-violet-200" /><p className="text-[8px] font-black uppercase text-violet-200">One-file pilot</p></div>
            <label className="mt-3 block text-[7px] font-black uppercase text-slate-500">Pilot source<select value={state.pilot.assetId ?? ''} disabled={!state.sourceAssetIds.length || !onMutateBatchDelivery || busy} onChange={(event) => void runMutation((current) => selectBatchPilot(current, event.target.value), 'Pilot source selected. Preview evidence is required before approval.')} className="mt-1 min-h-11 w-full rounded border border-slate-700 bg-slate-900 px-2 text-[9px] text-white"><option value="" disabled>Select source</option>{state.sourceAssetIds.map((assetId) => <option key={assetId} value={assetId}>{project.assets.find((asset) => asset.id === assetId)?.originalName ?? assetId}</option>)}</select></label>
            <div className="mt-3 rounded border border-amber-400/25 bg-amber-400/5 p-2 text-[8px] text-amber-100"><p className="font-black uppercase">{state.pilot.status.replaceAll('_', ' ')}</p><p className="mt-1 leading-relaxed">A verified preview renderer must audition this exact revision and return an evidence reference. The browser cannot self-approve it.</p></div>
          </article>
          <article className="rounded-lg border border-slate-700 bg-slate-950 p-3">
            <p className="text-[8px] font-black uppercase text-violet-200">Readiness gates</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Gate label="Safe dry run" ready={Boolean(readiness?.localPlanReady)} />
              <Gate label="Pilot approved" ready={Boolean(readiness?.pilotApproved)} />
              <Gate label="Adapters evidenced" ready={Boolean(readiness?.adaptersObserved)} />
            </div>
            <p className="mt-3 text-[8px] leading-relaxed text-slate-400">{readiness?.claim}</p>
            {readiness?.missingCapabilities.length ? <p className="mt-2 break-words text-[7px] text-amber-200">Missing: {readiness.missingCapabilities.join(' · ')}</p> : null}
          </article>
        </div>
        {state.lastRun ? <Notice tone={state.lastRun.status === 'success' ? 'cyan' : 'amber'}>Observed run: {state.lastRun.status} · {state.lastRun.succeeded} succeeded · {state.lastRun.failed} failed · {state.lastRun.skipped} skipped · evidence {state.lastRun.evidenceReference}</Notice> : <Notice tone="amber">No render report has been observed. Poietek therefore makes no finished-file, codec, loudness, plug-in or delivery claim.</Notice>}
        <button type="button" disabled={!plan} onClick={downloadManifest} className="flex min-h-11 w-full items-center justify-center gap-2 rounded border border-violet-400/40 bg-violet-400/10 px-3 text-[8px] font-black uppercase text-violet-100 disabled:opacity-40"><Download className="h-3.5 w-3.5" />Export dry-run manifest</button>
      </section>}

      {message && <div className="border-t border-slate-700 bg-slate-950 px-3 py-2 text-[8px] text-violet-100" role="status">{message}</div>}
    </div>
  );
};

function OutputCard({output, disabled, onUpdate}: {key?: React.Key; output: BatchOutputVariant; disabled: boolean; onUpdate(output: BatchOutputVariant): void}) {
  return <article className="rounded-lg border border-slate-700 bg-slate-950 p-3">
    <div className="flex items-center justify-between gap-2"><div><p className="text-[7px] font-black uppercase text-violet-200">{output.format} · {String(output.sampleRate)} Hz</p><h3 className="mt-1 text-[10px] font-black text-white">{output.name}</h3></div><FolderTree className="h-4 w-4 text-violet-300" /></div>
    <label className="mt-3 block text-[7px] font-black uppercase text-slate-500">Portable naming template<input defaultValue={output.namingTemplate} disabled={disabled} onBlur={(event) => {if (event.target.value !== output.namingTemplate) onUpdate({...output, namingTemplate: event.target.value});}} className="mt-1 min-h-11 w-full rounded border border-slate-700 bg-slate-900 px-2 font-mono text-[8px] normal-case text-white" /></label>
    <label className="mt-2 block text-[7px] font-black uppercase text-slate-500">Existing path policy<select value={output.conflictPolicy} disabled={disabled} onChange={(event) => onUpdate({...output, conflictPolicy: event.target.value as BatchConflictPolicy})} className="mt-1 min-h-11 w-full rounded border border-slate-700 bg-slate-900 px-2 text-[8px] text-white">{Object.entries(conflictLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <p className="mt-3 text-[7px] leading-relaxed text-slate-400">{output.channels} channels · {output.bitDepth === null ? 'codec depth' : `${output.bitDepth}-bit`} · {output.normalization === 'none' ? 'no normalization' : `${output.normalization.replace('_', ' ')} ${output.target}`}</p>
  </article>;
}

function StatusCard({label, value}: {label: string; value: string}) {
  return <div className="min-w-0 rounded-lg border border-violet-400/25 bg-violet-400/5 p-2"><p className="text-[7px] font-black uppercase text-slate-500">{label}</p><p className="mt-1 truncate text-[10px] font-black text-violet-100" title={value}>{value}</p></div>;
}

function Gate({label, ready}: {label: string; ready: boolean}) {
  return <div className={`rounded-lg border p-2 text-center ${ready ? 'border-emerald-400/30 bg-emerald-400/5' : 'border-amber-400/30 bg-amber-400/5'}`}>{ready ? <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-300" /> : <RadioTower className="mx-auto h-4 w-4 text-amber-300" />}<p className={`mt-1 text-[7px] font-black uppercase ${ready ? 'text-emerald-200' : 'text-amber-200'}`}>{label}</p></div>;
}

function Notice({children, tone}: {children: React.ReactNode; tone: 'cyan' | 'amber' | 'rose'}) {
  const styles = tone === 'cyan' ? 'border-emerald-400/30 bg-emerald-400/5 text-emerald-100' : tone === 'rose' ? 'border-rose-400/30 bg-rose-400/5 text-rose-100' : 'border-amber-400/30 bg-amber-400/5 text-amber-100';
  const Icon = tone === 'cyan' ? ShieldCheck : AlertTriangle;
  return <div className={`flex gap-2 rounded-lg border p-2 text-[8px] leading-relaxed ${styles}`}><Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{children}</span></div>;
}

function formatAssetDetails(sampleRate: number | null, channels: number | null, bytes: number): string {
  const size = bytes >= 1_048_576 ? `${(bytes / 1_048_576).toFixed(1)} MB` : `${Math.max(0, Math.round(bytes / 1024))} KB`;
  return `${sampleRate ? `${sampleRate} Hz` : 'rate unknown'} · ${channels ? `${channels} ch` : 'channels unknown'} · ${size}`;
}

function safeFilename(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'poietek';
}
