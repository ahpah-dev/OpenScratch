import type { ArgValue, BlockNode, Entity, ScriptStack } from '../types/project';
import { createBlockNode, getBlockDefinition, makeId } from './blockCatalog';

export interface ParseError {
  line: number;
  message: string;
}

export interface OpenScriptParseResult {
  scripts: ScriptStack[];
  errors: ParseError[];
}

function q(val: ArgValue | undefined): string {
  const s = String(val ?? '');
  return JSON.stringify(s);
}

function num(val: ArgValue | undefined, fallback = 0): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

export function blockToOpenScriptLine(block: BlockNode): string {
  const a = block.args;
  switch (block.type) {
    // Events (Hat)
    case 'when_start':
      return 'when project starts:';
    case 'when_key':
      return `when ${q(a.key)} key is ${String(a.mode ?? 'pressed')}:`;
    case 'when_clicked':
      return `when ${q(a.target)} is clicked:`;
    case 'when_touches':
      return `when ${q(a.a)} touches ${q(a.b)}:`;
    case 'when_every':
      return `every ${num(a.sec, 1)} seconds:`;
    case 'when_condition':
      return `whenever (${String(a.condition ?? 'true')}):`;
    case 'when_message':
      return `when I hear message ${q(a.msg)}:`;
    case 'when_clone_starts':
      return `when a copy of ${q(a.target)} appears:`;
    case 'when_input_changes':
      return `when input ${q(a.target)} changes:`;
    case 'define_action':
      return `define custom action ${q(a.name)}:`;

    // Motion & Physics
    case 'enable_platformer':
      return `give ${q(a.target)} platformer physics speed ${num(a.speed, 5)} jump ${num(a.jump, 13)} gravity ${num(a.gravity, 0.7)}`;
    case 'enable_topdown':
      return `give ${q(a.target)} top-down arrow controls speed ${num(a.speed, 5)}`;
    case 'make_solid':
      return `make ${q(a.target)} a solid platform`;
    case 'move_steps':
      return `move ${q(a.target)} forward ${num(a.steps, 10)} steps`;
    case 'move_direction':
      return `move ${q(a.target)} ${String(a.dir ?? 'right')} by ${num(a.amount, 10)}`;
    case 'go_to_xy':
      return `place ${q(a.target)} at x ${q(a.x)} y ${q(a.y)}`;
    case 'go_to_target':
      return `jump ${q(a.target)} to ${q(a.dest)}`;
    case 'point_toward':
      return `point ${q(a.target)} toward ${q(a.dest)}`;
    case 'turn_degrees':
      return `turn ${q(a.target)} ${String(a.dir ?? 'right')} ${num(a.deg, 15)} degrees`;
    case 'set_rotation':
      return `set angle of ${q(a.target)} to ${num(a.deg, 0)} degrees`;
    case 'set_velocity':
      return `set velocity of ${q(a.target)} vx ${num(a.vx, 0)} vy ${num(a.vy, 10)}`;
    case 'bounce_edges':
      return `keep ${q(a.target)} bouncing off edges`;

    // Animation & Looks
    case 'glide_to':
      return `glide ${q(a.target)} to x ${q(a.x)} y ${q(a.y)} in ${num(a.sec, 0.8)} sec ease ${q(a.ease)}`;
    case 'animate_prop':
      return `animate ${q(a.target)} ${q(a.prop)} to ${num(a.value, 100)} in ${num(a.sec, 0.5)} sec ease ${q(a.ease)}`;
    case 'show_hide':
      return `${String(a.action ?? 'show')} ${q(a.target)}`;
    case 'say_text':
      return `make ${q(a.target)} say ${q(a.text)} for ${num(a.sec, 2)} sec`;
    case 'switch_costume':
      return `switch ${q(a.target)} costume to ${q(a.costume)}`;
    case 'set_size':
      return `set size of ${q(a.target)} to ${num(a.size, 100)}%`;
    case 'set_opacity':
      return `set opacity of ${q(a.target)} to ${num(a.opacity, 100)}%`;
    case 'burst_particles':
      return `burst ${num(a.count, 16)} ${q(a.style)} particles at ${q(a.target)}`;
    case 'camera_shake':
      return `shake camera strength ${num(a.strength, 8)} for ${num(a.sec, 0.3)} sec`;
    case 'camera_zoom':
      return `zoom camera to ${num(a.zoom, 120)}% in ${num(a.sec, 0.5)} sec`;
    case 'camera_follow':
      return `camera follow ${q(a.target)}`;
    case 'pen_trail':
      return `${q(a.action)} drawing trail on ${q(a.target)} color ${q(a.color)} size ${num(a.size, 4)}`;

    // Control & Logic
    case 'wait_sec':
      return `wait ${num(a.sec, 1)} seconds`;
    case 'repeat_times':
      return `repeat ${num(a.times, 10)} times:`;
    case 'repeat_forever':
      return `repeat forever:`;
    case 'repeat_until':
      return `repeat until (${String(a.condition ?? 'false')}):`;
    case 'wait_until':
      return `wait until (${String(a.condition ?? 'true')})`;
    case 'if_then':
      return `if (${String(a.condition ?? 'true')}) then:`;
    case 'for_each':
      return `for each ${q(a.varName)} in list ${q(a.listName)}:`;
    case 'broadcast':
      return `send message ${q(a.msg)}`;
    case 'switch_scene':
      return `go to scene ${q(a.scene)}`;
    case 'spawn_copy':
      return `spawn a copy of ${q(a.target)} at ${q(a.origin)}`;
    case 'delete_copy':
      return `delete this copy`;
    case 'run_action':
      return `run custom action ${q(a.name)}`;
    case 'stop_scripts':
      return `stop ${q(a.scope)}`;

    // Sound & Music
    case 'play_sound':
      return `play sound effect ${q(a.sfx)}`;
    case 'play_note':
      return `play note ${q(a.note)} for ${num(a.sec, 0.25)} sec on ${q(a.instrument)}`;
    case 'set_volume':
      return `set sound volume to ${num(a.vol, 80)}%`;

    // Data & Lists
    case 'set_var':
      return `set ${q(a.var)} to ${q(a.value)}`;
    case 'change_var':
      return `change ${q(a.var)} by ${num(a.delta, 1)}`;
    case 'save_storage':
      return `save ${q(a.var)} to browser storage`;
    case 'load_storage':
      return `load ${q(a.var)} from browser storage default ${q(a.fallback)}`;
    case 'list_add':
      return `add ${q(a.item)} to list ${q(a.list)}`;
    case 'list_remove':
      return `remove item #${num(a.index, 1)} from list ${q(a.list)}`;
    case 'list_clear':
      return `clear list ${q(a.list)}`;
    case 'log_note':
      return `print to console ${q(a.text)}`;

    // Website & UI
    case 'set_theme':
      return `set page theme to ${q(a.theme)}`;
    case 'set_web_text':
      return `set text of ${q(a.target)} to ${q(a.text)}`;
    case 'set_web_style':
      return `style ${q(a.target)} bg ${q(a.bgColor)} text ${q(a.textColor)} rounded ${num(a.rounded, 12)}px`;
    case 'add_web_element':
      return `create ${q(a.webType)} named ${q(a.name)} saying ${q(a.text)}`;
    case 'remove_web_element':
      return `remove web element ${q(a.target)}`;
    case 'open_url':
      return `open link ${q(a.url)}`;
    case 'show_toast':
      return `show alert banner ${q(a.text)} style ${q(a.tone)}`;
    case 'ask_prompt':
      return `ask user ${q(a.question)} save answer to ${q(a.var)}`;

    default:
      return `# unknown block ${block.type}`;
  }
}

