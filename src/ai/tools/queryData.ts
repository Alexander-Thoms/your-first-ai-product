import { tool } from "ai";
import { z } from "zod";
import { delay } from "../utils";
import { LEADS } from "../data/leads";
import type { QueryDataResult } from "../types";

const SORT_BY = ["score", "budget", "name"] as const;

export const queryDataSchema = z.object({
  industry: z
    .enum(["saas", "fintech", "healthcare", "ecommerce", "manufacturing"])
    .optional()
    .describe("Only include leads from this industry"),
  minScore: z
    .number()
    .int()
    .min(0)
    .max(100)
    .optional()
    .describe("Only include leads with a score at or above this value"),
  sortBy: z
    .enum(SORT_BY)
    .optional()
    .describe("Field to sort results by"),
});

export const queryDataTool = tool({
  description: [
    "Query the internal lead dataset (name, company, industry, budget, score, intent).",
    "Call this when the user asks to query, filter, analyze, compare, or chart leads in the dataset.",
  ].join(" "),
  inputSchema: queryDataSchema,
  execute: async ({ industry, minScore, sortBy }): Promise<QueryDataResult> => {
    await delay(1300);

    let rows = LEADS.slice();

    if (industry !== undefined) {
      rows = rows.filter((lead) => lead.industry === industry);
    }
    if (minScore !== undefined) {
      rows = rows.filter((lead) => lead.score >= minScore);
    }

    switch (sortBy) {
      case "score":
        rows.sort((a, b) => b.score - a.score);
        break;
      case "budget":
        rows.sort((a, b) => b.budget - a.budget);
        break;
      case "name":
        rows.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        rows.sort((a, b) => b.score - a.score);
    }

    const count = rows.length;
    const totalBudget = rows.reduce((sum, lead) => sum + lead.budget, 0);
    const avgScore = count === 0 ? 0 : Math.round(rows.reduce((sum, lead) => sum + lead.score, 0) / count);

    return {
      filter: { industry, minScore, sortBy },
      rows,
      summary: { count, avgScore, totalBudget },
    };
  },
});
