import React, {useEffect, useMemo, useState} from 'react';
import {
  AlertTriangle,
  ArrowRightLeft,
  Captions,
  CheckCircle2,
  Clock3,
  FileAudio,
  FileSpreadsheet,
  Film,
  Link2,
  ListVideo,
  Mic2,
  RefreshCw,
  Star,
  UserRound,
} from 'lucide-react';
import type {RackModuleItem} from '../../types';
import type {PoietekProject} from '../../poietek/domain/types';
import {
  applyReconformPreview,
  configurePicturePost,
  createAdrCueSheetCsv,
  createOffsetReconformPreview,
  createPicturePostState,
  deriveFieldRecorderMatchPlan,
  deriveProductionReadiness,
  formatProjectTimecode,
  getProjectPicturePostState,
  logAdrTakeReference,
  setAdrCueStatus,
  setPreferredAdrTake,
  upsertAdrCue,
  type AdrCue,
  type AdrCueStatus,
  type AdrSessionMode,
  type PictureFrameRate,
  type PicturePostMutation,
  type PictureReconformPreview,
} from '../../poietek/production-workflows';

interface PicturePostWorkbenchDeviceProps {
  module: RackModuleItem;
  onParametersChange(parameters: RackModuleItem['parameters']): void;
  project?: PoietekProject | null;
  projectBusy?: boolean;
  onMutatePicturePost?(mutation: PicturePostMutation): Promise<void>;
}

type PostView = 'cues' | 'takes' | 'reconform' | 'field_audio' | 'delivery';

const views = [
  {id: 'cues', label: 'ADR cues', icon: Captions},
  {id: 'takes', label: 'Takes', icon: Mic2},
  {id: 'reconform', label: 'ReConform', icon: ArrowRightLeft},
  {id: 'field_audio', label: 'Field audio', icon: FileAudio},
  {id: 'delivery', label: 'Delivery', icon: FileSpreadsheet},
] as const;

const frameRates: readonly PictureFrameRate[] = [
  '23.976', '24', '25', '29.97', '29.97_df', '30', '30_df', '50', '59.94', '60',
];

const nominalRate: Readonly<Record<PictureFrameRate, number>> = {
  '23.976': 24, '24': 24, '25': 25, '29.97': 30, '29.97_df': 30,
  '30': 30, '30_df': 30, '50': 50, '59.94': 60, '60': 60,
};

