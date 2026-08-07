# Failure & Edge-Case Inventory (Checkpoint 1)

Primary flow: user sends a prompt → `POST /api/chat` streams tool parts and text via
`useChat` → tool results render as typed components (score card / meta card / chart).

Every case below is handled deliberately. The **Sabotage script** at the bottom is the
fixed review order; run each step in sequence, in the deployed preview.

## Cases and treatments

| # | Case | Trigger | Treatment |
|---|------|---------|-----------|
| 1 | Network down before send | DevTools → Offline, then send | `status === "error"` → designed `ChatError` with offline copy + Retry |
| 2 | API error mid-stream | Sabotage: `x-sabotage: midstream` | Stream aborts → `useChat.error` → `ChatError` with Retry (retries the failed message, not the conversation) |
| 3 | HTTP 429 rate limit | Sabotage: `x-sabotage: ratelimit` | Server returns 429 → `ChatError` with rate-limit copy ("wait a moment, then retry") |
| 4 | Empty input | Submit whitespace / empty | Input `disabled` when empty; `submit()` guards `!text.trim()` |
| 5 | No results from query | `queryData` with impossible filter | `QueryDataChart` designed empty state + concrete next action |
| 6 | First-run empty state | Fresh visit, no conversations | "No conversations yet" hero + click-to-fill example prompts |
| 7 | Slow response | Throttle to Slow 3G | Assistant "thinking" skeleton (shimmer bubble) until first chunk; tool shimmer frames |
| 8 | Tool failure | `fetchMetaTags` on dead URL / malformed input | Tool `output-error` state → designed `ErrorPanel` with guidance |
| 9 | Corrupt localStorage | Manually corrupt the key | Versioned schema + try/catch → falls back to clean state |
| 10 | Route crash | Throw in a route segment | `error.tsx` boundary (client) with `retry`; `global-error.tsx`; `not-found.tsx` |

## Design decisions

- **Retry scope**: Retry re-sends the *failed message* via `regenerate()` — never the whole
  conversation. Button is disabled while busy (double-click guard) and clears the error
  on a new send.
- **Error taxonomy**: offline / 429 / tool / generic each get distinct copy + icon, but
  transition in calmly (fade, no red flash).
- **Skeletons**: match real content dimensions to avoid CLS; assistant bubble shimmer only
  while `status === "streaming"` before the first text delta.
- **Empty states are onboarding**: every one includes a next action, never a dead end.

## Sabotage script (reviewer order)

1. **Kill network before send** → DevTools Network → Offline → send a prompt → expect `ChatError` + working Retry.
2. **Kill connection mid-stream** → send `Score this lead: Acme Corp, SaaS, budget $50k, contact Dana.` then set Network → Offline mid-response → expect `ChatError` + Retry.
3. **Return 429** → add header `x-sabotage: ratelimit` (or set `SABOTAGE=ratelimit`) → send → expect rate-limit copy.
4. **Malformed JSON from a tool** → header `x-sabotage: malformed-tool` → ask to score a lead → tool fails into designed `output-error` state (no crash).
5. **Mid-stream throw** → header `x-sabotage: midstream` → expect aborted stream surfaced as `ChatError`.
6. **Empty first run** → clear site data / new incognito → expect "No conversations yet" hero.
7. **Happy path** → full tool lifecycle renders, zero console errors.

## Running on the Vercel preview (no local Ollama)

The gear button in the header opens **Model settings**, which lets the reviewer point the
app at a public Ollama endpoint per-browser (persisted in localStorage). The client sends
`x-ollama-base-url` / `x-ollama-model` headers; `src/app/api/chat/route.ts` validates the URL
(http/https only) and falls back to the `OLLAMA_BASE_URL` / `OLLAMA_MODEL` env vars. The base
URL should include `/api` (it is appended automatically if omitted).

## Automated verification

**Shipped in-repo (Vitest):** `npm test` runs 81 unit + component tests (~86% line coverage, threshold ≥50%) covering tool edge cases (empty query result, score clamping, fetch failure paths), settings/URL validation, corrupt-storage fallback, error classification, and every tool-part component state. See `README.md → Testing`.

**Browser E2E (historical):** a 24-assertion puppeteer-core suite was also run against a production build (`next start`) with headless Edge. All passed:

- Empty-state hero + 4 suggestion chips render on a fresh profile.
- Happy path: score-lead card renders `Signals` + `Recommendations` + a `Grade A–D`.
- Second tool call (queryData) completes; conversation text restored after a reload
  (localStorage persistence, case 9 happy side).
- Offline before send: server down → `ChatError` "Connection lost" + error status pill →
  server restarted → Retry re-sends the failed message and completes.
- Mid-stream kill: server stopped ~1.5 s into a live stream → `ChatError` → Retry recovers.
- 429 via intercepted `x-sabotage: ratelimit` header → "Rate limit hit" copy + 429 detail →
  Dismiss clears the banner and returns to ready.
- `x-sabotage: malformed-tool` → in-frame designed error (no crash, no route boundary).
- Model settings: gear opens panel, Save writes `pipeline-copilot:settings:v1`, the saved
  base URL shows in the panel and survives a reload.

The E2E suite was kept out of the repo (temp dir) to keep the capstone dependency-free; the
sabotage header + `SABOTAGE` env keep the reviewer path header-free, and the Vitest suite
covers the same failure modes in CI-friendly form.
