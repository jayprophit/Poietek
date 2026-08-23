import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronUp,
  Sliders,
  Plus,
  Trash2,
  Move,
  ChevronUp as ArrowUp,
  ChevronDown as ArrowDown,
  Copy,
  FolderMinus,
  Edit2,
  Check,
} from 'lucide-react';
import { RackModuleItem, ModuleType } from '../../types';
import {RACK_MODULE_CATALOG} from './rackModuleCatalog';

interface CombinatorFolderDeviceProps {
  folderModule: RackModuleItem;
  subModules: RackModuleItem[];
  onUpdateFolderParams: (folderId: string, params: Partial<RackModuleItem['macroParams']>) => void;
  onUpdateTitle: (folderId: string, newTitle: string) => void;
  onToggleFoldFolder: (folderId: string) => void;
  onRemoveFolder: (folderId: string) => void;
  onMoveFolder: (folderId: string, direction: 'up' | 'down') => void;
  onAddModuleToFolder: (folderId: string, type: ModuleType) => void;
  renderSubModuleComponent: (module: RackModuleItem) => React.ReactNode;
}

export const CombinatorFolderDevice: React.FC<CombinatorFolderDeviceProps> = ({
  folderModule,
  subModules,
  onUpdateFolderParams,
  onUpdateTitle,
  onToggleFoldFolder,
  onRemoveFolder,
  onMoveFolder,
  onAddModuleToFolder,
  renderSubModuleComponent,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [titleInput, setTitleInput] = useState<string>(folderModule.title);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState<boolean>(false);

  const params = folderModule.macroParams || {
    filterCutoff: 100,
    drive: 10,
    reverbDepth: 25,
    delayLevel: 15,
    masterVol: 85,
  };

  const handleSaveTitle = () => {
    onUpdateTitle(folderModule.id, titleInput.trim() || 'Custom Bus Folder');
    setIsEditingTitle(false);
  };

  return (
    <div className="bg-neutral-950 border-2 border-amber-500/80 rounded-2xl shadow-2xl overflow-hidden mb-4 select-none transition-all">
      {/* COMBINATOR FOLDER HEADER PANEL */}
      <div className="bg-gradient-to-r from-stone-900 via-neutral-900 to-stone-900 border-b-2 border-amber-500/60 p-3 flex flex-wrap items-center justify-between gap-2">
        {/* Left Title & Status */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onToggleFoldFolder(folderModule.id)}
            className="p-1.5 rounded bg-amber-500 text-neutral-950 hover:bg-amber-400 font-bold transition flex items-center gap-1"
          >
            {folderModule.isFolded ? <Folder className="w-4 h-4" /> : <FolderOpen className="w-4 h-4" />}
            <span className="text-[10px] uppercase">{folderModule.isFolded ? 'EXPAND' : 'COLLAPSE'}</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-black border border-amber-500/40 uppercase">
              COMBINATOR BUS
            </span>

            {isEditingTitle ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  className="bg-neutral-900 border border-amber-500 text-amber-400 font-black text-sm px-2 py-0.5 rounded outline-none w-48"
                  autoFocus
                />
                <button
                  onClick={handleSaveTitle}
                  className="p-1 rounded bg-amber-500 text-neutral-950 hover:bg-amber-400"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 group cursor-pointer" onClick={() => setIsEditingTitle(true)}>
                <h3 className="text-sm font-black text-amber-400 tracking-wider uppercase">
                  {folderModule.title}
                </h3>
                <Edit2 className="w-3 h-3 text-neutral-500 opacity-0 group-hover:opacity-100 transition" />
              </div>
            )}
          </div>

          <span className="text-xs text-neutral-400 font-bold">
            ({subModules.length} {subModules.length === 1 ? 'Module' : 'Modules'} Grouped)
          </span>
        </div>

        {/* Right Reorder & Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
            <button
              onClick={() => onMoveFolder(folderModule.id, 'up')}
              className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
              title="Move Folder Up"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onMoveFolder(folderModule.id, 'down')}
              className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
              title="Move Folder Down"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => onRemoveFolder(folderModule.id)}
            className="p-1.5 rounded bg-neutral-800 hover:bg-rose-900/60 text-neutral-400 hover:text-rose-300 border border-neutral-700 transition"
            title="Dissolve Combinator Bus Folder"
          >
            <FolderMinus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MACRO CONTROLS BAR */}
      <div className="bg-neutral-900/90 border-b border-neutral-800 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5" />
            BUS MACRO CONTROLS & MASTER ROUTING
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* Macro 1: Cutoff */}
          <div className="bg-neutral-950 p-2 rounded-xl border border-neutral-800 flex flex-col items-center">
            <span className="text-[9px] font-bold text-neutral-400 mb-1">FILTER CUTOFF</span>
            <input
              type="range"
              min="0"
              max="100"
              value={params.filterCutoff}
              onChange={(e) =>
                onUpdateFolderParams(folderModule.id, { filterCutoff: Number(e.target.value) })
              }
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
            />
            <span className="text-[10px] font-mono text-amber-400 font-bold mt-1">{params.filterCutoff}%</span>
          </div>

          {/* Macro 2: Drive */}
          <div className="bg-neutral-950 p-2 rounded-xl border border-neutral-800 flex flex-col items-center">
            <span className="text-[9px] font-bold text-neutral-400 mb-1">ANALOG DRIVE</span>
            <input
              type="range"
              min="0"
              max="100"
              value={params.drive}
              onChange={(e) =>
                onUpdateFolderParams(folderModule.id, { drive: Number(e.target.value) })
              }
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
            />
            <span className="text-[10px] font-mono text-amber-400 font-bold mt-1">{params.drive}%</span>
          </div>

          {/* Macro 3: Reverb */}
          <div className="bg-neutral-950 p-2 rounded-xl border border-neutral-800 flex flex-col items-center">
            <span className="text-[9px] font-bold text-neutral-400 mb-1">REVERB BUS</span>
            <input
              type="range"
              min="0"
              max="100"
              value={params.reverbDepth}
              onChange={(e) =>
                onUpdateFolderParams(folderModule.id, { reverbDepth: Number(e.target.value) })
              }
              className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
            />
            <span className="text-[10px] font-mono text-indigo-400 font-bold mt-1">{params.reverbDepth}%</span>
          </div>

          {/* Macro 4: Delay */}
          <div className="bg-neutral-950 p-2 rounded-xl border border-neutral-800 flex flex-col items-center">
            <span className="text-[9px] font-bold text-neutral-400 mb-1">DELAY ECHO</span>
            <input
              type="range"
              min="0"
              max="100"
              value={params.delayLevel}
              onChange={(e) =>
                onUpdateFolderParams(folderModule.id, { delayLevel: Number(e.target.value) })
              }
              className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
            />
            <span className="text-[10px] font-mono text-indigo-400 font-bold mt-1">{params.delayLevel}%</span>
          </div>

          {/* Macro 5: Bus Volume */}
          <div className="bg-neutral-950 p-2 rounded-xl border border-neutral-800 flex flex-col items-center col-span-2 sm:col-span-1">
            <span className="text-[9px] font-bold text-neutral-400 mb-1">BUS MASTER VOL</span>
            <input
              type="range"
              min="0"
              max="100"
              value={params.masterVol}
              onChange={(e) =>
                onUpdateFolderParams(folderModule.id, { masterVol: Number(e.target.value) })
              }
              className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
            />
            <span className="text-[10px] font-mono text-emerald-400 font-bold mt-1">{params.masterVol}%</span>
          </div>
        </div>
      </div>

      {/* SUB-MODULE CONTAINER FRAME */}
      {!folderModule.isFolded && (
        <div className="p-3 bg-stone-900/60 space-y-3 border-l-4 border-amber-500/80 ml-2 my-2 rounded-r-xl">
          {subModules.length === 0 ? (
            <div className="p-6 text-center border-2 border-dashed border-neutral-800 rounded-xl text-neutral-500 text-xs">
              <p className="font-bold">This Combinator Bus Folder is currently empty.</p>
              <p className="text-[10px] mt-1">Add modules below to group their audio & FX processing together.</p>
            </div>
          ) : (
            subModules.map((subMod) => (
              <div key={subMod.id} className="relative">
                {renderSubModuleComponent(subMod)}
              </div>
            ))
          )}

          {/* Add Module into Folder */}
          <div className="relative pt-1">
            <button
              onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
              className="w-full py-2 px-3 rounded-xl bg-neutral-900 hover:bg-amber-500 hover:text-neutral-950 border border-neutral-800 font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>ADD MODULE TO THIS BUS FOLDER</span>
            </button>

            {isAddMenuOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-neutral-950 border-2 border-neutral-700 rounded-xl shadow-2xl p-2 z-50 grid grid-cols-2 gap-1.5">
                {RACK_MODULE_CATALOG.filter((item) => item.type !== 'folder_combinator').map((item) => (
                  <button
                    key={item.type}
                    onClick={() => {
                      onAddModuleToFolder(folderModule.id, item.type);
                      setIsAddMenuOpen(false);
                    }}
                    className="p-2 rounded-lg bg-neutral-900 hover:bg-amber-500 hover:text-neutral-950 text-left font-bold text-xs transition"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
