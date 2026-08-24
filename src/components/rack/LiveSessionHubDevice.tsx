import React, {useMemo, useState} from 'react';
import {
  Cable,
  CheckCircle2,
  FileArchive,
  Headphones,
  Mic2,
  RadioTower,
  RefreshCw,
  ShieldCheck,
  Usb,
} from 'lucide-react';
import type {RackModuleItem} from '../../types';
import type {PoietekProject} from '../../poietek/domain/types';
import {
  createLiveSessionState,
  createVirtualSoundcheckRequest,
  deriveChannelNameSyncPlan,
  deriveSessionInterchangeReadiness,
  getProjectLiveSessionState,
  setVirtualSoundcheckSelection,
  upsertLiveCaptureChannel,
  upsertRemoteAccessRule,
  type LiveSessionMutation,
  type SessionInterchangeKind,
} from '../../poietek/production-workflows';

interface LiveSessionHubDeviceProps {
  module: RackModuleItem;
  onParametersChange(parameters: RackModuleItem['parameters']): void;
  project?: PoietekProject | null;
  projectBusy?: boolean;
  onMutateLiveSession?(mutation: LiveSessionMutation): Promise<void>;
}

type HubView = 'capture' | 'soundcheck' | 'remote' | 'handoff';

const views = [
  {id: 'capture', label: 'Capture', icon: Mic2},
  {id: 'soundcheck', label: 'Soundcheck', icon: Headphones},
  {id: 'remote', label: 'Remote roles', icon: ShieldCheck},
  {id: 'handoff', label: 'Handoff', icon: FileArchive},
] as const;

const interchangeKinds: readonly SessionInterchangeKind[] = [
  'dawproject',
  'audioloop',
  'musicloop',
  'ara_audio_access',
  'sound_variation_discovery',
];

const interchangeLabels: Readonly<Record<SessionInterchangeKind, string>> = {
  dawproject: 'DAWproject package',
  audioloop: 'Audio-loop metadata',
  musicloop: 'Music-loop performance',
  ara_audio_access: 'Audio document access',
  sound_variation_discovery: 'Articulation discovery',
};

