import type { Entity, OpenScratchProject, ScriptStack } from '../types/project';
import { BLOCK_DEFINITIONS } from '../engine/blockCatalog';
import { parseOpenScript, scriptsToOpenScript } from '../engine/openscript';
import { createSpriteEntity, createWebEntity } from '../data/assets';

export type AiProviderId = 'openai' | 'anthropic' | 'gemini' | 'openrouter' | 'custom';

export interface AiSettings {
  provider: AiProviderId;
  apiKey: string;
  model: string;
  customBaseUrl: string;
  persistKey: boolean;
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  proposal?: AiProposal | null;
}

export interface ProposedEntitySpec {
  kind: 'sprite' | 'web';
  name: string;
  x?: number;
  y?: number;
  preset?: string;
  emoji?: string;
  color?: string;
  size?: number;
  webType?: 'heading' | 'paragraph' | 'button' | 'input' | 'card' | 'badge' | 'nav' | 'divider';
  text?: string;
  subtext?: string;
  bindVar?: string;
}

export interface AiProposal {
  openScript: string;
  parsedScripts: ScriptStack[];
  parseErrors: { line: number; message: string }[];
  newEntities: ProposedEntitySpec[];
  variables: Record<string, string | number | boolean>;
  replaceTargetScripts: boolean;
}

export const AI_PROVIDER_DEFAULTS: Record<
  AiProviderId,
  { label: string; defaultModel: string; placeholder: string; note: string }
> = {
  openai: {
    label: 'OpenAI',
    defaultModel: 'gpt-4o-mini',
    placeholder: 'sk-...',
    note: 'Calls api.openai.com directly from your browser.',
  },
  anthropic: {
    label: 'Anthropic Claude',
    defaultModel: 'claude-haiku-4-5',
    placeholder: 'sk-ant-...',
    note: 'Calls api.anthropic.com directly using CORS browser header.',
  },
  gemini: {
    label: 'Google Gemini',
    defaultModel: 'gemini-2.5-flash',
    placeholder: 'AIza...',
    note: 'Calls generativelanguage.googleapis.com directly.',
  },
  openrouter: {
    label: 'OpenRouter',
    defaultModel: 'openai/gpt-4o-mini',
    placeholder: 'sk-or-...',
    note: 'Access 100+ models via openrouter.ai directly.',
  },
  custom: {
    label: 'Custom / Local (Ollama, LM Studio, Groq)',
    defaultModel: 'llama3.2',
    placeholder: 'Optional API key (leave blank for local Ollama)',
    note: 'Any OpenAI-compatible /v1/chat/completions endpoint.',
  },
};

const STORAGE_KEY = 'openscratch_byok_settings_v1';

export function loadAiSettings(): AiSettings {
  const defaults: AiSettings = {
    provider: 'openai',
    apiKey: '',
    model: AI_PROVIDER_DEFAULTS.openai.defaultModel,
    customBaseUrl: 'http://localhost:11434/v1/chat/completions',
    persistKey: false,
  };
  if (typeof localStorage === 'undefined') return defaults;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}

