import type { ArgValue, BlockCategory, BlockDefinition, BlockNode } from '../types/project';

let idCounter = 0;
export function makeId(prefix = 'id'): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter.toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export const CATEGORY_META: Record<
  BlockCategory,
  { label: string; color: string; bg: string; border: string; badge: string; accent: string }
> = {
  events: {
    label: 'Events',
    color: 'text-amber-100',
    bg: 'bg-amber-600/90',
    border: 'border-amber-400/60',
    badge: 'bg-amber-500',
    accent: '#f59e0b',
  },
  motion: {
    label: 'Motion & Physics',
    color: 'text-sky-100',
    bg: 'bg-sky-600/90',
    border: 'border-sky-400/60',
    badge: 'bg-sky-500',
    accent: '#0ea5e9',
  },
  animation: {
    label: 'Animation & Looks',
    color: 'text-purple-100',
    bg: 'bg-purple-600/90',
    border: 'border-purple-400/60',
    badge: 'bg-purple-500',
    accent: '#a855f7',
  },
  control: {
    label: 'Control & Logic',
    color: 'text-indigo-100',
    bg: 'bg-indigo-600/90',
    border: 'border-indigo-400/60',
    badge: 'bg-indigo-500',
    accent: '#6366f1',
  },
  sound: {
    label: 'Sound & Music',
    color: 'text-pink-100',
    bg: 'bg-pink-600/90',
    border: 'border-pink-400/60',
    badge: 'bg-pink-500',
    accent: '#ec4899',
  },
  data: {
    label: 'Data & Lists',
    color: 'text-orange-100',
    bg: 'bg-orange-600/90',
    border: 'border-orange-400/60',
    badge: 'bg-orange-500',
    accent: '#f97316',
  },
  web: {
    label: 'Website & UI',
    color: 'text-emerald-100',
    bg: 'bg-emerald-600/90',
    border: 'border-emerald-400/60',
    badge: 'bg-emerald-500',
    accent: '#10b981',
  },
};

export const KEY_OPTIONS = [
  'space',
  'up arrow',
  'down arrow',
  'left arrow',
  'right arrow',
  'w',
  'a',
  's',
  'd',
  'enter',
  'shift',
  'any',
];

export const SOUND_OPTIONS = [
  'coin',
  'jump',
  'laser',
  'hit',
  'powerup',
  'pop',
  'click',
  'win',
  'lose',
  'whoosh',
];

export const NOTE_OPTIONS = [
  'C4',
  'D4',
  'E4',
  'F4',
  'G4',
  'A4',
  'B4',
  'C5',
  'D5',
  'E5',
  'G5',
];

export const EASE_OPTIONS = [
  'smooth',
  'linear',
  'ease-in',
  'ease-out',
  'bounce',
  'elastic',
];

