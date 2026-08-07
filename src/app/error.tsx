"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Route crashed:", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-zinc-950 px-4 text-zinc-100">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-300">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="text-sm leading-relaxed text-zinc-400">
          This page hit an unexpected error. You can try reloading the segment, or start over from the home page.
        </p>
        {error.digest ? (
          <p className="font-mono text-xs text-zinc-500">digest: {error.digest}</p>
        ) : null}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={retry}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800"
          >
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}
