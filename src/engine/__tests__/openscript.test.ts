import { describe, expect, it } from 'vitest';
import { BLOCK_DEFINITIONS, createBlockNode } from '../blockCatalog';
import {
  blockToOpenScriptLine,
  parseNaturalSentence,
  parseOpenScript,
  parseSingleLineToBlock,
  scriptsToOpenScript,
} from '../openscript';
import { PROJECT_TEMPLATES } from '../../data/templates';

describe('OpenScript round-trip & natural-language parser', () => {
  it('losslessly round-trips every block definition in the catalog', () => {
    for (const def of BLOCK_DEFINITIONS) {
      const node = createBlockNode(def.type);
      const line = blockToOpenScriptLine(node);
      const parsed = parseSingleLineToBlock(line);
      expect(parsed, `Failed round-trip for ${def.type}: "${line}"`).not.toBeNull();
      expect(parsed?.type).toBe(def.type);
      for (const arg of def.args) {
        expect(String(parsed?.args[arg.name])).toBe(String(node.args[arg.name]));
      }
    }
  });

  it('round-trips nested if/otherwise, repeat, and multi-target scripts cleanly', () => {
    const template = PROJECT_TEMPLATES[3].create(); // Creator Portfolio with nested if/otherwise
    const source = scriptsToOpenScript(template.scripts, template.entities, true);
    const parsed = parseOpenScript(source, 'stage', template.entities);

    expect(parsed.errors).toEqual([]);
    expect(parsed.scripts.length).toBe(template.scripts.length);

    const reserialized = scriptsToOpenScript(parsed.scripts, template.entities, true);
    expect(reserialized).toBe(source);
  });

  it('parses casual English sentences into multi-block sequences offline', () => {
    const blocks = parseNaturalSentence(
      'when Hero touches Coin add 1 to score and play coin',
      'Hero'
    );
    expect(blocks.map((b) => b.type)).toEqual(['when_touches', 'change_var', 'play_sound']);
    expect(blocks[0].args).toEqual({ a: 'Hero', b: 'Coin' });
    expect(blocks[1].args).toEqual({ var: 'score', delta: 1 });
    expect(blocks[2].args).toEqual({ sfx: 'coin' });

    const jumpBlocks = parseNaturalSentence('when space pressed jump 15', 'Hero');
    expect(jumpBlocks.map((b) => b.type)).toEqual(['when_key', 'set_velocity']);
    expect(jumpBlocks[1].args.vy).toBe(15);

    const webBlocks = parseNaturalSentence('add button Play Now', 'Stage');
    expect(webBlocks.map((b) => b.type)).toEqual(['add_web_element']);
    expect(webBlocks[0].args.webType).toBe('button');
    expect(webBlocks[0].args.text).toBe('Play Now');
  });

  it('reports line errors for invalid OpenScript syntax without crashing', () => {
    const res = parseOpenScript('when project starts:\n  gobbledygook xyz 123', 'stage', []);
    expect(res.errors.length).toBe(1);
    expect(res.errors[0].line).toBe(2);
    expect(res.scripts.length).toBe(1);
  });
});
