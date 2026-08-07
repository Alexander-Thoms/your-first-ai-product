import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MetaTagsCard } from "./MetaTagsCard";
import type { MetaTagsResult } from "@/ai/types";

const COMPLETE: MetaTagsResult = {
  url: "https://example.com/page",
  title: "Example Page",
  description: "A demo page.",
  siteName: "Example",
  ogImage: "https://example.com/og.png",
  favicon: "https://example.com/favicon.ico",
};

const BARE: MetaTagsResult = {
  url: "https://example.com",
  title: null,
  description: null,
  siteName: null,
  ogImage: null,
  favicon: "https://example.com/favicon.ico",
};

describe("MetaTagsCard", () => {
  it("marks present fields as found", () => {
    render(<MetaTagsCard result={COMPLETE} />);
    expect(screen.getAllByText("found").length).toBe(4);
    expect(screen.getByText("Example Page")).toBeInTheDocument();
    expect(screen.getByText("A demo page.")).toBeInTheDocument();
  });

  it("renders fallbacks for missing fields", () => {
    render(<MetaTagsCard result={BARE} />);
    expect(screen.getByText("No page title found")).toBeInTheDocument();
    expect(screen.getByText("No description found for this page.")).toBeInTheDocument();
    expect(screen.getByText("No preview image found")).toBeInTheDocument();
    expect(screen.getAllByText("missing").length).toBeGreaterThan(0);
  });

  it("falls back to the raw url as host when it cannot be parsed", () => {
    render(<MetaTagsCard result={{ ...BARE, url: "not a url" }} />);
    expect(screen.getAllByText("not a url").length).toBeGreaterThan(0);
  });
});
