import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ToolFrame } from "./ToolFrame";
import type { ToolPartBase } from "@/ai/types";

function part(state: ToolPartBase["state"], extra: Partial<ToolPartBase> = {}): ToolPartBase {
  return { type: "tool-scoreLead", toolCallId: "t1", state, ...extra };
}

const renderOutput = (output: unknown) => <p>output: {JSON.stringify(output)}</p>;

describe("ToolFrame", () => {
  it("shows the reading-input state while streaming input", () => {
    render(<ToolFrame label="Score Lead" description="desc" icon={<span>i</span>} part={part("input-streaming")} renderOutput={renderOutput} />);
    expect(screen.getByText("Reading the request…")).toBeInTheDocument();
    expect(screen.getByText("reading input")).toBeInTheDocument();
  });

  it("shows the running state once input is available", () => {
    render(
      <ToolFrame
        label="Score Lead"
        description="desc"
        icon={<span>i</span>}
        part={part("input-available", { input: { name: "Dana", company: "Acme Corp" } })}
        renderOutput={renderOutput}
      />,
    );
    expect(screen.getByText("Executing with this input…")).toBeInTheDocument();
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
  });

  it("renders typed output once available", () => {
    render(
      <ToolFrame
        label="Score Lead"
        description="desc"
        icon={<span>i</span>}
        part={part("output-available", { output: { grade: "A" } })}
        renderOutput={renderOutput}
      />,
    );
    expect(screen.getByText('output: {"grade":"A"}')).toBeInTheDocument();
  });

  it("renders the designed error panel on output-error", () => {
    render(
      <ToolFrame
        label="Fetch Meta Tags"
        description="desc"
        icon={<span>i</span>}
        part={part("output-error", { errorText: "The tool returned malformed JSON." })}
        renderOutput={renderOutput}
      />,
    );
    expect(screen.getByText(/couldn.t run/)).toBeInTheDocument();
    expect(screen.getByText("The tool returned malformed JSON.")).toBeInTheDocument();
    expect(screen.getByText(/Try rewording your request/)).toBeInTheDocument();
  });

  it("falls back to generic copy when errorText is missing", () => {
    render(
      <ToolFrame
        label="Score Lead"
        description="desc"
        icon={<span>i</span>}
        part={part("output-error")}
        renderOutput={renderOutput}
      />,
    );
    expect(screen.getByText("The tool failed without a specific message.")).toBeInTheDocument();
  });
});
