"use client";

import type { MetaTagsResult } from "@/ai/types";

export function MetaTagsCard({ result }: { result: MetaTagsResult }) {
  const host = (() => {
    try {
      return new URL(result.url).hostname;
    } catch {
      return result.url;
    }
  })();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        {result.favicon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={result.favicon}
            alt=""
            className="h-5 w-5 shrink-0 rounded-sm"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : null}
        <p className="text-xs font-medium text-zinc-400">
          {host}
          <span className="ml-2 truncate font-mono text-zinc-500">{result.url}</span>
        </p>
      </div>

      {result.ogImage ? (
        <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={result.ogImage}
            alt={result.title ?? "Page preview"}
            className="max-h-48 w-full object-cover"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        </div>
      ) : (
        <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-zinc-800 bg-zinc-900/40">
          <p className="text-xs text-zinc-500">No preview image found</p>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-zinc-100">
          {result.title ?? <span className="font-normal italic text-zinc-500">No page title found</span>}
        </p>
        {result.siteName ? (
          <p className="text-xs text-zinc-400">{result.siteName}</p>
        ) : null}
      </div>

      <p className="text-sm leading-relaxed text-zinc-300">
        {result.description ?? <span className="italic text-zinc-500">No description found for this page.</span>}
      </p>

      <dl className="grid grid-cols-2 gap-2">
        <Field label="Title" present={Boolean(result.title)} />
        <Field label="Description" present={Boolean(result.description)} />
        <Field label="Open Graph image" present={Boolean(result.ogImage)} />
        <Field label="Site name" present={Boolean(result.siteName)} />
      </dl>
    </div>
  );
}

function Field({ label, present }: { label: string; present: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/60 px-2.5 py-1.5">
      <dt className="text-xs text-zinc-400">{label}</dt>
      <dd className={`text-xs font-semibold ${present ? "text-emerald-400" : "text-amber-400"}`}>
        {present ? "found" : "missing"}
      </dd>
    </div>
  );
}
