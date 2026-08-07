import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../utils", () => ({ delay: vi.fn(() => Promise.resolve()) }));

import { fetchMetaTagsTool } from "./fetchMetaTags";
import type { MetaTagsResult } from "../types";

const execute = (fetchMetaTagsTool as unknown as {
  execute: (args: { url: string }) => Promise<MetaTagsResult>;
}).execute;

function mockFetch(init: {
  status?: number;
  statusText?: string;
  contentType?: string;
  body?: string;
  reject?: boolean;
}) {
  const { status = 200, statusText = "OK", contentType = "text/html", body = "", reject = false } = init;
  return vi.fn().mockImplementation(async () => {
    if (reject) throw new Error("fetch failed");
    return {
      ok: status >= 200 && status < 300,
      status,
      statusText,
      headers: new Headers({ "content-type": contentType }),
      text: async () => body,
    };
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchMetaTagsTool", () => {
  it("extracts title, description, site name, OG image and favicon", async () => {
    const fetchMock = mockFetch({
      body: [
        "<html><head>",
        "<title>Northwind Labs</title>",
        '<meta name="description" content="SaaS analytics platform">',
        '<meta property="og:site_name" content="Northwind">',
        '<meta property="og:image" content="https://example.com/og.png">',
        "</head><body></body></html>",
      ].join(""),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await execute({ url: "https://example.com/page" });
    expect(result.title).toBe("Northwind Labs");
    expect(result.description).toBe("SaaS analytics platform");
    expect(result.siteName).toBe("Northwind");
    expect(result.ogImage).toBe("https://example.com/og.png");
    expect(result.favicon).toBe("https://example.com/favicon.ico");
  });

  it("returns nulls for a bare page instead of throwing", async () => {
    vi.stubGlobal("fetch", mockFetch({ body: "<html><head></head><body></body></html>" }));
    const result = await execute({ url: "https://example.com" });
    expect(result.title).toBeNull();
    expect(result.description).toBeNull();
    expect(result.ogImage).toBeNull();
    expect(result.siteName).toBeNull();
  });

  it("throws a readable error for a non-HTML response", async () => {
    vi.stubGlobal("fetch", mockFetch({ contentType: "application/json", body: "{}" }));
    await expect(execute({ url: "https://example.com" })).rejects.toThrow(/no meta tags to read/);
  });

  it("throws a readable error for an HTTP error status", async () => {
    vi.stubGlobal("fetch", mockFetch({ status: 404, statusText: "Not Found" }));
    await expect(execute({ url: "https://example.com" })).rejects.toThrow(/HTTP 404/);
  });

  it("throws a readable error when the network fails", async () => {
    vi.stubGlobal("fetch", mockFetch({ reject: true }));
    await expect(execute({ url: "https://example.com" })).rejects.toThrow(/Could not reach/);
  });

  it("throws a readable error when the body read fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "text/html" }),
      text: async () => {
        throw new Error("socket hang up");
      },
    });
    vi.stubGlobal("fetch", fetchMock);
    await expect(execute({ url: "https://example.com" })).rejects.toThrow(/dropped while reading/);
  });

  it("passes an absolute http(s) URL through the schema", async () => {
    vi.stubGlobal("fetch", mockFetch({ body: "" }));
    await expect(execute({ url: "https://example.com" })).resolves.toMatchObject({ url: "https://example.com" });
  });

  it("rejects a non-URL through the schema", async () => {
    vi.stubGlobal("fetch", mockFetch({ body: "" }));
    await expect(execute({ url: "not-a-url" })).rejects.toThrow();
  });
});
