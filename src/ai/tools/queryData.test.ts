import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../utils", () => ({ delay: vi.fn(() => Promise.resolve()) }));

import { queryDataTool } from "./queryData";
import type { QueryDataResult } from "../types";

const execute = (queryDataTool as unknown as {
  execute: (args: Record<string, unknown>) => Promise<QueryDataResult>;
}).execute;

describe("queryDataTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns every lead when no filter is applied", async () => {
    const result = await execute({});
    expect(result.rows.length).toBe(12);
    expect(result.summary.count).toBe(12);
    expect(result.summary.avgScore).toBeGreaterThan(0);
    expect(result.summary.totalBudget).toBeGreaterThan(0);
  });

  it("filters by industry", async () => {
    const result = await execute({ industry: "fintech" });
    expect(result.rows.length).toBe(3);
    expect(result.rows.every((row) => row.industry === "fintech")).toBe(true);
  });

  it("returns an empty result for an impossible filter without crashing", async () => {
    const result = await execute({ industry: "manufacturing", minScore: 90 });
    expect(result.rows.length).toBe(0);
    expect(result.summary.count).toBe(0);
    expect(result.summary.avgScore).toBe(0);
    expect(result.summary.totalBudget).toBe(0);
  });

  it("applies the minScore floor", async () => {
    const result = await execute({ minScore: 80 });
    expect(result.rows.every((row) => row.score >= 80)).toBe(true);
  });

  it("sorts by score descending by default", async () => {
    const result = await execute({});
    const scores = result.rows.map((row) => row.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it("sorts by name alphabetically when requested", async () => {
    const result = await execute({ sortBy: "name" });
    const names = result.rows.map((row) => row.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it("sorts by budget descending when requested", async () => {
    const result = await execute({ sortBy: "budget" });
    const budgets = result.rows.map((row) => row.budget);
    expect(budgets).toEqual([...budgets].sort((a, b) => b - a));
  });
});
