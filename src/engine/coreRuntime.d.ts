import type { OpenScratchProject, RuntimeSnapshot } from '../types/project';

export interface RuntimeHooks {
  onSnapshot?: (snapshot: RuntimeSnapshot) => void;
  onPrompt?: (question: string) => Promise<string>;
}

export declare class SoundSynth {
  volume: number;
  setVolume(pct: number): void;
  playSfx(name: string): void;
  playNote(note: string, sec?: number, instrument?: string): void;
}

export declare function evaluateExpression(
  expr: unknown,
  runtime: OpenScratchRuntime,
  selfId?: string | null
): unknown;

export declare function interpolateText(
  template: string,
  runtime: OpenScratchRuntime,
  selfId?: string | null
): string;

export declare class OpenScratchRuntime {
  running: boolean;
  runId: number;
  activeSceneId: string;
  theme: string;
  variables: Record<string, string | number | boolean>;
  lists: Record<string, (string | number)[]>;
  entities: any[];
  keysDown: Set<string>;
  mouse: { x: number; y: number; down: boolean };
  sound: SoundSynth;
  logs: any[];

  constructor(project: OpenScratchProject, hooks?: RuntimeHooks);
  resetState(emit?: boolean): void;
  updateProject(project: OpenScratchProject): void;
  attachDOM(canvasEl: HTMLCanvasElement | null, webRootEl: HTMLElement | null): void;
  detachDOM(): void;
  start(): void;
  stop(): void;
  stepFrame(dt: number, currentRun?: number): void;
  executeBlockList(blocks: any[], selfId: string | null, runId: number): Promise<void>;
  executeBlock(blk: any, selfId: string | null, runId: number): Promise<void>;
  triggerKeyHat(keyNorm: string, mode: string): void;
  triggerClickHat(entity: any): void;
  isKeyDown(keyName: string): boolean;
  checkTouching(refA: string, refB: string, selfId?: string | null): boolean;
  getSnapshot(): RuntimeSnapshot;
  emitSnapshot(): void;
  renderCanvas(): void;
  renderWebLayer(force?: boolean): void;
}
