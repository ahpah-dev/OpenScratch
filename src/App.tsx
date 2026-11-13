import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  BlockDefinition,
  BlockNode,
  Entity,
  OpenScratchProject,
  ProjectMode,
  RuntimeSnapshot,
  Scene,
  ScriptStack,
} from './types/project';
import { createBlockNode, getBlockDefinition, makeId } from './engine/blockCatalog';
import { OpenScratchRuntime } from './engine/coreRuntime.js';
import { parseOpenScript } from './engine/openscript';
import { PROJECT_TEMPLATES, type ProjectTemplate } from './data/templates';
import { createSpriteEntity, createWebEntity } from './data/assets';
import {
  loadAiSettings,
  saveAiSettings,
  type AiProposal,
  type AiSettings,
} from './ai/byok';
import { TopBar } from './components/TopBar';
import { BlockPalette } from './components/BlockPalette';
import { ScriptWorkspace, type InsertionTarget } from './components/ScriptWorkspace';
import { StageViewport } from './components/StageViewport';
import { EntityPanel } from './components/EntityPanel';
import { AiAssistantPanel } from './components/AiAssistantPanel';
import { ExportModal, HelpModal, TemplatesModal } from './components/Modals';

const PROJECT_AUTOSAVE_KEY = 'openscratch_autosave_v1';

function loadInitialProject(): OpenScratchProject {
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(PROJECT_AUTOSAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as OpenScratchProject;
        if (parsed && parsed.version === 1 && Array.isArray(parsed.scenes) && Array.isArray(parsed.entities)) {
          return parsed;
        }
      }
    } catch {
      // ignore corrupted autosave
    }
  }
  return PROJECT_TEMPLATES[0].create();
}

function appendToBlockTree(
  list: BlockNode[],
  parentBlockId: string | undefined,
  branch: 'body' | 'elseBody',
  nodes: BlockNode[]
): BlockNode[] {
  if (!parentBlockId) return [...list, ...nodes];
  return list.map((b) => {
    if (b.id === parentBlockId) {
      const existing = (branch === 'elseBody' ? b.elseBody : b.body) ?? [];
      return branch === 'elseBody'
        ? { ...b, elseBody: [...existing, ...nodes] }
        : { ...b, body: [...existing, ...nodes] };
    }
    return {
      ...b,
      body: b.body ? appendToBlockTree(b.body, parentBlockId, branch, nodes) : undefined,
      elseBody: b.elseBody ? appendToBlockTree(b.elseBody, parentBlockId, branch, nodes) : undefined,
    };
  });
}

