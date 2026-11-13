import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Blocks,
  Code2,
  Columns2,
  Copy,
  Plus,
  Power,
  Trash2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import type {
  ArgSchema,
  ArgValue,
  BlockNode,
  Entity,
  OpenScratchProject,
  ScriptStack,
} from '../types/project';
import {
  CATEGORY_META,
  cloneBlockNode,
  createBlockNode,
  getBlockDefinition,
  makeId,
} from '../engine/blockCatalog';
import { parseOpenScript, scriptsToOpenScript } from '../engine/openscript';

export interface InsertionTarget {
  scriptId: string;
  parentBlockId?: string;
  branch: 'body' | 'elseBody';
}

interface ScriptWorkspaceProps {
  project: OpenScratchProject;
  selectedTargetId: string;
  insertionTarget: InsertionTarget | null;
  onSelectInsertionTarget: (target: InsertionTarget | null) => void;
  onChangeScripts: (scripts: ScriptStack[]) => void;
}

type ViewTab = 'blocks' | 'split' | 'script';

// Recursive AST helpers
function updateBlockInList(
  list: BlockNode[],
  blockId: string,
  updater: (b: BlockNode) => BlockNode
): BlockNode[] {
  return list.map((b) => {
    const next = b.id === blockId ? updater(b) : b;
    return {
      ...next,
      body: next.body ? updateBlockInList(next.body, blockId, updater) : undefined,
      elseBody: next.elseBody ? updateBlockInList(next.elseBody, blockId, updater) : undefined,
    };
  });
}

function removeBlockFromList(list: BlockNode[], blockId: string): { list: BlockNode[]; removed: BlockNode | null } {
  let removed: BlockNode | null = null;
  const out: BlockNode[] = [];
  for (const b of list) {
    if (b.id === blockId) {
      removed = b;
      continue;
    }
    let next = b;
    if (b.body) {
      const res = removeBlockFromList(b.body, blockId);
      if (res.removed) removed = res.removed;
      next = { ...next, body: res.list };
    }
    if (b.elseBody) {
      const res = removeBlockFromList(b.elseBody, blockId);
      if (res.removed) removed = res.removed;
      next = { ...next, elseBody: res.list };
    }
    out.push(next);
  }
  return { list: out, removed };
}

function insertBlockIntoContainer(
  list: BlockNode[],
  parentBlockId: string | undefined,
  branch: 'body' | 'elseBody',
  newBlock: BlockNode,
  beforeBlockId?: string
): BlockNode[] {
  if (!parentBlockId) {
    if (beforeBlockId) {
      const idx = list.findIndex((b) => b.id === beforeBlockId);
      if (idx >= 0) {
        const copy = [...list];
        copy.splice(idx, 0, newBlock);
        return copy;
      }
    }
    return [...list, newBlock];
  }

  return list.map((b) => {
    if (b.id === parentBlockId) {
      const arr = [...((branch === 'elseBody' ? b.elseBody : b.body) ?? [])];
      if (beforeBlockId) {
        const idx = arr.findIndex((item) => item.id === beforeBlockId);
        if (idx >= 0) arr.splice(idx, 0, newBlock);
        else arr.push(newBlock);
      } else {
        arr.push(newBlock);
      }
      return branch === 'elseBody' ? { ...b, elseBody: arr } : { ...b, body: arr };
    }
    return {
      ...b,
      body: b.body ? insertBlockIntoContainer(b.body, parentBlockId, branch, newBlock, beforeBlockId) : undefined,
      elseBody: b.elseBody
        ? insertBlockIntoContainer(b.elseBody, parentBlockId, branch, newBlock, beforeBlockId)
        : undefined,
    };
  });
}

function moveSiblingInList(list: BlockNode[], blockId: string, dir: -1 | 1): BlockNode[] {
  const idx = list.findIndex((b) => b.id === blockId);
  if (idx >= 0) {
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= list.length) return list;
    const copy = [...list];
    const [item] = copy.splice(idx, 1);
    copy.splice(nextIdx, 0, item);
    return copy;
  }
  return list.map((b) => ({
    ...b,
    body: b.body ? moveSiblingInList(b.body, blockId, dir) : undefined,
    elseBody: b.elseBody ? moveSiblingInList(b.elseBody, blockId, dir) : undefined,
  }));
}

