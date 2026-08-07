"use client";

import type { ReactNode } from "react";
import type { ToolPartBase, ToolPartState } from "@/ai/types";
import { Crossfade } from "./Crossfade";

const STATE_LABELS: Record<ToolPartState, string> = {
  "input-streaming": "reading input",
  "input-available": "running",
  "output-available": "result",
  "output-error": "error",
};

const STATE_QUESTIONS: Record<ToolPartState, string> = {
  "input-streaming": "What is it doing?",
  "input-available": "With what input?",
  "output-available": "What came back?",
  "output-error": "What went wrong?",
};

function StreamingInput({ part }: { part: ToolPartBase }) {
  const keys = part.input ? Object.keys(part.input) : [];

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
        Reading the request…
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {keys.length === 0 ? (
          <>
            <span className="shimmer-bar w-24" />
            <span className="shimmer-bar w-16" />
            <span className="shimmer-bar w-20" />
          </>
        ) : (
          keys.map((key) => (
            <span key={key} className="chip chip--typing">
              {key}
              <span className="cursor" />
            </span>
          ))
        )}
      </div>
    </div>
  );
}

function RunningInput({ part }: { part: ToolPartBase }) {
  const entries = part.input ? Object.entries(part.input) : [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
        <p className="text-sm font-medium text-zinc-600">Executing with this input…</p>
      </div>
      {entries.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {entries.map(([key, value]) => (
            <span key={key} className="chip">
              <span className="font-mono text-zinc-400">{key}</span>
              <span className="text-zinc-200">=</span>
              <span className="font-medium text-zinc-100">{String(value)}</span>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-500">No structured fields — running on context.</p>
      )}
    </div>
  );
}

function ErrorPanel({ label, part }: { label: string; part: ToolPartBase }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/15">
        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-red-700 dark:text-red-300">
          {label} couldn&apos;t run
        </p>
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          {part.errorText ?? "The tool failed without a specific message."}
        </p>
        <p className="mt-1 text-xs text-zinc-400">
          Try rewording your request or providing the missing details, then ask again.
        </p>
      </div>
    </div>
  );
}

interface ToolFrameProps {
  label: string;
  description: string;
  icon: ReactNode;
  part: ToolPartBase;
  renderOutput: (output: unknown) => ReactNode;
}

export function ToolFrame({ label, description, icon, part, renderOutput }: ToolFrameProps) {
  const state = part.state;

  return (
    <div className="tool-frame" data-state={state}>
      <header className="tool-frame__header">
        <span className="tool-frame__icon">{icon}</span>
        <div className="min-w-0">
          <p className="tool-frame__label">{label}</p>
          <p className="tool-frame__desc">{description}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden sm:block" title={STATE_QUESTIONS[state]}>
            <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
              {STATE_QUESTIONS[state]}
            </span>
          </span>
          <span className="state-pill" data-state={state}>
            <span className="state-dot" data-state={state} />
            {STATE_LABELS[state]}
          </span>
        </div>
      </header>

      <div className="tool-frame__body">
        <Crossfade state={state}>
          {state === "input-streaming" && <StreamingInput part={part} />}
          {state === "input-available" && <RunningInput part={part} />}
          {state === "output-available" && renderOutput(part.output)}
          {state === "output-error" && <ErrorPanel label={label} part={part} />}
        </Crossfade>
      </div>
    </div>
  );
}
