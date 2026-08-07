export interface ChatSettings {
  baseUrl: string;
  model: string;
}

const STORAGE_KEY = "pipeline-copilot:settings:v1";

export const DEFAULT_SETTINGS: ChatSettings = {
  baseUrl: "http://localhost:11434/api",
  model: "qwen2.5:7b",
};

export function normalizeBaseUrl(url: string): string {
  let value = url.trim().replace(/\/+$/, "");
  if (!value) return DEFAULT_SETTINGS.baseUrl;
  if (!/^https?:\/\//i.test(value)) {
    value = `https://${value}`;
  }
  if (!/\/api$/i.test(value)) {
    value = `${value}/api`;
  }
  return value;
}

export function loadSettings(): ChatSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<ChatSettings>;
    const baseUrl =
      typeof parsed.baseUrl === "string" && parsed.baseUrl.trim()
        ? normalizeBaseUrl(parsed.baseUrl)
        : DEFAULT_SETTINGS.baseUrl;
    const model =
      typeof parsed.model === "string" && parsed.model.trim()
        ? parsed.model.trim()
        : DEFAULT_SETTINGS.model;
    return { baseUrl, model };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: ChatSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // storage unavailable (private mode, quota) — keep in-memory settings
  }
}