function serializeBlocks(blocks: BlockNode[], indent: number): string[] {
  const pad = '  '.repeat(indent);
  const out: string[] = [];
  for (const blk of blocks) {
    out.push(pad + blockToOpenScriptLine(blk));
    const def = getBlockDefinition(blk.type);
    if (def?.isCBlock) {
      const inner = serializeBlocks(blk.body ?? [], indent + 1);
      if (inner.length > 0) {
        out.push(...inner);
      }
      if (def.hasElse && blk.elseBody && blk.elseBody.length > 0) {
        out.push(pad + 'otherwise:');
        out.push(...serializeBlocks(blk.elseBody, indent + 1));
      }
    }
  }
  return out;
}

export function scriptsToOpenScript(
  scripts: ScriptStack[],
  entities: Entity[],
  includeTargetHeaders = false
): string {
  const entityMap = new Map(entities.map((e) => [e.id, e.name]));
  const sections: string[] = [];

  for (const script of scripts) {
    const lines: string[] = [];
    if (includeTargetHeaders) {
      const targetName = script.targetId === 'stage' ? 'stage' : entityMap.get(script.targetId) ?? script.targetId;
      lines.push(`@target ${q(targetName)}`);
    }
    lines.push(blockToOpenScriptLine(script.hat));
    lines.push(...serializeBlocks(script.body, 1));
    sections.push(lines.join('\n'));
  }

  return sections.join('\n\n');
}

// Token helper: extracts quoted strings, parenthesized conditions, or unquoted tokens cleanly
function unquote(raw: string): string {
  const s = raw.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    try {
      if (s.startsWith('"')) return JSON.parse(s);
    } catch {
      // fall through
    }
    return s.slice(1, -1);
  }
  return s;
}

const STR_TOKEN = `("(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*'|\\S+)`;
const NUM_TOKEN = `(-?\\d+(?:\\.\\d+)?)`;

