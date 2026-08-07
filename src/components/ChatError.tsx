"use client";

import { useState } from "react";

type ErrorKind = "rate-limit" | "offline" | "tool" | "generic";

const KIND_CONFIG: Record<
  ErrorKind,
  { icon: React.ReactNode; title: string; body: string }
> = {
  "rate-limit": {
    icon: (
      <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: "Rate limit hit",
    body: "Too many requests in a short window. Give the model a few seconds, then retry the same message.",
  },
  offline: {
    icon: (
      <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18.36 6.64A9 9 0 0 1 20.77 15" />
        <path d="M5.63 6.64A9 9 0 0 0 3.23 15" />
        <path d="M12 2a15.3 15.3 0 0 1 4.24 3.17" />
        <path d="M4.79 5.3A15.3 15.3 0 0 0 2 8.43" />
        <line x1="2" y1="2" x2="22" y2="22" />
        <path d="M21.95 15a9.09 9.09 0 0 1-1.18 2.77" />
        <path d="M18.36 17.36A9 9 0 0 1 12 20a9.26 9.26 0 0 1-5.15-1.68" />
      </svg>
    ),
    title: "Connection lost",
    body: "The request couldn't reach the model — check your network, then retry the failed message.",
  },
  tool: {
    icon: (
      <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="16 3 21 8 8 21 3 21 3 16 16 3" />
      </svg>
    ),
    title: "The response failed",
    body: "A step in the response didn't come back cleanly. Retry the same message to start again.",
  },
  generic: {
    icon: (
      <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    title: "Something went wrong",
    body: "The response didn't complete. Retry the same message to try again.",
  },
};

export function classifyError(error: Error | undefined): ErrorKind {
  const message = error?.message?.toLowerCase() ?? "";
  if (message.includes("429") || message.includes("rate limit")) return "rate-limit";
  if (
    message.includes("fetch failed") ||
    message.includes("network") ||
    message.includes("connection") ||
    message.includes("interrupted") ||
    message.includes("offline") ||
    message.includes("load failed")
  ) {
    return "offline";
  }
  if (message.includes("tool") || message.includes("malformed")) return "tool";
  return "generic";
}

export function ChatError({
  error,
  onRetry,
  onDismiss,
}: {
  error: Error | undefined;
  onRetry: () => void;
  onDismiss: () => void;
}) {
  const kind = classifyError(error);
  const config = KIND_CONFIG[kind];
  const [retrying, setRetrying] = useState(false);
  const [seenError, setSeenError] = useState(error);

  if (error !== seenError) {
    setSeenError(error);
    setRetrying(false);
  }

  function handleRetry() {
    setRetrying(true);
    onRetry();
  }

  return (
    <div
      role="alert"
      className="error-in max-w-full overflow-hidden rounded-2xl border border-rose-500/25 bg-gradient-to-br from-rose-500/10 to-transparent p-4"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-rose-300">
          {config.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-rose-100">{config.title}</p>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss error"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-rose-300/70 transition-colors hover:bg-rose-500/10 hover:text-rose-200"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-zinc-400">{config.body}</p>
          {error?.message && kind !== "generic" ? (
            <p className="mt-1.5 truncate font-mono text-[11px] text-rose-300/70">{error.message}</p>
          ) : null}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-[11px] text-zinc-500">Retry re-sends the failed message only.</p>
        <button
          type="button"
          onClick={handleRetry}
          disabled={retrying}
          className="flex items-center gap-2 rounded-full border border-rose-400/40 px-4 py-1.5 text-xs font-semibold text-rose-100 transition-colors hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {retrying ? (
            <>
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-rose-300/40 border-t-rose-200" />
              Retrying…
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              Retry message
            </>
          )}
        </button>
      </div>
    </div>
  );
}
