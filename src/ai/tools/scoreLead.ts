import { tool } from "ai";
import { z } from "zod";
import { delay } from "../utils";
import type { LeadGrade, ScoreLeadResult } from "../types";

const INDUSTRIES = ["saas", "fintech", "healthcare", "ecommerce", "manufacturing"] as const;

export const scoreLeadSchema = z.object({
  name: z.string().min(1).describe("Contact or company name for the lead"),
  company: z
    .string()
    .min(1)
    .describe("Company the lead belongs to"),
  budget: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Estimated annual budget in USD, if known"),
  industry: z
    .enum(INDUSTRIES)
    .optional()
    .describe("Industry segment, if known"),
});

export const scoreLeadTool = tool({
  description: [
    "Score a sales lead against a BANT-style qualification model.",
    "Call this when the user asks to score, qualify, rank, or evaluate a lead or prospect.",
    "Extract name, company, budget (USD) and industry when mentioned; ask only if truly missing.",
  ].join(" "),
  inputSchema: scoreLeadSchema,
  execute: async ({ name, company, budget, industry }): Promise<ScoreLeadResult> => {
    await delay(1400);

    const signals: string[] = [];
    const recommendations: string[] = [];

    let score = 40;
    let grade: LeadGrade = "D";

    if (budget !== undefined) {
      if (budget >= 50000) {
        score += 25;
        signals.push(`Budget of $${budget.toLocaleString()} is above the $50k enterprise threshold`);
        recommendations.push("Route to Account Executive, not SDR");
      } else if (budget >= 20000) {
        score += 15;
        signals.push(`Budget of $${budget.toLocaleString()} suggests mid-market fit`);
        recommendations.push("Qualify with a discovery call before quoting");
      } else {
        signals.push(`Budget of $${budget.toLocaleString()} is below the $20k floor`);
        recommendations.push("Offer the self-serve tier instead");
      }
    } else {
      signals.push("Budget unknown — gate on a budget conversation before SDR handoff");
      recommendations.push("Ask for budget on the first call");
    }

    if (industry !== undefined) {
      score += 10;
      signals.push(`Fits the ${industry} vertical focus`);
      if (industry === "fintech" || industry === "saas") {
        score += 5;
        signals.push(`${industry} is a priority vertical this quarter`);
      }
    } else {
      signals.push("Industry unknown — map to ICP before prioritizing");
      recommendations.push("Confirm ICP fit in the first call");
    }

    if (company.toLowerCase().includes("acme") || name.toLowerCase().includes("test")) {
      score -= 15;
      signals.push("Name matches test/placeholder patterns");
      recommendations.push("Verify the lead is real before investing time");
    }

    if (score >= 85) {
      grade = "A";
    } else if (score >= 70) {
      grade = "B";
    } else if (score >= 50) {
      grade = "C";
    } else {
      grade = "D";
    }

    return { name, company, score: Math.min(100, Math.max(0, score)), grade, signals, recommendations };
  },
});
