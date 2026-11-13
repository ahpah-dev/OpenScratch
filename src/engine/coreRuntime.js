// OpenScratch Core Runtime Engine (Unlicense / Public Domain)
// Shared 1:1 between the OpenScratch Web Studio and standalone exported HTML files.

const NOTE_FREQS = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0, B5: 987.77,
};

const PRESET_COLORS = {
  hero: '#6366f1',
  robot: '#38bdf8',
  rocket: '#f43f5e',
  coin: '#fbbf24',
  gem: '#2dd4bf',
  slime: '#4ade80',
  ghost: '#e2e8f0',
  star: '#fde047',
  platform: '#475569',
  alien: '#a855f7',
};

const THEME_STYLES = {
  'dark-modern': {
    bg: 'linear-gradient(160deg, #090d1a 0%, #111827 60%, #1e1b4b 100%)',
    text: '#f8fafc',
    muted: '#94a3b8',
    surface: 'rgba(30, 41, 59, 0.72)',
    border: 'rgba(148, 163, 184, 0.22)',
    accent: '#6366f1',
    accentText: '#ffffff',
    font: "'Inter', system-ui, sans-serif",
  },
  'clean-light': {
    bg: 'linear-gradient(160deg, #f8fafc 0%, #eef2ff 100%)',
    text: '#0f172a',
    muted: '#475569',
    surface: 'rgba(255, 255, 255, 0.9)',
    border: 'rgba(15, 23, 42, 0.12)',
    accent: '#4f46e5',
    accentText: '#ffffff',
    font: "'Inter', system-ui, sans-serif",
  },
  'pastel-pop': {
    bg: 'linear-gradient(145deg, #fff1f2 0%, #fdf4ff 50%, #ecfeff 100%)',
    text: '#1e1b4b',
    muted: '#6b7280',
    surface: 'rgba(255, 255, 255, 0.85)',
    border: 'rgba(236, 72, 153, 0.25)',
    accent: '#ec4899',
    accentText: '#ffffff',
    font: "'Nunito', system-ui, sans-serif",
  },
  'retro-arcade': {
    bg: 'linear-gradient(180deg, #090414 0%, #1a0b2e 100%)',
    text: '#fde047',
    muted: '#67e8f9',
    surface: 'rgba(20, 10, 45, 0.88)',
    border: 'rgba(56, 189, 248, 0.45)',
    accent: '#f43f5e',
    accentText: '#ffffff',
    font: "'JetBrains Mono', monospace",
  },
  'ocean-glass': {
    bg: 'linear-gradient(160deg, #042f2e 0%, #0f172a 55%, #0c4a6e 100%)',
    text: '#ecfeff',
    muted: '#99f6e4',
    surface: 'rgba(15, 23, 42, 0.56)',
    border: 'rgba(45, 212, 191, 0.3)',
    accent: '#14b8a6',
    accentText: '#042f2e',
    font: "'Inter', system-ui, sans-serif",
  },
};

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function normalizeKey(raw) {
  if (!raw) return '';
  const k = String(raw).toLowerCase();
  if (k === ' ') return 'space';
  if (k === 'arrowup') return 'up arrow';
  if (k === 'arrowdown') return 'down arrow';
  if (k === 'arrowleft') return 'left arrow';
  if (k === 'arrowright') return 'right arrow';
  return k;
}

function easeValue(t, ease) {
  const x = Math.max(0, Math.min(1, t));
  switch (ease) {
    case 'linear':
      return x;
    case 'ease-in':
      return x * x * x;
    case 'ease-out':
      return 1 - Math.pow(1 - x, 3);
    case 'bounce': {
      const n1 = 7.5625;
      const d1 = 2.75;
      let v = x;
      if (v < 1 / d1) return n1 * v * v;
      if (v < 2 / d1) return n1 * (v -= 1.5 / d1) * v + 0.75;
      if (v < 2.5 / d1) return n1 * (v -= 2.25 / d1) * v + 0.9375;
      return n1 * (v -= 2.625 / d1) * v + 0.984375;
    }
    case 'elastic': {
      if (x === 0 || x === 1) return x;
      const c4 = (2 * Math.PI) / 3;
      return Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
    }
    case 'smooth':
    default:
      return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }
}

export class SoundSynth {
  constructor() {
    this.ctx = null;
    this.volume = 0.8;
  }

  ensureCtx() {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  setVolume(pct) {
    this.volume = Math.max(0, Math.min(1, Number(pct) / 100));
  }

  tone(freqStart, freqEnd, duration, type = 'sine', gainPeak = 0.25, delay = 0) {
    const ctx = this.ensureCtx();
    if (!ctx || this.volume <= 0) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(40, freqStart), now);
    if (freqEnd !== freqStart) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), now + duration);
    }
    const peak = Math.max(0.001, gainPeak * this.volume);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peak, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playSfx(name) {
    switch (String(name).toLowerCase()) {
      case 'coin':
        this.tone(987.77, 987.77, 0.08, 'square', 0.14, 0);
        this.tone(1318.51, 1318.51, 0.22, 'square', 0.14, 0.07);
        break;
      case 'jump':
        this.tone(240, 620, 0.18, 'triangle', 0.24, 0);
        break;
      case 'laser':
        this.tone(920, 180, 0.16, 'sawtooth', 0.16, 0);
        break;
      case 'hit':
        this.tone(170, 55, 0.18, 'sawtooth', 0.28, 0);
        break;
      case 'powerup':
        this.tone(440, 440, 0.08, 'triangle', 0.2, 0);
        this.tone(554.37, 554.37, 0.08, 'triangle', 0.2, 0.07);
        this.tone(659.25, 659.25, 0.08, 'triangle', 0.2, 0.14);
        this.tone(880, 880, 0.2, 'triangle', 0.22, 0.21);
        break;
      case 'pop':
        this.tone(360, 720, 0.07, 'sine', 0.22, 0);
        break;
      case 'click':
        this.tone(680, 420, 0.04, 'triangle', 0.15, 0);
        break;
      case 'win':
        this.tone(523.25, 523.25, 0.1, 'triangle', 0.22, 0);
        this.tone(659.25, 659.25, 0.1, 'triangle', 0.22, 0.1);
        this.tone(783.99, 783.99, 0.1, 'triangle', 0.22, 0.2);
        this.tone(1046.5, 1046.5, 0.35, 'triangle', 0.25, 0.3);
        break;
      case 'lose':
        this.tone(392, 330, 0.15, 'sawtooth', 0.16, 0);
        this.tone(311, 220, 0.3, 'sawtooth', 0.16, 0.16);
        break;
      case 'whoosh':
        this.tone(420, 140, 0.22, 'sine', 0.16, 0);
        break;
      default:
        this.tone(520, 520, 0.1, 'sine', 0.18, 0);
    }
  }

  playNote(note, sec = 0.25, instrument = 'synth') {
    const freq = NOTE_FREQS[String(note).toUpperCase()] || 440;
    const typeMap = {
      synth: 'sawtooth',
      piano: 'triangle',
      chiptune: 'square',
      bass: 'sine',
    };
    const wave = typeMap[instrument] || 'triangle';
    const f = instrument === 'bass' ? freq * 0.5 : freq;
    this.tone(f, f, Math.max(0.05, Number(sec) || 0.25), wave, 0.2, 0);
  }
}

