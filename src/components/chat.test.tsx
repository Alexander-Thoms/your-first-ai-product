import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Chat from "./chat";

const chatState = {
  messages: [],
  sendMessage: vi.fn(),
  regenerate: vi.fn(),
  status: "ready",
  error: undefined,
  stop: vi.fn(),
  clearError: vi.fn(),
};

vi.mock("@ai-sdk/react", () => ({
  useChat: () => chatState,
}));

vi.mock("ai", () => ({
  DefaultChatTransport: class {
    constructor() {}
  },
}));

beforeEach(() => {
  window.localStorage.clear();
  Object.defineProperty(HTMLElement.prototype, "scrollTo", {
    configurable: true,
    value: vi.fn(),
  });
  chatState.sendMessage.mockClear();
});

describe("Chat", () => {
  it("renders the empty-state hero and suggestion chips on first run", () => {
    render(<Chat />);
    expect(screen.getByText("Pipeline Copilot")).toBeInTheDocument();
    expect(screen.getByText("No conversations yet")).toBeInTheDocument();
    expect(screen.getByText("Score a lead")).toBeInTheDocument();
    expect(screen.getByText("Preview a URL")).toBeInTheDocument();
    expect(screen.getByText("Query the dataset")).toBeInTheDocument();
    expect(screen.getByText("Trigger a failure")).toBeInTheDocument();
  });

  it("disables Send until the input has non-whitespace text", async () => {
    const user = userEvent.setup();
    render(<Chat />);
    const send = screen.getByRole("button", { name: "Send" });
    expect(send).toBeDisabled();
    await user.type(screen.getByLabelText("Message"), "   ");
    expect(send).toBeDisabled();
    await user.type(screen.getByLabelText("Message"), "Score Acme");
    expect(send).toBeEnabled();
  });

  it("sends a typed message on submit", async () => {
    const user = userEvent.setup();
    render(<Chat />);
    await user.type(screen.getByLabelText("Message"), "Score this lead");
    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(chatState.sendMessage).toHaveBeenCalledWith({ text: "Score this lead" });
  });

  it("opens a fresh conversation with the New button", async () => {
    const user = userEvent.setup();
    render(<Chat />);
    await user.click(screen.getByRole("button", { name: /New/i }));
    expect(screen.getByText("No conversations yet")).toBeInTheDocument();
  });

  it("loads stored conversations from localStorage after mount", async () => {
    window.localStorage.setItem(
      "pipeline-copilot:conversations:v1",
      JSON.stringify({
        version: 1,
        conversations: [
          { id: "c1", title: "First chat", messages: [], updatedAt: 1 },
          { id: "c2", title: "Second chat", messages: [], updatedAt: 2 },
        ],
      }),
    );
    render(<Chat />);
    const nav = await screen.findByRole("navigation");
    expect(within(nav).getByRole("button", { name: "Second chat" })).toBeInTheDocument();
    expect(within(nav).getAllByRole("button")).toHaveLength(2);
  });
});