export const LiveSessionHubDevice: React.FC<LiveSessionHubDeviceProps> = ({
  module,
  onParametersChange,
  project = null,
  projectBusy = false,
  onMutateLiveSession,
}) => {
  const parameters = module.parameters ?? {};
  const view = String(parameters.view ?? 'capture') as HubView;
  const updateView = (next: HubView) => onParametersChange({...parameters, view: next});
  const [actionState, setActionState] = useState<'idle' | 'saving'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const state = useMemo(() => project
    ? getProjectLiveSessionState(project) ?? createLiveSessionState(project.id)
    : null, [project]);
  const syncPlan = useMemo(() => state && project
    ? deriveChannelNameSyncPlan(state, project)
    : null, [project, state]);
  const soundcheck = useMemo(() => state && project
    ? createVirtualSoundcheckRequest(state, project, [])
    : null, [project, state]);
  const interchange = useMemo(() => interchangeKinds.map((kind) => (
    deriveSessionInterchangeReadiness(kind, [])
  )), []);
  const busy = projectBusy || actionState !== 'idle';

  const runMutation = async (mutation: LiveSessionMutation, success: string) => {
    if (!onMutateLiveSession || busy) return;
    setActionState('saving');
    setMessage(null);
    try {
      await onMutateLiveSession(mutation);
      setMessage(success);
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setActionState('idle');
    }
  };

  const saveStarterCapturePlan = () => runMutation((current) => {
    const first = project?.tracks[0] ?? null;
    const second = project?.tracks[1] ?? null;
    const withMic = upsertLiveCaptureChannel(current, {
      id: 'capture-mic-1',
      sourceName: 'Mic / Input 1',
      sourceKind: 'microphone',
      captureIntent: 'safe',
      canonicalTrackId: first?.id ?? null,
      namingAuthority: first ? 'track' : 'manual',
    });
    return upsertLiveCaptureChannel(withMic, {
      id: 'capture-usb-left',
      sourceName: 'USB Left',
      sourceKind: 'usb_left',
      captureIntent: 'safe',
      canonicalTrackId: second?.id ?? null,
      namingAuthority: second ? 'track' : 'manual',
    });
  }, 'Two-channel capture plan saved in canonical project history. No input has been opened.');

  const savePerformerPolicy = () => runMutation((current) => upsertRemoteAccessRule(current, {
    id: 'performer-cue-a',
    subjectLabel: 'Performer — Cue A',
    role: 'performer',
    scopes: ['assigned_cue', 'read_only'],
    assignedCueId: 'cue-a',
    consentAcknowledgedAt: new Date().toISOString(),
  }, 'owner'), 'Performer policy saved locally. No remote participant or connection is active.');

  const selectRecordedAssets = () => runMutation((current) => setVirtualSoundcheckSelection(
    current,
    project?.assets.filter((asset) => asset.mediaType === 'audio').map((asset) => asset.id) ?? [],
    current.endpointObservations.find((endpoint) => endpoint.direction === 'output'
      && endpoint.state === 'available'
      && endpoint.compatibility !== 'incompatible')?.endpointId ?? null,
  ), 'Recorded project assets selected. Playback remains gated by route and adapter evidence.');

  return (
    <div className="poietek-workbench-device overflow-hidden rounded-xl border border-sky-400/35 bg-[#07131d] text-slate-100 shadow-inner">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-300/20 bg-gradient-to-r from-sky-950 via-slate-950 to-indigo-950 px-3 py-2">
        <div className="flex items-center gap-2">
          <RadioTower className="h-4 w-4 text-sky-200" />
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.15em] text-sky-100">Live Session Hub</div>
            <div className="text-[9px] text-slate-400">Capture plan · naming handoff · soundcheck · scoped remote control</div>
          </div>
        </div>
        <span className="rounded-full border border-amber-400/45 bg-amber-400/10 px-2 py-1 text-[8px] font-black uppercase text-amber-200">Local plan · evidence gated</span>
      </header>

      <nav className="grid grid-cols-4 border-b border-slate-700/80" aria-label="Live session hub views">
        {views.map((item) => {
          const Icon = item.icon;
          return <button key={item.id} type="button" aria-pressed={view === item.id} onClick={() => updateView(item.id)} className={`flex min-h-11 items-center justify-center gap-1 border-r border-slate-700/60 px-1 py-2 text-[8px] font-black uppercase last:border-r-0 ${view === item.id ? 'bg-sky-300 text-slate-950' : 'bg-slate-950/70 text-slate-400 hover:bg-slate-800'}`}><Icon className="h-3 w-3" />{item.label}</button>;
        })}
      </nav>

      {!project && <section className="p-3"><div className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-[9px] text-amber-100">The canonical local project is still starting. Live-session plans cannot be saved yet.</div></section>}

      {project && state && view === 'capture' && <section className="space-y-3 p-3" aria-label="Live capture plan">
        <div className="grid gap-2 sm:grid-cols-3">
          <StatusCard label="Plan revision" value={`r${state.revision}`} tone="sky" />
          <StatusCard label="Input device" value={state.endpointObservations.some((item) => item.direction === 'input' && item.state === 'available') ? 'Observed' : 'Not observed'} tone="amber" />
          <StatusCard label="Capture stream" value={state.endpointObservations.some((item) => item.direction === 'input' && item.activeStreamId) ? 'Observed' : 'Not active'} tone="amber" />
        </div>
        <div className="overflow-hidden rounded-lg border border-slate-700">
          {state.channels.length ? state.channels.map((channel) => {
            const track = project.tracks.find((candidate) => candidate.id === channel.canonicalTrackId);
            return <div key={channel.id} className="grid min-h-11 grid-cols-[1.1fr_0.8fr_1fr] items-center border-b border-slate-800 bg-slate-950/70 px-2 py-1.5 text-[8px] last:border-b-0"><span className="flex items-center gap-1 font-black text-sky-200">{channel.sourceKind.startsWith('usb') ? <Usb className="h-3 w-3" /> : <Mic2 className="h-3 w-3" />}{channel.sourceName}</span><span className={channel.captureIntent === 'armed' ? 'text-rose-300' : 'text-slate-500'}>{channel.captureIntent === 'armed' ? 'Arm intent' : 'Safe'}</span><span className="truncate text-right text-slate-400">{track?.name ?? 'Unlinked track'}</span></div>;
          }) : <div className="p-3 text-[9px] text-slate-400">No capture channels have been planned.</div>}
        </div>
        <button type="button" disabled={!onMutateLiveSession || busy} onClick={() => void saveStarterCapturePlan()} className="min-h-11 w-full rounded border border-sky-400/40 bg-sky-400/10 px-3 py-2 text-[8px] font-black uppercase text-sky-100 disabled:cursor-not-allowed disabled:opacity-40">{actionState === 'saving' ? 'Saving project plan…' : 'Save mic + USB-L capture plan'}</button>
        <div className="rounded-lg border border-slate-700 bg-slate-950 p-3 text-[8px] text-slate-400"><strong className="block text-sky-200">Naming handoff</strong><span>{syncPlan?.entries.length ?? 0} planned mappings · {syncPlan?.conflicts.length ?? 0} conflicts</span><p className="mt-1">{syncPlan?.claim}</p></div>
      </section>}

      {project && state && view === 'soundcheck' && <section className="space-y-3 p-3" aria-label="Virtual soundcheck readiness">
        <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-3">
          <div className="flex items-center gap-2"><Headphones className="h-4 w-4 text-amber-200" /><strong className="text-[9px] uppercase text-amber-100">{soundcheck?.state.replaceAll('_', ' ')}</strong></div>
          <p className="mt-2 text-[8px] leading-relaxed text-amber-50/80">{soundcheck?.message}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <StatusCard label="Project recordings" value={`${project.assets.filter((asset) => asset.mediaType === 'audio').length} audio assets`} tone={project.assets.some((asset) => asset.mediaType === 'audio') ? 'sky' : 'amber'} />
          <StatusCard label="Output route" value={soundcheck?.outputEndpointId ?? 'Not observed'} tone={soundcheck?.outputEndpointId ? 'sky' : 'amber'} />
          <StatusCard label="Playback adapter" value={soundcheck?.adapterId ?? 'Not installed'} tone={soundcheck?.adapterId ? 'sky' : 'amber'} />
        </div>
        <button type="button" disabled={!project.assets.some((asset) => asset.mediaType === 'audio') || !onMutateLiveSession || busy} onClick={() => void selectRecordedAssets()} className="min-h-11 w-full rounded border border-sky-400/40 bg-sky-400/10 px-3 py-2 text-[8px] font-black uppercase text-sky-100 disabled:cursor-not-allowed disabled:opacity-40">Select stored recordings for soundcheck</button>
        <p className="text-[8px] text-slate-500">A ready request still does not mean playback is active. Poietek requires returned stream evidence before making that claim.</p>
      </section>}

      {project && state && view === 'remote' && <section className="space-y-3 p-3" aria-label="Remote control access policy">
        <div className="grid gap-2 sm:grid-cols-3">
          <PolicyCard title="Engineer" detail="Full mix · capture · transport" />
          <PolicyCard title="Performer" detail="One assigned cue · read only" />
          <PolicyCard title="Observer" detail="Read only" />
        </div>
        <div className="overflow-hidden rounded-lg border border-slate-700">
          {state.remoteAccessRules.length ? state.remoteAccessRules.map((rule) => <div key={rule.id} className="flex min-h-11 items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/70 px-3 py-2 text-[8px] last:border-b-0"><div><strong className="block text-sky-200">{rule.subjectLabel}</strong><span className="text-slate-500">{rule.role} · {rule.scopes.join(' · ')}</span></div><span className="text-right text-emerald-300">Policy saved</span></div>) : <div className="p-3 text-[9px] text-slate-400">No remote access policies have been saved.</div>}
        </div>
        <button type="button" disabled={!onMutateLiveSession || busy} onClick={() => void savePerformerPolicy()} className="min-h-11 w-full rounded border border-sky-400/40 bg-sky-400/10 px-3 py-2 text-[8px] font-black uppercase text-sky-100 disabled:cursor-not-allowed disabled:opacity-40">Acknowledge & save performer Cue A policy</button>
        <p className="text-[8px] text-slate-500">This records the local owner’s access policy and acknowledgement only. It does not prove participant consent, authentication, encryption or a live network session.</p>
      </section>}

      {project && state && view === 'handoff' && <section className="space-y-3 p-3" aria-label="Session handoff and compatibility">
        <div className="rounded-lg border border-slate-700 bg-slate-950 p-3">
          <div className="flex items-center justify-between gap-2"><strong className="text-[9px] uppercase text-sky-200">Observed endpoints</strong><span className="text-[8px] text-slate-500">{state.endpointObservations.length}</span></div>
          {state.endpointObservations.length ? state.endpointObservations.map((endpoint) => <div key={endpoint.id} className="mt-2 flex items-center justify-between gap-3 rounded border border-slate-800 bg-slate-900 p-2 text-[8px]"><span><Cable className="mr-1 inline h-3 w-3" />{endpoint.endpointName}</span><span className={endpoint.compatibility === 'compatible' ? 'text-emerald-300' : endpoint.compatibility === 'incompatible' ? 'text-rose-300' : 'text-amber-200'}>{endpoint.compatibility} · {endpoint.firmwareVersion ?? endpoint.softwareVersion ?? 'version not reported'}</span></div>) : <p className="mt-2 text-[8px] text-amber-100">No device, firmware, software or protocol compatibility has been observed.</p>}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {interchange.map((item) => <div key={item.kind} className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-[8px]"><div className="flex items-center justify-between gap-2"><strong className="text-sky-200">{interchangeLabels[item.kind]}</strong><span className="text-amber-200">Adapter needed</span></div><p className="mt-1 text-slate-500">{item.message}</p></div>)}
        </div>
      </section>}

      {message ? <div className="mx-3 mb-3 flex items-start gap-2 rounded border border-emerald-400/25 bg-emerald-400/5 p-2 text-[8px] text-emerald-100" role="status"><CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" />{message}</div> : null}
      <footer className="flex items-center gap-2 border-t border-sky-400/20 bg-sky-400/5 px-3 py-2 text-[8px] text-sky-100/80"><RefreshCw className="h-3 w-3 shrink-0" />Only durable local intent is active. Hardware and network observations must come from reviewed adapters.</footer>
    </div>
  );
};

const StatusCard: React.FC<{label: string; value: string; tone: 'sky' | 'amber'}> = ({label, value, tone}) => <div className="rounded-lg border border-slate-700 bg-slate-950 p-2"><span className="block text-[7px] font-black uppercase text-slate-500">{label}</span><strong className={`mt-1 block truncate text-[9px] ${tone === 'sky' ? 'text-sky-200' : 'text-amber-200'}`}>{value}</strong></div>;

const PolicyCard: React.FC<{title: string; detail: string}> = ({title, detail}) => <div className="rounded-lg border border-slate-700 bg-slate-950 p-2"><strong className="block text-[9px] uppercase text-sky-200">{title}</strong><span className="mt-1 block text-[8px] text-slate-500">{detail}</span></div>;
