import React, {useMemo, useState} from 'react';
import {AlertTriangle, CheckCircle2, Dice5, ListMusic, ShieldCheck, Sparkles, Undo2} from 'lucide-react';
import type {PoietekProject} from '../../poietek/domain/types';
import {readProductionEngineReadiness} from '../../poietek/engines/extension';
import {
  listProjectMidiClips,
  planProjectMidiOperation,
  type CreateStarterMidiClipInput,
  type MusicalScale,
  type NoteForgeOperationInput,
} from '../../poietek/engines/midiLab';
import type {RackModuleItem} from '../../types';

interface NoteForgeMidiLabDeviceProps {
  module: RackModuleItem;
  onParametersChange(parameters: RackModuleItem['parameters']): void;
  project: PoietekProject | null;
  projectBusy: boolean;
  canUndoProject: boolean;
  onCreateStarterMidiClip?(input: CreateStarterMidiClipInput): Promise<void>;
  onCommitMidiOperation?(input: NoteForgeOperationInput): Promise<void>;
  onUndoProject?(): Promise<void>;
}

type NoteForgeView = 'clips' | 'transform' | 'generate' | 'readiness';
type TransformKind = 'quantize' | 'humanize' | 'transpose' | 'scale_constrain';
type GeneratorKind = 'rhythm_generate' | 'chord_generate';

const views: readonly {id: NoteForgeView; label: string; icon: typeof ListMusic}[] = [
  {id: 'clips', label: 'Clip ideas', icon: ListMusic},
  {id: 'transform', label: 'Variations', icon: Sparkles},
  {id: 'generate', label: 'Generators', icon: Dice5},
  {id: 'readiness', label: 'Readiness', icon: ShieldCheck},
];

