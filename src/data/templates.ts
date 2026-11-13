import type { OpenScratchProject } from '../types/project';
import { createBlockNode, makeId } from '../engine/blockCatalog';
import { createSpriteEntity, createWebEntity } from './assets';

export interface ProjectTemplate {
  id: string;
  name: string;
  category: 'game' | 'animation' | 'website' | 'unified';
  badge: string;
  description: string;
  create: () => OpenScratchProject;
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'sky-jumper',
    name: 'Sky Jumper',
    category: 'game',
    badge: 'Platformer Game',
    description: 'Arrow keys / WASD + Space to jump across platforms, grab coins, and hit the goal star!',
    create: () => {
      const s1 = 'scene_sky_1';
      const hero = createSpriteEntity('Hero', s1, {
        id: 'sp_hero',
        x: -240,
        y: -40,
        costumes: [
          { id: makeId('cos'), name: 'hero', kind: 'preset', value: 'hero', color: '#6366f1' },
          { id: makeId('cos'), name: 'cheer', kind: 'emoji', value: '🤩' },
        ],
      });
      const floorLeft = createSpriteEntity('FloorLeft', s1, {
        id: 'sp_floor_l',
        x: -200,
        y: -195,
        size: 320,
        costumes: [{ id: makeId('cos'), name: 'plat', kind: 'preset', value: 'platform', color: '#334155' }],
      });
      const floorRight = createSpriteEntity('FloorRight', s1, {
        id: 'sp_floor_r',
        x: 180,
        y: -195,
        size: 320,
        costumes: [{ id: makeId('cos'), name: 'plat', kind: 'preset', value: 'platform', color: '#334155' }],
      });
      const stepPlat = createSpriteEntity('CloudStep', s1, {
        id: 'sp_step',
        x: 10,
        y: -50,
        size: 160,
        costumes: [{ id: makeId('cos'), name: 'plat', kind: 'preset', value: 'platform', color: '#4f46e5' }],
      });
      const coin1 = createSpriteEntity('Coin1', s1, {
        id: 'sp_coin1',
        x: -60,
        y: -115,
        size: 90,
        costumes: [{ id: makeId('cos'), name: 'coin', kind: 'preset', value: 'coin', color: '#fbbf24' }],
      });
      const coin2 = createSpriteEntity('Coin2', s1, {
        id: 'sp_coin2',
        x: 10,
        y: 15,
        size: 90,
        costumes: [{ id: makeId('cos'), name: 'coin', kind: 'preset', value: 'coin', color: '#fbbf24' }],
      });
      const goal = createSpriteEntity('GoalStar', s1, {
        id: 'sp_goal',
        x: 240,
        y: -110,
        size: 115,
        costumes: [{ id: makeId('cos'), name: 'star', kind: 'preset', value: 'star', color: '#fde047' }],
      });
      const hudBadge = createWebEntity('ScoreHUD', 'badge', s1, {
        id: 'web_hud',
        text: 'Coins: {score} / 2  ·  Arrows / Space to Jump',
        webStyle: { align: 'left', bgColor: 'rgba(15,23,42,0.8)', textColor: '#fde047' },
      });

      return {
        version: 1,
        id: makeId('proj'),
        title: 'Sky Jumper',
        mode: 'game',
        activeSceneId: s1,
        scenes: [
          {
            id: s1,
            name: 'Sky Meadow',
            theme: 'dark-modern',
            background: { type: 'gradient', color1: '#0f172a', color2: '#1e3a8a', stars: true },
          },
        ],
        entities: [hero, floorLeft, floorRight, stepPlat, coin1, coin2, goal, hudBadge],
        variables: { score: 0, won: false },
        lists: {},
        scripts: [
          {
            id: makeId('scr'),
            targetId: hero.id,
            enabled: true,
            hat: createBlockNode('when_start'),
            body: [
              createBlockNode('set_var', { var: 'score', value: '0' }),
              createBlockNode('enable_platformer', { target: 'this', speed: 5, jump: 13, gravity: 0.7 }),
              createBlockNode('bounce_edges', { target: 'this' }),
              createBlockNode('make_solid', { target: 'FloorLeft' }),
              createBlockNode('make_solid', { target: 'FloorRight' }),
              createBlockNode('make_solid', { target: 'CloudStep' }),
              createBlockNode('say_text', { target: 'this', text: 'Grab the coins & star!', sec: 2.5 }),
            ],
          },
          {
            id: makeId('scr'),
            targetId: hero.id,
            enabled: true,
            hat: createBlockNode('when_touches', { a: 'this', b: 'Coin1' }),
            body: [
              createBlockNode('change_var', { var: 'score', delta: 1 }),
              createBlockNode('play_sound', { sfx: 'coin' }),
              createBlockNode('burst_particles', { count: 16, style: 'spark', target: 'Coin1' }),
              createBlockNode('hide_show', {}), // wait — let's use exact opcode show_hide!
            ].filter((b) => b.type !== 'hide_show').concat([
              createBlockNode('show_hide', { action: 'hide', target: 'Coin1' }),
            ]),
          },
          {
            id: makeId('scr'),
            targetId: hero.id,
            enabled: true,
            hat: createBlockNode('when_touches', { a: 'this', b: 'Coin2' }),
            body: [
              createBlockNode('change_var', { var: 'score', delta: 1 }),
              createBlockNode('play_sound', { sfx: 'coin' }),
              createBlockNode('burst_particles', { count: 16, style: 'spark', target: 'Coin2' }),
              createBlockNode('show_hide', { action: 'hide', target: 'Coin2' }),
            ],
          },
          {
            id: makeId('scr'),
            targetId: hero.id,
            enabled: true,
            hat: createBlockNode('when_touches', { a: 'this', b: 'GoalStar' }),
            body: [
              createBlockNode('play_sound', { sfx: 'win' }),
              createBlockNode('burst_particles', { count: 36, style: 'confetti', target: 'GoalStar' }),
              createBlockNode('switch_costume', { target: 'this', costume: 'cheer' }),
              createBlockNode('show_toast', { text: 'You beat Sky Jumper! Coins: {score}/2', tone: 'success' }),
            ],
          },
        ],
      };
    },
  },
  {
    id: 'space-defender',
    name: 'Space Defender',
    category: 'game',
    badge: 'Arcade Shooter',
    description: 'Pilot your rocket, fire laser clones with Space, and blast incoming slimes!',
    create: () => {
      const s1 = 'scene_space_1';
      const rocket = createSpriteEntity('Rocket', s1, {
        id: 'sp_rocket',
        x: 0,
        y: -175,
        costumes: [{ id: makeId('cos'), name: 'rocket', kind: 'preset', value: 'rocket', color: '#f43f5e' }],
      });
      const laser = createSpriteEntity('Laser', s1, {
        id: 'sp_laser',
        x: 0,
        y: -140,
        visible: false,
        size: 70,
        costumes: [{ id: makeId('cos'), name: 'zap', kind: 'emoji', value: '⚡' }],
      });
      const alien = createSpriteEntity('Alien', s1, {
        id: 'sp_alien',
        x: 0,
        y: 180,
        costumes: [{ id: makeId('cos'), name: 'slime', kind: 'preset', value: 'slime', color: '#4ade80' }],
      });
      const hud = createWebEntity('SpaceHUD', 'badge', s1, {
        id: 'web_space_hud',
        text: 'Score: {score}  ·  Left/Right to Fly · Space to Fire',
        webStyle: { align: 'center', bgColor: 'rgba(15,23,42,0.8)', textColor: '#38bdf8' },
      });

      return {
        version: 1,
        id: makeId('proj'),
        title: 'Space Defender',
        mode: 'game',
        activeSceneId: s1,
        scenes: [
          {
            id: s1,
            name: 'Deep Space',
            theme: 'retro-arcade',
            background: { type: 'space', color1: '#020617', color2: '#1e1b4b', stars: true },
          },
        ],
        entities: [rocket, laser, alien, hud],
        variables: { score: 0 },
        lists: {},
        scripts: [
          {
            id: makeId('scr'),
            targetId: rocket.id,
            enabled: true,
            hat: createBlockNode('when_start'),
            body: [
              createBlockNode('set_var', { var: 'score', value: '0' }),
              createBlockNode('bounce_edges', { target: 'this' }),
            ],
          },
          {
            id: makeId('scr'),
            targetId: rocket.id,
            enabled: true,
            hat: createBlockNode('when_key', { key: 'left arrow', mode: 'held' }),
            body: [createBlockNode('move_direction', { target: 'this', dir: 'left', amount: 7 })],
          },
          {
            id: makeId('scr'),
            targetId: rocket.id,
            enabled: true,
            hat: createBlockNode('when_key', { key: 'right arrow', mode: 'held' }),
            body: [createBlockNode('move_direction', { target: 'this', dir: 'right', amount: 7 })],
          },
          {
            id: makeId('scr'),
            targetId: rocket.id,
            enabled: true,
            hat: createBlockNode('when_key', { key: 'space', mode: 'pressed' }),
            body: [
              createBlockNode('play_sound', { sfx: 'laser' }),
              createBlockNode('spawn_copy', { target: 'Laser', origin: 'Rocket' }),
            ],
          },
          {
            id: makeId('scr'),
            targetId: laser.id,
            enabled: true,
            hat: createBlockNode('when_clone_starts', { target: 'this' }),
            body: [
              createBlockNode('repeat_times', { times: 38 }, [
                createBlockNode('move_direction', { target: 'this', dir: 'up', amount: 12 }),
                createBlockNode('if_then', { condition: 'this touches Alien' }, [
                  createBlockNode('change_var', { var: 'score', delta: 10 }),
                  createBlockNode('play_sound', { sfx: 'hit' }),
                  createBlockNode('burst_particles', { count: 20, style: 'spark', target: 'Alien' }),
                  createBlockNode('camera_shake', { strength: 6, sec: 0.2 }),
                  createBlockNode('go_to_xy', { target: 'Alien', x: 'random(-300, 300)', y: '185' }),
                  createBlockNode('delete_copy'),
                ]),
              ]),
              createBlockNode('delete_copy'),
            ],
          },
          {
            id: makeId('scr'),
            targetId: alien.id,
            enabled: true,
            hat: createBlockNode('when_start'),
            body: [
              createBlockNode('repeat_forever', {}, [
                createBlockNode('glide_to', { target: 'this', x: 'random(-280, 280)', y: '140', sec: 1.4, ease: 'smooth' }),
                createBlockNode('glide_to', { target: 'this', x: 'random(-280, 280)', y: '40', sec: 1.4, ease: 'smooth' }),
              ]),
            ],
          },
        ],
      };
    },
  },
  {
    id: 'sunset-story',
    name: 'Sunset Story',
    category: 'animation',
    badge: 'Animation & Scenes',
    description: 'Smooth easing glides, dialogue bubbles, glowing ink trails, and scene transitions.',
    create: () => {
      const s1 = 'scene_anim_1';
      const s2 = 'scene_anim_2';
      const fox = createSpriteEntity('Fox', s1, {
        id: 'sp_fox',
        x: -240,
        y: -80,
        size: 130,
        costumes: [{ id: makeId('cos'), name: 'fox', kind: 'emoji', value: '🦊' }],
      });
      const firefly = createSpriteEntity('Firefly', 'global', {
        id: 'sp_firefly',
        x: 200,
        y: 80,
        size: 100,
        costumes: [{ id: makeId('cos'), name: 'star', kind: 'preset', value: 'star', color: '#fde047' }],
      });
      const caption = createWebEntity('StoryCaption', 'badge', 'global', {
        id: 'web_caption',
        text: 'Scene: {scene} · Animated with OpenScratch Easing',
        webStyle: { align: 'center', bgColor: 'rgba(15,23,42,0.72)', textColor: '#f8fafc' },
      });

      return {
        version: 1,
        id: makeId('proj'),
        title: 'Sunset Story',
        mode: 'animation',
        activeSceneId: s1,
        scenes: [
          {
            id: s1,
            name: 'Golden Sunset',
            theme: 'dark-modern',
            background: { type: 'sunset', color1: '#7c2d12', color2: '#db2777' },
          },
          {
            id: s2,
            name: 'Starry Finale',
            theme: 'dark-modern',
            background: { type: 'space', color1: '#090d1a', color2: '#312e81', stars: true },
          },
        ],
        entities: [fox, firefly, caption],
        variables: {},
        lists: {},
        scripts: [
          {
            id: makeId('scr'),
            targetId: fox.id,
            enabled: true,
            hat: createBlockNode('when_start'),
            body: [
              createBlockNode('say_text', { target: 'this', text: 'Look at that glowing star!', sec: 2.2 }),
              createBlockNode('glide_to', { target: 'this', x: '0', y: '-30', sec: 1.4, ease: 'smooth' }),
              createBlockNode('animate_prop', { target: 'this', prop: 'scale', value: 165, sec: 0.6, ease: 'bounce' }),
              createBlockNode('play_note', { note: 'C5', sec: 0.3, instrument: 'piano' }),
              createBlockNode('play_note', { note: 'E5', sec: 0.3, instrument: 'piano' }),
              createBlockNode('play_note', { note: 'G5', sec: 0.5, instrument: 'piano' }),
              createBlockNode('switch_scene', { scene: 'Starry Finale' }),
              createBlockNode('camera_zoom', { zoom: 118, sec: 0.8 }),
              createBlockNode('burst_particles', { count: 40, style: 'confetti', target: 'Firefly' }),
              createBlockNode('show_toast', { text: 'The End — Made in Animation Mode!', tone: 'info' }),
            ],
          },
          {
            id: makeId('scr'),
            targetId: firefly.id,
            enabled: true,
            hat: createBlockNode('when_start'),
            body: [
              createBlockNode('pen_trail', { action: 'start', target: 'this', color: '#fde047', size: 4 }),
              createBlockNode('glide_to', { target: 'this', x: '-160', y: '110', sec: 1.5, ease: 'elastic' }),
              createBlockNode('glide_to', { target: 'this', x: '180', y: '90', sec: 1.5, ease: 'smooth' }),
              createBlockNode('pen_trail', { action: 'stop', target: 'this', color: '#fde047', size: 4 }),
            ],
          },
        ],
      };
    },
  },
  {
    id: 'creator-portfolio',
    name: 'Creator Portfolio',
    category: 'website',
    badge: 'Interactive Website',
    description: 'Multi-page responsive website with live theme toggle, reactive greeting input & action cards.',
    create: () => {
      const home = 'page_home';
      const about = 'page_about';
      const nav = createWebEntity('TopNav', 'nav', 'global', {
        id: 'web_nav',
        text: '✨ OpenScratch Studio',
        subtext: 'Home, Projects',
      });
      const badge = createWebEntity('HeroBadge', 'badge', home, {
        id: 'web_badge',
        text: 'PUBLIC DOMAIN · UNLICENSE',
      });
      const title = createWebEntity('HeroTitle', 'heading', home, {
        id: 'web_title',
        text: 'Hello, {visitor}!',
        webStyle: { size: 'xl', align: 'center' },
      });
      const intro = createWebEntity('HeroBody', 'paragraph', home, {
        id: 'web_intro',
        text: 'Welcome to my interactive website built 100% with natural-language OpenScratch blocks. Type your name below or switch themes!',
        webStyle: { align: 'center' },
      });
      const nameInput = createWebEntity('visitorInput', 'input', home, {
        id: 'web_input',
        text: 'Enter your name...',
        subtext: 'Type your name to personalize the headline live!',
        bindVar: 'visitor',
      });
      const themeBtn = createWebEntity('ThemeBtn', 'button', home, {
        id: 'web_theme_btn',
        text: '🎨 Cycle Page Theme ({themeName})',
        webStyle: { align: 'center', rounded: 14 },
      });
      const card1 = createWebEntity('GameCard', 'card', home, {
        id: 'web_card1',
        icon: '🎮',
        text: 'Interactive Games & Physics',
        subtext: 'Click this card to play a fanfare and test interactive web events!',
      });

      const aboutTitle = createWebEntity('ProjectsTitle', 'heading', about, {
        id: 'web_about_title',
        text: 'My Featured Creations',
        webStyle: { size: 'lg', align: 'left' },
      });
      const aboutCard = createWebEntity('ProjectCard', 'card', about, {
        id: 'web_about_card',
        icon: '🚀',
        text: 'Exportable Standalone HTML',
        subtext: 'Click Export HTML in the toolbar to download this entire site as a single self-contained webpage!',
      });
      const backBtn = createWebEntity('BackHomeBtn', 'button', about, {
        id: 'web_back_btn',
        text: '← Back to Home',
        webStyle: { variant: 'outline' },
      });

      return {
        version: 1,
        id: makeId('proj'),
        title: 'Creator Portfolio Site',
        mode: 'website',
        activeSceneId: home,
        scenes: [
          {
            id: home,
            name: 'Home',
            theme: 'dark-modern',
            background: { type: 'gradient', color1: '#090d1a', color2: '#1e1b4b' },
          },
          {
            id: about,
            name: 'Projects',
            theme: 'dark-modern',
            background: { type: 'gradient', color1: '#090d1a', color2: '#1e1b4b' },
          },
        ],
        entities: [nav, badge, title, intro, nameInput, themeBtn, card1, aboutTitle, aboutCard, backBtn],
        variables: { visitor: 'Creator', themeStep: 0, themeName: 'Dark Modern' },
        lists: {},
        scripts: [
          {
            id: makeId('scr'),
            targetId: themeBtn.id,
            enabled: true,
            hat: createBlockNode('when_clicked', { target: 'this' }),
            body: [
              createBlockNode('play_sound', { sfx: 'click' }),
              createBlockNode('change_var', { var: 'themeStep', delta: 1 }),
              createBlockNode('if_then', { condition: 'themeStep % 3 == 1' }, [
                createBlockNode('set_theme', { theme: 'clean-light' }),
                createBlockNode('set_var', { var: 'themeName', value: 'Clean Light' }),
              ], [
                createBlockNode('if_then', { condition: 'themeStep % 3 == 2' }, [
                  createBlockNode('set_theme', { theme: 'pastel-pop' }),
                  createBlockNode('set_var', { var: 'themeName', value: 'Pastel Pop' }),
                ], [
                  createBlockNode('set_theme', { theme: 'dark-modern' }),
                  createBlockNode('set_var', { var: 'themeName', value: 'Dark Modern' }),
                ]),
              ]),
            ],
          },
          {
            id: makeId('scr'),
            targetId: card1.id,
            enabled: true,
            hat: createBlockNode('when_clicked', { target: 'this' }),
            body: [
              createBlockNode('play_sound', { sfx: 'powerup' }),
              createBlockNode('show_toast', { text: 'Nice click, {visitor}! Try Export HTML anytime.', tone: 'success' }),
            ],
          },
          {
            id: makeId('scr'),
            targetId: backBtn.id,
            enabled: true,
            hat: createBlockNode('when_clicked', { target: 'this' }),
            body: [
              createBlockNode('play_sound', { sfx: 'click' }),
              createBlockNode('switch_scene', { scene: 'Home' }),
            ],
          },
        ],
      };
    },
  },
  {
    id: 'blank-canvas',
    name: 'Blank Starter',
    category: 'unified',
    badge: 'Start Fresh',
    description: 'Clean workspace with one friendly Hero sprite ready for your own idea or AI prompt.',
    create: () => {
      const s1 = 'scene_blank_1';
      const hero = createSpriteEntity('Hero', s1, {
        id: 'sp_blank_hero',
        x: 0,
        y: 0,
        costumes: [{ id: makeId('cos'), name: 'hero', kind: 'preset', value: 'hero', color: '#6366f1' }],
      });
      return {
        version: 1,
        id: makeId('proj'),
        title: 'My OpenScratch Project',
        mode: 'unified',
        activeSceneId: s1,
        scenes: [
          {
            id: s1,
            name: 'Scene 1',
            theme: 'dark-modern',
            background: { type: 'grid', color1: '#0f172a', color2: '#1e1b4b', grid: true },
          },
        ],
        entities: [hero],
        variables: { score: 0 },
        lists: { inventory: [] },
        scripts: [
          {
            id: makeId('scr'),
            targetId: hero.id,
            enabled: true,
            hat: createBlockNode('when_start'),
            body: [
              createBlockNode('say_text', { target: 'this', text: 'Ready to create!', sec: 2 }),
            ],
          },
        ],
      };
    },
  },
];