export function parseSingleLineToBlock(rawLine: string): BlockNode | null {
  const line = rawLine.trim().replace(/:$/, '').trim();
  if (!line) return null;

  let m: RegExpMatchArray | null;

  // ================= HATS =================
  if (/^when\s+(project|game)\s+starts?$/i.test(line)) {
    return createBlockNode('when_start');
  }
  m = line.match(new RegExp(`^when\\s+${STR_TOKEN}\\s+key\\s+is\\s+(pressed|held|released)$`, 'i'));
  if (m) return createBlockNode('when_key', { key: unquote(m[1]), mode: m[2].toLowerCase() });

  m = line.match(new RegExp(`^while\\s+${STR_TOKEN}\\s+key\\s+is\\s+held$`, 'i'));
  if (m) return createBlockNode('when_key', { key: unquote(m[1]), mode: 'held' });

  m = line.match(new RegExp(`^when\\s+(?:button\\s+|sprite\\s+)?${STR_TOKEN}\\s+is\\s+clicked$`, 'i'));
  if (m) return createBlockNode('when_clicked', { target: unquote(m[1]) });

  m = line.match(new RegExp(`^when\\s+${STR_TOKEN}\\s+touches\\s+${STR_TOKEN}$`, 'i'));
  if (m) return createBlockNode('when_touches', { a: unquote(m[1]), b: unquote(m[2]) });

  m = line.match(new RegExp(`^every\\s+${NUM_TOKEN}\\s+seconds?$`, 'i'));
  if (m) return createBlockNode('when_every', { sec: Number(m[1]) });

  m = line.match(/^whenever\s+\((.+)\)$/i) || line.match(/^whenever\s+(.+)$/i);
  if (m) return createBlockNode('when_condition', { condition: m[1].trim() });

  m = line.match(new RegExp(`^when\\s+I\\s+(?:hear|receive)(?:\\s+message)?\\s+${STR_TOKEN}$`, 'i'));
  if (m) return createBlockNode('when_message', { msg: unquote(m[1]) });

  m = line.match(new RegExp(`^when\\s+a\\s+copy\\s+of\\s+${STR_TOKEN}\\s+appears$`, 'i'));
  if (m) return createBlockNode('when_clone_starts', { target: unquote(m[1]) });

  m = line.match(new RegExp(`^when\\s+input\\s+${STR_TOKEN}\\s+changes$`, 'i'));
  if (m) return createBlockNode('when_input_changes', { target: unquote(m[1]) });

  m = line.match(new RegExp(`^define\\s+(?:custom\\s+)?action\\s+${STR_TOKEN}$`, 'i'));
  if (m) return createBlockNode('define_action', { name: unquote(m[1]) });

  // ================= MOTION & PHYSICS =================
  m = line.match(
    new RegExp(
      `^give\\s+${STR_TOKEN}\\s+platformer\\s+physics\\s+speed\\s+${NUM_TOKEN}\\s+jump\\s+${NUM_TOKEN}\\s+gravity\\s+${NUM_TOKEN}$`,
      'i'
    )
  );
  if (m) {
    return createBlockNode('enable_platformer', {
      target: unquote(m[1]),
      speed: Number(m[2]),
      jump: Number(m[3]),
      gravity: Number(m[4]),
    });
  }

  m = line.match(new RegExp(`^give\\s+${STR_TOKEN}\\s+top-down\\s+arrow\\s+controls\\s+speed\\s+${NUM_TOKEN}$`, 'i'));
  if (m) return createBlockNode('enable_topdown', { target: unquote(m[1]), speed: Number(m[2]) });

  m = line.match(new RegExp(`^make\\s+${STR_TOKEN}\\s+a\\s+solid\\s+platform$`, 'i'));
  if (m) return createBlockNode('make_solid', { target: unquote(m[1]) });

  m = line.match(new RegExp(`^move\\s+${STR_TOKEN}\\s+forward\\s+${NUM_TOKEN}\\s+steps?$`, 'i'));
  if (m) return createBlockNode('move_steps', { target: unquote(m[1]), steps: Number(m[2]) });

  m = line.match(new RegExp(`^move\\s+${STR_TOKEN}\\s+(right|left|up|down)\\s+by\\s+${NUM_TOKEN}$`, 'i'));
  if (m) return createBlockNode('move_direction', { target: unquote(m[1]), dir: m[2].toLowerCase(), amount: Number(m[3]) });

  m = line.match(new RegExp(`^place\\s+${STR_TOKEN}\\s+at\\s+x:?\\s+${STR_TOKEN}\\s+y:?\\s+${STR_TOKEN}$`, 'i'));
  if (m) return createBlockNode('go_to_xy', { target: unquote(m[1]), x: unquote(m[2]), y: unquote(m[3]) });

  m = line.match(new RegExp(`^jump\\s+${STR_TOKEN}\\s+to\\s+${STR_TOKEN}$`, 'i'));
  if (m) return createBlockNode('go_to_target', { target: unquote(m[1]), dest: unquote(m[2]) });

  m = line.match(new RegExp(`^point\\s+${STR_TOKEN}\\s+toward\\s+${STR_TOKEN}$`, 'i'));
  if (m) return createBlockNode('point_toward', { target: unquote(m[1]), dest: unquote(m[2]) });

  m = line.match(new RegExp(`^turn\\s+${STR_TOKEN}\\s+(right|left)\\s+${NUM_TOKEN}\\s+degrees?$`, 'i'));
  if (m) return createBlockNode('turn_degrees', { target: unquote(m[1]), dir: m[2].toLowerCase(), deg: Number(m[3]) });

  m = line.match(new RegExp(`^set\\s+angle\\s+of\\s+${STR_TOKEN}\\s+to\\s+${NUM_TOKEN}\\s+degrees?$`, 'i'));
  if (m) return createBlockNode('set_rotation', { target: unquote(m[1]), deg: Number(m[2]) });

  m = line.match(new RegExp(`^set\\s+velocity\\s+of\\s+${STR_TOKEN}\\s+vx:?\\s+${NUM_TOKEN}\\s+vy:?\\s+${NUM_TOKEN}$`, 'i'));
  if (m) return createBlockNode('set_velocity', { target: unquote(m[1]), vx: Number(m[2]), vy: Number(m[3]) });

  m = line.match(new RegExp(`^keep\\s+${STR_TOKEN}\\s+bouncing\\s+off\\s+edges$`, 'i'));
  if (m) return createBlockNode('bounce_edges', { target: unquote(m[1]) });

  // ================= ANIMATION & LOOKS =================
  m = line.match(
    new RegExp(
      `^glide\\s+${STR_TOKEN}\\s+to\\s+x:?\\s+${STR_TOKEN}\\s+y:?\\s+${STR_TOKEN}\\s+in\\s+${NUM_TOKEN}\\s+sec(?:onds?)?(?:\\s+ease\\s+${STR_TOKEN})?$`,
      'i'
    )
  );
  if (m) {
    return createBlockNode('glide_to', {
      target: unquote(m[1]),
      x: unquote(m[2]),
      y: unquote(m[3]),
      sec: Number(m[4]),
      ease: m[5] ? unquote(m[5]) : 'smooth',
    });
  }

  m = line.match(
    new RegExp(
      `^animate\\s+${STR_TOKEN}\\s+${STR_TOKEN}\\s+to\\s+${NUM_TOKEN}\\s+in\\s+${NUM_TOKEN}\\s+sec(?:onds?)?(?:\\s+ease\\s+${STR_TOKEN})?$`,
      'i'
    )
  );
  if (m) {
    return createBlockNode('animate_prop', {
      target: unquote(m[1]),
      prop: unquote(m[2]),
      value: Number(m[3]),
      sec: Number(m[4]),
      ease: m[5] ? unquote(m[5]) : 'bounce',
    });
  }

  m = line.match(new RegExp(`^(show|hide)\\s+${STR_TOKEN}$`, 'i'));
  if (m) return createBlockNode('show_hide', { action: m[1].toLowerCase(), target: unquote(m[2]) });

  m = line.match(new RegExp(`^make\\s+${STR_TOKEN}\\s+say\\s+${STR_TOKEN}\\s+for\\s+${NUM_TOKEN}\\s+sec(?:onds?)?$`, 'i'));
  if (m) return createBlockNode('say_text', { target: unquote(m[1]), text: unquote(m[2]), sec: Number(m[3]) });

  m = line.match(new RegExp(`^switch\\s+${STR_TOKEN}\\s+costume\\s+to\\s+${STR_TOKEN}$`, 'i'));
  if (m) return createBlockNode('switch_costume', { target: unquote(m[1]), costume: unquote(m[2]) });

  m = line.match(new RegExp(`^set\\s+size\\s+of\\s+${STR_TOKEN}\\s+to\\s+${NUM_TOKEN}%?$`, 'i'));
  if (m) return createBlockNode('set_size', { target: unquote(m[1]), size: Number(m[2]) });

  m = line.match(new RegExp(`^set\\s+opacity\\s+of\\s+${STR_TOKEN}\\s+to\\s+${NUM_TOKEN}%?$`, 'i'));
  if (m) return createBlockNode('set_opacity', { target: unquote(m[1]), opacity: Number(m[2]) });

  m = line.match(new RegExp(`^burst\\s+${NUM_TOKEN}\\s+${STR_TOKEN}\\s+particles\\s+at\\s+${STR_TOKEN}$`, 'i'));
  if (m) return createBlockNode('burst_particles', { count: Number(m[1]), style: unquote(m[2]), target: unquote(m[3]) });

  m = line.match(new RegExp(`^shake\\s+camera\\s+strength\\s+${NUM_TOKEN}\\s+for\\s+${NUM_TOKEN}\\s+sec(?:onds?)?$`, 'i'));
  if (m) return createBlockNode('camera_shake', { strength: Number(m[1]), sec: Number(m[2]) });

  m = line.match(new RegExp(`^zoom\\s+camera\\s+to\\s+${NUM_TOKEN}%?\\s+in\\s+${NUM_TOKEN}\\s+sec(?:onds?)?$`, 'i'));
  if (m) return createBlockNode('camera_zoom', { zoom: Number(m[1]), sec: Number(m[2]) });

  m = line.match(new RegExp(`^camera\\s+follow\\s+${STR_TOKEN}$`, 'i'));
  if (m) return createBlockNode('camera_follow', { target: unquote(m[1]) });

  m = line.match(
    new RegExp(`^${STR_TOKEN}\\s+drawing\\s+trail\\s+on\\s+${STR_TOKEN}\\s+color\\s+${STR_TOKEN}\\s+size\\s+${NUM_TOKEN}$`, 'i')
  );
  if (m) {
    return createBlockNode('pen_trail', {
      action: unquote(m[1]),
      target: unquote(m[2]),
      color: unquote(m[3]),
      size: Number(m[4]),
    });
  }

  // ================= CONTROL & LOGIC =================
  m = line.match(new RegExp(`^wait\\s+${NUM_TOKEN}\\s+seconds?$`, 'i'));
  if (m) return createBlockNode('wait_sec', { sec: Number(m[1]) });

  m = line.match(new RegExp(`^repeat\\s+${NUM_TOKEN}\\s+times?$`, 'i'));
  if (m) return createBlockNode('repeat_times', { times: Number(m[1]) });

  if (/^repeat\s+forever$/i.test(line)) {
    return createBlockNode('repeat_forever');
  }

  m = line.match(/^repeat\s+until\s+\((.+)\)$/i) || line.match(/^repeat\s+until\s+(.+)$/i);
  if (m) return createBlockNode('repeat_until', { condition: m[1].trim() });

  m = line.match(/^wait\s+until\s+\((.+)\)$/i) || line.match(/^wait\s+until\s+(.+)$/i);
  if (m) return createBlockNode('wait_until', { condition: m[1].trim() });

  m = line.match(/^if\s+\((.+)\)(?:\s+then)?$/i) || line.match(/^if\s+(.+?)(?:\s+then)?$/i);
  if (m) return createBlockNode('if_then', { condition: m[1].trim() });

  m = line.match(new RegExp(`^for\\s+each\\s+${STR_TOKEN}\\s+in\\s+list\\s+${STR_TOKEN}$`, 'i'));
  if (m) return createBlockNode('for_each', { varName: unquote(m[1]), listName: unquote(m[2]) });

  m = line.match(new RegExp(`^(?:send\\s+message|broadcast)\\s+${STR_TOKEN}$`, 'i'));
  if (m) return createBlockNode('broadcast', { msg: unquote(m[1]) });

  m = line.match(new RegExp(`^go\\s+to\\s+scene\\s+${STR_TOKEN}$`, 'i'));
  if (m) return createBlockNode('switch_scene', { scene: unquote(m[1]) });

  m = line.match(new RegExp(`^spawn\\s+a\\s+copy\\s+of\\s+${STR_TOKEN}\\s+at\\s+${STR_TOKEN}$`, 'i'));
  if (m) return createBlockNode('spawn_copy', { target: unquote(m[1]), origin: unquote(m[2]) });

  if (/^delete\s+this\s+copy$/i.test(line)) {
    return createBlockNode('delete_copy');
  }

  m = line.match(new RegExp(`^run\\s+(?:custom\\s+)?action\\s+${STR_TOKEN}$`, 'i'));
  if (m) return createBlockNode('run_action', { name: unquote(m[1]) });

  m = line.match(new RegExp(`^stop\\s+${STR_TOKEN}$`, 'i'));
  if (m) return createBlockNode('stop_scripts', { scope: unquote(m[1]) });

  // ================= SOUND & MUSIC =================
  m = line.match(new RegExp(`^play\\s+sound(?:\\s+effect)?\\s+${STR_TOKEN}$`, 'i'));
  if (m) return createBlockNode('play_sound', { sfx: unquote(m[1]) });

  m = line.match(new RegExp(`^play\\s+note\\s+${STR_TOKEN}\\s+for\\s+${NUM_TOKEN}\\s+sec(?:onds?)?\\s+on\\s+${STR_TOKEN}$`, 'i'));
  if (m) return createBlockNode('play_note', { note: unquote(m[1]), sec: Number(m[2]), instrument: unquote(m[3]) });

  m = line.match(new RegExp(`^set\\s+(?:sound\\s+)?volume\\s+to\\s+${NUM_TOKEN}%?$`, 'i'));
  if (m) return createBlockNode('set_volume', { vol: Number(m[1]) });

  // ================= DATA & LISTS =================
  m = line.match(new RegExp(`^save\\s+${STR_TOKEN}\\s+to\\s+(?:browser\\s+)?storage$`, 'i'));
  if (m) return createBlockNode('save_storage', { var: unquote(m[1]) });

  m = line.match(new RegExp(`^load\\s+${STR_TOKEN}\\s+from\\s+(?:browser\\s+)?storage\\s+default\\s+(.+)$`, 'i'));
  if (m) return createBlockNode('load_storage', { var: unquote(m[1]), fallback: unquote(m[2]) });

  m = line.match(new RegExp(`^add\\s+${STR_TOKEN}\\s+to\\s+list\\s+${STR_TOKEN}$`, 'i'));
  if (m) return createBlockNode('list_add', { item: unquote(m[1]), list: unquote(m[2]) });

  m = line.match(new RegExp(`^remove\\s+item\\s+#?${NUM_TOKEN}\\s+from\\s+list\\s+${STR_TOKEN}$`, 'i'));
  if (m) return createBlockNode('list_remove', { index: Number(m[1]), list: unquote(m[2]) });

  m = line.match(new RegExp(`^clear\\s+list\\s+${STR_TOKEN}$`, 'i'));
  if (m) return createBlockNode('list_clear', { list: unquote(m[1]) });

  m = line.match(new RegExp(`^print(?:\\s+to\\s+console)?\\s+(.+)$`, 'i'));
  if (m) return createBlockNode('log_note', { text: unquote(m[1]) });

  // ================= WEBSITE & UI =================
  m = line.match(new RegExp(`^set\\s+page\\s+theme\\s+to\\s+${STR_TOKEN}$`, 'i'));
  if (m) return createBlockNode('set_theme', { theme: unquote(m[1]) });

  m = line.match(new RegExp(`^set\\s+text\\s+of\\s+${STR_TOKEN}\\s+to\\s+(.+)$`, 'i'));
  if (m) return createBlockNode('set_web_text', { target: unquote(m[1]), text: unquote(m[2]) });

  m = line.match(
    new RegExp(`^style\\s+${STR_TOKEN}\\s+bg\\s+${STR_TOKEN}\\s+text\\s+${STR_TOKEN}\\s+rounded\\s+${NUM_TOKEN}(?:px)?$`, 'i')
  );
  if (m) {
    return createBlockNode('set_web_style', {
      target: unquote(m[1]),
      bgColor: unquote(m[2]),
      textColor: unquote(m[3]),
      rounded: Number(m[4]),
    });
  }

  m = line.match(new RegExp(`^create\\s+${STR_TOKEN}\\s+named\\s+${STR_TOKEN}\\s+saying\\s+(.+)$`, 'i'));
  if (m) return createBlockNode('add_web_element', { webType: unquote(m[1]), name: unquote(m[2]), text: unquote(m[3]) });

  m = line.match(new RegExp(`^remove\\s+web(?:\\s+element)?\\s+${STR_TOKEN}$`, 'i'));
  if (m) return createBlockNode('remove_web_element', { target: unquote(m[1]) });

  m = line.match(new RegExp(`^open\\s+link\\s+${STR_TOKEN}$`, 'i'));
  if (m) return createBlockNode('open_url', { url: unquote(m[1]) });

  m = line.match(new RegExp(`^show\\s+(?:alert\\s+banner|banner\\s+alert|alert)\\s+${STR_TOKEN}(?:\\s+style\\s+${STR_TOKEN})?$`, 'i'));
  if (m) return createBlockNode('show_toast', { text: unquote(m[1]), tone: m[2] ? unquote(m[2]) : 'info' });

  m = line.match(new RegExp(`^ask\\s+(?:user\\s+)?${STR_TOKEN}\\s+save(?:\\s+answer)?\\s+to\\s+${STR_TOKEN}$`, 'i'));
  if (m) return createBlockNode('ask_prompt', { question: unquote(m[1]), var: unquote(m[2]) });

  // Generic variable set/change placed after more specific set_* rules
  m = line.match(new RegExp(`^set\\s+(?:var\\s+)?${STR_TOKEN}\\s+to\\s+(.+)$`, 'i'));
  if (m) return createBlockNode('set_var', { var: unquote(m[1]), value: unquote(m[2]) });

  m = line.match(new RegExp(`^change\\s+(?:var\\s+)?${STR_TOKEN}\\s+by\\s+${NUM_TOKEN}$`, 'i'));
  if (m) return createBlockNode('change_var', { var: unquote(m[1]), delta: Number(m[2]) });

  return null;
}

