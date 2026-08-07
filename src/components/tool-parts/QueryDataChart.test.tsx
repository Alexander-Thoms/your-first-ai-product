import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryDataChart } from "./QueryDataChart";
import type { QueryDataResult } from "@/ai/types";

const EMPTY: QueryDataResult = {
  filter: { industry: "manufacturing", minScore: 90 },
  rows: [],
  summary: { count: 0, avgScore: 0, totalBudget: 0 },
};

const POPULATED: QueryDataResult = {
  filter: { industry: "saas" },
  rows: [
    { name: "Priya Sharma", company: "Northwind Labs", industry: "saas", budget: 48000, score: 88, intent: "hot" },
    { name: "Sofia Rossi", company: "SaaSy Things", industry: "saas", budget: 51000, score: 79, intent: "warm" },
  ],
  summary: { count: 2, avgScore: 84, totalBudget: 99000 },
};

describe("QueryDataChart", () => {
  it("shows the designed empty state with a next action", () => {
    render(<QueryDataChart result={EMPTY} />);
    expect(screen.getByText("No leads match that filter")).toBeInTheDocument();
    expect(screen.getByText(/Try dropping the "manufacturing" industry filter/i)).toBeInTheDocument();
  });

  it("suggests a broader query when no filter was the cause", () => {
    render(<QueryDataChart result={{ ...EMPTY, filter: {} }} />);
    expect(screen.getByText(/Try a broader query/i)).toBeInTheDocument();
  });

  it("renders summary stats for a populated result", () => {
    render(<QueryDataChart result={POPULATED} />);
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("84")).toBeInTheDocument();
    expect(screen.getByText("$99,000")).toBeInTheDocument();
    expect(screen.getByText("Northwind Labs")).toBeInTheDocument();
    expect(screen.getByText("SaaSy Things")).toBeInTheDocument();
  });

  it("notes when only the top rows are shown", () => {
    const manyRows = Array.from({ length: 10 }, (_, index) => ({
      name: `Lead ${index}`,
      company: `Co ${index}`,
      industry: "saas",
      budget: 1000 + index,
      score: 50 + index,
      intent: "warm" as const,
    }));
    render(
      <QueryDataChart
        result={{ filter: {}, rows: manyRows, summary: { count: 10, avgScore: 55, totalBudget: 10000 } }}
      />,
    );
    expect(screen.getByText(/2 more, top 8 shown/)).toBeInTheDocument();
  });
});
