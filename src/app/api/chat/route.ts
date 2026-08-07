import { convertToModelMessages, streamText, stepCountIs } from "ai";
import type { UIMessage } from "ai";
import { createModel, model } from "@/ai/model";
import { tools } from "@/ai/tools";
import { resolveSabotage, sabotageResponse } from "./sabotage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidHttpUrl(value: string | undefined): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const { messages }: { messages: UIMessage[] } = await request.json();

  const sabotaged = sabotageResponse(resolveSabotage(request));
  if (sabotaged) return sabotaged;

  const baseUrl = request.headers.get("x-ollama-base-url")?.trim();
  const modelId = request.headers.get("x-ollama-model")?.trim();
  const chatModel =
    baseUrl || modelId ? createModel(isValidHttpUrl(baseUrl) ? baseUrl : undefined, modelId) : model;

  const result = streamText({
    model: chatModel,
    system: [
      "You run a sales-pipeline assistant with three tools.",
      "- scoreLead: qualify/score a lead (BANT). Use when asked to score, qualify, or rank a lead.",
      "- fetchMetaTags: preview a URL's meta tags. Use when asked to fetch or preview page metadata.",
      "- queryData: query the internal lead dataset. Use when asked to query, filter, or analyze leads.",
      "Prefer a tool over guessing numbers. After a tool returns, summarize its result in one or two short sentences.",
    ].join("\n"),
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(3),
    tools,
  });

  return result.toUIMessageStreamResponse({
    onError: (error) => {
      const cause = (error as { cause?: Error })?.cause;
      if (cause?.message) return cause.message;
      if (error instanceof Error && error.message) return error.message;
      return "An error occurred.";
    },
  });
}