export const PicturePostWorkbenchDevice: React.FC<PicturePostWorkbenchDeviceProps> = ({
  module,
  onParametersChange,
  project = null,
  projectBusy = false,
  onMutatePicturePost,
}) => {
  const parameters = module.parameters ?? {};
  const view = String(parameters.view ?? 'cues') as PostView;
  const chosenFrameRate = frameRates.includes(String(parameters.timecodeRate ?? '24') as PictureFrameRate)
    ? String(parameters.timecodeRate ?? '24') as PictureFrameRate
    : '24';
  const [selectedCueId, setSelectedCueId] = useState<string | null>(null);
  const [actionState, setActionState] = useState<'idle' | 'saving'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [offsetFrames, setOffsetFrames] = useState(24);
  const [reconformPreview, setReconformPreview] = useState<PictureReconformPreview | null>(null);
  const loaded = useMemo(() => {
    if (!project) return {state: null, error: null};
    try {
      return {
        state: getProjectPicturePostState(project) ?? createPicturePostState(project.id, {
          frameRate: chosenFrameRate,
          pictureAssetId: project.assets.find((asset) => asset.mediaType === 'video')?.id ?? null,
        }),
        error: null,
      };
    } catch (reason) {
      return {state: null, error: reason instanceof Error ? reason.message : String(reason)};
    }
  }, [chosenFrameRate, project]);
  const state = loaded.state;
  const selectedCue = state?.cues.find((cue) => cue.id === selectedCueId) ?? state?.cues[0] ?? null;
  const selectedTakes = selectedCue ? state?.takes.filter((take) => take.cueId === selectedCue.id) ?? [] : [];
  const fieldPlan = useMemo(() => state && project && selectedCue
    ? deriveFieldRecorderMatchPlan(state, project, selectedCue.id)
    : null, [project, selectedCue, state]);
  const readiness = useMemo(() => deriveProductionReadiness('picture_post', []), []);
  const busy = projectBusy || actionState !== 'idle';
  const previewIsFresh = Boolean(reconformPreview && state && reconformPreview.baseRevision === state.revision);

  useEffect(() => {
    if (reconformPreview && state && reconformPreview.baseRevision !== state.revision) setReconformPreview(null);
  }, [reconformPreview, state]);

  const updateView = (next: PostView) => onParametersChange({...parameters, view: next});
  const updateFrameRate = (next: PictureFrameRate) => onParametersChange({...parameters, timecodeRate: next});

  const runMutation = async (mutation: PicturePostMutation, success: string) => {
    if (!onMutatePicturePost || busy) return;
    setActionState('saving');
    setMessage(null);
    try {
      await onMutatePicturePost(mutation);
      setMessage(success);
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setActionState('idle');
    }
  };

  const saveSetup = () => runMutation((current) => configurePicturePost(current, {
    frameRate: chosenFrameRate,
    startTimecode: chosenFrameRate.endsWith('_df') ? '01:00:00;00' : '01:00:00:00',
    pictureAssetId: project?.assets.find((asset) => asset.mediaType === 'video')?.id ?? null,
    pictureFollow: parameters.followPicture === false ? 'off' : 'locate',
  }, {
    preRollFrames: nominalRate[chosenFrameRate] * 3,
    postRollFrames: nominalRate[chosenFrameRate],
  }), 'Post setup saved in canonical project history. Picture playback and sync remain adapter-gated.');

  const saveStarterCuePlan = () => runMutation((current) => {
    const rate = nominalRate[current.setup.frameRate];
    const targetTrackId = project?.tracks.find((track) => track.type === 'audio')?.id ?? null;
    const starterCues: AdrCue[] = [
      createCue('adr-001', '001', 'dialogue', rate * 5, rate * 8, 'NARRATOR', 'We build the scene one sound at a time.', targetTrackId, {scene: '1', take: '1', tape: 'A'}),
      createCue('foley-002', '002', 'foley', rate * 10, rate * 12, 'FOLEY', 'Footsteps — corridor entrance', targetTrackId, {scene: '1', take: '2', tape: 'A'}),
      createCue('review-003', '003', 'review', rate * 15, rate * 19, 'DIRECTOR', 'Check dialogue clarity against music and effects.', targetTrackId, null),
    ];
    return starterCues.reduce((next, cue) => upsertAdrCue(next, cue), current);
  }, 'Three original ADR, Foley and review cues saved. No transport or recording stream was started.');

  const markCue = (status: AdrCueStatus, sessionMode: AdrSessionMode, label: string) => {
    if (!selectedCue) return;
    void runMutation(
      (current) => setAdrCueStatus(current, selectedCue.id, status, sessionMode),
      `${label} intent saved for ${selectedCue.cueNumber}. No live recording state is claimed.`,
    );
  };

  const availableTakeAsset = selectedCue && project
    ? [...project.assets]
      .filter((asset) => asset.mediaType === 'audio' && !selectedTakes.some((take) => take.audioAssetId === asset.id))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt) || left.id.localeCompare(right.id))[0] ?? null
    : null;

  const logStoredTake = () => {
    if (!selectedCue || !availableTakeAsset) return;
    const nextTakeNumber = Math.max(0, ...selectedTakes.map((take) => take.takeNumber)) + 1;
    void runMutation((current) => logAdrTakeReference(current, project!, {
      id: `${selectedCue.id}:take:${nextTakeNumber}`,
      cueId: selectedCue.id,
      takeNumber: nextTakeNumber,
      audioAssetId: availableTakeAsset.id,
      performer: selectedCue.character || 'Unassigned',
      rating: null,
      notes: 'Referenced from canonical project audio.',
    }), `Stored audio ${availableTakeAsset.originalName} linked as take ${nextTakeNumber}. Poietek did not claim to record it.`);
  };

  const buildPreview = () => {
    if (!state?.cues.length) return;
    try {
      setReconformPreview(createOffsetReconformPreview(state, `picture-offset-r${state.revision}`, offsetFrames));
      setMessage('A non-destructive constant-offset preview was built. Review every cue before applying it.');
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : String(reason));
    }
  };

  const applyPreview = () => {
    if (!reconformPreview || !previewIsFresh) return;
    void runMutation(
      (current) => applyReconformPreview(current, reconformPreview),
      `ReConform ${reconformPreview.id} applied as one undoable project edit. No source media was rewritten.`,
    );
  };

  const downloadCueSheet = () => {
    if (!state?.cues.length) return;
    const blob = new Blob([createAdrCueSheetCsv(state)], {type: 'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${safeFilename(project?.title ?? 'poietek')}-adr-cues.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage('Chronological ADR cue sheet exported locally as CSV. No cloud service was contacted.');
  };

  return (
    <div className="poietek-workbench-device overflow-hidden rounded-xl border border-violet-400/35 bg-[#100b19] text-slate-100 shadow-inner">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-violet-300/20 bg-gradient-to-r from-violet-950 via-slate-950 to-fuchsia-950 px-3 py-2">
        <div className="flex items-center gap-2">
          <Film className="h-4 w-4 text-violet-200" />
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.15em] text-violet-100">Picture & Dialog Post</div>
            <div className="text-[9px] text-slate-400">SMPTE cues · ADR takes · field metadata · safe ReConform · cue-sheet delivery</div>
          </div>
        </div>
        <span className="rounded-full border border-emerald-400/35 bg-emerald-400/10 px-2 py-1 text-[8px] font-black uppercase text-emerald-200">Project-owned workflow</span>
      </header>

      <nav className="grid grid-cols-5 border-b border-slate-700/80" aria-label="Picture post workbench views">
        {views.map((item) => {
          const Icon = item.icon;
          return <button key={item.id} type="button" aria-pressed={view === item.id} onClick={() => updateView(item.id)} className={`flex min-h-11 items-center justify-center gap-1 border-r border-slate-700/60 px-1 py-2 text-[7px] font-black uppercase last:border-r-0 ${view === item.id ? 'bg-violet-300 text-slate-950' : 'bg-slate-950/70 text-slate-400 hover:bg-slate-800'}`}><Icon className="h-3 w-3" />{item.label}</button>;
        })}
      </nav>

      {!project && <section className="p-3"><Notice tone="amber">The canonical local project is still starting. Picture-post work cannot be saved yet.</Notice></section>}
      {loaded.error && <section className="p-3"><Notice tone="rose">{loaded.error}</Notice></section>}

      {project && state && view === 'cues' && <section className="space-y-3 p-3" aria-label="ADR cue editor">
        <div className="grid gap-2 sm:grid-cols-4">
          <StatusCard label="Revision" value={`r${state.revision}`} tone="violet" />
          <StatusCard label="Frame rate" value={`${state.setup.frameRate.replace('_df', ' DF')} fps`} tone="violet" />
          <StatusCard label="Picture" value={state.setup.pictureAssetId ? 'Linked by asset id' : 'No video asset'} tone={state.setup.pictureAssetId ? 'violet' : 'amber'} />
          <StatusCard label="Native clock" value="Not observed" tone="amber" />
        </div>
        <div className="grid gap-2 rounded-lg border border-slate-700 bg-slate-950 p-2 sm:grid-cols-[1fr_auto]">
          <label className="text-[8px] font-black uppercase text-slate-400">Project frame rate
            <select value={chosenFrameRate} onChange={(event) => updateFrameRate(event.target.value as PictureFrameRate)} className="mt-1 min-h-10 w-full rounded border border-slate-700 bg-slate-900 px-2 text-[9px] text-slate-100">
              {frameRates.map((rate) => <option key={rate} value={rate}>{rate.replace('_df', ' drop-frame')} fps</option>)}
            </select>
          </label>
          <button type="button" disabled={!onMutatePicturePost || busy} onClick={() => void saveSetup()} className="min-h-11 self-end rounded border border-violet-400/40 bg-violet-400/10 px-3 py-2 text-[8px] font-black uppercase text-violet-100 disabled:opacity-40">Save post setup</button>
        </div>
        <CueList state={state} selectedCueId={selectedCue?.id ?? null} onSelect={setSelectedCueId} />
        {!state.cues.length && <button type="button" disabled={!onMutatePicturePost || busy} onClick={() => void saveStarterCuePlan()} className="min-h-11 w-full rounded border border-violet-400/40 bg-violet-400/10 px-3 py-2 text-[8px] font-black uppercase text-violet-100 disabled:opacity-40">Create original ADR + Foley starter cues</button>}
        {selectedCue && <div className="rounded-lg border border-violet-400/25 bg-gradient-to-br from-slate-950 to-violet-950/50 p-3">
          <div className="flex items-center justify-between gap-3 text-[8px]"><span className="font-black uppercase text-violet-200">Talent overlay preview · {selectedCue.cueNumber}</span><code className="text-amber-200">{formatProjectTimecode(state, selectedCue.startFrame)}</code></div>
          <p className="mt-3 text-center text-base font-black tracking-wide text-white">{selectedCue.dialogue || selectedCue.notes || 'No dialogue text'}</p>
          <p className="mt-1 text-center text-[8px] uppercase text-violet-200">{selectedCue.character || 'Unassigned'} · {selectedCue.kind}</p>
          <div className="mt-3 grid grid-cols-4 gap-1">
            <CueModeButton label="Rehearse" active={selectedCue.sessionMode === 'rehearse_intent'} onClick={() => markCue('rehearsed', 'rehearse_intent', 'Rehearse')} />
            <CueModeButton label="Record ready" active={selectedCue.sessionMode === 'record_intent'} onClick={() => markCue('record_ready', 'record_intent', 'Record-ready')} />
            <CueModeButton label="Review" active={selectedCue.sessionMode === 'review_intent'} onClick={() => markCue('review', 'review_intent', 'Review')} />
            <CueModeButton label="Approve" active={selectedCue.status === 'approved'} onClick={() => markCue('approved', 'idle', 'Approval')} />
          </div>
          <p className="mt-2 text-[7px] text-slate-500">These buttons save ADR transport intent and cue status. Live audio capture remains unavailable until an input adapter returns stream evidence.</p>
        </div>}
      </section>}

      {project && state && view === 'takes' && <section className="space-y-3 p-3" aria-label="ADR take references">
        <CueChooser state={state} selectedCueId={selectedCue?.id ?? null} onSelect={setSelectedCueId} />
        {selectedCue ? <>
          <div className="overflow-hidden rounded-lg border border-slate-700">
            {selectedTakes.length ? selectedTakes.map((take) => {
              const asset = project.assets.find((candidate) => candidate.id === take.audioAssetId);
              return <div key={take.id} className="grid min-h-12 grid-cols-[auto_1fr_auto] items-center gap-2 border-b border-slate-800 bg-slate-950/70 px-3 py-2 text-[8px] last:border-b-0"><span className="font-black text-violet-200">T{take.takeNumber}</span><span className="min-w-0"><strong className="block truncate text-slate-200">{asset?.originalName ?? take.audioAssetId}</strong><small className="text-slate-500">{take.performer} · stored asset reference</small></span><button type="button" disabled={busy || selectedCue.preferredTakeId === take.id} onClick={() => void runMutation((current) => setPreferredAdrTake(current, selectedCue.id, take.id), `Take ${take.takeNumber} marked preferred for cue ${selectedCue.cueNumber}.`)} className="min-h-10 rounded border border-amber-400/30 px-2 text-[7px] font-black uppercase text-amber-200 disabled:opacity-40"><Star className="mr-1 inline h-3 w-3" />{selectedCue.preferredTakeId === take.id ? 'Preferred' : 'Prefer'}</button></div>;
            }) : <div className="p-3 text-[9px] text-slate-400">No stored audio has been linked to this cue.</div>}
          </div>
          <button type="button" disabled={!availableTakeAsset || !onMutatePicturePost || busy} onClick={logStoredTake} className="min-h-11 w-full rounded border border-violet-400/40 bg-violet-400/10 px-3 py-2 text-[8px] font-black uppercase text-violet-100 disabled:opacity-40">{availableTakeAsset ? `Link stored audio: ${availableTakeAsset.originalName}` : 'No unlinked canonical audio asset'}</button>
          <Notice tone="violet">Take logging only points to audio already stored in the canonical project. It never fabricates a recording, waveform, performer session or input stream.</Notice>
        </> : <Notice tone="amber">Create or select a cue before logging take references.</Notice>}
      </section>}

      {project && state && view === 'reconform' && <section className="space-y-3 p-3" aria-label="Picture ReConform preview">
        <Notice tone="violet">Build and inspect a constant picture-revision offset. Production EDL import remains an adapter task; this local preview never rewrites source media.</Notice>
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <label className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-[8px] font-black uppercase text-slate-400">Offset frames
            <input type="number" step="1" value={offsetFrames} onChange={(event) => setOffsetFrames(Number(event.target.value))} className="mt-1 min-h-10 w-full rounded border border-slate-700 bg-slate-900 px-2 text-[10px] text-slate-100" />
          </label>
          <button type="button" disabled={!state.cues.length || busy} onClick={buildPreview} className="min-h-11 self-end rounded border border-violet-400/40 bg-violet-400/10 px-3 py-2 text-[8px] font-black uppercase text-violet-100 disabled:opacity-40">Build preview</button>
        </div>
        {reconformPreview ? <div className="overflow-hidden rounded-lg border border-slate-700">
          <div className="flex items-center justify-between gap-2 bg-slate-900 px-3 py-2 text-[8px]"><strong className="uppercase text-violet-200">{reconformPreview.id}</strong><span className={reconformPreview.canApply ? 'text-emerald-300' : 'text-amber-200'}>{reconformPreview.canApply ? 'All cues mapped' : 'Manual review required'}</span></div>
          {reconformPreview.entries.map((entry) => <div key={entry.cueId} className="grid grid-cols-[0.7fr_1fr_1fr] items-center border-t border-slate-800 bg-slate-950/70 px-3 py-2 text-[8px]"><span className="font-black text-slate-300">{entry.cueId}</span><span className="text-slate-500">{entry.originalStartFrame} → {entry.nextStartFrame ?? 'review'}</span><span className={entry.state === 'manual_review' ? 'text-amber-200' : entry.state === 'shift' ? 'text-violet-200' : 'text-slate-500'}>{entry.message}</span></div>)}
          <div className="border-t border-slate-700 bg-slate-900 p-3"><p className="text-[8px] text-slate-400">{reconformPreview.claim}</p><button type="button" disabled={!previewIsFresh || !reconformPreview.canApply || busy || !onMutatePicturePost} onClick={applyPreview} className="mt-2 min-h-11 w-full rounded border border-emerald-400/35 bg-emerald-400/10 px-3 text-[8px] font-black uppercase text-emerald-200 disabled:opacity-40">Apply as one undoable edit</button></div>
        </div> : <div className="rounded-lg border border-dashed border-slate-700 p-4 text-center text-[9px] text-slate-500">No ReConform preview has been built.</div>}
        {state.lastReconform && <div className="flex items-center gap-2 rounded-lg border border-emerald-400/25 bg-emerald-400/5 p-2 text-[8px] text-emerald-100"><CheckCircle2 className="h-3 w-3" />Last apply: {state.lastReconform.id} · {state.lastReconform.changedCueIds.length} cues · r{state.lastReconform.fromRevision}→r{state.lastReconform.toRevision}</div>}
      </section>}

      {project && state && view === 'field_audio' && <section className="space-y-3 p-3" aria-label="Field recorder matching">
        <CueChooser state={state} selectedCueId={selectedCue?.id ?? null} onSelect={setSelectedCueId} />
        {selectedCue?.fieldReference && <div className="grid gap-2 sm:grid-cols-3"><StatusCard label="Scene" value={selectedCue.fieldReference.scene} tone="violet" /><StatusCard label="Take" value={selectedCue.fieldReference.take} tone="violet" /><StatusCard label="Tape / reel" value={selectedCue.fieldReference.tape ?? 'Not set'} tone={selectedCue.fieldReference.tape ? 'violet' : 'amber'} /></div>}
        <div className="overflow-hidden rounded-lg border border-slate-700">
          {fieldPlan?.matches.length ? fieldPlan.matches.map((match) => <div key={match.assetId} className="grid min-h-12 grid-cols-[auto_1fr_auto] items-center gap-2 border-b border-slate-800 bg-slate-950/70 px-3 py-2 text-[8px] last:border-b-0"><Link2 className="h-3 w-3 text-violet-200" /><span><strong className="block text-slate-200">{match.originalName}</strong><small className="text-slate-500">Matched {match.matchedAttributes.join(' + ')}</small></span><span className={match.confidence === 'strong' ? 'text-emerald-300' : 'text-amber-200'}>{match.confidence}</span></div>) : <div className="p-3 text-[9px] text-slate-400">No evidence-backed field-recorder matches.</div>}
        </div>
        <Notice tone={fieldPlan?.matches.length ? 'violet' : 'amber'}>{fieldPlan?.claim ?? 'Select a cue to compare field metadata.'}</Notice>
        <p className="text-[8px] text-slate-500">Poietek compares canonical audio metadata only. Folder scans, BWF/iXML parsing, audition and lane import require reviewed filesystem and audio adapters.</p>
      </section>}

      {project && state && view === 'delivery' && <section className="space-y-3 p-3" aria-label="Post-production delivery">
        <div className="grid gap-2 sm:grid-cols-3"><StatusCard label="Cue sheet" value={`${state.cues.length} chronological cues`} tone={state.cues.length ? 'violet' : 'amber'} /><StatusCard label="Preferred takes" value={`${state.cues.filter((cue) => cue.preferredTakeId).length} selected`} tone="violet" /><StatusCard label="Sample rate" value={`${project.settings.sampleRate / 1000} kHz project`} tone={project.settings.sampleRate === 48000 ? 'violet' : 'amber'} /></div>
        <button type="button" disabled={!state.cues.length} onClick={downloadCueSheet} className="min-h-11 w-full rounded border border-violet-400/40 bg-violet-400/10 px-3 py-2 text-[8px] font-black uppercase text-violet-100 disabled:opacity-40"><FileSpreadsheet className="mr-1 inline h-3 w-3" />Export local ADR cue sheet CSV</button>
        <div className="rounded-lg border border-slate-700 bg-slate-950 p-3">
          <div className="flex items-center justify-between gap-2"><strong className="text-[9px] uppercase text-violet-200">Native delivery gates</strong><span className="text-[8px] text-amber-200">{readiness.missingCapabilities.length} adapters missing</span></div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">{readiness.missingCapabilities.map((capability) => <div key={capability} className="flex items-center gap-2 rounded border border-amber-400/20 bg-amber-400/5 p-2 text-[8px] text-amber-100"><AlertTriangle className="h-3 w-3 shrink-0" />{capability.replaceAll('_', ' ')}</div>)}</div>
          <p className="mt-2 text-[8px] text-slate-500">{readiness.claim} CSV cue-sheet export is local data interchange and does not depend on these media adapters.</p>
        </div>
        <Notice tone="amber">ADM/Atmos, loudness and intelligibility measurements, AAF/EDL interchange, MXF/video encoding and game-audio transfer are not claimed by this build.</Notice>
      </section>}

      {message ? <div className="mx-3 mb-3 flex items-start gap-2 rounded border border-emerald-400/25 bg-emerald-400/5 p-2 text-[8px] text-emerald-100" role="status"><CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" />{message}</div> : null}
      <footer className="flex items-center gap-2 border-t border-violet-400/20 bg-violet-400/5 px-3 py-2 text-[8px] text-violet-100/80"><RefreshCw className="h-3 w-3 shrink-0" />Local cue, take, match, reconform and CSV operations are active. Media engines remain evidence-gated.</footer>
    </div>
  );
};

const CueList: React.FC<{
  state: NonNullable<ReturnType<typeof getProjectPicturePostState>> | ReturnType<typeof createPicturePostState>;
  selectedCueId: string | null;
  onSelect(id: string): void;
}> = ({state, selectedCueId, onSelect}) => <div className="overflow-hidden rounded-lg border border-slate-700">{state.cues.length ? state.cues.map((cue) => <button key={cue.id} type="button" onClick={() => onSelect(cue.id)} aria-pressed={selectedCueId === cue.id} className={`grid min-h-12 w-full grid-cols-[0.55fr_0.85fr_1.6fr_0.7fr] items-center gap-2 border-b border-slate-800 px-3 py-2 text-left text-[8px] last:border-b-0 ${selectedCueId === cue.id ? 'bg-violet-400/15' : 'bg-slate-950/70 hover:bg-slate-900'}`}><strong className="text-violet-200">{cue.cueNumber}</strong><code className="text-amber-200">{formatProjectTimecode(state, cue.startFrame)}</code><span className="truncate text-slate-300">{cue.dialogue || cue.notes}</span><span className="text-right uppercase text-slate-500">{cue.status.replaceAll('_', ' ')}</span></button>) : <div className="p-3 text-[9px] text-slate-400">No picture-post cues are saved.</div>}</div>;

const CueChooser: React.FC<{
  state: NonNullable<ReturnType<typeof getProjectPicturePostState>> | ReturnType<typeof createPicturePostState>;
  selectedCueId: string | null;
  onSelect(id: string): void;
}> = ({state, selectedCueId, onSelect}) => <label className="block text-[8px] font-black uppercase text-slate-400">Active cue<select value={selectedCueId ?? ''} onChange={(event) => onSelect(event.target.value)} className="mt-1 min-h-11 w-full rounded border border-slate-700 bg-slate-950 px-2 text-[9px] text-slate-100"><option value="" disabled>Select a cue</option>{state.cues.map((cue) => <option key={cue.id} value={cue.id}>{cue.cueNumber} · {cue.character || cue.kind} · {cue.dialogue || cue.notes}</option>)}</select></label>;

const CueModeButton: React.FC<{label: string; active: boolean; onClick(): void}> = ({label, active, onClick}) => <button type="button" onClick={onClick} className={`min-h-11 rounded border px-1 text-[7px] font-black uppercase ${active ? 'border-violet-200 bg-violet-300 text-slate-950' : 'border-slate-700 bg-slate-950 text-slate-400 hover:border-violet-400'}`}>{label}</button>;

const StatusCard: React.FC<{label: string; value: string; tone: 'violet' | 'amber'}> = ({label, value, tone}) => <div className="rounded-lg border border-slate-700 bg-slate-950 p-2"><span className="block text-[7px] font-black uppercase text-slate-500">{label}</span><strong className={`mt-1 block truncate text-[9px] ${tone === 'violet' ? 'text-violet-200' : 'text-amber-200'}`}>{value}</strong></div>;

const Notice: React.FC<{tone: 'violet' | 'amber' | 'rose'; children: React.ReactNode}> = ({tone, children}) => {
  const styles = tone === 'violet' ? 'border-violet-400/25 bg-violet-400/5 text-violet-100' : tone === 'rose' ? 'border-rose-400/30 bg-rose-400/10 text-rose-100' : 'border-amber-400/30 bg-amber-400/10 text-amber-100';
  const Icon = tone === 'rose' ? AlertTriangle : tone === 'amber' ? Clock3 : ListVideo;
  return <div className={`flex items-start gap-2 rounded-lg border p-3 text-[8px] leading-relaxed ${styles}`}><Icon className="mt-0.5 h-3 w-3 shrink-0" />{children}</div>;
};

function createCue(
  id: string,
  cueNumber: string,
  kind: AdrCue['kind'],
  startFrame: number,
  endFrame: number,
  character: string,
  dialogue: string,
  targetTrackId: string | null,
  fieldReference: AdrCue['fieldReference'],
): AdrCue {
  return {id, cueNumber, kind, startFrame, endFrame, character, dialogue, notes: '', targetTrackId, status: 'scripted', sessionMode: 'idle', fieldReference, preferredTakeId: null};
}

function safeFilename(value: string): string {
  return value.trim().replace(/[^a-z0-9._-]+/gi, '-').replace(/^-+|-+$/g, '').toLocaleLowerCase() || 'poietek';
}
