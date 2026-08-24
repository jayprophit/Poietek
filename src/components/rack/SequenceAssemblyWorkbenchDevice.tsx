import React, {useMemo, useState} from 'react';
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Clock3,
  Download,
  Gauge,
  KeyRound,
  Link2,
  ListMusic,
  Music2,
  RadioTower,
  Route,
  Share2,
} from 'lucide-react';
import type {RackModuleItem} from '../../types';
import type {PoietekProject} from '../../poietek/domain/types';
import {
  createProjectSequence,
  createSequenceAssemblyState,
  createSequenceProgramManifest,
  deriveSequenceAssemblyReadiness,
  getProjectSequenceAssemblyState,
  resolveSequenceProgram,
  setActiveProjectSequence,
  setSequenceSharedResources,
  updateSequenceConductor,
  upsertProjectSequence,
  upsertSequenceProgram,
  upsertSharedSequenceResource,
  type ProjectSequence,
  type SequenceAssemblyMutation,
  type SequenceAssemblyState,
  type SequenceProgram,
  type SharedSequenceResource,
} from '../../poietek/production-workflows';

interface SequenceAssemblyWorkbenchDeviceProps {
  module: RackModuleItem;
  onParametersChange(parameters: RackModuleItem['parameters']): void;
  project?: PoietekProject | null;
  projectBusy?: boolean;
  onMutateSequenceAssembly?(mutation: SequenceAssemblyMutation): Promise<void>;
}

type AssemblyView = 'sequences' | 'conductor' | 'shared' | 'program' | 'delivery';

const views = [
  {id: 'sequences', label: 'Sequences', icon: ListMusic},
  {id: 'conductor', label: 'Conductor', icon: Gauge},
  {id: 'shared', label: 'Shared rack', icon: Share2},
  {id: 'program', label: 'Program', icon: Route},
  {id: 'delivery', label: 'Readiness', icon: Download},
] as const;

const purposeLabels: Readonly<Record<ProjectSequence['purpose'], string>> = {
  song: 'Song',
  picture_cue: 'Picture cue',
  live_set: 'Live set',
  scratch: 'Scratch',
};

const tonicNames = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'] as const;

