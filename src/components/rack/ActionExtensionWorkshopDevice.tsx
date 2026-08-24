import React, {useMemo, useState} from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ListChecks,
  PackageCheck,
  Palette,
  Play,
  Redo2,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Undo2,
  Workflow,
  Zap,
} from 'lucide-react';
import type {RackModuleItem} from '../../types';
import type {PoietekProject} from '../../poietek/domain/types';
import {
  ACTION_COMMAND_CATALOG,
  addDeclaredWorkflowPackage,
  createActionWorkflowState,
  deriveWorkflowPackageReadiness,
  getProjectActionWorkflowState,
  installStarterActionSet,
  planActionRecipe,
  type ActionWorkflowMutation,
  type WorkflowPackageKind,
} from '../../poietek/action-workflows';

type WorkshopView = 'actions' | 'macros' | 'packages' | 'customize';

interface ActionExtensionWorkshopDeviceProps {
  module: RackModuleItem;
  onParametersChange(parameters: RackModuleItem['parameters']): void;
  project: PoietekProject | null;
  projectBusy?: boolean;
  canUndoProject?: boolean;
  canRedoProject?: boolean;
  onMutateActionWorkflow?(mutation: ActionWorkflowMutation): Promise<void>;
  onRunActionRecipe?(recipeId: string): Promise<void>;
  onRunCycleAction?(cycleId: string): Promise<void>;
  onUndoProject?(): Promise<void>;
  onRedoProject?(): Promise<void>;
}

const tabs: readonly {id: WorkshopView; label: string; icon: React.ComponentType<{className?: string}>}[] = [
  {id: 'actions', label: 'Actions', icon: ListChecks},
  {id: 'macros', label: 'Macros', icon: Workflow},
  {id: 'packages', label: 'Packages', icon: PackageCheck},
  {id: 'customize', label: 'Customize', icon: Palette},
];

const packageKinds: readonly WorkflowPackageKind[] = [
  'action_pack', 'theme', 'language_pack', 'script', 'dsp', 'native_extension',
];

function getCapabilities(kind: WorkflowPackageKind) {
  switch (kind) {
    case 'action_pack': return ['project_read', 'project_write'] as const;
    case 'theme': return ['theme_tokens'] as const;
    case 'language_pack': return ['translation_strings'] as const;
    case 'script': return ['project_read', 'project_write'] as const;
    case 'dsp': return ['audio_process'] as const;
    case 'native_extension': return ['native_host'] as const;
  }
}