function duplicateInList(list: BlockNode[], blockId: string): BlockNode[] {
  const idx = list.findIndex((b) => b.id === blockId);
  if (idx >= 0) {
    const copy = [...list];
    copy.splice(idx + 1, 0, cloneBlockNode(copy[idx]));
    return copy;
  }
  return list.map((b) => ({
    ...b,
    body: b.body ? duplicateInList(b.body, blockId) : undefined,
    elseBody: b.elseBody ? duplicateInList(b.elseBody, blockId) : undefined,
  }));
}

interface ArgInputProps {
  schema: ArgSchema;
  value: ArgValue;
  entities: Entity[];
  scenes: { id: string; name: string }[];
  variables: string[];
  lists: string[];
  onChange: (val: ArgValue) => void;
}

const ArgInput: React.FC<ArgInputProps> = ({
  schema,
  value,
  entities,
  scenes,
  variables,
  lists,
  onChange,
}) => {
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  if (schema.type === 'select' || schema.type === 'key' || schema.type === 'sound' || schema.type === 'ease' || schema.type === 'note' || schema.type === 'instrument') {
    const opts = schema.options || [];
    const cur = String(value ?? schema.defaultValue);
    const hasCur = opts.includes(cur);
    return (
      <select
        value={cur}
        onClick={stop}
        onChange={(e) => onChange(e.target.value)}
        className="bg-black/35 hover:bg-black/50 border border-white/25 rounded-md px-1.5 py-0.5 text-xs font-bold text-white outline-none cursor-pointer"
      >
        {!hasCur && <option value={cur}>{cur}</option>}
        {opts.map((o) => (
          <option key={o} value={o} className="bg-slate-900 text-slate-100">
            {o}
          </option>
        ))}
      </select>
    );
  }

  if (schema.type === 'entity' || schema.type === 'entityOrMouse') {
    const cur = String(value ?? schema.defaultValue);
    const baseOpts =
      schema.type === 'entityOrMouse'
        ? ['mouse', 'random spot', ...entities.map((e) => e.name)]
        : ['this', 'none', ...entities.map((e) => e.name)];
    const uniqueOpts = Array.from(new Set(baseOpts));
    if (!uniqueOpts.includes(cur)) uniqueOpts.unshift(cur);
    return (
      <select
        value={cur}
        onClick={stop}
        onChange={(e) => onChange(e.target.value)}
        className="bg-black/35 hover:bg-black/50 border border-white/25 rounded-md px-1.5 py-0.5 text-xs font-bold text-white outline-none cursor-pointer"
      >
        {uniqueOpts.map((o) => (
          <option key={o} value={o} className="bg-slate-900 text-slate-100">
            {o}
          </option>
        ))}
      </select>
    );
  }

  if (schema.type === 'scene') {
    const cur = String(value ?? schema.defaultValue);
    const sceneNames = Array.from(new Set([cur, ...scenes.map((s) => s.name)]));
    return (
      <select
        value={cur}
        onClick={stop}
        onChange={(e) => onChange(e.target.value)}
        className="bg-black/35 hover:bg-black/50 border border-white/25 rounded-md px-1.5 py-0.5 text-xs font-bold text-white outline-none cursor-pointer"
      >
        {sceneNames.map((n) => (
          <option key={n} value={n} className="bg-slate-900 text-slate-100">
            {n}
          </option>
        ))}
      </select>
    );
  }

  if (schema.type === 'color') {
    return (
      <input
        type="color"
        value={String(value || '#38bdf8')}
        onClick={stop}
        onChange={(e) => onChange(e.target.value)}
        className="w-6 h-5 rounded border border-white/30 bg-transparent cursor-pointer p-0"
      />
    );
  }

  if (schema.type === 'number') {
    return (
      <input
        type="number"
        step="any"
        value={Number.isFinite(Number(value)) ? Number(value) : 0}
        onClick={stop}
        onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
        className="w-16 bg-black/35 focus:bg-black/55 border border-white/25 rounded-md px-1.5 py-0.5 text-xs font-bold text-white text-center outline-none"
      />
    );
  }

  const listId =
    schema.type === 'variable'
      ? 'os-vars-datalist'
      : schema.type === 'list'
      ? 'os-lists-datalist'
      : undefined;

  const strVal = String(value ?? '');
  const widthClass =
    schema.type === 'condition'
      ? 'min-w-[120px] max-w-[240px]'
      : schema.type === 'text'
      ? 'min-w-[75px] max-w-[210px]'
      : 'min-w-[70px] max-w-[150px]';

  void variables;
  void lists;

  return (
    <input
      type="text"
      list={listId}
      value={strVal}
      size={Math.max(6, Math.min(28, strVal.length + 1))}
      onClick={stop}
      onChange={(e) => onChange(e.target.value)}
      placeholder={schema.placeholder || schema.name}
      className={`${widthClass} bg-black/35 focus:bg-black/55 border border-white/25 rounded-md px-2 py-0.5 text-xs font-bold text-white placeholder:text-white/50 outline-none`}
    />
  );
};

