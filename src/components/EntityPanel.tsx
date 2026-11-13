import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Globe,
  Layers,
  Plus,
  Sparkles,
  Trash2,
  Palette,
  Box,
} from 'lucide-react';
import type {
  Entity,
  OpenScratchProject,
  PageTheme,
  Scene,
  SceneBackgroundType,
  WebElementType,
} from '../types/project';
import {
  EMOJI_SPRITES,
  PRESET_SPRITE_ASSETS,
  createSpriteEntity,
  createWebEntity,
} from '../data/assets';
import { makeId, THEME_OPTIONS } from '../engine/blockCatalog';

interface EntityPanelProps {
  project: OpenScratchProject;
  selectedTargetId: string;
  onSelectTarget: (id: string) => void;
  onAddEntity: (entity: Entity) => void;
  onUpdateEntity: (entity: Entity) => void;
  onDeleteEntity: (entityId: string) => void;
  onUpdateScene: (scene: Scene) => void;
}

const WEB_ELEMENTS: { type: WebElementType; label: string; sample: string }[] = [
  { type: 'heading', label: 'Heading', sample: 'Big Title' },
  { type: 'paragraph', label: 'Paragraph', sample: 'Write a clear description here.' },
  { type: 'button', label: 'Button', sample: 'Click Me' },
  { type: 'input', label: 'Text Input', sample: 'Enter text...' },
  { type: 'card', label: 'Feature Card', sample: 'Awesome Feature' },
  { type: 'badge', label: 'Badge', sample: 'NEW' },
  { type: 'nav', label: 'Nav Bar', sample: 'My Site' },
  { type: 'divider', label: 'Divider', sample: '' },
];

