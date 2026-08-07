"use client";

import type { QueryDataResult } from "@/ai/types";

const INTENT_DOT: Record<string, string> = {
  hot: "bg-emerald-500",
  warm: "bg-amber-500",
  cold: "bg-zinc-500",
};

const MAX_BARS = 8;

export function QueryDataChart({ result }: { result: QueryDataResult }) {
  const { rows, summary } = result;

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-zinc-400">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="8" y1="14" x2="8" y2="18" />
            <line x1="12" y1="10" x2="12" y2="18" />
            <line x1="16" y1="6" x2="16" y2="18" />
          </svg>
        </div>
        <p className="text-sm font-medium text-zinc-300">No leads match that filter</p>
        <p className="max-w-xs text-xs text-zinc-500">
          {result.filter.industry
            ? `Try dropping the "${result.filter.industry}" industry filter or lowering the score threshold, then query again.`
            : "Try a broader query — for example all leads, or a single industry without a score floor."}
        </p>
      </div>
    );
  }

  const maxScore = Math.max(...rows.map((row) => row.score), 1);
  const shown = rows.slice(0, MAX_BARS);
  const extra = rows.length - shown.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Stat label="Matches" value={String(summary.count)} />
        <Stat label="Avg score" value={String(summary.avgScore)} />
        <Stat label="Total budget" value={`$${summary.totalBudget.toLocaleString()}`} />
      </div>

      <div className="flex flex-col gap-3">
        {shown.map((row) => (
          <div key={row.company + row.name} className="grid grid-cols-[64px_1fr] items-center gap-2">
            <p className="truncate text-right text-xs font-medium text-zinc-300">{row.name}</p>
            <div className="flex items-center gap-2">
              <div className="h-3 flex-1 overflow-hidden rounded-sm bg-zinc-800">
                <div
                  className="h-full rounded-sm bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                  style={{ width: `${Math.round((row.score / maxScore) * 100)}%` }}
                />
              </div>
              <span className="w-7 text-right font-mono text-xs text-zinc-400">{row.score}</span>
            </div>
          </div>
        ))}
        {extra > 0 ? (
          <p className="text-xs text-zinc-500">…and {extra} more, top {MAX_BARS} shown.</p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-zinc-800 pt-3">
        {rows.slice(0, 6).map((row) => (
          <span key={row.company + row.name} className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300">
            <span className={`h-1.5 w-1.5 rounded-full ${INTENT_DOT[row.intent]}`} />
            {row.company}
          </span>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2">
      <p className="text-lg font-bold text-zinc-100">{value}</p>
      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">{label}</p>
    </div>
  );
}
