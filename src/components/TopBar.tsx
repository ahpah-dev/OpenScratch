import React from 'react';
import {
  Play,
  Square,
  Sparkles,
  Download,
  FolderOpen,
  LayoutGrid,
  HelpCircle,
  Save,
  Gamepad2,
  Film,
  Globe,
  Layers,
  Undo2,
} from 'lucide-react';
import type { ProjectMode } from '../types/project';

interface TopBarProps {
  title: string;
  mode: ProjectMode;
  running: boolean;
  canUndo: boolean;
  aiOpen: boolean;
  aiConfigured: boolean;
  onChangeTitle: (title: string) => void;
  onChangeMode: (mode: ProjectMode) => void;
  onRun: () => void;
  onStop: () => void;
  onUndo: () => void;
  onOpenTemplates: () => void;
  onOpenExport: () => void;
  onSaveJson: () => void;
  onLoadJson: (file: File) => void;
  onOpenHelp: () => void;
  onToggleAi: () => void;
}

const MODES: { id: ProjectMode; label: string; icon: React.ReactNode }[] = [
  { id: 'unified', label: 'All', icon: <Layers className="w-3.5 h-3.5" /> },
  { id: 'game', label: 'Game', icon: <Gamepad2 className="w-3.5 h-3.5" /> },
  { id: 'animation', label: 'Animation', icon: <Film className="w-3.5 h-3.5" /> },
  { id: 'website', label: 'Website', icon: <Globe className="w-3.5 h-3.5" /> },
];

export const TopBar: React.FC<TopBarProps> = ({
  title,
  mode,
  running,
  canUndo,
  aiOpen,
  aiConfigured,
  onChangeTitle,
  onChangeMode,
  onRun,
  onStop,
  onUndo,
  onOpenTemplates,
  onOpenExport,
  onSaveJson,
  onLoadJson,
  onOpenHelp,
  onToggleAi,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <header className="h-14 shrink-0 border-b border-slate-800/90 bg-slate-900/95 px-3 flex items-center justify-between gap-2 overflow-x-auto">
      {/* Brand & Project Title */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-pink-500 to-amber-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 font-black text-white text-sm">
            OS
          </div>
          <div className="leading-tight hidden sm:block">
            <div className="font-extrabold text-sm tracking-tight text-white">OpenScratch</div>
            <div className="text-[10px] text-slate-400 font-medium">Unlicense · Natural Studio</div>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block" />

        <input
          type="text"
          value={title}
          onChange={(e) => onChangeTitle(e.target.value)}
          aria-label="Project title"
          className="bg-slate-800/70 hover:bg-slate-800 focus:bg-slate-800 border border-slate-700/70 focus:border-indigo-500 rounded-lg px-2.5 py-1 text-sm font-semibold text-slate-100 outline-none w-36 sm:w-48 transition"
        />

        {/* Mode Switcher */}
        <div className="hidden lg:flex items-center bg-slate-950/80 border border-slate-800 rounded-lg p-0.5">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onChangeMode(m.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                mode === m.id
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {m.icon}
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Center Run Controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onRun}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shadow ${
            running
              ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-300/60'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          {running ? 'Restart' : 'Play'}
        </button>
        <button
          type="button"
          onClick={onStop}
          disabled={!running}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600/90 hover:bg-rose-500 disabled:opacity-40 disabled:hover:bg-rose-600/90 text-white transition cursor-pointer"
        >
          <Square className="w-3 h-3 fill-current" />
          Stop
        </button>
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo last project edit"
          className="p-1.5 rounded-lg border border-slate-700/70 bg-slate-800/70 hover:bg-slate-800 disabled:opacity-35 text-slate-300 transition cursor-pointer"
        >
          <Undo2 className="w-4 h-4" />
        </button>
      </div>

      {/* Right Tools */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onOpenTemplates}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700/70 text-slate-200 transition cursor-pointer"
        >
          <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden md:inline">Templates</span>
        </button>

        <button
          type="button"
          onClick={onSaveJson}
          title="Save project JSON"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700/70 text-slate-200 transition cursor-pointer"
        >
          <Save className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden xl:inline">Save</span>
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Load .openscratch.json"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700/70 text-slate-200 transition cursor-pointer"
        >
          <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden xl:inline">Open</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.openscratch.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onLoadJson(f);
            e.target.value = '';
          }}
        />

        <button
          type="button"
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition cursor-pointer shadow shadow-indigo-500/20"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export HTML</span>
        </button>

        <button
          type="button"
          onClick={onToggleAi}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
            aiOpen
              ? 'bg-fuchsia-600 border-fuchsia-400 text-white shadow shadow-fuchsia-500/25'
              : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-fuchsia-300'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Spark AI</span>
          <span
            className={`w-2 h-2 rounded-full ${
              aiConfigured ? 'bg-emerald-400' : 'bg-slate-500'
            }`}
            title={aiConfigured ? 'BYOK Key ready' : 'Configure BYOK key'}
          />
        </button>

        <button
          type="button"
          onClick={onOpenHelp}
          title="OpenScript & Shortcut Guide"
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/70 text-slate-300 transition cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