// Safe recursive-descent expression & condition evaluator (no eval/Function)
function tokenizeExpr(expr) {
  const tokens = [];
  let i = 0;
  const s = String(expr);
  while (i < s.length) {
    const ch = s[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    // Two-char operators
    const two = s.slice(i, i + 2);
    if (['==', '!=', '<=', '>=', '&&', '||', '<>'].includes(two)) {
      tokens.push({ type: 'op', val: two === '<>' ? '!=' : two });
      i += 2;
      continue;
    }
    if ('+-*/%()<>!,='.includes(ch)) {
      tokens.push({ type: ch === '(' || ch === ')' || ch === ',' ? 'punc' : 'op', val: ch === '=' ? '==' : ch });
      i++;
      continue;
    }
    if (ch === '"' || ch === "'") {
      const quote = ch;
      i++;
      let str = '';
      while (i < s.length && s[i] !== quote) {
        if (s[i] === '\\' && i + 1 < s.length) {
          i++;
          str += s[i];
        } else {
          str += s[i];
        }
        i++;
      }
      i++;
      tokens.push({ type: 'str', val: str });
      continue;
    }
    if (/\d/.test(ch) || (ch === '.' && /\d/.test(s[i + 1] || ''))) {
      let numStr = '';
      while (i < s.length && /[\d.]/.test(s[i])) {
        numStr += s[i++];
      }
      tokens.push({ type: 'num', val: Number(numStr) });
      continue;
    }
    if (/[a-zA-Z_$]/.test(ch)) {
      let id = '';
      while (i < s.length && /[a-zA-Z0-9_$.]/.test(s[i])) {
        id += s[i++];
      }
      const lower = id.toLowerCase();
      if (lower === 'and') tokens.push({ type: 'op', val: '&&' });
      else if (lower === 'or') tokens.push({ type: 'op', val: '||' });
      else if (lower === 'not') tokens.push({ type: 'op', val: '!' });
      else if (lower === 'contains') tokens.push({ type: 'op', val: 'contains' });
      else if (lower === 'touches') tokens.push({ type: 'op', val: 'touches' });
      else if (lower === 'true') tokens.push({ type: 'bool', val: true });
      else if (lower === 'false') tokens.push({ type: 'bool', val: false });
      else tokens.push({ type: 'id', val: id });
      continue;
    }
    i++;
  }
  return tokens;
}

export function evaluateExpression(expr, runtime, selfId = null) {
  if (typeof expr === 'number' || typeof expr === 'boolean') return expr;
  const raw = String(expr ?? '').trim();
  if (!raw) return '';

  // Natural language shortcuts
  const keyMatch = raw.match(/^(?:key\s+)?["']?([a-z0-9 ]+?)["']?\s+(?:key\s+)?is\s+pressed$/i);
  if (keyMatch) {
    return runtime.isKeyDown(keyMatch[1].trim());
  }
  if (/^mouse\s+is\s+down$/i.test(raw)) {
    return Boolean(runtime.mouse.down);
  }
  const randomPhrase = raw.match(/^random\s+(-?\d+(?:\.\d+)?)\s+to\s+(-?\d+(?:\.\d+)?)$/i);
  if (randomPhrase) {
    const min = Number(randomPhrase[1]);
    const max = Number(randomPhrase[2]);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // If plain string without operators/parens and not a variable/property/number, return string literal if quoted or check var
  const tokens = tokenizeExpr(raw);
  if (tokens.length === 0) return raw;

  let pos = 0;
  const peek = () => tokens[pos];
  const consume = () => tokens[pos++];

  function resolveId(name) {
    const lower = name.toLowerCase();
    if (lower === 'timer') return Number(((Date.now() - runtime.startTime) / 1000).toFixed(2));
    if (lower === 'mouse.x') return Math.round(runtime.mouse.x);
    if (lower === 'mouse.y') return Math.round(runtime.mouse.y);
    if (lower === 'mouse.down') return runtime.mouse.down;
    if (lower === 'scene') return runtime.getActiveScene()?.name ?? '';

    if (name.includes('.')) {
      const [objName, prop] = name.split('.');
      if (objName in runtime.lists && prop === 'length') {
        return runtime.lists[objName].length;
      }
      const ent = runtime.resolveEntity(objName, selfId);
      if (ent) {
        if (prop === 'x') return ent.x;
        if (prop === 'y') return ent.y;
        if (prop === 'size') return ent.size;
        if (prop === 'rotation') return ent.rotation;
        if (prop === 'opacity') return ent.opacity;
        if (prop === 'visible') return ent.visible;
        if (prop === 'text') return ent.text ?? '';
      }
    }

    if (name in runtime.variables) return runtime.variables[name];
    // Case-insensitive variable fallback
    const varKey = Object.keys(runtime.variables).find((k) => k.toLowerCase() === lower);
    if (varKey) return runtime.variables[varKey];

    // If matching an entity name directly (e.g. Hero touches Coin)
    const ent = runtime.resolveEntity(name, selfId);
    if (ent) return ent.name;

    return name;
  }

  function parsePrimary() {
    const t = peek();
    if (!t) return 0;
    if (t.type === 'num' || t.type === 'str' || t.type === 'bool') {
      consume();
      return t.val;
    }
    if (t.type === 'punc' && t.val === '(') {
      consume();
      const val = parseOr();
      if (peek()?.val === ')') consume();
      return val;
    }
    if (t.type === 'id') {
      consume();
      if (peek()?.type === 'punc' && peek()?.val === '(') {
        consume();
        const args = [];
        while (peek() && peek().val !== ')') {
          args.push(parseOr());
          if (peek()?.val === ',') consume();
        }
        if (peek()?.val === ')') consume();
        const fn = t.val.toLowerCase();
        if (fn === 'random') {
          const min = Number(args[0] ?? 1);
          const max = Number(args[1] ?? 10);
          return Math.floor(Math.random() * (max - min + 1)) + min;
        }
        if (fn === 'round') return Math.round(Number(args[0] ?? 0));
        if (fn === 'floor') return Math.floor(Number(args[0] ?? 0));
        if (fn === 'ceil') return Math.ceil(Number(args[0] ?? 0));
        if (fn === 'abs') return Math.abs(Number(args[0] ?? 0));
        if (fn === 'sqrt') return Math.sqrt(Math.max(0, Number(args[0] ?? 0)));
        if (fn === 'sin') return Math.sin((Number(args[0] ?? 0) * Math.PI) / 180);
        if (fn === 'cos') return Math.cos((Number(args[0] ?? 0) * Math.PI) / 180);
        if (fn === 'length') {
          const v = args[0];
          if (typeof v === 'string' && v in runtime.lists) return runtime.lists[v].length;
          return String(v ?? '').length;
        }
        if (fn === 'item') {
          const listName = String(args[0] ?? '');
          const idx = Math.max(1, Number(args[1] ?? 1)) - 1;
          return runtime.lists[listName]?.[idx] ?? '';
        }
        if (fn === 'touching') {
          return runtime.checkTouching(String(args[0] ?? 'this'), String(args[1] ?? ''), selfId);
        }
        if (fn === 'keypressed') {
          return runtime.isKeyDown(String(args[0] ?? 'space'));
        }
        if (fn === 'distance') {
          const a = runtime.resolveEntity(String(args[0] ?? 'this'), selfId);
          const b = runtime.resolveEntity(String(args[1] ?? 'mouse'), selfId);
          if (!a) return 9999;
          const bx = String(args[1]).toLowerCase() === 'mouse' ? runtime.mouse.x : b?.x ?? 0;
          const by = String(args[1]).toLowerCase() === 'mouse' ? runtime.mouse.y : b?.y ?? 0;
          return Math.hypot(a.x - bx, a.y - by);
        }
        return 0;
      }
      return resolveId(t.val);
    }
    consume();
    return 0;
  }

  function parseUnary() {
    const t = peek();
    if (t?.type === 'op' && (t.val === '-' || t.val === '+' || t.val === '!')) {
      consume();
      const val = parseUnary();
      if (t.val === '-') return -Number(val);
      if (t.val === '+') return Number(val);
      return !val;
    }
    return parsePrimary();
  }

  function parseMul() {
    let left = parseUnary();
    while (peek()?.type === 'op' && ['*', '/', '%'].includes(peek().val)) {
      const op = consume().val;
      const right = parseUnary();
      if (op === '*') left = Number(left) * Number(right);
      else if (op === '/') left = Number(right) === 0 ? 0 : Number(left) / Number(right);
      else left = Number(right) === 0 ? 0 : Number(left) % Number(right);
    }
    return left;
  }

  function parseAdd() {
    let left = parseMul();
    while (peek()?.type === 'op' && ['+', '-'].includes(peek().val)) {
      const op = consume().val;
      const right = parseMul();
      if (op === '+') {
        if (typeof left === 'string' && isNaN(Number(left))) left = left + String(right);
        else if (typeof right === 'string' && isNaN(Number(right))) left = String(left) + right;
        else left = Number(left) + Number(right);
      } else {
        left = Number(left) - Number(right);
      }
    }
    return left;
  }

  function parseCompare() {
    let left = parseAdd();
    while (
      peek()?.type === 'op' &&
      ['==', '!=', '<', '<=', '>', '>=', 'contains', 'touches'].includes(peek().val)
    ) {
      const op = consume().val;
      const right = parseAdd();
      if (op === 'touches') {
        left = runtime.checkTouching(String(left), String(right), selfId);
      } else if (op === 'contains') {
        if (typeof left === 'string' && left in runtime.lists) {
          left = runtime.lists[left].some((it) => String(it).toLowerCase() === String(right).toLowerCase());
        } else {
          left = String(left).toLowerCase().includes(String(right).toLowerCase());
        }
      } else if (op === '==') {
        const ln = Number(left);
        const rn = Number(right);
        left = !isNaN(ln) && !isNaN(rn) && String(left) !== '' && String(right) !== ''
          ? ln === rn
          : String(left) === String(right);
      } else if (op === '!=') {
        const ln = Number(left);
        const rn = Number(right);
        left = !isNaN(ln) && !isNaN(rn) && String(left) !== '' && String(right) !== ''
          ? ln !== rn
          : String(left) !== String(right);
      } else if (op === '<') left = Number(left) < Number(right);
      else if (op === '<=') left = Number(left) <= Number(right);
      else if (op === '>') left = Number(left) > Number(right);
      else if (op === '>=') left = Number(left) >= Number(right);
    }
    return left;
  }

  function parseAnd() {
    let left = parseCompare();
    while (peek()?.type === 'op' && peek().val === '&&') {
      consume();
      const right = parseCompare();
      left = Boolean(left) && Boolean(right);
    }
    return left;
  }

  function parseOr() {
    let left = parseAnd();
    while (peek()?.type === 'op' && peek().val === '||') {
      consume();
      const right = parseAnd();
      left = Boolean(left) || Boolean(right);
    }
    return left;
  }

  try {
    const result = parseOr();
    if (pos < tokens.length) {
      return raw;
    }
    return result;
  } catch {
    return raw;
  }
}

export function interpolateText(template, runtime, selfId = null) {
  const s = String(template ?? '');
  return s.replace(/\{([^{}]+)\}/g, (_, key) => {
    const k = key.trim();
    const val = evaluateExpression(k, runtime, selfId);
    return val === undefined || val === null ? '' : String(val);
  });
}

export class OpenScratchRuntime {
  constructor(project, hooks = {}) {
    this.baseProject = deepClone(project);
    this.hooks = hooks; // { onSnapshot, onPrompt }
    this.sound = new SoundSynth();

    this.running = false;
    this.runId = 0;
    this.startTime = Date.now();
    this.lastFrameTime = 0;
    this.rafId = null;
    this.fps = 60;

    this.canvas = null;
    this.ctx = null;
    this.webRoot = null;

    this.keysDown = new Set();
    this.mouse = { x: 0, y: 0, down: false };

    this.resetState(false);
  }

  resetState(emit = true) {
    const p = deepClone(this.baseProject);
    this.activeSceneId = p.activeSceneId || p.scenes[0]?.id || 'scene_1';
    this.scenes = p.scenes || [];
    this.entities = (p.entities || []).map((e) => ({
      ...e,
      isClone: false,
      vx: 0,
      vy: 0,
      grounded: false,
      sayText: '',
      sayUntil: 0,
      trail: false,
      trailColor: '#38bdf8',
      trailSize: 4,
    }));
    this.variables = { ...(p.variables || {}) };
    this.lists = deepClone(p.lists || {});
    this.scripts = p.scripts || [];

    this.theme = this.getActiveScene()?.theme || 'dark-modern';
    this.camera = { x: 0, y: 0, zoom: 100, shake: 0, shakeUntil: 0, followId: null };
    this.particles = [];
    this.trailSegments = [];
    this.toasts = [];
    this.logs = [];
    this.edgeTriggerStates = new Map();
    this.touchStates = new Set();
    this.everyTimers = new Map();
    this.lastWebRenderKey = '';

    this.renderWebLayer(true);
    this.renderCanvas();
    if (emit) this.emitSnapshot();
  }

  updateProject(project) {
    const wasRunning = this.running;
    if (wasRunning) this.stop();
    this.baseProject = deepClone(project);
    this.resetState(true);
    if (wasRunning) this.start();
  }

  attachDOM(canvasEl, webRootEl) {
    this.detachDOM();
    this.canvas = canvasEl;
    this.ctx = canvasEl ? canvasEl.getContext('2d') : null;
    this.webRoot = webRootEl;

    if (typeof window !== 'undefined') {
      this._onKeyDown = (ev) => {
        const tag = ev.target?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        const k = normalizeKey(ev.key);
        if (['space', 'up arrow', 'down arrow', 'left arrow', 'right arrow'].includes(k)) {
          if (this.running) ev.preventDefault();
        }
        const wasDown = this.keysDown.has(k);
        this.keysDown.add(k);
        if (this.running && !wasDown) {
          this.triggerKeyHat(k, 'pressed');
        }
      };
      this._onKeyUp = (ev) => {
        const k = normalizeKey(ev.key);
        this.keysDown.delete(k);
        if (this.running) {
          this.triggerKeyHat(k, 'released');
        }
      };
      window.addEventListener('keydown', this._onKeyDown);
      window.addEventListener('keyup', this._onKeyUp);
    }

    if (this.canvas) {
      this._onPointerMove = (ev) => {
        const pos = this.clientToStage(ev.clientX, ev.clientY);
        this.mouse.x = pos.x;
        this.mouse.y = pos.y;
      };
      this._onPointerDown = (ev) => {
        const pos = this.clientToStage(ev.clientX, ev.clientY);
        this.mouse.x = pos.x;
        this.mouse.y = pos.y;
        this.mouse.down = true;
        if (this.running) {
          this.handleStageClick(pos.x, pos.y);
        }
      };
      this._onPointerUp = () => {
        this.mouse.down = false;
      };
      this.canvas.addEventListener('pointermove', this._onPointerMove);
      this.canvas.addEventListener('pointerdown', this._onPointerDown);
      window.addEventListener('pointerup', this._onPointerUp);
    }

    this.renderWebLayer(true);
    this.renderCanvas();
  }

  detachDOM() {
    if (typeof window !== 'undefined') {
      if (this._onKeyDown) window.removeEventListener('keydown', this._onKeyDown);
      if (this._onKeyUp) window.removeEventListener('keyup', this._onKeyUp);
      if (this._onPointerUp) window.removeEventListener('pointerup', this._onPointerUp);
    }
    if (this.canvas) {
      if (this._onPointerMove) this.canvas.removeEventListener('pointermove', this._onPointerMove);
      if (this._onPointerDown) this.canvas.removeEventListener('pointerdown', this._onPointerDown);
    }
    this.canvas = null;
    this.ctx = null;
    this.webRoot = null;
  }

  clientToStage(clientX, clientY) {
    if (!this.canvas) return { x: 0, y: 0 };
    const rect = this.canvas.getBoundingClientRect();
    const nx = (clientX - rect.left) / Math.max(1, rect.width);
    const ny = (clientY - rect.top) / Math.max(1, rect.height);
    const sx = nx * 800 - 400;
    const sy = 250 - ny * 500;
    const zoom = (this.camera.zoom || 100) / 100;
    return {
      x: sx / zoom + this.camera.x,
      y: sy / zoom + this.camera.y,
    };
  }

  getActiveScene() {
    return this.scenes.find((s) => s.id === this.activeSceneId) || this.scenes[0];
  }

  isEntityInActiveScene(ent) {
    return ent.sceneId === 'global' || ent.sceneId === this.activeSceneId;
  }

  resolveEntity(ref, selfId = null) {
    const r = String(ref ?? 'this').trim();
    if (!r || r.toLowerCase() === 'none') return null;
    if (r.toLowerCase() === 'this') {
      return this.entities.find((e) => e.id === selfId) || null;
    }
    const lower = r.toLowerCase();
    return (
      this.entities.find((e) => !e.isClone && (e.id.toLowerCase() === lower || e.name.toLowerCase() === lower)) ||
      this.entities.find((e) => e.id.toLowerCase() === lower || e.name.toLowerCase() === lower) ||
      null
    );
  }

  resolveEntities(ref, selfId = null) {
    const r = String(ref ?? 'this').trim();
    if (!r || r.toLowerCase() === 'none') return [];
    if (r.toLowerCase() === 'this') {
      const self = this.entities.find((e) => e.id === selfId);
      return self ? [self] : [];
    }
    const lower = r.toLowerCase();
    return this.entities.filter(
      (e) => this.isEntityInActiveScene(e) && (e.id.toLowerCase() === lower || e.name.toLowerCase() === lower)
    );
  }

  isKeyDown(keyName) {
    const norm = normalizeKey(keyName);
    if (norm === 'any') return this.keysDown.size > 0;
    return this.keysDown.has(norm);
  }

  getSpriteBounds(ent) {
    const scale = (ent.size ?? 100) / 100;
    const c = ent.costumes?.[ent.activeCostumeIndex || 0];
    if (c && c.kind === 'preset' && String(c.value).toLowerCase() === 'platform') {
      return { hw: 48 * scale, hh: 12 * scale };
    }
    return { hw: 22 * scale, hh: 22 * scale };
  }

  getSpriteRadius(ent) {
    const b = this.getSpriteBounds(ent);
    return Math.max(b.hw, b.hh);
  }

  checkAABB(a, b) {
    const ba = this.getSpriteBounds(a);
    const bb = this.getSpriteBounds(b);
    return Math.abs(a.x - b.x) < ba.hw + bb.hw && Math.abs(a.y - b.y) < ba.hh + bb.hh;
  }

  checkTouching(refA, refB, selfId = null) {
    const listA = this.resolveEntities(refA, selfId).filter((e) => e.kind === 'sprite' && e.visible);
    const listB = this.resolveEntities(refB, selfId).filter((e) => e.kind === 'sprite' && e.visible);
    for (const a of listA) {
      for (const b of listB) {
        if (a.id !== b.id && this.checkAABB(a, b)) return true;
      }
    }
    return false;
  }

  addLog(level, message) {
    const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.logs = [{ id: `${Date.now()}_${Math.random()}`, time, level, message }, ...this.logs].slice(0, 60);
    this.emitSnapshot();
  }

  showToast(text, tone = 'info') {
    const id = `${Date.now()}_${Math.random()}`;
    this.toasts = [...this.toasts, { id, text: String(text), tone }];
    this.emitSnapshot();
    const myRun = this.runId;
    setTimeout(() => {
      if (this.runId !== myRun) return;
      this.toasts = this.toasts.filter((t) => t.id !== id);
      this.emitSnapshot();
    }, 3200);
  }

  emitSnapshot() {
    if (this.hooks.onSnapshot) {
      this.hooks.onSnapshot(this.getSnapshot());
    }
  }

  getSnapshot() {
    return {
      running: this.running,
      activeSceneId: this.activeSceneId,
      theme: this.theme,
      variables: { ...this.variables },
      lists: deepClone(this.lists),
      camera: { x: this.camera.x, y: this.camera.y, zoom: this.camera.zoom, shake: this.camera.shake },
      toasts: [...this.toasts],
      logs: [...this.logs],
      fps: this.fps,
    };
  }

  start() {
    this.stop();
    this.resetState(false);
    this.running = true;
    this.runId += 1;
    this.startTime = Date.now();
    this.lastFrameTime = performance.now ? performance.now() : Date.now();
    const currentRun = this.runId;

    // Trigger all when_start scripts
    for (const scr of this.scripts) {
      if (scr.enabled && scr.hat.type === 'when_start') {
        this.launchScript(scr, scr.targetId === 'stage' ? null : scr.targetId, currentRun);
      }
    }

    const tick = (now) => {
      if (!this.running || this.runId !== currentRun) return;
      const dtMs = Math.min(50, Math.max(4, now - this.lastFrameTime));
      this.lastFrameTime = now;
      this.fps = Math.round(1000 / dtMs);
      this.stepFrame(dtMs / 1000, currentRun);
      this.renderCanvas();
      this.renderWebLayer(false);
      if (typeof requestAnimationFrame !== 'undefined') {
        this.rafId = requestAnimationFrame(tick);
      }
    };

    if (typeof requestAnimationFrame !== 'undefined') {
      this.rafId = requestAnimationFrame(tick);
    }
    this.emitSnapshot();
  }

  stop() {
    this.running = false;
    this.runId += 1;
    if (this.rafId !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.emitSnapshot();
  }

  stepFrame(dt, currentRun) {
    const dt60 = dt * 60;
    const now = Date.now();
    const activeSprites = this.entities.filter((e) => e.kind === 'sprite' && this.isEntityInActiveScene(e));
    const solids = activeSprites.filter((e) => e.visible && e.physics?.solid);

    // 1. Physics & movement
    for (const s of activeSprites) {
      if (s.sayUntil && now > s.sayUntil) {
        s.sayText = '';
        s.sayUntil = 0;
      }
      const prevX = s.x;
      const prevY = s.y;
      const phys = s.physics || {};

      if (phys.enabled && phys.mode === 'platformer') {
        const left = this.isKeyDown('left arrow') || this.isKeyDown('a');
        const right = this.isKeyDown('right arrow') || this.isKeyDown('d');
        const jump = this.isKeyDown('up arrow') || this.isKeyDown('w') || this.isKeyDown('space');
        const spd = phys.speed || 5;
        s.vx = (right ? spd : 0) - (left ? spd : 0);
        s.vy -= (phys.gravity ?? 0.7) * dt60;
        if (jump && s.grounded) {
          s.vy = phys.jumpForce || 13;
          s.grounded = false;
        }
      } else if (phys.enabled && phys.mode === 'topdown') {
        const left = this.isKeyDown('left arrow') || this.isKeyDown('a');
        const right = this.isKeyDown('right arrow') || this.isKeyDown('d');
        const up = this.isKeyDown('up arrow') || this.isKeyDown('w');
        const down = this.isKeyDown('down arrow') || this.isKeyDown('s');
        const spd = phys.speed || 5;
        s.vx = (right ? spd : 0) - (left ? spd : 0);
        s.vy = (up ? spd : 0) - (down ? spd : 0);
      }

      // Apply velocity
      if (s.vx || s.vy) {
        const sb = this.getSpriteBounds(s);
        s.x += (s.vx || 0) * dt60;
        // Solid X collision
        if (phys.enabled && (phys.mode === 'platformer' || phys.mode === 'topdown')) {
          for (const box of solids) {
            if (box.id === s.id) continue;
            if (this.checkAABB(s, box)) {
              const bb = this.getSpriteBounds(box);
              const hwSum = sb.hw + bb.hw;
              if (s.vx > 0) s.x = box.x - hwSum;
              else if (s.vx < 0) s.x = box.x + hwSum;
            }
          }
        }

        s.y += (s.vy || 0) * dt60;
        s.grounded = false;
        if (phys.enabled && (phys.mode === 'platformer' || phys.mode === 'topdown')) {
          for (const box of solids) {
            if (box.id === s.id) continue;
            if (this.checkAABB(s, box)) {
              const bb = this.getSpriteBounds(box);
              const hhSum = sb.hh + bb.hh;
              if (s.vy <= 0) {
                s.y = box.y + hhSum;
                s.vy = 0;
                s.grounded = true;
              } else {
                s.y = box.y - hhSum;
                s.vy = 0;
              }
            }
          }
        }
      }

      if (phys.bounceEdges) {
        const r = this.getSpriteRadius(s);
        if (s.x + r > 400) {
          s.x = 400 - r;
          s.vx = -Math.abs(s.vx || 3);
        } else if (s.x - r < -400) {
          s.x = -400 + r;
          s.vx = Math.abs(s.vx || 3);
        }
        if (s.y + r > 250) {
          s.y = 250 - r;
          s.vy = -Math.abs(s.vy || 3);
        } else if (s.y - r < -250) {
          s.y = -250 + r;
          s.vy = Math.abs(s.vy || 3);
        }
      }

      if (s.trail && (s.x !== prevX || s.y !== prevY)) {
        this.trailSegments.push({
          x1: prevX,
          y1: prevY,
          x2: s.x,
          y2: s.y,
          color: s.trailColor || '#38bdf8',
          size: s.trailSize || 4,
        });
        if (this.trailSegments.length > 2500) this.trailSegments.shift();
      }
    }

    // 2. Camera follow & shake decay
    if (this.camera.followId) {
      const target = this.entities.find((e) => e.id === this.camera.followId);
      if (target) {
        this.camera.x += (target.x - this.camera.x) * 0.12;
        this.camera.y += (target.y - this.camera.y) * 0.12;
      }
    }
    if (this.camera.shakeUntil && now > this.camera.shakeUntil) {
      this.camera.shake = 0;
      this.camera.shakeUntil = 0;
    }

    // 3. Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt60;
      p.y += p.vy * dt60;
      p.vy -= 0.12 * dt60;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // 4. Held keys, every timers, whenever conditions, and when_touches hats
    for (const scr of this.scripts) {
      if (!scr.enabled) continue;
      const hat = scr.hat;
      if (hat.type === 'when_key' && hat.args.mode === 'held') {
        if (this.isKeyDown(String(hat.args.key))) {
          const busyKey = `held_${scr.id}`;
          if (!this.edgeTriggerStates.get(busyKey)) {
            this.edgeTriggerStates.set(busyKey, true);
            this.launchScript(scr, scr.targetId === 'stage' ? null : scr.targetId, currentRun).finally(() => {
              this.edgeTriggerStates.set(busyKey, false);
            });
          }
        }
      } else if (hat.type === 'when_every') {
        const intervalMs = Math.max(50, Number(hat.args.sec || 1) * 1000);
        const last = this.everyTimers.get(scr.id) ?? now;
        if (!this.everyTimers.has(scr.id)) this.everyTimers.set(scr.id, now);
        if (now - last >= intervalMs) {
          this.everyTimers.set(scr.id, now);
          this.launchScript(scr, scr.targetId === 'stage' ? null : scr.targetId, currentRun);
        }
      } else if (hat.type === 'when_condition') {
        const val = Boolean(evaluateExpression(String(hat.args.condition || 'false'), this, scr.targetId));
        const prev = Boolean(this.edgeTriggerStates.get(scr.id));
        this.edgeTriggerStates.set(scr.id, val);
        if (val && !prev) {
          this.launchScript(scr, scr.targetId === 'stage' ? null : scr.targetId, currentRun);
        }
      } else if (hat.type === 'when_touches') {
        const listA = this.resolveEntities(hat.args.a, scr.targetId === 'stage' ? null : scr.targetId).filter(
          (e) => e.kind === 'sprite' && e.visible
        );
        const listB = this.resolveEntities(hat.args.b, scr.targetId === 'stage' ? null : scr.targetId).filter(
          (e) => e.kind === 'sprite' && e.visible
        );
        for (const a of listA) {
          for (const b of listB) {
            if (a.id === b.id) continue;
            const pairKey = `${scr.id}::${a.id}::${b.id}`;
            const touching = this.checkAABB(a, b);
            const wasTouching = this.touchStates.has(pairKey);
            if (touching && !wasTouching) {
              this.touchStates.add(pairKey);
              this.launchScript(scr, a.id, currentRun);
            } else if (!touching && wasTouching) {
              this.touchStates.delete(pairKey);
            }
          }
        }
      }
    }
  }

  triggerKeyHat(keyNorm, mode) {
    const currentRun = this.runId;
    for (const scr of this.scripts) {
      if (!scr.enabled || scr.hat.type !== 'when_key') continue;
      if ((scr.hat.args.mode || 'pressed') !== mode) continue;
      const targetKey = normalizeKey(scr.hat.args.key);
      if (targetKey === 'any' || targetKey === keyNorm) {
        this.launchScript(scr, scr.targetId === 'stage' ? null : scr.targetId, currentRun);
      }
    }
  }

  handleStageClick(sx, sy) {
    const currentRun = this.runId;
    const activeSprites = this.entities
      .filter((e) => e.kind === 'sprite' && e.visible && this.isEntityInActiveScene(e))
      .slice()
      .reverse();
    for (const sp of activeSprites) {
      const r = this.getSpriteRadius(sp);
      if (Math.abs(sx - sp.x) <= r && Math.abs(sy - sp.y) <= r) {
        this.triggerClickHat(sp);
        break;
      }
    }
  }

  triggerClickHat(entity) {
    const currentRun = this.runId;
    for (const scr of this.scripts) {
      if (!scr.enabled || scr.hat.type !== 'when_clicked') continue;
      const targetRef = String(scr.hat.args.target || 'this').toLowerCase();
      const matches =
        (targetRef === 'this' && scr.targetId === entity.id) ||
        targetRef === entity.id.toLowerCase() ||
        targetRef === entity.name.toLowerCase();
      if (matches) {
        this.launchScript(scr, entity.id, currentRun);
      }
    }
  }

  triggerInputHat(entity) {
    const currentRun = this.runId;
    for (const scr of this.scripts) {
      if (!scr.enabled || scr.hat.type !== 'when_input_changes') continue;
      const targetRef = String(scr.hat.args.target || 'this').toLowerCase();
      if (
        (targetRef === 'this' && scr.targetId === entity.id) ||
        targetRef === entity.id.toLowerCase() ||
        targetRef === entity.name.toLowerCase()
      ) {
        this.launchScript(scr, entity.id, currentRun);
      }
    }
  }

  waitFrame() {
    return new Promise((resolve) => {
      if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(() => resolve());
      } else {
        setTimeout(resolve, 16);
      }
    });
  }

  waitMs(ms) {
    return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
  }

  async launchScript(script, selfId, runId) {
    try {
      await this.executeBlockList(script.body, selfId, runId);
    } catch (err) {
      if (err && err.message === '__STOP_SCRIPT__') return;
      if (err && err.message === '__STOP_ALL__') {
        this.stop();
        return;
      }
      this.addLog('error', `Script error: ${err?.message || String(err)}`);
    }
  }

  async executeBlockList(blocks, selfId, runId) {
    for (const blk of blocks || []) {
      if (!this.running || this.runId !== runId) return;
      await this.executeBlock(blk, selfId, runId);
    }
  }

  async executeBlock(blk, selfId, runId) {
    if (!this.running || this.runId !== runId) return;
    const a = blk.args || {};

    switch (blk.type) {
      case 'enable_platformer': {
        const ent = this.resolveEntity(a.target, selfId);
        if (ent) {
          ent.physics = {
            ...ent.physics,
            enabled: true,
            mode: 'platformer',
            speed: Number(a.speed ?? 5),
            jumpForce: Number(a.jump ?? 13),
            gravity: Number(a.gravity ?? 0.7),
          };
        }
        break;
      }
      case 'enable_topdown': {
        const ent = this.resolveEntity(a.target, selfId);
        if (ent) {
          ent.physics = { ...ent.physics, enabled: true, mode: 'topdown', speed: Number(a.speed ?? 5) };
        }
        break;
      }
      case 'make_solid': {
        const ent = this.resolveEntity(a.target, selfId);
        if (ent) ent.physics = { ...ent.physics, solid: true };
        break;
      }
      case 'move_steps': {
        const ent = this.resolveEntity(a.target, selfId);
        if (ent) {
          const steps = Number(evaluateExpression(a.steps, this, selfId)) || 0;
          const rad = ((ent.rotation || 0) * Math.PI) / 180;
          ent.x += Math.cos(rad) * steps;
          ent.y -= Math.sin(rad) * steps;
        }
        break;
      }
      case 'move_direction': {
        const ent = this.resolveEntity(a.target, selfId);
        if (ent) {
          const amt = Number(evaluateExpression(a.amount, this, selfId)) || 0;
          if (a.dir === 'right') ent.x += amt;
          else if (a.dir === 'left') ent.x -= amt;
          else if (a.dir === 'up') ent.y += amt;
          else if (a.dir === 'down') ent.y -= amt;
        }
        break;
      }
      case 'go_to_xy': {
        const ent = this.resolveEntity(a.target, selfId);
        if (ent) {
          ent.x = Number(evaluateExpression(a.x, this, selfId)) || 0;
          ent.y = Number(evaluateExpression(a.y, this, selfId)) || 0;
        }
        break;
      }
      case 'go_to_target': {
        const ent = this.resolveEntity(a.target, selfId);
        if (ent) {
          const dest = String(a.dest || 'mouse').toLowerCase();
          if (dest === 'mouse') {
            ent.x = this.mouse.x;
            ent.y = this.mouse.y;
          } else if (dest === 'random spot' || dest === 'random') {
            ent.x = Math.round(Math.random() * 680 - 340);
            ent.y = Math.round(Math.random() * 400 - 200);
          } else {
            const other = this.resolveEntity(dest, selfId);
            if (other) {
              ent.x = other.x;
              ent.y = other.y;
            }
          }
        }
        break;
      }
      case 'point_toward': {
        const ent = this.resolveEntity(a.target, selfId);
        if (ent) {
          const dest = String(a.dest || 'mouse').toLowerCase();
          let tx = this.mouse.x;
          let ty = this.mouse.y;
          if (dest !== 'mouse') {
            const other = this.resolveEntity(dest, selfId);
            if (other) {
              tx = other.x;
              ty = other.y;
            }
          }
          ent.rotation = Math.round((Math.atan2(ent.y - ty, tx - ent.x) * 180) / Math.PI);
        }
        break;
      }
      case 'turn_degrees': {
        const ent = this.resolveEntity(a.target, selfId);
        if (ent) {
          const deg = Number(evaluateExpression(a.deg, this, selfId)) || 0;
          ent.rotation += a.dir === 'left' ? -deg : deg;
        }
        break;
      }
      case 'set_rotation': {
        const ent = this.resolveEntity(a.target, selfId);
        if (ent) ent.rotation = Number(evaluateExpression(a.deg, this, selfId)) || 0;
        break;
      }
      case 'set_velocity': {
        const ent = this.resolveEntity(a.target, selfId);
        if (ent) {
          ent.vx = Number(evaluateExpression(a.vx, this, selfId)) || 0;
          ent.vy = Number(evaluateExpression(a.vy, this, selfId)) || 0;
        }
        break;
      }
      case 'bounce_edges': {
        const ent = this.resolveEntity(a.target, selfId);
        if (ent) ent.physics = { ...ent.physics, bounceEdges: true };
        break;
      }
      case 'glide_to': {
        const ent = this.resolveEntity(a.target, selfId);
        if (ent) {
          const tx = Number(evaluateExpression(a.x, this, selfId)) || 0;
          const ty = Number(evaluateExpression(a.y, this, selfId)) || 0;
          const durMs = Math.max(16, (Number(a.sec) || 0.5) * 1000);
          const sx = ent.x;
          const sy = ent.y;
          const t0 = Date.now();
          while (this.running && this.runId === runId) {
            const p = Math.min(1, (Date.now() - t0) / durMs);
            const e = easeValue(p, a.ease || 'smooth');
            ent.x = sx + (tx - sx) * e;
            ent.y = sy + (ty - sy) * e;
            if (p >= 1) break;
            await this.waitFrame();
          }
        }
        break;
      }
      case 'animate_prop': {
        const ent = this.resolveEntity(a.target, selfId);
        if (ent) {
          const prop = a.prop === 'scale' ? 'size' : a.prop;
          const targetVal = Number(evaluateExpression(a.value, this, selfId)) || 0;
          const durMs = Math.max(16, (Number(a.sec) || 0.5) * 1000);
          const startVal = Number(ent[prop] ?? 100);
          const t0 = Date.now();
          while (this.running && this.runId === runId) {
            const p = Math.min(1, (Date.now() - t0) / durMs);
            const e = easeValue(p, a.ease || 'bounce');
            ent[prop] = startVal + (targetVal - startVal) * e;
            if (p >= 1) break;
            await this.waitFrame();
          }
        }
        break;
      }
      case 'show_hide': {
        const ent = this.resolveEntity(a.target, selfId);
        if (ent) {
          ent.visible = a.action === 'show';
          this.renderWebLayer(true);
        }
        break;
      }
      case 'say_text': {
        const ent = this.resolveEntity(a.target, selfId);
        if (ent) {
          const msg = interpolateText(a.text, this, selfId);
          const sec = Number(a.sec) || 0;
          ent.sayText = msg;
          ent.sayUntil = sec > 0 ? Date.now() + sec * 1000 : 0;
        }
        break;
      }
      case 'switch_costume': {
        const ent = this.resolveEntity(a.target, selfId);
        if (ent && ent.costumes?.length) {
          const c = String(a.costume || 'next');
          if (c.toLowerCase() === 'next') {
            ent.activeCostumeIndex = (ent.activeCostumeIndex + 1) % ent.costumes.length;
          } else {
            const idx = ent.costumes.findIndex((cs) => cs.name.toLowerCase() === c.toLowerCase());
            if (idx >= 0) ent.activeCostumeIndex = idx;
          }
        }
        break;
      }
      case 'set_size': {
        const ent = this.resolveEntity(a.target, selfId);
        if (ent) ent.size = Math.max(5, Number(evaluateExpression(a.size, this, selfId)) || 100);
        break;
      }
      case 'set_opacity': {
        const ent = this.resolveEntity(a.target, selfId);
        if (ent) ent.opacity = Math.max(0, Math.min(100, Number(evaluateExpression(a.opacity, this, selfId)) || 100));
        break;
      }
      case 'burst_particles': {
        const ent = this.resolveEntity(a.target, selfId);
        const cx = ent ? ent.x : 0;
        const cy = ent ? ent.y : 0;
        const count = Math.min(80, Math.max(1, Number(a.count) || 15));
        const palette =
          a.style === 'spark'
            ? ['#fde047', '#fb923c', '#f8fafc']
            : a.style === 'smoke'
            ? ['#94a3b8', '#cbd5e1', '#64748b']
            : a.style === 'hearts'
            ? ['#f43f5e', '#fb7185', '#fda4af']
            : a.style === 'stars'
            ? ['#fde047', '#38bdf8', '#c084fc']
            : ['#6366f1', '#ec4899', '#fbbf24', '#34d399', '#38bdf8'];
        for (let i = 0; i < count; i++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = 1.5 + Math.random() * 4.5;
          this.particles.push({
            x: cx,
            y: cy,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd + 1.5,
            color: palette[i % palette.length],
            size: 3 + Math.random() * 4,
            style: a.style || 'confetti',
            life: 0.6 + Math.random() * 0.6,
          });
        }
        break;
      }
      case 'camera_shake': {
        this.camera.shake = Number(a.strength) || 8;
        this.camera.shakeUntil = Date.now() + (Number(a.sec) || 0.3) * 1000;
        break;
      }
      case 'camera_zoom': {
        const targetZoom = Math.max(30, Math.min(300, Number(a.zoom) || 100));
        const durMs = Math.max(16, (Number(a.sec) || 0.4) * 1000);
        const startZoom = this.camera.zoom || 100;
        const t0 = Date.now();
        while (this.running && this.runId === runId) {
          const p = Math.min(1, (Date.now() - t0) / durMs);
          this.camera.zoom = startZoom + (targetZoom - startZoom) * easeValue(p, 'smooth');
          if (p >= 1) break;
          await this.waitFrame();
        }
        break;
      }
      case 'camera_follow': {
        if (String(a.target).toLowerCase() === 'none') {
          this.camera.followId = null;
          this.camera.x = 0;
          this.camera.y = 0;
        } else {
          const ent = this.resolveEntity(a.target, selfId);
          this.camera.followId = ent ? ent.id : null;
        }
        break;
      }
      case 'pen_trail': {
        if (a.action === 'clear all') {
          this.trailSegments = [];
        } else {
          const ent = this.resolveEntity(a.target, selfId);
          if (ent) {
            ent.trail = a.action === 'start';
            ent.trailColor = a.color || '#38bdf8';
            ent.trailSize = Number(a.size) || 4;
          }
        }
        break;
      }
      case 'wait_sec': {
        const ms = Math.max(0, (Number(evaluateExpression(a.sec, this, selfId)) || 0) * 1000);
        const end = Date.now() + ms;
        while (this.running && this.runId === runId && Date.now() < end) {
          await this.waitMs(Math.min(50, end - Date.now()));
        }
        break;
      }
      case 'repeat_times': {
        const count = Math.max(0, Math.round(Number(evaluateExpression(a.times, this, selfId)) || 0));
        for (let i = 0; i < count; i++) {
          if (!this.running || this.runId !== runId) return;
          await this.executeBlockList(blk.body, selfId, runId);
          await this.waitFrame();
        }
        break;
      }
      case 'repeat_forever': {
        while (this.running && this.runId === runId) {
          await this.executeBlockList(blk.body, selfId, runId);
          await this.waitFrame();
        }
        break;
      }
      case 'repeat_until': {
        while (this.running && this.runId === runId && !evaluateExpression(a.condition, this, selfId)) {
          await this.executeBlockList(blk.body, selfId, runId);
          await this.waitFrame();
        }
        break;
      }
      case 'wait_until': {
        while (this.running && this.runId === runId && !evaluateExpression(a.condition, this, selfId)) {
          await this.waitFrame();
        }
        break;
      }
      case 'if_then': {
        if (evaluateExpression(a.condition, this, selfId)) {
          await this.executeBlockList(blk.body, selfId, runId);
        } else if (blk.elseBody?.length) {
          await this.executeBlockList(blk.elseBody, selfId, runId);
        }
        break;
      }
      case 'for_each': {
        const list = this.lists[String(a.listName)] || [];
        const vName = String(a.varName || 'item');
        for (const item of [...list]) {
          if (!this.running || this.runId !== runId) return;
          this.variables[vName] = item;
          await this.executeBlockList(blk.body, selfId, runId);
        }
        break;
      }
      case 'broadcast': {
        const msg = interpolateText(a.msg, this, selfId).toLowerCase();
        for (const scr of this.scripts) {
          if (scr.enabled && scr.hat.type === 'when_message' && String(scr.hat.args.msg).toLowerCase() === msg) {
            this.launchScript(scr, scr.targetId === 'stage' ? null : scr.targetId, runId);
          }
        }
        break;
      }
      case 'switch_scene': {
        const target = String(a.scene || '').toLowerCase();
        const found = this.scenes.find((s) => s.id.toLowerCase() === target || s.name.toLowerCase() === target);
        if (found) {
          this.activeSceneId = found.id;
          this.theme = found.theme || this.theme;
          this.renderWebLayer(true);
          this.emitSnapshot();
        }
        break;
      }
      case 'spawn_copy': {
        const proto = this.resolveEntity(a.target, selfId);
        const origin = this.resolveEntity(a.origin, selfId) || proto;
        if (proto && this.entities.length < 220) {
          const clone = deepClone(proto);
          clone.id = `clone_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
          clone.isClone = true;
          clone.visible = true;
          clone.sceneId = this.activeSceneId;
          if (origin) {
            clone.x = origin.x;
            clone.y = origin.y;
          }
          this.entities.push(clone);
          for (const scr of this.scripts) {
            if (scr.enabled && scr.hat.type === 'when_clone_starts') {
              const t = String(scr.hat.args.target || 'this').toLowerCase();
              if ((t === 'this' && scr.targetId === proto.id) || t === proto.name.toLowerCase() || t === proto.id.toLowerCase()) {
                this.launchScript(scr, clone.id, runId);
              }
            }
          }
        }
        break;
      }
      case 'delete_copy': {
        if (selfId) {
          const idx = this.entities.findIndex((e) => e.id === selfId && e.isClone);
          if (idx >= 0) this.entities.splice(idx, 1);
        }
        break;
      }
      case 'run_action': {
        const actionName = String(a.name || '').toLowerCase();
        const defScr = this.scripts.find(
          (s) => s.enabled && s.hat.type === 'define_action' && String(s.hat.args.name).toLowerCase() === actionName
        );
        if (defScr) {
          await this.executeBlockList(defScr.body, selfId, runId);
        }
        break;
      }
      case 'stop_scripts': {
        if (a.scope === 'all scripts') throw new Error('__STOP_ALL__');
        if (a.scope === 'this script') throw new Error('__STOP_SCRIPT__');
        break;
      }
      case 'play_sound': {
        this.sound.playSfx(a.sfx);
        break;
      }
      case 'play_note': {
        this.sound.playNote(a.note, Number(a.sec) || 0.25, a.instrument || 'synth');
        break;
      }
      case 'set_volume': {
        this.sound.setVolume(Number(a.vol) || 80);
        break;
      }
      case 'set_var': {
        const raw = String(a.value ?? '');
        const hasInterpolation = /\{[^{}]+\}/.test(raw);
        const val = hasInterpolation ? interpolateText(raw, this, selfId) : evaluateExpression(raw, this, selfId);
        this.variables[String(a.var)] = val;
        this.emitSnapshot();
        break;
      }
      case 'change_var': {
        const k = String(a.var);
        const cur = Number(this.variables[k] ?? 0) || 0;
        const delta = Number(evaluateExpression(a.delta, this, selfId)) || 0;
        this.variables[k] = Number((cur + delta).toFixed(4));
        this.emitSnapshot();
        break;
      }
      case 'save_storage': {
        if (typeof localStorage !== 'undefined') {
          const k = String(a.var);
          localStorage.setItem(`openscratch_var_${k}`, JSON.stringify(this.variables[k] ?? ''));
        }
        break;
      }
      case 'load_storage': {
        const k = String(a.var);
        let loaded = a.fallback ?? '';
        if (typeof localStorage !== 'undefined') {
          const raw = localStorage.getItem(`openscratch_var_${k}`);
          if (raw !== null) {
            try {
              loaded = JSON.parse(raw);
            } catch {
              loaded = raw;
            }
          }
        }
        this.variables[k] = loaded;
        this.emitSnapshot();
        break;
      }
      case 'list_add': {
        const lName = String(a.list || 'inventory');
        if (!this.lists[lName]) this.lists[lName] = [];
        this.lists[lName].push(interpolateText(a.item, this, selfId));
        this.emitSnapshot();
        break;
      }
      case 'list_remove': {
        const lName = String(a.list || 'inventory');
        const idx = Math.max(1, Number(a.index) || 1) - 1;
        if (this.lists[lName] && idx < this.lists[lName].length) {
          this.lists[lName].splice(idx, 1);
          this.emitSnapshot();
        }
        break;
      }
      case 'list_clear': {
        this.lists[String(a.list || 'inventory')] = [];
        this.emitSnapshot();
        break;
      }
      case 'log_note': {
        this.addLog('info', interpolateText(a.text, this, selfId));
        break;
      }
      case 'set_theme': {
        this.theme = String(a.theme || 'dark-modern');
        this.renderWebLayer(true);
        this.emitSnapshot();
        break;
      }
      case 'set_web_text': {
        const ent = this.resolveEntity(a.target, selfId);
        if (ent) {
          ent.text = interpolateText(a.text, this, selfId);
          this.renderWebLayer(true);
        }
        break;
      }
      case 'set_web_style': {
        const ent = this.resolveEntity(a.target, selfId);
        if (ent) {
          ent.webStyle = {
            ...(ent.webStyle || {}),
            bgColor: String(a.bgColor || ''),
            textColor: String(a.textColor || ''),
            rounded: Number(a.rounded ?? 12),
          };
          this.renderWebLayer(true);
        }
        break;
      }
      case 'add_web_element': {
        const name = String(a.name || `el_${Date.now()}`);
        const existing = this.entities.find((e) => e.name.toLowerCase() === name.toLowerCase());
        const text = interpolateText(a.text, this, selfId);
        if (existing) {
          existing.text = text;
          existing.visible = true;
        } else {
          this.entities.push({
            id: `web_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`,
            name,
            kind: 'web',
            sceneId: this.activeSceneId,
            visible: true,
            x: 0,
            y: 0,
            size: 100,
            rotation: 0,
            opacity: 100,
            layer: 0,
            costumes: [],
            activeCostumeIndex: 0,
            physics: { enabled: false, mode: 'none', speed: 5, jumpForce: 13, gravity: 0.7, solid: false, bounceEdges: false },
            webType: a.webType || 'button',
            text,
            webStyle: { variant: 'primary', rounded: 12, size: 'md', align: 'left' },
          });
        }
        this.renderWebLayer(true);
        break;
      }
      case 'remove_web_element': {
        const ent = this.resolveEntity(a.target, selfId);
        if (ent) {
          this.entities = this.entities.filter((e) => e.id !== ent.id);
          this.renderWebLayer(true);
        }
        break;
      }
      case 'open_url': {
        const url = interpolateText(a.url, this, selfId);
        if (typeof window !== 'undefined' && /^https?:\/\//i.test(url)) {
          window.open(url, '_blank', 'noopener,noreferrer');
        }
        break;
      }
      case 'show_toast': {
        this.showToast(interpolateText(a.text, this, selfId), a.tone || 'info');
        break;
      }
      case 'ask_prompt': {
        const q = interpolateText(a.question, this, selfId);
        let ans = '';
        if (this.hooks.onPrompt) {
          ans = await this.hooks.onPrompt(q);
        } else if (typeof window !== 'undefined' && typeof window.prompt === 'function') {
          ans = window.prompt(q) ?? '';
        }
        this.variables[String(a.var || 'answer')] = ans;
        this.emitSnapshot();
        break;
      }
      default:
        break;
    }
  }

  renderCanvas() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const W = 800;
    const H = 500;
    ctx.save();
    ctx.clearRect(0, 0, W, H);

    // Background
    const scene = this.getActiveScene();
    const bg = scene?.background || { type: 'gradient', color1: '#0f172a', color2: '#1e1b4b' };
    if (bg.type === 'color') {
      ctx.fillStyle = bg.color1 || '#0f172a';
      ctx.fillRect(0, 0, W, H);
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, bg.color1 || '#0f172a');
      grad.addColorStop(1, bg.color2 || '#1e1b4b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }

    if (bg.stars || bg.type === 'space') {
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      for (let i = 0; i < 48; i++) {
        const sx = ((i * 173 + 41) % W);
        const sy = ((i * 257 + 19) % H);
        const r = (i % 3 === 0) ? 1.8 : 1;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (bg.grid || bg.type === 'grid') {
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= W; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y <= H; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
    }

    // Apply camera transform
    const zoom = (this.camera.zoom || 100) / 100;
    const shakeX = this.camera.shake ? (Math.random() - 0.5) * this.camera.shake * 2 : 0;
    const shakeY = this.camera.shake ? (Math.random() - 0.5) * this.camera.shake * 2 : 0;
    ctx.translate(W / 2 + shakeX, H / 2 + shakeY);
    ctx.scale(zoom, zoom);
    ctx.translate(-this.camera.x, this.camera.y);

    // Draw pen trails
    for (const seg of this.trailSegments) {
      ctx.strokeStyle = seg.color;
      ctx.lineWidth = seg.size;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(seg.x1, -seg.y1);
      ctx.lineTo(seg.x2, -seg.y2);
      ctx.stroke();
    }

    // Draw sprites sorted by layer
    const sprites = this.entities
      .filter((e) => e.kind === 'sprite' && e.visible && this.isEntityInActiveScene(e))
      .slice()
      .sort((a, b) => (a.layer || 0) - (b.layer || 0));

    for (const sp of sprites) {
      ctx.save();
      ctx.translate(sp.x, -sp.y);
      ctx.rotate(((sp.rotation || 0) * Math.PI) / 180);
      const scale = (sp.size ?? 100) / 100;
      ctx.scale(scale, scale);
      ctx.globalAlpha = Math.max(0, Math.min(1, (sp.opacity ?? 100) / 100));

      const costume = sp.costumes?.[sp.activeCostumeIndex || 0] || { kind: 'preset', value: 'hero', color: '#6366f1' };
      this.drawSpriteCostume(ctx, costume, sp.name);

      ctx.restore();

      // Speech bubble (unrotated)
      if (sp.sayText) {
        ctx.save();
        ctx.translate(sp.x, -sp.y - 38 * ((sp.size ?? 100) / 100));
        ctx.font = '600 13px Inter, system-ui, sans-serif';
        const padding = 10;
        const textW = Math.min(220, ctx.measureText(sp.sayText).width);
        const boxW = textW + padding * 2;
        const boxH = 30;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-boxW / 2, -boxH, boxW, boxH, 10);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#0f172a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sp.sayText, 0, -boxH / 2, 210);
        ctx.restore();
      }
    }

    // Draw particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, -p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  drawSpriteCostume(ctx, costume, name) {
    if (costume.kind === 'emoji') {
      ctx.font = '40px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(costume.value || '✨', 0, 2);
      return;
    }

    const col = costume.color || PRESET_COLORS[costume.value] || '#6366f1';
    const v = String(costume.value || 'hero').toLowerCase();

    if (v === 'platform') {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.roundRect(-48, -12, 96, 24, 6);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.fillRect(-45, -10, 90, 5);
      return;
    }

    if (v === 'gem') {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(18, -2);
      ctx.lineTo(0, 20);
      ctx.lineTo(-18, -2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(8, -2);
      ctx.lineTo(0, 6);
      ctx.lineTo(-8, -2);
      ctx.closePath();
      ctx.fill();
      return;
    }

    if (v === 'coin') {
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = '#fef3c7';
      ctx.font = '800 18px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', 0, 1);
      return;
    }

    if (v === 'rocket') {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(0, -24);
      ctx.quadraticCurveTo(16, -4, 12, 16);
      ctx.lineTo(-12, 16);
      ctx.quadraticCurveTo(-16, -4, 0, -24);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(0, -4, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fb923c';
      ctx.beginPath();
      ctx.moveTo(-7, 16);
      ctx.lineTo(0, 26);
      ctx.lineTo(7, 16);
      ctx.fill();
      return;
    }

    if (v === 'star') {
      ctx.fillStyle = col;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 22 : 10;
        const a = (i * Math.PI) / 5 - Math.PI / 2;
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      return;
    }

    if (v === 'slime' || v === 'ghost') {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(0, -2, 18, Math.PI, 0);
      ctx.lineTo(18, 16);
      ctx.lineTo(-18, 16);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-6, -2, 3, 0, Math.PI * 2);
      ctx.arc(6, -2, 3, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    // Default friendly rounded character ("hero" / "robot")
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.roundRect(-20, -20, 40, 40, 12);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.beginPath();
    ctx.roundRect(-16, -16, 32, 12, 8);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-7, -3, 4.5, 0, Math.PI * 2);
    ctx.arc(7, -3, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-6, -3, 2, 0, Math.PI * 2);
    ctx.arc(8, -3, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 5, 6, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
    if (!costume.value && name) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(name.slice(0, 6), 0, 30);
    }
  }

  renderWebLayer(force = false) {
    if (!this.webRoot) return;
    const webEntities = this.entities.filter((e) => e.kind === 'web' && e.visible && this.isEntityInActiveScene(e));
    const theme = THEME_STYLES[this.theme] || THEME_STYLES['dark-modern'];

    const renderKey = JSON.stringify({
      theme: this.theme,
      scene: this.activeSceneId,
      items: webEntities.map((e) => ({
        id: e.id,
        t: e.webType,
        txt: interpolateText(e.text || '', this, e.id),
        sub: interpolateText(e.subtext || '', this, e.id),
        icon: e.icon,
        st: e.webStyle,
      })),
    });

    if (!force && renderKey === this.lastWebRenderKey) return;
    this.lastWebRenderKey = renderKey;

    // Preserve active input focus if user is typing
    const activeEl = typeof document !== 'undefined' ? document.activeElement : null;
    const activeEntityId = activeEl?.getAttribute?.('data-os-input-id') || null;
    const selStart = activeEl?.selectionStart ?? null;

    this.webRoot.innerHTML = '';
    if (webEntities.length === 0) {
      this.webRoot.style.background = 'transparent';
      this.webRoot.style.pointerEvents = 'none';
      return;
    }

    const isWebsiteMode = this.baseProject.mode === 'website' || this.entities.every((e) => e.kind === 'web' || !this.isEntityInActiveScene(e));
    this.webRoot.style.pointerEvents = isWebsiteMode ? 'auto' : 'none';
    this.webRoot.style.fontFamily = theme.font;
    this.webRoot.style.color = theme.text;
    this.webRoot.style.background = isWebsiteMode ? theme.bg : 'transparent';

    const container = document.createElement('div');
    container.style.cssText =
      `display:flex;flex-direction:column;gap:12px;padding:20px 24px;max-width:760px;margin:0 auto;width:100%;box-sizing:border-box;pointer-events:${isWebsiteMode ? 'auto' : 'none'};`;

    for (const item of webEntities) {
      const st = item.webStyle || {};
      const text = interpolateText(item.text || '', this, item.id);
      const subtext = interpolateText(item.subtext || '', this, item.id);
      const align = st.align || 'left';
      const rounded = st.rounded ?? 12;

      let el;
      if (item.webType === 'nav') {
        el = document.createElement('nav');
        el.style.cssText = `display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 16px;border-radius:${rounded}px;background:${st.bgColor || theme.surface};border:1px solid ${theme.border};backdrop-filter:blur(10px);flex-wrap:wrap;`;
        const brand = document.createElement('span');
        brand.textContent = text;
        brand.style.cssText = `font-weight:800;font-size:15px;color:${st.textColor || theme.text};`;
        el.appendChild(brand);

        const linksWrap = document.createElement('div');
        linksWrap.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;';
        const targets = (subtext || 'Home, About').split(',').map((s) => s.trim()).filter(Boolean);
        for (const label of targets) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.textContent = label;
          btn.style.cssText = `padding:5px 12px;border-radius:8px;font-size:13px;font-weight:600;background:transparent;border:1px solid ${theme.border};color:${theme.text};cursor:pointer;`;
          btn.onclick = () => {
            if (!this.running) return;
            const found = this.scenes.find((sc) => sc.name.toLowerCase() === label.toLowerCase());
            if (found) {
              this.activeSceneId = found.id;
              this.theme = found.theme || this.theme;
              this.renderWebLayer(true);
              this.emitSnapshot();
            } else {
              this.triggerClickHat(item);
            }
          };
          linksWrap.appendChild(btn);
        }
        el.appendChild(linksWrap);
      } else if (item.webType === 'heading') {
        el = document.createElement('h1');
        const sz = st.size === 'xl' ? '34px' : st.size === 'lg' ? '26px' : st.size === 'sm' ? '18px' : '22px';
        el.textContent = text;
        el.style.cssText = `margin:0;font-size:${sz};font-weight:800;line-height:1.2;text-align:${align};color:${st.textColor || theme.text};`;
      } else if (item.webType === 'paragraph') {
        el = document.createElement('p');
        el.textContent = text;
        el.style.cssText = `margin:0;font-size:14.5px;line-height:1.6;text-align:${align};color:${st.textColor || theme.muted};`;
      } else if (item.webType === 'badge') {
        el = document.createElement('div');
        el.style.cssText = `text-align:${align};`;
        const span = document.createElement('span');
        span.textContent = text;
        span.style.cssText = `display:inline-block;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:700;background:${st.bgColor || theme.surface};border:1px solid ${theme.border};color:${st.textColor || theme.accent};`;
        el.appendChild(span);
      } else if (item.webType === 'button') {
        const wrap = document.createElement('div');
        wrap.style.cssText = `text-align:${align};`;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = text;
        const isOutline = st.variant === 'outline';
        const bg = isOutline ? 'transparent' : st.bgColor || theme.accent;
        const fg = isOutline ? (st.textColor || theme.text) : (st.textColor || theme.accentText);
        btn.style.cssText = `padding:10px 20px;border-radius:${rounded}px;font-size:14px;font-weight:700;border:${isOutline ? `1.5px solid ${theme.border}` : 'none'};background:${bg};color:${fg};cursor:pointer;transition:transform 0.12s ease;box-shadow:0 4px 14px rgba(0,0,0,0.18);${st.width === 'full' ? 'width:100%;' : ''}`;
        btn.onclick = () => {
          if (this.running) this.triggerClickHat(item);
        };
        wrap.appendChild(btn);
        el = wrap;
      } else if (item.webType === 'input') {
        el = document.createElement('input');
        el.type = 'text';
        el.setAttribute('data-os-input-id', item.id);
        el.placeholder = subtext || text || 'Type here...';
        const bindKey = item.bindVar || item.name;
        el.value = String(this.variables[bindKey] ?? '');
        el.style.cssText = `padding:10px 14px;border-radius:${rounded}px;font-size:14px;background:${st.bgColor || theme.surface};border:1px solid ${theme.border};color:${st.textColor || theme.text};outline:none;width:100%;box-sizing:border-box;`;
        el.oninput = (ev) => {
          this.variables[bindKey] = ev.target.value;
          this.emitSnapshot();
          if (this.running) this.triggerInputHat(item);
          this.renderWebLayer(false);
        };
      } else if (item.webType === 'card') {
        el = document.createElement('div');
        el.style.cssText = `padding:16px 18px;border-radius:${rounded}px;background:${st.bgColor || theme.surface};border:1px solid ${theme.border};backdrop-filter:blur(10px);display:flex;gap:14px;align-items:flex-start;cursor:pointer;`;
        if (item.icon) {
          const ic = document.createElement('div');
          ic.textContent = item.icon;
          ic.style.cssText = 'font-size:28px;line-height:1;';
          el.appendChild(ic);
        }
        const body = document.createElement('div');
        body.style.cssText = 'flex:1;';
        const title = document.createElement('div');
        title.textContent = text;
        title.style.cssText = `font-weight:700;font-size:16px;margin-bottom:4px;color:${st.textColor || theme.text};`;
        const desc = document.createElement('div');
        desc.textContent = subtext;
        desc.style.cssText = `font-size:13.5px;line-height:1.5;color:${theme.muted};`;
        body.appendChild(title);
        body.appendChild(desc);
        el.appendChild(body);
        el.onclick = () => {
          if (this.running) this.triggerClickHat(item);
        };
      } else if (item.webType === 'divider') {
        el = document.createElement('hr');
        el.style.cssText = `border:none;border-top:1px solid ${theme.border};margin:4px 0;width:100%;`;
      } else {
        el = document.createElement('div');
        el.style.height = '12px';
      }

      if (['nav', 'button', 'input', 'card'].includes(item.webType)) {
        el.style.pointerEvents = 'auto';
      }
      container.appendChild(el);
    }

    this.webRoot.appendChild(container);

    if (activeEntityId) {
      const nextInput = this.webRoot.querySelector(`[data-os-input-id="${activeEntityId}"]`);
      if (nextInput) {
        nextInput.focus();
        if (selStart !== null && typeof nextInput.setSelectionRange === 'function') {
          nextInput.setSelectionRange(selStart, selStart);
        }
      }
    }
  }
}