export const THEME_OPTIONS = [
  'dark-modern',
  'clean-light',
  'pastel-pop',
  'retro-arcade',
  'ocean-glass',
];

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  // ================= EVENTS =================
  {
    type: 'when_start',
    category: 'events',
    isHat: true,
    modes: ['unified', 'game', 'animation', 'website'],
    labelParts: ['when project starts'],
    args: [],
    description: 'Runs automatically as soon as you press Play.',
  },
  {
    type: 'when_key',
    category: 'events',
    isHat: true,
    modes: ['unified', 'game', 'animation'],
    labelParts: ['when ', { arg: 'key' }, ' key is ', { arg: 'mode' }],
    args: [
      { name: 'key', type: 'key', defaultValue: 'space', options: KEY_OPTIONS },
      { name: 'mode', type: 'select', defaultValue: 'pressed', options: ['pressed', 'held', 'released'] },
    ],
    description: 'Triggers on key press, continuously while held, or on release.',
  },
  {
    type: 'when_clicked',
    category: 'events',
    isHat: true,
    modes: ['unified', 'game', 'animation', 'website'],
    labelParts: ['when ', { arg: 'target' }, ' is clicked'],
    args: [{ name: 'target', type: 'entity', defaultValue: 'this' }],
    description: 'Runs whenever a sprite or website button/card is clicked.',
  },
  {
    type: 'when_touches',
    category: 'events',
    isHat: true,
    modes: ['unified', 'game', 'animation'],
    labelParts: ['when ', { arg: 'a' }, ' touches ', { arg: 'b' }],
    args: [
      { name: 'a', type: 'entity', defaultValue: 'this' },
      { name: 'b', type: 'entity', defaultValue: 'Coin' },
    ],
    description: 'Runs automatically on collision — no forever loop needed!',
  },
  {
    type: 'when_every',
    category: 'events',
    isHat: true,
    modes: ['unified', 'game', 'animation', 'website'],
    labelParts: ['every ', { arg: 'sec' }, ' seconds'],
    args: [{ name: 'sec', type: 'number', defaultValue: 1 }],
    description: 'Repeats on a steady interval timer (great for spawners or clocks).',
  },
  {
    type: 'when_condition',
    category: 'events',
    isHat: true,
    modes: ['unified', 'game', 'animation', 'website'],
    labelParts: ['whenever ', { arg: 'condition' }],
    args: [{ name: 'condition', type: 'condition', defaultValue: 'score >= 10' }],
    description: 'Fires the moment a condition becomes true.',
  },
  {
    type: 'when_message',
    category: 'events',
    isHat: true,
    modes: ['unified', 'game', 'animation', 'website'],
    labelParts: ['when I hear message ', { arg: 'msg' }],
    args: [{ name: 'msg', type: 'text', defaultValue: 'go' }],
    description: 'Reacts to a broadcast message from any script.',
  },
  {
    type: 'when_clone_starts',
    category: 'events',
    isHat: true,
    modes: ['unified', 'game', 'animation'],
    labelParts: ['when a copy of ', { arg: 'target' }, ' appears'],
    args: [{ name: 'target', type: 'entity', defaultValue: 'this' }],
    description: 'Runs for each newly spawned copy/clone.',
  },
  {
    type: 'when_input_changes',
    category: 'events',
    isHat: true,
    modes: ['unified', 'website'],
    labelParts: ['when input ', { arg: 'target' }, ' changes'],
    args: [{ name: 'target', type: 'entity', defaultValue: 'nameInput' }],
    description: 'Triggers live as the user types in a website input field.',
  },
  {
    type: 'define_action',
    category: 'events',
    isHat: true,
    modes: ['unified', 'game', 'animation', 'website'],
    labelParts: ['define custom action ', { arg: 'name' }],
    args: [{ name: 'name', type: 'text', defaultValue: 'celebrate' }],
    description: 'Creates a reusable custom action you can call anywhere.',
  },

  // ================= MOTION & PHYSICS =================
  {
    type: 'enable_platformer',
    category: 'motion',
    modes: ['unified', 'game'],
    labelParts: [
      'give ',
      { arg: 'target' },
      ' platformer physics speed ',
      { arg: 'speed' },
      ' jump ',
      { arg: 'jump' },
      ' gravity ',
      { arg: 'gravity' },
    ],
    args: [
      { name: 'target', type: 'entity', defaultValue: 'this' },
      { name: 'speed', type: 'number', defaultValue: 5 },
      { name: 'jump', type: 'number', defaultValue: 13 },
      { name: 'gravity', type: 'number', defaultValue: 0.7 },
    ],
    description: 'Instant side-scrolling arrow/WASD + space jump + solid ground physics!',
  },
  {
    type: 'enable_topdown',
    category: 'motion',
    modes: ['unified', 'game'],
    labelParts: ['give ', { arg: 'target' }, ' top-down arrow controls speed ', { arg: 'speed' }],
    args: [
      { name: 'target', type: 'entity', defaultValue: 'this' },
      { name: 'speed', type: 'number', defaultValue: 5 },
    ],
    description: 'Instant 4-way WASD / arrow key movement.',
  },
  {
    type: 'make_solid',
    category: 'motion',
    modes: ['unified', 'game'],
    labelParts: ['make ', { arg: 'target' }, ' a solid platform'],
    args: [{ name: 'target', type: 'entity', defaultValue: 'this' }],
    description: 'Marks a sprite as solid ground/wall for platformer characters.',
  },
  {
    type: 'move_steps',
    category: 'motion',
    modes: ['unified', 'game', 'animation'],
    labelParts: ['move ', { arg: 'target' }, ' forward ', { arg: 'steps' }, ' steps'],
    args: [
      { name: 'target', type: 'entity', defaultValue: 'this' },
      { name: 'steps', type: 'number', defaultValue: 10 },
    ],
    description: 'Moves sprite in its facing direction.',
  },
  {
    type: 'move_direction',
    category: 'motion',
    modes: ['unified', 'game', 'animation'],
    labelParts: ['move ', { arg: 'target' }, ' ', { arg: 'dir' }, ' by ', { arg: 'amount' }],
    args: [
      { name: 'target', type: 'entity', defaultValue: 'this' },
      { name: 'dir', type: 'select', defaultValue: 'right', options: ['right', 'left', 'up', 'down'] },
      { name: 'amount', type: 'number', defaultValue: 10 },
    ],
    description: 'Moves sprite horizontally or vertically without rotating.',
  },
  {
    type: 'go_to_xy',
    category: 'motion',
    modes: ['unified', 'game', 'animation'],
    labelParts: ['place ', { arg: 'target' }, ' at x: ', { arg: 'x' }, ' y: ', { arg: 'y' }],
    args: [
      { name: 'target', type: 'entity', defaultValue: 'this' },
      { name: 'x', type: 'text', defaultValue: '0' },
      { name: 'y', type: 'text', defaultValue: '0' },
    ],
    description: 'Teleports sprite immediately to coordinates (supports expressions like random(-300, 300)).',
  },
  {
    type: 'go_to_target',
    category: 'motion',
    modes: ['unified', 'game', 'animation'],
    labelParts: ['jump ', { arg: 'target' }, ' to ', { arg: 'dest' }],
    args: [
      { name: 'target', type: 'entity', defaultValue: 'this' },
      { name: 'dest', type: 'entityOrMouse', defaultValue: 'mouse' },
    ],
    description: 'Moves sprite to the mouse cursor, a random spot, or another sprite.',
  },
  {
    type: 'point_toward',
    category: 'motion',
    modes: ['unified', 'game', 'animation'],
    labelParts: ['point ', { arg: 'target' }, ' toward ', { arg: 'dest' }],
    args: [
      { name: 'target', type: 'entity', defaultValue: 'this' },
      { name: 'dest', type: 'entityOrMouse', defaultValue: 'mouse' },
    ],
    description: 'Rotates sprite to face the mouse pointer or another sprite.',
  },
  {
    type: 'turn_degrees',
    category: 'motion',
    modes: ['unified', 'game', 'animation'],
    labelParts: ['turn ', { arg: 'target' }, ' ', { arg: 'dir' }, ' ', { arg: 'deg' }, ' degrees'],
    args: [
      { name: 'target', type: 'entity', defaultValue: 'this' },
      { name: 'dir', type: 'select', defaultValue: 'right', options: ['right', 'left'] },
      { name: 'deg', type: 'number', defaultValue: 15 },
    ],
    description: 'Rotates sprite clockwise or counter-clockwise.',
  },
  {
    type: 'set_rotation',
    category: 'motion',
    modes: ['unified', 'game', 'animation'],
    labelParts: ['set angle of ', { arg: 'target' }, ' to ', { arg: 'deg' }, ' degrees'],
    args: [
      { name: 'target', type: 'entity', defaultValue: 'this' },
      { name: 'deg', type: 'number', defaultValue: 0 },
    ],
    description: 'Sets exact rotation angle in degrees (0 = upright).',
  },
  {
    type: 'set_velocity',
    category: 'motion',
    modes: ['unified', 'game'],
    labelParts: ['set velocity of ', { arg: 'target' }, ' vx: ', { arg: 'vx' }, ' vy: ', { arg: 'vy' }],
    args: [
      { name: 'target', type: 'entity', defaultValue: 'this' },
      { name: 'vx', type: 'number', defaultValue: 0 },
      { name: 'vy', type: 'number', defaultValue: 10 },
    ],
    description: 'Sets X and Y velocity directly for custom physics or jumps.',
  },
  {
    type: 'bounce_edges',
    category: 'motion',
    modes: ['unified', 'game', 'animation'],
    labelParts: ['keep ', { arg: 'target' }, ' bouncing off edges'],
    args: [{ name: 'target', type: 'entity', defaultValue: 'this' }],
    description: 'Makes the sprite bounce back whenever it hits stage borders.',
  },

  // ================= ANIMATION & LOOKS =================
  {
    type: 'glide_to',
    category: 'animation',
    modes: ['unified', 'animation', 'game'],
    labelParts: [
      'glide ',
      { arg: 'target' },
      ' to x: ',
      { arg: 'x' },
      ' y: ',
      { arg: 'y' },
      ' in ',
      { arg: 'sec' },
      ' sec ease ',
      { arg: 'ease' },
    ],
    args: [
      { name: 'target', type: 'entity', defaultValue: 'this' },
      { name: 'x', type: 'text', defaultValue: '120' },
      { name: 'y', type: 'text', defaultValue: '0' },
      { name: 'sec', type: 'number', defaultValue: 0.8 },
      { name: 'ease', type: 'ease', defaultValue: 'smooth', options: EASE_OPTIONS },
    ],
    description: 'Smoothly animates position over time with easing curves.',
  },
  {
    type: 'animate_prop',
    category: 'animation',
    modes: ['unified', 'animation', 'game'],
    labelParts: [
      'animate ',
      { arg: 'target' },
      ' ',
      { arg: 'prop' },
      ' to ',
      { arg: 'value' },
      ' in ',
      { arg: 'sec' },
      ' sec ease ',
      { arg: 'ease' },
    ],
    args: [
      { name: 'target', type: 'entity', defaultValue: 'this' },
      { name: 'prop', type: 'select', defaultValue: 'scale', options: ['scale', 'opacity', 'rotation', 'x', 'y'] },
      { name: 'value', type: 'number', defaultValue: 130 },
      { name: 'sec', type: 'number', defaultValue: 0.5 },
      { name: 'ease', type: 'ease', defaultValue: 'bounce', options: EASE_OPTIONS },
    ],
    description: 'Smoothly tweens scale, opacity, rotation, x, or y with easing.',
  },
  {
    type: 'show_hide',
    category: 'animation',
    modes: ['unified', 'animation', 'game', 'website'],
    labelParts: [{ arg: 'action' }, ' ', { arg: 'target' }],
    args: [
      { name: 'action', type: 'select', defaultValue: 'show', options: ['show', 'hide'] },
      { name: 'target', type: 'entity', defaultValue: 'this' },
    ],
    description: 'Shows or hides any sprite or website element.',
  },
  {
    type: 'say_text',
    category: 'animation',
    modes: ['unified', 'animation', 'game'],
    labelParts: ['make ', { arg: 'target' }, ' say ', { arg: 'text' }, ' for ', { arg: 'sec' }, ' sec'],
    args: [
      { name: 'target', type: 'entity', defaultValue: 'this' },
      { name: 'text', type: 'text', defaultValue: 'Hello!' },
      { name: 'sec', type: 'number', defaultValue: 2 },
    ],
    description: 'Displays a speech bubble (supports {variable} text, 0 sec = stay).',
  },
  {
    type: 'switch_costume',
    category: 'animation',
    modes: ['unified', 'animation', 'game'],
    labelParts: ['switch ', { arg: 'target' }, ' costume to ', { arg: 'costume' }],
    args: [
      { name: 'target', type: 'entity', defaultValue: 'this' },
      { name: 'costume', type: 'text', defaultValue: 'next' },
    ],
    description: 'Changes costume by name, index, or "next" for frame animation.',
  },
  {
    type: 'set_size',
    category: 'animation',
    modes: ['unified', 'animation', 'game'],
    labelParts: ['set size of ', { arg: 'target' }, ' to ', { arg: 'size' }, '%'],
    args: [
      { name: 'target', type: 'entity', defaultValue: 'this' },
      { name: 'size', type: 'number', defaultValue: 100 },
    ],
    description: 'Sets sprite scale percentage immediately.',
  },
  {
    type: 'set_opacity',
    category: 'animation',
    modes: ['unified', 'animation', 'game'],
    labelParts: ['set opacity of ', { arg: 'target' }, ' to ', { arg: 'opacity' }, '%'],
    args: [
      { name: 'target', type: 'entity', defaultValue: 'this' },
      { name: 'opacity', type: 'number', defaultValue: 100 },
    ],
    description: 'Sets transparency from 0% (invisible) to 100% (solid).',
  },
  {
    type: 'burst_particles',
    category: 'animation',
    modes: ['unified', 'animation', 'game'],
    labelParts: ['burst ', { arg: 'count' }, ' ', { arg: 'style' }, ' particles at ', { arg: 'target' }],
    args: [
      { name: 'count', type: 'number', defaultValue: 16 },
      { name: 'style', type: 'select', defaultValue: 'confetti', options: ['confetti', 'spark', 'smoke', 'hearts', 'stars'] },
      { name: 'target', type: 'entity', defaultValue: 'this' },
    ],
    description: 'Emits colorful particle bursts for impacts, pickups, or celebrations.',
  },
  {
    type: 'camera_shake',
    category: 'animation',
    modes: ['unified', 'animation', 'game'],
    labelParts: ['shake camera strength ', { arg: 'strength' }, ' for ', { arg: 'sec' }, ' sec'],
    args: [
      { name: 'strength', type: 'number', defaultValue: 8 },
      { name: 'sec', type: 'number', defaultValue: 0.3 },
    ],
    description: 'Adds dramatic screen shake for hits, jumps, or explosions.',
  },
  {
    type: 'camera_zoom',
    category: 'animation',
    modes: ['unified', 'animation', 'game'],
    labelParts: ['zoom camera to ', { arg: 'zoom' }, '% in ', { arg: 'sec' }, ' sec'],
    args: [
      { name: 'zoom', type: 'number', defaultValue: 120 },
      { name: 'sec', type: 'number', defaultValue: 0.5 },
    ],
    description: 'Smoothly zooms the stage camera in or out.',
  },
  {
    type: 'camera_follow',
    category: 'animation',
    modes: ['unified', 'game', 'animation'],
    labelParts: ['camera follow ', { arg: 'target' }],
    args: [{ name: 'target', type: 'entity', defaultValue: 'this' }],
    description: 'Smoothly tracks a sprite with the stage camera (or "none" to reset).',
  },
  {
    type: 'pen_trail',
    category: 'animation',
    modes: ['unified', 'animation', 'game'],
    labelParts: [{ arg: 'action' }, ' drawing trail on ', { arg: 'target' }, ' color ', { arg: 'color' }, ' size ', { arg: 'size' }],
    args: [
      { name: 'action', type: 'select', defaultValue: 'start', options: ['start', 'stop', 'clear all'] },
      { name: 'target', type: 'entity', defaultValue: 'this' },
      { name: 'color', type: 'color', defaultValue: '#38bdf8' },
      { name: 'size', type: 'number', defaultValue: 4 },
    ],
    description: 'Draws colorful ink trails behind a moving sprite.',
  },

  // ================= CONTROL & LOGIC =================
  {
    type: 'wait_sec',
    category: 'control',
    modes: ['unified', 'game', 'animation', 'website'],
    labelParts: ['wait ', { arg: 'sec' }, ' seconds'],
    args: [{ name: 'sec', type: 'number', defaultValue: 1 }],
    description: 'Pauses only this script for the given number of seconds.',
  },
  {
    type: 'repeat_times',
    category: 'control',
    isCBlock: true,
    modes: ['unified', 'game', 'animation', 'website'],
    labelParts: ['repeat ', { arg: 'times' }, ' times'],
    args: [{ name: 'times', type: 'number', defaultValue: 10 }],
    description: 'Runs inner blocks a specific number of times.',
  },
  {
    type: 'repeat_forever',
    category: 'control',
    isCBlock: true,
    modes: ['unified', 'game', 'animation'],
    labelParts: ['repeat forever'],
    args: [],
    description: 'Loops inner blocks smoothly every animation frame.',
  },
  {
    type: 'repeat_until',
    category: 'control',
    isCBlock: true,
    modes: ['unified', 'game', 'animation'],
    labelParts: ['repeat until ', { arg: 'condition' }],
    args: [{ name: 'condition', type: 'condition', defaultValue: 'score >= 10' }],
    description: 'Loops until the condition becomes true.',
  },
  {
    type: 'wait_until',
    category: 'control',
    modes: ['unified', 'game', 'animation', 'website'],
    labelParts: ['wait until ', { arg: 'condition' }],
    args: [{ name: 'condition', type: 'condition', defaultValue: 'score >= 10' }],
    description: 'Pauses script until the condition evaluates to true.',
  },
  {
    type: 'if_then',
    category: 'control',
    isCBlock: true,
    hasElse: true,
    modes: ['unified', 'game', 'animation', 'website'],
    labelParts: ['if ', { arg: 'condition' }, ' then'],
    args: [{ name: 'condition', type: 'condition', defaultValue: 'score >= 10' }],
    description: 'Runs blocks if true, with an optional "otherwise" branch.',
  },
  {
    type: 'for_each',
    category: 'control',
    isCBlock: true,
    modes: ['unified', 'game', 'animation', 'website'],
    labelParts: ['for each ', { arg: 'varName' }, ' in list ', { arg: 'listName' }],
    args: [
      { name: 'varName', type: 'text', defaultValue: 'item' },
      { name: 'listName', type: 'list', defaultValue: 'inventory' },
    ],
    description: 'Loops over every item in a list.',
  },
  {
    type: 'broadcast',
    category: 'control',
    modes: ['unified', 'game', 'animation', 'website'],
    labelParts: ['send message ', { arg: 'msg' }],
    args: [{ name: 'msg', type: 'text', defaultValue: 'go' }],
    description: 'Broadcasts a message to trigger "when I hear message" scripts.',
  },
  {
    type: 'switch_scene',
    category: 'control',
    modes: ['unified', 'game', 'animation', 'website'],
    labelParts: ['go to scene ', { arg: 'scene' }],
    args: [{ name: 'scene', type: 'scene', defaultValue: 'Scene 1' }],
    description: 'Switches to another game level, animation scene, or webpage.',
  },
  {
    type: 'spawn_copy',
    category: 'control',
    modes: ['unified', 'game', 'animation'],
    labelParts: ['spawn a copy of ', { arg: 'target' }, ' at ', { arg: 'origin' }],
    args: [
      { name: 'target', type: 'entity', defaultValue: 'this' },
      { name: 'origin', type: 'entity', defaultValue: 'this' },
    ],
    description: 'Creates a live clone (bullets, enemies, snowflakes, coins).',
  },
  {
    type: 'delete_copy',
    category: 'control',
    modes: ['unified', 'game', 'animation'],
    labelParts: ['delete this copy'],
    args: [],
    description: 'Removes the active clone when done.',
  },
  {
    type: 'run_action',
    category: 'control',
    modes: ['unified', 'game', 'animation', 'website'],
    labelParts: ['run custom action ', { arg: 'name' }],
    args: [{ name: 'name', type: 'text', defaultValue: 'celebrate' }],
    description: 'Calls a custom action defined with "define custom action".',
  },
  {
    type: 'stop_scripts',
    category: 'control',
    modes: ['unified', 'game', 'animation', 'website'],
    labelParts: ['stop ', { arg: 'scope' }],
    args: [
      { name: 'scope', type: 'select', defaultValue: 'this script', options: ['this script', 'all scripts', 'other scripts'] },
    ],
    description: 'Stops the current script or pauses the whole project.',
  },

  // ================= SOUND & MUSIC =================
  {
    type: 'play_sound',
    category: 'sound',
    modes: ['unified', 'game', 'animation', 'website'],
    labelParts: ['play sound effect ', { arg: 'sfx' }],
    args: [{ name: 'sfx', type: 'sound', defaultValue: 'coin', options: SOUND_OPTIONS }],
    description: 'Plays a crisp built-in Web Audio sound effect (works offline!).',
  },
  {
    type: 'play_note',
    category: 'sound',
    modes: ['unified', 'game', 'animation', 'website'],
    labelParts: ['play note ', { arg: 'note' }, ' for ', { arg: 'sec' }, ' sec on ', { arg: 'instrument' }],
    args: [
      { name: 'note', type: 'note', defaultValue: 'C4', options: NOTE_OPTIONS },
      { name: 'sec', type: 'number', defaultValue: 0.25 },
      { name: 'instrument', type: 'instrument', defaultValue: 'synth', options: ['synth', 'piano', 'chiptune', 'bass'] },
    ],
    description: 'Synthesizes musical notes cleanly in any browser.',
  },
  {
    type: 'set_volume',
    category: 'sound',
    modes: ['unified', 'game', 'animation', 'website'],
    labelParts: ['set sound volume to ', { arg: 'vol' }, '%'],
    args: [{ name: 'vol', type: 'number', defaultValue: 80 }],
    description: 'Sets master volume from 0% to 100%.',
  },

  // ================= DATA & LISTS =================
  {
    type: 'set_var',
    category: 'data',
    modes: ['unified', 'game', 'animation', 'website'],
    labelParts: ['set ', { arg: 'var' }, ' to ', { arg: 'value' }],
    args: [
      { name: 'var', type: 'variable', defaultValue: 'score' },
      { name: 'value', type: 'text', defaultValue: '0' },
    ],
    description: 'Sets a variable to a number, text, or expression (e.g. score + 10).',
  },
  {
    type: 'change_var',
    category: 'data',
    modes: ['unified', 'game', 'animation', 'website'],
    labelParts: ['change ', { arg: 'var' }, ' by ', { arg: 'delta' }],
    args: [
      { name: 'var', type: 'variable', defaultValue: 'score' },
      { name: 'delta', type: 'number', defaultValue: 1 },
    ],
    description: 'Adds or subtracts a number from a variable.',
  },
  {
    type: 'save_storage',
    category: 'data',
    modes: ['unified', 'game', 'website'],
    labelParts: ['save ', { arg: 'var' }, ' to browser storage'],
    args: [{ name: 'var', type: 'variable', defaultValue: 'highScore' }],
    description: 'Persists a variable in localStorage so high scores or preferences stay saved.',
  },
  {
    type: 'load_storage',
    category: 'data',
    modes: ['unified', 'game', 'website'],
    labelParts: ['load ', { arg: 'var' }, ' from browser storage default ', { arg: 'fallback' }],
    args: [
      { name: 'var', type: 'variable', defaultValue: 'highScore' },
      { name: 'fallback', type: 'text', defaultValue: '0' },
    ],
    description: 'Loads a saved variable from localStorage with a fallback.',
  },
  {
    type: 'list_add',
    category: 'data',
    modes: ['unified', 'game', 'animation', 'website'],
    labelParts: ['add ', { arg: 'item' }, ' to list ', { arg: 'list' }],
    args: [
      { name: 'item', type: 'text', defaultValue: 'Star' },
      { name: 'list', type: 'list', defaultValue: 'inventory' },
    ],
    description: 'Appends an item (or {variable} value) to a list.',
  },
  {
    type: 'list_remove',
    category: 'data',
    modes: ['unified', 'game', 'animation', 'website'],
    labelParts: ['remove item #', { arg: 'index' }, ' from list ', { arg: 'list' }],
    args: [
      { name: 'index', type: 'number', defaultValue: 1 },
      { name: 'list', type: 'list', defaultValue: 'inventory' },
    ],
    description: 'Removes an item from a list (1-indexed like Scratch).',
  },
  {
    type: 'list_clear',
    category: 'data',
    modes: ['unified', 'game', 'animation', 'website'],
    labelParts: ['clear list ', { arg: 'list' }],
    args: [{ name: 'list', type: 'list', defaultValue: 'inventory' }],
    description: 'Empties all items from a list.',
  },
  {
    type: 'log_note',
    category: 'data',
    modes: ['unified', 'game', 'animation', 'website'],
    labelParts: ['print to console ', { arg: 'text' }],
    args: [{ name: 'text', type: 'text', defaultValue: 'Score is {score}' }],
    description: 'Logs text or {variable} values to the runtime console.',
  },

  // ================= WEBSITE & UI =================
  {
    type: 'set_theme',
    category: 'web',
    modes: ['unified', 'website'],
    labelParts: ['set page theme to ', { arg: 'theme' }],
    args: [{ name: 'theme', type: 'select', defaultValue: 'dark-modern', options: THEME_OPTIONS }],
    description: 'Switches the website visual theme dynamically (great for Dark Mode toggles!).',
  },
  {
    type: 'set_web_text',
    category: 'web',
    modes: ['unified', 'website', 'game'],
    labelParts: ['set text of ', { arg: 'target' }, ' to ', { arg: 'text' }],
    args: [
      { name: 'target', type: 'entity', defaultValue: 'heroTitle' },
      { name: 'text', type: 'text', defaultValue: 'Welcome, {visitor}!' },
    ],
    description: 'Updates a website heading, button, paragraph, or badge dynamically.',
  },
  {
    type: 'set_web_style',
    category: 'web',
    modes: ['unified', 'website'],
    labelParts: [
      'style ',
      { arg: 'target' },
      ' bg ',
      { arg: 'bgColor' },
      ' text ',
      { arg: 'textColor' },
      ' rounded ',
      { arg: 'rounded' },
      'px',
    ],
    args: [
      { name: 'target', type: 'entity', defaultValue: 'ctaBtn' },
      { name: 'bgColor', type: 'color', defaultValue: '#6366f1' },
      { name: 'textColor', type: 'color', defaultValue: '#ffffff' },
      { name: 'rounded', type: 'number', defaultValue: 12 },
    ],
    description: 'Changes colors and corner radius of any website component at runtime.',
  },
  {
    type: 'add_web_element',
    category: 'web',
    modes: ['unified', 'website'],
    labelParts: ['create ', { arg: 'webType' }, ' named ', { arg: 'name' }, ' saying ', { arg: 'text' }],
    args: [
      { name: 'webType', type: 'select', defaultValue: 'button', options: ['heading', 'paragraph', 'button', 'input', 'card', 'badge'] },
      { name: 'name', type: 'text', defaultValue: 'dynamicItem' },
      { name: 'text', type: 'text', defaultValue: 'Click Me' },
    ],
    description: 'Dynamically spawns a new website element into the active page.',
  },
  {
    type: 'remove_web_element',
    category: 'web',
    modes: ['unified', 'website'],
    labelParts: ['remove web element ', { arg: 'target' }],
    args: [{ name: 'target', type: 'entity', defaultValue: 'dynamicItem' }],
    description: 'Deletes a dynamically created or existing website element.',
  },
  {
    type: 'open_url',
    category: 'web',
    modes: ['unified', 'website'],
    labelParts: ['open link ', { arg: 'url' }],
    args: [{ name: 'url', type: 'text', defaultValue: 'https://unlicense.org' }],
    description: 'Opens an external URL in a new browser tab.',
  },
  {
    type: 'show_toast',
    category: 'web',
    modes: ['unified', 'website', 'game', 'animation'],
    labelParts: ['show alert banner ', { arg: 'text' }, ' style ', { arg: 'tone' }],
    args: [
      { name: 'text', type: 'text', defaultValue: 'Saved successfully!' },
      { name: 'tone', type: 'select', defaultValue: 'success', options: ['info', 'success', 'warning'] },
    ],
    description: 'Shows a clean toast notification banner on the page/stage.',
  },
  {
    type: 'ask_prompt',
    category: 'web',
    modes: ['unified', 'website', 'game'],
    labelParts: ['ask user ', { arg: 'question' }, ' save answer to ', { arg: 'var' }],
    args: [
      { name: 'question', type: 'text', defaultValue: 'What is your name?' },
      { name: 'var', type: 'variable', defaultValue: 'playerName' },
    ],
    description: 'Prompts the user with a question and stores their answer in a variable.',
  },
];

