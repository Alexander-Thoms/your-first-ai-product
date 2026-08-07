import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatError, classifyError } from "./ChatError";

describe("classifyError", () => {
  it("classifies rate limits", () => {
    expect(classifyError(new Error("HTTP 429 Too Many Requests"))).toBe("rate-limit");
  });

  it("classifies network/connection failures as offline", () => {
    expect(classifyError(new Error("fetch failed"))).toBe("offline");
    expect(classifyError(new Error("The connection was interrupted"))).toBe("offline");
  });

  it("classifies tool failures", () => {
    expect(classifyError(new Error("tool returned malformed JSON"))).toBe("tool");
  });

  it("falls back to generic", () => {
    expect(classifyError(new Error("something else"))).toBe("generic");
    expect(classifyError(undefined)).toBe("generic");
  });
});

describe("ChatError", () => {
  it("shows rate-limit copy for a 429", () => {
    render(<ChatError error={new Error("HTTP 429 rate limit")} onRetry={() => {}} onDismiss={() => {}} />);
    expect(screen.getByText("Rate limit hit")).toBeInTheDocument();
  });

  it("shows connection-lost copy for an offline error", () => {
    render(<ChatError error={new Error("fetch failed")} onRetry={() => {}} onDismiss={() => {}} />);
    expect(screen.getByText("Connection lost")).toBeInTheDocument();
  });

  it("hides the raw message for generic errors", () => {
    render(<ChatError error={new Error("mystery")} onRetry={() => {}} onDismiss={() => {}} />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.queryByText("mystery")).not.toBeInTheDocument();
  });

  it("calls onDismiss when the dismiss button is pressed", async () => {
    const onDismiss = vi.fn();
    render(<ChatError error={new Error("fetch failed")} onRetry={() => {}} onDismiss={onDismiss} />);
    await userEvent.click(screen.getByLabelText("Dismiss error"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("calls onRetry and disables the button while retrying", async () => {
    const onRetry = vi.fn();
    render(<ChatError error={new Error("fetch failed")} onRetry={onRetry} onDismiss={() => {}} />);
    const button = screen.getByRole("button", { name: /Retry message/i });
    await userEvent.click(button);
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: /Retrying/i })).toBeDisabled();
  });
});
