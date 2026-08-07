import { describe, expect, it, vi } from "vitest";

vi.mock("../utils", () => ({ delay: vi.fn(() => Promise.resolve()) }));

import { scoreLeadTool } from "./scoreLead";
import type { ScoreLeadResult } from "../types";

const execute = (scoreLeadTool as unknown as {
  execute: (args: Record<string, unknown>) => Promise<ScoreLeadResult>;
}).execute;

describe("scoreLeadTool", () => {
  it("scores a bare lead with the D floor", async () => {
    const result = await execute({ name: "Dana", company: "Acme Corp" });
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.grade).toBeDefined();
    expect(result.signals.some((s) => s.includes("Budget unknown"))).toBe(true);
  });

  it("rewards budgets above the enterprise threshold", async () => {
    const result = await execute({ name: "Dana", company: "Northwind Labs", budget: 75000 });
    expect(result.signals.some((s) => s.includes("enterprise threshold"))).toBe(true);
    expect(result.recommendations.some((r) => r.includes("Account Executive"))).toBe(true);
  });

  it("recognises the mid-market band", async () => {
    const result = await execute({ name: "Dana", company: "Northwind Labs", budget: 30000 });
    expect(result.signals.some((s) => s.includes("mid-market"))).toBe(true);
  });

  it("flags budgets below the $20k floor", async () => {
    const result = await execute({ name: "Dana", company: "Northwind Labs", budget: 10000 });
    expect(result.signals.some((s) => s.includes("below the $20k floor"))).toBe(true);
    expect(result.recommendations.some((r) => r.includes("self-serve"))).toBe(true);
  });

  it("penalises acme/test placeholder names", async () => {
    const withBudget = await execute({ name: "Dana", company: "Acme Corp", budget: 100000 });
    const withoutPenalty = await execute({ name: "Dana", company: "Northwind Labs", budget: 100000 });
    expect(withBudget.score).toBeLessThan(withoutPenalty.score);
    expect(withBudget.signals.some((s) => s.includes("test/placeholder"))).toBe(true);
  });

  it("clamps the final score to 0..100", async () => {
    const result = await execute({ name: "Dana", company: "RealCo", budget: 1_000_000, industry: "saas" });
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("never returns a negative score", async () => {
    const result = await execute({ name: "test", company: "Acme Corp" });
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it("adds priority-vertical signals for fintech and saas", async () => {
    const result = await execute({ name: "Dana", company: "RealCo", industry: "fintech" });
    expect(result.signals.some((s) => s.includes("priority vertical"))).toBe(true);
  });
});