const BLOCK_MAP = new Map<string, BlockDefinition>(
  BLOCK_DEFINITIONS.map((def) => [def.type, def])
);

export function getBlockDefinition(type: string): BlockDefinition | undefined {
  return BLOCK_MAP.get(type);
}

export function createBlockNode(
  type: string,
  overrides: Record<string, ArgValue> = {},
  body?: BlockNode[],
  elseBody?: BlockNode[]
): BlockNode {
  const def = BLOCK_MAP.get(type);
  const args: Record<string, ArgValue> = {};
  if (def) {
    for (const arg of def.args) {
      args[arg.name] = arg.defaultValue;
    }
  }
  for (const [k, v] of Object.entries(overrides)) {
    args[k] = v;
  }
  const node: BlockNode = {
    id: makeId('blk'),
    type,
    args,
  };
  if (def?.isCBlock) {
    node.body = body ?? [];
    if (def.hasElse) {
      node.elseBody = elseBody ?? [];
    }
  }
  return node;
}

export function cloneBlockNode(node: BlockNode): BlockNode {
  return {
    id: makeId('blk'),
    type: node.type,
    args: { ...node.args },
    body: node.body ? node.body.map(cloneBlockNode) : undefined,
    elseBody: node.elseBody ? node.elseBody.map(cloneBlockNode) : undefined,
  };
}
