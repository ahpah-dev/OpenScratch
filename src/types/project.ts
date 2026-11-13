export type ProjectMode = 'unified' | 'game' | 'animation' | 'website';

export type SceneBackgroundType =
  | 'color'
  | 'gradient'
  | 'sky'
  | 'space'
  | 'sunset'
  | 'grid';

export type PageTheme =
  | 'dark-modern'
  | 'clean-light'
  | 'pastel-pop'
  | 'retro-arcade'
  | 'ocean-glass';

export interface SceneBackground {
  type: SceneBackgroundType;
  color1: string;
  color2: string;
  stars?: boolean;
  grid?: boolean;
}

export interface Scene {
  id: string;
  name: string;
  background: SceneBackground;
  theme: PageTheme;
}

export interface Costume {
  id: string;
  name: string;
  kind: 'emoji' | 'preset' | 'svg';
  value: string;
  color?: string;
}

export interface PhysicsConfig {
  enabled: boolean;
  mode: 'none' | 'platformer' | 'topdown' | 'bounce';
  speed: number;
  jumpForce: number;
  gravity: number;
  solid: boolean;
  bounceEdges: boolean;
}

export type WebElementType =
  | 'heading'
  | 'paragraph'
  | 'button'
  | 'input'
  | 'card'
  | 'badge'
  | 'nav'
  | 'divider'
  | 'spacer';

export interface WebStyle {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'glass';
  bgColor?: string;
  textColor?: string;
  align?: 'left' | 'center' | 'right';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  rounded?: number;
  width?: 'auto' | 'full' | 'half';
}

export interface Entity {
  id: string;
  name: string;
  kind: 'sprite' | 'web';
  sceneId: string; // 'global' or specific scene id
  visible: boolean;
  // Sprite properties
  x: number;
  y: number;
  size: number;
  rotation: number; // visual rotation degrees, 0 = upright
  opacity: number; // 0..100
  layer: number;
  costumes: Costume[];
  activeCostumeIndex: number;
  physics: PhysicsConfig;
  // Web properties
  webType?: WebElementType;
  text?: string;
  subtext?: string;
  icon?: string;
  href?: string;
  bindVar?: string;
  webStyle?: WebStyle;
}

export type BlockCategory =
  | 'events'
  | 'motion'
  | 'animation'
  | 'control'
  | 'sound'
  | 'data'
  | 'web';

export type ArgValue = string | number | boolean;

export interface BlockNode {
  id: string;
  type: string;
  args: Record<string, ArgValue>;
  body?: BlockNode[];
  elseBody?: BlockNode[];
}

export interface ScriptStack {
  id: string;
  targetId: string; // 'stage' or entity.id
  enabled: boolean;
  hat: BlockNode;
  body: BlockNode[];
}

export interface OpenScratchProject {
  version: 1;
  id: string;
  title: string;
  mode: ProjectMode;
  activeSceneId: string;
  scenes: Scene[];
  entities: Entity[];
  variables: Record<string, ArgValue>;
  lists: Record<string, (string | number)[]>;
  scripts: ScriptStack[];
}

export type ArgType =
  | 'entity'
  | 'entityOrMouse'
  | 'number'
  | 'text'
  | 'key'
  | 'sound'
  | 'instrument'
  | 'note'
  | 'ease'
  | 'color'
  | 'scene'
  | 'variable'
  | 'list'
  | 'condition'
  | 'select';

export interface ArgSchema {
  name: string;
  type: ArgType;
  defaultValue: ArgValue;
  options?: string[];
  placeholder?: string;
}

export interface BlockDefinition {
  type: string;
  category: BlockCategory;
  isHat?: boolean;
  isCBlock?: boolean;
  hasElse?: boolean;
  modes: ProjectMode[];
  labelParts: (string | { arg: string })[];
  args: ArgSchema[];
  description: string;
}

export interface RuntimeLogEntry {
  id: string;
  time: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

export interface RuntimeToast {
  id: string;
  text: string;
  tone: 'info' | 'success' | 'warning';
}

export interface RuntimeSnapshot {
  running: boolean;
  activeSceneId: string;
  theme: PageTheme;
  variables: Record<string, ArgValue>;
  lists: Record<string, (string | number)[]>;
  camera: {
    x: number;
    y: number;
    zoom: number;
    shake: number;
  };
  toasts: RuntimeToast[];
  logs: RuntimeLogEntry[];
  fps: number;
}
