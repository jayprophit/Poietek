import React, { useState, useEffect } from 'react';
import { X, FolderOpen, Save, Plus, FileText, Download, Trash2, Clock, Check, Sparkles, Layers, Disc, Activity } from 'lucide-react';
import { StudioTemplate } from '../../types';

interface SavedProject {
  id: string;
  name: string;
  updatedAt: string;
  bpm: number;
  tracksCount: number;
}

interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewProject: (templateId?: string) => void;
  onSaveCurrentProject: (name: string) => void;
  onLoadProject: (projectId: string) => void;
}

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({
  isOpen,
  onClose,
  onNewProject,
  onSaveCurrentProject,
  onLoadProject,
}) => {
  const [projectName, setProjectName] = useState<string>('My Master Track');
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [activeTab, setActiveTab] = useState<'recent' | 'templates' | 'save' | 'stems'>('recent');

  // Multi-Track Export (Bouncing) State
  const [exportFormat, setExportFormat] = useState<'wav_24' | 'wav_16' | 'wav_32' | 'mp3'>('wav_24');
  const [sampleRate, setSampleRate] = useState<number>(44100);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportCompleted, setExportCompleted] = useState<boolean>(false);

  const [selectedStems, setSelectedStems] = useState<Record<string, boolean>>({
    'Master Stereo Bus': true,
    'MPC Drum Sampler': true,
    'Subtractor Poly Synth': true,
    'Thor Polysonic Synth': true,
    'RV7000 Reverb FX Send': true,
    'The Echo Tape Delay Send': true,
  });

  const handleToggleStem = (key: string) => {
    setSelectedStems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleBounceMultiTrackStems = async () => {
    setIsExporting(true);
    setExportProgress(0);
    setExportCompleted(false);

    // Simulate multi-track audio bounce rendering steps
    for (let p = 10; p <= 100; p += 15) {
      await new Promise((res) => setTimeout(res, 250));
      setExportProgress(Math.min(100, p));
    }

    setIsExporting(false);
    setExportCompleted(true);

    // Trigger synthetic stem download file
    const element = document.createElement('a');
    const activeStemNames = Object.keys(selectedStems).filter((k) => selectedStems[k]);
    const fileContent = `STUDIO MULTI-TRACK BOUNCE LOG\nProject: ${projectName}\nBPM: 120\nFormat: ${exportFormat.toUpperCase()}\nSample Rate: ${sampleRate} Hz\nExported Stems:\n${activeStemNames.map((s, i) => `${i + 1}. ${s}.wav`).join('\n')}`;
    const file = new Blob([fileContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${projectName.toLowerCase().replace(/\s+/g, '_')}_stems_bundle.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  useEffect(() => {
    if (!isOpen) return;
    try {
      const saved = localStorage.getItem('studio_saved_projects_list');
      if (saved) {
        setSavedProjects(JSON.parse(saved));
      } else {
        const defaultDemo: SavedProject[] = [
          { id: 'proj_1', name: 'Cyberpunk Synthwave Mainline', updatedAt: '2026-08-13 14:20', bpm: 120, tracksCount: 6 },
          { id: 'proj_2', name: 'Lo-Fi Tape Beats & Vocal Chops', updatedAt: '2026-08-12 18:45', bpm: 88, tracksCount: 4 },
          { id: 'proj_3', name: 'Trap Drill 808 Hit', updatedAt: '2026-08-10 11:30', bpm: 140, tracksCount: 8 },
        ];
        setSavedProjects(defaultDemo);
        localStorage.setItem('studio_saved_projects_list', JSON.stringify(defaultDemo));
      }
    } catch (e) {
      console.error(e);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (!projectName.trim()) return;
    const newProj: SavedProject = {
      id: `proj_${Date.now()}`,
      name: projectName.trim(),
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      bpm: 120,
      tracksCount: 5,
    };
    const updated = [newProj, ...savedProjects];
    setSavedProjects(updated);
    localStorage.setItem('studio_saved_projects_list', JSON.stringify(updated));
    onSaveCurrentProject(projectName);
    onClose();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedProjects.filter((p) => p.id !== id);
    setSavedProjects(updated);
    localStorage.setItem('studio_saved_projects_list', JSON.stringify(updated));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-neutral-950 border-2 border-neutral-700 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-neutral-900 via-stone-900 to-neutral-900 px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-mono font-black text-base text-white uppercase tracking-wider">
                PROJECT MANAGER & STUDIO LIBRARY
              </h2>
              <p className="text-xs text-neutral-400">Manage, open, save and create new song projects</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-neutral-800 bg-neutral-900 px-6 py-2 text-xs font-black">
          <button
            onClick={() => setActiveTab('recent')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
              activeTab === 'recent' ? 'bg-amber-500 text-neutral-950 shadow' : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>RECENT PROJECTS ({savedProjects.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
              activeTab === 'templates' ? 'bg-amber-500 text-neutral-950 shadow' : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>NEW PROJECT / TEMPLATES</span>
          </button>

          <button
            onClick={() => setActiveTab('save')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
              activeTab === 'save' ? 'bg-amber-500 text-neutral-950 shadow' : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>SAVE PROJECT</span>
          </button>

          <button
            onClick={() => setActiveTab('stems')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
              activeTab === 'stems' ? 'bg-amber-500 text-neutral-950 shadow' : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            <Download className="w-4 h-4 text-amber-300" />
            <span>MULTI-TRACK STEM EXPORT</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'recent' && (
            <div className="space-y-3">
              {savedProjects.length === 0 ? (
                <div className="p-8 text-center text-neutral-500 font-mono text-sm">
                  No saved projects found. Click "NEW PROJECT" to get started!
                </div>
              ) : (
                savedProjects.map((proj) => (
                  <div
                    key={proj.id}
                    onClick={() => {
                      onLoadProject(proj.id);
                      onClose();
                    }}
                    className="p-4 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-amber-500/60 rounded-2xl flex items-center justify-between cursor-pointer transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-neutral-800 group-hover:bg-amber-500 group-hover:text-neutral-950 text-neutral-300 transition">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white group-hover:text-amber-300">{proj.name}</h4>
                        <div className="flex items-center gap-3 text-[11px] text-neutral-400 mt-0.5 font-mono">
                          <span>Updated: {proj.updatedAt}</span>
                          <span>• {proj.bpm} BPM</span>
                          <span>• {proj.tracksCount} Tracks</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-400 group-hover:underline">OPEN</span>
                      <button
                        onClick={(e) => handleDelete(proj.id, e)}
                        className="p-2 rounded-lg bg-neutral-800 hover:bg-rose-950 text-neutral-400 hover:text-rose-400 transition"
                        title="Delete project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-4">
              <div
                onClick={() => {
                  onNewProject('blank');
                  onClose();
                }}
                className="p-4 bg-neutral-900 hover:bg-neutral-850 border-2 border-dashed border-amber-500/50 hover:border-amber-400 rounded-2xl flex items-center justify-between cursor-pointer transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-amber-500 text-neutral-950 font-black">
                    <Plus className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-white uppercase">BLANK STUDIO (EMPTY RACK)</h4>
                    <p className="text-xs text-neutral-400">Minimal setup: Hardware Interface + SSL Mixer + Song Timeline + ReGroove</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-amber-500 text-neutral-950 text-xs font-black rounded-xl">CREATE BLANK</span>
              </div>

              <div
                onClick={() => {
                  onNewProject('full_stack');
                  onClose();
                }}
                className="p-4 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-indigo-500 rounded-2xl flex items-center justify-between cursor-pointer transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/40">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">REASON PRO MASTER STUDIO TEMPLATE</h4>
                    <p className="text-xs text-neutral-400">Subtractor Synth, Thor FM, Redrum 16-step machine, RV7000 Reverb & Echo Delay</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl">LOAD TEMPLATE</span>
              </div>
            </div>
          )}

          {activeTab === 'save' && (
            <div className="space-y-4 bg-neutral-900 p-5 rounded-2xl border border-neutral-800">
              <label className="block text-xs font-bold text-neutral-300 uppercase">Project Name:</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500 font-bold"
                placeholder="Enter song title..."
              />

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-black flex items-center gap-2 shadow"
                >
                  <Save className="w-4 h-4" />
                  <span>SAVE PROJECT</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'stems' && (
            <div className="space-y-4 font-mono text-xs">
              {/* Settings Configuration Bar */}
              <div className="bg-neutral-900 p-4 rounded-2xl border border-neutral-800 space-y-3">
                <span className="text-xs font-black text-amber-400 uppercase tracking-wider block">
                  BOUNCE CONFIGURATION
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-neutral-400 block font-bold mb-1">AUDIO FORMAT:</label>
                    <select
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value as any)}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2 text-amber-300 font-bold"
                    >
                      <option value="wav_24">WAV 24-bit PCM (Studio Standard)</option>
                      <option value="wav_16">WAV 16-bit PCM (CD Quality)</option>
                      <option value="wav_32">WAV 32-bit Floating Point</option>
                      <option value="mp3">MP3 320kbps High-Bitrate</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-neutral-400 block font-bold mb-1">SAMPLE RATE:</label>
                    <select
                      value={sampleRate}
                      onChange={(e) => setSampleRate(Number(e.target.value))}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2 text-amber-300 font-bold"
                    >
                      <option value={44100}>44.1 kHz (CD Sample Rate)</option>
                      <option value={48000}>48.0 kHz (Film / Pro Audio)</option>
                      <option value={96000}>96.0 kHz (Hi-Res Audio)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Stem Tracks Checkbox List */}
              <div className="bg-neutral-900 p-4 rounded-2xl border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-neutral-800">
                  <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                    SELECT RACK TRACK STEMS TO BOUNCE
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    {Object.values(selectedStems).filter(Boolean).length} stems selected
                  </span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pt-1">
                  {Object.keys(selectedStems).map((stemName) => {
                    const isChecked = selectedStems[stemName];
                    return (
                      <div
                        key={stemName}
                        onClick={() => handleToggleStem(stemName)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                          isChecked
                            ? 'bg-neutral-950 border-amber-500/80 text-amber-300'
                            : 'bg-neutral-950/40 border-neutral-800 text-neutral-500'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="w-4 h-4 accent-amber-500"
                          />
                          <span className="font-bold">{stemName}</span>
                        </div>
                        <span className="text-[10px] text-neutral-500 uppercase">
                          {isChecked ? 'STEM ACTIVE' : 'MUTED'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bouncing Progress & Action Button */}
              {isExporting && (
                <div className="bg-neutral-900 p-4 rounded-2xl border border-amber-500/80 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                    <span>RENDERING MULTI-TRACK AUDIO STEMS...</span>
                    <span>{exportProgress}%</span>
                  </div>
                  <div className="w-full h-3 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                    <div
                      style={{ width: `${exportProgress}%` }}
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-200"
                    />
                  </div>
                </div>
              )}

              {exportCompleted && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/80 rounded-2xl text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Multi-track stem files generated successfully! Download started automatically.</span>
                </div>
              )}

              <button
                onClick={handleBounceMultiTrackStems}
                disabled={isExporting}
                className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition border ${
                  isExporting
                    ? 'bg-neutral-800 text-neutral-500 border-neutral-700 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-110 text-neutral-950 border-amber-300 shadow-2xl cursor-pointer'
                }`}
              >
                <Download className="w-4 h-4 stroke-[3]" />
                <span>
                  {isExporting ? 'BOUNCING STEMS...' : 'BOUNCE ALL SELECTED STEMS TO WAV'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
