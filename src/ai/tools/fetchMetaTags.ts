import { tool } from "ai";
import { z } from "zod";
import { delay } from "../utils";
import type { MetaTagsResult } from "../types";

export const fetchMetaTagsSchema = z.object({
  url: z
    .url()
    .describe("Full absolute URL (with protocol) whose meta tags should be fetched"),
});

const META_PATTERNS: Array<[key: "description" | "siteName" | "ogImage", names: string[]]> = [
  ["description", ["description", "og:description", "twitter:description"]],
  ["siteName", ["og:site_name", "application-name"]],
  ["ogImage", ["og:image", "twitter:image"]],
];

function extractMeta(html: string, attrs: string[]): string | null {
  for (const attr of attrs) {
    const escaped = attr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = html.match(
      new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]*content=["']([^"']*)["']`, "i"),
    ) ?? html.match(
      new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escaped}["']`, "i"),
    );
    if (match) return decodeEntities(match[1].trim()) || null;
  }
  return null;
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;/g, "'");
}

export const fetchMetaTagsTool = tool({
  description: [
    "Fetch the meta tags (title, description, site name, OG image, favicon) of a web page.",
    "Call this when the user asks to preview, fetch, or look up a URL's page metadata.",
  ].join(" "),
  inputSchema: fetchMetaTagsSchema,
  execute: async ({ url }): Promise<MetaTagsResult> => {
    await delay(1200);

    let response: Response;
    try {
      response = await fetch(url, {
        signal: AbortSignal.timeout(8000),
        headers: {
          "user-agent":
            "Mozilla/5.0 (compatible; GenAICapstone/1.0; +https://example.com/bot)",
          accept: "text/html,application/xhtml+xml",
        },
        redirect: "follow",
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`Could not reach ${url} (${reason}). Check that the domain exists and serves HTML.`);
    }

    if (!response.ok) {
      throw new Error(`Fetching ${url} failed with HTTP ${response.status} ${response.statusText}.`);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      throw new Error(`${url} responded with ${contentType || "a non-HTML type"}, so it has no meta tags to read.`);
    }

    let html: string;
    try {
      html = await response.text();
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`The connection dropped while reading ${url} (${reason}). Try again.`);
    }

    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

    const parsed = new URL(url);
    const origin = parsed.origin;

    const result: MetaTagsResult = {
      url,
      title: titleMatch ? decodeEntities(titleMatch[1].trim()) || null : null,
      favicon: `${origin}/favicon.ico`,
    };

    for (const [key, names] of META_PATTERNS) {
      result[key] = extractMeta(html, names);
    }

    return result;
  },
});
