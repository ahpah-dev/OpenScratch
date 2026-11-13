import React, { useMemo, useState } from 'react';
import { X, Download, Copy, Check, FileCode, Gamepad2, Film, Globe, Layers, BookOpen } from 'lucide-react';
import type { OpenScratchProject } from '../types/project';
import { PROJECT_TEMPLATES, type ProjectTemplate } from '../data/templates';
import { exportProjectToHtml } from '../engine/exporter';

interface TemplatesModalProps {
  onSelect: (template: ProjectTemplate) => void;
  onClose: () => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({ onSelect, onClose }) => {
  const iconFor = (cat: ProjectTemplate['category']) => {
    if (cat === 'game') return <Gamepad2 className="w-5 h-5 text-sky-400" />;
    if (cat === 'animation') return <Film className="w-5 h-5 text-purple-400" />;
    if (cat === 'website') return <Globe className="w-5 h-5 text-emerald-400" />;
    return <Layers className="w-5 h-5 text-indigo-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-white">Starter Templates</h2>
            <p className="text-xs text-slate-400">Jump right into a playable game, animation, or interactive website.</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto">
          {PROJECT_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onSelect(tpl)}
              className="text-left p-4 rounded-xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/60 transition cursor-pointer flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                {iconFor(tpl.category)}
                <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300">
                  {tpl.badge}
                </span>
              </div>
              <div className="font-bold text-sm text-white">{tpl.name}</div>
              <p className="text-xs text-slate-400 leading-relaxed">{tpl.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

interface ExportModalProps {
  project: OpenScratchProject;
  onDownloadJson: () => void;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ project, onDownloadJson, onClose }) => {
  const [copied, setCopied] = useState(false);
  const htmlOutput = useMemo(() => exportProjectToHtml(project), [project]);
  const safeName = (project.title || 'openscratch-project').toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const handleDownloadHtml = () => {
    const blob = new Blob([htmlOutput], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeName}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyHtml = async () => {
    await navigator.clipboard.writeText(htmlOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-base font-extrabold text-white">Export Standalone Project</h2>
              <p className="text-xs text-slate-400">Zero dependencies · Runs offline in any browser · Public Domain (Unlicense)</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3 text-xs">
          <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-2">
            <div className="font-bold text-sm text-white">1-File Interactive HTML Bundle</div>
            <p className="text-slate-300 leading-relaxed">
              Packages your entire game, animation, or website together with the OpenScratch runtime engine into a single <code>.html</code> file ({Math.round(htmlOutput.length / 1024)} KB). Share it anywhere or host it directly!
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={handleDownloadHtml}
                className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Download {safeName}.html
              </button>
              <button
                type="button"
                onClick={handleCopyHtml}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied HTML!' : 'Copy HTML'}
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3">
            <div>
              <div className="font-bold text-slate-200">Project Source File (.openscratch.json)</div>
              <div className="text-slate-400 text-[11px]">Save an editable project file to reopen later in OpenScratch.</div>
            </div>
            <button
              type="button"
              onClick={onDownloadJson}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-semibold shrink-0 cursor-pointer"
            >
              Save JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const HelpModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
    <div
      className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-extrabold text-white">OpenScratch Quick Guide</h2>
        </div>
        <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 space-y-3 text-xs text-slate-300 leading-relaxed max-h-[70vh] overflow-y-auto">
        <div>
          <h3 className="font-bold text-white text-sm mb-1">1. Easier & More Natural Than Scratch</h3>
          <p>
            No boilerplate <code>forever → if touching</code> loops needed for common tasks! Use smart hat blocks like{' '}
            <code>when "Hero" touches "Coin"</code>, <code>when "space" key is held</code>, <code>whenever (score &gt;= 10)</code>,
            or <code>give "this" platformer physics</code>.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-white text-sm mb-1">2. Natural English Bar (Works Offline)</h3>
          <p>Type casual English phrases in the top-left bar and press Enter:</p>
          <ul className="list-disc pl-5 mt-1 space-y-0.5 text-slate-400">
            <li><code>when space pressed jump</code></li>
            <li><code>when Hero touches Coin add 1 to score and play coin</code></li>
            <li><code>glide Hero to 120 40 in 1 sec</code></li>
            <li><code>add button Play Now</code></li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold text-white text-sm mb-1">3. Dynamic Text & Expressions</h3>
          <p>
            Put <code>{'{score}'}</code>, <code>{'{playerName}'}</code>, or <code>{'{Hero.x}'}</code> inside speech bubbles,
            website headings, buttons, or alerts! In condition or number fields, use expressions like{' '}
            <code>score &gt;= 10 and lives &gt; 0</code>, <code>random(-200, 200)</code>, or <code>Hero touches GoalStar</code>.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-white text-sm mb-1">4. Dedicated to the Public Domain (The Unlicense)</h3>
          <p>
            OpenScratch and exported standalone HTML bundles carry zero proprietary lock-in — create, remix, sell, or host anything freely.
          </p>
        </div>
      </div>
    </div>
  </div>
);
