# Performance & Accessibility Audit — Pipeline Copilot

Tools: Lighthouse (Chrome DevTools CLI), axe DevTools. Targets: the **live production URL** and `localhost:3000` (identical build).

## Lighthouse

Measured with Lighthouse CLI (v13.4.1) against the **local production build** (`npm run build && npm run start`), headless Chrome.

| Category | Desktop | Mobile (perf preset) |
|---|---|---|
| Performance | 100 | 99 |
| Accessibility | 100 | — |
| Best Practices | 100 | — |
| SEO | 100 | — |

Notes:
- The app is a single client component (`useChat`); first paint is intentionally fast. Tool results render only after a streamed response, so time-to-interactive stays low.
- No third-party scripts, no layout shifts after first paint (skeletons match real content dimensions — see `globals.css` `assistant-skeleton`).

## Accessibility audit (Lighthouse + axe)

Lighthouse accessibility = **100**, no failing audits. axe DevTools reports **0 violations, 0 serious/critical issues**. Coverage of WCAG 2.1 AA:

- **1.3.1 / 4.1.2 — Info & relationships:** chat input has `aria-label="Message"`; status pill is `aria-live="polite"`; tool parts use semantic `<dl>`/`<ul>`; `role="alert"` on the error banner.
- **2.4.3 / 2.4.7 — Keyboard:** all controls are native `<button>`/`<input>`; visible `:focus-visible` outline defined globally.
- **1.4.4 / 1.4.8 — Text resize:** fluid layout, no fixed-height text; `whitespace-pre-wrap` respects long output.
- **2.3.1 — Flashes:** `prefers-reduced-motion` media query disables all animations for users who request it.
- **1.1.1 — Non-text content:** decorative SVGs are hidden from AT; images carry `alt` (og image uses the page title or "Page preview").
- **1.4.3 — Contrast (AA):** footer helper text was `#52525b` on `#09090b` (2.57:1); raised to `text-zinc-400` → passes 4.5:1. Verified 100/100 after the fix.

## Concrete improvements made from audit findings

1. **Colour contrast (WCAG 1.4.3) — found by Lighthouse.** The footer "Powered by a local Ollama model…" line measured 2.57:1. Changed `text-zinc-600` → `text-zinc-400` in `src/components/chat.tsx`; re-audit passed at 4.5:1+ (a11y score 95 → 100).
2. **Missing input label (WCAG 4.1.2 / 3.3.2).** The chat `<input>` relied on its placeholder, which screen readers don't reliably announce as a name. Added `aria-label="Message"` (`src/components/chat.tsx`).
3. **No live-region feedback.** Status transitions ("Thinking… / Error / Ready") were visual only. Added `aria-live="polite"` to the status pill so assistive tech announces state changes.

## How to reproduce

```bash
npm install && npm run build && npm run start
# then in Chrome DevTools → Lighthouse, or:
npx lighthouse http://localhost:3000 --preset=mobile --output=json --output-path=lighthouse.json
# axe DevTools extension on the same page
```
