import type { OpenScratchProject } from '../types/project';
import coreRuntimeRaw from './coreRuntime.js?raw';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function safeJsonForScriptTag(obj: unknown): string {
  return JSON.stringify(obj).replace(/<\//g, '<\\/');
}

/**
 * Generates a 100% self-contained standalone HTML file containing the
 * OpenScratch project data and runtime engine so any game, animation,
 * or website runs offline in any modern browser.
 */
export function exportProjectToHtml(project: OpenScratchProject): string {
  const cleanEngine = coreRuntimeRaw
    .replace(/^export\s+(class|function|const|let)\s+/gm, '$1 ')
    .replace(/<\/script>/gi, '<\\/script>');

  const title = escapeHtml(project.title || 'OpenScratch Project');
  const isWebsite = project.mode === 'website';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — Made with OpenScratch</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background: #090d1a;
      color: #f8fafc;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: ${isWebsite ? 'flex-start' : 'center'};
    }
    .os-bar {
      width: 100%;
      padding: 10px 18px;
      background: rgba(15, 23, 42, 0.9);
      border-bottom: 1px solid rgba(148, 163, 184, 0.16);
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 13px;
    }
    .os-actions { display: flex; gap: 8px; align-items: center; }
    .os-btn {
      padding: 6px 14px;
      border-radius: 8px;
      border: 1px solid rgba(148, 163, 184, 0.28);
      background: #4f46e5;
      color: #fff;
      font-weight: 600;
      cursor: pointer;
    }
    .os-btn.secondary { background: #1e293b; }
    .os-stage-wrap {
      position: relative;
      width: ${isWebsite ? '100%' : 'min(96vw, 800px)'};
      ${isWebsite ? 'min-height: calc(100vh - 48px);' : 'aspect-ratio: 800 / 500; margin: 20px auto; border-radius: 16px; overflow: hidden; box-shadow: 0 24px 60px rgba(0,0,0,0.45); border: 1px solid rgba(148,163,184,0.2);'}
    }
    canvas {
      display: ${isWebsite ? 'none' : 'block'};
      width: 100%;
      height: 100%;
    }
    #os-web-layer {
      position: ${isWebsite ? 'relative' : 'absolute'};
      inset: 0;
      ${isWebsite ? 'min-height: calc(100vh - 48px);' : ''}
      overflow-y: auto;
    }
    #os-toasts {
      position: fixed;
      bottom: 20px;
      right: 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 50;
    }
    .os-toast {
      padding: 10px 16px;
      border-radius: 10px;
      background: #1e293b;
      border: 1px solid rgba(148,163,184,0.3);
      color: #f8fafc;
      font-weight: 600;
      box-shadow: 0 12px 30px rgba(0,0,0,0.35);
    }
  </style>
</head>
<body>
  <div class="os-bar">
    <div><strong>${title}</strong> · <span style="opacity:0.7">Built with OpenScratch (Unlicense)</span></div>
    <div class="os-actions">
      <button class="os-btn" id="os-restart">Restart</button>
      <button class="os-btn secondary" id="os-stop">Stop</button>
    </div>
  </div>
  <div class="os-stage-wrap">
    <canvas id="os-canvas" width="800" height="500"></canvas>
    <div id="os-web-layer"></div>
  </div>
  <div id="os-toasts"></div>

  <script>
  (function() {
    ${cleanEngine}

    const PROJECT = ${safeJsonForScriptTag(project)};
    const canvas = document.getElementById('os-canvas');
    const webLayer = document.getElementById('os-web-layer');
    const toastsEl = document.getElementById('os-toasts');

    const runtime = new OpenScratchRuntime(PROJECT, {
      onSnapshot: function(snap) {
        toastsEl.innerHTML = '';
        for (const t of snap.toasts) {
          const d = document.createElement('div');
          d.className = 'os-toast';
          d.textContent = t.text;
          toastsEl.appendChild(d);
        }
      }
    });

    runtime.attachDOM(canvas, webLayer);
    runtime.start();

    document.getElementById('os-restart').onclick = function() { runtime.start(); };
    document.getElementById('os-stop').onclick = function() { runtime.stop(); };
  })();
  </script>
</body>
</html>`;
}
