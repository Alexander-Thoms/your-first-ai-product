"use client";

import { useRef, useState } from "react";
import { DEFAULT_SETTINGS, normalizeBaseUrl, type ChatSettings } from "@/lib/settings";

export function Settings({ settings, onSave }: { settings: ChatSettings; onSave: (next: ChatSettings) => void }) {
  const [open, setOpen] = useState(false);
  const [baseUrl, setBaseUrl] = useState(settings.baseUrl);
  const [model, setModel] = useState(settings.model);
  const [invalid, setInvalid] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  function toggle() {
    if (!open) {
      setBaseUrl(settings.baseUrl);
      setModel(settings.model);
      setInvalid(false);
    }
    setOpen((previous) => !previous);
  }

  function handleSave() {
    let normalized: string;
    try {
      normalized = normalizeBaseUrl(baseUrl);
      const url = new URL(normalized);
      if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("bad scheme");
    } catch {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    onSave({ baseUrl: normalized, model: model.trim() || DEFAULT_SETTINGS.model });
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label="Model settings"
        className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700 text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            ref={panelRef}
            className="error-in absolute right-0 z-20 mt-2 w-80 rounded-2xl border border-zinc-700 bg-zinc-900 p-4 shadow-xl"
          >
            <p className="text-sm font-semibold text-zinc-100">Model settings</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">
              The local default works on your machine. On the Vercel preview, enter a{" "}
              <span className="text-zinc-300">public</span> Ollama endpoint so the serverless
              function can reach a model — for example an Ollama Cloud instance or a tunnel.
            </p>
            <label className="mt-3 block text-xs font-medium text-zinc-300">
              Ollama base URL
              <input
                value={baseUrl}
                onChange={(event) => setBaseUrl(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && handleSave()}
                placeholder="https://your-public-ollama.com/api"
                spellCheck={false}
                className={`mt-1 w-full rounded-lg border bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 outline-none focus:border-indigo-500 ${invalid ? "border-rose-500" : "border-zinc-700"}`}
              />
            </label>
            <label className="mt-2 block text-xs font-medium text-zinc-300">
              Model
              <input
                value={model}
                onChange={(event) => setModel(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && handleSave()}
                placeholder="qwen2.5:7b"
                spellCheck={false}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 outline-none focus:border-indigo-500"
              />
            </label>
            {invalid ? (
              <p className="mt-2 text-[11px] text-rose-400">
                Enter a valid http(s) URL (the /api suffix is added for you).
              </p>
            ) : null}
            <div className="mt-3 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setBaseUrl(DEFAULT_SETTINGS.baseUrl);
                  setModel(DEFAULT_SETTINGS.model);
                  setInvalid(false);
                  onSave(DEFAULT_SETTINGS);
                  setOpen(false);
                }}
                className="text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-200"
              >
                Reset to default
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-500"
              >
                Save
              </button>
            </div>
            <p className="mt-3 truncate border-t border-zinc-800 pt-2 text-[11px] text-zinc-500">
              Using {settings.baseUrl} · {settings.model}
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}
