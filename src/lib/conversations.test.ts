import { beforeEach, describe, expect, it } from "vitest";
import {
  createConversationId,
  deriveTitle,
  loadConversations,
  saveConversations,
  type Conversation,
} from "./conversations";
import type { UIMessage } from "ai";

const KEY = "pipeline-copilot:conversations:v1";

function userMessage(text: string): UIMessage {
  return {
    id: `msg-${text}`,
    role: "user",
    parts: [{ type: "text", text }],
  };
}

function makeConversation(id: string, messages: UIMessage[] = []): Conversation {
  return { id, title: deriveTitle(messages), messages, updatedAt: Date.now() };
}

describe("loadConversations", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns an empty list when nothing is stored", () => {
    expect(loadConversations()).toEqual([]);
  });

  it("returns an empty list on corrupt JSON", () => {
    window.localStorage.setItem(KEY, "{broken");
    expect(loadConversations()).toEqual([]);
  });

  it("returns an empty list on a version mismatch", () => {
    window.localStorage.setItem(KEY, JSON.stringify({ version: 99, conversations: [] }));
    expect(loadConversations()).toEqual([]);
  });

  it("returns an empty list when conversations is not an array", () => {
    window.localStorage.setItem(KEY, JSON.stringify({ version: 1, conversations: "nope" }));
    expect(loadConversations()).toEqual([]);
  });

  it("round-trips saved conversations", () => {
    const convos = [makeConversation("a", [userMessage("Score Acme")])];
    saveConversations(convos);
    const loaded = loadConversations();
    expect(loaded.length).toBe(1);
    expect(loaded[0].id).toBe("a");
    expect(loaded[0].messages[0].parts[0].type).toBe("text");
  });
});

describe("deriveTitle", () => {
  it("returns the default for an empty conversation", () => {
    expect(deriveTitle([])).toBe("New conversation");
  });

  it("uses the first user text as the title", () => {
    const messages: UIMessage[] = [
      userMessage("Score this lead please"),
      { id: "a2", role: "assistant", parts: [{ type: "text", text: "Done." }] },
    ];
    expect(deriveTitle(messages)).toBe("Score this lead please");
  });

  it("truncates long titles at 40 characters", () => {
    const long = "x".repeat(60);
    expect(deriveTitle([userMessage(long)])).toBe(`${"x".repeat(40)}…`);
  });
});

describe("createConversationId", () => {
  it("produces unique ids", () => {
    expect(createConversationId()).not.toBe(createConversationId());
  });
});
