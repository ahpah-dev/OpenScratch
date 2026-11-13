import { describe, expect, it } from 'vitest';
import { buildSystemPrompt, extractAiProposal } from '../../ai/byok';
import { PROJECT_TEMPLATES } from '../../data/templates';

describe('BYOK AI Assistant helpers', () => {
  it('builds a project-aware system prompt containing OpenScript grammar', () => {
    const proj = PROJECT_TEMPLATES[0].create();
    const prompt = buildSystemPrompt(proj, proj.entities[0].id);
    expect(prompt).toContain('Sky Jumper');
    expect(prompt).toContain('Hero');
    expect(prompt).toContain('when project starts:');
  });

  it('extracts valid OpenScript, new entities, and variables from AI responses', () => {
    const proj = PROJECT_TEMPLATES[4].create();
    const reply = `Here is a quick enemy patrol!
\`\`\`openscratch-entities
[{"kind":"sprite","name":"Slime","preset":"slime","x":150,"y":0}]
\`\`\`
\`\`\`openscratch-vars
{"lives": 3}
\`\`\`
\`\`\`openscript
@target "Slime"
when project starts:
  repeat forever:
    glide "this" to x "-150" y "0" in 1 sec ease "smooth"
    glide "this" to x "150" y "0" in 1 sec ease "smooth"
\`\`\``;

    const proposal = extractAiProposal(reply, proj, proj.entities[0].id);
    expect(proposal).not.toBeNull();
    expect(proposal?.parseErrors).toEqual([]);
    expect(proposal?.newEntities.length).toBe(1);
    expect(proposal?.variables).toEqual({ lives: 3 });
    expect(proposal?.parsedScripts.length).toBe(1);
  });
});