export const ScriptWorkspace: React.FC<ScriptWorkspaceProps> = ({
  project,
  selectedTargetId,
  insertionTarget,
  onSelectInsertionTarget,
  onChangeScripts,
}) => {
  const [viewTab, setViewTab] = useState<ViewTab>('blocks');
  const [scriptScope, setScriptScope] = useState<'target' | 'all'>('target');
  const [draftCode, setDraftCode] = useState('');
  const [codeDirty, setCodeDirty] = useState(false);
  const [expandedElseIds, setExpandedElseIds] = useState<Set<string>>(() => new Set());

  const targetEntity = project.entities.find((e) => e.id === selectedTargetId);
  const targetLabel = selectedTargetId === 'stage' ? 'Stage / Global' : targetEntity?.name || 'Entity';

  const visibleScripts = useMemo(
    () => project.scripts.filter((s) => s.targetId === selectedTargetId),
    [project.scripts, selectedTargetId]
  );

  const syncedOpenScript = useMemo(() => {
    const list = scriptScope === 'all' ? project.scripts : visibleScripts;
    return scriptsToOpenScript(list, project.entities, scriptScope === 'all');
  }, [project.scripts, visibleScripts, project.entities, scriptScope]);

  useEffect(() => {
    if (!codeDirty) {
      setDraftCode(syncedOpenScript);
    }
  }, [syncedOpenScript, codeDirty]);

  const parsePreview = useMemo(() => {
    return parseOpenScript(draftCode, selectedTargetId, project.entities);
  }, [draftCode, selectedTargetId, project.entities]);

  const varNames = Object.keys(project.variables);
  const listNames = Object.keys(project.lists);

  const applyDraftScript = () => {
    const parsed = parseOpenScript(draftCode, selectedTargetId, project.entities);
    if (parsed.errors.length > 0 && parsed.scripts.length === 0) return;

    if (scriptScope === 'all') {
      onChangeScripts(parsed.scripts);
    } else {
      const otherScripts = project.scripts.filter((s) => s.targetId !== selectedTargetId);
      onChangeScripts([...otherScripts, ...parsed.scripts]);
    }
    setCodeDirty(false);
  };

  const handleDropOnWorkspace = (
    e: React.DragEvent,
    targetScriptId?: string,
    parentBlockId?: string,
    branch: 'body' | 'elseBody' = 'body',
    beforeBlockId?: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const newType = e.dataTransfer.getData('application/x-openscratch-new-block');
    const moveRaw = e.dataTransfer.getData('application/x-openscratch-move-block');

    if (newType) {
      const def = getBlockDefinition(newType);
      if (!def) return;
      const node = createBlockNode(newType);

      if (def.isHat) {
        const newScript: ScriptStack = {
          id: makeId('scr'),
          targetId: selectedTargetId,
          enabled: true,
          hat: node,
          body: [],
        };
        onChangeScripts([...project.scripts, newScript]);
        onSelectInsertionTarget({ scriptId: newScript.id, branch: 'body' });
        return;
      }

      const sid = targetScriptId || visibleScripts[visibleScripts.length - 1]?.id;
      if (!sid) {
        const newScript: ScriptStack = {
          id: makeId('scr'),
          targetId: selectedTargetId,
          enabled: true,
          hat: createBlockNode('when_start'),
          body: [node],
        };
        onChangeScripts([...project.scripts, newScript]);
        onSelectInsertionTarget({ scriptId: newScript.id, branch: 'body' });
        return;
      }

      onChangeScripts(
        project.scripts.map((s) =>
          s.id === sid
            ? { ...s, body: insertBlockIntoContainer(s.body, parentBlockId, branch, node, beforeBlockId) }
            : s
        )
      );
      return;
    }

    if (moveRaw) {
      try {
        const { scriptId: srcScriptId, blockId } = JSON.parse(moveRaw) as {
          scriptId: string;
          blockId: string;
        };
        if (blockId === parentBlockId || blockId === beforeBlockId) return;

        let movedNode: BlockNode | null = null;
        let nextScripts = project.scripts.map((s) => {
          if (s.id !== srcScriptId) return s;
          const res = removeBlockFromList(s.body, blockId);
          if (res.removed) movedNode = res.removed;
          return { ...s, body: res.list };
        });

        if (!movedNode) return;
        const destSid = targetScriptId || srcScriptId;
        nextScripts = nextScripts.map((s) =>
          s.id === destSid
            ? { ...s, body: insertBlockIntoContainer(s.body, parentBlockId, branch, movedNode!, beforeBlockId) }
            : s
        );
        onChangeScripts(nextScripts);
      } catch {
        // ignore invalid drag payload
      }
    }
  };

  const renderBlockNode = (script: ScriptStack, block: BlockNode, isHat = false): React.ReactNode => {
    const def = getBlockDefinition(block.type);
    const meta = def ? CATEGORY_META[def.category] : CATEGORY_META.control;

    const handleArgChange = (argName: string, val: ArgValue) => {
      onChangeScripts(
        project.scripts.map((s) => {
          if (s.id !== script.id) return s;
          if (isHat) {
            return { ...s, hat: { ...s.hat, args: { ...s.hat.args, [argName]: val } } };
          }
          return {
            ...s,
            body: updateBlockInList(s.body, block.id, (b) => ({
              ...b,
              args: { ...b.args, [argName]: val },
            })),
          };
        })
      );
    };

    const isBodyTarget =
      insertionTarget?.scriptId === script.id &&
      insertionTarget?.parentBlockId === block.id &&
      insertionTarget?.branch === 'body';

    const isElseTarget =
      insertionTarget?.scriptId === script.id &&
      insertionTarget?.parentBlockId === block.id &&
      insertionTarget?.branch === 'elseBody';

    const showElse = Boolean(def?.hasElse && block.elseBody && block.elseBody.length > 0);
    const elseExpanded = expandedElseIds.has(block.id);
    const hasElseActive = showElse || elseExpanded;
    const setElseExpanded = (open: boolean) => {
      setExpandedElseIds((prev) => {
        const next = new Set(prev);
        if (open) next.add(block.id);
        else next.delete(block.id);
        return next;
      });
    };

    return (
      <div
        key={block.id}
        draggable={!isHat}
        onDragStart={(e) => {
          if (isHat) return;
          e.stopPropagation();
          e.dataTransfer.setData(
            'application/x-openscratch-move-block',
            JSON.stringify({ scriptId: script.id, blockId: block.id })
          );
          e.dataTransfer.effectAllowed = 'move';
        }}
        onDragOver={(e) => {
          if (isHat) return;
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          if (isHat) return;
          handleDropOnWorkspace(e, script.id, undefined, 'body', block.id);
        }}
        className={`group/blk relative rounded-xl border shadow-sm transition ${meta.bg} ${meta.border} ${meta.color} ${
          isHat ? 'rounded-t-2xl' : ''
        }`}
      >
        {/* Main Block Row */}
        <div className="px-3 py-2 flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold leading-relaxed">
            {def ? (
              def.labelParts.map((part, idx) => {
                if (typeof part === 'string') return <span key={idx}>{part}</span>;
                const schema = def.args.find((a) => a.name === part.arg);
                if (!schema) return null;
                return (
                  <ArgInput
                    key={part.arg}
                    schema={schema}
                    value={block.args[part.arg] ?? schema.defaultValue}
                    entities={project.entities}
                    scenes={project.scenes}
                    variables={varNames}
                    lists={listNames}
                    onChange={(v) => handleArgChange(part.arg, v)}
                  />
                );
              })
            ) : (
              <span>{block.type}</span>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-0.5 shrink-0 opacity-75 group-hover/blk:opacity-100 transition">
            {isHat ? (
              <>
                <button
                  type="button"
                  title={script.enabled ? 'Disable script' : 'Enable script'}
                  onClick={() =>
                    onChangeScripts(
                      project.scripts.map((s) => (s.id === script.id ? { ...s, enabled: !s.enabled } : s))
                    )
                  }
                  className="p-1 rounded hover:bg-black/25 cursor-pointer"
                >
                  <Power className={`w-3.5 h-3.5 ${script.enabled ? 'text-emerald-200' : 'text-rose-200'}`} />
                </button>
                <button
                  type="button"
                  title="Delete script"
                  onClick={() => onChangeScripts(project.scripts.filter((s) => s.id !== script.id))}
                  className="p-1 rounded hover:bg-black/25 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <>
                {def?.hasElse && !hasElseActive && (
                  <button
                    type="button"
                    onClick={() => setElseExpanded(true)}
                    className="px-1.5 py-0.5 rounded bg-black/25 hover:bg-black/40 text-[10px] font-bold mr-1 cursor-pointer"
                  >
                    + otherwise
                  </button>
                )}
                <button
                  type="button"
                  title="Move up"
                  onClick={() =>
                    onChangeScripts(
                      project.scripts.map((s) =>
                        s.id === script.id ? { ...s, body: moveSiblingInList(s.body, block.id, -1) } : s
                      )
                    )
                  }
                  className="p-1 rounded hover:bg-black/25 cursor-pointer"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  title="Move down"
                  onClick={() =>
                    onChangeScripts(
                      project.scripts.map((s) =>
                        s.id === script.id ? { ...s, body: moveSiblingInList(s.body, block.id, 1) } : s
                      )
                    )
                  }
                  className="p-1 rounded hover:bg-black/25 cursor-pointer"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  title="Duplicate block"
                  onClick={() =>
                    onChangeScripts(
                      project.scripts.map((s) =>
                        s.id === script.id ? { ...s, body: duplicateInList(s.body, block.id) } : s
                      )
                    )
                  }
                  className="p-1 rounded hover:bg-black/25 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  title="Remove block"
                  onClick={() =>
                    onChangeScripts(
                      project.scripts.map((s) =>
                        s.id === script.id ? { ...s, body: removeBlockFromList(s.body, block.id).list } : s
                      )
                    )
                  }
                  className="p-1 rounded hover:bg-black/25 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* C-Block Body */}
        {def?.isCBlock && (
          <div className="pl-4 pr-2 pb-2 space-y-1.5">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => handleDropOnWorkspace(e, script.id, block.id, 'body')}
              onClick={(e) => {
                e.stopPropagation();
                onSelectInsertionTarget({ scriptId: script.id, parentBlockId: block.id, branch: 'body' });
              }}
              className={`rounded-lg bg-slate-950/65 p-2 space-y-1.5 border transition cursor-pointer ${
                isBodyTarget ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-white/15 hover:border-white/30'
              }`}
            >
              {(block.body || []).length === 0 ? (
                <div className="text-[11px] text-slate-400 italic py-1 px-1 flex items-center gap-1">
                  <Plus className="w-3 h-3" />
                  Click here then pick a block, or drag blocks inside
                </div>
              ) : (
                (block.body || []).map((child) => renderBlockNode(script, child, false))
              )}
            </div>

            {hasElseActive && (
              <>
                <div className="text-[11px] font-bold px-1 flex items-center justify-between">
                  <span>otherwise:</span>
                  {(block.elseBody || []).length === 0 && (
                    <button
                      type="button"
                      onClick={() => setElseExpanded(false)}
                      className="text-[10px] opacity-75 hover:opacity-100 cursor-pointer"
                    >
                      hide
                    </button>
                  )}
                </div>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => handleDropOnWorkspace(e, script.id, block.id, 'elseBody')}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectInsertionTarget({ scriptId: script.id, parentBlockId: block.id, branch: 'elseBody' });
                  }}
                  className={`rounded-lg bg-slate-950/65 p-2 space-y-1.5 border transition cursor-pointer ${
                    isElseTarget ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-white/15 hover:border-white/30'
                  }`}
                >
                  {(block.elseBody || []).length === 0 ? (
                    <div className="text-[11px] text-slate-400 italic py-1 px-1 flex items-center gap-1">
                      <Plus className="w-3 h-3" />
                      Drop or click to add "otherwise" blocks
                    </div>
                  ) : (
                    (block.elseBody || []).map((child) => renderBlockNode(script, child, false))
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="flex-1 min-w-[320px] flex flex-col bg-slate-950/60 min-h-0 overflow-hidden">
      {/* Workspace Header */}
      <div className="h-11 px-3 border-b border-slate-800/90 bg-slate-900/60 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-slate-400">Editing:</span>
          <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-400/40 text-indigo-200 text-xs font-bold truncate">
            {targetLabel}
          </span>
          <button
            type="button"
            onClick={() => {
              const newScript: ScriptStack = {
                id: makeId('scr'),
                targetId: selectedTargetId,
                enabled: true,
                hat: createBlockNode('when_start'),
                body: [],
              };
              onChangeScripts([...project.scripts, newScript]);
              onSelectInsertionTarget({ scriptId: newScript.id, branch: 'body' });
            }}
            className="px-2 py-1 rounded-md bg-amber-600/80 hover:bg-amber-500 text-white text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            New Script
          </button>
        </div>

        {/* Blocks / Split / Natural Script Toggle */}
        <div className="flex items-center bg-slate-950/90 border border-slate-800 rounded-lg p-0.5 shrink-0">
          <button
            type="button"
            onClick={() => setViewTab('blocks')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
              viewTab === 'blocks' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Blocks className="w-3.5 h-3.5" />
            Blocks
          </button>
          <button
            type="button"
            onClick={() => setViewTab('split')}
            className={`hidden md:flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
              viewTab === 'split' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Columns2 className="w-3.5 h-3.5" />
            Split
          </button>
          <button
            type="button"
            onClick={() => setViewTab('script')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
              viewTab === 'script' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Natural Script
          </button>
        </div>
      </div>

      {/* Datalists for inline variable / list autocomplete */}
      <datalist id="os-vars-datalist">
        {varNames.map((v) => (
          <option key={v} value={v} />
        ))}
      </datalist>
      <datalist id="os-lists-datalist">
        {listNames.map((l) => (
          <option key={l} value={l} />
        ))}
      </datalist>

      {/* Main Split Body */}
      <div className="flex-1 min-h-0 flex">
        {/* Visual Blocks Canvas */}
        {(viewTab === 'blocks' || viewTab === 'split') && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDropOnWorkspace(e)}
            className={`${
              viewTab === 'split' ? 'w-1/2 border-r border-slate-800/80' : 'w-full'
            } h-full overflow-y-auto p-4 space-y-4 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:18px_18px]`}
          >
            {visibleScripts.length === 0 ? (
              <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-800 rounded-2xl p-6 text-slate-400">
                <Blocks className="w-10 h-10 text-indigo-400/70 mb-2" />
                <div className="font-bold text-slate-200 text-sm">
                  No scripts on "{targetLabel}" yet
                </div>
                <p className="text-xs max-w-sm mt-1 text-slate-400">
                  Click or drag any block from the left palette, type plain English in the Natural English Bar, or ask Spark AI to build it for you.
                </p>
              </div>
            ) : (
              visibleScripts.map((script) => {
                const isRootTarget =
                  insertionTarget?.scriptId === script.id &&
                  !insertionTarget?.parentBlockId;

                return (
                  <div
                    key={script.id}
                    onClick={() => onSelectInsertionTarget({ scriptId: script.id, branch: 'body' })}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => handleDropOnWorkspace(e, script.id)}
                    className={`rounded-2xl bg-slate-900/80 border p-2.5 space-y-1.5 transition ${
                      !script.enabled ? 'opacity-50' : ''
                    } ${
                      isRootTarget
                        ? 'border-indigo-400/80 ring-2 ring-indigo-500/25'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {renderBlockNode(script, script.hat, true)}
                    <div className="pl-2 space-y-1.5">
                      {script.body.map((blk) => renderBlockNode(script, blk, false))}
                      <div className="pt-0.5 text-[11px] text-slate-500 flex items-center gap-1 px-1">
                        <Plus className="w-3 h-3" />
                        {isRootTarget ? 'Active target — click a block on the left to append' : 'Click stack to target'}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Natural Language OpenScript Pane */}
        {(viewTab === 'script' || viewTab === 'split') && (
          <div className={`${viewTab === 'split' ? 'w-1/2' : 'w-full'} h-full flex flex-col bg-slate-950/90 min-h-0`}>
            <div className="px-3 py-2 border-b border-slate-800/80 flex items-center justify-between gap-2 bg-slate-900/50">
              <div className="flex items-center gap-2">
                <select
                  value={scriptScope}
                  onChange={(e) => {
                    setCodeDirty(false);
                    setScriptScope(e.target.value as 'target' | 'all');
                  }}
                  className="bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-xs font-semibold text-slate-200 outline-none"
                >
                  <option value="target">Target: {targetLabel}</option>
                  <option value="all">All Project Scripts</option>
                </select>
                {parsePreview.errors.length === 0 ? (
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Valid ({parsePreview.scripts.length} scripts)
                  </span>
                ) : (
                  <span className="text-[11px] text-amber-400 flex items-center gap-1 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {parsePreview.errors.length} issue(s)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {codeDirty && (
                  <button
                    type="button"
                    onClick={() => {
                      setDraftCode(syncedOpenScript);
                      setCodeDirty(false);
                    }}
                    className="px-2 py-1 rounded-md text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  >
                    Reset
                  </button>
                )}
                <button
                  type="button"
                  onClick={applyDraftScript}
                  disabled={!codeDirty}
                  className="px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-35 text-white cursor-pointer transition"
                >
                  Sync to Blocks
                </button>
              </div>
            </div>

            <textarea
              value={draftCode}
              onChange={(e) => {
                setDraftCode(e.target.value);
                setCodeDirty(true);
              }}
              spellCheck={false}
              placeholder={`# Write natural-language OpenScript here:\nwhen project starts:\n  say "Hello!" for 2 sec`}
              className="openscript-editor flex-1 w-full bg-transparent p-3.5 text-xs leading-6 text-slate-100 outline-none resize-none"
            />

            {parsePreview.errors.length > 0 && (
              <div className="px-3 py-2 border-t border-amber-500/30 bg-amber-950/40 text-amber-200 text-[11px] space-y-0.5 max-h-24 overflow-y-auto">
                {parsePreview.errors.map((err, idx) => (
                  <div key={idx}>
                    Line {err.line}: {err.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
