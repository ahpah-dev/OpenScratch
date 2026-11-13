# OpenScratch

> **An easier, natural-language alternative to Scratch for Games, Animations, and Interactive Websites — with a built-in BYOK AI Assistant.**  
> Dedicated to the public domain under **[The Unlicense](./UNLICENSE)**.

OpenScratch brings the joyful simplicity of visual block coding together with plain-English phrasing, built-in game physics, smooth animation easing, first-class website/UI building blocks, a lossless natural-English script view (**OpenScript**), 1-click standalone HTML export, and a **Bring Your Own Key (BYOK)** AI assistant (**Spark AI**).

---

## Why OpenScratch?

| Feature | Scratch | OpenScratch |
|---|---|---|
| **Block phrasing** | Traditional (`when green flag clicked`, `change y by -1`) | Conversational English (`when project starts`, `when "Hero" touches "Coin"`) |
| **Game boilerplate** | Manual `forever -> if touching` loops & gravity math | Built-in `give "Hero" platformer physics`, `make "Ground" a solid platform`, `when touches`, clones, particles, camera shake/follow |
| **Animations** | Linear `glide` only | Smooth easing (`smooth`, `bounce`, `elastic`, `ease-in`, `ease-out`), scale/opacity/rotation tweens, ink trails, multi-scene transitions |
| **Website development** | Canvas-only sprites | Native Web UI components (`heading`, `paragraph`, `button`, `input`, `card`, `badge`, `nav`, `divider`), themes, `{variable}` live binding |
| **Natural Language** | Blocks only | **Bidirectional** visual blocks ↔ **OpenScript** text editor + offline **Natural English Bar** |
| **AI Assistant** | None | **Spark AI (BYOK)** — OpenAI, Anthropic Claude, Google Gemini, OpenRouter, or local Ollama/LM Studio directly from your browser |
| **Sharing / Export** | `.sb3` project viewer | **1-click self-contained `.html` export** (zero external dependencies, runs offline anywhere) + `.openscratch.json` |
| **License** | GPL / CC-BY-SA | **The Unlicense** (Public Domain — zero restrictions) |

---

## Core Capabilities

### 1. Game Development
- **Instant Physics**: Add side-scrolling platformer controls (`speed`, `jump`, `gravity`) or 4-way top-down controls in one block, and mark any sprite as a solid platform.
- **Zero-Boilerplate Events**: `when "Hero" touches "Coin"`, `when "space" key is pressed/held/released`, `whenever (score >= 10)`, `every N seconds`.
- **Full Power**: Clones (`spawn a copy of ...`, `when a copy of ... appears`, `delete this copy`), custom actions (`define custom action`), variables & lists, browser `localStorage` persistence, particle bursts, camera zoom/shake/follow, and built-in Web Audio synth SFX & musical notes.

### 2. Animations & Interactive Stories
- Smooth tweening for position, scale, opacity, and rotation with `linear`, `smooth`, `ease-in`, `ease-out`, `bounce`, and `elastic` curves.
- Speech bubbles with dynamic `{variable}` interpolation (`"Score: {score}"`).
- Multi-costume sprites (presets + emoji), ink trails, particle fireworks, and multi-scene storytelling.

### 3. Website & Web App Builder
- Visual page components: Navigation Bars, Headings, Paragraphs, Buttons, Text Inputs (bound to variables!), Feature Cards, Badges, and Dividers.
- Switch between built-in themes (`dark-modern`, `clean-light`, `pastel-pop`, `retro-arcade`, `ocean-glass`) dynamically via blocks (e.g., Dark Mode toggles!).
- Hybrid mode lets you combine interactive HTML UI/HUD elements right alongside live game or animation canvases.

### 4. Natural Language: Offline Bar + Bidirectional OpenScript
Type casual English directly into the **Natural English Bar** without any API key:
- `when space pressed jump 14`
- `when Hero touches Coin add 1 to score and play coin`
- `glide Hero to 120 40 in 1 sec`
- `add button Play Now`

Or switch between **Blocks**, **Split**, and **Natural Script** views anytime:

```openscript
when project starts:
  set "score" to 0
  give "this" platformer physics speed 5 jump 13 gravity 0.7

when "this" touches "Coin1":
  change "score" by 1
  play sound effect "coin"
  burst 16 "spark" particles at "Coin1"
  hide "Coin1"
```

### 5. Spark AI (BYOK — Bring Your Own Key)
- Supports **OpenAI**, **Anthropic Claude**, **Google Gemini**, **OpenRouter**, and any **OpenAI-compatible endpoint** (such as local **Ollama**, **LM Studio**, **Groq**, or **Together**).
- **100% client-side**: API requests go directly from your browser to your selected provider. Keys default to session-only memory with an optional `localStorage` toggle.
- AI responses proposing new sprites, web elements, variables, or OpenScript logic can be syntax-checked and applied in **1 click**.

---

## Starter Templates Included
1. **Sky Jumper** — Playable platformer game with coins, particle bursts, sound FX, and goal celebration.
2. **Space Defender** — Arcade shooter featuring laser clone spawning and flying targets.
3. **Sunset Story** — Eased multi-scene animation with dialogue bubbles, piano notes, trails, and fireworks.
4. **Creator Portfolio** — Multi-page responsive website with live greeting input and theme switcher.
5. **Blank Starter** — Clean workspace ready for custom creations.

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start dev studio
npm run dev

# 3. Run unit & integration tests
npm run test:run

# 4. Typecheck & build production bundle
npm run build
```

---

## Deploying to GitHub Pages

This repository includes [`.github/workflows/deploy-pages.yml`](./.github/workflows/deploy-pages.yml), which automatically tests, builds, and deploys `dist/` to GitHub Pages on pushes to `main`.  
To enable it on a fork or new repo, go to **Settings → Pages → Build and deployment → Source: GitHub Actions**.

---

## License

This project is released into the public domain under **[The Unlicense](./UNLICENSE)**.  
Anyone is free to copy, modify, publish, use, compile, sell, or distribute this software — and any projects exported with it — for any purpose, commercial or non-commercial, by any means.
