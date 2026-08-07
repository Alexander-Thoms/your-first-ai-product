import { createOllama } from "ollama-ai-provider-v2";

export function createModel(baseUrl?: string, modelId?: string) {
  const provider = createOllama({
    baseURL: baseUrl?.trim() || process.env.OLLAMA_BASE_URL || "http://localhost:11434/api",
  });
  return provider(modelId?.trim() || process.env.OLLAMA_MODEL || "qwen2.5:7b");
}

export const model = createModel();