export function saveAiSettings(settings: AiSettings): void {
  if (typeof localStorage === 'undefined') return;
  const toSave: AiSettings = {
    ...settings,
    apiKey: settings.persistKey ? settings.apiKey : '',
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}

export function buildSystemPrompt(project: OpenScratchProject, selectedTargetId: string): string {
  const grammarLines = BLOCK_DEFINITIONS.map((b) => {
    const template = b.labelParts
      .map((p) => (typeof p === 'string' ? p : `<${p.arg}>`))
      .join('')
      .trim();
    return `- [${b.category}] ${template}${b.isHat || b.isCBlock ? ':' : ''}`;
  }).join('\n');

  const entitiesSummary = project.entities
    .map((e) =>
      e.kind === 'sprite'
        ? `Sprite "${e.name}" (x:${e.x}, y:${e.y}, size:${e.size}, scene:${e.sceneId})`
        : `Web "${e.name}" (${e.webType}: "${e.text ?? ''}", scene:${e.sceneId})`
    )
    .join('\n');

  const activeTarget =
    selectedTargetId === 'stage'
      ? 'stage'
      : project.entities.find((e) => e.id === selectedTargetId)?.name || 'this';

  const currentScript = scriptsToOpenScript(project.scripts, project.entities, true);

  return `You are Spark AI, the built-in assistant for OpenScratch — a friendly, natural-language block coding studio for games, animations, and interactive websites.

Current Project:
- Title: "${project.title}"
- Mode: ${project.mode}
- Active Target: "${activeTarget}"
- Scenes: ${project.scenes.map((s) => s.name).join(', ')}
- Variables: ${JSON.stringify(project.variables)}
- Lists: ${JSON.stringify(project.lists)}
- Entities:
${entitiesSummary || '(none)'}

Current OpenScript:
\`\`\`openscript
${currentScript || '# No scripts yet'}
\`\`\`

Valid OpenScript Syntax Rules:
1. Optional target header before scripts: \`@target "EntityName"\` or \`@target "stage"\`
2. Hat blocks end with \`:\` and start a script. Body lines are indented by 2 spaces.
3. C-blocks (\`repeat ...:\`, \`if (...) then:\`, \`otherwise:\`, \`for each ...:\`) end with \`:\` and indent their body.
4. Quote string values, target names, sound names, and variable names with double quotes \`"..."\`.
5. Keep conditions inside parentheses like \`if (score >= 10) then:\` or \`if (Hero touches Coin) then:\`.
6. Text values support \`{variableName}\` interpolation automatically!

Available Blocks:
${grammarLines}

When the user asks you to build, edit, or fix functionality:
- Give a brief, friendly explanation.
- Include runnable OpenScript inside a \`\`\`openscript ... \`\`\` block using ONLY valid block lines from the list above.
- If new sprites or website UI elements are needed, optionally include a JSON array in \`\`\`openscratch-entities ... \`\`\` like:
  [{"kind":"sprite","name":"Enemy","preset":"slime","x":120,"y":60}]
  or
  [{"kind":"web","name":"startBtn","webType":"button","text":"Play Now"}]
- If new variables are helpful, optionally include \`\`\`openscratch-vars ... \`\`\` with a JSON object like {"lives": 3}.`;
}

export function extractAiProposal(
  replyText: string,
  project: OpenScratchProject,
  defaultTargetId: string
): AiProposal | null {
  const scriptMatch = replyText.match(/```(?:openscript|openscratch)\s*\n([\s\S]*?)```/i);
  const entMatch = replyText.match(/```openscratch-entities\s*\n([\s\S]*?)```/i);
  const varMatch = replyText.match(/```openscratch-vars\s*\n([\s\S]*?)```/i);

  if (!scriptMatch && !entMatch && !varMatch) return null;

  let newEntities: ProposedEntitySpec[] = [];
  if (entMatch) {
    try {
      const parsed = JSON.parse(entMatch[1]);
      if (Array.isArray(parsed)) newEntities = parsed;
    } catch {
      // ignore malformed optional JSON
    }
  }

  let variables: Record<string, string | number | boolean> = {};
  if (varMatch) {
    try {
      const parsed = JSON.parse(varMatch[1]);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) variables = parsed;
    } catch {
      // ignore malformed optional JSON
    }
  }

  // Create virtual entity stubs so @target resolves newly proposed entities too!
  const virtualEntities: Entity[] = [...project.entities];
  for (const spec of newEntities) {
    if (!virtualEntities.some((e) => e.name.toLowerCase() === String(spec.name).toLowerCase())) {
      if (spec.kind === 'web') {
        virtualEntities.push(createWebEntity(spec.name, spec.webType || 'button', project.activeSceneId));
      } else {
        virtualEntities.push(createSpriteEntity(spec.name, project.activeSceneId));
      }
    }
  }

  const openScript = scriptMatch ? scriptMatch[1].trim() : '';
  const parsed = openScript
    ? parseOpenScript(openScript, defaultTargetId, virtualEntities)
    : { scripts: [], errors: [] };

  return {
    openScript,
    parsedScripts: parsed.scripts,
    parseErrors: parsed.errors,
    newEntities,
    variables,
    replaceTargetScripts: false,
  };
}

export async function callByokAi(
  settings: AiSettings,
  history: AiChatMessage[],
  userPrompt: string,
  project: OpenScratchProject,
  selectedTargetId: string
): Promise<string> {
  const systemPrompt = buildSystemPrompt(project, selectedTargetId);
  const model = settings.model.trim() || AI_PROVIDER_DEFAULTS[settings.provider].defaultModel;
  const apiKey = settings.apiKey.trim();

  if (settings.provider !== 'custom' && !apiKey) {
    throw new Error(`Please enter your ${AI_PROVIDER_DEFAULTS[settings.provider].label} API key in AI Settings first.`);
  }

  const chatMessages = [
    ...history.slice(-8).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: userPrompt },
  ];

  if (settings.provider === 'anthropic') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: 2048,
        system: systemPrompt,
        messages: chatMessages,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || `Anthropic API error (${res.status})`);
    return data?.content?.map((c: { text?: string }) => c.text || '').join('\n') || 'No response text received.';
  }

  if (settings.provider === 'gemini') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const contents = chatMessages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || `Gemini API error (${res.status})`);
    return data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('\n') || 'No response text received.';
  }

  // OpenAI, OpenRouter, or Custom OpenAI-compatible
  const url =
    settings.provider === 'openrouter'
      ? 'https://openrouter.ai/api/v1/chat/completions'
      : settings.provider === 'custom'
      ? settings.customBaseUrl.trim() || 'http://localhost:11434/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  if (settings.provider === 'openrouter') {
    headers['HTTP-Referer'] = typeof window !== 'undefined' ? window.location.origin : 'https://openscratch.local';
    headers['X-Title'] = 'OpenScratch Studio';
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      temperature: 0.4,
      messages: [{ role: 'system', content: systemPrompt }, ...chatMessages],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `API error (${res.status})`);
  return data?.choices?.[0]?.message?.content || 'No response text received.';
}
