// @vitest-environment node
import { describe, expect, it } from "vitest";
import { resolveSabotage, sabotageResponse } from "./sabotage";

describe("resolveSabotage", () => {
  it("returns undefined with no signal", () => {
    const request = new Request("http://localhost/api/chat", { method: "POST" });
    expect(resolveSabotage(request)).toBeUndefined();
  });

  it("honours a valid x-sabotage header", () => {
    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "x-sabotage": "ratelimit" },
    });
    expect(resolveSabotage(request)).toBe("ratelimit");
  });

  it("ignores an unknown header value", () => {
    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "x-sabotage": "bogus" },
    });
    expect(resolveSabotage(request)).toBeUndefined();
  });

  it("falls back to the SABOTAGE env var", () => {
    const original = process.env.SABOTAGE;
    process.env.SABOTAGE = "midstream";
    try {
      expect(resolveSabotage(new Request("http://localhost/"))).toBe("midstream");
    } finally {
      process.env.SABOTAGE = original;
    }
  });
});

describe("sabotageResponse", () => {
  it("returns a 429 for ratelimit", () => {
    const response = sabotageResponse("ratelimit");
    expect(response?.status).toBe(429);
    expect(response?.statusText).toBe("Too Many Requests");
  });

  it("returns undefined for no sabotage", () => {
    expect(sabotageResponse(undefined)).toBeUndefined();
  });

  it("streams a mid-stream failure for midstream", async () => {
    const response = sabotageResponse("midstream");
    expect(response?.ok).toBe(true);
    const reader = response?.body?.getReader();
    expect(reader).toBeDefined();
    reader?.cancel();
  });

  it("streams a tool error part for malformed-tool", async () => {
    const response = sabotageResponse("malformed-tool");
    expect(response?.ok).toBe(true);
    const reader = response?.body?.getReader();
    expect(reader).toBeDefined();
    reader?.cancel();
  });
});
