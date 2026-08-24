import React, {useMemo, useState} from 'react';
import type {LucideIcon} from 'lucide-react';
import {
  Activity,
  BookOpen,
  Boxes,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircuitBoard,
  Clapperboard,
  ExternalLink,
  Eye,
  EyeOff,
  FileMusic,
  FolderPlus,
  GitBranch,
  GripVertical,
  Layers3,
  Music2,
  Plus,
  RadioTower,
  Redo2,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Undo2,
  X,
  Zap,
} from 'lucide-react';
import type {ModuleType, WorkspaceType} from '../../types';
import {
  POIETEK_RACK_DRAG_TYPE,
  RACK_MODULE_CATALOG,
  isWorkspaceModuleType,
  type RackModuleCategoryId,
} from './rackModuleCatalog';

interface RackRightSidebarProps {
  isOpen: boolean;
  onToggle(): void;
  activeWorkspace: WorkspaceType;
  onSelectWorkspace(workspace: WorkspaceType): void;
  onAddModule(type: ModuleType): void;
  onToggleFlip(): void;
  isFlipped: boolean;
  openAIGrooveModal(): void;
  openTemplatesModal(): void;
  onDetachWorkspace(): void;
  autoHideBars: boolean;
  setAutoHideBars(value: boolean): void;
  onUndo(): void;
  onRedo(): void;
  canUndo: boolean;
  canRedo: boolean;
}

const sections: readonly {id: RackModuleCategoryId; label: string; description: string; icon: LucideIcon}[] = [
  {id: 'instruments', label: 'Instruments & Samplers', description: 'Sound sources and playable devices', icon: Music2},
  {id: 'sequencing', label: 'Sequencing & Editors', description: 'Arrangement, MIDI, pitch and groove', icon: Layers3},
  {id: 'effects', label: 'Mix, Effects & Buses', description: 'Effect-capable devices and signal groups', icon: SlidersHorizontal},
  {id: 'production', label: 'Post, Score & Delivery', description: 'Monitoring, notation, picture, spectral and mastering', icon: Clapperboard},
  {id: 'control', label: 'Routing & Hardware', description: 'Patch, MIDI, mapping and diagnostics', icon: CircuitBoard},
] as const;

const moduleIcons: Partial<Record<ModuleType, LucideIcon>> = {
  folder_combinator: FolderPlus,
  mixer: SlidersHorizontal,
  patchbay: CircuitBoard,
  midi_matrix: CircuitBoard,
  mapper: CircuitBoard,
  visual_editor: Boxes,
  health_latency: Activity,
  wave_sequencer: Layers3,
  composition_workbench: Sparkles,
  motion_matrix: Activity,
  session_variations: Layers3,
  fl_channel_rack: Zap,
  score_workbench: FileMusic,
  technique_matrix: GitBranch,
  picture_post: Clapperboard,
  sequence_assembly: Boxes,
  batch_delivery: Boxes,
  live_session_hub: RadioTower,
  remote_session: RadioTower,
  control_room: SlidersHorizontal,
  mastering_delivery: SlidersHorizontal,
};