export function parseOpenScript(
  source: string,
  defaultTargetId: string,
  entities: Entity[] = []
): OpenScriptParseResult {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const scripts: ScriptStack[] = [];
  const errors: ParseError[] = [];

  const nameToId = new Map<string, string>();
  for (const e of entities) {
    nameToId.set(e.name.toLowerCase(), e.id);
    nameToId.set(e.id.toLowerCase(), e.id);
  }

  let currentTargetId = defaultTargetId;
  let currentScript: ScriptStack | null = null;

  interface ContainerFrame {
    indent: number;
    list: BlockNode[];
    lastIfBlock?: BlockNode;
  }
  let stack: ContainerFrame[] = [];

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const raw = lines[i];
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) continue;

    const targetMatch = trimmed.match(/^@target\s+(.+)$/i);
    if (targetMatch) {
      const tName = unquote(targetMatch[1]).toLowerCase();
      currentTargetId = tName === 'stage' ? 'stage' : nameToId.get(tName) ?? defaultTargetId;
      continue;
    }

    const indent = raw.search(/\S/);

    // Handle otherwise / else branch
    if (/^(otherwise|else):?$/i.test(trimmed)) {
      while (stack.length > 1 && indent < stack[stack.length - 1].indent) {
        stack.pop();
      }
      const top = stack[stack.length - 1];
      const ifBlk = top?.lastIfBlock;
      if (ifBlk && ifBlk.type === 'if_then') {
        if (!ifBlk.elseBody) ifBlk.elseBody = [];
        stack.push({ indent: indent + 1, list: ifBlk.elseBody });
      } else {
        errors.push({ line: lineNum, message: '"otherwise:" must follow an "if ... then:" block.' });
      }
      continue;
    }

    const node = parseSingleLineToBlock(trimmed);
    if (!node) {
      errors.push({ line: lineNum, message: `Could not understand line: "${trimmed}"` });
      continue;
    }

    const def = getBlockDefinition(node.type);
    if (def?.isHat) {
      currentScript = {
        id: makeId('scr'),
        targetId: currentTargetId,
        enabled: true,
        hat: node,
        body: [],
      };
      scripts.push(currentScript);
      stack = [{ indent, list: currentScript.body }];
      continue;
    }

    if (!currentScript) {
      // Auto-wrap orphan statements in a when_start script for friendliness
      currentScript = {
        id: makeId('scr'),
        targetId: currentTargetId,
        enabled: true,
        hat: createBlockNode('when_start'),
        body: [],
      };
      scripts.push(currentScript);
      stack = [{ indent: -1, list: currentScript.body }];
    }

    while (stack.length > 1 && indent < stack[stack.length - 1].indent) {
      stack.pop();
    }

    const frame = stack[stack.length - 1];
    frame.list.push(node);
    if (node.type === 'if_then') {
      frame.lastIfBlock = node;
    }
    if (def?.isCBlock) {
      if (!node.body) node.body = [];
      stack.push({ indent: indent + 1, list: node.body });
    }
  }

  return { scripts, errors };
}

