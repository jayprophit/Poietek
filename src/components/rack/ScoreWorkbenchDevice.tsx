import React from 'react';
import {BookOpenCheck, FileMusic, MonitorPlay, Printer, Settings2} from 'lucide-react';
import type {RackModuleItem} from '../../types';
import type {ScoreMode} from '../../poietek/production-workflows';

interface ScoreWorkbenchDeviceProps {
  module: RackModuleItem;
  onParametersChange(parameters: RackModuleItem['parameters']): void;
}

const modes: readonly {id: ScoreMode; label: string; icon: typeof Settings2}[] = [
  {id: 'setup', label: 'Setup', icon: Settings2},
  {id: 'write', label: 'Write', icon: FileMusic},
  {id: 'engrave', label: 'Engrave', icon: BookOpenCheck},
  {id: 'play', label: 'Play', icon: MonitorPlay},
  {id: 'print', label: 'Print', icon: Printer},
];

const staffNotes = [2, 4, 1, 3, 5, 2, 0, 4];

export const ScoreWorkbenchDevice: React.FC<ScoreWorkbenchDeviceProps> = ({
  module,
  onParametersChange,
}) => {
  const parameters = module.parameters ?? {};
  const scoreMode = String(parameters.scoreMode ?? 'write') as ScoreMode;
  const playerCount = Number(parameters.playerCount ?? 1);
  const articulationPlayback = Boolean(parameters.articulationPlayback ?? true);
  const followPicture = Boolean(parameters.followPicture ?? false);
  const update = (name: string, value: number | boolean | string) => {
    onParametersChange({...parameters, [name]: value});
  };

  return (
    <div className="overflow-hidden rounded-xl border border-indigo-400/35 bg-[#101522] text-slate-100 shadow-inner">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-300/20 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 px-3 py-2">
        <div className="flex items-center gap-2">
          <FileMusic className="h-4 w-4 text-indigo-200" />
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.15em] text-indigo-100">Serializable score foundation</div>
            <div className="text-[9px] text-slate-400">Players · flows · measures · notes · articulations · layouts</div>
          </div>
        </div>
        <span className="rounded-full border border-amber-400/45 bg-amber-400/10 px-2 py-1 text-[8px] font-black uppercase tracking-wider text-amber-200">Control model</span>
      </header>

      <nav className="grid grid-cols-5 border-b border-slate-700/80" aria-label="Score workbench modes">
        {modes.map((mode) => {
          const Icon = mode.icon;
          return (
            <button
              key={mode.id}
              type="button"
              aria-pressed={scoreMode === mode.id}
              onClick={() => update('scoreMode', mode.id)}
              className={`flex items-center justify-center gap-1 border-r border-slate-700/60 px-1 py-2 text-[8px] font-black uppercase tracking-wider transition last:border-r-0 ${scoreMode === mode.id ? 'bg-indigo-400 text-slate-950' : 'bg-slate-950/70 text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <Icon className="h-3 w-3" />{mode.label}
            </button>
          );
        })}
      </nav>

      <div className="grid gap-3 p-3 md:grid-cols-[12rem_minmax(0,1fr)]">
        <aside className="space-y-2 rounded-lg border border-slate-700 bg-slate-950/70 p-2">
          <div className="text-[9px] font-black uppercase tracking-wider text-slate-400">Ensemble setup</div>
          <div className="flex items-center justify-between rounded border border-slate-700 bg-slate-900 p-2">
            <span className="text-[9px] font-bold">Players / parts</span>
            <span className="flex items-center gap-1">
              <button type="button" onClick={() => update('playerCount', Math.max(1, playerCount - 1))} className="h-6 w-6 rounded border border-slate-600 text-xs hover:border-indigo-300">−</button>
              <strong className="min-w-6 text-center text-[10px] text-indigo-200">{playerCount}</strong>
              <button type="button" onClick={() => update('playerCount', Math.min(128, playerCount + 1))} className="h-6 w-6 rounded border border-slate-600 text-xs hover:border-indigo-300">+</button>
            </span>
          </div>
          <label className="flex items-center justify-between rounded border border-slate-700 bg-slate-900 p-2 text-[9px] font-bold">
            Interpret articulations
            <input type="checkbox" checked={articulationPlayback} onChange={(event) => update('articulationPlayback', event.target.checked)} className="h-4 w-4 accent-indigo-400" />
          </label>
          <label className="flex items-center justify-between rounded border border-slate-700 bg-slate-900 p-2 text-[9px] font-bold">
            Follow picture
            <input type="checkbox" checked={followPicture} onChange={(event) => update('followPicture', event.target.checked)} className="h-4 w-4 accent-indigo-400" />
          </label>
        </aside>

        <section className="rounded-lg border border-slate-600 bg-[#f4f0df] p-3 text-slate-950" aria-label="Score foundation preview">
          <div className="mb-2 flex items-center justify-between border-b border-slate-400/50 pb-1">
            <span className="text-[9px] font-black uppercase tracking-wider">Full score · Flow 1</span>
            <span className="text-[8px] font-bold text-slate-600">4/4 · C major · {playerCount} {playerCount === 1 ? 'part' : 'parts'}</span>
          </div>
          <div className="relative h-24 overflow-hidden border-x border-slate-400/70" aria-hidden="true">
            {[20, 34, 48, 62, 76].map((top) => <span key={top} className="absolute left-0 right-0 border-t border-slate-700" style={{top}} />)}
            <span className="absolute bottom-1 left-2 font-serif text-5xl leading-none">𝄞</span>
            {staffNotes.map((offset, index) => (
              <span key={`${offset}-${index}`} className="absolute h-2.5 w-3.5 -rotate-12 rounded-[50%] bg-slate-900" style={{left: `${22 + index * 9}%`, top: 18 + offset * 8}} />
            ))}
            {[25, 50, 75].map((left) => <span key={left} className="absolute bottom-0 top-0 border-l border-slate-500/80" style={{left: `${left}%`}} />)}
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1 text-center text-[8px] font-bold text-slate-600">
            <span>Full score layout</span><span>{playerCount} automatic parts</span><span>Playback intent linked</span>
          </div>
        </section>
      </div>

      <footer className="border-t border-amber-400/20 bg-amber-400/5 px-3 py-2 text-[8px] leading-relaxed text-amber-100/80">
        Score data can live in the canonical project extension and is covered by validation and part extraction. Engraving output, audio playback and MusicXML remain adapter-gated; this preview does not claim them.
      </footer>
    </div>
  );
};
