import type { Costume, Entity, PhysicsConfig, WebElementType } from '../types/project';
import { makeId } from '../engine/blockCatalog';

export const PRESET_SPRITE_ASSETS: {
  label: string;
  costume: Omit<Costume, 'id'>;
  defaultName: string;
}[] = [
  { label: 'Hero', defaultName: 'Hero', costume: { name: 'hero', kind: 'preset', value: 'hero', color: '#6366f1' } },
  { label: 'Robot', defaultName: 'Bot', costume: { name: 'robot', kind: 'preset', value: 'robot', color: '#38bdf8' } },
  { label: 'Rocket', defaultName: 'Rocket', costume: { name: 'rocket', kind: 'preset', value: 'rocket', color: '#f43f5e' } },
  { label: 'Coin', defaultName: 'Coin', costume: { name: 'coin', kind: 'preset', value: 'coin', color: '#fbbf24' } },
  { label: 'Gem', defaultName: 'Gem', costume: { name: 'gem', kind: 'preset', value: 'gem', color: '#2dd4bf' } },
  { label: 'Slime', defaultName: 'Slime', costume: { name: 'slime', kind: 'preset', value: 'slime', color: '#4ade80' } },
  { label: 'Ghost', defaultName: 'Ghost', costume: { name: 'ghost', kind: 'preset', value: 'ghost', color: '#e2e8f0' } },
  { label: 'Star', defaultName: 'Star', costume: { name: 'star', kind: 'preset', value: 'star', color: '#fde047' } },
  { label: 'Platform', defaultName: 'Platform', costume: { name: 'platform', kind: 'preset', value: 'platform', color: '#475569' } },
];

export const EMOJI_SPRITES = [
  { label: 'Cat', emoji: '🐱' },
  { label: 'Fox', emoji: '🦊' },
  { label: 'Astronaut', emoji: '👩‍🚀' },
  { label: 'Dragon', emoji: '🐉' },
  { label: 'Unicorn', emoji: '🦄' },
  { label: 'Car', emoji: '🏎️' },
  { label: 'Meteor', emoji: '☄️' },
  { label: 'Laser', emoji: '⚡' },
  { label: 'Tree', emoji: '🌲' },
  { label: 'Heart', emoji: '💖' },
  { label: 'Trophy', emoji: '🏆' },
  { label: 'Fire', emoji: '🔥' },
];

export const DEFAULT_PHYSICS: PhysicsConfig = {
  enabled: false,
  mode: 'none',
  speed: 5,
  jumpForce: 13,
  gravity: 0.7,
  solid: false,
  bounceEdges: false,
};

export function createSpriteEntity(
  name: string,
  sceneId: string,
  opts: Partial<Entity> = {}
): Entity {
  return {
    id: opts.id || makeId('ent'),
    name,
    kind: 'sprite',
    sceneId,
    visible: opts.visible ?? true,
    x: opts.x ?? 0,
    y: opts.y ?? 0,
    size: opts.size ?? 100,
    rotation: opts.rotation ?? 0,
    opacity: opts.opacity ?? 100,
    layer: opts.layer ?? 1,
    costumes: opts.costumes || [{ id: makeId('cos'), name: 'default', kind: 'preset', value: 'hero', color: '#6366f1' }],
    activeCostumeIndex: opts.activeCostumeIndex ?? 0,
    physics: { ...DEFAULT_PHYSICS, ...(opts.physics || {}) },
  };
}

export function createWebEntity(
  name: string,
  webType: WebElementType,
  sceneId: string,
  opts: Partial<Entity> = {}
): Entity {
  return {
    id: opts.id || makeId('web'),
    name,
    kind: 'web',
    sceneId,
    visible: opts.visible ?? true,
    x: 0,
    y: 0,
    size: 100,
    rotation: 0,
    opacity: 100,
    layer: 10,
    costumes: [],
    activeCostumeIndex: 0,
    physics: { ...DEFAULT_PHYSICS },
    webType,
    text: opts.text ?? (webType === 'heading' ? 'Welcome!' : webType === 'button' ? 'Click Me' : 'Hello from OpenScratch!'),
    subtext: opts.subtext,
    icon: opts.icon,
    bindVar: opts.bindVar,
    webStyle: {
      variant: 'primary',
      align: 'left',
      size: 'md',
      rounded: 12,
      ...(opts.webStyle || {}),
    },
  };
}
