export const SUGGESTIONS: Array<{ label: string; prompt: string; tag: string }> = [
  {
    label: "Score a lead",
    prompt: "Score this lead: Acme Corp, SaaS, budget $50k, contact Dana.",
    tag: "scoreLead",
  },
  {
    label: "Preview a URL",
    prompt: "Fetch the meta tags for https://example.com",
    tag: "fetchMetaTags",
  },
  {
    label: "Query the dataset",
    prompt: "Query the lead dataset for SaaS leads scoring 70 or higher.",
    tag: "queryData",
  },
  {
    label: "Trigger a failure",
    prompt: "Score a lead but you forgot all the details.",
    tag: "error",
  },
];
