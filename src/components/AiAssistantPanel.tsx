import React, { useState } from 'react';
import {
  Sparkles,
  Settings2,
  Send,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  Wand2,
  Trash2,
} from 'lucide-react';
import type { OpenScratchProject } from '../types/project';
import {
  AI_PROVIDER_DEFAULTS,
  callByokAi,
  extractAiProposal,
  type AiChatMessage,
  type AiProposal,
  type AiProviderId,
  type AiSettings,
} from '../ai/byok';
import { makeId } from '../engine/blockCatalog';

interface AiAssistantPanelProps {
  project: OpenScratchProject;
  selectedTargetId: string;
  settings: AiSettings;
  onChangeSettings: (next: AiSettings) => void;
  onApplyProposal: (proposal: AiProposal, replaceExisting: boolean) => void;
  onClose: () => void;
}

export const AiAssistantPanel: React.FC<AiAssistantPanelProps> = ({
  project,
  selectedTargetId,
  settings,
  onChangeSettings,
  onApplyProposal,
  onClose,
}) => {
  const [showConfig, setShowConfig] = useState(!settings.apiKey && settings.provider !== 'custom');
  const [showKey, setShowKey] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [replaceMode, setReplaceMode] = useState(false);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(() => new Set());

  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      timestamp: 'Now',
      content:
        'Hi! I am Spark AI (BYOK). Add your own OpenAI, Anthropic, Gemini, OpenRouter, or local Ollama key — calls go directly from your browser. Ask me to build game mechanics, animations, or website features and apply them in 1 click!',
    },
  ]);

  const quickPrompts =
    project.mode === 'website'
      ? [
          'Add a button that switches between light and pastel themes',
          'Create a feedback card with an input that greets the user',
          'Explain how this website script works',
        ]
      : project.mode === 'animation'
      ? [
          'Animate Hero sliding in with bounce ease and confetti',
          'Add a twinkling star trail loop',
          'Explain my animation blocks',
        ]
      : [
          'Add a moving slime enemy that resets score when touched',
          'Add double jump and spark particles on spacebar',
          'Explain or simplify my current script',
        ];

  const handleProviderChange = (provider: AiProviderId) => {
    onChangeSettings({
      ...settings,
      provider,
      model: AI_PROVIDER_DEFAULTS[provider].defaultModel,
    });
  };

  const sendPrompt = async (promptText: string) => {
    const trimmed = promptText.trim();
    if (!trimmed || loading) return;

    const userMsg: AiChatMessage = {
      id: makeId('msg'),
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setErrorMsg(null);
    setLoading(true);

    try {
      const reply = await callByokAi(settings, messages, trimmed, project, selectedTargetId);
      const proposal = extractAiProposal(reply, project, selectedTargetId);
      const assistantMsg: AiChatMessage = {
        id: makeId('msg'),
        role: 'assistant',
        content: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        proposal,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const providerMeta = AI_PROVIDER_DEFAULTS[settings.provider];

  return (
    <aside className="fixed right-0 top-14 bottom-0 z-40 xl:static xl:z-auto w-80 xl:w-96 shrink-0 border-l border-slate-800/90 bg-slate-900/95 flex flex-col min-h-0 shadow-2xl xl:shadow-none">
      {/* Header */}
      <div className="h-11 px-3 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-fuchsia-950/60 to-indigo-950/60 shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-fuchsia-400" />
          <span className="text-xs font-extrabold text-white">Spark AI · BYOK</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowConfig((v) => !v)}
            className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition ${
              showConfig
                ? 'bg-fuchsia-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            Keys
          </button>
          <button
            type="button"
            onClick={() => setMessages(messages.slice(0, 1))}
            title="Clear chat"
            className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* BYOK Provider Config */}
      {showConfig && (
        <div className="p-3 border-b border-slate-800 bg-slate-950/85 space-y-2.5 text-xs shrink-0">
          <div className="flex items-center justify-between">
            <span className="font-bold text-fuchsia-300 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" />
              Bring Your Own Key (Direct Browser Call)
            </span>
          </div>

          <label className="block space-y-1">
            <span className="text-[11px] text-slate-400">Provider</span>
            <select
              value={settings.provider}
              onChange={(e) => handleProviderChange(e.target.value as AiProviderId)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 outline-none"
            >
              {(Object.keys(AI_PROVIDER_DEFAULTS) as AiProviderId[]).map((pid) => (
                <option key={pid} value={pid}>
                  {AI_PROVIDER_DEFAULTS[pid].label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-[11px] text-slate-400">API Key</span>
            <div className="flex items-center gap-1">
              <input
                type={showKey ? 'text' : 'password'}
                value={settings.apiKey}
                onChange={(e) => onChangeSettings({ ...settings, apiKey: e.target.value })}
                placeholder={providerMeta.placeholder}
                className="flex-1 bg-slate-900 border border-slate-700 focus:border-fuchsia-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowKey((s) => !s)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </label>

          <label className="block space-y-1">
            <span className="text-[11px] text-slate-400">Model</span>
            <input
              type="text"
              value={settings.model}
              onChange={(e) => onChangeSettings({ ...settings, model: e.target.value })}
              placeholder={providerMeta.defaultModel}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 outline-none"
            />
          </label>

          {settings.provider === 'custom' && (
            <label className="block space-y-1">
              <span className="text-[11px] text-slate-400">OpenAI-Compatible Endpoint URL</span>
              <input
                type="text"
                value={settings.customBaseUrl}
                onChange={(e) => onChangeSettings({ ...settings, customBaseUrl: e.target.value })}
                placeholder="http://localhost:11434/v1/chat/completions"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 outline-none"
              />
            </label>
          )}

          <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer pt-0.5">
            <input
              type="checkbox"
              checked={settings.persistKey}
              onChange={(e) => onChangeSettings({ ...settings, persistKey: e.target.checked })}
            />
            Save API key in browser localStorage (unchecked = session only)
          </label>
          <p className="text-[10px] text-slate-500 leading-snug">{providerMeta.note}</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`rounded-xl p-2.5 text-xs leading-relaxed border ${
              msg.role === 'user'
                ? 'bg-indigo-600/25 border-indigo-500/40 text-indigo-50 ml-4'
                : 'bg-slate-800/75 border-slate-700/70 text-slate-200 mr-2'
            }`}
          >
            <div className="flex items-center justify-between mb-1 text-[10px] font-bold uppercase tracking-wider opacity-70">
              <span>{msg.role === 'user' ? 'You' : 'Spark AI'}</span>
              <span>{msg.timestamp}</span>
            </div>
            <div className="whitespace-pre-wrap break-words">{msg.content}</div>

            {msg.proposal && (
              <div className="mt-2.5 p-2.5 rounded-lg bg-slate-950/90 border border-fuchsia-500/40 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-fuchsia-300">
                  <span className="flex items-center gap-1">
                    <Wand2 className="w-3.5 h-3.5" />
                    Runnable Proposal Ready
                  </span>
                  {msg.proposal.parseErrors.length === 0 ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Valid
                    </span>
                  ) : (
                    <span className="text-amber-300 text-[10px]">
                      {msg.proposal.parseErrors.length} warning(s)
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-300 space-y-0.5">
                  {msg.proposal.newEntities.length > 0 && (
                    <div>+ {msg.proposal.newEntities.length} new entity(s): {msg.proposal.newEntities.map((e) => e.name).join(', ')}</div>
                  )}
                  {Object.keys(msg.proposal.variables).length > 0 && (
                    <div>+ Variables: {Object.keys(msg.proposal.variables).join(', ')}</div>
                  )}
                  {msg.proposal.parsedScripts.length > 0 && (
                    <div>+ {msg.proposal.parsedScripts.length} OpenScript stack(s)</div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <label className="flex items-center gap-1.5 text-[10px] text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={replaceMode}
                      onChange={(e) => setReplaceMode(e.target.checked)}
                    />
                    Replace target scripts
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      onApplyProposal(msg.proposal!, replaceMode);
                      setAppliedIds((prev) => new Set(prev).add(msg.id));
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition ${
                      appliedIds.has(msg.id)
                        ? 'bg-emerald-600 text-white'
                        : 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white'
                    }`}
                  >
                    {appliedIds.has(msg.id) ? 'Applied ✓' : 'Apply to Project'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="rounded-xl p-2.5 bg-slate-800/60 border border-slate-700/60 text-xs text-fuchsia-300 animate-pulse">
            Spark AI is thinking...
          </div>
        )}

        {errorMsg && (
          <div className="rounded-xl p-2.5 bg-rose-950/70 border border-rose-500/50 text-xs text-rose-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Quick Prompt Chips & Input */}
      <div className="p-2.5 border-t border-slate-800 bg-slate-950/60 space-y-2 shrink-0">
        <div className="flex flex-wrap gap-1">
          {quickPrompts.map((qp) => (
            <button
              key={qp}
              type="button"
              onClick={() => sendPrompt(qp)}
              className="px-2 py-1 rounded-md bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 text-[10px] text-slate-300 text-left cursor-pointer transition"
            >
              {qp}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendPrompt(input);
          }}
          className="flex gap-1.5"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Spark AI to add features or explain..."
            className="flex-1 min-w-0 bg-slate-900 border border-slate-700 focus:border-fuchsia-500 rounded-lg px-2.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 outline-none"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-3 py-2 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-40 text-white cursor-pointer transition"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </aside>
  );
};
