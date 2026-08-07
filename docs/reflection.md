# Reflection — Ship It Capstone

**What was hardest?**

Making the tool lifecycle feel *honest* rather than faked. The easy version of this app is a chat window that prints JSON back at you. The hard version is a state machine — `input-streaming → input-available → output-available / output-error` — where the user can see the model thinking, choosing a tool, and then *getting it wrong*. Getting every one of those states to render as a designed component, and making a tool failure look intentional instead of broken, took most of the effort. The error taxonomy (rate-limit / offline / tool / generic) was the second hardest: a generic error banner is easy; four distinct, calm, actionable messages that each tell the user what to do next is not.

**What would I do differently next time?**

I would stand up the AI provider decision earlier. The app is built around a local Ollama model, which is great for development but means the deployed demo needs a public endpoint before it "just works" for a reviewer. Swapping the provider layer (`src/ai/model.ts`) is a small change, but I deferred it until the end, which turned a two-line change into a deployment risk. Next time I'd also start with a reducer for chat state instead of syncing `useChat` messages back into conversation state during render — it works, but a cleaner state shape would make multi-conversation streaming easier to reason about.

**One thing that surprised me**

How much of "AI frontend engineering" is defensive programming. The model is the most unpredictable component in the system — it can call a tool with wrong arguments, stream a response and then drop the connection, or return malformed output. Most of the code I'm proudest of (the `output-error` tool panel, the retry-that-resends-only-the-failed-message, the versioned localStorage fallback) isn't the happy path at all. I expected the interesting part to be prompting and components; it turned out to be designing for the moments where the AI quietly fails.
