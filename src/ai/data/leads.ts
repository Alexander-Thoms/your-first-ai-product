export interface LeadRecord {
  name: string;
  company: string;
  industry: string;
  budget: number;
  score: number;
  intent: "hot" | "warm" | "cold";
}

export const LEADS: LeadRecord[] = [
  { name: "Priya Sharma", company: "Northwind Labs", industry: "saas", budget: 48000, score: 88, intent: "hot" },
  { name: "Marcus Webb", company: "Bluefin Pay", industry: "fintech", budget: 64000, score: 91, intent: "hot" },
  { name: "Elena Petrova", company: "Carepoint Health", industry: "healthcare", budget: 39000, score: 76, intent: "warm" },
  { name: "Jordan Kim", company: "LoopCart", industry: "ecommerce", budget: 21000, score: 61, intent: "warm" },
  { name: "Ana Souza", company: "Vertex Robotics", industry: "manufacturing", budget: 72000, score: 84, intent: "hot" },
  { name: "Tariq Haddad", company: "FinSight", industry: "fintech", budget: 15000, score: 45, intent: "cold" },
  { name: "Grace Lin", company: "MedTrack", industry: "healthcare", budget: 29000, score: 58, intent: "warm" },
  { name: "Omar Farouk", company: "Craftware", industry: "manufacturing", budget: 18000, score: 42, intent: "cold" },
  { name: "Sofia Rossi", company: "SaaSy Things", industry: "saas", budget: 51000, score: 79, intent: "warm" },
  { name: "Noah Berg", company: "MintCheck", industry: "fintech", budget: 86000, score: 93, intent: "hot" },
  { name: "Amara Okafor", company: "ShopSprout", industry: "ecommerce", budget: 26000, score: 55, intent: "warm" },
  { name: "Lucas Moreau", company: "IronFold", industry: "manufacturing", budget: 12000, score: 33, intent: "cold" },
];
