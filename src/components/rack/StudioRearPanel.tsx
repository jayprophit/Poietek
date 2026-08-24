import React, {useMemo} from 'react';
import {ArrowRight, ArrowRightLeft, Cable, CircleAlert, Network, Radio} from 'lucide-react';
import type {RackModuleItem} from '../../types';
import {deriveAutomaticRackSignalFlow} from '../../poietek/rack';
import {getRackModuleDefinition} from './rackModuleCatalog';

interface StudioRearPanelProps {
  rackModules: RackModuleItem[];
  onToggleFlip(): void;
}

const signalStyle = {
  audio: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300',
  note: 'border-violet-500/50 bg-violet-500/10 text-violet-300',
  cv: 'border-amber-500/50 bg-amber-500/10 text-amber-300',
  gate: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300',
} as const;

export const StudioRearPanel: React.FC<StudioRearPanelProps> = ({
  rackModules,
  onToggleFlip,
}) => {
  const flow = useMemo(() => deriveAutomaticRackSignalFlow(rackModules.map((module) => {
    const definition = getRackModuleDefinition(module.type);
    return {
      id: module.id,
      title: module.title,
      role: definition.role,
      inputs: definition.inputs,
      outputs: definition.outputs,
      groupId: module.groupId,
    };
  })), [rackModules]);

  return (
    <div className="relative min-h-[600px] overflow-auto rounded-2xl border-2 border-neutral-800 bg-neutral-950 p-4 shadow-2xl sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:12px_12px] opacity-60" />

      <header className="relative z-10 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-neutral-700 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 p-4 shadow-xl">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-amber-400">
            <Radio className="h-4 w-4" />
            Rear Connections & Routing Inspector
          </h2>
          <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-neutral-400">
            The front panel shapes devices; this rear view explains their saved logical ports and automatic top-to-bottom connections.
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleFlip}
          className="flex items-center gap-1 rounded bg-amber-500 px-4 py-2 text-xs font-black text-neutral-950 transition hover:bg-amber-400"
        >
          <ArrowRightLeft className="h-3.5 w-3.5" />
          Front Rack (Tab)
        </button>
      </header>

      <div className="relative z-10 mb-4 flex items-start gap-2 rounded-xl border border-amber-500/35 bg-amber-500/10 p-3 text-[10px] leading-relaxed text-amber-100">
        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
        <span><strong>Logical route preview:</strong> visible connections are derived from the rack model and do not claim an active native DSP cable. CV, gate, sidechain, send and parallel routes remain explicit until stored by the canonical patch graph.</span>
      </div>

      <section className="relative z-10 mb-4 rounded-xl border border-slate-700 bg-slate-950/90 p-3" aria-label="Automatic rack connections">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-200"><Network className="h-4 w-4" />Automatic logical connections</h3>
          <span className="rounded-full border border-cyan-500/30 px-2 py-1 text-[9px] font-bold text-cyan-300">{flow.connections.length} links</span>
        </div>
        <div className="space-y-2">
          {flow.connections.length ? flow.connections.map((connection) => (
            <div key={connection.id} className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/85 p-2">
              <span className="truncate text-[10px] font-bold text-slate-200">{connection.sourceTitle}</span>
              <span className={`flex items-center gap-1 rounded border px-2 py-1 text-[8px] font-black uppercase ${signalStyle[connection.signal]}`}>
                {connection.signal}<ArrowRight className="h-3 w-3" />
              </span>
              <span className="truncate text-right text-[10px] font-bold text-slate-200">{connection.destinationTitle}</span>
            </div>
          )) : (
            <div className="rounded-lg border border-dashed border-slate-700 p-4 text-center text-[10px] text-slate-500">Add compatible Player, instrument, effect, utility or mixer devices to derive a flow.</div>
          )}
        </div>
      </section>

      <section className="relative z-10 space-y-3" aria-label="Rack rear device ports">
        {flow.modules.map((module, index) => {
          const rackModule = rackModules.find((candidate) => candidate.id === module.id);
          if (!rackModule) return null;
          const definition = getRackModuleDefinition(rackModule.type);
          return (
            <article key={module.id} className="rounded-xl border-2 border-neutral-700 bg-gradient-to-r from-neutral-900 via-stone-900 to-neutral-900 p-4 shadow-xl">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-amber-200 px-2 py-1 text-[9px] font-black uppercase text-neutral-950">{rackModule.tapeLabel}</span>
                  <span className="text-[10px] font-bold text-neutral-300">{module.title}</span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider text-neutral-500">RU {String(index + 1).padStart(2, '0')} · {definition.role}</span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <div className="mb-2 text-[9px] font-black uppercase tracking-wider text-neutral-500">Inputs</div>
                  <div className="flex min-h-8 flex-wrap gap-2">
                    {definition.inputs.length ? definition.inputs.map((signal) => <span key={signal} className={`rounded-full border px-2 py-1 text-[8px] font-black uppercase ${signalStyle[signal]}`}>{signal} in</span>) : <span className="text-[9px] text-neutral-600">No declared input ports</span>}
                  </div>
                </div>
                <div>
                  <div className="mb-2 text-[9px] font-black uppercase tracking-wider text-neutral-500">Outputs</div>
                  <div className="flex min-h-8 flex-wrap gap-2">
                    {definition.outputs.length ? definition.outputs.map((signal) => <span key={signal} className={`rounded-full border px-2 py-1 text-[8px] font-black uppercase ${signalStyle[signal]}`}>{signal} out</span>) : <span className="text-[9px] text-neutral-600">No declared output ports</span>}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <footer className="relative z-10 mt-4 flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 p-3 text-[9px] text-slate-500">
        <Cable className="h-4 w-4 text-cyan-400" />
        {flow.note} {flow.unconnectedOutputCount} compatible outputs currently terminate without a downstream input.
      </footer>
    </div>
  );
};
