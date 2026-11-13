import { describe, expect, it } from 'vitest';
import { OpenScratchRuntime, evaluateExpression, interpolateText } from '../coreRuntime.js';
import { exportProjectToHtml } from '../exporter';
import { PROJECT_TEMPLATES } from '../../data/templates';
import { createBlockNode, makeId } from '../blockCatalog';
import { createSpriteEntity } from '../../data/assets';

describe('OpenScratchRuntime execution engine', () => {
  it('evaluates safe math, logic, list, and string interpolation expressions', () => {
    const proj = PROJECT_TEMPLATES[4].create(); // Blank
    proj.variables = { score: 12, name: 'Ada' };
    proj.lists = { bag: ['Key', 'Map'] };

    const rt = new OpenScratchRuntime(proj);
    expect(evaluateExpression('score * 2 + 1', rt)).toBe(25);
    expect(evaluateExpression('score >= 10 and name == "Ada"', rt)).toBe(true);
    expect(evaluateExpression('bag contains "Map"', rt)).toBe(true);
    expect(evaluateExpression('length("bag")', rt)).toBe(2);
    expect(interpolateText('Hi {name}, score={score}', rt)).toBe('Hi Ada, score=12');
  });

  it('runs platformer physics, solid landing, and collision hat events', async () => {
    const proj = PROJECT_TEMPLATES[0].create(); // Sky Jumper
    const rt = new OpenScratchRuntime(proj);
    rt.start();

    await new Promise((r) => setTimeout(r, 40));
    const hero = rt.entities.find((e) => e.name === 'Hero');
    expect(hero.physics.mode).toBe('platformer');

    // Step gravity frames until hero lands on FloorLeft (y = -195, hh = 38.4, hero hh = 22 -> y = -134.6)
    for (let i = 0; i < 45; i++) {
      rt.stepFrame(1 / 60, rt.runId);
    }
    expect(hero.grounded).toBe(true);
    expect(hero.y).toBeCloseTo(-134.6, 1);

    // Move hero right onto Coin1 (-60, -115) and trigger touch
    hero.x = -60;
    hero.y = -115;
    rt.stepFrame(1 / 60, rt.runId);
    await new Promise((r) => setTimeout(r, 30));

    expect(rt.variables.score).toBe(1);
    const coin1 = rt.entities.find((e) => e.name === 'Coin1');
    expect(coin1.visible).toBe(false);
    rt.stop();
  });

  it('executes custom actions, lists, and clone spawning', async () => {
    const s1 = 's1';
    const sp = createSpriteEntity('Spawner', s1, { id: 'sp1', x: 10, y: 20 });
    const proj = PROJECT_TEMPLATES[4].create();
    proj.scenes = [{ id: s1, name: 'Main', theme: 'dark-modern', background: { type: 'color', color1: '#000', color2: '#000' } }];
    proj.activeSceneId = s1;
    proj.entities = [sp];
    proj.variables = { clonesSpawned: 0 };
    proj.lists = { items: [] };
    proj.scripts = [
      {
        id: makeId('scr'),
        targetId: sp.id,
        enabled: true,
        hat: createBlockNode('when_start'),
        body: [
          createBlockNode('run_action', { name: 'addLoot' }),
          createBlockNode('spawn_copy', { target: 'this', origin: 'this' }),
        ],
      },
      {
        id: makeId('scr'),
        targetId: sp.id,
        enabled: true,
        hat: createBlockNode('define_action', { name: 'addLoot' }),
        body: [createBlockNode('list_add', { item: 'Emerald', list: 'items' })],
      },
      {
        id: makeId('scr'),
        targetId: sp.id,
        enabled: true,
        hat: createBlockNode('when_clone_starts', { target: 'this' }),
        body: [
          createBlockNode('change_var', { var: 'clonesSpawned', delta: 1 }),
          createBlockNode('delete_copy'),
        ],
      },
    ];

    const rt = new OpenScratchRuntime(proj);
    rt.start();
    await new Promise((r) => setTimeout(r, 50));

    expect(rt.lists.items).toEqual(['Emerald']);
    expect(rt.variables.clonesSpawned).toBe(1);
    expect(rt.entities.filter((e) => e.isClone).length).toBe(0);
    rt.stop();
  });

  it('renders and handles clicks on Website UI elements and exports safe standalone HTML', async () => {
    const proj = PROJECT_TEMPLATES[3].create(); // Creator Portfolio
    const canvas = document.createElement('canvas');
    const webRoot = document.createElement('div');
    const rt = new OpenScratchRuntime(proj);
    rt.attachDOM(canvas, webRoot);
    rt.start();

    const btns = Array.from(webRoot.querySelectorAll('button'));
    const themeBtn = btns.find((b) => b.textContent?.includes('Cycle Page Theme'));
    expect(themeBtn).toBeTruthy();

    themeBtn!.click();
    await new Promise((r) => setTimeout(r, 40));
    expect(rt.theme).toBe('clean-light');
    expect(rt.variables.themeName).toBe('Clean Light');

    // Verify standalone HTML export escapes </script> cleanly and embeds engine
    proj.variables.evil = '</script><script>alert(1)</script>';
    const html = exportProjectToHtml(proj);
    expect(html).toContain('<!doctype html>');
    expect(html).toContain('class OpenScratchRuntime');
    expect(html).not.toContain('</script><script>alert(1)</script>');
    rt.stop();
    rt.detachDOM();
  });
});
