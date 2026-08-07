<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md

Compact guidance for OpenCode sessions in this repo.

## Stack (verified)
- Next.js 16.3.0, App Router, TypeScript, React 19.2.8
- AI SDK v7 (`ai` ^7.0.56, `@ai-sdk/react` ^4.0.59)
- `ollama-ai-provider-v2` (local model), Zod ^4.4.3
- Tailwind CSS v4, ESLint 9 (`eslint-config-next` 16.3.0), Turbopack dev server
- Packages managed with npm (use `npm`, not yarn/pnpm/bun)

## Commands
- `npm run dev` — dev server at http://localhost:3000
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — ESLint
- `npm run test` — Vitest (unit + component tests)
- `npm run coverage` — Vitest with v8 coverage (threshold: ≥50% lines)
- `npm run test:watch` — Vitest watch mode

## Conventions / gotchas
- App code lives under `src/app/` (not top-level `app/`). `src/app/page.js` = `/`, `src/app/layout.js` = root layout. New routes = new folders under `src/app/`.
- `next.config.ts` sets `turbopack.root: __dirname` to silence a lockfile warning caused by a stray `C:\Users\Alexlaptop\package-lock.json` outside this repo. Do not remove that line unless the stray lockfile is gone.
- Keep React pinned to the version in `package.json`. `eslint-config-next` 16 expects ESLint 9 — do NOT upgrade `eslint` to v10 (it would break lint).
- `CLAUDE.md` just contains `@AGENTS.md`; keep it as a pointer, don't duplicate content there.

## Environment
- `OLLAMA_BASE_URL` (default `http://localhost:11434/api`) — must include `/api`; the provider appends `/chat`. For the deployed Vercel preview, point this at a *public* Ollama endpoint (Ollama Cloud or a tunnel).
- `OLLAMA_MODEL` (default `qwen2.5:7b`) — a tool-capable local model; pull with `ollama pull qwen2.5:7b`.

## Runtime Ollama override (in-app settings)
- The gear button in the app header ("Model settings") lets users override the endpoint per
  browser via localStorage (`pipeline-copilot:settings:v1`, normalized in `src/lib/settings.ts`).
- The client sends `x-ollama-base-url` / `x-ollama-model` headers; `src/app/api/chat/route.ts`
  reads them and falls back to env vars (server-side validation restricts to http/https).
- `useChat` gets these via an explicit `new DefaultChatTransport({ api, headers: () => … })`
  in `src/components/chat.tsx` — passing `headers` directly to `useChat` is NOT type-supported
  in `@ai-sdk/react` 4.x (its `UseChatOptions` omits it), so always use the transport form.

## Before writing Next.js code
This is Next.js 16, not a version from training data. Read `node_modules/next/dist/docs/` (e.g. `01-app/`) for the current App Router APIs before editing routes, layouts, or config.
