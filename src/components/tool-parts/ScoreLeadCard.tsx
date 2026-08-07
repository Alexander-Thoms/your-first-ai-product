"use client";

import type { ScoreLeadResult } from "@/ai/types";

const GRADE_STYLE: Record<string, { ring: string; text: string; bar: string; label: string }> = {
  A: { ring: "text-emerald-500", text: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500", label: "Excellent fit" },
  B: { ring: "text-sky-500", text: "text-sky-600 dark:text-sky-400", bar: "bg-sky-500", label: "Strong fit" },
  C: { ring: "text-amber-500", text: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500", label: "Possible fit" },
  D: { ring: "text-rose-500", text: "text-rose-600 dark:text-rose-400", bar: "bg-rose-500", label: "Weak fit" },
};

export function ScoreLeadCard({ result }: { result: ScoreLeadResult }) {
  const style = GRADE_STYLE[result.grade] ?? GRADE_STYLE.D;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-current text-xl font-bold ${style.ring}`}>
          {result.score}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-100">{result.company}</p>
          <p className="text-xs text-zinc-400">{result.name}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${style.text} bg-current/10`}>
              Grade {result.grade}
            </span>
            <span className="text-xs text-zinc-400">{style.label}</span>
          </div>
        </div>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${style.bar}`}
          style={{ width: `${result.score}%` }}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Signals</p>
          <ul className="flex flex-col gap-1.5">
            {result.signals.map((signal) => (
              <li key={signal} className="flex items-start gap-2 text-xs leading-relaxed text-zinc-300">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                {signal}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Recommendations</p>
          <ul className="flex flex-col gap-1.5">
            {result.recommendations.map((rec) => (
              <li key={rec} className="flex items-start gap-2 text-xs leading-relaxed text-zinc-300">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
