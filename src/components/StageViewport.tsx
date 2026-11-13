import React, { useRef, useState } from 'react';
import { Plus, Trash2, Terminal, Variable, Maximize2, Minimize2 } from 'lucide-react';
import type { OpenScratchProject, RuntimeSnapshot, Scene } from '../types/project';
import { makeId } from '../engine/blockCatalog';

interface StageViewportProps {
  project: OpenScratchProject;
  snapshot: RuntimeSnapshot;
  selectedTargetId: string;
  expanded: boolean;
  onToggleExpanded: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  webLayerRef: React.RefObject<HTMLDivElement | null>;
  onSelectTarget: (id: string) => void;
  onUpdateEntityPos: (entityId: string, x: number, y: number) => void;
  onChangeActiveScene: (sceneId: string) => void;
  onUpdateScenes: (scenes: Scene[], activeSceneId?: string) => void;
  onClearLogs: () => void;
}

export const StageViewport: React.FC<StageViewportProps> = ({
  project,
  snapshot,
  selectedTargetId,
  expanded,
  onToggleExpanded,
  canvasRef,
  webLayerRef,
  onSelectTarget,
  onUpdateEntityPos,
  onChangeActiveScene,
  onUpdateScenes,
  onClearLogs,
}) => {
  const [draggingSpriteId, setDraggingSpriteId] = useState<string | null>(null);
  const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number } | null>(null);
  const [bottomTab, setBottomTab] = useState<'vars' | 'console'>('vars');
  const dragOffset = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  const activeSceneId = snapshot.running ? snapshot.activeSceneId : project.activeSceneId;
  const isWebsiteOnly =
    project.mode === 'website' ||
    (project.entities.length > 0 &&
      project.entities.every(
        (e) => e.kind === 'web' || (e.sceneId !== 'global' && e.sceneId !== activeSceneId)
      ));

  const toStageCoords = (clientX: number, clientY: number) => {
    const el = canvasRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    const x = Math.round(((clientX - rect.left) / Math.max(1, rect.width)) * 800 - 400);
    const y = Math.round(250 - ((clientY - rect.top) / Math.max(1, rect.height)) * 500);
    return { x, y };
  };

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (snapshot.running) return;
    const pos = toStageCoords(e.clientX, e.clientY);
    const activeSprites = project.entities
      .filter((ent) => ent.kind === 'sprite' && ent.visible && (ent.sceneId === 'global' || ent.sceneId === project.activeSceneId))
      .slice()
      .reverse();

    for (const sp of activeSprites) {
      const r = Math.max(24, (24 * sp.size) / 100);
      if (Math.abs(pos.x - sp.x) <= r && Math.abs(pos.y - sp.y) <= r) {
        setDraggingSpriteId(sp.id);
        dragOffset.current = { dx: sp.x - pos.x, dy: sp.y - pos.y };
        onSelectTarget(sp.id);
        e.currentTarget.setPointerCapture(e.pointerId);
        return;
      }
    }
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pos = toStageCoords(e.clientX, e.clientY);
    setHoverCoords(pos);
    if (!snapshot.running && draggingSpriteId) {
      onUpdateEntityPos(draggingSpriteId, pos.x + dragOffset.current.dx, pos.y + dragOffset.current.dy);
    }
  };

  const handleCanvasPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (draggingSpriteId) {
      setDraggingSpriteId(null);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  const addScene = () => {
    const num = project.scenes.length + 1;
    const newScene: Scene = {
      id: makeId('scene'),
      name: `Scene ${num}`,
      theme: 'dark-modern',
      background: { type: 'gradient', color1: '#0f172a', color2: '#1e1b4b', stars: false },
    };
    onUpdateScenes([...project.scenes, newScene], newScene.id);
  };

  const deleteScene = (id: string) => {
    if (project.scenes.length <= 1) return;
    const next = project.scenes.filter((s) => s.id !== id);
    onUpdateScenes(next, next[0].id);
  };

  const varsEntries = Object.entries(snapshot.running ? snapshot.variables : project.variables);
  const listsEntries = Object.entries(snapshot.running ? snapshot.lists : project.lists);

  return (
    <div className="w-full shrink-0 bg-slate-900/75 flex flex-col">
      {/* Scene / Page Tabs */}
      <div className="px-2.5 py-2 border-b border-slate-800/80 flex items-center justify-between gap-2 bg-slate-900/90">
        <div className="flex items-center gap-1 overflow-x-auto">
          {project.scenes.map((sc) => {
            const active = sc.id === activeSceneId;
            return (
              <div
                key={sc.id}
                className={`group flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 cursor-pointer border transition ${
                  active
                    ? 'bg-indigo-600 border-indigo-400 text-white'
                    : 'bg-slate-800/80 border-slate-700/70 text-slate-300 hover:bg-slate-800'
                }`}
                onClick={() => !snapshot.running && onChangeActiveScene(sc.id)}
              >
                <span>{sc.name}</span>
                {project.scenes.length > 1 && !snapshot.running && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteScene(sc.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:text-rose-200 cursor-pointer"
                    title="Delete scene"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
          {!snapshot.running && (
            <button
              type="button"
              onClick={addScene}
              title="Add scene or page"
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/70 text-slate-300 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onToggleExpanded}
          title={expanded ? 'Compact stage' : 'Widen stage'}
          className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer shrink-0"
        >
          {expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Stage Viewport */}
      <div className="p-2.5 shrink-0">
        <div className="relative w-full aspect-[800/500] rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-xl">
          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={handleCanvasPointerUp}
            onPointerLeave={() => setHoverCoords(null)}
            className={`w-full h-full block ${isWebsiteOnly ? 'hidden' : ''} ${
              !snapshot.running ? 'cursor-grab active:cursor-grabbing' : ''
            }`}
          />

          <div
            ref={webLayerRef}
            className="absolute inset-0 overflow-y-auto"
          />

          {/* Live Toast Banners */}
          {snapshot.toasts.length > 0 && (
            <div className="absolute bottom-2.5 right-2.5 left-2.5 flex flex-col items-end gap-1.5 pointer-events-none z-20">
              {snapshot.toasts.map((t) => (
                <div
                  key={t.id}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg border backdrop-blur-md ${
                    t.tone === 'success'
                      ? 'bg-emerald-950/90 border-emerald-400/50 text-emerald-100'
                      : t.tone === 'warning'
                      ? 'bg-amber-950/90 border-amber-400/50 text-amber-100'
                      : 'bg-slate-900/90 border-indigo-400/50 text-slate-100'
                  }`}
                >
                  {t.text}
                </div>
              ))}
            </div>
          )}

          {/* Stage Status Overlay */}
          <div className="absolute top-2 right-2 flex items-center gap-1.5 pointer-events-none">
            {snapshot.running ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-[10px] font-bold backdrop-blur-sm">
                LIVE · {snapshot.fps} FPS
              </span>
            ) : hoverCoords ? (
              <span className="px-2 py-0.5 rounded-full bg-slate-950/75 border border-slate-700 text-slate-300 text-[10px] font-mono">
                x:{hoverCoords.x} y:{hoverCoords.y}
              </span>
            ) : null}
          </div>
        </div>
        {!snapshot.running && !isWebsiteOnly && (
          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 px-0.5">
            <span>Tip: Drag sprites right on the stage to position them</span>
            <span>Selected: {selectedTargetId === 'stage' ? 'Stage' : project.entities.find((e) => e.id === selectedTargetId)?.name || ''}</span>
          </div>
        )}
      </div>

      {/* Variables & Console Monitor */}
      <div className="border-t border-slate-800/80 flex flex-col min-h-[115px] max-h-[155px] shrink-0 bg-slate-950/50">
        <div className="px-2.5 py-1.5 border-b border-slate-800/70 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setBottomTab('vars')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer ${
                bottomTab === 'vars' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Variable className="w-3 h-3 text-orange-400" />
              Variables ({varsEntries.length})
            </button>
            <button
              type="button"
              onClick={() => setBottomTab('console')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer ${
                bottomTab === 'console' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3 h-3 text-sky-400" />
              Console ({snapshot.logs.length})
            </button>
          </div>
          {bottomTab === 'console' && snapshot.logs.length > 0 && (
            <button
              type="button"
              onClick={onClearLogs}
              className="text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2 text-xs">
          {bottomTab === 'vars' ? (
            <div className="space-y-1.5">
              {varsEntries.length === 0 && listsEntries.length === 0 ? (
                <div className="text-[11px] text-slate-500 italic">
                  Variables created in Data blocks appear here live while running.
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {varsEntries.map(([k, v]) => (
                    <div
                      key={k}
                      className="px-2 py-1 rounded-md bg-slate-900 border border-orange-500/30 flex items-center gap-1.5 text-[11px]"
                    >
                      <span className="text-orange-300 font-semibold">{k}:</span>
                      <span className="font-mono text-white font-bold">{String(v)}</span>
                    </div>
                  ))}
                  {listsEntries.map(([k, arr]) => (
                    <div
                      key={k}
                      className="px-2 py-1 rounded-md bg-slate-900 border border-amber-500/30 flex items-center gap-1.5 text-[11px]"
                    >
                      <span className="text-amber-300 font-semibold">{k} [{arr.length}]:</span>
                      <span className="font-mono text-slate-200">
                        {arr.slice(0, 4).join(', ')}{arr.length > 4 ? '...' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : snapshot.logs.length === 0 ? (
            <div className="text-[11px] text-slate-500 italic">
              Runtime logs & "print to console" messages appear here.
            </div>
          ) : (
            <div className="space-y-1 font-mono text-[11px]">
              {snapshot.logs.map((l) => (
                <div
                  key={l.id}
                  className={
                    l.level === 'error'
                      ? 'text-rose-400'
                      : l.level === 'warn'
                      ? 'text-amber-300'
                      : 'text-slate-300'
                  }
                >
                  <span className="text-slate-500">[{l.time}]</span> {l.message}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