export function App() {
  const [project, setProject] = useState<OpenScratchProject>(() => loadInitialProject());
  const [undoStack, setUndoStack] = useState<OpenScratchProject[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string>(() => {
    const initial = loadInitialProject();
    return initial.entities[0]?.id || 'stage';
  });
  const [insertionTarget, setInsertionTarget] = useState<InsertionTarget | null>(null);

  const [aiOpen, setAiOpen] = useState(false);
  const [stageExpanded, setStageExpanded] = useState(false);
  const [aiSettings, setAiSettings] = useState<AiSettings>(() => loadAiSettings());
  const [modal, setModal] = useState<'none' | 'templates' | 'export' | 'help'>('none');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const webLayerRef = useRef<HTMLDivElement | null>(null);
  const runtimeRef = useRef<OpenScratchRuntime | null>(null);

  const [snapshot, setSnapshot] = useState<RuntimeSnapshot>(() => ({
    running: false,
    activeSceneId: project.activeSceneId,
    theme: project.scenes[0]?.theme || 'dark-modern',
    variables: { ...project.variables },
    lists: { ...project.lists },
    camera: { x: 0, y: 0, zoom: 100, shake: 0 },
    toasts: [],
    logs: [],
    fps: 60,
  }));

  // Ensure selectedTargetId stays valid when switching templates or deleting entities
  useEffect(() => {
    if (
      selectedTargetId !== 'stage' &&
      !project.entities.some((e) => e.id === selectedTargetId)
    ) {
      setSelectedTargetId(project.entities[0]?.id || 'stage');
    }
  }, [project.entities, selectedTargetId]);

  // Autosave to localStorage
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(PROJECT_AUTOSAVE_KEY, JSON.stringify(project));
      } catch {
        // ignore quota errors
      }
    }
  }, [project]);

  // Initialize runtime once
  useEffect(() => {
    const rt = new OpenScratchRuntime(project, {
      onSnapshot: (snap) => setSnapshot(snap),
    });
    runtimeRef.current = rt;
    rt.attachDOM(canvasRef.current, webLayerRef.current);
    return () => {
      rt.stop();
      rt.detachDOM();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync paused preview stage when project changes
  useEffect(() => {
    const rt = runtimeRef.current;
    if (rt && !rt.running) {
      rt.updateProject(project);
    }
  }, [project]);

  const commitProject = useCallback(
    (updater: (prev: OpenScratchProject) => OpenScratchProject, recordUndo = true) => {
      setProject((prev) => {
        const next = updater(prev);
        if (recordUndo && next !== prev) {
          setUndoStack((u) => [...u.slice(-29), prev]);
        }
        return next;
      });
    },
    []
  );

  const handleUndo = () => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setProject(last);
      return prev.slice(0, -1);
    });
  };

  const handleRun = () => {
    const rt = runtimeRef.current;
    if (!rt) return;
    rt.updateProject(project);
    rt.start();
  };

  const handleStop = () => {
    runtimeRef.current?.stop();
  };

  const insertBlockNodes = useCallback(
    (nodes: BlockNode[]) => {
      if (nodes.length === 0) return;

      commitProject((prev) => {
        const nextScripts = [...prev.scripts];
        let activeScriptId = insertionTarget?.scriptId;
        let activeParentId = insertionTarget?.parentBlockId;
        let activeBranch: 'body' | 'elseBody' = insertionTarget?.branch || 'body';

        // Separate hat blocks from statement blocks cleanly
        let currentHatTargetScriptId = activeScriptId;

        for (const node of nodes) {
          const def = getBlockDefinition(node.type);
          if (def?.isHat) {
            const created: ScriptStack = {
              id: makeId('scr'),
              targetId: selectedTargetId,
              enabled: true,
              hat: node,
              body: [],
            };
            nextScripts.push(created);
            currentHatTargetScriptId = created.id;
            activeScriptId = created.id;
            activeParentId = undefined;
            activeBranch = 'body';
            continue;
          }

          let targetIdx = nextScripts.findIndex(
            (s) => s.id === (currentHatTargetScriptId || activeScriptId) && s.targetId === selectedTargetId
          );

          if (targetIdx < 0) {
            // Find last script on selected target, or create a when_start script
            for (let i = nextScripts.length - 1; i >= 0; i--) {
              if (nextScripts[i].targetId === selectedTargetId) {
                targetIdx = i;
                break;
              }
            }
          }

          if (targetIdx < 0) {
            const created: ScriptStack = {
              id: makeId('scr'),
              targetId: selectedTargetId,
              enabled: true,
              hat: createBlockNode('when_start'),
              body: [node],
            };
            nextScripts.push(created);
            currentHatTargetScriptId = created.id;
            activeScriptId = created.id;
            activeParentId = undefined;
            activeBranch = 'body';
          } else {
            const targetScript = nextScripts[targetIdx];
            nextScripts[targetIdx] = {
              ...targetScript,
              body: appendToBlockTree(targetScript.body, activeParentId, activeBranch, [node]),
            };
          }
        }

        if (activeScriptId) {
          setInsertionTarget({ scriptId: activeScriptId, parentBlockId: activeParentId, branch: activeBranch });
        }

        return { ...prev, scripts: nextScripts };
      });
    },
    [commitProject, insertionTarget, selectedTargetId]
  );

  const handleInsertBlockDef = (def: BlockDefinition) => {
    insertBlockNodes([createBlockNode(def.type)]);
  };

  const handleSelectTemplate = (tpl: ProjectTemplate) => {
    handleStop();
    const fresh = tpl.create();
    commitProject(() => fresh, true);
    setSelectedTargetId(fresh.entities[0]?.id || 'stage');
    setInsertionTarget(null);
    setModal('none');
  };

  const handleSaveJson = () => {
    const safe = (project.title || 'openscratch').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safe}.openscratch.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadJson = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as OpenScratchProject;
      if (!parsed || !Array.isArray(parsed.scenes) || !Array.isArray(parsed.entities)) {
        alert('Invalid OpenScratch project file.');
        return;
      }
      handleStop();
      commitProject(() => parsed, true);
      setSelectedTargetId(parsed.entities[0]?.id || 'stage');
      setInsertionTarget(null);
    } catch {
      alert('Could not read project file.');
    }
  };

  const handleApplyAiProposal = (proposal: AiProposal, replaceExisting: boolean) => {
    commitProject((prev) => {
      const nextEntities = [...prev.entities];
      const existingNames = new Set(nextEntities.map((e) => e.name.toLowerCase()));

      for (const spec of proposal.newEntities) {
        if (!spec.name || existingNames.has(spec.name.toLowerCase())) continue;
        existingNames.add(spec.name.toLowerCase());
        if (spec.kind === 'web') {
          nextEntities.push(
            createWebEntity(spec.name, spec.webType || 'button', prev.activeSceneId, {
              text: spec.text ?? spec.name,
              subtext: spec.subtext,
              bindVar: spec.bindVar,
            })
          );
        } else {
          const costume = spec.emoji
            ? { id: makeId('cos'), name: spec.name.toLowerCase(), kind: 'emoji' as const, value: spec.emoji }
            : {
                id: makeId('cos'),
                name: spec.preset || 'hero',
                kind: 'preset' as const,
                value: spec.preset || 'hero',
                color: spec.color || '#6366f1',
              };
          nextEntities.push(
            createSpriteEntity(spec.name, prev.activeSceneId, {
              x: spec.x ?? 0,
              y: spec.y ?? 0,
              size: spec.size ?? 100,
              costumes: [costume],
            })
          );
        }
      }

      const nextVars = { ...prev.variables, ...proposal.variables };

      // Re-parse OpenScript against final entity list so @target resolves newly created entities!
      const parsed = proposal.openScript
        ? parseOpenScript(proposal.openScript, selectedTargetId, nextEntities)
        : { scripts: [], errors: [] };

      const affectedTargets = new Set(parsed.scripts.map((s) => s.targetId));
      const baseScripts = replaceExisting
        ? prev.scripts.filter((s) => !affectedTargets.has(s.targetId))
        : prev.scripts;

      return {
        ...prev,
        entities: nextEntities,
        variables: nextVars,
        scripts: [...baseScripts, ...parsed.scripts],
      };
    });
  };

  const activeEntityName =
    selectedTargetId === 'stage'
      ? 'Stage'
      : project.entities.find((e) => e.id === selectedTargetId)?.name || 'this';

  const aiConfigured =
    aiSettings.provider === 'custom' || Boolean(aiSettings.apiKey.trim());

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-950 text-slate-100 select-none">
      <TopBar
        title={project.title}
        mode={project.mode}
        running={snapshot.running}
        canUndo={undoStack.length > 0}
        aiOpen={aiOpen}
        aiConfigured={aiConfigured}
        onChangeTitle={(title) => commitProject((p) => ({ ...p, title }), false)}
        onChangeMode={(mode: ProjectMode) => commitProject((p) => ({ ...p, mode }))}
        onRun={handleRun}
        onStop={handleStop}
        onUndo={handleUndo}
        onOpenTemplates={() => setModal('templates')}
        onOpenExport={() => setModal('export')}
        onSaveJson={handleSaveJson}
        onLoadJson={handleLoadJson}
        onOpenHelp={() => setModal('help')}
        onToggleAi={() => setAiOpen((o) => !o)}
      />

      <main className="flex-1 min-h-0 flex overflow-hidden">
        <BlockPalette
          mode={project.mode}
          activeEntityName={activeEntityName}
          onInsertBlockDef={handleInsertBlockDef}
          onInsertParsedBlocks={insertBlockNodes}
        />

        <ScriptWorkspace
          project={project}
          selectedTargetId={selectedTargetId}
          insertionTarget={insertionTarget}
          onSelectInsertionTarget={setInsertionTarget}
          onChangeScripts={(scripts) => commitProject((p) => ({ ...p, scripts }))}
        />

        <div
          className={`${
            stageExpanded ? 'w-[500px] xl:w-[580px]' : 'w-[360px] xl:w-[430px]'
          } shrink-0 border-l border-slate-800/90 flex flex-col min-h-0 overflow-hidden transition-all`}
        >
          <StageViewport
            project={project}
            snapshot={snapshot}
            selectedTargetId={selectedTargetId}
            expanded={stageExpanded}
            onToggleExpanded={() => setStageExpanded((v) => !v)}
            canvasRef={canvasRef}
            webLayerRef={webLayerRef}
            onSelectTarget={(id) => {
              setSelectedTargetId(id);
              setInsertionTarget(null);
            }}
            onUpdateEntityPos={(entityId, x, y) =>
              commitProject(
                (p) => ({
                  ...p,
                  entities: p.entities.map((e) => (e.id === entityId ? { ...e, x, y } : e)),
                }),
                false
              )
            }
            onChangeActiveScene={(sceneId) =>
              commitProject((p) => ({ ...p, activeSceneId: sceneId }), false)
            }
            onUpdateScenes={(scenes: Scene[], activeSceneId?: string) =>
              commitProject((p) => ({
                ...p,
                scenes,
                activeSceneId: activeSceneId || p.activeSceneId,
              }))
            }
            onClearLogs={() => {
              if (runtimeRef.current) {
                runtimeRef.current.logs = [];
                runtimeRef.current.emitSnapshot();
              }
            }}
          />

          <EntityPanel
            project={project}
            selectedTargetId={selectedTargetId}
            onSelectTarget={(id) => {
              setSelectedTargetId(id);
              setInsertionTarget(null);
            }}
            onAddEntity={(entity: Entity) => {
              commitProject((p) => ({ ...p, entities: [...p.entities, entity] }));
              setSelectedTargetId(entity.id);
              setInsertionTarget(null);
            }}
            onUpdateEntity={(updated: Entity) =>
              commitProject(
                (p) => ({
                  ...p,
                  entities: p.entities.map((e) => (e.id === updated.id ? updated : e)),
                }),
                false
              )
            }
            onDeleteEntity={(entityId: string) =>
              commitProject((p) => ({
                ...p,
                entities: p.entities.filter((e) => e.id !== entityId),
                scripts: p.scripts.filter((s) => s.targetId !== entityId),
              }))
            }
            onUpdateScene={(updatedScene: Scene) =>
              commitProject(
                (p) => ({
                  ...p,
                  scenes: p.scenes.map((s) => (s.id === updatedScene.id ? updatedScene : s)),
                }),
                false
              )
            }
          />
        </div>

        {aiOpen && (
          <AiAssistantPanel
            project={project}
            selectedTargetId={selectedTargetId}
            settings={aiSettings}
            onChangeSettings={(next) => {
              setAiSettings(next);
              saveAiSettings(next);
            }}
            onApplyProposal={handleApplyAiProposal}
            onClose={() => setAiOpen(false)}
          />
        )}
      </main>

      {modal === 'templates' && (
        <TemplatesModal onSelect={handleSelectTemplate} onClose={() => setModal('none')} />
      )}
      {modal === 'export' && (
        <ExportModal
          project={project}
          onDownloadJson={handleSaveJson}
          onClose={() => setModal('none')}
        />
      )}
      {modal === 'help' && <HelpModal onClose={() => setModal('none')} />}
    </div>
  );
}

export default App;