export const SequenceAssemblyWorkbenchDevice: React.FC<SequenceAssemblyWorkbenchDeviceProps> = ({
  module,
  onParametersChange,
  project = null,
  projectBusy = false,
  onMutateSequenceAssembly,
}) => {
  const parameters = module.parameters ?? {};
  const candidateView = String(parameters.view ?? 'sequences');
  const view = views.some((candidate) => candidate.id === candidateView)
    ? candidateView as AssemblyView
    : 'sequences';
  const [actionState, setActionState] = useState<'idle' | 'saving'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const loaded = useMemo(() => {
    if (!project) return {state: null, error: null};
    try {
      return {state: getProjectSequenceAssemblyState(project) ?? createSequenceAssemblyState(project.id), error: null};
    } catch (reason) {
      return {state: null, error: reason instanceof Error ? reason.message : String(reason)};
    }
  }, [project]);
  const state = loaded.state;
  const activeSequence = state?.sequences.find((sequence) => sequence.id === state.activeSequenceId)
    ?? state?.sequences[0]
    ?? null;
  const activeProgram = state?.programs.find((program) => program.id === state.activeProgramId)
    ?? state?.programs[0]
    ?? null;
  const programPlan = useMemo(() => {
    if (!state || !activeProgram) return null;
    try { return resolveSequenceProgram(state, activeProgram.id); } catch { return null; }
  }, [activeProgram, state]);
  const readiness = useMemo(() => state ? deriveSequenceAssemblyReadiness(state, []) : null, [state]);
  const busy = projectBusy || actionState !== 'idle';

  const updateView = (next: AssemblyView) => onParametersChange({...parameters, view: next});

  const runMutation = async (mutation: SequenceAssemblyMutation, success: string) => {
    if (!onMutateSequenceAssembly || busy) return;
    setActionState('saving');
    setMessage(null);
    try {
      await onMutateSequenceAssembly(mutation);
      setMessage(success);
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setActionState('idle');
    }
  };

  const createStarterAssembly = () => runMutation((current) => {
    const trackIds = project?.tracks.slice(0, 8).map((track) => track.id) ?? [];
    const sequences = starterSequences(trackIds);
    let next = sequences.reduce((draft, sequence) => upsertProjectSequence(draft, sequence), current);
    const resources = starterResources(project);
    next = resources.reduce((draft, resource) => upsertSharedSequenceResource(draft, resource), next);
    next = sequences.reduce((draft, sequence) => setSequenceSharedResources(
      draft,
      sequence.id,
      resources.map((resource) => resource.id),
    ), next);
    next = upsertSequenceProgram(next, starterProgram());
    return setActiveProjectSequence(next, sequences[0]!.id);
  }, 'Original multi-sequence starter saved in canonical project history. No transport, plug-in, interface or render activity was claimed.');

  const addConductorTurn = () => {
    if (!activeSequence) return;
    const occupiedTempoBeats = new Set(activeSequence.conductor.tempo.map((event) => event.beat));
    const beat = [0.75, 0.5, 0.25]
      .map((ratio) => Math.max(1, Math.min(activeSequence.durationBeats, Math.round(activeSequence.durationBeats * ratio))))
      .find((candidate) => !occupiedTempoBeats.has(candidate));
    if (beat === undefined) {
      setMessage('This short sequence already has tempo turns at each suggested musical division.');
      return;
    }
    const latestTempo = activeSequence.conductor.tempo[activeSequence.conductor.tempo.length - 1]!;
    void runMutation((current) => updateSequenceConductor(current, activeSequence.id, {
      tempo: [...activeSequence.conductor.tempo, {
        id: `${activeSequence.id}:tempo:turn-${current.revision}`,
        beat,
        bpm: Math.min(400, latestTempo.bpm + 4),
        curve: 'linear',
      }],
      markers: [...activeSequence.conductor.markers, {
        id: `${activeSequence.id}:marker:turn-${current.revision}`,
        beat,
        name: 'Energy turn',
        role: 'section',
      }],
    }), `Tempo turn and section marker saved at beat ${beat}. The conductor plan has not driven a live clock.`);
  };

  const downloadManifest = () => {
    if (!state || !activeProgram) return;
    const blob = new Blob([createSequenceProgramManifest(state, activeProgram.id)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${safeFilename(project?.title ?? 'poietek')}-sequence-program.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage('Local planning manifest exported. It contains no audio, devices, plug-ins or rendered delivery.');
  };

  return (
    <div className="poietek-workbench-device overflow-hidden rounded-xl border border-cyan-400/35 bg-[#071419] text-slate-100 shadow-inner">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-300/20 bg-gradient-to-r from-cyan-950 via-slate-950 to-teal-950 px-3 py-2">
        <div className="flex items-center gap-2">
          <Boxes className="h-4 w-4 text-cyan-200" />
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.15em] text-cyan-100">Sequence Assembly Workbench</div>
            <div className="text-[9px] text-slate-400">independent cues · conductor maps · shared resources · deterministic programs</div>
          </div>
        </div>
        <span className="rounded-full border border-emerald-400/35 bg-emerald-400/10 px-2 py-1 text-[8px] font-black uppercase text-emerald-200">Project-owned workflow</span>
      </header>

      <nav className="grid grid-cols-5 border-b border-slate-700/80" aria-label="Sequence assembly views">
        {views.map((item) => {
          const Icon = item.icon;
          return <button key={item.id} type="button" aria-pressed={view === item.id} onClick={() => updateView(item.id)} className={`flex min-h-11 items-center justify-center gap-1 border-r border-slate-700/60 px-1 py-2 text-[7px] font-black uppercase last:border-r-0 ${view === item.id ? 'bg-cyan-300 text-slate-950' : 'bg-slate-950/70 text-slate-400 hover:bg-slate-800'}`}><Icon className="h-3 w-3" />{item.label}</button>;
        })}
      </nav>

      {!project && <section className="p-3"><Notice tone="amber">The canonical local project is still starting. Sequence assembly cannot be saved yet.</Notice></section>}
      {loaded.error && <section className="p-3"><Notice tone="rose">{loaded.error}</Notice></section>}

      {project && state && !state.sequences.length && <section className="space-y-3 p-3">
        <div className="rounded-lg border border-cyan-400/25 bg-gradient-to-br from-slate-950 to-cyan-950/40 p-4">
          <h3 className="text-sm font-black text-white">Build one project from many independent musical timelines</h3>
          <p className="mt-2 text-[9px] leading-relaxed text-slate-400">Create an original song sequence, picture cue and live reprise. Each gets a separate tempo, meter, key and marker map, while safe resource references can be shared across all three.</p>
          <button type="button" disabled={!onMutateSequenceAssembly || busy} onClick={() => void createStarterAssembly()} className="mt-3 min-h-11 w-full rounded border border-cyan-400/40 bg-cyan-400/10 px-3 text-[8px] font-black uppercase text-cyan-100 disabled:opacity-40">Create multi-sequence starter</button>
        </div>
        <Notice tone="amber">This creates project data only. Audio playback, low-latency monitoring, plug-in processing and hardware synchronization remain adapter-gated.</Notice>
      </section>}

      {project && state && state.sequences.length > 0 && view === 'sequences' && <section className="space-y-3 p-3" aria-label="Independent project sequences">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatusCard label="Project sequences" value={String(state.sequences.length)} tone="cyan" />
          <StatusCard label="Programs" value={String(state.programs.length)} tone="cyan" />
          <StatusCard label="Shared resources" value={String(state.sharedResources.length)} tone="cyan" />
          <StatusCard label="Revision" value={`r${state.revision}`} tone="cyan" />
        </div>
        <div className="grid gap-2 lg:grid-cols-3">
          {state.sequences.map((sequence) => {
            const selected = sequence.id === activeSequence?.id;
            const linkCount = state.resourceLinks.filter((link) => link.sequenceId === sequence.id).length;
            return <button key={sequence.id} type="button" disabled={busy} onClick={() => void runMutation((current) => setActiveProjectSequence(current, sequence.id), `${sequence.name} selected as the active project sequence.`)} className={`min-h-28 rounded-lg border p-3 text-left transition ${selected ? 'border-cyan-300 bg-cyan-300/10' : 'border-slate-700 bg-slate-950 hover:border-slate-500'}`}>
              <div className="flex items-center justify-between gap-2"><span className="text-[8px] font-black uppercase text-cyan-200">{purposeLabels[sequence.purpose]}</span><span className={`rounded-full px-2 py-0.5 text-[7px] font-black uppercase ${sequence.status === 'approved' ? 'bg-emerald-400/15 text-emerald-200' : 'bg-slate-800 text-slate-400'}`}>{sequence.status}</span></div>
              <h3 className="mt-2 text-xs font-black text-white">{sequence.name}</h3>
              <p className="mt-1 text-[8px] text-slate-400">{sequence.durationBeats} beats · {sequence.canonicalTrackIds.length} tracks · {linkCount} shared links</p>
              <p className="mt-2 line-clamp-2 text-[8px] leading-relaxed text-slate-500">{sequence.notes || 'No sequence notes.'}</p>
            </button>;
          })}
        </div>
        <Notice tone="cyan">Selecting a sequence changes canonical editing focus; it does not start transport or change a physical audio route.</Notice>
      </section>}

      {project && state && activeSequence && view === 'conductor' && <section className="space-y-3 p-3" aria-label="Per-sequence conductor map">
        <div className="rounded-lg border border-cyan-400/25 bg-gradient-to-br from-slate-950 to-cyan-950/40 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-[8px] font-black uppercase text-cyan-200">Active conductor</p><h3 className="text-sm font-black text-white">{activeSequence.name}</h3></div><button type="button" disabled={!onMutateSequenceAssembly || busy} onClick={addConductorTurn} className="min-h-11 rounded border border-cyan-400/40 bg-cyan-400/10 px-3 text-[8px] font-black uppercase text-cyan-100 disabled:opacity-40">Add original tempo turn</button></div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <ConductorLane icon={Clock3} title="Tempo" items={activeSequence.conductor.tempo.map((event) => ({id: event.id, beat: event.beat, text: `${event.bpm} BPM · ${event.curve}`}))} />
          <ConductorLane icon={Gauge} title="Meter" items={activeSequence.conductor.meter.map((event) => ({id: event.id, beat: event.beat, text: `${event.numerator}/${event.denominator}`}))} />
          <ConductorLane icon={KeyRound} title="Key" items={activeSequence.conductor.key.map((event) => ({id: event.id, beat: event.beat, text: `${tonicNames[event.tonic]} ${event.mode}`}))} />
          <ConductorLane icon={Music2} title="Markers" items={activeSequence.conductor.markers.map((event) => ({id: event.id, beat: event.beat, text: `${event.name} · ${event.role}`}))} />
        </div>
        <Notice tone="amber">The map is deterministic project data. A verified transport/clock adapter is required before Poietek can claim that tempo, meter or picture synchronization is running.</Notice>
      </section>}

      {project && state && activeSequence && view === 'shared' && <section className="space-y-3 p-3" aria-label="Shared sequence resources">
        <div className="rounded-lg border border-slate-700 bg-slate-950 p-3">
          <p className="text-[8px] font-black uppercase text-cyan-200">Reusable assignments for {activeSequence.name}</p>
          <p className="mt-1 text-[8px] leading-relaxed text-slate-400">These references keep an instrument, return, monitor path or external slot consistent across sequences. They do not instantiate a processor or open hardware.</p>
        </div>
        <div className="grid gap-2 lg:grid-cols-3">
          {state.sharedResources.map((resource) => {
            const linked = state.resourceLinks.some((link) => link.sequenceId === activeSequence.id && link.resourceId === resource.id);
            return <article key={resource.id} className="rounded-lg border border-slate-700 bg-slate-950 p-3">
              <div className="flex items-center justify-between gap-2"><Link2 className="h-4 w-4 text-cyan-300" /><span className={`rounded-full px-2 py-0.5 text-[7px] font-black uppercase ${linked ? 'bg-cyan-400/15 text-cyan-200' : 'bg-slate-800 text-slate-500'}`}>{linked ? 'Linked' : 'Not linked'}</span></div>
              <h3 className="mt-2 text-[10px] font-black text-white">{resource.name}</h3>
              <p className="mt-1 text-[8px] uppercase text-slate-500">{resource.kind.replace('_', ' ')} · {resource.engineState.replace('_', ' ')}</p>
              <p className="mt-2 text-[8px] text-slate-400">{resource.processorReference ?? 'No processor reference'}{resource.requiredCapability ? ` · needs ${resource.requiredCapability}` : ''}</p>
            </article>;
          })}
        </div>
        <Notice tone="amber">External plug-ins, audio-interface mixers and monitor paths remain unavailable until their licensed hosts and device adapters return evidence.</Notice>
      </section>}

      {project && state && activeProgram && programPlan && view === 'program' && <section className="space-y-3 p-3" aria-label="Sequence program chain">
        <div className="grid gap-2 sm:grid-cols-3">
          <StatusCard label="Program" value={activeProgram.name} tone="cyan" />
          <StatusCard label="Resolved passes" value={String(programPlan.passes.length)} tone="cyan" />
          <StatusCard label="Planned length" value={`${programPlan.totalBeats} beats`} tone="cyan" />
        </div>
        <div className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-950">
          <table className="w-full min-w-[520px] text-left text-[8px]"><thead className="bg-slate-900 uppercase text-slate-500"><tr><th className="px-3 py-2">Order</th><th className="px-3 py-2">Sequence</th><th className="px-3 py-2">Pass</th><th className="px-3 py-2">Source start</th><th className="px-3 py-2">Source end</th><th className="px-3 py-2">Boundary</th></tr></thead><tbody>{programPlan.passes.map((pass, index) => <tr key={`${pass.entryId}:${pass.pass}`} className="border-t border-slate-800 text-slate-300"><td className="px-3 py-2 font-black text-cyan-200">{index + 1}</td><td className="px-3 py-2 font-bold text-white">{pass.sequenceName}</td><td className="px-3 py-2">{pass.pass}</td><td className="px-3 py-2">{pass.sourceStartBeat}</td><td className="px-3 py-2">{pass.sourceEndBeat}</td><td className="px-3 py-2">{pass.countInStartBeat !== null ? `count-in @ ${pass.countInStartBeat}` : pass.stopAfter ? 'stop intent' : 'continue'}</td></tr>)}</tbody></table>
        </div>
        <Notice tone="cyan">{programPlan.claim}</Notice>
      </section>}

      {project && state && view === 'delivery' && <section className="space-y-3 p-3" aria-label="Sequence assembly readiness">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <Gate label="Local plan" ready={Boolean(readiness?.localPlanReady)} />
          <Gate label="Active sequence" ready={Boolean(readiness?.activeSequenceReady)} />
          <Gate label="Shared host" ready={Boolean(readiness?.sharedResourcesObserved)} />
          <Gate label="Transport" ready={Boolean(readiness?.playbackObserved)} />
          <Gate label="Audio render" ready={Boolean(readiness?.renderObserved)} />
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-950 p-3">
          <p className="text-[8px] font-black uppercase text-cyan-200">Evidence-gated delivery</p>
          <p className="mt-2 text-[9px] leading-relaxed text-slate-400">{readiness?.claim}</p>
          <button type="button" disabled={!activeProgram} onClick={downloadManifest} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded border border-cyan-400/40 bg-cyan-400/10 px-3 text-[8px] font-black uppercase text-cyan-100 disabled:opacity-40"><Download className="h-3.5 w-3.5" />Export planning manifest</button>
        </div>
        <Notice tone="amber">MIDI, MusicXML, AAF, audio, video and hardware-set exports are separate capabilities. This workbench will not relabel a JSON plan as media interchange or a finished render.</Notice>
      </section>}

      {message && <div className="border-t border-slate-700 bg-slate-950 px-3 py-2 text-[8px] text-cyan-100" role="status">{message}</div>}
    </div>
  );
};

function starterSequences(trackIds: readonly string[]): ProjectSequence[] {
  const main = createProjectSequence('sequence-main-theme', 'Main Theme', 'song', 128, {canonicalTrackIds: trackIds, bpm: 100, tonic: 9, mode: 'minor', status: 'ready', notes: 'Primary studio arrangement with an independent conductor map.'});
  const picture = createProjectSequence('sequence-picture-cue-01', 'Picture Cue 01', 'picture_cue', 96, {canonicalTrackIds: trackIds, bpm: 84, meter: [3, 4], tonic: 2, mode: 'dorian', notes: 'Compact dramatic cue with hit and streamer planning markers.'});
  const live = createProjectSequence('sequence-live-reprise', 'Live Reprise', 'live_set', 160, {canonicalTrackIds: trackIds, bpm: 124, tonic: 4, mode: 'minor', notes: 'Extended performance arrangement with a count-in program boundary.'});
  return [
    {...main, conductor: {...main.conductor, tempo: [...main.conductor.tempo, {id: 'sequence-main-theme:tempo:64', beat: 64, bpm: 104, curve: 'linear'}], markers: [{id: 'sequence-main-theme:marker:intro', beat: 0, name: 'Intro', role: 'section'}, {id: 'sequence-main-theme:marker:lift', beat: 64, name: 'Lift', role: 'section'}]}},
    {...picture, conductor: {...picture.conductor, tempo: [...picture.conductor.tempo, {id: 'sequence-picture-cue-01:tempo:48', beat: 48, bpm: 88, curve: 'linear'}], meter: [...picture.conductor.meter, {id: 'sequence-picture-cue-01:meter:48', beat: 48, numerator: 4, denominator: 4}], markers: [{id: 'sequence-picture-cue-01:marker:streamer', beat: 20, name: 'Approach', role: 'streamer'}, {id: 'sequence-picture-cue-01:marker:hit', beat: 24, name: 'Picture hit', role: 'hit'}]}},
    {...live, conductor: {...live.conductor, markers: [{id: 'sequence-live-reprise:marker:count', beat: 0, name: 'Band count', role: 'rehearsal'}, {id: 'sequence-live-reprise:marker:solo', beat: 96, name: 'Solo window', role: 'section'}]}},
  ];
}

function starterResources(project: PoietekProject | null): SharedSequenceResource[] {
  const instrumentTrackId = project?.tracks.find((track) => track.type === 'instrument' || track.type === 'midi')?.id ?? null;
  return [
    {id: 'shared-core-instrument', name: 'Core instrument assignment', kind: 'instrument', canonicalTrackId: instrumentTrackId, processorReference: 'Prism Poly Synth', requiredCapability: 'shared_processor_host', engineState: 'adapter_required'},
    {id: 'shared-space-return', name: 'Common space return', kind: 'effect_return', canonicalTrackId: null, processorReference: 'Nebula Space', requiredCapability: 'shared_processor_host', engineState: 'adapter_required'},
    {id: 'shared-monitor-path', name: 'Control-room monitor intent', kind: 'monitor', canonicalTrackId: null, processorReference: null, requiredCapability: 'native_monitor_stream', engineState: 'adapter_required'},
  ];
}

function starterProgram(): SequenceProgram {
  return {
    id: 'program-demo-reel',
    name: 'Studio · Picture · Stage',
    notes: 'An original program that demonstrates independent sequences and explicit boundaries.',
    entries: [
      {id: 'program-entry-main', sequenceId: 'sequence-main-theme', repeats: 1, transition: 'continue', countInBeats: 0},
      {id: 'program-entry-picture', sequenceId: 'sequence-picture-cue-01', repeats: 1, transition: 'stop', countInBeats: 0},
      {id: 'program-entry-live', sequenceId: 'sequence-live-reprise', repeats: 1, transition: 'count_in', countInBeats: 4},
    ],
  };
}

function ConductorLane({icon: Icon, title, items}: {icon: React.ComponentType<{className?: string}>; title: string; items: readonly {id: string; beat: number; text: string}[]}) {
  return <article className="rounded-lg border border-slate-700 bg-slate-950 p-3"><div className="flex items-center gap-2 text-[8px] font-black uppercase text-cyan-200"><Icon className="h-3.5 w-3.5" />{title}</div><div className="mt-2 space-y-1">{items.map((item) => <div key={item.id} className="flex items-center justify-between gap-2 rounded bg-slate-900 px-2 py-2 text-[8px]"><span className="font-black text-slate-500">beat {item.beat}</span><span className="text-right text-slate-200">{item.text}</span></div>)}{!items.length && <p className="text-[8px] text-slate-500">No events.</p>}</div></article>;
}

function StatusCard({label, value, tone}: {label: string; value: string; tone: 'cyan'}) {
  return <div className={`min-w-0 rounded-lg border p-2 ${tone === 'cyan' ? 'border-cyan-400/25 bg-cyan-400/5' : 'border-slate-700 bg-slate-950'}`}><p className="text-[7px] font-black uppercase text-slate-500">{label}</p><p className="mt-1 truncate text-[10px] font-black text-cyan-100" title={value}>{value}</p></div>;
}

function Gate({label, ready}: {label: string; ready: boolean}) {
  return <div className={`rounded-lg border p-2 text-center ${ready ? 'border-emerald-400/30 bg-emerald-400/5' : 'border-amber-400/30 bg-amber-400/5'}`}>{ready ? <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-300" /> : <RadioTower className="mx-auto h-4 w-4 text-amber-300" />}<p className={`mt-1 text-[7px] font-black uppercase ${ready ? 'text-emerald-200' : 'text-amber-200'}`}>{label}</p></div>;
}

function Notice({children, tone}: {children: React.ReactNode; tone: 'cyan' | 'amber' | 'rose'}) {
  const styles = tone === 'cyan' ? 'border-cyan-400/30 bg-cyan-400/5 text-cyan-100' : tone === 'rose' ? 'border-rose-400/30 bg-rose-400/5 text-rose-100' : 'border-amber-400/30 bg-amber-400/5 text-amber-100';
  const Icon = tone === 'cyan' ? CheckCircle2 : AlertTriangle;
  return <div className={`flex gap-2 rounded-lg border p-2 text-[8px] leading-relaxed ${styles}`}><Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{children}</span></div>;
}

function safeFilename(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'poietek';
}
