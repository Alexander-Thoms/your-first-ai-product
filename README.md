# Pipeline Copilot

A production-ready AI-enhanced frontend app that turns a plain chat prompt into **typed, component-based tool results** for a sales pipeline. Ask it to score a lead, preview a web page's meta tags, or query an internal lead dataset — the model plans which tool to call, the app streams the tool's lifecycle (reading input → running → result/error), and each result renders as a bespoke UI component.

## Project brief

**Problem:** Sales teams lose time reading raw, unstructured output from LLMs — a scored lead buried in a paragraph, a "yes" with no reasoning, a dataset you can't sort. **Who it's for:** SDRs, AEs, and sales ops who want answers they can act on (and skim) instead of prose. **Why this idea:** it lets me prove the full AI frontend stack end-to-end — a real LLM deciding *when* to call tools, structured output enforced with Zod, and every tool result rendered as an accessible, tested component rather than a chatbot echo.

**Live app:** https://you-first-ai-product.vercel.app *(update after deploy)*

## Setup & run

Requirements: Node 20+, npm. The app talks to an LLM — see [AI integration](#ai-integration) for model setup.

```bash
npm install && npm run dev
```

Open http://localhost:3000. To run the shipped tests, `npm test`; coverage, `npm run coverage`.

## Architecture

```
src/app/            Next.js App Router routes
  page.tsx          renders <Chat/>
  api/chat/route.ts POST /api/chat — streams the LLM response + tool lifecycle
  api/chat/sabotage.ts reproducible failure injection (x-sabotage header / SABOTAGE env)
  error.tsx, global-error.tsx, not-found.tsx  route-level error boundaries
src/components/
  chat.tsx          conversation state, localStorage persistence, message rendering
  ChatError.tsx     designed error taxonomy (rate-limit / offline / tool / generic)
  Settings.tsx      per-browser model endpoint override (localStorage)
  tool-parts/       one component per tool result + lifecycle <ToolFrame/>
src/ai/
  model.ts          Ollama provider (env-configurable endpoint + model)
  tools/            scoreLead, fetchMetaTags, queryData — each a Zod-validated tool
  types.ts          shared result types + tool part state machine
src/lib/
  conversations.ts  versioned localStorage storage for chats
  settings.ts       settings load/save with URL normalization + validation
```

**Flow:** user prompt → `useChat` posts to `/api/chat` → the model streams tool calls and text (AI SDK v7 `streamText`) → the client renders each tool part through a state machine (`input-streaming` → `input-available` → `output-available` / `output-error`) → results render as typed cards (score card, meta preview, dataset chart).

## AI integration

- **Provider:** [Ollama](https://ollama.com) (`ollama-ai-provider-v2`), default model `qwen2.5:7b` (tool-capable). Local default: `http://localhost:11434/api`. The header gear opens **Model settings** so a reviewer on the deployed preview can point the app at a *public* Ollama endpoint per-browser (persisted in localStorage; server-side validated to http/https).
- **Why Ollama:** free, runs offline, and its tool-calling is good enough to exercise the full lifecycle. Switch to Claude/OpenAI by swapping the provider in `src/ai/model.ts` — the tool layer is provider-agnostic.
- **System prompt** (`api/chat/route.ts`): tells the model when to call each tool and to prefer tools over guessing numbers, then summarize results in 1–2 sentences.
- **Structured output:** every tool declares a Zod schema (`src/ai/tools/*`). The model's arguments are validated against it before execution, and results are typed (e.g. `ScoreLeadResult`), so the UI renders components — never raw JSON. `stopWhen: stepCountIs(3)` bounds runaway tool chains.
- **Meaningful, not a gimmick:** tools execute real work (HTTP fetch with timeout, filtering/sorting a dataset, deterministic BANT scoring) and the UI shows the model's *reasoning* (input chips, signals, recommendations), not just the answer.

## Error, empty & edge-case handling

Every failure path has a designed state (full inventory + reviewer script in `docs/failure-inventory.md`):

- **Errors:** `ChatError` classifies failures into rate-limit / offline / tool / generic with distinct copy, icon, and a Retry that re-sends only the failed message (double-click guarded). Tool failures render in-frame (`output-error`) with guidance, never crashing the route. Route crashes hit `error.tsx` / `global-error.tsx` boundaries.
- **Empty states:** first-run hero with clickable example prompts, no-results dataset chart with a concrete next action, missing meta fields shown as "missing" rather than blank.
- **Edge cases:** empty/whitespace input guarded, corrupt localStorage falls back cleanly (versioned schema + try/catch), invalid settings URLs rejected, fetch timeouts / non-HTML / HTTP-error responses surface readable errors, division-by-zero and score clamping guarded, unknown tool parts fall back gracefully.
- **Sabotage:** set `x-sabotage: ratelimit | midstream | malformed-tool` (or `SABOTAGE` env) to reproduce failures deterministically in review.

## Testing

Vitest + Testing Library. **81 tests, ~86% line coverage** (`npm test`, `npm run coverage`).

- **Unit:** tool logic (scoring thresholds, filters/sorts, empty-result division guard, fetch error paths), settings normalization, conversation storage corruption, error classification, sabotage resolution.
- **Component:** `Chat` (empty state, input guard, send), `ChatError` (kind-specific copy, retry guard), `Settings` (validation + persistence), and all `tool-parts` (score card, meta fallbacks, chart empty state, tool-frame lifecycle/error states).

## Deployment

Vercel (App Router). Docs: `docs/deployment-checklist.md` (filled + signed off, rollback plan), `docs/audit.md` (Lighthouse + axe). Also see `.env.example`.

```bash
npm run build    # production build (verified locally)
vercel --prod    # or import the repo on vercel.com
```

| Env var | Default | Purpose |
|---|---|---|
| `OLLAMA_BASE_URL` | `http://localhost:11434/api` | Ollama endpoint (must include `/api`) |
| `OLLAMA_MODEL` | `qwen2.5:7b` | Model id |

Deployed apps must reach a **public** Ollama endpoint (the `OLLAMA_BASE_URL` env or the per-browser Model settings override); `localhost` only works on your machine.

## Known limitations & future improvements

- **Ollama dependency:** the live preview needs a public Ollama endpoint (Ollama Cloud or a tunnel); out of the box the app defaults to `localhost`. A hosted provider (Claude) would make the deployed demo zero-config.
- **fetchMetaTags:** reads meta tags only from static HTML; JS-rendered sites return missing fields. No SSRF/robots handling — blocked for internal URLs server-side only by schema.
- **Conversations:** localStorage, not a backend — clearing site data loses chats. No multi-user auth.
- **Chat persistence:** `chat.tsx` syncs `useChat` messages back into conversation state on each render; fine at this scale, but a reducer or server persistence would be cleaner for long chats.
- **Retry semantics** rely on AI SDK `regenerate()`; a failed multi-tool turn restarts from the last user message.

## Repository map

- `README.md` — you are here
- `docs/failure-inventory.md` — error/empty/edge-case cases + reviewer sabotage script
- `docs/deployment-checklist.md` — deployment sign-off + rollback/monitoring plan
- `docs/audit.md` — performance & accessibility audit evidence
- `docs/reflection.md` — capstone reflection
