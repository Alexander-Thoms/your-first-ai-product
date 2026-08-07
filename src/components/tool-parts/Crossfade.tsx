"use client";

import type { ReactNode } from "react";

export function Crossfade({ state, children }: { state: string; children: ReactNode }) {
  return (
    <div key={state} className="tool-fade" data-state={state}>
      {children}
    </div>
  );
}
