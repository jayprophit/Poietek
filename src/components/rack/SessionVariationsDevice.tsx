import React, {useMemo, useState} from 'react';
import {FileText, Filter, GitCompareArrows, Layers3, ListRestart, Search} from 'lucide-react';
import type {RackModuleItem} from '../../types';
import {
  compareMixScenes,
  createMixScene,
  createMixSceneRecallPlan,
  createProjectTrackMixScene,
} from '../../poietek/composition-workflows';
import type {MixScene} from '../../poietek/composition-workflows';
import type {PoietekProject} from '../../poietek/domain/types';

interface SessionVariationsDeviceProps {
  module: RackModuleItem;
  onParametersChange(parameters: RackModuleItem['parameters']): void;
  project?: PoietekProject | null;
  activeProjectSceneId?: string | null;
  projectBusy?: boolean;
  canUndoProject?: boolean;
  canRedoProject?: boolean;
  onApplyProjectMixScene?(scene: MixScene): Promise<void>;
  onUndoProject?(): Promise<void>;
  onRedoProject?(): Promise<void>;
}

type SessionView = 'song_map' | 'lyrics' | 'mix_scenes' | 'track_focus';

const views = [
  {id: 'song_map', label: 'Song Map', icon: Layers3},
  {id: 'lyrics', label: 'Lyrics', icon: FileText},
  {id: 'mix_scenes', label: 'Mix Scenes', icon: GitCompareArrows},
  {id: 'track_focus', label: 'Track Focus', icon: Filter},
] as const;

const sections = {
  intro: {name: 'Intro', color: '#38bdf8', bars: 4},
  verse: {name: 'Verse', color: '#a78bfa', bars: 8},
  chorus: {name: 'Chorus', color: '#fb7185', bars: 8},
  bridge: {name: 'Bridge', color: '#fbbf24', bars: 4},
  outro: {name: 'Outro', color: '#34d399', bars: 4},
} as const;

const songVariants = {
  radio: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus', 'outro'],
  extended: ['intro', 'intro', 'verse', 'chorus', 'verse', 'chorus', 'bridge', 'bridge', 'chorus', 'outro'],
} as const;

const mixTargets = [
  {targetId: 'drums', kind: 'bus' as const, gainDb: -1, pan: 0, mute: false, solo: false, processorStateReferences: {strip: 'drum-chain-a'}},
  {targetId: 'vocals', kind: 'bus' as const, gainDb: -2, pan: 0, mute: false, solo: false, processorStateReferences: {strip: 'vocal-chain-a'}},
  {targetId: 'music', kind: 'bus' as const, gainDb: -3, pan: 0, mute: false, solo: false, processorStateReferences: {strip: 'music-chain-a'}},
];

const trackRows = [
  {folder: 'DRUMS', name: 'Kick In', kind: 'Audio', route: 'Drum Bus'},
  {folder: 'DRUMS', name: 'Snare Top', kind: 'Audio', route: 'Drum Bus'},
  {folder: 'MUSIC', name: 'Bass Synth', kind: 'Instrument', route: 'Music Bus'},
  {folder: 'MUSIC', name: 'Harmony Stack', kind: 'Instrument', route: 'Music Bus'},
  {folder: 'VOCALS', name: 'Lead Vocal', kind: 'Audio', route: 'Vocal Bus'},
  {folder: 'VOCALS', name: 'Backing Pair', kind: 'Audio', route: 'Vocal Bus'},
] as const;

