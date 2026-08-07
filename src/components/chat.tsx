"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import type { ToolPartBase } from "@/ai/types";
import type { MetaTagsResult, QueryDataResult, ScoreLeadResult } from "@/ai/types";
import { ToolFrame } from "./tool-parts/ToolFrame";
import { ScoreLeadCard } from "./tool-parts/ScoreLeadCard";
import { MetaTagsCard } from "./tool-parts/MetaTagsCard";
import { QueryDataChart } from "./tool-parts/QueryDataChart";
import { ChatError } from "./ChatError";
import { Settings } from "./Settings";
import { SUGGESTIONS } from "./suggestions";
import {
  createConversationId,
  deriveTitle,
  loadConversations,
  saveConversations,
  type Conversation,
} from "@/lib/conversations";
import { loadSettings, normalizeBaseUrl, saveSettings, type ChatSettings } from "@/lib/settings";

const ICONS = {
  scoreLead: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  fetchMetaTags: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  queryData: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="8" y1="14" x2="8" y2="18" />
      <line x1="12" y1="10" x2="12" y2="18" />
      <line x1="16" y1="6" x2="16" y2="18" />
    </svg>
  ),
};

function ToolCall({ part }: { part: ToolPartBase }) {
  if (part.state === "output-available" && (part.output === undefined || part.output === null)) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-xs text-zinc-400">
        {part.type} finished, but no readable result came back. Try asking again.
      </div>
    );
  }

  switch (part.type) {
    case "tool-scoreLead":
      return (
        <ToolFrame
          label="Score Lead"
          description="BANT-style lead qualification"
          icon={ICONS.scoreLead}
          part={part}
          renderOutput={(output) => <ScoreLeadCard result={output as ScoreLeadResult} />}
        />
      );
    case "tool-fetchMetaTags":
      return (
        <ToolFrame
          label="Fetch Meta Tags"
          description="Page metadata preview"
          icon={ICONS.fetchMetaTags}
          part={part}
          renderOutput={(output) => <MetaTagsCard result={output as MetaTagsResult} />}
        />
      );
    case "tool-queryData":
      return (
        <ToolFrame
          label="Query Lead Data"
          description="Filter + analyze the dataset"
          icon={ICONS.queryData}
          part={part}
          renderOutput={(output) => <QueryDataChart result={output as QueryDataResult} />}
        />
      );
    default:
      return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-xs text-zinc-400">
          Unknown tool <span className="font-mono text-zinc-300">{part.type}</span> · {part.state}
        </div>
      );
  }
}

function AssistantSkeleton() {
  return (
    <div className="assistant-skeleton" aria-hidden="true">
      <div className="assistant-skeleton__line w-3/4" />
      <div className="assistant-skeleton__line w-1/2" />
    </div>
  );
}

function createFreshConversation(): Conversation {
  return {
    id: createConversationId(),
    title: "New conversation",
    messages: [],
    updatedAt: Date.now(),
  };
}

