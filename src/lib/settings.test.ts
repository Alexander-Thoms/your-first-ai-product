import { beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  normalizeBaseUrl,
  saveSettings,
} from "./settings";

const KEY = "pipeline-copilot:settings:v1";

describe("normalizeBaseUrl", () => {
  it("returns the default for an empty value", () => {
    expect(normalizeBaseUrl("")).toBe(DEFAULT_SETTINGS.baseUrl);
    expect(normalizeBaseUrl("   ")).toBe(DEFAULT_SETTINGS.baseUrl);
  });

  it("adds the /api suffix when omitted", () => {
    expect(normalizeBaseUrl("https://ollama.example.com")).toBe("https://ollama.example.com/api");
  });

  it("strips trailing slashes before appending", () => {
    expect(normalizeBaseUrl("https://ollama.example.com///")).toBe("https://ollama.example.com/api");
  });

  it("prepends https when the scheme is missing", () => {
    expect(normalizeBaseUrl("ollama.example.com")).toBe("https://ollama.example.com/api");
  });

  it("keeps an existing http scheme", () => {
    expect(normalizeBaseUrl("http://localhost:11434/api")).toBe("http://localhost:11434/api");
  });
});

describe("loadSettings / saveSettings", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns defaults when nothing is stored", () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("returns defaults when the stored value is corrupt JSON", () => {
    window.localStorage.setItem(KEY, "{not json");
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("returns defaults when stored fields are not strings", () => {
    window.localStorage.setItem(KEY, JSON.stringify({ baseUrl: 42, model: null }));
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("round-trips saved settings through storage", () => {
    const next = { baseUrl: "https://public.ollama.dev/api", model: "qwen2.5:14b" };
    saveSettings(next);
    expect(loadSettings()).toEqual(next);
  });

  it("normalizes a saved bare URL on load", () => {
    window.localStorage.setItem(KEY, JSON.stringify({ baseUrl: "ollama.dev", model: "m" }));
    expect(loadSettings().baseUrl).toBe("https://ollama.dev/api");
  });
});