export const SessionVariationsDevice: React.FC<SessionVariationsDeviceProps> = ({
  module,
  onParametersChange,
  project = null,
  activeProjectSceneId = null,
  projectBusy = false,
  canUndoProject = false,
  canRedoProject = false,
  onApplyProjectMixScene,
  onUndoProject,
  onRedoProject,
}) => {
  const parameters = module.parameters ?? {};
  const view = String(parameters.view ?? 'song_map') as SessionView;
  const songVariant = String(parameters.songVariant ?? 'radio') as keyof typeof songVariants;
  const activeScene = String(parameters.activeScene ?? 'balanced');
  const lyricScratchpad = String(parameters.lyricScratchpad ?? 'Bridge image: leave space after the second line.');
  const trackFilter = String(parameters.trackFilter ?? '');
  const [recallState, setRecallState] = useState<'idle' | 'applying' | 'undoing' | 'redoing'>('idle');
  const [recallMessage, setRecallMessage] = useState<string | null>(null);
  const update = (name: string, value: number | boolean | string) => onParametersChange({...parameters, [name]: value});

  const scenes = useMemo<Record<'balanced' | 'vocal-forward', MixScene>>(() => {
    if (project?.tracks.length) {
      const requestedFocusTrackId = String(parameters.focusTrackId ?? '');
      const focusTrack = project.tracks.find((track) => track.id === requestedFocusTrackId)
        ?? project.tracks.find((track) => /vocal|voice|lead/i.test(track.name))
        ?? project.tracks[0];
      const unityPatches = Object.fromEntries(project.tracks.map((track) => [track.id, {
        gainDb: 0,
        pan: 0,
        mute: false,
        solo: false,
      }]));
      const focusPatches = Object.fromEntries(project.tracks.map((track) => [track.id, {
        gainDb: track.id === focusTrack.id ? 2 : -2,
        mute: false,
        solo: false,
      }]));
      return {
        balanced: createProjectTrackMixScene(project, 'balanced', 'Unity Reset', unityPatches, project.updatedAt),
        'vocal-forward': createProjectTrackMixScene(project, 'vocal-forward', `Focus ${focusTrack.name}`, focusPatches, project.updatedAt),
      };
    }
    const balanced = createMixScene('balanced', 'Balanced', mixTargets, '2026-01-01T00:00:00.000Z');
    const vocalForward = createMixScene('vocal-forward', 'Vocal Forward', mixTargets.map((target) => target.targetId === 'vocals'
      ? {...target, gainDb: 0, processorStateReferences: {strip: 'vocal-chain-intimate'}}
      : target.targetId === 'music' ? {...target, gainDb: -4.5} : target), '2026-01-01T00:01:00.000Z');
    return {balanced, 'vocal-forward': vocalForward};
  }, [parameters.focusTrackId, project]);
  const sceneDifferences = compareMixScenes(scenes.balanced, scenes['vocal-forward']);
  const recallPlan = createMixSceneRecallPlan(scenes[activeScene === 'vocal-forward' ? 'vocal-forward' : 'balanced']);
  const visibleTracks = trackRows.filter((track) => `${track.folder} ${track.name} ${track.kind} ${track.route}`.toLowerCase().includes(trackFilter.toLowerCase()));
  const selectedScene = scenes[activeScene === 'vocal-forward' ? 'vocal-forward' : 'balanced'];
  const canonicalRecallReady = Boolean(project?.tracks.length && onApplyProjectMixScene)
    && selectedScene.targets.every((target) => target.kind === 'track' && !Object.keys(target.processorStateReferences).length);
  const actionBusy = projectBusy || recallState !== 'idle';

  const runRecallAction = async (
    state: Exclude<typeof recallState, 'idle'>,
    action: (() => Promise<void>) | undefined,
    success: string,
  ) => {
    if (!action || actionBusy) return;
    setRecallState(state);
    setRecallMessage(null);
    try {
      await action();
      setRecallMessage(success);
    } catch (reason) {
      setRecallMessage(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setRecallState('idle');
    }
  };

  return (
    <div className="poietek-workbench-device overflow-hidden rounded-xl border border-emerald-400/35 bg-[#08130f] text-slate-100 shadow-inner">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-300/20 bg-gradient-to-r from-emerald-950 via-slate-950 to-teal-950 px-3 py-2">
        <div className="flex items-center gap-2"><ListRestart className="h-4 w-4 text-emerald-200" /><div><div className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-100">Session Variations Workbench</div><div className="text-[9px] text-slate-400">Song structures · timed words · mix comparisons · large-session focus</div></div></div>
        <span className="rounded-full border border-amber-400/45 bg-amber-400/10 px-2 py-1 text-[8px] font-black uppercase text-amber-200">Preview-first control model</span>
      </header>

      <nav className="grid grid-cols-4 border-b border-slate-700/80" aria-label="Session variation views">
        {views.map((item) => {
          const Icon = item.icon;
          return <button key={item.id} type="button" aria-pressed={view === item.id} onClick={() => update('view', item.id)} className={`flex items-center justify-center gap-1 border-r border-slate-700/60 px-1 py-2 text-[8px] font-black uppercase last:border-r-0 ${view === item.id ? 'bg-emerald-300 text-slate-950' : 'bg-slate-950/70 text-slate-400 hover:bg-slate-800'}`}><Icon className="h-3 w-3" />{item.label}</button>;
        })}
      </nav>

      {view === 'song_map' && <section className="space-y-3 p-3" aria-label="Song arrangement variants">
        <div className="flex items-center justify-between gap-2"><div className="text-[9px] font-black uppercase text-emerald-200">Non-destructive section order</div><select value={songVariant} onChange={(event) => update('songVariant', event.target.value)} className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[8px]"><option value="radio">Radio flow</option><option value="extended">Extended flow</option></select></div>
        <div className="flex min-h-20 items-stretch gap-1 overflow-x-auto rounded-lg border border-slate-700 bg-slate-950 p-2">
          {songVariants[songVariant].map((id, index) => { const section = sections[id]; return <div key={`${id}-${index}`} className="flex min-w-20 flex-col justify-between rounded border border-white/20 p-2 text-slate-950" style={{backgroundColor: section.color, flexGrow: section.bars}}><strong className="text-[9px] uppercase">{section.name}</strong><span className="text-[7px] font-bold">{section.bars} bars · #{index + 1}</span></div>; })}
        </div>
        <p className="text-[8px] text-slate-500">Variants reference source ranges; reordering does not duplicate or destructively move canonical clips.</p>
      </section>}

      {view === 'lyrics' && <section className="grid gap-3 p-3 md:grid-cols-[minmax(0,1fr)_14rem]" aria-label="Timeline lyrics and scratchpad">
        <div className="space-y-2 rounded-lg border border-slate-700 bg-slate-950/70 p-3">
          {[['0:00', 'Hold the light until the room turns gold', 'lead'], ['0:08', 'Keep the signal moving', 'backing'], ['0:16', 'We build the road while we are walking', 'lead']].map(([time, text, kind]) => <div key={`${time}-${text}`} className="grid grid-cols-[2.5rem_minmax(0,1fr)_3rem] gap-2 rounded border border-slate-800 bg-slate-900 p-2 text-[8px]"><span className="text-emerald-300">{time}</span><strong>{text}</strong><span className="text-right uppercase text-slate-500">{kind}</span></div>)}
          <div className="rounded border border-emerald-400/25 bg-emerald-400/5 p-2 text-center text-[9px] font-bold text-emerald-100">Prompter preview follows the transport tick; it does not start playback.</div>
        </div>
        <label className="text-[8px] font-black uppercase text-slate-400">Private lyric scratchpad<textarea value={lyricScratchpad} onChange={(event) => update('lyricScratchpad', event.target.value)} className="mt-2 h-28 w-full resize-none rounded border border-slate-700 bg-slate-950 p-2 text-[9px] normal-case text-slate-200 outline-none focus:border-emerald-300" /></label>
      </section>}

      {view === 'mix_scenes' && <section className="grid gap-3 p-3 md:grid-cols-[12rem_minmax(0,1fr)]" aria-label="Mix scene comparison">
        <aside className="space-y-2 rounded-lg border border-slate-700 bg-slate-950/70 p-2">
          {[scenes.balanced, scenes['vocal-forward']].map((scene) => <button key={scene.id} type="button" onClick={() => update('activeScene', scene.id)} className={`w-full rounded border p-2 text-left text-[9px] font-black ${activeScene === scene.id ? 'border-emerald-300 bg-emerald-400 text-slate-950' : 'border-slate-700 bg-slate-900'}`}>{scene.name}<span className="mt-1 block text-[7px] font-normal opacity-70">{scene.targets.length} targets{activeProjectSceneId === scene.id ? ' · applied' : ''}</span></button>)}
          {project?.tracks.length ? <label className="block text-[8px] font-black uppercase text-slate-400">Focus track<select value={String(parameters.focusTrackId ?? project.tracks.find((track) => /vocal|voice|lead/i.test(track.name))?.id ?? project.tracks[0].id)} onChange={(event) => update('focusTrackId', event.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[8px] normal-case text-slate-100">{project.tracks.map((track) => <option key={track.id} value={track.id}>{track.name}</option>)}</select></label> : null}
        </aside>
        <div className="rounded-lg border border-slate-700 bg-slate-950 p-3"><div className="flex items-center justify-between"><strong className="text-[9px] uppercase text-emerald-200">A/B difference map</strong><span className="text-[8px] text-slate-500">{sceneDifferences.length} changed targets</span></div><div className="mt-3 grid gap-2 sm:grid-cols-3">{recallPlan.targets.map((target) => <div key={target.targetId} className="rounded border border-slate-700 bg-slate-900 p-2"><strong className="block truncate text-[9px] uppercase" title={project?.tracks.find((track) => track.id === target.targetId)?.name ?? target.targetId}>{project?.tracks.find((track) => track.id === target.targetId)?.name ?? target.targetId}</strong><span className="text-[8px] text-slate-400">{target.gainDb.toFixed(1)} dB · pan {target.pan}</span><span className={`mt-1 block text-[7px] ${canonicalRecallReady ? 'text-emerald-200' : 'text-amber-200'}`}>{canonicalRecallReady ? 'Canonical track edit' : 'Preview only'}</span></div>)}</div>
          <button type="button" disabled={!canonicalRecallReady || actionBusy} onClick={() => void runRecallAction('applying', () => onApplyProjectMixScene?.(selectedScene) ?? Promise.resolve(), `${selectedScene.name} applied and saved in project history.`)} className="mt-3 w-full rounded border border-emerald-400/40 bg-emerald-400/10 p-2 text-[8px] font-black uppercase text-emerald-200 disabled:cursor-not-allowed disabled:opacity-40">{recallState === 'applying' ? 'Applying project recall…' : canonicalRecallReady ? 'Apply scene to project' : 'Add or import a project track to enable recall'}</button>
          <div className="mt-2 grid grid-cols-2 gap-2"><button type="button" disabled={!canUndoProject || actionBusy} onClick={() => void runRecallAction('undoing', onUndoProject, 'Project edit undone and saved.')} className="rounded border border-slate-700 bg-slate-900 p-2 text-[8px] font-black uppercase disabled:opacity-35">Undo project edit</button><button type="button" disabled={!canRedoProject || actionBusy} onClick={() => void runRecallAction('redoing', onRedoProject, 'Project edit redone and saved.')} className="rounded border border-slate-700 bg-slate-900 p-2 text-[8px] font-black uppercase disabled:opacity-35">Redo project edit</button></div>
          {recallMessage ? <p className="mt-2 rounded border border-emerald-400/25 bg-emerald-400/5 p-2 text-[8px] text-emerald-100" role="status">{recallMessage}</p> : null}
        </div>
      </section>}

      {view === 'track_focus' && <section className="space-y-2 p-3" aria-label="Large project track focus">
        <label className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"><Search className="h-3.5 w-3.5 text-emerald-300" /><input value={trackFilter} onChange={(event) => update('trackFilter', event.target.value)} placeholder="Filter by track, folder, type or route" className="w-full bg-transparent text-[9px] outline-none" /></label>
        <div className="overflow-hidden rounded-lg border border-slate-700">{visibleTracks.map((track) => <div key={`${track.folder}-${track.name}`} className="grid grid-cols-[4rem_minmax(0,1fr)_5rem_5rem] border-b border-slate-800 bg-slate-950/70 px-2 py-1.5 text-[8px] last:border-b-0"><span className="font-black text-emerald-300">{track.folder}</span><strong>{track.name}</strong><span className="text-slate-500">{track.kind}</span><span className="truncate text-right text-slate-500">{track.route}</span></div>)}</div>
      </section>}

      <footer className="border-t border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-[8px] text-emerald-100/80">Song-section, lyric and mix-scene models live in the canonical composition extension. This rack control currently commits track-only scenes through the active project session with durable save, undo and redo; bus, master and processor-state recall remains disabled until evidenced adapters exist.</footer>
    </div>
  );
};