export const RackRightSidebar: React.FC<RackRightSidebarProps> = ({
  isOpen,
  onToggle,
  activeWorkspace,
  onSelectWorkspace,
  onAddModule,
  onToggleFlip,
  isFlipped,
  openAIGrooveModal,
  openTemplatesModal,
  onDetachWorkspace,
  autoHideBars,
  setAutoHideBars,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) => {
  const [search, setSearch] = useState('');
  const [openSections, setOpenSections] = useState<Set<string>>(
    () => new Set(['quick', 'instruments', 'effects']),
  );
  const [draggingType, setDraggingType] = useState<ModuleType | null>(null);

  const normalizedSearch = search.trim().toLowerCase();
  const filteredModules = useMemo(
    () => RACK_MODULE_CATALOG.filter((module) => {
      if (!normalizedSearch) return true;
      return [module.label, module.description, module.type, ...module.tags]
        .some((value) => value.toLowerCase().includes(normalizedSearch));
    }),
    [normalizedSearch],
  );

  const toggleSection = (id: string) => {
    setOpenSections((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addModule = (type: ModuleType) => {
    onAddModule(type);
    if (isWorkspaceModuleType(type)) onSelectWorkspace(type);
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="poietek-rack-library-toggle absolute right-0 top-1/2 z-50 flex -translate-y-1/2 items-center gap-1 rounded-l-xl border border-r-0 border-cyan-500/50 bg-slate-950 px-1.5 py-4 text-cyan-300 shadow-2xl hover:bg-slate-900"
        aria-label="Open rack library"
        title="Open Rack Library"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="[writing-mode:vertical-rl] text-[9px] font-black uppercase tracking-[0.18em]">Rack Library</span>
      </button>
    );
  }

  return (
    <aside className="poietek-rack-library absolute inset-y-0 right-0 z-50 flex w-[min(20rem,calc(100vw-1.5rem))] shrink-0 flex-col border-l border-slate-700 bg-slate-950 font-mono text-slate-200 shadow-[-18px_0_45px_rgba(0,0,0,0.55)] xl:relative xl:inset-auto xl:z-20 xl:w-80">
      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <Boxes className="h-4 w-4 shrink-0 text-cyan-300" />
          <div className="min-w-0">
            <div className="truncate text-[11px] font-black uppercase tracking-[0.15em] text-cyan-200">Rack Library</div>
            <div className="truncate text-[9px] text-slate-500">Drag a device onto the rack</div>
          </div>
        </div>
        <button type="button" onClick={onToggle} className="rounded-lg border border-slate-700 p-1.5 text-slate-400 hover:border-cyan-500/60 hover:text-white" aria-label="Close rack library">
          <ChevronRight className="h-4 w-4" />
        </button>
      </header>

      <div className="border-b border-slate-800 p-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Find devices, effects, routing…"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-8 pr-8 text-[11px] text-slate-100 outline-none placeholder:text-slate-600 focus:border-cyan-400"
          />
          {search && <button type="button" onClick={() => setSearch('')} className="absolute right-2 top-2 rounded p-0.5 text-slate-500 hover:text-white" aria-label="Clear rack library search"><X className="h-3.5 w-3.5" /></button>}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
        <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/55">
          <button type="button" onClick={() => toggleSection('quick')} aria-expanded={openSections.has('quick')} className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-slate-800">
            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-amber-300"><Zap className="h-3.5 w-3.5" />Quick Options</span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openSections.has('quick') ? 'rotate-180' : ''}`} />
          </button>
          {openSections.has('quick') && (
            <div className="grid grid-cols-2 gap-1.5 border-t border-slate-800 p-2">
              <button type="button" onClick={onUndo} disabled={!canUndo} className="rack-sidebar-action" title="Undo rack change"><Undo2 className="h-3.5 w-3.5" />Undo</button>
              <button type="button" onClick={onRedo} disabled={!canRedo} className="rack-sidebar-action" title="Redo rack change"><Redo2 className="h-3.5 w-3.5" />Redo</button>
              <button type="button" onClick={onToggleFlip} className={`rack-sidebar-action ${isFlipped ? 'border-amber-400 text-amber-300' : ''}`}><RefreshCw className="h-3.5 w-3.5" />{isFlipped ? 'Front' : 'Rear cables'}</button>
              <button type="button" onClick={openTemplatesModal} className="rack-sidebar-action"><BookOpen className="h-3.5 w-3.5" />Templates</button>
              <button type="button" onClick={openAIGrooveModal} className="rack-sidebar-action"><Sparkles className="h-3.5 w-3.5" />AI assist</button>
              <button type="button" onClick={onDetachWorkspace} className="rack-sidebar-action"><ExternalLink className="h-3.5 w-3.5" />Detach</button>
              <button type="button" onClick={() => setAutoHideBars(!autoHideBars)} className="rack-sidebar-action col-span-2">
                {autoHideBars ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                Transport auto-hide: {autoHideBars ? 'On' : 'Off'}
              </button>
            </div>
          )}
        </section>

        {sections.map((section) => {
          const modules = filteredModules.filter((module) => module.category === section.id);
          if (normalizedSearch && modules.length === 0) return null;
          const isExpanded = normalizedSearch.length > 0 || openSections.has(section.id);
          const SectionIcon = section.icon;
          return (
            <section key={section.id} className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/55">
              <button type="button" onClick={() => toggleSection(section.id)} aria-expanded={isExpanded} className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-slate-800">
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-200"><SectionIcon className="h-3.5 w-3.5 text-cyan-300" />{section.label}</span>
                  <span className="mt-0.5 block truncate pl-5 text-[9px] text-slate-500">{section.description}</span>
                </span>
                <span className="ml-2 flex shrink-0 items-center gap-1.5 text-[9px] text-slate-500">{modules.length}<ChevronDown className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} /></span>
              </button>
              {isExpanded && (
                <div className="space-y-1 border-t border-slate-800 bg-slate-950/70 p-1.5">
                  {modules.map((module) => {
                    const Icon = moduleIcons[module.type] ?? Music2;
                    const isActive = module.type === activeWorkspace;
                    return (
                      <div
                        key={module.type}
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.effectAllowed = 'copy';
                          event.dataTransfer.setData(POIETEK_RACK_DRAG_TYPE, module.type);
                          event.dataTransfer.setData('text/plain', module.type);
                          setDraggingType(module.type);
                        }}
                        onDragEnd={() => setDraggingType(null)}
                        className={`group flex items-center gap-2 rounded-lg border p-2 transition ${draggingType === module.type ? 'border-cyan-300 bg-cyan-400/15 opacity-70' : isActive ? 'border-amber-500/55 bg-amber-500/10' : 'border-slate-800 bg-slate-900 hover:border-cyan-500/50 hover:bg-slate-800'}`}
                        title="Drag onto the rack, or use Add"
                      >
                        <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-slate-600 group-hover:text-cyan-300" />
                        <Icon className="h-4 w-4 shrink-0 text-cyan-300" />
                        <button type="button" onClick={() => addModule(module.type)} className="min-w-0 flex-1 text-left">
                          <span className="block truncate text-[10px] font-bold text-slate-200">{module.label}</span>
                          <span className="block truncate text-[9px] text-slate-500">{module.description}</span>
                        </button>
                        <button type="button" onClick={() => addModule(module.type)} className="rounded-md border border-slate-700 bg-slate-950 p-1 text-slate-400 hover:border-amber-400 hover:text-amber-300" aria-label={`Add ${module.label} to rack`} title={`Add ${module.label}`}><Plus className="h-3.5 w-3.5" /></button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}

        {filteredModules.length === 0 && <div className="rounded-xl border border-dashed border-slate-700 p-5 text-center text-[10px] text-slate-500">No rack devices match “{search}”.</div>}
      </div>

      <footer className="border-t border-slate-800 bg-slate-900 p-2 text-center text-[9px] text-slate-500">
        Drag copies a real available module into the rack
      </footer>
    </aside>
  );
};