/**
 * Deterministic natural-language sentence parser for the Smart Sentence Bar!
 * Converts casual English like:
 *   "when space pressed jump"
 *   "when Hero touches Coin add 1 to score and play coin sound"
 *   "glide Hero to 100 50 in 1 second"
 *   "say Hello World for 2 seconds"
 * into ready-to-drop OpenScratch BlockNodes without requiring an AI API key.
 */
export function parseNaturalSentence(input: string, activeEntityName = 'this'): BlockNode[] {
  const cleaned = input.trim();
  if (!cleaned) return [];

  // First try direct OpenScript line parse
  const direct = parseSingleLineToBlock(cleaned);
  if (direct) return [direct];

  // Insert implicit clause boundaries before action verbs following a hat phrase
  const normalized = cleaned.replace(
    /^(when\s+(?:(?:project|game)\s+starts?|(?:the\s+)?\S+\s+(?:key\s+)?(?:is\s+)?(?:pressed|held|released)|(?:I\s+press|pressing|press)\s+(?:the\s+)?\S+(?:\s+key)?|\S+\s+(?:touches|hits)\s+\S+|(?:button\s+)?\S+\s+(?:is\s+)?clicked))\s+(?=(?:add|increase|set|change|play|move|glide|jump|say|show|hide|burst|wait|go|switch|create|spawn)\b)/i,
    '$1, then '
  );

  // Split multi-clause casual English sentences cleanly
  const clauses = normalized
    .split(/\s*(?:,\s*then\s+|,\s*and\s+|\s+then\s+|\s+and\s+|;\s*)\s*/i)
    .map((s) => s.trim())
    .filter(Boolean);

  const blocks: BlockNode[] = [];

  for (const clause of clauses) {
    const directClause = parseSingleLineToBlock(clause);
    if (directClause) {
      blocks.push(directClause);
      continue;
    }

    let m: RegExpMatchArray | null;

    // Hat patterns
    if (/^(?:when\s+)?(?:game|project)\s+starts?$/i.test(clause)) {
      blocks.push(createBlockNode('when_start'));
      continue;
    }
    m = clause.match(/^when\s+(?:the\s+)?(.+?)\s+(?:key\s+)?(?:is\s+)?(pressed|held|released)$/i)
      || clause.match(/^when\s+(?:I\s+press|pressing|press)\s+(?:the\s+)?(.+?)(?:\s+key)?$/i);
    if (m) {
      blocks.push(createBlockNode('when_key', { key: m[1].trim().toLowerCase(), mode: m[2]?.toLowerCase() ?? 'pressed' }));
      continue;
    }

    m = clause.match(/^when\s+(.+?)\s+(?:touches|hits|collides\s+with)\s+(.+)$/i);
    if (m) {
      blocks.push(createBlockNode('when_touches', { a: m[1].trim(), b: m[2].trim() }));
      continue;
    }

    m = clause.match(/^when\s+(?:button\s+)?(.+?)\s+(?:is\s+)?clicked$/i);
    if (m) {
      blocks.push(createBlockNode('when_clicked', { target: m[1].trim() }));
      continue;
    }

    // Motion & jump shortcuts
    m = clause.match(/^jump(?:\s+(\d+))?$/i);
    if (m) {
      blocks.push(createBlockNode('set_velocity', { target: activeEntityName, vx: 0, vy: Number(m[1] ?? 13) }));
      continue;
    }

    m = clause.match(/^move(?:\s+(\S+))?\s+(right|left|up|down)(?:\s+by)?\s+(-?\d+(?:\.\d+)?)$/i);
    if (m) {
      blocks.push(createBlockNode('move_direction', { target: m[1] ?? activeEntityName, dir: m[2].toLowerCase(), amount: Number(m[3]) }));
      continue;
    }

    m = clause.match(/^move(?:\s+(\S+))?\s+(-?\d+(?:\.\d+)?)(?:\s+steps?)?$/i);
    if (m) {
      blocks.push(createBlockNode('move_steps', { target: m[1] ?? activeEntityName, steps: Number(m[2]) }));
      continue;
    }

    m = clause.match(/^glide\s+(\S+)\s+to\s+(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)(?:\s+in\s+(\d+(?:\.\d+)?)\s*(?:s|sec|seconds?)?)?$/i);
    if (m) {
      blocks.push(createBlockNode('glide_to', { target: m[1], x: m[2], y: m[3], sec: Number(m[4] ?? 0.8), ease: 'smooth' }));
      continue;
    }

    // Looks & particles
    m = clause.match(/^say\s+["']?(.+?)["']?(?:\s+for\s+(\d+(?:\.\d+)?)\s*(?:s|sec|seconds?)?)?$/i);
    if (m) {
      blocks.push(createBlockNode('say_text', { target: activeEntityName, text: m[1].trim(), sec: Number(m[2] ?? 2) }));
      continue;
    }

    m = clause.match(/^burst(?:\s+(\d+))?\s+(confetti|spark|smoke|hearts|stars)(?:\s+particles)?(?:\s+at\s+(\S+))?$/i);
    if (m) {
      blocks.push(createBlockNode('burst_particles', { count: Number(m[1] ?? 16), style: m[2].toLowerCase(), target: m[3] ?? activeEntityName }));
      continue;
    }

    // Data / score
    m = clause.match(/^(?:add|increase)\s+(-?\d+(?:\.\d+)?)\s+to\s+([a-zA-Z_]\w*)$/i);
    if (m) {
      blocks.push(createBlockNode('change_var', { var: m[2], delta: Number(m[1]) }));
      continue;
    }

    m = clause.match(/^set\s+([a-zA-Z_]\w*)\s+(?:to|=)\s+(.+)$/i);
    if (m) {
      blocks.push(createBlockNode('set_var', { var: m[1], value: unquote(m[2]) }));
      continue;
    }

    // Sound
    m = clause.match(/^play\s+(?:sound\s+)?(coin|jump|laser|hit|powerup|pop|click|win|lose|whoosh)(?:\s+sound)?$/i);
    if (m) {
      blocks.push(createBlockNode('play_sound', { sfx: m[1].toLowerCase() }));
      continue;
    }

    // Website shortcuts
    m = clause.match(/^(?:add|create)\s+(?:a\s+)?(heading|paragraph|button|input|card|badge)\s+(?:named\s+(\S+)\s+)?(?:saying|text|labeled)?\s*["']?(.+?)["']?$/i);
    if (m) {
      const label = m[3].trim();
      const name = m[2] ?? label.toLowerCase().replace(/[^a-z0-9]+/g, '_') + '_el';
      blocks.push(createBlockNode('add_web_element', { webType: m[1].toLowerCase(), name, text: label }));
      continue;
    }

    m = clause.match(/^show\s+(?:alert|banner|toast)\s+["']?(.+?)["']?$/i);
    if (m) {
      blocks.push(createBlockNode('show_toast', { text: m[1].trim(), tone: 'success' }));
      continue;
    }

    m = clause.match(/^(?:go\s+to|switch\s+to)\s+scene\s+["']?(.+?)["']?$/i);
    if (m) {
      blocks.push(createBlockNode('switch_scene', { scene: m[1].trim() }));
      continue;
    }

    m = clause.match(/^wait\s+(\d+(?:\.\d+)?)\s*(?:s|sec|seconds?)?$/i);
    if (m) {
      blocks.push(createBlockNode('wait_sec', { sec: Number(m[1]) }));
      continue;
    }
  }

  return blocks;
}
