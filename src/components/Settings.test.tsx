import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Settings } from "./Settings";
import { DEFAULT_SETTINGS } from "@/lib/settings";

describe("Settings", () => {
  it("opens the panel from the gear button", async () => {
    render(<Settings settings={DEFAULT_SETTINGS} onSave={() => {}} />);
    expect(screen.queryByText("Model settings")).not.toBeInTheDocument();
    await userEvent.click(screen.getByLabelText("Model settings"));
    expect(screen.getByText("Model settings")).toBeInTheDocument();
  });

  it("shows a validation message for an invalid base URL", async () => {
    const user = userEvent.setup();
    render(<Settings settings={DEFAULT_SETTINGS} onSave={() => {}} />);
    await user.click(screen.getByLabelText("Model settings"));
    const urlInput = screen.getByLabelText("Ollama base URL");
    await user.clear(urlInput);
    await user.type(urlInput, "not a valid url");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByText(/Enter a valid http\(s\) URL/)).toBeInTheDocument();
  });

  it("saves normalized settings", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<Settings settings={DEFAULT_SETTINGS} onSave={onSave} />);
    await user.click(screen.getByLabelText("Model settings"));
    const urlInput = screen.getByLabelText("Ollama base URL");
    await user.clear(urlInput);
    await user.type(urlInput, "ollama.example.com");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalledWith({
      baseUrl: "https://ollama.example.com/api",
      model: DEFAULT_SETTINGS.model,
    });
  });

  it("resets to the defaults", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<Settings settings={DEFAULT_SETTINGS} onSave={onSave} />);
    await user.click(screen.getByLabelText("Model settings"));
    await user.click(screen.getByRole("button", { name: "Reset to default" }));
    expect(onSave).toHaveBeenCalledWith(DEFAULT_SETTINGS);
  });
});