export const NoteForgeMidiLabDevice: React.FC<NoteForgeMidiLabDeviceProps> = ({
  module,
  onParametersChange,
  project,
  projectBusy,
  canUndoProject,
  onCreateStarterMidiClip,
  onCommitMidiOperation,
  onUndoProject,
}) => {
  const parameters = module.parameters ?? {};
  const view = String(parameters.view ?? 'clips') as NoteForgeView;
  const transformKind = String(parameters.transformKind ?? 'quantize') as TransformKind;
  const generatorKind = String(parameters.generatorKind ?? 'rhythm_generate') as GeneratorKind;
  const scale = String(parameters.scale ?? 'minor') as MusicalScale;
  const seed = Number(parameters.seed ?? 17);
  const amount = Number(parameters.amount ?? 7);
  const rootNote = Number(parameters.rootNote ?? 48);
  const [localBusy, setLocalBusy] = useState(false);
  const [notice, setNotice] = useState<{tone: 'ok' | 'warn'; text: string} | null>(null);

  const model = useMemo(() => {
    if (!project) return {clips: [], revision: 0, transformations: 0, error: null as string | null};
    try {
      const result = readProductionEngineReadiness(project);
      return {
        clips: listProjectMidiClips(project),
        revision: result.state === 'ready' ? result.readiness.revision : 0,
        transformations: result.state === 'ready' ? result.readiness.midiScoring.transformations.length : 0,
        error: null as string | null,
      };
    } catch (error) {
      return {clips: [], revision: 0, transformations: 0, error: error instanceof Error ? error.message : String(error)};
    }
  }, [project]);

  const sourceClipId = String(parameters.sourceClipId ?? model.clips[0]?.id ?? '');
  const sourceClip = model.clips.find((clip) => clip.id === sourceClipId) ?? model.clips[0] ?? null;
  const midiTrack = project?.tracks.find((track) => track.id === sourceClip?.trackId)
    ?? project?.tracks.find((track) => track.type === 'midi' || track.type === 'instrument')
    ?? null;
  const operationInput = useMemo<NoteForgeOperationInput | null>(() => {
    if (!project) return null;
    const suffix = `${model.revision + 1}.${model.transformations + 1}`;
    if (view === 'transform' && sourceClip) {
      const common = {id: `note-forge.transform.${suffix}`, outputClipId: `note-forge.clip.transform.${suffix}`, sourceClipId: sourceClip.id, outputName: `${sourceClip.name} · ${transformKind.replace('_', ' ')}`};
      if (transformKind === 'quantize') return {...common, kind: 'quantize', gridTicks: Math.max(1, Math.round(project.settings.ppq / 4)), strength: Math.min(1, Math.max(0, amount / 10))};
      if (transformKind === 'humanize') return {...common, kind: 'humanize', seed, timingTicks: Math.max(0, Math.round(amount * 4)), velocityAmount: Math.max(0, Math.round(amount))};
      if (transformKind === 'transpose') return {...common, kind: 'transpose', semitones: Math.round(amount)};
      return {...common, kind: 'scale_constrain', rootNote, scale};
    }
    if (view === 'generate' && midiTrack) {
      const common = {id: `note-forge.generate.${suffix}`, outputClipId: `note-forge.clip.generate.${suffix}`, trackId: midiTrack.id, seed, rootNote, outputName: generatorKind === 'rhythm_generate' ? `Pulse ${amount}/16` : `${scale.replace('_', ' ')} chord path`};
      if (generatorKind === 'rhythm_generate') return {...common, kind: 'rhythm_generate', stepCount: 16, pulses: Math.min(16, Math.max(1, Math.round(amount))), stepTicks: Math.max(1, Math.round(project.settings.ppq / 4))};
      return {...common, kind: 'chord_generate', scale, chordCount: 4, chordTicks: project.settings.ppq};
    }
    return null;
  }, [amount, generatorKind, midiTrack, model.revision, model.transformations, project, rootNote, scale, seed, sourceClip, transformKind, view]);
  const plan = useMemo(() => project && operationInput ? planProjectMidiOperation(project, operationInput) : null, [operationInput, project]);
  const busy = projectBusy || localBusy;

  const updateParameters = (patch: Record<string, number | boolean | string>) => onParametersChange({...parameters, ...patch});
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
  const createStarter = () => {
    if (!onCreateStarterMidiClip) return;
    const ordinal = model.clips.length + 1;
    const trackId = midiTrack?.id ?? 'track.note-forge.ideas';
    void run(
      () => onCreateStarterMidiClip({trackId, clipId: `note-forge.clip.starter.${ordinal}`, trackName: 'Note Forge Ideas', clipName: `Starter Pulse ${ordinal}`}),
      'A canonical four-beat MIDI starter clip was saved locally. It is ready for deterministic variations and project undo.',
    );
  };
  const commit = () => {
    if (!operationInput || !onCommitMidiOperation) return;
    void run(
      () => onCommitMidiOperation(operationInput),
      'The preview became a new canonical MIDI clip in one undoable project edit. The source clip remains unchanged.',
    );
  };

  return <div className="poietek-workbench-device overflow-hidden rounded-xl border border-teal-300/35 bg-[#071719] text-slate-100 shadow-inner">
    <header className="flex flex-wrap items-center justify-between gap-2 border-b border-teal-300/20 bg-gradient-to-r from-teal-950 via-slate-950 to-cyan-950 px-3 py-2">
      <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-teal-200" /><div><div className="text-[10px] font-black uppercase tracking-[0.15em] text-teal-100">Note Forge MIDI Lab</div><div className="text-[9px] text-slate-400">Project clips → constrained ideas → non-destructive variations</div></div></div>
      <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2 py-1 text-[8px] font-black uppercase text-emerald-200">Local · deterministic · undoable</span>
    </header>

    <nav className="grid grid-cols-4 border-b border-slate-700/80" aria-label="Note Forge views">{views.map((item) => {const Icon = item.icon; return <button key={item.id} type="button" aria-pressed={view === item.id} onClick={() => updateParameters({view: item.id})} className={`flex min-h-11 items-center justify-center gap-1 border-r border-slate-700/60 px-1 py-2 text-[8px] font-black uppercase last:border-r-0 ${view === item.id ? 'bg-teal-300 text-slate-950' : 'bg-slate-950/70 text-slate-400 hover:bg-slate-800'}`}><Icon className="h-3 w-3" />{item.label}</button>;})}</nav>

    {!project && <section className="p-3"><Notice tone="warn">The canonical local project is still starting. MIDI ideas cannot be saved yet.</Notice></section>}
    {model.error && <section className="p-3"><Notice tone="warn">{model.error}</Notice></section>}

    {project && !model.error && view === 'clips' && <section className="space-y-3 p-3" aria-label="Canonical MIDI clip ideas">
      <div className="grid grid-cols-3 gap-2"><Metric label="MIDI clips" value={String(model.clips.length)} /><Metric label="Variations" value={String(model.transformations)} /><Metric label="Project PPQ" value={String(project.settings.ppq)} /></div>
      {model.clips.length ? <div className="space-y-2">{model.clips.map((clip) => <button key={clip.id} type="button" aria-pressed={sourceClip?.id === clip.id} onClick={() => updateParameters({sourceClipId: clip.id})} className={`grid min-h-12 w-full grid-cols-[1fr_auto] items-center gap-2 rounded-lg border p-3 text-left ${sourceClip?.id === clip.id ? 'border-teal-300 bg-teal-300/10' : 'border-slate-700 bg-slate-950/75'}`}><span className="min-w-0"><strong className="block truncate text-[9px] text-teal-100">{clip.name}</strong><span className="block text-[8px] text-slate-500">{clip.events.filter((event) => event.type === 'note').length} notes · {clip.durationTicks} ticks · start {clip.startTick}</span></span><span className="text-[7px] uppercase text-slate-500">{clip.id === sourceClip?.id ? 'source' : 'select'}</span></button>)}</div> : <Notice tone="warn">No canonical MIDI clips exist yet. Start with a saved four-beat idea; Note Forge never invents clips until you ask.</Notice>}
      <button type="button" disabled={!onCreateStarterMidiClip || busy} onClick={createStarter} className="min-h-11 w-full rounded border border-teal-300/45 bg-teal-300/10 px-3 text-[8px] font-black uppercase text-teal-100 disabled:opacity-40">{busy ? 'Saving starter clip…' : model.clips.length ? 'Add another starter clip' : 'Create starter MIDI clip'}</button>
    </section>}

    {project && !model.error && view === 'transform' && <section className="space-y-3 p-3" aria-label="MIDI variation preview">
      <label className="block text-[8px] font-black uppercase text-slate-400">Source clip<select value={sourceClip?.id ?? ''} disabled={!model.clips.length} onChange={(event) => updateParameters({sourceClipId: event.target.value})} className="mt-1 min-h-11 w-full rounded border border-slate-600 bg-slate-950 px-2 text-[9px] normal-case text-slate-100">{model.clips.map((clip) => <option key={clip.id} value={clip.id}>{clip.name}</option>)}</select></label>
      <div className="grid grid-cols-2 gap-2"><Select label="Variation" value={transformKind} onChange={(value) => updateParameters({transformKind: value})} options={[['quantize', 'Tighten timing'], ['humanize', 'Seeded feel'], ['transpose', 'Transpose'], ['scale_constrain', 'Constrain to scale']]} /><NumberField label={transformKind === 'transpose' ? 'Semitones' : transformKind === 'humanize' ? 'Feel amount' : transformKind === 'quantize' ? 'Strength 0–10' : 'Scale root MIDI'} value={transformKind === 'scale_constrain' ? rootNote : amount} min={transformKind === 'transpose' ? -24 : 0} max={transformKind === 'scale_constrain' ? 115 : transformKind === 'quantize' ? 10 : 24} onChange={(value) => updateParameters(transformKind === 'scale_constrain' ? {rootNote: value} : {amount: value})} /></div>
      {transformKind === 'scale_constrain' && <ScaleSelect scale={scale} onChange={(value) => updateParameters({scale: value})} />}
      <PlanPreview plan={plan} />
      <CommitControls ready={Boolean(plan?.ready)} busy={busy} canUndo={canUndoProject} onCommit={commit} onUndo={() => onUndoProject && void run(onUndoProject, 'The complete last MIDI project edit was undone.')} />
    </section>}

    {project && !model.error && view === 'generate' && <section className="space-y-3 p-3" aria-label="Constrained MIDI generators">
      {!midiTrack && <Notice tone="warn">Create a starter MIDI clip first so generated ideas have a canonical project track.</Notice>}
      <div className="grid grid-cols-2 gap-2"><Select label="Generator" value={generatorKind} onChange={(value) => updateParameters({generatorKind: value})} options={[['rhythm_generate', 'Rhythm pulse'], ['chord_generate', 'Chord path']]} /><NumberField label="Seed" value={seed} min={0} max={9999} onChange={(value) => updateParameters({seed: value})} /></div>
      <div className="grid grid-cols-2 gap-2"><NumberField label={generatorKind === 'rhythm_generate' ? 'Pulses / 16' : 'Root MIDI'} value={generatorKind === 'rhythm_generate' ? amount : rootNote} min={generatorKind === 'rhythm_generate' ? 1 : 0} max={generatorKind === 'rhythm_generate' ? 16 : 115} onChange={(value) => updateParameters(generatorKind === 'rhythm_generate' ? {amount: value} : {rootNote: value})} />{generatorKind === 'rhythm_generate' ? <NumberField label="Drum note" value={rootNote} min={0} max={127} onChange={(value) => updateParameters({rootNote: value})} /> : <ScaleSelect scale={scale} onChange={(value) => updateParameters({scale: value})} />}</div>
      <PlanPreview plan={plan} />
      <CommitControls ready={Boolean(plan?.ready)} busy={busy} canUndo={canUndoProject} onCommit={commit} onUndo={() => onUndoProject && void run(onUndoProject, 'The complete last MIDI project edit was undone.')} />
    </section>}

    {project && !model.error && view === 'readiness' && <section className="space-y-3 p-3" aria-label="Note Forge capability readiness">
      <div className="grid gap-2 sm:grid-cols-2"><ReadinessCard label="Canonical MIDI records" value="Operational" ready detail="Serializable clips live in the project production-engine extension." /><ReadinessCard label="Transforms & generators" value="Operational" ready detail="Deterministic local algorithms with explicit inputs and previews." /><ReadinessCard label="Non-destructive commit" value="Operational" ready detail="New clip variation plus ProjectSession undo; source is preserved." /><ReadinessCard label="Audible clip playback" value="Audio/MIDI engine required" detail="This panel does not claim that a preview was heard." /><ReadinessCard label="MPE & controller capture" value="Input adapter required" detail="Pressure, slide and retrospective input capture remain unavailable." /><ReadinessCard label="Link / network sync" value="SDK integration required" detail="No peer discovery, tempo, phase, transport or audio network claim." /></div>
      <Notice tone="ok">Notation records can reference the same MIDI tracks later, but engraving, MusicXML, device handoff and external MIDI output remain separately gated.</Notice>
    </section>}

    {notice && <div className={`mx-3 mb-3 flex items-start gap-2 rounded border p-2 text-[8px] ${notice.tone === 'ok' ? 'border-emerald-400/25 bg-emerald-400/5 text-emerald-100' : 'border-amber-400/25 bg-amber-400/5 text-amber-100'}`} role="status">{notice.tone === 'ok' ? <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" /> : <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />}{notice.text}</div>}
    <footer className="flex items-center gap-2 border-t border-teal-300/20 bg-teal-300/5 px-3 py-2 text-[8px] text-teal-100/80"><ShieldCheck className="h-3 w-3 shrink-0" />Original Poietek workflow. No Ableton code, interface artwork, sounds, Packs, presets, models, project files or branding are included.</footer>
  </div>;
};

const PlanPreview: React.FC<{plan: ReturnType<typeof planProjectMidiOperation> | null}> = ({plan}) => <div className="rounded-lg border border-slate-700 bg-slate-950/75 p-3"><div className="flex items-center justify-between gap-2"><strong className="text-[9px] uppercase text-teal-100">Deterministic preview</strong><span className={`text-[7px] font-black uppercase ${plan?.ready ? 'text-emerald-300' : 'text-amber-200'}`}>{plan?.ready ? 'ready' : 'blocked'}</span></div>{plan?.outputClip ? <><div className="mt-3 h-16 overflow-hidden rounded border border-slate-800 bg-slate-900/80 p-1" aria-label="MIDI note preview">{plan.outputClip.events.filter((event) => event.type === 'note').map((event, index) => <span key={`${event.tick}.${event.note}.${index}`} className="absolute hidden" />)}<div className="flex h-full items-end gap-1">{plan.outputClip.events.filter((event) => event.type === 'note').slice(0, 32).map((event, index) => <span key={`${event.tick}.${event.note}.${index}`} title={`Note ${event.note}, tick ${event.tick}, velocity ${event.velocity}`} className="min-w-1 flex-1 rounded-sm bg-teal-300/80" style={{height: `${Math.max(14, Math.round(event.velocity / 1.27))}%`}} />)}</div></div><p className="mt-2 text-[8px] leading-relaxed text-slate-400">{plan.outputClip.name} · {plan.outputClip.events.filter((event) => event.type === 'note').length} notes · {plan.outputClip.durationTicks} ticks</p><p className="mt-1 text-[8px] leading-relaxed text-slate-500">{plan.claim}</p></> : <div className="mt-2 space-y-1">{(plan?.issues.length ? plan.issues : ['Choose a source or create a starter MIDI clip.']).map((issue) => <div key={issue} className="flex gap-2 text-[8px] text-amber-100"><AlertTriangle className="h-3 w-3 shrink-0" />{issue}</div>)}</div>}</div>;

const CommitControls: React.FC<{ready: boolean; busy: boolean; canUndo: boolean; onCommit(): void; onUndo(): void}> = ({ready, busy, canUndo, onCommit, onUndo}) => <div className="grid grid-cols-[1fr_auto] gap-2"><button type="button" disabled={!ready || busy} onClick={onCommit} className="min-h-11 rounded border border-teal-300/45 bg-teal-300/10 px-3 text-[8px] font-black uppercase text-teal-100 disabled:opacity-40">{busy ? 'Saving project edit…' : 'Commit as new MIDI clip'}</button><button type="button" disabled={!canUndo || busy} onClick={onUndo} title="Undo last canonical project edit" className="min-h-11 min-w-11 rounded border border-slate-600 bg-slate-900 text-slate-300 disabled:opacity-40"><Undo2 className="mx-auto h-4 w-4" /></button></div>;
const Metric: React.FC<{label: string; value: string}> = ({label, value}) => <div className="rounded-lg border border-slate-700 bg-slate-950 p-2"><span className="block text-[7px] font-black uppercase text-slate-500">{label}</span><strong className="mt-1 block truncate text-[9px] text-teal-200">{value}</strong></div>;
const Notice: React.FC<{tone: 'ok' | 'warn'; children: React.ReactNode}> = ({tone, children}) => <div className={`flex gap-2 rounded border p-2 text-[8px] leading-relaxed ${tone === 'ok' ? 'border-emerald-400/25 bg-emerald-400/5 text-emerald-100' : 'border-amber-400/25 bg-amber-400/5 text-amber-100'}`}>{tone === 'ok' ? <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" /> : <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />}{children}</div>;
const ReadinessCard: React.FC<{label: string; value: string; detail: string; ready?: boolean}> = ({label, value, detail, ready = false}) => <article className="rounded-lg border border-slate-700 bg-slate-950/75 p-3"><span className="block text-[7px] font-black uppercase text-slate-500">{label}</span><strong className={`mt-1 block text-[9px] ${ready ? 'text-emerald-300' : 'text-amber-200'}`}>{value}</strong><p className="mt-2 text-[8px] leading-relaxed text-slate-500">{detail}</p></article>;
const NumberField: React.FC<{label: string; value: number; min: number; max: number; onChange(value: number): void}> = ({label, value, min, max, onChange}) => <label className="block text-[8px] font-black uppercase text-slate-400">{label}<input type="number" value={value} min={min} max={max} onChange={(event) => onChange(Number(event.target.value))} className="mt-1 min-h-11 w-full rounded border border-slate-600 bg-slate-950 px-2 text-[9px] normal-case text-slate-100" /></label>;
const Select: React.FC<{label: string; value: string; options: readonly (readonly [string, string])[]; onChange(value: string): void}> = ({label, value, options, onChange}) => <label className="block text-[8px] font-black uppercase text-slate-400">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 min-h-11 w-full rounded border border-slate-600 bg-slate-950 px-2 text-[9px] normal-case text-slate-100">{options.map(([id, text]) => <option key={id} value={id}>{text}</option>)}</select></label>;
const ScaleSelect: React.FC<{scale: MusicalScale; onChange(value: MusicalScale): void}> = ({scale, onChange}) => <Select label="Scale" value={scale} onChange={(value) => onChange(value as MusicalScale)} options={[['major', 'Major'], ['minor', 'Minor'], ['minor_pentatonic', 'Minor pentatonic']]} />;