export default function Chat() {
  const [state, setState] = useState(() => {
    const fresh = createFreshConversation();
    return { conversations: [fresh], activeId: fresh.id };
  });
  const [input, setInput] = useState("");
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<ChatSettings>(() => loadSettings());

  const conversations = state.conversations;
  const activeId = state.activeId;
  const active = conversations.find((conversation) => conversation.id === activeId) ?? null;

  const { messages, sendMessage, regenerate, status, error, stop, clearError } = useChat({
    id: active?.id ?? undefined,
    messages: active?.messages ?? [],
    transport: new DefaultChatTransport({
      api: "/api/chat",
      headers: () => ({
        "x-ollama-base-url": normalizeBaseUrl(settings.baseUrl),
        "x-ollama-model": settings.model.trim(),
      }),
    }),
  });

  if (active && active.messages !== messages) {
    setState((previous) => ({
      conversations: previous.conversations.map((conversation) =>
        conversation.id === active.id
          ? {
              ...conversation,
              title: deriveTitle(messages),
              messages,
              updatedAt: Date.now(),
            }
          : conversation,
      ),
      activeId: previous.activeId,
    }));
  }

  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) {
      saveConversations(conversations);
      return;
    }
    initialized.current = true;
    const stored = loadConversations();
    setState({
      conversations: stored.length > 0 ? stored : conversations,
      activeId: stored.length > 0 ? stored[0].id : conversations[0].id,
    });
  }, [conversations]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isBusy = status === "submitted" || status === "streaming";

  const statusLabel =
    status === "error"
      ? "Error"
      : status === "streaming" || status === "submitted"
        ? "Thinking…"
        : status === "ready"
          ? "Ready"
          : status;

  function submit(text: string) {
    if (!text.trim() || isBusy) return;
    clearError();
    if (!active) return;
    sendMessage({ text });
  }

  function newConversation() {
    if (isBusy) stop();
    clearError();
    const fresh: Conversation = {
      id: createConversationId(),
      title: "New conversation",
      messages: [],
      updatedAt: Date.now(),
    };
    setState((previous) => ({
      conversations: [fresh, ...previous.conversations],
      activeId: fresh.id,
    }));
  }

  function switchConversation(id: string) {
    if (id === activeId) return;
    if (isBusy) stop();
    clearError();
    setState((previous) => ({ ...previous, activeId: id }));
  }

  function handleSaveSettings(next: ChatSettings) {
    setSettings(next);
    saveSettings(next);
  }

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (nearBottom) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages, activeId]);

  const lastMessage = messages[messages.length - 1];
  const showAssistantSkeleton =
    isBusy &&
    (lastMessage?.role !== "assistant" ||
      !lastMessage.parts.some((part) => part.type === "text" && part.text));

  return (
    <div className="flex h-dvh flex-col bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800/70 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold">Pipeline Copilot</h1>
            <p className="truncate text-xs text-zinc-400">{active?.title ?? "Generative UI"}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span
              aria-live="polite"
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${status === "error" ? "bg-red-500/10 text-red-300" : "bg-zinc-800 text-zinc-300"}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${status === "error" ? "bg-red-400" : isBusy ? "animate-pulse bg-amber-400" : "bg-emerald-400"}`} />
              {statusLabel}
            </span>
            <Settings settings={settings} onSave={handleSaveSettings} />
            <button
              type="button"
              onClick={newConversation}
              className="flex items-center gap-1.5 rounded-full border border-zinc-700 px-3 py-1 text-xs font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:text-zinc-100"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New
            </button>
          </div>
        </div>
      </header>

      {conversations.length > 1 ? (
        <nav className="border-b border-zinc-800/50 px-4 py-2 sm:px-6">
          <div className="mx-auto flex max-w-3xl gap-2 overflow-x-auto pb-1">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() => switchConversation(conversation.id)}
                aria-current={conversation.id === activeId ? "true" : undefined}
                className={`shrink-0 max-w-48 truncate rounded-full px-3 py-1 text-xs transition-colors ${
                  conversation.id === activeId
                    ? "bg-indigo-600 text-white"
                    : "border border-zinc-700 text-zinc-300 hover:border-zinc-500"
                }`}
              >
                {conversation.title}
              </button>
            ))}
          </div>
        </nav>
      ) : null}

      <main ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6">
          {messages.length === 0 ? (
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
                <h2 className="text-lg font-semibold">No conversations yet</h2>
                <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                  Pick a prompt below to see the tool lifecycle — reading input, running, a
                  component result, or a designed error. You can also type your own lead question.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion.label}
                    type="button"
                    onClick={() => submit(suggestion.prompt)}
                    disabled={isBusy}
                    className="group flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100 disabled:opacity-50"
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${suggestion.tag === "error" ? "bg-rose-400" : "bg-indigo-400"}`} />
                    {suggestion.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {messages.map((message) => (
            <div key={message.id} className={`flex flex-col gap-2 ${message.role === "user" ? "items-end" : "items-start"}`}>
              {message.role === "user" ? (
                <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-indigo-600 px-4 py-2.5 text-sm leading-relaxed text-white">
                  {message.parts.map((part, index) =>
                    part.type === "text" ? <span key={index}>{part.text}</span> : null,
                  )}
                </div>
              ) : (
                <div className="flex w-full max-w-full flex-col gap-2">
                  {message.parts.map((part, index) => {
                    switch (part.type) {
                      case "text":
                        return part.text ? (
                          <div key={index} className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-zinc-900 px-4 py-2.5 text-sm leading-relaxed text-zinc-100">
                            {part.text}
                          </div>
                        ) : null;
                      case "tool-scoreLead":
                      case "tool-fetchMetaTags":
                      case "tool-queryData":
                        return <ToolCall key={index} part={part as unknown as ToolPartBase} />;
                      default:
                        return null;
                    }
                  })}
                </div>
              )}
            </div>
          ))}

          {showAssistantSkeleton ? (
            <div className="flex flex-col gap-2">
              <AssistantSkeleton />
            </div>
          ) : null}

          {status === "error" && error ? (
            <ChatError
              error={error}
              onRetry={() => regenerate()}
              onDismiss={() => clearError()}
            />
          ) : null}
        </div>
      </main>

      <footer className="border-t border-zinc-800/70 px-4 py-4 sm:px-6">
        <form
          className="mx-auto flex max-w-3xl items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            submit(input);
          }}
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Try: “Score this lead: Northwind Labs, SaaS, $48k”"
            aria-label="Message"
            autoComplete="off"
            disabled={isBusy}
            className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors focus:border-indigo-500 disabled:opacity-60"
          />
          {isBusy ? (
            <button
              type="button"
              onClick={() => stop()}
              className="rounded-xl border border-zinc-700 px-4 py-3 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
            >
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={mounted && !input.trim()}
              className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-40"
            >
              Send
            </button>
          )}
        </form>
        <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-zinc-400">
          Powered by a local Ollama model · tool schemas defined with Zod in <code className="font-mono">src/ai/tools</code>
        </p>
      </footer>
    </div>
  );
}
