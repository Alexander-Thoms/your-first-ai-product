import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScoreLeadCard } from "./ScoreLeadCard";
import type { ScoreLeadResult } from "@/ai/types";

const RESULT: ScoreLeadResult = {
  name: "Dana",
  company: "Northwind Labs",
  score: 88,
  grade: "A",
  signals: ["Budget of $75,000 is above the $50k enterprise threshold"],
  recommendations: ["Route to Account Executive, not SDR"],
};

describe("ScoreLeadCard", () => {
  it("renders company, grade, signals and recommendations", () => {
    render(<ScoreLeadCard result={RESULT} />);
    expect(screen.getByText("Northwind Labs")).toBeInTheDocument();
    expect(screen.getByText("Dana")).toBeInTheDocument();
    expect(screen.getByText("Grade A")).toBeInTheDocument();
    expect(screen.getByText("Budget of $75,000 is above the $50k enterprise threshold")).toBeInTheDocument();
    expect(screen.getByText("Route to Account Executive, not SDR")).toBeInTheDocument();
    expect(screen.getByText("Signals")).toBeInTheDocument();
    expect(screen.getByText("Recommendations")).toBeInTheDocument();
  });

  it("renders the numeric score", () => {
    render(<ScoreLeadCard result={RESULT} />);
    expect(screen.getByText("88")).toBeInTheDocument();
  });
});
