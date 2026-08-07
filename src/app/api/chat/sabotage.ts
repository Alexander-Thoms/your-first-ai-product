import { createUIMessageStream, createUIMessageStreamResponse } from "ai";

export type Sabotage = "ratelimit" | "midstream" | "malformed-tool";

const SABOTAGES: Sabotage[] = ["ratelimit", "midstream", "malformed-tool"];

export function resolveSabotage(request: Request): Sabotage | undefined {
  const header = request.headers.get("x-sabotage");
  if (header && (SABOTAGES as string[]).includes(header)) {
    return header as Sabotage;
  }
  const env = process.env.SABOTAGE;
  if (env && (SABOTAGES as string[]).includes(env)) {
    return env as Sabotage;
  }
  return undefined;
}

export function sabotageResponse(sabotage: Sabotage | undefined): Response | undefined {
  switch (sabotage) {
    case "ratelimit":
      return new Response(
        "Rate limit exceeded. Please wait a moment, then try again.",
        { status: 429, statusText: "Too Many Requests" },
      );

    case "midstream":
      return createUIMessageStreamResponse({
        stream: createUIMessageStream({
          execute: async ({ writer }) => {
            writer.write({ type: "text-start", id: "sabotage-mid" });
            await new Promise((resolve) => setTimeout(resolve, 60));
            writer.write({
              type: "text-delta",
              id: "sabotage-mid",
              delta: "Running your request…",
            });
            await new Promise((resolve) => setTimeout(resolve, 120));
            writer.write({
              type: "text-delta",
              id: "sabotage-mid",
              delta: " ",
            });
            await new Promise((resolve) => setTimeout(resolve, 120));
            throw new Error("The connection was interrupted while streaming the response.");
          },
          onError: (error) =>
            error instanceof Error ? error.message : "The connection was interrupted.",
        }),
      });

    case "malformed-tool":
      return createUIMessageStreamResponse({
        stream: createUIMessageStream({
          execute: async ({ writer }) => {
            writer.write({
              type: "tool-input-available",
              toolCallId: "sabotage-tool-1",
              toolName: "scoreLead",
              input: { name: "Example", company: "Acme Corp", budget: 50000 },
            });
            await new Promise((resolve) => setTimeout(resolve, 80));
            writer.write({
              type: "tool-output-error",
              toolCallId: "sabotage-tool-1",
              errorText: "The tool returned malformed JSON: expected a score card, got invalid data.",
            });
          },
          onError: (error) =>
            error instanceof Error ? error.message : "The tool returned malformed output.",
        }),
      });

    default:
      return undefined;
  }
}
