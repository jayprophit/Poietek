import React, {useMemo} from 'react';
import { ArrowRight, ArrowRightLeft, Cable, CircleAlert, Network } from 'lucide-react';
import type {RackModuleItem} from '../../types';
import {deriveAutomaticRackSignalFlow} from '../../poietek/rack';
import {getRackModuleDefinition} from './rackModuleCatalog';

interface StudioRearPanelProps {
  rackModules: RackModuleItem[];
  onToggleFlip(): void;
}

const signalStyle = {
  audio: 'border-cyan-500/60 bg-cyan-500/10 text-cyan-200',
  note: 'border-violet-500/60 bg-violet-500/10 text-violet-200',
  cv: 'border-amber-500/60 bg-amber-500/10 text-amber-200',
  gate: 'border-emerald-500/60 bg-emerald-500/10 text-emerald-200',
} as const;

const Jack = ({tone, label}: {tone: keyof typeof signalStyle; label: string}) => (
  <div className="flex items-center gap-1.5 whitespace-nowrap">
    <span className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border ${signalStyle[tone]} shadow-[inset_0_0_8px_rgba(255,255,255,0.15)]`} />
    <span className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-400">{label}</span>
  </div>
);

export const StudioRearPanel: React.FC<StudioRearPanelProps> = ({rackModules, onToggleFlip}) => {
  const flow = useMemo(
    () => deriveAutomaticRackSignalFlow(
      rackModules.map((module) => {
        const definition = getRackModuleDefinition(module.type);
        return {
          id: module.id,
          title: module.title,
          role: definition.role,
          inputs: definition.inputs,
          outputs: definition.outputs,
          groupId: module.groupId,
        };
      }),
    ),
    [rackModules],
  );

  return (
    <div className="relative min-h-[600px] overflow-hidden rounded-[14px] border border-[#3e4449] bg-[linear-gradient(180deg,#0e1113_0%,#12171b_100%)] p-4 shadow-[0_20px_35px_rgba(0,0,0,0.7)] sm:p-5">
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:18px_18px]" />

      <header className="relative z-10 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#4b5258] bg-[linear-gradient(90deg,#171b1d_0%,#1b2124_100%)] p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#f59e0b]">
            <Cable className="h-4 w-4" />
            Rear patch bay
          </div>
          <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-[#9aa3a8]">
            Logical route preview for the active module stack.
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleFlip}
          className="flex items-center gap-1 rounded border border-[#f59e0b]/70 bg-[#241c12] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#f9c76a] transition hover:border-[#fbbf24] hover:text-[#fef3c7]"
        >
          <ArrowRightLeft className="h-3.5 w-3.5" />
          Front rack
        </button>
      </header>

      <div className="relative z-10 mb-4 flex items-start gap-2 rounded-xl border border-[#d97706]/40 bg-[#261d12] p-3 text-[10px] leading-relaxed text-[#f5d293]">
        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#f59e0b]" />
        <span><strong>Patch logic:</strong> These ports show the active logical I/O map and auto-routed device relationships; no real hardware state is being claimed.</span>
      </div>

      <section className="relative z-10 mb-4 overflow-hidden rounded-xl border border-[#2d3438] bg-[#0d1215] p-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#67e8f9]">
            <Network className="h-4 w-4" />
            Automatic signal flow
          </div>
          <span className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-cyan-200">
            {flow.connections.length} links
          </span>
        </div>

        <div className="space-y-2">
          {flow.connections.length ? (
            flow.connections.map((connection) => (
              <div key={connection.id} className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-lg border border-[#2a3340] bg-[#101820] p-2">
                <span className="truncate text-[10px] font-bold text-[#dfe8ec]">{connection.sourceTitle}</span>
                <span className={`flex items-center gap-1 rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] ${signalStyle[connection.signal]}`}>
                  {connection.signal}
                  <ArrowRight className="h-3 w-3" />
                </span>
                <span className="truncate text-right text-[10px] font-bold text-[#dfe8ec]">{connection.destinationTitle}</span>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-[#3a4248] p-4 text-center text-[10px] uppercase tracking-[0.14em] text-[#7b8389]">
              No downstream connections yet
            </div>
          )}
        </div>
      </section>

      <section className="relative z-10 space-y-3" aria-label="Rear panel port map">
        {flow.modules.map((module, index) => {
          const rackModule = rackModules.find((candidate) => candidate.id === module.id);
          if (!rackModule) return null;
          const definition = getRackModuleDefinition(rackModule.type);

          return (
            <article key={module.id} className="overflow-hidden rounded-xl border border-[#323a3d] bg-[linear-gradient(90deg,#171b1d_0%,#111518_30%,#181d20_100%)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2b3135] bg-[#151a1d] px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <span className="rounded border border-[#f59e0b]/50 bg-[#2a1d12] px-2 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-[#f8d193]">{rackModule.tapeLabel}</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#e5ebee]">{module.title}</span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-[0.18em] text-[#7f8a92]">RU {String(index + 1).padStart(2, '0')} · {definition.role}</span>
              </div>

              <div className="grid gap-3 p-4 md:grid-cols-[1fr_1.1fr_1fr]">
                <div className="rounded-lg border border-[#2a2f33] bg-[#0d1115] p-3">
                  <div className="mb-2 text-[9px] font-black uppercase tracking-[0.18em] text-[#7e8790]">Inputs</div>
                  <div className="flex min-h-[52px] flex-wrap gap-2">
                    {definition.inputs.length ? (
                      definition.inputs.map((signal, index) => (
                        <div key={`${module.id}-in-${signal}-${index}`} className="contents">
                          <Jack tone={signal as keyof typeof signalStyle} label={`${signal} in`} />
                        </div>
                      ))
                    ) : (
                      <span className="text-[9px] uppercase tracking-[0.13em] text-[#58656d]">No input ports</span>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-[#2a2f33] bg-[#0d1115] p-3">
                  <div className="mb-2 text-[9px] font-black uppercase tracking-[0.18em] text-[#7e8790]">Patch section</div>
                  <div className="flex min-h-[52px] items-center justify-center rounded border border-dashed border-[#3d454b] bg-[#11181a] p-3 text-center text-[8px] font-black uppercase tracking-[0.14em] text-[#8b9198]">
                    Cable path
                  </div>
                </div>

                <div className="rounded-lg border border-[#2a2f33] bg-[#0d1115] p-3">
                  <div className="mb-2 text-[9px] font-black uppercase tracking-[0.18em] text-[#7e8790]">Outputs</div>
                  <div className="flex min-h-[52px] flex-wrap gap-2">
                    {definition.outputs.length ? (
                      definition.outputs.map((signal, index) => (
                        <div key={`${module.id}-out-${signal}-${index}`} className="contents">
                          <Jack tone={signal as keyof typeof signalStyle} label={`${signal} out`} />
                        </div>
                      ))
                    ) : (
                      <span className="text-[9px] uppercase tracking-[0.13em] text-[#58656d]">No output ports</span>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <footer className="relative z-10 mt-4 flex items-center gap-2 rounded-lg border border-[#2d3438] bg-[#0b1013] p-3 text-[9px] uppercase tracking-[0.14em] text-[#8a949b]">
        <Cable className="h-4 w-4 text-cyan-400" />
        {flow.note} {flow.unconnectedOutputCount} outputs still unpatched
      </footer>
    </div>
  );
};
