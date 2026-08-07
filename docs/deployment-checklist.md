# Deployment Checklist — Pipeline Copilot (FE-11)

Signed off before the capstone submission. **Status: passed.**

## Pre-deploy (local)

- [x] `npm install` clean on a fresh clone
- [x] `npm run lint` — 0 errors, 0 warnings
- [x] `npm run test` — 81 tests pass
- [x] `npm run coverage` — ~86% line coverage (threshold ≥50%)
- [x] `npm run build` — production build compiles; routes: `/` (static), `/api/chat` (dynamic)
- [x] `npm run start` + manual smoke test of the happy path and one failure path

## Environment & secrets

- [x] No secrets committed (`.env*` gitignored; only `.env.example` ships)
- [x] Runtime vars documented (`.env.example`, README):
  - `OLLAMA_BASE_URL` (default `http://localhost:11434/api`)
  - `OLLAMA_MODEL` (default `qwen2.5:7b`)
- [ ] **For production:** set a *public* Ollama endpoint via the `OLLAMA_BASE_URL` env var on the platform, or leave unset and instruct users to use the in-app Model settings override (each browser persists its own endpoint in localStorage). `localhost` will not work from serverless/other machines.

## Deploy (Vercel)

- [x] `.vercel` is gitignored; the project is configured via the Vercel dashboard/CLI (framework: Next.js 16, build `next build`, output `.next`)
- [x] Import `you-first-ai-product` on vercel.com or `vercel --prod`
- [ ] Verify the deployment succeeds and the status shows **Ready**
- [ ] Update the live URL in `README.md` (project brief section)

## Post-deploy smoke test (on the live URL)

- [ ] Fresh profile loads the "No conversations yet" hero + suggestion chips
- [ ] Happy path: "Score this lead: Acme Corp, SaaS, budget $50k, contact Dana." → score card renders with Signals + Recommendations
- [ ] Second tool: "Query the lead dataset for SaaS leads scoring 70 or higher." → chart renders
- [ ] Failure path A: with a dead/unknown Ollama endpoint → designed `ChatError` (Connection lost) + working Retry
- [ ] Failure path B: `x-sabotage: ratelimit` → "Rate limit hit" copy + Dismiss returns to ready
- [ ] Reload restores the conversation (localStorage persistence)
- [ ] No console errors

## How it fails safely

- **Model/endpoint unreachable** → `status === "error"` → `ChatError` with kind-specific copy; Retry re-sends only the failed message; Dismiss clears without touching history.
- **Tool failure mid-response** → tool part enters `output-error` state → in-frame `ErrorPanel` with guidance; the route never crashes.
- **Route/segment crash** → `error.tsx` boundary (client) with retry + "Back home"; fatal errors → `global-error.tsx`; unknown routes → `not-found.tsx`.
- **Corrupt localStorage** → versioned schema + try/catch falls back to a clean empty state.
- **Malformed tool output** → `ToolCall` renders a readable fallback instead of crashing.

## Rollback plan

1. **Primary:** Vercel dashboard → Deployments → select the last known-good deployment → **Promote to Production** (instant, zero-downtime, no code change).
2. **Git:** if the bad state is in `main`, `git revert <sha>` the offending commit, push, redeploy.
3. **Environment:** if the cause was an env var, change it on the Vercel project and redeploy without touching code.
4. **Fallback:** keep a previous deployment pinned as "reusable" so a single click can restore it.

## Monitoring

- Vercel Analytics/Logs for build failures, runtime errors and function (cold-start/streaming) behaviour.
- No Sentry yet — flagged as a future improvement in the README. Console + route error boundaries (`error.tsx` logs `error.digest`) cover the current scale.
- Health checks: `/` returns 200 on deploy; `/api/chat` is exercised by the smoke test above.

## Signed off

- [x] Author: Alexander Thoms
- [x] Date: 2026-08-07
- [ ] Deploy URL confirmed live (after `vercel --prod`)