export const EntityPanel: React.FC<EntityPanelProps> = ({
  project,
  selectedTargetId,
  onSelectTarget,
  onAddEntity,
  onUpdateEntity,
  onDeleteEntity,
  onUpdateScene,
}) => {
  const [addMenu, setAddMenu] = useState<'none' | 'sprite' | 'web'>('none');

  const selectedEntity = project.entities.find((e) => e.id === selectedTargetId);
  const activeScene = project.scenes.find((s) => s.id === project.activeSceneId) || project.scenes[0];

  const uniqueName = (base: string) => {
    const existing = new Set(project.entities.map((e) => e.name.toLowerCase()));
    if (!existing.has(base.toLowerCase())) return base;
    let i = 2;
    while (existing.has(`${base}${i}`.toLowerCase())) i++;
    return `${base}${i}`;
  };

  const handleAddPresetSprite = (idx: number) => {
    const preset = PRESET_SPRITE_ASSETS[idx];
    const ent = createSpriteEntity(uniqueName(preset.defaultName), project.activeSceneId, {
      costumes: [{ ...preset.costume, id: makeId('cos') }],
    });
    onAddEntity(ent);
    setAddMenu('none');
  };

  const handleAddEmojiSprite = (label: string, emoji: string) => {
    const ent = createSpriteEntity(uniqueName(label), project.activeSceneId, {
      costumes: [{ id: makeId('cos'), name: label.toLowerCase(), kind: 'emoji', value: emoji }],
    });
    onAddEntity(ent);
    setAddMenu('none');
  };

  const handleAddWebElement = (w: (typeof WEB_ELEMENTS)[number]) => {
    const ent = createWebEntity(uniqueName(w.label.replace(/\s+/g, '')), w.type, project.activeSceneId, {
      text: w.sample,
      subtext: w.type === 'nav' ? 'Home, About' : w.type === 'card' ? 'Click or edit this card in the inspector.' : undefined,
      icon: w.type === 'card' ? '✨' : undefined,
    });
    onAddEntity(ent);
    setAddMenu('none');
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col border-t border-slate-800/80 bg-slate-900/60">
      {/* Entities Header & Add Buttons */}
      <div className="px-2.5 py-2 border-b border-slate-800/80 flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Sprites & Web Elements
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setAddMenu((m) => (m === 'sprite' ? 'none' : 'sprite'))}
            className="px-2 py-1 rounded-md bg-sky-600/85 hover:bg-sky-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition"
          >
            <Plus className="w-3 h-3" />
            Sprite
          </button>
          <button
            type="button"
            onClick={() => setAddMenu((m) => (m === 'web' ? 'none' : 'web'))}
            className="px-2 py-1 rounded-md bg-emerald-600/85 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition"
          >
            <Plus className="w-3 h-3" />
            Web UI
          </button>
        </div>
      </div>

      {/* Quick Picker Popover */}
      {addMenu === 'sprite' && (
        <div className="p-2.5 border-b border-slate-800 bg-slate-950/90 space-y-2 max-h-48 overflow-y-auto">
          <div className="text-[10px] font-bold uppercase text-sky-300">Built-in Characters & Objects</div>
          <div className="flex flex-wrap gap-1">
            {PRESET_SPRITE_ASSETS.map((p, i) => (
              <button
                key={p.label}
                type="button"
                onClick={() => handleAddPresetSprite(i)}
                className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="text-[10px] font-bold uppercase text-amber-300 pt-1">Emoji Sprites</div>
          <div className="flex flex-wrap gap-1">
            {EMOJI_SPRITES.map((em) => (
              <button
                key={em.label}
                type="button"
                onClick={() => handleAddEmojiSprite(em.label, em.emoji)}
                className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 cursor-pointer"
                title={em.label}
              >
                {em.emoji} {em.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {addMenu === 'web' && (
        <div className="p-2.5 border-b border-slate-800 bg-slate-950/90 space-y-1.5">
          <div className="text-[10px] font-bold uppercase text-emerald-300">Add Website / HUD Component</div>
          <div className="grid grid-cols-2 gap-1.5">
            {WEB_ELEMENTS.map((w) => (
              <button
                key={w.type}
                type="button"
                onClick={() => handleAddWebElement(w)}
                className="px-2 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left text-xs font-semibold text-slate-200 cursor-pointer"
              >
                + {w.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Entity Chips List */}
      <div className="p-2 border-b border-slate-800/80 flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
        <button
          type="button"
          onClick={() => onSelectTarget('stage')}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 cursor-pointer transition ${
            selectedTargetId === 'stage'
              ? 'bg-indigo-600/90 border-indigo-400 text-white'
              : 'bg-slate-800/70 border-slate-700/70 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Stage
        </button>

        {project.entities.map((ent) => {
          const active = ent.id === selectedTargetId;
          const badge =
            ent.kind === 'web'
              ? '🌐'
              : ent.costumes[ent.activeCostumeIndex]?.kind === 'emoji'
              ? ent.costumes[ent.activeCostumeIndex].value
              : '👾';
          const inScene = ent.sceneId === 'global' || ent.sceneId === project.activeSceneId;

          return (
            <div
              key={ent.id}
              onClick={() => onSelectTarget(ent.id)}
              className={`group px-2.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 cursor-pointer transition ${
                active
                  ? 'bg-indigo-600/90 border-indigo-400 text-white shadow'
                  : 'bg-slate-800/70 border-slate-700/70 text-slate-200 hover:bg-slate-800'
              } ${!inScene ? 'opacity-50' : ''}`}
            >
              <span>{badge}</span>
              <span>{ent.name}</span>
              {!ent.visible && <EyeOff className="w-3 h-3 opacity-70" />}
            </div>
          );
        })}
      </div>

      {/* Inspector for Selected Stage or Entity */}
      <div className="flex-1 overflow-y-auto p-3 text-xs space-y-3">
        {selectedTargetId === 'stage' && activeScene ? (
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-200">
              <Palette className="w-3.5 h-3.5 text-indigo-400" />
              Scene Inspector ({activeScene.name})
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1">
                <span className="text-[11px] text-slate-400">Scene Name</span>
                <input
                  type="text"
                  value={activeScene.name}
                  onChange={(e) => onUpdateScene({ ...activeScene, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-100 outline-none"
                />
              </label>

              <label className="space-y-1">
                <span className="text-[11px] text-slate-400">Web Page Theme</span>
                <select
                  value={activeScene.theme}
                  onChange={(e) => onUpdateScene({ ...activeScene, theme: e.target.value as PageTheme })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-100 outline-none"
                >
                  {THEME_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-[11px] text-slate-400">Backdrop Style</span>
                <select
                  value={activeScene.background.type}
                  onChange={(e) =>
                    onUpdateScene({
                      ...activeScene,
                      background: { ...activeScene.background, type: e.target.value as SceneBackgroundType },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-100 outline-none"
                >
                  <option value="gradient">Gradient</option>
                  <option value="space">Starry Space</option>
                  <option value="sunset">Sunset</option>
                  <option value="grid">Blueprint Grid</option>
                  <option value="color">Solid Color</option>
                </select>
              </label>

              <div className="flex items-end gap-2">
                <label className="flex-1 space-y-1">
                  <span className="text-[11px] text-slate-400">Top</span>
                  <input
                    type="color"
                    value={activeScene.background.color1}
                    onChange={(e) =>
                      onUpdateScene({
                        ...activeScene,
                        background: { ...activeScene.background, color1: e.target.value },
                      })
                    }
                    className="w-full h-7 rounded bg-transparent border border-slate-700 cursor-pointer"
                  />
                </label>
                <label className="flex-1 space-y-1">
                  <span className="text-[11px] text-slate-400">Bottom</span>
                  <input
                    type="color"
                    value={activeScene.background.color2}
                    onChange={(e) =>
                      onUpdateScene({
                        ...activeScene,
                        background: { ...activeScene.background, color2: e.target.value },
                      })
                    }
                    className="w-full h-7 rounded bg-transparent border border-slate-700 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>
        ) : selectedEntity ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-100">
                {selectedEntity.kind === 'web' ? (
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Box className="w-3.5 h-3.5 text-sky-400" />
                )}
                <span>{selectedEntity.kind === 'web' ? `Web (${selectedEntity.webType})` : 'Sprite'}</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onUpdateEntity({ ...selectedEntity, visible: !selectedEntity.visible })}
                  title="Toggle visibility"
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                >
                  {selectedEntity.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteEntity(selectedEntity.id)}
                  title="Delete entity"
                  className="p-1 rounded bg-rose-950/60 hover:bg-rose-800 text-rose-200 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1">
                <span className="text-[11px] text-slate-400">Name</span>
                <input
                  type="text"
                  value={selectedEntity.name}
                  onChange={(e) => onUpdateEntity({ ...selectedEntity, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-100 outline-none"
                />
              </label>

              <label className="space-y-1">
                <span className="text-[11px] text-slate-400">Shown On</span>
                <select
                  value={selectedEntity.sceneId}
                  onChange={(e) => onUpdateEntity({ ...selectedEntity, sceneId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-100 outline-none"
                >
                  <option value="global">All Scenes (Global)</option>
                  {project.scenes.map((sc) => (
                    <option key={sc.id} value={sc.id}>
                      {sc.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {selectedEntity.kind === 'sprite' ? (
              <>
                <div className="grid grid-cols-4 gap-1.5">
                  <label className="space-y-0.5">
                    <span className="text-[10px] text-slate-400">X</span>
                    <input
                      type="number"
                      value={Math.round(selectedEntity.x)}
                      onChange={(e) => onUpdateEntity({ ...selectedEntity, x: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-xs text-slate-100 outline-none"
                    />
                  </label>
                  <label className="space-y-0.5">
                    <span className="text-[10px] text-slate-400">Y</span>
                    <input
                      type="number"
                      value={Math.round(selectedEntity.y)}
                      onChange={(e) => onUpdateEntity({ ...selectedEntity, y: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-xs text-slate-100 outline-none"
                    />
                  </label>
                  <label className="space-y-0.5">
                    <span className="text-[10px] text-slate-400">Size %</span>
                    <input
                      type="number"
                      value={Math.round(selectedEntity.size)}
                      onChange={(e) => onUpdateEntity({ ...selectedEntity, size: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-xs text-slate-100 outline-none"
                    />
                  </label>
                  <label className="space-y-0.5">
                    <span className="text-[10px] text-slate-400">Angle</span>
                    <input
                      type="number"
                      value={Math.round(selectedEntity.rotation)}
                      onChange={(e) => onUpdateEntity({ ...selectedEntity, rotation: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-xs text-slate-100 outline-none"
                    />
                  </label>
                </div>

                {/* Quick Costume Switch / Emoji / Color */}
                <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-purple-400" />
                      Costume & Physics
                    </span>
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedEntity.physics.solid}
                        onChange={(e) =>
                          onUpdateEntity({
                            ...selectedEntity,
                            physics: { ...selectedEntity.physics, solid: e.target.checked },
                          })
                        }
                      />
                      Solid Platform
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedEntity.costumes.map((c, idx) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => onUpdateEntity({ ...selectedEntity, activeCostumeIndex: idx })}
                        className={`px-2 py-0.5 rounded text-[11px] border cursor-pointer ${
                          idx === selectedEntity.activeCostumeIndex
                            ? 'bg-purple-600/80 border-purple-400 text-white font-bold'
                            : 'bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                      >
                        {c.kind === 'emoji' ? c.value : c.name}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              /* Web Component Inspector */
              <div className="space-y-2">
                <label className="block space-y-1">
                  <span className="text-[11px] text-slate-400">Text (supports {'{variable}'}!)</span>
                  <input
                    type="text"
                    value={selectedEntity.text ?? ''}
                    onChange={(e) => onUpdateEntity({ ...selectedEntity, text: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-100 outline-none"
                  />
                </label>

                {(selectedEntity.webType === 'card' ||
                  selectedEntity.webType === 'input' ||
                  selectedEntity.webType === 'nav') && (
                  <label className="block space-y-1">
                    <span className="text-[11px] text-slate-400">
                      {selectedEntity.webType === 'nav'
                        ? 'Page Links (comma-separated)'
                        : selectedEntity.webType === 'input'
                        ? 'Placeholder'
                        : 'Card Description'}
                    </span>
                    <input
                      type="text"
                      value={selectedEntity.subtext ?? ''}
                      onChange={(e) => onUpdateEntity({ ...selectedEntity, subtext: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-100 outline-none"
                    />
                  </label>
                )}

                {selectedEntity.webType === 'input' && (
                  <label className="block space-y-1">
                    <span className="text-[11px] text-slate-400">Bind to Variable</span>
                    <input
                      type="text"
                      value={selectedEntity.bindVar ?? selectedEntity.name}
                      onChange={(e) => onUpdateEntity({ ...selectedEntity, bindVar: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-100 outline-none"
                    />
                  </label>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <label className="space-y-1">
                    <span className="text-[11px] text-slate-400">Align</span>
                    <select
                      value={selectedEntity.webStyle?.align || 'left'}
                      onChange={(e) =>
                        onUpdateEntity({
                          ...selectedEntity,
                          webStyle: { ...selectedEntity.webStyle, align: e.target.value as 'left' | 'center' | 'right' },
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-100 outline-none"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </label>

                  <label className="space-y-1">
                    <span className="text-[11px] text-slate-400">Corner Radius</span>
                    <input
                      type="number"
                      value={selectedEntity.webStyle?.rounded ?? 12}
                      onChange={(e) =>
                        onUpdateEntity({
                          ...selectedEntity,
                          webStyle: { ...selectedEntity.webStyle, rounded: Number(e.target.value) },
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-100 outline-none"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};
