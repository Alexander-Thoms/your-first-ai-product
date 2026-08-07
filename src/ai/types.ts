export type LeadGrade = "A" | "B" | "C" | "D";

export interface ScoreLeadResult {
  name: string;
  company: string;
  score: number;
  grade: LeadGrade;
  signals: string[];
  recommendations: string[];
}

export interface MetaTagsResult {
  url: string;
  title?: string | null;
  description?: string | null;
  siteName?: string | null;
  ogImage?: string | null;
  favicon?: string | null;
}

export interface QueryDataResult {
  filter: {
    industry?: string;
    minScore?: number;
    sortBy?: "score" | "budget" | "name";
  };
  rows: Array<{
    name: string;
    company: string;
    industry: string;
    budget: number;
    score: number;
    intent: string;
  }>;
  summary: {
    count: number;
    avgScore: number;
    totalBudget: number;
  };
}

export type ToolPartState =
  | "input-streaming"
  | "input-available"
  | "output-available"
  | "output-error";

export interface ToolPartBase {
  type: string;
  toolCallId: string;
  state: ToolPartState;
  input?: Record<string, unknown>;
  output?: unknown;
  errorText?: string;
}