export const ActionExtensionWorkshopDevice: React.FC<ActionExtensionWorkshopDeviceProps> = ({
  module,
  onParametersChange,
  project,
  projectBusy = false,
  canUndoProject = false,
  canRedoProject = false,
  onMutateActionWorkflow,
  onRunActionRecipe,
  onRunCycleAction,
  onUndoProject,
  onRedoProject,
}) => {
  const view = (module.parameters?.view as WorkshopView | undefined) ?? 'actions';
  const [search, setSearch] = useState('');
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [packageName, setPackageName] = useState('');
  const [packagePublisher, setPackagePublisher] = useState('');
  const [packageSource, setPackageSource] = useState('');
  const [packageDigest, setPackageDigest] = useState('');
  const [packageLicense, setPackageLicense] = useState('');
  const [packageKind, setPackageKind] = useState<WorkflowPackageKind>('action_pack');

  const workflowResult = useMemo(() => {
    if (!project) return {state: null, error: 'The canonical project is still starting.'};
    try {
      return {state: getProjectActionWorkflowState(project), error: null};
    } catch (error) {
      return {state: null, error: error instanceof Error ? error.message : 'Action workflow state is malformed.'};
    }
  }, [project]);
  const state = workflowResult.state;
  const selectedRecipe = state?.recipes.find((recipe) => recipe.id === selectedRecipeId)
    ?? state?.recipes[0]
    ?? null;
  const plan = useMemo(() => project && selectedRecipe ? planActionRecipe(project, selectedRecipe) : null, [project, selectedRecipe]);
  const filteredActions = ACTION_COMMAND_CATALOG.filter((entry) => `${entry.label} ${entry.description} ${entry.command}`.toLowerCase().includes(search.trim().toLowerCase()));

  const run = async (operation: () => Promise<void>, success: string) => {
    setMessage(null);
    try {
      await operation();
      setMessage(success);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The project action could not be completed.');
    }
  };

  const setView = (next: WorkshopView) => onParametersChange({...module.parameters, view: next});

  const handleInstallStarter = () => {
    if (!project || !onMutateActionWorkflow) return;
    void run(
      () => onMutateActionWorkflow((current) => installStarterActionSet(current, project)),
      'Starter actions and the deterministic A/B cycle were saved in the canonical project.',
    );
  };

  const handleDeclarePackage = () => {
    if (!project || !onMutateActionWorkflow) return;
    const normalizedDigest = packageDigest.replace(/\s+/g, '');
    void run(async () => {
      await onMutateActionWorkflow((current) => addDeclaredWorkflowPackage(current, {
        id: `pkg.${packageName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.${Date.now()}`,
        name: packageName.trim(),
        version: '1.0.0',
        kind: packageKind,
        publisher: packagePublisher.trim(),
        source: {kind: 'repository', reference: packageSource.trim()},
        digest: normalizedDigest ? {algorithm: 'sha256', value: normalizedDigest} : null,
        licenseSpdx: packageLicense.trim() || null,
        requestedCapabilities: [...getCapabilities(packageKind)],
        platforms: packageKind === 'native_extension'
          ? ['windows', 'macos', 'linux']
          : ['web', 'windows', 'macos', 'linux', 'android', 'ios'],
        minimumProjectSchema: '1.1.0',
        ...(packageKind === 'language_pack' ? {locale: 'und', translationCoveragePercent: 0} : {}),
      }));
      setPackageName('');
      setPackagePublisher('');
      setPackageSource('');
      setPackageDigest('');
      setPackageLicense('');
    }, 'Package provenance was declared. No package content was downloaded, installed, or executed.');
  };

  const canDeclare = Boolean(packageName.trim() && packagePublisher.trim() && packageSource.trim())
    && (!packageDigest.trim() || /^[a-f0-9]{64}$/i.test(packageDigest.replace(/\s+/g, '')));

  return (
    <div className="overflow-hidden rounded-xl border border-cyan-400/25 bg-slate-950 text-slate-100 shadow-[inset_0_0_40px_rgba(8,145,178,0.08)]">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-400/20 bg-gradient-to-r from-cyan-950/70 via-slate-950 to-indigo-950/60 px-3 py-3">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200"><Zap className="h-4 w-4" />Action & Extension Workshop</div>
          <p className="mt-1 text-[8px] text-slate-400">Allowlisted project commands · atomic undo · provenance before privilege</p>
        </div>
        <div className="flex items-center gap-1.5 text-[8px]">
          <span className="rounded border border-emerald-400/30 bg-emerald-400/5 px-2 py-1 text-emerald-200">Local project only</span>
          <span className="rounded border border-rose-400/30 bg-rose-400/5 px-2 py-1 text-rose-200">External code disabled</span>
        </div>
      </header>

      <nav className="grid grid-cols-4 border-b border-slate-800" aria-label="Action workshop sections">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return <button key={tab.id} type="button" onClick={() => setView(tab.id)} className={`min-h-11 border-r border-slate-800 px-2 py-2 text-[8px] font-black uppercase transition last:border-r-0 ${view === tab.id ? 'bg-cyan-400/10 text-cyan-200' : 'text-slate-500 hover:bg-slate-900 hover:text-slate-200'}`}><Icon className="mx-auto mb-1 h-3.5 w-3.5" />{tab.label}</button>;
        })}
      </nav>

      {workflowResult.error ? <div className="m-3 flex items-start gap-2 rounded border border-amber-400/30 bg-amber-400/5 p-3 text-[9px] text-amber-100"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{workflowResult.error}</div> : null}

      {view === 'actions' ? <section className="space-y-3 p-3">
        <div className="relative"><Search className="absolute left-3 top-3.5 h-3.5 w-3.5 text-slate-500" /><input value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search allowlisted actions" placeholder="Search local project actions" className="min-h-11 w-full rounded-lg border border-slate-700 bg-slate-900 pl-9 pr-3 text-[10px] outline-none focus:border-cyan-400" /></div>
        <div className="grid gap-2 sm:grid-cols-2">
          {filteredActions.map((entry) => <article key={entry.command} className="rounded-lg border border-slate-800 bg-slate-900/70 p-2.5"><div className="flex items-center justify-between gap-2"><strong className="text-[9px] text-cyan-100">{entry.label}</strong><span className="rounded border border-emerald-400/25 px-1.5 py-0.5 text-[7px] uppercase text-emerald-300">{entry.scope}</span></div><code className="mt-1 block text-[7px] text-indigo-300">{entry.command}</code><p className="mt-1 text-[8px] leading-relaxed text-slate-500">{entry.description}</p></article>)}
        </div>
        <div className="flex items-start gap-2 rounded-lg border border-cyan-400/20 bg-cyan-400/5 p-2 text-[8px] leading-relaxed text-cyan-100"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />Every runnable step is defined above. Macros cannot invoke JavaScript, native binaries, plug-ins, files, the shell, or the network.</div>
      </section> : null}

      {view === 'macros' ? <section className="space-y-3 p-3">
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-2.5"><span className="text-[7px] font-black uppercase text-slate-500">Canonical action set</span><strong className="mt-1 block text-[10px] text-cyan-100">{state?.recipes.length ?? 0} macros · {state?.cycles.length ?? 0} cycles</strong><p className="mt-1 text-[8px] text-slate-500">Saved under org.poietek.action-extension-workshop schema 1.0.0.</p></div>
          <button type="button" disabled={!project || projectBusy || !onMutateActionWorkflow} onClick={handleInstallStarter} className="min-h-11 rounded-lg border border-cyan-400/40 bg-cyan-400/10 px-4 text-[8px] font-black uppercase text-cyan-100 disabled:cursor-not-allowed disabled:opacity-40"><RefreshCw className="mr-1 inline h-3.5 w-3.5" />Create / refresh starter set</button>
        </div>
        {state?.recipes.length ? <div className="grid gap-3 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div className="space-y-1.5">{state.recipes.map((recipe) => <button key={recipe.id} type="button" onClick={() => setSelectedRecipeId(recipe.id)} className={`min-h-11 w-full rounded-lg border p-2 text-left ${selectedRecipe?.id === recipe.id ? 'border-cyan-300 bg-cyan-400/10' : 'border-slate-800 bg-slate-900'}`}><strong className="block text-[9px] text-slate-100">{recipe.name}</strong><span className="mt-0.5 block text-[7px] text-slate-500">{recipe.steps.length} step{recipe.steps.length === 1 ? '' : 's'} · {recipe.origin}</span></button>)}</div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
            <div className="flex items-center justify-between gap-2"><strong className="text-[10px] text-cyan-100">Dry-run plan</strong><span className={`rounded border px-2 py-1 text-[7px] font-black uppercase ${plan?.status === 'ready' ? 'border-emerald-400/30 text-emerald-300' : 'border-amber-400/30 text-amber-200'}`}>{plan?.status ?? 'not ready'}</span></div>
            <p className="mt-2 text-[8px] text-slate-500">{plan?.summary ?? 'Choose a saved macro to calculate its project changes.'}</p>
            <div className="mt-2 space-y-1">{plan?.steps.map((step) => <div key={step.stepId} className="flex items-start gap-2 rounded border border-slate-800 bg-slate-950 p-2 text-[8px]"><span className={step.status === 'ready' ? 'text-emerald-300' : 'text-amber-300'}>{step.status === 'ready' ? 'READY' : 'BLOCKED'}</span><span className="text-slate-300">{step.summary}{step.reason ? ` · ${step.reason}` : ''}</span></div>)}</div>
            <button type="button" disabled={!selectedRecipe || plan?.status !== 'ready' || projectBusy || !onRunActionRecipe} onClick={() => selectedRecipe && void run(() => onRunActionRecipe!(selectedRecipe.id), `${selectedRecipe.name} applied as one undoable project change.`)} className="mt-3 min-h-11 w-full rounded-lg bg-emerald-500 px-3 text-[9px] font-black uppercase text-emerald-950 disabled:cursor-not-allowed disabled:opacity-40"><Play className="mr-1 inline h-3.5 w-3.5 fill-current" />Apply atomically</button>
          </div>
        </div> : <div className="rounded-lg border border-dashed border-slate-700 p-5 text-center text-[9px] text-slate-500">Create the original starter set to add two tempo macros and an A/B cycle. No action runs during setup.</div>}
        {state?.cycles.map((cycle) => <div key={cycle.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-indigo-400/25 bg-indigo-400/5 p-3"><div><strong className="block text-[9px] text-indigo-200">{cycle.name}</strong><span className="text-[8px] text-slate-500">Next: {state.recipes.find((recipe) => recipe.id === cycle.recipeIds[cycle.cursor])?.name ?? 'missing recipe'}</span></div><button type="button" disabled={projectBusy || !onRunCycleAction} onClick={() => void run(() => onRunCycleAction!(cycle.id), `${cycle.name} advanced atomically.`)} className="min-h-11 rounded-lg border border-indigo-300/40 px-3 text-[8px] font-black uppercase text-indigo-100 disabled:opacity-40"><RotateCcw className="mr-1 inline h-3.5 w-3.5" />Run next</button></div>)}
        <div className="grid grid-cols-2 gap-2"><button type="button" disabled={!canUndoProject || projectBusy || !onUndoProject} onClick={() => onUndoProject && void run(onUndoProject, 'Project action undone.')} className="min-h-11 rounded-lg border border-slate-700 bg-slate-900 text-[8px] font-black uppercase disabled:opacity-40"><Undo2 className="mr-1 inline h-3.5 w-3.5" />Undo project</button><button type="button" disabled={!canRedoProject || projectBusy || !onRedoProject} onClick={() => onRedoProject && void run(onRedoProject, 'Project action restored.')} className="min-h-11 rounded-lg border border-slate-700 bg-slate-900 text-[8px] font-black uppercase disabled:opacity-40"><Redo2 className="mr-1 inline h-3.5 w-3.5" />Redo project</button></div>
      </section> : null}

      {view === 'packages' ? <section className="space-y-3 p-3">
        <div className="grid gap-2 sm:grid-cols-2">{state?.packages.map((manifest) => { const readiness = deriveWorkflowPackageReadiness(manifest); return <article key={manifest.id} className="rounded-lg border border-slate-800 bg-slate-900/70 p-3"><div className="flex items-center justify-between gap-2"><strong className="truncate text-[9px] text-cyan-100">{manifest.name}</strong><span className="rounded border border-amber-400/30 px-1.5 py-0.5 text-[7px] uppercase text-amber-200">{manifest.trust}</span></div><p className="mt-1 text-[7px] text-slate-500">{manifest.kind.replaceAll('_', ' ')} · {manifest.version} · {manifest.publisher}</p><p className="mt-2 break-all text-[7px] text-indigo-300">{manifest.source.reference}</p><p className="mt-2 text-[8px] text-slate-400">{readiness.message}</p></article>; })}</div>
        {!state?.packages.length ? <div className="rounded-lg border border-dashed border-slate-700 p-4 text-center text-[9px] text-slate-500">No third-party package has been trusted or installed.</div> : null}
        <div className="rounded-lg border border-slate-700 bg-slate-900 p-3">
          <strong className="text-[9px] uppercase text-cyan-100">Declare package provenance</strong>
          <p className="mt-1 text-[8px] text-slate-500">This stores review metadata only. It performs no download, installation, import, or execution.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <input value={packageName} onChange={(event) => setPackageName(event.target.value)} placeholder="Package name" aria-label="Package name" className="min-h-11 rounded border border-slate-700 bg-slate-950 px-3 text-[9px]" />
            <input value={packagePublisher} onChange={(event) => setPackagePublisher(event.target.value)} placeholder="Publisher" aria-label="Package publisher" className="min-h-11 rounded border border-slate-700 bg-slate-950 px-3 text-[9px]" />
            <select value={packageKind} onChange={(event) => setPackageKind(event.target.value as WorkflowPackageKind)} aria-label="Package kind" className="min-h-11 rounded border border-slate-700 bg-slate-950 px-3 text-[9px]">{packageKinds.map((kind) => <option key={kind} value={kind}>{kind.replaceAll('_', ' ')}</option>)}</select>
            <input value={packageLicense} onChange={(event) => setPackageLicense(event.target.value)} placeholder="SPDX license (optional)" aria-label="Package SPDX license" className="min-h-11 rounded border border-slate-700 bg-slate-950 px-3 text-[9px]" />
            <input value={packageSource} onChange={(event) => setPackageSource(event.target.value)} placeholder="Repository or source reference" aria-label="Package source reference" className="min-h-11 rounded border border-slate-700 bg-slate-950 px-3 text-[9px] sm:col-span-2" />
            <input value={packageDigest} onChange={(event) => setPackageDigest(event.target.value)} placeholder="SHA-256 digest (optional until review)" aria-label="Package SHA-256 digest" className="min-h-11 rounded border border-slate-700 bg-slate-950 px-3 text-[9px] sm:col-span-2" />
          </div>
          <button type="button" disabled={!canDeclare || projectBusy || !onMutateActionWorkflow} onClick={handleDeclarePackage} className="mt-3 min-h-11 w-full rounded-lg border border-cyan-400/40 bg-cyan-400/10 text-[8px] font-black uppercase text-cyan-100 disabled:cursor-not-allowed disabled:opacity-40"><PackageCheck className="mr-1 inline h-3.5 w-3.5" />Declare metadata only</button>
        </div>
      </section> : null}

      {view === 'customize' ? <section className="grid gap-2 p-3 sm:grid-cols-2">
        <PolicyCard title="Theme tokens" detail="A verified theme may propose colors, spacing and layouts only through a reviewed token adapter. It cannot carry executable code." />
        <PolicyCard title="Language coverage" detail="Locale, translation coverage and fallback strings remain explicit. Stale or missing strings fall back to the built-in language." />
        <PolicyCard title="Screens and rack sets" detail="Existing templates remain the portable workspace/screen-set layer. Project actions never rewrite the user’s rack layout." />
        <PolicyCard title="Scripts, DSP and native code" detail="Even a digest-verified package remains non-executable until a separately reviewed sandbox or native host adapter exists." />
      </section> : null}

      {message ? <div className={`mx-3 mb-3 flex items-start gap-2 rounded border p-2 text-[8px] ${/could not|blocked|requires|malformed|not found/i.test(message) ? 'border-amber-400/30 bg-amber-400/5 text-amber-100' : 'border-emerald-400/30 bg-emerald-400/5 text-emerald-100'}`} role="status"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />{message}</div> : null}
      <footer className="flex items-center gap-2 border-t border-cyan-400/15 bg-cyan-400/5 px-3 py-2 text-[8px] text-cyan-100/80"><ShieldCheck className="h-3.5 w-3.5 shrink-0" />Dry-run first. Apply through one canonical ProjectSession mutation. Package trust never grants execution.</footer>
    </div>
  );
};

const PolicyCard: React.FC<{title: string; detail: string}> = ({title, detail}) => <article className="rounded-lg border border-slate-800 bg-slate-900/70 p-3"><strong className="text-[9px] uppercase text-cyan-100">{title}</strong><p className="mt-1 text-[8px] leading-relaxed text-slate-500">{detail}</p></article>;
