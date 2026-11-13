import React, { useMemo, useState } from 'react';
import { Search, Wand2, Plus, Sparkles } from 'lucide-react';
import type { BlockCategory, BlockDefinition, BlockNode, ProjectMode } from '../types/project';
import { BLOCK_DEFINITIONS, CATEGORY_META } from '../engine/blockCatalog';
import { parseNaturalSentence } from '../engine/openscript';

interface BlockPaletteProps {
  mode: ProjectMode;
  activeEntityName: string;
  onInsertBlockDef: (def: BlockDefinition) => void;
  onInsertParsedBlocks: (blocks: BlockNode[]) => void;
}

const CATEGORIES: BlockCategory[] = [
  'events',
  'motion',
  'animation',
  'control',
  'sound',
  'data',
  'web',
];

export const BlockPalette: React.FC<BlockPaletteProps> = ({
  mode,
  activeEntityName,
  onInsertBlockDef,
  onInsertParsedBlocks,
}) => {
  const [selectedCat, setSelectedCat] = useState<BlockCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const [sentence, setSentence] = useState('');

  const sentencePreview = useMemo(() => {
    if (!sentence.trim()) return [];
    return parseNaturalSentence(sentence, activeEntityName === 'Stage' ? 'this' : activeEntityName);
  }, [sentence, activeEntityName]);

  const filteredBlocks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return BLOCK_DEFINITIONS.filter((def) => {
      if (selectedCat !== 'all' && def.category !== selectedCat) return false;
      if (!q) return true;
      const labelText = def.labelParts
        .map((p) => (typeof p === 'string' ? p : `[${p.arg}]`))
        .join('')
        .toLowerCase();
      return labelText.includes(q) || def.description.toLowerCase().includes(q) || def.category.includes(q);
    }).sort((a, b) => {
      if (mode === 'unified') return 0;
      const aMatch = a.modes.includes(mode) ? 0 : 1;
      const bMatch = b.modes.includes(mode) ? 0 : 1;
      return aMatch - bMatch;
    });
  }, [selectedCat, search, mode]);

  const handleApplySentence = (e: React.FormEvent) => {
    e.preventDefault();
    if (sentencePreview.length === 0) return;
    onInsertParsedBlocks(sentencePreview);
    setSentence('');
  };

  return (
    <aside className="w-72 xl:w-80 shrink-0 border-r border-slate-800/90 bg-slate-900/75 flex flex-col min-h-0">
      {/* Smart Natural Language Sentence Bar */}
      <div className="p-3 border-b border-slate-800/80 bg-gradient-to-b from-indigo-950/40 to-slate-900/40">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
            <Wand2 className="w-3.5 h-3.5" />
            Natural English Bar
          </span>
          <span className="text-[10px] text-slate-400">Instant offline parser</span>
        </div>
        <form onSubmit={handleApplySentence} className="flex gap-1.5">
          <input
            type="text"
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            placeholder='e.g. "when space pressed jump"'
            className="flex-1 min-w-0 bg-slate-950/90 border border-slate-700/80 focus:border-indigo-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 outline-none"
          />
          <button
            type="submit"
            disabled={sentencePreview.length === 0}
            className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-35 text-white text-xs font-bold flex items-center gap-1 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </form>
        {sentence.trim() && (
          <div className="mt-2 flex flex-wrap gap-1">
            {sentencePreview.length > 0 ? (
              sentencePreview.map((blk, i) => {
                const def = BLOCK_DEFINITIONS.find((d) => d.type === blk.type);
                const meta = def ? CATEGORY_META[def.category] : CATEGORY_META.control;
                return (
                  <span
                    key={i}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${meta.bg} ${meta.border} ${meta.color}`}
                  >
                    <Sparkles className="w-2.5 h-2.5" />
                    {blk.type.replace(/_/g, ' ')}
                  </span>
                );
              })
            ) : (
              <span className="text-[10px] text-amber-300/80">
                Try: "when Hero touches Coin add 1 to score and play coin"
              </span>
            )}
          </div>
        )}
      </div>

      {/* Search + Category Pills */}
      <div className="p-2.5 border-b border-slate-800/80 space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search natural blocks..."
            className="w-full bg-slate-950/70 border border-slate-800 focus:border-slate-600 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setSelectedCat('all')}
            className={`px-2 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
              selectedCat === 'all'
                ? 'bg-slate-200 text-slate-900'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            All
          </button>
          {CATEGORIES.map((cat) => {
            const meta = CATEGORY_META[cat];
            const active = selectedCat === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCat(cat)}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
                  active
                    ? `${meta.bg} ${meta.border} text-white`
                    : 'bg-slate-800/70 border-transparent text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${meta.badge}`} />
                {meta.label.split(' ')[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Block List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {filteredBlocks.map((def) => {
          const meta = CATEGORY_META[def.category];
          const muted = mode !== 'unified' && !def.modes.includes(mode);
          return (
            <div
              key={def.type}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/x-openscratch-new-block', def.type);
                e.dataTransfer.effectAllowed = 'copy';
              }}
              onClick={() => onInsertBlockDef(def)}
              title={`${def.description} (Click or drag to workspace)`}
              className={`group rounded-xl px-3 py-2 border cursor-pointer select-none transition hover:brightness-110 active:scale-[0.99] shadow-sm ${
                meta.bg
              } ${meta.border} ${meta.color} ${def.isHat ? 'rounded-t-2xl' : ''} ${
                muted ? 'opacity-55 hover:opacity-95' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-semibold leading-relaxed flex flex-wrap items-center gap-1">
                  {def.labelParts.map((part, idx) => {
                    if (typeof part === 'string') return <span key={idx}>{part}</span>;
                    const arg = def.args.find((a) => a.name === part.arg);
                    return (
                      <span
                        key={idx}
                        className="inline-block px-1.5 py-0.2 rounded-md bg-black/25 border border-white/20 text-[11px] font-bold text-white/95"
                      >
                        {String(arg?.defaultValue ?? part.arg)}
                      </span>
                    );
                  })}
                </div>
                <Plus className="w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition" />
              </div>
              <div className="text-[10px] text-white/75 mt-1 leading-snug line-clamp-1">
                {def.description}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
