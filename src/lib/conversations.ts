import type { UIMessage } from "ai";

export interface Conversation {
  id: string;
  title: string;
  messages: UIMessage[];
  updatedAt: number;
}

const STORAGE_KEY = "pipeline-copilot:conversations:v1";
const VERSION = 1;

export function loadConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (
      parsed?.version !== VERSION ||
      !Array.isArray(parsed.conversations)
    ) {
      return [];
    }
    return parsed.conversations as Conversation[];
  } catch {
    return [];
  }
}

export function saveConversations(conversations: Conversation[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: VERSION, conversations }),
    );
  } catch {
    // Storage full or unavailable — degrade silently.
  }
}

export function deriveTitle(messages: UIMessage[]): string {
  const first = messages.find((message) => message.role === "user");
  const text = first?.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join(" ")
    .trim();
  if (!text) return "New conversation";
  return text.length > 40 ? `${text.slice(0, 40)}…` : text;
}

export function createConversationId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `conv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
